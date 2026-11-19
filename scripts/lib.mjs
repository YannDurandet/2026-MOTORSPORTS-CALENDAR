/**
 * lib.mjs — the shared toolbox for every script in scripts/. Read this first.
 *
 * One module instead of twenty copy-pasted blocks. Each section is used by at
 * least two scripts; if you need a helper, add it here, not to a script.
 *
 *   paths & files     ROOT, readText/readJson, writeJson (canonical 2-space + \n)
 *   season            DEFAULT_CALENDAR_YEAR imported from src/lib/season.ts
 *                     (Node >= 22.18 runs the .ts directly — no regex scraping)
 *   calendar          walkCalendar(cal) yields { month, week, ev, year } in
 *                     document order; findEvents(cal, criteria) locates events
 *   Paris time        parisParts / parisClock / parisIsoAt / tzParts
 *   constants         DAYS, HHMM_RE, DURATION_RE, ISO_DATE_RE, HTTPS_RE,
 *                     stripHtml, utcDay
 *   cli               parseArgs(argv) → { args, flags, has } ; isMain(meta)
 *   checks            collector() — the fail-accumulator every check-* uses
 *   filesystem        walkFiles(dir, { exts }), blankNonNewlines
 */

import { readFileSync, writeFileSync, readdirSync, statSync, realpathSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_CALENDAR_YEAR, monthYear } from '../src/lib/season.ts';

// ── Paths & files ────────────────────────────────────────────────────────────

/** Repo root (the parent of scripts/). All paths in scripts are relative to it. */
export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const readText = (rel) => readFileSync(resolve(ROOT, rel), 'utf8');
export const readJson = (rel) => JSON.parse(readText(rel));

/** Canonical JSON on disk: 2-space indent, one trailing newline. */
export const serializeJson = (value) => JSON.stringify(value, null, 2) + '\n';
export const writeJson = (rel, value) => writeFileSync(resolve(ROOT, rel), serializeJson(value));

/** True when the calling module is run directly (`node scripts/x.mjs`), not imported. */
export function isMain(metaUrl) {
  return !!process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(metaUrl));
}

// ── Season ───────────────────────────────────────────────────────────────────

export const defaultYear = DEFAULT_CALENDAR_YEAR;
export { monthYear };

// ── Calendar ─────────────────────────────────────────────────────────────────
// data/calendar.json is an array of months: { month, year?, weeks: [{ label, events }] }.

/**
 * Walk the calendar in document order, yielding { month, week, ev, year }
 * (year = month.year ?? DEFAULT_CALENDAR_YEAR).
 */
export function* walkCalendar(cal) {
  for (const month of cal) {
    for (const week of month.weeks ?? []) {
      for (const ev of week.events ?? []) {
        yield { month, week, ev, year: monthYear(month) };
      }
    }
  }
}

/**
 * Every event matching all given criteria (series and title exact, weekLabel
 * exact when given, ISO-date prefix when given).
 */
export function findEvents(cal, { series, title, weekLabel, date }) {
  const out = [];
  for (const it of walkCalendar(cal)) {
    if (weekLabel !== undefined && it.week.label !== weekLabel) continue;
    if (it.ev.series !== series || it.ev.title !== title) continue;
    if (date !== undefined && !String(it.ev.date ?? '').startsWith(date)) continue;
    out.push(it);
  }
  return out;
}

// ── Time (Europe/Paris is the calendar's timezone; every `date` is Paris time) ─

/** Full date/time parts of an instant in a zone, as a plain object. */
export function tzParts(ms, timeZone) {
  const f = new Intl.DateTimeFormat('en-GB', {
    timeZone, hourCycle: 'h23', weekday: 'short',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
  return Object.fromEntries(f.formatToParts(new Date(ms)).map((p) => [p.type, p.value]));
}

export const parisParts = (ms) => tzParts(ms, 'Europe/Paris');

/** { day: 'MON', hhmm: '15:00' } — the Paris weekday and clock of an ISO instant. */
export function parisClock(iso) {
  const p = parisParts(Date.parse(iso));
  return { day: p.weekday.toUpperCase(), hhmm: `${p.hour}:${p.minute}` };
}

/**
 * "2027-02-14T04:30:00+01:00" — HH:MM on the Paris day of `iso`, with the Paris
 * offset that day (CET +01:00 / CEST +02:00). Null for a time the spring clock
 * change skips.
 */
export function parisIsoAt(iso, hhmm) {
  const p = parisParts(Date.parse(iso));
  const day = `${p.year}-${p.month}-${p.day}`;
  for (const offset of ['+01:00', '+02:00']) {
    const candidate = `${day}T${hhmm}:00${offset}`;
    const back = parisParts(Date.parse(candidate));
    if (`${back.year}-${back.month}-${back.day}` === day && `${back.hour}:${back.minute}` === hhmm) return candidate;
  }
  return null;
}

// ── Constants & small regexes shared by the checkers and the apply tools ─────

export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
export const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;          // "15:00"
export const DURATION_RE = /^(\d+h(\d{2})?|\d+min)$/;         // "2h40", "6h", "45min"
export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;              // "2026-11-22"
export const HTTPS_RE = /^https:\/\/\S+$/;
export const stripHtml = (html) => String(html ?? '').replace(/<[^>]*>/g, '');

/** UTC day number of an ISO date ("2026-03-08…" → ms), for date arithmetic. */
export const utcDay = (iso) => {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

// ── CLI ──────────────────────────────────────────────────────────────────────

/** Split argv into positionals and `--flags`: { args, flags, has('--x') }. */
export function parseArgs(argv = process.argv.slice(2)) {
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  const args = argv.filter((a) => !a.startsWith('--'));
  return { args, flags, has: (f) => flags.has(f) };
}

// ── Check accumulator (used by every check-*.mjs) ────────────────────────────
// Collects failures instead of stopping at the first one; each script prints
// its own report at the end and exits 1 when fail is non-empty.

export function collector() {
  const fail = [];
  let checked = 0;
  return {
    fail,
    get checked() { return checked; },
    /** Count one verified item; push `msg` as a failure when given. */
    tick(msg) { checked++; if (msg) fail.push(msg); },
    /** Run `test(item, i)` over `items`; a truthy return becomes `[label] msg`. */
    check(label, items, test) {
      items.forEach((item, i) => {
        checked++;
        const msg = test(item, i);
        if (msg) fail.push(`[${label}] ${msg}`);
      });
    },
  };
}

// ── Filesystem ───────────────────────────────────────────────────────────────

/** All files under dir (recursive), optionally filtered to extensions like '.ts'. */
export function walkFiles(dir, { exts, skipDotDirs = true } = {}) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (skipDotDirs && (name === 'node_modules' || name.startsWith('.'))) continue;
      out.push(...walkFiles(full, { exts, skipDotDirs }));
    } else if (!exts || exts.has(name.slice(name.lastIndexOf('.')))) {
      out.push(full);
    }
  }
  return out;
}

/** Blank a string to spaces but keep newlines (so offsets still map to lines). */
export const blankNonNewlines = (s) => s.replace(/[^\n]/g, ' ');
