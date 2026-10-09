#!/usr/bin/env node
/**
 * gen-series-images.mjs — Build the 640px-wide variants of the /series grid
 * images.
 *
 * Every `*-series-bg.webp` in public/assets/series-grid-images/ is 880×532
 * (~140 KB) but the /series cards display it at ~320–570 CSS px wide. This
 * writes a `<name>-640w.webp` sibling (width 640, aspect kept) that
 * src/pages/series/index.astro offers through `srcset`; the 880px original
 * stays as the `src` fallback and is still what og:image / other pages use.
 *
 * Re-running overwrites the variants with identical output, so it is safe to
 * run any time. Variants (`*-640w.webp`) are never used as a source.
 * Run it after adding or replacing a series grid image. The 880px source must
 * stay 880 wide (series/index.astro hardcodes the `880w` descriptor).
 *
 * Cache note: returning visitors with the service worker get /assets images
 * cache-first (public/sw.js), so a file replaced IN PLACE keeps serving the old
 * bytes until sw.js `VERSION` is bumped. Prefer a new filename, or bump VERSION.
 *
 * Usage: npm run gen:series-images
 */
import { readdir, stat } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dir = resolve(root, 'public/assets/series-grid-images');

const WIDTH = 640;
const QUALITY = 70;
const EFFORT = 6;

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

const sources = (await readdir(dir))
  .filter((f) => f.endsWith('-series-bg.webp'))
  .sort();

let totalBefore = 0;
let totalAfter = 0;

for (const file of sources) {
  const variant = file.replace(/\.webp$/, `-${WIDTH}w.webp`);
  const input = resolve(dir, file);
  const output = resolve(dir, variant);

  await sharp(input)
    .resize({ width: WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: EFFORT })
    .toFile(output);

  const before = (await stat(input)).size;
  const after = (await stat(output)).size;
  totalBefore += before;
  totalAfter += after;

  const saved = Math.round((1 - after / before) * 100);
  console.log(`✓ ${variant}  ${kb(before)} → ${kb(after)}  (−${saved}%)`);
}

const savedTotal = totalBefore ? Math.round((1 - totalAfter / totalBefore) * 100) : 0;
console.log(
  `\n${sources.length} images: ${kb(totalBefore)} → ${kb(totalAfter)} (−${savedTotal}%)`,
);
