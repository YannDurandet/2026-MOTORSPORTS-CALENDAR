/**
 * Short series names for <title> tags and headings, where the full
 * seriesContent name ("FIA World Endurance Championship") would push the
 * title past what search results display (~60 characters).
 */
const SHORT: Record<string, string> = {
  f1: 'F1', f1a: 'F1 Academy', fe: 'Formula E', sf: 'Super Formula', wec: 'WEC',
  imsa: 'IMSA', wrc: 'WRC', indycar: 'IndyCar', nascar: 'NASCAR Cup', motogp: 'MotoGP',
  wsbk: 'WorldSBK', dtm: 'DTM', btcc: 'BTCC', supercars: 'Supercars', elms: 'ELMS',
  gtwce: 'GTWC Europe', gtwca: 'GTWC America', nls: 'NLS', igtc: 'IGTC', tcr: 'TCR World Tour',
  erc: 'ERC', h24eu: '24H Series', psc: 'Porsche Supercup', bgt: 'British GT',
  eurx: 'Euro RX', 'asian-le-mans': 'Asian Le Mans',
};

export function seriesShort(slug: string, fallback?: string): string {
  return SHORT[slug] ?? fallback ?? slug.toUpperCase();
}
