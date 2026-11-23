// Pocket Grove world: one fixed scene drawn two ways, day one and day seven.
// Same camera, same path, same gardener, same tree trunks. Only the growth
// differs. Everything is a function of the integer frame counter, so renders
// are deterministic. Used by the frame renderer; the playable HTML build in
// game/ mirrors this scene.

import { Canvas, drawText, drawTextShadow, rng } from './gfx.js';

const SKY1 = [168, 188, 200], SKY7A = [86, 164, 232], SKY7B = [168, 216, 244];
const HILL1 = [140, 160, 130], HILL7 = [92, 176, 92], HILL7B = [70, 150, 78];
const GRASS1 = [128, 152, 104], GRASS7 = [84, 168, 84];
const SOIL1 = [150, 116, 84], SOIL7 = [122, 86, 58];
const SOILD = [104, 74, 46];
const STONE = [168, 168, 172], STONED = [140, 140, 146];
const TRUNK = [96, 68, 44];
const SKIN = [240, 196, 150], SHIRT = [38, 128, 140], PANTS = [90, 80, 70], HAT = [232, 196, 92];
const WHITE = [245, 245, 245], INK = [24, 24, 32], GOLD = [255, 196, 40];

const CELLS = [];
for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) CELLS.push({ x: 116 + c * 92, y: 500 + r * 110, i: r * 3 + c });

function lerp(a, b, t) { return a + (b - a) * t; }
function mix(c1, c2, t) { return [0, 1, 2].map(i => Math.round(lerp(c1[i], c2[i], t))); }

function sky(cv, mode, f) {
  if (mode === 1) {
    cv.fill(SKY1);
  } else {
    for (let y = 0; y < 340; y++) cv.rect(0, y, 540, 1, mix(SKY7A, SKY7B, y / 340));
  }
  // sun
  if (mode === 7) {
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + f * 0.004;
      cv.line(440 + Math.cos(a) * 44, 92 + Math.sin(a) * 44, 440 + Math.cos(a) * 58, 92 + Math.sin(a) * 58, 5, [255, 224, 120]);
    }
    cv.circle(440, 92, 34, [255, 214, 90]);
    cv.circle(440, 92, 27, [255, 226, 130]);
  } else {
    cv.circle(440, 92, 26, [226, 230, 205]);
  }
  // clouds (drift slowly with f)
  const cloud = (bx, by, s, col) => {
    const x = ((bx + f * 0.15) % 640) - 80;
    cv.ellipse(x, by, 34 * s, 13 * s, col);
    cv.ellipse(x + 24 * s, by + 3 * s, 24 * s, 10 * s, col);
    cv.ellipse(x - 26 * s, by + 4 * s, 20 * s, 9 * s, col);
  };
  if (mode === 1) cloud(120, 120, 0.9, [196, 206, 214]);
  else { cloud(80, 110, 1.1, WHITE); cloud(330, 258, 0.8, [235, 245, 252]); }
  // birds on day 7
  if (mode === 7) {
    for (let i = 0; i < 3; i++) {
      const bx = ((i * 190 + f * 0.7) % 620) - 40, by = 150 + i * 36 + Math.sin(f * 0.1 + i) * 4;
      cv.line(bx - 7, by, bx, by - 4, 2, INK); cv.line(bx, by - 4, bx + 7, by, 2, INK);
    }
  }
  // hills + ground
  cv.rect(0, 300, 540, 70, mode === 1 ? HILL1 : HILL7B);
  cv.ellipse(120, 330, 220, 42, mode === 1 ? HILL1 : HILL7);
  cv.ellipse(430, 336, 200, 38, mode === 1 ? HILL1 : HILL7);
  cv.rect(0, 360, 540, 600, mode === 1 ? GRASS1 : GRASS7);
  if (mode === 7) for (let i = 0; i < 6; i++) cv.rect(0, 400 + i * 96, 540, 30, [76, 158, 78]);
  else { const r = rng(7); for (let i = 0; i < 40; i++) cv.rect(r() * 520, 380 + r() * 540, 10, 5, [118, 142, 96]); }
}

function tree(cv, mode, x, y, s) {
  // trunk identical in both modes; canopy only on day 7
  cv.rect(x - 6 * s, y, 12 * s, 74 * s, TRUNK);
  cv.line(x, y + 8 * s, x - 22 * s, y - 18 * s, 6 * s, TRUNK);
  cv.line(x, y + 4 * s, x + 20 * s, y - 22 * s, 6 * s, TRUNK);
  if (mode === 7) {
    cv.circle(x, y - 44 * s, 40 * s, [52, 142, 60]);
    cv.circle(x - 30 * s, y - 26 * s, 28 * s, [62, 156, 68]);
    cv.circle(x + 30 * s, y - 28 * s, 29 * s, [58, 150, 64]);
    cv.circle(x + 4 * s, y - 62 * s, 26 * s, [66, 162, 70]);
    const r = rng(x);
    for (let i = 0; i < 7; i++) cv.circle(x - 34 * s + r() * 68 * s, y - 66 * s + r() * 56 * s, 5 * s, [232, 64, 54]);
  }
}

