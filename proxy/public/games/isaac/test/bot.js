/* An in-page bot that plays the game through the same input surface a human
   uses (window.__game.press/release/move). Used to prove the game is winnable
   and never soft-locks, and to sanity-check difficulty. */
window.__bot = {
  timer: null,
  goal: null,
  lastRoom: null,
  visits: {},
  log: [],
  stuckT: 0,
  lastPos: null,

  DIRS: ['up', 'right', 'down', 'left'],

  start(hz) {
    this.stop();
    this.timer = setInterval(() => { try { this.tick(); } catch (e) { this.log.push('ERR ' + e.message); } }, 1000 / (hz || 30));
  },
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    const g = window.__game;
    if (g) { this.DIRS.forEach(d => g.release(d)); g.stopMove(); }
  },

  /* Is a tear-blocking prop sitting on the line between us and the target?
     Without this the bot happily stands behind a rock emptying its tears into
     it, which looks like "the enemy is unkillable" in the results. */
  lineBlocked(R, p, e) {
    const dx = e.x - p.x, dy = e.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    for (const o of R.room.props) {
      if (o.gone || !o.blocksTears) continue;
      const rx = o.x - p.x, ry = o.y - p.y;
      const along = rx * ux + ry * uy;
      if (along < 0 || along > len) continue;
      const perp = Math.abs(rx * -uy + ry * ux);
      if (perp < o.r + 10) return o;
    }
    return null;
  },

  /* Shooting is 4-directional, so a human lines up on a row or column before
     firing. Pick whichever axis we're closest to being aligned on. */
  aim(g, p, e, blocked) {
    const dx = e.x - p.x, dy = e.y - p.y;
    const useX = Math.abs(dy) < Math.abs(dx);   // aligned in y -> shoot along x
    const dir = useX ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    const misalign = useX ? Math.abs(dy) : Math.abs(dx);
    const range = (g.raw.player.stats.range || 430);
    const tooFar = Math.hypot(dx, dy) > range * 0.92;
    // only hold fire when we're actually pointing near the target, the shot
    // can reach, and nothing solid is in the way
    if (misalign < e.r + 26 && !blocked && !tooFar) {
      this.DIRS.forEach(d => { if (d !== dir) g.release(d); });
      g.press(dir);
    } else {
      this.DIRS.forEach(d => g.release(d));
    }
    return { useX, dir, misalign, tooFar };
  },

  /* Steer toward a point while sliding around rocks and pits, and shove out of
     a corner if we've stopped making progress. */
  walkTo(g, p, tx, ty) {
    let mx = tx - p.x, my = ty - p.y;
    const m = Math.hypot(mx, my) || 1;
    mx /= m; my /= m;

    const R = g.raw;
    for (const o of R.room.props) {
      if (o.gone) continue;
      if (!o.solid && o.kind !== 'spikes') continue;
      const ox = p.x - o.x, oy = p.y - o.y;
      const dd = Math.hypot(ox, oy) || 1;
      const near = o.r + 34;
      if (dd < near) {
        const w = (near - dd) / near;
        // push out, plus a tangential nudge so we go *around* instead of into
        mx += (ox / dd) * w * 1.9 - (oy / dd) * w * 1.1;
        my += (oy / dd) * w * 1.9 + (ox / dd) * w * 1.1;
      }
    }

    if (this.unstickT > 0) {
      this.unstickT -= 1 / 30;
      mx = this.unstickX; my = this.unstickY;
    }
    const mm = Math.hypot(mx, my) || 1;
    g.move(mx / mm, my / mm);
  },

  checkStuck(p) {
    const now = performance.now();
    if (!this.lastPos) { this.lastPos = { x: p.x, y: p.y, t: now }; return; }
    if (Math.hypot(p.x - this.lastPos.x, p.y - this.lastPos.y) > 22) {
      this.lastPos = { x: p.x, y: p.y, t: now };
      return;
    }
    if (now - this.lastPos.t > 1300) {
      const a = Math.random() * Math.PI * 2;
      this.unstickX = Math.cos(a); this.unstickY = Math.sin(a);
      this.unstickT = 0.7;
      this.lastPos = { x: p.x, y: p.y, t: now };
      this.pickupBan = now + 5000;      // stop chasing whatever we can't reach
      this.goal = null;
      this.log.push('unstuck');
    }
  },

  tick() {
    const g = window.__game;
    if (!g) return;
    const R = g.raw;
    if (g.state !== 'playing') { this.DIRS.forEach(d => g.release(d)); g.stopMove(); return; }

    const p = R.player;
    const room = R.room;
    if (room.id !== this.lastRoom) {
      this.lastRoom = room.id;
      this.goal = null;
      this.visits[room.id] = (this.visits[room.id] || 0) + 1;
    }

    this.checkStuck(p);
    const es = R.enemies.filter(e => !e.dead);

    if (es.length) {
      let best = null, bd = 1e9;
      for (const e of es) {
        const d = (e.x - p.x) ** 2 + (e.y - p.y) ** 2;
        if (d < bd) { bd = d; best = e; }
      }
      const blocker = this.lineBlocked(R, p, best);
      const a = this.aim(g, p, best, blocker);

      // Kite: hold a comfortable distance on the firing axis while closing the
      // perpendicular gap so the shots actually connect.
      const dx = best.x - p.x, dy = best.y - p.y;
      const m = Math.hypot(dx, dy) || 1;
      let mx = 0, my = 0;

      // Something solid is eating our tears: slide sideways off the firing
      // line rather than keep shooting a rock.
      if (blocker) {
        const bx = p.x - blocker.x, by = p.y - blocker.y;
        const bd = Math.hypot(bx, by) || 1;
        mx += (-by / bd) * 2.4 * (this.sideFlip || 1);
        my += (bx / bd) * 2.4 * (this.sideFlip || 1);
        if (!this.flipT || performance.now() > this.flipT) {
          this.flipT = performance.now() + 1400;
          this.sideFlip = Math.random() < 0.5 ? -1 : 1;
        }
      }
      // Out of tear range against something that will never come to us:
      // close the gap instead of stalling at the edge.
      if (a.tooFar) {
        mx += (dx / m) * 1.8;
        my += (dy / m) * 1.8;
      }
      // Bosses are big and they leap, so stand off further and break the line
      // of a telegraphed charge by sliding perpendicular to it.
      const WANT = best.boss ? 330 : 200;
      if (best.boss && ['hopCharge', 'hop', 'slamCharge', 'dashCharge', 'dash'].includes(best.state)) {
        mx += (-dy / m) * 2.6;
        my += (dx / m) * 2.6;
      }
      if (best.boss && best.state === 'slamUp') {
        // he lands where we're standing: keep moving, any direction but still
        mx += (-dy / m) * 2.2;
        my += (dx / m) * 2.2;
      }
      if (a.useX) {
        my += Math.sign(dy) * Math.min(1, Math.abs(dy) / 40);      // line up in y
        mx += -Math.sign(dx) * (Math.abs(dx) < WANT ? 1 : -0.5);   // keep range in x
      } else {
        mx += Math.sign(dx) * Math.min(1, Math.abs(dx) / 40);
        my += -Math.sign(dy) * (Math.abs(dy) < WANT ? 1 : -0.5);
      }
      const flee = best.boss ? 240 : 110;
      if (m < flee) { mx += (p.x - best.x) / m * 2.2; my += (p.y - best.y) / m * 2.2; }

      for (const t of R.enemyTears) {
        const tx = p.x - t.x, ty = p.y - t.y;
        const dd = Math.hypot(tx, ty);
        if (dd < 130) { mx += (tx / dd) * 2.2; my += (ty / dd) * 2.2; }
      }
      for (const o of room.props) {
        if (o.kind !== 'spikes' && !o.solid) continue;
        const ox = p.x - o.x, oy = p.y - o.y;
        const dd = Math.hypot(ox, oy) || 1;
        if (dd < 58) {
          // Push out *and* around. Pure repulsion parks the bot in the local
          // minimum between the rock it is hiding behind and its target.
          mx += (ox / dd) * 1.4 - (oy / dd) * 1.0;
          my += (oy / dd) * 1.4 + (ox / dd) * 1.0;
        }
      }
      // If we have been pinned for a while, let the random unstick vector win
      // in combat too, not just while navigating.
      if (this.unstickT > 0) {
        this.unstickT -= 1 / 30;
        mx = this.unstickX * 2; my = this.unstickY * 2;
      }
      // Stay off the walls — but never at the cost of lining up. The guard is
      // dropped on whichever axis we are currently trying to match, otherwise
      // an enemy parked in a corner can never be aimed at.
      if (a.useX) {
        if (p.x < 130) mx += 1.5;
        if (p.x > 770) mx -= 1.5;
      } else {
        if (p.y < 130) my += 1.5;
        if (p.y > 410) my -= 1.5;
      }
      const mm = Math.hypot(mx, my) || 1;
      g.move(mx / mm, my / mm);
      return;
    }

    // Room is clear: collect anything valuable, then head for an exit.
    this.DIRS.forEach(d => g.release(d));

    let target = null;
    for (const o of room.props) {
      if (o.gone) continue;
      if (o.kind === 'pedestal' && o.itemId) { target = { x: o.x, y: o.y + 6 }; break; }
      if (o.kind === 'chest' && !o.opened) { target = { x: o.x, y: o.y }; break; }
    }
    const banned = this.pickupBan && performance.now() < this.pickupBan;
    if (!target && room.pickups.length && !banned) target = { x: room.pickups[0].x, y: room.pickups[0].y };
    if (!target) {
      const td = room.props.find(o => o.kind === 'trapdoor' && !o.gone);
      // Only take the stairs once nothing else is left in the boss room.
      if (td) target = { x: td.x, y: td.y };
    }
    if (target) { this.walkTo(g, p, target.x, target.y); return; }

    // Pick a door: unexplored first, otherwise the least-visited neighbour.
    // Like a real player, save the boss room for last so we arrive with items.
    if (!this.goal) {
      let open = this.DIRS.filter(d => room.doors[d] && room.doors[d].open);
      if (!open.length) { g.stopMove(); return; }
      const others = R.plan.rooms.filter(r => r.type !== 'boss');
      const explored = others.every(r => r.visited && r.cleared);
      if (!explored) {
        const nonBoss = open.filter(d => room.doors[d].to.type !== 'boss');
        if (nonBoss.length) open = nonBoss;
      }
      const un = open.filter(d => !room.doors[d].to.visited);
      const pool = un.length ? un : open;
      pool.sort((a, b) => (this.visits[room.doors[a].to.id] || 0) - (this.visits[room.doors[b].to.id] || 0));
      this.goal = pool[0];
    }
    const d = this.goal;
    const horiz = d === 'left' || d === 'right';
    // line up with the doorway first, then push through it
    if (horiz) {
      if (Math.abs(p.y - 270) > 14) this.walkTo(g, p, d === 'left' ? 140 : 760, 270);
      else this.walkTo(g, p, d === 'left' ? -60 : 960, 270);
    } else {
      if (Math.abs(p.x - 450) > 14) this.walkTo(g, p, 450, d === 'up' ? 150 : 400);
      else this.walkTo(g, p, 450, d === 'up' ? -60 : 600);
    }
  },
};
