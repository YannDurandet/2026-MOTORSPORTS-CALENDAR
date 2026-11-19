# dord.racing — 2026 Motorsport Calendar

An independent, open master calendar for the 2026 motorsport season: F1, WEC,
MotoGP, IndyCar, NASCAR and ~20 more series — every race weekend, track,
result and broadcaster list in one place. Astro (static build) on Cloudflare
Workers, with hand-curated JSON as the only data store. Live at
<https://dord.racing>.

## Quick start

Requires Node ≥ 22 (22.18+ so the scripts can import `.ts` files directly).

```sh
npm ci
npm run dev        # local dev server
npm run check      # data + generated-file + token + season checks — run before every commit
npm run build      # static build into dist/
```

Deploy happens in CI (`.github/workflows/deploy.yml`) on every push to `main`.
Secrets live in Cloudflare, never in the repo — copy `.env.example` to `.env`
for local values (it is gitignored).

## Repo map

```
data/        the content. calendar.json is the single source of truth;
             series.json and public/llms.txt + manifest.webmanifest are generated from it
src/         the site
  pages/       routes (incl. api/ and data/ JSON endpoints)
  components/  Astro components
  layouts/     BaseLayout
  lib/         shared TypeScript (events, season, formatting, …)
  client/      browser JavaScript (homepage calendar, timezone, country picker)
  styles/      tokens.css (design tokens — the only place colours/sizes live) + page CSS
  assets/      source artwork (icons are generated from here)
scripts/     Node tooling — see scripts/README.md; shared helpers in scripts/lib.mjs
docs/        status docs (docs/track-map-status.md is generated; the rest are working notes)
workers/     the newsletter Cloudflare Worker (separate wrangler deploy)
public/      served as-is: llms.txt, manifest, _redirects, sw.js, assets/
db/          Turso subscriber schema (apply once by hand)
```

## The weekly loop

Race results and session times are researched, then merged deterministically:

```sh
npm run results:gaps            # what's missing
npm run results:brief > b.json  # fill in the winners…
npm run results:apply b.json    # validated merge into data/calendar.json
npm run gen:series && npm run check
```

Same pattern for standings (`standings:stale` / `standings:apply`), race times
(`times:prompt` / `times:apply`) and session timetables (`sessions:apply`).
All commands are listed in `scripts/README.md` and in `CLAUDE.md`.

## Housekeeping

- `npm run check` must pass before committing (CI runs it too).
- `npm run clean` deletes local build state (`dist/`, `.astro/`, `.wrangler/`, IndexNow hashes).
- The season year is one constant — `DEFAULT_CALENDAR_YEAR` in `src/lib/season.ts`.
  Roll over with that + `npm run gen:season` + `npm run check`.
- `CLAUDE.md` holds the full project notes (data shapes, page inventory, conventions).
