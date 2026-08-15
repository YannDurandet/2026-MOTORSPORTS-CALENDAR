# 2026 Motorsport Calendar — Project Notes for Claude

## Stack
Astro static site. All data lives in `data/`. Pages are pre-rendered at build time. Client-side JS handles filters, countdowns, and search.

## Key data files
- `data/tracks.json` — 136 tracks, one object per venue
- `data/calendar.json` — race calendar, nested month → week → events
- `data/seriesContent.json` — series metadata (name, description, history, socials, teams)
- `data/series.json` — race date/time index used for countdowns (**generated** — never edit by hand; run `npm run gen:series` after editing `calendar.json`)

## Track object shape
```json
{
  "slug": "silverstone",
  "name": "Silverstone Circuit",
  "city": "Silverstone",
  "country": "UK",
  "continent": "europe",
  "browserSvg": "silverstone.svg",
  "calendarSvgs": ["silverstone.svg"],
  "bio": "...",
  "type": "permanent",
  "direction": "clockwise",
  "length": 5.891,
  "turns": 18,
  "lapRecord": { "time": "1:27.097", "driver": "Max Verstappen", "series": "F1", "year": 2020 },
  "website": "https://www.silverstone.co.uk",
  "logistics": {
    "nearest_airport": "BHX - Birmingham Airport",
    "transport": "Rail to Milton Keynes Central, then the official Silverstone shuttle bus…",
    "accommodation_hub": "Milton Keynes — the shuttle hub with the most hotel stock…",
    "travel_tip": "Book the Silverstone Bus from Milton Keynes Central with your ticket…",
    "affiliate_hooks": ["Hotels in Milton Keynes", "Hotels near Silverstone", "Birmingham car rental"]
  }
}
```

`type` values: `"permanent"` | `"street"` | `"oval"` | `"mixed"`

### `logistics`
Present on all 136 tracks. Rendered by `src/components/GettingThereCard.astro` in the right column of `/tracks/[slug]`. Rules when editing:

- `nearest_airport` — always `"IATA - Full Name"`. The three-letter code is parsed on display; keep the ` - ` separator.
- `accommodation_hub` — where fans should actually book, which is often **not** the venue city (Haarlem for Zandvoort, Milton Keynes for Silverstone). This field feeds the hotel affiliate link via `accommodationQuery()`, so lead with the place name and put the reasoning after an em dash.
- `travel_tip` — one actionable, non-obvious tip. Not marketing copy.
- `affiliate_hooks` — exactly 3 search keywords. Rendered as non-clickable chips; see `agent-tasks/affiliate-links-instructions.md` before making them links.

## SVG naming convention
| Pattern | Use |
|---|---|
| `{venue}.svg` | Generic / single-series |
| `{venue}-motogp.svg` | MotoGP uses a different layout |
| `{venue}-fe.svg` | Formula E street overlay |
| `{venue}-wsbk.svg` | WSBK-specific layout |
| `{venue}-oval.svg` | Superspeedway oval |
| `{venue}-road.svg` | Road course at an oval venue |
| `{venue}-f1.svg` | F1-specific when MotoGP also uses the venue |
| `{location}-wrc.svg` | WRC / ERC national flag |

All SVGs live in `public/assets/track-maps/`.

## Adding new SVG track maps
When the user says they added new SVGs, do ALL of the following — do not skip any step:

### 1. Set `browserSvg` in `data/tracks.json`
`browserSvg` is the SVG shown in the track browser grid and on the track detail page hero. It must be set explicitly — it is **not** inferred from `calendarSvgs`.

For each new SVG, find the matching track by slug and add/update `browserSvg`:
```json
"browserSvg": "silverstone.svg"
```

- If a venue has multiple layouts (e.g. `daytona-oval.svg` + `daytona-road.svg`), pick the primary one for `browserSvg` (usually the most-used layout). The others only need to appear in `calendarSvgs` or `layouts[].calendarSvgs`.
- WRC/ERC flag SVGs (`*-wrc.svg`) have no track entry — skip them.
- `tbc.svg` / `tbd.svg` are placeholder infographics — skip them.

### 2. Verify `calendarSvgs` references in `data/tracks.json`
Check that every SVG filename referenced in `calendarSvgs` (or `layouts[].calendarSvgs`) for that track matches the actual file on disk. Filenames are case-sensitive.

### 3. Update `track-map-status.md`
Keep the status doc current:
- Move the slug from **Still Missing** to **Circuit SVGs** (or the appropriate section).
- Update the counts in the **Summary** table.
- If the SVG is a `calendarSvg`-only variant (e.g. `sonoma-nascar.svg`) with no standalone browser entry, add it to the **calendarSvg-only** section instead.
- Update the `_Last updated` date.

### 4. Sanity-check SVG renders
The browser grid (`tracks/index.astro`) and track detail page (`tracks/[slug].astro`) both inline SVGs via `import.meta.glob` at build time. If `browserSvg` points to a file that doesn't exist on disk, the card silently falls back to the placeholder — no build error. So always confirm the filename in `tracks.json` exactly matches what's on disk.

