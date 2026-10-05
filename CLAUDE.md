# 2026 Motorsport Calendar — Project Notes for Claude

## Working with Yann
- **One command per code block.** When giving Yann commands to run, put each command in its own fenced block, even when they run back to back. The copy button copies the whole block, and he usually needs one line at a time. Number the steps in the prose between blocks instead of stacking commands in one box.
- He works on Windows in PowerShell: quote git refs that contain braces (`'stash@{0}'`), and don't assume a POSIX shell.

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

## Optional event fields in `calendar.json`
Beyond `series`/`tag`/`title`/`time`/`track`/`date`/`shortName`:

- `start` / `end` — ISO dates of the event's own weekend. The week label spans every series in that week, so without these an event page can show the wrong first day. Set for every F1 round.
- `slug` — pins the event URL when a title changes after the page went live (`"Bahrain GP"` → `"Bahrain GP in Malaysia (Sepang)"` keeps `/events/2026/f1-bahrain-gp`). Never change an existing one.
- `venue` — `{ name, city, country }` for a confirmed event whose circuit has no track entry or SVG yet (`track: "tbc.svg"`). Without it a `tbc.svg` event gets no page.

`data/seasons.json` holds per-series, per-year notes (summary, what changed, status) rendered on `/series/{slug}/{year}`.

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
| `/series/[slug]` | `src/pages/series/[slug].astro` | Series detail (current season) |
| `/series/[slug]/[year]` | `src/pages/series/[slug]/[year].astro` | Future season calendar, e.g. `/series/f1/2027` |
| `/events/[year]` | `src/pages/events/[year]/index.astro` | Season index |
| `/events/[year]/[slug]` | `src/pages/events/[year]/[slug].astro` | Event page |
| `/tracks` | `src/pages/tracks/index.astro` | Track browser (continent + type filter) |
| `/tracks/[slug]` | `src/pages/tracks/[slug].astro` | Track detail |
| `/data/series.json` | `src/pages/data/series.json.ts` | Race dates for countdowns |
| `/data/search.json` | `src/pages/data/search.json.ts` | Search index (tracks + series) |

## Design tokens
`src/styles/tokens.css` holds every colour, font family, font size, radius, shadow and series colour. It is imported once, before `global.css`, in `BaseLayout.astro`. Rules:

- Site CSS (`global.css` and `.astro` `<style>` blocks) uses `var(--token)`, never literals. `npm run check` enforces this via `scripts/check-tokens.mjs`. If nothing fits, add a token to `tokens.css`.
- Naming is `--{role}-{tier}`, e.g. `--text-muted`, `--line-subtle`, `--surface-raised`, `--fs-sm`. A `-N` suffix (`--text-soft-4`) is a legacy near-duplicate kept for pixel parity: don't reach for it in new code, use the tier's canonical token.
- Roles are split on purpose (`--text-*`, `--line-*`, `--surface-*`/`--card-bg*`). Pick by what the colour does, not by matching the hex.
- Series tokens keep the `--{slug}` / `--{slug}-c` pattern because templates build them from slugs. Per-series `-tag` (tag background adjusted for AA — flat for some, gradient for f1a/fe/wrc/supercars/gtwce/nls) and `-tint` (active filter chip, derived with `color-mix` from `-c`/brand — never hand-type one) live alongside. They mirror the **Series** collection and `Series/{slug}` paint styles in the Figma file.
- Fonts: `--font-mono` (JetBrains Mono) for UI, labels, times; `--font-body` (Inter) for prose; `--font-title` (Orbitron) **only** for page titles (`h1`, series hero, newsletter hero) and big section headers (calendar months, FAQ, newsletter banner). Files are self-hosted in `public/assets/fonts/` and precached in `public/sw.js` — bump `VERSION` there when fonts change.
- Floors: `--text-meta` is the dimmest readable text (passes AA on `--bg`, `--card-bg`, `--surface-raised`); `--text-dim*`/`--text-faint*` alias it. `--fs-3xs*`/`--fs-2xs*` alias `--fs-xs` (0.7rem).
- Out of scope: email HTML (`api/subscribe.ts`, `workers/newsletter.ts`, since mail clients lack CSS variables), `api/unsubscribe.ts`, the embed iframe (own local tokens + light theme), `<meta name="theme-color">`.

