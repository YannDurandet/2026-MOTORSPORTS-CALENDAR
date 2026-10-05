#!/usr/bin/env node
/**
 * gen-pitwall.mjs — Generate a "From The Pit Wall" archive snapshot.
 *
 * Ports the data pipeline from workers/newsletter.ts (see there for the
 * live-fetch version). Reads local data/*.json instead of fetching dord.racing.
 *
 * Usage:
 *   node scripts/gen-pitwall.mjs          # Generate for the upcoming weekend
 *   node scripts/gen-pitwall.mjs --force  # Overwrite if week already exists
 *
 * Output: prepends an issue object to data/pitwall.json (creates if absent).
 * Run this on Mondays (or any day before the weekend) as part of the weekly
 * update workflow. The deploy.yml build picks up the updated file automatically.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const calendar = JSON.parse(readFileSync(resolve(root, 'data/calendar.json'), 'utf8'));
const tracks   = JSON.parse(readFileSync(resolve(root, 'data/tracks.json'),   'utf8'));
const seriesJson = JSON.parse(readFileSync(resolve(root, 'data/series.json'), 'utf8'));

const FORCE = process.argv.includes('--force');

// ── Series metadata (mirrored from workers/newsletter.ts) ─────────────────────
const SERIES_INFO = {
  f1:        { name: 'Formula 1',              abbr: 'F1'    },
  f1a:       { name: 'F1 Academy',             abbr: 'F1A'   },
  fe:        { name: 'Formula E',              abbr: 'FE'    },
  sf:        { name: 'Super Formula',          abbr: 'SF'    },
  wec:       { name: 'FIA WEC',                abbr: 'WEC'   },
  imsa:      { name: 'IMSA WeatherTech',       abbr: 'IMSA'  },
  wrc:       { name: 'WRC',                    abbr: 'WRC'   },
  erc:       { name: 'ERC',                    abbr: 'ERC'   },
  indycar:   { name: 'IndyCar',                abbr: 'IND'   },
  nascar:    { name: 'NASCAR',                 abbr: 'NAS'   },
  motogp:    { name: 'MotoGP',                 abbr: 'MGP'   },
  wsbk:      { name: 'World Superbike',        abbr: 'WSBK'  },
  dtm:       { name: 'DTM',                    abbr: 'DTM'   },
  btcc:      { name: 'BTCC',                   abbr: 'BTCC'  },
  supercars: { name: 'Supercars',              abbr: 'SCC'   },
  elms:      { name: 'ELMS',                   abbr: 'ELMS'  },
  gtwce:     { name: 'GT World Challenge EU',  abbr: 'GTWCE' },
  gtwca:     { name: 'GT World Challenge Am.', abbr: 'GTWCA' },
  nls:       { name: 'NLS / VLN',              abbr: 'NLS'   },
  igtc:      { name: 'Intercontinental GT',    abbr: 'IGTC'  },
  tcr:       { name: 'TCR Europe',             abbr: 'TCR'   },
  h24eu:     { name: '24H Series',             abbr: '24H'   },
  psc:       { name: 'Porsche Supercup',       abbr: 'PSC'   },
  bgt:       { name: 'British GT',             abbr: 'BGT'   },
  eurx:      { name: 'Euro RX',                abbr: 'ERX'   },
  'asian-le-mans': { name: 'Asian Le Mans',    abbr: 'ALMS'  },
};

const SERIES_PRIORITY = [
  'f1','wec','motogp','indycar','imsa','nascar','wsbk',
  'fe','f1a','sf','dtm','btcc','supercars','wrc','erc',
  'gtwce','gtwca','igtc','elms','nls','asian-le-mans','tcr','h24eu','psc','bgt','eurx',
];

const MONTH_MAP = { JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11 };

// ── Weekend detection ─────────────────────────────────────────────────────────
function getTargetWeekend() {
  const now = new Date();
  const dow = now.getDay();
  let daysToFri;
  if (dow === 0)      daysToFri = -2;
  else if (dow === 6) daysToFri = -1;
  else if (dow === 5) daysToFri = 0;
  else                daysToFri = 5 - dow;
  const fri = new Date(now);
  fri.setDate(now.getDate() + daysToFri);
  fri.setHours(0, 0, 0, 0);
  const sun = new Date(fri);
  sun.setDate(fri.getDate() + 2);
  sun.setHours(23, 59, 59, 999);
  return { fri, sun };
}

/** "WEEK 41 • OCT 08-11" → 41 */
function weekNumberOf(label) {
  const m = label.match(/WEEK\s+(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

// An event belongs to the target weekend when its main race (ev.date, an exact
// ISO timestamp with offset) falls between Friday 00:00 and Monday 06:00.
// Selecting by week label instead dated every label in the current year, so
// 2027 rounds with the same week number leaked into 2026 newsletters.
const PARIS_DAY = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Paris', weekday: 'short', hour: 'numeric', hourCycle: 'h23',
});

function inWeekend(date, fri, sun) {
  const ts = date ? Date.parse(date) : NaN;
  return !Number.isNaN(ts) && ts >= fri.getTime() && ts <= sun.getTime() + 6 * 3600_000;
}

/** Day bucket for one event: its race day in Paris; 'multi' for events that span the weekend. */
function eventDay(ev) {
  if (/&rsaquo;|›|\s>\s/.test(ev.time ?? '')) return 'multi';   // "THU > SUN", "SAT 15:10 › SUN 03:10"
  if (!ev.date) return null;
  const parts = PARIS_DAY.formatToParts(new Date(ev.date));
  const wd   = parts.find(p => p.type === 'weekday')?.value ?? '';
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
  if (wd === 'Mon' && hour < 6) return 'sun';
  return wd === 'Fri' ? 'fri' : wd === 'Sat' ? 'sat' : wd === 'Sun' ? 'sun' : null;
}

function buildSvgTrackMap() {
  const map = new Map();
  for (const t of tracks) {
    const svgs = [
      ...(t.calendarSvgs ?? []),
      ...(t.layouts?.flatMap(l => l.calendarSvgs) ?? []),
    ];
    if (t.browserSvg) svgs.push(t.browserSvg);
    for (const svg of svgs) map.set(svg, t);
  }
  return map;
}

function parseSessionTimes(html) {
  if (!html) return [];
  const plain = html.replace(/<[^>]+>/g, '').trim();
  const parts  = plain.split(/\s*[•·]\s*/);
  const result = [];
  for (const part of parts) {
    const colon = part.indexOf(':');
    if (colon > 0) {
      const label = part.slice(0, colon).trim();
      const time  = part.slice(colon + 1).trim();
      if (time && /\d{1,2}:\d{2}|TBC/.test(time)) result.push({ label, time });
    }
  }
  return result;
}

// ── Generate issue ────────────────────────────────────────────────────────────
function formatDateRange(fri, sun) {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const friStr = `${months[fri.getMonth()]} ${fri.getDate()}`;
  const sunStr = fri.getMonth() === sun.getMonth()
    ? `${sun.getDate()}`
    : `${months[sun.getMonth()]} ${sun.getDate()}`;
  return `${friStr}–${sunStr}, ${fri.getFullYear()}`;
}

function generateSubject(events, weekNumber) {
  for (const slug of SERIES_PRIORITY) {
    const match = events.find(e => e.series === slug);
    if (match) return `From The Pit Wall — Week ${weekNumber}: ${match.title}`;
  }
  return `From The Pit Wall — Week ${weekNumber}: This Weekend's Racing`;
}

function run() {
  const { fri, sun } = getTargetWeekend();
  const svgToTrack = buildSvgTrackMap();
  const events = [];

  let weekNumber = 0;
  for (const month of calendar) {
    for (const week of month.weeks) {
      const weekNum = weekNumberOf(week.label);
      if (weekNum === null) continue;
      for (const ev of week.events) {
        if (!inWeekend(ev.date, fri, sun)) continue;
        weekNumber ||= weekNum;
        const trackEntry = svgToTrack.get(ev.track);
        const sessions = parseSessionTimes(ev.time ?? '');
        events.push({
          series:   ev.series,
          tag:      SERIES_INFO[ev.series]?.abbr ?? ev.series.toUpperCase(),
          title:    ev.title,
          circuit:  trackEntry?.name    ?? ev.title,
          country:  trackEntry?.country ?? '',
          day:      eventDay(ev),
          trackSvg: ev.track ?? '',
          timeStr:  ev.time  ?? '',
          sessions,
        });
      }
    }
  }

  if (events.length === 0) {
    console.log('No events found for this weekend — skipping.');
    process.exit(0);
  }

  const dateRange = formatDateRange(fri, sun);
  const subject   = generateSubject(events, weekNumber);
  const today     = new Date().toISOString().slice(0, 10);

  const issue = {
    week:        weekNumber,
    dateRange,
    subject,
    generatedAt: today,
    events,
  };

  // Load existing pitwall.json or start fresh
  const pitwallPath = resolve(root, 'data/pitwall.json');
  let existing = [];
  if (existsSync(pitwallPath)) {
    existing = JSON.parse(readFileSync(pitwallPath, 'utf8'));
  }

  const alreadyExists = existing.some(i => i.week === weekNumber);
  if (alreadyExists && !FORCE) {
    console.warn(`Week ${weekNumber} already exists in pitwall.json — use --force to overwrite.`);
    process.exit(0);
  }

  const updated = alreadyExists
    ? [issue, ...existing.filter(i => i.week !== weekNumber)]
    : [issue, ...existing];

  writeFileSync(pitwallPath, JSON.stringify(updated, null, 2) + '\n');
  console.log(`✓ Generated Week ${weekNumber} — ${events.length} events — ${dateRange}`);
  console.log(`  "${subject}"`);
}

run();
