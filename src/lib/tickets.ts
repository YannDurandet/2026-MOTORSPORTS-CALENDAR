/**
 * Where to buy tickets for an event.
 *
 * Official sellers are listed per series. The circuit's own site comes from
 * tracks.json. Motorsport Tickets (Awin) sells F1, MotoGP and WEC/Le Mans;
 * its per-event URLs are unstable, so it links to the events index.
 */
import { buildAwinLink, MERCHANTS } from './affiliates';

export type TicketLink = { name: string; url: string; note: string; partner?: boolean };

const OFFICIAL: Record<string, { name: string; url: string }> = {
  f1:     { name: 'F1 Ticket Store', url: 'https://tickets.formula1.com/en' },
  f1a:    { name: 'F1 Ticket Store', url: 'https://tickets.formula1.com/en' },
  psc:    { name: 'F1 Ticket Store', url: 'https://tickets.formula1.com/en' },
  motogp: { name: 'MotoGP Tickets', url: 'https://tickets.motogp.com/en/' },
};

const MOTORSPORT_TICKETS_SERIES = new Set(['f1', 'f1a', 'psc', 'motogp', 'wec']);

export function ticketLinks(opts: {
  series: string;
  title: string;
  eventSlug: string;
  circuitName?: string;
  circuitUrl?: string;
}): TicketLink[] {
  const out: TicketLink[] = [];
  const official = /le mans/i.test(opts.title) && opts.series === 'wec'
    ? { name: '24 Hours of Le Mans ticketing', url: 'https://www.24h-lemans.com/en/tickets' }
    : OFFICIAL[opts.series];
  if (official) out.push({ ...official, note: 'Official seller' });
  if (opts.circuitUrl) out.push({ name: opts.circuitName ?? 'Circuit website', url: opts.circuitUrl, note: 'Circuit box office' });
  if (MOTORSPORT_TICKETS_SERIES.has(opts.series)) {
    out.push({
      name: 'Motorsport Tickets',
      url: buildAwinLink('https://motorsporttickets.com/en/events', MERCHANTS.MOTORSPORT_TICKETS, `event-${opts.eventSlug}-mst`),
      note: 'Grandstands, hospitality and packages',
      partner: true,
    });
  }
  return out;
}
