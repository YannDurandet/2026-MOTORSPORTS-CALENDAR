#!/usr/bin/env node
/**
 * gen-icons.mjs — Regenerate PWA icons from public/assets/website-icon.svg
 *
 * Requires: npm install sharp  (not in devDependencies by default — run once)
 *
 * Outputs to public/assets/:
 *   icon-192.png          — standard PWA icon
 *   icon-512.png          — large PWA icon
 *   icon-512-maskable.png — maskable icon (safe area: 80% of canvas)
 *   apple-touch-icon.png  — iOS 180×180
 *
 * Usage: node scripts/gen-icons.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root   = resolve(__dirname, '..');
const outDir = resolve(root, 'public/assets');

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('sharp is not installed. Run: npm install sharp');
  process.exit(1);
}

// Wrap the SVG in a coloured background and add safe-zone padding for maskable
function makeSvg(size, paddingPct = 0.1) {
  const pad = Math.round(size * paddingPct);
  const inner = size - pad * 2;
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#0b0f12"/>
  <svg x="${pad}" y="${pad}" width="${inner}" height="${inner}" viewBox="0 0 24 24" fill="none">
    <path d="M21 12C21 16.9706 16.9706 21 12 21M21 12C21 7.02944 16.9706 3 12 3M21 12H3M12 21C7.02944 21 3 16.9706 3 12M12 21C14.2512 18.5355 15.5305 15.3372 15.6 12C15.5305 8.66283 14.2512 5.46452 12 3M12 21C9.74885 18.5355 8.46952 15.3372 8.4 12C8.46952 8.66283 9.74885 5.46452 12 3M3 12C3 7.02944 7.02944 3 12 3"
      stroke="#4a7090" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</svg>`;
}

const configs = [
  { name: 'icon-192.png',          size: 192, pad: 0.10 },
  { name: 'icon-512.png',          size: 512, pad: 0.10 },
  { name: 'icon-512-maskable.png', size: 512, pad: 0.20 },
  { name: 'apple-touch-icon.png',  size: 180, pad: 0.10 },
];

for (const { name, size, pad } of configs) {
  const svg = Buffer.from(makeSvg(size, pad));
  await sharp(svg).png().toFile(resolve(outDir, name));
  console.log(`✓ ${name}`);
}
