#!/usr/bin/env python3
"""Stages specific scenes so the art can be reviewed from screenshots."""
import os
from playwright.sync_api import sync_playwright

URL = "http://localhost:5006/?mute"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(ROOT, "screenshots")
os.makedirs(SHOTS, exist_ok=True)


def main():
    with sync_playwright() as pw:
        b = pw.chromium.launch(headless=True)
        # 1:1 canvas pixels so I judge the real rendering, not a rescale
        ctx = b.new_context(viewport={"width": 900, "height": 540}, device_scale_factor=2)
        page = ctx.new_page()
        page.goto(URL)
        page.wait_for_timeout(800)
        page.evaluate("() => window.__game.start(20260725)")
        page.wait_for_timeout(600)

        # ---- all five regular enemies lined up next to the player ----
        page.evaluate("() => window.__game.warpTo('normal')")
        page.wait_for_timeout(300)
        page.evaluate("""() => {
          const g = window.__game;
          g.clearEnemies();
          g.raw.room.props.length = 0;
          const kinds = ['gaper','pooter','horf','fly','clotty'];
          kinds.forEach((k,i) => g.spawn(k, 150 + i*150, 190));
          g.teleport(450, 380);
          g.god(true);
        }""")
        page.wait_for_timeout(900)
        page.evaluate("() => window.__game.clearBanner()") or page.screenshot(path=os.path.join(SHOTS, "A-enemy-lineup.png"))
        print("A-enemy-lineup.png")

        # ---- combat in progress: tears, blood, hit flashes ----
        page.evaluate("() => { window.__game.press('up'); }")
        page.wait_for_timeout(1000)
        page.evaluate("() => { window.__game.hurtEnemies(2); }")
        page.wait_for_timeout(90)
        page.evaluate("() => window.__game.clearBanner()") or page.screenshot(path=os.path.join(SHOTS, "B-combat-feedback.png"))
        page.evaluate("() => window.__game.release('up')")
        print("B-combat-feedback.png")

        # ---- Monstro, mouth open mid-vomit ----
        page.evaluate("() => window.__game.warpTo('boss')")
        page.wait_for_timeout(500)
        page.evaluate("() => { window.__game.god(true); window.__game.bossState('vomit'); }")
        page.wait_for_timeout(700)
        page.evaluate("() => window.__game.clearBanner()") or page.screenshot(path=os.path.join(SHOTS, "C-monstro-vomit.png"))
        print("C-monstro-vomit.png")

        page.evaluate("() => window.__game.bossState('slamDown')")
        page.wait_for_timeout(200)
        page.evaluate("() => window.__game.clearBanner()") or page.screenshot(path=os.path.join(SHOTS, "D-monstro-slam.png"))
        print("D-monstro-slam.png")

        # ---- Duke of Flies on the caves floor ----
        page.evaluate("() => { const g=window.__game.raw; g.nextFloorForced=true; }")
        page.evaluate("() => window.__game.nextFloor()")
        page.wait_for_timeout(700)
        page.evaluate("() => window.__game.warpTo('boss')")
        page.wait_for_timeout(700)
        page.evaluate("() => window.__game.god(true)")
        page.wait_for_timeout(900)
        page.evaluate("() => window.__game.clearBanner()") or page.screenshot(path=os.path.join(SHOTS, "E-duke-caves.png"))
        print("E-duke-caves.png")

        # ---- Depths theme + heavy item loadout on the player ----
        page.evaluate("() => window.__game.nextFloor()")
        page.wait_for_timeout(600)
        page.evaluate("""() => {
          const g = window.__game;
          ['mushroom','halo','lordPit','cubeOfMeat','pentagram','cricket','spoonBender'].forEach(i => g.giveItem(i));
          g.warpTo('normal');
        }""")
        page.wait_for_timeout(900)
        page.evaluate("() => window.__game.press('left')")
        page.wait_for_timeout(700)
        page.evaluate("() => window.__game.clearBanner()") or page.screenshot(path=os.path.join(SHOTS, "F-depths-loaded.png"))
        page.evaluate("() => window.__game.release('left')")
        print("F-depths-loaded.png")

        # ---- treasure room, pedestal item ----
        page.evaluate("() => window.__game.warpTo('treasure')")
        page.wait_for_timeout(700)
        page.evaluate("() => window.__game.clearBanner()") or page.screenshot(path=os.path.join(SHOTS, "G-treasure.png"))
        print("G-treasure.png")

        # ---- brimstone laser mid-fire ----
        page.evaluate("() => { window.__game.warpTo('normal'); window.__game.giveItem('brimstone'); }")
        page.wait_for_timeout(400)
        page.evaluate("() => window.__game.press('right')")
        page.wait_for_timeout(680)
        page.evaluate("() => window.__game.clearBanner()") or page.screenshot(path=os.path.join(SHOTS, "H-brimstone-laser.png"))
        page.evaluate("() => window.__game.release('right')")
        print("H-brimstone-laser.png")

        b.close()


if __name__ == "__main__":
    main()
