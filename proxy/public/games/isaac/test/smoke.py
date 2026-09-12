#!/usr/bin/env python3
"""
Fast structural smoke test.

Walks every floor, forces every boss to spawn and run its state machine, and
fails on the first console error. This is the test that catches "I renamed a
function and forgot one call site" in seconds instead of during a play-test.
"""
import os
import sys

from playwright.sync_api import sync_playwright

URL = "http://localhost:5006/?mute"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

errors = []
results = []


def check(name, ok, detail=""):
    results.append((name, bool(ok), detail))
    print(f"  [{'PASS' if ok else 'FAIL'}] {name}" + (f"  -- {detail}" if detail else ""))
    return ok


def main():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        page = browser.new_context(viewport={"width": 1000, "height": 640}).new_page()
        page.on("console", lambda m: errors.append(f"{m.type}: {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        page.goto(URL)
        page.wait_for_timeout(800)

        chapters = page.evaluate("() => window.__game.chapters")
        max_floor = page.evaluate("() => window.__game.maxFloor")
        item_ids = page.evaluate("() => window.__game.itemIds")
        enemy_types = page.evaluate("() => window.__game.enemyTypes_all")

        check("章节数 >= 10", max_floor >= 10, f"{max_floor} 层")
        check("章节表与 MAX_FLOOR 一致", len(chapters) == max_floor, str(len(chapters)))
        check("道具数量 >= 40", len(item_ids) >= 40, f"{len(item_ids)} 件")
        check("道具 id 无重复", len(set(item_ids)) == len(item_ids))
        boss_types = sorted({b for c in chapters for b in c["bosses"]})
        check("Boss 种类 >= 10", len(boss_types) >= 10, ", ".join(boss_types))
        check("敌人类型 >= 15", len(enemy_types) >= 15, f"{len(enemy_types)} 种")

        page.evaluate("() => window.__game.start(20260730)")
        page.wait_for_timeout(300)

        # --- every floor generates, bakes art and renders ---
        bad_floors = []
        for lvl in range(1, max_floor + 1):
            page.evaluate(f"() => {{ window.__game.raw.bossesSeen = []; window.__game.raw.loadFloor({lvl}); }}")
            page.wait_for_timeout(120)
            snap = page.evaluate("() => window.__game.snapshot()")
            types = snap["floorPlan"]["types"]
            rooms = snap["floorPlan"]["rooms"]
            ok = (types.get("boss") == 1 and types.get("treasure") == 1
                  and 5 <= rooms <= 13 and types.get("shop", 0) <= 1)
            if not ok:
                bad_floors.append((lvl, rooms, types))
        check("12 层楼层平面全部合法", not bad_floors, str(bad_floors[:3]))

        # --- every boss spawns, ticks its AI, and can be killed ---
        broken = []
        for boss in boss_types:
            page.evaluate("() => window.__game.start(4242)")
            page.wait_for_timeout(120)
            got = page.evaluate(f"() => window.__game.warpToBoss('{boss}')")
            page.evaluate("() => window.__game.god(true)")
            page.wait_for_timeout(2600)     # let the state machine cycle
            snap = page.evaluate("() => window.__game.snapshot()")
            if not snap["boss"] or snap["boss"]["type"] != boss:
                broken.append((boss, "没有生成"))
                continue
            page.evaluate("() => { for (let i=0;i<400;i++) window.__game.hurtEnemies(30); }")
            page.wait_for_timeout(400)
            after = page.evaluate("() => window.__game.snapshot()")
            if after["boss"] is not None:
                broken.append((boss, f"打不死, 剩 {after['boss']['hp']}"))
        check("每个 Boss 都能生成/运转/被击杀", not broken, str(broken))

        # --- every enemy type spawns and ticks ---
        page.evaluate("() => window.__game.start(777)")
        page.wait_for_timeout(150)
        page.evaluate("() => window.__game.god(true)")
        page.evaluate("""() => {
            window.__game.clearEnemies();
            const t = window.__game.enemyTypes_all.filter(k => !['monstro','duke','larry','chub','gurdy','monstroII','mom','scolex','momsHeart','hush','satan','isaacBoss','blueBaby'].includes(k));
            t.forEach((k, i) => window.__game.spawn(k, 150 + (i % 5) * 130, 150 + Math.floor(i / 5) * 120));
        }""")
        page.wait_for_timeout(2500)
        alive = page.evaluate("() => window.__game.enemyCount")
        check("所有普通敌人可同时存活运转", alive >= 6, f"{alive} 个在场")

        # --- every item applies without throwing ---
        page.evaluate("() => window.__game.start(999)")
        page.wait_for_timeout(150)
        for iid in item_ids:
            page.evaluate(f"() => window.__game.giveItem('{iid}')")
        page.wait_for_timeout(600)
        stats = page.evaluate("() => window.__game.stats")
        check(f"{len(item_ids)} 件道具可全部叠加生效", stats is not None and stats["damage"] > 0,
              f"damage={stats['damage']:.1f} fireRate={stats['fireRate']:.2f}")

        page.screenshot(path=os.path.join(ROOT, "screenshots", "smoke-allitems.png"))
        check("无 console 报错", not errors, "; ".join(errors[:3]))
        browser.close()

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
