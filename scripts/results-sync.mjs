#!/usr/bin/env node
/**
 * results-sync.mjs — the write path for weekly race results.
 *
 * Splits the weekly chore into two halves so the slow, judgement-heavy half
 * (finding out who won) can be done by a human, an LLM, or CI, while the
 * error-prone half (writing it into calendar.json in exactly the right shape)
 * is deterministic and validated.
 *
 *   npm run results:brief            → prints a JSON skeleton for every raced
 *                                      event still missing a result, with the
 *                                      correct fields for that series
 *   npm run results:apply <file>     → merges a filled-in skeleton into
 *                                      data/calendar.json
 *   npm run results:apply <file> --dry-run
 *
 * Results live INLINE in data/calendar.json (event.results). data/results.json
 * is a dead file that nothing reads — do not target it.
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CAL = path.join(__dirname, '../data/calendar.json');
const SEASON = 2026;
const GRACE_HOURS = Number(process.env.RESULTS_GRACE_HOURS ?? 12);

// Field shape per series, derived from the 12 variants already in calendar.json.
const RALLY        = new Set(['wrc', 'erc']);
const MULTI_DRIVER = new Set(['wec', 'imsa', 'igtc', 'elms', 'gtwce', 'gtwca', 'nls', 'h24eu', 'bgt']);
const MANUFACTURER = new Set(['wrc', 'erc']);

function fieldsFor(series) {
  const f = ['date'];
  f.push(MULTI_DRIVER.has(series) ? 'winners' : 'winner');
  if (RALLY.has(series)) f.push('co_driver');
  f.push('country');
  f.push(MANUFACTURER.has(series) ? 'manufacturer' : 'team');
  return f;
}

const load = () => JSON.parse(readFileSync(CAL, 'utf8'));

/** Every event that has run but has no result yet. */
function pending(cal) {
  const cutoff = new Date(Date.now() - GRACE_HOURS * 3600_000);
  const out = [];
  for (const month of cal) {
    if ((month.year ?? SEASON) !== SEASON) continue;
    for (const week of month.weeks ?? []) {
      for (const ev of week.events ?? []) {
        if (!ev.date || new Date(ev.date) > cutoff) continue;
        if (ev.results?.length) continue;
        out.push({ ev, week, month });
      }
    }
  }
  return out;
}

// ── brief ────────────────────────────────────────────────────────────────────
function brief() {
  const items = pending(load());
  if (!items.length) {
    console.error('✓ nothing pending — every raced event has a result');
    console.log('[]');
    return;
  }
  const skeleton = items.map(({ ev, week }) => {
    const fields = fieldsFor(ev.series);
    const blank = {};
    for (const f of fields) {
      blank[f] = f === 'winners' ? [] : (f === 'date' ? ev.date.slice(0, 10) : '');
    }
    return {
      series: ev.series,
      title: ev.title,
      week: week.label,
      _hint: `${ev.tag} — ${ev.title}, ${ev.date.slice(0, 10)}`,
      results: [blank],
    };
  });
  console.error(`${items.length} event(s) need results. Fill the blanks and run: npm run results:apply <file>`);
  console.error('For a multi-race weekend add more objects to `results` and give each a "race_label".\n');
  console.log(JSON.stringify(skeleton, null, 2));
}

// ── apply ────────────────────────────────────────────────────────────────────
function apply(file, dryRun) {
  const patch = JSON.parse(readFileSync(file, 'utf8'));
  if (!Array.isArray(patch)) throw new Error('patch must be a JSON array');

  const cal = load();
  const errors = [];
  const applied = [];

  for (const item of patch) {
    const { series, title, week, results } = item;
    if (!series || !title) { errors.push(`entry missing series/title: ${JSON.stringify(item).slice(0,80)}`); continue; }
    if (!Array.isArray(results) || !results.length) { errors.push(`${series}/${title}: no results array`); continue; }

    // locate the event
    const hits = [];
    for (const month of cal) {
      if ((month.year ?? SEASON) !== SEASON) continue;
      for (const w of month.weeks ?? []) {
        if (week && w.label !== week) continue;
        for (const ev of w.events ?? []) {
          if (ev.series === series && ev.title === title) hits.push({ ev, label: w.label });
        }
      }
    }
    if (!hits.length)  { errors.push(`${series}/${title}: no matching event in ${SEASON}`); continue; }
    if (hits.length > 1) { errors.push(`${series}/${title}: ambiguous (${hits.length} matches) — add "week"`); continue; }

    const { ev } = hits[0];
    if (ev.results?.length) { errors.push(`${series}/${title}: already has a result (refusing to overwrite)`); continue; }

    // validate each row
    const clean = [];
    for (const [i, r] of results.entries()) {
      const where = `${series}/${title} row ${i + 1}`;
      const multi = MULTI_DRIVER.has(series);
      const who = multi ? r.winners : r.winner;
      const filled = multi ? Array.isArray(who) && who.length && who.every(x => x && x.trim())
                           : typeof who === 'string' && who.trim();
      if (!filled) { errors.push(`${where}: ${multi ? '"winners" must be a non-empty array' : '"winner" is required'}`); continue; }
      if (!r.date || !/^\d{4}-\d{2}-\d{2}$/.test(r.date)) { errors.push(`${where}: "date" must be YYYY-MM-DD`); continue; }
      if (r.country && !/^[A-Z]{2}$/.test(r.country)) { errors.push(`${where}: "country" must be a 2-letter uppercase code`); continue; }
      if (RALLY.has(series) && !r.co_driver) { errors.push(`${where}: rally results need "co_driver"`); continue; }

      // keep key order consistent with the rest of the file
      const row = {};
      if (r.race_label) row.race_label = r.race_label;
      row.date = r.date;
      if (multi) row.winners = who.map(s => s.trim()); else row.winner = who.trim();
      if (r.co_driver) row.co_driver = r.co_driver.trim();
      if (r.team) row.team = r.team.trim();
      if (r.manufacturer) row.manufacturer = r.manufacturer.trim();
      if (r.country) row.country = r.country;
      if (r.note) row.note = r.note;
      clean.push(row);
    }
    if (clean.length === results.length) {
      applied.push({ ev, clean, label: `${series}/${title}` });
    }
  }

  if (errors.length) {
    console.error(`\n❌ ${errors.length} problem(s) — nothing written:\n`);
    errors.forEach(e => console.error('  • ' + e));
    process.exit(1);
  }

  for (const a of applied) a.ev.results = a.clean;

  if (dryRun) {
    console.log(`(dry run) would apply ${applied.length} result(s):`);
    applied.forEach(a => console.log('  ' + a.label + ' → ' + JSON.stringify(a.clean)));
    return;
  }

  writeFileSync(CAL, JSON.stringify(cal, null, 2) + '\n', 'utf8');
  console.log(`✓ applied ${applied.length} result(s) to data/calendar.json`);
  applied.forEach(a => console.log('  • ' + a.label));
  console.log('\nNow run:  npm run gen:series && npm run check');
}

// ── cli ──────────────────────────────────────────────────────────────────────
const [, , cmd, ...rest] = process.argv;
try {
  if (cmd === 'brief') brief();
  else if (cmd === 'apply') {
    const file = rest.find(a => !a.startsWith('--'));
    if (!file) throw new Error('usage: results-sync.mjs apply <file.json> [--dry-run]');
    apply(file, rest.includes('--dry-run'));
  } else {
    console.error('usage: results-sync.mjs brief | apply <file.json> [--dry-run]');
    process.exit(1);
  }
} catch (err) {
  console.error('❌ ' + err.message);
  process.exit(1);
}
