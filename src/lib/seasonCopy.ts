/**
 * Copy written about one season of one series.
 *
 * It names round counts, openers and finales, so it is only true for the season
 * it was written for. That is why it is keyed by season and kept out of the
 * templates: `npm run check` (scripts/check-season.mjs) fails on a season year
 * typed into a template, and allows it here.
 *
 * How a `/series/{slug}` page gets its meta description:
 *   - the season has a block below → that series' text, or the series tagline
 *     for a series the block does not cover (how 2026 has always worked);
 *   - the season has no block yet (the site has just rolled over) → a sentence
 *     built from the calendar, so nothing stale is published while the block
 *     is being written.
 */

const SERIES_DESCRIPTIONS: Record<number, Record<string, string>> = {
  2026: {
    'f1':      'Full 2026 Formula 1 calendar with race dates, circuits, and results. 23 Grands Prix across five continents — Australian GP to Abu Dhabi.',
    'motogp':  'Complete 2026 MotoGP calendar — 22 rounds from Thailand to Valencia. Race dates, circuits, and results for the premier motorcycle racing class.',
    'wec':     'Full 2026 FIA World Endurance Championship calendar including the 24 Hours of Le Mans. Hypercar race dates, circuits, and results.',
    'indycar': '2026 NTT IndyCar Series schedule — 16 rounds from St. Petersburg to Laguna Seca, including the Indianapolis 500. Race dates, circuits, and results.',
    'nascar':  '2026 NASCAR Cup Series schedule — 36 races across ovals, short tracks, and road courses. Race dates, results, and circuits from the Daytona 500 to the Homestead-Miami finale.',
    'wsbk':    '2026 WorldSBK calendar — 12 rounds, three races per weekend. Race dates, circuit guide, and results for the Superbike World Championship.',
    'btcc':    '2026 British Touring Car Championship schedule — 10 rounds, 30 races across the UK\'s best circuits. Race dates, results, and championship standings.',
    'wrc':     '2026 FIA World Rally Championship schedule — 14 rallies across four continents. Race dates, stages, and results from Monte Carlo to Saudi Arabia.',
  },
};

/**
 * Meta description for a series page in a given season.
 * @param slug     series slug
 * @param year     the season shown on the page
 * @param short    short series name, e.g. "WEC"
 * @param rounds   that season's events for the series, in date order
 * @param tagline  the series tagline from seriesContent.json
 */
export function seriesSeasonDescription(
  slug: string,
  year: number,
  short: string,
  rounds: { title: string }[],
  tagline: string,
): string {
  const block = SERIES_DESCRIPTIONS[year];
  if (block) return block[slug] ?? tagline;
  if (rounds.length === 0) return tagline;
  const n = rounds.length;
  const span = n > 1 ? `, from ${rounds[0].title} to ${rounds[n - 1].title}` : `: ${rounds[0].title}`;
  return `${short} ${year} calendar: ${n} round${n === 1 ? '' : 's'}${span}. Race dates, circuits and results.`;
}
