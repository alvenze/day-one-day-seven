// Pocket Grove frame graphics: a tiny deterministic rasterizer + PNG encoder.
// Pure Node stdlib. Draws into an RGB pixel buffer at 540x960 (pixel-art scale,
// upscaled x2 to 1080x1920 by ffmpeg). No wall clock, no randomness outside the
// seeded PRNG below, so every frame is reproducible byte for byte.

import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

export const W = 540;
export const H = 960;

// --- CRC32 for PNG chunks -------------------------------------------------
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
export function encodePNG(pixels, w, h) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0; // filter: none
    pixels.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- Seeded PRNG (mulberry32) ----------------------------------------------
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Canvas -----------------------------------------------------------------
export class Canvas {
  constructor(w = W, h = H) {
    this.w = w; this.h = h;
    this.px = Buffer.alloc(w * h * 3);
  }
  set(x, y, [r, g, b]) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 3;
    this.px[i] = r; this.px[i + 1] = g; this.px[i + 2] = b;
  }
  fill([r, g, b]) {
    for (let i = 0; i < this.px.length; i += 3) {
      this.px[i] = r; this.px[i + 1] = g; this.px[i + 2] = b;
    }
  }
  rect(x, y, w, h, col) {
    const x0 = Math.max(0, x | 0), y0 = Math.max(0, y | 0);
    const x1 = Math.min(this.w, (x + w) | 0), y1 = Math.min(this.h, (y + h) | 0);
    for (let yy = y0; yy < y1; yy++)
      for (let xx = x0; xx < x1; xx++) this.set(xx, yy, col);
  }
  circle(cx, cy, r, col) {
    const r2 = r * r;
    for (let yy = Math.floor(cy - r); yy <= cy + r; yy++)
      for (let xx = Math.floor(cx - r); xx <= cx + r; xx++) {
        const dx = xx - cx, dy = yy - cy;
        if (dx * dx + dy * dy <= r2) this.set(xx, yy, col);
      }
  }
  ellipse(cx, cy, rx, ry, col) {
    for (let yy = Math.floor(cy - ry); yy <= cy + ry; yy++)
      for (let xx = Math.floor(cx - rx); xx <= cx + rx; xx++) {
        const dx = (xx - cx) / rx, dy = (yy - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(xx, yy, col);
      }
  }
  // thick line by stamping circles along it
  line(x0, y0, x1, y1, thick, col) {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      this.circle(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, thick / 2, col);
    }
  }
  savePNG(path) {
    writeFileSync(path, encodePNG(this.px, this.w, this.h));
  }
}

// --- 5x7 bitmap font ----------------------------------------------------------
// Each glyph is 7 strings of 5 bits. Only the characters the video needs.
const GLYPHS = {
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11], B: [0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e], D: [0x1e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1e],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f], F: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  G: [0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0f], H: [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e], J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11], L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11], N: [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e], P: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  Q: [0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d], R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  S: [0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e], T: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e], V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x1b, 0x11], X: [0x11, 0x0a, 0x04, 0x04, 0x04, 0x0a, 0x11],
  Y: [0x11, 0x0a, 0x04, 0x04, 0x04, 0x04, 0x04], Z: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f],
  '0': [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e], '1': [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  '2': [0x0e, 0x11, 0x01, 0x02, 0x04, 0x08, 0x1f], '3': [0x1f, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0e],
  '4': [0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02], '5': [0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e],
  '6': [0x06, 0x08, 0x10, 0x1e, 0x11, 0x11, 0x0e], '7': [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  '8': [0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e], '9': [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x02, 0x0c],
  '.': [0x00, 0x00, 0x00, 0x00, 0x00, 0x0c, 0x0c], ',': [0x00, 0x00, 0x00, 0x00, 0x0c, 0x04, 0x08],
  '+': [0x00, 0x04, 0x04, 0x1f, 0x04, 0x04, 0x00], '-': [0x00, 0x00, 0x00, 0x1f, 0x00, 0x00, 0x00],
  '!': [0x04, 0x04, 0x04, 0x04, 0x04, 0x00, 0x04], "'": [0x04, 0x04, 0x08, 0x00, 0x00, 0x00, 0x00],
  ':': [0x00, 0x0c, 0x0c, 0x00, 0x0c, 0x0c, 0x00], '/': [0x01, 0x01, 0x02, 0x04, 0x08, 0x10, 0x10],
  ' ': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
};
export function textWidth(str, scale) {
  return str.length * 6 * scale - scale;
}
export function drawText(cv, str, x, y, scale, col, align = 'left') {
  const s = str.toUpperCase();
  let cx = align === 'center' ? x - textWidth(s, scale) / 2 : x;
  for (const ch of s) {
    const g = GLYPHS[ch] || GLYPHS[' '];
    for (let row = 0; row < 7; row++)
      for (let colI = 0; colI < 5; colI++)
        if (g[row] & (1 << (4 - colI))) cv.rect(cx + colI * scale, y + row * scale, scale, scale, col);
    cx += 6 * scale;
  }
}
export function drawTextShadow(cv, str, x, y, scale, col, shadow) {
  drawText(cv, str, x + scale, y + scale, scale, shadow, 'center');
  drawText(cv, str, x, y, scale, col, 'center');
}
