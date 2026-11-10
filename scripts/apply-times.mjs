#!/usr/bin/env node
/**
 * apply-times.mjs
 *
 * Takes the JSON array returned by the research AI (from gen-time-prompt.mjs)
 * and patches calendar.json, replacing "TBC" with the actual race time.
 *
 * Usage:
 *   node scripts/apply-times.mjs times.json       # from a file
 *   cat times.json | node scripts/apply-times.mjs # from stdin (pipe)
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

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const CALENDAR_PATH = join(__dir, '../data/calendar.json');

// Read input: file arg or stdin
let inputRaw;
const inputFile = process.argv[2];
if (inputFile) {
  inputRaw = readFileSync(inputFile, 'utf-8');
} else {
  // stdin — works with pipe
  inputRaw = readFileSync('/dev/stdin', 'utf-8');
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

const calendar = JSON.parse(readFileSync(CALENDAR_PATH, 'utf-8'));

const parisParts = (ms) => Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Paris', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
}).formatToParts(new Date(ms)).map(p => [p.type, p.value]));

/** "2027-02-14T04:30:00+01:00": HH:MM on the Paris day of `iso`, with the right Paris offset. */
function parisIso(iso, hhmm) {
  const p = parisParts(Date.parse(iso));
  const day = `${p.year}-${p.month}-${p.day}`;
  for (const offset of ['+01:00', '+02:00']) {
    const candidate = `${day}T${hhmm}:00${offset}`;
    const back = parisParts(Date.parse(candidate));
    if (`${back.year}-${back.month}-${back.day}` === day && `${back.hour}:${back.minute}` === hhmm) return candidate;
  }
  return null; // a time skipped by the spring clock change
}

let applied = 0;
let notFound = 0;
let alreadySet = 0;

for (const update of updates) {
  const { series, title, weekLabel, timeCET } = update;

  if (!series || !title || !weekLabel || !timeCET) {
    console.warn(`⚠  Skipping malformed entry:`, JSON.stringify(update));
    continue;
  }

  // Validate HH:MM format
  if (!/^\d{2}:\d{2}$/.test(timeCET)) {
    console.warn(`⚠  Skipping "${title}" — timeCET "${timeCET}" is not HH:MM format.`);
    continue;
  }

  let found = false;
  for (const month of calendar) {
    for (const week of month.weeks) {
      if (week.label !== weekLabel) continue;
      for (const ev of week.events) {
        if (ev.series !== series || ev.title !== title) continue;

        found = true;
        const before = ev.time;

        if (!before.includes('TBC')) {
          console.log(`⏭  ${series.toUpperCase()} ${title}: already has a time (${before.replace(/<[^>]+>/g, '')}), skipping`);
          alreadySet++;
          break;
        }

        const newDate = parisIso(ev.date, timeCET);
        const newTime = ev.time.replace(/<span class="hl">TBC<\/span>|\bTBC\b/, `<span class="hl">${timeCET}</span>`);
        if (!newDate || newTime === ev.time) {
          console.warn(`⚠  ${series.toUpperCase()} ${title}: could not apply ${timeCET} (time "${before}")`);
          break;
        }
        ev.time = newTime;
        ev.date = newDate;

        const after = ev.time.replace(/<[^>]+>/g, '');
        console.log(`✓  ${series.toUpperCase()} ${title}: "${before.replace(/<[^>]+>/g, '')}" → "${after}"`);
        applied++;
      }
    }
  }

  if (!found) {
    console.warn(`✗  NOT FOUND: series="${series}" title="${title}" weekLabel="${weekLabel}"`);
    notFound++;
  }
}

writeFileSync(CALENDAR_PATH, JSON.stringify(calendar, null, 2));

console.log(`\nDone.`);
console.log(`  Applied:     ${applied}`);
if (alreadySet > 0) console.log(`  Skipped (already set): ${alreadySet}`);
if (notFound > 0)  console.log(`  Not found:   ${notFound}`);
