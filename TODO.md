# dord.racing — Master To-Do List
_Last updated: 2026-06-30 (end of day)_

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

**Also:** `barcelona-f1.svg` is on disk but unreferenced — safe to delete when tidying.

---

## 📊 Data — Results

Results are embedded inside `calendar.json` per event (`results[]` array). The workflow for adding results weekly is documented in `grok-results-weekly.md`.

- [ ] **Keep results current** — add race results to `calendar.json` as each weekend concludes (use Grok prompt in `grok-results-weekly.md`)
- [ ] **Migrate Results page off `results.json`** — `results.astro` still reads from `data/results.json` which is now a parallel/redundant copy. Long term it should read from `calendar.json` directly. Until then keep both in sync manually.
- [ ] **Delete `data/results.json`** — only after the migration above is done

---

## 📊 Data — Track Info Gaps

Some tracks have missing or uncertain data. Full list in `track-data-gaps.md`.

- [ ] Lap records that are qualifying times not race laps
- [ ] New circuits with no official lap record yet (Madrid F1, new street circuits)
- [ ] Tracks where the era/car of the record doesn't match current series usage

---

## 🔧 Code / Features

- [ ] **Sitemap `lastmod` dates** — hardcoded to `2026-06-30`. Update when content changes significantly, or switch to a build-time generated sitemap
- [ ] **Layout button label casing** — `red-bull-ring` shows "MOTOGP"; consider "MotoGP" mixed case for visual consistency
- [ ] **Track title edge case** — `/tracks/[slug]` title says "2026 Race Schedule" even for historic/reserve tracks not on the 2026 calendar. Low priority.
- [ ] **Self-host Google Fonts** — currently loads from `fonts.googleapis.com`, which sends IP to Google on every page load. Flagged in Privacy Policy; self-hosting would remove this dependency entirely.
- [ ] **Cookie consent banner** — mentioned in Privacy Policy as "coming in a future update". Required for GDPR compliance if/when affiliate links are added.

---

## 🔍 SEO — Remaining

- [ ] **Submit sitemap to Google Search Console** — `https://dord.racing/sitemap.xml` — do this right after v1 deploy
- [ ] **Submit to Bing Webmaster Tools**
- [ ] **Rich Results non-critical issues** — click through the Events detail in the Rich Results Test to see what they are (likely missing `endDate` or `performer` — both optional, won't block eligibility)
- [ ] **OG image validation** — once Figma OGs are done, run through Twitter Card Validator and verify 1200×630, under 200 KB
- [ ] **Custom meta descriptions for more series** — F1, MotoGP, WEC have bespoke descriptions; IndyCar, NASCAR, WSBK, BTCC, WRC are worth doing once the site has some search data to guide keyword choices

---

## 📣 Launch / Marketing

- [ ] **Commit v1 and deploy**
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

