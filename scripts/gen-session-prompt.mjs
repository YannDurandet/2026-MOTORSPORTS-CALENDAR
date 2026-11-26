#!/usr/bin/env node
/**
 * gen-session-prompt.mjs — the research brief for one weekend (or month).
 *
 * Prints a fillable patch JSON for `npm run sessions:apply`: one entry per
 * event, with a stub for every session / support-series row that still lacks
 * a time. The filler (you, or an AI working FROM THE OFFICIAL SOURCE — never
 * from memory) replaces each "??"; apply-sessions.mjs then validates the whole
 * patch (weekday order, RACE vs `time`, Paris day vs `date`, mandatory
 * status + https source on every row) before anything is written.
 *
 * The loop, one weekend at a time:
 *   npm run sessions:brief -- "WEEK 42" > week42.json     # this brief
 *   ... fill in the ?? from the official timetable ...     # _source names it
 *   node scripts/apply-sessions.mjs week42.json            # dry run: diff
 *   node scripts/apply-sessions.mjs week42.json --write    # apply
 *
 * Times are Paris time, 24h HH:MM. Convert a circuit-local time with:
 *   node scripts/tz.mjs "2027-04-04 15:00" Australia/Melbourne
 *
 * Usage:
 *   node scripts/gen-session-prompt.mjs "WEEK 42"   # one week
 *   node scripts/gen-session-prompt.mjs APRIL       # one month
 *   node scripts/gen-session-prompt.mjs --all       # everything (split the file)
 *   node scripts/gen-session-prompt.mjs --tbc       # only events whose time is TBC
 */

import { readJson, walkCalendar, monthYear, parisClock, stripHtml } from './lib.mjs';

const rawArg = (process.argv[2] || '').trim();
const allMode = rawArg === '--all';
const tbcMode = rawArg === '--tbc';
const filterArg = allMode || tbcMode ? '' : rawArg.toUpperCase();

const calendar = readJson('data/calendar.json');
const seriesContent = readJson('data/seriesContent.json');
const officialWeb = Object.fromEntries(seriesContent.map(s => [s.slug, s.socials?.web ?? '']));

const MONTH_NAMES = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
const currentMonthName = MONTH_NAMES[new Date().getMonth()];
if (!allMode && !tbcMode && !filterArg) {
  console.error('Usage: node scripts/gen-session-prompt.mjs "WEEK 42" | APRIL | --all | --tbc');
  process.exit(1);
}

function matchesFilter(month, week) {
  if (!filterArg) return true;
  return (
    month.month.includes(filterArg) ||
    filterArg.includes(month.month.slice(0, 3)) ||
    week.label.toUpperCase().includes(filterArg)
  );
}

const patch = [];
const skipped = [];

for (const { month, week, ev, year } of walkCalendar(calendar)) {
  if (!matchesFilter(month, week)) continue;
  const timeIsTbc = /TBC/i.test(ev.time ?? '');
  if (tbcMode && !timeIsTbc) continue;

  const entry = {
    series: ev.series,
    title: ev.title,
    weekLabel: week.label,
    date: String(ev.date ?? '').slice(0, 10),
    _hint: `${ev.tag} — ${ev.title}, ${String(ev.date ?? '').slice(0, 10)} (${year}), time "${stripHtml(ev.time ?? '')}"`,
    _source: officialWeb[ev.series] || 'OFFICIAL SERIES SITE — paste the timetable URL here',
  };

  // Sessions: stub the rows that lack a time; a TBC event with no sessions
  // gets a single RACE stub (day pre-filled from `date` in Paris).
  if (ev.sessions?.length) {
    const rows = ev.sessions
      .filter(s => !s.time)
      .map(s => ({ day: s.day ?? parisClock(ev.date).day, label: s.label, ...(s.duration ? { duration: s.duration } : {}), time: '??', status: '??', source: '??' }));
    if (rows.length) entry.sessions = rows;
  } else if (timeIsTbc) {
    entry.sessions = [{ day: parisClock(ev.date).day, label: 'RACE', time: '??', status: '??', source: '??' }];
  }

  // Support series: stub the badges that lack a time (apply-sessions never
  // adds a badge — the row must already exist on the event).
  const subs = (ev.sub ?? [])
    .filter(s => !s.time)
    .map(s => ({ badge: s.badge, ...(s.round ? { round: s.round } : {}), day: s.day ?? '??', time: '??', status: '??', source: '??' }));
  if (subs.length) entry.sub = subs;

  if (entry.sessions || entry.sub) patch.push(entry);
  else if (timeIsTbc) skipped.push(`[${ev.series}] "${ev.title}" (${week.label}): TBC but no stubbable rows — add a sessions/sub row in calendar.json first`);
}

if (!patch.length) {
  console.log(allMode || tbcMode ? 'Nothing to research — no missing session times anywhere.' : `Nothing missing for "${rawArg}".`);
  process.exit(0);
}

const out = [
  '// Fill every "??" from the OFFICIAL timetable for each weekend (_source names the site per entry). Times are PARIS time, 24h HH:MM — convert circuit-local with: node scripts/tz.mjs "YYYY-MM-DD HH:MM" <IANA zone>',
  '// Every row needs status "confirmed"|"provisional" and an https source URL, or sessions:apply rejects the whole event.',
  '// Return ONLY the JSON array below with the ?? filled in. No prose, no code fences.',
  '',
  JSON.stringify(patch, null, 2),
];
console.log(out.join('\n'));
console.error(`\n-> ${patch.length} event(s) in this brief (${skipped.length} TBC with no stubbable rows). Fill, then: node scripts/apply-sessions.mjs <file> [--write]`);
