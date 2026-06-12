# Launch Guide — what to do with Pecking Order

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

Before airing, two 10-minute checks:
1. Search "pecking order game" — make sure no existing game/trademark
   conflicts. Renaming is a one-string change in `index.html`/`game.js`.
2. Play it yourself for 3 days. If *you* don't come back on day 3, fix that
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

## Step 3 — Turn on ads (once you see ~500+ visits/day)

Don't bother before that — ad networks reject empty sites and pennies aren't
worth the page weight.

1. Apply to **Google AdSense** (needs the site live on a real domain — buy one,
   ~$12/yr, when you reach this step) or use **Monetag/A-ads** sooner.
2. Paste the ad snippet inside the `.ad-slot` div in `index.html`
   (the placeholder comment marks the spot). The slot already hides itself
   for Plus subscribers.
3. Expectation setting: puzzle games earn roughly **$2–8 per 1,000 daily
   visitors per ad slot**. 1,000 visitors/day ≈ $60–240/month. Modest, but
   the costs are zero.

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
