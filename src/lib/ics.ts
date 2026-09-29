/**
 * Shared iCal generation helpers.
 * Used by the static per-series routes (/ical/[series].ics.ts)
 * and the dynamic personal feed (/api/ical.ts).
 */

import calendarData from '../../data/calendar.json';
import seriesContent from '../../data/seriesContent.json';
import tracksData from '../../data/tracks.json';
import { findEvent, slugify } from './events';
import { monthYear } from './season';

export function escapeIcal(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function foldLine(line: string): string {
  // RFC 5545: lines longer than 75 octets should be folded
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const result: string[] = [];
  let pos = 0;
  let first = true;
  while (pos < line.length) {
    const chunk = first ? line.slice(pos, pos + 75) : line.slice(pos, pos + 74);
    result.push((first ? '' : ' ') + chunk);
    pos += first ? 75 : 74;
    first = false;
  }
  return result.join('\r\n');
}

export function toIcalDate(isoStr: string): string {
  // Convert "2026-03-08T05:00:00+01:00" → "20260308T050000Z" (UTC)
  const d = new Date(isoStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}

export function generateIcs(targetSlugs: string[], calName?: string): string {
  // Build track lookup
  const svgToTrack = new Map<string, any>();
  for (const track of tracksData as any[]) {
    for (const svg of (track.calendarSvgs ?? [])) svgToTrack.set(svg, track);
    for (const layout of (track.layouts ?? []))
      for (const svg of (layout.calendarSvgs ?? [])) svgToTrack.set(svg, track);
  }

  const allSeriesMeta = seriesContent as any[];

  interface IcsEvent {
    uid: string;
    summary: string;
    dtstart: string;
    dtend: string;
    location: string;
    url: string;
    description: string;
  }

  const events: IcsEvent[] = [];
  const roundCounters: Record<string, number> = {};

  for (const month of calendarData as any[]) {
    const year = monthYear(month);
    for (const week of month.weeks) {
      for (const ev of week.events) {
        const slug = ev.series;
        if (!targetSlugs.includes(slug) || !ev.date) continue;

        const key = `${slug}-${year}`;
        const round = (roundCounters[key] ?? 0) + 1;
        roundCounters[key] = round;

        const dtstart = toIcalDate(ev.date);
        const startMs = new Date(ev.date).getTime();
        const endDate = new Date(startMs + 3 * 60 * 60 * 1000);
        const pad = (n: number) => String(n).padStart(2, '0');
        const dtend = `${endDate.getUTCFullYear()}${pad(endDate.getUTCMonth() + 1)}${pad(endDate.getUTCDate())}T${pad(endDate.getUTCHours())}${pad(endDate.getUTCMinutes())}00Z`;

        const track = svgToTrack.get(ev.track ?? '');
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
        const timeNote = /TBC/.test(ev.time ?? '') ? ' Start time TBC.' : '';
        const description = `${seriesName} · Round ${round} of the ${year} season. ${location ? 'Venue: ' + location + '.' : ''}${timeNote}`;

        events.push({ uid, summary, dtstart, dtend, location, url, description });
      }
    }
  }

  // Sort by dtstart
  events.sort((a, b) => a.dtstart.localeCompare(b.dtstart));

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
      foldLine(`DTSTART:${ev.dtstart}`),
      foldLine(`DTEND:${ev.dtend}`),
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
