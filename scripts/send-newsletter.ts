#!/usr/bin/env node
// =============================================================================
// scripts/send-newsletter.ts — Weekly "From The Pit Wall" newsletter sender
//
// Run:
//   npx tsx scripts/send-newsletter.ts
//
// Requires .env (or environment variables) with:
//   TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, RESEND_API_KEY, RESEND_FROM_EMAIL
// =============================================================================

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';
import { createClient } from '@libsql/client';
import { Resend } from 'resend';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── Load .env for local dev (only sets vars not already in environment) ──────
(function loadEnv() {
  const envPath = resolve(ROOT, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    if (process.env[key]) continue;
    process.env[key] = m[2].trim().replace(/^["']|["']$/g, '');
  }
})();

// =============================================================================
// TYPES
// =============================================================================

interface WeekendEvent {
  series: {
    slug: string;
    name: string;
    abbr: string;
    color: string;
    textColor: string;
  };
  eventName: string;
  circuit: string;
  country: string;
  weekNumber: number;
  weekLabel: string;
  day: 'fri' | 'sat' | 'sun' | 'multi' | null;
  trackSvg: string;   // e.g. "silverstone.svg"
  timeStr: string;    // raw HTML time string from calendar.json
}

interface VenueGroup {
  trackSvg: string;
  events: WeekendEvent[];
}

interface CalendarEvent {
  series: string;
  tag: string;
  title: string;
  time: string;
  track: string;
  results?: unknown[];
  sub?: unknown[];
}

interface TrackEntry {
  slug: string;
  name: string;
  city: string;
  country: string;
  calendarSvgs?: string[];
  browserSvg?: string;
  layouts?: Array<{ id: string; label: string; calendarSvgs: string[] }>;
}

interface SeriesRace {
  name: string;
  date: string;
  _ts?: number;
}

// =============================================================================
// SERIES METADATA
// =============================================================================

const SERIES_INFO: Record<string, { name: string; abbr: string; color: string; textColor: string }> = {
  f1:        { name: 'Formula 1',              abbr: 'F1',     color: '#ff1801', textColor: '#ffffff' },
  f1a:       { name: 'F1 Academy',             abbr: 'F1A',    color: '#C60678', textColor: '#ffffff' },
  fe:        { name: 'Formula E',              abbr: 'FE',     color: '#0033FF', textColor: '#ffffff' },
  sf:        { name: 'Super Formula',          abbr: 'SF',     color: '#00A67E', textColor: '#ffffff' },
  wec:       { name: 'FIA WEC',                abbr: 'WEC',    color: '#00B9FF', textColor: '#0b0f12' },
  imsa:      { name: 'IMSA WeatherTech',       abbr: 'IMSA',   color: '#FFD700', textColor: '#0b0f12' },
  wrc:       { name: 'WRC',                    abbr: 'WRC',    color: '#FC4C02', textColor: '#ffffff' },
  erc:       { name: 'ERC',                    abbr: 'ERC',    color: '#0088DD', textColor: '#ffffff' },
  indycar:   { name: 'IndyCar',                abbr: 'IND',    color: '#C8102E', textColor: '#ffffff' },
  nascar:    { name: 'NASCAR',                 abbr: 'NAS',    color: '#1A72E8', textColor: '#ffffff' },
  motogp:    { name: 'MotoGP',                 abbr: 'MGP',    color: '#E91E63', textColor: '#ffffff' },
  wsbk:      { name: 'World Superbike',        abbr: 'WSBK',   color: '#EE0000', textColor: '#ffffff' },
  dtm:       { name: 'DTM',                    abbr: 'DTM',    color: '#4CAF50', textColor: '#ffffff' },
  btcc:      { name: 'BTCC',                   abbr: 'BTCC',   color: '#3355EE', textColor: '#ffffff' },
  supercars: { name: 'Supercars',              abbr: 'SCC',    color: '#E8001A', textColor: '#ffffff' },
  elms:      { name: 'ELMS',                   abbr: 'ELMS',   color: '#FF6600', textColor: '#ffffff' },
  gtwce:     { name: 'GT World Challenge EU',  abbr: 'GTWCE',  color: '#E52014', textColor: '#ffffff' },
  gtwca:     { name: 'GT World Challenge Am.', abbr: 'GTWCA',  color: '#E52014', textColor: '#ffffff' },
  nls:       { name: 'NLS / VLN',              abbr: 'NLS',    color: '#00B85C', textColor: '#ffffff' },
  igtc:      { name: 'Intercontinental GT',    abbr: 'IGTC',   color: '#CC1A10', textColor: '#ffffff' },
  tcr:       { name: 'TCR Europe',             abbr: 'TCR',    color: '#E10B16', textColor: '#ffffff' },
  h24eu:     { name: '24H Series',             abbr: '24H',    color: '#1A7FE8', textColor: '#ffffff' },
  psc:       { name: 'Porsche Supercup',       abbr: 'PSC',    color: '#cf9d40', textColor: '#0b0f12' },
  bgt:       { name: 'British GT',             abbr: 'BGT',    color: '#C41E3A', textColor: '#ffffff' },
  eurx:      { name: 'Euro RX',                abbr: 'ERX',    color: '#02F3E9', textColor: '#0b0f12' },
};

const SERIES_PRIORITY = [
  'f1','wec','motogp','indycar','imsa','nascar','wsbk',
  'fe','f1a','sf','dtm','btcc','supercars','wrc','erc',
  'gtwce','gtwca','igtc','elms','nls','tcr','h24eu','psc','bgt','eurx',
];

const MONTH_MAP: Record<string, number> = {
  JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,
  JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11,
};

// =============================================================================
// PART 1 — DATA: getUpcomingWeekendEvents()
// =============================================================================

function getTargetWeekend(): { fri: Date; sun: Date } {
  const now = new Date();
  const dow = now.getDay();
  let daysToFri: number;
  if (dow === 0)      daysToFri = -2;
  else if (dow === 6) daysToFri = -1;
  else if (dow === 5) daysToFri = 0;
  else                daysToFri = 5 - dow;
  const fri = new Date(now);
  fri.setDate(now.getDate() + daysToFri);
  fri.setHours(0, 0, 0, 0);
  const sun = new Date(fri);
  sun.setDate(fri.getDate() + 2);
  sun.setHours(23, 59, 59, 999);
  return { fri, sun };
}

function parseWeekLabel(label: string): { weekNum: number; start: Date; end: Date } | null {
  const m = label.match(
    /WEEK\s+(\d+)\s*[•·]\s*([A-Z]{3})\s+(\d{1,2})(?:\s*[-–]\s*(?:([A-Z]{3})\s+)?(\d{1,2}))?/
  );
  if (!m) return null;
  const weekNum    = parseInt(m[1], 10);
  const startMonth = MONTH_MAP[m[2]];
  const startDay   = parseInt(m[3], 10);
  const endMonth   = m[4] ? MONTH_MAP[m[4]] : startMonth;
  const endDay     = m[5] ? parseInt(m[5], 10) : startDay;
  const currentYear = new Date().getFullYear();
  const now = new Date();
  const startYear = now.getMonth() >= 10 && startMonth <= 1 ? currentYear + 1 : currentYear;
  const endYear   = now.getMonth() >= 10 && endMonth   <= 1 ? currentYear + 1 : currentYear;
  return {
    weekNum,
    start: new Date(startYear, startMonth, startDay, 0, 0, 0, 0),
    end:   new Date(endYear,   endMonth,   endDay,   23, 59, 59, 999),
  };
}

function buildSvgTrackMap(tracks: TrackEntry[]): Map<string, TrackEntry> {
  const map = new Map<string, TrackEntry>();
  for (const t of tracks) {
    const svgs = [
      ...(t.calendarSvgs ?? []),
      ...(t.layouts?.flatMap(l => l.calendarSvgs) ?? []),
    ];
    if (t.browserSvg) svgs.push(t.browserSvg);
    for (const svg of svgs) map.set(svg, t);
  }
  return map;
}

function inferEventDay(
  seriesSlug: string,
  fri: Date,
  sun: Date,
  seriesJson: Record<string, SeriesRace[]>
): 'fri' | 'sat' | 'sun' | 'multi' | null {
  const races = seriesJson[seriesSlug];
  if (!races) return null;
  const windowEnd = new Date(sun.getTime() + 6 * 3600_000);
  const inWindow = races.filter(r => {
    const ts = new Date(r.date).getTime();
    return ts >= fri.getTime() && ts <= windowEnd.getTime();
  });
  if (inWindow.length === 0) return null;
  const dayLabels = new Set<string>();
  for (const r of inWindow) {
    const cestMs   = new Date(r.date).getTime() + 2 * 3600_000;
    const cestDate = new Date(cestMs);
    const dow      = cestDate.getUTCDay();
    const hour     = cestDate.getUTCHours();
    if (dow === 1 && hour < 6) { dayLabels.add('sun'); continue; }
    if (dow === 5) { dayLabels.add('fri'); continue; }
    if (dow === 6) { dayLabels.add('sat'); continue; }
    if (dow === 0) { dayLabels.add('sun'); continue; }
    dayLabels.add('other');
  }
  if (dayLabels.size > 1) return 'multi';
  const only = [...dayLabels][0];
  if (only === 'fri' || only === 'sat' || only === 'sun') return only;
  return null;
}

export function getUpcomingWeekendEvents(): WeekendEvent[] {
  const calendar: Array<{ month: string; weeks: Array<{ label: string; events: CalendarEvent[] }> }> =
    JSON.parse(readFileSync(resolve(ROOT, 'data/calendar.json'), 'utf-8'));
  const tracks: TrackEntry[]  = JSON.parse(readFileSync(resolve(ROOT, 'data/tracks.json'),   'utf-8'));
  const seriesJson: Record<string, SeriesRace[]> = JSON.parse(readFileSync(resolve(ROOT, 'data/series.json'), 'utf-8'));

  const svgToTrack = buildSvgTrackMap(tracks);
  const { fri, sun } = getTargetWeekend();
  const results: WeekendEvent[] = [];

  for (const month of calendar) {
    for (const week of month.weeks) {
      const parsed = parseWeekLabel(week.label);
      if (!parsed) continue;
      if (parsed.end < fri || parsed.start > sun) continue;

      for (const ev of week.events) {
        const info = SERIES_INFO[ev.series] ?? {
          name: ev.tag, abbr: ev.tag.slice(0, 6), color: '#334455', textColor: '#ffffff',
        };
        const trackEntry = svgToTrack.get(ev.track);
        results.push({
          series:     { slug: ev.series, ...info },
          eventName:  ev.title,
          circuit:    trackEntry?.name  ?? ev.title,
          country:    trackEntry?.country ?? '',
          weekNumber: parsed.weekNum,
          weekLabel:  week.label,
          day:        inferEventDay(ev.series, fri, sun, seriesJson),
          trackSvg:   ev.track  ?? '',
          timeStr:    ev.time   ?? '',
        });
      }
    }
  }
  return results;
}

// =============================================================================
// PART 2 — TEMPLATE
// =============================================================================

// ── Subject line ─────────────────────────────────────────────────────────────
export function generateSubject(events: WeekendEvent[], weekNumber: number): string {
  for (const slug of SERIES_PRIORITY) {
    const match = events.find(e => e.series.slug === slug);
    if (match) return `From The Pit Wall — Week ${weekNumber}: ${match.eventName}`;
  }
  return `From The Pit Wall — Week ${weekNumber}: This Weekend's Racing`;
}

function formatDateRange(fri: Date, sun: Date): string {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const friStr = `${months[fri.getMonth()]} ${fri.getDate()}`;
  const sunStr = fri.getMonth() === sun.getMonth()
    ? `${sun.getDate()}`
    : `${months[sun.getMonth()]} ${sun.getDate()}`;
  return `${friStr}–${sunStr}, ${fri.getFullYear()}`;
}

// ── Session time parser ───────────────────────────────────────────────────────
// Input: 'SPRINT: <span class="hl">13:00</span> • QUALI: <span class="hl">16:00</span>'
// Output: [{label:'SPRINT',time:'13:00'},{label:'QUALI',time:'16:00'}]
function parseSessionTimes(html: string): Array<{ label: string; time: string }> {
  if (!html) return [];
  const plain = html.replace(/<[^>]+>/g, '').trim();
  const parts  = plain.split(/\s*[•·]\s*/);
  const result: Array<{ label: string; time: string }> = [];
  for (const part of parts) {
    const colon = part.indexOf(':');
    if (colon > 0) {
      result.push({ label: part.slice(0, colon).trim(), time: part.slice(colon + 1).trim() });
    }
  }
  // Only return sessions that have a real time value
  return result.filter(s => s.time && /\d{1,2}:\d{2}|TBC/.test(s.time));
}

// ── Is this SVG a circuit outline (not a WRC national-flag SVG)? ─────────────
function isCircuitSvg(fn: string): boolean {
  return !!fn
    && !fn.endsWith('-wrc.svg')
    && fn !== 'tbc.svg'
    && fn !== 'tbd.svg';
}

// ── Group events that share the same track SVG ────────────────────────────────
function groupByVenue(events: WeekendEvent[]): VenueGroup[] {
  const map = new Map<string, WeekendEvent[]>();
  const order: string[] = [];
  for (const ev of events) {
    const key = ev.trackSvg || `__${ev.circuit}`;
    if (!map.has(key)) { order.push(key); map.set(key, []); }
    map.get(key)!.push(ev);
  }
  return order.map(k => ({ trackSvg: map.get(k)![0].trackSvg, events: map.get(k)! }));
}

// ── Inline style constants ────────────────────────────────────────────────────
const FONT = 'font-family:system-ui,-apple-system,Arial,sans-serif;';

// ── Series badge pill ─────────────────────────────────────────────────────────
function badge(abbr: string, color: string, textColor: string): string {
  return `<span style="display:inline-block;background:${color};color:${textColor};${FONT}` +
    `font-size:9px;font-weight:800;letter-spacing:0.1em;padding:3px 7px;border-radius:2px;white-space:nowrap;">${abbr}</span>`;
}

// ── Session times row ─────────────────────────────────────────────────────────
function sessionTimesHTML(timeStr: string): string {
  const sessions = parseSessionTimes(timeStr);
  if (sessions.length === 0) return '';
  const parts = sessions.map(s =>
    `<span style="${FONT}font-size:9px;font-weight:700;color:#4a7090;letter-spacing:0.07em;">${s.label}</span>` +
    `&#8202;<span style="${FONT}font-size:10px;color:#7a9aaa;">${s.time}</span>`
  );
  return `<p style="margin:4px 0 0;line-height:1.5;">${
    parts.join(`<span style="color:#253540;padding:0 5px;">·</span>`)
  }</p>`;
}

// ── One event sub-row inside a venue group ────────────────────────────────────
function eventSubRow(ev: WeekendEvent, first: boolean, last: boolean): string {
  const ptop   = first ? '13px' : '10px';
  const pbot   = last  ? '13px' : '10px';
  const border = last  ? '' : 'border-bottom:1px solid #0e1820;';
  const times  = sessionTimesHTML(ev.timeStr);
  // Show circuit/country line only when event name differs from circuit
  const sub = ev.circuit !== ev.eventName
    ? `<p style="margin:2px 0 0;${FONT}font-size:11px;color:#566878;">${ev.circuit}${ev.country ? ' · ' + ev.country : ''}</p>`
    : '';
  return `
        <tr>
          <td style="padding:${ptop} 24px ${pbot} 0;${border}vertical-align:top;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:top;padding-right:9px;padding-top:1px;white-space:nowrap;">
                  ${badge(ev.series.abbr, ev.series.color, ev.series.textColor)}
                </td>
                <td style="vertical-align:top;">
                  <p style="margin:0;${FONT}font-size:13px;font-weight:700;color:#c3c6c8;line-height:1.25;">${ev.eventName}</p>
                  ${sub}
                  ${times}
                </td>
              </tr>
            </table>
          </td>
        </tr>`;
}

// ── One venue group (track icon + stacked event sub-rows) ─────────────────────
function venueGroupHTML(group: VenueGroup, borderBottom: boolean): string {
  const base       = group.trackSvg.replace('.svg', '');
  const showIcon   = isCircuitSvg(group.trackSvg);
  const imgUrl     = `https://dord.racing/assets/tracks/email/${base}.png`;
  const altText    = group.events[0]?.circuit ?? base;
  const iconMarkup = showIcon
    ? `<img src="${imgUrl}" width="72" height="72" alt="${altText}" border="0" style="display:block;margin:0 auto;opacity:0.82;">`
    : `<div style="width:72px;height:1px;"></div>`;

  const subRows = group.events
    .map((ev, i) => eventSubRow(ev, i === 0, i === group.events.length - 1))
    .join('');

  const bdr = borderBottom ? 'border-bottom:1px solid #131a21;' : '';

  return `
    <tr>
      <td style="padding:0;${bdr}background:#0b0f12;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="width:96px;vertical-align:middle;padding:10px 8px;text-align:center;">
              ${iconMarkup}
            </td>
            <td style="vertical-align:top;padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${subRows}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

// ── Day section (header + venue groups) ───────────────────────────────────────
function daySection(dayLabel: string, events: WeekendEvent[], firstSection: boolean): string {
  if (events.length === 0) return '';
  const groups    = groupByVenue(events);
  const separator = firstSection ? '' : `<tr><td style="height:1px;background:#1e2830;font-size:0;line-height:0;">&nbsp;</td></tr>`;
  const groupRows = groups
    .map((g, i) => venueGroupHTML(g, i < groups.length - 1))
    .join('');

  return `
    ${separator}
    <tr>
      <td style="padding:14px 24px 5px;background:#0b0f12;">
        <p style="margin:0;${FONT}font-size:9px;font-weight:700;color:#3a5060;letter-spacing:0.18em;">${dayLabel}</p>
      </td>
    </tr>
    ${groupRows}`;
}

// ── Results CTA ───────────────────────────────────────────────────────────────
function resultsCTA(): string {
  return `
    <tr>
      <td style="padding:24px 32px 8px;background:#0b0f12;text-align:center;">
        <a href="https://dord.racing/results"
           style="display:inline-block;padding:11px 28px;border:1px solid #3a5060;color:#8899aa;${FONT}font-size:10px;font-weight:700;letter-spacing:0.12em;text-decoration:none;text-transform:uppercase;">
          VIEW LAST WEEKEND&#8217;S RESULTS &#8594;
        </a>
      </td>
    </tr>`;
}

// ── Main HTML template ────────────────────────────────────────────────────────
export function generateEmailHTML(
  events: WeekendEvent[],
  weekNumber: number,
  dateRange: string
): string {
  // Bucket into day groups (ALL WEEKEND first, then FRI→SAT→SUN)
  const multi = events.filter(e => e.day === 'multi' || e.day === null);
  const fri   = events.filter(e => e.day === 'fri');
  const sat   = events.filter(e => e.day === 'sat');
  const sun   = events.filter(e => e.day === 'sun');

  // Build day sections
  let firstRendered = true;
  function ds(label: string, evs: WeekendEvent[]) {
    if (evs.length === 0) return '';
    const html = daySection(label, evs, firstRendered);
    firstRendered = false;
    return html;
  }

  const sections =
    ds('ALL WEEKEND', multi) +
    ds('FRIDAY',      fri)   +
    ds('SATURDAY',    sat)   +
    ds('SUNDAY',      sun);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>From The Pit Wall — Week ${weekNumber}</title>
</head>
<body style="margin:0;padding:0;background:#0b0f12;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0b0f12;">
  <tr>
    <td align="center">

      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#0b0f12;">

        <!-- ── HEADER ─────────────────────────────────────────────── -->
        <tr>
          <td style="padding:40px 32px 28px;border-bottom:1px solid #1e2830;">
            <p style="margin:0 0 6px;${FONT}font-size:10px;font-weight:700;color:#3a5060;letter-spacing:0.18em;">FROM THE PIT WALL</p>
            <p style="margin:0;${FONT}font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.01em;line-height:1.1;">Week ${weekNumber}</p>
            <p style="margin:6px 0 0;${FONT}font-size:12px;color:#4a5a6a;letter-spacing:0.04em;">&#9632; ${dateRange}</p>
          </td>
        </tr>

        <!-- ── INTRO ──────────────────────────────────────────────── -->
        <tr>
          <td style="padding:18px 32px 0;background:#0b0f12;">
            <p style="margin:0;${FONT}font-size:13px;color:#566878;line-height:1.6;">
              ${events.length} series on track this weekend.
            </p>
          </td>
        </tr>

        <!-- ── TIMEZONE NOTE ──────────────────────────────────────── -->
        <tr>
          <td style="padding:10px 32px 12px;background:#0b0f12;">
            <p style="margin:0;${FONT}font-size:9px;font-weight:700;color:#2a3a44;letter-spacing:0.12em;">ALL TIMES CET/CEST (PARIS)</p>
          </td>
        </tr>

        <!-- ── EVENT SECTIONS ─────────────────────────────────────── -->
        ${sections}

        <!-- ── RESULTS CTA ────────────────────────────────────────── -->
        ${resultsCTA()}

        <!-- ── SPACER ─────────────────────────────────────────────── -->
        <tr><td style="height:32px;background:#0b0f12;">&nbsp;</td></tr>

        <!-- ── FOOTER ─────────────────────────────────────────────── -->
        <tr>
          <td style="padding:20px 32px;background:#070b0e;border-top:1px solid #1e2830;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <a href="https://dord.racing" style="${FONT}font-size:12px;font-weight:600;color:#3a5060;text-decoration:none;">dord.racing</a>
                </td>
                <td align="right">
                  <a href="mailto:weekly@dord.racing?subject=unsubscribe" style="${FONT}font-size:11px;color:#2a3a44;text-decoration:none;">Unsubscribe</a>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top:8px;">
                  <p style="margin:0;${FONT}font-size:11px;color:#1e2830;">&copy; The Department of Racing Drivers &middot; dord.racing</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>`;
}

// ── Plain-text fallback ───────────────────────────────────────────────────────
function generatePlainText(events: WeekendEvent[], weekNumber: number, dateRange: string): string {
  const lines = [
    'FROM THE PIT WALL',
    `Week ${weekNumber} · ${dateRange}`,
    'All times CET/CEST (Paris)',
    '',
    '────────────────────────────────────',
    '',
  ];
  for (const e of events) {
    const day = e.day === 'fri' ? 'FRI' : e.day === 'sat' ? 'SAT' : e.day === 'sun' ? 'SUN' : '   ';
    const sessions = parseSessionTimes(e.timeStr).map(s => `${s.label} ${s.time}`).join(' · ');
    lines.push(
      `${day}  [${e.series.abbr.padEnd(5)}]  ${e.eventName}` +
      (sessions ? `  —  ${sessions}` : '')
    );
  }
  lines.push('', '────────────────────────────────────', '');
  lines.push('View results: https://dord.racing/results');
  lines.push('');
  lines.push('dord.racing');
  lines.push('To unsubscribe, reply with "unsubscribe" in the subject line.');
  return lines.join('\n');
}

// =============================================================================
// PART 3 — SEND SCRIPT
// =============================================================================

async function confirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => { rl.close(); resolve(answer.trim().toLowerCase() === 'y'); });
  });
}

