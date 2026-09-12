/* ==========================================================================
   entities.js — player, tears, enemies, bosses.
   Health is counted in HALF hearts everywhere (6 = 3 hearts), matching Isaac.
   ========================================================================== */
'use strict';

const BASE_STATS = {
  maxHp: 8,          // 4 red hearts
  damage: 3.5,
  fireRate: 2.8,     // tears per second
  speed: 190,        // px/s
  range: 430,        // px a tear travels before splashing
  shotSpeed: 470,    // px/s
  luck: 0,
};

/* ========================================================================== */
class Player {
  constructor() {
    this.x = VIEW_W / 2; this.y = VIEW_H / 2;
    this.vx = 0; this.vy = 0;
    this.r = 15;
    this.stats = { ...BASE_STATS };
    this.hp = this.stats.maxHp;
    this.flags = {
      extraTears: 0, homing: false, piercing: false, brimstone: false,
      boomerang: false, bigTear: false, loki: false, flight: false, tech: false,
      orbital: 0, halo: false, aura: false, spots: false,
      visScale: 1, knockback: 0,
      // second wave of collectibles
      explosive: false, bounce: 0, poison: 0, slow: 0, spectral: false,
      crit: 0, coal: 0, split: false, proptosis: false, godhead: false,
      familiars: 0, revives: 0, magnet: 0, dmgReduce: 0, shield: false,
      float: false, mark: false,
    };
    this.shieldUp = false;
    this.familiars = [];
    this.revivedCount = 0;
    this.items = [];
    this.fireCd = 0;
    this.brimCharge = 0;
    this.invuln = 0;
    this.hitFlash = 0;
    this.animT = 0;
    this.orbitA = 0;
    this.headDir = 'down';
    this.moving = false;
    this.coins = 0;
    this.dead = false;
  }

  get visScale() { return this.flags.visScale; }
  get hearts() { return this.stats.maxHp / 2; }

  addMaxHp(halfHearts) { this.stats.maxHp += halfHearts; this.hp += halfHearts; }
  heal(halfHearts) { this.hp = Math.min(this.stats.maxHp, this.hp + halfHearts); }

  addItem(item, g) {
    this.items.push(item);
    item.apply(this);
    // Keep stats inside sane bounds so the game stays playable.
    this.stats.fireRate = clamp(this.stats.fireRate, 0.9, 14);
    this.stats.speed = clamp(this.stats.speed, 110, 380);
    this.stats.range = clamp(this.stats.range, 200, 1100);
    this.stats.shotSpeed = clamp(this.stats.shotSpeed, 300, 1050);
    this.stats.damage = clamp(this.stats.damage, 1, 90);
    if (g) g.onItemTaken(item);
  }

  takeDamage(amount, g, srcX, srcY, src) {
    if (this.invuln > 0 || this.dead) return false;
    // Holy Mantle eats the first hit of every room and then has to recharge.
    if (this.shieldUp) {
      this.shieldUp = false;
      this.invuln = 1.0;
      Sfx.tone(880, 1400, 0.2, 'triangle', 0.24);
      g.parts.ring(this.x, this.y - 6, 20, '#cfe8ff', 260, 5);
      g.toasts.push({ text: '护盾挡下了这一击', sub: '进入下一个房间后恢复', t: 1.8 });
      return false;
    }
    amount = Math.max(1, amount - this.flags.dmgReduce);
    this.hp -= amount;
    (g.dmgLog || (g.dmgLog = [])).push({ src: src || '?', amount, hp: this.hp, t: +g.elapsed.toFixed(1) });
    this.invuln = 1.25;
    this.hitFlash = 0.3;
    Shake.add(9, 0.26);
    Sfx.hurt();
    g.hitStop = Math.max(g.hitStop, 0.07);
    g.parts.burst(this.x, this.y - 6, 14, BLOOD, { spd: 210, size: 4.5 });
    if (srcX !== undefined) {
      const n = norm(this.x - srcX, this.y - srcY);
      // Hit-stun makes the knock-back actually move you: without it the
      // movement code would cancel the impulse on the very next frame, and
      // you'd get chain-hit the instant invulnerability ran out.
      this.vx = n.x * 430; this.vy = n.y * 430;
      this.hitStun = 0.2;
    }
    if (this.hp <= 0) {
      if (this.flags.revives > 0) {
        // 1UP / Dead Cat: back on your feet, briefly untouchable.
        this.flags.revives--;
        this.revivedCount++;
        this.hp = Math.max(2, Math.min(this.stats.maxHp, 2));
        this.invuln = 2.4;
        Sfx.win();
        Shake.add(14, 0.5);
        g.flash = 0.6;
        g.parts.burst(this.x, this.y - 8, 40, '#8ef0a0', { spd: 300, size: 5 });
        g.toasts.push({ text: '你又爬起来了', sub: `剩余复活次数 ${this.flags.revives}`, t: 3 });
      } else {
        this.hp = 0; this.dead = true;
      }
    }
    return true;
  }

  update(dt, input, g) {
    this.animT += dt;
    this.invuln = Math.max(0, this.invuln - dt);
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    this.fireCd = Math.max(0, this.fireCd - dt);
    this.orbitA += dt * 3.1;

    /* ---- movement: quick to start, slight slide when you let go ---- */
    this.hitStun = Math.max(0, (this.hitStun || 0) - dt);
    const mv = norm(input.mx, input.my);
    if (this.hitStun > 0) {
      this.vx *= 1 - 4 * dt;
      this.vy *= 1 - 4 * dt;
    } else {
      const targetVx = mv.x * this.stats.speed;
      const targetVy = mv.y * this.stats.speed;
      const accel = (mv.x || mv.y) ? 2600 : 2000;
      this.vx = approach(this.vx, targetVx, accel * dt);
      this.vy = approach(this.vy, targetVy, accel * dt);
    }
    this.moving = Math.hypot(this.vx, this.vy) > 24;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    /* ---- facing: shooting direction wins, otherwise movement ---- */
    if (input.shootDir) this.headDir = input.shootDir;
    else if (Math.abs(this.vx) > Math.abs(this.vy) + 12) this.headDir = this.vx > 0 ? 'right' : 'left';
    else if (Math.abs(this.vy) > 12) this.headDir = this.vy > 0 ? 'down' : 'up';

    /* ---- firing ---- */
    if (this.flags.brimstone) {
      if (input.shootDir) {
        this.brimCharge += dt;
        const need = 0.62;
        if (this.brimCharge >= need) {
          this.brimCharge = 0;
          this.fireBrimstone(input.shootDir, g);
        } else if (this.brimCharge > 0.1 && Math.random() < 0.5) {
          const v = DIR_VEC[input.shootDir];
          g.parts.spawn({
            x: this.x + v.x * 16, y: this.y - 8 + v.y * 16,
            vx: -v.x * 60 + (Math.random() - 0.5) * 40, vy: -v.y * 60 - 30,
            life: 0.22, size: 3, color: BLOOD_LT, grav: 0, drag: 1,
          });
        }
      } else this.brimCharge = Math.max(0, this.brimCharge - dt * 2);
    } else if (input.shootDir && this.fireCd <= 0) {
      this.fireTears(input.shootDir, g);
      this.fireCd = 1 / this.stats.fireRate;
    }

    this.updateFamiliars(dt, g);

    /* ---- orbital familiars deal contact damage ---- */
    if (this.flags.orbital) {
      for (let i = 0; i < this.flags.orbital; i++) {
        const a = this.orbitA + (i / this.flags.orbital) * TAU;
        const ox = this.x + Math.cos(a) * 44, oy = this.y + Math.sin(a) * 30;
        for (const e of g.enemies) {
          if (e.dead) continue;
          if (dist2(ox, oy, e.x, e.y) < (e.r + 11) ** 2) {
            if (!e._orbCd || e._orbCd <= 0) {
              g.damageEnemy(e, 2 + this.stats.damage * 0.35, ox, oy, 90);
              e._orbCd = 0.35;
            }
          }
        }
      }
    }
  }

  tearTemplate(g) {
    const f = this.flags;
    const big = f.bigTear;
    return {
      r: big ? 12 : f.tech ? 5 : 6 + Math.min(4, this.stats.damage * 0.28),
      dmg: this.stats.damage,
      piercing: f.piercing,
      homing: f.homing,
      boomerang: f.boomerang,
      tech: f.tech,
      explosive: f.explosive,
      bounce: f.bounce,
      poison: f.poison,
      slow: f.slow,
      spectral: f.spectral,
      godhead: f.godhead,
      coal: f.coal,
      proptosis: f.proptosis,
      split: f.split,
      knockback: 110 + f.knockback,
      color: f.explosive ? '#8fc44a' : f.poison ? '#8fc47a' : f.tech ? '#ff8a8a' : '#a9d4ef',
      colorHi: f.explosive ? '#d6f090' : f.poison ? '#d6f0b0' : f.tech ? '#ffe3e3' : '#eaf6ff',
    };
  }

  /** Familiars trail behind and fire on their own at whatever is closest. */
  updateFamiliars(dt, g) {
    const want = this.flags.familiars;
    while (this.familiars.length < want) {
      this.familiars.push({
        x: this.x, y: this.y, cd: Math.random() * 0.6,
        slot: this.familiars.length, t: Math.random() * 6,
      });
    }
    if (!this.familiars.length) return;
    for (const fam of this.familiars) {
      fam.t += dt;
      const side = fam.slot % 2 ? 1 : -1;
      const row = Math.floor(fam.slot / 2);
      const tx = this.x + side * (36 + row * 22);
      const ty = this.y - 14 + Math.sin(fam.t * 2.6 + fam.slot) * 5;
      fam.x = lerp(fam.x, tx, Math.min(1, dt * 6));
      fam.y = lerp(fam.y, ty, Math.min(1, dt * 6));
      fam.cd -= dt;
      if (fam.cd > 0) continue;
      let best = null, bd = 460 * 460;
      for (const e of g.enemies) {
        if (e.dead) continue;
        const d = dist2(fam.x, fam.y, e.x, e.y);
        if (d < bd) { bd = d; best = e; }
      }
      if (!best) continue;
      fam.cd = 0.62;
      const n = norm(best.x - fam.x, best.y - fam.y);
      g.tears.push({
        r: 5.5, dmg: 2 + this.stats.damage * 0.3,
        piercing: false, homing: false, boomerang: false, tech: false,
        knockback: 80, color: '#7fb8e0', colorHi: '#dcf0ff',
        x: fam.x, y: fam.y,
        vx: n.x * 430, vy: n.y * 430,
        h: 4, life: 0.95, maxLife: 0.95,
        enemy: false, hit: new Set(), t: 0, returning: false,
      });
    }
  }

