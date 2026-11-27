/**
 * Canonical HTTP response helpers (ADR-0001).
 *
 * One implementation for serving JSON: every endpoint that returns a JSON body
 * calls `jsonResponse()` (src/pages/data/*.json.ts, /api/country,
 * /api/subscribe). `application/json` implies UTF-8 (RFC 8259), so no explicit
 * charset parameter is needed. scripts/check-architecture.mjs fails any
 * `new Response(JSON.stringify(...))` left outside this module.
 */
export function jsonResponse(data: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { ...init?.headers, 'Content-Type': 'application/json' },
  });
}
