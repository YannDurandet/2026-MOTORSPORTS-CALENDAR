#!/usr/bin/env node
/**
 * standings-sync.mjs — the write path for championship standings.
 *
 *   npm run standings:stale          → which series have raced since their
 *                                      standings were last updated, and by how
 *                                      many rounds
 *   npm run standings:apply <file>   → validate + merge a standings patch
 *   npm run standings:apply <file> --dry-run
 *
 * Patch shape (only the tables you want to touch):
 *   { "f1": { "drivers":      { "roundsComplete": 12, "entries": [
 *                 { "pos": 1, "name": "Kimi Antonelli", "country": "IT",
 *                   "team": "Mercedes", "points": 244 } ] },
 *             "constructors": { "entries": [ { "pos": 1, "name": "Mercedes", "points": 402 } ] } } }
 *
 * `label` and `totalRounds` are preserved from the existing file; `updatedAt`
 * is stamped automatically. Entries are fully replaced, not merged — a
 * standings table is only ever correct as a complete snapshot.
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const STANDINGS  = path.join(__dirname, '../data/standings.json');
const CALENDAR   = path.join(__dirname, '../data/calendar.json');
const SEASON     = 2026;

const load = f => JSON.parse(readFileSync(f, 'utf8'));
const today = () => new Date().toISOString().slice(0, 10);

/** Last raced round per series, from the calendar. */
function lastRaced() {
  const cal = load(CALENDAR);
  const now = new Date();
  const out = {};
  for (const month of cal) {
    if ((month.year ?? SEASON) !== SEASON) continue;
    for (const w of month.weeks ?? []) {
      for (const ev of w.events ?? []) {
        if (!ev.date) continue;
        const d = new Date(ev.date);
        if (d > now) continue;
        const cur = out[ev.series];
        if (!cur || d > cur.date) out[ev.series] = { date: d, title: ev.title };
        out[ev.series].count = (cur?.count ?? 0) + 1;
      }
    }
  }
  return out;
}

// ── stale ────────────────────────────────────────────────────────────────────
function stale() {
  const st = load(STANDINGS);
  const raced = lastRaced();
  const rows = [];

  for (const [series, tables] of Object.entries(st)) {
    const first = Object.values(tables)[0];
    if (!first) continue;
    const r = raced[series];
    if (!r) continue;
    const updated = new Date(first.updatedAt + 'T23:59:59Z');
    if (r.date <= updated) continue;
    rows.push({
      series,
      updatedAt: first.updatedAt,
      lastRace: r.date.toISOString().slice(0, 10),
      lastTitle: r.title,
      tables: Object.keys(tables).length,
      roundsComplete: first.roundsComplete,
      racedRounds: r.count,
    });
  }

  if (!rows.length) { console.log('✓ standings:stale — all 16 series are up to date'); return; }

  rows.sort((a, b) => a.lastRace.localeCompare(b.lastRace));
  console.log(`${rows.length} series stale:\n`);
  for (const r of rows) {
    const behind = r.racedRounds - r.roundsComplete;
    console.log(
      `  ${r.series.padEnd(9)} updated ${r.updatedAt}  ` +
      `last race ${r.lastRace} (${r.lastTitle})  ` +
      `${r.tables} table(s)` + (behind > 0 ? `  ~${behind} round(s) behind` : '')
    );
  }
  console.log('\nResearch the new tables, then:  npm run standings:apply <file.json>');
}

