# Missing OG Images — Design in Figma

These pages currently fall back to the generic `lauda_and_mouton--large.webp` OG image.
Series detail pages are now handled (they use their series-grid WebP as og:image).

## Still needed — design these in Figma

| Page | Suggested filename | Notes |
|---|---|---|
| Homepage `/` | `og-home.jpg` | Site identity — dord.racing wordmark, tagline, hero feel |
| Track Browser `/tracks` | `og-tracks.jpg` | Collage of track maps or single iconic circuit |
| Results `/results` | `og-results.jpg` | Race results / podium aesthetic |
| Legal `/legal/tos` | *(skip — not shared)* | — |
| Legal `/legal/privacy` | *(skip — not shared)* | — |
| Individual track pages `/tracks/[slug]` | `og-tracks.jpg` | Reuse the generic tracks OG for now; could later auto-generate per track |

## How to wire them once designed

1. Save files to `public/assets/og/`
2. In `BaseLayout.astro`, `ogImage` prop is already supported
3. Pass `ogImage="https://dord.racing/assets/og/og-home.jpg"` on the relevant page's `<BaseLayout>` call

## Recommended specs
- Size: 1200 × 630 px
- Format: JPG (< 200 KB ideally)
- Safe zone: keep key content within central 1000 × 500 area

_Last updated: 2026-06-30_
