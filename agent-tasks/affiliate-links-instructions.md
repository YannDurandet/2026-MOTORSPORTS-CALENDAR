# DORD — Affiliate Links
## Current implementation

_Last updated: 2026-09-29_

> **History:** an earlier version of this file specified a Motorsport Tickets
> integration with a `<TicketsButton />` component, a `hasTickets` series flag
> and an `AWIN_PUBLISHER_ID` env var. That design was never built. Motorsport
> Tickets now ships differently (see *Tickets* below). This file documents what
> actually exists — treat it as the source of truth, not as a plan.

---

## WHAT IS LIVE

| Piece | Location |
|---|---|
| Link builder + merchant IDs | `src/lib/affiliates.ts` |
| "Plan Your Trip" module | `src/components/TripPlannerCard.astro` |
| "Getting There" logistics module | `src/components/GettingThereCard.astro` |
| Rendered on | `/tracks/[slug]` and `/events/[year]/[slug]` — right column |
| Tickets module | `src/lib/tickets.ts`, rendered on upcoming event pages |

### Merchants (Awin)

```ts
export const AWIN_AFFILIATE_ID = '2961799';

export const MERCHANTS = {
  GETYOURGUIDE_US: 18925,   // Tours & Activities
  VIATOR_US:       11018,   // Tours & Experiences
  TRIVAGO_USA:     66034,   // Hotels
  MOTORSPORT_TICKETS: 21865, // F1, MotoGP, WEC / Le Mans tickets — 2%, 30-day cookie
} as const;
```

All four programmes are **pending approval** (check Motorsport Tickets' status in
the Awin dashboard; the ID is from its public merchant profile). There is no car-rental or flight
programme yet — see *Next steps*.

### The kill switch

```ts
export const AFFILIATE_ENABLED =
  import.meta.env.PUBLIC_AFFILIATE_LINKS_ENABLED === 'true';
```

Default is `false`. While disabled, `buildAwinLink()` returns the plain
destination URL, so the module stays useful to visitors and sets no tracking
cookie. To go live: set `PUBLIC_AFFILIATE_LINKS_ENABLED=true` in Cloudflare Pages
(Settings → Environment Variables → Production) and redeploy. **No code change.**

`rel="sponsored"` is applied only when tracking is actually on — a plain
untracked link is not a paid placement and should not be marked as one. Use
`PARTNER_REL` from `affiliates.ts`; don't recompute it.

### Click tracking

`clickref` convention is `{page}-{slug}-{partner}`:
`track-albert-park-gyg` on track pages, `event-f1-monaco-gp-gyg` on event pages
(`TripPlannerCard` takes a `placement` prop), `event-f1-monaco-gp-mst` for
Motorsport Tickets.

### Tickets

`ticketLinks()` in `src/lib/tickets.ts` builds the Tickets card on upcoming
event pages: the official seller (F1 Ticket Store, MotoGP Tickets, 24h-lemans.com
for Le Mans), the circuit's own site from `tracks.json`, and Motorsport Tickets
for F1, F1 Academy, Supercup, MotoGP and WEC. Motorsport Tickets' per-event URLs
are unstable, so it links to `https://motorsporttickets.com/en/events`.

---

## HOTEL TARGETING — the important bit

The Trivago link does **not** search the venue city. It searches the track's
`logistics.accommodation_hub` from `data/tracks.json`, via `accommodationQuery()`
in `src/lib/affiliates.ts`.

This matters because the two are frequently different, and the hub is where fans
actually book:

| Track | `city` | Hotel search |
|---|---|---|
| Zandvoort | Zandvoort | **Haarlem** |
| Silverstone | Silverstone | **Milton Keynes** |
| Suzuka | Suzuka | **Nagoya** |
| Monza | Monza | **Milan** |
| Sachsenring | Hohenstein-Ernstthal | **Chemnitz** |

85 of 136 tracks resolve to a hub different from the venue city. The other 51
fall back to `venue.city`, which is always safe.

`accommodation_hub` is prose, so `accommodationQuery()` extracts the first named
place and bails to `city` whenever the result doesn't look like a place name.
If you change the shape of that field, re-check the extraction.

---

## DISCLOSURE

Currently disclosed in two places:

- `src/components/Footer.astro` — site-wide line: *"Some links are affiliate
  links — we may earn a commission at no cost to you."*
- `/legal/tos` §3 and `/legal/privacy` §4 — full explanation, cookie duration,
  and the statement that affiliate relationships don't influence editorial.

- Inline, next to the links: `.affiliate-notice` under the Trip Planner links
  and under the Tickets card. Required by the stricter reading of EU/French
  rules; keep it when adding partners.

---

## WHAT NOT TO DO

- Don't put affiliate links in editorial content (Pit Wall posts, track bios).
  Keep them on calendar / track / series pages where intent is "I want to go".
- Don't add a second competing set of outbound links to a track page. The
  `affiliate_hooks` chips in `GettingThereCard` are deliberately **not** links —
  two modules competing for the same click cannibalise each other.
- Don't hand-build Awin URLs. Always go through `buildAwinLink()` so the kill
  switch and `clickref` convention hold.
- Don't mark untracked links `rel="sponsored"`.

---

## NEXT STEPS

1. **Get the four programmes approved**, then flip
   `PUBLIC_AFFILIATE_LINKS_ENABLED=true`. The inline disclosures are in place.
2. **Car rental + flights have no programme.** Every track's
   `logistics.affiliate_hooks` already carries the search intent
   (e.g. `"Melbourne car rental"`, `"Flights to Melbourne"`). When those
   programmes are approved, add the IDs to `MERCHANTS` and turn the chips in
   `GettingThereCard.astro` into links — the data is already there.
3. **Tickets deep links.** If Motorsport Tickets exposes stable series or
   event URLs, point `ticketLinks()` at them instead of the events index.