function plant(cv, mode, cell, f, wiggle) {
  const { x, y, i } = cell;
  if (mode === 1) {
    cv.ellipse(x, y + 16, 30, 9, SOILD); // bare mound
    if (i === 5) { // the one sprout: middle-right cell, nearest the path
      const w = wiggle ? Math.round(Math.sin(f * 0.6) * 2) : 0;
      cv.rect(x - 2, y - 8, 4, 22, [74, 140, 66]);
      cv.ellipse(x - 8 + w, y - 10, 9, 5, [86, 160, 74]);
      cv.ellipse(x + 8 + w, y - 13, 9, 5, [96, 172, 80]);
    }
    return;
  }
  // day 7: every cell grown, type by index
  const kind = i % 3;
  if (kind === 0) { // tomato bush
    cv.circle(x, y + 2, 26, [56, 148, 62]); cv.circle(x - 18, y + 10, 18, [64, 158, 68]); cv.circle(x + 18, y + 10, 18, [60, 152, 66]);
    const r = rng(100 + i);
    for (let k = 0; k < 5; k++) cv.circle(x - 18 + r() * 36, y - 8 + r() * 24, 6, [232, 64, 54]);
  } else if (kind === 1) { // sunflower
    cv.rect(x - 2, y - 34, 4, 52, [64, 140, 60]);
    cv.ellipse(x - 10, y - 6, 10, 5, [74, 150, 66]); cv.ellipse(x + 10, y - 16, 10, 5, [74, 150, 66]);
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; cv.circle(x + Math.cos(a) * 11, y - 40 + Math.sin(a) * 11, 5, [255, 200, 40]); }
    cv.circle(x, y - 40, 9, [120, 84, 44]);
  } else { // pumpkin vine
    cv.ellipse(x, y + 10, 30, 12, [70, 150, 70]);
    cv.ellipse(x - 8, y + 12, 17, 12, [240, 132, 32]); cv.ellipse(x + 14, y + 14, 12, 9, [244, 148, 48]);
    cv.rect(x - 10, y - 2, 4, 6, [90, 120, 60]);
  }
}

function pond(cv, mode, f) {
  if (mode === 1) { cv.ellipse(452, 806, 58, 34, [140, 142, 130]); return; } // dry dip on day 1
  cv.ellipse(452, 806, 66, 40, [70, 150, 210]);
  cv.ellipse(452, 800, 56, 32, [96, 176, 228]);
  const rr = (f % 90) / 90;
  cv.ellipse(436, 800, 8 + rr * 26, 5 + rr * 14, [120, 196, 240]);
  cv.ellipse(436, 800, 7 + rr * 25, 4 + rr * 13, [96, 176, 228]);
  cv.circle(478, 792, 7, [90, 170, 80]); // lily pad
  cv.circle(478, 788, 4, [246, 150, 190]); // lily flower
}

