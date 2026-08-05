/**
 * src/lib/results.ts
 * Shared data helpers for /results and /stats pages.
 * Imported in Astro frontmatter only (build-time; no client bundle).
 */

import calendarData from '../../data/calendar.json';
import tracksData   from '../../data/tracks.json';

// ── Types ────────────────────────────────────────────────────────────────────

export type ResultEntry = {
  series:        string;
  race_label?:   string;
  event:         string;
  venue:         string;       // track slug
  date:          string;       // YYYY-MM-DD
  winner?:       string;
  co_driver?:    string;
  manufacturer?: string;
  winners?:      string[];
  team?:         string;
  country?:      string;       // ISO 2-letter winner nationality
};

// ── Country lookup ────────────────────────────────────────────────────────────

export function normalizeCountry(name: string): string {
  const map: Record<string, string> = {
    'Australia': 'AU', 'Austria': 'AT', 'Azerbaijan': 'AZ', 'Bahrain': 'BH',
    'Belgium': 'BE', 'Brazil': 'BR', 'Canada': 'CA', 'China': 'CN',
    'Czech Republic': 'CZ', 'France': 'FR', 'Germany': 'DE', 'Hungary': 'HU',
    'Indonesia': 'ID', 'Ireland': 'IE', 'Italy': 'IT', 'Japan': 'JP',
    'Latvia': 'LV', 'Macau': 'MO', 'Malaysia': 'MY', 'Mexico': 'MX',
    'Monaco': 'MC', 'Netherlands': 'NL', 'New Zealand': 'NZ', 'Portugal': 'PT',
    'Qatar': 'QA', 'Saudi Arabia': 'SA', 'Singapore': 'SG', 'South Korea': 'KR',
    'Spain': 'ES', 'Sweden': 'SE', 'Thailand': 'TH', 'UAE': 'AE',
    'UK': 'GB', 'USA': 'US',
  };
  return map[name] ?? '';
}

export const isoToName: Record<string, string> = {
  'AU': 'Australia', 'AT': 'Austria', 'AZ': 'Azerbaijan', 'BH': 'Bahrain',
  'BE': 'Belgium', 'BR': 'Brazil', 'CA': 'Canada', 'CN': 'China',
  'CZ': 'Czech Republic', 'FR': 'France', 'DE': 'Germany', 'HU': 'Hungary',
  'ID': 'Indonesia', 'IE': 'Ireland', 'IT': 'Italy', 'JP': 'Japan',
  'LV': 'Latvia', 'MO': 'Macau', 'MY': 'Malaysia', 'MX': 'Mexico',
  'MC': 'Monaco', 'NL': 'Netherlands', 'NZ': 'New Zealand', 'PT': 'Portugal',
  'QA': 'Qatar', 'SA': 'Saudi Arabia', 'SG': 'Singapore', 'KR': 'South Korea',
  'ES': 'Spain', 'SE': 'Sweden', 'TH': 'Thailand', 'AE': 'UAE',
  'GB': 'United Kingdom', 'US': 'United States',
};

export function countryName(code: string): string {
  return isoToName[code] ?? code;
}

// ── Track lookup maps ─────────────────────────────────────────────────────────

/** calendarSvg filename → track slug */
export const svgToSlug = (() => {
  const map = new Map<string, string>();
  for (const track of tracksData as any[]) {
    for (const svg of (track.calendarSvgs ?? [])) map.set(svg, track.slug);
    for (const layout of (track.layouts ?? []))
      for (const svg of (layout.calendarSvgs ?? [])) map.set(svg, track.slug);
  }
  return map;
})();

/** track slug → ISO 2-letter country code */
export const venueCountry: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const track of tracksData as any[]) {
    if (track.slug && track.country) out[track.slug] = normalizeCountry(track.country);
  }
  return out;
})();

// ── Series display ────────────────────────────────────────────────────────────

export const seriesShort: Record<string, string> = {
  f1: 'F1', f1a: 'F1 Academy', fe: 'Formula E', sf: 'Super Formula',
  wec: 'WEC', imsa: 'IMSA', wrc: 'WRC', erc: 'ERC',
  indycar: 'IndyCar', nascar: 'NASCAR', motogp: 'MotoGP', wsbk: 'WSBK',
  dtm: 'DTM', btcc: 'BTCC', supercars: 'Supercars', elms: 'ELMS',
  gtwce: 'GTWCE', gtwca: 'GTWCA', nls: 'NLS', igtc: 'IGTC',
  tcr: 'TCR', h24eu: '24H EU', psc: 'Porsche SC', bgt: 'British GT', eurx: 'Euro RX',
  'asian-le-mans': 'Asian LMS',
};

// ── Formatting helpers ────────────────────────────────────────────────────────

export function flagSrc(code: string, base: string): string {
  if (!code || code.length !== 2) return '';
  return `${base}/assets/flags/${code.toUpperCase()}.svg`;
}

export function fmtDate(d: string): string {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const parts = d.split('-');
  return `${months[parseInt(parts[1]) - 1]} ${parseInt(parts[2])}`;
}

export function monthLabel(key: string): string {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const parts = key.split('-');
  return `${months[parseInt(parts[1]) - 1]} ${parts[0]}`;
}

export function shortMonthLabel(key: string): string {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const parts = key.split('-');
  return `${months[parseInt(parts[1]) - 1]} ${parts[0]}`;
}

export function isoWeek(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// ── Core data builders ────────────────────────────────────────────────────────

/**
 * Flattened list of all result entries from calendar.json, newest first.
 * Each entry includes the track `venue` slug resolved from the event's SVG name.
 */
export function getFlatResults(): ResultEntry[] {
  const flat: ResultEntry[] = [];
  for (const month of calendarData as any[]) {
    for (const week of month.weeks) {
      for (const ev of week.events) {
        if (!ev.results?.length) continue;
        const venue = svgToSlug.get(ev.track ?? '') ?? '';
        for (const r of ev.results) {
          flat.push({ series: ev.series, event: ev.title, venue, ...r });
        }
      }
    }
  }
  flat.sort((a, b) => b.date.localeCompare(a.date));
  return flat;
}

/** Total calendar events per series (including future) */
export function getSeriesEventCounts(): Record<string, { total: number; done: number }> {
  const out: Record<string, { total: number; done: number }> = {};
  for (const month of calendarData as any[]) {
    for (const week of month.weeks) {
      for (const ev of week.events) {
        if (!out[ev.series]) out[ev.series] = { total: 0, done: 0 };
        out[ev.series].total++;
        if (ev.results?.length) out[ev.series].done++;
      }
    }
  }
  return out;
}

/**
 * For a date-sorted (ascending) slice of results, compute the current
 * win streak for the most recent winner — how many consecutive results
 * have the same winner/team?
 *
 * For endurance series (winners array), uses `team` instead.
 */
export function computeStreak(entries: ResultEntry[]): { name: string; count: number } | null {
  if (!entries.length) return null;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const lastName = (r: ResultEntry) => r.team && r.winners ? r.team : (r.winner ?? r.winners?.[0] ?? '');
  const last = sorted[sorted.length - 1];
  const streakName = lastName(last);
  let count = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (lastName(sorted[i]) === streakName) count++;
    else break;
  }
  return count >= 2 ? { name: streakName, count } : null;
}