async function main() {
  const dbUrl     = process.env.TURSO_DATABASE_URL;
  const dbToken   = process.env.TURSO_AUTH_TOKEN;
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'DORD Racing <weekly@dord.racing>';

  if (!dbUrl || !dbToken) { console.error('✗  Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN'); process.exit(1); }
  if (!resendKey)          { console.error('✗  Missing RESEND_API_KEY'); process.exit(1); }

  console.log('\nFetching weekend events…');
  const events = getUpcomingWeekendEvents();

  if (events.length === 0) { console.log('No events this weekend.'); process.exit(0); }

  const { fri, sun } = getTargetWeekend();
  const weekNumber   = events[0].weekNumber;
  const dateRange    = formatDateRange(fri, sun);
  const subject      = generateSubject(events, weekNumber);
  const html         = generateEmailHTML(events, weekNumber, dateRange);
  const plainText    = generatePlainText(events, weekNumber, dateRange);

  const db = createClient({ url: dbUrl, authToken: dbToken });
  const countResult = await db.execute("SELECT COUNT(*) AS n FROM subscribers WHERE status = 'active'");
  const subscriberCount = Number((countResult.rows[0] as any).n ?? 0);

  console.log('\n─────────────────────────────────────────────────');
  console.log(`  WEEK ${weekNumber} · ${dateRange}`);
  console.log(`  Subject: ${subject}`);
  console.log('─────────────────────────────────────────────────');
  for (const e of events) {
    const dayLabel = e.day === 'fri' ? 'FRI' : e.day === 'sat' ? 'SAT' : e.day === 'sun' ? 'SUN' : '   ';
    const sessions = parseSessionTimes(e.timeStr).map(s => `${s.label} ${s.time}`).join(' · ');
    console.log(`  ${dayLabel}  [${e.series.abbr.padEnd(6)}]  ${e.eventName}${sessions ? '  ' + sessions : ''}`);
  }
  console.log('─────────────────────────────────────────────────');
  console.log(`  Recipients: ${subscriberCount} active subscriber${subscriberCount !== 1 ? 's' : ''}`);
  console.log('─────────────────────────────────────────────────\n');

  if (subscriberCount === 0) { console.log('No active subscribers.'); process.exit(0); }

  const ok = await confirm(`Send to ${subscriberCount} subscriber${subscriberCount !== 1 ? 's' : ''}? (y/n) `);
  if (!ok) { console.log('Aborted.'); process.exit(0); }

  const subsResult = await db.execute("SELECT email FROM subscribers WHERE status = 'active'");
  const emails = subsResult.rows.map((r: any) => r.email as string);

  const resend = new Resend(resendKey);
  console.log(`\nSending to ${emails.length} addresses…`);

  const BATCH = 10;
  let sent = 0, failed = 0;

  for (let i = 0; i < emails.length; i += BATCH) {
    const batch = emails.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map(to => resend.emails.send({ from: fromEmail, to, subject, html, text: plainText }))
    );
    for (const [idx, result] of results.entries()) {
      if (result.status === 'fulfilled' && !result.value.error) { sent++; }
      else {
        failed++;
        const err = result.status === 'rejected' ? result.reason : result.value.error;
        console.error(`  ✗ Failed for ${batch[idx]}: ${err?.message ?? err}`);
      }
    }
    process.stdout.write(`  ${sent + failed}/${emails.length} processed\r`);
    if (i + BATCH < emails.length) await new Promise(r => setTimeout(r, 250));
  }

  console.log(`\n\n  ✓ Sent:   ${sent}`);
  if (failed > 0) console.log(`  ✗ Failed: ${failed}`);
  console.log('');
}

main().catch(err => { console.error('Fatal error:', err); process.exit(1); });
