/**
 * IANA timezone for a venue, so event pages can show circuit-local start
 * times. Countries with one zone map directly; the US, Australia, Indonesia
 * and a few others resolve per track slug.
 */
import type { Venue } from './venues';

const BY_COUNTRY: Record<string, string> = {
  Argentina: 'America/Argentina/Buenos_Aires',
  Austria: 'Europe/Vienna', Azerbaijan: 'Asia/Baku', Bahrain: 'Asia/Bahrain',
  Belgium: 'Europe/Brussels', Brazil: 'America/Sao_Paulo', Canada: 'America/Toronto',
  China: 'Asia/Shanghai', 'Czech Republic': 'Europe/Prague', France: 'Europe/Paris',
  Germany: 'Europe/Berlin', Hungary: 'Europe/Budapest', Ireland: 'Europe/Dublin',
  Italy: 'Europe/Rome', Japan: 'Asia/Tokyo', Latvia: 'Europe/Riga', Macau: 'Asia/Macau',
  Malaysia: 'Asia/Kuala_Lumpur', Mexico: 'America/Mexico_City', Monaco: 'Europe/Monaco',
  Netherlands: 'Europe/Amsterdam', 'New Zealand': 'Pacific/Auckland', Portugal: 'Europe/Lisbon',
  Qatar: 'Asia/Qatar', 'Saudi Arabia': 'Asia/Riyadh', Singapore: 'Asia/Singapore',
  'South Korea': 'Asia/Seoul', Spain: 'Europe/Madrid', Sweden: 'Europe/Stockholm',
  Thailand: 'Asia/Bangkok', Türkiye: 'Europe/Istanbul', UAE: 'Asia/Dubai', UK: 'Europe/London',
};

const US_CENTRAL = ['arlington', 'barber', 'chicagoland', 'cota', 'gateway', 'iowa', 'kansas',
  'milwaukee', 'nashville', 'nashville-oval', 'road-america', 'talladega'];
const US_PACIFIC = ['laguna-seca', 'las-vegas', 'las-vegas-strip', 'long-beach', 'portland',
  'sandiego', 'sonoma'];

const BY_SLUG: Record<string, string> = {
  ...Object.fromEntries(US_CENTRAL.map(s => [s, 'America/Chicago'])),
  ...Object.fromEntries(US_PACIFIC.map(s => [s, 'America/Los_Angeles'])),
  phoenix: 'America/Phoenix',
  indianapolis: 'America/Indiana/Indianapolis',
  detroit: 'America/Detroit',
  // Australia: Melbourne/Sydney share a zone; the rest don't.
  darwin: 'Australia/Darwin', perth: 'Australia/Perth', tasmania: 'Australia/Hobart',
  'gold-coast': 'Australia/Brisbane', ipswich: 'Australia/Brisbane', townsville: 'Australia/Brisbane',
  'the-bend': 'Australia/Adelaide', adelaide: 'Australia/Adelaide',
  mandalika: 'Asia/Makassar', jakarta: 'Asia/Jakarta',
};

const COUNTRY_DEFAULT: Record<string, string> = {
  USA: 'America/New_York',
  Australia: 'Australia/Melbourne',
  Indonesia: 'Asia/Jakarta',
};

export function venueTimeZone(venue: Pick<Venue, 'trackSlug' | 'country'> | null): string | null {
  if (!venue) return null;
  if (venue.trackSlug && BY_SLUG[venue.trackSlug]) return BY_SLUG[venue.trackSlug];
  return BY_COUNTRY[venue.country] ?? COUNTRY_DEFAULT[venue.country] ?? null;
}

/** "Sun 4 Oct, 15:00" in the given zone. */
export function formatIn(iso: string, timeZone: string): { day: string; time: string } {
  const d = new Date(iso);
  const day = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone });
  return { day, time };
}

/** Short zone label for a date: "CEST", "EDT", "AEDT", else "GMT+8". Each
 *  English locale only abbreviates its own region's zones, so try them in turn. */
export function zoneAbbr(iso: string, timeZone: string): string {
  let fallback = '';
  for (const locale of ['en-GB', 'en-US', 'en-AU']) {
    const name = new Intl.DateTimeFormat(locale, { timeZone, timeZoneName: 'short' })
      .formatToParts(new Date(iso)).find(p => p.type === 'timeZoneName')?.value ?? '';
    if (name && !/^(GMT|UTC)[+-−]/.test(name)) return name;
    fallback ||= name;
  }
  return fallback;
}
