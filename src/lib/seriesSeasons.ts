/**
 * Seasons of a series, and which one its pages show.
 *
 * Every season of a series that has rounds in the calendar gets a permanent
 * page, `/series/{slug}/{season}`. It is never removed and never redirected,
 * so a URL people have found ("wsbk 2027 calendar") keeps working through
 * every rollover.
 *
 * `/series/{slug}` (the hub: teams, standings, how to watch, calendar) shows
 * ONE of those seasons, picked per series from the calendar each time the site
 * is built (it is rebuilt daily):
 *
 *   the earliest season that is not over yet,
 *   or the latest season we have when all of them are over.
 *
 * A season stays "not over" for SEASON_GRACE_DAYS after its last round, so the
 * hub still shows the final results and standings while people look for them,
 * then moves on to the next season by itself. A series that has not published
 * its next calendar simply stays on its last season. Nothing here depends on
 * DEFAULT_CALENDAR_YEAR: that constant only governs site-wide wording.
 *
 * The season page of the season the hub is showing has the same calendar as
 * the hub, so it names the hub as its canonical URL (see seriesSeasonPath and
 * /series/[slug]/[year].astro). Link to a season with seriesSeasonPath(), which
 * returns the hub for that season and the season page for any other.
 *
 * Seasons come from seasonOf() (lib/season.ts), not from the calendar year: a
 * series that starts before January (Formula E, Asian Le Mans) has its autumn
 * rounds in the season named for the following year.
 */
import standingsData from '../../data/standings.json';
import { ALL_EVENTS, type CalendarEvent } from './events';
import { DEFAULT_CALENDAR_YEAR, seasonOf } from './season';

/** Days after a season's last round during which the series hub still shows it. */
export const SEASON_GRACE_DAYS = 14;

const DAY_MS = 864e5;

/** series → season → rounds in date order */
const index = new Map<string, Map<number, CalendarEvent[]>>();
for (const ev of [...ALL_EVENTS].sort((a, b) => a.date.localeCompare(b.date))) {
  const season = seasonOf(ev.series, ev.date);
  let seasons = index.get(ev.series);
  if (!seasons) index.set(ev.series, (seasons = new Map()));
  const rounds = seasons.get(season);
  if (rounds) rounds.push(ev);
  else seasons.set(season, [ev]);
}

/** Every season of a series that has at least one round, oldest first. */
export function seriesSeasons(series: string): number[] {
  return [...(index.get(series)?.keys() ?? [])].sort((a, b) => a - b);
}

/** The rounds of one season of a series, in date order (empty when it has none). */
export function seasonRounds(series: string, season: number): CalendarEvent[] {
  return index.get(series)?.get(season) ?? [];
}

/** Every (series, season) pair that has rounds: the pages /series/{slug}/{season}. */
export function allSeriesSeasons(): { series: string; season: number }[] {
  return [...index.keys()].flatMap(series => seriesSeasons(series).map(season => ({ series, season })));
}

/** True once the season's last round is more than SEASON_GRACE_DAYS in the past. */
export function seasonIsOver(series: string, season: number, now: number = Date.now()): boolean {
  const rounds = seasonRounds(series, season);
  if (!rounds.length) return true;
  return new Date(rounds[rounds.length - 1].date).getTime() + SEASON_GRACE_DAYS * DAY_MS <= now;
}

/**
 * The season the series hub shows. `now` defaults to the moment of the call:
 * call this while a page is being rendered, not at module top level (the
 * prerenderer's clock only runs inside a render).
 */
export function currentSeason(series: string, now: number = Date.now()): number {
  const seasons = seriesSeasons(series);
  if (!seasons.length) return DEFAULT_CALENDAR_YEAR;
  return seasons.find(s => !seasonIsOver(series, s, now)) ?? seasons[seasons.length - 1];
}

/** Site path of a season of a series: the hub for the season it shows, the season page otherwise. */
export function seriesSeasonPath(series: string, season: number, now: number = Date.now()): string {
  return season === currentSeason(series, now) ? `/series/${series}` : `/series/${series}/${season}`;
}

/**
 * The season the standings tables in data/standings.json belong to, from their
 * `updatedAt` date; null when the series has no standings. The file holds one
 * season per series and carries no season field of its own.
 */
export function standingsSeason(series: string): number | null {
  const tables = Object.values(((standingsData as any)[series] ?? {}) as Record<string, any>);
  const dates = tables.map(t => t?.updatedAt).filter((d): d is string => typeof d === 'string').sort();
  return dates.length ? seasonOf(series, dates[dates.length - 1]) : null;
}
