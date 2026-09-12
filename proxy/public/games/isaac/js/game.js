/* ==========================================================================
   game.js — state machine, room lifecycle, collision, HUD.
   ========================================================================== */
'use strict';

const STATE = { TITLE: 'title', PLAY: 'playing', TRANS: 'transition', DEAD: 'dead', WIN: 'win' };
const MAX_FLOOR = CHAPTERS.length;

class Game {
  constructor(canvas) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.snapCv = document.createElement('canvas');
    this.snapCv.width = VIEW_W; this.snapCv.height = VIEW_H;
    this.snapCtx = this.snapCv.getContext('2d');

    this.state = STATE.TITLE;
    this.parts = new Particles();
    this.tears = [];
    this.enemyTears = [];
    this.lasers = [];
    this.enemies = [];
    this.toasts = [];
    this.banner = null;
    this.time = 0;
    this.titleT = 0;
    this.flash = 0;
    this.slowmo = 0;
    this.hitStop = 0;
    this.pendingItemPickup = null;
    this.paused = false;
    this.debugGod = false;
  }

  /* ------------------------------------------------------------- run setup */
  startRun(seed) {
    this.seed = (seed === undefined ? (Math.random() * 1e9) | 0 : seed) >>> 0;
    this.rng = makeRng(this.seed);
    this.itemPool = new ItemPool(this.seed);
    this.player = new Player();
    this.floorIndex = 1;
    this.bossesSeen = [];
    this.stats = { kills: 0, itemsPicked: 0, coins: 0, rooms: 0, damageTaken: 0, bossesKilled: 0, bought: 0 };
    this.elapsed = 0;
    this.dmgLog = [];
    this.tears.length = 0; this.enemyTears.length = 0; this.lasers.length = 0;
    this.enemies.length = 0; this.toasts.length = 0;
    this.parts.clear();
    Shake.reset();
    this.loadFloor(1);
    this.state = STATE.PLAY;
  }

  loadFloor(level) {
    this.floorIndex = level;
    this.plan = generateFloor(level, (this.seed + level * 7919) >>> 0, this.bossesSeen);
    if (!this.bossesSeen.includes(this.plan.bossType)) this.bossesSeen.push(this.plan.bossType);
    this.theme = this.plan.theme;
    this.room = this.plan.start;
    this.room.visited = true;
    this.player.x = VIEW_W / 2;
    this.player.y = VIEW_H / 2;
    this.player.vx = this.player.vy = 0;
    this.enterRoom(this.room, null);
    this.banner = {
      label: this.plan.chapter.label,
      sub: `LEVEL ${level} / ${MAX_FLOOR}  ·  ${this.plan.rooms.length} ROOMS`,
      t: 2.6,
    };
    this.bossDead = false;
    this.trapdoor = null;
  }

  enterRoom(room, fromDir) {
    this.room = room;
    room.visited = true;
    this.tears.length = 0;
    this.enemyTears.length = 0;
    this.lasers.length = 0;
    this.enemies.length = 0;
    this.player.brimCharge = 0;
    if (this.player.flags.shield) this.player.shieldUp = true;
    if (!room.floorCv) room.floorCv = bakeFloor(room, this.theme);

    if (!room.cleared) {
      for (const s of room.enemySpec) {
        this.enemies.push(spawnEnemyObj(s.type, s.x, s.y, this.floorIndex));
      }
      if (room.type === 'boss' && this.enemies.length) {
        this.boss = this.enemies[0];
        this.banner = { label: this.boss.def.name, sub: 'BOSS', t: 2.2 };
        Sfx.roar();
        Shake.add(10, 0.5);
      }
    }
    if (room.type !== 'boss') this.boss = null;
    if (room.cleared && room.type === 'boss') this.boss = null;
    this.refreshDoors();
    this.stats.rooms = this.plan.rooms.filter(r => r.visited).length;
  }

  refreshDoors() {
    for (const r of this.plan.rooms) {
      for (const d of DIRS) if (r.doors[d]) r.doors[d].open = r.cleared;
    }
  }

  /* ------------------------------------------------------------ transitions */
  tryDoor() {
    const p = this.player;
    for (const d of DIRS) {
      const door = this.room.doors[d];
      if (!door || !door.open) continue;
      const dp = doorPos(d);
      if (d === 'up' && p.y - p.r < IN_Y0 - 4 && Math.abs(p.x - dp.x) < 44) return this.goThrough(d);
      if (d === 'down' && p.y + p.r > IN_Y1 + 4 && Math.abs(p.x - dp.x) < 44) return this.goThrough(d);
      if (d === 'left' && p.x - p.r < IN_X0 - 4 && Math.abs(p.y - dp.y) < 44) return this.goThrough(d);
      if (d === 'right' && p.x + p.r > IN_X1 + 4 && Math.abs(p.y - dp.y) < 44) return this.goThrough(d);
    }
    return false;
  }

  goThrough(dir) {
    const door = this.room.doors[dir];
    if (!door) return false;
    // Snapshot the current frame so we can slide it out of view.
    this.snapCtx.clearRect(0, 0, VIEW_W, VIEW_H);
    this.snapCtx.drawImage(this.cv, 0, 0, VIEW_W, VIEW_H);

    const opp = DIR_OPP[dir];
    const entry = doorPos(opp);
    const inset = 52;
    const p = this.player;
    if (opp === 'up') { p.x = entry.x; p.y = IN_Y0 + inset; }
    if (opp === 'down') { p.x = entry.x; p.y = IN_Y1 - inset; }
    if (opp === 'left') { p.x = IN_X0 + inset; p.y = entry.y; }
    if (opp === 'right') { p.x = IN_X1 - inset; p.y = entry.y; }
    p.vx = p.vy = 0;

    this.enterRoom(door.to, opp);
    this.trans = { dir, k: 0, dur: 0.3 };
    this.state = STATE.TRANS;
    Sfx.door();
    return true;
  }

  /* --------------------------------------------------------------- helpers */
  addEnemyTear(x, y, vx, vy, dmg, r, opt) {
    const o = opt || {};
    this.enemyTears.push({
      x, y, vx, vy, r: r || 7, dmg: dmg || 1,
      life: o.life || 4.5, maxLife: o.life || 4.5, h: 6, enemy: true,
      color: o.color || (o.homing ? '#c05de0' : '#d43a3a'),
      colorHi: o.colorHi || (o.homing ? '#f0c0ff' : '#ffb0b0'),
      homing: o.homing || 0, curve: o.curve || 0, t: 0,
    });
  }

  /** Enemy-side brimstone. Same beam object, flagged so it hurts the player. */
  addEnemyLaser(x, y, dx, dy, opt) {
    const o = opt || {};
    this.lasers.push({
      x, y, dx, dy,
      len: 0, targetLen: o.len || 900,
      w: o.w || 11,
      dmg: o.dmg || 2,
      life: o.life || 0.5, maxLife: o.life || 0.5,
      tickCd: 0, enemy: true,
    });
    Sfx.laser();
  }

  spawnEnemy(type, x, y) {
    const e = spawnEnemyObj(type, clamp(x, IN_X0 + 20, IN_X1 - 20), clamp(y, IN_Y0 + 20, IN_Y1 - 20), this.floorIndex);
    this.enemies.push(e);
    this.parts.ring(e.x, e.y, 10, '#6b7040', 150, 4);
    return e;
  }

  damageEnemy(e, dmg, sx, sy, knockback) {
    if (e.dead) return;
    if (e.invulnerable || (e.def.immuneWhile && e.def.immuneWhile(e))) return;
    if (e.def.onHit) {
      dmg = e.def.onHit(e, dmg, sx, sy, this);
      if (dmg <= 0) { e.hitFlash = 0.1; return; }
    }
    e.hp -= dmg;
    e.hitFlash = 0.16;
    this.hitStop = Math.max(this.hitStop, e.boss ? 0.02 : 0.035);
    Sfx.hit();
    const n = norm(e.x - sx, e.y - sy);
    const kb = (knockback || 120) * (e.boss ? 0.12 : 1) / (1 + (e.r - 12) * 0.03);
    e.vx += n.x * kb; e.vy += n.y * kb;
    this.parts.burst(e.x + n.x * e.r * 0.4, e.y + n.y * e.r * 0.4, 5, e.def.gore, { spd: 150, size: 3.4 });
    if (e.hp <= 0) this.killEnemy(e);
  }

  killEnemy(e) {
    if (e.dead) return;
    // Some enemies get a say in their own death (Globin reforms, Boom Fly
    // detonates). Returning true means "not actually dead".
    if (e.def.onDeath && e.def.onDeath(e, this) === true) return;
    e.dead = true;
    this.stats.kills++;
    Sfx.splat();
    Shake.add(e.boss ? 18 : 5, e.boss ? 0.6 : 0.16);
    this.parts.burst(e.x, e.y, e.boss ? 60 : 18, BLOOD, { spd: e.boss ? 340 : 220, size: e.boss ? 7 : 4.5 });
    this.parts.burst(e.x, e.y, e.boss ? 30 : 8, e.def.gore, { spd: e.boss ? 260 : 170, size: e.boss ? 6 : 4 });
    // permanent blood mark on the floor
    for (let i = 0; i < (e.boss ? 7 : 2); i++) {
      this.room.decals.push({
        x: e.x + (Math.random() - 0.5) * e.r * 2.4,
        y: e.y + (Math.random() - 0.5) * e.r * 1.6,
        r: (e.boss ? 26 : 13) + Math.random() * 16,
        seed: Math.random() * 6.28,
        alpha: 0.3 + Math.random() * 0.25,
      });
    }
    if (e.boss) {
      this.stats.bossesKilled++;
      this.slowmo = 1.2;
      this.flash = 0.5;
    } else {
      this.hitStop = Math.max(this.hitStop, 0.05);
      if (Math.random() < 0.2) this.dropPickup(e.x, e.y, Math.random() < 0.6 ? 'heart' : 'coin');
    }
  }

  /** Nearest spot that isn't inside a rock, pit or spike patch. */
  findFreeSpot(x, y, clearance = 26) {
    const ok = (px, py) => {
      if (px < IN_X0 + 26 || px > IN_X1 - 26 || py < IN_Y0 + 26 || py > IN_Y1 - 26) return false;
      for (const o of this.room.props) {
        if (o.gone) continue;
        if (!o.solid && o.kind !== 'spikes') continue;
        if (dist2(px, py, o.x, o.y) < (o.r * 0.9 + clearance) ** 2) return false;
      }
      return true;
    };
    if (ok(x, y)) return { x, y };
    for (let ring = 1; ring <= 8; ring++) {
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * TAU + ring * 0.7;
        const px = x + Math.cos(a) * ring * 30, py = y + Math.sin(a) * ring * 30;
        if (ok(px, py)) return { x: px, y: py };
      }
    }
    // last resort: sweep the interior grid
    for (let cy = 0; cy < IN_ROWS; cy++) {
      for (let cx = 0; cx < IN_COLS; cx++) {
        const c = cellCenter(cx, cy);
        if (ok(c.x, c.y)) return c;
      }
    }
    return { x: VIEW_W / 2, y: VIEW_H / 2 };
  }

  dropPickup(x, y, kind) {
    // Pickups used to be able to land inside a pit, where they were visible
    // but impossible to collect.
    const s = this.findFreeSpot(clamp(x, IN_X0 + 26, IN_X1 - 26), clamp(y, IN_Y0 + 26, IN_Y1 - 26));
    this.room.pickups.push({
      kind, x: s.x, y: s.y,
      r: 13, sub: kind === 'heart' ? (Math.random() < 0.4 ? 'half' : 'full') : null,
    });
  }

  onItemTaken(item) {
    this.stats.itemsPicked++;
    this.toasts.push({ text: item.name, sub: item.desc, t: 3.2 });
    Sfx.item();
    this.flash = 0.22;
    this.parts.burst(this.player.x, this.player.y - 12, 26, '#ffe9a8', { spd: 220, size: 4, grav: 120 });
  }

  onRoomCleared() {
    const room = this.room;
    room.cleared = true;
    this.refreshDoors();
    Sfx.door();
    if (room.type === 'boss') {
      // Boss reward: a guaranteed collectible, plus the way down.
      this.bossDead = true;
      const ps = this.findFreeSpot(VIEW_W / 2 - 80, VIEW_H / 2, 34);
      const ts = this.findFreeSpot(VIEW_W / 2 + 80, VIEW_H / 2, 34);
      room.props.push({
        kind: 'pedestal', x: ps.x, y: ps.y, r: 20, solid: false,
        itemId: this.itemPool.next().id,
      });
      this.trapdoor = {
        kind: 'trapdoor', x: ts.x, y: ts.y, r: 26, solid: false,
        final: this.floorIndex >= MAX_FLOOR,
      };
      room.props.push(this.trapdoor);
      this.dropPickup(VIEW_W / 2, VIEW_H / 2 + 90, 'heart');
      this.toasts.push({
        text: this.floorIndex >= MAX_FLOOR ? '最终 BOSS 已击败!' : 'BOSS 已击败',
        sub: this.floorIndex >= MAX_FLOOR ? '踏入活板门通关' : '拿走道具, 踏入活板门下一层',
        t: 4,
      });
    } else if (Math.random() < 0.6) {
      this.dropPickup(VIEW_W / 2, VIEW_H / 2, Math.random() < 0.55 ? 'heart' : 'coin');
    }
  }

  descend() {
    if (this.trapdoor && this.trapdoor.final) {
      this.state = STATE.WIN;
      Sfx.win();
      return;
    }
    this.flash = 0.4;
    Shake.add(8, 0.3);
    this.loadFloor(this.floorIndex + 1);
    this.state = STATE.PLAY;
  }

  /* ------------------------------------------------------------------ tick */
  update(dtRaw, input) {
    this.time += dtRaw;
    this.titleT += dtRaw;

    if (this.state === STATE.TITLE) { this.parts.update(dtRaw); return; }
    if (this.paused) return;

    if (this.state === STATE.TRANS) {
      this.trans.k += dtRaw / this.trans.dur;
      this.parts.update(dtRaw);
      if (this.trans.k >= 1) { this.trans = null; this.state = STATE.PLAY; }
      return;
    }
    if (this.state === STATE.DEAD || this.state === STATE.WIN) {
      this.parts.update(dtRaw);
      Shake.update(dtRaw);
      return;
    }

    // Slow motion punch when a boss dies, plus a couple of frozen frames on
    // impact — cheap, and it is most of what makes hits feel like they land.
    let dt = dtRaw;
    if (this.slowmo > 0) { this.slowmo -= dtRaw; dt = dtRaw * 0.35; }
    if (this.hitStop > 0) { this.hitStop -= dtRaw; dt *= 0.06; }
    this.elapsed += dtRaw;
    this.flash = Math.max(0, this.flash - dtRaw * 2.4);

    const p = this.player;
    p.update(dt, input, this);
    this.collidePlayer();

    /* ---- enemies ---- */
    for (const e of this.enemies) {
      if (e.dead) continue;
      e.animT += dt;
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      e._orbCd = Math.max(0, (e._orbCd || 0) - dt);
      if (e.spawnT > 0) {
        e.spawnT -= dt;
        e.vx *= 1 - 8 * dt; e.vy *= 1 - 8 * dt;
        e.x += e.vx * dt; e.y += e.vy * dt;
        continue;                        // no AI, no contact damage yet
      }
      // Poison ticks whether or not the enemy is doing anything.
      if (e.poison > 0) {
        e.poison -= dt;
        e.poisonAcc = (e.poisonAcc || 0) + (e.poisonDps || 2) * dt;
        if (e.poisonAcc >= 1) {
          const n = Math.floor(e.poisonAcc);
          e.poisonAcc -= n;
          this.damageEnemy(e, n, e.x, e.y - 20, 0);
          this.parts.spawn({
            x: e.x + (Math.random() - 0.5) * e.r, y: e.y - e.r * 0.4,
            vx: 0, vy: -30, life: 0.5, size: 3, color: '#8fc47a', grav: -20, drag: 2,
          });
          if (e.dead) continue;
        }
      }
      e.slowT = Math.max(0, (e.slowT || 0) - dt);

      e.def.ai(e, dt, this);
      const slowK = e.slowT > 0 ? 0.45 : 1;
      e.x += e.vx * dt * slowK;
      e.y += e.vy * dt * slowK;
      this.confine(e, e.flying);
      updateSegs(e);
      // Contact damage. A boss's body only hurts while it is actually throwing
      // itself around — standing next to an idling Monstro is survivable, the
      // danger is his hop and his slam, both of which are telegraphed.
      // `e.aggro` is what the newer bosses set; the original two are still
      // driven off their state names.
      const bossAggro = e.boss
        && (e.aggro || ['hop', 'slamDown', 'dash'].includes(e.state))
        && e.airH < 24;
      const harmless = e.def.immuneWhile && e.def.immuneWhile(e);
      if ((!e.boss || bossAggro) && !harmless) {
        if (enemyTouchesPlayer(e, p)) {
          if (p.takeDamage(e.contact, this, e.x, e.y, 'contact:' + e.type)) this.stats.damageTaken += e.contact;
        }
      }
    }
    this.separateEnemies(dt);
    this.checkRoomClear();

    /* ---- projectiles ---- */
    this.updateTears(dt);
    this.updateEnemyTears(dt);
    this.updateLasers(dt);
    // Projectiles resolve after the enemy pass, so a killing blow from a tear
    // has to be reaped here too — otherwise the room stays "uncleared" (doors
    // shut, no enemies) for a frame.
    this.checkRoomClear();

    /* ---- pickups & interactables ---- */
    this.updatePickups();

    this.parts.update(dtRaw);
    Shake.update(dtRaw);
    for (let i = this.toasts.length - 1; i >= 0; i--) {
      this.toasts[i].t -= dtRaw;
      if (this.toasts[i].t <= 0) this.toasts.splice(i, 1);
    }
    if (this.banner) { this.banner.t -= dtRaw; if (this.banner.t <= 0) this.banner = null; }

    if (p.dead && this.state === STATE.PLAY) {
      this.state = STATE.DEAD;
      Sfx.lose();
      Shake.add(16, 0.6);
      this.parts.burst(p.x, p.y, 50, BLOOD, { spd: 300, size: 6 });
    }
    if (this.state === STATE.PLAY && !p.dead) this.tryDoor();
  }

  checkRoomClear() {
    const before = this.enemies.length;
    if (!before) return;
    this.enemies = this.enemies.filter(e => !e.dead);
    if (this.enemies.length === 0 && !this.room.cleared) this.onRoomCleared();
  }

  /* ---------------------------------------------------------- collisions */
  confine(ent, flying) {
    ent.x = clamp(ent.x, IN_X0 + ent.r, IN_X1 - ent.r);
    ent.y = clamp(ent.y, IN_Y0 + ent.r, IN_Y1 - ent.r);
    if (flying || ent.boss) return;
    for (const o of this.room.props) {
      if (!o.solid) continue;
      const rr = o.r * 0.86 + ent.r;
      const d = dist(ent.x, ent.y, o.x, o.y);
      if (d < rr && d > 0.001) {
        const n = norm(ent.x - o.x, ent.y - o.y);
        ent.x = o.x + n.x * rr;
        ent.y = o.y + n.y * rr;
        if (ent.vx !== undefined) {
          const dot = ent.vx * n.x + ent.vy * n.y;
          if (dot < 0) { ent.vx -= n.x * dot; ent.vy -= n.y * dot; }
        }
      }
    }
  }

  collidePlayer() {
    const p = this.player;
    // Walls, but allow poking into an open doorway so the door can trigger.
    const inDoorLane = {
      up: this.room.doors.up && this.room.doors.up.open && Math.abs(p.x - VIEW_W / 2) < 44,
      down: this.room.doors.down && this.room.doors.down.open && Math.abs(p.x - VIEW_W / 2) < 44,
      left: this.room.doors.left && this.room.doors.left.open && Math.abs(p.y - VIEW_H / 2) < 44,
      right: this.room.doors.right && this.room.doors.right.open && Math.abs(p.y - VIEW_H / 2) < 44,
    };
    if (!inDoorLane.left) p.x = Math.max(p.x, IN_X0 + p.r);
    if (!inDoorLane.right) p.x = Math.min(p.x, IN_X1 - p.r);
    if (!inDoorLane.up) p.y = Math.max(p.y, IN_Y0 + p.r);
    if (!inDoorLane.down) p.y = Math.min(p.y, IN_Y1 - p.r);
    // hard cap so he can never leave the canvas
    p.x = clamp(p.x, 22, VIEW_W - 22);
    p.y = clamp(p.y, 22, VIEW_H - 22);

    for (const o of this.room.props) {
      if (o.kind === 'spikes') {
        if (o.up && dist2(p.x, p.y, o.x, o.y) < (o.r * 0.62 + p.r) ** 2) {
          if (p.takeDamage(o.dmg, this, o.x, o.y, 'spikes')) this.stats.damageTaken += o.dmg;
        }
        continue;
      }
      if (!o.solid) continue;
      if (o.kind === 'pit' && p.flags.flight) continue;
      // A slim collision radius matters here: two diagonally adjacent pits
      // must leave a gap wide enough to slip through, or the player can get
      // pinned inside a pit field.
      const rr = o.r * 0.76 + p.r;
      const d = dist(p.x, p.y, o.x, o.y);
      if (d < rr && d > 0.001) {
        const n = norm(p.x - o.x, p.y - o.y);
        p.x = o.x + n.x * rr;
        p.y = o.y + n.y * rr;
        const dot = p.vx * n.x + p.vy * n.y;
        if (dot < 0) { p.vx -= n.x * dot; p.vy -= n.y * dot; }
      }
    }
  }

  separateEnemies(dt) {
    const es = this.enemies;
    for (let i = 0; i < es.length; i++) {
      const a = es[i];
      if (a.boss || a.dead) continue;
      for (let j = i + 1; j < es.length; j++) {
        const b = es[j];
        if (b.boss || b.dead) continue;
        const rr = (a.r + b.r) * 0.88;
        const d = dist(a.x, a.y, b.x, b.y);
        if (d < rr && d > 0.001) {
          const n = norm(a.x - b.x, a.y - b.y);
          const push = (rr - d) * 0.5;
          a.x += n.x * push; a.y += n.y * push;
          b.x -= n.x * push; b.y -= n.y * push;
        }
      }
    }
  }

  splashTear(t, enemy) {
    this.parts.burst(t.x, t.y - (t.h || 0), enemy ? 6 : 7, enemy ? '#d43a3a' : '#bfe4fb',
      { spd: 110, size: t.r * 0.55, life: 0.32, grav: 260 });
  }

  updateTears(dt) {
    const out = [];
    for (const t of this.tears) {
      t.t += dt;
      t.life -= dt;
      t.h = Math.max(0, (t.h || 0) - dt * 4);

      if (t.homing) {
        let best = null, bd = 1e9;
        for (const e of this.enemies) {
          if (e.dead) continue;
          const d = dist2(t.x, t.y, e.x, e.y);
          if (d < bd && d < 340 * 340) { bd = d; best = e; }
        }
        if (best) {
          const n = norm(best.x - t.x, best.y - t.y);
          const sp = Math.hypot(t.vx, t.vy) || 1;
          t.vx = lerp(t.vx, n.x * sp, dt * 6.5);
          t.vy = lerp(t.vy, n.y * sp, dt * 6.5);
        }
      }
      if (t.boomerang) {
        if (!t.returning && t.t > t.maxLife * 0.45) { t.returning = true; t.life = t.maxLife * 0.9; t.hit.clear(); }
        if (t.returning) {
          const p = this.player;
          const n = norm(p.x - t.x, p.y - t.y);
          const sp = Math.hypot(t.vx, t.vy) || 1;
          t.vx = lerp(t.vx, n.x * sp, dt * 7);
          t.vy = lerp(t.vy, n.y * sp, dt * 7);
          if (dist2(t.x, t.y, p.x, p.y) < 400) t.life = 0;
        }
      }

      t.x += t.vx * dt;
      t.y += t.vy * dt;

      let dead = t.life <= 0;
      // Rubber Cement: ricochet off the walls instead of splashing on them.
      const lo = t.r * 0.4;
      if (!dead && t.bounce > 0) {
        let bounced = false;
        if (t.x < IN_X0 + lo && t.vx < 0) { t.x = IN_X0 + lo; t.vx *= -1; bounced = true; }
        if (t.x > IN_X1 - lo && t.vx > 0) { t.x = IN_X1 - lo; t.vx *= -1; bounced = true; }
        if (t.y < IN_Y0 + lo && t.vy < 0) { t.y = IN_Y0 + lo; t.vy *= -1; bounced = true; }
        if (t.y > IN_Y1 - lo && t.vy > 0) { t.y = IN_Y1 - lo; t.vy *= -1; bounced = true; }
        if (bounced) {
          t.bounce--;
          t.hit.clear();
          t.life = Math.max(t.life, 0.35);
          this.parts.burst(t.x, t.y, 4, t.colorHi || '#eaf6ff', { spd: 100, size: 2.6, life: 0.2 });
        }
      }
      if (t.x < IN_X0 + lo || t.x > IN_X1 - lo || t.y < IN_Y0 + lo || t.y > IN_Y1 - lo) dead = true;

      if (!dead && !t.spectral) {
        for (const o of this.room.props) {
          if (!o.blocksTears) continue;
          if (dist2(t.x, t.y, o.x, o.y) < (o.r * 0.8 + t.r) ** 2) {
            if (o.kind === 'poop') {
              o.hp--;
              this.parts.burst(t.x, t.y, 6, '#6b4a2a', { spd: 130, size: 3.6 });
              if (o.hp <= 0) {
                o.solid = false; o.blocksTears = false; o.gone = true;
                this.parts.burst(o.x, o.y, 14, '#6b4a2a', { spd: 180, size: 4.4 });
                if (Math.random() < 0.25) this.dropPickup(o.x, o.y, Math.random() < 0.6 ? 'coin' : 'heart');
              }
            }
            dead = true;
            break;
          }
        }
      }
      // Godhead's ring keeps chipping at anything the tear flies past.
      if (!dead && t.godhead) {
        t.auraCd = (t.auraCd || 0) - dt;
        if (t.auraCd <= 0) {
          t.auraCd = 0.12;
          for (const e of this.enemies) {
            if (e.dead) continue;
            if (dist2(t.x, t.y, e.x, e.y) < (e.r + 34) ** 2) {
              this.damageEnemy(e, t.dmg * 0.14, t.x, t.y, 0);
            }
          }
        }
      }
      if (!dead) {
        for (const e of this.enemies) {
          if (e.dead || t.hit.has(e)) continue;
          if (e.boss && e.airH > 60) continue;     // can't hit him mid-flight
          const hp = enemyHitPoint(e, t.x, t.y, t.r);
          if (hp) {
            this.damageEnemy(e, this.tearDamage(t), t.x, t.y, t.knockback);
            this.applyTearStatus(t, e);
            t.hit.add(e);
            if (!t.piercing && !t.boomerang) { dead = true; break; }
          }
        }
      }
      if (dead) { this.splashTear(t, false); this.onTearEnd(t); } else out.push(t);
    }
    this.tears = out;
  }

  /** Distance-scaled damage for A Lump of Coal / Proptosis. */
  tearDamage(t) {
    if (!t.coal && !t.proptosis) return t.dmg;
    const k = clamp(t.t / Math.max(0.001, t.maxLife), 0, 1);
    if (t.proptosis) return t.dmg * (3 - k * 2.4);
    return t.dmg * (1 + k * 0.9 * t.coal);
  }

  applyTearStatus(t, e) {
    if (t.poison) {
      e.poison = Math.max(e.poison || 0, 3);
      e.poisonDps = Math.max(e.poisonDps || 0, t.poison);
    }
    if (t.slow) e.slowT = Math.max(e.slowT || 0, 2.2);
  }

  /** Ipecac blast and The Parasite's split both happen where the tear stops. */
  onTearEnd(t) {
    if (t.explosive) {
      Shake.add(10, 0.26);
      Sfx.splat();
      this.parts.ring(t.x, t.y, 20, '#ffb050', 300, 6);
      this.parts.burst(t.x, t.y, 20, '#8fc44a', { spd: 280, size: 5 });
      for (const e of this.enemies) {
        if (e.dead) continue;
        if (dist2(t.x, t.y, e.x, e.y) < (e.r + 78) ** 2) {
          this.damageEnemy(e, t.dmg * 0.9, t.x, t.y, 180);
        }
      }
      // your own bombs can hurt you, exactly like the real Ipecac
      if (dist(t.x, t.y, this.player.x, this.player.y) < 66) {
        this.player.takeDamage(1, this, t.x, t.y, 'ipecac');
      }
    }
    if (t.split && !t.isChild) {
      const a0 = Math.atan2(t.vy, t.vx);
      for (const off of [-0.9, 0.9]) {
        const a = a0 + off;
        this.tears.push({
          ...t,
          isChild: true, split: false, explosive: false,
          x: t.x, y: t.y,
          vx: Math.cos(a) * 380, vy: Math.sin(a) * 380,
          dmg: t.dmg * 0.55, r: t.r * 0.7,
          life: 0.4, maxLife: 0.4, t: 0, h: 0,
          hit: new Set(), returning: false,
        });
      }
    }
  }

  updateEnemyTears(dt) {
    const p = this.player;
    const out = [];
    for (const t of this.enemyTears) {
      t.t += dt; t.life -= dt;
      if (t.homing) {
        // Homing shots only steer for the first second, otherwise they are
        // impossible to shake and the fight stops being about movement.
        if (t.t < 1.1) {
          const n = norm(p.x - t.x, p.y - t.y);
          const sp = Math.hypot(t.vx, t.vy) || 1;
          t.vx = lerp(t.vx, n.x * sp, dt * t.homing);
          t.vy = lerp(t.vy, n.y * sp, dt * t.homing);
        }
      }
      if (t.curve) {
        const a = Math.atan2(t.vy, t.vx) + t.curve * dt;
        const sp = Math.hypot(t.vx, t.vy);
        t.vx = Math.cos(a) * sp; t.vy = Math.sin(a) * sp;
      }
      t.x += t.vx * dt; t.y += t.vy * dt;
      let dead = t.life <= 0;
      if (t.x < IN_X0 + 2 || t.x > IN_X1 - 2 || t.y < IN_Y0 + 2 || t.y > IN_Y1 - 2) dead = true;
      if (!dead) for (const o of this.room.props) {
        if (o.blocksTears && dist2(t.x, t.y, o.x, o.y) < (o.r * 0.8 + t.r) ** 2) { dead = true; break; }
      }
      if (!dead && dist2(t.x, t.y, p.x, p.y) < (p.r * 0.88 + t.r) ** 2) {
        if (p.takeDamage(t.dmg, this, t.x, t.y, 'tear')) this.stats.damageTaken += t.dmg;
        dead = true;
      }
      if (dead) this.splashTear(t, true); else out.push(t);
    }
    this.enemyTears = out;
  }

  updateLasers(dt) {
    const out = [];
    for (const l of this.lasers) {
      l.life -= dt;
      l.len = lerp(l.len, l.targetLen, Math.min(1, dt * 22));
      l.tickCd -= dt;
      if (l.tickCd <= 0) {
        l.tickCd = 0.07;
        if (l.enemy) {
          const p = this.player;
          const rx = p.x - l.x, ry = p.y - l.y;
          const along = rx * l.dx + ry * l.dy;
          const perp = Math.abs(rx * -l.dy + ry * l.dx);
          if (along > -p.r && along < l.len && perp < l.w * 0.8 + p.r * 0.5) {
            if (p.takeDamage(l.dmg, this, l.x, l.y, 'laser')) this.stats.damageTaken += l.dmg;
          }
        } else {
          for (const e of this.enemies) {
            if (e.dead) continue;
            // project the enemy onto the beam axis
            const rx = e.x - l.x, ry = e.y - l.y;
            const along = rx * l.dx + ry * l.dy;
            const perp = Math.abs(rx * -l.dy + ry * l.dx);
            if (along > -e.r && along < l.len && perp < l.w + e.r * 0.8) {
              this.damageEnemy(e, l.dmg, l.x, l.y, 40);
            }
          }
        }
      }
      if (l.life > 0) out.push(l);
    }
    this.lasers = out;
  }

  updatePickups() {
    const p = this.player;
    const room = this.room;
    for (let i = room.pickups.length - 1; i >= 0; i--) {
      const k = room.pickups[i];
      // Magneto drags loose pickups toward you.
      if (p.flags.magnet) {
        const d2 = dist2(p.x, p.y, k.x, k.y);
        if (d2 < p.flags.magnet ** 2 && d2 > 1) {
          const n = norm(p.x - k.x, p.y - k.y);
          const pull = 260 * (1 / 60);
          k.x += n.x * pull; k.y += n.y * pull;
        }
      }
      if (dist2(p.x, p.y, k.x, k.y) < (p.r + k.r) ** 2) {
        if (k.kind === 'heart') {
          if (p.hp >= p.stats.maxHp) continue;      // leave it if we're full
          p.heal(k.sub === 'half' ? 1 : 2);
          Sfx.pickup();
          this.parts.burst(k.x, k.y, 10, '#e0303f', { spd: 130, size: 3.6 });
        } else {
          p.coins++; this.stats.coins++;
          Sfx.pickup();
          this.parts.burst(k.x, k.y, 8, '#e7c351', { spd: 130, size: 3.2 });
        }
        room.pickups.splice(i, 1);
      }
    }
    for (const o of room.props) {
      if (o.gone) continue;
      if (o.kind === 'pedestal') {
        if (!o.itemId && !o.taken) o.itemId = this.itemPool.next().id;
        if (o.itemId && dist2(p.x, p.y, o.x, o.y - 12) < (p.r + 22) ** 2) {
          const item = ITEM_BY_ID[o.itemId];
          o.itemId = null; o.taken = true;
          p.addItem(item, this);
        }
      } else if (o.kind === 'chest') {
        if (!o.opened && dist2(p.x, p.y, o.x, o.y) < (p.r + 22) ** 2) {
          o.opened = true;
          Sfx.pickup();
          Shake.add(4, 0.14);
          this.parts.burst(o.x, o.y - 6, 18, '#e7c351', { spd: 200, size: 4 });
          const roll = Math.random();
          if (o.kindOf === 'gold' || roll < 0.34) {
            // spawn a collectible on a pedestal that pops out of the chest
            room.props.push({
              kind: 'pedestal', x: o.x, y: o.y + 34, r: 20, solid: false,
              itemId: this.itemPool.next().id,
            });
          } else if (roll < 0.7) {
            this.dropPickup(o.x - 20, o.y + 30, 'coin');
            this.dropPickup(o.x + 20, o.y + 30, 'coin');
          } else {
            this.dropPickup(o.x, o.y + 30, 'heart');
          }
        }
      } else if (o.kind === 'shopItem') {
        if (o.sold) continue;
        if (o.offer === 'item' && !o.itemId) o.itemId = this.itemPool.next().id;
        if (dist2(p.x, p.y, o.x, o.y - 12) < (p.r + 22) ** 2) {
          if (p.coins >= o.price) {
            p.coins -= o.price;
            o.sold = true;
            this.stats.bought++;
            if (o.offer === 'heart') {
              p.addMaxHp(2); p.heal(99);
              this.toasts.push({ text: '买下了一颗心', sub: `生命上限 +1  ·  -${o.price} 金币`, t: 3 });
              Sfx.item();
            } else {
              p.addItem(ITEM_BY_ID[o.itemId], this);
            }
            this.parts.burst(o.x, o.y - 10, 18, '#e7c351', { spd: 200, size: 4 });
          } else if (!o.nagT || this.elapsed - o.nagT > 2) {
            o.nagT = this.elapsed;
            this.toasts.push({ text: '金币不够', sub: `需要 ${o.price} 金币，你有 ${p.coins}`, t: 2 });
          }
        }
      } else if (o.kind === 'trapdoor') {
        if (dist2(p.x, p.y, o.x, o.y) < (p.r + 20) ** 2) this.descend();
      }
    }
  }

  /* --------------------------------------------------------------- render */
  render() {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);

    if (this.state === STATE.TITLE) { this.renderTitle(ctx); return; }

    if (this.state === STATE.TRANS) {
      const k = 1 - Math.pow(1 - clamp(this.trans.k, 0, 1), 3);
      const v = DIR_VEC[this.trans.dir];
      ctx.save();
      ctx.translate(-v.x * VIEW_W * k, -v.y * VIEW_H * k);
      ctx.drawImage(this.snapCv, 0, 0);
      ctx.restore();
      ctx.save();
      ctx.translate(v.x * VIEW_W * (1 - k), v.y * VIEW_H * (1 - k));
      this.renderWorld(ctx);
      ctx.restore();
      this.renderHud(ctx);
      return;
    }

    ctx.save();
    ctx.translate(Shake.x, Shake.y);
    this.renderWorld(ctx);
    ctx.restore();
    this.renderHud(ctx);

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,240,220,${this.flash * 0.5})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    if (this.state === STATE.DEAD || this.state === STATE.WIN) {
      ctx.fillStyle = this.state === STATE.WIN ? 'rgba(30,20,8,0.55)' : 'rgba(40,0,0,0.55)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }

  renderWorld(ctx) {
    const room = this.room, T = this.theme;

    // floor
    if (room.floorCv) ctx.drawImage(room.floorCv, 0, 0);
    // blood decals accumulated in this room
    for (const d of room.decals) {
      ctx.globalAlpha = d.alpha;
      ctx.fillStyle = BLOOD_DK;
      blob(ctx, d.x, d.y, d.r, d.seed, 9);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // pits render into the floor
    for (const o of room.props) if (o.kind === 'pit') drawPit(ctx, o, T);
    for (const o of room.props) if (o.kind === 'spikes') drawSpikes(ctx, o);

    // walls + doors
    drawWalls(ctx, room, T);
    for (const d of DIRS) {
      const door = room.doors[d];
      if (door) drawDoor(ctx, d, door.kind, door.open, T);
    }

    // start-room control hint painted on the floor
    if (room.type === 'start' && this.floorIndex === 1) this.renderFloorHint(ctx);

    // depth-sorted scene contents
    const items = [];
    for (const o of room.props) {
      if (o.gone || o.kind === 'pit' || o.kind === 'spikes') continue;
      items.push({ y: o.y, f: () => {
        if (o.kind === 'rock') drawRock(ctx, o, T);
        else if (o.kind === 'poop') drawPoop(ctx, o);
        else if (o.kind === 'pedestal') drawPedestal(ctx, o, this.time, o.itemId ? ITEM_BY_ID[o.itemId] : null);
        else if (o.kind === 'shopItem') drawShopItem(ctx, o, this.time, o.itemId ? ITEM_BY_ID[o.itemId] : null, this.player.coins);
        else if (o.kind === 'chest') drawChest(ctx, o, this.time);
        else if (o.kind === 'trapdoor') drawTrapdoor(ctx, o, this.time);
      } });
    }
    for (const k of room.pickups) {
      items.push({ y: k.y, f: () => {
        if (k.kind === 'heart') drawHeartPickup(ctx, { x: k.x, y: k.y, kind: k.sub }, this.time);
        else drawCoin(ctx, k, this.time);
      } });
    }
    for (const e of this.enemies) {
      if (e.dead) continue;
      items.push({ y: e.y + (e.boss ? 40 : 0), f: () => {
        if (e.boss && e.shadowMark) {
          // landing marker for Monstro's slam
          ctx.strokeStyle = 'rgba(255,80,80,0.75)'; ctx.lineWidth = 4;
          ctx.setLineDash([10, 8]);
          ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 20, 0, TAU); ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(255,60,60,0.16)';
          ctx.beginPath(); ctx.arc(e.x, e.y, e.r + 20, 0, TAU); ctx.fill();
        }
        if (e.spawnT > 0) {
          // materialising: rises out of the floor and fades in
          const k = 1 - e.spawnT / (e.boss ? 0.9 : 0.55);
          ctx.save();
          ctx.globalAlpha = clamp(k * 1.6, 0, 1);
          ctx.translate(e.x, e.y + (1 - k) * 14);
          ctx.scale(0.6 + k * 0.4, 0.6 + k * 0.4);
          ctx.translate(-e.x, -e.y);
          e.def.draw(ctx, e);
          ctx.restore();
          ctx.strokeStyle = `rgba(255,220,180,${(1 - k) * 0.5})`;
          ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.arc(e.x, e.y, e.r * (1 + (1 - k) * 0.9), 0, TAU); ctx.stroke();
        } else {
          enemyFlash(ctx, e, () => e.def.draw(ctx, e));
        }
      } });
    }
    if (!this.player.dead) {
      items.push({ y: this.player.y, f: () => drawPlayer(ctx, this.player) });
    }
    for (const fam of this.player.familiars) {
      items.push({ y: fam.y, f: () => drawFamiliar(ctx, fam) });
    }
    items.sort((a, b) => a.y - b.y);
    for (const it of items) it.f();

    // projectiles above everything in the room
    for (const l of this.lasers) drawLaser(ctx, l);
    for (const t of this.tears) drawTear(ctx, t);
    for (const t of this.enemyTears) drawTear(ctx, t);

    this.parts.draw(ctx);

    // brimstone charge tell around the player
    const p = this.player;
    if (p.flags.brimstone && p.brimCharge > 0.08) {
      const k = Math.min(1, p.brimCharge / 0.62);
      ctx.strokeStyle = `rgba(220,40,50,${0.35 + k * 0.5})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(p.x, p.y - 8, 24 + (1 - k) * 12, -Math.PI / 2, -Math.PI / 2 + k * TAU); ctx.stroke();
    }

    drawVignette(ctx, T);
    drawGrain(ctx, 0.045);
  }

  renderFloorHint(ctx) {
    const touch = window.__touchMode;
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#e8dcc0';
    ctx.font = 'bold 22px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(touch ? '左侧摇杆  移动' : 'W A S D  移动', VIEW_W / 2, IN_Y0 + 62);
    ctx.fillText(touch ? '右侧按钮  射击' : '↑ ↓ ← →  射击', VIEW_W / 2, IN_Y1 - 44);
    ctx.restore();
  }

  /* ------------------------------------------------------------------ HUD */
  renderHud(ctx) {
    const p = this.player;
    if (!p) return;
    ctx.save();

    /* hearts */
    const hearts = Math.ceil(p.stats.maxHp / 2);
    for (let i = 0; i < hearts; i++) {
      const x = 26 + (i % 6) * 27, y = 24 + Math.floor(i / 6) * 26;
      const filled = p.hp - i * 2;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1.25, 1.25);
      heartPath(ctx, 0, 0, 8);
      inkFill(ctx, '#3a2020', 2.4);
      if (filled >= 2) { heartPath(ctx, 0, 0, 8); inkFill(ctx, '#e0303f', 2.4); }
      else if (filled === 1) {
        ctx.save();
        ctx.beginPath(); ctx.rect(-12, -12, 12, 24); ctx.clip();
        heartPath(ctx, 0, 0, 8); inkFill(ctx, '#e0303f', 0);
        ctx.restore();
        heartPath(ctx, 0, 0, 8); ctx.lineWidth = 2.4; ctx.strokeStyle = OUTLINE; ctx.stroke();
      }
      if (filled >= 1) { ctx.fillStyle = 'rgba(255,255,255,0.5)'; oval(ctx, -2.8, -3, 2, 1.4); ctx.fill(); }
      ctx.restore();
    }

    /* coins */
    ctx.save();
    ctx.translate(26, 24 + Math.ceil(hearts / 6) * 26 + 6);
    drawCoin(ctx, { x: 0, y: 0 }, 0.0);
    ctx.fillStyle = '#f4e7c6';
    ctx.font = 'bold 16px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('x ' + p.coins, 14, 5);
    ctx.restore();

    /* stat panel (bottom-left) */
    const px = 16, py = VIEW_H - 128;
    ctx.fillStyle = 'rgba(12,8,5,0.62)';
    ctx.strokeStyle = 'rgba(220,200,160,0.22)';
    ctx.lineWidth = 2;
    roundRect(ctx, px, py, 176, 112, 8); ctx.fill(); ctx.stroke();
    const rows = [
      ['速度', p.stats.speed / 190, p.stats.speed.toFixed(0)],
      ['射速', p.stats.fireRate / 2.8, p.stats.fireRate.toFixed(2)],
      ['伤害', p.stats.damage / 3.5, p.stats.damage.toFixed(1)],
      ['射程', p.stats.range / 430, p.stats.range.toFixed(0)],
      ['弹速', p.stats.shotSpeed / 470, p.stats.shotSpeed.toFixed(0)],
    ];
    ctx.font = '12px "Trebuchet MS", sans-serif';
    rows.forEach((r, i) => {
      const y = py + 15 + i * 20;
      ctx.fillStyle = '#cbbb95'; ctx.textAlign = 'left';
      ctx.fillText(r[0], px + 9, y + 4);
      const bx = px + 46, bw = 78;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(bx, y - 5, bw, 9);
      const k = clamp(r[1] / 2.2, 0.02, 1);
      const grd = ctx.createLinearGradient(bx, 0, bx + bw, 0);
      grd.addColorStop(0, '#6d9ec9'); grd.addColorStop(1, '#a8e0ff');
      ctx.fillStyle = r[1] > 1.02 ? grd : r[1] < 0.98 ? '#b06a6a' : '#8a9aa8';
      ctx.fillRect(bx, y - 5, bw * k, 9);
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1;
      ctx.strokeRect(bx + 0.5, y - 5.5, bw, 10);
      ctx.fillStyle = '#efe3c6'; ctx.textAlign = 'right';
      ctx.fillText(r[2], px + 168, y + 4);
    });

    /* collected items strip */
    if (p.items.length) {
      const ix = 200, iy = VIEW_H - 30;
      p.items.forEach((it, i) => {
        const col = i % 14, row = Math.floor(i / 14);
        ctx.save();
        ctx.translate(ix + col * 28, iy - row * 30);
        ctx.scale(0.62, 0.62);
        ctx.globalAlpha = 0.94;
        it.icon(ctx, 0.62);
        ctx.restore();
      });
    }

    /* minimap (top-right) */
    this.renderMinimap(ctx);

    /* floor label */
    ctx.fillStyle = 'rgba(240,228,200,0.8)';
    ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${this.plan.chapter.label}  ·  L${this.floorIndex}`, 200, 26);
    ctx.font = '13px "Trebuchet MS", sans-serif';
    ctx.fillStyle = 'rgba(210,195,165,0.65)';
    ctx.fillText(`击杀 ${this.stats.kills}   道具 ${this.stats.itemsPicked}   ${fmtTime(this.elapsed)}`, 200, 44);

    /* boss health bar */
    if (this.boss && !this.boss.dead) {
      const bw = 460, bx = (VIEW_W - bw) / 2, by = VIEW_H - 34;
      ctx.fillStyle = 'rgba(10,6,4,0.72)';
      roundRect(ctx, bx - 4, by - 4, bw + 8, 24, 5); ctx.fill();
      ctx.fillStyle = '#2a1010';
      ctx.fillRect(bx, by, bw, 16);
      const k = clamp(this.boss.hp / this.boss.maxHp, 0, 1);
      const g = ctx.createLinearGradient(bx, 0, bx + bw, 0);
      g.addColorStop(0, '#8f1420'); g.addColorStop(0.5, '#d92c2c'); g.addColorStop(1, '#ff6a5a');
      ctx.fillStyle = g;
      ctx.fillRect(bx, by, bw * k, 16);
      ctx.strokeStyle = 'rgba(240,220,180,0.5)'; ctx.lineWidth = 2;
      ctx.strokeRect(bx, by, bw, 16);
      ctx.fillStyle = '#f4e7c6'; ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.boss.def.name, VIEW_W / 2, by - 8);
    }

    /* item toasts — pinned to the top so they never cover the fight */
    this.toasts.slice(-3).forEach((t, i) => {
      const a = clamp(t.t, 0, 1) * clamp((3.2 - t.t) * 4, 0, 1);
      ctx.globalAlpha = a;
      const y = 84 + i * 40;
      ctx.textAlign = 'center';
      ctx.font = '12px "Trebuchet MS", sans-serif';
      const w = Math.max(210, ctx.measureText(t.sub).width + 70);
      ctx.fillStyle = 'rgba(10,6,4,0.8)';
      roundRect(ctx, VIEW_W / 2 - w / 2, y - 20, w, 37, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,220,140,0.3)'; ctx.lineWidth = 1.5;
      roundRect(ctx, VIEW_W / 2 - w / 2, y - 20, w, 37, 7); ctx.stroke();
      ctx.fillStyle = '#ffe9a8';
      ctx.font = 'bold 14px "Trebuchet MS", sans-serif';
      ctx.fillText(t.text, VIEW_W / 2, y - 5);
      ctx.fillStyle = '#cdbfa2';
      ctx.font = '12px "Trebuchet MS", sans-serif';
      ctx.fillText(t.sub, VIEW_W / 2, y + 11);
      ctx.globalAlpha = 1;
    });

    /* floor / boss banner */
    if (this.banner) {
      const t = this.banner.t;
      const a = clamp(t / 0.6, 0, 1) * clamp((2.6 - t) * 3, 0, 1);
      ctx.globalAlpha = a;
      ctx.textAlign = 'center';
      // soft horizontal fade instead of a hard letterbox band
      const bg = ctx.createLinearGradient(0, VIEW_H / 2 - 56, 0, VIEW_H / 2 + 44);
      bg.addColorStop(0, 'rgba(0,0,0,0)');
      bg.addColorStop(0.5, 'rgba(0,0,0,0.62)');
      bg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, VIEW_H / 2 - 56, VIEW_W, 100);
      ctx.fillStyle = '#f0e2c0';
      ctx.font = 'bold 44px "Trebuchet MS", sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 10;
      ctx.fillText(this.banner.label, VIEW_W / 2, VIEW_H / 2 + 2);
      ctx.fillStyle = '#c0ac86';
      ctx.font = '16px "Trebuchet MS", sans-serif';
      ctx.fillText(this.banner.sub, VIEW_W / 2, VIEW_H / 2 + 28);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  renderMinimap(ctx) {
    const rooms = this.plan.rooms;
    let minx = 99, miny = 99, maxx = -1, maxy = -1;
    for (const r of rooms) {
      minx = Math.min(minx, r.gx); maxx = Math.max(maxx, r.gx);
      miny = Math.min(miny, r.gy); maxy = Math.max(maxy, r.gy);
    }
    // Late floors sprawl over more grid cells, so the map shrinks to stay out
    // of the playfield instead of growing over it.
    const span = Math.max(maxx - minx + 1, maxy - miny + 1);
    const k = span >= 6 ? 0.72 : span >= 5 ? 0.85 : 1;
    const cw = Math.round(22 * k), ch = Math.round(16 * k), gap = Math.max(2, Math.round(4 * k));
    const w = (maxx - minx + 1) * (cw + gap) + 12;
    const h = (maxy - miny + 1) * (ch + gap) + 12;
    const ox = VIEW_W - w - 14, oy = 14;

    ctx.save();
    ctx.fillStyle = 'rgba(12,8,5,0.6)';
    ctx.strokeStyle = 'rgba(220,200,160,0.22)';
    ctx.lineWidth = 2;
    roundRect(ctx, ox, oy, w, h, 7); ctx.fill(); ctx.stroke();

    for (const r of rooms) {
      const x = ox + 6 + (r.gx - minx) * (cw + gap);
      const y = oy + 6 + (r.gy - miny) * (ch + gap);
      const isCur = r === this.room;
      const known = r.visited || Object.values(r.doors).some(d => d.to.visited);
      if (!known) continue;

      ctx.fillStyle = r.visited ? (isCur ? '#e6d5aa' : '#8d7c5c') : '#4a4030';
      ctx.fillRect(x, y, cw, ch);
      ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 0.5, y + 0.5, cw - 1, ch - 1);

      // connections
      ctx.strokeStyle = 'rgba(200,180,140,0.55)'; ctx.lineWidth = 2;
      for (const d of DIRS) {
        if (!r.doors[d]) continue;
        const v = DIR_VEC[d];
        ctx.beginPath();
        ctx.moveTo(x + cw / 2 + v.x * cw / 2, y + ch / 2 + v.y * ch / 2);
        ctx.lineTo(x + cw / 2 + v.x * (cw / 2 + gap), y + ch / 2 + v.y * (ch / 2 + gap));
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(x + cw / 2, y + ch / 2);
      if (r.type === 'boss') {
        ctx.fillStyle = r.cleared ? '#6b5a4a' : '#c8302e';
        oval(ctx, 0, -1, 4.5, 5); ctx.fill();
        ctx.fillStyle = '#1a1008';
        ctx.fillRect(-2.4, -2.5, 1.6, 2); ctx.fillRect(0.8, -2.5, 1.6, 2);
        ctx.fillRect(-2, 2, 4, 2);
      } else if (r.type === 'treasure') {
        ctx.fillStyle = r.cleared && r.props.every(p => p.kind !== 'pedestal' || !p.itemId) ? '#8a7a55' : '#ffd95a';
        icoStar(ctx, ctx.fillStyle, 5.5);
      } else if (r.type === 'shop') {
        const spent = r.props.every(p => p.kind !== 'shopItem' || p.sold);
        ctx.fillStyle = spent ? '#7a6a48' : '#e7c351';
        oval(ctx, 0, 0, 4.6, 4.6); ctx.fill();
        ctx.fillStyle = '#2a2010';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('$', 0, 2.6);
      } else if (r.type === 'start') {
        ctx.fillStyle = '#5c7fa8';
        ctx.fillRect(-3.5, -3.5, 7, 7);
      } else if (r.visited && !r.cleared) {
        ctx.fillStyle = '#c8302e';
        oval(ctx, 0, 0, 3, 3); ctx.fill();
      }
      ctx.restore();

      if (isCur) {
        ctx.strokeStyle = '#fff6d8'; ctx.lineWidth = 2.4;
        ctx.strokeRect(x - 1.5, y - 1.5, cw + 3, ch + 3);
      }
    }
    ctx.restore();
  }

  renderTitle(ctx) {
    const t = this.titleT;
    const T = THEMES.basement;

    // brick back wall
    const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    g.addColorStop(0, '#241a10'); g.addColorStop(0.6, '#150e08'); g.addColorStop(1, '#070402');
    ctx.fillStyle = g; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const rr = makeRng(4242);
    for (let row = 0; row < 10; row++) {
      const y = row * 54;
      for (let bx = (row % 2) * -40; bx < VIEW_W; bx += 80) {
        ctx.fillStyle = rr.chance(0.5) ? 'rgba(90,68,42,0.13)' : 'rgba(40,28,16,0.2)';
        ctx.fillRect(bx + 3, y + 3, 74, 48);
      }
    }
    // dried blood creeping up the walls
    for (let i = 0; i < 26; i++) {
      ctx.globalAlpha = 0.06 + rr() * 0.1;
      ctx.fillStyle = rr.chance(0.5) ? BLOOD_DK : '#3a1208';
      blob(ctx, rr() * VIEW_W, rr() * VIEW_H, 24 + rr() * 70, rr() * 6, 9, 0.4); ctx.fill();
    }
    ctx.globalAlpha = 1;

    // a lone doorway behind him, light spilling out
    const dx = VIEW_W / 2, dy = 342;
    ctx.fillStyle = '#0b0705';
    roundRect(ctx, dx - 62, dy - 150, 124, 152, 60); ctx.fill();
    const dg = ctx.createRadialGradient(dx, dy - 70, 6, dx, dy - 40, 190);
    dg.addColorStop(0, 'rgba(255,214,140,0.2)');
    dg.addColorStop(1, 'rgba(255,214,140,0)');
    ctx.fillStyle = dg;
    ctx.fillRect(dx - 200, dy - 220, 400, 260);
    ctx.strokeStyle = '#3a2c1a'; ctx.lineWidth = 8;
    roundRect(ctx, dx - 62, dy - 150, 124, 152, 60); ctx.stroke();

    // Isaac himself, oversized, crying on the floor
    ctx.save();
    ctx.translate(VIEW_W / 2, 296);
    ctx.scale(2.85, 2.85);
    drawPlayer(ctx, {
      x: 0, y: 0, animT: t, moving: false, headDir: 'down',
      invuln: 0, hitFlash: 0, orbitA: t * 3,
      visScale: 1, flags: { flight: false, aura: false, spots: false, halo: false, orbital: 0, brimstone: false },
    });
    ctx.restore();

    // pooling tears / blood at his feet
    ctx.fillStyle = 'rgba(120,20,26,0.32)';
    blob(ctx, VIEW_W / 2 + 4, 382, 76, 1.4, 11, 0.3); ctx.fill();
    ctx.fillStyle = 'rgba(160,205,235,0.14)';
    blob(ctx, VIEW_W / 2 - 30, 390, 40, 3.1, 9, 0.3); ctx.fill();

    drawVignette(ctx, T);
    drawGrain(ctx, 0.06);
  }
}

/* rounded rect helper (kept here because only the HUD needs it) */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
