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
const cssText       = readFileSync(resolve(root, 'src/styles/global.css'), 'utf8');
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