  fireTears(dir, g) {
    const base = DIR_VEC[dir];
    const n = 1 + this.flags.extraTears;
    const spread = 0.13;
    const dirs = [];
    for (let i = 0; i < n; i++) {
      const off = (i - (n - 1) / 2) * spread;
      const a = Math.atan2(base.y, base.x) + off;
      dirs.push({ x: Math.cos(a), y: Math.sin(a) });
    }
    if (this.flags.loki && Math.random() < 0.25) {
      dirs.push({ x: base.y, y: -base.x }, { x: -base.y, y: base.x }, { x: -base.x, y: -base.y });
    }
    const tpl = this.tearTemplate(g);
    // Tough Love: one shot in four is a tooth, and it hurts three times as much.
    const crit = this.flags.crit > 0 && Math.random() < this.flags.crit;
    if (crit) {
      tpl.dmg *= 3;
      tpl.r *= 1.35;
      tpl.color = '#f2ebd8'; tpl.colorHi = '#ffffff';
      tpl.tooth = true;
    }
    for (const d of dirs) {
      const spd = this.stats.shotSpeed * (this.flags.bigTear ? 0.82 : 1);
      g.tears.push({
        ...tpl,
        x: this.x + d.x * 14, y: this.y - 6 + d.y * 10,
        // a touch of the player's own momentum, like the real thing
        vx: d.x * spd + this.vx * 0.28,
        vy: d.y * spd + this.vy * 0.28,
        h: 8, life: this.stats.range / this.stats.shotSpeed, maxLife: this.stats.range / this.stats.shotSpeed,
        enemy: false, hit: new Set(), t: 0, returning: false,
      });
    }
    g.parts.spawn({
      x: this.x + base.x * 16, y: this.y - 6 + base.y * 12,
      vx: base.x * 40, vy: base.y * 40 - 20,
      life: 0.16, size: 3, color: '#dff0ff', grav: 100, drag: 3,
    });
    Sfx.shoot();
  }

  fireBrimstone(dir, g) {
    const v = DIR_VEC[dir];
    g.lasers.push({
      x: this.x + v.x * 12, y: this.y - 6 + v.y * 8,
      dx: v.x, dy: v.y,
      len: 0, targetLen: Math.max(560, this.stats.range * 1.5),
      w: 11 + Math.min(9, this.stats.damage * 0.4),
      dmg: this.stats.damage * 0.55,
      life: 0.42, maxLife: 0.42,
      tickCd: 0, enemy: false,
    });
    Shake.add(7, 0.2);
    Sfx.laser();
    g.parts.burst(this.x + v.x * 18, this.y - 6 + v.y * 14, 10, BLOOD_LT, { spd: 180, size: 4 });
  }
}

/* ==========================================================================
   SHARED ENEMY / BOSS HELPERS
   ========================================================================== */

/** Ring of projectiles centred on the enemy. */
function fireRing(g, e, n, spd, dmg = 1, r = 8, offset = 0, rad = 0) {
  for (let i = 0; i < n; i++) {
    const a = offset + (i / n) * TAU;
    g.addEnemyTear(e.x + Math.cos(a) * rad, e.y + Math.sin(a) * rad,
      Math.cos(a) * spd, Math.sin(a) * spd, dmg, r);
  }
}

/** Fan of projectiles aimed at the player. */
function fireFan(g, e, n, spread, spd, dmg = 1, r = 8) {
  const a0 = Math.atan2(g.player.y - e.y, g.player.x - e.x);
  for (let i = 0; i < n; i++) {
    const a = a0 + (i - (n - 1) / 2) * spread;
    g.addEnemyTear(e.x + Math.cos(a) * 12, e.y + Math.sin(a) * 12,
      Math.cos(a) * spd, Math.sin(a) * spd, dmg, r);
  }
}

/** Trailing body segments for the worm-shaped bosses. */
function initSegs(e, count, spacing) {
  e.segCount = count;
  e.segSpacing = spacing;
  e.segs = [];
  for (let i = 0; i < count; i++) e.segs.push({ x: e.x, y: e.y + (i + 1) * spacing });
}
function updateSegs(e) {
  if (!e.segs) return;
  let px = e.x, py = e.y;
  for (const s of e.segs) {
    const dx = s.x - px, dy = s.y - py;
    const d = Math.hypot(dx, dy) || 1;
    if (d > e.segSpacing) {
      const k = (d - e.segSpacing) / d;
      s.x -= dx * k; s.y -= dy * k;
    }
    px = s.x; py = s.y;
  }
}

/** Pick a cardinal direction toward the player, preferring an aligned axis. */
function cardinalToward(e, p) {
  const dx = p.x - e.x, dy = p.y - e.y;
  if (Math.abs(dx) > Math.abs(dy)) return { x: Math.sign(dx) || 1, y: 0 };
  return { x: 0, y: Math.sign(dy) || 1 };
}

/* ==========================================================================
   ENEMY DEFINITIONS
   ========================================================================== */
