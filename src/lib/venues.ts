/**
 * Where an event happens, for display and structured data.
 *
 * Circuit events resolve through tracks.json. WRC/ERC rounds use a national
 * flag SVG instead of a circuit, so they have no track entry and fall back to
 * the table below. tbc/tbd placeholders resolve to nothing.
 */
import tracksData from '../../data/tracks.json';
import type { CalendarEvent } from './events';

export type Venue = {
  name: string;
  city: string;
  country: string;
  /** Set when the venue has a /tracks/{slug} page. */
  trackSlug?: string;
  website?: string;
};

export const rallyLocations: Record<string, { name: string; city: string; country: string }> = {
  'monte-carlo-wrc.svg': { name: 'Rallye Monte-Carlo',       city: 'Monaco',                    country: 'MC' },
  'sweden-wrc.svg':      { name: 'Rally Sweden',             city: 'Umeå',                      country: 'SE' },
  'kenya-wrc.svg':       { name: 'Safari Rally Kenya',       city: 'Naivasha',                  country: 'KE' },
  'croatia-wrc.svg':     { name: 'Croatia Rally',            city: 'Zagreb',                    country: 'HR' },
  'spain-wrc.svg':       { name: 'Rally Islas Canarias',     city: 'Las Palmas de Gran Canaria', country: 'ES' },
  'portugal-wrc.svg':    { name: 'Rally de Portugal',        city: 'Matosinhos',                country: 'PT' },
  'japan-wrc.svg':       { name: 'Rally Japan',              city: 'Toyota',                    country: 'JP' },
  'greece-wrc.svg':      { name: 'Acropolis Rally Greece',   city: 'Lamia',                     country: 'GR' },
  'estonia-wrc.svg':     { name: 'Rally Estonia',            city: 'Tartu',                     country: 'EE' },
  'finland-wrc.svg':     { name: 'Rally Finland',            city: 'Jyväskylä',                 country: 'FI' },
  'paraguay-wrc.svg':    { name: 'Rally del Paraguay',       city: 'Luque',                     country: 'PY' },
  'chile-wrc.svg':       { name: 'Rally Chile',              city: 'Concepción',                country: 'CL' },
  'italy-wrc.svg':       { name: 'Rally Italy Sardegna',     city: 'Alghero',                   country: 'IT' },
  'saudi-wrc.svg':       { name: 'Rally Saudi Arabia',       city: 'Riyadh',                    country: 'SA' },
  // ERC-only flags
  'czechia-wrc.svg':     { name: 'Barum Czech Rally Zlín',   city: 'Zlín',                      country: 'CZ' },
  'poland-wrc.svg':      { name: '82nd Rally Poland',        city: 'Mikołajki',                 country: 'PL' },
  'wales-wrc.svg':       { name: 'Rali Ceredigion',          city: 'Aberystwyth',               country: 'GB' },
};

const trackBySlug = new Map<string, any>((tracksData as any[]).map(t => [t.slug, t]));

export function venueFor(ev: Pick<CalendarEvent, 'trackSlug' | 'trackSvg' | 'venue'>): Venue | null {
  const t = ev.trackSlug ? trackBySlug.get(ev.trackSlug) : null;
  if (t) return { name: t.name, city: t.city, country: t.country, trackSlug: t.slug, website: t.website };
  if (ev.venue) return { ...ev.venue };
  const r = rallyLocations[ev.trackSvg];
  return r ? { ...r } : null;
}
