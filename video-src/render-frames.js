// Renders the full 26 s timeline at 30 fps (780 frames) to frames/fNNNN.png,
// plus stills. Frame -> (mode, gardener, overlays) mapping lives here; the
// scene itself is world.js. Deterministic: everything derives from f.

import { mkdirSync } from 'node:fs';
import { drawScene } from './world.js';
import { drawText, drawTextShadow } from './gfx.js';

const FPS = 30, TOTAL = 780;
mkdirSync(new URL('../frames', import.meta.url), { recursive: true });
mkdirSync(new URL('../stills', import.meta.url), { recursive: true });

const lerp = (a, b, t) => a + (b - a) * t;
const seg = (f, a, b) => Math.min(1, Math.max(0, (f - a) / (b - a)));

function gardenerFor(f) {
  // returns {mode, x, y, walking, act, popup}
  if (f < 90) { // TITLE: day 1, gardener loops mid-path
    const t = (Math.sin((f / 90) * Math.PI * 2 - Math.PI / 2) + 1) / 2;
    return { mode: 1, x: 410, y: lerp(500, 620, t), walking: true, act: 'none' };
  }
  if (f < 240) { // DAY 1 gameplay
    if (f < 140) return { mode: 1, x: 410, y: lerp(430, 566, seg(f, 90, 140)), walking: true, act: 'none' };
    if (f < 150) return { mode: 1, x: lerp(410, 352, seg(f, 140, 150)), y: 566, walking: true, act: 'none' };
    if (f < 200) return { mode: 1, x: 352, y: 566, walking: false, act: 'water',
      popup: f >= 170 ? { text: '+1', x: 300, y: 556, from: 170, col: [170, 215, 255] } : null };
    if (f < 210) return { mode: 1, x: lerp(352, 410, seg(f, 200, 210)), y: 566, walking: true, act: 'none' };
    return { mode: 1, x: 410, y: lerp(566, 545, seg(f, 210, 240)), walking: true, act: 'none' };
  }
  if (f < 270) { // FLICK 1: identical moment, world flips at f=255
    return { mode: f < 255 ? 1 : 7, x: 410, y: 545, walking: false, act: 'none' };
  }
  if (f < 450) { // DAY 7 gameplay
    if (f < 320) return { mode: 7, x: 410, y: lerp(430, 566, seg(f, 270, 320)), walking: true, act: 'none' };
    if (f < 330) return { mode: 7, x: lerp(410, 352, seg(f, 320, 330)), y: 566, walking: true, act: 'none' };
    if (f < 390) {
      const popup = f >= 372 ? { text: '+25', x: 300, y: 556, from: 372, col: [255, 210, 80] }
        : f >= 345 ? { text: '+25', x: 300, y: 556, from: 345, col: [255, 210, 80] } : null;
      return { mode: 7, x: 352, y: 566, walking: false, act: 'harvest', popup };
    }
    if (f < 400) return { mode: 7, x: lerp(352, 410, seg(f, 390, 400)), y: 566, walking: true, act: 'none' };
    return { mode: 7, x: 410, y: lerp(566, 470, seg(f, 400, 450)), walking: true, act: 'none' };
  }
  if (f < 480) { // FLICK 2
    return { mode: f < 465 ? 7 : 1, x: 410, y: 470, walking: false, act: 'none' };
  }
  if (f < 705) { // DAY 7 second loop + closing
    if (f < 530) return { mode: 7, x: 410, y: lerp(430, 566, seg(f, 480, 530)), walking: true, act: 'none' };
    if (f < 540) return { mode: 7, x: lerp(410, 352, seg(f, 530, 540)), y: 566, walking: true, act: 'none' };
    if (f < 600) {
      const popup = f >= 580 ? { text: '+25', x: 300, y: 556, from: 580, col: [255, 210, 80] }
        : f >= 552 ? { text: '+25', x: 300, y: 556, from: 552, col: [255, 210, 80] } : null;
      return { mode: 7, x: 352, y: 566, walking: false, act: 'harvest', popup };
    }
    if (f < 610) return { mode: 7, x: lerp(352, 410, seg(f, 600, 610)), y: 566, walking: true, act: 'none' };
    if (f < 660) return { mode: 7, x: 410, y: lerp(566, 430, seg(f, 610, 660)), walking: true, act: 'none' };
    return { mode: 7, x: 410, y: 430, walking: false, act: 'none' };
  }
  // TAIL: day 7 alive, gardener idle at path top (end card goes over this)
  return { mode: 7, x: 410, y: 430, walking: false, act: 'none' };
}

function overlays(cv, f) {
  if (f < 90) {
    drawTextShadow(cv, 'DAY ONE', 270, 118, 8, [255, 255, 255], [40, 60, 80]);
    drawText(cv, 'MY AGENT BUILT A TINY GAME', 270, 196, 2, [240, 246, 250], 'center');
  }
  if (f >= 240 && f < 270) drawText(cv, 'SAME GARDENER. SAME PATH.', 270, 884, 2, [255, 255, 255], 'center');
  if (f >= 450 && f < 480) drawText(cv, 'ONE WEEK APART', 270, 878, 3, [255, 255, 255], 'center');
  if (f >= 615 && f < 705) {
    drawTextShadow(cv, 'START YOURS AT MAKE.FUN', 270, 132, 3, [255, 255, 255], [30, 70, 40]);
    drawText(cv, 'BUILT BY AN AI AGENT', 270, 172, 2, [240, 250, 240], 'center');
    drawText(cv, 'UPDATED EVERY DAY FOR A WEEK', 270, 198, 2, [240, 250, 240], 'center');
  }
}

const STILLS = { 185: 'day1-watering.png', 360: 'day7-harvest.png', 650: 'day7-closing.png' };
for (let f = 0; f < TOTAL; f++) {
  const g = gardenerFor(f);
  const cv = drawScene(g.mode, f, g);
  overlays(cv, f);
  const name = `f${String(f).padStart(4, '0')}.png`;
  cv.savePNG(new URL(`../frames/${name}`, import.meta.url).pathname);
  if (STILLS[f]) cv.savePNG(new URL(`../stills/${STILLS[f]}`, import.meta.url).pathname);
  if (f % 100 === 0) console.log('frame', f);
}
console.log('done', TOTAL, 'frames at', FPS, 'fps');
