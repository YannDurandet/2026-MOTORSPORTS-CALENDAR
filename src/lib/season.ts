/**
 * Which calendar seasons appear where.
 *
 * `data/calendar.json` is an array of month objects, each with an explicit
 * `"year"` (`npm run check` enforces it, and that every event's date falls in
 * it). `monthYear()` still falls back to DEFAULT_CALENDAR_YEAR for a month
 * object that has none.
 *
 * Track pages (the browser grid and each `/tracks/[slug]`) group events by
 * venue rather than by date, so a 2027 round shows up as a second, undated-
 * looking row right next to its 2026 equivalent — 39 tracks were listing the
 * same race twice. Until the 2027 calendar is complete they are filtered to
 * the current season. The main calendar, search index and ICS feeds still
 * carry both years.
 *
 * ROLLING THE SITE OVER TO THE NEXT SEASON
 * Change DEFAULT_CALENDAR_YEAR, then run `npm run gen:season` and
 * `npm run check`. Everything that names the season follows the constant:
 * page titles, headings, descriptions, structured data, share cards, feeds,
 * the footer, TRACK_PAGE_YEARS, and (through gen:season) the web manifest and
 * llms.txt. Never write the season year as a literal in a template:
 * `npm run check` fails on it (scripts/check-season.mjs).
 *
 * What does NOT follow by itself is prose written about one season. It lives
 * in two files that say which season they cover, and falls back safely until
 * it is rewritten: src/lib/faq.ts (hidden while FAQ_SEASON is not the current
 * season) and src/lib/seasonCopy.ts (series descriptions, generated from the
 * calendar for a season with no hand-written text).
 *
 * To show another season on track pages as well, add it to TRACK_PAGE_YEARS.
 */

/** The season the site presents as current; the fallback for a month with no `year`. */
export const DEFAULT_CALENDAR_YEAR = 2026;

/** Seasons rendered on track pages. */
export const TRACK_PAGE_YEARS: ReadonlySet<number> = new Set([DEFAULT_CALENDAR_YEAR]);

/** Resolve a calendar month's year, defaulting untagged months. */
export function monthYear(month: { year?: number }): number {
  return month.year ?? DEFAULT_CALENDAR_YEAR;
}

/**
 * The id (and URL hash) of a week's card on the home calendar. The current
 * season keeps the short `week-12` form, so existing deep links hold; any other
 * season is prefixed with its year, `2027-week-12`, so the two never collide.
 * `weekNum` is the label's digits as written ("03", not 3). Used by the home
 * page, the search index and the newsletter worker: keep it the only copy.
 */
export function weekAnchor(year: number, weekNum: string | number): string {
  return year === DEFAULT_CALENDAR_YEAR ? `week-${weekNum}` : `${year}-week-${weekNum}`;
}

/** True when this month's events should appear on track pages. */
export function showOnTrackPages(month: { year?: number }): boolean {
  return TRACK_PAGE_YEARS.has(monthYear(month));
}

/**
 * Series whose season straddles New Year, mapped to the first month (1–12) that
 * already belongs to the NEXT season. A cross-winter season is named for the
 * year it ends in: Formula E "2027" runs Dec 2026 – Aug 2027, the Asian Le Mans
 * Series "2027" runs Nov 2026 – Feb 2027. Every other series races within one
 * calendar year. Add a series here when its calendar starts before January.
 */
export const CROSS_WINTER_SERIES: Readonly<Record<string, number>> = {
  fe: 10,
  'asian-le-mans': 10,
};

/** The season an event belongs to, from the series slug and its ISO `date`. */
export function seasonOf(series: string, isoDate: string): number {
  const year = Number(isoDate.slice(0, 4));
  const month = Number(isoDate.slice(5, 7));
  const rollover = CROSS_WINTER_SERIES[series];
  return rollover !== undefined && month >= rollover ? year + 1 : year;
}
