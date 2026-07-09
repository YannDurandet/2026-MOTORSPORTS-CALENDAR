# dord.racing — Master To-Do List
_Last updated: 2026-07-07_

---

## ✅ Done — July 7 (Cloudflare migration + post-launch hardening)

- [x] **GitHub Actions deploy workflow** — replaced GitHub Pages deploy with `wrangler deploy` to Cloudflare Workers on every push to `main`
- [x] **DNS migrated Porkbun → Cloudflare** — nameservers updated; Resend and Google verification records carried over
- [x] **`public/CNAME` deleted** — legacy GitHub Pages artifact removed
- [x] **UTM redirects upgraded to proper 301s** — `/ig`, `/x`, `/yd` now return server-side 301 via `Astro.redirect()` instead of meta-refresh
- [x] **Cloudflare env vars set** — `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` configured as secrets in Workers dashboard
- [x] **Rate limiting on `/api/subscribe`** — Cloudflare WAF rule: 10 req/min per IP, block action
- [x] **Sitemap auto-generation** — replaced hand-edited `sitemap.xml` with `@astrojs/sitemap`; generates `sitemap-index.xml` at build time
- [x] **Email obfuscation** — `durandet.yann.pro@gmail.com` removed from raw HTML in `privacy.astro`, `tos.astro`, `Footer.astro`; assembled client-side via `js-mailto` data attributes
- [x] **Results system fixed** — `results.json` rewritten with correct key format (`2026-07`), correct series slugs, correct venue slugs; WEEK 27 results injected directly into `calendar.json` for all 11 series
- [x] **Newsletter send script** — `scripts/send-newsletter.ts` complete with Turso subscriber fetch, Resend batched sends, session times, venue grouping, track PNG icons
- [x] **Track PNG export** — `scripts/export-track-pngs.mjs`; 155 circuit PNGs exported to `public/assets/tracks/email/`
- [x] **`/newsletter` page** — standalone subscribe page at `dord.racing/newsletter`

---

## ✅ Done today (June 30)

- [x] **Footer overhaul** — removed personal Instagram, added DORD socials (X @dord_racing + Instagram @dord.racing), split into two labelled groups (DORD / Yann), renamed "Portfolio" → "Brand & Web Studio", removed Series quick-links column, repositioned Legal column
- [x] **Sticky nav labels** — added text labels under each icon (Calendar, Series, Tracks, Results, Search), hidden on mobile
- [x] **Pre-v1 audit** — confirmed zero console.logs, zero dead links, zero missing SVG references, all canonical URLs correct
- [x] **Sitemap fix** — removed ghost `shanghai-fe` entry, added `/results`
- [x] **Schema.org JSON-LD (full pass)**
  - `WebSite` on homepage
  - `SportsOrganization` + `BreadcrumbList` + `SportsEvent` array on every series page
  - `SportsActivityLocation` + `BreadcrumbList` on every track page
  - `BreadcrumbList` on series index, track index, results
- [x] **Rich SportsEvent schemas** — upgraded from minimal to full: `location` (venue name + city + country), `eventStatus`, `eventAttendanceMode`, `image`, `description`, `organizer` with URL — 22/25 series at 100% venue coverage; WRC/ERC skip location by design (rally flags, not circuits)
- [x] **OG images — series pages** — each `/series/[slug]` page now uses its own series background image as `og:image` instead of the generic hero
- [x] **`missing-og.md`** — documented which OG images still need designing in Figma (homepage, tracks, results)
- [x] **Alt text** — series grid cards now use `"${name} 2026 race schedule"` instead of the generic illustration label
- [x] **`/public/llms.txt`** — created per llmstxt.org standard; full site description, all 25 series with slugs + taglines, data sources, contact
- [x] **Keyword audit + implemented** — all page titles and meta descriptions updated: homepage, series index, all series detail pages (custom for F1/MotoGP/WEC, template for others), track detail pages
- [x] **TOS + Privacy Policy** — added localStorage disclosure (`motorsportFilters` key, device-only, never transmitted), bumped "Last updated" to June 30
- [x] **CSS background-image path fix** — footer `url(assets/...)` → `url(/assets/...)` so Astro doesn't fingerprint it into `/_astro/` during build (was causing a failed resource in Google Rich Results Test)
- [x] **Google Rich Results Test** — ran against live site, confirmed 25 valid Event schemas detected ✅

---

## 🎨 Design / Figma

- [x] **OG image — Homepage** (`public/assets/og/og-home.webp`) — dord.racing wordmark + tagline, 1200×630
- [x] **OG image — Track Browser** (`public/assets/og/og-tracks.webp`) — circuit map collage or iconic single track, 1200×630
- [x] **OG image — Series Browser** (`public/assets/og/og-series.webp`) — 
- [x] **OG image — Results** (`public/assets/og/og-results.webp`) — podium / results aesthetic, 1200×630
- [x] Wire OG images once designed: pass `ogImage="https://dord.racing/assets/og/og-*.webp"` on the relevant `<BaseLayout>` call in `index.astro`, `series/index.astro`, `tracks/index.astro`, and `results.astro`

---

