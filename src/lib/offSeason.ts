import { seasonOf } from './season';

/**
 * Whether a series card on `/series` counts down to its next race or says
 * OFF SEASON.
 *
 * `data/series.json` already lists next year's rounds, so "the next race" is
 * never missing in November: a series that finished in October would otherwise
 * show a 160-day countdown to a March opener. The rule:
 *
 *  - No race left in the data: OFF SEASON.
 *  - The next race belongs to a season that has already started (some race of
 *    that season is behind us): count down. This is mid-season, whatever the gap.
 *  - The next race opens a season that belongs to a LATER calendar year than
 *    today: OFF SEASON, unless it is under OFF_SEASON_LEAD_DAYS away.
 *  - Anything else (the season opens this calendar year, or already did):
 *    count down. Once 1 January passes, every series is back here, even if its
 *    opener is in mid-March.
 *
 * "Season" comes from `seasonOf()`, so cross-winter series (Formula E, the Asian
 * Le Mans Series) are handled by `CROSS_WINTER_SERIES` in `season.ts`: their
 * December opener belongs to next year's season and is held back until it is
 * 30 days out. Add a series there when its calendar starts before January.
 *
 * "Today" is the Paris calendar year, the site's base timezone, so the
 * switch-over does not depend on where the visitor is.
 */

/** How close next season's opener must be before the card starts counting down. */
export const OFF_SEASON_LEAD_DAYS = 30;

const DAY_MS = 864e5;

const parisYearFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', year: 'numeric' });

/** The calendar year in Paris at `now` (epoch ms). */
function parisYear(now: number): number {
  return Number(parisYearFormat.format(now));
}

interface Race {
  date: string;
  /** Epoch ms of `date`, when the caller has already parsed it. */
  _ts?: number;
}

const stamp = (race: Race): number => race._ts ?? Date.parse(race.date);

/**
 * The race to count down to, or `null` when the series should read OFF SEASON.
 * `races` must be one series' list from `series.json`, in date order.
 */
export function countdownTarget<T extends Race>(slug: string, races: readonly T[], now: number): T | null {
  const next = races.find(r => stamp(r) > now);
  if (!next) return null;

  const nextSeason = seasonOf(slug, next.date);
  if (nextSeason <= parisYear(now)) return next;

  const underway = races.some(r => stamp(r) <= now && seasonOf(slug, r.date) === nextSeason);
  if (underway) return next;

  return stamp(next) - now < OFF_SEASON_LEAD_DAYS * DAY_MS ? next : null;
}
