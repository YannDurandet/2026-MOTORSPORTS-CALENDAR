#!/usr/bin/env node
/**
 * migrate-dates-into-calendar.mjs — One-time migration (keep in repo as history).
 *
 * Reads the existing data/series.json (positional index) and stamps `date` + `shortName`
 * onto each matching event in data/calendar.json. After this runs, series.json becomes
 * a generated artefact — never edit it by hand; use `npm run gen:series` instead.
 *
 * Usage: node scripts/migrate-dates-into-calendar.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CAL_PATH    = resolve(__dirname, '../data/calendar.json');
const SERIES_PATH = resolve(__dirname, '../data/series.json');

const calendar  = JSON.parse(readFileSync(CAL_PATH, 'utf8'));
const seriesJson = JSON.parse(readFileSync(SERIES_PATH, 'utf8'));

// Collect top-level calendar events per series in document order
const calEvents = {};
for (const month of calendar) {
  for (const week of month.weeks) {
    for (const ev of week.events) {
      if (!ev.series) continue;
      (calEvents[ev.series] ??= []).push(ev);
    }
  }
}

let errored = false;

for (const [slug, entries] of Object.entries(seriesJson)) {
  const calList = calEvents[slug] ?? [];

  if (calList.length !== entries.length) {
    console.error(
      `  ✗ [${slug}] calendar has ${calList.length} event(s) but series.json has ${entries.length} — skipping`
    );
    errored = true;
    continue;
  }

  for (let i = 0; i < entries.length; i++) {
    // Stamp in-place; preserve existing key order, new keys appended
    calList[i].date      = entries[i].date;
    calList[i].shortName = entries[i].name;
  }

  console.log(`  ✓ [${slug}] ${entries.length} event(s) stamped`);
}

if (errored) {
  console.error('\nMigration aborted for errored series above. data/calendar.json NOT written.');
  process.exit(1);
}

writeFileSync(CAL_PATH, JSON.stringify(calendar, null, 2) + '\n', 'utf8');
console.log('\n✓ Migration complete — data/calendar.json updated.');
console.log('  Run `npm run gen:series` to verify the round-trip.');