## 🗺️ SVG Track Maps — DRAWN

These layouts exist in the calendar but use the same SVG as another series. Drawing them unlocks a layout toggle button on the track detail and browser card.

- [x] **`silverstone-national.svg`**
- [x] **`oulton-park-international.svg`**
- [x] **`oulton-park-international.svg`** — 3rd circuit layout (added because I could, but idk if any series uses it in 2026)
- [x] **`misano-wsbk.svg`**

Once drawn, for each new SVG:
1. Add to `calendarSvgs` (and a new `layouts[]` entry if needed) in `data/tracks.json`
2. Update the relevant `calendar.json` event `track` field if it changes
3. Move slug from "Still Missing" to the right section in `track-map-status.md`
4. Update `_Last updated` date in `track-map-status.md`

**Also:** ~~`barcelona-f1.svg` is on disk but unreferenced~~ — deleted.

---

## 📊 Data — Results

Results are embedded inside `calendar.json` per event (`results[]` array). The workflow for adding results weekly is documented in `grok-results-weekly.md`.

- [ ] **Keep results current** — add race results to `calendar.json` as each weekend concludes (use Grok prompt in `grok-results-weekly.md`)
- [ ] **Migrate Results page to read from `calendar.json`** — `results.astro` currently reads from `data/results.json`. Workflow: input results into `results.json` → run merge script → `calendar.json` updated. Long term, Results page should read from `calendar.json` directly and `results.json` remains only as the input staging file.
- [ ] **Fix merge script `merge-results-into-calendar.js`** — has 3 known bugs: wrong key format parsing, series slug mismatches, venue slug mismatches. Currently bypassed by direct injection. Needs a proper fix before the workflow is reliable.

---

## 📊 Data — Track Info Gaps

Some tracks have missing or uncertain data. Full list in `track-data-gaps.md`.

- [ ] Lap records that are qualifying times not race laps
- [ ] New circuits with no official lap record yet (Madrid F1, new street circuits)
- [ ] Tracks where the era/car of the record doesn't match current series usage

---

## 🔧 Code / Features

- [x] **Sitemap `lastmod` dates** — resolved by switching to `@astrojs/sitemap` auto-generation
- [ ] **Update `robots.txt` sitemap URL** — currently points to `/sitemap.xml` but generated file is `/sitemap-index.xml`; update the `Sitemap:` line in `public/robots.txt`
- [ ] **Layout button label casing** — `red-bull-ring` shows "MOTOGP"; consider "MotoGP" mixed case for visual consistency
- [ ] **Track title edge case** — `/tracks/[slug]` title says "2026 Race Schedule" even for historic/reserve tracks not on the 2026 calendar. Low priority.
- [ ] **Self-host Google Fonts** — fonts downloaded (Orbitron 400/900, Roboto Mono 400/700, Inter 400/800); place in `public/assets/fonts/` and replace `<link>` tags in `BaseLayout.astro` with `@font-face` declarations
- [x] **Cookie consent banner** — already implemented in `BaseLayout.astro` (Accept/Decline, stores `cookie_consent` cookie, gates GA4 load)

---

## 🔍 SEO — Remaining

- [ ] **Submit sitemap to Google Search Console** — use `https://dord.racing/sitemap-index.xml` (not `sitemap.xml` — the auto-generator creates an index file)
- [ ] **Submit to Bing Webmaster Tools**
- [ ] **Rich Results non-critical issues** — click through the Events detail in the Rich Results Test to see what they are (likely missing `endDate` or `performer` — both optional, won't block eligibility)
- [ ] **OG image validation** — once Figma OGs are done, run through Twitter Card Validator and verify 1200×630, under 200 KB
- [ ] **Custom meta descriptions for more series** — F1, MotoGP, WEC have bespoke descriptions; IndyCar, NASCAR, WSBK, BTCC, WRC are worth doing once the site has some search data to guide keyword choices

---

## 📣 Launch / Marketing

- [x] **Commit v1 and deploy** — live at dord.racing on Cloudflare Workers
- [ ] **Post on X (@dord_racing)** — v1 launch announcement
- [ ] **Post on Instagram (@dord.racing)** — carousel or reel: calendar, track browser, countdowns
- [ ] **Post on personal X (@YannDurandet)**
- [ ] **Submit to motorsport subreddits** — r/formula1, r/motorsports, r/WEC, r/MotoGP — it's a genuine tool, not spam
- [ ] **Reach out to motorsport newsletter writers / journalists** who might link to it
- [ ] **Submit to Astro showcase** (astro.build/showcase) — good backlink from a high-authority domain

---

## 🔄 Ongoing / Seasonal

- [ ] **Weekly results** — use `grok-results-weekly.md` prompt each Monday to fill in the past weekend's results in `calendar.json`
- [ ] **Calendar corrections** — race dates shift mid-season (reschedules, cancellations); update `calendar.json` and `data/series.json` accordingly
- [ ] **Update `sitemap.xml` `lastmod`** when making significant content updates
- [ ] **End-of-season cleanup** — after Abu Dhabi GP (Dec 6), tag repo as `v2026-final`, start a `2027` branch
