import type { APIRoute } from 'astro';
import tracksData from '../../../data/tracks.json';

export const GET: APIRoute = () => {
  return new Response(JSON.stringify(tracksData), {
    headers: { 'Content-Type': 'application/json' }
  });
};
