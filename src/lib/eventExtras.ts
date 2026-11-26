/**
 * Content blocks for event pages (/events/{year}/{slug}) that are built from
 * more than the calendar row itself:
 *
 *   - eventFaqs()    the per-event FAQ accordion. The SAME list feeds the
 *                    visible accordion and the FAQPage JSON-LD (Google requires
 *                    the two to match), so answers must be plain text with no
 *                    links and must not promise anything that can go stale in
 *                    search results — no "who leads", no live standings. Those
 *                    live in the stakes block, which is visible-only.
 *   - raceFormatFor()  the "Race format" block, from data/seriesRules.json
 *                    (distance rule, points tables, championship categories).
 *   - stakesFor()    the "Championship stakes" snapshot, from
 *                    data/standings.json. That file holds the CURRENT season's
 *                    tables only, so stakes are returned solely for an event
 *                    of the current season (DEFAULT_CALENDAR_YEAR).
 */
import seriesRulesData from '../../data/seriesRules.json';
import standingsData from '../../data/standings.json';
import { DEFAULT_CALENDAR_YEAR } from './season';
import type { Faq } from './faq';
import type { Session } from './sessions';

// ── FAQ ─────────────────────────────────────────────────────────────────────

export interface EventFaqContext {
  title: string;
  year: number;
  seriesName: string;
  /** "Sunday 25 May 2026" */
  dateLong: string;
  /** Pre-formatted race-start sentence, when the start time is known. */
  startLine?: string;
  timesTbc?: boolean;
  /** "Circuit de Monaco in Monte Carlo, Monaco" / "Rallye Monte-Carlo, based in Monaco, MC"-style line. */
  whereLine: string;
  circuitName?: string | null;
  isRally: boolean;
  sessions: Session[];
  legs?: { label: string; time: string }[];
  hasSprint: boolean;
  hasTickets: boolean;
  /** Host of the circuit's official website, e.g. "www.grandprix.com.au". */
  circuitHost?: string;
}

export function eventFaqs(c: EventFaqContext): Faq[] {
  const faqs: Faq[] = [];
  const name = `${c.title} ${c.year}`;

  const when = c.startLine
    ? `${name} takes place on ${c.dateLong}. ${c.startLine}`
    : c.timesTbc
      ? `${name} takes place on ${c.dateLong}; session times have not been published yet and appear on this page as soon as ${c.seriesName} confirms them.`
      : `${name} takes place on ${c.dateLong}.`;
  faqs.push({ question: `When is the ${name}?`, answer: when });

  faqs.push({
    question: `Where is the ${name} held?`,
    answer: c.isRally
      ? `${name} is ${c.whereLine}.`
      : `${name} is held ${c.whereLine}.` +
        (c.circuitName ? ' The circuit page has the track map, records and travel guide.' : ''),
  });

  const sessionBits = c.sessions
    .map(s => (s.time ? `${s.label} at ${s.time}` : s.label))
    .join('; ');
  const formatAnswer = c.timesTbc
    ? `Session times are not published yet; the weekend follows the usual ${c.seriesName} format and the full timetable appears here once confirmed.`
    : c.legs?.length
      ? `${c.seriesName} rally weekends run across several days; this round's stages are listed in the session times above.`
      : `The weekend schedule (Paris time): ${sessionBits}.`;
  faqs.push({
    question: `What is the weekend format for the ${name}?`,
    answer: c.hasSprint
      ? `${formatAnswer} It is a Sprint weekend: a short Sprint race on the Saturday alongside qualifying.`
      : formatAnswer,
  });

  faqs.push({
    question: `How can I watch the ${name}?`,
    answer: `Broadcasters by country are listed in the How to watch section of this page, and the ${c.seriesName} page carries the full list plus the season calendar and standings.`,
  });

  faqs.push({
    question: `How do I get tickets for the ${name}?`,
    answer: c.hasTickets
      ? `Ticket links are in the Tickets card on this page.`
      : c.circuitHost
        ? `Tickets are sold through the circuit's official website (${c.circuitHost}); the circuit page links to it.`
        : `Check the official ${c.seriesName} website for tickets and hospitality.`,
  });

  return faqs;
}

