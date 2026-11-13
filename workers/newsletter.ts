// =============================================================================
// workers/newsletter.ts — Weekly "From The Pit Wall" newsletter
//
// Runs every Monday 08:00 UTC (10:00 Paris CEST) via Cloudflare cron.
// Can also be triggered manually via POST with X-Cron-Secret header.
//
// Required secrets (set via `wrangler secret put` or CF dashboard):
//   RESEND_API_KEY, RESEND_FROM_EMAIL, TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, CRON_SECRET,
//   UNSUB_SECRET (without it, unsubscribe links fall back to a mailto: link)
// =============================================================================

import { createClient } from '@libsql/client';
import { Resend } from 'resend';
import { monthYear, weekAnchor } from '../src/lib/season';
import { sendInBatches, type Outgoing } from './sendBatches';
// The same token code the site's /api/unsubscribe verifies with (wrangler bundles it).
import { computeUnsubToken, unsubUrl } from '../src/lib/unsub-token';

// =============================================================================
// ENVIRONMENT
// =============================================================================

interface Env {
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL: string;
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  CRON_SECRET: string;
  UNSUB_SECRET: string;        // HMAC key for per-recipient unsubscribe tokens
}

// =============================================================================
// TYPES
// =============================================================================

interface WeekendEvent {
  series: { slug: string; name: string; abbr: string; color: string; textColor: string };
  eventName:  string;
  circuit:    string;
  country:    string;
  weekNumber: number;
  /** The home-page card id for this week, e.g. "week-03" or "2027-week-03". */
  weekAnchor: string;
  weekLabel:  string;
  day:        'fri' | 'sat' | 'sun' | 'multi' | null;
  trackSvg:   string;
  timeStr:    string;
}

interface VenueGroup { trackSvg: string; events: WeekendEvent[] }

interface CalendarEvent {
  series: string; tag: string; title: string; time: string;
  track: string; date?: string; results?: unknown[]; sub?: unknown[];
}

interface TrackEntry {
  slug: string; name: string; city: string; country: string;
  calendarSvgs?: string[]; browserSvg?: string;
  layouts?: Array<{ id: string; label: string; calendarSvgs: string[] }>;
}

// =============================================================================
// SERIES METADATA
// =============================================================================

const SERIES_INFO: Record<string, { name: string; abbr: string; color: string; textColor: string }> = {
  f1:        { name: 'Formula 1',              abbr: 'F1',    color: '#ff1801', textColor: '#ffffff' },
  f1a:       { name: 'F1 Academy',             abbr: 'F1A',   color: '#C60678', textColor: '#ffffff' },
  fe:        { name: 'Formula E',              abbr: 'FE',    color: '#0033FF', textColor: '#ffffff' },
  sf:        { name: 'Super Formula',          abbr: 'SF',    color: '#00A67E', textColor: '#ffffff' },
  wec:       { name: 'FIA WEC',                abbr: 'WEC',   color: '#00B9FF', textColor: '#0b0f12' },
  imsa:      { name: 'IMSA WeatherTech',       abbr: 'IMSA',  color: '#FFD700', textColor: '#0b0f12' },
  wrc:       { name: 'WRC',                    abbr: 'WRC',   color: '#FC4C02', textColor: '#ffffff' },
  erc:       { name: 'ERC',                    abbr: 'ERC',   color: '#0088DD', textColor: '#ffffff' },
  indycar:   { name: 'IndyCar',                abbr: 'IND',   color: '#C8102E', textColor: '#ffffff' },
  nascar:    { name: 'NASCAR',                 abbr: 'NAS',   color: '#1A72E8', textColor: '#ffffff' },
  motogp:    { name: 'MotoGP',                 abbr: 'MGP',   color: '#E91E63', textColor: '#ffffff' },
  wsbk:      { name: 'World Superbike',        abbr: 'WSBK',  color: '#EE0000', textColor: '#ffffff' },
  dtm:       { name: 'DTM',                    abbr: 'DTM',   color: '#4CAF50', textColor: '#ffffff' },
  btcc:      { name: 'BTCC',                   abbr: 'BTCC',  color: '#3355EE', textColor: '#ffffff' },
  supercars: { name: 'Supercars',              abbr: 'SCC',   color: '#E8001A', textColor: '#ffffff' },
  elms:      { name: 'ELMS',                   abbr: 'ELMS',  color: '#FF6600', textColor: '#ffffff' },
  gtwce:     { name: 'GT World Challenge EU',  abbr: 'GTWCE', color: '#E52014', textColor: '#ffffff' },
  gtwca:     { name: 'GT World Challenge Am.', abbr: 'GTWCA', color: '#E52014', textColor: '#ffffff' },
  nls:       { name: 'NLS / VLN',              abbr: 'NLS',   color: '#00B85C', textColor: '#ffffff' },
  igtc:      { name: 'Intercontinental GT',    abbr: 'IGTC',  color: '#CC1A10', textColor: '#ffffff' },
  tcr:       { name: 'TCR Europe',             abbr: 'TCR',   color: '#E10B16', textColor: '#ffffff' },
  h24eu:     { name: '24H Series',             abbr: '24H',   color: '#1A7FE8', textColor: '#ffffff' },
  psc:       { name: 'Porsche Supercup',       abbr: 'PSC',   color: '#cf9d40', textColor: '#0b0f12' },
  bgt:       { name: 'British GT',             abbr: 'BGT',   color: '#C41E3A', textColor: '#ffffff' },
  eurx:      { name: 'Euro RX',                abbr: 'ERX',   color: '#02F3E9', textColor: '#0b0f12' },
  'asian-le-mans': { name: 'Asian Le Mans Series', abbr: 'ALMS', color: '#D12F44', textColor: '#ffffff' },
};

