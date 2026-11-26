/**
 * Content blocks for track pages (/tracks/{slug}) that come from tracks.json
 * fields the page did not render before, plus the calendar:
 *
 *   - fastestRecords()  the "Circuit records" panel: tracks.json `records` is a
 *                       long flat list (Silverstone carries 200+ rows across
 *                       historic categories), so it is grouped by category and
 *                       reduced to the outright (fastest) time per category.
 *   - recordSeriesLabel()  human labels for the record categories, which are
 *                       not the site's series slugs ("gp2", "group-historic"…).
 *   - osmEmbedUrl() / osmLink()  the "Location" map: an OpenStreetMap embed
 *                       (no API key needed) and a larger-map link, from the
 *                       track's lat/lng.
 *   - rollOfHonourForTrack()  the "Roll of honour": every winner recorded at
 *                       the venue in data/calendar.json, grouped by series.
 *                       Unlike the results list (current season only) this
 *                       scans every season present in the calendar.
 */
import calendarData from '../../data/calendar.json';
import seriesContentData from '../../data/seriesContent.json';
import { monthYear } from './season';
import { findEvent } from './events';

// ── Records ─────────────────────────────────────────────────────────────────

export interface TrackRecord {
  series: string;
  time: string;
  driver: string;
  year?: number;
  car?: string;
  event?: string;
}

const RECORD_SERIES_LABELS: Record<string, string> = {
  f1: 'Formula 1', f2: 'Formula 2', f3: 'Formula 3', f4: 'Formula 4',
  gp2: 'GP2', gp3: 'GP3', fe: 'Formula E', sf: 'Super Formula',
  wec: 'WEC', imsa: 'IMSA', indycar: 'IndyCar', 'indy-nxt': 'Indy NXT',
  'indy-lights': 'Indy Lights', nascar: 'NASCAR', motogp: 'MotoGP',
  'motogp-historic': 'MotoGP (historic)', moto2: 'Moto2', moto3: 'Moto3',
  wsbk: 'WorldSBK', 'wsbk-ssp': 'WorldSSP', dtm: 'DTM', supercars: 'Supercars',
  psc: 'Porsche Supercup', 'porsche-supercup': 'Porsche Supercup',
  gt: 'GT', touring: 'Touring cars', karting: 'Karting',
  'group-historic': 'Historic', other: 'Other',
};

/** "formula-renault" → "Formula Renault"; known categories get their proper name. */
export function recordSeriesLabel(slug: string): string {
  return RECORD_SERIES_LABELS[slug]
    ?? slug.replace(/-/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());
}

/** "1:27.097" → 87.097; "90.123" → 90.123; anything else sorts last. */
function timeToSeconds(time: string | undefined): number {
  const t = String(time ?? '').trim();
  const m = t.match(/^(?:(\d+):)?(\d{1,2}):(\d{2}(?:\.\d+)?)$/);
  if (!m) {
    const f = Number(t);
    return Number.isFinite(f) && t !== '' ? f : Number.POSITIVE_INFINITY;
  }
  const [, h, min, sec] = m;
  return (h ? Number(h) * 3600 : 0) + Number(min) * 60 + Number(sec);
}

export interface RecordRow extends TrackRecord {
  label: string;
}

/**
 * One row per record category, carrying that category's fastest time,
 * fastest first. Categories with unparseable times keep their data order at
 * the end.
 */
export function fastestRecords(records: TrackRecord[] | undefined | null): RecordRow[] {
  if (!records?.length) return [];
  const best = new Map<string, TrackRecord>();
  for (const r of records) {
    // Rows without a time (a few malformed entries carry a date in `driver`
    // instead) are not lap records and can't be ranked — skip them.
    if (!r.time || !String(r.time).trim()) continue;
    const prev = best.get(r.series);
    if (!prev || timeToSeconds(r.time) < timeToSeconds(prev.time)) best.set(r.series, r);
  }
  return [...best.entries()]
    .map(([series, r]) => ({ ...r, series, label: recordSeriesLabel(series) }))
    .sort((a, b) => timeToSeconds(a.time) - timeToSeconds(b.time));
}

// ── Geo / map ───────────────────────────────────────────────────────────────

/** OpenStreetMap embed iframe src for a point, with a marker on the circuit. */
export function osmEmbedUrl(lat: number, lng: number, delta = 0.012): string {
  const bbox = `${(lng - delta).toFixed(5)},${(lat - delta).toFixed(5)},${(lng + delta).toFixed(5)},${(lat + delta).toFixed(5)}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lng}`;
}

/** "View larger map" target. */
export function osmLink(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;
}

// ── Roll of honour ──────────────────────────────────────────────────────────

export interface HonourRow {
  year: number;
  week: string;
  title: string;
  path: string | null;
  raceLabel?: string;
  winner?: string;
  team?: string;
  country?: string;
}

export interface HonourGroup {
  series: string;
  tag: string;
  seriesName: string;
  rows: HonourRow[];
}

type VenueSvgs = { calendarSvgs: string[]; layouts?: { calendarSvgs: string[] }[] };

const seriesNameBySlug: Record<string, string> = Object.fromEntries(
  (seriesContentData as any[]).map((s: any) => [s.slug, s.name])
);

/**
 * Winners at this venue across every season in the calendar, grouped by series
 * and newest first. Events resolve to their event page when one exists.
 */
export function rollOfHonourForTrack(venue: VenueSvgs): HonourGroup[] {
  const svgs = new Set(venue.calendarSvgs);
  for (const l of venue.layouts ?? []) for (const s of l.calendarSvgs) svgs.add(s);

  const groups = new Map<string, HonourGroup>();
  const seen = new Set<string>();

  for (const month of calendarData as any[]) {
    const year = monthYear(month);
    for (const week of month.weeks) {
      for (const ev of week.events) {
        if (!ev.track || !svgs.has(ev.track) || !ev.results?.length) continue;
        const dupeKey = `${ev.series}|${ev.title}|${week.label}`;
        if (seen.has(dupeKey)) continue;
        seen.add(dupeKey);

        const path = findEvent(year, ev.series, ev.title, week.label)?.path ?? null;
        let group = groups.get(ev.series);
        if (!group) {
          group = { series: ev.series, tag: ev.tag, seriesName: seriesNameBySlug[ev.series] ?? ev.series, rows: [] };
          groups.set(ev.series, group);
        }
        for (const r of ev.results) {
          group.rows.push({
            year,
            week: week.label,
            title: ev.title,
            path,
            raceLabel: r.race_label,
            winner: r.winners?.length ? r.winners.join(' · ') : r.winner,
            team: r.team ?? r.manufacturer,
            country: r.country,
          });
        }
      }
    }
  }

  return [...groups.values()]
    .map(g => ({ ...g, rows: g.rows.sort((a, b) => b.year - a.year || (a.raceLabel ?? '').localeCompare(b.raceLabel ?? '')) }))
    .sort((a, b) => a.seriesName.localeCompare(b.seriesName));
}
