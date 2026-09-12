#!/usr/bin/env python3
"""
Measures how much damage the bot actually puts out on each floor, so boss
health can be set from data instead of from arithmetic that assumes perfect
uptime. Prints the DPS curve and the boss health each floor would need for a
fight of TARGET seconds.
"""
import os
import sys
import time

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOT = open(os.path.join(ROOT, "test", "bot.js")).read()
SAMPLE = float(os.environ.get("SAMPLE", "20"))     # game seconds per floor
TARGET = float(os.environ.get("TARGET", "26"))     # desired boss fight length

sys.path.insert(0, os.path.join(ROOT, "test"))
from bossfight import loadout  # noqa: E402


def main():
    rows = []
    with sync_playwright() as pw:
        b = pw.chromium.launch(headless=True)
        page = b.new_context(viewport={"width": 900, "height": 540}).new_page()
        page.goto("http://localhost:5006/?mute")
        page.wait_for_timeout(700)
        page.add_script_tag(content=BOT)

        for floor in range(1, 13):
            page.evaluate(f"() => window.__game.start({5000 + floor})")
            page.wait_for_timeout(200)
            if floor > 1:
                page.evaluate(f"() => {{ window.__game.raw.bossesSeen = []; window.__game.raw.loadFloor({floor}); }}")
                page.wait_for_timeout(200)
            for it in loadout(floor):
                page.evaluate(f"() => window.__game.giveItem('{it}')")
            page.evaluate("() => window.__game.warpTo('boss')")
            page.wait_for_timeout(250)
            # A punching bag: real boss, but immortal and passive, so we are
            # measuring the bot's output rather than the fight's difficulty.
            hp0 = page.evaluate("""() => {
              const g = window.__game;
              g.god(true);
              g.clearBanner();
              const e = g.raw.boss;
              e.maxHp = e.hp = 1e9;
              e.spawnT = 0;
              return e.hp;
            }""")
            t0 = page.evaluate("() => window.__game.elapsed")
            page.evaluate("() => window.__bot.start(30)")
            wall0 = time.time()
            while True:
                page.wait_for_timeout(300)
                s = page.evaluate("() => ({t: window.__game.elapsed, hp: window.__game.raw.boss ? window.__game.raw.boss.hp : 0})")
                if s["t"] - t0 >= SAMPLE or time.time() - wall0 > SAMPLE * 4:
                    break
            page.evaluate("() => window.__bot.stop()")
            s = page.evaluate("() => ({t: window.__game.elapsed, hp: window.__game.raw.boss ? window.__game.raw.boss.hp : 0})")
            dt = max(0.1, s["t"] - t0)
            dps = (hp0 - s["hp"]) / dt
            rows.append((floor, len(loadout(floor)), dps, dps * TARGET))
            print(f"  L{floor:<2} items={len(loadout(floor)):<2}  DPS={dps:7.1f}  "
                  f"=> {TARGET:.0f}s 的 Boss 血量 ≈ {dps * TARGET:6.0f}")
        b.close()

    print("\n  相对 L1 的倍率:")
    base = rows[0][2]
    for floor, n, dps, hp in rows:
        print(f"    L{floor:<2}  x{dps / base:6.2f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
