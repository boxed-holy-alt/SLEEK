/* ==========================================================================
   dungeon.js — floor plan + room contents.

   The floor plan reproduces the algorithm Isaac actually uses (documented by
   Boris the Brave's teardown of the original source):
     * a grid of cells, BFS outward from the start room
     * a candidate cell is rejected if it already has >1 filled neighbour,
       which is what stops the dungeon from ever looping
     * dead ends are collected; the boss goes in the furthest dead end and
       the other special rooms take the remaining dead ends
   ========================================================================== */
'use strict';

const GRID_W = 9, GRID_H = 8;
const START_GX = 4, START_GY = 3;

/* The twelve floors follow the real descent — Basement down through the Womb
   and out the other side into Sheol / the Cathedral / the Chest. Each chapter
   carries a boss pool rather than a single boss, so two runs down the same
   floor are not the same fight. */
const CHAPTERS = [
  { key: 'basement', theme: 'basement', label: 'BASEMENT', bosses: ['monstro', 'duke'] },
  { key: 'cellar', theme: 'cellar', label: 'CELLAR', bosses: ['larry', 'monstro'] },
  { key: 'caves', theme: 'caves', label: 'CAVES', bosses: ['chub', 'duke'] },
  { key: 'catacombs', theme: 'catacombs', label: 'CATACOMBS', bosses: ['gurdy', 'larry'] },
  { key: 'depths', theme: 'depths', label: 'DEPTHS', bosses: ['monstroII', 'chub'] },
  { key: 'necropolis', theme: 'necropolis', label: 'NECROPOLIS', bosses: ['mom', 'gurdy'] },
  { key: 'womb', theme: 'womb', label: 'WOMB', bosses: ['scolex', 'monstroII'] },
  { key: 'utero', theme: 'utero', label: 'UTERO', bosses: ['momsHeart', 'scolex'] },
  { key: 'bluewomb', theme: 'bluewomb', label: '? ? ?', bosses: ['hush'] },
  { key: 'sheol', theme: 'sheol', label: 'SHEOL', bosses: ['satan'] },
  { key: 'cathedral', theme: 'cathedral', label: 'CATHEDRAL', bosses: ['isaacBoss'] },
  { key: 'chest', theme: 'chest', label: 'THE CHEST', bosses: ['blueBaby'] },
];

