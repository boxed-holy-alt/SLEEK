#!/usr/bin/env python3
"""
Focused check: is the boss fight actually winnable by legitimate play?

Drops the bot into a boss room with the item loadout a player would plausibly
have by then, and lets it fight with no god mode. Budgets in GAME time, so a
loaded machine slows the test down instead of failing it.
"""
import os
import sys
import time

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(ROOT, "screenshots")
BOT = open(os.path.join(ROOT, "test", "bot.js")).read()
GAME_BUDGET = float(os.environ.get("GB", "70"))


def fight(page, seed, floor, items, boss=None, shot=None):
    page.evaluate(f"() => window.__game.start({seed})")
    page.wait_for_timeout(250)
    if floor > 1:
        page.evaluate(f"() => {{ window.__game.raw.bossesSeen = []; window.__game.raw.loadFloor({floor}); }}")
        page.wait_for_timeout(250)
    for it in items:
        page.evaluate(f"() => window.__game.giveItem('{it}')")
    if boss:
        page.evaluate(f"() => window.__game.warpToBoss('{boss}')")
    else:
        page.evaluate("() => window.__game.warpTo('boss')")
    page.wait_for_timeout(300)
    page.evaluate("() => window.__game.clearBanner()")

    start = page.evaluate("() => window.__game.snapshot()")
    boss_hp0 = start["boss"]["hp"] if start["boss"] else 0
    boss_type = start["boss"]["type"] if start["boss"] else "?"
    t_game0 = start["elapsed"]

    page.evaluate("() => window.__bot.start(30)")
    t0 = time.time()
    while True:
        page.wait_for_timeout(350)
        s = page.evaluate("() => window.__game.snapshot()")
        if s["state"] != "playing":
            break
        if s["boss"] is None and not s["enemies"]:
            break
        if s["elapsed"] - t_game0 > GAME_BUDGET:
            break
        if time.time() - t0 > GAME_BUDGET * 5:
            break
    page.evaluate("() => window.__bot.stop()")
    if shot:
        page.evaluate("() => window.__game.clearBanner()")
        page.screenshot(path=os.path.join(SHOTS, shot))
    s = page.evaluate("() => window.__game.snapshot()")
    killed = s["stats"]["bossesKilled"] >= 1
    remain = s["boss"]["hp"] if s["boss"] else 0
    return {
        "seed": seed, "floor": floor, "boss": boss_type, "items": len(items),
        "killed": killed, "died": s["state"] == "dead",
        "bossHp0": boss_hp0, "bossHpLeft": remain,
        "dpsFrac": round(1 - remain / max(1, boss_hp0), 2),
        "playerHp": s["player"]["hp"] if s["player"] else 0,
        "gameTime": round(s["elapsed"] - t_game0, 1),
        "wall": round(time.time() - t0, 1),
    }


# Each floor hands out a treasure-room item and a boss item, so a player
# arrives at floor N with roughly 2N collectibles. The pool below is drawn in
# order to build that loadout, mixing damage, fire rate and utility the way a
# real run does rather than stacking one stat.
ITEM_POOL = [
    "sadOnion", "cricket", "martyr", "wireCoat", "maxHead", "steven",
    "nineVolt", "bloodClot", "innerEye", "theMark", "pageOfDeath", "rosary",
    "ceremonialRobes", "luckyFoot", "theBelt", "breakfast", "speedBall",
    "brotherBobby", "taurus", "oddMushroom", "ironBar", "halo",
    "sisterMaggy", "numberOne", "spoonBender", "cubeOfMeat",
]


def loadout(floor):
    """2 collectibles per completed floor, capped at the pool size."""
    return ITEM_POOL[:min(len(ITEM_POOL), max(1, (floor - 1) * 2 + 1))]

# One case per boss, fought on the floor it belongs to.
CASES = [
    (3001, 1, "monstro"),
    (3002, 1, "duke"),
    (3003, 2, "larry"),
    (3004, 3, "chub"),
    (3005, 4, "gurdy"),
    (3006, 5, "monstroII"),
    (3007, 6, "mom"),
    (3008, 7, "scolex"),
    (3009, 8, "momsHeart"),
    (3010, 9, "hush"),
    (3011, 10, "satan"),
    (3012, 11, "isaacBoss"),
    (3013, 12, "blueBaby"),
]


def main():
    errs = []
    rows = []
    with sync_playwright() as pw:
        b = pw.chromium.launch(headless=True)
        ctx = b.new_context(viewport={"width": 900, "height": 540})
        page = ctx.new_page()
        page.on("pageerror", lambda e: errs.append(str(e)))
        page.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        page.goto("http://localhost:5006/?mute")
        page.wait_for_timeout(700)
        page.add_script_tag(content=BOT)

        for seed, floor, boss in CASES:
            items = loadout(floor)
            r = fight(page, seed, floor, items, boss=boss,
                      shot=f"fight-L{floor:02d}-{boss}.png")
            rows.append(r)
            verdict = "KILL" if r["killed"] else ("DEAD" if r["died"] else "TIMEOUT")
            print(f"  L{floor:<2} {r['boss']:<10} items={r['items']:<2} -> {verdict:<7} "
                  f"boss {r['bossHp0']}->{r['bossHpLeft']} ({int(r['dpsFrac']*100)}% dmg)  "
                  f"playerHp={r['playerHp']}  gameT={r['gameTime']}s wall={r['wall']}s")

        # Control group: the same final boss with nothing but the starting kit.
        naked = fight(page, 3099, 12, [], boss="blueBaby")
        print(f"  [对照] L12 blueBaby 0 道具 -> "
              f"{'KILL' if naked['killed'] else ('DEAD' if naked['died'] else 'TIMEOUT')}"
              f"  ({int(naked['dpsFrac']*100)}% dmg)")
        b.close()

    kills = sum(1 for r in rows if r["killed"])
    avg = sum(r["dpsFrac"] for r in rows) / len(rows) * 100
    print(f"\n  Boss 击杀 {kills}/{len(rows)}；平均打掉 Boss 血量 {avg:.0f}%")
    weak = [r for r in rows if r["dpsFrac"] < 0.5]
    if weak:
        print("  打不动的 Boss:", [(r["boss"], f"{int(r['dpsFrac']*100)}%") for r in weak])
    real = [e for e in errs if "favicon" not in e.lower()]
    print(f"  console 报错: {len(real)}" + (f" -> {real[:3]}" if real else ""))
    # The bot plays far worse than a human, so the bar is "kills most of them
    # and gets every single one well past half health".
    ok = kills >= len(rows) * 0.6 and not weak and not real
    print("判定:", "PASS" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
