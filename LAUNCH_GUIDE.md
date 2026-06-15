# Launch Guide — what to do with Roostr

You asked for a project that can make money and instructions on whether to air
it. Here's both, in the order you'd actually do things.

## Should you air it? — My honest take

**Yes, but cheaply and as an experiment.** The Wordle-like genre is proven:
daily habit → return visits → ad impressions, with near-zero running costs
(static hosting is free). The honest risks: the genre is crowded, and games
like this live or die on the share loop, not on ad spend. So launch free,
measure for 30 days, and only invest more (custom domain, Plus tier, more
puzzles) if people actually share it. Total cash needed to find out: **$0–12**
(a domain is the only optional cost).

Before airing, three quick checks:
1. **Name "Roostr"** (renamed from "Pecking Order," which was too generic to
   rank in search). Confirm the domain is available — `roostr.game`,
   `roostr.io`, or `playroostr.com` — and that no existing game holds the
   exact name. If you'd rather a different word, it lives in a handful of
   strings in `index.html` and `js/game.js` (search "Roostr") plus the `<h1>`.
2. `SITE_URL` in `js/game.js` is already set to `playroostr.com` — change it
   only if you deploy somewhere else first.
3. Play it yourself for 3 days. If *you* don't come back on day 3, fix that
   first (usually: puzzles too easy or too hard).

## Step 1 — Deploy (10 minutes, free)

Easiest path, no account juggling:

