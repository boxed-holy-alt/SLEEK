/* ==========================================================================
   main.js — bootstrap, input (keyboard + touch), screen flow, debug hooks
   ========================================================================== */
'use strict';

(function () {
  const cv = document.getElementById('game');
  const stage = document.getElementById('stage');
  const game = new Game(cv);

  /* ------------------------------------------------------------- scaling */
  function fit() {
    const pad = 10;
    const s = Math.max(0.28, Math.min((window.innerWidth - pad) / VIEW_W,
                                      (window.innerHeight - pad) / VIEW_H));
    stage.style.transform = `scale(${s})`;
    // A transform doesn't change the layout box, so a scaled-down stage would
    // otherwise reserve its full 900x540 and push itself off-centre. Collapse
    // the leftover space with negative margins so centring stays honest.
    stage.style.margin = `${-VIEW_H * (1 - s) / 2}px ${-VIEW_W * (1 - s) / 2}px`;
  }
  window.addEventListener('resize', fit);
  fit();

  /* --------------------------------------------------------------- input */
  const input = { mx: 0, my: 0, shootDir: null };
  const held = new Set();
  const arrowStack = [];          // most recent arrow wins, exactly like Isaac
  const touchShoot = [];
  const touchMove = { x: 0, y: 0, active: false };

  const KEY_MOVE = {
    KeyW: [0, -1], KeyS: [0, 1], KeyA: [-1, 0], KeyD: [1, 0],
  };
  const KEY_SHOOT = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  };

  function pushArrow(dir) { if (!arrowStack.includes(dir)) arrowStack.push(dir); }
  function popArrow(dir) { const i = arrowStack.indexOf(dir); if (i >= 0) arrowStack.splice(i, 1); }

  window.addEventListener('keydown', (e) => {
    Sfx.init();
    if (KEY_MOVE[e.code] || KEY_SHOOT[e.code] || e.code === 'Space') e.preventDefault();
    if (held.has(e.code)) return;
    held.add(e.code);
    if (KEY_SHOOT[e.code]) pushArrow(KEY_SHOOT[e.code]);

    // Enter also activates a focused link, so let the browser have it alone —
    // otherwise the run would start behind the newly opened tab.
    const onLink = document.activeElement && document.activeElement.closest('a');
    if ((e.code === 'Enter' || e.code === 'Space') && !onLink) {
      if (game.state === STATE.TITLE) startRun();
      else if (game.state === STATE.DEAD || game.state === STATE.WIN) startRun();
    }
    if (e.code === 'KeyP' && (game.state === STATE.PLAY || game.state === STATE.TRANS)) {
      game.paused = !game.paused;
      document.getElementById('screen-pause').classList.toggle('hidden', !game.paused);
    }
    if (e.code === 'KeyM') { Sfx.enabled = !Sfx.enabled; }
  });
  window.addEventListener('keyup', (e) => {
    held.delete(e.code);
    if (KEY_SHOOT[e.code]) popArrow(KEY_SHOOT[e.code]);
  });
  window.addEventListener('blur', () => { held.clear(); arrowStack.length = 0; });

  function pollInput() {
    let mx = 0, my = 0;
    for (const code in KEY_MOVE) {
      if (held.has(code)) { mx += KEY_MOVE[code][0]; my += KEY_MOVE[code][1]; }
    }
    if (touchMove.active) { mx += touchMove.x; my += touchMove.y; }
    input.mx = clamp(mx, -1, 1);
    input.my = clamp(my, -1, 1);
    input.shootDir = arrowStack.length ? arrowStack[arrowStack.length - 1]
      : touchShoot.length ? touchShoot[touchShoot.length - 1] : null;
  }

  /* ------------------------------------------------------ touch controls */
  const touchUI = document.getElementById('touch-ui');
  const joy = document.getElementById('joystick');
  const knob = document.getElementById('joy-knob');

  const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  const forceTouch = new URLSearchParams(location.search).has('mobile');
  if (isTouch || forceTouch) {
    touchUI.classList.remove('hidden');
    window.__touchMode = true;
  }

  let joyId = null;
  const JOY_R = 52;
  function joyMove(ev) {
    const rect = joy.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    let dx = ev.clientX - cx, dy = ev.clientY - cy;
    const m = Math.hypot(dx, dy);
    const dead = 8;
    if (m < dead) { touchMove.x = touchMove.y = 0; }
    else {
      const k = Math.min(1, (m - dead) / (JOY_R - dead));
      touchMove.x = (dx / m) * k;
      touchMove.y = (dy / m) * k;
    }
    const cl = Math.min(m, JOY_R);
    const ang = Math.atan2(dy, dx);
    knob.style.transform = `translate(${Math.cos(ang) * cl}px, ${Math.sin(ang) * cl}px)`;
  }
  joy.addEventListener('pointerdown', (e) => {
    Sfx.init();
    joyId = e.pointerId; touchMove.active = true;
    joy.setPointerCapture(e.pointerId);
    joyMove(e); e.preventDefault();
  });
  joy.addEventListener('pointermove', (e) => { if (e.pointerId === joyId) { joyMove(e); e.preventDefault(); } });
  const joyEnd = (e) => {
    if (e.pointerId !== joyId) return;
    joyId = null; touchMove.active = false; touchMove.x = touchMove.y = 0;
    knob.style.transform = 'translate(0,0)';
  };
  joy.addEventListener('pointerup', joyEnd);
  joy.addEventListener('pointercancel', joyEnd);
  joy.addEventListener('pointerleave', joyEnd);

  document.querySelectorAll('.sbtn').forEach((b) => {
    const dir = b.dataset.dir;
    const on = (e) => {
      Sfx.init();
      if (!touchShoot.includes(dir)) touchShoot.push(dir);
      b.classList.add('on');
      e.preventDefault();
    };
    const off = (e) => {
      const i = touchShoot.indexOf(dir);
      if (i >= 0) touchShoot.splice(i, 1);
      b.classList.remove('on');
      if (e) e.preventDefault();
    };
    b.addEventListener('pointerdown', on);
    b.addEventListener('pointerup', off);
    b.addEventListener('pointercancel', off);
    b.addEventListener('pointerleave', off);
  });

  /* -------------------------------------------------------------- screens */
  const S = {
    title: document.getElementById('screen-title'),
    dead: document.getElementById('screen-dead'),
    win: document.getElementById('screen-win'),
    pause: document.getElementById('screen-pause'),
  };
  function show(which) {
    for (const k in S) S[k].classList.toggle('hidden', k !== which);
    if (!which) for (const k in S) S[k].classList.add('hidden');
  }

  function cell(k, v, hl) {
    return `<div class="stat-cell${hl ? ' hl' : ''}"><span class="k">${k}</span><span class="v">${v}</span></div>`;
  }
  function fillStats(elId, itemsElId) {
    const st = game.stats, p = game.player;
    document.getElementById(elId).innerHTML =
      cell('击 杀 数', st.kills, true) +
      cell('拾取道具', st.itemsPicked, true) +
      cell('存活时间', fmtTime(game.elapsed), true) +
      cell('到达层数', `${game.floorIndex} / ${MAX_FLOOR}`) +
      cell('探索房间', `${game.plan.rooms.filter(r => r.visited).length} / ${game.plan.rooms.length}`) +
      cell('击败 BOSS', st.bossesKilled);
    const items = p.items;
    document.getElementById(itemsElId).innerHTML = items.length
      ? items.map(i => `<span>${i.name}</span>`).join('')
      : '<span class="none">这次探索没有拿到任何道具</span>';
  }

  const DEATH_LINES = [
    '你在地下室深处倒下了', '妈妈的声音还在楼上回响', '眼泪流干了，也没能走出去',
    '又一次被困在地下室里', '这一层的怪物赢了',
  ];

  let lastState = null;
  function syncScreens() {
    if (game.state === lastState) return;
    lastState = game.state;
    if (game.state === STATE.TITLE) show('title');
    else if (game.state === STATE.DEAD) {
      document.getElementById('dead-sub').textContent =
        DEATH_LINES[Math.floor(Math.random() * DEATH_LINES.length)];
      fillStats('dead-stats', 'dead-items');
      show('dead');
    } else if (game.state === STATE.WIN) {
      fillStats('win-stats', 'win-items');
      show('win');
    } else show(null);
  }

  function startRun(seed) {
    Sfx.init();
    game.startRun(seed);
    lastState = null;
    show(null);
  }
  document.getElementById('btn-start').addEventListener('click', () => startRun());
  document.getElementById('btn-retry').addEventListener('click', () => startRun());
  document.getElementById('btn-again').addEventListener('click', () => startRun());

  /* ----------------------------------------------------------------- loop */
  let last = performance.now();
  let fpsAcc = 0, fpsN = 0;
  game.fps = 60;
  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 1 / 20) dt = 1 / 20;          // never let physics tunnel
    if (dt > 0) { fpsAcc += 1 / dt; fpsN++; if (fpsN >= 30) { game.fps = fpsAcc / fpsN; fpsAcc = 0; fpsN = 0; } }
    pollInput();
    game.update(dt, input);
    game.render();
    syncScreens();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ==========================================================================
     window.__game — debug / automated-test surface
     ========================================================================== */
  window.__game = {
    raw: game,
    input,

    get state() { return game.state; },
    get floor() { return game.floorIndex; },
    get hp() { return game.player ? game.player.hp : 0; },
    get maxHp() { return game.player ? game.player.stats.maxHp : 0; },
    get stats() { return game.player ? { ...game.player.stats } : null; },
    get flags() { return game.player ? { ...game.player.flags } : null; },
    get items() { return game.player ? game.player.items.map(i => i.id) : []; },
    get itemNames() { return game.player ? game.player.items.map(i => i.name) : []; },
    get enemyCount() { return game.enemies.filter(e => !e.dead).length; },
    get enemyTypes() { return game.enemies.filter(e => !e.dead).map(e => e.type); },
    get tearCount() { return game.tears.length; },
    get enemyTearCount() { return game.enemyTears.length; },
    get laserCount() { return game.lasers.length; },
    get kills() { return game.stats ? game.stats.kills : 0; },
    get itemsPicked() { return game.stats ? game.stats.itemsPicked : 0; },
    get elapsed() { return game.elapsed || 0; },
    get fps() { return Math.round(game.fps); },
    get chapter() { return game.plan ? game.plan.chapter.label : null; },
    get bossType() { return game.plan ? game.plan.bossType : null; },
    get maxFloor() { return MAX_FLOOR; },
    get coins() { return game.player ? game.player.coins : 0; },
    get chapters() { return CHAPTERS.map(c => ({ label: c.label, theme: c.theme, bosses: c.bosses })); },
    get itemIds() { return ITEMS.map(i => i.id); },
    get enemyTypes_all() { return Object.keys(ENEMY_DEFS); },

    start(seed) { startRun(seed); },

    snapshot() {
      const p = game.player;
      const room = game.room;
      return {
        state: game.state,
        floor: game.floorIndex,
        seed: game.seed,
        fps: Math.round(game.fps),
        player: p ? {
          x: Math.round(p.x), y: Math.round(p.y),
          hp: p.hp, maxHp: p.stats.maxHp,
          coins: p.coins,
          stats: { ...p.stats },
          flags: { ...p.flags },
          items: p.items.map(i => ({ id: i.id, name: i.name })),
          headDir: p.headDir,
          invuln: +p.invuln.toFixed(2),
        } : null,
        room: room ? {
          id: room.id, type: room.type, gx: room.gx, gy: room.gy,
          cleared: room.cleared,
          doors: Object.fromEntries(DIRS.filter(d => room.doors[d])
            .map(d => [d, { open: room.doors[d].open, kind: room.doors[d].kind, to: room.doors[d].to.type }])),
          props: room.props.filter(o => !o.gone).map(o => o.kind),
          pickups: room.pickups.map(k => k.kind),
        } : null,
        floorPlan: game.plan ? {
          rooms: game.plan.rooms.length,
          types: game.plan.rooms.reduce((a, r) => (a[r.type] = (a[r.type] || 0) + 1, a), {}),
          visited: game.plan.rooms.filter(r => r.visited).length,
          cleared: game.plan.rooms.filter(r => r.cleared).length,
          layout: game.plan.rooms.map(r => ({
            id: r.id, gx: r.gx, gy: r.gy, type: r.type,
            doors: DIRS.filter(d => r.doors[d]),
          })),
        } : null,
        enemies: game.enemies.filter(e => !e.dead).map(e => ({
          type: e.type, hp: Math.round(e.hp), maxHp: e.maxHp,
          x: Math.round(e.x), y: Math.round(e.y), boss: !!e.boss,
          state: e.state || null,
        })),
        boss: game.boss && !game.boss.dead
          ? { type: game.boss.type, hp: Math.round(game.boss.hp), maxHp: game.boss.maxHp, state: game.boss.state }
          : null,
        counts: {
          tears: game.tears.length,
          enemyTears: game.enemyTears.length,
          lasers: game.lasers.length,
          particles: game.parts.list.length,
        },
        stats: game.stats ? { ...game.stats } : null,
        elapsed: +(game.elapsed || 0).toFixed(2),
      };
    },

    /* ---- helpers for automated play ---- */
    press(dir) { if (DIRS.includes(dir)) pushArrow(dir); },
    release(dir) { popArrow(dir); },
    move(x, y) { touchMove.active = true; touchMove.x = clamp(x, -1, 1); touchMove.y = clamp(y, -1, 1); },
    stopMove() { touchMove.active = false; touchMove.x = touchMove.y = 0; },

    spawn(type, x, y) { return game.spawnEnemy(type, x, y).type; },
    clearBanner() { game.banner = null; game.toasts.length = 0; },
    clearEnemies() { game.enemies.length = 0; },
    setTheme(name) { game.theme = THEMES[name]; for (const r of game.plan.rooms) r.floorCv = null; game.room.floorCv = bakeFloor(game.room, game.theme); },
    bossState(s) { if (game.boss) { game.boss.state = s; game.boss.st = 6; } },
    killAll() { for (const e of game.enemies) game.killEnemy(e); },
    hurtEnemies(n) { for (const e of game.enemies) game.damageEnemy(e, n || 5, e.x - 10, e.y, 0); },
    giveItem(id) {
      const it = ITEM_BY_ID[id] || game.itemPool.next();
      game.player.addItem(it, game);
      return it.id;
    },
    setHp(n) { game.player.hp = clamp(n, 0, game.player.stats.maxHp); },
    god(v) { game.debugGod = v !== false; game.player.invuln = v === false ? 0 : 1e9; },
    teleport(x, y) { game.player.x = x; game.player.y = y; game.player.vx = game.player.vy = 0; },

    /** Jump straight into the first room of a given type on this floor. */
    warpTo(type) {
      const r = game.plan.rooms.find(rr => rr.type === type);
      if (!r) return false;
      for (const rr of game.plan.rooms) rr.visited = true;
      game.player.x = VIEW_W / 2; game.player.y = VIEW_H / 2 + 60;
      game.enterRoom(r, null);
      game.state = STATE.PLAY;
      return true;
    },
    /** Walk the floor graph and mark everything cleared (fast-forward). */
    clearFloor() {
      for (const r of game.plan.rooms) { r.cleared = true; r.visited = true; }
      game.enemies.length = 0;
      game.refreshDoors();
    },
    nextFloor() { game.trapdoor = { final: game.floorIndex >= MAX_FLOOR }; game.descend(); },
    setCoins(n) { game.player.coins = n; },
    /** Drop into a given floor's boss room, optionally forcing which boss. */
    warpToBoss(type) {
      const r = game.plan.rooms.find(rr => rr.type === 'boss');
      if (!r) return false;
      if (type) {
        r.enemySpec = [{ type, x: VIEW_W / 2, y: ENEMY_DEFS[type].anchor === 'top' ? IN_Y0 + 96 : VIEW_H / 2 - 30, boss: true }];
        r.cleared = false;
      }
      for (const rr of game.plan.rooms) rr.visited = true;
      game.player.x = VIEW_W / 2; game.player.y = VIEW_H - 110;
      game.enterRoom(r, null);
      game.state = STATE.PLAY;
      return game.boss ? game.boss.type : null;
    },
    doorDirs() { return DIRS.filter(d => game.room.doors[d]); },
    openDoorDirs() { return DIRS.filter(d => game.room.doors[d] && game.room.doors[d].open); },
    goDoor(dir) { return game.goThrough(dir); },
    setSfx(on) { Sfx.enabled = !!on; },
  };

  // Muting audio by default keeps automated runs quiet; a real keypress enables it.
  if (new URLSearchParams(location.search).has('mute')) Sfx.enabled = false;
})();
