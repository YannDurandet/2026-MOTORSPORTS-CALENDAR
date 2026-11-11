#!/usr/bin/env node
/**
 * check-support-series.mjs: checks for data/supportSeries.json and for the
 * optional `status` / `source` fields on sessions and sub rows in calendar.json.
 * Not wired into `npm run check` yet. Usage: node scripts/check-support-series.mjs
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => JSON.parse(readFileSync(resolve(root, f), 'utf8'));
const catalog = read('data/supportSeries.json');
const calendar = read('data/calendar.json');

const fail = [];
let checked = 0;
const httpsRe = /^https:\/\/\S+$/;
const calSeries = new Set();
for (const m of calendar) for (const w of m.weeks) for (const e of w.events) calSeries.add(e.series);

// ── Catalog structure ───────────────────────────────────────────────────────
const slugs = new Set();
for (const e of catalog.entries) {
  checked++;
  const id = `[catalog] "${e.slug ?? '?'}"`;
  if (!e.slug || slugs.has(e.slug)) fail.push(`${id} missing or duplicate slug`);
  slugs.add(e.slug);
  if (!e.name) fail.push(`${id} has no name`);
  if (!catalog.relations.includes(e.relation)) fail.push(`${id} relation "${e.relation}" is not one of ${catalog.relations.join(', ')}`);
  if (!Array.isArray(e.parents) || !e.parents.length) fail.push(`${id} needs a non-empty "parents" array`);
  for (const p of e.parents ?? []) if (!calSeries.has(p)) fail.push(`${id} parent "${p}" is not a series in calendar.json`);
  if (e.calendarSlug && !calSeries.has(e.calendarSlug)) fail.push(`${id} calendarSlug "${e.calendarSlug}" is not a series in calendar.json`);
  for (const [year, y] of Object.entries(e.years ?? {})) {
    if (!catalog.statuses.includes(y.status)) fail.push(`${id} ${year} status "${y.status}" is not one of ${catalog.statuses.join(', ')}`);
    if (y.status === 'confirmed' && !httpsRe.test(y.source ?? '')) fail.push(`${id} ${year} is "confirmed" without an https source`);
    if (y.source && !httpsRe.test(y.source)) fail.push(`${id} ${year} source "${y.source}" is not an https URL`);
    if (y.status === 'confirmed' && !y.rounds) fail.push(`${id} ${year} is "confirmed" without a rounds description`);
  }
}

// ── Optional status/source on sessions and sub rows ────────────────────────
const SESSION_STATUSES = ['confirmed', 'provisional'];
for (const m of calendar) {
  for (const w of m.weeks) {
    for (const ev of w.events) {
      const rows = [
        ...(ev.sessions ?? []).map((r) => ['session', r]),
        ...(ev.sub ?? []).map((r) => ['sub', r]),
      ];
      for (const [kind, r] of rows) {
        if (r.status === undefined && r.source === undefined) continue;
        checked++;
        const id = `[${ev.series}] "${ev.title}" ${kind} "${r.label}"`;
        if (r.status !== undefined && !SESSION_STATUSES.includes(r.status)) fail.push(`${id} status "${r.status}" must be confirmed or provisional`);
        if (r.source !== undefined && !httpsRe.test(r.source)) fail.push(`${id} source "${r.source}" is not an https URL`);
        if (r.status === 'confirmed' && !r.source) fail.push(`${id} is "confirmed" without a source`);
        if (r.source && !r.status) fail.push(`${id} has a source but no status`);
      }
    }
  }
}

if (fail.length) {
  console.error(`check-support-series: ${fail.length} problem(s)\n` + fail.map((f) => '  ✗ ' + f).join('\n'));
  process.exit(1);
}
console.log(`check-support-series: ${checked} item(s) OK (${catalog.entries.length} catalog entries).`);
