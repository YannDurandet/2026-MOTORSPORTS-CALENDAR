/**
 * Small display helpers that several templates used to copy (AUDIT F-068).
 * No data imports, so anything can use them, the OG integration included.
 */

type ResultLike = { winner?: string; winners?: string[] };

/** The winner of a result row: shared drives joined ("A · B"), else the single winner; "" when none. */
export function winnerName(r: ResultLike | null | undefined, separator = ' · '): string {
  if (!r) return '';
  return r.winners?.length ? r.winners.join(separator) : (r.winner ?? '');
}

/** "GB" → 🇬🇧. Anything that isn't a two-letter code gives "". */
export function countryFlag(code?: string): string {
  if (!code || code.length !== 2) return '';
  return [...code.toUpperCase()].map(c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)).join('');
}

/** "WEEK 45 • NOV 06-08" → "NOV 06" (the week's first day). */
export function weekStartLabel(label: string): string {
  const m = label.match(/•\s*([A-Z]{3})\s+(\d{1,2})/);
  return m ? `${m[1]} ${m[2]}` : label.replace('•', '').trim();
}

const LAYOUT_DISPLAY: Record<string, string> = {
  motogp: 'MotoGP', f1: 'F1', fe: 'FE', wsbk: 'WSBK', nascar: 'NASCAR',
  gp: 'GP', national: 'National', indy: 'Indy', oval: 'Oval', road: 'Road',
  full: 'Full', international: 'International', foster: 'Foster', island: 'Island',
};

/** A track layout id as shown on its button: "motogp" → "MotoGP", unknown ids upper-cased. */
export const layoutLabel = (id: string): string => LAYOUT_DISPLAY[id] ?? id.toUpperCase();