const SERIES_PRIORITY = [
  'f1','wec','motogp','indycar','imsa','nascar','wsbk',
  'fe','f1a','sf','dtm','btcc','supercars','wrc','erc',
  'gtwce','gtwca','igtc','elms','nls','asian-le-mans','tcr','h24eu','psc','bgt','eurx',
];

const MONTH_MAP: Record<string, number> = {
  JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,
  JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11,
};

// =============================================================================
// PART 1 — DATA
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

/** "WEEK 41 • OCT 08-11" → 41 */
function weekNumberOf(label: string): number | null {
  const m = label.match(/WEEK\s+(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

/** The id of the week's card on the home page: the label's digits as written
 *  ("03", not 3), through the one rule the site uses (weekAnchor in lib/season.ts). */
function weekAnchorOf(label: string, year: number): string {
  return weekAnchor(year, label.match(/WEEK\s+(\d+)/)?.[1] ?? '');
}

// An event belongs to the target weekend when its main race (ev.date, an exact
// ISO timestamp with offset) falls between Friday 00:00 and Monday 06:00.
// Selecting by week label instead dated every label in the current year, so
// 2027 rounds with the same week number leaked into 2026 newsletters.
const PARIS_DAY = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Paris', weekday: 'short', hour: 'numeric', hourCycle: 'h23',
});

function inWeekend(date: string | undefined, fri: Date, sun: Date): boolean {
  const ts = date ? Date.parse(date) : NaN;
  return !Number.isNaN(ts) && ts >= fri.getTime() && ts <= sun.getTime() + 6 * 3600_000;
}

/** Day bucket for one event: its race day in Paris; 'multi' for events that span the weekend. */
function eventDay(ev: { date?: string; time?: string }): 'fri' | 'sat' | 'sun' | 'multi' | null {
  if (/&rsaquo;|›|\s>\s/.test(ev.time ?? '')) return 'multi';   // "THU > SUN", "SAT 15:10 › SUN 03:10"
  if (!ev.date) return null;
  const parts = PARIS_DAY.formatToParts(new Date(ev.date));
  const wd   = parts.find(p => p.type === 'weekday')?.value ?? '';
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
  if (wd === 'Mon' && hour < 6) return 'sun';
  return wd === 'Fri' ? 'fri' : wd === 'Sat' ? 'sat' : wd === 'Sun' ? 'sun' : null;
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

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} answered HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

async function getUpcomingWeekendEvents(): Promise<WeekendEvent[]> {
  // Fetch data from the live site's API endpoints (replaces fs.readFileSync)
  const [calendar, tracks] = await Promise.all([
    getJson<Array<{ month: string; year?: number; weeks: Array<{ label: string; events: CalendarEvent[] }> }>>('https://dord.racing/data/calendar.json'),
    getJson<TrackEntry[]>('https://dord.racing/data/tracks.json'),
  ]);

  const svgToTrack = buildSvgTrackMap(tracks);
  const { fri, sun } = getTargetWeekend();
  const results: WeekendEvent[] = [];

  for (const month of calendar) {
    for (const week of month.weeks) {
      const weekNum = weekNumberOf(week.label);
      if (weekNum === null) continue;
      for (const ev of week.events) {
        if (!inWeekend(ev.date, fri, sun)) continue;
        const info = SERIES_INFO[ev.series] ?? {
          name: ev.tag, abbr: ev.tag.slice(0, 6), color: '#334455', textColor: '#ffffff',
        };
        const trackEntry = svgToTrack.get(ev.track);
        results.push({
          series:     { slug: ev.series, ...info },
          eventName:  ev.title,
          circuit:    trackEntry?.name    ?? ev.title,
          country:    trackEntry?.country ?? '',
          weekNumber: weekNum,
          weekAnchor: weekAnchorOf(week.label, monthYear(month)),
          weekLabel:  week.label,
          day:        eventDay(ev),
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

function generateSubject(events: WeekendEvent[], weekNumber: number): string {
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
  return result.filter(s => s.time && /\d{1,2}:\d{2}|TBC/.test(s.time));
}

function isCircuitSvg(fn: string): boolean {
  return !!fn && !fn.endsWith('-wrc.svg') && fn !== 'tbc.svg' && fn !== 'tbd.svg';
}

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

const FONT = 'font-family:system-ui,-apple-system,Arial,sans-serif;';

function badge(abbr: string, color: string, textColor: string): string {
  return `<span style="display:inline-block;background:${color};color:${textColor};${FONT}` +
    `font-size:9px;font-weight:800;letter-spacing:0.1em;padding:3px 7px;border-radius:2px;white-space:nowrap;">${abbr}</span>`;
}

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

function eventSubRow(ev: WeekendEvent, first: boolean, last: boolean): string {
  const ptop   = first ? '13px' : '10px';
  const pbot   = last  ? '13px' : '10px';
  const border = last  ? '' : 'border-bottom:1px solid #0e1820;';
  const times  = sessionTimesHTML(ev.timeStr);
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

function generateEmailHTML(events: WeekendEvent[], weekNumber: number, dateRange: string): string {
  const multi = events.filter(e => e.day === 'multi' || e.day === null);
  const fri   = events.filter(e => e.day === 'fri');
  const sat   = events.filter(e => e.day === 'sat');
  const sun   = events.filter(e => e.day === 'sun');

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
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#0b0f12;">
      <tr>
        <td style="padding:40px 32px 28px;border-bottom:1px solid #1e2830;">
          <p style="margin:0 0 6px;${FONT}font-size:10px;font-weight:700;color:#3a5060;letter-spacing:0.18em;">FROM THE PIT WALL</p>
          <p style="margin:0;${FONT}font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.01em;line-height:1.1;">Week ${weekNumber}</p>
          <p style="margin:6px 0 0;${FONT}font-size:12px;color:#4a5a6a;letter-spacing:0.04em;">&#9632; ${dateRange}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:18px 32px 0;background:#0b0f12;">
          <p style="margin:0;${FONT}font-size:13px;color:#566878;line-height:1.6;">${events.length} series on track this weekend.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:10px 32px 12px;background:#0b0f12;">
          <p style="margin:0;${FONT}font-size:9px;font-weight:700;color:#2a3a44;letter-spacing:0.12em;">ALL TIMES CET/CEST (PARIS)</p>
        </td>
      </tr>
      ${sections}
      ${resultsCTA()}
      <tr><td style="height:32px;background:#0b0f12;">&nbsp;</td></tr>
      <tr>
        <td style="padding:20px 32px;background:#070b0e;border-top:1px solid #1e2830;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td><a href="https://dord.racing" style="${FONT}font-size:12px;font-weight:600;color:#3a5060;text-decoration:none;">dord.racing</a></td>
              <td align="center"><a href="https://dord.racing/#${events[0]?.weekAnchor ?? ''}" style="${FONT}font-size:11px;color:#3a5060;text-decoration:none;">Open in the calendar →</a></td>
              <td align="right"><a href="mailto:weekly@dord.racing?subject=unsubscribe" style="${FONT}font-size:11px;color:#2a3a44;text-decoration:none;">Unsubscribe</a></td>
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
  </td></tr>
</table>
</body>
</html>`;
}

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
  lines.push(`Full calendar: https://dord.racing/#${events[0]?.weekAnchor ?? ''}`);
  lines.push('View results: https://dord.racing/results');
  lines.push('');
  lines.push('dord.racing');
  lines.push('To unsubscribe, reply with "unsubscribe" in the subject line.');
  return lines.join('\n');
}

// =============================================================================
// PART 3 — SEND
// =============================================================================

async function sendNewsletter(env: Env): Promise<void> {
  const events = await getUpcomingWeekendEvents();

  if (events.length === 0) {
    console.log('No events this weekend — skipping send.');
    return;
  }

  const { fri, sun } = getTargetWeekend();
  const weekNumber  = events[0].weekNumber;
  const dateRange   = formatDateRange(fri, sun);
  const subject     = generateSubject(events, weekNumber);
  const html        = generateEmailHTML(events, weekNumber, dateRange);
  const plainText   = generatePlainText(events, weekNumber, dateRange);

  // Fetch subscriber list from Turso
  const db = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN });
  const subsResult = await db.execute("SELECT email FROM subscribers WHERE status = 'active'");
  const emails = subsResult.rows.map((r: any) => r.email as string);

  if (emails.length === 0) {
    console.log('No active subscribers.');
    return;
  }

  // Sent log: one row per (issue, address), so a second run of the same issue
  // only fills the gaps. The worker creates the table itself (also documented
  // in db/schema.sql); if it can't, it sends without the log, as before.
  const issue = fri.toISOString().slice(0, 10);
  let logReady = true;
  try {
    await db.execute(`CREATE TABLE IF NOT EXISTS newsletter_sends (
      week    TEXT     NOT NULL,
      email   TEXT     NOT NULL,
      sent_at DATETIME NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (week, email)
    )`);
  } catch (err: any) {
    logReady = false;
    console.error(`Sent log unavailable (${err?.message ?? err}): sending without it`);
  }

  console.log(`Sending week ${weekNumber} newsletter (issue ${issue}) to ${emails.length} subscribers…`);

  const resend    = new Resend(env.RESEND_API_KEY);
  const fromEmail = env.RESEND_FROM_EMAIL || 'DORD Racing <weekly@dord.racing>';

  const build = async (to: string): Promise<Outgoing> => {
    // Per-recipient unsubscribe URL (HMAC token tied to email address)
    const token     = env.UNSUB_SECRET ? await computeUnsubToken(to, env.UNSUB_SECRET) : '';
    const unsubLink = token ? unsubUrl(to, token) : `mailto:weekly@dord.racing?subject=unsubscribe`;
    return {
      from:    fromEmail,
      to,
      subject,
      // Personalise footer links in both HTML and plain text
      html:    html.replace(`href="mailto:weekly@dord.racing?subject=unsubscribe"`, `href="${unsubLink}"`),
      text:    plainText.replace('To unsubscribe, reply with "unsubscribe" in the subject line.', `Unsubscribe: ${unsubLink}`),
      headers: token ? {
        'List-Unsubscribe':      `<mailto:weekly@dord.racing?subject=unsubscribe>, <${unsubLink}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      } : {},
    };
  };

  const summary = await sendInBatches(emails, build, {
    alreadySent: async () => {
      if (!logReady) return new Set<string>();
      const r = await db.execute({ sql: 'SELECT email FROM newsletter_sends WHERE week = ?', args: [issue] });
      return new Set(r.rows.map((x: any) => x.email as string));
    },
    sendBatch: async (batch, idempotencyKey) => {
      try {
        const { error } = await resend.batch.send(batch, { idempotencyKey });
        if (!error) return { ok: true };
        const code = error.statusCode;
        return { ok: false, retryable: code === null || code === 429 || code >= 500, error: `${error.name}: ${error.message}` };
      } catch (err: any) {
        return { ok: false, retryable: true, error: err?.message ?? String(err) };
      }
    },
    recordSent: async (sent) => {
      if (!logReady) return;
      await db.batch(sent.map(email => ({
        sql:  'INSERT OR IGNORE INTO newsletter_sends (week, email) VALUES (?, ?)',
        args: [issue, email],
      })), 'write');
    },
    sleep: ms => new Promise(resolve => setTimeout(resolve, ms)),
    log:   msg => console.error(msg),
  }, { issue });

  console.log(`Done. Sent: ${summary.sent}${summary.skipped ? ` / Already sent earlier: ${summary.skipped}` : ''}${summary.failed ? ` / Failed: ${summary.failed}` : ''}`);
  if (summary.failed) throw new Error(`${summary.failed} message(s) were not sent; run the send again to retry them`);
}

// =============================================================================
// WORKER EXPORT
// =============================================================================

export default {
  // HTTP handler — manual trigger in dev / testing
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
    if (request.headers.get('X-Cron-Secret') !== env.CRON_SECRET) {
      return new Response('Unauthorized', { status: 401 });
    }
    try {
      await sendNewsletter(env);
      return new Response('Newsletter sent', { status: 200 });
    } catch (err: any) {
      console.error('Newsletter send failed:', err);
      return new Response(`Error: ${err?.message ?? err}`, { status: 500 });
    }
  },

  // Cron handler — fires every Monday 08:00 UTC
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(sendNewsletter(env).catch(err => console.error('Newsletter send failed:', err?.message ?? err)));
  },
};
