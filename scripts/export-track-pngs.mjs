#!/usr/bin/env node
/**
 * scripts/export-track-pngs.mjs
 *
 * Converts every circuit SVG in public/assets/track-maps/ to a small PNG
 * suitable for email (white stroke, transparent background, 80×80px).
 *
 * WRC flag SVGs (*-wrc.svg) are skipped — they use linear gradients that
 * ImageMagick cannot render, and they are never referenced in email templates.
 *
 * Prerequisites: ImageMagick (convert) must be in PATH.
 *
 * Usage:
 *   node scripts/export-track-pngs.mjs          # skip already-exported
 *   node scripts/export-track-pngs.mjs --force  # re-export everything
 */

import fs   from 'fs';
import path from 'path';
import { execSync }      from 'child_process';
import { fileURLToPath } from 'url';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const ROOT       = path.join(__dirname, '..');
const INPUT_DIR  = path.join(ROOT, 'public/assets/track-maps');
const OUTPUT_DIR = path.join(ROOT, 'public/assets/tracks/email');
const FORCE      = process.argv.includes('--force');
const TMP_DIR    = '/tmp/track-pngs-build';

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(TMP_DIR,    { recursive: true });

// --------------------------------------------------------------------------
// Strip the decorative dot-pattern background rect and its <defs> block.
// These use fill="url(#patternXXX)" which confuses ImageMagick. The actual
// track outline uses stroke="white" and renders fine without the defs.
// --------------------------------------------------------------------------
function cleanSvg(raw) {
  return raw
    .replace(/<rect[^>]*fill="url\([^)]*\)"[^>]*\/>/g, '')
    .replace(/<rect[^>]*fill="url\([^)]*\)"[^>]*>[\s\S]*?<\/rect>/g, '')
    .replace(/<defs>[\s\S]*?<\/defs>/g, '');
}

// Skip WRC national-flag SVGs — they use linear gradients ImageMagick can't handle
// and are excluded from the email template by isCircuitSvg() anyway.
const svgFiles = fs.readdirSync(INPUT_DIR)
  .filter(f => f.endsWith('.svg') && !f.endsWith('-wrc.svg'))
  .sort();

let ok = 0, skipped = 0, failed = 0;

console.log(`\nExporting ${svgFiles.length} SVGs → ${OUTPUT_DIR}\n`);

for (const filename of svgFiles) {
  const outFilename = filename.replace('.svg', '.png');
  const outPath     = path.join(OUTPUT_DIR, outFilename);

  if (!FORCE && fs.existsSync(outPath)) {
    skipped++;
    continue;
  }

  const inPath  = path.join(INPUT_DIR, filename);
  const tmpPath = path.join(TMP_DIR, filename);

  try {
    const raw     = fs.readFileSync(inPath, 'utf8');
    const cleaned = cleanSvg(raw);
    fs.writeFileSync(tmpPath, cleaned, 'utf8');

    execSync(
      `convert -background none -alpha set -density 150 "${tmpPath}" -resize 80x80 -type TrueColorAlpha "${outPath}"`,
      { timeout: 15_000, stdio: 'pipe' }
    );

    ok++;
    process.stdout.write(`  ✓  ${outFilename}\n`);
  } catch (err) {
    failed++;
    const msg = (err.stderr ?? err.message ?? '').toString().slice(0, 120);
    console.error(`  ✗  ${filename}: ${msg}`);
  }
}

try { fs.rmSync(TMP_DIR, { recursive: true }); } catch {}

console.log(`
Done.
  Exported : ${ok}
  Skipped  : ${skipped}  (already exist; use --force to re-export)
  Failed   : ${failed}
`);

if (failed > 0) process.exit(1);
