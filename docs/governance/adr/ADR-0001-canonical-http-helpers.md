# ADR-0001 — Canonical HTTP helpers for JSON endpoints and standalone pages

- Date: 2026-11-27
- Status: accepted (implemented in governance round 1)

## Context

`src/pages/data/*.json.ts` contained four copies of the same 3-line
`new Response(JSON.stringify(...), { headers: { 'Content-Type': 'application/json' } })`
block, and `src/pages/api/confirm.ts` + `src/pages/api/unsubscribe.ts` each carried
their own near-identical standalone-HTML CSS shell, `escapeHtml`, and page builder.
Same semantics, N implementations → drift risk (e.g. a Content-Type or escaping
fix applied to one copy only).

## Decision

- `src/lib/http.ts` exports `jsonResponse(data)` — the single implementation for
  serving JSON with the canonical content type. All `src/pages/data/*.json.ts`
  endpoints call it.
- `src/lib/standalonePage.ts` exports the single standalone-page shell (CSS,
  `escapeHtml`, `standalonePage(title, body, status)`) used by `/api/confirm`
  and `/api/unsubscribe`. The union of the two previous CSS blocks is kept so
  both pages render identically.

## Consequences

- One place to change JSON serving or the standalone page look.
- `scripts/check-architecture.mjs` fails if a `src/pages/data/*.json.ts` endpoint
  builds its own `Response` instead of calling `jsonResponse`.
- No behavior change: bytes served are identical (same headers, same JSON).
