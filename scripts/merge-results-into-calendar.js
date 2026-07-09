#!/usr/bin/env node
/**
 * merge-results-into-calendar.js
 *
 * Reads data/results.json and embeds each result entry directly into the
 * matching calendar event in data/calendar.json as a `results` array.
 *
 * Matching: series + month + venue (strips layout suffixes like -fe, -motogp)
 *
 * Safe to re-run — clears existing `results` fields before merging.
 *
 * Usage:  node scripts/merge-results-into-calendar.js
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname     = path.dirname(fileURLToPath(import.meta.url));
const ROOT          = path.join(__dirname, '..');
const CALENDAR_PATH = path.join(ROOT, 'data', 'calendar.json');
const RESULTS_PATH  = path.join(ROOT, 'data', 'results.json');

const calendar = JSON.parse(fs.readFileSync(CALENDAR_PATH, 'utf8'));
const results  = JSON.parse(fs.readFileSync(RESULTS_PATH,  'utf8'));

const MONTH_NAMES = [
  'JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
  'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER',
];

// Strip layout/series suffixes so track SVG names match result venue slugs.
// Keeps -wrc, -erc etc. (part of the venue identity for rally events).
function stripSuffix(slug) {
  return (slug || '')
    .replace(/\.svg$/, '')
    .replace(/-(f1|motogp|fe|wsbk|oval|road|gp|national|nascar)$/, '');
}

// --- 1. Merge -----------------------------------------------------------
// NOTE: existing results in calendar.json are preserved — this script only
// adds entries from results.json that aren't already present (matched by date).

const matched   = [];
const unmatched = [];

for (const [monthKey, seriesMap] of Object.entries(results)) {
  const monthIdx  = parseInt(monthKey.split('-')[1], 10) - 1;
  const monthName = MONTH_NAMES[monthIdx];

  const calMonth  = calendar.find(m => m.month.toUpperCase() === monthName);
  if (!calMonth) {
    console.warn(`  WARN  No calendar month for ${monthKey}`);
    continue;
  }

  for (const [series, entries] of Object.entries(seriesMap)) {
    if (!entries || entries.length === 0) continue;

    // Group result entries by venue — each venue = one calendar event.
    const byVenue = {};
    for (const entry of entries) {
      const v = entry.venue || '__unknown__';
      (byVenue[v] = byVenue[v] || []).push(entry);
    }

    for (const [venue, venueEntries] of Object.entries(byVenue)) {
      const venueStripped = stripSuffix(venue);

      // Find the calendar event for this series+venue within this month.
      // Primary match: venue slug vs track SVG name (strips layout suffixes).
      // Fallback: for WRC/ERC flag SVGs (e.g. italy-wrc.svg) where venue
      // is a city slug ("rome") rather than a flag name, match by series
      // alone within the month — there should only be one event per month.
      let hit = null;
      outer: for (const week of calMonth.weeks) {
        for (const ev of week.events) {
          if (ev.series !== series) continue;
          const evVenue = stripSuffix(ev.track || '');
          if (
            evVenue === venue         ||
            evVenue === venueStripped ||
            stripSuffix(evVenue) === venueStripped
          ) {
            hit = ev;
            break outer;
          }
        }
      }

      // Fallback: flag-SVG tracks (WRC/ERC) don't match by venue slug —
      // use the sole series event in this month.
      if (!hit) {
        const seriesEventsInMonth = [];
        for (const week of calMonth.weeks)
          for (const ev of week.events)
            if (ev.series === series) seriesEventsInMonth.push(ev);
        if (seriesEventsInMonth.length === 1) hit = seriesEventsInMonth[0];
      }

      if (hit) {
        const existing = new Set((hit.results || []).map(r => r.date + (r.race_label || '')));
        const toAdd = venueEntries.filter(r => !existing.has(r.date + (r.race_label || '')));
        if (toAdd.length) {
          hit.results = (hit.results || []).concat(toAdd).sort((a, b) => a.date.localeCompare(b.date));
        }
        matched.push(`  ✓  ${series.padEnd(10)} ${monthKey}  ${venue.padEnd(22)} → "${hit.title}"`);
      } else {
        unmatched.push(`  ✗  ${series.padEnd(10)} ${monthKey}  ${venue}  — no calendar event found`);
      }
    }
  }
}

// --- 3. Write output ----------------------------------------------------

fs.writeFileSync(CALENDAR_PATH, JSON.stringify(calendar, null, 2), 'utf8');

// --- 4. Report ----------------------------------------------------------

console.log('\n=== MERGED ===');
matched.forEach(l => console.log(l));

if (unmatched.length) {
  console.log('\n=== UNMATCHED (results not embedded — check results-gaps.md) ===');
  unmatched.forEach(l => console.log(l));
}

console.log(`\nDone. ${matched.length} matched, ${unmatched.length} unmatched.`);
console.log(`data/calendar.json updated.`);
