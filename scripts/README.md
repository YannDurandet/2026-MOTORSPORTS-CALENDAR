# scripts/ — the map

One folder, four kinds of tools. **Read `lib.mjs` first**: every script imports
its shared helpers from there (paths, JSON I/O, the calendar walker, Paris-time
math, the season constant, CLI parsing, the check accumulator). Nothing is
copy-pasted between scripts anymore.

```
data/calendar.json  ── the single source of truth (hand-edited + patched by the apply tools)
        │
        ├── gen-series.mjs ───────────► data/series.json      (derived; never edit by hand)
        ├── gen-season-files.mjs ─────► public/manifest.webmanifest, public/llms.txt
        ├── gen-track-map-status.mjs ─► docs/track-map-status.md
        └── everything else reads it directly
```

## 1. Checks — run `npm run check` before every commit

| File | What it guards |
|---|---|
| `check-data.mjs` | The big one: calendar ↔ series.json ↔ tracks.json ↔ standings.json consistency, event URLs stable, flags/SVGs on disk, sessions vs `time`, redirects unique |
| `check-support-series.mjs` | `data/supportSeries.json` catalog + `status`/`source` on session rows |
| `check-tokens.mjs` | No colour/font/size/radius literals in site CSS — tokens only |
| `check-season.mjs` | No season year typed as a literal in `src/` or `workers/` (rollover = one constant) |

All four accumulate failures via `collector()` from `lib.mjs` and exit 1 with a
list. `gen-season-files.mjs --check` and `gen-track-map-status.mjs --check` are
checks too (they verify the committed file matches what they'd write).

## 2. Generators — data or assets in, derived file out

| Command | File | Output |
|---|---|---|
| `npm run gen:series` | `gen-series.mjs` | `data/series.json` from `calendar.json` (`buildSeries()` is also imported by `check-data.mjs` so the two can't drift) |
| `npm run gen:season` | `gen-season-files.mjs` | `public/manifest.webmanifest` + `public/llms.txt` for the season in `src/lib/season.ts` |
| `npm run gen:map-status` | `gen-track-map-status.mjs` | `docs/track-map-status.md` inventory of the track-map SVGs |
| `npm run gen:icons` | `gen-icons.mjs` | favicons / PWA icons from `src/assets/dord-mark.png` |
| `npm run gen:series-images` | `gen-series-images.mjs` | 640px `*-640w.webp` variants of the /series grid images |
| `npm run gen:track-pngs` | `export-track-pngs.mjs` | email-sized PNGs of every track SVG |

## 3. Write tools — the weekly "research → patch" loop

Each takes a researched JSON file and merges it into the data, validating first
and refusing to write on any problem:

| Command | File | Patches |
|---|---|---|
| `npm run results:gaps` / `results:brief` / `results:apply <file>` | `results-sync.mjs` | `calendar.json` `event.results` |
| `npm run standings:stale` / `standings:apply <file>` | `standings-sync.mjs` | `data/standings.json` |
| `npm run times:prompt` → `times:apply <file>` | `gen-time-prompt.mjs` → `apply-times.mjs` | TBC race times + `date` in `calendar.json` |
| `npm run sessions:apply <file>` | `apply-sessions.mjs` | `event.sessions` / `event.sub` in `calendar.json` (dry run unless `--write`) |

Events are located by `series` + `title` + `weekLabel` via `findEvents()` in
`lib.mjs`. Times are Paris time; `parisClock`/`parisIsoAt` do the DST math.

## 4. Ops & helpers

| File | Purpose |
|---|---|
| `indexnow.mjs` (`npm run indexnow`) | Submit new/changed pages to Bing & co after a deploy; CI runs it |
| `test-unsub-token.mjs` (`npm run test:unsub`) | Generate/verify newsletter unsubscribe tokens locally (needs `UNSUB_SECRET`) |
| `tz.mjs` | One-off calculator: circuit-local time → Paris time (`node scripts/tz.mjs "2026-11-21 20:00" America/Los_Angeles`) |
| `lib.mjs` | The shared toolbox (not a command) |
| `archive/` | Completed one-off migrations, kept for history — don't run |

## Not code

- `dist/**/*.mjs` — Astro build output (gitignored; `npm run clean` removes it).
- `agent-tasks/` — gitignored scratch from agent runs (audits, one-off fix
  scripts); safe to delete.
- `astro.config.mjs` — the Astro config, lives at the root.
- Browser JavaScript lives in `src/client/` (not here — this folder is Node tooling).
