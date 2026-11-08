// Countries the "where are you watching from?" dropdown offers.
//
// Derived from data/seriesContent.json rather than listed by hand: a country
// shows up as soon as any series has a `howToWatch` entry for it, so adding
// broadcasters for a new country is a data-only change.

import seriesContent from '../../data/seriesContent.json';

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

function nameOf(code: string): string {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

export interface WatchCountry {
  code: string;
  name: string;
}

export function watchCountries(): WatchCountry[] {
  const codes = new Set<string>();
  for (const s of seriesContent as any[]) {
    for (const key of Object.keys(s.howToWatch ?? {})) {
      if (key !== 'global') codes.add(key);
    }
  }
  return [...codes]
    .map(code => ({ code, name: nameOf(code) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en'));
}
