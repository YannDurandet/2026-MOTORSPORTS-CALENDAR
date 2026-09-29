/**
 * French section helpers: Grand Prix names, dates, and the EN ↔ FR page map
 * used for hreflang. The French pages cover the searches that have real
 * demand ("calendrier f1 2027", "programme tv f1"); everything else links to
 * the English event, track and series pages.
 */
import type { CalendarEvent } from './events';

const SITE = 'https://dord.racing';

/** French pages for a series season, with their English counterpart. */
export const FR_SEASON_PAGES: { series: 'f1' | 'motogp'; year: number; slug: string; en: string }[] = [
  { series: 'f1',     year: 2026, slug: 'calendrier-f1-2026',     en: '/series/f1' },
  { series: 'f1',     year: 2027, slug: 'calendrier-f1-2027',     en: '/series/f1/2027' },
  { series: 'motogp', year: 2026, slug: 'calendrier-motogp-2026', en: '/series/motogp' },
  { series: 'motogp', year: 2027, slug: 'calendrier-motogp-2027', en: '/series/motogp/2027' },
];

/** hreflang pair for a page that exists in both languages. */
export function alternatesFor(enPath: string, frPath: string) {
  return [
    { hreflang: 'en', href: `${SITE}${enPath === '/' ? '' : enPath}` || SITE },
    { hreflang: 'fr', href: `${SITE}${frPath}` },
  ];
}

/** French page for an English path, if one exists (for the language link). */
export function frPathFor(enPath: string): string | null {
  if (enPath === '/' || enPath === '') return '/fr';
  const hit = FR_SEASON_PAGES.find(p => p.en === enPath);
  return hit ? `/fr/${hit.slug}` : null;
}

const GP_FR: Record<string, string> = {
  // Formula 1
  'Australian GP': "GP d'Australie", 'Chinese GP': 'GP de Chine', 'Japanese GP': 'GP du Japon',
  'Miami GP': 'GP de Miami', 'Canadian GP': 'GP du Canada', 'Monaco GP': 'GP de Monaco',
  'Spanish GP (Barcelona)': "GP d'Espagne (Barcelone)", 'Austrian GP': "GP d'Autriche",
  'British GP': 'GP de Grande-Bretagne', 'Belgian GP': 'GP de Belgique', 'Hungarian GP': 'GP de Hongrie',
  'Dutch GP': 'GP des Pays-Bas', 'Italian GP': "GP d'Italie", 'Spanish GP (Madrid)': "GP d'Espagne (Madrid)",
  'Azerbaijan GP': "GP d'Azerbaïdjan", 'Bahrain GP in Malaysia (Sepang)': 'GP de Bahreïn en Malaisie (Sepang)',
  'Singapore GP': 'GP de Singapour', 'United States GP (Austin)': 'GP des États-Unis (Austin)',
  'Mexico City GP': 'GP de Mexico', 'Brazilian GP': 'GP du Brésil', 'São Paulo GP': 'GP de São Paulo',
  'Las Vegas GP': 'GP de Las Vegas', 'Qatar GP': 'GP du Qatar', 'Abu Dhabi GP': "GP d'Abou Dhabi",
  'Bahrain GP': 'GP de Bahreïn', 'Saudi Arabian GP': "GP d'Arabie saoudite",
  'Portuguese GP': 'GP du Portugal', 'Turkish GP': 'GP de Turquie',
  // MotoGP
  'Thai Grand Prix': 'GP de Thaïlande', 'Brazilian Grand Prix': 'GP du Brésil',
  'Americas Grand Prix': 'GP des Amériques', 'Spanish Grand Prix (Jerez)': "GP d'Espagne (Jerez)",
  'French Grand Prix (Le Mans)': 'GP de France (Le Mans)', 'Catalan Grand Prix': 'GP de Catalogne',
  'Italian Grand Prix (Mugello)': "GP d'Italie (Mugello)", 'Hungarian Grand Prix': 'GP de Hongrie',
  'Czech Grand Prix (Brno)': 'GP de République tchèque (Brno)', 'Dutch TT (Assen)': "TT d'Assen",
  'German Grand Prix (Sachsenring)': "GP d'Allemagne (Sachsenring)", 'British Grand Prix': 'GP de Grande-Bretagne',
  'Aragon Grand Prix': "GP d'Aragon", 'San Marino Grand Prix (Misano)': 'GP de Saint-Marin (Misano)',
  'Austrian Grand Prix': "GP d'Autriche", 'Japanese Grand Prix (Motegi)': 'GP du Japon (Motegi)',
  'Indonesian Grand Prix': "GP d'Indonésie", 'Australian Grand Prix (Phillip Island)': "GP d'Australie (Phillip Island)",
  'Malaysian Grand Prix (Sepang)': 'GP de Malaisie (Sepang)', 'Qatar Grand Prix (Lusail)': 'GP du Qatar (Lusail)',
  'Portuguese Grand Prix': 'GP du Portugal', 'Valencian Community GP (Finale)': 'GP de la Communauté valencienne (finale)',
  'Argentine Grand Prix (Buenos Aires)': "GP d'Argentine (Buenos Aires)",
  'Australian Grand Prix (Adelaide)': "GP d'Australie (Adélaïde)",
};

export function gpNameFr(title: string): string {
  return GP_FR[title] ?? title;
}

const noon = (d: string) => new Date(`${d}T12:00:00Z`);

/** "12–14 mars", "30 oct.–1er nov." */
export function rangeFr(ev: Pick<CalendarEvent, 'start' | 'end' | 'date'>): string {
  const end = ev.end ?? ev.date.slice(0, 10);
  const start = ev.start ?? end;
  const day = (d: string) => { const n = noon(d).getUTCDate(); return n === 1 ? '1er' : String(n); };
  const month = (d: string) => noon(d).toLocaleDateString('fr-FR', { month: 'long', timeZone: 'UTC' });
  if (start === end) return `${day(end)} ${month(end)}`;
  if (start.slice(0, 7) === end.slice(0, 7)) return `${day(start)}–${day(end)} ${month(end)}`;
  return `${day(start)} ${month(start)} – ${day(end)} ${month(end)}`;
}

/** "dimanche 4 octobre" */
export function longDayFr(d: string): string {
  return noon(d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
}

/** "09:00" → "9 h 00" (French typographic convention). */
export function heureFr(hhmm: string): string {
  const [h, m] = hhmm.split(':');
  return `${Number(h)} h ${m}`;
}