/* ---------------------------------------------------------------- floorplan */
function genFloorPlan(level, rng) {
  // Floors grow from a 5-room basement to a 13-room chest.
  const target = clamp(4 + Math.round(level * 0.78) + rng.int(0, 1), 5, 13);
  // A shop shows up once the floor is big enough to spare a third dead end.
  const wantShop = level >= 2 && target >= 7;

  for (let attempt = 0; attempt < 400; attempt++) {
    const cells = new Map();               // "gx,gy" -> room stub
    const key = (gx, gy) => `${gx},${gy}`;
    const filledNeighbours = (gx, gy) => {
      let n = 0;
      for (const d of DIRS) {
        const v = DIR_VEC[d];
        if (cells.has(key(gx + v.x, gy + v.y))) n++;
      }
      return n;
    };

    const start = { gx: START_GX, gy: START_GY, spawnedChild: false };
    cells.set(key(START_GX, START_GY), start);
    const queue = [start];
    let reseeds = 0;

    while (cells.size < target) {
      if (queue.length === 0) {
        if (reseeds++ > 6) break;
        queue.push(start);                 // Isaac reseeds the start room too
      }
      const cur = queue.shift();
      for (const d of rng.shuffle(DIRS.slice())) {
        if (cells.size >= target) break;
        const v = DIR_VEC[d];
        const nx = cur.gx + v.x, ny = cur.gy + v.y;
        if (nx < 0 || ny < 0 || nx >= GRID_W || ny >= GRID_H) continue;
        if (cells.has(key(nx, ny))) continue;
        if (filledNeighbours(nx, ny) > 1) continue;
        if (rng.chance(0.5)) continue;     // the original's 50% bail-out
        const room = { gx: nx, gy: ny, spawnedChild: false };
        cells.set(key(nx, ny), room);
        queue.push(room);
        cur.spawnedChild = true;
      }
    }

    if (cells.size !== target) continue;

    // Connectivity graph + BFS distance from start.
    const list = [...cells.values()];
    for (const r of list) {
      r.neigh = [];
      for (const d of DIRS) {
        const v = DIR_VEC[d];
        const n = cells.get(key(r.gx + v.x, r.gy + v.y));
        if (n) r.neigh.push({ dir: d, room: n });
      }
      r.dist = -1;
    }
    start.dist = 0;
    const bfs = [start];
    while (bfs.length) {
      const r = bfs.shift();
      for (const n of r.neigh) if (n.room.dist < 0) { n.room.dist = r.dist + 1; bfs.push(n.room); }
    }
    if (list.some(r => r.dist < 0)) continue;

    // Dead ends, furthest first.
    const deadEnds = list.filter(r => r !== start && r.neigh.length === 1)
      .sort((a, b) => b.dist - a.dist);
    if (deadEnds.length < 2) continue;

    const boss = deadEnds[0];
    if (boss.dist < 2) continue;                       // boss must not touch start
    const treasure = deadEnds.find(r => r !== boss);
    if (!treasure) continue;
    const shop = wantShop ? deadEnds.find(r => r !== boss && r !== treasure) : null;
    if (wantShop && !shop) continue;

    // Finalise room objects.
    let id = 0;
    for (const r of list) {
      r.id = id++;
      r.type = r === start ? 'start' : r === boss ? 'boss'
        : r === treasure ? 'treasure' : r === shop ? 'shop' : 'normal';
      r.doors = {};
      for (const n of r.neigh) {
        r.doors[n.dir] = { dir: n.dir, to: n.room, kind: 'normal', open: true };
      }
      r.visited = false;
      r.cleared = r.type === 'start' || r.type === 'treasure' || r.type === 'shop';
      r.seed = (rng.int(0, 1e9) ^ (r.id * 2654435761)) >>> 0;
      r.props = [];
      r.pickups = [];
      r.decals = [];
      r.enemySpec = [];
      r.floorCv = null;
    }
    // Door kinds need the final types, so patch them after typing.
    for (const r of list) {
      for (const d of DIRS) {
        const door = r.doors[d];
        if (!door) continue;
        door.kind = door.to.type === 'boss' ? 'boss'
          : door.to.type === 'treasure' ? 'treasure'
            : door.to.type === 'shop' ? 'shop' : 'normal';
      }
    }

    return { rooms: list, start, boss, treasure, shop, level, target, cells };
  }

  // Should never happen, but never hard-fail: fall back to a straight corridor.
  return genFallbackPlan(level, rng);
}

function genFallbackPlan(level, rng) {
  const list = [];
  for (let i = 0; i < 5; i++) list.push({ gx: START_GX + i, gy: START_GY });
  list.forEach((r, i) => {
    r.id = i;
    r.type = i === 0 ? 'start' : i === 4 ? 'boss' : i === 2 ? 'treasure' : 'normal';
    r.dist = i; r.doors = {}; r.visited = false;
    r.cleared = r.type === 'start' || r.type === 'treasure';
    r.seed = (rng.int(0, 1e9) ^ (i * 977)) >>> 0;
    r.props = []; r.pickups = []; r.decals = []; r.enemySpec = []; r.floorCv = null;
  });
  for (let i = 0; i < list.length; i++) {
    if (i > 0) list[i].doors.left = { dir: 'left', to: list[i - 1], kind: 'normal', open: true };
    if (i < list.length - 1) {
      list[i].doors.right = {
        dir: 'right', to: list[i + 1],
        kind: list[i + 1].type === 'boss' ? 'boss' : list[i + 1].type === 'treasure' ? 'treasure' : 'normal',
        open: true,
      };
    }
  }
  return { rooms: list, start: list[0], boss: list[4], treasure: list[2], level, target: 5 };
}

