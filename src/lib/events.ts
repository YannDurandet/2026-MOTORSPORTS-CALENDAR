/**
 * Canonical event list, derived from data/calendar.json.
 *
 * calendar.json is organised for *display* — nested month → week → events, with
 * no stable identifier per event. Event pages need the opposite: a flat list
 * where every race has a permanent URL. This module is the single place that
 * conversion happens, so track pages, series pages, the season index and the
 * event pages themselves all agree on what an event's URL is.
 *
 * URL shape: /events/{year}/{series}-{title}
 *   /events/2026/f1-monaco-gp
 *   /events/2026/wec-6-hours-of-spa
 *
 * Slugs must never shift once Google has indexed them, so they are derived
 * only from data intrinsic to the event (series, title, and — when two events
 * share both — the month it runs in). Nothing depends on array ordering.
 */

import calendarData from '../../data/calendar.json';
import tracksData from '../../data/tracks.json';
import { DEFAULT_CALENDAR_YEAR } from './season';

// ── Types ────────────────────────────────────────────────────────────────────

/** Result rows vary by series: rally has co_driver, endurance has winners[]. */
export type RaceResult = {
  date?: string;
  race_label?: string;
  winner?: string;
  winners?: string[];
  team?: string;
  manufacturer?: string;
  co_driver?: string;
  country?: string;
  note?: string;
};

export type SupportRace = { badge: string; label: string; detail: string };
export type RaceLeg = { label: string; time: string };

export type CalendarEvent = {
  year: number;
  /** Unique within its year, e.g. "f1-monaco-gp". */
  slug: string;
  /** Site-absolute path, e.g. "/events/2026/f1-monaco-gp". */
  path: string;
  series: string;
  tag: string;
  title: string;
  shortName?: string;
  /** Raw week label from the calendar, e.g. "WEEK 45 • NOV 06-08". */
  weekLabel: string;
  /** Session-time string. Contains markup — render with set:html. */
  time: string;
  /** ISO datetime with offset. */
  date: string;
  /** SVG filename, the calendar's join key to a track. */
  trackSvg: string;
  /** Resolved track slug, or null for rally rounds with no circuit. */
  trackSlug: string | null;
  results?: RaceResult[];
  support?: SupportRace[];
  legs?: RaceLeg[];
  hasSprint: boolean;
  /** First and last day of this event's own weekend (ISO dates), when known.
   *  The week label spans every event in the week, so it can start a day early. */
  start?: string;
  end?: string;
  /** Venue for a confirmed event whose circuit has no track entry or map yet. */
  venue?: { name: string; city: string; country: string };
};

// ── Slugs ────────────────────────────────────────────────────────────────────

const MONTH_ABBR = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')   // strip accents: Goiânia → goiania
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── Track lookup ─────────────────────────────────────────────────────────────

const trackSlugBySvg: Record<string, string> = {};
for (const t of tracksData as any[]) {
  for (const s of t.calendarSvgs ?? []) trackSlugBySvg[s] ??= t.slug;
  for (const l of t.layouts ?? []) {
    for (const s of l.calendarSvgs ?? []) trackSlugBySvg[s] ??= t.slug;
  }
  if (t.browserSvg) trackSlugBySvg[t.browserSvg] ??= t.slug;
}

// ── Build ────────────────────────────────────────────────────────────────────

type Raw = Omit<CalendarEvent, 'slug' | 'path'> & { baseSlug: string };

const raw: Raw[] = [];

