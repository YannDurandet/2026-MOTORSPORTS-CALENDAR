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

import { readJson, writeJson, walkCalendar, isMain } from './lib.mjs';

/**
 * { [seriesSlug]: [{ name, date }] } in calendar order, plus any problems
 * (missing dates, dates not ascending within a series).
 */
export function buildSeries(calendar) {
  const series = {};
  const errors = [];

  // ── Walk calendar in document order ───────────────────────────────────────
  for (const { week, ev } of walkCalendar(calendar)) {
    if (!ev.series) continue;

    if (!ev.date) {
      errors.push(`Missing date: series="${ev.series}" title="${ev.title}" week="${week.label}"`);
      continue;
    }
    if (typeof (ev.shortName ?? ev.title) !== 'string') {
      errors.push(`Missing title: series="${ev.series}" date="${ev.date}" week="${week.label}"`);
      continue;
    }

    (series[ev.series] ??= []).push({
      name: ev.shortName ?? ev.title.toUpperCase(),
      date: ev.date,
    });
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
if (isMain(import.meta.url)) {
  const { series, errors } = buildSeries(readJson('data/calendar.json'));

  if (errors.length) {
    console.error('\n❌  Generator failed:\n');
    for (const e of errors) console.error('  • ' + e);
    process.exit(1);
  }

  writeJson('data/series.json', series);

  const totalSeries = Object.keys(series).length;
  const totalEvents = Object.values(series).reduce((n, arr) => n + arr.length, 0);
  console.log(`✓ data/series.json generated — ${totalSeries} series, ${totalEvents} events`);
}
