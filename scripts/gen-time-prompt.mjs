#!/usr/bin/env node
/**
 * gen-time-prompt.mjs
 *
 * Generates a focused research prompt listing TBC events for one month.
 * Defaults to the current calendar month. Pass a month name to override.
 * Use --all to dump every TBC event (split across multiple AI calls if many).
 *
 * Usage:
 *   node scripts/gen-time-prompt.mjs              # current month
 *   node scripts/gen-time-prompt.mjs AUGUST       # specific month
 *   node scripts/gen-time-prompt.mjs "WEEK 28"    # single week
 *   node scripts/gen-time-prompt.mjs --all        # everything
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const calendar = JSON.parse(readFileSync(join(__dir, '../data/calendar.json'), 'utf-8'));

const MONTH_NAMES = [
  'JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
  'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER',
];

const rawArg = (process.argv[2] || '').trim();
const allMode = rawArg === '--all';
const currentMonthName = MONTH_NAMES[new Date().getMonth()];
const filterArg = allMode ? '' : (rawArg.toUpperCase() || currentMonthName);

function stripHtml(s) { return s.replace(/<[^>]+>/g, ''); }

function isTBC(ev) { return ev.time.includes('TBC'); }

function matchesFilter(month, week) {
  if (!filterArg) return true;
  return (
    month.month.includes(filterArg) ||
    filterArg.includes(month.month.slice(0, 3)) ||
    week.label.toUpperCase().includes(filterArg)
  );
}

// Collect stubs: timeCET = "??" for the AI to fill in
const stubs = [];

for (const month of calendar) {
  for (const week of month.weeks) {
    if (!matchesFilter(month, week)) continue;
    for (const ev of week.events) {
      if (!isTBC(ev)) continue;
      stubs.push({
        month:     month.month,
        weekLabel: week.label,
        series:    ev.series,
        title:     ev.title,
        timeCET:   '??',
        _disp:     stripHtml(ev.time),
      });
    }
  }
}

if (stubs.length === 0) {
  const label = allMode ? 'the full calendar' : (rawArg || currentMonthName);
  console.log('No TBC events found for ' + label + '.');
  process.exit(0);
}

if (stubs.length > 30 && !allMode) {
  process.stderr.write('Warning: ' + stubs.length + ' events -- consider filtering to a single month for better AI accuracy.\n');
}

// Build a human-readable event list as comment lines above the JSON
const commentLines = [];
let lastWeek = '';
for (const s of stubs) {
  if (s.weekLabel !== lastWeek) {
    commentLines.push('// ' + s.month + ' -- ' + s.weekLabel);
    lastWeek = s.weekLabel;
  }
  commentLines.push('//   [' + s.series + '] ' + s.title + '  (currently: ' + s._disp + ')');
}

// Clean JSON stubs (no _disp or month)
const jsonStubs = stubs.map(function(s) {
  return { series: s.series, title: s.title, weekLabel: s.weekLabel, timeCET: '??' };
});

const out = [
  'Find the main race start time (Paris CET/CEST) for each event below.',
  'CET = UTC+1 (Nov-Mar), CEST = UTC+2 (late Mar - late Oct).',
  'Main race only -- not practice, not qualifying.',
  '24-hour HH:MM format. If you cannot confirm a time, remove that entry from the array.',
  'Return ONLY the JSON array with "??" replaced by real times. No prose, no code fences.',
  '',
  'Events:',
].concat(commentLines).concat([
  '',
  'Fill in this JSON:',
  JSON.stringify(jsonStubs, null, 2),
]);

console.log(out.join('\n'));

process.stderr.write('\n-> ' + stubs.length + ' TBC event(s). Filter: "' + (filterArg || 'none (--all)') + '"\n');
process.stderr.write('   Save AI response to a file, then run:\n');
process.stderr.write('   node scripts/apply-times.mjs <response-file.json>\n');
