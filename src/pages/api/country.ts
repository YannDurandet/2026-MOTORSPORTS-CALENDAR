// ============================================================================
// /api/country — the visitor's country, as Cloudflare sees it
// ============================================================================
//
// Used by the "Use my location" button in the watch-options popup
// (src/components/CountryDialog.astro → src/scripts/country.js).
//
// Cloudflare already derives a country from the connection's IP address for
// every request it serves; this just hands that two-letter code back to the
// visitor who asked for it. Nothing is logged, stored or forwarded, and the
// browser's Geolocation API (GPS / Wi-Fi coordinates) is never involved.
//
// Never cacheable: a shared cache would serve one visitor's country to the next.
//
// Returns { "country": "FR" }, or { "country": null } when Cloudflare can't say
// (local dev, Tor, unknown), in which case the popup falls back to its dropdown.
// ============================================================================

export const prerender = false;

import type { APIRoute } from 'astro';

// Cloudflare's placeholders for "unknown" and "Tor exit node".
const NOT_A_COUNTRY = new Set(['XX', 'T1']);

export const GET: APIRoute = ({ request }) => {
  const raw: unknown =
    (request as Request & { cf?: { country?: string } }).cf?.country ??
    request.headers.get('cf-ipcountry');

  const country =
    typeof raw === 'string' && /^[A-Z]{2}$/.test(raw) && !NOT_A_COUNTRY.has(raw) ? raw : null;

  return new Response(JSON.stringify({ country }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, no-store',
    },
  });
};
