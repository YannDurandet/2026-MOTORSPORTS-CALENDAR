import type { APIRoute, GetStaticPaths } from 'astro';
import calendarData from '../../../data/calendar.json';
import seriesContent from '../../../data/seriesContent.json';
import seriesRaces from '../../../data/series.json';
import tracksData from '../../../data/tracks.json';

export const getStaticPaths: GetStaticPaths = () => {
  const slugs = (seriesContent as any[]).map((s: any) => s.slug);
  return [...slugs, 'all'].map((slug: string) => ({ params: { series: slug } }));
};

function escapeIcal(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function foldLine(line: string): string {
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

function toIcalDate(isoStr: string): string {
  // Convert "2026-03-08T05:00:00+01:00" → "20260308T050000Z" (UTC)
  const d = new Date(isoStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}

function generateIcs(targetSlugs: string[]): string {
  // Build track lookup
  const svgToTrack = new Map<string, any>();
  for (const track of tracksData as any[]) {
    for (const svg of (track.calendarSvgs ?? [])) svgToTrack.set(svg, track);
    for (const layout of (track.layouts ?? []))
      for (const svg of (layout.calendarSvgs ?? [])) svgToTrack.set(svg, track);
  }

  const races = seriesRaces as any;
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
  const seriesCounters: Record<string, number> = {};
  for (const slug of targetSlugs) seriesCounters[slug] = 0;

  for (const month of calendarData as any[]) {
    for (const week of month.weeks) {
      for (const ev of week.events) {
        const slug = ev.series;
        if (!targetSlugs.includes(slug)) continue;

        const idx = seriesCounters[slug] ?? 0;
        seriesCounters[slug] = idx + 1;

        const raceEntry = (races[slug] ?? [])[idx];
        if (!raceEntry?.date) continue;

        const dtstart = toIcalDate(raceEntry.date);
        // End = start + 3 hours (approximate race duration)
        const startMs = new Date(raceEntry.date).getTime();
        const endDate = new Date(startMs + 3 * 60 * 60 * 1000);
        const pad = (n: number) => String(n).padStart(2, '0');
        const dtend = `${endDate.getUTCFullYear()}${pad(endDate.getUTCMonth() + 1)}${pad(endDate.getUTCDate())}T${pad(endDate.getUTCHours())}${pad(endDate.getUTCMinutes())}00Z`;

        const track = svgToTrack.get(ev.track ?? '');
        const meta = allSeriesMeta.find((s: any) => s.slug === slug);
        const seriesName = meta?.name ?? slug.toUpperCase();

        const locationParts = [track?.name, track?.city, track?.country].filter(Boolean);
        const location = locationParts.join(', ');
        const url = `https://dord.racing/series/${slug}`;
        const uid = `dord-${slug}-${idx + 1}-2026@dord.racing`;
        const summary = `${ev.title} 2026`;
        const description = `${seriesName} · Round ${idx + 1} of the 2026 season. ${location ? 'Venue: ' + location + '.' : ''}`;

        events.push({ uid, summary, dtstart, dtend, location, url, description });
      }
    }
  }

  // Sort by dtstart
  events.sort((a, b) => a.dtstart.localeCompare(b.dtstart));

  const calName = targetSlugs.length === 1
    ? ((allSeriesMeta.find(s => s.slug === targetSlugs[0])?.name ?? targetSlugs[0]) + ' 2026 Calendar')
    : 'Motorsport 2026 Calendar — DORD Racing';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DORD Racing//Motorsport Calendar 2026//EN',
    `X-WR-CALNAME:${escapeIcal(calName)}`,
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

export const GET: APIRoute = ({ params }) => {
  const slug = params.series as string;
  const isAll = slug === 'all';

  const targetSlugs = isAll
    ? (seriesContent as any[]).map((s: any) => s.slug)
    : [slug];

  const icsContent = generateIcs(targetSlugs);

  return new Response(icsContent, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}.ics"`,
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
