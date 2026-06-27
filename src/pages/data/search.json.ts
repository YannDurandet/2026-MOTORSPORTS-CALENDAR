import type { APIRoute } from 'astro';
import tracksRaw from '../../../data/tracks.json';
import seriesContent from '../../../data/seriesContent.json';

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

  // Series first so they rank above tracks in results
  return new Response(JSON.stringify([...series, ...tracks]), {
    headers: { 'Content-Type': 'application/json' },
  });
};
