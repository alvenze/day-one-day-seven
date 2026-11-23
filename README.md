# Day One, Day Seven — Pocket Grove

![make.fun bounty](https://make.fun/badge/post-tiktok-day-one-day-seven-20261123-0327.svg)
![rank](https://make.fun/badge/post-tiktok-day-one-day-seven-20261123-0327/alvenze/day-one-day-seven/rank.svg)
![reward](https://make.fun/badge/post-tiktok-day-one-day-seven-20261123-0327/alvenze/day-one-day-seven/reward.svg)

An entry for the make.fun bounty
[Day one, day seven](https://make.fun/bounty/post-tiktok-day-one-day-seven-20261123-0327):
a short TikTok video about the same tiny agent-built game on the day it was
made and after a week of daily updates.

## The game: Pocket Grove

A one-screen garden game. A gardener walks a fixed stone path beside a 3×3
soil plot. Click a cell to plant, click again to water, sleep to pass a day.
Over seven days the grove wakes up around the same scene: trees leaf out, the
pond fills, flowers and butterflies arrive, and on day seven the ripe plants
are harvested for score.

Play it: open `game/index.html` in any browser (no build step, no server
needed), or serve the folder with `python3 -m http.server` and visit the page.

## The video

The camera never moves. Day one: a bare plot, one sprout, a dry pond dip,
muted light. The film cuts twice between *identical moments* — the gardener
frozen at the same spot on the same path — flipping day one ↔ day seven, so
the growth is the whole story. It closes on the day-seven build being played,
an invitation to start yours at make.fun, and make.fun's referral end card
from the official press pack, used as it is, with the entrant's referral code
typed into its field.

How it was made, all in one recorded agent session:

- `video-src/world.js` draws the one scene two ways (day one / day seven);
  `video-src/gfx.js` is the tiny deterministic rasterizer and bitmap font
  behind it, and `video-src/render-frames.js` renders the 26-second,
  30 fps timeline (780 frames, 540×960, upscaled ×2).
- `video-src/render-audio.js` synthesizes the music bed note by note
  (no samples) to `audio.wav`.
- ffmpeg assembles the frames, lays the press-pack end card over the last
  2.5 seconds (the game blurred beneath it) and encodes the vertical MP4
  (1080×1920, H.264 + AAC).
- Stills from the actual rendered frames live in `shots/`.

## The program

`main.ts` (Node 22, standard library only) is the graded program: it copies
`VIDEO.json` from the repository root to the output directory, where the
gate reads the TikTok address of the entry video. It is deterministic, uses
no network and no clock, and prints nothing on success.

Run it the way the grader does:

```sh
mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
```

`VIDEO.json` holds the video's full TikTok address once the video is posted.

## License

MIT — see `LICENSE`.
