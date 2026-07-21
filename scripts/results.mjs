#!/usr/bin/env node
/**
 * results.mjs — Interactive results injector
 * Usage: node scripts/results.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { createInterface } from 'readline';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CALENDAR_PATH = resolve(__dirname, '../data/calendar.json');

// Series that use co_driver (rally) vs winners array (endurance pairs)
const RALLY_SERIES   = new Set(['wrc', 'erc', 'irc', 'wrc2']);
const PAIRING_SERIES = new Set(['gtwce', 'gtwca', 'wec', 'imsa', 'lmgt3', 'elms']);

// ── Readline helpers ──────────────────────────────────────────────────────────

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(res => rl.question(q, res));

async function prompt(label, fallback = '') {
  const hint = fallback ? ` (Enter = "${fallback}")` : ' (Enter to skip)';
  const ans = (await ask(`  ${label}${hint}: `)).trim();
  return ans || fallback || null;
}

// ── Race count from time field ────────────────────────────────────────────────

function raceCount(timeStr = '') {
  const clean = timeStr.replace(/<[^>]+>/g, '');
  const m = clean.match(/\bR\d+:/g);
  return m ? m.length : 1;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

const MONTHS = { JAN:1,FEB:2,MAR:3,APR:4,MAY:5,JUN:6,JUL:7,AUG:8,SEP:9,OCT:10,NOV:11,DEC:12 };

function weekDateRange(label) {
  // "WEEK 29 • JUL 16-19" → { start: "2026-07-16", end: "2026-07-19" }
  const m = label.match(/([A-Z]{3})\s+(\d+)(?:-(\d+))?/);
  if (!m) return { start: null, end: null };
  const mon = String(MONTHS[m[1]]).padStart(2, '0');
  const start = `2026-${mon}-${m[2].padStart(2, '0')}`;
  const end   = m[3] ? `2026-${mon}-${m[3].padStart(2, '0')}` : start;
  return { start, end };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const calendar = JSON.parse(readFileSync(CALENDAR_PATH, 'utf8'));

  // 1. Pick week
  const weekNum = (await ask('\nWeek number: ')).trim();
  let targetWeek = null;

  for (const month of calendar) {
    for (const week of month.weeks) {
      if (week.label.startsWith(`WEEK ${weekNum} `)) { targetWeek = week; break; }
    }
    if (targetWeek) break;
  }

  if (!targetWeek) {
    console.log(`\nWeek ${weekNum} not found.`);
    rl.close(); return;
  }

  console.log(`\n${targetWeek.label}\n`);
  const { end: weekEnd } = weekDateRange(targetWeek.label);

  // helpers
  const getMissing = () => targetWeek.events.filter(ev => !ev.results);

  // 2. Main loop
  while (true) {
    const missing = getMissing();
    if (!missing.length) { console.log('All events filled. Done!\n'); break; }

    console.log(`Events missing results (${missing.length}):`);
    missing.forEach((ev, i) => console.log(`  ${i + 1}. [${ev.tag}] ${ev.title}`));

    const choice = (await ask('\nEvent number (or "end"): ')).trim().toLowerCase();
    if (choice === 'end') break;

    const idx = parseInt(choice) - 1;
    if (isNaN(idx) || idx < 0 || idx >= missing.length) {
      console.log('Invalid choice.\n'); continue;
    }

    const ev = missing[idx];
    const series = ev.series;
    console.log(`\n→ [${ev.tag}] ${ev.title}`);

    const results = [];
    const totalRaces = raceCount(ev.time);
    const isMultiRace = totalRaces > 1;

    // 3. Race loop
    for (let raceNum = 1; raceNum <= totalRaces; raceNum++) {
      if (isMultiRace) console.log(`\n  Race ${raceNum} of ${totalRaces}:`);

      const winner = (await ask(`  Winner (or "none" to skip): `)).trim();
      if (winner.toLowerCase() === 'none') continue;

      let date = await prompt('Date', weekEnd);
      // Expand bare day numbers (e.g. "20") to full ISO date using the week's month/year
      if (date && /^\d{1,2}$/.test(date)) {
        date = weekEnd.slice(0, 8) + date.padStart(2, '0');
      }

      let coDriverOrPartner = null;
      if (RALLY_SERIES.has(series) || PAIRING_SERIES.has(series)) {
        coDriverOrPartner = await prompt(RALLY_SERIES.has(series) ? 'Co-driver' : 'Co-driver/Partner');
      }

      const country = await prompt('Nationality (2-letter code)');
      const team    = await prompt('Team');

      const result = {};
      if (date) result.date = date;
      if (isMultiRace) result.race_label = `Race ${raceNum}`;

      if (RALLY_SERIES.has(series) && coDriverOrPartner) {
        result.winner    = winner;
        result.co_driver = coDriverOrPartner;
      } else if (PAIRING_SERIES.has(series) && coDriverOrPartner) {
        result.winners = [winner, coDriverOrPartner];
      } else {
        result.winner = winner;
      }

      if (country) result.country = country.toUpperCase();
      if (team)    result.team    = team;

      results.push(result);
    }

    if (results.length) {
      // strip race_label if only 1 race ended up added
      if (results.length === 1 && results[0].race_label) delete results[0].race_label;
      ev.results = results;
      console.log(`  ✓ Saved.\n`);
    } else {
      console.log('  Skipped.\n');
    }

    const remaining = getMissing().length;
    if (!remaining) { console.log('All events filled!\n'); break; }

    const next = (await ask(`Fill next event or end? (${remaining} still missing) [next/end]: `)).trim().toLowerCase();
    if (next === 'end') break;
    console.log();
  }

  writeFileSync(CALENDAR_PATH, JSON.stringify(calendar, null, 2), 'utf8');
  console.log('Calendar saved.');
  rl.close();
}

main().catch(err => { console.error(err); rl.close(); });
