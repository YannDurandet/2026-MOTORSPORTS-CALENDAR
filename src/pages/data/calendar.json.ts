import type { APIRoute } from 'astro';
import calendarData from '../../../data/calendar.json';
import { jsonResponse } from '../../lib/http';

export const GET: APIRoute = () => jsonResponse(calendarData);
