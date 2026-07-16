import type { APIRoute } from 'astro';
import calendarData from '../../../data/calendar.json';

export const GET: APIRoute = () => {
  return new Response(JSON.stringify(calendarData), {
    headers: { 'Content-Type': 'application/json' }
  });
};
