#!/usr/bin/env node
/**
 * check-data.mjs — Data integrity checks.
 * Collects every failure before printing; exits 1 if any found.
 * Usage: npm run check
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const fail  = [];   // accumulated failure messages
let checked = 0;    // count of individual items verified

function check(label, items, test) {
  for (const item of items) {
    checked++;
    const msg = test(item);
    if (msg) fail.push(`[${label}] ${msg}`);
  }
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

// Collect calendar events in document order, grouped by series
function collectCalEvents() {
  const bySlug = {};
  const all = [];
  for (const month of calendar) {
    for (const week of month.weeks) {
      for (const ev of week.events) {
        if (!ev.series) continue;
        (bySlug[ev.series] ??= []).push(ev);
        all.push({ ev, week });
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
  // Regenerate in-memory using same logic as gen-series.mjs
  const generated = {};
  for (const { ev } of allEvents) {
    (generated[ev.series] ??= []).push({
      name: ev.shortName ?? ev.title.toUpperCase(),
      date: ev.date,
    });
  }

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

// ── (h) standings.json structure ─────────────────────────────────────────────
const isoDateRe2 = /^\d{4}-\d{2}-\d{2}$/;
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
    if (!table.updatedAt || !isoDateRe2.test(table.updatedAt)) {
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
