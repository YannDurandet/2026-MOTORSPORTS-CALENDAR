# dord.racing — Master To-Do List
_Last updated: 2026-06-30_

---

## 🎨 Design / Figma

- [ ] **OG image — Homepage** (`public/assets/og/og-home.jpg`) — dord.racing wordmark + tagline, 1200×630
- [ ] **OG image — Track Browser** (`public/assets/og/og-tracks.jpg`) — circuit map collage or iconic single track, 1200×630
- [ ] **OG image — Results** (`public/assets/og/og-results.jpg`) — podium / results aesthetic, 1200×630
- [ ] Wire OG images once designed: pass `ogImage="https://dord.racing/assets/og/og-*.jpg"` on the relevant `<BaseLayout>` call in `index.astro`, `tracks/index.astro`, and `results.astro`

---

## 🗺️ SVG Track Maps — Still to Draw

These layouts exist in the calendar but use the same SVG as another series. A dedicated SVG would unlock a layout button on the track detail and browser card.

- [ ] **`silverstone-national.svg`** — BTCC uses the shorter National Circuit (Stowe loop), not the full GP layout
- [ ] **`oulton-park-international.svg`** — BTCC alternates between International and Island configs; currently all rounds show the same SVG
- [ ] **`misano-wsbk.svg`** _(low priority)_ — marginal layout difference vs MotoGP; debatable whether worth drawing

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
- [ ] **Delete `data/results.json`** — this file is now redundant; results live in `calendar.json`. Confirm the Results page (`results.astro`) no longer reads from it before deleting. _(Check: results.astro currently still imports `results.json` — needs migrating first or confirming both are in sync)_

---

## 📊 Data — Track Info Gaps

Some tracks have missing or uncertain data. Check `track-data-gaps.md` for the full list. Common gaps:

- [ ] Lap records that are qualifying times not race laps (flagged in track-data-gaps.md)
- [ ] New circuits with no official lap record yet (Madrid F1, new street circuits)
- [ ] Tracks where the era/car of the record doesn't match current series usage

---

## 🔧 Code / Features

- [ ] **Sitemap `lastmod` dates** — currently hardcoded to `2026-06-30`. Update these when content changes significantly, or switch to a build-time generated sitemap
- [ ] **`red-bull-ring-motogp.svg` layout button label** — currently shows "MOTOGP"; consider whether the label should say "MotoGP" (mixed case) for visual consistency with other buttons
- [ ] **Results page — migrate off `results.json`** — `results.astro` currently reads from `data/results.json`. Long term this should read from `calendar.json` the same way `tracks/[slug].astro` does (or keep both in sync manually)
- [ ] **`/tracks/[slug]` title tag** — currently `${venue.name} — Track Guide, Circuit Map & 2026 Race Schedule`. For tracks that don't appear in the 2026 calendar (historic/reserve tracks), the "2026 Race Schedule" part is misleading. Low priority.

---

## 🔍 SEO — Remaining

- [ ] **Submit sitemap to Google Search Console** — `https://dord.racing/sitemap.xml` — do this after v1 deploy
- [ ] **Submit to Bing Webmaster Tools** as well
- [ ] **Google Rich Results Test** — run homepage, an F1 series page, and a track page through [search.google.com/test/rich-results](https://search.google.com/test/rich-results) to verify JSON-LD is parsed correctly
- [ ] **`og:image` dimensions** — once OG images are designed, verify they are exactly 1200×630 and under 200 KB; use Twitter Card Validator to confirm `summary_large_image` renders
- [ ] **Series page meta descriptions** — only F1, MotoGP, and WEC have custom descriptions; consider writing bespoke ones for IndyCar, NASCAR, WSBK, BTCC, WRC (the next-highest traffic series) once the site has some search data to guide keyword targeting

---

## 📣 Launch / Marketing

- [ ] **Post on X (@dord_racing)** announcing v1 launch
- [ ] **Post on Instagram (@dord.racing)** — carousel or reel showing the calendar, track browser, and countdowns
- [ ] **Post on personal X (@YannDurandet)** with link
- [ ] **Submit to motorsport communities** — r/formula1, r/motorsports, r/WEC, r/MotoGP — genuine useful tool, not spam
- [ ] **Reach out to motorsport journalists / newsletter writers** who might link to it
- [ ] **Add to Astro showcase** (astro.build/showcase) — good for Astro SEO backlink

---

## 🔄 Ongoing / Seasonal

- [ ] **Weekly results** — use `grok-results-weekly.md` prompt each Monday to fill in the past weekend's results in `calendar.json`
- [ ] **Calendar corrections** — race dates shift mid-season (reschedules, cancellations); update `calendar.json` and `data/series.json` accordingly
- [ ] **Update `sitemap.xml` `lastmod`** when making significant content updates
- [ ] **End-of-season cleanup** — after Abu Dhabi GP (Dec 6), tag the repo as `v2026-final`, then start a `2027` branch

---

## 🧹 Housekeeping

- [ ] Delete `barcelona-f1.svg` from `public/assets/track-maps/` (orphaned, unreferenced)
- [ ] Confirm and delete `data/results.json` once Results page is fully migrated to `calendar.json`
- [ ] Keep `track-map-status.md` and `track-data-gaps.md` updated as new SVGs are drawn and data gaps are filled