function gardener(cv, gx, gy, f, walking, act) {
  const bob = walking ? Math.abs(Math.sin(f * 0.35)) * 3 : Math.sin(f * 0.06) * 1.2;
  const y = gy - bob;
  const legSwing = walking ? Math.round(Math.sin(f * 0.35) * 5) : 0;
  // legs + boots
  cv.rect(gx - 9, y + 26, 7, 14 + (legSwing > 0 ? legSwing : 0), PANTS);
  cv.rect(gx + 3, y + 26, 7, 14 + (legSwing < 0 ? -legSwing : 0), PANTS);
  cv.rect(gx - 11, y + 40 + (legSwing > 0 ? legSwing : 0), 11, 5, [60, 48, 40]);
  cv.rect(gx + 2, y + 40 + (legSwing < 0 ? -legSwing : 0), 11, 5, [60, 48, 40]);
  // torso
  cv.rect(gx - 12, y, 24, 28, SHIRT);
  // head + hat
  cv.circle(gx, y - 12, 11, SKIN);
  cv.rect(gx - 16, y - 19, 32, 5, HAT);
  cv.rect(gx - 9, y - 26, 18, 8, HAT);
  // arms + tool
  if (act === 'water') {
    cv.line(gx - 10, y + 6, gx - 24, y + 16, 5, SKIN);
    cv.rect(gx - 36, y + 12, 14, 11, [110, 130, 150]); // watering can
    cv.line(gx - 36, y + 15, gx - 46, y + 8, 4, [110, 130, 150]);
    for (let d = 0; d < 7; d++) {
      const t = ((f * 3 + d * 9) % 42) / 42;
      cv.circle(gx - 48 - t * 16, y + 10 + t * t * 44, 2.5, [110, 180, 240]);
    }
  } else if (act === 'harvest') {
    cv.line(gx - 10, y + 6, gx - 22, y + 18, 5, SKIN);
    cv.rect(gx - 34, y + 16, 22, 12, [170, 120, 66]); // basket
    cv.rect(gx - 34, y + 16, 22, 4, [150, 104, 56]);
    cv.circle(gx - 28, y + 13, 5, [232, 64, 54]); cv.circle(gx - 19, y + 12, 5, [240, 132, 32]);
    if (f % 20 < 10) { // sparkle
      cv.rect(gx - 30, y - 8, 3, 12, GOLD); cv.rect(gx - 34, y - 4, 11, 3, GOLD);
    }
  } else {
    cv.line(gx - 10, y + 6, gx - 16, y + 20, 5, SKIN);
    cv.line(gx + 10, y + 6, gx + 16, y + 20, 5, SKIN);
  }
}

function chip(cv, x, y, text, align = 'left') {
  const w = text.length * 12 + 14;
  const x0 = align === 'right' ? x - w : x;
  cv.rect(x0, y, w, 26, [20, 22, 30]);
  cv.rect(x0, y, w, 2, GOLD);
  drawText(cv, text, x0 + 7, y + 6, 2, WHITE);
}

export function drawScene(mode, f, g) {
  const cv = new Canvas();
  sky(cv, mode, f);
  tree(cv, mode, 452, 396, 1.0);
  tree(cv, mode, 92, 408, 0.72);
  // plot
  cv.rect(48, 428, 320, 384, mode === 1 ? SOIL1 : SOIL7);
  cv.rect(48, 428, 320, 6, SOILD); cv.rect(48, 806, 320, 6, SOILD);
  if (mode === 1) { // faint empty grid
    for (let i = 1; i < 3; i++) { cv.rect(48 + i * 107, 434, 2, 372, [138, 106, 76]); cv.rect(54, 428 + i * 128, 308, 2, [138, 106, 76]); }
  }
  const wiggle = g.act === 'water';
  for (const cell of CELLS) plant(cv, mode, cell, f, wiggle && cell.i === 5);
  if (mode === 1) { // seed bag
    cv.ellipse(330, 770, 17, 13, [146, 110, 66]); cv.rect(322, 752, 16, 8, [130, 96, 56]);
  } else { // flower border along the plot's bottom edge
    const cols = [[232, 64, 54], [246, 150, 190], [255, 200, 40], [150, 110, 220]];
    for (let i = 0; i < 12; i++) { const fx = 62 + i * 26; cv.rect(fx, 824, 3, 12, [64, 140, 60]); cv.circle(fx + 1, 822, 5, cols[i % 4]); }
  }
  // path (identical in both)
  for (let y = 424; y <= 864; y += 44) { cv.ellipse(410, y, 21, 13, STONE); cv.ellipse(410, y - 2, 17, 10, [178, 178, 182]); }
  pond(cv, mode, f);
  // butterflies on day 7
  if (mode === 7) {
    for (let i = 0; i < 2; i++) {
      const bx = 270 + Math.sin(f * 0.021 + i * 2.4) * 120, by = 470 + Math.cos(f * 0.017 + i * 1.7) * 90;
      const flap = Math.sin(f * 0.7 + i) > 0 ? 4 : 1;
      cv.ellipse(bx - 4, by, 4, flap + 2, [246, 150, 190]); cv.ellipse(bx + 4, by, 4, flap + 2, [246, 150, 190]);
      cv.rect(bx - 1, by - 3, 2, 7, INK);
    }
  }
  gardener(cv, g.x, g.y, f, g.walking, g.act);
  // popups
  if (g.popup) {
    const age = f - g.popup.from;
    if (age >= 0 && age < 26) drawText(cv, g.popup.text, g.popup.x, g.popup.y - age * 1.3, 3, g.popup.col, 'center');
  }
  // HUD chips
  if (mode === 1) { chip(cv, 14, 14, 'DAY 1 - V0.1'); chip(cv, 526, 14, 'SCORE 1', 'right'); }
  else { chip(cv, 14, 14, 'DAY 7 - V1.7'); chip(cv, 526, 14, 'SCORE 1250', 'right'); }
  return cv;
}
