/**
 * Shared iCal generation helpers.
 * Used by the static per-series routes (/ical/[series].ics.ts)
 * and the dynamic personal feed (/api/ical.ts).
 */

import calendarData from '../../data/calendar.json';
import seriesContent from '../../data/seriesContent.json';
import tracksData from '../../data/tracks.json';
import { findEvent, slugify, trackSlugForSvg } from './events';
import { monthYear } from './season';
import { isTimeTbc } from './tbc';

export function escapeIcal(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

const utf8 = new TextEncoder();

export function foldLine(line: string): string {
  // RFC 5545 §3.1: no physical line longer than 75 octets. Counted in encoded
  // bytes, not characters ("·" and accented letters take two), and broken only
  // between characters, so a multi-byte letter is never split.
  if (utf8.encode(line).length <= 75) return line;
  const result: string[] = [];
  let current = '';
  let size = 0;
  let limit = 75;                       // continuation lines start with a space
  for (const ch of line) {              // code points: surrogate pairs stay whole
    const n = utf8.encode(ch).length;
    if (size + n > limit) {
      result.push(current);
      current = '';
      size = 0;
      limit = 74;
    }
    current += ch;
    size += n;
  }
  result.push(current);
  return result.map((l, i) => (i === 0 ? l : ' ' + l)).join('\r\n');
}

export function toIcalDate(isoStr: string): string {
  // Convert "2026-03-08T05:00:00+01:00" → "20260308T050000Z" (UTC)
  const d = new Date(isoStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}

/** "2027-02-14" — the calendar day of an instant in Paris, the site's base time zone. */
function parisDay(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
}
function nextDay(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

export function generateIcs(targetSlugs: string[], calName?: string): string {
  // SVG → track goes through events.ts, so the feed names the same venue as the event page.
  const trackBySlug = new Map((tracksData as any[]).map(t => [t.slug, t]));

  const allSeriesMeta = seriesContent as any[];

  interface IcsEvent {
    uid: string;
    summary: string;
    /** Full DTSTART / DTEND properties: a UTC time, or VALUE=DATE for an all-day entry. */
    dtstart: string;
    dtend: string;
    sortKey: string;
    location: string;
    url: string;
    description: string;
  }

  const events: IcsEvent[] = [];

  for (const month of calendarData as any[]) {
    const year = monthYear(month);
    for (const week of month.weeks) {
      for (const ev of week.events) {
        const slug = ev.series;
        if (!targetSlugs.includes(slug) || !ev.date) continue;

        // Start time not published: the clock in `date` is a placeholder, so
        // the event is an all-day entry on its Paris day instead of a
        // three-hour slot at an invented time (AUDIT F-090).
        const tbc = isTimeTbc(ev.time);
        const pad = (n: number) => String(n).padStart(2, '0');
        let dtstart: string, dtend: string;
        if (tbc) {
          const day = parisDay(ev.date);
          dtstart = `DTSTART;VALUE=DATE:${day.replace(/-/g, '')}`;
          dtend = `DTEND;VALUE=DATE:${nextDay(day).replace(/-/g, '')}`;
        } else {
          const endDate = new Date(new Date(ev.date).getTime() + 3 * 60 * 60 * 1000);
          dtstart = `DTSTART:${toIcalDate(ev.date)}`;
          dtend = `DTEND:${endDate.getUTCFullYear()}${pad(endDate.getUTCMonth() + 1)}${pad(endDate.getUTCDate())}T${pad(endDate.getUTCHours())}${pad(endDate.getUTCMinutes())}00Z`;
        }

        const trackSlug = trackSlugForSvg(ev.track);
        const track = trackSlug ? trackBySlug.get(trackSlug) : undefined;
        const meta = allSeriesMeta.find((s: any) => s.slug === slug);
        const seriesName = meta?.name ?? slug.toUpperCase();

        const locationParts = [track?.name, track?.city, track?.country].filter(Boolean);
        const location = locationParts.join(', ');
        const page = findEvent(year, slug, ev.title, week.label);
        const url = page ? `https://dord.racing${page.path}` : `https://dord.racing/series/${slug}`;
        // Keyed on the event, not its position, so inserting a round mid-season
        // doesn't reassign every later UID in subscribers' calendars.
        const uid = page
          ? `dord-${page.slug}-${year}@dord.racing`
          : `dord-${slugify(`${slug}-${ev.title}`)}-${year}-${ev.date.slice(5, 10)}@dord.racing`;
        const summary = `${ev.title} ${year}`;
        const timeNote = tbc ? ' Start time TBC.' : '';
        // No "Round N of the season": counted per calendar year it was wrong for
        // series that open in December, and a double-header is one entry but two rounds.
        const description = `${seriesName}.${location ? ' Venue: ' + location + '.' : ''}${timeNote}`;

        events.push({ uid, summary, dtstart, dtend, sortKey: new Date(ev.date).toISOString(), location, url, description });
      }
    }
  }

  // Sort by dtstart
  events.sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  const resolvedCalName = calName ?? (
    targetSlugs.length === 1
      ? ((allSeriesMeta.find((s: any) => s.slug === targetSlugs[0])?.name ?? targetSlugs[0]) + ' Calendar')
      : 'Motorsport Calendar — DORD Racing'
  );

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DORD Racing//Motorsport Calendar//EN',
    `X-WR-CALNAME:${escapeIcal(resolvedCalName)}`,
    'X-WR-TIMEZONE:UTC',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const ev of events) {
    const now = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
    lines.push(
      'BEGIN:VEVENT',
      foldLine(`UID:${ev.uid}`),
      foldLine(`DTSTAMP:${now}`),
      foldLine(ev.dtstart),
      foldLine(ev.dtend),
      foldLine(`SUMMARY:${escapeIcal(ev.summary)}`),
      ...(ev.location ? [foldLine(`LOCATION:${escapeIcal(ev.location)}`)] : []),
      foldLine(`URL:${ev.url}`),
      foldLine(`DESCRIPTION:${escapeIcal(ev.description)}`),
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
