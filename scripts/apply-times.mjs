#!/usr/bin/env node
/**
 * apply-times.mjs
 *
 * Takes the JSON array returned by the research AI (from gen-time-prompt.mjs)
 * and patches calendar.json, replacing "TBC" with the actual race time.
 *
 * Usage:
 *   node scripts/apply-times.mjs times.json            # from a file
 *   cat times.json | node scripts/apply-times.mjs      # from stdin (pipe)
 *   node scripts/apply-times.mjs times.json --dry-run  # show the changes, write nothing
 *
 * calendar.json is written only when at least one time was applied.
 *
 * The input JSON must be an array of objects with:
 *   { "series": "f1", "title": "British Grand Prix", "weekLabel": "WEEK 28 • JUL 5", "timeCET": "15:00" }
 *
 * Matching is: series + title + weekLabel (all three must match exactly).
 * "TBC" in the time string (bare, as calendar.json writes it, or wrapped in
 * <span class="hl">) becomes <span class="hl">HH:MM</span>, and `date` moves to
 * that time on the same Paris day, with the Paris offset for that day. The
 * clock in a TBC event's `date` is a placeholder, and countdowns, series.json
 * and the calendar feeds read `date` (AUDIT F-090). Run `npm run gen:series`
 * afterwards.
 */

import { readFileSync } from 'node:fs';
import { readJson, writeJson, findEvents, parisIsoAt, stripHtml, HHMM_RE, parseArgs } from './lib.mjs';

const CAL = 'data/calendar.json';

// Read input: file arg or stdin
const { args, has } = parseArgs();
const dryRun = has('--dry-run');
const inputFile = args[0];
let inputRaw;
if (inputFile) {
  inputRaw = readFileSync(inputFile, 'utf-8');
} else {
  // stdin (pipe). File descriptor 0 works on Windows too; /dev/stdin doesn't exist there.
  inputRaw = readFileSync(0, 'utf-8');
}

let updates;
try {
  updates = JSON.parse(inputRaw);
} catch (err) {
  console.error('Error: input is not valid JSON.\n', err.message);
  process.exit(1);
}

if (!Array.isArray(updates)) {
  console.error('Error: input JSON must be an array.');
  process.exit(1);
}

const calendar = readJson(CAL);

let applied = 0;
let notFound = 0;
let alreadySet = 0;

for (const update of updates) {
  const { series, title, weekLabel, timeCET } = update;

  if (!series || !title || !weekLabel || !timeCET) {
    console.warn(`⚠  Skipping malformed entry:`, JSON.stringify(update));
    continue;
  }

  // Validate HH:MM (00:00 to 23:59), the pattern check-data.mjs uses
  if (!HHMM_RE.test(timeCET)) {
    console.warn(`⚠  Skipping "${title}" — timeCET "${timeCET}" is not HH:MM format.`);
    continue;
  }

  const hits = findEvents(calendar, { series, title, weekLabel });

  if (!hits.length) {
    console.warn(`✗  NOT FOUND: series="${series}" title="${title}" weekLabel="${weekLabel}"`);
    notFound++;
    continue;
  }

  for (const { ev } of hits) {
    const before = ev.time;

    if (!before.includes('TBC')) {
      console.log(`⏭  ${series.toUpperCase()} ${title}: already has a time (${stripHtml(before)}), skipping`);
      alreadySet++;
      continue;
    }

    const newDate = parisIsoAt(ev.date, timeCET);
    const newTime = ev.time.replace(/<span class="hl">TBC<\/span>|\bTBC\b/, `<span class="hl">${timeCET}</span>`);
    if (!newDate || newTime === ev.time) {
      console.warn(`⚠  ${series.toUpperCase()} ${title}: could not apply ${timeCET} (time "${before}")`);
      continue;
    }
    ev.time = newTime;
    ev.date = newDate;

    const after = stripHtml(ev.time);
    console.log(`✓  ${series.toUpperCase()} ${title}: "${stripHtml(before)}" → "${after}"`);
    applied++;
  }
}

if (dryRun) {
  console.log(`\n(dry run) nothing written.`);
} else if (applied > 0) {
  // Canonical layout: 2-space indent, final newline.
  writeJson(CAL, calendar);
  console.log(`\nDone. Now run: npm run gen:series && npm run check`);
} else {
  console.log(`\nNothing applied: calendar.json not written.`);
}
console.log(`  Applied:     ${applied}`);
if (alreadySet > 0) console.log(`  Skipped (already set): ${alreadySet}`);
if (notFound > 0)  console.log(`  Not found:   ${notFound}`);
