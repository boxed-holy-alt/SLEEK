/* ==========================================================================
   util.js — RNG, math, particles, screen shake, procedural audio
   ========================================================================== */
'use strict';

/* ---------- constants ---------- */
const TILE = 60;
const ROOM_COLS = 15;            // including the 1-tile wall border
const ROOM_ROWS = 9;
const VIEW_W = ROOM_COLS * TILE; // 900
const VIEW_H = ROOM_ROWS * TILE; // 540
const IN_COLS = ROOM_COLS - 2;   // 13 playable columns
const IN_ROWS = ROOM_ROWS - 2;   // 7 playable rows
const IN_X0 = TILE;
const IN_Y0 = TILE;
const IN_X1 = IN_X0 + IN_COLS * TILE; // 840
const IN_Y1 = IN_Y0 + IN_ROWS * TILE; // 480

const DIRS = ['up', 'right', 'down', 'left'];
const DIR_VEC = {
  up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
  left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
};
const DIR_OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };

/* ---------- math ---------- */
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const TAU = Math.PI * 2;

function dist2(ax, ay, bx, by) { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }
function dist(ax, ay, bx, by) { return Math.sqrt(dist2(ax, ay, bx, by)); }

function norm(x, y) {
  const m = Math.hypot(x, y);
  return m < 1e-6 ? { x: 0, y: 0 } : { x: x / m, y: y / m };
}

/** Move `cur` toward `target` by at most `maxDelta`. */
function approach(cur, target, maxDelta) {
  const d = target - cur;
  if (Math.abs(d) <= maxDelta) return target;
  return cur + Math.sign(d) * maxDelta;
}

/* ---------- deterministic RNG (mulberry32) ---------- */
function makeRng(seed) {
  let a = seed >>> 0;
  const r = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.range = (lo, hi) => lo + r() * (hi - lo);
  r.int = (lo, hi) => Math.floor(lo + r() * (hi - lo + 1));   // inclusive
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  r.chance = (p) => r() < p;
  r.shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  return r;
}

/* ---------- particles ---------- */
class Particles {
  constructor(cap = 1400) { this.cap = cap; this.list = []; }
  clear() { this.list.length = 0; }

  spawn(o) {
    if (this.list.length >= this.cap) this.list.shift();
    this.list.push({
      x: o.x, y: o.y,
      vx: o.vx || 0, vy: o.vy || 0,
      life: o.life || 0.4, max: o.life || 0.4,
      size: o.size || 3,
      color: o.color || '#c72222',
      grav: o.grav === undefined ? 420 : o.grav,
      drag: o.drag === undefined ? 2.2 : o.drag,
      shape: o.shape || 'blob',
      rot: o.rot || 0, vrot: o.vrot || 0,
      z: o.z || 0,
    });
  }

