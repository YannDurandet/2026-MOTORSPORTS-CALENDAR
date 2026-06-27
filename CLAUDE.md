# 2026 Motorsport Calendar — Project Notes for Claude

## Stack
Astro static site. All data lives in `data/`. Pages are pre-rendered at build time. Client-side JS handles filters, countdowns, and search.

## Key data files
- `data/tracks.json` — 133 tracks, one object per venue
- `data/calendar.json` — race calendar, nested month → week → events
- `data/seriesContent.json` — series metadata (name, description, history, socials, teams)
- `data/series.json` — race date/time index used for countdowns (auto-generated or manually maintained)

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
  "website": "https://www.silverstone.co.uk"
}
```

`type` values: `"permanent"` | `"street"` | `"oval"` | `"mixed"`

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
The browser grid (`tracks/index.astro`) and track detail page (`tracks/[slug].astro`) both call `fs.existsSync(svgPath)` at build time. If `browserSvg` points to a file that doesn't exist on disk, the card silently falls back to the placeholder — no build error. So always confirm the filename in `tracks.json` exactly matches what's on disk.

## Multi-layout tracks
Some venues use multiple SVG files for different series (e.g. Daytona, Barcelona, Red Bull Ring). These have a `layouts` array:
```json
"layouts": [
  { "id": "oval", "label": "Oval (NASCAR)", "calendarSvgs": ["daytona-oval.svg"] },
  { "id": "road", "label": "Road Course (IMSA)", "calendarSvgs": ["daytona-road.svg"] }
]
```
The hover-dim JS in the browser and detail page reads `<g id="layout-{id}">` groups inside the SVG to highlight the active layout.

## track-data-gaps.md
Documents missing or uncertain track data (lap records that are qualifying not race, era mismatches, new circuits with no records, etc.). Update when data is confirmed or new gaps are found.

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

## Bash sandbox note
The sandbox mounts the workspace at `/sessions/keen-charming-rubin/mnt/2026-MOTORSPORTS-CALENDAR/`. After external tools (Gemini etc.) edit files, prefer the **Read tool** over bash `cat` to verify file state — bash may show a stale cached mount.
