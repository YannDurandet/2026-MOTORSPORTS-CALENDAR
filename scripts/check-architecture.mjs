#!/usr/bin/env node
/**
 * check-architecture.mjs — machine-enforceable architecture rules (governance
 * goal, property 7). Wired into `npm run check`, so CI (deploy.yml) fails the
 * build when a change reintroduces structural chaos. Rules:
 *
 *   A1  No circular imports anywhere in src/ + workers/ (import-graph DFS).
 *   A2  Layer direction (see docs/governance/ARCHITECTURE.md):
 *         src/lib        → src/lib, data/            (never UI/client/scripts/workers)
 *         src/pages|components|layouts|integrations → those + src/lib + data/
 *         workers/       → workers/, src/lib, data/
 *         nothing in src/ imports scripts/ or workers/
 *       Browser-side code (src/client/* and inline <script> blocks in .astro)
 *       may import src/client/* and any *browser-safe* src/lib module — one
 *       whose transitive local imports touch no node builtins, no
 *       `cloudflare:workers`, and no process/import.meta.env (computed below).
 *   A3  JSON responses come from jsonResponse() in src/lib/http.ts (ADR-0001):
 *       no `new Response(JSON.stringify(` outside that file.
 *
 * Usage: node scripts/check-architecture.mjs   (exit 1 on any violation)
 */

import { readFileSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';
import { ROOT, walkFiles, collector, isMain } from './lib.mjs';

const SRC = join(ROOT, 'src');
const WORKERS = join(ROOT, 'workers');
const EXTS = new Set(['.ts', '.js', '.astro', '.mjs']);
const ASSET_RE = /\.(json|css|svg|png|jpe?g|webp|gif|woff2?|ico)(\?.*)?$/;

const c = collector();

// ── Collect files & imports ──────────────────────────────────────────────────

const files = [...walkFiles(SRC, { exts: EXTS }), ...walkFiles(WORKERS, { exts: EXTS })];

/** layerOf(path) → one of lib|client|ui|workers */
function layerOf(file) {
  const rel = relative(ROOT, file);
  if (rel.startsWith('src/lib/')) return 'lib';
  if (rel.startsWith('src/client/')) return 'client';
  if (rel.startsWith('workers/')) return 'workers';
  return 'ui'; // pages, components, layouts, integrations, env.d.ts
}

const IMPORT_RE = /(?:from\s*|import\s*\(\s*|import\s+)['"]([^'"]+)['"]/g;

/** Split an .astro file into { frontmatter, rest } (frontmatter is the first ---…--- block). */
function splitAstro(src) {
  if (!src.startsWith('---')) return { frontmatter: '', rest: src };
  const end = src.indexOf('\n---', 3);
  if (end === -1) return { frontmatter: src, rest: '' };
  return { frontmatter: src.slice(0, end + 4), rest: src.slice(end + 4) };
}

/**
 * file → { deps: [local imports in frontmatter/module scope],
 *           scriptDeps: [local imports inside inline <script> blocks],
 *           bare: [non-relative imports] }
 * `?raw` / `?url` / asset imports are references, not graph edges.
 */
const graph = new Map();
for (const file of files) {
  const raw = readFileSync(file, 'utf8');
  const { frontmatter, rest } = file.endsWith('.astro') ? splitAstro(raw) : { frontmatter: raw, rest: '' };

  // → resolved path | 'asset' (data/css/image — not a graph edge) | 'bare' | null (unresolved local)
  const resolveSpec = (spec) => {
    const clean = spec.replace(/\?(raw|url|inline).*$/, '');
    if (ASSET_RE.test(clean)) return 'asset';
    if (!clean.startsWith('.')) return 'bare';
    const base = resolve(dirname(file), clean);
    const candidates = [base, `${base}.ts`, `${base}.js`, `${base}.astro`, `${base}.mjs`,
      join(base, 'index.ts'), join(base, 'index.js')];
    return candidates.find(p => files.includes(p)) ?? null;
  };

  const deps = [];
  const bare = new Set();
  const scan = (text, target) => {
    for (const m of text.matchAll(IMPORT_RE)) {
      const r = resolveSpec(m[1]);
      if (r === 'bare') { bare.add(m[1]); continue; }
      if (r === 'asset') continue;
      if (r) target.push(r);
      else c.tick(`[imports] ${relative(ROOT, file)} imports '${m[1]}' which is not a known local module (typo or missing file?)`);
    }
  };
  scan(frontmatter, deps);

  // Inline <script> blocks run in the browser via Vite.
  const scriptDeps = [];
  for (const block of rest.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) scan(block[1], scriptDeps);

  graph.set(file, { deps, scriptDeps, bare });
}

// ── Browser-safety of src/lib (transitive) ──────────────────────────────────
// A lib module is browser-safe when no module in its transitive local closure
// imports node builtins, cloudflare:workers, or uses process/import.meta.env.

const NODE_BUILTINS = new Set(['fs', 'path', 'crypto', 'os', 'util', 'child_process', 'http', 'https',
  'stream', 'zlib', 'buffer', 'events', 'url', 'querystring', 'tty', 'worker_threads']);
const isNodeish = (file) => {
  const { bare } = graph.get(file);
  for (const b of bare) {
    const name = b.startsWith('node:') ? b.slice(5) : b.split('/')[0];
    if (NODE_BUILTINS.has(name) || b === 'cloudflare:workers') return true;
  }
  const src = readFileSync(file, 'utf8');
  return /\bprocess\s*\.|import\.meta\.env/.test(src);
};

const browserSafe = new Map(); // file → bool (only meaningful for lib files)
const safeMemo = (file, seen = new Set()) => {
  if (browserSafe.has(file)) return browserSafe.get(file);
  if (seen.has(file)) return true; // cycle — A1 reports it separately
  seen.add(file);
  let ok = !isNodeish(file);
  for (const dep of graph.get(file).deps) {
    if (layerOf(dep) === 'lib' && !safeMemo(dep, seen)) ok = false;
  }
  browserSafe.set(file, ok);
  return ok;
};
for (const f of files) if (layerOf(f) === 'lib') safeMemo(f);

// ── A1: cycle detection (DFS, iterative) ─────────────────────────────────────

const WHITE = 0, GRAY = 1, BLACK = 2;
const color = new Map(files.map(f => [f, WHITE]));
for (const start of files) {
  if (color.get(start) !== WHITE) continue;
  const stack = [[start, graph.get(start).deps[Symbol.iterator]()]];
  color.set(start, GRAY);
  while (stack.length) {
    const top = stack[stack.length - 1];
    const next = top[1].next();
    if (next.done) { color.set(top[0], BLACK); stack.pop(); continue; }
    const dep = next.value;
    if (color.get(dep) === GRAY) {
      const path = stack.map(s => s[0]).slice(stack.findIndex(s => s[0] === dep));
      c.tick(`[cycle] circular import: ${[...path, dep].map(f => relative(ROOT, f)).join(' → ')}`);
      color.set(dep, BLACK); // don't report the same cycle repeatedly
    } else if (color.get(dep) === WHITE) {
      color.set(dep, GRAY);
      stack.push([dep, graph.get(dep).deps[Symbol.iterator]()]);
    }
  }
}

// ── A2: layer direction ──────────────────────────────────────────────────────

const ALLOWED = {
  lib: new Set(['lib']),          // + data/ (assets, not graph edges)
  client: new Set(['client', 'lib']), // lib only when browser-safe (checked below)
  ui: new Set(['ui', 'lib']),
  workers: new Set(['workers', 'lib']),
};

for (const [file, { deps, scriptDeps }] of graph) {
  const from = layerOf(file);
  const rel = relative(ROOT, file);
  for (const dep of deps) {
    const to = layerOf(dep);
    if (!ALLOWED[from].has(to)) {
      c.tick(`[layer] ${rel} (${from}) must not import ${relative(ROOT, dep)} (${to})`);
    }
  }
  // browser-side code: src/client modules and inline scripts may only pull
  // from src/client, or from browser-safe src/lib modules
  const browserFiles = from === 'client' ? deps : scriptDeps;
  for (const dep of browserFiles) {
    const to = layerOf(dep);
    if (to === 'client') continue;
    if (to === 'lib' && browserSafe.get(dep)) continue;
    c.tick(`[layer] browser code in ${rel} imports ${relative(ROOT, dep)} — not browser-safe; move shared pure logic into src/client or make the lib module isomorphic`);
  }
  // no src file may reach into scripts/ or workers/ (workers importing itself is fine)
  if (from !== 'workers' && /from\s*['"](\.\.\/)+(scripts|workers)\//.test(readFileSync(file, 'utf8'))) {
    c.tick(`[layer] ${rel} must not import from scripts/ or workers/`);
  }
}

// ── A3: canonical JSON responses ─────────────────────────────────────────────

const JSON_RESPONSE_RE = /new\s+Response\(\s*JSON\.stringify\(/;
for (const file of files) {
  if (file === join(SRC, 'lib', 'http.ts')) continue;
  if (JSON_RESPONSE_RE.test(readFileSync(file, 'utf8'))) {
    c.tick(`[http] ${relative(ROOT, file)} builds a JSON Response by hand — use jsonResponse() from src/lib/http.ts (ADR-0001)`);
  }
}

// ── Report ───────────────────────────────────────────────────────────────────

if (isMain(import.meta.url)) {
  for (const f of c.fail) console.error(`  ✗ ${f}`);
  const edges = [...graph.values()].reduce((n, g) => n + g.deps.length + g.scriptDeps.length, 0);
  console.log(`check-architecture: ${files.length} files, ${edges} import edges, ${c.fail.length} violation(s)`);
  process.exit(c.fail.length ? 1 : 0);
}

export { graph, browserSafe };