## Home calendar (Week Card / Event Row)
`src/components/EventRow.astro` + `src/styles/calendar.css` implement the Figma **Event Row** and **Week Card** components. Styles are scoped to `.cal-v2` (the calendar container) so shared `.card` / `.event` / `.tag` rules on other pages are unaffected. `main.js` depends on these hooks — keep them: `.card`, `.c-head` (text must end with the week's date range, it is parsed), `.event[data-series]` (filters), `.meta-time > .hl` (timezone conversion, including the time chip), `.ev-toggle` / `.ev-panel` (expand), `.focus-btn` (week focus switch), `data-ts` (live state).

## Global search
Search index is built at `/data/search.json` from tracks + series. It is fetched lazily on first open. Trigger: click the 🔍 button in nav, or press `/`.

## Affiliate links
`src/lib/affiliates.ts` holds the Awin merchant IDs and `buildAwinLink()`. All outbound partner links go through it, so the `PUBLIC_AFFILIATE_LINKS_ENABLED` kill switch and the `clickref` convention hold everywhere. Default is off: links render as plain untracked URLs. Read `agent-tasks/affiliate-links-instructions.md` before touching any of this.

## Share images & icons
- **Share cards** (`og:image` / X cards): `src/integrations/og.ts` writes one 1200×630 PNG per event, series, future season and track to `dist/client/og/…png` in an `astro:build:done` hook (~35 s, ~560 images). It runs in Node because the Cloudflare adapter prerenders pages inside workerd, where `sharp` and `fs` don't work — don't move it into a page route. Layout and colours: `src/lib/og.ts` (satori → sharp; series colours are read from the `.t-{slug}` / `.ev-{slug}` rules and `tokens.css`). Pages reference them with `ogPath()` from `src/lib/ogPaths.ts`.
- **Icons**: `npm run gen:icons` rebuilds favicons, apple-touch and PWA icons from `src/assets/dord-mark.png`.

## French section (`/fr`)
`src/pages/fr/`: `/fr` (landing), `/fr/calendrier-{f1|motogp}-{2026|2027}`, `/fr/programme-tv-f1`. Helpers, GP names and the EN ↔ FR page map live in `src/lib/fr.ts`; French season notes are the `*_fr` fields in `data/seasons.json`. `BaseLayout` takes `lang` and `alternates` (hreflang; the English URL doubles as x-default). Pair a new French page with its English one in `FR_SEASON_PAGES` so both sides get hreflang and the "Version française" link. Nav and footer stay English.

## Redirects
`public/_redirects` holds every redirect: `/events`, legacy URLs, and 301s for trailing-slash URLs (Cloudflare's asset handler would otherwise send a 307). Don't add redirects to `astro.config.mjs`: Astro appends them to the same file, and Cloudflare rejects the deploy if a path appears twice.

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
| `npm run check` | Data integrity + design-token checks — run before every commit |
| `npm run check:tokens` | Just the token check: no colour/font/size/radius literals in site CSS |
| `npm run gen:series` | Regenerate `data/series.json` from `calendar.json` |
| `npm run gen:pitwall` | Regenerate `data/pitwall.json` archive snapshot |
| `npm run gen:icons` | Rebuild favicons + PWA icons from `src/assets/dord-mark.png` |
| `npm run gen:track-pngs` | Export track SVGs to PNGs |
| `npm run results` | Interactive results injector for `calendar.json` |
| `npm run results:gaps` | List past events still missing results |
| `npm run results:brief` | Emit a JSON skeleton for every raced event with no result |
| `npm run results:apply <file>` | Validate + merge a filled skeleton into `calendar.json` |
| `npm run standings:stale` | Which series have raced since standings were last updated |
| `npm run standings:apply <file>` | Validate + merge a standings patch |
| `npm run times:prompt` | Generate a research prompt for TBC session times |
| `npm run times:apply` | Apply researched times back into `calendar.json` |
| `npm run test:unsub` | Generate/verify unsubscribe tokens locally |

Race results live **inline in `data/calendar.json`** (`event.results`). `data/results.json` is a dead file nothing reads — never write to it.

`scripts/archive/` holds completed one-off migrations. Kept for history; don't run them.

## Sandboxed / remote editing note
When the repo is edited through a sandbox or remote file bridge rather than locally, prefer the **Read tool** over bash `cat` to verify file state — a mounted filesystem may serve a stale cached view after an external tool writes. Avoid running `git` across such a bridge: even read-only commands like `status` and `diff` take `.git/index.lock`, and a bridge that cannot delete files will leave the lock behind.

## Accessibility checklist (WCAG 2.2 AA)
Run this before merging any new feature or page:

- [ ] Every new text/background color pairing passes AA (4.5:1 normal text, 3:1 large/UI). Prefer `--text-muted`/`--text-meta` for secondary meta text on dark backgrounds. Nothing dimmer than `--text-meta` for text.
- [ ] Every new interactive element is keyboard-operable: Tab-reachable, Enter/Space activates, has a visible focus ring (not just `outline: none`).
- [ ] Every new icon/SVG has `aria-hidden="true"` if decorative, or an accessible name (`aria-label`/`<title>`) if it conveys information.
- [ ] Every color-coded element (series tags, status indicators) also conveys meaning via text — color is never the sole indicator.
- [ ] Every new page has `<main id="main-content">` as the primary landmark, with a skip link already present in `BaseLayout.astro`.
- [ ] Toggle/disclosure buttons carry `aria-expanded` and update it in JS. Filter/toggle buttons carry `aria-pressed`.
- [ ] Any new animation/transition is suppressed under `@media (prefers-reduced-motion: reduce)`.
- [ ] Flag `<img>` alt text uses the full country name, not the ISO code.
- [ ] No new font sizes below `0.7rem` (`--fs-xs`) for meta/label text, and no new body text below `0.85rem` (`--fs-base`).
