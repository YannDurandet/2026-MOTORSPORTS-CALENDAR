#!/usr/bin/env node
/**
 * gen-series.mjs — Regenerates data/series.json from data/calendar.json.
 *
 * calendar.json is the single source of truth for race dates. Every event must
 * carry a `date` ISO string (stamped by the migration or added by hand when
 * editing calendar.json). This script errors loudly on any missing date or
 * non-ascending order so bad data never reaches production.
 *
 * Usage: npm run gen:series
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CAL_PATH = resolve(__dirname, '../data/calendar.json');
const OUT_PATH = resolve(__dirname, '../data/series.json');

const calendar = JSON.parse(readFileSync(CAL_PATH, 'utf8'));

const result = {};   // { [seriesSlug]: [{ name, date }] }
const errors = [];

// ── Walk calendar in document order ─────────────────────────────────────────

for (const month of calendar) {
  for (const week of month.weeks) {
    for (const ev of week.events) {
      if (!ev.series) continue;

      if (!ev.date) {
        errors.push(
          `Missing date: series="${ev.series}" title="${ev.title}" week="${week.label}"`
        );
        continue;
      }

      (result[ev.series] ??= []).push({
        name: ev.shortName ?? ev.title.toUpperCase(),
        date: ev.date,
      });
    }
  }
}

if (errors.length) {
  console.error('\n❌  Generator failed — missing dates:\n');
  for (const e of errors) console.error('  • ' + e);
  process.exit(1);
}

// ── Validate ascending dates per series ─────────────────────────────────────

for (const [slug, entries] of Object.entries(result)) {
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

if (errors.length) {
  console.error('\n❌  Generator failed — dates not ascending:\n');
  for (const e of errors) console.error('  • ' + e);
  process.exit(1);
}

// ── Write output ─────────────────────────────────────────────────────────────

writeFileSync(OUT_PATH, JSON.stringify(result, null, 2) + '\n', 'utf8');

const totalSeries = Object.keys(result).length;
const totalEvents = Object.values(result).reduce((n, arr) => n + arr.length, 0);
console.log(`✓ data/series.json generated — ${totalSeries} series, ${totalEvents} events`);
