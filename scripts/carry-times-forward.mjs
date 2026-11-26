#!/usr/bin/env node
/**
 * carry-times-forward.mjs — placeholder times for the next season (F-090 data half).
 *
 * For every NEXT-season event whose `time` is still TBC, copy the `time` string
 * from THIS season's edition of the same event (same series + title; falls back
 * to series + track when the title was renamed but the venue is unambiguous),
 * and set the clock in `date` to that race's Paris time (same rule as
 * apply-times.mjs: `date` is what countdowns, feeds and the newsletter read).
 *
 * These are placeholders, not researched times: replace them as they are
 * announced with `npm run times:prompt` / `npm run times:apply`.
 *
 * Only fully-TBC time strings are filled — a partly-known `time` is never
 * overwritten. Events with an existing confirmed `sessions` RACE row are
 * skipped too, since check-data requires `time` to agree with it.
 *
 * Usage:
 *   npm run times:carry            # dry run: print the plan, write nothing
 *   npm run times:carry -- --write # apply to data/calendar.json
 */

import { readText, readJson, writeJson, walkCalendar, monthYear, defaultYear, parisIsoAt, stripHtml, parseArgs } from './lib.mjs';

const FROM = defaultYear;     // the season whose times are known (2026)
const TO   = defaultYear + 1; // the season being filled in (2027)
const CAL  = 'data/calendar.json';

const { has } = parseArgs();
const WRITE = has('--write');

const raw = readText(CAL);
const cal = JSON.parse(raw);
if (JSON.stringify(cal, null, 2) + '\n' !== raw) {
  console.error('calendar.json is not in canonical formatting — stop (run the apply tools first).');
  process.exit(1);
}

// ── Index this season's events ───────────────────────────────────────────────
const byTitle = new Map();
const byTrack = new Map();
for (const { month, ev } of walkCalendar(cal)) {
  if (monthYear(month) !== FROM) continue;
  const t = `${ev.series}|${ev.title}`;
  byTitle.set(t, [...(byTitle.get(t) ?? []), ev]);
  if (ev.track) {
    const k = `${ev.series}|${ev.track}`;
    byTrack.set(k, [...(byTrack.get(k) ?? []), ev]);
  }
}

const HHMM  = /\d{2}:\d{2}/;
const RACE_HL = /RACE:?\s*<span class="hl">(\d{2}:\d{2})<\/span>/i;
const ANY_HL  = /<span class="hl">(\d{2}:\d{2})<\/span>/;

// ── Plan ─────────────────────────────────────────────────────────────────────
const changes = [];
const skipped = [];

for (const { month, week, ev } of walkCalendar(cal)) {
  if (monthYear(month) !== TO) continue;
  if (!ev.time?.includes('TBC')) continue;
  const id = `[${ev.series}] "${ev.title}" (${week.label})`;

  // Never overwrite a partly-known time, or one that must agree with sessions.
  if (HHMM.test(ev.time)) { skipped.push(`${id}: partly known ("${stripHtml(ev.time)}") — left for research`); continue; }
  const race = ev.sessions?.find(s => /^RACE$/i.test(s.label ?? '') && HHMM.test(s.time ?? ''));
  if (race) { skipped.push(`${id}: sessions already name RACE ${race.time} — left alone`); continue; }

  const byT = byTitle.get(`${ev.series}|${ev.title}`);
  let src = null, how = '';
  if (byT?.length === 1) { src = byT[0]; how = 'same title'; }
  else if (ev.track) {
    const byTr = byTrack.get(`${ev.series}|${ev.track}`);
    if (byTr?.length === 1) { src = byTr[0]; how = `same track (${ev.track})`; }
  }
  if (!src) { skipped.push(`${id}: no ${FROM} counterpart — left TBC`); continue; }
  if (src.time.includes('TBC') || !HHMM.test(src.time)) { skipped.push(`${id}: ${FROM} "${src.title}" is also TBC — left TBC`); continue; }

  const raceHl = src.time.match(RACE_HL) ?? src.time.match(ANY_HL);
  const newDate = raceHl ? parisIsoAt(ev.date, raceHl[1]) : null;
  if (raceHl && !newDate) skipped.push(`${id}: ${raceHl[1]} does not exist on ${ev.date.slice(0, 10)} in Paris (DST gap) — time copied, date left`);
  changes.push({ ev, id, how, srcTitle: src.title, time: src.time, newDate, raceTime: raceHl?.[1] ?? null });
}

// ── Report ───────────────────────────────────────────────────────────────────
for (const c of changes) {
  const dateNote = c.newDate && c.newDate !== c.ev.date ? `, date ${c.ev.date} → ${c.newDate}` : '';
  console.log(`  ${WRITE ? '✓' : '·'} ${c.id}: "${stripHtml(c.ev.time)}" → "${stripHtml(c.time)}" (${c.how}: ${FROM} "${c.srcTitle}"${c.raceTime ? `, RACE ${c.raceTime}` : ''})${dateNote}`);
}
for (const s of skipped) console.log(`  … ${s}`);

console.log(`\n${WRITE ? 'Would apply' : 'Dry run — would apply'} ${changes.length} event(s) from ${FROM}; ${skipped.length} left TBC.`);

if (!WRITE) {
  console.log('Re-run with --write to apply, then: npm run gen:series && npm run check');
  process.exit(0);
}
if (!changes.length) { console.log('Nothing to write.'); process.exit(0); }

for (const c of changes) {
  c.ev.time = c.time;
  if (c.newDate) c.ev.date = c.newDate;
}
writeJson(CAL, cal);
console.log(`✓ wrote data/calendar.json — ${changes.length} placeholder time(s) carried from ${FROM}. Next: npm run gen:series && npm run check`);
