/**
 * Specs of a circuit layout: the numbers a track page and an event page print.
 *
 * A track with `layouts` carries its own length, turns, lap record and FIA licence
 * on EACH layout (Mexico City's Formula E loop is 2.63 km, its F1 circuit 4.304 km),
 * and the page shows the one the visitor selects. `direction` and `type` fall back
 * to the track's when a layout doesn't set them. The track's own fields mirror the
 * default layout (the one that draws `browserSvg`): other pages read those, and
 * `npm run check` keeps them equal.
 */

export type LapRecord = { time: string; driver: string; series?: string; year?: number };
export type Fia = { grade: string; pole?: 'Left' | 'Right' };

type SpecFields = {
  length?: number | null;
  turns?: number | null;
  direction?: string;
  type?: string;
  lapRecord?: LapRecord | null;
  fia?: Fia;
};

export type SpecLayout = SpecFields & { id: string; label?: string; calendarSvgs: string[] };
export type SpecTrack = SpecFields & { browserSvg: string; calendarSvgs: string[]; layouts?: SpecLayout[] };

export type Specs = {
  length: number | null;
  turns: number | null;
  direction: string | null;
  type: string | null;
  lapRecord: LapRecord | null;
  fia: Fia | null;
};

/** The layout a track page opens on: the one that draws the track's `browserSvg`. */
export function defaultLayout<T extends SpecTrack>(track: T): SpecLayout | null {
  return track.layouts?.find(l => l.calendarSvgs.includes(track.browserSvg)) ?? track.layouts?.[0] ?? null;
}

/** The layout that draws a given calendar SVG (what an event is run on); null for a single-layout track. */
export function layoutOfSvg(track: SpecTrack, svg: string | null | undefined): SpecLayout | null {
  return svg ? track.layouts?.find(l => l.calendarSvgs.includes(svg)) ?? null : null;
}

/** Specs of one layout, or of the whole track when it has no layouts. */
export function specsFor(track: SpecTrack, layout?: SpecLayout | null): Specs {
  if (!layout) {
    return {
      length: track.length ?? null,
      turns: track.turns ?? null,
      direction: track.direction ?? null,
      type: track.type ?? null,
      lapRecord: track.lapRecord ?? null,
      fia: track.fia ?? null,
    };
  }
  return {
    length: layout.length ?? null,
    turns: layout.turns ?? null,
    direction: layout.direction ?? track.direction ?? null,
    type: layout.type ?? track.type ?? null,
    lapRecord: layout.lapRecord ?? null,
    fia: layout.fia ?? null,
  };
}
