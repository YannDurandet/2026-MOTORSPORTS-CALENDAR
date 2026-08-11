/**
 * Affiliate link helpers — Awin network.
 *
 * All programmes are currently in "Pending Approval" on Awin.
 * Set PUBLIC_AFFILIATE_LINKS_ENABLED=true in Cloudflare Pages environment
 * variables (Settings → Environment Variables → Production) and trigger a
 * new deploy — no code change required.
 *
 * When disabled (default), buildAwinLink() returns the plain destination URL
 * so the "Plan Your Trip" section remains useful to visitors while approval
 * is pending.
 */

// ── Constants ──────────────────────────────────────────────────────────────────

export const AWIN_AFFILIATE_ID = '2961799';

/** Awin merchant / programme IDs. */
export const MERCHANTS = {
  GETYOURGUIDE_US: 18925,
  VIATOR_US:       11018,
  TRIVAGO_USA:     66034,
} as const;

// TODO: enable Awin tracking once each programme is approved.
export const AFFILIATE_ENABLED =
  import.meta.env.PUBLIC_AFFILIATE_LINKS_ENABLED === 'true';

// ── Link builder ───────────────────────────────────────────────────────────────

/**
 * Builds an Awin deep link for the given destination URL.
 *
 * When affiliate links are disabled (AFFILIATE_ENABLED=false), the plain
 * `destinationUrl` is returned unchanged so the section degrades gracefully.
 *
 * @param destinationUrl  The merchant page to send the user to.
 * @param merchantId      Awin publisher programme ID (see MERCHANTS above).
 * @param clickref        Short placement tag for per-page tracking in Awin
 *                        reporting. Convention: "track-{slug}-{partner}",
 *                        e.g. "track-albert-park-gyg".
 */
export function buildAwinLink(
  destinationUrl: string,
  merchantId: number,
  clickref?: string,
): string {
  if (!AFFILIATE_ENABLED) {
    // TODO: enable Awin tracking once programme approved
    return destinationUrl;
  }

  let url =
    `https://www.awin1.com/cread.php` +
    `?awinmid=${merchantId}` +
    `&awinaffid=${AWIN_AFFILIATE_ID}`;

  if (clickref) {
    url += `&clickref=${encodeURIComponent(clickref)}`;
  }

  url += `&ued=${encodeURIComponent(destinationUrl)}`;
  return url;
}
