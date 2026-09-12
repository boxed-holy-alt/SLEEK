/* ==========================================================================
   art.js — every pixel in this game is drawn with code.
   Style target: The Binding of Isaac's "dirty basement" look — heavy black
   outlines, pale sickly flesh, desaturated brown stone, blood everywhere.
   ========================================================================== */
'use strict';

const OUTLINE = '#150c07';
const FLESH = '#f0dcbe';
const FLESH_HI = '#fdf3e0';
const FLESH_SH = '#c3ab8b';
const BLOOD = '#a3121b';
const BLOOD_DK = '#5d0a10';
const BLOOD_LT = '#d92c2c';

/* Floor / wall palettes per chapter.
   `flesh: true` swaps the baked floor over to the organic look used by the
   Womb-family chapters (no tile grid, veins and membrane instead of stone). */
const THEMES = {
  basement: {
    name: 'THE BASEMENT',
    floorA: '#6e5c40', floorB: '#63523a', grout: '#4a3c28',
    wallFace: '#33281a', wallTop: '#4d3d26', wallDark: '#150e07',
    grime: 'rgba(24,15,7,0.58)', accent: '#94805a', fog: 'rgba(20,12,6,0.55)',
    stain: '#4a1a12',
  },
  cellar: {
    name: 'THE CELLAR',
    floorA: '#7a6a4c', floorB: '#6a5a3e', grout: '#514330',
    wallFace: '#3b3020', wallTop: '#57472c', wallDark: '#191108',
    grime: 'rgba(30,20,10,0.5)', accent: '#a89373', fog: 'rgba(26,18,9,0.5)',
    stain: '#4a2416', cobweb: true,
  },
  caves: {
    name: 'THE CAVES',
    floorA: '#565c4a', floorB: '#4c5241', grout: '#363b2c',
    wallFace: '#262c1d', wallTop: '#3d4630', wallDark: '#0d1108',
    grime: 'rgba(14,20,10,0.58)', accent: '#7f8c66', fog: 'rgba(12,18,10,0.6)',
    stain: '#3a2410',
  },
  catacombs: {
    name: 'THE CATACOMBS',
    floorA: '#4e5058', floorB: '#45474f', grout: '#33353c',
    wallFace: '#232630', wallTop: '#383c48', wallDark: '#0a0b0f',
    grime: 'rgba(10,12,18,0.6)', accent: '#8d92a2', fog: 'rgba(8,10,16,0.62)',
    stain: '#3a1c1c', bones: true,
  },
  depths: {
    name: 'THE DEPTHS',
    floorA: '#474050', floorB: '#3e3846', grout: '#302a38',
    wallFace: '#221c2b', wallTop: '#352c42', wallDark: '#0b0810',
    grime: 'rgba(12,7,18,0.6)', accent: '#77678a', fog: 'rgba(10,6,16,0.65)',
    stain: '#3d1424',
  },
  necropolis: {
    name: 'THE NECROPOLIS',
    floorA: '#4a3038', floorB: '#412a31', grout: '#301f26',
    wallFace: '#241419', wallTop: '#3a2028', wallDark: '#0d0507',
    grime: 'rgba(16,5,8,0.62)', accent: '#8a5060', fog: 'rgba(14,4,7,0.66)',
    stain: '#57101a', bones: true,
  },
  womb: {
    name: 'THE WOMB',
    floorA: '#8e2f34', floorB: '#7d272d', grout: '#5c161c',
    wallFace: '#54141a', wallTop: '#7a2128', wallDark: '#28060a',
    grime: 'rgba(40,4,8,0.5)', accent: '#d4636a', fog: 'rgba(46,4,10,0.5)',
    stain: '#3f0a10', flesh: true,
  },
  utero: {
    name: 'THE UTERO',
    floorA: '#6d2a34', floorB: '#5f232c', grout: '#45141b',
    wallFace: '#3d1017', wallTop: '#5c1c24', wallDark: '#1c0407',
    grime: 'rgba(30,3,7,0.56)', accent: '#b9535f', fog: 'rgba(34,3,8,0.56)',
    stain: '#33070d', flesh: true,
  },
  bluewomb: {
    name: '???',
    floorA: '#2c5a72', floorB: '#265066', grout: '#183a4c',
    wallFace: '#153244', wallTop: '#22506a', wallDark: '#061620',
    grime: 'rgba(4,18,28,0.55)', accent: '#66c2dd', fog: 'rgba(4,20,32,0.55)',
    stain: '#123c50', flesh: true, glow: '#8fe6ff',
  },
  sheol: {
    name: 'SHEOL',
    floorA: '#2e2622', floorB: '#28211d', grout: '#1a1512',
    wallFace: '#171110', wallTop: '#2b201c', wallDark: '#060403',
    grime: 'rgba(8,3,2,0.68)', accent: '#a4402c', fog: 'rgba(10,2,2,0.7)',
    stain: '#5a0f0a', ember: true,
  },
  cathedral: {
    name: 'THE CATHEDRAL',
    floorA: '#b9b4a4', floorB: '#a9a495', grout: '#8a8577',
    wallFace: '#6f6a5c', wallTop: '#948e7e', wallDark: '#3a362e',
    grime: 'rgba(60,56,44,0.34)', accent: '#f0e6c0', fog: 'rgba(70,66,52,0.3)',
    stain: '#8a7a58', holy: true,
  },
  chest: {
    name: 'THE CHEST',
    floorA: '#8a6a38', floorB: '#7a5c2f', grout: '#5b4322',
    wallFace: '#4a3517', wallTop: '#6d5024', wallDark: '#1e1408',
    grime: 'rgba(28,18,4,0.5)', accent: '#e0bb5a', fog: 'rgba(30,20,5,0.5)',
    stain: '#4a2a10', holy: true,
  },
};

/* ---------- primitive helpers ---------- */
function oval(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
}
function inkFill(ctx, fill, lw = 3, stroke = OUTLINE) {
  ctx.fillStyle = fill; ctx.fill();
  if (lw > 0) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
}
function blob(ctx, x, y, r, seedR, points = 9, amp = 0.32) {
  const pts = [];
  for (let i = 0; i < points; i++) {
    const a = (i / points) * TAU;
    const rr = r * (1 - amp * 0.5 + amp * ((Math.sin(a * 3 + seedR) + Math.sin(a * 5 - seedR * 2)) * 0.5 + 0.5));
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  // Smooth the silhouette with midpoint quadratics so shapes read as organic
  // lumps rather than faceted polygons.
  ctx.beginPath();
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let m = mid(pts[points - 1], pts[0]);
  ctx.moveTo(m[0], m[1]);
  for (let i = 0; i < points; i++) {
    const next = mid(pts[i], pts[(i + 1) % points]);
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], next[0], next[1]);
  }
  ctx.closePath();
}
/** Soft top-down highlight used on nearly every body part. */
function sheen(ctx, x, y, rx, ry, strength = 0.35) {
  const g = ctx.createRadialGradient(x - rx * 0.3, y - ry * 0.45, rx * 0.1, x, y, rx * 1.15);
  g.addColorStop(0, `rgba(255,255,255,${strength})`);
  g.addColorStop(0.55, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = g;
  oval(ctx, x, y, rx, ry); ctx.fill();
}

/* ==========================================================================
   ROOM FLOOR — baked once per room into an offscreen canvas
   ========================================================================== */
function bakeFloor(room, theme) {
  const cv = document.createElement('canvas');
  cv.width = VIEW_W; cv.height = VIEW_H;
  const c = cv.getContext('2d');
  const rng = makeRng(room.seed ^ 0x9e3779b9);
  const T = theme;

  c.fillStyle = T.grout;
  c.fillRect(0, 0, VIEW_W, VIEW_H);

  if (T.flesh) {
    // Womb-family chapters: no masonry at all. A membrane of overlapping
    // fleshy lobes with veins crawling across it.
    c.fillStyle = T.floorA;
    c.fillRect(IN_X0, IN_Y0, IN_COLS * TILE, IN_ROWS * TILE);
    for (let i = 0; i < 90; i++) {
      const x = rng.range(IN_X0 - 20, IN_X1 + 20), y = rng.range(IN_Y0 - 20, IN_Y1 + 20);
      c.globalAlpha = rng.range(0.12, 0.3);
      c.fillStyle = rng.chance(0.5) ? T.floorB : T.accent;
      blob(c, x, y, rng.range(22, 62), rng.range(0, 6), 9, 0.35); c.fill();
    }
    c.globalAlpha = 1;
    // veins
    for (let i = 0; i < 26; i++) {
      c.strokeStyle = `rgba(${T.glow ? '150,230,255' : '60,8,14'},${rng.range(0.14, 0.34)})`;
      c.lineWidth = rng.range(1.4, 4);
      c.beginPath();
      let px = rng.range(IN_X0, IN_X1), py = rng.range(IN_Y0, IN_Y1);
      c.moveTo(px, py);
      for (let s = 0; s < 5; s++) {
        const nx = px + rng.range(-60, 60), ny = py + rng.range(-46, 46);
        c.quadraticCurveTo(px + rng.range(-24, 24), py + rng.range(-24, 24), nx, ny);
        px = nx; py = ny;
      }
      c.stroke();
    }
    // pores
    for (let i = 0; i < 40; i++) {
      const x = rng.range(IN_X0 + 8, IN_X1 - 8), y = rng.range(IN_Y0 + 8, IN_Y1 - 8);
      c.fillStyle = `rgba(0,0,0,${rng.range(0.12, 0.3)})`;
      c.beginPath(); c.ellipse(x, y, rng.range(2, 6), rng.range(1.5, 4), rng.range(0, 3), 0, TAU); c.fill();
    }
  } else {
    // Stone tiles, each slightly different so the floor reads as hand-painted.
    for (let cy = 0; cy < IN_ROWS; cy++) {
      for (let cx = 0; cx < IN_COLS; cx++) {
        const x = IN_X0 + cx * TILE, y = IN_Y0 + cy * TILE;
        const base = rng.chance(0.5) ? T.floorA : T.floorB;
        c.fillStyle = base;
        c.fillRect(x + 1, y + 1, TILE - 1.5, TILE - 1.5);

        // very soft bevel — the grid should be felt, not counted
        c.fillStyle = 'rgba(255,240,210,0.045)';
        c.fillRect(x + 1, y + 1, TILE - 1.5, 2);
        c.fillStyle = 'rgba(0,0,0,0.1)';
        c.fillRect(x + 1, y + TILE - 2.5, TILE - 1.5, 2);

        // speckle grit
        for (let i = 0; i < 20; i++) {
          c.fillStyle = rng.chance(0.55) ? 'rgba(0,0,0,0.15)' : 'rgba(255,240,210,0.06)';
          const s = rng.range(1, 3.2);
          c.fillRect(x + rng.range(2, TILE - 4), y + rng.range(2, TILE - 4), s, s);
        }
        // occasional crack
        if (rng.chance(0.2)) {
          c.strokeStyle = 'rgba(0,0,0,0.26)'; c.lineWidth = 1.4;
          c.beginPath();
          let px = x + rng.range(8, TILE - 8), py = y + rng.range(8, TILE - 8);
          c.moveTo(px, py);
          for (let s = 0; s < 3; s++) { px += rng.range(-16, 16); py += rng.range(-16, 16); c.lineTo(px, py); }
          c.stroke();
        }
      }
    }
  }

  // Chapter garnish baked straight into the floor.
  if (T.bones) {
    // Scattered bone litter. Kept small and faint: it is floor texture, not
    // set dressing that competes with the enemies standing on it.
    for (let i = 0; i < 14; i++) {
      const x = rng.range(IN_X0 + 30, IN_X1 - 30), y = rng.range(IN_Y0 + 30, IN_Y1 - 30);
      c.save();
      c.translate(x, y); c.rotate(rng.range(0, TAU));
      c.globalAlpha = rng.range(0.1, 0.22);
      c.fillStyle = '#cfc9b2';
      const L = rng.range(5, 10);
      c.fillRect(-L, -1, L * 2, 2);
      for (const sd of [-1, 1]) {
        c.beginPath(); c.arc(sd * L, -1.4, 1.6, 0, TAU); c.fill();
        c.beginPath(); c.arc(sd * L, 1.4, 1.6, 0, TAU); c.fill();
      }
      c.restore();
    }
    c.globalAlpha = 1;
  }
  if (T.ember) {
    for (let i = 0; i < 16; i++) {
      const x = rng.range(IN_X0 + 20, IN_X1 - 20), y = rng.range(IN_Y0 + 20, IN_Y1 - 20);
      const r = rng.range(10, 30);
      const eg = c.createRadialGradient(x, y, 1, x, y, r);
      eg.addColorStop(0, `rgba(255,120,40,${rng.range(0.1, 0.26)})`);
      eg.addColorStop(1, 'rgba(255,80,20,0)');
      c.fillStyle = eg;
      c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    }
  }
  if (T.holy) {
    // faint tiled cross / marble veining
    c.strokeStyle = 'rgba(255,250,230,0.12)'; c.lineWidth = 1.6;
    for (let i = 0; i < 18; i++) {
      c.beginPath();
      let px = rng.range(IN_X0, IN_X1), py = rng.range(IN_Y0, IN_Y1);
      c.moveTo(px, py);
      for (let s = 0; s < 4; s++) { px += rng.range(-50, 50); py += rng.range(-34, 34); c.lineTo(px, py); }
      c.stroke();
    }
    const hg = c.createRadialGradient(VIEW_W / 2, IN_Y0 + 40, 10, VIEW_W / 2, IN_Y0 + 40, 320);
    hg.addColorStop(0, 'rgba(255,240,190,0.16)');
    hg.addColorStop(1, 'rgba(255,240,190,0)');
    c.fillStyle = hg;
    c.fillRect(IN_X0, IN_Y0, IN_COLS * TILE, IN_ROWS * TILE);
  }

  // Large-scale mottling breaks up the tile grid into organic patches.
  for (let i = 0; i < 26; i++) {
    const x = rng.range(IN_X0, IN_X1), y = rng.range(IN_Y0, IN_Y1);
    const r = rng.range(40, 130);
    const g2 = c.createRadialGradient(x, y, 2, x, y, r);
    const dark = rng.chance(0.6);
    g2.addColorStop(0, dark ? 'rgba(20,12,6,0.17)' : 'rgba(255,238,205,0.06)');
    g2.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g2;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  }

  // Grime pooling in the corners of the room.
  const g = c.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.2, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.8);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, T.grime);
  c.fillStyle = g;
  c.fillRect(0, 0, VIEW_W, VIEW_H);

  // Old dried blood stains, so rooms never look sterile.
  for (let i = 0; i < 6; i++) {
    const x = rng.range(IN_X0 + 40, IN_X1 - 40), y = rng.range(IN_Y0 + 40, IN_Y1 - 40);
    c.globalAlpha = rng.range(0.12, 0.3);
    c.fillStyle = rng.chance(0.5) ? BLOOD_DK : T.stain;
    blob(c, x, y, rng.range(18, 46), rng.range(0, 6)); c.fill();
    // a few splatter dots around each stain
    for (let j = 0; j < 6; j++) {
      const a = rng.range(0, TAU), d = rng.range(20, 64);
      c.beginPath();
      c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, rng.range(1.5, 5), 0, TAU);
      c.fill();
    }
    c.globalAlpha = 1;
  }
  return cv;
}

