/**
 * Search results cut titles at roughly 60 characters. Templates pass their
 * candidates from most to least descriptive; the first that fits wins, and
 * the last one is trimmed if nothing does.
 */
export const TITLE_MAX = 60;

export function fitTitle(candidates: string[], max = TITLE_MAX): string {
  for (const c of candidates) if (c.length <= max) return c;
  const last = candidates[candidates.length - 1] ?? '';
  return last.length <= max ? last : `${last.slice(0, max - 1).trimEnd()}…`;
}
