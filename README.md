# 🏅 Roostr

**The daily ranking game.** *(Internally themed "pecking order" — county-fair
poultry-show flavor; the brand name is Roostr.)*
 Five real things, one hidden measure, three tries.
Drag the cards into order — smallest to biggest, slowest to fastest, oldest to
newest — then face the judge. Every reveal is built around a fact that makes
people say *"wait, what?"* (a blue whale's tongue outweighs a family car;
Nintendo is older than the zipper's patent holder; Antarctica is the world's
largest desert).

Three daily games share one design system and one puzzle pool:

- **Ranking** (`index.html`) — drag five things into order by the hidden measure.
- **Face-Off** (`faceoff.html`) — call *higher or lower* on the hidden measure,
  four times in a row, for a clean sweep.
- **Top Pick** (`pick.html`) — *tap the biggest* (or smallest) on the hidden
  measure, three quick rounds across three different line-ups.

Same data, three different brains. A segmented switcher in the header jumps
between them.

## Play it locally

No build step, no dependencies. Open `index.html` in a browser, or:

```
python -m http.server 8000
# → http://localhost:8000               (Ranking)
# → http://localhost:8000/faceoff.html  (Face-Off)
# → http://localhost:8000/pick.html     (Top Pick)
```

## Project layout

```
index.html         the Ranking game
faceoff.html       the Face-Off (higher/lower) game
pick.html          the Top Pick (spot-the-biggest) game
privacy.html       privacy policy (required for AdSense)
robots.txt         allows all crawlers, points to the sitemap
sitemap.xml        all game URLs for search engines
css/style.css      county-fair letterpress design system (shared)
js/puzzles.js      63 curated puzzles (items stored in ascending order)
js/game.js         Ranking engine — daily selection, drag/reorder, judging, stats,
                   streaks, share, modals, ads, coffee jar (localStorage, no backend)
js/faceoff.js      Face-Off engine — same patterns, "fo-" localStorage namespace
js/pick.js         Top Pick engine — same patterns, "tp-" localStorage namespace
tests/validate.js  data integrity check: node tests/validate.js
LAUNCH_GUIDE.md    how to deploy and switch the money on
```

Each game picks its puzzle(s) with a different daily offset so they rarely
overlap on the same day. Every page carries Open Graph/Twitter cards, a
canonical URL, and schema.org JSON-LD (`Game`/`WebApplication`); the home page
also emits a `WebSite` + `ItemList` so search engines see all three games.

## Monetization (all configured in the top of `js/game.js`)

- **Coffee tips** — PayPal donate button (footer + under the Judge button) to
  `PAYPAL_EMAIL`, with a cup picker / custom amount. No supporter wall to
  maintain.
- **Google AdSense** — set `ADSENSE_CLIENT` + `ADSENSE_SLOT` after approval; the
  ad area stays hidden until then and never shows to Plus members.
- **Roostr Plus** — subscription stub; set `PAYMENT_LINK` to a Stripe link.

## How it works

- The day's puzzle is `daysSince(2026-06-01) % 63`; everyone gets the same
  starting shuffle (seeded PRNG keyed to the day).
- Items are stored ascending, so item *i* belongs at position *i* — judging is
  a one-liner. 🟩 exact, 🟨 off by one, ⬜ further.
- Streaks, stats and today's progress live in `localStorage`. No accounts,
  no tracking, no cookies.

## Adding puzzles

Append to `js/puzzles.js` (5 items, ascending by the hidden value, plus one
good fact), then run `node tests/validate.js`. Order is what's judged —
display values are honest approximations.
