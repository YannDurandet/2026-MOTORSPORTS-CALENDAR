#!/usr/bin/env node
/**
 * find-gaps.mjs — Lists raced events that still have no result recorded.
 *
 * Usage: npm run results:gaps
 *
 * Selection is by each event's own ISO `date`, not by month name. The previous
 * version hard-coded PAST_MONTHS = JAN..JUN and ignored `month.year`, so it
 * reported next season's unraced events as missing results (37 false positives
 * against 1 real gap) while silently skipping anything from July onwards.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cal = JSON.parse(readFileSync(path.join(__dirname, '../data/calendar.json'), 'utf8'));

/** Months with no `year` field belong to the current season. */
const DEFAULT_YEAR = 2026;

// Grace period: results are rarely published the instant a race ends.
const GRACE_HOURS = Number(process.env.RESULTS_GRACE_HOURS ?? 12);
const cutoff = new Date(Date.now() - GRACE_HOURS * 3600_000);

const gaps = [];
let raced = 0;

for (const month of cal) {
  const year = month.year ?? DEFAULT_YEAR;
  for (const week of month.weeks ?? []) {
    for (const ev of week.events ?? []) {
      if (!ev.date) continue;                    // undated placeholder
      if (new Date(ev.date) > cutoff) continue;  // hasn't run yet
      raced++;
      if (!ev.results || ev.results.length === 0) {
        // `npm run results` is driven by week number, so surface it here.
        const weekNum = week.label?.match(/WEEK\s+(\d+)/)?.[1] ?? '??';
        gaps.push(
          `wk ${String(weekNum).padStart(2)}  [${year}] ` +
          `[${ev.series.toUpperCase().padEnd(8)}] ${ev.title}`
        );
      }
    }
  }
}

if (!gaps.length) {
  console.log(`✓ results:gaps — all ${raced} raced events have results`);
  process.exit(0);
}

console.log(`${gaps.length} of ${raced} raced events missing results:\n`);
gaps.forEach(g => console.log('  ' + g));
const weeks = [...new Set(gaps.map(g => g.slice(3, 5).trim()))];
console.log(`\nFill them in with:  npm run results   (weeks: ${weeks.join(', ')})`);
