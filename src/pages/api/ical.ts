/**
 * GET /api/ical?series=f1,wec,motogp
 *
 * Dynamic personal iCal feed — returns a combined .ics for the requested series.
 * Accepts a comma-separated list of series slugs. Unknown slugs are silently ignored.
 * If ?series= is absent or empty, all series are included.
 * Sort order of slugs doesn't affect cache — slugs are sorted before use.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import seriesContent from '../../../data/seriesContent.json';
import { generateIcs } from '../../lib/ics';

const allValidSlugs: string[] = (seriesContent as any[]).map((s: any) => s.slug).sort();
const validSlugSet = new Set(allValidSlugs);

export const GET: APIRoute = ({ request }) => {
  const url = new URL(request.url);
  const seriesParam = url.searchParams.get('series') ?? '';

  let requested: string[];

  if (!seriesParam.trim()) {
    // Empty or absent → all series
    requested = allValidSlugs;
  } else {
    const parsed = seriesParam
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(s => validSlugSet.has(s));

    // Dedupe + sort so cache keys converge regardless of param order
    requested = [...new Set(parsed)].sort();

    // Garbage / all invalid → fall back to all
    if (requested.length === 0) {
      requested = allValidSlugs;
    }
  }

  const isAll = requested.length === allValidSlugs.length;

  const calName = isAll
    ? 'Motorsport 2026 Calendar — DORD Racing'
    : 'My Motorsport Calendar — DORD Racing';

  const icsContent = generateIcs(requested, calName);

  return new Response(icsContent, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="dord-custom.ics"',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
