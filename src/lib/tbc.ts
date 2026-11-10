/**
 * Events whose start time is not published yet.
 *
 * Such an event's `time` says TBC, but its `date` still carries a clock time
 * (a placeholder, often 14:00 or 21:00 Paris). The day is meaningful; the clock
 * is not. Anything that shows a start time or counts down to one must check
 * this first (AUDIT F-090).
 */
import calendarData from '../../data/calendar.json';

export const isTimeTbc = (time: string | null | undefined): boolean => /\bTBC\b/.test(time ?? '');

type SeriesRace = { name: string; date: string };

/**
 * series.json entries with `tbc: true` where the calendar has no published
 * time. data/series.json itself stays exactly as `npm run gen:series` writes it;
 * the flag is added where the data is served (/data/series.json, the home page).
 */
export function withTbcFlags(index: Record<string, SeriesRace[]>): Record<string, (SeriesRace & { tbc?: true })[]> {
  const tbc = new Set<string>();
  for (const month of calendarData as any[]) {
    for (const week of month.weeks ?? []) {
      for (const ev of week.events ?? []) {
        if (isTimeTbc(ev.time)) tbc.add(`${ev.series}|${ev.date}`);
      }
    }
  }
  return Object.fromEntries(Object.entries(index).map(([slug, races]) => [
    slug,
    races.map(r => (tbc.has(`${slug}|${r.date}`) ? { ...r, tbc: true as const } : r)),
  ]));
}