/* ------------------------------------------------------- room prop layouts */
/** Blocking-prop layout templates over the 13x7 interior grid. */
const LAYOUTS = [
  function empty() { return []; },

  function corners(rng) {
    const out = [];
    for (const cx of [1, 2, 10, 11]) for (const cy of [1, 5]) {
      if (rng.chance(0.75)) out.push({ cx, cy, kind: 'rock' });
    }
    return out;
  },

  function pillars(rng) {
    const out = [];
    for (let cx = 2; cx <= 10; cx += 4) for (let cy = 1; cy <= 5; cy += 2) {
      if (cx === 6 && cy === 3) continue;
      out.push({ cx, cy, kind: rng.chance(0.22) ? 'poop' : 'rock' });
    }
    return out;
  },

  function diamond(rng) {
    const out = [];
    const pts = [[6, 1], [5, 2], [7, 2], [4, 3], [8, 3], [5, 4], [7, 4], [6, 5]];
    for (const [cx, cy] of pts) if (rng.chance(0.8)) out.push({ cx, cy, kind: 'rock' });
    return out;
  },

  function pitField(rng) {
    const out = [];
    const w = rng.int(2, 3), h = rng.int(1, 2);
    for (let cx = 6 - w; cx <= 6 + w; cx++) {
      for (let cy = 3 - h; cy <= 3 + h; cy++) {
        if (Math.abs(cx - 6) + Math.abs(cy - 3) * 2 > w + 1) continue;
        out.push({ cx, cy, kind: 'pit' });
      }
    }
    return out;
  },

  function rowsWithGaps(rng) {
    const out = [];
    for (const cy of [1, 5]) {
      const gap = rng.int(3, 9);
      for (let cx = 1; cx <= 11; cx++) {
        if (Math.abs(cx - gap) <= 1) continue;
        if (cx === 6) continue;
        out.push({ cx, cy, kind: rng.chance(0.15) ? 'poop' : 'rock' });
      }
    }
    return out;
  },

  function spikeRing(rng) {
    const out = [];
    for (const [cx, cy] of [[4, 2], [8, 2], [4, 4], [8, 4]]) out.push({ cx, cy, kind: 'spikes' });
    for (const [cx, cy] of [[2, 3], [10, 3]]) if (rng.chance(0.7)) out.push({ cx, cy, kind: 'rock' });
    return out;
  },

  function scatterSym(rng) {
    const out = [];
    const n = rng.int(3, 6);
    for (let i = 0; i < n; i++) {
      const cx = rng.int(1, 5), cy = rng.int(0, 6);
      const kind = rng.chance(0.16) ? 'poop' : rng.chance(0.14) ? 'pit' : 'rock';
      out.push({ cx, cy, kind });
      out.push({ cx: 12 - cx, cy, kind });
    }
    return out;
  },

  /* A spiked gauntlet down the middle: safe to the sides, fast through it. */
  function spikeCorridor(rng) {
    const out = [];
    for (let cx = 3; cx <= 9; cx += 2) {
      out.push({ cx, cy: 2, kind: 'spikes' });
      out.push({ cx, cy: 4, kind: 'spikes' });
    }
    for (const cy of [0, 6]) {
      for (const cx of [2, 10]) if (rng.chance(0.6)) out.push({ cx, cy, kind: 'rock' });
    }
    return out;
  },

  /* Two pits flanking the centre — flight completely changes this room. */
  function twinPits(rng) {
    const out = [];
    for (const ox of [3, 9]) {
      for (let cx = ox - 1; cx <= ox + 1; cx++) {
        for (let cy = 2; cy <= 4; cy++) {
          if (Math.abs(cx - ox) + Math.abs(cy - 3) > 2) continue;
          out.push({ cx, cy, kind: 'pit' });
        }
      }
    }
    if (rng.chance(0.6)) out.push({ cx: 6, cy: 1, kind: 'rock' });
    if (rng.chance(0.6)) out.push({ cx: 6, cy: 5, kind: 'rock' });
    return out;
  },

  /* A ring of rocks with the fight happening inside it. */
  function arena(rng) {
    const out = [];
    for (let cx = 2; cx <= 10; cx += 2) {
      for (const cy of [1, 5]) {
        if (cx === 6) continue;
        if (rng.chance(0.7)) out.push({ cx, cy, kind: rng.chance(0.18) ? 'poop' : 'rock' });
      }
    }
    for (const cx of [2, 10]) {
      if (rng.chance(0.5)) out.push({ cx, cy: 3, kind: 'rock' });
    }
    return out;
  },

  /* Diagonal rubble — no straight shooting lane anywhere. */
  function diagonals(rng) {
    const out = [];
    for (let i = 0; i < 4; i++) {
      const cx = 1 + i * 3, cy = (i * 2) % 7;
      if (cx > 11) continue;
      out.push({ cx, cy, kind: rng.chance(0.2) ? 'poop' : 'rock' });
      out.push({ cx: 12 - cx, cy: 6 - cy, kind: 'rock' });
    }
    return out;
  },
];

