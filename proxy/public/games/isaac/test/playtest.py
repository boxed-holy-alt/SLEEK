#!/usr/bin/env python3
"""
Automated play-test for the roguelike.

Drives the real page with Playwright: presses real keys, reads game state out
of window.__game, asserts on it, and drops screenshots into ./screenshots.
"""
import json
import os
import sys
import time

from playwright.sync_api import sync_playwright

URL = "http://localhost:5006/?mute"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(ROOT, "screenshots")
os.makedirs(SHOTS, exist_ok=True)

results = []
console_errors = []


def check(name, ok, detail=""):
    results.append((name, bool(ok), detail))
    mark = "PASS" if ok else "FAIL"
    print(f"  [{mark}] {name}" + (f"  -- {detail}" if detail else ""))
    return ok


def shot(page, name):
    path = os.path.join(SHOTS, name)
    page.screenshot(path=path)
    print(f"  ... screenshot {name}")
    return path


def snap(page):
    return page.evaluate("() => window.__game.snapshot()")


def hold(page, key, ms):
    page.keyboard.down(key)
    page.wait_for_timeout(ms)
    page.keyboard.up(key)


def main():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={"width": 1000, "height": 640},
                                  device_scale_factor=2)
        page = ctx.new_page()
        page.on("console", lambda m: console_errors.append(f"{m.type}: {m.text}")
                if m.type == "error" else None)
        page.on("pageerror", lambda e: console_errors.append(f"pageerror: {e}"))

        page.goto(URL)
        page.wait_for_timeout(900)

        # ---------------------------------------------------------------- 1
        print("\n[1] 标题界面 / 引擎启动")
        check("window.__game 已暴露", page.evaluate("() => !!window.__game"))
        check("初始状态为 title", page.evaluate("() => window.__game.state") == "title")
        shot(page, "01-title.png")

        # ---------------------------------------------------------------- 2
        print("\n[2] 开始游戏 / 首个房间")
        page.click("#btn-start")
        page.wait_for_timeout(700)
        s = snap(page)
        check("状态切换为 playing", s["state"] == "playing", s["state"])
        check("玩家已生成且满血", s["player"]["hp"] == s["player"]["maxHp"] == 8,
              f'hp={s["player"]["hp"]}/{s["player"]["maxHp"]}')
        check("起始房间类型为 start", s["room"]["type"] == "start", s["room"]["type"])
        fp = s["floorPlan"]
        check("本层房间数在 5-13 之间", 5 <= fp["rooms"] <= 13, f'{fp["rooms"]} 间')
        check("本层有 1 个 Boss 房", fp["types"].get("boss") == 1, json.dumps(fp["types"]))
        check("本层有 1 个宝箱/道具房", fp["types"].get("treasure") == 1, json.dumps(fp["types"]))
        shot(page, "02-start-room.png")

        # ---------------------------------------------------------------- 3
        print("\n[3] 移动手感")
        p0 = snap(page)["player"]
        hold(page, "KeyD", 450)
        page.wait_for_timeout(120)
        p1 = snap(page)["player"]
        check("按 D 向右移动", p1["x"] > p0["x"] + 40, f'{p0["x"]} -> {p1["x"]}')
        hold(page, "KeyW", 400)
        page.wait_for_timeout(120)
        p2 = snap(page)["player"]
        check("按 W 向上移动", p2["y"] < p1["y"] - 30, f'{p1["y"]} -> {p2["y"]}')
        check("玩家被限制在房间内", 60 < p2["x"] < 840 and 60 < p2["y"] < 480,
              f'({p2["x"]},{p2["y"]})')

        # ---------------------------------------------------------------- 4
        print("\n[4] 射击")
        page.keyboard.down("ArrowLeft")
        page.wait_for_timeout(120)
        n_tears = page.evaluate("() => window.__game.tearCount")
        check("按方向键生成眼泪", n_tears > 0, f"{n_tears} 颗")
        d = page.evaluate("() => window.__game.snapshot().player.headDir")
        check("角色朝向跟随射击方向", d == "left", d)
        page.wait_for_timeout(500)
        page.keyboard.up("ArrowLeft")
        shot(page, "03-shooting.png")
        page.wait_for_timeout(700)
        check("眼泪到达射程后消失",
              page.evaluate("() => window.__game.tearCount") == 0)

        # ---------------------------------------------------------------- 5
        print("\n[5] 进入战斗房间 / 门的开合")
        dirs = page.evaluate("() => window.__game.doorDirs()")
        check("起始房间至少有一扇门", len(dirs) >= 1, str(dirs))
        # walk to a combat room through the door graph
        entered = None
        for d in dirs:
            page.evaluate(f"() => window.__game.goDoor('{d}')")
            page.wait_for_timeout(500)
            s = snap(page)
            if s["room"]["type"] == "normal":
                entered = s
                break
        check("成功进入一个普通战斗房", entered is not None,
              entered["room"]["type"] if entered else "none")
        if entered:
            check("房间内有敌人", len(entered["enemies"]) > 0,
                  f'{len(entered["enemies"])} 个: ' + ",".join(sorted(set(e["type"] for e in entered["enemies"]))))
            closed = [k for k, v in entered["room"]["doors"].items() if not v["open"]]
            check("未清房时门是关闭的", len(closed) == len(entered["room"]["doors"]),
                  f'{len(closed)}/{len(entered["room"]["doors"])} 关闭')
            shot(page, "04-combat-room.png")

            # ------------------------------------------------------------ 6
            print("\n[6] 击杀敌人 / 敌人掉血")
            e0 = entered["enemies"][0]
            hp_before = e0["hp"]
            page.evaluate("() => window.__game.hurtEnemies(3)")
            page.wait_for_timeout(120)
            s = snap(page)
            still = [e for e in s["enemies"] if e["type"] == e0["type"]]
            check("敌人受到伤害后掉血",
                  (not still) or still[0]["hp"] < hp_before,
                  f'{hp_before} -> {still[0]["hp"] if still else "dead"}')

            page.evaluate("() => window.__game.god(true)")
            deadline = time.time() + 12
            while time.time() < deadline and page.evaluate("() => window.__game.enemyCount") > 0:
                page.evaluate("() => window.__game.hurtEnemies(30)")
                page.wait_for_timeout(120)
            s = snap(page)
            check("房间敌人被清空", len(s["enemies"]) == 0)
            check("击杀数已统计", s["stats"]["kills"] > 0, f'{s["stats"]["kills"]} 杀')
            page.wait_for_timeout(300)
            s = snap(page)
            check("清房后房间标记为 cleared", s["room"]["cleared"])
            opened = [k for k, v in s["room"]["doors"].items() if v["open"]]
            check("清房后所有门打开", len(opened) == len(s["room"]["doors"]),
                  f'{len(opened)}/{len(s["room"]["doors"])} 打开')
            shot(page, "05-room-cleared.png")

            # ------------------------------------------------------------ 7
            print("\n[7] 走门切换房间")
            room_before = s["room"]["id"]
            d = opened[0]
            # Walk with real movement keys until the room actually changes.
            mk = {"up": "KeyW", "down": "KeyS", "left": "KeyA", "right": "KeyD"}[d]
            page.evaluate("() => window.__game.teleport(450, 270)")
            page.keyboard.down(mk)
            deadline = time.time() + 5
            while time.time() < deadline:
                page.wait_for_timeout(150)
                if page.evaluate("() => window.__game.snapshot().room.id") != room_before:
                    break
            page.keyboard.up(mk)
            page.wait_for_timeout(500)
            s2 = snap(page)
            check("用 WASD 走过门后房间发生切换",
                  s2["room"]["id"] != room_before,
                  f'room {room_before} -> {s2["room"]["id"]} (方向 {d})')
            shot(page, "06-next-room.png")

        # ---------------------------------------------------------------- 8
        print("\n[8] 道具房 / 属性变化")
        page.evaluate("() => window.__game.warpTo('treasure')")
        page.wait_for_timeout(500)
        s = snap(page)
        check("成功进入道具房", s["room"]["type"] == "treasure", s["room"]["type"])
        check("道具房里有基座", "pedestal" in s["room"]["props"], str(s["room"]["props"]))
        shot(page, "07-treasure-room.png")

        before = snap(page)
        page.evaluate("() => window.__game.teleport(450, 330)")
        hold(page, "KeyW", 800)
        page.wait_for_timeout(600)
        after = snap(page)
        picked = after["player"]["items"]
        check("走上去自动拾取道具", len(picked) > len(before["player"]["items"]),
              ",".join(i["name"] for i in picked))
        if picked:
            changed = [k for k in after["player"]["stats"]
                       if abs(after["player"]["stats"][k] - before["player"]["stats"][k]) > 1e-6]
            flagchg = [k for k in after["player"]["flags"]
                       if after["player"]["flags"][k] != before["player"]["flags"][k]]
            check("道具实际改变了属性或攻击方式",
                  len(changed) > 0 or len(flagchg) > 0,
                  f"属性变化={changed} 标记变化={flagchg}")
            check("拾取道具数已统计", after["stats"]["itemsPicked"] >= 1,
                  str(after["stats"]["itemsPicked"]))
        shot(page, "08-item-picked.png")

        # ---------------------------------------------------------------- 9
        print("\n[9] 道具叠加")
        st0 = snap(page)["player"]["stats"]
        page.evaluate("() => window.__game.giveItem('sadOnion')")
        page.evaluate("() => window.__game.giveItem('sadOnion')")
        page.wait_for_timeout(150)
        st1 = snap(page)["player"]["stats"]
        check("同名道具可叠加 (射速 +1.2)",
              abs((st1["fireRate"] - st0["fireRate"]) - 1.2) < 0.01,
              f'{st0["fireRate"]:.2f} -> {st1["fireRate"]:.2f}')
        page.evaluate("() => window.__game.giveItem('brimstone')")
        page.wait_for_timeout(100)
        check("Brimstone 改变攻击方式",
              page.evaluate("() => window.__game.flags.brimstone"))
        page.keyboard.down("ArrowRight")
        page.wait_for_timeout(900)
        lasers = page.evaluate("() => window.__game.laserCount")
        page.keyboard.up("ArrowRight")
        check("Brimstone 蓄力后发射激光", lasers > 0, f"{lasers} 道")
        shot(page, "09-brimstone.png")

        # --------------------------------------------------------------- 10
        print("\n[10] BOSS 战")
        page.evaluate("() => window.__game.warpTo('boss')")
        page.wait_for_timeout(800)
        s = snap(page)
        check("进入 Boss 房", s["room"]["type"] == "boss", s["room"]["type"])
        check("Boss 已生成", s["boss"] is not None,
              f'{s["boss"]["type"]} hp={s["boss"]["hp"]}' if s["boss"] else "none")
        shot(page, "10-boss-fight.png")

        if s["boss"]:
            states = set()
            deadline = time.time() + 9
            while time.time() < deadline:
                b = page.evaluate("() => window.__game.snapshot().boss")
                if b:
                    states.add(b["state"])
                page.wait_for_timeout(160)
            check("Boss 有多段攻击状态机", len(states) >= 3, ",".join(sorted(states)))

            hp0 = page.evaluate("() => window.__game.snapshot().boss['hp']")
            page.evaluate("() => window.__game.god(true)")
            deadline = time.time() + 20
            while time.time() < deadline and page.evaluate("() => window.__game.enemyCount") > 0:
                page.evaluate("() => window.__game.hurtEnemies(40)")
                page.wait_for_timeout(110)
            page.wait_for_timeout(700)
            s = snap(page)
            check("Boss 被击杀", s["boss"] is None and len(s["enemies"]) == 0)
            check("Boss 击杀已统计", s["stats"]["bossesKilled"] >= 1,
                  str(s["stats"]["bossesKilled"]))
            check("Boss 房掉落奖励道具与活板门",
                  "pedestal" in s["room"]["props"] and "trapdoor" in s["room"]["props"],
                  str(s["room"]["props"]))
            shot(page, "11-boss-defeated.png")

            # ----------------------------------------------------------- 11
            print("\n[11] 下一层")
            f0 = s["floor"]
            page.evaluate("() => window.__game.teleport(520, 270)")
            page.wait_for_timeout(500)
            s = snap(page)
            check("踏入活板门进入下一层", s["floor"] == f0 + 1,
                  f'L{f0} -> L{s["floor"]}')
            check("新一层重新生成 5-13 个房间",
                  5 <= s["floorPlan"]["rooms"] <= 13, f'{s["floorPlan"]["rooms"]} 间')
            shot(page, "12-floor-2.png")

        # --------------------------------------------------------------- 12
        print("\n[12] 死亡界面")
        page.evaluate("() => window.__game.god(false)")
        page.evaluate("() => window.__game.setHp(2)")
        page.evaluate("() => { const g = window.__game.raw; g.player.invuln = 0; g.player.takeDamage(99, g); }")
        page.wait_for_timeout(900)
        check("状态切换为 dead", page.evaluate("() => window.__game.state") == "dead")
        check("死亡界面可见",
              page.is_visible("#screen-dead"))
        txt = page.inner_text("#dead-stats")
        check("死亡界面显示击杀数/道具数/存活时间",
              "击 杀 数" in txt and "拾取道具" in txt and "存活时间" in txt,
              txt.replace("\n", " ")[:110])
        shot(page, "13-death-screen.png")

        # --------------------------------------------------------------- 13
        print("\n[13] 通关界面")
        page.click("#btn-retry")
        page.wait_for_timeout(500)
        page.evaluate("() => { window.__game.raw.floorIndex = window.__game.maxFloor; window.__game.raw.trapdoor = {final:true}; window.__game.raw.descend(); }")
        page.wait_for_timeout(600)
        check("状态切换为 win", page.evaluate("() => window.__game.state") == "win")
        check("通关界面可见", page.is_visible("#screen-win"))
        shot(page, "14-win-screen.png")

        # --------------------------------------------------------------- 14
        print("\n[14] 移动端虚拟摇杆 + 射击按钮")
        m = ctx.new_page()
        m.on("pageerror", lambda e: console_errors.append(f"mobile pageerror: {e}"))
        m.set_viewport_size({"width": 414, "height": 896})
        m.goto("http://localhost:5006/?mute&mobile=1")
        m.wait_for_timeout(800)
        check("移动端显示触控 UI", m.is_visible("#joystick") and m.is_visible("#sb-up"))
        # Regression guard: the stage used to get flex-shrunk on narrow
        # viewports, which clipped most of the room off-screen.
        cb = m.locator("#game").bounding_box()
        expect_s = min((414 - 10) / 900, (896 - 10) / 540)
        check("移动端画布按比例完整缩放 (未被裁切)",
              abs(cb["width"] - 900 * expect_s) < 6 and abs(cb["height"] - 540 * expect_s) < 6,
              f'canvas {cb["width"]:.0f}x{cb["height"]:.0f}, 期望 {900*expect_s:.0f}x{540*expect_s:.0f}')
        check("移动端画布完全在视口内",
              cb["x"] >= -1 and cb["y"] >= -1 and cb["x"] + cb["width"] <= 415,
              f'x={cb["x"]:.0f} y={cb["y"]:.0f} w={cb["width"]:.0f}')
        m.click("#btn-start")
        m.wait_for_timeout(600)
        m.screenshot(path=os.path.join(SHOTS, "15-mobile-portrait.png"))
        print("  ... screenshot 15-mobile-portrait.png")

        box = m.locator("#joystick").bounding_box()
        cx, cy = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
        p0 = m.evaluate("() => window.__game.snapshot().player")
        m.mouse.move(cx, cy)
        m.mouse.down()
        m.mouse.move(cx + 55, cy, steps=5)
        m.wait_for_timeout(700)
        p1 = m.evaluate("() => window.__game.snapshot().player")
        m.mouse.up()
        check("拖动虚拟摇杆能让角色移动", p1["x"] > p0["x"] + 25,
              f'{p0["x"]} -> {p1["x"]}')

        sb = m.locator("#sb-left").bounding_box()
        m.mouse.move(sb["x"] + sb["width"] / 2, sb["y"] + sb["height"] / 2)
        m.mouse.down()
        m.wait_for_timeout(260)
        tc = m.evaluate("() => window.__game.tearCount")
        hd = m.evaluate("() => window.__game.snapshot().player.headDir")
        m.mouse.up()
        check("按射击按钮能发射眼泪", tc > 0, f"{tc} 颗")
        check("射击按钮控制朝向", hd == "left", hd)
        m.screenshot(path=os.path.join(SHOTS, "16-mobile-shooting.png"))
        print("  ... screenshot 16-mobile-shooting.png")
        m.close()

        # --------------------------------------------------------------- 15
        print("\n[15] 地牢生成健壮性 (600 次随机种子, 覆盖全部 12 层)")
        gen = page.evaluate("""() => {
          const out = {ok: 0, bad: [], counts: {}, doorErr: 0, shops: 0, bosses: {}};
          for (let i = 0; i < 600; i++) {
            const level = 1 + (i % 12);
            const plan = generateFloor(level, (i * 2654435761) >>> 0);
            const n = plan.rooms.length;
            out.counts[n] = (out.counts[n] || 0) + 1;
            out.bosses[plan.bossType] = (out.bosses[plan.bossType] || 0) + 1;
            const boss = plan.rooms.filter(r => r.type === 'boss').length;
            const tre = plan.rooms.filter(r => r.type === 'treasure').length;
            const shop = plan.rooms.filter(r => r.type === 'shop').length;
            if (shop) out.shops++;
            if (shop > 1) { out.bad.push({i, shop}); continue; }
            // the boss for this floor must come from this chapter's pool
            if (!plan.chapter.bosses.includes(plan.bossType)) { out.bad.push({i, boss: plan.bossType}); continue; }
            // every door must be mirrored by the neighbour
            let doorOk = true;
            for (const r of plan.rooms) {
              for (const d of DIRS) {
                const door = r.doors[d];
                if (!door) continue;
                const back = door.to.doors[DIR_OPP[d]];
                if (!back || back.to !== r) doorOk = false;
                const v = DIR_VEC[d];
                if (door.to.gx !== r.gx + v.x || door.to.gy !== r.gy + v.y) doorOk = false;
              }
            }
            // reachability from start
            const seen = new Set([plan.start]); const q = [plan.start];
            while (q.length) { const r = q.shift(); for (const d of DIRS) { const dd = r.doors[d]; if (dd && !seen.has(dd.to)) { seen.add(dd.to); q.push(dd.to); } } }
            if (!doorOk) out.doorErr++;
            if (n >= 5 && n <= 13 && boss === 1 && tre === 1 && doorOk && seen.size === n) out.ok++;
            else out.bad.push({i, n, boss, tre, doorOk, reach: seen.size});
          }
          return out;
        }""")
        check("600 次地牢生成全部合法", gen["ok"] == 600,
              f'ok={gen["ok"]}/600 房间数分布={json.dumps(gen["counts"])} 异常={json.dumps(gen["bad"][:3])}')
        check("13 个 Boss 在 600 次生成中全部出现过", len(gen["bosses"]) == 13,
              json.dumps(gen["bosses"], ensure_ascii=False))
        check("商店房只在够大的楼层出现且不重复", gen["shops"] > 0,
              f'{gen["shops"]}/600 层带商店')

        # --------------------------------------------------------------- 16
        print("\n[16] 新增系统: 商店 / 护盾 / 复活 / 中毒 / 跟班")
        page.evaluate("() => window.__game.start(20260730)")
        page.wait_for_timeout(500)

        # -- shop: costs coins, hands over goods, refuses when broke --
        shop_floor = page.evaluate("""() => {
          for (let l = 4; l <= window.__game.maxFloor; l++) {
            window.__game.raw.bossesSeen = [];
            window.__game.raw.loadFloor(l);
            if (window.__game.raw.plan.rooms.some(r => r.type === 'shop')) return l;
          }
          return 0;
        }""")
        check("能找到带商店的楼层", shop_floor > 0, f"L{shop_floor}")
        if shop_floor:
            page.evaluate("() => { window.__game.warpTo('shop'); window.__game.setCoins(0); window.__game.god(true); }")
            page.wait_for_timeout(300)
            stall = page.evaluate("""() => {
              const o = window.__game.raw.room.props.find(p => p.kind === 'shopItem');
              return o ? {x: o.x, y: o.y, price: o.price} : null;
            }""")
            check("商店房里有货架", stall is not None, json.dumps(stall))
            if stall:
                page.evaluate(f"() => window.__game.teleport({stall['x']}, {stall['y']})")
                page.wait_for_timeout(400)
                broke = page.evaluate("""() => window.__game.raw.room.props
                    .filter(p => p.kind === 'shopItem' && p.sold).length""")
                check("没钱时买不走东西", broke == 0, f"已售出 {broke} 件")
                before_items = page.evaluate("() => window.__game.items.length")
                page.evaluate(f"() => {{ window.__game.setCoins({stall['price'] + 5}); window.__game.teleport(100, 100); }}")
                page.wait_for_timeout(200)
                page.evaluate(f"() => window.__game.teleport({stall['x']}, {stall['y']})")
                page.wait_for_timeout(500)
                bought = page.evaluate("""() => ({
                  sold: window.__game.raw.room.props.filter(p => p.kind === 'shopItem' && p.sold).length,
                  coins: window.__game.coins,
                  items: window.__game.items.length,
                  maxHp: window.__game.maxHp,
                })""")
                check("有钱时成功购买并扣款", bought["sold"] >= 1 and bought["coins"] <= 5,
                      json.dumps(bought))
                check("购买后确实拿到了东西",
                      bought["items"] > before_items or bought["maxHp"] > 8,
                      f'道具 {before_items}->{bought["items"]}, 上限 {bought["maxHp"]}')
            shot(page, "19-shop.png")

        # -- Holy Mantle absorbs exactly one hit per room --
        page.evaluate("() => window.__game.start(555)")
        page.wait_for_timeout(400)
        mantle = page.evaluate("""() => {
          const g = window.__game;
          g.god(false);
          g.giveItem('holyMantle');
          const hp0 = g.hp;
          g.raw.player.invuln = 0;
          g.raw.player.takeDamage(2, g.raw, 100, 100, 'test');
          const hp1 = g.hp;
          g.raw.player.invuln = 0;
          g.raw.player.takeDamage(2, g.raw, 100, 100, 'test');
          return {hp0, hp1, hp2: g.hp};
        }""")
        check("护盾挡下第一次伤害", mantle["hp1"] == mantle["hp0"], json.dumps(mantle))
        check("护盾用掉后第二次照常掉血", mantle["hp2"] < mantle["hp1"], json.dumps(mantle))

        # -- 1UP revives instead of ending the run --
        rev = page.evaluate("""() => {
          const g = window.__game;
          g.giveItem('oneUp');
          g.raw.player.shieldUp = false;
          g.raw.player.invuln = 0;
          g.raw.player.takeDamage(99, g.raw, 100, 100, 'test');
          return {dead: g.raw.player.dead, hp: g.hp, state: g.state};
        }""")
        check("1UP 让致命伤变成复活", not rev["dead"] and rev["hp"] > 0, json.dumps(rev))

        # -- poison keeps ticking after the tear is gone --
        poison = page.evaluate("""() => {
          const g = window.__game;
          g.god(true);
          g.clearEnemies();
          const e = g.raw.spawnEnemy('gaper', 500, 200);
          e.spawnT = 0;
          const hp0 = e.hp;
          e.poison = 3; e.poisonDps = 4;
          return {hp0, id: 1};
        }""")
        page.wait_for_timeout(1200)
        poisoned = page.evaluate("""() => {
          const e = window.__game.raw.enemies[0];
          return e ? e.hp : -1;
        }""")
        check("中毒持续掉血", poisoned < poison["hp0"], f'{poison["hp0"]} -> {poisoned}')

        # -- familiars fire on their own --
        # The player never shoots here, so any damage on the dummy can only
        # have come from the familiar.
        fam_before = page.evaluate("""() => {
          const g = window.__game;
          g.clearEnemies();
          g.giveItem('brotherBobby');
          const e = g.raw.spawnEnemy('gaper', 520, 150);
          e.spawnT = 0; e.hp = e.maxHp = 400; e.spd = 0;
          g.teleport(300, 150);
          g.raw.tears.length = 0;
          return e.hp;
        }""")
        page.wait_for_timeout(1600)
        fam_after = page.evaluate("""() => ({
          count: window.__game.raw.player.familiars.length,
          hp: window.__game.raw.enemies.length ? window.__game.raw.enemies[0].hp : -1,
        })""")
        check("跟班已生成", fam_after["count"] >= 1, f'{fam_after["count"]} 个')
        check("跟班会自动开火并造成伤害", fam_after["hp"] < fam_before,
              f'目标血量 {fam_before} -> {fam_after["hp"]}')

        # -- Knight blocks from the front, not the back --
        knight = page.evaluate("""() => {
          const g = window.__game;
          g.clearEnemies();
          const e = g.raw.spawnEnemy('knight', 450, 270);
          e.spawnT = 0; e.faceX = 0; e.faceY = 1;   // facing down
          const hp0 = e.hp;
          g.raw.damageEnemy(e, 20, 450, 500);        // hit from the front
          const hpFront = e.hp;
          g.raw.damageEnemy(e, 20, 450, 40);         // hit from behind
          return {hp0, hpFront, hpBack: e.hp};
        }""")
        check("Knight 正面几乎免疫", knight["hp0"] - knight["hpFront"] < 3,
              json.dumps(knight))
        check("Knight 背面吃满伤害", knight["hpFront"] - knight["hpBack"] >= 15,
              json.dumps(knight))

        # -- Globin gets back up once --
        globin = page.evaluate("""() => {
          const g = window.__game;
          g.clearEnemies();
          const e = g.raw.spawnEnemy('globin', 450, 270);
          e.spawnT = 0;
          g.raw.damageEnemy(e, 999, 400, 270);
          return {deadFirst: e.dead, downed: e.downed > 0};
        }""")
        check("Globin 第一次死亡会瘫成一滩", not globin["deadFirst"] and globin["downed"],
              json.dumps(globin))

        # --------------------------------------------------------------- 17
        print("\n[17] 性能 & 控制台")
        fps = page.evaluate("() => window.__game.fps")
        check("帧率 >= 50", fps >= 50, f"{fps} fps")
        real_errors = [e for e in console_errors if "favicon" not in e.lower()]
        check("无 console 报错", len(real_errors) == 0, "; ".join(real_errors[:4]))

        browser.close()

    print("\n" + "=" * 68)
    npass = sum(1 for _, ok, _ in results if ok)
    print(f"结果: {npass}/{len(results)} 通过")
    for n, ok, d in results:
        if not ok:
            print(f"  FAIL  {n}  {d}")
    print("=" * 68)
    with open(os.path.join(ROOT, "test", "last-results.json"), "w") as f:
        json.dump([{"name": n, "pass": ok, "detail": d} for n, ok, d in results], f,
                  ensure_ascii=False, indent=1)
    return 0 if npass == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
