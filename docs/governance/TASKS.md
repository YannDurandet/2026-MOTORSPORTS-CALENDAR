# Optimization task pool

_Last updated: 2026-11-27. New entropy found during a round is appended here;
closed items move to PROGRESS.md with their round number._

## Open

- [ ] **T-01** `scripts/archive/migrate-dates-into-calendar.mjs` is dead code
  (one-off migration, no references). Candidate for deletion after confirming
  no external references (docs, CI, package.json).
- [x] **T-02 (part)** `watchWeekend.js` was isomorphic but lived in `src/client/`;
  moved to `src/lib/weekend.js` (round 1). Remaining: inline `<script>` blocks in
  `watch.astro` (~118/124), `BaseLayout.astro` (214/529) — review for logic that
  belongs in shared client modules.
- [ ] **T-03** `src/client/main.js` `seriesLabels` chip labels vs calendar
  `tag` vs `seriesShort` — semantics differ per context (see ARCHITECTURE.md);
  keep separate, but verify each consumer uses the right one.
- [ ] **T-04** `workers/newsletter.ts` `SERIES_BADGE` color table duplicates the
  `.t-{slug}` CSS colors in `src/styles/`. Candidate: single source for badge
  colors (either generate CSS from one table or read at build time — the OG
  path already reads CSS; decide one direction). Record as pending product/tech
  decision if it requires a worker-side CSS read.
- [ ] **T-05** `src/pages/embed/[series].astro` inline `define:vars` script —
  check it uses `jsonForScript`-safe embedding or move to a client module.
- [ ] **T-06** Pending product decisions (from docs/code-audit-status.md §3,
  data-only): F-057/058/059/090/021/089/091/092/060 — data fixes, out of scope
  for code governance; tracked there.

## Closed

(moved to PROGRESS.md)
