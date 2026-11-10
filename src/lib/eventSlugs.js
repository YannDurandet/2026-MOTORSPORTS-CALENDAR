/**
 * Which calendar events get a page, and under which slug.
 *
 * Plain JavaScript so that both src/lib/events.ts (the site) and
 * scripts/check-data.mjs (`npm run check`) import it: the check then validates
 * exactly the URLs the build produces, not a hand-kept copy (AUDIT F-028).
 *
 * Slugs must never shift once a page is indexed, so they come only from the
 * event itself (series, title, a pinned `slug`, and its month when needed).
 */

export const MONTH_ABBR = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** @param {string} input */
export function slugify(input) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip accents: Goiânia → goiania
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * tbc/tbd are placeholder infographics for unannounced venues: no page,
 * unless the event names its venue inline (circuit known, map not drawn yet).
 * @param {{ track?: string, venue?: unknown }} ev
 */
export function hasEventPage(ev) {
  if (!ev.track) return false;
  return !((ev.track === 'tbc.svg' || ev.track === 'tbd.svg') && !ev.venue);
}

/**
 * The final slug of each page, in input order. `slug` pins the URL when a
 * title changes after the page went live; otherwise it is series + title.
 * A slug used twice in one year (the series visits twice, e.g. the Jeddah
 * E-Prix) gets the event's month, "-feb", so reordering the calendar can't
 * move it.
 * @param {{ year: number, ev: { slug?: string, series: string, title: string, date: string } }[]} pages
 * @returns {string[]}
 */
export function pageSlugs(pages) {
  const bases = pages.map(({ ev }) => ev.slug ?? slugify(`${ev.series}-${ev.title}`));
  /** @type {Map<string, number>} */
  const counts = new Map();
  pages.forEach(({ year }, i) => {
    const key = `${year}/${bases[i]}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return pages.map(({ year, ev }, i) => {
    const month = MONTH_ABBR[new Date(ev.date).getUTCMonth()] ?? '';
    return (counts.get(`${year}/${bases[i]}`) ?? 0) > 1 && month ? `${bases[i]}-${month}` : bases[i];
  });
}