  /** Blood/gore burst — the signature Isaac hit feedback. */
  burst(x, y, n, color, opt = {}) {
    const spd = opt.spd || 190, size = opt.size || 4, life = opt.life || 0.55;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, s = spd * (0.3 + Math.random() * 0.9);
      this.spawn({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40,
        life: life * (0.6 + Math.random() * 0.8),
        size: size * (0.5 + Math.random()), color,
        shape: opt.shape || 'blob', grav: opt.grav,
      });
    }
  }

  /** Ring of dust — used for landings and shockwaves. */
  ring(x, y, n, color, spd = 200, size = 4) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + Math.random() * 0.3;
      this.spawn({
        x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd * 0.55,
        life: 0.42, size, color, grav: 40, drag: 3.4, shape: 'dust',
      });
    }
  }

  update(dt) {
    const l = this.list;
    for (let i = l.length - 1; i >= 0; i--) {
      const p = l[i];
      p.life -= dt;
      if (p.life <= 0) { l[i] = l[l.length - 1]; l.pop(); continue; }
      p.vx -= p.vx * p.drag * dt;
      p.vy -= p.vy * p.drag * dt;
      p.vy += p.grav * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vrot * dt;
    }
  }

  draw(ctx) {
    for (const p of this.list) {
      const t = p.life / p.max;
      ctx.globalAlpha = t > 0.6 ? 1 : t / 0.6;
      ctx.fillStyle = p.color;
      const s = p.size * (p.shape === 'dust' ? (1.6 - t * 0.6) : (0.35 + t * 0.65));
      if (p.shape === 'square') {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillRect(-s, -s, s * 2, s * 2); ctx.restore();
      } else {
        ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, TAU); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
}

/* ---------- screen shake ---------- */
const Shake = {
  t: 0, mag: 0, x: 0, y: 0,
  add(mag, time = 0.22) { if (mag > this.mag || this.t < time * 0.4) { this.mag = Math.max(this.mag, mag); this.t = Math.max(this.t, time); this.dur = this.t; } },
  update(dt) {
    if (this.t > 0) {
      this.t -= dt;
      const k = Math.max(0, this.t / (this.dur || 0.22));
      this.x = (Math.random() * 2 - 1) * this.mag * k;
      this.y = (Math.random() * 2 - 1) * this.mag * k;
      if (this.t <= 0) { this.mag = 0; this.x = this.y = 0; }
    }
  },
  reset() { this.t = 0; this.mag = 0; this.x = this.y = 0; },
};

/* ---------- tiny procedural audio (no external assets) ---------- */
const Sfx = {
  ctx: null, master: null, enabled: true,
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { this.enabled = false; return; }
    try {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.3;
      this.master.connect(this.ctx.destination);
    } catch (e) { this.enabled = false; }
  },
  _env(node, gain, atk, dec) {
    const t = this.ctx.currentTime, g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + atk + dec);
    node.connect(g); g.connect(this.master);
    return t + atk + dec;
  },
  tone(freq, freq2, dur, type = 'square', gain = 0.25) {
    if (!this.enabled || !this.ctx) return;
    const o = this.ctx.createOscillator();
    o.type = type;
    const t = this.ctx.currentTime;
    o.frequency.setValueAtTime(freq, t);
    if (freq2) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq2), t + dur);
    const end = this._env(o, gain, 0.005, dur);
    o.start(t); o.stop(end + 0.02);
  },
  noise(dur, gain = 0.25, lp = 1400) {
    if (!this.enabled || !this.ctx) return;
    const sr = this.ctx.sampleRate, len = Math.floor(sr * dur);
    const buf = this.ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp;
    src.connect(f);
    const end = this._env(f, gain, 0.004, dur);
    src.start(this.ctx.currentTime); src.stop(end + 0.02);
  },
  shoot() { this.tone(720, 300, 0.09, 'square', 0.10); },
  hit() { this.noise(0.09, 0.20, 2600); },
  splat() { this.noise(0.26, 0.30, 900); this.tone(180, 60, 0.2, 'sawtooth', 0.12); },
  hurt() { this.tone(160, 70, 0.3, 'sawtooth', 0.3); this.noise(0.18, 0.2, 700); },
  pickup() { this.tone(660, 1180, 0.13, 'triangle', 0.22); },
  item() { this.tone(520, 780, 0.1, 'triangle', 0.22); setTimeout(() => this.tone(780, 1180, 0.18, 'triangle', 0.2), 90); },
  door() { this.noise(0.3, 0.22, 500); this.tone(90, 150, 0.25, 'sawtooth', 0.14); },
  roar() { this.tone(110, 42, 0.85, 'sawtooth', 0.35); this.noise(0.7, 0.3, 500); },
  charge() { this.tone(180, 900, 0.5, 'sawtooth', 0.14); },
  laser() { this.tone(240, 90, 0.4, 'sawtooth', 0.22); this.noise(0.35, 0.16, 2000); },
  win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, f * 1.01, 0.3, 'triangle', 0.22), i * 130)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => this.tone(f, f * 0.99, 0.4, 'sawtooth', 0.22), i * 190)); },
};

/* ---------- misc helpers ---------- */
function fmtTime(sec) {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Cell (col,row) in the 13x7 interior grid -> world centre. */
function cellCenter(cx, cy) {
  return { x: IN_X0 + cx * TILE + TILE / 2, y: IN_Y0 + cy * TILE + TILE / 2 };
}

/** Door centre position on the room border for a direction. */
function doorPos(dir) {
  switch (dir) {
    case 'up': return { x: VIEW_W / 2, y: IN_Y0 };
    case 'down': return { x: VIEW_W / 2, y: IN_Y1 };
    case 'left': return { x: IN_X0, y: VIEW_H / 2 };
    default: return { x: IN_X1, y: VIEW_H / 2 };
  }
}
