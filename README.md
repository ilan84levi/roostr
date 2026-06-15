# 🏅 Roostr

**The daily ranking game.** *(Internally themed "pecking order" — county-fair
poultry-show flavor; the brand name is Roostr.)*
 Five real things, one hidden measure, three tries.
Drag the cards into order — smallest to biggest, slowest to fastest, oldest to
newest — then face the judge. Every reveal is built around a fact that makes
people say *"wait, what?"* (a blue whale's tongue outweighs a family car;
Nintendo is older than the zipper's patent holder; Antarctica is the world's
largest desert).

## Play it locally

No build step, no dependencies. Open `index.html` in a browser, or:

```
python -m http.server 8000
# → http://localhost:8000
```

## Project layout

```
index.html         the whole page
privacy.html       privacy policy (required for AdSense)
css/style.css      county-fair letterpress design system
js/puzzles.js      63 curated puzzles (items stored in ascending order)
js/game.js         game engine — daily selection, drag/reorder, judging, stats,
                   streaks, share, modals, ads, coffee jar (localStorage, no backend)
tests/validate.js  data integrity check: node tests/validate.js
LAUNCH_GUIDE.md    how to deploy and switch the money on
```

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
