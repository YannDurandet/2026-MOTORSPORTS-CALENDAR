import type { APIRoute } from 'astro';
import seriesData from '../../../data/series.json';
import { withTbcFlags } from '../../lib/tbc';

export const GET: APIRoute = () => {
  // Races whose start time isn't published carry `tbc: true` (see src/lib/tbc.ts).
  return new Response(JSON.stringify(withTbcFlags(seriesData)), {
    headers: { 'Content-Type': 'application/json' }
  });
};
