import type { APIRoute } from 'astro';
import tracksRaw from '../../../data/tracks.json';
import seriesContent from '../../../data/seriesContent.json';
import calendarRaw from '../../../data/calendar.json';

export const GET: APIRoute = () => {
  const tracks = (tracksRaw as any[]).map(t => ({
    t: 'track',
    slug: t.slug,
    name: t.name,
    city: t.city,
    country: t.country,
  }));

  const series = (seriesContent as any[]).map(s => ({
    t: 'series',
    slug: s.slug,
    name: s.name,
    tagline: s.tagline,
  }));

  // Build event index from calendar data
  const events: object[] = [];
  for (const month of calendarRaw as any[]) {
    const year: number = month.year ?? 2026;
    for (const week of month.weeks ?? []) {
      const weekNum = week.label?.match(/WEEK (\d+)/)?.[1];
      if (!weekNum) continue;
      const anchor = year === 2027 ? `2027-week-${weekNum}` : `week-${weekNum}`;
      for (const ev of week.events ?? []) {
        events.push({
          t: 'event',
          name: ev.title,
          tag: ev.tag,
          series: ev.series,
          week: parseInt(weekNum, 10),
          year,
          anchor,
        });
      }
    }
  }

  // Series first, then tracks, then events
  return new Response(JSON.stringify([...series, ...tracks, ...events]), {
    headers: { 'Content-Type': 'application/json' },
  });
};
