# Getting people to Roostr — launch kit & SEO checklist

The site is live and deploys fine (GitHub Pages, `main`). Zero traffic on a
brand-new site is normal — Google takes weeks–months to rank a fresh domain,
and a site with no inbound links gets ~0 visits until it's actively promoted.
So the plan is: **make sharing effortless (done in code), then go where players
already are.**

---

## 0. Confirm it's reachable (2 min, one time)
- Open **https://playroostr.com** on your phone. It should load the Ranking game.
- If the domain fails but **https://ilan84levi.github.io/roostr/** works, it's a
  DNS / custom-domain problem:
  - GitHub → repo → **Settings → Pages → Custom domain** should say `playroostr.com`
    with a green check ("DNS check successful") and **Enforce HTTPS** ticked.
  - Your DNS host should have either an `ALIAS/ANAME` on the apex to
    `ilan84levi.github.io`, or four `A` records to GitHub's IPs:
    `185.199.108.153 · 185.199.109.153 · 185.199.110.153 · 185.199.111.153`.
    (A `www` CNAME → `ilan84levi.github.io` is nice to have.)

---

## 1. SEO / indexing checklist (Google Search Console)
The on-page SEO is already in place (verified):
- `robots.txt` allows all crawlers and points to the sitemap.
- `sitemap.xml` lists all 7 URLs with `lastmod`.
- Every page has a unique `<title>`, `<meta description>`, canonical URL,
  Open Graph/Twitter cards, and `Game`/`WebApplication` JSON-LD.
- The home page adds `WebSite` + `ItemList` (all six games) + a `FAQPage`
  backed by visible About/FAQ text.

**What to do in [Search Console](https://search.google.com/search-console):**
1. Make sure the property is **verified** for `playroostr.com`.
2. **Sitemaps →** submit `sitemap.xml` (you did this — confirm it says "Success").
3. **URL Inspection →** paste each URL below → **Request indexing**. Do all six:
   - `https://playroostr.com/`
   - `https://playroostr.com/faceoff.html`
   - `https://playroostr.com/pick.html`
   - `https://playroostr.com/flags.html`
   - `https://playroostr.com/run.html`
   - `https://playroostr.com/dodge.html`
4. Check **Pages** report over the next 1–2 weeks. "Crawled/Discovered – not
   indexed" is normal at first for a new site; it resolves as you get links.
5. Also add the site to **[Bing Webmaster Tools](https://www.bing.com/webmasters)**
   (you can import straight from Search Console).
6. Sanity check: search Google for `site:playroostr.com` — once pages show up,
   they're indexed.

> Reality check: SEO is the *slow* channel. It compounds over months and needs
> backlinks (step 3 below). Don't wait on it for your first players.

---

## 2. Ready-to-paste posts

### Reddit (post ONE at a time, a few days apart; read each sub's self-promo rules)
Good subs: r/WebGames, r/playmygame, r/incremental_games, r/dailygames, r/InternetIsBeautiful (high bar).

> **Title:** I made Roostr — 6 free daily browser games (no app, no signup)
>
> I built a little collection of free games you can play right in the browser:
> four daily brain games — rank things by a hidden measure, higher/lower,
> spot-the-biggest, and a flag quiz — plus two arcade games (a rooster runner
> and a spaceship asteroid-dodger). New puzzles every midnight, your streak
> saves locally, nothing to install, no ads-wall. Built solo. Curious which
> game people find the most fun: https://playroostr.com

### Hacker News — "Show HN"
> **Title:** Show HN: Roostr – six free daily browser games, no app or signup
>
> **First comment:** I wanted Wordle-style daily games without accounts or
> downloads, so I built six. Vanilla JS, no backend, hosted on GitHub Pages;
> streaks live in localStorage; the flags and the art are hand-drawn SVG/canvas.
> Happy to answer anything about the build. https://playroostr.com

### X / Twitter (also fine for WhatsApp status, Threads, Bluesky)
> 6 tiny free games, new every day 🐔 rank · guess · dodge.
> No app, no signup, streak saves in your browser. playroostr.com

### Product Hunt (tagline + description)
> **Tagline:** Six free daily browser games — no app, no signup
> **Description:** Roostr is a county-fair-themed collection of quick daily games:
> rank five things by a hidden measure, call higher/lower, spot the biggest, a
> flag quiz, plus a rooster runner and a spaceship dodger. Free, instant, and
> your streaks stay in your browser.

### Game-portal blurb (itch.io / CrazyGames / Newgrounds submission)
> Roostr is a collection of six free browser games — four daily puzzles and two
> arcade games (an endless runner and a spaceship dodger). No download, no
> account; play instantly on phone or desktop.

---

## 3. Distribution checklist (this is what actually brings the first players)
- [ ] Text/WhatsApp the link to 10–20 friends. Ask them to play today's puzzle and
      share their result (the 🟩🟥 grid + one-tap share buttons are the growth loop).
- [ ] Post the Reddit thread (above).
- [ ] Post Show HN (above).
- [ ] Submit to **itch.io** (you can embed the game in an iframe) and **CrazyGames**.
- [ ] Get listed on "Wordle alternatives / daily games" roundup sites (search for
      them and email the author, or submit via their form) — these are backlinks.
- [ ] Record two 15–30s clips (Coop Run + Astro Coop) for TikTok / Reels / Shorts.
- [ ] Optional later: a Product Hunt launch on a Tuesday–Thursday.

---

## 4. Measure it
Google Analytics (`G-GQBZ10K1ZY`) is already on every page. In GA4, watch
**Reports → Realtime** while you share the link to confirm hits are recorded,
then **Acquisition → Traffic acquisition** to see which channel (Reddit, direct,
search…) is actually working, and double down on that one.

---

*The single highest-leverage thing you can do this week: post the Reddit + Show HN
threads and text the link to friends. Everything else compounds from there.*