/** Enemy composition by chapter — one pool per floor, widening as you fall. */
const ENEMY_POOLS = [
  /*  1 Basement   */['gaper', 'gaper', 'fly', 'pooter', 'horf'],
  /*  2 Cellar     */['gaper', 'pooter', 'horf', 'fly', 'hopper', 'clotty'],
  /*  3 Caves      */['gaper', 'pooter', 'horf', 'clotty', 'hopper', 'boomfly'],
  /*  4 Catacombs  */['gaper', 'horf', 'clotty', 'boomfly', 'globin', 'maw'],
  /*  5 Depths     */['gaper', 'horf', 'clotty', 'globin', 'maw', 'knight'],
  /*  6 Necropolis */['horf', 'clotty', 'globin', 'knight', 'maw', 'boomfly'],
  /*  7 Womb       */['maw', 'globin', 'knight', 'clotty', 'vis', 'hopper'],
  /*  8 Utero      */['maw', 'knight', 'vis', 'globin', 'boomfly', 'clotty'],
  /*  9 ???        */['vis', 'knight', 'maw', 'boomfly', 'globin', 'hopper'],
  /* 10 Sheol      */['vis', 'knight', 'boomfly', 'maw', 'globin', 'clotty'],
  /* 11 Cathedral  */['knight', 'vis', 'maw', 'hopper', 'boomfly', 'globin'],
  /* 12 The Chest  */['vis', 'knight', 'maw', 'boomfly', 'globin', 'clotty'],
];

function pickEnemyTypes(level, rng, count) {
  const pool = ENEMY_POOLS[clamp(level - 1, 0, ENEMY_POOLS.length - 1)];
  const out = [];
  for (let i = 0; i < count; i++) out.push(rng.pick(pool));
  // Guarantee variety: at least two distinct kinds in rooms of 3+.
  if (count >= 3 && new Set(out).size === 1) out[0] = rng.pick(pool.filter(t => t !== out[1]));
  // Vis is a heavy — never more than one per room, or the room becomes a
  // crossfire of beams with nowhere to stand.
  let vis = 0;
  for (let i = 0; i < out.length; i++) {
    if (out[i] !== 'vis') continue;
    if (++vis > 1) out[i] = rng.pick(pool.filter(t => t !== 'vis'));
  }
  return out;
}

/** Chooses this floor's boss, preferring one the run hasn't shown yet. */
function pickBoss(chapter, rng, used) {
  const fresh = chapter.bosses.filter(b => !used || !used.includes(b));
  return rng.pick(fresh.length ? fresh : chapter.bosses);
}

