# Event & Track Pages — Research & Data Status

_Last updated: 2026-11-26_

Scope: the rework of `/events/{year}/{slug}` and `/tracks/{slug}` (purpose split + SEO),
fed by a 2027 research program — 232 event pages, 124 venues (110 circuits + 13 rally rounds + 1 TBC).
Allowed sources: official series/circuit/FIA websites + Wikipedia/Wikidata/Wikimedia Commons only.
Raw research + per-fact sources: `agent-tasks/research-2027/out/` (gitignored); contract: `agent-tasks/research-2027/CONTRACT.md`; full report: `agent-tasks/research-2027/REPORT.md`.

## ✅ Done

### Merged into `data/` (commit `f52ad9d`, 2026-11-21; `npm run check` 9325 pass, typecheck 0 errors, build pass)

- **`data/tracks.json`** enriched for all 110 circuits hosting 2027 events: `lat`/`lng`/`address`/`opened`/`capacity`/`designer`/`surface`/`wikipedia`/`wikidata`, `records[]` (5,140 per-series lap records), `logistics` extended with `parking`/`gates`/`camping`/`grandstands`/`accessibility`/`public_transport` (official circuit sites only, no invented prices), `photos[]` (418 free-licensed Commons images) + `onboard_video`, `corners[]` (wave 1: 15 F1 circuits), `climate.race_months[]` (58 circuits).
- **`data/events2027.json`** (new): all 232 event slugs → `wikipedia`, `official_url`, `first_edition`/`edition_2027`, `race_format` (laps/distance, 86 events), `notes_2027` (confirmed 2027 hooks), `status_2027`, `roll_of_honour` (wave 1: 61 slugs), `rally` detail + rally geo (15 WRC rounds).
- **`data/seriesRules.json`** (new): 20 series — race-distance rules, points, 2027 weekend formats.
- **Madring fix**: `madrid-f1` length 5.414 km (was 5.474), `type: "street"`.
- `tsconfig.json` excludes `agent-tasks/research-2027` scratch files.

### Wave-2 research (6 agents, complete; in `out/w2-*/`, NOT yet merged)

- **Roll of honour re-pulled via wikitext**: `roll-v2.json` — 203/232 slugs with winners, 8,319 rows (f1 24/24, wrc 15/15, motogp 22/22, wsbk 12/12, wec 9/9…).
- **Corners**: `corners-v2.json` — 56 circuits, 866 corners; all 24 F1 + all 21 MotoGP 2027 circuits.
- **Circuit facts**: `f1facts.json` (24 F1) + `tier1-facts.json` (45 more) — longest straight/top speed/DRS/elevation where sourced; conflicts vs `tracks.json` logged.
- **Media gaps**: `media-v2.json` — photos for sandiego/madring/arlington/markham, 7/7 missing onboards (official channels, oEmbed-verified), 2 wrong-circuit videos fixed.
- **2027 entry lists**: `entries-2027.json` — 9 series, 124 teams, 294 named drivers; MotoGP + WSBK grids fully confirmed.
- **Race formats**: `race-format-v2.json` — all 146 remaining events (51 confirmed / 31 expected / 64 not published yet).
- **Climate finished** (wave-1 straggler): 124/124 venues; 52 circuits still to merge.

### Key 2027 findings (confirmed on official sources)

- **F1**: 24 GPs, 10 sprint weekends, **290 km race distance in 2027 only** (Monaco 260 km); Madrid Madring replaces Barcelona; Turkish GP returns; fastest-lap point abolished since 2025.
- **WRC**: 15 rounds fully confirmed (FIA WMSC 2026-10-08); new Rally d'Italia Rome (tarmac), Rally US (Knoxville), Rally Scotland (Aberdeen); Saudi Arabia finale; Portugal dropped.
- **MotoGP**: 850 cc + Pirelli from 2027, new Friday Sprint Quali; full grid announced 2026-10-20. **WSBK**: Michelin from 2027; grid announced 2026-11-09.
- **WEC**: Ford + McLaren Hypercar in, Alpine/Peugeot out. **NASCAR**: Dodge returns via Kaulig. **FE**: 12 teams (Fusion, Opel GSE, Citroën added).

## ✅ Wave-2 merged (after page rework commit `ec20c49`; this commit; check 9325 pass, build pass)

1. ✅ F1 290 km crosscheck applied — 23/24 F1 `race_format` corrected in `events2027.json` (e.g. Bahrain 54 laps / 292.248 km).
2. ✅ `roll-v2` → `roll_of_honour` in `events2027.json`: 228 slugs enriched, 203 with full winners tables (8,319 rows; e.g. Monaco GP 86 winners since 1929).
3. ✅ `corners-v2` → `tracks.json`: 55 circuits with corner guides (866 corners).
4. ✅ climate → all 110 2027 circuits now have `climate.race_months`.
5. ✅ `media-v2` → `tracks.json`: gap photos + 7 onboard videos (2 wrong-circuit fixes).
6. ✅ `f1facts`/`tier1-facts`: 29 fact fields added where absent (DRS/elevation/top speed/longest straight). Conflicts NOT overridden — still need Yann's ruling: red-bull-ring 4.326 vs 4.318, watkins-glen 5.552 vs 3.949, turn-count diffs, charlotte roval.
7. ⏳ `istanbul-park`: still no track entry/slug (`f1-turkish-gp` has `trackSlug: null`) — needs a map SVG before a track entry can exist.
8. ✅ `data/entries2027.json` (new): 9 series, 124 teams, 294 named drivers.

## ❌ Still missing / follow-ups

- Unpublished at 2026-11-21 (re-check Dec 2026+): MotoGP per-GP laps, 12 WRC stage itineraries, BTCC per-circuit laps, FE/Super Formula/IndyCar-road 2027 lap counts, NLS/H24EU/BGT 2027 calendars.
- F1 full FIA entry list (expected Dec 2026); per-event IMSA/NASCAR/WRC entry lists from Jan–Feb 2027.
- 29 roll slugs without winners (22 NASCAR venue-only → remap to race-level articles; 7 stub events).
- DRS zones for 18/24 F1 circuits (need FIA per-event supplementary regulations); elevation/top speed stated for few circuits.
- 12 remaining tier-1 corner guides; sanya photo; Adelaide MotoGP onboard.
- 3 date discrepancies vs Wikipedia (f1-las-vegas-gp, imsa-6-hours-of-road-america, elms-4-hours-of-portimao-finale) — see `out/r27-eventmeta/NOTES.md`; `events-2027.json` unchanged.

## Page rework itself

Done in a separate Vibe session: event page (FAQ + FAQPage schema, race format/laps, stakes, full results, watch surfacing, schema geo/offers/sameAs) and track page (geo + map, records, roll of honour, photos, corners, climate, FAQ, comparisons). This doc tracks the data side only.
