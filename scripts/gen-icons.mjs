#!/usr/bin/env node
/**
 * gen-icons.mjs — Regenerate favicons and PWA icons from src/assets/dord-mark.png
 * (the square DORD mark, white on brand blue, 900×900).
 *
 * The mark already sits inside an ~80% safe zone, so the same artwork serves
 * as the maskable icon.
 *
 * Outputs to public/assets/:
 *   favicon-32.png, favicon-48.png — browser tabs
 *   apple-touch-icon.png           — iOS 180×180
 *   icon-192.png, icon-512.png     — PWA
 *   icon-512-maskable.png          — PWA maskable
 *
 * Usage: npm run gen:icons
 */
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(root, 'src/assets/dord-mark.png');
const out = (f) => resolve(root, 'public/assets', f);

const sizes = [
  ['favicon-32.png', 32], ['favicon-48.png', 48], ['apple-touch-icon.png', 180],
  ['icon-192.png', 192], ['icon-512.png', 512], ['icon-512-maskable.png', 512],
];
for (const [file, size] of sizes) {
  await sharp(src).resize(size, size, { kernel: 'lanczos3' }).flatten({ background: '#143374' })
    .png({ compressionLevel: 9, palette: size <= 48 }).toFile(out(file));
  console.log(`✓ ${file} (${size}×${size})`);
}
