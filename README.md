# 🏅 Roostr

**The daily ranking game.** *(Internally themed "pecking order" — county-fair
poultry-show flavor; the brand name is Roostr.)*
 Five real things, one hidden measure, three tries.
Drag the cards into order — smallest to biggest, slowest to fastest, oldest to
newest — then face the judge. Every reveal is built around a fact that makes
people say *"wait, what?"* (a blue whale's tongue outweighs a family car;
Nintendo is older than the zipper's patent holder; Antarctica is the world's
largest desert).

Nine games share one design system — five daily puzzles and four arcade games:

- **Ranking** (`index.html`) — drag five things into order by the hidden measure.
- **Face-Off** (`faceoff.html`) — call *higher or lower* on the hidden measure,
  four times in a row, for a clean sweep.
- **Top Pick** (`pick.html`) — *tap the biggest* (or smallest) on the hidden
  measure, three quick rounds across three different line-ups.
- **Guess the Flag** (`flags.html`) — name the country from its flag, five rounds
  of four-way multiple choice. Flags are hand-built from simple SVG geometry, so
  there are no external image requests.
- **Guess the Currency** (`currency.html`) — a banknote shows a currency's name and
  symbol (Yen, Baht, Złoty, Naira…); name the country it belongs to, five rounds of
  four-way multiple choice. Notes are drawn from simple SVG geometry — no external
  image requests.
- **Coop Run** (`run.html`) — a canvas endless runner: jump the rooster over hay
  bales and fences, chasing a distance record. Not daily — play any time.
- **Astro Coop** (`dodge.html`) — a canvas space dodger: fly a spaceship through a
  starfield and dodge the asteroids. Not daily — play any time.
- **Coop Racer** (`race.html`) — a canvas top-down racer: steer with two thumbs
  (or ← →), tilt the phone toward upright to boost, and dodge the roosters
  hopping onto the road. Not daily — play any time.
- **Memory** (`memory.html`) — a classic flip-and-match card game using the flag
  art; clear all pairs in as few moves as you can. Easy / Medium / Hard
  (4×4 / 4×6 / 6×6), per-difficulty best scores. Not daily — play any time.

The first three share one puzzle pool; the flag quiz, the currency quiz and the
arcade games each have their own. A segmented switcher in the header jumps
between all nine (it scrolls horizontally on small screens).

## Play it locally

No build step, no dependencies. Open `index.html` in a browser, or:

```
python -m http.server 8000
# → http://localhost:8000               (Ranking)
# → http://localhost:8000/faceoff.html  (Face-Off)
# → http://localhost:8000/pick.html     (Top Pick)
# → http://localhost:8000/flags.html    (Guess the Flag)
# → http://localhost:8000/currency.html (Guess the Currency)
# → http://localhost:8000/run.html      (Coop Run)
# → http://localhost:8000/dodge.html    (Astro Coop)
# → http://localhost:8000/race.html     (Coop Racer)
# → http://localhost:8000/memory.html   (Memory)
```

## Project layout

```
index.html         the Ranking game (+ About/FAQ content for SEO)
faceoff.html       the Face-Off (higher/lower) game
pick.html          the Top Pick (spot-the-biggest) game
flags.html         the Guess the Flag quiz
currency.html      the Guess the Currency quiz
run.html           the Coop Run arcade runner
dodge.html         the Astro Coop space dodger
race.html          the Coop Racer rooster-dodging racer
memory.html        the Memory card-matching game
privacy.html       privacy policy (required for AdSense)
robots.txt         allows all crawlers, points to the sitemap
sitemap.xml        all game URLs for search engines (with lastmod)
css/style.css      county-fair letterpress design system (shared)
js/puzzles.js      63 curated puzzles (items stored in ascending order)
js/game.js         Ranking engine — daily selection, drag/reorder, judging, stats,
                   streaks, share, modals, ads, coffee jar (localStorage, no backend)
js/faceoff.js      Face-Off engine — same patterns, "fo-" localStorage namespace
js/pick.js         Top Pick engine — same patterns, "tp-" localStorage namespace
js/flags.js        36 hand-built SVG flags (country, region, fun fact)
js/guessflag.js    Guess the Flag engine — same patterns, "gf-" localStorage namespace
js/currencies.js   36 world currencies as SVG banknotes (country, currency, region, fact)
js/currency.js     Guess the Currency engine — same patterns, "gc-" localStorage namespace
js/run.js          Coop Run engine — canvas loop, physics, "cr-" localStorage namespace
js/dodge.js        Astro Coop engine — canvas loop, "sd-" localStorage namespace
js/race.js         Coop Racer engine — canvas loop, thumb steering + tilt boost,
                   "rc-" localStorage namespace
js/memory.js       Memory engine — flip/match, "mem-" localStorage namespace
js/share.js        shared one-tap share row (WhatsApp/X/Telegram/Copy) on results
og-*.png           per-game social share cards (1200×630)
tools/make-og.js   regenerates the share cards (see "Share images" below)
docs/PROMOTION.md  launch kit + SEO/indexing checklist (how to get players)
tests/validate.js  data integrity check: node tests/validate.js
LAUNCH_GUIDE.md    how to deploy and switch the money on
```

The puzzle games pick with a different daily offset so they rarely overlap on the
same day. Every page carries Open Graph/Twitter cards (`og:site_name`,
`og:locale`), a canonical URL, an explicit `robots` directive, and schema.org
JSON-LD (`Game`/`WebApplication`). The home page also emits a `WebSite`, an
`ItemList` of all nine games, and a `FAQPage` backed by a visible About/FAQ
section — real crawlable text for organic search.

## Share images

Each game has its own 1200×630 card (`og-ranking.png`, `og-faceoff.png`,
`og-pick.png`, `og-flags.png`, `og-currency.png`, `og-run.png`, `og-dodge.png`,
`og-race.png`, `og-memory.png`) referenced from that
page's `og:image` / `twitter:image`. They're generated from HTML templates with
headless Chromium — no design tool needed:

```
node tools/make-og.js   # rebuilds all og-*.png (needs a Chromium/Chrome binary)
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
