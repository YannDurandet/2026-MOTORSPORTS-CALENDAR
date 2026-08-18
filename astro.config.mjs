import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://dord.racing',
  base: '/',
  adapter: cloudflare(),
  integrations: [sitemap()],
  // /events has no page of its own — send it to the current season index.
  redirects: {
    '/events': '/events/2026',
  },
  build: {
    format: 'file',
  },
});
