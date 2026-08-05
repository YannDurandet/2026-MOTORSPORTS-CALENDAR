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

function parseWeekLabel(label) {
  const m = label.match(
    /WEEK\s+(\d+)\s*[•·]\s*([A-Z]{3})\s+(\d{1,2})(?:\s*[-–]\s*(?:([A-Z]{3})\s+)?(\d{1,2}))?/
  );
  if (!m) return null;
  const weekNum    = parseInt(m[1], 10);
  const startMonth = MONTH_MAP[m[2]];
  const startDay   = parseInt(m[3], 10);
  const endMonth   = m[4] ? MONTH_MAP[m[4]] : startMonth;
  const endDay     = m[5] ? parseInt(m[5], 10) : startDay;
  const now = new Date();
  const currentYear = now.getFullYear();
  const startYear = now.getMonth() >= 10 && startMonth <= 1 ? currentYear + 1 : currentYear;
  const endYear   = now.getMonth() >= 10 && endMonth   <= 1 ? currentYear + 1 : currentYear;
  return {
    weekNum,
    start: new Date(startYear, startMonth, startDay, 0, 0, 0, 0),
    end:   new Date(endYear,   endMonth,   endDay,   23, 59, 59, 999),
  };
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

function inferEventDay(seriesSlug, fri, sun) {
  const races = seriesJson[seriesSlug];
  if (!races) return null;
  const windowEnd = new Date(sun.getTime() + 6 * 3600_000);
  const inWindow = races.filter(r => {
    const ts = new Date(r.date).getTime();
    return ts >= fri.getTime() && ts <= windowEnd.getTime();
  });
  if (inWindow.length === 0) return null;
  const parisFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris', weekday: 'short', hour: 'numeric', hourCycle: 'h23',
  });
  const dayLabels = new Set();
  for (const r of inWindow) {
    const parts = parisFmt.formatToParts(new Date(r.date));
    const wd   = parts.find(p => p.type === 'weekday')?.value ?? '';
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
    if (wd === 'Mon' && hour < 6) { dayLabels.add('sun'); continue; }
    if (wd === 'Fri') { dayLabels.add('fri'); continue; }
    if (wd === 'Sat') { dayLabels.add('sat'); continue; }
    if (wd === 'Sun') { dayLabels.add('sun'); continue; }
    dayLabels.add('other');
  }
  if (dayLabels.size > 1) return 'multi';
  const only = [...dayLabels][0];
  if (only === 'fri' || only === 'sat' || only === 'sun') return only;
  return null;
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

  for (const month of calendar) {
    for (const week of month.weeks) {
      const parsed = parseWeekLabel(week.label);
      if (!parsed) continue;
      if (parsed.end < fri || parsed.start > sun) continue;

      for (const ev of week.events) {
        const trackEntry = svgToTrack.get(ev.track);
        const sessions = parseSessionTimes(ev.time ?? '');
        events.push({
          series:   ev.series,
          tag:      SERIES_INFO[ev.series]?.abbr ?? ev.series.toUpperCase(),
          title:    ev.title,
          circuit:  trackEntry?.name    ?? ev.title,
          country:  trackEntry?.country ?? '',
          day:      inferEventDay(ev.series, fri, sun),
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

  // Determine week number from the first matched week label
  let weekNumber = 0;
  for (const month of calendar) {
    for (const week of month.weeks) {
      const parsed = parseWeekLabel(week.label);
      if (!parsed) continue;
      if (parsed.end >= fri && parsed.start <= sun) {
        weekNumber = parsed.weekNum;
        break;
      }
    }
    if (weekNumber) break;
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
