// Serves cleaned track-map SVGs for the track browser grid (<img> loading).
// The grid used to inline every SVG into tracks.html (~640 KB of markup);
// these prerendered files let the browser lazy-load and cache each map.
import type { APIRoute } from 'astro';

const _svgRaw = import.meta.glob('/public/assets/track-maps/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const svgByName: Record<string, string> = {};
for (const [k, v] of Object.entries(_svgRaw)) {
  svgByName[k.split('/').pop()!.replace(/\.svg$/, '')] = v;
}

// Same cleaning the grid applied when inlining, plus the stroke bump the CSS
// used to force (`stroke-width: 1 !important`) — CSS can't reach inside <img>.
function cleanSvg(raw: string): string {
  return raw
    .replace(/<defs>[\s\S]*?<\/defs>/g, '')
    .replace(/<rect[^>]*fill-opacity[^>]*\/?>/g, '')
    .replace(/(\s)width="\d+"/, '')
    .replace(/(\s)height="\d+"/, '')
    .replace(/stroke-width="[\d.]+"/g, 'stroke-width="1"');
}

export function getStaticPaths() {
  return Object.keys(svgByName).map(file => ({ params: { file } }));
}

export const GET: APIRoute = ({ params }) => {
  const raw = svgByName[params.file as string];
  if (!raw) return new Response('Not found', { status: 404 });
  return new Response(cleanSvg(raw), {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
  });
};