## Multi-layout tracks
Some venues use multiple SVG files for different series (e.g. Daytona, Barcelona, Red Bull Ring). These have a `layouts` array:
```json
"layouts": [
  { "id": "oval", "label": "Oval (NASCAR)", "calendarSvgs": ["daytona-oval.svg"] },
  { "id": "road", "label": "Road Course (IMSA)", "calendarSvgs": ["daytona-road.svg"] }
]
```
The hover-dim JS in the browser and detail page reads `<g id="layout-{id}">` groups inside the SVG to highlight the active layout.

## Status docs
- `track-map-status.md` — SVG inventory: what's on disk, what's browser-mapped, what's still missing. Counts must add up to the files in `public/assets/track-maps/`; update it whenever you add an SVG (see step 3 above).
- `2027-calendar-status.md` — which series have 2027 rounds in `calendar.json` and which are still outstanding.

## Pages
| Route | File | Notes |
|---|---|---|
| `/` | `src/pages/index.astro` | Main calendar |
| `/series` | `src/pages/series/index.astro` | Series grid |
| `/series/[slug]` | `src/pages/series/[slug].astro` | Series detail |
| `/tracks` | `src/pages/tracks/index.astro` | Track browser (continent + type filter) |
| `/tracks/[slug]` | `src/pages/tracks/[slug].astro` | Track detail |
| `/data/series.json` | `src/pages/data/series.json.ts` | Race dates for countdowns |
| `/data/search.json` | `src/pages/data/search.json.ts` | Search index (tracks + series) |

## Global search
Search index is built at `/data/search.json` from tracks + series. It is fetched lazily on first open. Trigger: click the 🔍 button in nav, or press `/`.

## Affiliate links
`src/lib/affiliates.ts` holds the Awin merchant IDs and `buildAwinLink()`. All outbound partner links go through it, so the `PUBLIC_AFFILIATE_LINKS_ENABLED` kill switch and the `clickref` convention hold everywhere. Default is off: links render as plain untracked URLs. Read `agent-tasks/affiliate-links-instructions.md` before touching any of this.

## Deployment
Two separate Cloudflare Workers, hence two configs — this is intentional, not a duplicate:

| File | Deploys | Notes |
|---|---|---|
| `wrangler.toml` | the Astro site | via `@astrojs/cloudflare` |
| `workers/wrangler.toml` | `dord-newsletter` | `cd workers && wrangler deploy`; cron `0 8 * * MON` |

`db/schema.sql` is the Turso subscriber schema. Run once, by hand:
`npx turso db shell dord-subscribers < db/schema.sql`

Secrets are Cloudflare/Worker secrets, never committed: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `CRON_SECRET`, `UNSUB_SECRET`.

## Scripts
Everything in `scripts/` is reachable through `npm run`:

| Command | Does |
|---|---|
| `npm run check` | Data integrity checks — run before every commit |
| `npm run gen:series` | Regenerate `data/series.json` from `calendar.json` |
| `npm run gen:pitwall` | Regenerate `data/pitwall.json` archive snapshot |
| `npm run gen:icons` | Rebuild PWA icons from `website-icon.svg` (needs `sharp`) |
| `npm run gen:track-pngs` | Export track SVGs to PNGs |
| `npm run results` | Interactive results injector for `calendar.json` |
| `npm run results:gaps` | List past events still missing results |
| `npm run times:prompt` | Generate a research prompt for TBC session times |
| `npm run times:apply` | Apply researched times back into `calendar.json` |
| `npm run test:unsub` | Generate/verify unsubscribe tokens locally |

`scripts/archive/` holds completed one-off migrations. Kept for history; don't run them.

## Sandboxed / remote editing note
When the repo is edited through a sandbox or remote file bridge rather than locally, prefer the **Read tool** over bash `cat` to verify file state — a mounted filesystem may serve a stale cached view after an external tool writes. Avoid running `git` across such a bridge: even read-only commands like `status` and `diff` take `.git/index.lock`, and a bridge that cannot delete files will leave the lock behind.

## Accessibility checklist (WCAG 2.2 AA)
Run this before merging any new feature or page:

- [ ] Every new text/background color pairing passes AA (4.5:1 normal text, 3:1 large/UI). Prefer `#8a9aaa`/`#7a8fa0` for secondary meta text on dark backgrounds.
- [ ] Every new interactive element is keyboard-operable: Tab-reachable, Enter/Space activates, has a visible focus ring (not just `outline: none`).
- [ ] Every new icon/SVG has `aria-hidden="true"` if decorative, or an accessible name (`aria-label`/`<title>`) if it conveys information.
- [ ] Every color-coded element (series tags, status indicators) also conveys meaning via text — color is never the sole indicator.
- [ ] Every new page has `<main id="main-content">` as the primary landmark, with a skip link already present in `BaseLayout.astro`.
- [ ] Toggle/disclosure buttons carry `aria-expanded` and update it in JS. Filter/toggle buttons carry `aria-pressed`.
- [ ] Any new animation/transition is suppressed under `@media (prefers-reduced-motion: reduce)`.
- [ ] Flag `<img>` alt text uses the full country name, not the ISO code.
- [ ] No new font sizes below `0.7rem` for meta/label text, and no new body text below `0.85rem`.
