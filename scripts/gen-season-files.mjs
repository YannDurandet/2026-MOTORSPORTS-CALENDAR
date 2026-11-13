#!/usr/bin/env node
/**
 * gen-season-files.mjs — writes the two static files that name the season.
 *
 *   public/manifest.webmanifest   the installed app's name, description, shortcuts
 *   public/llms.txt               the site summary for AI crawlers, with the series table
 *
 * Both are served as plain files, so they cannot read DEFAULT_CALENDAR_YEAR
 * (src/lib/season.ts) the way a template does. They used to be typed by hand:
 * the year was written out nine times, and the series table in llms.txt had
 * drifted from data/seriesContent.json (four rows differed). Generating them
 * keeps the season rollover to one constant plus this command.
 *
 * Edit the wording HERE, never in the two output files: `npm run check` runs
 * this with --check and fails when a committed copy differs from what it
 * would write.
 *
 * Usage: npm run gen:season
 *        npm run gen:season -- --check   (verify only, exit 1 if stale)
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { hasEventPage, pageSlugs } from '../src/lib/eventSlugs.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const CHECK_ONLY = process.argv.includes('--check');

const read = (p) => readFileSync(resolve(root, p), 'utf8');

const season = Number(/DEFAULT_CALENDAR_YEAR\s*=\s*(\d{4})/.exec(read('src/lib/season.ts'))?.[1]);
if (!season) {
  console.error('gen-season-files: could not read DEFAULT_CALENDAR_YEAR from src/lib/season.ts');
  process.exit(1);
}

const calendar = JSON.parse(read('data/calendar.json'));
const seriesContent = JSON.parse(read('data/seriesContent.json'));
const tracks = JSON.parse(read('data/tracks.json'));

// ── Event pages, with the slugs the site builds (src/lib/eventSlugs.js) ──────
const pages = [];
for (const month of calendar) {
  const year = month.year ?? season;
  for (const week of month.weeks ?? []) {
    for (const ev of week.events ?? []) {
      if (hasEventPage(ev)) pages.push({ year, ev });
    }
  }
}
const slugs = pageSlugs(pages);
const eventPages = pages.map((p, i) => ({ year: p.year, series: p.ev.series, title: p.ev.title, path: `/events/${p.year}/${slugs[i]}` }));
const years = [...new Set(eventPages.map(e => e.year))].sort();
const next = season + 1;
const hasNext = years.includes(next);

// An example event page for this season: Monaco if F1 goes there, else the first F1 round, else any event.
const seasonEvents = eventPages.filter(e => e.year === season);
const example =
  seasonEvents.find(e => e.series === 'f1' && /monaco/i.test(e.title)) ??
  seasonEvents.find(e => e.series === 'f1') ??
  seasonEvents[0];

// ── manifest.webmanifest ─────────────────────────────────────────────────────
const manifest = {
  name: `${season} Motorsport Calendar`,
  short_name: 'dord.racing',
  description: `The ultimate ${season} motorsport master calendar. Track F1, WEC, MotoGP, IndyCar and ${seriesContent.length} championships with live countdowns.`,
  start_url: '/',
  display: 'standalone',
  background_color: '#070b12',
  theme_color: '#070b12',
  lang: 'en',
  dir: 'ltr',
  orientation: 'any',
  categories: ['sports', 'lifestyle'],
  icons: [
    { src: '/assets/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/assets/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
  shortcuts: [
    {
      name: 'Race Calendar',
      short_name: 'Calendar',
      description: `Full ${season} race calendar`,
      url: '/',
      icons: [{ src: '/assets/calendar-icon.svg', sizes: 'any', type: 'image/svg+xml' }],
    },
    {
      name: 'Watch Now',
      short_name: 'Watch',
      description: "What's on this weekend",
      url: '/watch',
      icons: [{ src: '/assets/series-icon.svg', sizes: 'any', type: 'image/svg+xml' }],
    },
    {
      name: 'Results',
      short_name: 'Results',
      description: `${season} race results`,
      url: '/results',
      icons: [{ src: '/assets/results-icon.svg', sizes: 'any', type: 'image/svg+xml' }],
    },
  ],
};

// ── llms.txt ─────────────────────────────────────────────────────────────────
// Same category order as the /series page.
const CATEGORY_ORDER = ['Open Wheel', 'Bike', 'Endurance', 'GT / Sports Car', 'Rally', 'Touring'];
const rank = (s) => { const i = CATEGORY_ORDER.indexOf(s.category); return i === -1 ? CATEGORY_ORDER.length : i; };
const cell = (v) => String(v ?? '').replace(/\|/g, '/').replace(/\s+/g, ' ').trim();
const seriesRows = seriesContent
  .map((s, i) => ({ s, i }))
  .sort((a, b) => rank(a.s) - rank(b.s) || a.i - b.i)
  .map(({ s }) => `| ${cell(s.slug)} | ${cell(s.name)} | ${cell(s.category)} | ${cell(s.tagline)} |`);

const n = seriesContent.length;
const circuits = `${Math.floor(tracks.length / 10) * 10}+`;

const llms = [
  `# dord.racing — ${season} Motorsport Master Calendar`,
  '',
  `> An independent, comprehensive ${season} motorsport master calendar tracking ${n} championships across open-wheel, endurance, touring, GT, motorcycle, and rally series. Built by Yann Durandet.`,
  '',
  '## What this site covers',
  '',
  `dord.racing aggregates the complete ${season} racing season into a single filterable calendar. Every race weekend, every series, every circuit — from Formula 1 to the Nürburgring 24-hour grassroots series. Data is manually curated from official series sources including the FIA, Formula 1, Formula E, WEC, IMSA, IndyCar, MotoGP, and others.`,
  '',
  'Key features:',
  `- Full ${season} race calendar with local time conversion`,
  '- Live countdown timers to next race per series',
  `- Track browser with ${circuits} circuit maps and technical data`,
  '- Race results updated throughout the season',
  '- Global search across all tracks and series',
  '',
  '## Pages',
  '',
  '- [Homepage / full calendar](https://dord.racing)',
  `- [Series guide (all ${n} championships)](https://dord.racing/series)`,
  `- [Track browser (${circuits} circuits)](https://dord.racing/tracks)`,
  '- [Race results](https://dord.racing/results)',
  '- [Watch this weekend (sessions and broadcasters by country)](https://dord.racing/watch)',
  ...years.map(y => `- [Every ${y} event, month by month, across all series](https://dord.racing/events/${y})`),
  example
    ? `- Event pages, one per race weekend: https://dord.racing/events/{year}/{series}-{event}, e.g. [${example.title} ${season}](https://dord.racing${example.path})`
    : '- Event pages, one per race weekend: https://dord.racing/events/{year}/{series}-{event}',
  ...(hasNext
    ? [`- ${next} season calendars, one per series that has published one: https://dord.racing/series/{slug}/${next}, e.g. [F1 ${next}](https://dord.racing/series/f1/${next})`]
    : []),
  '- [Newsletter (weekly motorsport briefing)](https://dord.racing/newsletter)',
  '',
  `## The ${n} Series`,
  '',
  '| Slug | Series | Category | Description |',
  '|---|---|---|---|',
  ...seriesRows,
  '',
  '## Individual series pages',
  '',
  'Each series has a dedicated page at [https://dord.racing/series/{slug}](https://dord.racing/series/) with:',
  '- Series description and history',
  `- Full ${season} race calendar for that series`,
  '- Teams and drivers (for Tier 1 series: F1, WEC, IndyCar, NASCAR, MotoGP)',
  '- Links to official series websites and social media',
  '',
  '## Track data',
  '',
  `dord.racing maintains technical data for ${circuits} circuits including:`,
  '- Circuit name, city, country, continent',
  '- Track type (permanent / street / oval / mixed)',
  '- Length (km), number of turns, direction',
  '- Lap record (time, driver, series, year)',
  '- Custom SVG track maps for most venues',
  '- Which series race at each venue',
  '',
  'Each track has a page at [https://dord.racing/tracks/{slug}](https://dord.racing/tracks/)',
  '',
  '## Data sources',
  '',
  'Race dates and times: official series websites (FIA, F1, FE, WEC, IMSA, MotoGP, IndyCar, NASCAR, Supercars, BTCC, etc.)',
  'Track data: official circuit websites, FIA circuit homologation documents',
  'Results: official series result releases',
  '',
  '## About',
  '',
  '- Site: [dord.racing](https://dord.racing)',
  '- Builder: Yann Durandet — [durandet.studio](https://durandet.studio)',
  '- Contact: the contact link in section 12 of [the privacy policy](https://dord.racing/legal/privacy)',
  '- X / Twitter: [@dord_racing](https://x.com/dord_racing)',
  '- Instagram: [@dord.racing](https://www.instagram.com/dord.racing/)',
  '- Tech stack: Astro (SSG), static JSON data files, vanilla JS',
  '- Independent fan project — not affiliated with any series, sanctioning body, or commercial rights holder',
  '',
].join('\n');

// ── Write or verify ──────────────────────────────────────────────────────────
const outputs = [
  ['public/manifest.webmanifest', JSON.stringify(manifest, null, 2) + '\n'],
  ['public/llms.txt', llms],
];

const stale = [];
for (const [path, content] of outputs) {
  let current = null;
  try { current = read(path); } catch { /* not written yet */ }
  if (current === content) continue;
  if (CHECK_ONLY) stale.push(path);
  else writeFileSync(resolve(root, path), content);
}

if (CHECK_ONLY) {
  if (stale.length) {
    console.error(`\n❌  ${stale.join(' and ')} ${stale.length > 1 ? 'are' : 'is'} out of date for the ${season} season or the series data.`);
    console.error('    Run `npm run gen:season` and commit the result.\n');
    process.exit(1);
  }
  console.log(`✓ manifest.webmanifest and llms.txt are up to date (${season} season)`);
} else {
  console.log(`✓ wrote ${outputs.map(o => o[0]).join(' and ')} for the ${season} season`);
}