for (const month of calendarData as any[]) {
  const year: number = month.year ?? DEFAULT_CALENDAR_YEAR;
  for (const week of month.weeks ?? []) {
    for (const ev of week.events ?? []) {
      // tbc/tbd are placeholder infographics for unannounced venues — no page,
      // unless the event names its venue inline (circuit known, map not drawn yet).
      if (!ev.track) continue;
      if ((ev.track === 'tbc.svg' || ev.track === 'tbd.svg') && !ev.venue) continue;
      raw.push({
        year,
        // `slug` pins the URL when a title changes after the page was indexed
        // (e.g. "Bahrain GP" → "Bahrain GP in Malaysia (Sepang)").
        baseSlug: ev.slug ?? slugify(`${ev.series}-${ev.title}`),
        series: ev.series,
        tag: ev.tag,
        title: ev.title,
        shortName: ev.shortName,
        weekLabel: week.label,
        time: ev.time,
        date: ev.date,
        trackSvg: ev.track,
        trackSlug: trackSlugBySvg[ev.track] ?? null,
        results: ev.results,
        support: ev.sub,
        legs: ev.races,
        hasSprint: ev.sprint === true,
        start: ev.start,
        end: ev.end,
        venue: ev.venue,
      });
    }
  }
}

// Two 2026 events share a series+title (Jeddah E-Prix, Goodyear 400) because
// the series visits twice in one season. Disambiguate with the month — derived
// from the event itself, so the slug can't move if the calendar is reordered.
const baseCounts = new Map<string, number>();
for (const r of raw) {
  const key = `${r.year}/${r.baseSlug}`;
  baseCounts.set(key, (baseCounts.get(key) ?? 0) + 1);
}

export const ALL_EVENTS: CalendarEvent[] = raw.map(r => {
  const key = `${r.year}/${r.baseSlug}`;
  const needsMonth = (baseCounts.get(key) ?? 0) > 1;
  const month = MONTH_ABBR[new Date(r.date).getUTCMonth()] ?? '';
  const slug = needsMonth && month ? `${r.baseSlug}-${month}` : r.baseSlug;
  const { baseSlug, ...rest } = r;
  return { ...rest, slug, path: `/events/${r.year}/${slug}` };
});

// ── Accessors ────────────────────────────────────────────────────────────────

export function eventsForYear(year: number): CalendarEvent[] {
  return ALL_EVENTS.filter(e => e.year === year)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function eventsForTrack(trackSlug: string, year?: number): CalendarEvent[] {
  return ALL_EVENTS
    .filter(e => e.trackSlug === trackSlug && (year === undefined || e.year === year))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function eventsForSeries(series: string, year?: number): CalendarEvent[] {
  return ALL_EVENTS
    .filter(e => e.series === series && (year === undefined || e.year === year))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Lookup used by track/series pages, which hold a week label rather than a slug. */
export function findEvent(year: number, series: string, title: string, weekLabel?: string) {
  return ALL_EVENTS.find(e =>
    e.year === year &&
    e.series === series &&
    e.title === title &&
    (weekLabel === undefined || e.weekLabel === weekLabel));
}

export const EVENT_YEARS: number[] = [...new Set(ALL_EVENTS.map(e => e.year))].sort();

/** Strips the session-time markup for use in meta descriptions and JSON-LD. */
export function plainTime(time: string): string {
  return time.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

/** "WEEK 45 • NOV 06-08" → "NOV 06-08" */
export function weekRange(label: string): string {
  const m = label.match(/•\s*(.+)$/);
  return m ? m[1].trim() : label;
}

/** The event's own date range, e.g. "OCT 09-11" or "OCT 30 - NOV 01".
 *  Falls back to the week label when the event has no start/end. */
export function eventRange(ev: Pick<CalendarEvent, 'weekLabel' | 'start' | 'end'>): string {
  if (!ev.start || !ev.end) return weekRange(ev.weekLabel);
  const [, sm, sd] = ev.start.split('-').map(Number);
  const [, em, ed] = ev.end.split('-').map(Number);
  const mon = (m: number) => MONTH_ABBR[m - 1].toUpperCase();
  const dd = (d: number) => String(d).padStart(2, '0');
  if (ev.start === ev.end) return `${mon(sm)} ${dd(sd)}`;
  return sm === em ? `${mon(sm)} ${dd(sd)}-${dd(ed)}` : `${mon(sm)} ${dd(sd)} - ${mon(em)} ${dd(ed)}`;
}