/* ==========================================================================
   WALLS + DOORS
   ========================================================================== */
function drawWalls(ctx, room, theme) {
  const T = theme;
  const rng = makeRng(room.seed ^ 0x1234567);

  // Base wall band around the room.
  ctx.fillStyle = T.wallFace;
  ctx.fillRect(0, 0, VIEW_W, IN_Y0);
  ctx.fillRect(0, IN_Y1, VIEW_W, VIEW_H - IN_Y1);
  ctx.fillRect(0, 0, IN_X0, VIEW_H);
  ctx.fillRect(IN_X1, 0, VIEW_W - IN_X1, VIEW_H);

  // Brick courses on the top wall (that is the one you read as "vertical").
  // The Womb chapters have no masonry, so they skip straight to the membrane.
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, VIEW_W, IN_Y0); ctx.clip();
  if (!T.flesh) {
    for (let row = 0; row < 2; row++) {
      const y = row * 30;
      for (let bx = (row % 2) * -28; bx < VIEW_W; bx += 56) {
        ctx.fillStyle = rng.chance(0.5) ? T.wallFace : T.wallTop;
        ctx.fillRect(bx + 2, y + 2, 52, 26);
        ctx.fillStyle = 'rgba(255,240,210,0.045)';
        ctx.fillRect(bx + 2, y + 2, 52, 3);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(bx + 2, y + 25, 52, 3);
      }
    }
  }
  // grime + dried blood running down the back wall
  for (let i = 0; i < 8; i++) {
    const x = rng.range(20, VIEW_W - 20);
    ctx.globalAlpha = rng.range(0.12, 0.3);
    ctx.fillStyle = rng.chance(0.55) ? T.stain : '#000';
    blob(ctx, x, rng.range(4, IN_Y0 - 4), rng.range(8, 22), rng.range(0, 6), 8);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // cobwebs in the top corners (stone chapters only — flesh walls have veins,
  // and a cobwebbed cathedral just reads as a mistake)
  if (!T.flesh && !T.holy) {
    for (const sd of [0, 1]) {
      const cxw = sd ? VIEW_W : 0;
      ctx.strokeStyle = 'rgba(230,225,210,0.14)'; ctx.lineWidth = 1.2;
      for (let i = 1; i <= (T.cobweb ? 7 : 4); i++) {
        ctx.beginPath();
        ctx.moveTo(cxw + (sd ? -i * 13 : i * 13), 0);
        ctx.quadraticCurveTo(cxw + (sd ? -i * 8 : i * 8), i * 8, cxw, i * 13);
        ctx.stroke();
      }
    }
  }
  if (T.flesh) {
    // pulsing membrane instead of brick courses
    for (let i = 0; i < 22; i++) {
      ctx.globalAlpha = rng.range(0.16, 0.4);
      ctx.fillStyle = rng.chance(0.5) ? T.wallTop : T.accent;
      blob(ctx, rng.range(0, VIEW_W), rng.range(0, IN_Y0), rng.range(12, 34), rng.range(0, 6), 9, 0.36);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  if (T.bones) {
    // skulls embedded in the back wall
    for (let i = 0; i < 7; i++) {
      const x = rng.range(40, VIEW_W - 40), y = rng.range(12, IN_Y0 - 14);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#cdc7b0';
      oval(ctx, x, y, 9, 10); ctx.fill();
      ctx.fillStyle = '#191512';
      oval(ctx, x - 3.4, y - 1, 2.6, 3); ctx.fill();
      oval(ctx, x + 3.4, y - 1, 2.6, 3); ctx.fill();
      ctx.fillRect(x - 2, y + 5, 4, 3);
      ctx.globalAlpha = 1;
    }
  }
  if (T.holy) {
    // stained-glass arches glowing on the back wall
    for (let i = 0; i < 5; i++) {
      const x = 90 + i * 180;
      const gg = ctx.createLinearGradient(x, 4, x, IN_Y0 - 6);
      gg.addColorStop(0, 'rgba(255,236,170,0.4)');
      gg.addColorStop(1, 'rgba(180,150,90,0.08)');
      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.moveTo(x - 15, IN_Y0 - 6); ctx.lineTo(x - 15, 22);
      ctx.quadraticCurveTo(x, -6, x + 15, 22);
      ctx.lineTo(x + 15, IN_Y0 - 6); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(40,34,24,0.6)'; ctx.lineWidth = 2.4; ctx.stroke();
    }
  }
  ctx.restore();

  // Top highlight strip + heavy dark shadow where wall meets floor.
  ctx.fillStyle = T.wallTop;
  ctx.fillRect(0, 0, VIEW_W, 5);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(IN_X0 - 10, IN_Y0 - 12, IN_COLS * TILE + 20, 14);
  // inner border lip
  ctx.lineWidth = 9; ctx.strokeStyle = T.wallDark;
  ctx.strokeRect(IN_X0 - 4.5, IN_Y0 - 4.5, IN_COLS * TILE + 9, IN_ROWS * TILE + 9);
  ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,240,210,0.07)';
  ctx.strokeRect(IN_X0 - 0.5, IN_Y0 - 0.5, IN_COLS * TILE + 1, IN_ROWS * TILE + 1);

  // Cast shadow from the walls onto the floor.
  const sg = ctx.createLinearGradient(0, IN_Y0, 0, IN_Y0 + 44);
  sg.addColorStop(0, 'rgba(0,0,0,0.42)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sg; ctx.fillRect(IN_X0, IN_Y0, IN_COLS * TILE, 44);
  const sl = ctx.createLinearGradient(IN_X0, 0, IN_X0 + 34, 0);
  sl.addColorStop(0, 'rgba(0,0,0,0.34)'); sl.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sl; ctx.fillRect(IN_X0, IN_Y0, 34, IN_ROWS * TILE);
  const sr = ctx.createLinearGradient(IN_X1, 0, IN_X1 - 34, 0);
  sr.addColorStop(0, 'rgba(0,0,0,0.34)'); sr.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sr; ctx.fillRect(IN_X1 - 34, IN_Y0, 34, IN_ROWS * TILE);
  const sb = ctx.createLinearGradient(0, IN_Y1, 0, IN_Y1 - 26);
  sb.addColorStop(0, 'rgba(0,0,0,0.3)'); sb.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = sb; ctx.fillRect(IN_X0, IN_Y1 - 26, IN_COLS * TILE, 26);
}

/** Door frame + the two swinging slabs. */
function drawDoor(ctx, dir, kind, open, theme) {
  const p = doorPos(dir);
  const horiz = dir === 'up' || dir === 'down';
  const W = 92, D = TILE;   // opening width, wall depth

  ctx.save();
  ctx.translate(p.x, p.y);
  // Rotate so that we always author the door as if it were on the TOP wall.
  const rot = { up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 }[dir];
  ctx.rotate(rot);
  // local space: opening spans x in [-W/2, W/2], wall occupies y in [-D, 0]

  const frame = { normal: '#5b4a30', boss: '#4a2a2a', treasure: '#7d6528', shop: '#2f4a55', secret: '#3a3a44' }[kind] || '#5b4a30';
  const slab = { normal: '#8a6f42', boss: '#8f2f2f', treasure: '#c9a83c', shop: '#3f7f92', secret: '#5a5a68' }[kind] || '#8a6f42';

  // Carved opening: a corridor receding into darkness, not a flat black hole.
  const void_ = ctx.createLinearGradient(0, -D - 2, 0, 6);
  void_.addColorStop(0, '#0d0906');
  void_.addColorStop(0.55, '#1c1409');
  void_.addColorStop(1, '#332614');
  ctx.fillStyle = void_;
  ctx.fillRect(-W / 2, -D - 2, W, D + 4);
  // suggestion of floor tiles continuing through the gap
  ctx.strokeStyle = 'rgba(255,240,210,0.07)'; ctx.lineWidth = 1.5;
  for (let i = 1; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(-W / 2 + i * 8, -D + i * 6);
    ctx.lineTo(W / 2 - i * 8, -D + i * 6);
    ctx.stroke();
  }
  // arched top of the doorway
  ctx.fillStyle = frame;
  ctx.beginPath();
  ctx.moveTo(-W / 2 - 2, -D - 2);
  ctx.quadraticCurveTo(0, -D + 16, W / 2 + 2, -D - 2);
  ctx.lineTo(W / 2 + 2, -D - 8);
  ctx.lineTo(-W / 2 - 2, -D - 8);
  ctx.closePath();
  inkFill(ctx, frame, 2.6);

  // stone frame
  ctx.fillStyle = frame;
  ctx.fillRect(-W / 2 - 14, -D - 2, 14, D + 6);
  ctx.fillRect(W / 2, -D - 2, 14, D + 6);
  ctx.fillStyle = 'rgba(255,240,210,0.12)';
  ctx.fillRect(-W / 2 - 14, -D - 2, 14, 4);
  ctx.fillRect(W / 2, -D - 2, 14, 4);
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = 3;
  ctx.strokeRect(-W / 2 - 14, -D - 2, 14, D + 6);
  ctx.strokeRect(W / 2, -D - 2, 14, D + 6);
  // brick detail on the jambs
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.6;
  for (let i = 1; i < 3; i++) {
    const y = -D - 2 + i * (D + 6) / 3;
    ctx.beginPath(); ctx.moveTo(-W / 2 - 14, y); ctx.lineTo(-W / 2, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W / 2, y); ctx.lineTo(W / 2 + 14, y); ctx.stroke();
  }

  if (open) {
    // Slabs retracted into the frame; a lit threshold on the floor.
    ctx.fillStyle = slab;
    ctx.globalAlpha = 0.92;
    ctx.beginPath(); ctx.rect(-W / 2, -D - 2, 9, D + 4); inkFill(ctx, slab, 2);
    ctx.beginPath(); ctx.rect(W / 2 - 9, -D - 2, 9, D + 4); inkFill(ctx, slab, 2);
    ctx.globalAlpha = 1;
    // warm light spilling onto the floor from the room we came from
    const g = ctx.createLinearGradient(0, -D, 0, 22);
    g.addColorStop(0, 'rgba(0,0,0,0.55)');
    g.addColorStop(0.45, 'rgba(120,90,50,0.18)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-W / 2 + 9, -D, W - 18, D + 22);
    // threshold stone
    ctx.fillStyle = 'rgba(150,128,88,0.35)';
    ctx.fillRect(-W / 2 + 9, -3, W - 18, 5);
  } else {
    // Two closed slabs meeting in the middle.
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.translate(s * W / 4, -D / 2);
      ctx.fillStyle = slab;
      ctx.beginPath();
      ctx.rect(-W / 4 + 2, -D / 2 - 2, W / 2 - 4, D + 4);
      inkFill(ctx, slab, 3);
      // planks
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath(); ctx.moveTo(i * 14, -D / 2); ctx.lineTo(i * 14, D / 2); ctx.stroke();
      }
      ctx.restore();
    }
    // Ornament in the middle of the closed door
    ctx.save();
    ctx.translate(0, -D / 2);
    if (kind === 'boss') {
      // little skull
      ctx.fillStyle = '#e8e0cf';
      oval(ctx, 0, -2, 11, 12); inkFill(ctx, '#e8e0cf', 2.5);
      ctx.fillStyle = OUTLINE;
      oval(ctx, -4, -3, 3, 4); ctx.fill();
      oval(ctx, 4, -3, 3, 4); ctx.fill();
      ctx.fillRect(-5, 5, 10, 5);
      ctx.strokeStyle = '#8f2f2f'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-5, 6.5); ctx.lineTo(5, 6.5); ctx.stroke();
    } else if (kind === 'treasure') {
      ctx.fillStyle = '#ffe98a';
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 5 : 11;
        const px = Math.cos(a) * r, py = Math.sin(a) * r;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath(); inkFill(ctx, '#ffe98a', 2.5);
    } else if (kind === 'shop') {
      // a fat coin so the shop door reads at a glance on any wall
      oval(ctx, 0, 0, 9, 9);
      inkFill(ctx, '#e7c351', 2.5);
      ctx.fillStyle = '#8a6a20';
      ctx.font = 'bold 11px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('$', 0, 4);
    } else {
      ctx.fillStyle = '#3a2c1a';
      oval(ctx, 0, 0, 7, 7); inkFill(ctx, '#3a2c1a', 2.5);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      oval(ctx, -2, -2, 2.5, 2.5); ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}

/* ==========================================================================
   PLAYER — Isaac: enormous bald head, tiny body, permanent tears
   ========================================================================== */
const PLAYER_ART_SCALE = 1.16;   // purely visual: keeps the hitbox honest
function drawPlayer(ctx, p) {
  const s = (p.visScale || 1) * PLAYER_ART_SCALE;
  const bob = Math.sin(p.animT * 11) * (p.moving ? 2.4 : 0.9) * s;
  const squash = 1 + Math.sin(p.animT * 11) * (p.moving ? 0.045 : 0.015);
  const faceDir = p.headDir;
  // Transcendence lifts him clear off the floor
  const lift = p.flags.float ? 14 + Math.sin(p.animT * 1.8) * 3 : 0;
  const x = p.x, y = p.y + bob - lift;

  ctx.save();
  if (p.invuln > 0 && Math.floor(p.invuln * 18) % 2 === 0) ctx.globalAlpha = 0.42;

  // ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.36)';
  oval(ctx, p.x, p.y + 20 * s, 17 * s, 7 * s); ctx.fill();

  // flight halo of dust for Lord of the Pit
  if (p.flags.flight) {
    ctx.fillStyle = 'rgba(120,90,190,0.25)';
    oval(ctx, p.x, p.y + 16 * s, 20 * s, 8 * s); ctx.fill();
  }

  ctx.translate(x, y);
  ctx.scale(s, s);

  // dark aura (Pentagram)
  if (p.flags.aura) {
    const g = ctx.createRadialGradient(0, 0, 6, 0, 0, 44);
    g.addColorStop(0, 'rgba(90,10,110,0.4)');
    g.addColorStop(1, 'rgba(90,10,110,0)');
    ctx.fillStyle = g;
    oval(ctx, 0, 0, 44, 44); ctx.fill();
  }
  // The Mark: a raw red brand burnt into the floor around him
  if (p.flags.mark) {
    ctx.save();
    ctx.rotate(p.animT * 0.6);
    ctx.strokeStyle = `rgba(220,50,50,${0.35 + Math.sin(p.animT * 3) * 0.15})`;
    ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * TAU;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 18, Math.sin(a) * 12);
      ctx.lineTo(Math.cos(a) * 34, Math.sin(a) * 22);
      ctx.stroke();
    }
    ctx.restore();
  }
  // Holy Mantle's bubble
  if (p.shieldUp) {
    const g = ctx.createRadialGradient(0, -10, 8, 0, -10, 34);
    g.addColorStop(0, 'rgba(200,235,255,0.05)');
    g.addColorStop(0.75, 'rgba(200,235,255,0.16)');
    g.addColorStop(1, 'rgba(200,235,255,0.4)');
    ctx.fillStyle = g;
    oval(ctx, 0, -10, 32, 34); ctx.fill();
    ctx.strokeStyle = `rgba(230,245,255,${0.5 + Math.sin(p.animT * 3) * 0.2})`;
    ctx.lineWidth = 2;
    oval(ctx, 0, -10, 32, 34); ctx.stroke();
  }

  // ---- legs ----
  const step = Math.sin(p.animT * 13) * (p.moving ? 5 : 0);
  for (const sd of [-1, 1]) {
    ctx.save();
    ctx.translate(sd * 6, 14);
    ctx.rotate(sd * step * 0.03);
    oval(ctx, 0, sd * step * 0.35, 4.6, 8);
    inkFill(ctx, FLESH_SH, 2.4);
    ctx.restore();
  }

  // ---- torso ----
  oval(ctx, 0, 8, 10, 9 * squash);
  inkFill(ctx, FLESH, 2.6);
  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  oval(ctx, 0, 12, 8, 4); ctx.fill();

  // ---- wings (Lord of the Pit) ----
  if (p.flags.flight) {
    const flap = Math.sin(p.animT * 20) * 0.5;
    for (const sd of [-1, 1]) {
      ctx.save();
      ctx.translate(sd * 11, 4);
      ctx.rotate(sd * (0.5 + flap));
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(sd * 16, -14, sd * 24, 2);
      ctx.quadraticCurveTo(sd * 14, 4, sd * 16, 12);
      ctx.quadraticCurveTo(sd * 8, 6, 0, 0);
      inkFill(ctx, '#3b2a4a', 2.2);
      ctx.restore();
    }
  }

  // ---- head ---- (the big one)
  const hy = -12;
  // ears go behind the skull
  for (const sd of [-1, 1]) {
    oval(ctx, sd * 18.5, hy + 3, 4, 5.6);
    inkFill(ctx, FLESH_SH, 2.4);
  }
  oval(ctx, 0, hy, 20, 19 / squash);
  inkFill(ctx, FLESH, 3.4);
  sheen(ctx, 0, hy, 20, 19, 0.42);
  // Magic Mushroom spots
  if (p.flags.spots) {
    ctx.fillStyle = 'rgba(190,40,50,0.75)';
    for (const o of [[-9, -6, 4], [7, -8, 3.4], [11, 2, 3], [-5, 4, 2.6]]) {
      oval(ctx, o[0], hy + o[1], o[2], o[2] * 0.85); ctx.fill();
    }
  }

  if (faceDir === 'up') {
    // Back of the head: shaded dome, nape crease, no face.
    const g = ctx.createRadialGradient(0, hy - 8, 3, 0, hy + 4, 22);
    g.addColorStop(0, 'rgba(255,255,255,0.22)');
    g.addColorStop(0.6, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = g;
    oval(ctx, 0, hy, 20, 19); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(0, hy + 3, 12, Math.PI * 0.22, Math.PI * 0.78); ctx.stroke();
    // two little scalp wisps so it isn't a featureless egg
    ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 2;
    for (const sd of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sd * 5, hy - 16);
      ctx.quadraticCurveTo(sd * 9, hy - 20, sd * 4, hy - 22);
      ctx.stroke();
    }
  } else {
    const ex = faceDir === 'left' ? -4 : faceDir === 'right' ? 4 : 0;
    const ey = faceDir === 'down' ? 3 : 0;
    const eyeCol = p.flags.brimstone ? '#5d0a10' : OUTLINE;
    // eyes: tall dark almonds, the signature "sad" look
    for (const sd of [-1, 1]) {
      ctx.save();
      ctx.translate(sd * 7 + ex * 0.55, hy - 1 + ey);
      // socket shadow makes the eyes look sunken, not stuck on
      ctx.fillStyle = 'rgba(120,95,70,0.35)';
      oval(ctx, 0, 0.5, 5.4, 7); ctx.fill();
      oval(ctx, 0, 0, 4, 5.9);
      inkFill(ctx, eyeCol, 0);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      oval(ctx, -1.2 + ex * 0.2, -2, 1.4, 1.9); ctx.fill();
      ctx.restore();
    }
    // brow shadow — makes him look miserable rather than cute
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-10 + ex * 0.4, hy - 7); ctx.quadraticCurveTo(0 + ex * 0.4, hy - 9.5, 10 + ex * 0.4, hy - 7);
    ctx.stroke();
    // frown
    ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0 + ex * 0.5, hy + 12 + ey, 4.5, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    // permanent tear streaks
    ctx.fillStyle = 'rgba(150,200,235,0.75)';
    for (const sd of [-1, 1]) {
      const tl = 4 + Math.sin(p.animT * 4 + sd) * 2.5;
      oval(ctx, sd * 6.6 + ex * 0.55, hy + 5 + tl * 0.5, 1.7, tl * 0.6);
      ctx.fill();
    }
  }

  // ---- halo ----
  if (p.flags.halo) {
    ctx.strokeStyle = '#ffe98a'; ctx.lineWidth = 3.4;
    ctx.shadowColor = '#ffe98a'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.ellipse(0, hy - 23, 13, 4.5, 0, 0, TAU); ctx.stroke();
    ctx.shadowBlur = 0;
  }
  ctx.restore();

  // ---- orbital familiar (Cube of Meat) ----
  if (p.flags.orbital) {
    for (let i = 0; i < p.flags.orbital; i++) {
      const a = p.orbitA + (i / p.flags.orbital) * TAU;
      const ox = p.x + Math.cos(a) * 44, oy = p.y + Math.sin(a) * 30;
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(a * 2);
      ctx.beginPath(); ctx.rect(-9, -9, 18, 18);
      inkFill(ctx, '#b8443e', 3);
      ctx.fillStyle = '#d9615a';
      ctx.fillRect(-6, -6, 7, 7);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(-2, 2, 8, 5);
      ctx.restore();
    }
  }

  // Hit feedback: a red rim that hugs the silhouette, never a blob on top of it.
  if (p.hitFlash > 0) {
    const a = Math.min(1, p.hitFlash * 4.5);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.strokeStyle = `rgba(255,70,70,${a})`;
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ff3333'; ctx.shadowBlur = 14 * a;
    oval(ctx, 0, -12, 21, 20); ctx.stroke();
    oval(ctx, 0, 8, 11, 10); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(200,40,40,${a * 0.35})`;
    oval(ctx, 0, -12, 20, 19); ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

/* ==========================================================================
   ENEMIES
   ========================================================================== */
/** Brother Bobby / Sister Maggy: a floating head that shoots for you. */
function drawFamiliar(ctx, fam) {
  const pink = fam.slot % 2 === 1;
  shadowUnder(ctx, fam.x, fam.y + 16, 9, 0.26);
  ctx.save();
  ctx.translate(fam.x, fam.y);
  oval(ctx, 0, 11, 6, 5);
  inkFill(ctx, pink ? '#e0a2b8' : '#8fb8d8', 2.4);
  oval(ctx, 0, 0, 11, 11);
  inkFill(ctx, pink ? '#e0a2b8' : '#8fb8d8', 3);
  sheen(ctx, 0, -2, 11, 11, 0.3);
  if (pink) {
    ctx.fillStyle = '#b8455f';
    ctx.beginPath(); ctx.arc(0, -2, 11, Math.PI, TAU); ctx.fill();
    ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -2, 11, Math.PI, TAU); ctx.stroke();
  }
  for (const sd of [-1, 1]) {
    oval(ctx, sd * 3.6, pink ? 1 : -1, 2.2, 3);
    inkFill(ctx, OUTLINE, 0);
  }
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-3, 6); ctx.quadraticCurveTo(0, 8.5, 3, 6); ctx.stroke();
  // it cries too, of course
  ctx.fillStyle = 'rgba(160,205,235,0.8)';
  oval(ctx, -3.6, 5 + Math.sin(fam.t * 3) * 1.5, 1.4, 2.4); ctx.fill();
  ctx.restore();
}

function enemyFlash(ctx, e, drawBody) {
  ctx.save();
  drawBody();
  if (e.hitFlash > 0) {
    const a = Math.min(1, e.hitFlash * 6.5);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = a * 0.42;
    ctx.fillStyle = '#ffd8d8';
    oval(ctx, e.x, e.y, e.r * 1.02, e.r * 1.02); ctx.fill();
    ctx.globalAlpha = a;
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#fff0f0'; ctx.lineWidth = 3;
    ctx.shadowColor = '#ff6060'; ctx.shadowBlur = 12 * a;
    oval(ctx, e.x, e.y, e.r * 1.05, e.r * 1.05); ctx.stroke();
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

function shadowUnder(ctx, x, y, rx, alpha = 0.34) {
  ctx.fillStyle = `rgba(0,0,0,${alpha})`;
  oval(ctx, x, y, rx, rx * 0.4); ctx.fill();
}

/* Enemy art is authored at a fixed reference radius and then scaled, so
   tuning an enemy's hitbox never desyncs its face from its body. */
function enemyScale(ctx, e, refR) {
  const k = e.r / refR;
  ctx.scale(k, k);
  return refR;
}

/* --- Gaper: shambling flesh-thing with an open screaming mouth --- */
function drawGaper(ctx, e) {
  const wob = Math.sin(e.animT * 9) * 3;
  const sq = 1 + Math.sin(e.animT * 9) * 0.06;
  shadowUnder(ctx, e.x, e.y + e.r * 0.85, e.r * 0.9);
  ctx.save();
  ctx.translate(e.x, e.y + wob * 0.3);
  const R = enemyScale(ctx, e, 17);
  // stubby legs
  for (const sd of [-1, 1]) {
    oval(ctx, sd * 6, R * 0.72, 4, 6 + Math.sin(e.animT * 9 + sd * 2) * 2);
    inkFill(ctx, '#b09878', 2.2);
  }
  // head/body: one big pale lump
  oval(ctx, 0, 0, R / sq, R * sq);
  inkFill(ctx, e.variant === 'flaming' ? '#e8b090' : '#e3cdac', 3.4);
  sheen(ctx, 0, 0, R, R, 0.34);
  // sunken sockets — the "gaper" read comes from these
  for (const sd of [-1, 1]) {
    ctx.fillStyle = 'rgba(90,60,45,0.5)';
    oval(ctx, sd * 6.5, -4, 5.6, 6.8); ctx.fill();
    oval(ctx, sd * 6.5, -4, 3.9, 5.2);
    inkFill(ctx, '#0d0805', 0);
    ctx.fillStyle = 'rgba(255,70,70,0.95)';
    oval(ctx, sd * 6.5, -4.5, 1.5, 1.9); ctx.fill();
  }
  // gaping mouth with a bloody drip
  ctx.beginPath();
  ctx.ellipse(0, 7, 7, 5.4 + Math.sin(e.animT * 6) * 1.4, 0, 0, TAU);
  inkFill(ctx, '#2c0707', 2.8);
  ctx.fillStyle = BLOOD;
  oval(ctx, 0, 9.5, 4.4, 2.8); ctx.fill();
  // blood tears running from the sockets
  ctx.fillStyle = 'rgba(150,18,26,0.85)';
  for (const sd of [-1, 1]) {
    const tl = 4 + Math.sin(e.animT * 3 + sd) * 1.4;
    oval(ctx, sd * 6.5, 2 + tl * 0.4, 1.9, tl); ctx.fill();
  }
  ctx.restore();
}

/* --- Pooter: bobbing fly-head that spits --- */
function drawPooter(ctx, e) {
  const fly = Math.sin(e.animT * 5) * 4;
  shadowUnder(ctx, e.x, e.y + e.r * 1.5, e.r * 0.75, 0.28);
  ctx.save();
  ctx.translate(e.x, e.y + fly);
  const R = enemyScale(ctx, e, 16);
  // buzzing wings
  const flap = Math.sin(e.animT * 42) * 0.6;
  for (const sd of [-1, 1]) {
    ctx.save();
    ctx.translate(sd * R * 0.75, -3);
    ctx.rotate(sd * (0.35 + flap));
    ctx.globalAlpha = 0.55;
    oval(ctx, sd * 8, 0, 11, 5);
    inkFill(ctx, '#cfd8e2', 1.6);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  oval(ctx, 0, 0, R, R * 0.94);
  inkFill(ctx, '#cdb694', 3.2);
  sheen(ctx, 0, 0, R, R, 0.3);
  // fleshy folds
  ctx.strokeStyle = 'rgba(90,60,40,0.3)'; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.arc(0, 2, R * 0.72, 0.5, 2.64); ctx.stroke();
  // one big cyclops eye that tracks the player
  const look = norm(e.aimX || 0, e.aimY || 1);
  ctx.fillStyle = 'rgba(90,60,40,0.4)';
  oval(ctx, 0, -1.5, 9.4, 9.4); ctx.fill();
  oval(ctx, 0, -1, 7.8, 7.8);
  inkFill(ctx, '#f5efe2', 2.6);
  oval(ctx, look.x * 2.8, -1 + look.y * 2.8, 3.6, 3.6);
  inkFill(ctx, '#140c08', 0);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  oval(ctx, -2.4, -3.6, 1.5, 1.5); ctx.fill();
  // charge tell
  if (e.tell > 0) {
    ctx.globalAlpha = 0.5 + Math.sin(e.animT * 30) * 0.3;
    ctx.fillStyle = '#ff6060';
    oval(ctx, 0, R * 0.6, 4.5, 3.4); ctx.fill();
    ctx.globalAlpha = 1;
  }
  // little snout
  oval(ctx, 0, R * 0.64, 5, 3.6);
  inkFill(ctx, '#8c6f52', 2.4);
  ctx.restore();
}

/* --- Horf: immobile wall-head that spits in bursts --- */
function drawHorf(ctx, e) {
  shadowUnder(ctx, e.x, e.y + e.r * 0.9, e.r * 0.95);
  const puff = e.tell > 0 ? 1 + (1 - e.tell / 0.55) * 0.18 : 1;
  ctx.save();
  ctx.translate(e.x, e.y);
  const R = enemyScale(ctx, e, 18);
  ctx.scale(puff, 2 - puff);
  // fleshy base
  oval(ctx, 0, R * 0.55, R * 0.95, R * 0.5);
  inkFill(ctx, '#8d6b52', 2.8);
  // head
  oval(ctx, 0, 0, R, R);
  inkFill(ctx, '#ddc8a4', 3.4);
  sheen(ctx, 0, 0, R, R, 0.34);
  // veins
  ctx.strokeStyle = 'rgba(140,40,50,0.45)'; ctx.lineWidth = 1.8;
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sd * 4, -R * 0.8);
    ctx.quadraticCurveTo(sd * 12, -R * 0.2, sd * 8, R * 0.45);
    ctx.stroke();
  }
  // angry slit eyes
  for (const sd of [-1, 1]) {
    ctx.save();
    ctx.translate(sd * 7, -5.5);
    ctx.rotate(sd * 0.4);
    ctx.fillStyle = 'rgba(90,60,40,0.4)';
    ctx.fillRect(-5.5, -3.4, 11, 6.8);
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(-4.6, -2.1, 9.2, 4.2);
    ctx.restore();
  }
  // mouth: opens wide right before firing
  const mo = e.tell > 0 ? 7.5 : 3.2;
  oval(ctx, 0, 7.5, 6.4, mo);
  inkFill(ctx, '#2c0808', 2.6);
  if (e.tell > 0) {
    ctx.fillStyle = BLOOD_LT;
    oval(ctx, 0, 7.5, 3.4, 3.4); ctx.fill();
  }
  ctx.restore();
}

/* --- Attack Fly: tiny erratic bullet of teeth --- */
function drawFly(ctx, e) {
  shadowUnder(ctx, e.x, e.y + 12, 6, 0.24);
  ctx.save();
  ctx.translate(e.x, e.y);
  const R = enemyScale(ctx, e, 9);
  const flap = Math.sin(e.animT * 55) * 0.8;
  ctx.globalAlpha = 0.5;
  for (const sd of [-1, 1]) {
    ctx.save(); ctx.translate(sd * 6, -4); ctx.rotate(sd * flap);
    oval(ctx, sd * 5, 0, 7.5, 3.2); inkFill(ctx, '#e8eef5', 1.4);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  oval(ctx, 0, 0, R, R * 0.9);
  inkFill(ctx, '#2b2b33', 2.4);
  ctx.fillStyle = '#c8302e';
  oval(ctx, 0, -1, 3.8, 3.8); ctx.fill();
  ctx.fillStyle = '#fff';
  oval(ctx, -1.3, -2.1, 1.3, 1.3); ctx.fill();
  // tiny mandibles
  ctx.strokeStyle = '#e8e0d0'; ctx.lineWidth = 1.4;
  for (const sd of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(sd * 2, 5); ctx.lineTo(sd * 4, 8); ctx.stroke();
  }
  ctx.restore();
}

/* --- Clotty: squat blob that fires in 4 directions --- */
function drawClotty(ctx, e) {
  const hop = Math.max(0, Math.sin(e.animT * 5)) * 6;
  shadowUnder(ctx, e.x, e.y + e.r * 0.9, e.r * (1 - hop * 0.02));
  ctx.save();
  ctx.translate(e.x, e.y - hop);
  const R = enemyScale(ctx, e, 19);
  const sq = 1 + hop * 0.012;
  blob(ctx, 0, 0, R * sq, 1.7, 12, 0.24);
  inkFill(ctx, '#ab3f45', 3.4);
  sheen(ctx, 0, 0, R, R, 0.26);
  // drips
  ctx.fillStyle = '#7d2429';
  for (const o of [[-9, 12], [4, 14], [12, 9]]) {
    oval(ctx, o[0], o[1] + Math.sin(e.animT * 3 + o[0]) * 1.5, 3.2, 4.8); ctx.fill();
  }
  // beady eyes
  for (const sd of [-1, 1]) {
    oval(ctx, sd * 6.5, -4.5, 4.8, 4.8);
    inkFill(ctx, '#f3e6d2', 2.2);
    oval(ctx, sd * 7.1, -4.5, 2.3, 2.3);
    inkFill(ctx, OUTLINE, 0);
  }
  // 4 muzzle nubs light up while charging
  if (e.tell > 0) {
    ctx.fillStyle = `rgba(255,90,90,${0.5 + Math.sin(e.animT * 30) * 0.4})`;
    for (const d of DIRS) {
      const v = DIR_VEC[d];
      oval(ctx, v.x * R * 0.85, v.y * R * 0.85 + 2, 4.4, 4.4); ctx.fill();
    }
  }
  ctx.restore();
}

/* --- Boom Fly: a bloated fly that detonates when killed --- */
function drawBoomFly(ctx, e) {
  shadowUnder(ctx, e.x, e.y + e.r * 1.2, e.r * 0.7, 0.26);
  ctx.save();
  ctx.translate(e.x, e.y + Math.sin(e.animT * 4) * 3);
  const R = enemyScale(ctx, e, 14);
  const flap = Math.sin(e.animT * 48) * 0.7;
  ctx.globalAlpha = 0.5;
  for (const sd of [-1, 1]) {
    ctx.save(); ctx.translate(sd * 9, -5); ctx.rotate(sd * flap);
    oval(ctx, sd * 7, 0, 10, 4.4); inkFill(ctx, '#e8eef5', 1.5);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  oval(ctx, 0, 0, R, R * 0.96);
  inkFill(ctx, '#26262e', 3);
  sheen(ctx, 0, 0, R, R, 0.22);
  // fuse
  ctx.strokeStyle = '#8c7550'; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(0, -R); ctx.quadraticCurveTo(5, -R - 7, 1, -R - 12); ctx.stroke();
  ctx.fillStyle = `rgba(255,${170 + Math.sin(e.animT * 22) * 60},60,0.95)`;
  oval(ctx, 1, -R - 13, 3, 3.4); ctx.fill();
  // angry eyes
  for (const sd of [-1, 1]) {
    oval(ctx, sd * 5, -2, 4.2, 4.6); inkFill(ctx, '#f3e6d2', 2);
    oval(ctx, sd * 5.6, -2, 2.1, 2.4); inkFill(ctx, '#c8302e', 0);
  }
  // grin of teeth
  ctx.beginPath(); ctx.ellipse(0, 6, 6, 3.4, 0, 0, Math.PI);
  inkFill(ctx, '#1c0606', 2.2);
  ctx.fillStyle = '#efe6d4';
  for (const tx of [-3.6, 0, 3.6]) ctx.fillRect(tx - 1, 5.6, 2, 2.4);
  ctx.restore();
}

/* --- Hopper: long-legged flesh frog that leaps at you --- */
function drawHopper(ctx, e) {
  const air = e.airH || 0;
  shadowUnder(ctx, e.x, e.y + e.r * 0.9, e.r * (0.9 - air * 0.004), 0.32);
  ctx.save();
  ctx.translate(e.x, e.y - air);
  const R = enemyScale(ctx, e, 16);
  const crouch = e.tell > 0 ? 1.25 : 1;
  // back legs, folded when crouching
  for (const sd of [-1, 1]) {
    ctx.save();
    ctx.translate(sd * R * 0.78, R * 0.34);
    ctx.rotate(sd * (air > 4 ? -0.9 : -0.25));
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.quadraticCurveTo(sd * 10, 6, sd * 5, 15);
    ctx.lineWidth = 5.5; ctx.strokeStyle = '#9c7d5e'; ctx.lineCap = 'round'; ctx.stroke();
    ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(0,0,0,0)'; ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.scale(crouch, 2 - crouch);
  oval(ctx, 0, 0, R, R * 0.84);
  inkFill(ctx, '#c9a678', 3.2);
  sheen(ctx, 0, 0, R, R * 0.84, 0.3);
  // bulging frog eyes on top
  for (const sd of [-1, 1]) {
    oval(ctx, sd * 7, -R * 0.62, 5.4, 5.4);
    inkFill(ctx, '#f3ead6', 2.6);
    oval(ctx, sd * 7.6, -R * 0.62, 2.4, 3.2);
    inkFill(ctx, OUTLINE, 0);
  }
  // wide flat mouth
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-R * 0.62, 5); ctx.quadraticCurveTo(0, 10, R * 0.62, 5); ctx.stroke();
  ctx.restore();
  ctx.restore();
}

/* --- Maw: a floating mouth on a stalk of flesh --- */
function drawMaw(ctx, e) {
  const bob = Math.sin(e.animT * 3.4) * 5;
  shadowUnder(ctx, e.x, e.y + e.r * 1.5, e.r * 0.7, 0.26);
  ctx.save();
  ctx.translate(e.x, e.y + bob);
  const R = enemyScale(ctx, e, 18);
  // trailing flesh tendrils
  ctx.strokeStyle = '#7d3b3f'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  for (const sd of [-1, 0, 1]) {
    ctx.beginPath();
    ctx.moveTo(sd * 6, R * 0.6);
    ctx.quadraticCurveTo(sd * 10 + Math.sin(e.animT * 4 + sd) * 5, R * 1.1, sd * 6, R * 1.5);
    ctx.stroke();
  }
  oval(ctx, 0, 0, R, R * 0.95);
  inkFill(ctx, '#b8676a', 3.4);
  sheen(ctx, 0, 0, R, R, 0.24);
  // the mouth: a ring of teeth that widens as it charges
  const open = e.tell > 0 ? 1 + (1 - e.tell / 0.7) * 0.7 : 1;
  ctx.save();
  ctx.scale(open, open);
  oval(ctx, 0, 1, R * 0.62, R * 0.5);
  inkFill(ctx, '#230505', 2.8);
  ctx.fillStyle = '#f0e4cc';
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU;
    ctx.save();
    ctx.translate(Math.cos(a) * R * 0.5, 1 + Math.sin(a) * R * 0.4);
    ctx.rotate(a + Math.PI / 2);
    ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(2, 0); ctx.lineTo(0, 4.4); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  if (e.tell > 0) {
    ctx.fillStyle = `rgba(255,70,70,${0.4 + Math.sin(e.animT * 26) * 0.35})`;
    oval(ctx, 0, 1, R * 0.32, R * 0.26); ctx.fill();
  }
  ctx.restore();
  ctx.restore();
}

/* --- Globin: a lumpy goo humanoid that reforms once after dying --- */
function drawGlobin(ctx, e) {
  const down = e.downed > 0;
  shadowUnder(ctx, e.x, e.y + e.r * 0.85, e.r * 0.95, 0.32);
  ctx.save();
  ctx.translate(e.x, e.y);
  const R = enemyScale(ctx, e, 19);
  if (down) {
    // collapsed into a puddle, slowly bubbling back up
    blob(ctx, 0, R * 0.5, R * 1.1, 2.2, 11, 0.3);
    inkFill(ctx, '#7d6a3e', 3);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    for (let i = 0; i < 4; i++) {
      const a = e.animT * 2 + i;
      oval(ctx, Math.cos(a) * R * 0.5, R * 0.5 + Math.sin(a) * 3, 3, 2); ctx.fill();
    }
    ctx.restore();
    return;
  }
  const wob = Math.sin(e.animT * 6) * 2.4;
  // stumpy arms
  for (const sd of [-1, 1]) {
    oval(ctx, sd * (R * 0.92), 2 + Math.sin(e.animT * 6 + sd * 2) * 3, 5.5, 8);
    inkFill(ctx, '#8f7947', 2.6);
  }
  blob(ctx, 0, wob * 0.3, R, 1.1, 11, 0.2);
  inkFill(ctx, '#a08a52', 3.4);
  sheen(ctx, 0, 0, R, R, 0.24);
  // drooping goo
  ctx.fillStyle = '#7d6a3e';
  for (const o of [[-8, 13], [5, 15], [12, 10]]) {
    oval(ctx, o[0], o[1] + Math.sin(e.animT * 3 + o[0]) * 1.6, 3.4, 5.2); ctx.fill();
  }
  // hollow eyes + slack mouth
  for (const sd of [-1, 1]) {
    oval(ctx, sd * 6, -4, 4, 5);
    inkFill(ctx, '#1a1208', 0);
    ctx.fillStyle = 'rgba(255,220,120,0.8)';
    oval(ctx, sd * 6, -4, 1.6, 2); ctx.fill();
  }
  oval(ctx, 0, 7, 5.4, 3.4);
  inkFill(ctx, '#2a1a08', 2.2);
  ctx.restore();
}

/* --- Knight: an armoured mask; the faceplate shrugs off tears --- */
function drawKnight(ctx, e) {
  shadowUnder(ctx, e.x, e.y + e.r * 0.9, e.r * 0.95, 0.36);
  ctx.save();
  ctx.translate(e.x, e.y);
  const R = enemyScale(ctx, e, 20);
  const face = norm(e.faceX || 0, e.faceY || 1);
  // body behind the plate — soft and pink
  oval(ctx, 0, 2, R * 0.92, R * 0.92);
  inkFill(ctx, '#c98a8a', 3.2);
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  oval(ctx, -4, -4, R * 0.4, R * 0.34); ctx.fill();
  // the iron faceplate, oriented toward whatever it is guarding against
  ctx.save();
  ctx.rotate(Math.atan2(face.y, face.x) - Math.PI / 2);
  ctx.beginPath();
  ctx.moveTo(-R * 0.95, -R * 0.1);
  ctx.quadraticCurveTo(0, -R * 1.25, R * 0.95, -R * 0.1);
  ctx.quadraticCurveTo(0, R * 0.55, -R * 0.95, -R * 0.1);
  ctx.closePath();
  inkFill(ctx, '#7d838c', 3.4);
  const mg = ctx.createLinearGradient(0, -R, 0, R * 0.4);
  mg.addColorStop(0, 'rgba(255,255,255,0.35)');
  mg.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = mg; ctx.fill();
  // eye slits
  ctx.fillStyle = OUTLINE;
  for (const sd of [-1, 1]) {
    ctx.save(); ctx.translate(sd * R * 0.34, -R * 0.44); ctx.rotate(sd * 0.3);
    ctx.fillRect(-3.6, -2.4, 7.2, 4.8);
    ctx.restore();
  }
  ctx.fillStyle = `rgba(255,90,60,${0.55 + Math.sin(e.animT * 5) * 0.3})`;
  for (const sd of [-1, 1]) { oval(ctx, sd * R * 0.34, -R * 0.44, 2, 1.6); ctx.fill(); }
  // rivets
  ctx.fillStyle = '#4c5158';
  for (const rx of [-0.7, -0.25, 0.25, 0.7]) { oval(ctx, rx * R, -R * 0.14, 1.8, 1.8); ctx.fill(); }
  ctx.restore();
  ctx.restore();
}

/* --- Vis: a torso that opens its gut and fires a blood laser --- */
function drawVis(ctx, e) {
  shadowUnder(ctx, e.x, e.y + e.r * 0.9, e.r, 0.36);
  ctx.save();
  ctx.translate(e.x, e.y);
  const R = enemyScale(ctx, e, 24);
  // hunched torso
  blob(ctx, 0, 0, R, 0.6, 11, 0.16);
  inkFill(ctx, '#c8a882', 3.6);
  sheen(ctx, 0, -4, R, R, 0.26);
  // ribs
  ctx.strokeStyle = 'rgba(90,60,40,0.4)'; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(0, -R * 0.25, R * (0.4 + i * 0.18), 0.35, Math.PI - 0.35);
    ctx.stroke();
  }
  // twin dead eyes up top
  for (const sd of [-1, 1]) {
    oval(ctx, sd * 7, -R * 0.6, 4.4, 5);
    inkFill(ctx, '#f0e6d2', 2.4);
    oval(ctx, sd * 7, -R * 0.6, 2, 2.6);
    inkFill(ctx, OUTLINE, 0);
  }
  // the gut-maw that charges the laser
  const open = e.tell > 0 ? 0.4 + (1 - e.tell / 0.85) * 0.9 : 0.35;
  const look = norm(e.aimX || 0, e.aimY || 1);
  ctx.save();
  ctx.translate(look.x * R * 0.3, R * 0.3 + look.y * R * 0.2);
  oval(ctx, 0, 0, R * 0.62 * open + 4, R * 0.5 * open + 3);
  inkFill(ctx, '#240404', 3);
  if (e.tell > 0) {
    const k = 1 - e.tell / 0.85;
    ctx.fillStyle = `rgba(255,${60 - k * 40},${60 - k * 40},${0.5 + k * 0.5})`;
    ctx.shadowColor = '#ff2a2a'; ctx.shadowBlur = 16 * k;
    oval(ctx, 0, 0, R * 0.34 * k + 2, R * 0.28 * k + 2); ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.restore();
  ctx.restore();
}

/* ==========================================================================
   BOSSES
   ========================================================================== */
/* --- Monstro: a giant grinning head that leaps and vomits --- */
function drawMonstro(ctx, e) {
  const air = e.airH || 0;
  const sq = e.squash || 1;             // >1 = flattened (charging a jump)
  const R = e.r;
  shadowUnder(ctx, e.x, e.y + R * 0.8, R * (1 - air * 0.0022) * 0.95, 0.4);

  ctx.save();
  ctx.translate(e.x, e.y - air);
  ctx.scale(sq, 1 / sq);

  // tiny useless legs
  for (const sd of [-1, 1]) {
    oval(ctx, sd * R * 0.45, R * 0.82, R * 0.16, R * 0.2);
    inkFill(ctx, '#b09878', 3);
  }
  // huge head — heavy ink so he separates from the floor at any brightness
  blob(ctx, 0, 0, R, 0.7, 13, 0.12);
  inkFill(ctx, '#cdae7f', 7);
  sheen(ctx, 0, 0, R, R * 0.95, 0.38);
  // ambient occlusion around the jaw keeps the volume readable
  const ao = ctx.createRadialGradient(0, -R * 0.35, R * 0.2, 0, R * 0.15, R);
  ao.addColorStop(0, 'rgba(255,250,235,0.12)');
  ao.addColorStop(0.62, 'rgba(0,0,0,0)');
  ao.addColorStop(1, 'rgba(60,35,15,0.4)');
  ctx.fillStyle = ao;
  blob(ctx, 0, 0, R, 0.7, 13, 0.12); ctx.fill();
  // blotches + stitched scar, so he reads as diseased rather than doughy
  ctx.fillStyle = 'rgba(105,72,44,0.34)';
  for (const o of [[-R * 0.5, -R * 0.45, R * 0.22], [R * 0.55, -R * 0.2, R * 0.17], [-R * 0.2, R * 0.5, R * 0.15], [R * 0.3, R * 0.62, R * 0.12]]) {
    blob(ctx, o[0], o[1], o[2], 2.3, 9, 0.3); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(70,40,25,0.5)'; ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-R * 0.78, -R * 0.1);
  ctx.quadraticCurveTo(-R * 0.5, -R * 0.3, -R * 0.3, -R * 0.05);
  ctx.stroke();
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-R * 0.54 + i * R * 0.07, -R * 0.28);
    ctx.lineTo(-R * 0.54 + i * R * 0.07, -R * 0.1);
    ctx.stroke();
  }
  // eyes — small, mean, far apart, deep in their sockets
  for (const sd of [-1, 1]) {
    const look = norm(e.aimX || 0, e.aimY || 1);
    ctx.fillStyle = 'rgba(80,50,32,0.5)';
    oval(ctx, sd * R * 0.42, -R * 0.29, R * 0.27, R * 0.29); ctx.fill();
    oval(ctx, sd * R * 0.42, -R * 0.3, R * 0.2, R * 0.22);
    inkFill(ctx, '#f7f0e0', 3.4);
    oval(ctx, sd * R * 0.42 + look.x * R * 0.07, -R * 0.3 + look.y * R * 0.07, R * 0.1, R * 0.115);
    inkFill(ctx, OUTLINE, 0);
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.42)'; ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-R * 0.62, -R * 0.56); ctx.quadraticCurveTo(0, -R * 0.74, R * 0.62, -R * 0.56);
  ctx.stroke();

  // mouth: opens huge to vomit
  const open = e.mouth || 0;   // 0..1
  const mh = R * (0.12 + open * 0.42);
  ctx.beginPath();
  ctx.ellipse(0, R * 0.34, R * (0.5 + open * 0.12), mh, 0, 0, TAU);
  inkFill(ctx, '#340a0a', 4);
  // teeth
  ctx.fillStyle = '#f2e9d5';
  const tw = R * 0.11;
  for (let i = -3; i <= 3; i++) {
    const tx = i * tw * 1.5;
    if (Math.abs(tx) > R * 0.44) continue;
    ctx.beginPath();
    ctx.moveTo(tx - tw / 2, R * 0.34 - mh + 1);
    ctx.lineTo(tx + tw / 2, R * 0.34 - mh + 1);
    ctx.lineTo(tx, R * 0.34 - mh + tw * 1.5);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(tx - tw / 2, R * 0.34 + mh - 1);
    ctx.lineTo(tx + tw / 2, R * 0.34 + mh - 1);
    ctx.lineTo(tx, R * 0.34 + mh - tw * 1.5);
    ctx.closePath(); ctx.fill();
  }
  if (open > 0.3) {
    ctx.fillStyle = `rgba(190,30,40,${(open - 0.3) * 1.2})`;
    oval(ctx, 0, R * 0.34, R * 0.3 * open, mh * 0.6); ctx.fill();
  }
  // blood dribbling from the corner of the mouth
  ctx.fillStyle = BLOOD;
  oval(ctx, R * 0.34, R * 0.42, R * 0.07, R * 0.13); ctx.fill();
  ctx.restore();
}

/* --- Duke of Flies: bloated sack that vomits swarms --- */
function drawDuke(ctx, e) {
  const R = e.r;
  const fly = Math.sin(e.animT * 3.2) * 6;
  shadowUnder(ctx, e.x, e.y + R * 1.15, R * 0.8, 0.34);
  ctx.save();
  ctx.translate(e.x, e.y + fly);
  const bloat = 1 + (e.mouth || 0) * 0.12;
  ctx.scale(bloat, bloat);

  // orbiting flies drawn behind the sack
  const drawOrbitFly = (fx, fy, dim) => {
    ctx.globalAlpha = dim ? 0.45 : 1;
    const fl = Math.sin(e.animT * 50 + fx) * 0.7;
    ctx.save();
    ctx.translate(fx, fy);
    ctx.globalAlpha *= 0.55;
    for (const sd of [-1, 1]) {
      ctx.save(); ctx.translate(sd * 4, -3); ctx.rotate(sd * fl);
      oval(ctx, sd * 4, 0, 6, 2.6); inkFill(ctx, '#e8eef5', 1.2);
      ctx.restore();
    }
    ctx.globalAlpha = dim ? 0.45 : 1;
    oval(ctx, 0, 0, 6, 5.4);
    inkFill(ctx, '#25252c', 2.2);
    ctx.fillStyle = '#c8302e';
    oval(ctx, 0, -0.6, 2.4, 2.4); ctx.fill();
    ctx.restore();
  };
  for (let i = 0; i < 6; i++) {
    const a = e.animT * 2.2 + i * TAU / 6;
    const rr = R * 1.3;
    if (Math.sin(a) <= 0) drawOrbitFly(Math.cos(a) * rr, Math.sin(a) * rr * 0.5, true);
  }
  ctx.globalAlpha = 1;

  blob(ctx, 0, 0, R, 1.1, 14, 0.26);
  inkFill(ctx, '#8f9660', 5);
  sheen(ctx, 0, 0, R, R, 0.28);
  // pustules and warts, ringed so they read as raised
  for (const o of [[-R * 0.45, -R * 0.3, R * 0.18], [R * 0.4, R * 0.1, R * 0.15],
                   [0, R * 0.55, R * 0.13], [R * 0.2, -R * 0.55, R * 0.12],
                   [-R * 0.62, R * 0.24, R * 0.11], [R * 0.58, R * 0.44, R * 0.1]]) {
    ctx.fillStyle = 'rgba(52,60,26,0.45)';
    oval(ctx, o[0], o[1], o[2], o[2]); ctx.fill();
    ctx.strokeStyle = 'rgba(190,200,150,0.22)'; ctx.lineWidth = 1.6;
    oval(ctx, o[0], o[1] - o[2] * 0.2, o[2] * 0.8, o[2] * 0.7); ctx.stroke();
  }
  // sad huge eyes
  for (const sd of [-1, 1]) {
    const look = norm(e.aimX || 0, e.aimY || 1);
    oval(ctx, sd * R * 0.34, -R * 0.2, R * 0.22, R * 0.25);
    inkFill(ctx, '#f7f0e0', 3);
    oval(ctx, sd * R * 0.34 + look.x * R * 0.07, -R * 0.2 + look.y * R * 0.07, R * 0.1, R * 0.12);
    inkFill(ctx, OUTLINE, 0);
  }
  // drooping mouth
  const open = 0.2 + (e.mouth || 0) * 0.8;
  ctx.beginPath();
  ctx.ellipse(0, R * 0.4, R * 0.3, R * 0.1 + R * 0.22 * open, 0, 0, TAU);
  inkFill(ctx, '#241a08', 3.4);
  if (open > 0.5) {
    ctx.fillStyle = `rgba(120,140,60,${(open - 0.5) * 0.9})`;
    oval(ctx, 0, R * 0.4, R * 0.18, (R * 0.1 + R * 0.22 * open) * 0.55); ctx.fill();
  }
  ctx.restore();

  // flies in front of the sack, so the swarm wraps around him
  ctx.save();
  ctx.translate(e.x, e.y + fly);
  for (let i = 0; i < 6; i++) {
    const a = e.animT * 2.2 + i * TAU / 6;
    const rr = R * 1.3;
    if (Math.sin(a) > 0) drawOrbitFly(Math.cos(a) * rr, Math.sin(a) * rr * 0.5, false);
  }
  ctx.restore();
}

/* --- shared: a chain of body segments trailing behind a head ---
   Larry Jr., Chub and Scolex all move as one entity but read as a worm,
   so they keep a ring buffer of past positions and we render it here. */
function drawWormBody(ctx, e, opt) {
  const segs = e.segs || [];
  const n = segs.length;
  for (let i = n - 1; i >= 0; i--) {
    const s = segs[i];
    const k = 1 - i / (n + 1);
    const rr = opt.r * (opt.taper ? 0.45 + k * 0.55 : 0.86);
    ctx.save();
    ctx.translate(s.x, s.y);
    shadowUnder(ctx, 0, rr * 0.8, rr * 0.85, 0.3);
    if (opt.armour) {
      // Scolex: banded metal plates
      oval(ctx, 0, 0, rr, rr * 0.92);
      inkFill(ctx, i % 2 ? '#6b6f78' : '#565a63', 3.4);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, rr * 0.62, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      for (const sd of [-1, 1]) {
        ctx.fillStyle = '#3d4048';
        oval(ctx, sd * rr * 0.6, 0, 2.6, 4); ctx.fill();
      }
    } else {
      blob(ctx, 0, 0, rr, i * 1.7 + 0.4, 10, 0.16);
      inkFill(ctx, opt.color, 3.6);
      sheen(ctx, 0, 0, rr, rr, 0.24);
      if (opt.spots) {
        for (let j = 0; j < 3; j++) {
          const a = j * 2.1 + i;
          ctx.fillStyle = opt.spotColor || 'rgba(70,30,20,0.4)';
          oval(ctx, Math.cos(a) * rr * 0.45, Math.sin(a) * rr * 0.4, rr * 0.17, rr * 0.15); ctx.fill();
        }
      }
    }
    ctx.restore();
  }
  // the vulnerable glowing tail tip
  if (opt.glowTail && n) {
    const s = segs[n - 1];
    const pulse = 0.5 + Math.sin(e.animT * 8) * 0.5;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.fillStyle = `rgba(255,${90 + pulse * 90},80,${0.55 + pulse * 0.4})`;
    ctx.shadowColor = '#ff6a3a'; ctx.shadowBlur = 18;
    oval(ctx, 0, 0, opt.r * 0.42, opt.r * 0.42); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

/* --- Larry Jr.: a fat pale worm that ricochets around the room --- */
function drawLarry(ctx, e) {
  drawWormBody(ctx, e, { r: e.r, color: '#d9c59a', spots: true, spotColor: 'rgba(120,70,40,0.35)' });
  const R = e.r;
  shadowUnder(ctx, e.x, e.y + R * 0.85, R * 0.95, 0.36);
  ctx.save();
  ctx.translate(e.x, e.y);
  const look = norm(e.aimX || 0, e.aimY || 1);
  blob(ctx, 0, 0, R, 0.9, 11, 0.14);
  inkFill(ctx, '#e6d3aa', 4);
  sheen(ctx, 0, -R * 0.15, R, R, 0.3);
  // a mean little pair of eyes and a permanently open O of a mouth
  for (const sd of [-1, 1]) {
    oval(ctx, sd * R * 0.36, -R * 0.24, R * 0.2, R * 0.22);
    inkFill(ctx, '#f7f0e0', 3);
    oval(ctx, sd * R * 0.36 + look.x * R * 0.07, -R * 0.24 + look.y * R * 0.07, R * 0.09, R * 0.11);
    inkFill(ctx, OUTLINE, 0);
  }
  ctx.beginPath();
  ctx.ellipse(0, R * 0.38, R * 0.3, R * 0.24 + Math.sin(e.animT * 6) * R * 0.05, 0, 0, TAU);
  inkFill(ctx, '#2b0d0d', 3.4);
  ctx.fillStyle = BLOOD;
  oval(ctx, 0, R * 0.5, R * 0.16, R * 0.09); ctx.fill();
  ctx.restore();
}

/* --- Chub: three enormous sausages that line up and charge --- */
function drawChub(ctx, e) {
  drawWormBody(ctx, e, { r: e.r, color: '#c58f7a', spots: true, spotColor: 'rgba(150,60,50,0.4)' });
  const R = e.r;
  const chomp = e.state === 'chargeUp' || e.state === 'charge';
  shadowUnder(ctx, e.x, e.y + R * 0.85, R, 0.4);
  ctx.save();
  ctx.translate(e.x, e.y);
  const look = norm(e.aimX || 0, e.aimY || 1);
  blob(ctx, 0, 0, R, 0.4, 12, 0.12);
  inkFill(ctx, '#d6a186', 4.4);
  sheen(ctx, 0, -R * 0.2, R, R, 0.28);
  // fat rolls
  ctx.strokeStyle = 'rgba(110,50,40,0.3)'; ctx.lineWidth = 3;
  for (let i = 0; i < 2; i++) {
    ctx.beginPath(); ctx.arc(0, -R * 0.1, R * (0.5 + i * 0.24), 0.5, Math.PI - 0.5); ctx.stroke();
  }
  // tiny angry eyes buried in fat
  for (const sd of [-1, 1]) {
    ctx.fillStyle = 'rgba(120,60,50,0.5)';
    oval(ctx, sd * R * 0.34, -R * 0.3, R * 0.17, R * 0.13); ctx.fill();
    oval(ctx, sd * R * 0.34 + look.x * R * 0.04, -R * 0.3, R * 0.09, R * 0.09);
    inkFill(ctx, '#f2e8d6', 2.4);
    oval(ctx, sd * R * 0.34 + look.x * R * 0.06, -R * 0.3, R * 0.045, R * 0.05);
    inkFill(ctx, OUTLINE, 0);
  }
  // a mouth full of tombstone teeth that gapes before a charge
  const open = chomp ? R * 0.34 : R * 0.14;
  ctx.beginPath();
  ctx.ellipse(0, R * 0.36, R * 0.42, open, 0, 0, TAU);
  inkFill(ctx, '#2a0a0a', 3.6);
  ctx.fillStyle = '#efe3cc';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * R * 0.15 - R * 0.05, R * 0.36 - open);
    ctx.lineTo(i * R * 0.15 + R * 0.05, R * 0.36 - open);
    ctx.lineTo(i * R * 0.15, R * 0.36 - open + R * 0.14);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

/* --- Gurdy: a wall of tumours pinned to the top of the room --- */
function drawGurdy(ctx, e) {
  const R = e.r;
  shadowUnder(ctx, e.x, e.y + R * 0.8, R * 1.05, 0.4);
  ctx.save();
  ctx.translate(e.x, e.y);
  const breathe = 1 + Math.sin(e.animT * 2.2) * 0.03;
  ctx.scale(breathe, 2 - breathe);
  blob(ctx, 0, 0, R, 2.4, 15, 0.2);
  inkFill(ctx, '#9e7d5c', 5);
  sheen(ctx, 0, -R * 0.2, R, R, 0.22);
  // the field of boils that is basically all Gurdy is
  const rr = makeRng(0x6d51);
  for (let i = 0; i < 22; i++) {
    const a = rr.range(0, TAU), d = rr.range(0.15, 0.85) * R;
    const br = rr.range(0.06, 0.15) * R;
    const bx = Math.cos(a) * d, by = Math.sin(a) * d * 0.85;
    oval(ctx, bx, by, br, br * 0.92);
    inkFill(ctx, rr.chance(0.35) ? '#b8563f' : '#b18f68', 2.4);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    oval(ctx, bx - br * 0.3, by - br * 0.35, br * 0.3, br * 0.26); ctx.fill();
  }
  // face: sunken pit eyes and a wide letterbox mouth
  for (const sd of [-1, 1]) {
    oval(ctx, sd * R * 0.3, -R * 0.24, R * 0.15, R * 0.17);
    inkFill(ctx, '#100a06', 0);
    ctx.fillStyle = `rgba(255,200,120,${0.5 + Math.sin(e.animT * 4) * 0.3})`;
    oval(ctx, sd * R * 0.3, -R * 0.24, R * 0.06, R * 0.07); ctx.fill();
  }
  const open = 0.12 + (e.mouth || 0) * 0.3;
  ctx.beginPath();
  ctx.ellipse(0, R * 0.3, R * 0.4, R * open, 0, 0, TAU);
  inkFill(ctx, '#200c06', 3.6);
  if (e.tell > 0) {
    ctx.fillStyle = `rgba(255,80,60,${0.4 + Math.sin(e.animT * 24) * 0.35})`;
    oval(ctx, 0, R * 0.3, R * 0.24, R * open * 0.6); ctx.fill();
  }
  ctx.restore();
}

/* --- Monstro II: Monstro gone grey, with a brimstone gullet --- */
function drawMonstroII(ctx, e) {
  const air = e.airH || 0;
  const sq = e.squash || 1;
  const R = e.r;
  shadowUnder(ctx, e.x, e.y + R * 0.8, R * (1 - air * 0.0022) * 0.95, 0.42);
  ctx.save();
  ctx.translate(e.x, e.y - air);
  ctx.scale(sq, 2 - sq);
  blob(ctx, 0, 0, R, 1.9, 13, 0.15);
  inkFill(ctx, '#8b8f86', 5);
  sheen(ctx, 0, -R * 0.2, R, R, 0.2);
  // stitched scar across the crown
  ctx.strokeStyle = 'rgba(40,20,16,0.6)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-R * 0.6, -R * 0.55); ctx.quadraticCurveTo(0, -R * 0.78, R * 0.6, -R * 0.5); ctx.stroke();
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(i * R * 0.18, -R * 0.7); ctx.lineTo(i * R * 0.18, -R * 0.46);
    ctx.lineWidth = 2.2; ctx.stroke();
  }
  // one blind milky eye, one red
  const look = norm(e.aimX || 0, e.aimY || 1);
  for (const sd of [-1, 1]) {
    oval(ctx, sd * R * 0.34, -R * 0.18, R * 0.2, R * 0.22);
    inkFill(ctx, sd < 0 ? '#d9d4c4' : '#f7f0e0', 3.4);
    oval(ctx, sd * R * 0.34 + look.x * R * 0.07, -R * 0.18 + look.y * R * 0.07, R * 0.09, R * 0.1);
    inkFill(ctx, sd < 0 ? '#9aa0a0' : '#7a0e12', 0);
  }
  // gullet: glows white-hot while the brimstone charges
  const open = 0.14 + (e.mouth || 0) * 0.36;
  ctx.beginPath();
  ctx.ellipse(0, R * 0.36, R * 0.46, R * open, 0, 0, TAU);
  inkFill(ctx, '#180404', 4);
  ctx.fillStyle = '#e8dcc4';
  for (let i = -3; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(i * R * 0.13 - R * 0.05, R * 0.36 - R * open);
    ctx.lineTo(i * R * 0.13 + R * 0.05, R * 0.36 - R * open);
    ctx.lineTo(i * R * 0.13, R * 0.36 - R * open + R * 0.13);
    ctx.closePath(); ctx.fill();
  }
  if (e.state === 'brimCharge' || e.state === 'brim') {
    const k = e.state === 'brim' ? 1 : 1 - (e.st || 0) / 0.9;
    ctx.fillStyle = `rgba(255,${50 + k * 60},${40 + k * 40},${0.5 + k * 0.5})`;
    ctx.shadowColor = '#ff2222'; ctx.shadowBlur = 22 * k;
    oval(ctx, 0, R * 0.36, R * 0.28 * k + 3, R * 0.22 * k + 3); ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

/* --- Mom: a colossal leg that stomps out of the ceiling --- */
function drawMom(ctx, e) {
  // Cap how far up the foot is *drawn* so it never disappears into the top
  // wall — you have to be able to see what is about to land on you.
  const air = Math.min(e.airH || 0, Math.max(60, e.y - IN_Y0 - 30));
  const R = e.r;
  // The shadow is the whole tell: it shrinks as the foot comes down.
  const sh = R * (1.05 - air * 0.0016);
  ctx.fillStyle = `rgba(0,0,0,${0.2 + (1 - Math.min(1, air / 300)) * 0.32})`;
  oval(ctx, e.x, e.y + R * 0.5, sh, sh * 0.42); ctx.fill();

  ctx.save();
  ctx.translate(e.x, e.y - air);
  // leg disappearing up out of frame
  const lg = ctx.createLinearGradient(0, -R * 6, 0, 0);
  lg.addColorStop(0, '#8d5f68');
  lg.addColorStop(1, '#e2c3b0');
  ctx.fillStyle = lg;
  ctx.beginPath();
  ctx.moveTo(-R * 0.5, -R * 8);
  ctx.lineTo(R * 0.5, -R * 8);
  ctx.quadraticCurveTo(R * 0.66, -R * 1.4, R * 0.62, -R * 0.2);
  ctx.lineTo(-R * 0.62, -R * 0.2);
  ctx.quadraticCurveTo(-R * 0.66, -R * 1.4, -R * 0.5, -R * 8);
  ctx.closePath();
  inkFill(ctx, lg, 5);
  // The foot itself, seen from above: wide at the ball, narrow at the heel.
  ctx.save();
  ctx.translate(0, R * 0.1);
  ctx.beginPath();
  ctx.moveTo(-R * 0.78, -R * 0.34);
  ctx.quadraticCurveTo(-R * 0.98, R * 0.16, -R * 0.42, R * 0.72);
  ctx.quadraticCurveTo(0, R * 1.02, R * 0.42, R * 0.72);
  ctx.quadraticCurveTo(R * 0.98, R * 0.16, R * 0.78, -R * 0.34);
  ctx.quadraticCurveTo(0, -R * 0.72, -R * 0.78, -R * 0.34);
  ctx.closePath();
  inkFill(ctx, '#f0d9c6', 5);
  sheen(ctx, 0, -R * 0.1, R * 0.85, R * 0.7, 0.3);
  // the arch, shaded so the sole reads as a sole
  ctx.fillStyle = 'rgba(160,110,100,0.22)';
  ctx.beginPath();
  ctx.ellipse(0, R * 0.28, R * 0.42, R * 0.3, 0, 0, TAU);
  ctx.fill();
  // one thin black strap across the top of the foot
  ctx.strokeStyle = '#1c1418'; ctx.lineWidth = R * 0.13;
  ctx.beginPath();
  ctx.moveTo(-R * 0.74, -R * 0.16);
  ctx.quadraticCurveTo(0, -R * 0.02, R * 0.74, -R * 0.16);
  ctx.stroke();
  // toes across the front, biggest to smallest
  for (let i = -2; i <= 2; i++) {
    const s = 1 - Math.abs(i) * 0.16;
    const tx = i * R * 0.28;
    oval(ctx, tx, -R * 0.5, R * 0.13 * s, R * 0.11 * s);
    inkFill(ctx, '#f7e6d6', 2.6);
    ctx.fillStyle = '#c0505a';
    oval(ctx, tx, -R * 0.53, R * 0.07 * s, R * 0.05 * s); ctx.fill();
  }
  ctx.restore();
  ctx.restore();

  // the eye she pokes through a door while the leg is up
  if (e.eye) {
    ctx.save();
    ctx.translate(e.eye.x, e.eye.y);
    const look = norm(e.aimX || 0, e.aimY || 1);
    oval(ctx, 0, 0, 26, 22);
    inkFill(ctx, '#f4ece0', 4);
    oval(ctx, look.x * 8, look.y * 7, 11, 11);
    inkFill(ctx, '#3e6f9e', 3);
    oval(ctx, look.x * 9, look.y * 8, 5, 5);
    inkFill(ctx, OUTLINE, 0);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    oval(ctx, -5, -6, 3.4, 3); ctx.fill();
    ctx.restore();
  }
}

/* --- Scolex: an armoured worm; only the blinking tail can be hurt --- */
function drawScolex(ctx, e) {
  if (e.buried) {
    // just a mound of churned earth tracking under the floor
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    blob(ctx, e.x, e.y, e.r * 0.9, e.animT * 3, 9, 0.3); ctx.fill();
    ctx.restore();
    return;
  }
  drawWormBody(ctx, e, { r: e.r, armour: true, glowTail: true });
  const R = e.r;
  shadowUnder(ctx, e.x, e.y + R * 0.8, R * 0.9, 0.36);
  ctx.save();
  ctx.translate(e.x, e.y);
  const ang = Math.atan2(e.vy || 0, e.vx || 1);
  ctx.rotate(ang);
  // drill head
  ctx.beginPath();
  ctx.moveTo(R * 1.15, 0);
  ctx.quadraticCurveTo(R * 0.3, -R * 0.95, -R * 0.7, -R * 0.7);
  ctx.lineTo(-R * 0.7, R * 0.7);
  ctx.quadraticCurveTo(R * 0.3, R * 0.95, R * 1.15, 0);
  ctx.closePath();
  inkFill(ctx, '#7a7f88', 4.4);
  const mg = ctx.createLinearGradient(0, -R, 0, R);
  mg.addColorStop(0, 'rgba(255,255,255,0.32)');
  mg.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = mg; ctx.fill();
  // drill grooves
  ctx.strokeStyle = 'rgba(20,20,26,0.6)'; ctx.lineWidth = 2.4;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(R * (0.9 - i * 0.35), -R * (0.3 + i * 0.16));
    ctx.lineTo(R * (0.9 - i * 0.35), R * (0.3 + i * 0.16));
    ctx.stroke();
  }
  ctx.fillStyle = '#c8302e';
  oval(ctx, -R * 0.2, 0, R * 0.16, R * 0.16); ctx.fill();
  ctx.restore();
}

/* --- Mom's Heart: a vast heart hanging in a curtain of flesh --- */
function drawMomsHeart(ctx, e) {
  const R = e.r;
  const beat = 1 + Math.sin(e.animT * (e.rage ? 7 : 4.4)) * 0.06;
  ctx.save();
  ctx.translate(e.x, e.y);
  // the arteries it hangs from
  ctx.strokeStyle = '#7d1e26'; ctx.lineWidth = R * 0.22; ctx.lineCap = 'round';
  for (const sd of [-1, 0, 1]) {
    ctx.beginPath();
    ctx.moveTo(sd * R * 0.4, -R * 0.6);
    ctx.quadraticCurveTo(sd * R * 0.8, -R * 1.6, sd * R * 0.5, -R * 3);
    ctx.stroke();
  }
  ctx.scale(beat, beat);
  // the heart
  ctx.beginPath();
  ctx.moveTo(0, R * 0.95);
  ctx.bezierCurveTo(-R * 1.35, R * 0.1, -R * 0.85, -R * 0.95, 0, -R * 0.32);
  ctx.bezierCurveTo(R * 0.85, -R * 0.95, R * 1.35, R * 0.1, 0, R * 0.95);
  ctx.closePath();
  inkFill(ctx, e.rage ? '#8f1b2c' : '#b02330', 5.5);
  const hg = ctx.createRadialGradient(-R * 0.3, -R * 0.3, R * 0.1, 0, 0, R * 1.2);
  hg.addColorStop(0, 'rgba(255,190,190,0.32)');
  hg.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = hg; ctx.fill();
  // surface veins
  ctx.strokeStyle = 'rgba(60,6,14,0.5)'; ctx.lineWidth = 3;
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sd * R * 0.15, -R * 0.3);
    ctx.quadraticCurveTo(sd * R * 0.7, R * 0.05, sd * R * 0.45, R * 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sd * R * 0.3, -R * 0.1);
    ctx.quadraticCurveTo(sd * R * 0.85, R * 0.25, sd * R * 0.7, R * 0.45);
    ctx.stroke();
  }
  // the single eye set into it
  const look = norm(e.aimX || 0, e.aimY || 1);
  oval(ctx, 0, -R * 0.05, R * 0.3, R * 0.3);
  inkFill(ctx, '#f2e6d4', 4);
  oval(ctx, look.x * R * 0.1, -R * 0.05 + look.y * R * 0.1, R * 0.14, R * 0.14);
  inkFill(ctx, '#7a0e12', 0);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  oval(ctx, -R * 0.1, -R * 0.16, R * 0.06, R * 0.05); ctx.fill();
  ctx.restore();
}

/* --- Hush: a colossal grey embryo, dead-eyed and dripping --- */
function drawHush(ctx, e) {
  const R = e.r;
  const drift = Math.sin(e.animT * 1.6) * 4;
  shadowUnder(ctx, e.x, e.y + R * 0.85, R * 0.95, 0.3);
  ctx.save();
  ctx.translate(e.x, e.y + drift);
  // halo of cold light
  const gg = ctx.createRadialGradient(0, 0, R * 0.5, 0, 0, R * 1.7);
  gg.addColorStop(0, 'rgba(140,230,255,0.22)');
  gg.addColorStop(1, 'rgba(140,230,255,0)');
  ctx.fillStyle = gg;
  ctx.beginPath(); ctx.arc(0, 0, R * 1.7, 0, TAU); ctx.fill();

  blob(ctx, 0, 0, R, 0.7, 13, 0.1);
  inkFill(ctx, '#c9cfd2', 5);
  sheen(ctx, 0, -R * 0.25, R, R, 0.3);
  // skull sutures
  ctx.strokeStyle = 'rgba(90,105,115,0.5)'; ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.moveTo(0, -R); ctx.quadraticCurveTo(R * 0.12, -R * 0.5, 0, -R * 0.2); ctx.stroke();
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, -R * 0.55);
    ctx.quadraticCurveTo(sd * R * 0.45, -R * 0.72, sd * R * 0.82, -R * 0.42);
    ctx.stroke();
  }
  // huge black eyes weeping
  const look = norm(e.aimX || 0, e.aimY || 1);
  for (const sd of [-1, 1]) {
    oval(ctx, sd * R * 0.36, -R * 0.06, R * 0.24, R * 0.28);
    inkFill(ctx, '#e8eef0', 4);
    oval(ctx, sd * R * 0.36 + look.x * R * 0.08, -R * 0.06 + look.y * R * 0.09, R * 0.13, R * 0.15);
    inkFill(ctx, '#0e1418', 0);
    ctx.fillStyle = 'rgba(150,230,255,0.6)';
    oval(ctx, sd * R * 0.36, R * 0.2 + Math.sin(e.animT * 2 + sd) * R * 0.03, R * 0.05, R * 0.11); ctx.fill();
  }
  // slack, downturned mouth
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-R * 0.26, R * 0.5);
  ctx.quadraticCurveTo(0, R * 0.4 + (e.mouth || 0) * R * 0.3, R * 0.26, R * 0.5);
  ctx.stroke();
  if ((e.mouth || 0) > 0.4) {
    ctx.beginPath();
    ctx.ellipse(0, R * 0.55, R * 0.2, R * 0.14 * e.mouth, 0, 0, TAU);
    inkFill(ctx, '#0c1218', 3);
  }
  ctx.restore();
}

/* --- Satan: a goat-legged throne of a devil --- */
function drawSatan(ctx, e) {
  const R = e.r;
  const air = e.airH || 0;
  if (air > 4) {
    ctx.fillStyle = `rgba(0,0,0,${0.2 + (1 - Math.min(1, air / 320)) * 0.34})`;
    oval(ctx, e.x, e.y + R * 0.6, R * 0.9, R * 0.36); ctx.fill();
  } else {
    shadowUnder(ctx, e.x, e.y + R * 0.85, R, 0.42);
  }
  ctx.save();
  ctx.translate(e.x, e.y - air);
  // hooved legs
  for (const sd of [-1, 1]) {
    ctx.save();
    ctx.translate(sd * R * 0.42, R * 0.7);
    ctx.strokeStyle = '#2e2320'; ctx.lineWidth = R * 0.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(sd * R * 0.2, R * 0.3, sd * R * 0.05, R * 0.6); ctx.stroke();
    ctx.fillStyle = '#141010';
    oval(ctx, sd * R * 0.05, R * 0.66, R * 0.15, R * 0.1); ctx.fill();
    ctx.restore();
  }
  // torso
  blob(ctx, 0, 0, R * 0.92, 1.4, 12, 0.12);
  inkFill(ctx, '#5b4038', 5);
  sheen(ctx, 0, -R * 0.25, R * 0.9, R * 0.9, 0.22);
  // ribs / pecs
  ctx.strokeStyle = 'rgba(20,10,8,0.5)'; ctx.lineWidth = 3;
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(sd * R * 0.3, -R * 0.15, R * 0.28, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }
  // arms held wide; palms glow when he is about to fire
  for (const sd of [-1, 1]) {
    ctx.save();
    ctx.translate(sd * R * 0.78, -R * 0.28);
    ctx.rotate(sd * 0.55);
    // upper arm
    ctx.strokeStyle = '#4e3630'; ctx.lineWidth = R * 0.26; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sd * R * 0.22, R * 0.55); ctx.stroke();
    ctx.strokeStyle = OUTLINE; ctx.lineWidth = R * 0.3;
    ctx.globalCompositeOperation = 'destination-over';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sd * R * 0.22, R * 0.55); ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    // claw
    ctx.translate(sd * R * 0.24, R * 0.6);
    oval(ctx, 0, 0, R * 0.2, R * 0.22);
    inkFill(ctx, '#59402f', 3.6);
    ctx.strokeStyle = '#d8cdb4'; ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * R * 0.1, R * 0.14);
      ctx.lineTo(i * R * 0.13, R * 0.3);
      ctx.stroke();
    }
    if (e.tell > 0) {
      ctx.fillStyle = `rgba(255,70,50,${0.4 + Math.sin(e.animT * 22) * 0.35})`;
      ctx.shadowColor = '#ff3020'; ctx.shadowBlur = 18;
      oval(ctx, 0, 0, R * 0.15, R * 0.15); ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }
  // goat head
  ctx.save();
  ctx.translate(0, -R * 0.82);
  const look = norm(e.aimX || 0, e.aimY || 1);
  // big curled horns, behind the skull
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sd * R * 0.26, -R * 0.16);
    ctx.quadraticCurveTo(sd * R * 1.25, -R * 0.95, sd * R * 1.05, -R * 0.05);
    ctx.quadraticCurveTo(sd * R * 0.95, -R * 0.44, sd * R * 0.7, -R * 0.32);
    ctx.quadraticCurveTo(sd * R * 0.82, -R * 0.14, sd * R * 0.2, -R * 0.02);
    ctx.closePath();
    inkFill(ctx, '#d8cdb4', 3.6);
    ctx.strokeStyle = 'rgba(90,70,50,0.4)'; ctx.lineWidth = 2;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(sd * R * (0.3 + i * 0.2), -R * (0.1 + i * 0.14));
      ctx.lineTo(sd * R * (0.42 + i * 0.2), -R * (0.02 + i * 0.1));
      ctx.stroke();
    }
  }
  // skull + snout
  blob(ctx, 0, 0, R * 0.42, 2.1, 10, 0.1);
  inkFill(ctx, '#6a4c40', 4);
  oval(ctx, 0, R * 0.3, R * 0.24, R * 0.2);
  inkFill(ctx, '#7d5b4a', 3.4);
  ctx.fillStyle = OUTLINE;
  for (const sd of [-1, 1]) { oval(ctx, sd * R * 0.09, R * 0.28, R * 0.04, R * 0.05); ctx.fill(); }
  // glowing slit eyes
  ctx.fillStyle = `rgba(255,${60 + Math.sin(e.animT * 3) * 40},40,0.95)`;
  ctx.shadowColor = '#ff4020'; ctx.shadowBlur = 12;
  for (const sd of [-1, 1]) {
    ctx.save();
    ctx.translate(sd * R * 0.18 + look.x * R * 0.03, -R * 0.08 + look.y * R * 0.03);
    ctx.rotate(sd * 0.35);
    ctx.fillRect(-R * 0.1, -R * 0.04, R * 0.2, R * 0.08);
    ctx.restore();
  }
  ctx.shadowBlur = 0;
  ctx.restore();
  ctx.restore();
}

/* --- shared: the two "final Isaac" bosses are the same silhouette --- */
function drawIsaacLike(ctx, e, col) {
  const R = e.r;
  shadowUnder(ctx, e.x, e.y + R * 0.9, R * 0.85, 0.36);
  ctx.save();
  ctx.translate(e.x, e.y - (e.airH || 0));
  // angel wings in the final phase
  if (e.winged) {
    for (const sd of [-1, 1]) {
      ctx.save();
      ctx.translate(sd * R * 0.6, -R * 0.1);
      const flap = Math.sin(e.animT * 5) * 0.25;
      ctx.rotate(sd * (0.3 + flap));
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(sd * R * (0.6 + i * 0.16), -R * (0.5 - i * 0.18), sd * R * (0.5 + i * 0.2), R * (0.1 + i * 0.16));
        ctx.quadraticCurveTo(sd * R * 0.35, R * 0.05, 0, 0);
        ctx.closePath();
        inkFill(ctx, i % 2 ? col.wingA : col.wingB, 2.6);
      }
      ctx.restore();
    }
  }
  // small body, kept low enough that the head does not swallow it
  for (const sd of [-1, 1]) {
    oval(ctx, sd * R * 0.3, R * 1.14, R * 0.12, R * 0.18);
    inkFill(ctx, col.legs || col.skin, 3);
  }
  oval(ctx, 0, R * 0.92, R * 0.36, R * 0.3);
  inkFill(ctx, col.skin, 4);
  for (const sd of [-1, 1]) {
    oval(ctx, sd * R * 0.5, R * 0.9, R * 0.13, R * 0.21);
    inkFill(ctx, col.skin, 3);
  }
  // the enormous head
  oval(ctx, 0, 0, R * 0.78, R * 0.76);
  inkFill(ctx, col.skin, 5);
  sheen(ctx, 0, -R * 0.2, R * 0.8, R * 0.78, 0.3);
  const look = norm(e.aimX || 0, e.aimY || 1);
  if (col.stitched) {
    // ??? has his eyes sewn shut
    ctx.strokeStyle = OUTLINE; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (const sd of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(sd * R * 0.34 - R * 0.16, -R * 0.06);
      ctx.lineTo(sd * R * 0.34 + R * 0.16, -R * 0.06);
      ctx.stroke();
      for (let i = -1; i <= 1; i++) {
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(sd * R * 0.34 + i * R * 0.11, -R * 0.13);
        ctx.lineTo(sd * R * 0.34 + i * R * 0.11, R * 0.01);
        ctx.stroke();
      }
      ctx.lineWidth = 4;
    }
  } else {
    for (const sd of [-1, 1]) {
      oval(ctx, sd * R * 0.32, -R * 0.06, R * 0.15, R * 0.18);
      inkFill(ctx, '#f7f0e2', 3.2);
      oval(ctx, sd * R * 0.32 + look.x * R * 0.05, -R * 0.06 + look.y * R * 0.06, R * 0.07, R * 0.08);
      inkFill(ctx, col.iris, 0);
    }
  }
  // permanent tears
  ctx.fillStyle = col.tear;
  for (const sd of [-1, 1]) {
    const tl = R * (0.1 + Math.sin(e.animT * 2.4 + sd) * 0.03);
    oval(ctx, sd * R * 0.32, R * 0.2, R * 0.05, tl); ctx.fill();
  }
  // downturned mouth
  ctx.strokeStyle = OUTLINE; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-R * 0.18, R * 0.42);
  ctx.quadraticCurveTo(0, R * 0.34 + (e.mouth || 0) * R * 0.22, R * 0.18, R * 0.42);
  ctx.stroke();
  // halo
  if (col.halo) {
    ctx.strokeStyle = `rgba(255,232,150,${0.7 + Math.sin(e.animT * 3) * 0.2})`;
    ctx.lineWidth = 5;
    ctx.shadowColor = '#ffe98a'; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.ellipse(0, -R * 1.05, R * 0.45, R * 0.16, 0, 0, TAU); ctx.stroke();
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

function drawIsaacBoss(ctx, e) {
  drawIsaacLike(ctx, e, {
    skin: '#f0dcbe', iris: '#3d6f9e', tear: 'rgba(160,205,235,0.85)',
    wingA: '#fdf7e6', wingB: '#ddd2ba', halo: true,
  });
}

function drawBlueBaby(ctx, e) {
  drawIsaacLike(ctx, e, {
    skin: '#93a8bd', iris: '#0e1418', tear: 'rgba(90,120,150,0.9)',
    wingA: '#c9d8e6', wingB: '#8fa3b8', stitched: true, halo: false,
  });
  // sickly aura, so ??? never reads as just "blue Isaac"
  ctx.save();
  const g = ctx.createRadialGradient(e.x, e.y, e.r * 0.6, e.x, e.y, e.r * 1.6);
  g.addColorStop(0, 'rgba(80,150,190,0.16)');
  g.addColorStop(1, 'rgba(80,150,190,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 1.6, 0, TAU); ctx.fill();
  ctx.restore();
}

/* ==========================================================================
   PROJECTILES
   ========================================================================== */
function drawTear(ctx, t) {
  const r = t.r;
  ctx.save();
  ctx.translate(t.x, t.y - (t.h || 0));
  // shadow on the ground so tears read as flying
  if (t.h) {
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    oval(ctx, 0, t.h, r * 0.8, r * 0.35); ctx.fill();
  }
  const ang = Math.atan2(t.vy, t.vx);
  ctx.rotate(ang + Math.PI / 2);
  // teardrop silhouette
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.5);
  ctx.quadraticCurveTo(r, -r * 0.2, r * 0.75, r * 0.55);
  ctx.quadraticCurveTo(0, r * 1.35, -r * 0.75, r * 0.55);
  ctx.quadraticCurveTo(-r, -r * 0.2, 0, -r * 1.5);
  ctx.closePath();
  const g = ctx.createLinearGradient(-r, -r, r, r);
  g.addColorStop(0, t.colorHi || '#eaf6ff');
  g.addColorStop(1, t.color || '#a9d4ef');
  inkFill(ctx, g, t.enemy ? 2.6 : 2.2, t.enemy ? '#2a0808' : '#20313d');
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  oval(ctx, -r * 0.25, -r * 0.35, r * 0.26, r * 0.4); ctx.fill();
  ctx.restore();
}

function drawLaser(ctx, l) {
  const len = l.len, w = l.w;
  ctx.save();
  ctx.translate(l.x, l.y);
  ctx.rotate(Math.atan2(l.dy, l.dx));
  // Enemy beams are violet so a screen full of red never hides one from you.
  const c = l.enemy
    ? { edge: 'rgba(200,120,255,0.25)', mid: '#8e23c8', core: '#f6e0ff', glow: '#c04bff' }
    : { edge: 'rgba(255,120,120,0.25)', mid: '#d61f2a', core: '#ffdede', glow: '#ff3b3b' };
  const g = ctx.createLinearGradient(0, -w, 0, w);
  g.addColorStop(0, c.edge);
  g.addColorStop(0.35, c.mid);
  g.addColorStop(0.5, c.core);
  g.addColorStop(0.65, c.mid);
  g.addColorStop(1, c.edge);
  ctx.fillStyle = g;
  ctx.shadowColor = c.glow; ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.moveTo(0, -w);
  ctx.lineTo(len, -w * 0.72);
  ctx.lineTo(len, w * 0.72);
  ctx.lineTo(0, w);
  ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  // muzzle flare
  ctx.fillStyle = l.enemy ? 'rgba(240,215,255,0.85)' : 'rgba(255,225,225,0.85)';
  oval(ctx, 0, 0, w * 1.1, w * 1.3); ctx.fill();
  ctx.restore();
}

/* ==========================================================================
   PROPS / PICKUPS
   ========================================================================== */
function drawRock(ctx, o, theme) {
  const x = o.x, y = o.y, r = o.r;
  shadowUnder(ctx, x, y + r * 0.78, r * 0.95, 0.38);
  ctx.save();
  ctx.translate(x, y);
  // squat, rounded boulder — wider than tall so it reads as top-down
  ctx.save();
  ctx.scale(1, 0.9);
  blob(ctx, 0, 0, r, o.seed, 11, 0.2);
  inkFill(ctx, theme.accent, 3.4);
  // top-lit cap
  const g = ctx.createLinearGradient(0, -r, 0, r * 0.8);
  g.addColorStop(0, 'rgba(255,246,220,0.3)');
  g.addColorStop(0.42, 'rgba(255,246,220,0.03)');
  g.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = g;
  blob(ctx, 0, 0, r, o.seed, 11, 0.2); ctx.fill();
  ctx.restore();
  // a couple of chiselled facet lines for texture
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.42, -r * 0.1);
  ctx.lineTo(-r * 0.08, -r * 0.44);
  ctx.lineTo(r * 0.3, -r * 0.12);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,246,220,0.14)'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.5, r * 0.2); ctx.lineTo(r * 0.18, r * 0.32);
  ctx.stroke();
  ctx.restore();
}

function drawPoop(ctx, o) {
  const x = o.x, y = o.y, r = o.r;
  const st = o.hp / o.maxHp;
  shadowUnder(ctx, x, y + r * 0.8, r * 0.85, 0.3);
  ctx.save();
  ctx.translate(x, y);
  const tiers = st > 0.66 ? 3 : st > 0.33 ? 2 : 1;
  for (let i = 0; i < tiers; i++) {
    const rr = r * (1 - i * 0.22);
    blob(ctx, 0, r * 0.45 - i * r * 0.42, rr, o.seed + i, 9);
    inkFill(ctx, ['#6b4a2a', '#7a5732', '#8a6440'][i], 2.8);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  oval(ctx, -r * 0.25, -r * 0.35, r * 0.22, r * 0.14); ctx.fill();
  ctx.restore();
}

function drawPit(ctx, o, theme) {
  ctx.save();
  // broken stone rim, lit from above
  blob(ctx, o.x, o.y + 2, o.r * 1.1, o.seed, 12, 0.22);
  inkFill(ctx, theme.accent, 0);
  const rim = ctx.createLinearGradient(0, o.y - o.r, 0, o.y + o.r);
  rim.addColorStop(0, 'rgba(255,246,220,0.22)');
  rim.addColorStop(0.5, 'rgba(0,0,0,0.15)');
  rim.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = rim;
  blob(ctx, o.x, o.y + 2, o.r * 1.1, o.seed, 12, 0.22); ctx.fill();

  // the hole itself: never pure black, it fades into warm dark
  blob(ctx, o.x, o.y, o.r * 0.92, o.seed + 1.3, 12, 0.2);
  const g = ctx.createRadialGradient(o.x, o.y + o.r * 0.35, 2, o.x, o.y, o.r);
  g.addColorStop(0, '#080604');
  g.addColorStop(0.6, '#0f0b07');
  g.addColorStop(1, '#241a10');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.lineWidth = 3;
  ctx.stroke();
  // inner lip catching the light at the top edge
  ctx.strokeStyle = 'rgba(255,246,220,0.12)'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(o.x, o.y, o.r * 0.84, Math.PI * 1.12, Math.PI * 1.88);
  ctx.stroke();
  ctx.restore();
}

function drawSpikes(ctx, o) {
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(-o.r, -o.r * 0.55, o.r * 2, o.r * 1.5);
  const up = o.up;
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j += 2) {
      const bx = i * o.r * 0.6, by = j * o.r * 0.35;
      const h = up ? o.r * 0.85 : o.r * 0.18;
      ctx.beginPath();
      ctx.moveTo(bx - 6, by + 4);
      ctx.lineTo(bx, by + 4 - h);
      ctx.lineTo(bx + 6, by + 4);
      ctx.closePath();
      inkFill(ctx, up ? '#cfd4d8' : '#8a8f94', 2);
      if (up) {
        ctx.fillStyle = 'rgba(160,20,30,0.5)';
        ctx.beginPath();
        ctx.moveTo(bx - 2, by + 4 - h * 0.55); ctx.lineTo(bx, by + 4 - h); ctx.lineTo(bx + 2, by + 4 - h * 0.55);
        ctx.closePath(); ctx.fill();
      }
    }
  }
  ctx.restore();
}

function drawHeartPickup(ctx, o, t) {
  const bob = Math.sin(t * 4 + o.x) * 2.5;
  shadowUnder(ctx, o.x, o.y + 11, 9, 0.28);
  ctx.save();
  ctx.translate(o.x, o.y + bob);
  ctx.scale(1.15, 1.15);
  heartPath(ctx, 0, 0, 9);
  inkFill(ctx, o.kind === 'half' ? '#c22b3a' : '#e0303f', 2.6);
  if (o.kind === 'half') {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, -14, 14, 28); ctx.clip();
    heartPath(ctx, 0, 0, 9); inkFill(ctx, '#5a5a5a', 0);
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  oval(ctx, -3.2, -3.4, 2.2, 1.6); ctx.fill();
  ctx.restore();
}

function heartPath(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.85);
  ctx.bezierCurveTo(x - s * 1.5, y - s * 0.3, x - s * 0.75, y - s * 1.2, x, y - s * 0.35);
  ctx.bezierCurveTo(x + s * 0.75, y - s * 1.2, x + s * 1.5, y - s * 0.3, x, y + s * 0.85);
  ctx.closePath();
}

function drawCoin(ctx, o, t) {
  const spin = Math.abs(Math.cos(t * 3 + o.x * 0.1));
  const bob = Math.sin(t * 4 + o.y) * 2;
  shadowUnder(ctx, o.x, o.y + 10, 8, 0.26);
  ctx.save();
  ctx.translate(o.x, o.y + bob);
  oval(ctx, 0, 0, 8 * Math.max(0.22, spin), 9);
  inkFill(ctx, '#e7c351', 2.4);
  if (spin > 0.55) {
    ctx.fillStyle = '#b8952e';
    oval(ctx, 0, 0, 4.4 * spin, 5); ctx.fill();
    ctx.fillStyle = '#fff3bd';
    oval(ctx, -1.6 * spin, -2.4, 1.6 * spin, 2); ctx.fill();
  }
  ctx.restore();
}

function drawPedestal(ctx, o, t, item) {
  const bob = Math.sin(t * 2.6) * 3.5;
  shadowUnder(ctx, o.x, o.y + 24, 25, 0.4);
  ctx.save();
  ctx.translate(o.x, o.y);
  // stone plinth
  oval(ctx, 0, 20, 24, 10);
  inkFill(ctx, '#7b6a48', 3.2);
  ctx.fillStyle = '#6d5f42';
  ctx.beginPath();
  ctx.moveTo(-16, 18); ctx.lineTo(16, 18); ctx.lineTo(11, 0); ctx.lineTo(-11, 0); ctx.closePath();
  inkFill(ctx, '#63563c', 3.2);
  ctx.fillStyle = 'rgba(255,246,220,0.14)';
  ctx.fillRect(-13, 2, 4, 14);
  oval(ctx, 0, 0, 15, 6.5);
  inkFill(ctx, '#a08d64', 3.2);
  // holy glow rising off the plinth
  const g = ctx.createRadialGradient(0, -20 + bob, 3, 0, -20 + bob, 44);
  g.addColorStop(0, 'rgba(255,242,186,0.55)');
  g.addColorStop(0.5, 'rgba(255,230,150,0.16)');
  g.addColorStop(1, 'rgba(255,240,180,0)');
  ctx.fillStyle = g;
  oval(ctx, 0, -20 + bob, 44, 40); ctx.fill();
  if (item && item.icon) {
    ctx.save();
    ctx.translate(0, -22 + bob);
    ctx.scale(1.45, 1.45);
    item.icon(ctx, 1.45);
    ctx.restore();
  }
  ctx.restore();
}

/** A shop stall: pedestal, the goods, and a price tag that turns red when
    you cannot afford it. */
function drawShopItem(ctx, o, t, item, coins) {
  const bob = Math.sin(t * 2.6 + o.x * 0.01) * 3;
  shadowUnder(ctx, o.x, o.y + 22, 23, 0.38);
  ctx.save();
  ctx.translate(o.x, o.y);
  // low wooden stall
  ctx.beginPath();
  ctx.moveTo(-19, 18); ctx.lineTo(19, 18); ctx.lineTo(14, 2); ctx.lineTo(-14, 2); ctx.closePath();
  inkFill(ctx, o.sold ? '#4b422f' : '#6a5433', 3.2);
  oval(ctx, 0, 2, 17, 6.5);
  inkFill(ctx, o.sold ? '#6b5f47' : '#96794a', 3.2);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.6;
  for (const bx of [-8, 0, 8]) {
    ctx.beginPath(); ctx.moveTo(bx, 4); ctx.lineTo(bx * 0.75, 17); ctx.stroke();
  }

  if (o.sold) {
    ctx.fillStyle = 'rgba(200,190,160,0.4)';
    ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SOLD', 0, -8);
    ctx.restore();
    return;
  }

  const glow = ctx.createRadialGradient(0, -18 + bob, 3, 0, -18 + bob, 40);
  glow.addColorStop(0, 'rgba(255,235,160,0.4)');
  glow.addColorStop(1, 'rgba(255,235,160,0)');
  ctx.fillStyle = glow;
  oval(ctx, 0, -18 + bob, 40, 36); ctx.fill();

  ctx.save();
  ctx.translate(0, -20 + bob);
  if (o.offer === 'heart') {
    ctx.scale(1.5, 1.5);
    heartPath(ctx, 0, 0, 8);
    inkFill(ctx, '#e0303f', 2.4);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    oval(ctx, -2.8, -3, 2, 1.4); ctx.fill();
  } else if (item && item.icon) {
    ctx.scale(1.35, 1.35);
    item.icon(ctx, 1.35);
  }
  ctx.restore();

  // price tag
  const afford = coins === undefined || coins >= o.price;
  ctx.font = 'bold 13px "Trebuchet MS", sans-serif';
  ctx.textAlign = 'center';
  const label = '¢ ' + o.price;
  const w = ctx.measureText(label).width + 14;
  ctx.fillStyle = 'rgba(12,8,5,0.8)';
  roundRect(ctx, -w / 2, 20, w, 18, 5); ctx.fill();
  ctx.strokeStyle = afford ? 'rgba(231,195,81,0.7)' : 'rgba(200,70,60,0.7)';
  ctx.lineWidth = 1.6;
  roundRect(ctx, -w / 2, 20, w, 18, 5); ctx.stroke();
  ctx.fillStyle = afford ? '#e7c351' : '#c8504a';
  ctx.fillText(label, 0, 33);
  ctx.restore();
}

function drawChest(ctx, o, t) {
  shadowUnder(ctx, o.x, o.y + 14, 19, 0.34);
  ctx.save();
  ctx.translate(o.x, o.y);
  const lid = o.opened ? -0.9 : Math.sin(t * 2) * 0.03;
  const gold = o.kind === 'gold';
  // body
  ctx.beginPath();
  ctx.rect(-18, -2, 36, 18);
  inkFill(ctx, gold ? '#c9a83c' : '#8a6a3e', 3);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(-18, 10, 36, 6);
  // lid
  ctx.save();
  ctx.translate(0, -2);
  ctx.rotate(lid);
  ctx.beginPath();
  ctx.moveTo(-18, 0);
  ctx.lineTo(-18, -9);
  ctx.quadraticCurveTo(0, -20, 18, -9);
  ctx.lineTo(18, 0);
  ctx.closePath();
  inkFill(ctx, gold ? '#e0bd44' : '#a07f4c', 3);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.moveTo(-14, -6); ctx.quadraticCurveTo(0, -16, 14, -6);
  ctx.lineTo(14, -3); ctx.quadraticCurveTo(0, -12, -14, -3);
  ctx.closePath(); ctx.fill();
  ctx.restore();
  // lock
  if (!o.opened) {
    ctx.fillStyle = '#3d3123';
    ctx.fillRect(-5, -6, 10, 12);
    ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2; ctx.strokeRect(-5, -6, 10, 12);
    ctx.fillStyle = '#f0dd93';
    oval(ctx, 0, 0, 2.4, 2.4); ctx.fill();
  } else {
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
    g.addColorStop(0, 'rgba(255,240,190,0.45)');
    g.addColorStop(1, 'rgba(255,240,190,0)');
    ctx.fillStyle = g; oval(ctx, 0, 0, 26, 20); ctx.fill();
  }
  ctx.restore();
}

function drawTrapdoor(ctx, o, t) {
  ctx.save();
  ctx.translate(o.x, o.y);
  oval(ctx, 0, 0, 30, 16);
  inkFill(ctx, '#1a120a', 4);
  const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 28);
  g.addColorStop(0, '#000'); g.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = g; oval(ctx, 0, 0, 27, 14); ctx.fill();
  // open hatch leaves
  for (const sd of [-1, 1]) {
    ctx.save();
    ctx.translate(sd * 26, 0);
    ctx.rotate(sd * 0.5);
    ctx.beginPath(); ctx.rect(-4, -14, 8, 28);
    inkFill(ctx, '#5b4a30', 3);
    ctx.restore();
  }
  const pulse = 0.35 + Math.sin(t * 4) * 0.2;
  ctx.strokeStyle = `rgba(255,220,140,${pulse})`;
  ctx.lineWidth = 3;
  oval(ctx, 0, 0, 32, 17); ctx.stroke();
  ctx.restore();
}

/* ==========================================================================
   POST FX
   ========================================================================== */
function drawVignette(ctx, theme) {
  const g = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.34, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.95);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.72, 'rgba(0,0,0,0.28)');
  g.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

let _grainCv = null;
function drawGrain(ctx, alpha = 0.05) {
  if (!_grainCv) {
    _grainCv = document.createElement('canvas');
    _grainCv.width = _grainCv.height = 180;
    const c = _grainCv.getContext('2d');
    const img = c.createImageData(180, 180);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 120 + Math.random() * 135;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    c.putImageData(img, 0, 0);
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = 'overlay';
  const ox = -Math.random() * 60, oy = -Math.random() * 60;
  for (let x = ox; x < VIEW_W; x += 180) {
    for (let y = oy; y < VIEW_H; y += 180) ctx.drawImage(_grainCv, x, y);
  }
  ctx.restore();
}
