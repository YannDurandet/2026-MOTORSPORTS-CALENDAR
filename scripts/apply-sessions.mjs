#!/usr/bin/env node
/**
 * apply-sessions.mjs
 *
 * Merges researched session times (and support-series times) for one or more
 * race weekends into data/calendar.json. Dry run by default: it prints a diff
 * and writes nothing until you pass --write.
 *
 * Usage:
 *   node scripts/apply-sessions.mjs patch.json            # dry run
 *   node scripts/apply-sessions.mjs patch.json --write    # apply
 *   --force            replace hand-curated or confirmed rows (use sparingly)
 *   --allow-reformat   write even if re-serialising would change calendar.json's formatting
 *
 * Input: JSON array. Matching is series + title + weekLabel (exact);
 * add "date": "YYYY-MM-DD" if one label matches two events.
 * [{
 *   "series": "f1", "title": "Las Vegas GP", "weekLabel": "WEEK 47 • NOV 18-22",
 *   "sessions": [{ "day": "FRI", "label": "FP1", "time": "21:30",
 *                  "status": "confirmed", "source": "https://..." }],
 *   "sub": [{ "badge": "f2", "round": "Rd 7", "day": "FRI", "time": "19:45",
 *             "status": "confirmed", "source": "https://..." }]
 * }]
 *
 * Rules: times are Paris time (HH:MM, 24h). EVERY row needs status
 * (confirmed | provisional) and an https source, or the whole event is
 * rejected. Sub rows must already exist on the event (this script never adds
 * a new badge). Existing hand-curated (no status) or confirmed rows are kept
 * unless --force.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CAL = join(dirname(fileURLToPath(import.meta.url)), '../data/calendar.json');
const args = process.argv.slice(2);
const write = args.includes('--write');
const force = args.includes('--force');
const file = args.find((a) => !a.startsWith('--'));
if (!file) {
  console.error('Usage: node scripts/apply-sessions.mjs <patch.json> [--write] [--force]');
  process.exit(1);
}

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const hhmmRe = /^([01]\d|2[0-3]):[0-5]\d$/;
const durationRe = /^(\d+h(\d{2})?|\d+min)$/;
const httpsRe = /^https:\/\/\S+$/;
const STATUSES = ['confirmed', 'provisional'];
const SESSION_KEYS = ['day', 'label', 'time', 'duration', 'status', 'source'];
const SUB_KEYS = ['badge', 'round', 'day', 'time', 'status', 'source'];
const plain = (h) => (h ?? '').replace(/<[^>]*>/g, '');
const parisParts = (iso) => {
  const d = new Date(iso);
  const f = (o) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', ...o }).format(d);
  return { day: f({ weekday: 'short' }).toUpperCase(), hhmm: f({ hour: '2-digit', minute: '2-digit', hour12: false }) };
};

let patches;
try {
  patches = JSON.parse(readFileSync(file, 'utf8'));
} catch (err) {
  console.error('Error: patch file is not valid JSON.\n', err.message);
  process.exit(1);
}
if (!Array.isArray(patches)) {
  console.error('Error: patch JSON must be an array.');
  process.exit(1);
}

const raw = readFileSync(CAL, 'utf8');
const calendar = JSON.parse(raw);
const trailingNewline = raw.endsWith('\n');
const serialise = () => JSON.stringify(calendar, null, 2) + (trailingNewline ? '\n' : '');
const formatSafe = serialise() === raw;

// ── Validation helpers ───────────────────────────────────────────────────────
function validateRow(r, kind) {
  if (!r || typeof r !== 'object') return 'is not an object';
  const allowed = kind === 'sub' ? SUB_KEYS : SESSION_KEYS;
  const extra = Object.keys(r).filter((k) => !allowed.includes(k));
  if (extra.length) return `unknown key(s): ${extra.join(', ')}`;
  if (kind === 'sub' && !r.badge) return 'has no badge';
  if (kind === 'session' && (!r.label || typeof r.label !== 'string')) return 'has no label';
  if (!DAYS.includes(r.day)) return `day "${r.day}" is not MON-SUN`;
  if (!hhmmRe.test(r.time ?? '')) return `time "${r.time}" is not HH:MM`;
  if (r.duration !== undefined && !durationRe.test(r.duration)) return `duration "${r.duration}" is not like "2h40", "6h" or "45min"`;
  if (!STATUSES.includes(r.status)) return `status "${r.status}" must be confirmed or provisional`;
  if (!httpsRe.test(r.source ?? '')) return 'has no https source';
  return null;
}

function findEvents(p) {
  const out = [];
  for (const month of calendar) {
    for (const week of month.weeks) {
      if (week.label !== p.weekLabel) continue;
      for (const ev of week.events) {
        if (ev.series !== p.series || ev.title !== p.title) continue;
        if (p.date && !ev.date.startsWith(p.date)) continue;
        out.push(ev);
      }
    }
  }
  return out;
}

const fmtSession = (r) => `${r.day} ${r.time}  ${r.label}${r.duration ? ` (${r.duration})` : ''}  [${r.status ?? 'curated'}]${r.source ? ' ' + r.source : ''}`;
const fmtSub = (s) => `${s.badge}  ${s.round ? s.round + '  ' : ''}${s.day ?? '-'} ${s.time ?? '-'}  [${s.status ?? 'curated'}]${s.source ? ' ' + s.source : ''}`;

// ── Process patches ──────────────────────────────────────────────────────────
let applied = 0;
let rejected = 0;
const lines = [];

patches.forEach((p, i) => {
  const id = p && p.series ? `#${i + 1} [${p.series}] "${p.title}" (${p.weekLabel})` : `#${i + 1}`;
  const reject = (why) => {
    rejected++;
    lines.push(`✗ ${id}\n    ${Array.isArray(why) ? why.join('\n    ') : why}`);
  };
  if (!p || typeof p !== 'object' || !p.series || !p.title || !p.weekLabel) return reject('needs series, title and weekLabel');
  if (p.sessions === undefined && p.sub === undefined) return reject('has neither sessions nor sub');
  const hits = findEvents(p);
  if (hits.length === 0) return reject('event not found (series + title + weekLabel must match exactly)');
  if (hits.length > 1) return reject(`matches ${hits.length} events: add "date": "YYYY-MM-DD"`);

  const ev = hits[0];
  const draft = structuredClone(ev);
  const problems = [];
  const notes = [];
  const out = [];

  if (p.sessions !== undefined) {
    const rows = p.sessions;
    if (!Array.isArray(rows) || !rows.length) {
      problems.push('sessions must be a non-empty array');
    } else {
      let prev = -1;
      rows.forEach((r, j) => {
        const e = validateRow(r, 'session');
        if (e) { problems.push(`session ${j + 1}: ${e}`); return; }
        const idx = DAYS.indexOf(r.day);
        if (idx < prev) problems.push(`session ${j + 1} (${r.day} ${r.label}) breaks weekday order`);
        prev = idx;
      });
      const races = rows.filter((r) => /^RACE$/i.test(r?.label ?? ''));
      if (races.length > 1) problems.push('more than one RACE session');
      if (ev.sessions?.length && !force && ev.sessions.some((r) => r.status !== 'provisional')) {
        problems.push('event already has hand-curated or confirmed sessions: use --force to replace');
      }
      if (races.length === 1 && !problems.length) {
        const race = races[0];
        const timeRaces = [...plain(ev.time).matchAll(/RACE:?\s*(\d{2}:\d{2})/gi)].map((m) => m[1]);
        const tbcRe = /(RACE:\s*)<span class="hl">TBC<\/span>/i;
        const pp = parisParts(ev.date);
        if (timeRaces.length === 1 && timeRaces[0] !== race.time) {
          problems.push(`RACE ${race.time} disagrees with event time "${plain(ev.time)}"`);
        }
        if (pp.hhmm === race.time && pp.day !== race.day) problems.push(`RACE is on ${race.day} but date falls on ${pp.day}`);
        if (!problems.length) {
          if (!timeRaces.length && tbcRe.test(ev.time) && race.status === 'confirmed') {
            draft.time = ev.time.replace(tbcRe, `$1<span class="hl">${race.time}</span>`);
            notes.push(`time: "${plain(ev.time)}" → "${plain(draft.time)}"`);
          }
          if (race.status === 'confirmed' && pp.hhmm !== race.time) {
            notes.push(`WARNING: "date" still says ${ev.date} (Paris ${pp.hhmm}); update it by hand, then run npm run gen:series`);
          }
        }
      }
      if (!problems.length) {
        draft.sessions = rows;
        out.push(`sessions: ${ev.sessions?.length ?? 0} → ${rows.length} rows`);
        rows.forEach((r) => out.push('  ' + fmtSession(r)));
      }
    }
  }

  if (p.sub !== undefined && !Array.isArray(p.sub)) problems.push('sub must be an array');
  for (const [j, s] of (Array.isArray(p.sub) ? p.sub : []).entries()) {
    const e = validateRow(s, 'sub');
    if (e) { problems.push(`sub ${j + 1} (${s?.badge ?? '?'}): ${e}`); continue; }
    const target = (draft.sub ?? []).find((x) => x.badge === s.badge);
    if (!target) {
      problems.push(`sub badge "${s.badge}" is not on this event: add the sub row (and a .b-${s.badge} rule in global.css) first`);
      continue;
    }
    if (target.time && !force && target.status !== 'provisional') {
      problems.push(`sub "${s.badge}" already has a time (${target.day} ${target.time}, ${target.status ?? 'curated'}): use --force to replace`);
      continue;
    }
    Object.assign(target, { ...(s.round ? { round: s.round } : {}), day: s.day, time: s.time, status: s.status, source: s.source });
    out.push('sub: ' + fmtSub(target));
    if (/TBC/i.test(target.detail ?? '')) notes.push(`sub "${s.badge}" detail still says "${target.detail}": edit by hand if wanted`);
  }

  if (problems.length) return reject(problems);
  Object.assign(ev, draft);
  applied++;
  lines.push(`✓ ${id}\n    ${[...out, ...notes].join('\n    ')}`);
});

// ── Report and write ─────────────────────────────────────────────────────────
console.log(lines.join('\n'));
console.log(`\n${write ? 'Applied' : 'Would apply'}: ${applied}   Rejected: ${rejected}`);
if (!formatSafe) {
  console.log('Note: re-serialising calendar.json changes its formatting (writing needs --allow-reformat).');
}
if (!write) {
  console.log('Dry run: nothing written. Re-run with --write to apply.');
  process.exit(rejected ? 1 : 0);
}
if (!applied) {
  console.log('Nothing to write.');
  process.exit(rejected ? 1 : 0);
}
if (!formatSafe && !args.includes('--allow-reformat')) {
  console.error('Refusing to write: that would reformat calendar.json. Re-run with --allow-reformat and review the git diff.');
  process.exit(1);
}
writeFileSync(CAL, serialise());
console.log('Wrote data/calendar.json. Next: npm run check');
if (rejected) process.exit(1);
