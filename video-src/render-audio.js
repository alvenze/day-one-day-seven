// Cheerful 26 s music bed for the video, synthesized note by note (no samples):
// a C-major pentatonic jingle over a C G Am F bass, soft sine + harmonic timbre,
// plus one gentle chime at 20.5 s where the closing line appears. Writes
// audio.wav (16-bit PCM mono, 22050 Hz); ffmpeg encodes it to AAC later.

import { writeFileSync } from 'node:fs';

const SR = 22050, DUR = 26, N = SR * DUR;
const out = new Float32Array(N);
const freq = (semi) => 440 * Math.pow(2, semi / 12); // semitones from A4

function note(t0, f, dur, vol, harmonic = 0.35) {
  const start = Math.floor(t0 * SR), len = Math.floor(dur * SR);
  for (let i = 0; i < len && start + i < N; i++) {
    const t = i / SR;
    const env = Math.min(1, t / 0.012) * Math.exp(-2.2 * t / dur);
    out[start + i] += vol * env * (Math.sin(2 * Math.PI * f * t) + harmonic * Math.sin(4 * Math.PI * f * t));
  }
}

// Melody: two 6.5 s phrases, repeated with a brighter second half.
// Semitone offsets from C5 (12 above A4 = C5 at +3 from A4... use A4-relative):
// C5=+3, D5=+5, E5=+7, G5=+10, A5=+12, C6=+15, G4=-2, A4=0, E5=+7
const PHRASE = [3, 7, 10, 12, 10, 7, 5, 7, 3, 5, 7, 10, 7, 5, 3, -2];
for (let rep = 0; rep < 4; rep++) {
  const base = rep * 6.5;
  PHRASE.forEach((s, i) => note(base + i * 0.40625, freq(s + (rep >= 2 ? 0 : 0)), 0.38, 0.20));
  // bass: C G Am F, one root per 1.625 s (C3=-9? A2=-12; C3 = -9 semitones from A4... C3 is 220/2=110Hz = A4 - 12 - ... use Hz directly)
}
const BASS = [130.81, 98.0, 110.0, 87.31]; // C3 G2 A2 F2
for (let bar = 0; bar < 16; bar++) note(bar * 1.625, BASS[bar % 4], 1.5, 0.16, 0.15);
// sparkle chime at 20.5 s (closing line) and a soft one at 8.0 s (first flick)
note(8.0, freq(15), 0.7, 0.12); note(8.0, freq(19), 0.9, 0.08);
note(20.5, freq(15), 0.8, 0.14); note(20.65, freq(19), 1.0, 0.10); note(20.8, freq(22), 1.2, 0.08);

// fade out the last second, normalize gently
for (let i = 0; i < N; i++) {
  const t = i / SR;
  if (t > 25) out[i] *= (26 - t);
  out[i] = Math.max(-0.9, Math.min(0.9, out[i]));
}
const wav = Buffer.alloc(44 + N * 2);
wav.write('RIFF', 0); wav.writeUInt32LE(36 + N * 2, 4); wav.write('WAVE', 8);
wav.write('fmt ', 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(SR, 24); wav.writeUInt32LE(SR * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
wav.write('data', 36); wav.writeUInt32LE(N * 2, 40);
for (let i = 0; i < N; i++) wav.writeInt16LE(Math.round(out[i] * 32767), 44 + i * 2);
writeFileSync(new URL('../audio.wav', import.meta.url), wav);
console.log('audio.wav written', DUR, 's');
