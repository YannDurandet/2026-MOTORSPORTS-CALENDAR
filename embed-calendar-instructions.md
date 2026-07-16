# DORD — Embeddable Calendar Snippets
## Instructions for Coding Claude

---

## GOAL

Allow any website or blog to embed a live DORD calendar widget. When they embed it, it:
1. Shows upcoming races (filtered by series, track, or all)
2. Links back to dord.racing → **passive backlink from every site that embeds it**
3. Updates automatically (it's a live iframe or JS widget)
4. Takes 30 seconds to add to any site

---

## APPROACH: IFRAME EMBED (simplest, most compatible)

Build a dedicated embed route: `/embed/[series]` and `/embed/all`

These pages are:
- Minimal HTML (no nav, no footer, no cookie banners)
- Dark-themed to match DORD's design (embeds should look good on dark AND light site backgrounds)
- Responsive width (100% of container), fixed height (auto-sized or ~400px)
- Show next 5 upcoming events in a clean list

### The embed code a site owner copies:
```html
<!-- DORD Racing Calendar — Formula 1 -->
<iframe
  src="https://dord.racing/embed/f1"
  width="100%"
  height="400"
  frameborder="0"
  style="border-radius: 8px;"
  title="F1 Race Calendar — DORD Racing"
></iframe>
<p style="font-size:11px;text-align:right">
  <a href="https://dord.racing" target="_blank" rel="noopener">Full calendar at dord.racing ↗</a>
</p>
```

The attribution link below the iframe:
- Generates a natural, contextual dofollow backlink from every embed
- Make it visually part of the widget (include it inside the iframe footer, not just suggested in the code)

---

## ROUTE STRUCTURE

```
/embed/all                    → All series, next 10 events
/embed/[series-slug]          → Single series, next 8 events  
/embed/track/[track-slug]     → Events at a specific track, next 5
```

All routes accept query params:
- `?limit=5` — number of events to show
- `?theme=light` — light variant (default: dark)
- `?lang=fr` — language (future, not required now)

---

## EMBED PAGE DESIGN

Each embed page renders:
- DORD logo (small, top-right, links to dord.racing) — this is the backlink
- Series name + badge (if series-specific)
- List of upcoming events:
  - Date (short format: "Sun 26 Jul")
  - Race name / event name
  - Circuit name + flag emoji
  - Series badge pill (for /embed/all)
- Footer: "dord.racing — Full motorsport calendar →" (this is the visible attribution)

No external fonts (use system font stack to keep load fast). Minimal CSS, no JS framework overhead.

---

## HOW TO GENERATE THE EMBED SNIPPET (for DORD's own UI)

On each series page and track page, add an "Embed" button that:
1. Opens a small modal
2. Shows the pre-generated iframe code
3. Has a "Copy" button
4. Shows a live preview

Modal content:
```
Embed the [F1] calendar on your site

[iframe code preview in a <code> block]

[Copy code]  [Preview]

✓ Auto-updates  ✓ Free  ✓ Links back to dord.racing
```

---

## ALSO: iCAL SUBSCRIBE LINKS

Alongside embeds, add iCal subscribe links per series (different feature but same "embed" category):

```
webcal://dord.racing/ical/f1.ics          → F1 only
webcal://dord.racing/ical/all.ics         → All 25 series
webcal://dord.racing/ical/[series].ics    → Per series
```

**Google Calendar one-click:**
```
https://calendar.google.com/calendar/render?cid=webcal://dord.racing/ical/f1.ics
```

Show both the iCal link and the Google Calendar button on each series page.

The iCal feed (`.ics`) should include:
- `SUMMARY`: Race name + series
- `DTSTART` / `DTEND`: Race weekend start/end
- `LOCATION`: Circuit name + country
- `URL`: Link back to dord.racing/... (another backlink mechanism)
- `DESCRIPTION`: Series + round number

---

## BACKLINK STRATEGY SUMMARY

| Method | Backlink type | Effort |
|--------|-------------|--------|
| iFrame embed | In-iframe footer link | Passive — set and forget |
| iCal URL | Embedded `URL:` field in every event | Passive |
| Google Calendar button | User shares calendar → others subscribe | Viral potential |
| Copy embed code | Encouraged attribution link below iframe | Semi-passive |

The iframe footer attribution is the most reliable — it's built into the embed, not optional.

---

## IMPLEMENTATION ORDER

1. Build `/embed/[series]` route first (2 hours max)
2. Build the copy-snippet modal on series pages
3. Build iCal `.ics` generation for top 5 series (F1, MotoGP, WEC, IndyCar, Formula E)
4. Add Google Calendar button
5. Expand iCal to all 25 series
6. Add `/embed/track/[slug]` routes
