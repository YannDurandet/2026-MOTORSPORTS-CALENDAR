/**
 * Share images (Open Graph / X cards), rendered at build time.
 *
 * satori lays out a small JSX-like tree and returns SVG with the text already
 * converted to paths (fonts embedded), so the result is identical on any build
 * machine; sharp rasterises it to PNG. Series colours are read from the same
 * CSS the site uses (.t-{slug} badge rules + tokens.css), so a card's badge
 * always matches the badge on the page.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import satori from 'satori';
import sharp from 'sharp';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(resolve(ROOT, p));

export const OG_W = 1200;
export const OG_H = 630;

const fonts = [
  { name: 'Inter', data: read('node_modules/@fontsource/inter/files/inter-latin-400-normal.woff'), weight: 400 as const, style: 'normal' as const },
  { name: 'Inter', data: read('node_modules/@fontsource/inter/files/inter-latin-700-normal.woff'), weight: 700 as const, style: 'normal' as const },
  { name: 'Inter', data: read('node_modules/@fontsource/inter/files/inter-latin-800-normal.woff'), weight: 800 as const, style: 'normal' as const },
  { name: 'Mono', data: read('node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff'), weight: 500 as const, style: 'normal' as const },
  { name: 'Mono', data: read('node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff'), weight: 700 as const, style: 'normal' as const },
];

const MARK = `data:image/png;base64,${read('src/assets/dord-mark.png').toString('base64')}`;

// ── Colours from the site CSS ────────────────────────────────────────────────
const tokensCss = read('src/styles/tokens.css').toString();
const globalCss = read('src/styles/global.css').toString();
const tokens: Record<string, string> = {};
for (const m of tokensCss.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) tokens[m[1]] ??= m[2].trim();

function resolveVars(v: string, depth = 0): string {
  if (depth > 8) return v;
  return v.replace(/var\((--[a-z0-9-]+)(?:\s*,\s*([^()]*(?:\([^()]*\))?[^()]*))?\)/g, (_, name, fb) =>
    resolveVars(tokens[name] ?? fb ?? 'transparent', depth + 1));
}

const C = {
  bg: resolveVars('var(--bg)'),
  panel: resolveVars('var(--row-bg)'),
  line: resolveVars('var(--row-line)'),
  heading: resolveVars('var(--text-heading)'),
  soft: resolveVars('var(--text-soft)'),
  muted: resolveVars('var(--text-muted)'),
  meta: resolveVars('var(--text-meta)'),
  date: resolveVars('var(--text-date)'),
  chip: resolveVars('var(--chip-bg)'),
};

export type Paint = { bg: string; fg: string; edge: string };

/** Badge background/text and accent edge for a series, as the site draws them. */
export function seriesPaint(slug: string): Paint {
  const rule = globalCss.match(new RegExp(`\\n\\.t-${slug}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
  const bg = resolveVars(rule.match(/background:\s*([^;]+);/)?.[1] ?? `var(--${slug})`);
  const fg = resolveVars(rule.match(/color:\s*([^;]+);/)?.[1] ?? 'var(--on-series)');
  const edgeRule = globalCss.match(new RegExp(`\\n\\.ev-${slug}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
  const edge = resolveVars(edgeRule.match(/--edge:\s*([^;]+);/)?.[1] ?? bg);
  return { bg, fg, edge };
}
const bgStyle = (paint: string) => paint.includes('gradient') ? { backgroundImage: paint } : { backgroundColor: paint };

// ── Track maps ───────────────────────────────────────────────────────────────
const trackSvgCache = new Map<string, string | null>();
export function trackMapDataUri(file?: string | null): string | null {
  if (!file || file === 'tbc.svg' || file === 'tbd.svg') return null;
  if (trackSvgCache.has(file)) return trackSvgCache.get(file)!;
  let uri: string | null = null;
  try {
    const raw = read(`public/assets/track-maps/${file}`).toString()
      .replace(/<defs>[\s\S]*?<\/defs>/g, '')
      .replace(/<rect[^>]*fill-opacity[^>]*\/?>/g, '')
      .replace(/(\s)width="\d+"/, '$1width="600"')
      .replace(/(\s)height="\d+"/, '$1height="600"');
    uri = `data:image/svg+xml;base64,${Buffer.from(raw).toString('base64')}`;
  } catch { /* missing file → no map */ }
  trackSvgCache.set(file, uri);
  return uri;
}

// ── Card ─────────────────────────────────────────────────────────────────────
type Node = { type: string; props: Record<string, any> };
// satori requires an explicit display on any box with several children.
const h = (type: string, style: Record<string, any>, ...children: any[]): Node =>
  ({ type, props: { style: { display: 'flex', ...style }, children: children.flat(2).filter(c => c !== null && c !== undefined && c !== false) } });
const img = (src: string, style: Record<string, any>): Node => ({ type: 'img', props: { src, style } });

export type Card = {
  /** Series badges shown above the title (first one sets the accent colour). */
  badges: { label: string; paint: Paint }[];
  title: string;
  /** Mono line under the title, e.g. "OCT 02–04 2026 · SEPANG, MALAYSIA". */
  meta?: string;
  /** Optional rows on the right when there is no map (next rounds). */
  list?: { left: string; right: string }[];
  /** Highlight chip at the bottom, e.g. "RACE 09:00 PARIS". */
  chip?: string;
  /** Muted footer text, e.g. "Session times · How to watch · Tickets". */
  footer?: string;
  map?: string | null;
};

function titleSize(t: string, hasSide: boolean): number {
  const n = t.length, k = hasSide ? 1 : 1.25;
  if (n <= 14 * k) return 84;
  if (n <= 22 * k) return 70;
  if (n <= 32 * k) return 58;
  return 48;
}

function tree(c: Card): Node {
  const accent = c.badges[0]?.paint.edge ?? C.meta;
  const side = c.map ? 'map' : c.list?.length ? 'list' : null;
  return h('div', { width: OG_W, height: OG_H, display: 'flex', backgroundColor: C.bg, padding: 40, fontFamily: 'Inter' },
    h('div', { position: 'relative', display: 'flex', flex: 1, backgroundColor: C.panel, border: `2px solid ${C.line}`, borderRadius: 32, padding: '44px 52px 44px 64px', overflow: 'hidden' },
      // inset accent bar, as on the site
      h('div', { position: 'absolute', left: 22, top: 44, bottom: 44, width: 8, borderRadius: 8, ...bgStyle(accent) }),
      // left column
      h('div', { display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', paddingRight: side ? 24 : 0 },
        h('div', { display: 'flex', flexDirection: 'column' },
          h('div', { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 34 },
            img(MARK, { width: 52, height: 52, borderRadius: 10 }),
            h('div', { fontFamily: 'Mono', fontWeight: 700, fontSize: 24, letterSpacing: 2, color: C.muted }, 'DORD.RACING')),
          c.badges.length ? h('div', { display: 'flex', gap: 10, marginBottom: 22, flexWrap: 'wrap' },
            c.badges.slice(0, 3).map(b => h('div', { display: 'flex', fontFamily: 'Mono', fontWeight: 700, fontSize: 26, letterSpacing: 1, padding: '6px 14px', borderRadius: 10, color: b.paint.fg, ...bgStyle(b.paint.bg) }, b.label))) : null,
          h('div', { display: 'flex', fontWeight: 800, fontSize: titleSize(c.title, !!side), lineHeight: 1.08, color: C.heading, letterSpacing: -1 }, c.title),
          c.meta ? h('div', { display: 'flex', marginTop: 22, fontFamily: 'Mono', fontWeight: 700, fontSize: 26, letterSpacing: 1, color: C.date }, c.meta) : null),
        h('div', { display: 'flex', flexDirection: 'column', gap: 14 },
          c.chip ? h('div', { display: 'flex' }, h('div', { display: 'flex', fontFamily: 'Mono', fontWeight: 700, fontSize: 28, color: '#fff', backgroundColor: C.chip, borderRadius: 12, padding: '8px 16px' }, c.chip)) : null,
          c.footer ? h('div', { display: 'flex', fontFamily: 'Mono', fontWeight: 500, fontSize: 22, color: C.meta }, c.footer) : null)),
      // right column
      side === 'map' ? h('div', { display: 'flex', width: 400, alignItems: 'center', justifyContent: 'center' }, img(c.map!, { width: 380, height: 380 })) : null,
      side === 'list' ? h('div', { display: 'flex', flexDirection: 'column', width: 460, justifyContent: 'center', gap: 4 },
        c.list!.slice(0, 5).map(r => h('div', { display: 'flex', justifyContent: 'space-between', gap: 16, padding: '12px 0', borderBottom: `2px solid ${C.line}` },
          h('div', { display: 'flex', fontFamily: 'Mono', fontWeight: 700, fontSize: 21, color: C.date, width: 200, flexShrink: 0, whiteSpace: 'nowrap' }, r.left),
          h('div', { display: 'flex', flex: 1, fontWeight: 700, fontSize: 24, color: C.soft, justifyContent: 'flex-end', textAlign: 'right' }, r.right)))) : null));
}

export async function renderCard(c: Card): Promise<Buffer> {
  const svg = await satori(tree(c) as any, { width: OG_W, height: OG_H, fonts });
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true, quality: 90 }).toBuffer();
}
