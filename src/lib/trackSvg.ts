/**
 * The cleaning every inline or re-served track map gets (AUDIT F-068). Each
 * caller then adds its own step: a name for the track-page hero, a thinner
 * stroke for the /tracks grid, a fixed size for the share cards.
 * (scripts/export-track-pngs.mjs strips the background with its own rules and
 * is not a caller.)
 */

/** Remove the dot-pattern background: its <defs> and the fill-opacity rect. */
export function stripTrackBackground(raw: string): string {
  return raw
    .replace(/<defs>[\s\S]*?<\/defs>/g, '')
    .replace(/<rect[^>]*fill-opacity[^>]*\/?>/g, '');
}

/** Drop the root width/height so CSS and the viewBox size the map. */
export function dropFixedSize(svg: string): string {
  return svg
    .replace(/(\s)width="\d+"/, '')
    .replace(/(\s)height="\d+"/, '');
}
