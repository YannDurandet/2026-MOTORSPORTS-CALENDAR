# Pages UI — status

_Last updated: 2026-11-25_

Content sections and layout work on the event pages (`/events/{year}/{slug}`)
and track pages (`/tracks/{slug}`). Everything below is built and verified:
`npm run check` (data, tokens, season, typecheck 0 errors) and `npm run build`
pass, and the built HTML was read for the F1 Qatar GP event page, the
Monaco / Silverstone / Lusail / Balaton track pages, a 2027 event page
(no stakes), a WRC rally page and a series with no rules entry (Supercars).

## Event pages — done 2026-11-25

- **FAQ** — accordion of 5 questions built from the event's own data (when /
  where / weekend format / how to watch / tickets), plus a matching `FAQPage`
  JSON-LD in `<head>`. One list feeds both, per the rule in `src/lib/faq.ts`
  (answers are plain text, nothing that can go stale in search results).
  Builder: `eventFaqs()` in `src/lib/eventExtras.ts`.
- **Schema** — `GeoCoordinates` added to the SportsEvent `location` when the
  track has `lat`/`lng`; FAQPage added alongside SportsEvent + BreadcrumbList.
- **CHAMPIONSHIP STAKES** — from `data/standings.json` (`stakesFor()`): top-3
  table with flags, leader's gap, rounds complete, "round N of M", link to the
  series page. Current season only — 2027 event pages show no stale standings.
  Visible-only, deliberately not in JSON-LD.
- **RACE FORMAT** — from `data/seriesRules.json` (`raceFormatFor()`): distance
  rule prose, points as P1–Pn chips (Sprint points row only on Sprint
  weekends; zero-value rows like the abolished fastest-lap point fold into
  the note), championship categories as chips. Hidden for series with no
  rules entry. Stakes sits directly above it.
- **Layout (desktop)** — Support races, "Also at {circuit}" and the prev/next
  round nav moved to the right column. Right column order: Tickets → Support
  races → Also at → Getting there → Plan your trip → Newsletter → round nav.
- **HOW TO WATCH** — table rows carry `data-code`; the page script collapses to
  the US row by default (falls back to the `global` row when the series has no
  US entry; without JS all rows show). Buttons: USE MY LOCATION (same
  `/api/country` Cloudflare IP lookup as `/watch`, saved to `dord-country`,
  falls back to worldwide) and SEE ALL, which swaps to SHOW LESS to pull the
  table back to the single row.
- **Session times** — the "Your time" row was removed from the world-clock
  table (script and CSS too).
- **Newsletter card** — now the brand banner background
  (`assets/brand/banner-bg--large.webp` / `--mobile.webp`, `theme-dark` +
  scrim, same image as the homepage header) with the shared
  `NewsletterForm.astro` inline: sign-up without leaving the page.
- **Getting There** — the `affiliate_hooks` keyword bubbles are no longer
  rendered (`GettingThereCard.astro`); Plan Your Trip below keeps the working
  affiliate links. Also applies to track pages, which share the card.

## Track pages — done 2026-11-25

- **LOCATION** — card at the top of the right column: OpenStreetMap embed
  iframe with a marker (no API key) from the track's `lat`/`lng`, plus
  coordinates, address, opened, capacity, region and a "View larger map"
  link. `geo` added to the `SportsActivityLocation` JSON-LD. Tracks without
  lat/lng (26 of 136) get no card and no geo.
- **CIRCUIT RECORDS** — after Layouts: the flat `records` list reduced to the
  outright time per category (`fastestRecords()` in `src/lib/trackExtras.ts`),
  fastest first; first 12 rows shown, the rest behind an "All N categories"
  details (Silverstone: 212 raw rows → ~32 categories). Rows with no `time`
  are skipped — a few malformed Indianapolis entries carry a date in
  `driver` instead.
- **ROLL OF HONOUR** — after Results/Upcoming: winners at the venue across
  every season in `calendar.json`, grouped by series, newest first, event
  titles linking to their event pages (`rollOfHonourForTrack()`).
- **PHOTOS** — at the end of the left column: Wikimedia Commons grid,
  lazy-loaded with `referrerpolicy="no-referrer"`, caption + "© author ·
  licence" credits, each image linked to its Commons file page.

## Still open

- `NewsletterForm` on the series season pages + one real sign-up test per
  surface (tracked in `code-audit-status.md` §4, F-068).
- Records data quirks left as-is (data pass, not UI): e.g. Monaco's `fe`
  record "0:52.385" (2019 ePrix) is bogus and now sorts first there.
- The browser preview panel was unavailable in the session that built this, so
  the layout was verified from built HTML, not visually.
