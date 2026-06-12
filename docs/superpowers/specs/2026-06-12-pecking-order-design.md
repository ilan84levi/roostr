# Pecking Order — Design Spec (2026-06-12)

## What it is
A free daily browser game: players rank 5 real-world items by a hidden quantity
(weight, speed, year, height, calories...). Three guesses. Puzzles are curated
around counterintuitive facts so the post-game reveal is inherently shareable.

## Why it can make money
- **Proven model:** Wordle-likes (Worldle, Costcodle, Framed) monetize with
  display ads at $2–8 RPM once daily traffic exists; the daily-habit + streak
  mechanic drives the return visits ads need.
- **Premium tier ($1.99/mo or $14.99/yr):** ad-free + full puzzle archive +
  detailed stats. Implemented as a stub paywall now; wire Stripe later.
- **Zero cost to run:** single static site, free hosting (GitHub Pages /
  Netlify / Cloudflare Pages). Any revenue is ~pure margin.

## Architecture
Static site, no backend, no build step:
- `index.html` — single page
- `css/style.css` — design system
- `js/puzzles.js` — curated puzzle data (~90 puzzles, factual values + source notes)
- `js/game.js` — game logic, state, share, stats
- State in `localStorage` (stats, streaks, today's progress).
- Daily puzzle = `daysSince(epoch) % puzzleCount`.

## Game rules
1. Shown a category prompt, e.g. "Rank these from LIGHTEST to HEAVIEST".
2. Drag (or tap-swap) 5 cards into order; submit. 3 attempts.
3. Feedback per slot: 🟩 exact, 🟨 off by one, ⬛ off by 2+.
4. Win or lose, the true values reveal with a one-line "fun fact".
5. Share button copies emoji grid + result (no spoilers).

## Monetization surfaces (built now, activated later)
- Two ad slots (`.ad-slot` placeholders sized 320×100 / 300×250) with comments
  marking where AdSense/Monetag code goes.
- "Pecking Order Plus" modal: archive + ad-free pitch, button stubbed to a
  PAYMENT_LINK constant (point at a Stripe Payment Link when ready).
- Share loop is the growth channel (emoji grid like Wordle).

## Out of scope (YAGNI)
Accounts, server-side anything, leaderboards, i18n, native apps.

## Testing
- `tests/validate.js` (Node, no deps): puzzle data integrity — 5 items each,
  strictly orderable values, unique ids, no duplicate items, prompt present.
- Manual play-through in browser via Playwright before delivery.

## Risks / notes for the owner
- Verify the name "Pecking Order" is free of trademark conflicts in games
  before airing; renaming is a one-string change.
- Puzzle facts were curated for accuracy from stable public knowledge
  (planetary data, animal speeds, building heights, release years); spot-check
  any that look off — values matter for fairness, exactness doesn't (only
  relative order is used).
