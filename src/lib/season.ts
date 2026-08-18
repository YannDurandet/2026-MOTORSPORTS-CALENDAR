/**
 * Which calendar seasons appear where.
 *
 * `data/calendar.json` is an array of month objects. 2026 months carry no
 * `year` field; 2027 months are tagged `"year": 2027`.
 *
 * Track pages (the browser grid and each `/tracks/[slug]`) group events by
 * venue rather than by date, so a 2027 round shows up as a second, undated-
 * looking row right next to its 2026 equivalent — 39 tracks were listing the
 * same race twice. Until the 2027 calendar is complete they are filtered to
 * the current season. The main calendar, search index and ICS feeds still
 * carry both years.
 *
 * To show 2027 on track pages, add it to TRACK_PAGE_YEARS. To roll the site
 * over to 2027 as the default season, change DEFAULT_CALENDAR_YEAR to match
 * whatever year the untagged months represent.
 */

/** The year that month objects without an explicit `year` field belong to. */
export const DEFAULT_CALENDAR_YEAR = 2026;

/** Seasons rendered on track pages. */
export const TRACK_PAGE_YEARS: ReadonlySet<number> = new Set([2026]);

/** Resolve a calendar month's year, defaulting untagged months. */
export function monthYear(month: { year?: number }): number {
  return month.year ?? DEFAULT_CALENDAR_YEAR;
}

/** True when this month's events should appear on track pages. */
export function showOnTrackPages(month: { year?: number }): boolean {
  return TRACK_PAGE_YEARS.has(monthYear(month));
}
