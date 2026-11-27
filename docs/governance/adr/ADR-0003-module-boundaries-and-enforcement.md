# ADR-0003 — Module boundaries are machine-enforced

- Date: 2026-11-27
- Status: accepted (implemented in governance round 1)

## Context

The codebase had implicit layering: nothing stopped a `src/lib` module from
importing a page, a client script from reaching into `src/lib`, or an import
cycle from appearing. The conventions were documented but not enforceable.

## Decision

`scripts/check-architecture.mjs` runs in `npm run check`, which CI
(`.github/workflows/deploy.yml`) executes before every deploy. Rules:

- **A1** No circular imports anywhere in `src/` + `workers/` (DFS over the
  static import graph, frontmatter included; inline `<script>` imports tracked
  separately as browser-side edges).
- **A2** Layer direction: `src/lib` → lib+data only; UI (pages/components/
  layouts/integrations) → UI+lib+data; `workers/` → workers+lib+data; nothing
  in `src/` imports `scripts/` or `workers/`. Browser-side code (`src/client/*`
  and inline scripts) may import `src/client/*` and only those `src/lib`
  modules whose transitive closure uses no node builtins, no
  `cloudflare:workers`, no `process`/`import.meta.env` (computed per run).
- **A3** JSON responses come only from `jsonResponse()` (`src/lib/http.ts`).

Consequences: one isomorphic module was found misplaced in `src/client/`
(`watchWeekend.js`) and moved to `src/lib/weekend.js` in the same round. All
rules were negative-tested (a planted cycle, a hand-rolled JSON Response, and
an unresolved import each fail the check).
