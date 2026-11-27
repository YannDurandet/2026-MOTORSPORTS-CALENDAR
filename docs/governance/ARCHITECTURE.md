# Architecture Map — 2026 Motorsports Calendar (dord.racing)

_Last updated: 2026-11-27 (governance round 0). Maintained by the architectural
governance loop; see PROGRESS.md for the round log and TASKS.md for the open pool._

## What this product is

A static-first Astro 7 site (Cloudflare Workers adapter, prerendered pages)
that publishes a multi-series motorsport calendar (2026 season + published 2027
rounds), event/track/series pages, iCal feeds, search, a newsletter
(double opt-in via Resend + Turso), and build-time OG share cards. A separate
Cloudflare Worker (`workers/`) sends the weekly newsletter on cron.

## Technology stack

- **Site**: Astro 7 + `@astrojs/cloudflare`, TypeScript, prerendered pages +
  a few dynamic API routes (`src/pages/api/*`).
- **Data**: canonical JSON files in `data/` (see "Single source of truth" below).
  No database for content; Turso (libsql) only for the newsletter subscriber list.
- **Build-time codegen**: `scripts/*.mjs` (Node ≥ 22 runs `.ts` imports directly).
  `npm run check` is the gate; it runs in CI (`.github/workflows/deploy.yml`)
  before every deploy.
- **Workers**: `workers/newsletter.ts` + `workers/sendBatches.ts`, deployed
  separately with wrangler.
- **Share images**: `src/integrations/og.ts` (`astro:build:done` hook, satori+sharp).

## Module map and dependency direction

```
data/*.json            canonical data (SSOT — nothing else may re-derive it)
   ▲
src/lib/               domain logic, imports data/, no imports from pages/components
   ▲          ▲
src/integrations/  src/pages/ + src/components/ + src/layouts/   (UI layer)
src/client/            browser-only modules (import only sibling client modules)
scripts/               Node tooling; imports data/ + selected src/lib modules
workers/               newsletter worker; imports data/ + selected src/lib modules
```

Rules (enforced by `scripts/check-architecture.mjs`, wired into `npm run check`):

1. `src/lib` is acyclic (checked by import-graph walk).
2. `src/client/*` may only import from `./` (sibling client modules) — never
   from `src/lib`, `src/pages`, `data/`, or node builtins.
3. `src/pages` / `src/components` / `src/layouts` import from `src/lib` and
   `data/`; they never import from `src/client` (pages reference client
   scripts by `<script src>` only).
4. `data/*.json` is the only source of calendar/series/track/standings content.
   Code may read it, never re-state it (a hardcoded per-series table in code is
   a violation — see ADR-0002).

## Single source of truth table

| Concept | Authoritative source | Notes |
|---|---|---|
| Calendar events | `data/calendar.json` | month → week → events; `year` per month |
| Event page slugs/URLs | `src/lib/eventSlugs.js` (+ `src/lib/events.ts`) | shared with `scripts/check-data.mjs` |
| Series content/meta | `data/seriesContent.json` | name, category, region, tier, prose |
| Series race index | `data/series.json` (generated: `npm run gen:series`) | |
| Tracks | `data/tracks.json` | |
| Standings | `data/standings.json` | |
| Series rules | `data/seriesRules.json` | |
| Support series | `data/supportSeries.json` | |
| Seasons manifest | `data/seasons.json` (generated: `npm run gen:season`) | |
| Current season year | `DEFAULT_CALENDAR_YEAR` in `src/lib/season.ts` | literal years elsewhere are rejected by `scripts/check-season.mjs` |
| Event session times | `time` field in `data/calendar.json`; parsed by `src/lib/sessions.ts` | TBC rule in `src/lib/tbc.ts` |
| Venue → timezone | `src/lib/timezones.ts` + `src/lib/venues.ts` | |
| Unsub/confirm tokens | `src/lib/unsub-token.ts` | shared site ↔ worker |
| Week anchors | `weekAnchor()` in `src/lib/season.ts` | shared site ↔ worker ↔ search |
| Display helpers | `src/lib/format.ts` | |
| iCal generation | `src/lib/ics.ts` | static + dynamic feeds |
| OG cards | `src/lib/og.ts` (render) + `src/integrations/og.ts` (build hook) + `src/lib/ogPaths.ts` (URLs) | |
| Inline JSON safety | `src/lib/jsonForScript.ts` | mandatory for `<script type="application/json">` |
| JSON HTTP endpoints | `jsonResponse()` in `src/lib/http.ts` (ADR-0001) | all `src/pages/data/*.json.ts` |
| Standalone auth pages (confirm/unsubscribe) | `src/lib/standalonePage.ts` (ADR-0001) | shared CSS + HTML shell + escaping |
| Affiliate links | `src/lib/affiliates.ts` | build-time switch |
| Client timezone conversion | `src/client/tz.js` | Paris-source conversion in the browser |
| Scripts toolbox | `scripts/lib.mjs` | checks + apply tools share it |

## Known accepted multi-context labels (NOT merged — different semantics)

- calendar event `tag` ("FORMULA 1") — server-rendered badge on rows/cards
- `seriesLabels` in `src/client/main.js` ("F1") — client-rendered filter/strip chips
- `SERIES_BADGE.abbr` in `workers/newsletter.ts` ("F1") — email badge look
- `seriesShort()` in `src/lib/seriesShort.ts` ("F1") — `<title>`/headings

These are display contexts with different length budgets; merging them would
couple unrelated consumers. Recorded here so nobody "cleans them up" blindly.

## State ownership

- **Build-time state**: none mutable; everything derives from `data/` + code.
- **Runtime state**: newsletter subscribers in Turso (`db/schema.sql`);
  browser state in `localStorage` (`motorsportFilters`, `tzOverride`,
  `dord-country` — owned by `src/client/main.js`, `src/client/tz.js`,
  `src/client/country.js` respectively).
- **Caches**: IndexNow hashes `.indexnow-hashes.json` (CI cache only).

## Duplicate implementations / deviations found in round 0

Recorded in TASKS.md; closed items move to PROGRESS.md.
