/* ==========================================================================
   items.js — passive collectibles. Every icon is drawn with code.
   Effects fall into the three buckets the brief asks for:
     * attack-pattern changes (brimstone / triple shot / homing / boomerang…)
     * raw stat changes (damage, fire rate, range, speed, shot speed, health)
     * visible changes to the character (halo, wings, spots, aura, orbitals)
   Everything stacks: apply() only ever adds to the running stat block.
   ========================================================================== */
'use strict';

/* ---------- shared icon primitives ---------- */
function icoPill(ctx, col, col2) {
  oval(ctx, 0, 0, 11, 13); inkFill(ctx, col, 2.6);
  ctx.save();
  ctx.beginPath(); ctx.rect(-12, -14, 24, 14); ctx.clip();
  oval(ctx, 0, 0, 11, 13); inkFill(ctx, col2, 0);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  oval(ctx, -3.5, -5, 2.6, 3.4); ctx.fill();
}
function icoEye(ctx, sclera, iris) {
  oval(ctx, 0, 0, 13, 10); inkFill(ctx, sclera, 2.6);
  oval(ctx, 0, 0, 6, 6.5); inkFill(ctx, iris, 2.2);
  oval(ctx, 0, 0, 2.6, 3); inkFill(ctx, OUTLINE, 0);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  oval(ctx, -2.4, -2.6, 1.8, 1.8); ctx.fill();
}
function icoStar(ctx, col, r = 12, pts = 5) {
  ctx.beginPath();
  for (let i = 0; i < pts * 2; i++) {
    const a = -Math.PI / 2 + i * Math.PI / pts;
    const rr = i % 2 ? r * 0.45 : r;
    const x = Math.cos(a) * rr, y = Math.sin(a) * rr;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath(); inkFill(ctx, col, 2.4);
}
function icoArrowUp(ctx, col) {
  ctx.beginPath();
  ctx.moveTo(0, -12); ctx.lineTo(9, -1); ctx.lineTo(3.5, -1);
  ctx.lineTo(3.5, 11); ctx.lineTo(-3.5, 11); ctx.lineTo(-3.5, -1); ctx.lineTo(-9, -1);
  ctx.closePath(); inkFill(ctx, col, 2.4);
}

const ITEMS = [
  {
    id: 'sadOnion', name: 'SAD ONION', desc: '射速 +0.6',
    icon(ctx) {
      oval(ctx, 0, 2, 11, 11); inkFill(ctx, '#d9d2a8', 2.6);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.6;
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 4, -8); ctx.quadraticCurveTo(sd * 6, 2, sd * 3, 12); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(-3, -15); ctx.lineTo(2, -14); ctx.closePath();
      inkFill(ctx, '#79923f', 2);
      ctx.fillStyle = 'rgba(150,200,235,0.9)';
      oval(ctx, 6, 8, 2, 3.4); ctx.fill();
    },
    apply(p) { p.stats.fireRate += 0.6; },
  },
  {
    id: 'innerEye', name: 'THE INNER EYE', desc: '三重射击, 射速 -0.7',
    icon(ctx) { icoEye(ctx, '#f3e9d8', '#3d6f9e'); },
    apply(p) { p.flags.extraTears += 2; p.stats.fireRate -= 0.7; },
  },
  {
    id: 'twenty', name: '20/20', desc: '双重射击, 伤害 x0.85',
    icon(ctx) {
      for (const sd of [-1, 1]) { ctx.save(); ctx.translate(sd * 6, 0); ctx.scale(0.62, 0.62); icoEye(ctx, '#f3e9d8', '#8c4a9e'); ctx.restore(); }
    },
    apply(p) { p.flags.extraTears += 1; p.stats.damage *= 0.85; },
  },
  {
    id: 'cricket', name: "CRICKET'S HEAD", desc: '伤害 x1.35 +0.5',
    icon(ctx) {
      oval(ctx, 0, 0, 12, 11); inkFill(ctx, '#7f9a4c', 2.6);
      for (const sd of [-1, 1]) { oval(ctx, sd * 5, -2, 3.6, 4.6); inkFill(ctx, '#20140c', 0); }
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2;
      for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 5, -9); ctx.lineTo(sd * 10, -16); ctx.stroke(); }
      ctx.fillStyle = BLOOD; oval(ctx, 0, 8, 4, 2.4); ctx.fill();
    },
    apply(p) { p.stats.damage = p.stats.damage * 1.35 + 0.5; },
  },
  {
    id: 'numberOne', name: 'NUMBER ONE', desc: '射速 +1.4, 射程 -110',
    icon(ctx) {
      ctx.fillStyle = '#f2e6c8';
      ctx.beginPath(); ctx.moveTo(-9, 12); ctx.lineTo(9, 12); ctx.lineTo(9, -10); ctx.lineTo(-9, -10); ctx.closePath();
      inkFill(ctx, '#e9e2d0', 2.6);
      ctx.fillStyle = '#4b7fa8';
      oval(ctx, 0, 4, 6, 4); ctx.fill();
      ctx.strokeStyle = '#4b7fa8'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.quadraticCurveTo(4, -4, 0, 2); ctx.stroke();
      ctx.fillStyle = OUTLINE; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
      ctx.fillText('1', 0, -1);
    },
    apply(p) { p.stats.fireRate += 1.4; p.stats.range -= 110; },
  },
  {
    id: 'brimstone', name: 'BRIMSTONE', desc: '蓄力发射血腥激光',
    icon(ctx) {
      oval(ctx, 0, 0, 12, 12); inkFill(ctx, '#3a1414', 2.6);
      ctx.fillStyle = '#c81f28';
      oval(ctx, 0, 0, 7, 7); ctx.fill();
      ctx.fillStyle = '#ffdede';
      ctx.fillRect(-1.8, -12, 3.6, 24);
      ctx.fillStyle = '#7a1218';
      oval(ctx, 0, 0, 3, 3); ctx.fill();
    },
    apply(p) { p.flags.brimstone = true; p.stats.damage *= 1.15; p.stats.fireRate = Math.max(1.1, p.stats.fireRate * 0.55); },
  },
  {
    id: 'technology', name: 'TECHNOLOGY', desc: '眼泪变成穿透激光弹',
    icon(ctx) {
      oval(ctx, 0, 0, 12, 10); inkFill(ctx, '#b9c2c9', 2.6);
      oval(ctx, 0, 0, 5.5, 5.5); inkFill(ctx, '#e04040', 2);
      ctx.strokeStyle = '#7f8a92'; ctx.lineWidth = 2;
      for (let i = 0; i < 6; i++) { const a = i * TAU / 6; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 7, Math.sin(a) * 6); ctx.lineTo(Math.cos(a) * 12, Math.sin(a) * 10); ctx.stroke(); }
      ctx.fillStyle = '#ffd0d0'; oval(ctx, 0, 0, 2, 2); ctx.fill();
    },
    apply(p) { p.flags.piercing = true; p.flags.tech = true; p.stats.shotSpeed += 190; p.stats.damage += 0.6; },
  },
  {
    id: 'spoonBender', name: 'SPOON BENDER', desc: '眼泪自动追踪敌人',
    icon(ctx) {
      ctx.strokeStyle = '#c8ccd2'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-7, 11); ctx.quadraticCurveTo(6, 4, -2, -6); ctx.stroke();
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = 1.4; ctx.stroke();
      oval(ctx, -3, -10, 6, 7); inkFill(ctx, '#dfe4ea', 2.2);
      ctx.fillStyle = '#a94fc0'; oval(ctx, -3, -10, 3, 3.6); ctx.fill();
    },
    apply(p) { p.flags.homing = true; },
  },
  {
    id: 'cupid', name: "CUPID'S ARROW", desc: '眼泪穿透敌人',
    icon(ctx) {
      ctx.save(); ctx.rotate(-Math.PI / 4);
      ctx.strokeStyle = '#8a6a3e'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(8, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(5, -6); ctx.lineTo(5, 6); ctx.closePath();
      inkFill(ctx, '#e05a6a', 2.2);
      ctx.strokeStyle = '#f0e2c0'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(-6, -5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(-6, 5); ctx.stroke();
      ctx.restore();
    },
    apply(p) { p.flags.piercing = true; },
  },
  {
    id: 'reflection', name: 'MY REFLECTION', desc: '眼泪回旋飞回',
    icon(ctx) {
      ctx.beginPath(); ctx.rect(-9, -12, 18, 24); inkFill(ctx, '#9fb6c4', 2.6);
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath(); ctx.moveTo(-7, 10); ctx.lineTo(6, -10); ctx.lineTo(9, -4); ctx.lineTo(-4, 10); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#5b4a30'; ctx.lineWidth = 3; ctx.strokeRect(-9, -12, 18, 24);
    },
    apply(p) { p.flags.boomerang = true; p.stats.damage += 0.4; },
  },
  {
    id: 'mushroom', name: 'MAGIC MUSHROOM', desc: '全属性提升, 体型变大',
    icon(ctx) {
      ctx.beginPath(); ctx.moveTo(-6, 12); ctx.quadraticCurveTo(-4, 2, -7, 1);
      ctx.lineTo(7, 1); ctx.quadraticCurveTo(4, 2, 6, 12); ctx.closePath();
      inkFill(ctx, '#f0e4cc', 2.4);
      ctx.beginPath(); ctx.moveTo(-13, 2); ctx.quadraticCurveTo(0, -17, 13, 2); ctx.closePath();
      inkFill(ctx, '#c8322e', 2.6);
      ctx.fillStyle = '#f7ece0';
      for (const o of [[-6, -3, 3], [3, -6, 2.6], [8, -1, 2.2], [-1, -8, 2]]) { oval(ctx, o[0], o[1], o[2], o[2] * 0.85); ctx.fill(); }
    },
    apply(p) { p.stats.damage += 1; p.stats.range += 60; p.stats.speed += 14; p.addMaxHp(2); p.flags.spots = true; p.flags.visScale = Math.min(1.3, p.flags.visScale + 0.16); },
  },
  {
    id: 'lordPit', name: 'LORD OF THE PIT', desc: '获得飞行, 移速提升',
    icon(ctx) {
      for (const sd of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(0, -2);
        ctx.quadraticCurveTo(sd * 12, -13, sd * 15, 2);
        ctx.quadraticCurveTo(sd * 9, 1, sd * 11, 10);
        ctx.quadraticCurveTo(sd * 5, 4, 0, -2); ctx.closePath();
        inkFill(ctx, '#3b2a4a', 2.4);
      }
      oval(ctx, 0, 0, 5, 7); inkFill(ctx, '#f0dcbe', 2.2);
      ctx.fillStyle = OUTLINE; oval(ctx, -1.6, -1, 1.3, 1.8); ctx.fill(); oval(ctx, 1.6, -1, 1.3, 1.8); ctx.fill();
    },
    apply(p) { p.flags.flight = true; p.stats.speed += 22; },
  },
  {
    id: 'martyr', name: 'BLOOD OF THE MARTYR', desc: '伤害 +1',
    icon(ctx) {
      ctx.fillStyle = '#e8dfc8';
      ctx.fillRect(-3.5, -13, 7, 26); ctx.fillRect(-11, -6, 22, 7);
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2.4;
      ctx.strokeRect(-3.5, -13, 7, 26); ctx.strokeRect(-11, -6, 22, 7);
      ctx.fillStyle = BLOOD;
      oval(ctx, 0, 6, 3, 4.4); ctx.fill();
      oval(ctx, 8, -1, 2.4, 3.4); ctx.fill();
    },
    apply(p) { p.stats.damage += 1; },
  },
  {
    id: 'pentagram', name: 'PENTAGRAM', desc: '伤害 +1, 暗黑光环',
    icon(ctx) {
      oval(ctx, 0, 0, 12, 12); inkFill(ctx, '#2a1030', 2.6);
      ctx.strokeStyle = '#d84a5a'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i * 4 * Math.PI / 5; const x = Math.cos(a) * 9, y = Math.sin(a) * 9; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.closePath(); ctx.stroke();
    },
    apply(p) { p.stats.damage += 1; p.flags.aura = true; },
  },
  {
    id: 'halo', name: 'THE HALO', desc: '全属性小幅提升 + 光环',
    icon(ctx) {
      ctx.strokeStyle = '#ffe98a'; ctx.lineWidth = 4.5;
      ctx.shadowColor = '#ffe98a'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.ellipse(0, 0, 12, 6, 0, 0, TAU); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(0, 0, 14, 8, 0, 0, TAU); ctx.stroke();
    },
    apply(p) {
      p.stats.damage += 0.5; p.stats.fireRate += 0.25; p.stats.range += 30;
      p.stats.speed += 8; p.stats.shotSpeed += 40; p.addMaxHp(2); p.flags.halo = true;
    },
  },
  {
    id: 'loki', name: "LOKI'S HORNS", desc: '25% 概率四向齐射',
    icon(ctx) {
      oval(ctx, 0, 3, 10, 9); inkFill(ctx, '#c9b48a', 2.6);
      for (const sd of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(sd * 5, -4);
        ctx.quadraticCurveTo(sd * 14, -12, sd * 9, -16);
        ctx.quadraticCurveTo(sd * 12, -8, sd * 3, -5); ctx.closePath();
        inkFill(ctx, '#5b4130', 2.2);
      }
      ctx.fillStyle = OUTLINE; oval(ctx, -3.4, 2, 2, 2.6); ctx.fill(); oval(ctx, 3.4, 2, 2, 2.6); ctx.fill();
    },
    apply(p) { p.flags.loki = true; },
  },
  {
    id: 'polyphemus', name: 'POLYPHEMUS', desc: '巨型眼泪, 伤害 x2.6, 射速大降',
    icon(ctx) {
      oval(ctx, 0, 0, 13, 12); inkFill(ctx, '#f3e9d8', 2.8);
      oval(ctx, 1, 0, 7.5, 7.5); inkFill(ctx, '#c2913c', 2.4);
      oval(ctx, 1, 0, 3.4, 3.4); inkFill(ctx, OUTLINE, 0);
      ctx.strokeStyle = 'rgba(160,20,30,0.6)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(-11, -4); ctx.quadraticCurveTo(-5, 0, -10, 5); ctx.stroke();
    },
    apply(p) { p.stats.damage *= 2.6; p.stats.fireRate = Math.max(1.0, p.stats.fireRate * 0.45); p.flags.bigTear = true; p.flags.piercing = true; },
  },
  {
    id: 'cubeOfMeat', name: 'CUBE OF MEAT', desc: '环绕肉块, 接触伤害',
    icon(ctx) {
      ctx.beginPath(); ctx.rect(-10, -10, 20, 20); inkFill(ctx, '#b8443e', 2.8);
      ctx.fillStyle = '#d9615a'; ctx.fillRect(-7, -7, 8, 8);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-2, 2, 9, 6);
      ctx.fillStyle = '#f2ece0'; oval(ctx, 5, -5, 2.4, 2.4); ctx.fill();
    },
    apply(p) { p.flags.orbital += 1; },
  },
  {
    id: 'speedBall', name: 'SPEED BALL', desc: '移速 +26, 弹速 +110',
    icon(ctx) {
      oval(ctx, 0, 0, 12, 12); inkFill(ctx, '#e9e2d0', 2.6);
      ctx.strokeStyle = '#3f6fa0'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(-7, 0, 9, -0.9, 0.9); ctx.stroke();
      ctx.beginPath(); ctx.arc(7, 0, 9, Math.PI - 0.9, Math.PI + 0.9); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-14, -7); ctx.lineTo(-20, -7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-22, 0); ctx.stroke();
    },
    apply(p) { p.stats.speed += 26; p.stats.shotSpeed += 110; },
  },
  {
    id: 'breakfast', name: 'BREAKFAST', desc: '生命上限 +1 心并回满',
    icon(ctx) {
      oval(ctx, 0, 3, 13, 9); inkFill(ctx, '#dfe4ea', 2.6);
      oval(ctx, 0, 1, 9, 6); inkFill(ctx, '#e8c95a', 2.2);
      ctx.fillStyle = '#f7e79a'; oval(ctx, -3, -1, 3, 2); ctx.fill();
      ctx.strokeStyle = '#b8bcc2'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-13, 6); ctx.lineTo(13, 6); ctx.stroke();
    },
    apply(p) { p.addMaxHp(2); p.heal(99); },
  },
  {
    id: 'ironBar', name: 'IRON BAR', desc: '伤害 +0.8, 眼泪击退加强',
    icon(ctx) {
      ctx.save(); ctx.rotate(-0.5);
      ctx.beginPath(); ctx.rect(-4, -13, 8, 26); inkFill(ctx, '#8d949b', 2.6);
      ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(-3, -12, 2.4, 24);
      ctx.fillStyle = BLOOD; oval(ctx, 1, -10, 3, 4); ctx.fill();
      ctx.restore();
    },
    apply(p) { p.stats.damage += 0.8; p.flags.knockback += 130; },
  },
  {
    id: 'wireCoat', name: 'WIRE COAT HANGER', desc: '射速 +0.9',
    icon(ctx) {
      ctx.strokeStyle = '#c8ccd2'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-12, 6); ctx.lineTo(0, -6); ctx.lineTo(12, 6); ctx.closePath(); ctx.stroke();
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.strokeStyle = '#c8ccd2'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(0, -6); ctx.quadraticCurveTo(5, -13, 0, -14); ctx.stroke();
    },
    apply(p) { p.stats.fireRate += 0.9; },
  },

  /* ================= attack-pattern rewrites ================= */
  {
    id: 'ipecac', name: 'IPECAC', desc: '眼泪落地爆炸, 伤害大增, 射速暴跌',
    icon(ctx) {
      oval(ctx, 0, 3, 10, 11); inkFill(ctx, '#6f9a3c', 2.6);
      ctx.fillStyle = '#9ec95a';
      oval(ctx, -3, -1, 4, 5); ctx.fill();
      ctx.fillStyle = '#4a6b22';
      for (const o of [[4, 5], [-2, 8], [6, -2]]) { oval(ctx, o[0], o[1], 2.2, 2.6); ctx.fill(); }
      ctx.strokeStyle = '#3d5a1c'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.quadraticCurveTo(4, -13, -1, -15); ctx.stroke();
    },
    apply(p) {
      p.flags.explosive = true;
      p.stats.damage = p.stats.damage * 1.6 + 3;
      p.stats.fireRate = Math.max(0.9, p.stats.fireRate * 0.5);
      p.stats.shotSpeed -= 60;
    },
  },
  {
    id: 'rubberCement', name: 'RUBBER CEMENT', desc: '眼泪撞墙反弹',
    icon(ctx) {
      ctx.beginPath(); ctx.rect(-11, -6, 22, 14); inkFill(ctx, '#d8d2c0', 2.6);
      ctx.fillStyle = '#8c8578'; ctx.fillRect(-11, -6, 22, 4);
      ctx.strokeStyle = '#3f6fa0'; ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-9, -12); ctx.lineTo(-2, -16); ctx.lineTo(5, -10); ctx.lineTo(11, -15); ctx.stroke();
    },
    apply(p) { p.flags.bounce += 2; p.stats.damage += 0.4; },
  },
  {
    id: 'commonCold', name: 'THE COMMON COLD', desc: '眼泪附带中毒, 持续掉血',
    icon(ctx) {
      oval(ctx, 0, 0, 11, 11); inkFill(ctx, '#7fae5c', 2.6);
      ctx.fillStyle = '#a7d47e';
      oval(ctx, -3, -3, 4, 4); ctx.fill();
      ctx.fillStyle = '#4d7a34';
      for (const o of [[4, 3], [-1, 6], [6, -3]]) { oval(ctx, o[0], o[1], 2.4, 2); ctx.fill(); }
      ctx.fillStyle = 'rgba(180,230,150,0.8)';
      oval(ctx, 6, 10, 2.6, 4); ctx.fill();
    },
    apply(p) { p.flags.poison += 2.2; },
  },
  {
    id: 'momsContact', name: "MOM'S CONTACT", desc: '眼泪让敌人变慢',
    icon(ctx) {
      ctx.beginPath(); ctx.ellipse(0, 0, 12, 8, 0, 0, TAU); inkFill(ctx, 'rgba(190,225,245,0.85)', 2.4);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(-3, -1, 6, -0.9, 0.6); ctx.stroke();
      ctx.fillStyle = 'rgba(120,190,220,0.6)';
      oval(ctx, 2, 2, 4, 3); ctx.fill();
    },
    apply(p) { p.flags.slow += 1; p.stats.damage += 0.4; },
  },
  {
    id: 'mutantSpider', name: 'MUTANT SPIDER', desc: '四重射击, 伤害 x0.6',
    icon(ctx) {
      oval(ctx, 0, 1, 8, 7); inkFill(ctx, '#3a3a44', 2.6);
      ctx.strokeStyle = '#2a2a32'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      for (const sd of [-1, 1]) {
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(sd * 5, -1 + i * 3);
          ctx.quadraticCurveTo(sd * 12, -4 + i * 4, sd * 14, 4 + i * 3);
          ctx.stroke();
        }
      }
      ctx.fillStyle = '#c8302e';
      oval(ctx, -2.6, -1, 1.8, 1.8); ctx.fill();
      oval(ctx, 2.6, -1, 1.8, 1.8); ctx.fill();
    },
    apply(p) { p.flags.extraTears += 3; p.stats.damage *= 0.6; },
  },
  {
    id: 'sacredHeart', name: 'SACRED HEART', desc: '追踪眼泪, 伤害 x2.3, 射速下降',
    icon(ctx) {
      ctx.save(); ctx.scale(1.25, 1.25);
      heartPath(ctx, 0, 1, 8);
      inkFill(ctx, '#c8323f', 2.4);
      ctx.restore();
      ctx.strokeStyle = '#ffe98a'; ctx.lineWidth = 2.6;
      ctx.shadowColor = '#ffe98a'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.ellipse(0, -9, 8, 3.5, 0, 0, TAU); ctx.stroke();
      ctx.shadowBlur = 0;
    },
    apply(p) {
      p.flags.homing = true; p.flags.halo = true;
      p.stats.damage *= 2.3;
      p.stats.fireRate = Math.max(1.0, p.stats.fireRate * 0.7);
      p.addMaxHp(2);
    },
  },
  {
    id: 'parasite', name: 'THE PARASITE', desc: '眼泪落地后分裂成两颗',
    icon(ctx) {
      oval(ctx, 0, -2, 10, 9); inkFill(ctx, '#c8b47a', 2.6);
      ctx.fillStyle = '#8a7440';
      for (const o of [[-4, -4], [3, -5], [0, 1]]) { oval(ctx, o[0], o[1], 2.4, 2); ctx.fill(); }
      ctx.strokeStyle = '#8a7440'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      for (const sd of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(sd * 5, 5); ctx.quadraticCurveTo(sd * 11, 9, sd * 7, 14); ctx.stroke();
      }
    },
    apply(p) { p.flags.split = true; p.stats.damage *= 0.85; },
  },
  {
    id: 'toughLove', name: 'TOUGH LOVE', desc: '25% 概率射出牙齿, 三倍伤害',
    icon(ctx) {
      ctx.fillStyle = '#f2ebd8';
      ctx.beginPath();
      ctx.moveTo(-8, -8); ctx.lineTo(8, -8); ctx.lineTo(9, 2);
      ctx.quadraticCurveTo(0, 16, -9, 2); ctx.closePath();
      inkFill(ctx, '#f2ebd8', 2.6);
      ctx.strokeStyle = 'rgba(120,100,70,0.5)'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, 8); ctx.stroke();
      ctx.fillStyle = BLOOD;
      oval(ctx, 4, -9, 3, 2); ctx.fill();
    },
    apply(p) { p.flags.crit += 0.25; },
  },
  {
    id: 'lumpOfCoal', name: 'A LUMP OF COAL', desc: '眼泪飞得越远伤害越高',
    icon(ctx) {
      blob(ctx, 0, 0, 11, 1.4, 8, 0.3); inkFill(ctx, '#2a2a30', 2.6);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(-1, -7); ctx.lineTo(1, -2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,140,60,0.5)';
      oval(ctx, 3, 4, 3, 2.4); ctx.fill();
    },
    apply(p) { p.flags.coal += 1; p.stats.damage += 0.3; },
  },
  {
    id: 'ouija', name: 'OUIJA BOARD', desc: '幽灵眼泪, 穿透石头',
    icon(ctx) {
      ctx.beginPath(); ctx.rect(-12, -8, 24, 16); inkFill(ctx, '#b79b6a', 2.6);
      ctx.fillStyle = '#3a2c1a';
      ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
      ctx.fillText('A B C', 0, -1);
      ctx.fillText('1 2 3', 0, 7);
      ctx.fillStyle = 'rgba(240,245,255,0.75)';
      ctx.beginPath(); ctx.moveTo(4, -6); ctx.lineTo(10, -1); ctx.lineTo(4, 4); ctx.closePath(); ctx.fill();
    },
    apply(p) { p.flags.spectral = true; p.stats.range += 60; },
  },
  {
    id: 'soyMilk', name: 'SOY MILK', desc: '射速暴涨, 单发伤害暴跌',
    icon(ctx) {
      ctx.beginPath();
      ctx.moveTo(-8, 12); ctx.lineTo(8, 12); ctx.lineTo(8, -6); ctx.lineTo(0, -13); ctx.lineTo(-8, -6); ctx.closePath();
      inkFill(ctx, '#eef0f2', 2.6);
      ctx.fillStyle = '#7fa8c9';
      ctx.fillRect(-8, 2, 16, 10);
      ctx.fillStyle = '#3a4c58';
      ctx.font = 'bold 7px monospace'; ctx.textAlign = 'center';
      ctx.fillText('SOY', 0, 10);
    },
    apply(p) {
      p.stats.fireRate = p.stats.fireRate * 3.4 + 2;
      p.stats.damage = Math.max(1, p.stats.damage * 0.28);
    },
  },
  {
    id: 'godhead', name: 'GODHEAD', desc: '眼泪带伤害光环',
    icon(ctx) {
      const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 13);
      g.addColorStop(0, 'rgba(255,250,220,0.95)');
      g.addColorStop(1, 'rgba(255,240,170,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, 13, 0, TAU); ctx.fill();
      oval(ctx, 0, 0, 5.5, 5.5); inkFill(ctx, '#fff8dc', 2.2);
      ctx.strokeStyle = '#ffe98a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, -8, 7, 3, 0, 0, TAU); ctx.stroke();
    },
    apply(p) { p.flags.godhead = true; p.flags.halo = true; p.stats.damage += 0.6; },
  },

  /* ================= familiars & survivability ================= */
  {
    id: 'brotherBobby', name: 'BROTHER BOBBY', desc: '蓝色小跟班替你开火',
    icon(ctx) {
      oval(ctx, 0, -1, 10, 10); inkFill(ctx, '#8fb8d8', 2.6);
      for (const sd of [-1, 1]) { oval(ctx, sd * 3.4, -2, 2.4, 3); inkFill(ctx, OUTLINE, 0); }
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-3, 4); ctx.quadraticCurveTo(0, 6.5, 3, 4); ctx.stroke();
      oval(ctx, 0, 10, 5, 4); inkFill(ctx, '#8fb8d8', 2.2);
    },
    apply(p) { p.flags.familiars += 1; },
  },
  {
    id: 'sisterMaggy', name: 'SISTER MAGGY', desc: '第二个跟班, 伤害 +0.5',
    icon(ctx) {
      oval(ctx, 0, -1, 10, 10); inkFill(ctx, '#e0a2b8', 2.6);
      ctx.fillStyle = '#b8455f';
      ctx.beginPath(); ctx.arc(0, -2, 10, Math.PI, TAU); ctx.fill();
      for (const sd of [-1, 1]) { oval(ctx, sd * 3.4, 0, 2.4, 3); inkFill(ctx, OUTLINE, 0); }
      oval(ctx, 0, 10, 5, 4); inkFill(ctx, '#e0a2b8', 2.2);
    },
    apply(p) { p.flags.familiars += 1; p.stats.damage += 0.5; },
  },
  {
    id: 'oneUp', name: '1UP!', desc: '死亡时原地复活一次',
    icon(ctx) {
      oval(ctx, 0, 0, 12, 11); inkFill(ctx, '#5ec46a', 2.6);
      ctx.fillStyle = '#f2ffe8';
      ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
      ctx.fillText('1UP', 0, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      oval(ctx, -4, -5, 3.4, 2.4); ctx.fill();
    },
    apply(p) { p.flags.revives += 1; },
  },
  {
    id: 'deadCat', name: 'DEAD CAT', desc: '复活 +2, 但生命上限压到 1 心',
    icon(ctx) {
      oval(ctx, 0, 1, 10, 9); inkFill(ctx, '#5b5560', 2.6);
      for (const sd of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(sd * 4, -6); ctx.lineTo(sd * 9, -13); ctx.lineTo(sd * 10, -4); ctx.closePath();
        inkFill(ctx, '#5b5560', 2.2);
      }
      ctx.strokeStyle = '#e8e0d0'; ctx.lineWidth = 2;
      for (const sd of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(sd * 3, 1); ctx.lineTo(sd * 6, -2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(sd * 3, 1); ctx.lineTo(sd * 6, 3); ctx.stroke();
      }
      ctx.fillStyle = '#c8302e';
      oval(ctx, -3, -1, 1.8, 1.8); ctx.fill();
      oval(ctx, 3, -1, 1.8, 1.8); ctx.fill();
    },
    apply(p) {
      p.flags.revives += 2;
      p.stats.maxHp = 2;
      p.hp = 2;
    },
  },
  {
    id: 'holyMantle', name: 'HOLY MANTLE', desc: '每个房间免疫第一次伤害',
    icon(ctx) {
      ctx.beginPath();
      ctx.moveTo(0, -13); ctx.lineTo(11, -8); ctx.lineTo(11, 2);
      ctx.quadraticCurveTo(0, 14, -11, 2); ctx.lineTo(-11, -8); ctx.closePath();
      inkFill(ctx, 'rgba(210,235,255,0.85)', 2.6);
      ctx.strokeStyle = '#ffe98a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, 6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-5, -2); ctx.lineTo(5, -2); ctx.stroke();
    },
    apply(p) { p.flags.shield = true; p.shieldUp = true; },
  },
  {
    id: 'wafer', name: 'THE WAFER', desc: '所有伤害 -1 (至少 1)',
    icon(ctx) {
      oval(ctx, 0, 0, 12, 12); inkFill(ctx, '#efe6cf', 2.6);
      ctx.strokeStyle = '#a89870'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(0, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-6, -1); ctx.lineTo(6, -1); ctx.stroke();
      ctx.strokeStyle = 'rgba(140,120,80,0.4)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.stroke();
    },
    apply(p) { p.flags.dmgReduce += 1; },
  },
  {
    id: 'magneto', name: 'MAGNETO', desc: '拾取物自动飞向你',
    icon(ctx) {
      ctx.strokeStyle = '#c33'; ctx.lineWidth = 6; ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.arc(0, 2, 8, Math.PI, TAU); ctx.stroke();
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(0, 2, 8, Math.PI, TAU); ctx.stroke();
      ctx.fillStyle = '#dfe4ea';
      ctx.fillRect(-11, 2, 6, 7); ctx.fillRect(5, 2, 6, 7);
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = 1.6;
      ctx.strokeRect(-11, 2, 6, 7); ctx.strokeRect(5, 2, 6, 7);
    },
    apply(p) { p.flags.magnet += 150; },
  },
  {
    id: 'transcendence', name: 'TRANSCENDENCE', desc: '获得飞行, 身体悬浮',
    icon(ctx) {
      for (const sd of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(sd * 11, -11, sd * 15, 1);
        ctx.quadraticCurveTo(sd * 8, 0, sd * 10, 9);
        ctx.quadraticCurveTo(sd * 4, 3, 0, 0); ctx.closePath();
        inkFill(ctx, '#f2ecdc', 2.2);
      }
      oval(ctx, 0, -2, 5, 6); inkFill(ctx, FLESH, 2.2);
      ctx.strokeStyle = '#ffe98a'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, -10, 6, 2.6, 0, 0, TAU); ctx.stroke();
    },
    apply(p) { p.flags.flight = true; p.flags.float = true; p.stats.speed += 10; },
  },
  {
    id: 'theMark', name: 'THE MARK', desc: '伤害 +1.5, 移速 +18, 身上浮现印记',
    icon(ctx) {
      ctx.strokeStyle = '#c8302e'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-8, -10); ctx.lineTo(6, 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(6, -10); ctx.lineTo(-8, 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-1, 4); ctx.lineTo(-1, 13); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,120,110,0.5)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(-1, -2, 12, 0, TAU); ctx.stroke();
    },
    apply(p) { p.stats.damage += 1.5; p.stats.speed += 18; p.flags.mark = true; },
  },

  /* ================= straight stat sticks ================= */
  {
    id: 'maxHead', name: "MAX'S HEAD", desc: '伤害 x1.5',
    icon(ctx) {
      oval(ctx, 0, 0, 11, 11); inkFill(ctx, '#e5d3b4', 2.6);
      ctx.fillStyle = '#8a6f52';
      ctx.beginPath(); ctx.arc(0, -2, 11, Math.PI * 1.1, TAU * 0.98); ctx.fill();
      for (const sd of [-1, 1]) { oval(ctx, sd * 4, 1, 2.6, 3.2); inkFill(ctx, OUTLINE, 0); }
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-4, 7); ctx.lineTo(4, 7); ctx.stroke();
    },
    apply(p) { p.stats.damage *= 1.5; },
  },
  {
    id: 'steven', name: 'STEVEN', desc: '伤害 +1',
    icon(ctx) {
      oval(ctx, 0, 1, 11, 10); inkFill(ctx, '#cbb086', 2.6);
      ctx.fillStyle = '#7d5f3c';
      oval(ctx, -4, -4, 3, 2.4); ctx.fill();
      oval(ctx, 4, -5, 2.4, 2); ctx.fill();
      for (const sd of [-1, 1]) { oval(ctx, sd * 4, 1, 2.8, 3.4); inkFill(ctx, '#f0e8d8', 2); }
      for (const sd of [-1, 1]) { oval(ctx, sd * 4.4, 1, 1.4, 1.8); inkFill(ctx, OUTLINE, 0); }
      ctx.fillStyle = '#2c0808';
      oval(ctx, 0, 7, 3.4, 2.2); ctx.fill();
    },
    apply(p) { p.stats.damage += 1; },
  },
  {
    id: 'luckyFoot', name: 'LUCKY FOOT', desc: '幸运 +1, 掉落率提升',
    icon(ctx) {
      ctx.fillStyle = '#c8b48a';
      ctx.beginPath();
      ctx.moveTo(-5, 12); ctx.quadraticCurveTo(-9, 0, -5, -8);
      ctx.quadraticCurveTo(0, -14, 5, -8);
      ctx.quadraticCurveTo(9, 0, 5, 12); ctx.closePath();
      inkFill(ctx, '#c8b48a', 2.6);
      ctx.fillStyle = '#8f7a52';
      for (const o of [[-3, -8], [0, -10], [3, -8]]) { oval(ctx, o[0], o[1], 1.8, 2.2); ctx.fill(); }
      ctx.strokeStyle = '#6d5a38'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(0, 4, 4, 0, Math.PI); ctx.stroke();
    },
    apply(p) { p.stats.luck += 1; },
  },
  {
    id: 'theBelt', name: 'THE BELT', desc: '移速 +22',
    icon(ctx) {
      ctx.fillStyle = '#6a4a2a';
      ctx.fillRect(-13, -4, 26, 9);
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2.2;
      ctx.strokeRect(-13, -4, 26, 9);
      ctx.fillStyle = '#d8c168';
      ctx.fillRect(-4, -7, 9, 15);
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = 2;
      ctx.strokeRect(-4, -7, 9, 15);
      ctx.fillStyle = '#6a4a2a';
      ctx.fillRect(-1, -3, 3, 7);
    },
    apply(p) { p.stats.speed += 22; },
  },
  {
    id: 'taurus', name: 'TAURUS', desc: '移速 -20, 伤害 +2.5',
    icon(ctx) {
      oval(ctx, 0, 3, 9, 8); inkFill(ctx, '#8f6a4a', 2.6);
      for (const sd of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(sd * 6, -3);
        ctx.quadraticCurveTo(sd * 15, -8, sd * 12, -14);
        ctx.quadraticCurveTo(sd * 13, -6, sd * 4, -1); ctx.closePath();
        inkFill(ctx, '#e0d6bc', 2.2);
      }
      ctx.fillStyle = OUTLINE;
      oval(ctx, -3, 1, 1.8, 2.2); ctx.fill();
      oval(ctx, 3, 1, 1.8, 2.2); ctx.fill();
      ctx.fillStyle = '#5e4028';
      oval(ctx, 0, 8, 4, 3); ctx.fill();
    },
    apply(p) { p.stats.speed -= 20; p.stats.damage += 2.5; },
  },
  {
    id: 'oddMushroom', name: 'ODD MUSHROOM', desc: '射速 +1.6, 移速 +14, 伤害 -0.8',
    icon(ctx) {
      ctx.beginPath(); ctx.moveTo(-5, 12); ctx.quadraticCurveTo(-3, 3, -6, 2);
      ctx.lineTo(6, 2); ctx.quadraticCurveTo(3, 3, 5, 12); ctx.closePath();
      inkFill(ctx, '#efe2c8', 2.4);
      ctx.beginPath(); ctx.moveTo(-12, 3); ctx.quadraticCurveTo(0, -15, 12, 3); ctx.closePath();
      inkFill(ctx, '#7c9fc0', 2.6);
      ctx.fillStyle = '#e8f2ff';
      for (const o of [[-5, -2, 2.6], [3, -5, 2.2], [7, 0, 2]]) { oval(ctx, o[0], o[1], o[2], o[2] * 0.85); ctx.fill(); }
    },
    apply(p) { p.stats.fireRate += 1.6; p.stats.speed += 14; p.stats.damage -= 0.8; },
  },
  {
    id: 'proptosis', name: 'PROPTOSIS', desc: '眼泪起手三倍伤害, 越飞越弱',
    icon(ctx) {
      oval(ctx, 0, 0, 13, 12); inkFill(ctx, '#f3e9d8', 2.8);
      oval(ctx, 0, 0, 8, 8); inkFill(ctx, '#b8453c', 2.4);
      oval(ctx, 0, 0, 3.6, 3.6); inkFill(ctx, OUTLINE, 0);
      ctx.strokeStyle = 'rgba(160,20,30,0.55)'; ctx.lineWidth = 1.8;
      for (const sd of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(sd * 12, -5); ctx.quadraticCurveTo(sd * 6, 0, sd * 11, 6); ctx.stroke();
      }
    },
    apply(p) { p.flags.proptosis = true; p.stats.damage += 0.5; },
  },
  {
    id: 'pageOfDeath', name: 'THE NECRONOMICON', desc: '伤害 +1.2, 射程 +90',
    icon(ctx) {
      ctx.beginPath(); ctx.rect(-10, -12, 20, 24); inkFill(ctx, '#4a3550', 2.8);
      ctx.fillStyle = '#e6dcc4';
      ctx.fillRect(8, -10, 3, 20);
      ctx.fillStyle = '#d8c98a';
      oval(ctx, -1, 0, 5.5, 6); ctx.fill();
      ctx.fillStyle = OUTLINE;
      oval(ctx, -1, 0, 2.4, 3); ctx.fill();
      ctx.strokeStyle = '#8a6ba0'; ctx.lineWidth = 1.6;
      ctx.strokeRect(-7, -9, 12, 18);
    },
    apply(p) { p.stats.damage += 1.2; p.stats.range += 90; },
  },
  {
    id: 'rosary', name: 'ROSARY', desc: '射速 +0.5, 生命上限 +1 心',
    icon(ctx) {
      ctx.strokeStyle = '#c8b48a'; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(0, -3, 9, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#9a7f52';
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU;
        oval(ctx, Math.cos(a) * 9, -3 + Math.sin(a) * 9, 2, 2); ctx.fill();
      }
      ctx.fillStyle = '#e8dfc8';
      ctx.fillRect(-1.6, 6, 3.2, 9); ctx.fillRect(-5, 8.5, 10, 3);
      ctx.strokeStyle = OUTLINE; ctx.lineWidth = 1.4;
      ctx.strokeRect(-1.6, 6, 3.2, 9); ctx.strokeRect(-5, 8.5, 10, 3);
    },
    apply(p) { p.stats.fireRate += 0.5; p.addMaxHp(2); p.heal(2); },
  },
  {
    id: 'bloodClot', name: 'BLOOD CLOT', desc: '伤害 +1, 射程 +50',
    icon(ctx) {
      blob(ctx, 0, 0, 11, 2.6, 10, 0.28); inkFill(ctx, '#8f1b22', 2.8);
      ctx.fillStyle = '#c8323a';
      blob(ctx, -2, -2, 5, 1.1, 8, 0.3); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      oval(ctx, -4, -5, 2.4, 1.8); ctx.fill();
    },
    apply(p) { p.stats.damage += 1; p.stats.range += 50; },
  },
  {
    id: 'nineVolt', name: 'NINE VOLT', desc: '射速 +1.1',
    icon(ctx) {
      ctx.beginPath(); ctx.rect(-8, -11, 16, 22); inkFill(ctx, '#3a3a44', 2.6);
      ctx.fillStyle = '#c8a83c';
      ctx.fillRect(-8, -11, 16, 6);
      ctx.fillStyle = '#dfe4ea';
      ctx.fillRect(-5, -15, 4, 4); ctx.fillRect(1, -15, 4, 4);
      ctx.fillStyle = '#e8e0c8';
      ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
      ctx.fillText('9V', 0, 6);
    },
    apply(p) { p.stats.fireRate += 1.1; },
  },
  {
    id: 'ceremonialRobes', name: 'CEREMONIAL ROBES', desc: '伤害 +1.8, 暗黑光环',
    icon(ctx) {
      ctx.beginPath();
      ctx.moveTo(0, -13); ctx.lineTo(10, -6); ctx.lineTo(8, 13); ctx.lineTo(-8, 13);
      ctx.lineTo(-10, -6); ctx.closePath();
      inkFill(ctx, '#33223f', 2.8);
      ctx.fillStyle = '#1e1428';
      ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(4, -4); ctx.lineTo(0, 13); ctx.lineTo(-4, -4); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#d84a5a'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.arc(0, -4, 4, 0, TAU); ctx.stroke();
    },
    apply(p) { p.stats.damage += 1.8; p.flags.aura = true; },
  },
];

const ITEM_BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]));

/** Per-run pool that avoids handing out duplicates until it is exhausted. */
class ItemPool {
  constructor(seed) {
    this.rng = makeRng(seed ^ 0x5bf03635);
    this.remaining = this.rng.shuffle(ITEMS.map(i => i.id));
  }
  next() {
    if (!this.remaining.length) this.remaining = this.rng.shuffle(ITEMS.map(i => i.id));
    return ITEM_BY_ID[this.remaining.pop()];
  }
}