const ENEMY_DEFS = {
  /* --- 1. Gaper: relentless straight-line chaser, contact damage only --- */
  gaper: {
    r: 20, hp: 7, contact: 2, flying: false, speed: 68, draw: drawGaper, gore: FLESH,
    ai(e, dt, g) {
      const p = g.player;
      const n = norm(p.x - e.x, p.y - e.y);
      // Gapers "wake up" and permanently speed up once they see you.
      if (!e.awake && dist(e.x, e.y, p.x, p.y) < 300) { e.awake = true; e.spd *= 1.35; }
      const s = e.awake ? e.spd : e.spd * 0.55;
      e.vx = approach(e.vx, n.x * s, 460 * dt);
      e.vy = approach(e.vy, n.y * s, 460 * dt);
    },
  },

  /* --- 2. Pooter: hovers at range, spits single aimed tears --- */
  pooter: {
    r: 19, hp: 6, contact: 1, flying: true, speed: 55, draw: drawPooter, gore: '#d8c4a2',
    ai(e, dt, g) {
      const p = g.player;
      const d = dist(e.x, e.y, p.x, p.y);
      const n = norm(p.x - e.x, p.y - e.y);
      e.aimX = n.x; e.aimY = n.y;
      // keep a comfortable firing distance, strafe a little
      const want = d < 165 ? -1 : d > 260 ? 1 : 0;
      e.strafe = (e.strafe || 0) + dt * 1.6;
      const sx = -n.y * Math.sin(e.strafe) * 42, sy = n.x * Math.sin(e.strafe) * 42;
      e.vx = approach(e.vx, n.x * e.spd * want + sx, 320 * dt);
      e.vy = approach(e.vy, n.y * e.spd * want + sy, 320 * dt);

      e.cd -= dt;
      if (e.tell > 0) {
        e.tell -= dt;
        if (e.tell <= 0) {
          g.addEnemyTear(e.x, e.y + 8, n.x * 250, n.y * 250, 1, 7);
          Sfx.hit();
        }
      } else if (e.cd <= 0) { e.tell = 0.45; e.cd = 1.9 + Math.random() * 0.5; }
    },
  },

  /* --- 3. Horf: immobile turret, fires a 3-tear fan --- */
  horf: {
    r: 21, hp: 10, contact: 1, flying: false, speed: 0, draw: drawHorf, gore: '#e2cfae',
    ai(e, dt, g) {
      const p = g.player;
      const n = norm(p.x - e.x, p.y - e.y);
      e.aimX = n.x; e.aimY = n.y;
      e.vx *= 0.86; e.vy *= 0.86;      // only knockback moves it
      e.cd -= dt;
      if (e.tell > 0) {
        e.tell -= dt;
        if (e.tell <= 0) {
          const a0 = Math.atan2(n.y, n.x);
          for (const off of [-0.22, 0, 0.22]) {
            const a = a0 + off;
            g.addEnemyTear(e.x, e.y + 6, Math.cos(a) * 235, Math.sin(a) * 235, 1, 7);
          }
          Sfx.hit();
          g.parts.burst(e.x, e.y + 8, 6, '#8f2b30', { spd: 120, size: 3 });
        }
      } else if (e.cd <= 0 && dist(e.x, e.y, p.x, p.y) < 460) {
        e.tell = 0.55; e.cd = 2.2 + Math.random() * 0.6;
      }
    },
  },

  /* --- 4. Attack Fly: fast, erratic, bounces, pure contact threat --- */
  fly: {
    r: 11, hp: 3, contact: 1, flying: true, speed: 152, draw: drawFly, gore: '#2b2b33',
    ai(e, dt, g) {
      const p = g.player;
      e.jitter = (e.jitter || 0) - dt;
      if (e.jitter <= 0) {
        e.jitter = 0.28 + Math.random() * 0.3;
        const n = norm(p.x - e.x, p.y - e.y);
        const a = Math.atan2(n.y, n.x) + (Math.random() - 0.5) * 1.7;
        e.tvx = Math.cos(a) * e.spd; e.tvy = Math.sin(a) * e.spd;
      }
      e.vx = approach(e.vx, e.tvx || 0, 900 * dt);
      e.vy = approach(e.vy, e.tvy || 0, 900 * dt);
      // bounce off the room edges instead of sliding along them
      if (e.x < IN_X0 + e.r && e.vx < 0) { e.vx *= -1; e.tvx = Math.abs(e.tvx); }
      if (e.x > IN_X1 - e.r && e.vx > 0) { e.vx *= -1; e.tvx = -Math.abs(e.tvx); }
      if (e.y < IN_Y0 + e.r && e.vy < 0) { e.vy *= -1; e.tvy = Math.abs(e.tvy); }
      if (e.y > IN_Y1 - e.r && e.vy > 0) { e.vy *= -1; e.tvy = -Math.abs(e.tvy); }
    },
  },

  /* --- 5. Clotty: hops slowly, fires a 4-way cardinal volley --- */
  clotty: {
    r: 22, hp: 12, contact: 2, flying: false, speed: 44, draw: drawClotty, gore: '#b8474b',
    ai(e, dt, g) {
      const p = g.player;
      const n = norm(p.x - e.x, p.y - e.y);
      e.hopCd = (e.hopCd || 0) - dt;
      if (e.hopCd <= 0) { e.hopCd = 1.25; e.vx = n.x * e.spd * 2.6; e.vy = n.y * e.spd * 2.6; }
      e.vx *= 1 - 2.4 * dt; e.vy *= 1 - 2.4 * dt;

      e.cd -= dt;
      if (e.tell > 0) {
        e.tell -= dt;
        if (e.tell <= 0) {
          for (const d of DIRS) {
            const v = DIR_VEC[d];
            g.addEnemyTear(e.x + v.x * 12, e.y + v.y * 12, v.x * 215, v.y * 215, 1, 8);
          }
          Sfx.hit();
          g.parts.burst(e.x, e.y, 8, '#8f2b30', { spd: 150, size: 3.4 });
        }
      } else if (e.cd <= 0) { e.tell = 0.5; e.cd = 2.4 + Math.random() * 0.7; }
    },
  },

  /* --- 6. Boom Fly: drifts at you and detonates when killed --- */
  boomfly: {
    r: 14, hp: 5, contact: 1, flying: true, speed: 118, draw: drawBoomFly, gore: '#26262e',
    ai(e, dt, g) {
      const p = g.player;
      // A slow, dead-straight drift that ricochets: the threat is where it
      // will be in two seconds, not where it is now.
      if (!e.tvx && !e.tvy) {
        const n = norm(p.x - e.x, p.y - e.y);
        e.tvx = n.x * e.spd; e.tvy = n.y * e.spd;
      }
      if (e.x < IN_X0 + e.r && e.tvx < 0) e.tvx = Math.abs(e.tvx);
      if (e.x > IN_X1 - e.r && e.tvx > 0) e.tvx = -Math.abs(e.tvx);
      if (e.y < IN_Y0 + e.r && e.tvy < 0) e.tvy = Math.abs(e.tvy);
      if (e.y > IN_Y1 - e.r && e.tvy > 0) e.tvy = -Math.abs(e.tvy);
      e.vx = approach(e.vx, e.tvx, 500 * dt);
      e.vy = approach(e.vy, e.tvy, 500 * dt);
    },
    onDeath(e, g) {
      Shake.add(12, 0.3);
      Sfx.splat();
      g.parts.ring(e.x, e.y, 22, '#ffb050', 320, 6);
      g.parts.burst(e.x, e.y, 22, '#ff7a30', { spd: 300, size: 5 });
      fireRing(g, e, 6, 230, 1, 8, Math.random() * TAU, 10);
      if (dist(e.x, e.y, g.player.x, g.player.y) < 84) {
        g.player.takeDamage(2, g, e.x, e.y, 'boomfly:explode');
      }
    },
  },

  /* --- 7. Hopper: crouches, then covers ground in one big leap --- */
  hopper: {
    r: 17, hp: 9, contact: 2, flying: false, speed: 0, draw: drawHopper, gore: '#c9a678',
    ai(e, dt, g) {
      const p = g.player;
      e.cd -= dt;
      if (e.airH > 0.1 || e.leap > 0) {
        e.leap -= dt;
        const k = clamp(1 - e.leap / 0.5, 0, 1);
        e.airH = Math.sin(k * Math.PI) * 46;
        if (e.leap <= 0) {
          e.airH = 0;
          e.vx *= 0.15; e.vy *= 0.15;
          g.parts.ring(e.x, e.y + 12, 8, '#8a6f4e', 140, 3.4);
        }
        return;
      }
      e.vx *= 1 - 7 * dt; e.vy *= 1 - 7 * dt;
      if (e.tell > 0) {
        e.tell -= dt;
        if (e.tell <= 0) {
          const n = norm(p.x - e.x, p.y - e.y);
          const reach = Math.min(230, dist(e.x, e.y, p.x, p.y) + 30);
          e.vx = n.x * reach / 0.5; e.vy = n.y * reach / 0.5;
          e.leap = 0.5; e.airH = 0.2;
          Sfx.tone(220, 420, 0.12, 'square', 0.12);
        }
      } else if (e.cd <= 0) { e.tell = 0.42; e.cd = 1.5 + Math.random() * 0.6; }
    },
  },

  /* --- 8. Maw: hovering mouth that spits one fat slow blob --- */
  maw: {
    r: 18, hp: 11, contact: 1, flying: true, speed: 62, draw: drawMaw, gore: '#b8676a',
    ai(e, dt, g) {
      const p = g.player;
      const d = dist(e.x, e.y, p.x, p.y);
      const n = norm(p.x - e.x, p.y - e.y);
      e.aimX = n.x; e.aimY = n.y;
      const want = d < 200 ? -1 : d > 300 ? 1 : 0;
      e.vx = approach(e.vx, n.x * e.spd * want, 300 * dt);
      e.vy = approach(e.vy, n.y * e.spd * want, 300 * dt);
      e.cd -= dt;
      if (e.tell > 0) {
        e.tell -= dt;
        if (e.tell <= 0) {
          g.addEnemyTear(e.x + n.x * 18, e.y + n.y * 18, n.x * 205, n.y * 205, 2, 13);
          Sfx.splat();
          g.parts.burst(e.x, e.y, 8, '#8f2b30', { spd: 150, size: 4 });
        }
      } else if (e.cd <= 0) { e.tell = 0.7; e.cd = 2.3 + Math.random() * 0.7; }
    },
  },

  /* --- 9. Globin: melts into goo when killed and reforms once --- */
  globin: {
    r: 19, hp: 12, contact: 2, flying: false, speed: 78, draw: drawGlobin, gore: '#a08a52',
    ai(e, dt, g) {
      if (e.downed > 0) {
        e.downed -= dt;
        e.vx = e.vy = 0;
        if (e.downed <= 0) {
          e.hp = Math.round(e.maxHp * 0.6);
          g.parts.burst(e.x, e.y, 14, '#a08a52', { spd: 170, size: 4 });
          Sfx.splat();
        }
        return;
      }
      const p = g.player;
      const n = norm(p.x - e.x, p.y - e.y);
      e.vx = approach(e.vx, n.x * e.spd, 400 * dt);
      e.vy = approach(e.vy, n.y * e.spd, 400 * dt);
    },
    /** Returning true cancels the kill — he only really dies the second time. */
    onDeath(e, g) {
      if (e.revived) return false;
      e.revived = true;
      e.downed = 2.4;
      e.hp = 1;
      e.dead = false;
      g.parts.burst(e.x, e.y, 18, '#a08a52', { spd: 200, size: 4.4 });
      Sfx.splat();
      return true;
    },
    immuneWhile(e) { return e.downed > 0; },
  },

  /* --- 10. Knight: the faceplate eats tears; you have to get behind it --- */
  knight: {
    r: 20, hp: 16, contact: 2, flying: false, speed: 62, draw: drawKnight, gore: '#c98a8a',
    ai(e, dt, g) {
      const p = g.player;
      const n = norm(p.x - e.x, p.y - e.y);
      // The plate turns slowly, which is the whole fight: strafe faster than
      // it can track and its soft back is exposed.
      const cur = Math.atan2(e.faceY || 1, e.faceX || 0);
      const want = Math.atan2(n.y, n.x);
      let diff = ((want - cur + Math.PI * 3) % TAU) - Math.PI;
      const turn = clamp(diff, -2.0 * dt, 2.0 * dt);
      const na = cur + turn;
      e.faceX = Math.cos(na); e.faceY = Math.sin(na);
      e.vx = approach(e.vx, e.faceX * e.spd, 320 * dt);
      e.vy = approach(e.vy, e.faceY * e.spd, 320 * dt);
    },
    /** Damage taken from within the frontal arc is almost entirely blocked. */
    onHit(e, dmg, sx, sy) {
      const n = norm(sx - e.x, sy - e.y);
      const facing = n.x * (e.faceX || 0) + n.y * (e.faceY || 1);
      if (facing > 0.35) {
        Sfx.tone(900, 500, 0.06, 'square', 0.1);
        return dmg * 0.08;
      }
      return dmg;
    },
  },

  /* --- 11. Vis: opens its gut and sweeps a blood laser down an axis --- */
  vis: {
    r: 24, hp: 22, contact: 2, flying: false, speed: 34, draw: drawVis, gore: '#c8a882',
    ai(e, dt, g) {
      const p = g.player;
      const n = norm(p.x - e.x, p.y - e.y);
      e.aimX = n.x; e.aimY = n.y;
      e.cd -= dt;
      if (e.tell > 0) {
        e.tell -= dt;
        e.vx *= 1 - 8 * dt; e.vy *= 1 - 8 * dt;
        if (e.tell <= 0) {
          const v = e.lockDir || n;
          g.addEnemyLaser(e.x, e.y, v.x, v.y, { dmg: 2, w: 12, life: 0.5, len: 980 });
        }
        return;
      }
      // shuffles toward the player between shots
      e.vx = approach(e.vx, n.x * e.spd, 220 * dt);
      e.vy = approach(e.vy, n.y * e.spd, 220 * dt);
      if (e.cd <= 0 && dist(e.x, e.y, p.x, p.y) < 520) {
        e.tell = 0.85;
        e.cd = 3.0 + Math.random() * 0.8;
        // locks the aim at the start of the wind-up so it can be side-stepped
        e.lockDir = { x: n.x, y: n.y };
      }
    },
  },

  /* --- BOSS: Monstro — hop, vomit, and a telegraphed body slam --- */
  monstro: {
    r: 76, hp: 160, contact: 2, flying: false, speed: 0, draw: drawMonstro, gore: '#d8bd93',
    boss: true, name: 'MONSTRO',
    init(e) { e.state = 'idle'; e.st = 0.9; e.mouth = 0; e.squash = 1; e.airH = 0; e.hops = 0; },
    ai(e, dt, g) {
      const p = g.player;
      const n = norm(p.x - e.x, p.y - e.y);
      e.aimX = n.x; e.aimY = n.y;
      e.st -= dt;
      const rage = e.hp / e.maxHp < 0.5;      // second phase
      const rk = rage ? 0.68 : 1;

      const setState = (s, t) => { e.state = s; e.st = t; };

      switch (e.state) {
        case 'idle': {
          e.vx *= 1 - 6 * dt; e.vy *= 1 - 6 * dt;
          e.mouth = approach(e.mouth, 0, dt * 3);
          e.squash = approach(e.squash, 1, dt * 3);
          if (e.st <= 0) {
            const roll = Math.random();
            if (roll < 0.42) { setState('hopCharge', 0.46 * rk); e.hops = rage ? 3 : 2; }
            else if (roll < 0.78) setState('vomitCharge', 0.55 * rk);
            else setState('slamCharge', 0.7 * rk);
          }
          break;
        }
        case 'hopCharge': {
          e.squash = approach(e.squash, 1.28, dt * 4);
          e.vx *= 1 - 8 * dt; e.vy *= 1 - 8 * dt;
          if (e.st <= 0) {
            setState('hop', 0.52);
            e.squash = 0.82;
            const sp = rage ? 400 : 330;
            e.vx = n.x * sp; e.vy = n.y * sp;
            Sfx.tone(90, 200, 0.18, 'sawtooth', 0.2);
          }
          break;
        }
        case 'hop': {
          const k = 1 - Math.max(0, e.st) / 0.52;
          e.airH = Math.sin(k * Math.PI) * 62;
          e.squash = approach(e.squash, 0.9, dt * 3);
          if (e.st <= 0) {
            e.airH = 0; e.squash = 1.22;
            e.vx *= 0.2; e.vy *= 0.2;
            Shake.add(11, 0.24);
            Sfx.splat();
            g.parts.ring(e.x, e.y + e.r * 0.7, 18, '#c8ac7e', 240, 5);
            // landing shockwave
            if (dist(e.x, e.y, p.x, p.y) < e.r * 0.75 + 32) p.takeDamage(2, g, e.x, e.y, 'monstro:hop');
            if (rage) for (let i = 0; i < 2; i++) {
              const a = Math.random() * TAU;
              g.addEnemyTear(e.x, e.y, Math.cos(a) * 210, Math.sin(a) * 210, 1, 8);
            }
            e.hops--;
            if (e.hops > 0) setState('hopCharge', 0.42 * rk);
            else setState('idle', 0.8 * rk);
          }
          break;
        }
        case 'vomitCharge': {
          e.mouth = approach(e.mouth, 1, dt * 2.6);
          e.vx *= 1 - 7 * dt; e.vy *= 1 - 7 * dt;
          if (e.st <= 0) { setState('vomit', 0.5); e.vomitT = 0; }
          break;
        }
        case 'vomit': {
          e.mouth = 1;
          e.vomitT -= dt;
          if (e.vomitT <= 0) {
            e.vomitT = 0.1;
            const a0 = Math.atan2(n.y, n.x);
            const cnt = rage ? 2 : 1;
            for (let i = 0; i < cnt; i++) {
              const a = a0 + (Math.random() - 0.5) * 1.25;
              const spd = 190 + Math.random() * 150;
              const big = Math.random() < 0.3;
              g.addEnemyTear(e.x + n.x * 30, e.y + e.r * 0.34, Math.cos(a) * spd, Math.sin(a) * spd, big ? 2 : 1, big ? 11 : 7);
            }
            Sfx.noise(0.1, 0.14, 900);
          }
          if (e.st <= 0) setState('idle', 0.75 * rk);
          break;
        }
        case 'slamCharge': {
          e.squash = approach(e.squash, 1.34, dt * 3);
          e.vx *= 1 - 8 * dt; e.vy *= 1 - 8 * dt;
          if (e.st <= 0) {
            setState('slamUp', 0.42);
            Sfx.roar();
            e.targetX = p.x; e.targetY = p.y;
          }
          break;
        }
        case 'slamUp': {
          const k = 1 - Math.max(0, e.st) / 0.42;
          e.airH = k * 420;
          e.squash = approach(e.squash, 0.78, dt * 4);
          // track the player until the last moment
          e.targetX = lerp(e.targetX, p.x, dt * 3);
          e.targetY = lerp(e.targetY, p.y, dt * 3);
          if (e.st <= 0) {
            setState('slamDown', 0.34);
            e.x = clamp(e.targetX, IN_X0 + e.r, IN_X1 - e.r);
            e.y = clamp(e.targetY, IN_Y0 + e.r, IN_Y1 - e.r);
          }
          break;
        }
        case 'slamDown': {
          const k = 1 - Math.max(0, e.st) / 0.34;
          e.airH = (1 - k * k) * 420;
          e.shadowMark = true;
          if (e.st <= 0) {
            e.airH = 0; e.squash = 1.4; e.shadowMark = false;
            Shake.add(20, 0.42);
            Sfx.splat();
            g.parts.ring(e.x, e.y + e.r * 0.6, 30, '#c8ac7e', 340, 6);
            g.parts.burst(e.x, e.y, 20, BLOOD, { spd: 260 });
            if (dist(e.x, e.y, p.x, p.y) < e.r * 0.8 + 38) p.takeDamage(2, g, e.x, e.y, 'monstro:slam');
            const cnt = rage ? 9 : 6;
            for (let i = 0; i < cnt; i++) {
              const a = (i / cnt) * TAU;
              g.addEnemyTear(e.x, e.y, Math.cos(a) * 250, Math.sin(a) * 250, 1, 9);
            }
            setState('idle', 0.7 * rk);
          }
          break;
        }
      }
    },
  },

  /* --- BOSS: Duke of Flies — swarm summoner with a spit ring and a charge --- */
  duke: {
    r: 62, hp: 140, contact: 2, flying: true, speed: 66, draw: drawDuke, gore: '#9aa06c',
    boss: true, name: 'DUKE OF FLIES',
    init(e) { e.state = 'drift'; e.st = 1.2; e.mouth = 0; },
    ai(e, dt, g) {
      const p = g.player;
      const n = norm(p.x - e.x, p.y - e.y);
      e.aimX = n.x; e.aimY = n.y;
      e.st -= dt;
      const rage = e.hp / e.maxHp < 0.5;
      const setState = (s, t) => { e.state = s; e.st = t; };

      switch (e.state) {
        case 'drift': {
          const d = dist(e.x, e.y, p.x, p.y);
          const want = d < 190 ? -0.6 : 1;
          e.vx = approach(e.vx, n.x * e.spd * want, 240 * dt);
          e.vy = approach(e.vy, n.y * e.spd * want, 240 * dt);
          e.mouth = approach(e.mouth, 0, dt * 2);
          if (e.st <= 0) {
            const roll = Math.random();
            if (roll < 0.4) setState('swarmCharge', 0.6);
            else if (roll < 0.78) setState('spitCharge', 0.5);
            else setState('dashCharge', 0.55);
          }
          break;
        }
        case 'swarmCharge': {
          e.mouth = approach(e.mouth, 1, dt * 3);
          e.vx *= 1 - 5 * dt; e.vy *= 1 - 5 * dt;
          if (e.st <= 0) {
            const cnt = rage ? 4 : 3;
            for (let i = 0; i < cnt; i++) {
              const a = (i / cnt) * TAU + Math.random();
              g.spawnEnemy('fly', e.x + Math.cos(a) * 40, e.y + Math.sin(a) * 30);
            }
            g.parts.burst(e.x, e.y + e.r * 0.4, 14, '#6b7040', { spd: 180 });
            Sfx.noise(0.22, 0.2, 1600);
            setState('drift', 1.3);
          }
          break;
        }
        case 'spitCharge': {
          e.mouth = approach(e.mouth, 1, dt * 3.4);
          e.vx *= 1 - 6 * dt; e.vy *= 1 - 6 * dt;
          if (e.st <= 0) { setState('spit', 0.36); e.burst = 0; }
          break;
        }
        case 'spit': {
          e.burst -= dt;
          if (e.burst <= 0) {
            e.burst = 0.16;
            const cnt = rage ? 8 : 7;
            const off = Math.random() * TAU;
            for (let i = 0; i < cnt; i++) {
              const a = off + (i / cnt) * TAU;
              g.addEnemyTear(e.x + Math.cos(a) * 20, e.y + Math.sin(a) * 20, Math.cos(a) * 225, Math.sin(a) * 225, 1, 8);
            }
            Sfx.hit();
          }
          if (e.st <= 0) setState('drift', 1.0);
          break;
        }
        case 'dashCharge': {
          e.vx *= 1 - 8 * dt; e.vy *= 1 - 8 * dt;
          e.mouth = approach(e.mouth, 0.4, dt * 3);
          if (e.st <= 0) {
            setState('dash', 0.55);
            const sp = rage ? 520 : 420;
            e.vx = n.x * sp; e.vy = n.y * sp;
            Sfx.tone(140, 60, 0.3, 'sawtooth', 0.22);
          }
          break;
        }
        case 'dash': {
          g.parts.spawn({
            x: e.x + (Math.random() - 0.5) * 40, y: e.y + (Math.random() - 0.5) * 40,
            vx: 0, vy: 0, life: 0.25, size: 4, color: '#6b7040', grav: 0, drag: 1,
          });
          if (e.st <= 0) setState('drift', 0.9);
          break;
        }
      }
    },
  },

  /* --- BOSS: Larry Jr. — a worm that bounces around the room --- */
  larry: {
    r: 30, hp: 190, contact: 2, flying: false, speed: 150, draw: drawLarry, gore: '#d9c59a',
    boss: true, name: 'LARRY JR.', segs: 5, segSpacing: 26, hitSegs: true,
    init(e) { initSegs(e, 5, 26); e.dir = { x: 1, y: 0 }; e.state = 'roam'; e.st = 2.2; },
    ai(e, dt, g) {
      const p = g.player;
      const rage = e.hp / e.maxHp < 0.5;
      e.aggro = true;                       // the whole worm is a hazard
      e.aimX = e.dir.x; e.aimY = e.dir.y;
      e.st -= dt;

      // Cardinal-only movement that turns at walls, exactly like the original.
      const spd = e.spd * (rage ? 1.35 : 1) * (e.state === 'lunge' ? 1.9 : 1);
      e.vx = e.dir.x * spd;
      e.vy = e.dir.y * spd;
      const m = 6;
      let bounced = false;
      if (e.x <= IN_X0 + e.r + m && e.dir.x < 0) bounced = true;
      if (e.x >= IN_X1 - e.r - m && e.dir.x > 0) bounced = true;
      if (e.y <= IN_Y0 + e.r + m && e.dir.y < 0) bounced = true;
      if (e.y >= IN_Y1 - e.r - m && e.dir.y > 0) bounced = true;
      if (bounced) {
        // Turn toward the player rather than reflecting, so he keeps pressure on.
        const c = cardinalToward(e, p);
        const away = { x: -e.dir.x, y: -e.dir.y };
        e.dir = (c.x !== e.dir.x || c.y !== e.dir.y) ? c : away;
        Sfx.tone(140, 90, 0.1, 'sawtooth', 0.12);
        g.parts.burst(e.x, e.y, 6, '#d9c59a', { spd: 130, size: 3.6 });
      }

      if (e.st <= 0) {
        if (e.state === 'lunge') { e.state = 'roam'; e.st = 1.6 + Math.random(); }
        else {
          e.state = 'lunge';
          e.st = rage ? 1.1 : 0.8;
          e.dir = cardinalToward(e, p);
          Sfx.tone(180, 70, 0.2, 'sawtooth', 0.18);
        }
      }
      // A dribble of tears out of the tail keeps corners from being safe.
      e.cd -= dt;
      if (e.cd <= 0) {
        e.cd = rage ? 1.1 : 1.8;
        const tail = e.segs[e.segs.length - 1];
        fireRing(g, { x: tail.x, y: tail.y }, rage ? 6 : 4, 190, 1, 8, Math.random() * TAU, 8);
      }
    },
  },

  /* --- BOSS: Chub — lines up on an axis and freight-trains at you --- */
  chub: {
    r: 40, hp: 240, contact: 2, flying: false, speed: 92, draw: drawChub, gore: '#c58f7a',
    boss: true, name: 'CHUB', segs: 3, segSpacing: 40, hitSegs: true,
    init(e) { initSegs(e, 3, 40); e.dir = { x: 1, y: 0 }; e.state = 'roam'; e.st = 1.4; },
    ai(e, dt, g) {
      const p = g.player;
      const rage = e.hp / e.maxHp < 0.5;
      e.st -= dt;
      const n = norm(p.x - e.x, p.y - e.y);
      e.aimX = n.x; e.aimY = n.y;
      e.aggro = e.state === 'charge';

      const wallHit = () =>
        (e.x <= IN_X0 + e.r + 6 && e.dir.x < 0) || (e.x >= IN_X1 - e.r - 6 && e.dir.x > 0) ||
        (e.y <= IN_Y0 + e.r + 6 && e.dir.y < 0) || (e.y >= IN_Y1 - e.r - 6 && e.dir.y > 0);

      switch (e.state) {
        case 'roam': {
          e.vx = e.dir.x * e.spd; e.vy = e.dir.y * e.spd;
          if (wallHit()) e.dir = cardinalToward(e, p);
          // Aligned on an axis? Wind up and charge.
          const aligned = (Math.abs(p.y - e.y) < 46 || Math.abs(p.x - e.x) < 46);
          if (aligned && e.st <= 0) {
            e.state = 'chargeUp'; e.st = rage ? 0.4 : 0.58;
            e.dir = Math.abs(p.y - e.y) < 46
              ? { x: Math.sign(p.x - e.x) || 1, y: 0 }
              : { x: 0, y: Math.sign(p.y - e.y) || 1 };
            Sfx.roar();
          }
          break;
        }
        case 'chargeUp': {
          e.vx *= 1 - 9 * dt; e.vy *= 1 - 9 * dt;
          g.parts.spawn({
            x: e.x - e.dir.x * 30 + (Math.random() - 0.5) * 30,
            y: e.y - e.dir.y * 30 + (Math.random() - 0.5) * 30,
            vx: -e.dir.x * 70, vy: -e.dir.y * 70,
            life: 0.3, size: 4, color: '#a06a52', grav: 0, drag: 2,
          });
          if (e.st <= 0) {
            e.state = 'charge'; e.st = 1.6;
            Sfx.tone(120, 60, 0.3, 'sawtooth', 0.24);
          }
          break;
        }
        case 'charge': {
          const spd = (rage ? 620 : 500);
          e.vx = e.dir.x * spd; e.vy = e.dir.y * spd;
          if (wallHit() || e.st <= 0) {
            e.state = 'roam'; e.st = rage ? 0.8 : 1.4;
            e.vx *= 0.1; e.vy *= 0.1;
            Shake.add(16, 0.34);
            Sfx.splat();
            g.parts.ring(e.x, e.y, 20, '#a06a52', 300, 6);
            fireRing(g, e, rage ? 6 : 4, 220, 1, 9, Math.random() * TAU, 20);
            for (let i = 0; i < (rage ? 2 : 1); i++) {
              g.spawnEnemy('fly', e.x + (Math.random() - 0.5) * 70, e.y + (Math.random() - 0.5) * 70);
            }
            e.dir = cardinalToward(e, p);
          }
          break;
        }
      }
    },
  },

  /* --- BOSS: Gurdy — a stationary wall of tumours and spawn --- */
  gurdy: {
    r: 62, hp: 260, contact: 2, flying: false, speed: 0, draw: drawGurdy, gore: '#9e7d5c',
    boss: true, name: 'GURDY', anchor: 'top',
    init(e) { e.state = 'idle'; e.st = 1.1; e.mouth = 0; },
    ai(e, dt, g) {
      const p = g.player;
      const n = norm(p.x - e.x, p.y - e.y);
      e.aimX = n.x; e.aimY = n.y;
      e.aggro = false;
      e.st -= dt;
      const rage = e.hp / e.maxHp < 0.5;
      // She is nailed to the top of the room; knockback only jiggles her.
      e.vx *= 1 - 10 * dt; e.vy *= 1 - 10 * dt;
      e.x = lerp(e.x, VIEW_W / 2, dt * 2.5);
      e.y = lerp(e.y, IN_Y0 + 78, dt * 2.5);

      const setState = (s, t) => { e.state = s; e.st = t; };
      switch (e.state) {
        case 'idle':
          e.mouth = approach(e.mouth, 0, dt * 3);
          if (e.st <= 0) {
            const roll = Math.random();
            if (roll < 0.4) setState('spreadCharge', 0.5);
            else if (roll < 0.72) setState('ringCharge', 0.55);
            else setState('summonCharge', 0.6);
          }
          break;
        case 'spreadCharge':
          e.mouth = approach(e.mouth, 1, dt * 3.2);
          e.tell = 0.2;
          if (e.st <= 0) { setState('spread', 0.5); e.burst = 0; e.shots = rage ? 3 : 2; }
          break;
        case 'spread':
          e.burst -= dt;
          if (e.burst <= 0 && e.shots > 0) {
            e.burst = 0.2; e.shots--;
            fireFan(g, e, 5, 0.3, 260, 1, 8);
            Sfx.hit();
          }
          if (e.st <= 0) setState('idle', rage ? 0.5 : 0.85);
          break;
        case 'ringCharge':
          e.mouth = approach(e.mouth, 1, dt * 3);
          e.tell = 0.2;
          if (e.st <= 0) { setState('ring', 0.6); e.burst = 0; e.waves = rage ? 3 : 2; }
          break;
        case 'ring':
          e.burst -= dt;
          if (e.burst <= 0 && e.waves > 0) {
            e.burst = 0.24; e.waves--;
            fireRing(g, e, rage ? 12 : 10, 215, 1, 8, e.waves * 0.28, 30);
            Sfx.hit();
          }
          if (e.st <= 0) setState('idle', rage ? 0.5 : 0.9);
          break;
        case 'summonCharge':
          e.mouth = approach(e.mouth, 1, dt * 2.6);
          if (e.st <= 0) {
            const cnt = rage ? 4 : 3;
            for (let i = 0; i < cnt; i++) {
              const t = Math.random() < 0.5 ? 'fly' : 'pooter';
              g.spawnEnemy(t, e.x + (Math.random() - 0.5) * 200, e.y + 90 + Math.random() * 60);
            }
            g.parts.burst(e.x, e.y + 40, 16, '#8a6a44', { spd: 200 });
            Sfx.noise(0.24, 0.22, 1500);
            setState('idle', 1.1);
          }
          break;
      }
      e.tell = Math.max(0, e.tell - dt);
    },
  },

  /* --- BOSS: Monstro II — Monstro with a brimstone gullet --- */
  monstroII: {
    r: 70, hp: 300, contact: 2, flying: false, speed: 0, draw: drawMonstroII, gore: '#8b8f86',
    boss: true, name: 'MONSTRO II',
    init(e) { e.state = 'idle'; e.st = 0.9; e.mouth = 0; e.squash = 1; e.airH = 0; e.hops = 0; },
    ai(e, dt, g) {
      const p = g.player;
      const n = norm(p.x - e.x, p.y - e.y);
      e.aimX = n.x; e.aimY = n.y;
      e.st -= dt;
      const rage = e.hp / e.maxHp < 0.5;
      const rk = rage ? 0.7 : 1;
      e.aggro = e.state === 'leapDown';
      const setState = (s, t) => { e.state = s; e.st = t; };

      switch (e.state) {
        case 'idle':
          e.vx *= 1 - 6 * dt; e.vy *= 1 - 6 * dt;
          e.mouth = approach(e.mouth, 0, dt * 3);
          e.squash = approach(e.squash, 1, dt * 3);
          if (e.st <= 0) {
            const roll = Math.random();
            if (roll < 0.45) { setState('leapUp', 0.42); e.hops = 2; e.first = true; }
            else if (roll < 0.8) setState('brimCharge', 0.9 * rk);
            else setState('spawnCharge', 0.6);
          }
          break;
        case 'leapUp': {
          const k = 1 - Math.max(0, e.st) / 0.42;
          e.airH = k * 400;
          e.squash = approach(e.squash, 0.8, dt * 4);
          e.targetX = p.x; e.targetY = p.y;
          if (e.st <= 0) {
            setState('leapDown', 0.32);
            e.x = clamp(e.targetX, IN_X0 + e.r, IN_X1 - e.r);
            e.y = clamp(e.targetY, IN_Y0 + e.r, IN_Y1 - e.r);
          }
          break;
        }
        case 'leapDown': {
          const k = 1 - Math.max(0, e.st) / 0.32;
          e.airH = (1 - k * k) * 400;
          e.shadowMark = true;
          if (e.st <= 0) {
            e.airH = 0; e.squash = 1.36; e.shadowMark = false;
            Shake.add(18, 0.38);
            Sfx.splat();
            g.parts.ring(e.x, e.y + e.r * 0.6, 26, '#8b8f86', 320, 6);
            if (dist(e.x, e.y, p.x, p.y) < e.r * 0.8 + 36) p.takeDamage(2, g, e.x, e.y, 'monstroII:leap');
            if (e.first) { fireRing(g, e, 8, 250, 1, 9, Math.random() * TAU, 20); e.first = false; }
            for (let i = 0; i < (rage ? 2 : 1); i++) {
              g.spawnEnemy('maw', e.x + (Math.random() - 0.5) * 140, e.y + (Math.random() - 0.5) * 100);
            }
            e.hops--;
            if (e.hops > 0) setState('leapUp', 0.4);
            else setState('idle', 0.7 * rk);
          }
          break;
        }
        case 'brimCharge':
          e.mouth = approach(e.mouth, 1, dt * 2.4);
          e.vx *= 1 - 7 * dt; e.vy *= 1 - 7 * dt;
          if (e.st <= 0) {
            setState('brim', 1.1);
            // The beam locks its start angle then sweeps, so you run around it.
            e.beamA = Math.atan2(n.y, n.x) - (rage ? 0.9 : 0.65);
            e.beamDir = Math.random() < 0.5 ? 1 : -1;
            e.beamCd = 0;
            Sfx.roar();
          }
          break;
        case 'brim': {
          e.mouth = 1;
          e.beamA += e.beamDir * dt * (rage ? 1.5 : 1.1);
          e.beamCd -= dt;
          if (e.beamCd <= 0) {
            e.beamCd = 0.12;
            g.addEnemyLaser(e.x, e.y, Math.cos(e.beamA), Math.sin(e.beamA),
              { dmg: 2, w: 13, life: 0.2, len: 980 });
          }
          if (e.st <= 0) setState('idle', 0.9 * rk);
          break;
        }
        case 'spawnCharge':
          e.mouth = approach(e.mouth, 0.7, dt * 3);
          if (e.st <= 0) {
            for (let i = 0; i < 3; i++) {
              g.spawnEnemy(Math.random() < 0.5 ? 'maw' : 'boomfly',
                e.x + (Math.random() - 0.5) * 220, e.y + (Math.random() - 0.5) * 140);
            }
            Sfx.noise(0.25, 0.24, 1400);
            setState('idle', 1.0);
          }
          break;
      }
    },
  },

  /* --- BOSS: Mom — a leg out of the ceiling, plus an eye at the door --- */
  mom: {
    r: 58, hp: 300, contact: 2, flying: true, speed: 0, draw: drawMom, gore: '#f0d9c6',
    boss: true, name: 'MOM',
    init(e) {
      e.state = 'raise'; e.st = 1.1; e.airH = 340; e.eye = null;
      e.x = VIEW_W / 2; e.y = VIEW_H / 2;
    },
    ai(e, dt, g) {
      const p = g.player;
      const n = norm(p.x - e.x, p.y - e.y);
      e.aimX = n.x; e.aimY = n.y;
      e.st -= dt;
      const rage = e.hp / e.maxHp < 0.5;
      e.aggro = e.state === 'stomp';
      e.vx = e.vy = 0;
      const setState = (s, t) => { e.state = s; e.st = t; };

      // The eye lives on its own timer at the edge of the room.
      if (e.eye) {
        e.eye.t -= dt;
        e.eye.cd -= dt;
        if (e.eye.cd <= 0) {
          e.eye.cd = rage ? 0.75 : 1.15;
          const en = norm(p.x - e.eye.x, p.y - e.eye.y);
          g.addEnemyTear(e.eye.x + en.x * 20, e.eye.y + en.y * 20, en.x * 250, en.y * 250, 1, 8);
          Sfx.hit();
        }
        if (e.eye.t <= 0) e.eye = null;
      }

      switch (e.state) {
        case 'raise': {
          const k = clamp(1 - e.st / 1.1, 0, 1);
          e.airH = 340;
          // track the player while the foot is up
          e.x = lerp(e.x, p.x, dt * 2.6);
          e.y = lerp(e.y, p.y, dt * 2.6);
          if (e.st <= 0) {
            setState('mark', rage ? 0.5 : 0.72);
            e.targetX = p.x; e.targetY = p.y;
          }
          break;
        }
        case 'mark': {
          e.airH = 340;
          e.shadowMark = true;
          e.targetX = lerp(e.targetX, p.x, dt * 1.6);
          e.targetY = lerp(e.targetY, p.y, dt * 1.6);
          e.x = e.targetX; e.y = e.targetY;
          if (e.st <= 0) { setState('stomp', 0.24); Sfx.roar(); }
          break;
        }
        case 'stomp': {
          const k = 1 - Math.max(0, e.st) / 0.24;
          e.airH = (1 - k * k) * 340;
          if (e.st <= 0) {
            e.airH = 0; e.shadowMark = false;
            Shake.add(22, 0.45);
            Sfx.splat();
            g.parts.ring(e.x, e.y + e.r * 0.5, 30, '#c8ac9e', 360, 7);
            // matches the dashed marker exactly, so the tell never lies
            if (dist(e.x, e.y, p.x, p.y) < e.r + 20) p.takeDamage(2, g, e.x, e.y, 'mom:stomp');
            // the stomp flattens rocks under it
            for (const o of g.room.props) {
              if (o.gone || !o.solid || o.kind === 'pit') continue;
              if (dist(o.x, o.y, e.x, e.y) < e.r * 1.3) {
                o.gone = true; o.solid = false; o.blocksTears = false;
                g.parts.burst(o.x, o.y, 10, '#6b5a44', { spd: 180, size: 4 });
              }
            }
            if (rage) fireRing(g, e, 8, 240, 1, 9, Math.random() * TAU, 30);
            setState('grounded', rage ? 0.85 : 1.25);
          }
          break;
        }
        case 'grounded': {
          // The only window where the foot can be hurt.
          e.airH = 0;
          if (e.st <= 0) {
            const roll = Math.random();
            if (roll < 0.45 && !e.eye) {
              // poke an eye out of a random wall
              const side = Math.floor(Math.random() * 4);
              const pos = [
                { x: VIEW_W / 2, y: IN_Y0 + 22 }, { x: IN_X1 - 22, y: VIEW_H / 2 },
                { x: VIEW_W / 2, y: IN_Y1 - 22 }, { x: IN_X0 + 22, y: VIEW_H / 2 },
              ][side];
              e.eye = { x: pos.x, y: pos.y, t: rage ? 5 : 4, cd: 0.5 };
              Sfx.tone(300, 200, 0.3, 'triangle', 0.16);
            } else if (roll < 0.68) {
              const cnt = rage ? 3 : 2;
              for (let i = 0; i < cnt; i++) {
                g.spawnEnemy(Math.random() < 0.5 ? 'globin' : 'hopper',
                  VIEW_W / 2 + (Math.random() - 0.5) * 400, IN_Y0 + 60 + Math.random() * 60);
              }
              Sfx.noise(0.25, 0.22, 1200);
            }
            setState('raise', rage ? 0.7 : 1.0);
          }
          break;
        }
      }
    },
  },

  /* --- BOSS: Scolex — armoured worm, only the tail can be hurt --- */
  scolex: {
    r: 26, hp: 300, contact: 2, flying: true, speed: 0, draw: drawScolex, gore: '#7a7f88',
    boss: true, name: 'SCOLEX', segs: 6, segSpacing: 24, hitSegs: 'tail',
    init(e) { initSegs(e, 6, 24); e.state = 'burrow'; e.st = 0.9; e.buried = true; },
    ai(e, dt, g) {
      const p = g.player;
      const rage = e.hp / e.maxHp < 0.5;
      e.st -= dt;
      e.aggro = !e.buried;
      const setState = (s, t) => { e.state = s; e.st = t; };

      switch (e.state) {
        case 'burrow': {
          // Underground: invulnerable, sliding toward a spot near the player.
          e.buried = true;
          const n = norm(p.x - e.x, p.y - e.y);
          const spd = rage ? 300 : 235;
          e.vx = n.x * spd; e.vy = n.y * spd;
          if (Math.random() < 0.5) {
            g.parts.spawn({
              x: e.x + (Math.random() - 0.5) * 30, y: e.y + (Math.random() - 0.5) * 30,
              vx: 0, vy: 0, life: 0.4, size: 5, color: 'rgba(60,40,30,0.7)', grav: 0, drag: 2,
            });
          }
          if (e.st <= 0) {
            setState('erupt', 0.9);
            const nn = norm(p.x - e.x, p.y - e.y);
            const launch = rage ? 560 : 470;
            e.vx = nn.x * launch; e.vy = nn.y * launch;
            e.buried = false;
            Shake.add(10, 0.24);
            Sfx.roar();
            g.parts.ring(e.x, e.y, 18, '#6b5a44', 260, 5);
          }
          break;
        }
        case 'erupt': {
          e.buried = false;
          // arcs out of the ground, spraying shots behind it
          e.vx *= 1 - 0.6 * dt; e.vy *= 1 - 0.6 * dt;
          if (e.x < IN_X0 + e.r || e.x > IN_X1 - e.r) e.vx *= -1;
          if (e.y < IN_Y0 + e.r || e.y > IN_Y1 - e.r) e.vy *= -1;
          e.cd -= dt;
          if (e.cd <= 0) {
            e.cd = rage ? 0.24 : 0.36;
            const tail = e.segs[e.segs.length - 1];
            const a = Math.atan2(-e.vy, -e.vx) + (Math.random() - 0.5) * 0.7;
            g.addEnemyTear(tail.x, tail.y, Math.cos(a) * 235, Math.sin(a) * 235, 1, 9);
          }
          if (e.st <= 0) {
            setState('burrow', rage ? 0.7 : 1.05);
            g.parts.ring(e.x, e.y, 14, '#6b5a44', 220, 5);
            Sfx.splat();
          }
          break;
        }
      }
    },
  },

  /* --- BOSS: Mom's Heart — bullet-hell patterns from a fixed point --- */
  momsHeart: {
    r: 66, hp: 320, contact: 2, flying: true, speed: 0, draw: drawMomsHeart, gore: '#b02330',
    boss: true, name: "MOM'S HEART", anchor: 'top',
    init(e) { e.state = 'idle'; e.st = 1.2; e.pattern = 0; },
    ai(e, dt, g) {
      const p = g.player;
      const n = norm(p.x - e.x, p.y - e.y);
      e.aimX = n.x; e.aimY = n.y;
      e.st -= dt;
      const rage = e.hp / e.maxHp < 0.6;
      e.rage = rage;
      e.aggro = false;
      // pinned to the top of the room
      e.vx *= 1 - 10 * dt; e.vy *= 1 - 10 * dt;
      e.x = lerp(e.x, VIEW_W / 2, dt * 2.4);
      e.y = lerp(e.y, IN_Y0 + 96, dt * 2.4);
      const setState = (s, t) => { e.state = s; e.st = t; };

      switch (e.state) {
        case 'idle':
          if (e.st <= 0) {
            e.pattern = (e.pattern + 1 + Math.floor(Math.random() * 2)) % (rage ? 4 : 3);
            setState('fire', rage ? 2.4 : 2.0);
            e.burst = 0; e.spin = Math.random() * TAU;
          }
          break;
        case 'fire': {
          e.burst -= dt;
          if (e.burst <= 0) {
            switch (e.pattern) {
              case 0:                        // pulsing expanding rings
                e.burst = rage ? 0.42 : 0.55;
                fireRing(g, e, rage ? 12 : 10, 205, 1, 8, e.spin, 40);
                e.spin += 0.24;
                break;
              case 1:                        // twin spirals
                e.burst = rage ? 0.1 : 0.14;
                for (const sd of [0, Math.PI]) {
                  const a = e.spin + sd;
                  g.addEnemyTear(e.x + Math.cos(a) * 40, e.y + Math.sin(a) * 40,
                    Math.cos(a) * 225, Math.sin(a) * 225, 1, 8);
                }
                e.spin += 0.42;
                break;
              case 2:                        // slow curtain of aimed lines
                e.burst = rage ? 0.36 : 0.48;
                fireFan(g, e, rage ? 7 : 5, 0.3, 190, 1, 9);
                break;
              default:                       // rage only: a line that hunts you
                e.burst = 0.16;
                fireFan(g, e, 1, 0, 265, 1, 9);
                break;
            }
            Sfx.hit();
          }
          if (e.st <= 0) setState('summon', 0.7);
          break;
        }
        case 'summon':
          if (e.st <= 0) {
            const pool = rage ? ['globin', 'knight', 'maw'] : ['pooter', 'clotty', 'hopper'];
            const cnt = rage ? 3 : 2;
            for (let i = 0; i < cnt; i++) {
              g.spawnEnemy(pool[Math.floor(Math.random() * pool.length)],
                VIEW_W / 2 + (Math.random() - 0.5) * 420, VIEW_H / 2 + (Math.random() - 0.5) * 180);
            }
            Sfx.noise(0.3, 0.24, 1100);
            g.parts.burst(e.x, e.y + 40, 20, BLOOD, { spd: 220 });
            setState('idle', rage ? 0.7 : 1.1);
          }
          break;
      }
    },
  },

  /* --- BOSS: Hush — sinks, relocates, and floods the room --- */
  hush: {
    r: 82, hp: 340, contact: 2, flying: true, speed: 0, draw: drawHush, gore: '#c9cfd2',
    boss: true, name: 'HUSH',
    init(e) {
      e.state = 'idle'; e.st = 1.2; e.mouth = 0; e.sinkAt = 0.8; e.homeX = VIEW_W / 2; e.homeY = IN_Y0 + 110;
    },
    ai(e, dt, g) {
      const p = g.player;
      const n = norm(p.x - e.x, p.y - e.y);
      e.aimX = n.x; e.aimY = n.y;
      e.st -= dt;
      const frac = e.hp / e.maxHp;
      const tier = frac > 0.8 ? 0 : frac > 0.6 ? 1 : frac > 0.4 ? 2 : frac > 0.2 ? 3 : 4;
      e.aggro = false;
      e.vx *= 1 - 8 * dt; e.vy *= 1 - 8 * dt;
      const setState = (s, t) => { e.state = s; e.st = t; };

      // Every 20% of its health it sinks away, clears the screen and moves.
      if (e.state !== 'sunk' && frac <= e.sinkAt) {
        e.sinkAt -= 0.2;
        setState('sunk', 1.8);
        g.enemyTears.length = 0;
        g.parts.burst(e.x, e.y, 40, '#9fd8ea', { spd: 260, size: 5 });
        Sfx.roar();
      }

      if (e.state === 'sunk') {
        e.invulnerable = true;
        e.mouth = approach(e.mouth, 0, dt * 3);
        if (e.st <= 0) {
          e.invulnerable = false;
          e.homeX = clamp(VIEW_W / 2 + (Math.random() - 0.5) * 260, IN_X0 + 120, IN_X1 - 120);
          e.homeY = clamp(IN_Y0 + 110 + Math.random() * 120, IN_Y0 + 100, VIEW_H / 2);
          e.x = e.homeX; e.y = e.homeY;
          setState('idle', 0.7);
        }
        return;
      }
      e.x = lerp(e.x, e.homeX, dt * 2);
      e.y = lerp(e.y, e.homeY, dt * 2);

      switch (e.state) {
        case 'idle':
          e.mouth = approach(e.mouth, 0, dt * 3);
          if (e.st <= 0) {
            const opts = ['gapRing', 'volley', 'sweep'];
            if (tier >= 2) opts.push('cross');
            setState(opts[Math.floor(Math.random() * opts.length)], 0.45);
            e.burst = 0; e.spin = Math.random() * TAU; e.reps = 3 + tier;
          }
          break;
        case 'gapRing': {
          // A dense ring with one gap: you have to read where the hole is.
          e.mouth = approach(e.mouth, 1, dt * 4);
          e.burst -= dt;
          if (e.burst <= 0 && e.reps > 0) {
            e.burst = 0.42; e.reps--;
            const gapA = Math.atan2(p.y - e.y, p.x - e.x) + (Math.random() - 0.5) * 1.2;
            const N = 20;
            for (let i = 0; i < N; i++) {
              const a = (i / N) * TAU;
              let d = Math.abs(((a - gapA + Math.PI * 3) % TAU) - Math.PI);
              if (d < 0.5) continue;
              g.addEnemyTear(e.x + Math.cos(a) * 50, e.y + Math.sin(a) * 50,
                Math.cos(a) * 195, Math.sin(a) * 195, 1, 8);
            }
            Sfx.hit();
          }
          if (e.reps <= 0) setState('idle', 0.7);
          break;
        }
        case 'volley': {
          e.mouth = approach(e.mouth, 1, dt * 4);
          e.burst -= dt;
          if (e.burst <= 0 && e.reps > 0) {
            e.burst = 0.2; e.reps--;
            fireRing(g, e, 4, 235, 1, 8, e.spin, 40);
            e.spin += 0.55;
          }
          if (e.reps <= 0) setState('idle', 0.65);
          break;
        }
        case 'sweep': {
          // U-shaped salvo aimed at the player
          e.mouth = approach(e.mouth, 1, dt * 4);
          e.burst -= dt;
          if (e.burst <= 0 && e.reps > 0) {
            e.burst = 0.34; e.reps--;
            const a0 = Math.atan2(p.y - e.y, p.x - e.x);
            for (let i = -3; i <= 3; i++) {
              const a = a0 + i * 0.19;
              const spd = 200 + Math.abs(i) * 26;
              g.addEnemyTear(e.x + Math.cos(a) * 40, e.y + Math.sin(a) * 40,
                Math.cos(a) * spd, Math.sin(a) * spd, 1, 8);
            }
            Sfx.hit();
          }
          if (e.reps <= 0) setState('idle', 0.6);
          break;
        }
        case 'cross': {
          e.mouth = approach(e.mouth, 1, dt * 4);
          if (e.st <= 0) {
            for (let i = 0; i < 4; i++) {
              const a = e.spin + i * Math.PI / 2;
              g.addEnemyLaser(e.x, e.y, Math.cos(a), Math.sin(a),
                { dmg: 2, w: 12, life: 0.55, len: 1000 });
            }
            Sfx.laser();
            setState('idle', 0.9);
          }
          break;
        }
      }
    },
  },

  /* --- BOSS: Satan — three escalating phases --- */
  satan: {
    r: 72, hp: 360, contact: 2, flying: false, speed: 0, draw: drawSatan, gore: '#5b4038',
    boss: true, name: 'SATAN',
    init(e) { e.state = 'idle'; e.st = 1.2; e.phase = 1; e.airH = 0; },
    ai(e, dt, g) {
      const p = g.player;
      const n = norm(p.x - e.x, p.y - e.y);
      e.aimX = n.x; e.aimY = n.y;
      e.st -= dt;
      const frac = e.hp / e.maxHp;
      const phase = frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3;
      if (phase !== e.phase) {
        e.phase = phase;
        Sfx.roar();
        Shake.add(14, 0.5);
        g.parts.burst(e.x, e.y, 34, '#ff6a3a', { spd: 300, size: 6 });
      }
      e.aggro = e.state === 'stompDown';
      const setState = (s, t) => { e.state = s; e.st = t; };
      e.tell = Math.max(0, (e.tell || 0) - dt);

      // Phases 1-2 stay along the top; phase 3 he leaves the ground entirely.
      if (phase < 3) {
        e.vx *= 1 - 5 * dt; e.vy *= 1 - 6 * dt;
        e.y = lerp(e.y, IN_Y0 + 110, dt * 2.2);
        e.x = clamp(e.x + Math.sin(e.animT * 0.9) * 42 * dt, IN_X0 + 100, IN_X1 - 100);
      }

      switch (e.state) {
        case 'idle':
          if (e.st <= 0) {
            if (phase === 3) setState('stompUp', 0.5);
            else {
              const roll = Math.random();
              if (roll < 0.45) setState('spreadCharge', 0.45);
              else if (roll < 0.78) setState('handsCharge', 0.55);
              else setState('brimCharge', 0.8);
            }
          }
          break;
        case 'spreadCharge':
          e.tell = 0.3;
          if (e.st <= 0) { setState('spread', 0.7); e.burst = 0; e.reps = phase === 2 ? 3 : 2; }
          break;
        case 'spread':
          e.burst -= dt;
          if (e.burst <= 0 && e.reps > 0) {
            e.burst = 0.26; e.reps--;
            fireFan(g, e, e.reps % 2 ? 5 : 4, 0.26, 275, 1, 9);
            Sfx.hit();
          }
          if (e.reps <= 0) setState('idle', phase === 2 ? 0.6 : 0.9);
          break;
        case 'handsCharge':
          e.tell = 0.4;
          if (e.st <= 0) {
            // half-rings out of each palm
            for (const sd of [-1, 1]) {
              const hx = e.x + sd * e.r * 0.85, hy = e.y - e.r * 0.1;
              for (let i = 0; i < 8; i++) {
                const a = (sd > 0 ? -Math.PI / 2 : Math.PI / 2) + (i / 7 - 0.5) * Math.PI * (sd > 0 ? 1 : -1);
                g.addEnemyTear(hx, hy, Math.cos(a) * 250, Math.sin(a) * 250, 1, 9);
              }
            }
            Sfx.hit();
            setState('idle', 0.85);
          }
          break;
        case 'brimCharge':
          e.tell = 0.6;
          if (e.st <= 0) {
            setState('brim', 0.9);
            e.beamA = Math.atan2(n.y, n.x) - 0.55;
            e.beamDir = p.x < e.x ? -1 : 1;
            e.beamCd = 0;
            Sfx.roar();
          }
          break;
        case 'brim':
          e.beamA += e.beamDir * dt * 1.25;
          e.beamCd -= dt;
          if (e.beamCd <= 0) {
            e.beamCd = 0.12;
            g.addEnemyLaser(e.x, e.y + e.r * 0.2, Math.cos(e.beamA), Math.sin(e.beamA),
              { dmg: 2, w: 14, life: 0.2, len: 1000 });
          }
          if (e.st <= 0) setState('idle', 1.0);
          break;
        case 'stompUp': {
          const k = 1 - Math.max(0, e.st) / 0.5;
          e.airH = k * 340;
          e.targetX = p.x; e.targetY = p.y;
          if (e.st <= 0) {
            setState('stompMark', 0.55);
            e.shadowMark = true;
          }
          break;
        }
        case 'stompMark':
          e.airH = 340;
          e.targetX = lerp(e.targetX, p.x, dt * 1.8);
          e.targetY = lerp(e.targetY, p.y, dt * 1.8);
          e.x = clamp(e.targetX, IN_X0 + e.r, IN_X1 - e.r);
          e.y = clamp(e.targetY, IN_Y0 + e.r, IN_Y1 - e.r);
          if (e.st <= 0) setState('stompDown', 0.26);
          break;
        case 'stompDown': {
          const k = 1 - Math.max(0, e.st) / 0.26;
          e.airH = (1 - k * k) * 340;
          if (e.st <= 0) {
            e.airH = 0; e.shadowMark = false;
            Shake.add(22, 0.45);
            Sfx.splat();
            g.parts.ring(e.x, e.y + e.r * 0.5, 30, '#ff8a4a', 360, 7);
            if (dist(e.x, e.y, p.x, p.y) < e.r + 20) p.takeDamage(2, g, e.x, e.y, 'satan:stomp');
            fireRing(g, e, 10, 250, 1, 9, Math.random() * TAU, 30);
            if (g.enemies.filter(x => !x.dead && x.type === 'boomfly').length < 2) {
              g.spawnEnemy('boomfly', e.x + (Math.random() - 0.5) * 200, e.y + 90);
            }
            setState('idle', 0.75);
          }
          break;
        }
      }
    },
  },

  /* --- BOSS: Isaac — the cathedral fight, three phases --- */
  isaacBoss: {
    r: 58, hp: 380, contact: 2, flying: false, speed: 0, draw: drawIsaacBoss, gore: '#f0dcbe',
    boss: true, name: 'ISAAC',
    init(e) { e.state = 'idle'; e.st = 1.0; e.phase = 1; e.winged = false; },
    ai(e, dt, g) {
      const p = g.player;
      const n = norm(p.x - e.x, p.y - e.y);
      e.aimX = n.x; e.aimY = n.y;
      e.st -= dt;
      const frac = e.hp / e.maxHp;
      const phase = frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3;
      if (phase !== e.phase) {
        e.phase = phase;
        e.winged = phase === 3;
        Sfx.roar();
        Shake.add(14, 0.5);
        g.parts.burst(e.x, e.y, 34, '#ffe9a8', { spd: 300, size: 6 });
      }
      e.aggro = e.state === 'dash';
      const setState = (s, t) => { e.state = s; e.st = t; };

      // A steady aimed dribble underneath everything else.
      e.cd -= dt;
      if (e.cd <= 0 && e.state !== 'dash') {
        e.cd = phase === 1 ? 1.5 : phase === 2 ? 1.15 : 0.85;
        fireFan(g, e, phase, 0.2, 250, 1, 8);
      }

      if (phase < 3) { e.vx *= 1 - 8 * dt; e.vy *= 1 - 8 * dt; }

      switch (e.state) {
        case 'idle':
          e.mouth = approach(e.mouth || 0, 0, dt * 3);
          if (e.st <= 0) {
            const opts = phase === 1 ? ['radial', 'curve']
              : phase === 2 ? ['radial', 'curve', 'cross']
                : ['radial', 'dashPrep', 'cross'];
            setState(opts[Math.floor(Math.random() * opts.length)], 0.45);
            e.burst = 0; e.spin = Math.random() * TAU; e.reps = 3 + phase;
          }
          break;
        case 'radial':
          e.mouth = approach(e.mouth || 0, 1, dt * 4);
          e.burst -= dt;
          if (e.burst <= 0 && e.reps > 0) {
            e.burst = phase === 1 ? 0.4 : 0.3; e.reps--;
            fireRing(g, e, 10, 215, 1, 8, e.spin, 30);
            e.spin += 0.31;
            Sfx.hit();
          }
          if (e.reps <= 0) setState('idle', 0.8);
          break;
        case 'curve':
          // groups of shots that arc back toward him
          e.burst -= dt;
          if (e.burst <= 0 && e.reps > 0) {
            e.burst = 0.36; e.reps--;
            for (let i = 0; i < 8; i++) {
              const a = e.spin + (i / 8) * TAU;
              g.addEnemyTear(e.x + Math.cos(a) * 30, e.y + Math.sin(a) * 30,
                Math.cos(a) * 230, Math.sin(a) * 230, 1, 8, { curve: 2.1 });
            }
            e.spin += 0.4;
            Sfx.hit();
          }
          if (e.reps <= 0) setState('idle', 0.75);
          break;
        case 'cross':
          if (e.st <= 0) {
            for (let i = 0; i < 4; i++) {
              const a = e.spin + i * Math.PI / 2;
              g.addEnemyLaser(e.x, e.y, Math.cos(a), Math.sin(a),
                { dmg: 2, w: 12, life: 0.5, len: 1000 });
            }
            Sfx.laser();
            setState('idle', 0.9);
          }
          break;
        case 'dashPrep':
          e.vx *= 1 - 8 * dt; e.vy *= 1 - 8 * dt;
          if (e.st <= 0) {
            setState('dash', 0.5);
            // aim ahead of where the player is going
            const lead = norm(p.x + p.vx * 0.3 - e.x, p.y + p.vy * 0.3 - e.y);
            e.vx = lead.x * 430; e.vy = lead.y * 430;
            Sfx.tone(520, 200, 0.2, 'triangle', 0.2);
          }
          break;
        case 'dash':
          if (e.st <= 0) {
            e.vx *= 0.15; e.vy *= 0.15;
            fireRing(g, e, 8, 235, 1, 8, Math.random() * TAU, 24);
            setState('idle', 0.55);
          }
          break;
      }
    },
  },

  /* --- BOSS: ??? — Isaac's dead twin; faster, and everything homes --- */
  blueBaby: {
    r: 56, hp: 360, contact: 2, flying: false, speed: 0, draw: drawBlueBaby, gore: '#93a8bd',
    boss: true, name: '???',
    init(e) { e.state = 'idle'; e.st = 0.9; e.phase = 1; e.winged = false; },
    ai(e, dt, g) {
      const p = g.player;
      const n = norm(p.x - e.x, p.y - e.y);
      e.aimX = n.x; e.aimY = n.y;
      e.st -= dt;
      const frac = e.hp / e.maxHp;
      const phase = frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3;
      if (phase !== e.phase) {
        e.phase = phase;
        e.winged = phase === 3;
        Sfx.roar();
        Shake.add(16, 0.5);
        g.parts.burst(e.x, e.y, 40, '#9fd8ea', { spd: 320, size: 6 });
      }
      e.aggro = e.state === 'dash';
      const setState = (s, t) => { e.state = s; e.st = t; };

      // constant homing dribble
      e.cd -= dt;
      if (e.cd <= 0 && e.state !== 'dash') {
        e.cd = phase === 1 ? 1.25 : phase === 2 ? 0.95 : 0.7;
        const a0 = Math.atan2(n.y, n.x);
        for (let i = 0; i < phase; i++) {
          const a = a0 + (i - (phase - 1) / 2) * 0.22;
          g.addEnemyTear(e.x + Math.cos(a) * 14, e.y + Math.sin(a) * 14,
            Math.cos(a) * 255, Math.sin(a) * 255, 1, 8, { homing: 2.4 });
        }
      }
      // an orbiting escort that has to be cleared or dodged
      e.swarmCd = (e.swarmCd || 0) - dt;
      if (e.swarmCd <= 0) {
        e.swarmCd = phase === 3 ? 3.2 : 4.6;
        if (g.enemies.filter(x => !x.dead && !x.boss).length < 5) {
          g.spawnEnemy('fly', e.x + (Math.random() - 0.5) * 160, e.y + (Math.random() - 0.5) * 120);
        }
      }

      if (phase < 3) { e.vx *= 1 - 8 * dt; e.vy *= 1 - 8 * dt; }
      else {
        // drifts toward you constantly in the last phase
        e.vx = approach(e.vx, n.x * 70, 220 * dt);
        e.vy = approach(e.vy, n.y * 70, 220 * dt);
      }

      switch (e.state) {
        case 'idle':
          if (e.st <= 0) {
            const opts = phase === 1 ? ['xShot', 'radial']
              : phase === 2 ? ['xShot', 'radial', 'spiral']
                : ['radial', 'spiral', 'dashPrep', 'cross'];
            setState(opts[Math.floor(Math.random() * opts.length)], 0.4);
            e.burst = 0; e.spin = Math.random() * TAU; e.reps = 3 + phase;
          }
          break;
        case 'xShot':
          e.burst -= dt;
          if (e.burst <= 0 && e.reps > 0) {
            e.burst = 0.32; e.reps--;
            for (let i = 0; i < 4; i++) {
              const a = e.spin + i * Math.PI / 2 + 0.4;
              g.addEnemyTear(e.x + Math.cos(a) * 24, e.y + Math.sin(a) * 24,
                Math.cos(a) * 245, Math.sin(a) * 245, 1, 8, { homing: 1.6 });
            }
            Sfx.hit();
          }
          if (e.reps <= 0) setState('idle', 0.65);
          break;
        case 'radial':
          e.burst -= dt;
          if (e.burst <= 0 && e.reps > 0) {
            e.burst = 0.3; e.reps--;
            fireRing(g, e, phase >= 2 ? 12 : 10, 225, 1, 8, e.spin, 28);
            e.spin += 0.29;
            Sfx.hit();
          }
          if (e.reps <= 0) setState('idle', 0.7);
          break;
        case 'spiral':
          e.burst -= dt;
          if (e.burst <= 0 && e.reps > 0) {
            e.burst = 0.09;
            if (Math.random() < 0.16) e.reps--;
            for (const sd of [0, Math.PI * 2 / 3, Math.PI * 4 / 3]) {
              const a = e.spin + sd;
              g.addEnemyTear(e.x + Math.cos(a) * 26, e.y + Math.sin(a) * 26,
                Math.cos(a) * 235, Math.sin(a) * 235, 1, 8);
            }
            e.spin += 0.38;
          }
          if (e.reps <= 0) setState('idle', 0.6);
          break;
        case 'cross':
          if (e.st <= 0) {
            for (let i = 0; i < 6; i++) {
              const a = e.spin + i * Math.PI / 3;
              g.addEnemyLaser(e.x, e.y, Math.cos(a), Math.sin(a),
                { dmg: 2, w: 12, life: 0.5, len: 1000 });
            }
            Sfx.laser();
            setState('idle', 0.85);
          }
          break;
        case 'dashPrep':
          e.vx *= 1 - 9 * dt; e.vy *= 1 - 9 * dt;
          if (e.st <= 0) {
            setState('dash', 0.45);
            const lead = norm(p.x + p.vx * 0.28 - e.x, p.y + p.vy * 0.28 - e.y);
            e.vx = lead.x * 470; e.vy = lead.y * 470;
            Sfx.tone(420, 160, 0.2, 'triangle', 0.2);
          }
          break;
        case 'dash':
          if (e.st <= 0) {
            e.vx *= 0.12; e.vy *= 0.12;
            fireRing(g, e, 10, 240, 1, 8, Math.random() * TAU, 24);
            setState('idle', 0.5);
          }
          break;
      }
    },
  },
};

