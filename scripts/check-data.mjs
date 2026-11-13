#!/usr/bin/env node
/**
 * check-data.mjs — Data integrity checks.
 * Collects every failure before printing; exits 1 if any found.
 * Usage: npm run check
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { buildSeries } from './gen-series.mjs';
import { hasEventPage, pageSlugs } from '../src/lib/eventSlugs.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const fail  = [];   // accumulated failure messages
let checked = 0;    // count of individual items verified

// `test` gets (item, index): the standings check needs the index to compare
// each row with the one before it.
function check(label, items, test) {
  items.forEach((item, i) => {
    checked++;
    const msg = test(item, i);
    if (msg) fail.push(`[${label}] ${msg}`);
  });
}

// ── Load data ────────────────────────────────────────────────────────────────

const calendar      = JSON.parse(readFileSync(resolve(root, 'data/calendar.json'), 'utf8'));
const seriesJson    = JSON.parse(readFileSync(resolve(root, 'data/series.json'), 'utf8'));
const tracksJson    = JSON.parse(readFileSync(resolve(root, 'data/tracks.json'), 'utf8'));
const seriesContent = JSON.parse(readFileSync(resolve(root, 'data/seriesContent.json'), 'utf8'));
const standingsJson = JSON.parse(readFileSync(resolve(root, 'data/standings.json'), 'utf8'));
// Series colour vars are defined in tokens.css; .t-{slug} tag rules live in global.css.
const cssText       = ['src/styles/tokens.css', 'src/styles/global.css']
  .map(f => readFileSync(resolve(root, f), 'utf8')).join('\n');
const mainJsText    = readFileSync(resolve(root, 'src/scripts/main.js'), 'utf8');

// ── Helpers ──────────────────────────────────────────────────────────────────

// Every event needs these as non-empty strings. An event missing one is
// reported by name and left out of the later checks, which would otherwise
// stop on a TypeError (ev.date.slice, ev.title.toUpperCase…).
const REQUIRED_FIELDS = ['series', 'title', 'time', 'track', 'date'];

// Collect calendar events in document order, grouped by series
function collectCalEvents() {
  const bySlug = {};
  const all = [];
  for (const month of calendar) {
    for (const week of month.weeks ?? []) {
      for (const ev of week.events ?? []) {
        checked++;
        const missing = REQUIRED_FIELDS.filter(k => typeof ev[k] !== 'string' || !ev[k].trim());
        if (missing.length) {
          fail.push(`[required-fields] ${ev.series ?? '(no series)'} "${ev.title ?? '(no title)'}" in "${week.label}" (${month.month}${month.year ? ' ' + month.year : ''}) has no ${missing.join(', ')}`);
          continue;
        }
        (bySlug[ev.series] ??= []).push(ev);
        all.push({ ev, week, month });
      }
    }
  }
  return { bySlug, all };
}

const { bySlug: calBySeries, all: allEvents } = collectCalEvents();
const allSeriesInCal = [...new Set(allEvents.map(({ ev }) => ev.series))];

// seriesContent slugs
const contentSlugs = new Set(seriesContent.map(s => s.slug));

// seriesMetadata keys extracted by regex (handles bare keys and quoted keys)
const metaKeyRe = /(?:^|\s)(?:'([^']+)'|(\w[\w-]*))\s*:\s*\{/gm;
let metaBlock = mainJsText.slice(mainJsText.indexOf('const seriesMetadata = {'));
metaBlock = metaBlock.slice(0, metaBlock.indexOf('\n};') + 3);
const metaKeys = new Set();
let m;
while ((m = metaKeyRe.exec(metaBlock)) !== null) {
  metaKeys.add(m[1] ?? m[2]);
}

// seriesLabels keys (main.js): a slug missing there gets a filter button
// that reads "undefined".
let labelBlock = mainJsText.slice(mainJsText.indexOf('const seriesLabels = {'));
labelBlock = labelBlock.slice(0, labelBlock.indexOf('};') + 2);
const labelKeys = new Set([...labelBlock.matchAll(/(?:'([^']+)'|(\w[\w-]*))\s*:\s*'/g)].map(m => m[1] ?? m[2]));

// CSS helpers
function hasCssVar(slug) {
  return new RegExp(`--${slug}[^a-zA-Z0-9_-]`).test(cssText);
}
function hasCssTagRule(slug) {
  // Matches `.t-{slug}` or `.t-{slug} ` or `.t-{slug}{`
  return new RegExp(`\\.t-${slug.replace(/-/g, '\\-')}[\\s{,]`).test(cssText);
}

// ── (a) series.json regeneration deep-compare ────────────────────────────────
{
  // Regenerate in memory with the generator itself, so the two can't drift.
  const { series: generated, errors: genErrors } = buildSeries(calendar);
  for (const e of genErrors) { checked++; fail.push(`[series.json] ${e}`); }

  const committedKeys = Object.keys(seriesJson);
  const generatedKeys = Object.keys(generated);

  for (const k of [...new Set([...committedKeys, ...generatedKeys])]) {
    checked++;
    const committed = seriesJson[k];
    const gen = generated[k];
    if (!committed) { fail.push(`[series.json stale] key "${k}" in generated but missing from committed file`); continue; }
    if (!gen)       { fail.push(`[series.json stale] key "${k}" in committed file but not found in calendar.json`); continue; }
    if (JSON.stringify(committed) !== JSON.stringify(gen)) {
      fail.push(`[series.json stale] "${k}" differs — run \`npm run gen:series\``);
    }
  }
}

// ── (b) series.json date validity + ascending order ──────────────────────────
for (const [slug, entries] of Object.entries(seriesJson)) {
  let prevTs = -Infinity;
  let prevName = '';
  for (const { name, date } of entries) {
    checked++;
    const ts = new Date(date).getTime();
    if (isNaN(ts)) {
      fail.push(`[dates] "${slug}" → "${name}" has unparseable date: ${date}`);
      prevTs = -Infinity; prevName = name; continue;
    }
    if (ts < prevTs) {
      fail.push(`[dates] "${slug}" non-ascending: "${prevName}" > "${name}" (${date})`);
    }
    prevTs = ts; prevName = name;
  }
}

// ── (c) calendar ev.track exists on disk ─────────────────────────────────────
const svgDir = resolve(root, 'public/assets/track-maps');
check('track-svgs', allEvents, ({ ev }) => {
  if (!ev.track) return null;
  const file = resolve(svgDir, ev.track);
  if (!existsSync(file)) return `"${ev.track}" not found on disk (series: ${ev.series})`;
  return null;
});

// ── (d) tracks.json browserSvg + calendarSvgs exist ─────────────────────────
for (const track of tracksJson) {
  if (track.browserSvg) {
    checked++;
    if (!existsSync(resolve(svgDir, track.browserSvg))) {
      fail.push(`[tracks.json] "${track.slug}" browserSvg "${track.browserSvg}" not found on disk`);
    }
  }
  for (const svg of track.calendarSvgs ?? []) {
    checked++;
    if (!existsSync(resolve(svgDir, svg))) {
      fail.push(`[tracks.json] "${track.slug}" calendarSvgs entry "${svg}" not found on disk`);
    }
  }
  for (const layout of track.layouts ?? []) {
    for (const svg of layout.calendarSvgs ?? []) {
      checked++;
      if (!existsSync(resolve(svgDir, svg))) {
        fail.push(`[tracks.json] "${track.slug}" layouts[${layout.id}] calendarSvgs entry "${svg}" not found on disk`);
      }
    }
  }
}

// ── (e) every calendar series key is fully registered ────────────────────────
check('series-registration', allSeriesInCal, slug => {
  const msgs = [];
  if (!seriesJson[slug])     msgs.push('missing from series.json');
  if (!contentSlugs.has(slug)) msgs.push('missing from seriesContent.json');
  if (!metaKeys.has(slug))   msgs.push('missing from seriesMetadata in main.js');
  if (!labelKeys.has(slug))  msgs.push('missing from seriesLabels in main.js');
  if (!hasCssVar(slug))      msgs.push(`no --${slug} CSS variable`);
  if (!hasCssTagRule(slug))  msgs.push(`no .t-${slug} CSS rule`);
  return msgs.length ? `"${slug}": ${msgs.join(', ')}` : null;
});

// ── (f) email PNGs exist for every non-WRC, non-placeholder track ────────────
const emailDir = resolve(root, 'public/assets/tracks/email');
check('email-pngs', allEvents, ({ ev }) => {
  if (!ev.track) return null;
  // Skip WRC flag SVGs, placeholder SVGs
  if (ev.track.endsWith('-wrc.svg')) return null;
  if (ev.track === 'tbc.svg' || ev.track === 'tbd.svg') return null;
  const base = basename(ev.track, '.svg');
  const pngPath = resolve(emailDir, base + '.png');
  if (!existsSync(pngPath)) {
    return `"${base}.png" missing for track "${ev.track}" (series: ${ev.series})`;
  }
  return null;
});

// ── (g) result entries have valid YYYY-MM-DD dates ───────────────────────────
const isoDateRe = /^\d{4}-\d{2}-\d{2}$/;
check('result-dates', allEvents, ({ ev, week }) => {
  if (!ev.results) return null;
  for (const r of ev.results) {
    if (!r.date) return `[${ev.series}] "${ev.title}" (${week.label}) result missing "date"`;
    if (!isoDateRe.test(r.date)) return `[${ev.series}] "${ev.title}" (${week.label}) result date "${r.date}" is not YYYY-MM-DD`;
  }
  return null;
});

// ── (g1) optional display fields: classes, sessions, support-race times ─────
// `time` stays the source for the chip and countdowns; `sessions` is the richer
// view of the same weekend, so its race must agree with it.
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const hhmmRe = /^([01]\d|2[0-3]):[0-5]\d$/;
const durationRe = /^(\d+h(\d{2})?|\d+min)$/;
const plainTime = (html) => html.replace(/<[^>]*>/g, '');
const parisParts = (iso) => {
  const d = new Date(iso);
  const f = (opts) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', ...opts }).format(d);
  return { day: f({ weekday: 'short' }).toUpperCase(), hhmm: f({ hour: '2-digit', minute: '2-digit', hour12: false }) };
};
check('event-display-fields', allEvents, ({ ev, week }) => {
  const id = `[${ev.series}] "${ev.title}" (${week.label})`;
  if (ev.classes !== undefined) {
    if (!Array.isArray(ev.classes) || !ev.classes.length || ev.classes.some(c => typeof c !== 'string' || !c.trim())) {
      return `${id} "classes" must be a non-empty array of non-empty strings`;
    }
  }
  for (const s of ev.sub ?? []) {
    if (s.time !== undefined && !hhmmRe.test(s.time)) return `${id} sub "${s.label}" time "${s.time}" is not HH:MM`;
    if (s.day !== undefined && !DAYS.includes(s.day)) return `${id} sub "${s.label}" day "${s.day}" is not MON–SUN`;
    if (s.time && !s.day) return `${id} sub "${s.label}" has a time but no day`;
  }
  if (ev.sessions === undefined) return null;
  if (!Array.isArray(ev.sessions) || !ev.sessions.length) return `${id} "sessions" must be a non-empty array`;
  let prev = -1;
  for (const s of ev.sessions) {
    if (!DAYS.includes(s.day)) return `${id} session day "${s.day}" is not MON–SUN`;
    if (!s.label || typeof s.label !== 'string') return `${id} session on ${s.day} has no label`;
    if (!hhmmRe.test(s.time ?? '')) return `${id} session "${s.label}" time "${s.time}" is not HH:MM`;
    if (s.duration !== undefined && !durationRe.test(s.duration)) return `${id} session "${s.label}" duration "${s.duration}" is not like "2h40", "6h" or "45min"`;
    const idx = DAYS.indexOf(s.day);
    if (idx < prev) return `${id} sessions must be in weekday order (${s.day} "${s.label}" comes after a later day)`;
    prev = idx;
  }
  // The single RACE session must match both `time` and `date`.
  const races = ev.sessions.filter(s => /^RACE$/i.test(s.label));
  const timeRaces = [...plainTime(ev.time).matchAll(/RACE:?\s*(\d{2}:\d{2})/gi)].map(m => m[1]);
  if (races.length === 1 && timeRaces.length === 1 && races[0].time !== timeRaces[0]) {
    return `${id} sessions RACE ${races[0].time} disagrees with time "${plainTime(ev.time)}"`;
  }
  if (races.length === 1) {
    const p = parisParts(ev.date);
    if (p.hhmm === races[0].time && p.day !== races[0].day) {
      return `${id} sessions RACE is on ${races[0].day} but date falls on ${p.day}`;
    }
  }
  return null;
});

// ── (g2) every winner / standings country code has a flag file ──────────────
// An unknown code ("SW" for Sweden) renders a broken image on results pages.
const flagDir = resolve(root, 'public/assets/flags');
const hasFlag = (code) => existsSync(resolve(flagDir, `${code}.svg`));
check('result-flags', allEvents, ({ ev, week }) => {
  for (const r of ev.results ?? []) {
    if (r.country && !hasFlag(r.country)) return `[${ev.series}] "${ev.title}" (${week.label}) country "${r.country}" has no public/assets/flags/${r.country}.svg`;
  }
  return null;
});
for (const [slug, tables] of Object.entries(standingsJson)) {
  for (const [tab, table] of Object.entries(tables)) {
    for (const e of table.entries ?? []) {
      checked++;
      if (e.country && !hasFlag(e.country)) fail.push(`[standings.json] ${slug}.${tab} "${e.name}" country "${e.country}" has no flag SVG`);
    }
  }
}

// ── (g3) _redirects: one rule per path ──────────────────────────────────────
// Cloudflare rejects the whole deploy on a duplicate path, and `wrangler dev`
// doesn't catch it. Astro's config `redirects` are appended to the same file,
// so they must stay empty.
{
  const lines = readFileSync(resolve(root, 'public/_redirects'), 'utf8').split('\n')
    .map(l => l.replace(/#.*/, '').trim()).filter(Boolean);
  const seen = new Set();
  for (const l of lines) {
    checked++;
    const src = l.split(/\s+/)[0];
    if (seen.has(src)) fail.push(`[public/_redirects] duplicate rule for ${src}`);
    seen.add(src);
  }
  checked++;
  if (/^\s*redirects\s*:/m.test(readFileSync(resolve(root, 'astro.config.mjs'), 'utf8')))
    fail.push('[astro.config.mjs] has `redirects`: put them in public/_redirects instead (Astro appends them there and duplicates fail the deploy)');
}

