/**
 * Share images for every event, series, season and track page, written to
 * dist/client/og/{kind}/….png after the site is built. Pages point
 * og:image / twitter:image there via ogPath() in src/lib/ogPaths.ts.
 *
 * This runs as an `astro:build:done` hook, in Node, because the Cloudflare
 * adapter prerenders pages inside workerd, where sharp and fs aren't available.
 */
import type { AstroIntegration } from 'astro';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import tracksData from '../../data/tracks.json';
import seriesContent from '../../data/seriesContent.json';
import standings from '../../data/standings.json';
import { ALL_EVENTS, eventsForSeries, eventsForTrack, eventRange, type CalendarEvent } from '../lib/events';
import { DEFAULT_CALENDAR_YEAR } from '../lib/season';
import { venueFor } from '../lib/venues';
import { parseSessions, mainRaceTime } from '../lib/sessions';
import { formatIn } from '../lib/timezones';
import { seriesShort } from '../lib/seriesShort';
import { renderCard, seriesPaint, trackMapDataUri, type Card } from '../lib/og';

const NOW = Date.now();
const series = seriesContent as any[];
const tracks = tracksData as any[];
const nameOf = (slug: string) => series.find(s => s.slug === slug)?.name ?? slug.toUpperCase();
const tagOf = (slug: string) => ALL_EVENTS.find(e => e.series === slug)?.tag ?? seriesShort(slug).toUpperCase();
const badge = (slug: string, label = tagOf(slug)) => ({ label, paint: seriesPaint(slug) });
const upcoming = (evs: CalendarEvent[]) => evs.filter(e => !e.results?.length && new Date(e.date).getTime() > NOW - 6 * 3600e3);
const winnerOf = (e: CalendarEvent) => { const r = e.results?.[0]; return r ? (r.winners?.join(' / ') ?? r.winner ?? null) : null; };

function eventCard(ev: CalendarEvent): Card {
  const v = venueFor(ev);
  const track = ev.trackSlug ? tracks.find(t => t.slug === ev.trackSlug) : null;
  const race = mainRaceTime(parseSessions(ev.time));
  const paris = formatIn(ev.date, 'Europe/Paris');
  const raceKnown = !!race && race === paris.time;
  const w = winnerOf(ev);
  return {
    badges: [badge(ev.series, ev.tag)],
    title: `${ev.title} ${ev.year}`,
    meta: [eventRange(ev), v ? `${v.city}, ${v.country}`.toUpperCase() : null].filter(Boolean).join(' · '),
    chip: w ? `WINNER · ${w}` : raceKnown ? `RACE ${paris.day.split(' ')[0].toUpperCase()} ${race} PARIS` : /TBC/.test(ev.time) ? 'TIMES TBC' : undefined,
    footer: w ? 'Result · Session times · Circuit guide' : 'Session times · How to watch · Tickets',
    map: trackMapDataUri(track?.browserSvg ?? ev.trackSvg),
  };
}

function seriesCard(slug: string): Card {
  const evs = eventsForSeries(slug, DEFAULT_CALENDAR_YEAR);
  const next = upcoming(evs);
  const rows = (next.length ? next : evs.slice(-6)).slice(0, 6);
  const lead = Object.values((standings as any)[slug] ?? {})[0] as any;
  const top = lead?.entries?.[0];
  return {
    badges: [badge(slug)],
    title: nameOf(slug),
    meta: `${DEFAULT_CALENDAR_YEAR} CALENDAR · ${evs.length} ROUNDS`,
    list: rows.map(e => ({ left: eventRange(e), right: e.title })),
    chip: top ? `P1 ${top.name} · ${top.points} PTS` : undefined,
    footer: 'Calendar · Results · Standings',
  };
}

function seasonCard(slug: string, year: number): Card {
  const evs = eventsForSeries(slug, year);
  const sprints = evs.filter(e => e.hasSprint).length;
  return {
    badges: [badge(slug)],
    title: `${seriesShort(slug, nameOf(slug))} ${year} Calendar`,
    meta: `${evs.length} ROUNDS · ${eventRange(evs[0]).slice(0, 3)} – ${eventRange(evs[evs.length - 1]).replace(/.* - /, '').slice(0, 3)}`,
    list: evs.slice(0, 6).map(e => ({ left: eventRange(e), right: e.title })),
    chip: sprints ? `${sprints} SPRINT WEEKENDS` : undefined,
    footer: 'Every round · Dates · Venues',
  };
}

function trackCard(t: any): Card {
  const evs = eventsForTrack(t.slug, DEFAULT_CALENDAR_YEAR);
  const next = upcoming(evs)[0];
  // Most prominent series first (tier 1 = F1, MotoGP, WEC…), so the accent
  // and the three badges shown are the ones people recognise.
  const tier = (s: string) => series.find(x => x.slug === s)?.tier ?? 9;
  const slugs = [...new Set(evs.map(e => e.series))].sort((a, b) => tier(a) - tier(b));
  return {
    badges: slugs.slice(0, 5).map(s => badge(s)),
    title: t.name,
    meta: [`${t.city}, ${t.country}`.toUpperCase(), t.length ? `${(+t.length).toFixed(1)} KM` : null].filter(Boolean).join(' · '),
    chip: next ? `NEXT · ${eventRange(next)} · ${next.tag}` : evs.length ? `${evs.length} EVENTS IN ${DEFAULT_CALENDAR_YEAR}` : undefined,
    footer: 'Track map · Races · Getting there',
    map: trackMapDataUri(t.browserSvg),
  };
}

function allCards(): { path: string; card: () => Card }[] {
  const out: { path: string; card: () => Card }[] = [];
  for (const ev of ALL_EVENTS) out.push({ path: `events/${ev.year}/${ev.slug}`, card: () => eventCard(ev) });
  for (const s of series) out.push({ path: `series/${s.slug}`, card: () => seriesCard(s.slug) });
  const seasons = new Set(ALL_EVENTS.filter(e => e.year > DEFAULT_CALENDAR_YEAR).map(e => `${e.series}|${e.year}`));
  for (const p of seasons) { const [s, y] = p.split('|'); out.push({ path: `series/${s}/${y}`, card: () => seasonCard(s, +y) }); }
  for (const t of tracks) out.push({ path: `tracks/${t.slug}`, card: () => trackCard(t) });
  return out;
}

export default function ogImages(): AstroIntegration {
  return {
    name: 'dord-og-images',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        // `dir` is the client output (dist/client with the Cloudflare adapter).
        const outRoot = join(fileURLToPath(dir), 'og');
        const jobs = allCards();
        const t0 = Date.now();
        let i = 0;
        const worker = async () => {
          while (i < jobs.length) {
            const job = jobs[i++];
            const file = join(outRoot, `${job.path}.png`);
            mkdirSync(dirname(file), { recursive: true });
            writeFileSync(file, await renderCard(job.card()));
          }
        };
        await Promise.all(Array.from({ length: 4 }, worker));
        logger.info(`${jobs.length} share images in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
      },
    },
  };
}
