#!/usr/bin/env node
/**
 * check-season.mjs — the season year is written in one place only.
 *
 * The site presents one season as current: DEFAULT_CALENDAR_YEAR in
 * src/lib/season.ts. Rolling over to the next season should be that one
 * constant (plus `npm run gen:season`). It only stays that way if no template
 * types the year: before this check the year was written out in 40-odd places
 * (titles, H1s, descriptions, the footer), each of which would have gone on
 * calling the site a 2026 calendar after the rollover.
 *
 * FAILS when a file under src/ or workers/ contains the current season year,
 * or the next one, as a literal in code. Import the constant instead:
 *     import { DEFAULT_CALENDAR_YEAR } from '../lib/season';
 * (next season: DEFAULT_CALENDAR_YEAR + 1).
 *
 * Not checked:
 *   - comments;
 *   - the files in ALLOWED, which hold prose or dates about one season and
 *     say so themselves.
 *
 * REMINDS (does not fail) when season prose is waiting to be rewritten after a
 * rollover: the home FAQ is hidden, or series descriptions are being generated.
 *
 * Part of `npm run check`.
 */

import { resolve, relative, sep } from 'path';
import { readText, walkFiles, blankNonNewlines, defaultYear, ROOT } from './lib.mjs';

const season = defaultYear;

/** Files that may name a season year, and why. Paths use forward slashes. */
const ALLOWED = new Map([
  ['src/lib/season.ts', 'declares the constant'],
  ['src/lib/faq.ts', 'FAQ answers about one season, gated by FAQ_SEASON'],
  ['src/lib/seasonCopy.ts', 'series descriptions keyed by season'],
  ['src/pages/legal/privacy.astro', '"last updated" dates'],
  ['src/pages/legal/tos.astro', '"last updated" dates'],
]);

const EXTENSIONS = new Set(['.astro', '.ts', '.js', '.mjs', '.css']);

/**
 * Blank out comments, keeping line numbers: block comments (JS and CSS),
 * HTML comments and `//` comments. A comment only counts when it starts a line
 * or follows whitespace, so the `//` in `https://…` and the `/*` in a glob
 * such as '/track-maps/*.svg' are left alone.
 */
const blank = blankNonNewlines;
function stripComments(text) {
  const keepLead = (m, lead) => lead + blank(m.slice(lead.length));
  return text
    .replace(/(^|\s)\/\*[\s\S]*?\*\//gm, keepLead)
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/(^|\s)\/\/.*$/gm, keepLead);
}

const years = [season, season + 1];
const pattern = new RegExp(`(?<![\\w.#-])(${years.join('|')})(?![\\w-]*\\.(?:svg|png|webp|avif|json))(?!\\d)`, 'g');

const problems = [];
const files = [...walkFiles(resolve(ROOT, 'src'), { exts: EXTENSIONS }),
                 ...walkFiles(resolve(ROOT, 'workers'), { exts: EXTENSIONS })];
for (const file of files) {
  const rel = relative(ROOT, file).split(sep).join('/');
  if (ALLOWED.has(rel)) continue;
  const lines = stripComments(readText(rel)).split('\n');
  lines.forEach((line, i) => {
    for (const m of line.matchAll(pattern)) {
      problems.push(`${rel}:${i + 1}  writes ${m[1]}: ${line.trim().slice(0, 110)}`);
    }
  });
}

if (problems.length) {
  console.error(`\n❌  check-season: ${problems.length} place(s) write a season year as a literal:\n`);
  for (const p of problems) console.error('  • ' + p);
  console.error(`\n    The current season is DEFAULT_CALENDAR_YEAR (${season}) in src/lib/season.ts. Use the constant`);
  console.error('    (or DEFAULT_CALENDAR_YEAR + 1 for the next season) so the rollover stays one line.');
  console.error('    Season prose belongs in src/lib/seasonCopy.ts or src/lib/faq.ts.\n');
  process.exit(1);
}

// ── Reminders: season prose waiting for a rewrite ────────────────────────────
const notes = [];
const faqSeason = Number(/FAQ_SEASON\s*=\s*(\d{4})/.exec(readText('src/lib/faq.ts'))?.[1]);
if (faqSeason !== season) {
  notes.push(`the home-page FAQ is hidden: src/lib/faq.ts was written for ${faqSeason || 'an unknown season'}. Rewrite the answers for ${season}, then set FAQ_SEASON = ${season}.`);
}
if (!new RegExp(`^\\s*${season}\\s*:\\s*\\{`, 'm').test(readText('src/lib/seasonCopy.ts'))) {
  notes.push(`series pages use generated descriptions: src/lib/seasonCopy.ts has no ${season} block yet.`);
}

console.log(`✓ check-season: no season year typed into ${files.length - ALLOWED.size} files (season ${season})`);
for (const n of notes) console.log(`  ! reminder: ${n}`);
