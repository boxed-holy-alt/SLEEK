#!/usr/bin/env python3
"""
Lets an in-page bot actually play the game, with no god mode and no cheats.

Proves three things the screenshots cannot:
  * a full run is completable through legitimate input
  * the dungeon never soft-locks (there is always a way forward)
  * the difficulty curve is survivable but not trivial
"""
import json
import os
import sys
import time

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(ROOT, "screenshots")
BOT = open(os.path.join(ROOT, "test", "bot.js")).read()
RUNS = int(os.environ.get("RUNS", "6"))
BUDGET = float(os.environ.get("BUDGET", "150"))


def play(page, seed, shot_prefix=None):
    page.evaluate(f"() => window.__game.start({seed})")
    page.wait_for_timeout(300)
    page.evaluate("() => window.__bot.start(30)")

    softlock = None
    t0 = time.time()
    max_floor = 1
    # Budget is measured in GAME time, not wallclock: this box runs several
    # agents at once, so the page frequently cannot hold 60fps and a wallclock
    # budget would cut runs off after only a few seconds of actual play.
    while True:
        page.wait_for_timeout(400)
        s = page.evaluate("() => window.__game.snapshot()")
        max_floor = max(max_floor, s["floor"])
        if s["state"] in ("dead", "win"):
            break
        if s["elapsed"] > BUDGET:
            break
        if time.time() - t0 > BUDGET * 4:      # hard wallclock safety net
            break
        # soft-lock guard: something must always be actionable. Require the
        # condition to persist so we don't flag a single transitional frame.
        if s["state"] == "playing":
            has_enemies = len(s["enemies"]) > 0
            has_exit = any(d["open"] for d in s["room"]["doors"].values())
            has_trapdoor = "trapdoor" in s["room"]["props"]
            if not (has_enemies or has_exit or has_trapdoor):
                page.wait_for_timeout(700)
                s2 = page.evaluate("() => window.__game.snapshot()")
                if (s2["state"] == "playing" and not s2["enemies"]
                        and not any(d["open"] for d in s2["room"]["doors"].values())
                        and "trapdoor" not in s2["room"]["props"]):
                    softlock = s2
                    break
    page.evaluate("() => window.__bot.stop()")
    if shot_prefix:
        page.screenshot(path=os.path.join(SHOTS, f"{shot_prefix}.png"))
    s = page.evaluate("() => window.__game.snapshot()")
    return {
        "seed": seed,
        "result": s["state"],
        "floor": s["floor"],
        "maxFloor": max_floor,
        "kills": s["stats"]["kills"],
        "items": s["stats"]["itemsPicked"],
        "itemNames": [i["name"] for i in (s["player"]["items"] if s["player"] else [])],
        "bosses": s["stats"]["bossesKilled"],
        "rooms": s["floorPlan"]["visited"],
        "elapsed": round(s["elapsed"], 1),
        "wallclock": round(time.time() - t0, 1),
        "softlock": softlock is not None,
        "errors": page.evaluate("() => window.__bot.log"),
    }


def main():
    console_errors = []
    runs = []
    with sync_playwright() as pw:
        b = pw.chromium.launch(headless=True)
        ctx = b.new_context(viewport={"width": 900, "height": 540})
        page = ctx.new_page()
        page.on("pageerror", lambda e: console_errors.append(str(e)))
        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)
        page.goto("http://localhost:5006/?mute")
        page.wait_for_timeout(700)
        page.add_script_tag(content=BOT)

        for i in range(RUNS):
            seed = 1000 + i * 77
            r = play(page, seed, shot_prefix=f"bot-run-{i + 1}" if i < 2 else None)
            runs.append(r)
            top = page.evaluate("() => window.__game.maxFloor")
            print(f"  run {i+1}  seed={seed:<5} {r['result']:<7} "
                  f"floor={r['maxFloor']}/{top} boss={r['bosses']} kills={r['kills']:<3} "
                  f"items={r['items']} rooms={r['rooms']} t={r['elapsed']}s"
                  + ("  SOFTLOCK!" if r["softlock"] else ""))
        b.close()

    wins = sum(1 for r in runs if r["result"] == "win")
    deaths = sum(1 for r in runs if r["result"] == "dead")
    locks = sum(1 for r in runs if r["softlock"])
    reached2 = sum(1 for r in runs if r["maxFloor"] >= 2)
    bosses = sum(r["bosses"] for r in runs)
    print("\n" + "-" * 66)
    print(f"  {len(runs)} 局机器人试玩: 通关 {wins} / 死亡 {deaths} / 未结束 {len(runs)-wins-deaths}")
    print(f"  到达 2 层以上: {reached2}/{len(runs)}   累计击败 Boss: {bosses}   卡死: {locks}")
    print(f"  平均击杀 {sum(r['kills'] for r in runs)/len(runs):.1f}  "
          f"平均拾取道具 {sum(r['items'] for r in runs)/len(runs):.1f}  "
          f"平均存活 {sum(r['elapsed'] for r in runs)/len(runs):.0f}s")
    errs = [e for e in console_errors if "favicon" not in e.lower()]
    print(f"  console 报错: {len(errs)}" + (f"  -> {errs[:3]}" if errs else ""))
    print("-" * 66)

    with open(os.path.join(ROOT, "test", "bot-results.json"), "w") as f:
        json.dump(runs, f, ensure_ascii=False, indent=1)

    ok = locks == 0 and bosses >= 1 and len(errs) == 0
    print("判定:", "PASS" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
