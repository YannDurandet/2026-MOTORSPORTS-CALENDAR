import type { APIRoute } from 'astro';
import tracksData from '../../../data/tracks.json';
import { jsonResponse } from '../../lib/http';

export const GET: APIRoute = () => jsonResponse(tracksData);