// ── apply ────────────────────────────────────────────────────────────────────
function apply(file, dryRun) {
  const patch = load(file);
  const st = load(STANDINGS);
  const errors = [];
  const changes = [];

  for (const [series, tables] of Object.entries(patch)) {
    if (!st[series]) { errors.push(`unknown series "${series}"`); continue; }
    for (const [table, incoming] of Object.entries(tables)) {
      const existing = st[series][table];
      const where = `${series}.${table}`;
      if (!existing) { errors.push(`${where}: unknown table (have: ${Object.keys(st[series]).join(', ')})`); continue; }
      const entries = incoming.entries;
      if (!Array.isArray(entries) || !entries.length) { errors.push(`${where}: "entries" must be a non-empty array`); continue; }

      // an existing entry tells us whether this table carries country/team
      const sample = existing.entries[0] ?? {};
      const wantsCountry = 'country' in sample;
      const wantsTeam    = 'team' in sample;

      const clean = [];
      let lastPoints = Infinity;
      for (const [i, e] of entries.entries()) {
        const at = `${where} row ${i + 1}`;
        if (e.pos !== i + 1) { errors.push(`${at}: "pos" must be ${i + 1} (entries must be in order, no gaps)`); continue; }
        if (!e.name || typeof e.name !== 'string') { errors.push(`${at}: "name" is required`); continue; }
        if (typeof e.points !== 'number' || Number.isNaN(e.points)) { errors.push(`${at}: "points" must be a number`); continue; }
        if (e.points > lastPoints) { errors.push(`${at}: ${e.points} pts ranked below ${lastPoints} pts — order looks wrong`); continue; }
        lastPoints = e.points;
        if (wantsCountry && e.country && !/^[A-Z]{2}$/.test(e.country)) { errors.push(`${at}: "country" must be a 2-letter uppercase code`); continue; }

        const row = { pos: e.pos, name: e.name.trim() };
        if (wantsCountry) row.country = e.country ?? '';
        if (wantsTeam)    row.team    = e.team ?? '';
        row.points = e.points;
        clean.push(row);
      }
      if (clean.length !== entries.length) continue;

      const rounds = incoming.roundsComplete ?? existing.roundsComplete;
      if (typeof rounds !== 'number') { errors.push(`${where}: "roundsComplete" must be a number`); continue; }
      if (rounds > existing.totalRounds) { errors.push(`${where}: roundsComplete ${rounds} > totalRounds ${existing.totalRounds}`); continue; }
      if (rounds < existing.roundsComplete) { errors.push(`${where}: roundsComplete would go backwards (${existing.roundsComplete} → ${rounds})`); continue; }

      changes.push({ series, table, rounds, clean, before: existing.entries.length });
    }
  }

  if (errors.length) {
    console.error(`\n❌ ${errors.length} problem(s) — nothing written:\n`);
    errors.forEach(e => console.error('  • ' + e));
    process.exit(1);
  }
  if (!changes.length) { console.log('nothing to apply'); return; }

  for (const c of changes) {
    const t = st[c.series][c.table];
    t.updatedAt      = today();
    t.roundsComplete = c.rounds;
    t.entries        = c.clean;
  }

  if (dryRun) {
    console.log(`(dry run) would update ${changes.length} table(s):`);
    changes.forEach(c => console.log(`  ${c.series}.${c.table}  ${c.before} → ${c.clean.length} entries, round ${c.rounds}, leader ${c.clean[0].name} (${c.clean[0].points})`));
    return;
  }

  writeFileSync(STANDINGS, JSON.stringify(st, null, 2) + '\n', 'utf8');
  console.log(`✓ updated ${changes.length} table(s) in data/standings.json  (updatedAt ${today()})`);
  changes.forEach(c => console.log(`  • ${c.series}.${c.table} — leader ${c.clean[0].name} (${c.clean[0].points})`));
  console.log('\nNow run:  npm run check');
}

// ── cli ──────────────────────────────────────────────────────────────────────
const [, , cmd, ...rest] = process.argv;
try {
  if (cmd === 'stale') stale();
  else if (cmd === 'apply') {
    const file = rest.find(a => !a.startsWith('--'));
    if (!file) throw new Error('usage: standings-sync.mjs apply <file.json> [--dry-run]');
    apply(file, rest.includes('--dry-run'));
  } else {
    console.error('usage: standings-sync.mjs stale | apply <file.json> [--dry-run]');
    process.exit(1);
  }
} catch (err) {
  console.error('❌ ' + err.message);
  process.exit(1);
}