function populateFloor(plan, rng) {
  for (const room of plan.rooms) {
    const rr = makeRng(room.seed);
    const occupied = new Set();
    const mark = (cx, cy) => occupied.add(cx + ',' + cy);
    const isFree = (cx, cy) => !occupied.has(cx + ',' + cy);

    if (room.type === 'normal' || room.type === 'boss') {
      const layout = room.type === 'boss'
        ? (rr.chance(0.5) ? LAYOUTS[0] : LAYOUTS[1])
        : rr.pick(LAYOUTS);
      const cells = layout(rr);

      // Keep the door approach lanes clear so every door is always usable,
      // and always leave the exact centre open — a pit there turns the two
      // protected lanes into a dead end you have to detour all the way around.
      const blocked = new Set(['6,3']);
      for (const d of DIRS) {
        if (!room.doors[d]) continue;
        if (d === 'up') for (let cy = 0; cy <= 2; cy++) blocked.add(6 + ',' + cy);
        if (d === 'down') for (let cy = 4; cy <= 6; cy++) blocked.add(6 + ',' + cy);
        if (d === 'left') for (let cx = 0; cx <= 2; cx++) blocked.add(cx + ',3');
        if (d === 'right') for (let cx = 10; cx <= 12; cx++) blocked.add(cx + ',3');
      }

      for (const c of cells) {
        if (c.cx < 0 || c.cx > 12 || c.cy < 0 || c.cy > 6) continue;
        if (blocked.has(c.cx + ',' + c.cy)) continue;
        if (!isFree(c.cx, c.cy)) continue;
        mark(c.cx, c.cy);
        const p = cellCenter(c.cx, c.cy);
        const seed = rr.range(0, 6.28);
        if (c.kind === 'rock') {
          room.props.push({ kind: 'rock', x: p.x, y: p.y, r: 25, seed, solid: true, blocksTears: true });
        } else if (c.kind === 'poop') {
          room.props.push({ kind: 'poop', x: p.x, y: p.y, r: 23, seed, solid: true, blocksTears: true, hp: 3, maxHp: 3 });
        } else if (c.kind === 'pit') {
          room.props.push({ kind: 'pit', x: p.x, y: p.y, r: 25, seed, solid: true, blocksTears: false, pit: true });
        } else if (c.kind === 'spikes') {
          room.props.push({ kind: 'spikes', x: p.x, y: p.y, r: 24, seed, solid: false, blocksTears: false, up: true, dmg: 1 });
        }
      }

      // ---- enemies ----
      if (room.type === 'normal') {
        const n = clamp(2 + Math.floor(plan.level * 0.9) + rr.int(0, 2), 2, 7);
        const types = pickEnemyTypes(plan.level, rr, n);
        const spots = [];
        for (let cx = 1; cx <= 11; cx++) for (let cy = 0; cy <= 6; cy++) {
          if (!isFree(cx, cy)) continue;
          // keep enemies away from the exact centre so the player has landing space
          if (Math.abs(cx - 6) <= 1 && Math.abs(cy - 3) <= 1) continue;
          spots.push({ cx, cy });
        }
        rr.shuffle(spots);
        types.forEach((t, i) => {
          const s = spots[i % Math.max(1, spots.length)] || { cx: 3, cy: 1 };
          const p = cellCenter(s.cx, s.cy);
          room.enemySpec.push({ type: t, x: p.x, y: p.y });
        });
      } else {
        const def = ENEMY_DEFS[plan.bossType];
        // Gurdy and Mom's Heart hang off the top wall; everyone else lands
        // slightly above centre so the player has room to enter.
        const y = def && def.anchor === 'top' ? IN_Y0 + 96 : VIEW_H / 2 - 30;
        room.enemySpec.push({ type: plan.bossType, x: VIEW_W / 2, y, boss: true });
      }
    }

    if (room.type === 'treasure') {
      room.props.push({ kind: 'pedestal', x: VIEW_W / 2, y: VIEW_H / 2, r: 20, solid: false, itemId: null });
      for (const [cx, cy] of [[2, 1], [10, 1], [2, 5], [10, 5]]) {
        if (rr.chance(0.6)) {
          const p = cellCenter(cx, cy);
          room.props.push({ kind: 'rock', x: p.x, y: p.y, r: 25, seed: rr.range(0, 6.28), solid: true, blocksTears: true });
        }
      }
      // A free chest for good measure.
      if (rr.chance(0.55)) {
        const p = cellCenter(rr.chance(0.5) ? 3 : 9, 3);
        room.props.push({ kind: 'chest', x: p.x, y: p.y, r: 20, solid: false, kindOf: 'wood', opened: false });
      }
    }

    if (room.type === 'shop') {
      // Three stalls along the middle of the room. Prices scale with depth so
      // coins keep mattering instead of piling up unspent.
      const base = 5 + Math.floor(plan.level * 0.8);
      const slots = [[3, 3], [6, 3], [9, 3]];
      slots.forEach(([cx, cy], i) => {
        const p = cellCenter(cx, cy);
        if (i === 1 && rr.chance(0.45)) {
          room.props.push({
            kind: 'shopItem', x: p.x, y: p.y, r: 20, solid: false,
            offer: 'heart', price: Math.max(3, base - 2),
          });
        } else {
          room.props.push({
            kind: 'shopItem', x: p.x, y: p.y, r: 20, solid: false,
            offer: 'item', itemId: null, price: base + rr.int(0, 4),
          });
        }
      });
      for (const [cx, cy] of [[1, 1], [11, 1], [1, 5], [11, 5]]) {
        if (rr.chance(0.5)) {
          const p = cellCenter(cx, cy);
          room.props.push({ kind: 'rock', x: p.x, y: p.y, r: 25, seed: rr.range(0, 6.28), solid: true, blocksTears: true });
        }
      }
    }

    if (room.type === 'normal' && rr.chance(0.35)) {
      // occasional chest tucked in a corner of a normal room
      const cx = rr.pick([2, 10]), cy = rr.pick([1, 5]);
      if (isFree(cx, cy)) {
        mark(cx, cy);
        const p = cellCenter(cx, cy);
        room.props.push({
          kind: 'chest', x: p.x, y: p.y, r: 20, solid: false,
          kindOf: rr.chance(0.25) ? 'gold' : 'wood', opened: false,
        });
      }
    }
  }
  return plan;
}

function generateFloor(level, seed, usedBosses) {
  const rng = makeRng(seed);
  const plan = genFloorPlan(level, rng);
  plan.chapter = CHAPTERS[clamp(level - 1, 0, CHAPTERS.length - 1)];
  plan.theme = THEMES[plan.chapter.theme];
  plan.bossType = pickBoss(plan.chapter, rng, usedBosses);
  populateFloor(plan, rng);
  return plan;
}
