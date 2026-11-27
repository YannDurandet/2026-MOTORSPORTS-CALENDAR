# ADR-0002 — Series metadata has one source: data/seriesContent.json

- Date: 2026-11-27
- Status: accepted (implemented in governance round 2)

## Context

`src/client/main.js` carried a hardcoded `seriesMetadata` table
(name/category/region per series slug) that duplicated
`data/seriesContent.json`. It had already drifted: `bgt` was "Europe" in code
vs "United Kingdom" in the data; `asian-le-mans` was "Worldwide" in code vs
"International" in the data. `scripts/check-data.mjs` had to regex the keys out
of main.js to keep the two in sync — a single requirement (add a series)
needed synchronized edits in unrelated files.

## Decision

- `src/pages/index.astro` embeds a slim projection of `seriesContent.json`
  (`{slug, name, category, region}`) as the `#series-meta` JSON block
  (via `jsonForScript`, so it is XSS-safe).
- `main.js` builds its lookup, series list and the region/category filter
  vocabularies from that block. Region/category buttons are derived from the
  data, ordered by a canonical list with new values appended.
- The chip-label table (`seriesLabels`) stays in main.js on purpose: chip
  labels ("24H EU"), email badge abbrs ("24H") and `<title>` short names are
  different display contexts with different length budgets; merging them
  would couple unrelated consumers (see ARCHITECTURE.md). The filter button
  now falls back to `slug.toUpperCase()` instead of rendering "undefined".
- `check-data.mjs` no longer scrapes main.js for metadata keys; instead it
  fails if `const seriesMetadata` ever reappears in client code
  (anti-regression for this ADR).

## Consequences

- Adding/renaming/classifying a series is now a one-file change
  (`data/seriesContent.json`); the home-page filters follow automatically.
- Deliberate behavior change: the region filter gains "United Kingdom" and
  "International" buttons, because that is what the data actually says (the
  old hardcoded table had drifted). No series disappears when no filter is
  active.
- Verified: `npm run check` exit 0; `npm run build` exit 0; the built
  `index.html` carries 26 `#series-meta` entries and the bundled main.js no
  longer contains a hardcoded per-series table.
