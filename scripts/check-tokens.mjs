#!/usr/bin/env node
/**
 * check-tokens.mjs — Keeps site CSS on the design tokens in src/styles/tokens.css.
 *
 * Fails on any colour, font-family, font-size or border-radius literal in
 * src/styles/*.css or an .astro <style> block. Use a token instead, or add
 * one to tokens.css if nothing fits.
 *
 * Skipped on purpose: tokens.css itself, @font-face blocks, em-relative font
 * sizes, and the embed page (third-party iframe with its own local tokens).
 * Email HTML lives in .ts files, which this never reads.
 *
 * Usage: npm run check:tokens
 */

import { readText, walkFiles, blankNonNewlines, ROOT } from './lib.mjs';
import { resolve, relative } from 'path';

const SRC = resolve(ROOT, 'src');

const SKIP = [
  'src/styles/tokens.css',
  'src/pages/embed/',
];

const RULES = [
  [/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/g,          'colour literal'],
  [/font-family\s*:(?!\s*(?:var\(|inherit\b))[^;}]+/g, 'font-family literal'],
  [/font-size\s*:\s*[\d.]+(?:rem|px)\b/g,             'font-size literal'],
  [/border(?:-[a-z]+)*-radius\s*:\s*[\d.]+(?:px|%)/g, 'border-radius literal'],
];

// Keep only <style> contents; everything else becomes whitespace.
const blank = blankNonNewlines;
function cssRegions(file, text) {
  if (file.endsWith('.css')) return text;
  let out = '', last = 0;
  for (const m of text.matchAll(/(<style[^>]*>)([\s\S]*?)(<\/style>)/g)) {
    out += blank(text.slice(last, m.index + m[1].length)) + m[2];
    last = m.index + m[1].length + m[2].length;
  }
  return out + blank(text.slice(last));
}

const fail = [];
let scanned = 0;
for (const abs of walkFiles(SRC)) {
  const file = relative(ROOT, abs);
  if (!/\.(css|astro)$/.test(file) || SKIP.some(s => file.startsWith(s))) continue;
  scanned++;
  let css = cssRegions(file, readText(relative(ROOT, abs)))
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/@font-face\s*\{[^}]*\}/g, blank);
  for (const [re, label] of RULES) {
    for (const m of css.matchAll(re)) {
      const line = css.slice(0, m.index).split('\n').length;
      fail.push(`${file}:${line}  ${label}: ${m[0].trim()}`);
    }
  }
}

if (fail.length) {
  console.error(`✗ check-tokens: ${fail.length} literal(s) in site CSS. Use a var from src/styles/tokens.css:\n`);
  for (const f of fail) console.error('  ' + f);
  process.exit(1);
}
console.log(`✓ check-tokens: ${scanned} files use tokens only`);
