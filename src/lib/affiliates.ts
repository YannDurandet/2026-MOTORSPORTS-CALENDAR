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

// ── Accommodation targeting ────────────────────────────────────────────────────

/**
 * Derives a hotel-search destination from a track's `logistics.accommodation_hub`.
 *
 * The hub is deliberately NOT the venue city on many tracks — fans base in
 * Haarlem for Zandvoort, Milton Keynes for Silverstone, Nagoya for Suzuka — so
 * searching the hub converts far better than searching the circuit's town.
 *
 * The field is prose ("Haarlem — 20 minutes by train and far better value…"),
 * so we take the first named place and drop the explanatory clause. Anything
 * that doesn't look like a place name (too long, too many words, or a phrase
 * like "On-site camping is the norm") falls back to `fallbackCity`, which is
 * always safe.
 *
 * @param hub          logistics.accommodation_hub, if present.
 * @param fallbackCity venue.city — used whenever extraction is not confident.
 */
export function accommodationQuery(
  hub: string | undefined | null,
  fallbackCity: string,
): string {
  if (!hub) return fallbackCity;

  const head = hub
    .replace(/\([^)]*\)/g, ' ')        // drop parentheticals: "(Eixample or Gràcia)"
    .split(/[—–;]|\s-\s/)[0]           // drop the explanatory clause after the dash
    .split(/\s+(?:or|and)\s+/i)[0]     // first named place only
    .split(',')[0]
    .replace(/\s+for\b[\s\S]*$/i, '')  // "Concord and Kannapolis for proximity"
    .replace(/\s+/g, ' ')
    .trim()
    // Trailing filler that weakens a hotel search. Runs after whitespace is
    // normalised so the `$` anchors actually bite. Deliberately does NOT strip
    // a bare "city"/"town" — that would turn "Kansas City" into "Kansas".
    .replace(/^\S+'s\s+/, '')          // "Goiânia's Setor Bueno" → "Setor Bueno"
    .replace(/\s+(?:city|town)\s+cent(?:re|er)$/i, '')
    .replace(/\s+(?:cent(?:re|er)|village|itself)$/i, '')
    .trim();

  const words = head ? head.split(' ') : [];
  if (!head || words.length > 4 || head.length > 34) return fallbackCity;
  // "On-site camping is the norm", "The on-site hotel overlooks the circuit"
  if (/^(on[- ]site|the)$/i.test(words[0])) return fallbackCity;

  return head;
}
