/**
 * calendarDates.js — which parts of the home calendar are past, current or a
 * preview of a later season. Pure functions (no DOM), so they can be tested in
 * Node; main.js applies them to the page.
 *
 * Every rule compares year AND month. Comparing months alone made 1 January
 * look like the start of the 2026 season again (AUDIT F-020).
 */

export const MONTH_NAMES = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
export const SHORT_MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/**
 * The day a week card ends on, from its label and the year of the month it is
 * filed under. "WEEK 32 • AUG 3-9" → AUG 9; "WEEK 31 • JUL 27 - AUG 2" → AUG 2.
 * A week that starts in December and ends in January ends in the next year.
 * Anchored to the end of the label so "WEEK 32" is never mistaken for a day.
 * @returns {{ year: number, month: number, day: number } | null}
 */
export function weekEnd(label, year) {
    const m = String(label).match(/([A-Z]{3})\s+(\d{1,2})(?:\s*-\s*(?:([A-Z]{3})\s+)?(\d{1,2}))?\s*$/);
    if (!m) return null;
    const startMonth = SHORT_MONTHS.indexOf(m[1]);
    const month = SHORT_MONTHS.indexOf(m[3] || m[1]);
    if (startMonth < 0 || month < 0) return null;
    return { year: month < startMonth ? year + 1 : year, month, day: parseInt(m[4] || m[2], 10) };
}

/** A month is past once the whole month is behind `now` (local calendar). */
export function isPastMonth(year, month, now) {
    const y = now.getFullYear();
    return year < y || (year === y && month < now.getMonth());
}

/**
 * A week card is past from the second day after it ends, so a late race on the
 * Sunday stays in view on Monday.
 */
export function isPastWeek(end, now) {
    const y = now.getFullYear();
    if (end.year !== y) return end.year < y;
    const month = now.getMonth();
    return end.month < month || (end.month === month && end.day + 1 < now.getDate());
}

/** Seasons after the current calendar year sit behind the preview toggle. */
export function isPreviewYear(year, now) {
    return year > now.getFullYear();
}