1. Create a GitHub repo and push this folder (it's already a git repo).
2. Repo → Settings → Pages → deploy from `main` branch, root folder.
3. Your game is live at `https://<you>.github.io/<repo>/`.

(Alternatives: Netlify or Cloudflare Pages — drag-and-drop the folder, done.
Either also gives you free analytics.)

Then update `SITE_URL` at the top of `js/game.js` to the real URL so the
share button advertises the right address. That share text **is** your
marketing department.

## Step 2 — Seed the share loop ($0)

- Post your own result grid (the game generates it) to Reddit:
  r/wordle-likes? No — use **r/WebGames, r/InternetIsBeautiful, r/dailygames**,
  and a "I made a daily game where you rank things" post on Hacker News
  (Show HN) and X/Threads.
- Submit to Wordle-alternative directories (wordleunlimited-style lists,
  "games like Wordle" roundups) — these send surprising long-tail traffic.
- The hook to lead with in every post is a fact, not the game:
  *"A blue whale's tongue outweighs a family car. Can you rank the other
  four? New puzzle daily."*

## Step 3 — Turn on Google AdSense (once you see ~500+ visits/day)

Don't bother before that — AdSense rejects thin/low-traffic sites, and pennies
aren't worth the page weight. The code is already wired; you only paste two IDs.

1. **Apply** at adsense.google.com with `playroostr.com`. Approval needs: the
   site live on the domain, a privacy policy (you have one — `privacy.html`,
   already linked in the footer), and a bit of real content/traffic.
2. **After approval**, create a "Display" ad unit in the AdSense dashboard.
   It gives you two values: your publisher ID (`ca-pub-…`) and the unit's
   ad-slot number.
3. Open `js/game.js` and fill the two constants at the top:
   ```js
   var ADSENSE_CLIENT = "ca-pub-XXXXXXXXXXXXXXXX";  // your publisher ID
   var ADSENSE_SLOT   = "XXXXXXXXXX";               // the ad unit number
   ```
   That's it — the ad area stays hidden until both are set, then renders a
   responsive unit. It never shows to Plus members. Redeploy.
4. **EEA/UK note:** Google requires a certified consent banner (CMP) for
   visitors in Europe. Easiest: turn on AdSense's own built-in consent message
   (AdSense → Privacy & messaging → GDPR). No code needed.
5. Expectation setting: puzzle games earn roughly **$2–8 per 1,000 daily
   visitors**. 1,000 visitors/day ≈ $60–240/month. Modest, but costs are zero.

## Step 3b — The coffee tip jar (already live, $0)

A "☕ Buy me a coffee" button sits in the footer and on every finished-puzzle
screen. It opens a PayPal donation to **ilan841@gmail.com**, suggested $1.50
(donors can give more). This needs no setup — it works the moment you deploy.

**The Coffee Counter (supporter wall).** Because the site has no backend, the
wall is *curated by you*, which keeps it honest (only real payers appear):

1. PayPal emails `ilan@playroostr.com` whenever someone donates, with their name.
2. Open `js/supporters.js` and add a line at the top of the list:
   ```js
   { name: "Jane D.", cups: 1, note: "loved the whale one" },
   ```
   `cups` and `note` are optional. If they asked to be anonymous, use
   `{ name: "A kind stranger" }`.
3. Redeploy. Their name (with little mugs) now shows on the Coffee Counter.

Want it fully automatic instead of manual? Two options, for later:
- **Switch the button to Buy Me a Coffee or Ko-fi** — those hosted services
  handle payment *and* a live supporter feed out of the box. Less control over
  the look, zero maintenance.
- **Add a real backend** — a Supabase table + a serverless function listening
  to PayPal webhooks would auto-post verified donors. That's a small project;
  only worth it if donations get frequent enough that manual entry annoys you.

## Step 4 — Turn on Plus ($1.99/mo) when there are regulars

1. Create a **Stripe Payment Link** (stripe.com → Payment Links → subscription,
   $1.99/mo). No code needed.
2. Paste the link into `PAYMENT_LINK` at the top of `js/game.js`.
3. Fulfillment, simplest version: Stripe's confirmation page shows a code/URL
   you choose; that page tells subscribers to tap a link like
   `https://yoursite/#plus-<secret>` — add 5 lines to `game.js` to set
   `localStorage["po-plus"]="1"` when the hash matches, which hides ads.
   (Proper accounts can come later, only if Plus actually sells.)
4. The archive ("every past day, replayable") is the real Plus seller —
   it's listed in the paywall pitch; implement it when the first person asks.

## Other ways to earn (ranked by effort-to-payoff)

Ordered best-first for a one-person daily game. None are built yet except where
noted — they're here so you can pick when the time comes.

1. **Coffee tips** *(built, live now)* — lowest friction, pure goodwill. Best
   early earner before you have ad-worthy traffic.
2. **Roostr Plus subscription** *(stub built)* — recurring revenue; flip it on
   per Step 4 once you have daily regulars who'd pay to lose the ads and unlock
   the archive. This is the real long-term money if the game sticks.
3. **Sponsored puzzle of the day** — once traffic is real, a brand pays to
   theme one day ("Today's class, sponsored by …"). High value, easy to add:
   one optional `sponsor` field on a puzzle + a small credit line. Worth wiring
   when someone's actually willing to pay for it.
4. **Print-on-demand merch** — the rooster rosette on a mug or tee via
   Printful/Redbubble. Zero inventory, you just add a "Shop" link. Tiny but
   on-brand revenue; only bother if you build a real fanbase.
5. **Themed puzzle packs** — sell a one-off pack (e.g. "100 Movie puzzles")
   as a small unlock. Same delivery mechanism as Plus.
6. **Affiliate facts** — when a puzzle features a product/book, an affiliate
   link in the reveal. Low yield, slightly tacky; use sparingly if at all.

My honest priority order for *you*: keep the **coffee jar** as the friendly
default, get **AdSense** on once traffic justifies it, and treat **Plus** as
the goal that actually pays. Everything else is a bonus, not worth your time
until the game has proven it has regulars.

## Step 5 — Keep it alive (15 min/week)

- There are 63 puzzles → just over two months of dailies. Add a few per week
  (`js/puzzles.js`, then `node tests/validate.js`). Counterintuitive facts
  are the product — collect them as you encounter them.
- Watch which results get shared (Cloudflare/Netlify analytics referrers);
  make more puzzles in those categories.

## Kill criteria (so it doesn't become a guilt project)

After 30 days: if fewer than ~50 people/day return and shares are flat,
archive it without ceremony — you'll have spent ≈$0 and learned what the
market thinks. If it has even a small daily crowd, it's a keeper: this genre
compounds slowly and the running cost stays zero.