function spawnEnemyObj(type, x, y, level) {
  const def = ENEMY_DEFS[type];
  // Player damage compounds — every collectible multiplies or adds on top of
  // the last. Measured against the test bot, output grows roughly 20x between
  // the Basement and the Chest, so health has to compound too; linear scaling
  // left the late bosses dying in five seconds. The exponents below were
  // fitted to that measured DPS curve (see test/calibrate.py), not guessed.
  const scale = def.boss ? Math.pow(1.28, level - 1) : Math.pow(1.24, level - 1);
  const e = {
    type, def, x, y, vx: 0, vy: 0,
    r: def.r,
    maxHp: Math.round(def.hp * scale),
    hp: Math.round(def.hp * scale),
    spd: def.speed * (def.boss ? 1 : 1 + (level - 1) * 0.045),
    // From the Womb down, even chip damage costs a full heart.
    contact: def.contact + (!def.boss && level >= 9 ? 1 : 0),
    flying: def.flying,
    boss: !!def.boss,
    animT: Math.random() * 6,
    // Brief materialise window: nothing moves or shoots for a moment after a
    // room loads, so walking in never costs you a heart for free.
    spawnT: def.boss ? 0.9 : 0.55,
    hitFlash: 0, tell: 0, cd: 0.9 + Math.random() * 1.2,
    aimX: 0, aimY: 1, dead: false, awake: false,
    airH: 0, squash: 1, mouth: 0,
    downed: 0, leap: 0, revived: false,
    faceX: 0, faceY: 1,
    _orbCd: 0,
  };
  if (def.init) def.init(e);
  return e;
}

