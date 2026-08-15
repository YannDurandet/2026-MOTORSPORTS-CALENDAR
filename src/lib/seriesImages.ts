/**
 * Series slug → grid/OG background image.
 *
 * Keys MUST match the `slug` field in data/seriesContent.json exactly. Several
 * filenames use a different shorthand than the slug (supercars→scc, bgt→bgtc,
 * eurx→erx, h24eu→24h, asian-le-mans→alms), which is why this mapping exists
 * rather than deriving the filename from the slug.
 *
 * Files live in public/assets/series-grid-images/.
 *
 * This lived as a duplicated literal in both series/index.astro and
 * series/[slug].astro. The two copies drifted — `asian-le-mans` was keyed as
 * `alms` in both, so the series rendered with no background image and no OG
 * image. Import from here so there is only one list to keep correct.
 */
export const seriesImages: Record<string, string> = {
  'f1':            'f1-series-bg.webp',
  'f1a':           'f1a-series-bg.webp',
  'fe':            'fe-series-bg.webp',
  'sf':            'sf-series-bg.webp',
  'wec':           'wec-series-bg.webp',
  'imsa':          'imsa-series-bg.webp',
  'wrc':           'wrc-series-bg.webp',
  'erc':           'erc-series-bg.webp',
  'indycar':       'indycar-series-bg.webp',
  'nascar':        'nascar-series-bg.webp',
  'motogp':        'motogp-series-bg.webp',
  'wsbk':          'wsbk-series-bg.webp',
  'dtm':           'dtm-series-bg.webp',
  'btcc':          'btcc-series-bg.webp',
  'supercars':     'scc-series-bg.webp',
  'elms':          'elms-series-bg.webp',
  'gtwce':         'gtwce-series-bg.webp',
  'gtwca':         'gtwca-series-bg.webp',
  'nls':           'nls-series-bg.webp',
  'igtc':          'igtc-series-bg.webp',
  'tcr':           'tcr-series-bg.webp',
  'h24eu':         '24h-series-bg.webp',
  'psc':           'psc-series-bg.webp',
  'bgt':           'bgtc-series-bg.webp',
  'eurx':          'erx-series-bg.webp',
  'asian-le-mans': 'alms-series-bg.webp',
};

/** Absolute URL for OG/social cards. */
export function seriesOgImage(slug: string): string | undefined {
  const file = seriesImages[slug];
  return file ? `https://dord.racing/assets/series-grid-images/${file}` : undefined;
}
