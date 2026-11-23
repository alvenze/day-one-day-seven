// Pocket Grove — entry program for the make.fun bounty
// "Day one, day seven" (post-tiktok-day-one-day-seven-20261123-0327).
//
// The entry itself is a short TikTok video: the same tiny garden game on the
// day it was made and after a week of daily updates. This program's whole job
// is to hand the video's address to the grader: it copies VIDEO.json from the
// repository root (MAKEFUN_BOT_DIR) into the output directory
// (MAKEFUN_OUTPUT_DIR), where the gate reads it. Nothing else is written, and
// nothing the program could write about the video would be scored anyway —
// the house reads the video's counts from TikTok itself.
//
// The program is deterministic (a byte-for-byte file copy), uses no network,
// no clock and no files outside the repository, and prints nothing on success.
//
// Local run, the way the grader runs it:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const botDir = process.env.MAKEFUN_BOT_DIR ?? "/bot";
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

const source = join(botDir, "VIDEO.json");
const target = join(outputDir, "VIDEO.json");

if (!existsSync(source)) {
  console.error(`VIDEO.json is missing from the repository root (${source})`);
  process.exit(1);
}

mkdirSync(outputDir, { recursive: true });
try {
  copyFileSync(source, target);
} catch (err) {
  console.error(`could not copy VIDEO.json to ${target}: ${(err as Error).message}`);
  process.exit(1);
}