/* --------------------------------------------------------------------------
   Hit testing. Worm bosses are a chain of bodies rather than one circle, and
   Scolex is only vulnerable in the tail, so every projectile goes through here.
   Returns the impact point, or null for a miss.
   -------------------------------------------------------------------------- */
function enemyHitPoint(e, x, y, r) {
  if (e.def.immuneWhile && e.def.immuneWhile(e)) return null;
  if (e.invulnerable) return null;
  const segs = e.segs;
  const mode = e.def.hitSegs;
  if (segs && mode === 'tail') {
    const t = segs[segs.length - 1];
    const rr = e.r * 0.62 + r;
    return dist2(x, y, t.x, t.y) < rr * rr ? { x: t.x, y: t.y } : null;
  }
  if (dist2(x, y, e.x, e.y) < (e.r + r) ** 2) return { x: e.x, y: e.y };
  if (segs && mode) {
    for (const s of segs) {
      const rr = e.r * 0.86 + r;
      if (dist2(x, y, s.x, s.y) < rr * rr) return { x: s.x, y: s.y };
    }
  }
  return null;
}

/** Does this enemy's body (including segments) touch the player right now? */
function enemyTouchesPlayer(e, p) {
  const rr = e.boss ? e.r * 0.8 + p.r * 0.55 : (e.r + p.r) * 0.82;
  if (dist2(e.x, e.y, p.x, p.y) < rr * rr) return true;
  if (e.segs && e.def.hitSegs) {
    for (const s of e.segs) {
      if (dist2(s.x, s.y, p.x, p.y) < rr * rr) return true;
    }
  }
  return false;
}
