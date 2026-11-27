# Governance progress log

Each round must be a closed loop: scan → analyze callers → migrate → delete old →
review → verify (`npm run check` + build) → enforce → record. One commit per batch.

Baseline before round 0: `npm run check` exit 0 (0 errors, 0 warnings).

## Round 0 — 2026-11-27 — scaffolding

- Created `docs/governance/` (ARCHITECTURE.md, TASKS.md, PROGRESS.md, `adr/`).
- Built the architecture map: module boundaries, SSOT table, dependency rules.
- Findings recorded in TASKS.md (T-01…T-06).

## Round 1 — 2026-11-27 — canonical HTTP layer + enforceable architecture

Closed loop: scan found 4 identical JSON endpoint bodies, 2 near-identical
standalone-page shells, 1 stray empty file, and 1 isomorphic module misplaced
in `src/client/`.

- ADR-0001: `src/lib/http.ts` (`jsonResponse`) is now the only JSON Response
  builder — migrated all 4 `src/pages/data/*.json.ts`, `/api/country`,
  `/api/subscribe`. `src/lib/standalonePage.ts` is the one shell for
  `/api/confirm` + `/api/unsubscribe` (union CSS, full `escapeHtml`; the
  unsubscribe page now also sends `noindex` + `private, no-store` like confirm —
  both carry per-recipient tokens, recorded in the ADR).
- Deleted stray empty `tparse.py`.
- Moved `src/client/watchWeekend.js` → `src/lib/weekend.js`: it is pure/
  isomorphic (used at build time AND in the browser), so it belongs in lib;
  `watch.astro` updated. This removed the only ui→client frontmatter import.
- New `scripts/check-architecture.mjs` wired into `npm run check` (runs in CI
  via deploy.yml): A1 no import cycles (78 files / 206 edges), A2 layer
  direction + browser-safety of client-side imports (transitive node-builtin
  scan), A3 canonical `jsonResponse`. Negative-tested: cycle, hand-rolled JSON
  response, and unresolved import each fail the check.
- Verified: `npm run check` exit 0, 0 errors/warnings (baseline preserved).

Commits: `5158c70` (refactor), `8b84f79` (enforcement).

## Round 2 — 2026-11-27 — series metadata SSOT (ADR-0002)

Closed loop: the hardcoded `seriesMetadata` table in `src/client/main.js`
duplicated `data/seriesContent.json` and had drifted (bgt region, asian-le-mans
region); `check-data.mjs` had to scrape main.js by regex to keep them in sync.

- `index.astro` now embeds a `#series-meta` JSON projection of seriesContent;
  main.js derives the lookup, series order and region/category vocabularies
  from it. Deleted the 26-entry hardcoded table.
- Anti-regression: `check-data.mjs` fails if `const seriesMetadata` reappears
  in main.js (replacing the old key-sync check).
- Filter button label falls back to `slug.toUpperCase()` instead of "undefined".
- Verified: `npm run check` exit 0; `npm run build` exit 0; built index.html
  carries all 26 series in `#series-meta`; bundled main.js has no per-series
  table. Deliberate change recorded in ADR-0002 (region buttons now reflect the
  data: +"United Kingdom", +"International").

## Round 3 — pending

## Round 3 — pending
