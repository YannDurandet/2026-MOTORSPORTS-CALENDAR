#!/usr/bin/env node
/**
 * gen-series.mjs — Regenerates data/series.json from data/calendar.json.
 *
 * calendar.json is the single source of truth for race dates. Every event must
 * carry a `date` ISO string (stamped by the migration or added by hand when
 * editing calendar.json). This script errors loudly on any missing date or
 * non-ascending order so bad data never reaches production.
 *
 * buildSeries() is also imported by scripts/check-data.mjs to tell whether the
 * committed series.json is stale, so both use exactly the same rules.
 *
 * Usage: npm run gen:series
 */

import { readFileSync, writeFileSync, realpathSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CAL_PATH = resolve(__dirname, '../data/calendar.json');
const OUT_PATH = resolve(__dirname, '../data/series.json');

/**
 * { [seriesSlug]: [{ name, date }] } in calendar order, plus any problems
 * (missing dates, dates not ascending within a series).
 */
export function buildSeries(calendar) {
  const series = {};
  const errors = [];

  // ── Walk calendar in document order ───────────────────────────────────────
  for (const month of calendar) {
    for (const week of month.weeks) {
      for (const ev of week.events) {
        if (!ev.series) continue;

        if (!ev.date) {
          errors.push(`Missing date: series="${ev.series}" title="${ev.title}" week="${week.label}"`);
          continue;
        }

        (series[ev.series] ??= []).push({
          name: ev.shortName ?? ev.title.toUpperCase(),
          date: ev.date,
        });
      }
    }
  }

  // ── Validate ascending dates per series ───────────────────────────────────
  for (const [slug, entries] of Object.entries(series)) {
    for (let i = 1; i < entries.length; i++) {
      const prev = new Date(entries[i - 1].date).getTime();
      const curr = new Date(entries[i].date).getTime();
      if (curr < prev) {
        errors.push(
          `Non-ascending in "${slug}": "${entries[i - 1].name}" (${entries[i - 1].date}) ` +
          `comes after "${entries[i].name}" (${entries[i].date})`
        );
      }
    }
  }

  return { series, errors };
}

// ── Run as a script (not when imported by check-data.mjs) ──────────────────
const isMain = process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));

if (isMain) {
  const { series, errors } = buildSeries(JSON.parse(readFileSync(CAL_PATH, 'utf8')));

  if (errors.length) {
    console.error('\n❌  Generator failed:\n');
    for (const e of errors) console.error('  • ' + e);
    process.exit(1);
  }

  writeFileSync(OUT_PATH, JSON.stringify(series, null, 2) + '\n', 'utf8');

  const totalSeries = Object.keys(series).length;
  const totalEvents = Object.values(series).reduce((n, arr) => n + arr.length, 0);
  console.log(`✓ data/series.json generated — ${totalSeries} series, ${totalEvents} events`);
}
