import type { APIRoute, GetStaticPaths } from 'astro';
import seriesContent from '../../../data/seriesContent.json';
import { generateIcs } from '../../lib/ics';

export const getStaticPaths: GetStaticPaths = () => {
  const slugs = (seriesContent as any[]).map((s: any) => s.slug);
  return [...slugs, 'all'].map((slug: string) => ({ params: { series: slug } }));
};

export const GET: APIRoute = ({ params }) => {
  const slug = params.series as string;
  const isAll = slug === 'all';

  const targetSlugs = isAll
    ? (seriesContent as any[]).map((s: any) => s.slug)
    : [slug];

  const icsContent = generateIcs(targetSlugs);

  // Prerendered to a static file: the live site serves it with Cloudflare's own
  // headers and drops these (caching rules go in public/_headers). The dynamic
  // /api/ical feed is the one that sends Content-Disposition and Cache-Control.
  return new Response(icsContent, {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
  });
};