// ── Race format ─────────────────────────────────────────────────────────────

export interface PointsRow {
  key: string;
  label: string;
  values: number[];
}

export interface RaceFormat {
  seriesName: string;
  officialSite?: string;
  distanceRule?: string;
  pointsRows: PointsRow[];
  note?: string;
  categories: string[];
}

const POINT_ROW_LABELS: Record<string, string> = {
  race: 'Race points',
  sprint: 'Sprint points',
  fastest_lap: 'Fastest lap',
  pole: 'Pole position',
};

/** "6h_or_less" → "6 h or less"; "24h_le_mans" → "24 h Le Mans". */
function prettifyPointsKey(key: string): string {
  if (POINT_ROW_LABELS[key]) return POINT_ROW_LABELS[key];
  return key
    .replace(/_/g, ' ')
    .replace(/\b(\d+)h\b/g, '$1 h')
    .replace(/\ble\b/g, 'Le')
    .replace(/\band\b/g, '&')
    .replace(/\b(\d+)km\b/g, '$1 km')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, ch => ch.toUpperCase());
}

/**
 * The race-format block for a series, from data/seriesRules.json.
 * `hasSprint` limits the points tables to the ones this weekend actually awards
 * (a Sprint points column is noise on a non-Sprint weekend). Null when the
 * series has no rules entry.
 */
export function raceFormatFor(series: string, hasSprint: boolean): RaceFormat | null {
  const rules = (seriesRulesData as Record<string, any>)[series];
  if (!rules) return null;

  const points = rules.points ?? {};
  const pointsRows: PointsRow[] = [];
  for (const [key, value] of Object.entries(points)) {
    if (key === 'note' || !Array.isArray(value)) continue;
    // A zero (e.g. the abolished fastest-lap point) is explained by the note, not listed.
    if (value.every(v => !v)) continue;
    if (key === 'sprint' && !hasSprint) continue;
    pointsRows.push({ key, label: prettifyPointsKey(key), values: value as number[] });
  }

  return {
    seriesName: rules.name ?? series,
    officialSite: rules.official_site,
    distanceRule: rules.race_distance_rule,
    pointsRows,
    note: typeof points.note === 'string' ? points.note : undefined,
    categories: Array.isArray(rules.categories) ? rules.categories : [],
  };
}

// ── Championship stakes ─────────────────────────────────────────────────────

export interface StakeEntry {
  pos: number;
  name: string;
  country?: string;
  team?: string;
  points: number;
}

export interface Stakes {
  tableLabel: string;
  updatedAt?: string;
  roundsComplete: number;
  totalRounds: number;
  top: StakeEntry[];
  /** Points between the leader and P2. */
  leaderGap: number;
}

// Which standings table is "the" championship when a series has several.
const PRIMARY_TABLE = ['drivers', 'riders', 'hypercar', 'gtp', 'proteams', 'prodrivers', 'teams'];

/**
 * The standings snapshot for the stakes block. data/standings.json holds the
 * current season's tables only, so this returns null for any other season —
 * showing last year's points against a new season's round would be wrong.
 */
export function stakesFor(series: string, season: number): Stakes | null {
  if (season !== DEFAULT_CALENDAR_YEAR) return null;
  const tables = (standingsData as Record<string, any>)[series];
  if (!tables) return null;
  const key = PRIMARY_TABLE.find(k => tables[k]) ?? Object.keys(tables)[0];
  const table = tables[key];
  const entries: StakeEntry[] = (table?.entries ?? []).map((e: any) => ({
    pos: e.pos,
    name: e.name,
    country: e.country,
    team: e.team ?? e.manufacturer,
    points: e.points,
  }));
  if (entries.length < 2) return null;
  return {
    tableLabel: table.label ?? key,
    updatedAt: table.updatedAt,
    roundsComplete: table.roundsComplete ?? 0,
    totalRounds: table.totalRounds ?? 0,
    top: entries.slice(0, 3),
    leaderGap: entries[0].points - entries[1].points,
  };
}
