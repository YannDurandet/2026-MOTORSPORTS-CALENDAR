#!/usr/bin/env node
/**
 * scripts/export-track-pngs.mjs
 *
 * Converts every circuit SVG in public/assets/track-maps/ to a small PNG
 * suitable for email (white stroke, transparent background, 80×80px).
 *
 * WRC flag SVGs (*-wrc.svg) are skipped: the email template never shows them.
 *
 * Renders with sharp (already a devDependency), so it needs no system tool and
 * runs the same on macOS and Windows. It used to shell out to ImageMagick's
 * `convert`, which ImageMagick 7 no longer ships and which on Windows is a
 * system disk utility.
 *
 * Usage:
 *   node scripts/export-track-pngs.mjs          # skip already-exported
 *   node scripts/export-track-pngs.mjs --force  # re-export everything
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp             from 'sharp';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const ROOT       = path.join(__dirname, '..');
const INPUT_DIR  = path.join(ROOT, 'public/assets/track-maps');
const OUTPUT_DIR = path.join(ROOT, 'public/assets/tracks/email');
const FORCE      = process.argv.includes('--force');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// --------------------------------------------------------------------------
// Strip the decorative dot-pattern background rect and its <defs> block
// (fill="url(#patternXXX)"): an email icon is the outline only. The actual
// track outline uses stroke="white" and renders fine without the defs.
// --------------------------------------------------------------------------
function cleanSvg(raw) {
  return raw
    .replace(/<rect[^>]*fill="url\([^)]*\)"[^>]*\/>/g, '')
    .replace(/<rect[^>]*fill="url\([^)]*\)"[^>]*>[\s\S]*?<\/rect>/g, '')
    .replace(/<defs>[\s\S]*?<\/defs>/g, '');
}

// Skip WRC national-flag SVGs: the email template excludes them (isCircuitSvg()).
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

  const inPath = path.join(INPUT_DIR, filename);

  try {
    const cleaned = cleanSvg(fs.readFileSync(inPath, 'utf8'));
    // Same output as the old ImageMagick call: rendered at 150 dpi, fitted
    // inside 80×80, transparent background.
    await sharp(Buffer.from(cleaned), { density: 150 })
      .resize(80, 80, { fit: 'inside' })
      .png()
      .toFile(outPath);

    ok++;
    process.stdout.write(`  ✓  ${outFilename}\n`);
  } catch (err) {
    failed++;
    const msg = String(err?.message ?? err).slice(0, 120);
    console.error(`  ✗  ${filename}: ${msg}`);
  }
}

console.log(`
Done.
  Exported : ${ok}
  Skipped  : ${skipped}  (already exist; use --force to re-export)
  Failed   : ${failed}
`);

if (failed > 0) process.exit(1);
