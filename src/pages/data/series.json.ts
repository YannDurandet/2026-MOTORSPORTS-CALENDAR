import type { APIRoute } from 'astro';
import seriesData from '../../../data/series.json';

export const GET: APIRoute = () => {
  return new Response(JSON.stringify(seriesData), {
    headers: { 'Content-Type': 'application/json' }
  });
};
