#!/usr/bin/env node
/**
 * indexnow.mjs — Tells Bing (and the other IndexNow engines: Yandex, Naver,
 * Seznam, Yep) which pages are new or changed, instead of waiting for a crawl.
 *
 * Ownership is proven by the key file in public/ (served at /{KEY}.txt), so no
 * account or secret is involved. Google does not take part in IndexNow.
 *
 * Run after `npm run build`: it reads the sitemap from dist/client, hashes each
 * page's built HTML and submits only the URLs whose hash differs from the last
 * run (stored in .indexnow-hashes.json, gitignored). With no previous file —
 * the first run, or a fresh CI cache — every sitemap URL is submitted.
 *
 * Usage:
 *   npm run indexnow                    changed URLs only
 *   npm run indexnow -- --all           every sitemap URL
 *   npm run indexnow -- --dry-run       list what would be sent, send nothing
 *   npm run indexnow -- <url> [<url>…]  exactly these URLs
 *
 * Only run it once the build is deployed: the engines fetch the key file and
 * the pages straight away, and a 404 on the key file fails the submission.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = join(ROOT, 'dist/client');
const HASHES_PATH = join(ROOT, '.indexnow-hashes.json');

/** Must match the file public/{KEY}.txt, whose only content is the key itself. */
const KEY = 'e59bb2976b0e6d32bc6852449ff33473';
// INDEXNOW_ENDPOINT only exists so the script can be tested against a local server.
const ENDPOINT = process.env.INDEXNOW_ENDPOINT ?? 'https://api.indexnow.org/indexnow';
const BATCH = 10_000; // protocol maximum per request

const args = process.argv.slice(2);
const flags = new Set(args.filter(a => a.startsWith('--')));
const explicit = args.filter(a => !a.startsWith('--'));
const dryRun = flags.has('--dry-run');

function fail(msg) {
  console.error(`indexnow: ${msg}`);
  process.exit(1);
}

const keyFile = join(ROOT, 'public', `${KEY}.txt`);
if (!existsSync(keyFile) || readFileSync(keyFile, 'utf8').trim() !== KEY) {
  fail(`public/${KEY}.txt is missing or does not contain the key`);
}

// ── Sitemap → URLs ───────────────────────────────────────────────────────────

const locs = xml => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());

function sitemapUrls() {
  const index = join(DIST, 'sitemap-index.xml');
  if (!existsSync(index)) fail('dist/client/sitemap-index.xml not found: run `npm run build` first');
  const urls = [];
  for (const sm of locs(readFileSync(index, 'utf8'))) {
    const file = join(DIST, new URL(sm).pathname);
    if (!existsSync(file)) fail(`${sm} is in the sitemap index but not in dist/client`);
    urls.push(...locs(readFileSync(file, 'utf8')));
  }
  return urls;
}

/** Built HTML for a URL ("format: file" gives /a/b → a/b.html), or null if none. */
function htmlFor(url) {
  const p = decodeURIComponent(new URL(url).pathname).replace(/\/$/, '');
  for (const f of [p === '' ? 'index.html' : `${p.slice(1)}.html`, `${p.slice(1)}/index.html`]) {
    const full = join(DIST, f);
    if (existsSync(full)) return readFileSync(full);
  }
  return null;
}

const sha = buf => createHash('sha256').update(buf).digest('hex');

// ── Pick the URLs to send ────────────────────────────────────────────────────

let urls;
const hashes = {};

if (explicit.length) {
  urls = explicit;
} else {
  const all = sitemapUrls();
  const prev = existsSync(HASHES_PATH) ? JSON.parse(readFileSync(HASHES_PATH, 'utf8')) : {};
  urls = [];
  for (const u of all) {
    const html = htmlFor(u);
    // A page with no built file can't be compared, so treat it as changed.
    if (html) hashes[u] = sha(html);
    if (flags.has('--all') || !html || prev[u] !== hashes[u]) urls.push(u);
  }
  console.log(`${all.length} URLs in the sitemap, ${urls.length} new or changed`);
}

if (!urls.length) {
  console.log('Nothing to submit.');
  process.exit(0);
}

const host = new URL(urls[0]).host;
const foreign = urls.filter(u => new URL(u).host !== host);
if (foreign.length) fail(`all URLs must share one host, but found ${foreign[0]}`);

if (dryRun) {
  console.log(`[dry run] would submit to ${ENDPOINT} for ${host}:`);
  for (const u of urls.slice(0, 20)) console.log(`  ${u}`);
  if (urls.length > 20) console.log(`  … and ${urls.length - 20} more`);
  process.exit(0);
}

// ── Submit ───────────────────────────────────────────────────────────────────

for (let i = 0; i < urls.length; i += BATCH) {
  const chunk = urls.slice(i, i + BATCH);
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host,
      key: KEY,
      keyLocation: `https://${host}/${KEY}.txt`,
      urlList: chunk,
    }),
  });
  // 200 = accepted; 202 = accepted, key validation still pending.
  if (res.status !== 200 && res.status !== 202) {
    const hint = {
      400: 'bad request format',
      403: 'key not found at the key location: is the build deployed?',
      422: 'a URL does not belong to the host, or the key does not match',
      429: 'too many requests: try again later',
    }[res.status] ?? 'unexpected response';
    fail(`HTTP ${res.status} (${hint}) ${(await res.text()).slice(0, 200)}`);
  }
  console.log(`Submitted ${chunk.length} URLs (HTTP ${res.status})`);
}

// Only remember hashes once the engines have accepted the batch.
if (!explicit.length) writeFileSync(HASHES_PATH, JSON.stringify(hashes));