// ── (g4) season consistency: year, week range, event URLs, F1 weekends ──────
// Every month carries its `year` (checked first: a month without one would
// silently follow DEFAULT_CALENDAR_YEAR in src/lib/season.ts and jump to the
// next season when the site rolls over). An event filed under the wrong month
// renders in the wrong year and converts its times with the wrong DST offset,
// and nothing else notices, so the invariants are enforced here.
const defaultYear = Number(
  /DEFAULT_CALENDAR_YEAR\s*=\s*(\d{4})/.exec(readFileSync(resolve(root, 'src/lib/season.ts'), 'utf8'))?.[1],
);
checked++;
if (!defaultYear) {
  fail.push('[season] could not read DEFAULT_CALENDAR_YEAR from src/lib/season.ts');
} else {
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const DAY_MS = 864e5;
  const yearOf = (month) => month.year ?? defaultYear;
  check('month-year', calendar, (month) =>
    Number.isInteger(month.year) ? null
      : `${month.month} has no "year": add one (e.g. "year": ${defaultYear}) right after "month" in data/calendar.json`);
  const dayOf = (iso) => { const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return Date.UTC(y, m - 1, d); };

  // "WEEK 45 • NOV 06-08", "WEEK 09 • FEB 28 - MAR 01" or "WEEK 02 • JAN 10"
  // → UTC day numbers, rolling into the next year when the week crosses New Year.
  function weekSpan(label, year) {
    const m = /•\s*([A-Z]{3})\s+(\d{1,2})(?:\s*[-–]\s*(?:([A-Z]{3})\s+)?(\d{1,2}))?\s*$/.exec(label);
    if (!m || !MONTHS.includes(m[1])) return null;
    const startMonth = MONTHS.indexOf(m[1]);
    const endMonth = m[3] ? MONTHS.indexOf(m[3]) : startMonth;
    const endDay = Number(m[4] ?? m[2]);
    const start = Date.UTC(year, startMonth, Number(m[2]));
    let end = Date.UTC(year, endMonth, endDay);
    if (end < start) end = Date.UTC(year + 1, endMonth, endDay);
    return { start, end };
  }
  const yearFits = ({ ev, week, month }) => {
    const year = yearOf(month);
    const span = weekSpan(week.label, year);
    const evYear = Number(ev.date.slice(0, 4));
    return evYear === year || (span !== null && evYear === new Date(span.end).getUTCFullYear());
  };

  // (g4a) the event's date is in the year of the month it is filed under
  check('season-year', allEvents, (item) => {
    if (yearFits(item)) return null;
    const { ev, month } = item;
    return `[${ev.series}] "${ev.title}" is dated ${ev.date.slice(0, 10)} but filed under ${month.month} ${yearOf(month)}: move it to a month of its own year (later seasons are tagged "year")`;
  });

  // (g4b) the week label contains the event's date. `date` is Paris time, so a
  // late-evening US race lands a day after the weekend: allow one day either side.
  check('week-range', allEvents, (item) => {
    const { ev, week, month } = item;
    const id = `[${ev.series}] "${ev.title}"`;
    const span = weekSpan(week.label, yearOf(month));
    if (!span) return `${id} week label "${week.label}" is not like "WEEK 45 • NOV 06-08"`;
    if (!yearFits(item)) return null;   // already reported by season-year
    const t = dayOf(ev.date);
    if (t < span.start - DAY_MS || t > span.end + DAY_MS) {
      return `${id} is dated ${ev.date.slice(0, 10)} but sits in "${week.label}" (${month.month})`;
    }
    return null;
  });

  // (g4c) every event page gets a unique URL. The slugs come from
  // src/lib/eventSlugs.js, the module the site builds them with: a repeated
  // series+title in one year gets a month suffix, so a clash is the same title
  // twice in the same month, or two pinned slugs.
  {
    const pages = allEvents.filter(({ ev }) => hasEventPage(ev));
    const slugs = pageSlugs(pages.map(it => ({ year: yearOf(it.month), ev: it.ev })));
    const slugOf = new Map(pages.map((it, i) => [it, slugs[i]]));
    const owners = new Map();
    check('event-urls', pages, (it) => {
      const { ev } = it;
      const url = `/events/${yearOf(it.month)}/${slugOf.get(it)}`;
      const other = owners.get(url);
      owners.set(url, `[${ev.series}] "${ev.title}" (${ev.date.slice(0, 10)})`);
      return other
        ? `${url} is used by both ${other} and [${ev.series}] "${ev.title}" (${ev.date.slice(0, 10)}): pin one with "slug"`
        : null;
    });
  }

  // (g4c1) no event URL disappears. Slugs follow titles unless `slug` pins
  // them, and a second event with the same series and title adds a month
  // suffix, so an edit can silently move an indexed page. Compare with the
  // last commit: every URL it produced must still exist, or have a line in
  // public/_redirects. Skipped (with a note) where git or HEAD isn't available.
  {
    const urlsOf = (cal, defYear) => {
      const yearOfM = (month) => month.year ?? defYear;
      const pages = cal.flatMap(month => (month.weeks ?? []).flatMap(week =>
        (week.events ?? []).filter(hasEventPage).map(ev => ({ year: yearOfM(month), ev }))));
      return new Set(pageSlugs(pages).map((slug, i) => `/events/${pages[i].year}/${slug}`));
    };
    let headCal = null, headYear = defaultYear;
    try {
      const git = (p) => execFileSync('git', ['show', `HEAD:${p}`], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      headCal = JSON.parse(git('data/calendar.json'));
      headYear = Number(/DEFAULT_CALENDAR_YEAR\s*=\s*(\d{4})/.exec(git('src/lib/season.ts'))?.[1]) || defaultYear;
    } catch {
      console.log('  (event-urls-kept skipped: no git history to compare with)');
    }
    if (headCal) {
      const now = urlsOf(calendar, defaultYear);
      const redirected = new Set(readFileSync(resolve(root, 'public/_redirects'), 'utf8')
        .split('\n').map(l => l.trim().split(/\s+/)[0]).filter(p => p && !p.startsWith('#')));
      const lost = [...urlsOf(headCal, headYear)].filter(u => !now.has(u) && !redirected.has(u));
      checked++;
      for (const u of lost) {
        fail.push(`[event-urls-kept] ${u} existed in the last commit and is gone: pin the old URL with "slug", or add a 301 for it to public/_redirects`);
      }
    }
  }

  // (g4c2) home-page week-card ids stay unique. A week split across two months
  // ("WEEK 09 • FEB 27 - MAR 01", "WEEK 09 • MAR 01") has two cards: index.astro
  // gives the second "-b", so a third card for the same week would repeat an id.
  {
    const cards = new Map();
    const weeks = calendar.flatMap(month => (month.weeks ?? []).map(week => ({ month, week })));
    check('week-ids', weeks, ({ month, week }) => {
      const n = /WEEK (\d+)/.exec(week.label)?.[1];
      if (!n) return null;
      const key = `${yearOf(month)}/${n}`;
      const seen = (cards.get(key) ?? 0) + 1;
      cards.set(key, seen);
      return seen > 2 ? `week ${n} of ${yearOf(month)} has ${seen} cards (third: "${week.label}"), so a card id would repeat` : null;
    });
  }

  // (g4d) every F1 round carries its own weekend (start/end), and it matches the date
  check('f1-weekends', allEvents.filter(({ ev }) => ev.series === 'f1'), ({ ev, week }) => {
    const id = `[f1] "${ev.title}" (${week.label})`;
    if (!ev.start || !ev.end) return `${id} is missing "start"/"end" (set for every F1 round)`;
    if (!isoDateRe.test(ev.start) || !isoDateRe.test(ev.end)) return `${id} start "${ev.start}" / end "${ev.end}" must be YYYY-MM-DD`;
    if (ev.start > ev.end) return `${id} start ${ev.start} is after end ${ev.end}`;
    if (dayOf(ev.end) - dayOf(ev.start) > 6 * DAY_MS) return `${id} weekend ${ev.start} to ${ev.end} is longer than a week`;
    const t = dayOf(ev.date);
    if (t < dayOf(ev.start) - DAY_MS || t > dayOf(ev.end) + DAY_MS) {
      return `${id} is dated ${ev.date.slice(0, 10)} but its weekend is ${ev.start} to ${ev.end}`;
    }
    return null;
  });
}

// ── (h) standings.json structure ─────────────────────────────────────────────
const validSeriesSlugs = new Set([...Object.keys(seriesJson), 'asian-le-mans']);

for (const [slug, tables] of Object.entries(standingsJson)) {
  checked++;
  if (!validSeriesSlugs.has(slug) && !seriesContent.some(s => s.slug === slug)) {
    fail.push(`[standings.json] unknown series slug "${slug}"`);
  }

  for (const [tableKey, table] of Object.entries(tables)) {
    const prefix = `[standings.json] ${slug}.${tableKey}`;

    checked++;
    if (!table.label) fail.push(`${prefix}: missing "label"`);

    checked++;
    if (!table.updatedAt || !isoDateRe.test(table.updatedAt)) {
      fail.push(`${prefix}: "updatedAt" must be YYYY-MM-DD (got "${table.updatedAt}")`);
    }

    checked++;
    if (typeof table.roundsComplete !== 'number' || table.roundsComplete < 0) {
      fail.push(`${prefix}: "roundsComplete" must be a non-negative number`);
    }

    checked++;
    if (typeof table.totalRounds !== 'number' || table.totalRounds < 1) {
      fail.push(`${prefix}: "totalRounds" must be a positive number`);
    }

    if (!Array.isArray(table.entries) || table.entries.length === 0) {
      checked++;
      fail.push(`${prefix}: "entries" must be a non-empty array`);
      continue;
    }

    check(`standings ${slug}.${tableKey} entries`, table.entries, (entry, i) => {
      const msgs = [];
      if (typeof entry.pos !== 'number')     msgs.push(`entry[${i}] missing numeric "pos"`);
      if (!entry.name)                        msgs.push(`entry[${i}] missing "name"`);
      if (typeof entry.points !== 'number')  msgs.push(`entry[${i}] missing numeric "points"`);
      if (i > 0 && entry.pos !== table.entries[i - 1].pos + 1) {
        msgs.push(`entry[${i}] pos ${entry.pos} is not sequential (expected ${table.entries[i - 1].pos + 1})`);
      }
      return msgs.join('; ') || null;
    });
  }
}

// ── Report ───────────────────────────────────────────────────────────────────

if (fail.length) {
  console.error(`\n❌  check-data: ${fail.length} failure(s) found:\n`);
  for (const msg of fail) console.error('  • ' + msg);
  console.error('');
  process.exit(1);
}

console.log(`✓ check-data: all ${checked} checks passed`);
