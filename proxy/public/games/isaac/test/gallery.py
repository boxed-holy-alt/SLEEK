#!/usr/bin/env python3
"""
Stages one screenshot per chapter and one per boss so the art of the twelve
floors can actually be looked at rather than assumed correct.
"""
import os
import sys

from playwright.sync_api import sync_playwright

URL = "http://localhost:5006/?mute"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(ROOT, "screenshots")
os.makedirs(SHOTS, exist_ok=True)

errors = []


def main():
    with sync_playwright() as pw:
        b = pw.chromium.launch(headless=True)
        ctx = b.new_context(viewport={"width": 900, "height": 540}, device_scale_factor=2)
        page = ctx.new_page()
        page.on("console", lambda m: errors.append(f"{m.type}: {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        page.goto(URL)
        page.wait_for_timeout(800)
        page.evaluate("() => window.__game.start(20260730)")
        page.wait_for_timeout(400)

        chapters = page.evaluate("() => window.__game.chapters")

        # ---- one populated combat room per chapter ----
        for lvl, ch in enumerate(chapters, start=1):
            page.evaluate(f"() => {{ window.__game.raw.bossesSeen = []; window.__game.raw.loadFloor({lvl}); }}")
            page.wait_for_timeout(200)
            page.evaluate("() => { window.__game.warpTo('normal'); window.__game.god(true); }")
            page.wait_for_timeout(900)
            page.evaluate("() => window.__game.clearBanner()")
            page.wait_for_timeout(60)
            name = f"L{lvl:02d}-{ch['theme']}.png"
            page.screenshot(path=os.path.join(SHOTS, name))
            print(name)

        # ---- one shot per boss, after it has had time to start an attack ----
        boss_types = []
        for c in chapters:
            for bt in c["bosses"]:
                if bt not in boss_types:
                    boss_types.append(bt)

        for bt in boss_types:
            page.evaluate("() => window.__game.start(1337)")
            page.wait_for_timeout(200)
            # put the boss on the floor it naturally belongs to, for the theme
            lvl = next(i for i, c in enumerate(chapters, start=1) if bt in c["bosses"])
            page.evaluate(f"() => {{ window.__game.raw.bossesSeen = []; window.__game.raw.loadFloor({lvl}); }}")
            page.wait_for_timeout(200)
            page.evaluate(f"() => window.__game.warpToBoss('{bt}')")
            page.evaluate("() => window.__game.god(true)")
            page.wait_for_timeout(2200)
            page.evaluate("() => window.__game.clearBanner()")
            page.wait_for_timeout(60)
            name = f"BOSS-{bt}.png"
            page.screenshot(path=os.path.join(SHOTS, name))
            print(name)

        # ---- shop ----
        page.evaluate("() => window.__game.start(20260730)")
        page.wait_for_timeout(200)
        found = False
        for lvl in range(4, 13):
            page.evaluate(f"() => {{ window.__game.raw.bossesSeen = []; window.__game.raw.loadFloor({lvl}); }}")
            page.wait_for_timeout(150)
            if page.evaluate("() => window.__game.warpTo('shop')"):
                found = True
                break
        if found:
            page.evaluate("() => { window.__game.setCoins(14); window.__game.clearBanner(); }")
            page.wait_for_timeout(500)
            page.screenshot(path=os.path.join(SHOTS, "X-shop.png"))
            print("X-shop.png")

        # ---- new-item showcase on the player ----
        page.evaluate("""() => {
          const g = window.__game;
          g.warpTo('normal');
          ['brotherBobby','sisterMaggy','holyMantle','theMark','transcendence','cubeOfMeat','godhead'].forEach(i => g.giveItem(i));
          g.god(true);
        }""")
        page.wait_for_timeout(900)
        page.evaluate("() => window.__game.press('right')")
        page.wait_for_timeout(500)
        page.evaluate("() => window.__game.clearBanner()")
        page.screenshot(path=os.path.join(SHOTS, "Y-familiars.png"))
        page.evaluate("() => window.__game.release('right')")
        print("Y-familiars.png")

        b.close()

    if errors:
        print("CONSOLE ERRORS:", errors[:5])
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
