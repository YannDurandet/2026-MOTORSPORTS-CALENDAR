import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://dord.racing',
  base: '/',
  adapter: cloudflare(),
  integrations: [
    sitemap({
      // Keep noindex and redirect-only routes out of the sitemap. Submitting a
      // URL while also serving it `noindex` is a contradiction Google resolves
      // by trusting neither signal.
      filter: (page) => {
        const p = new URL(page).pathname;
        if (p.startsWith('/embed/')) return false;          // <meta robots=noindex>
        if (/^\/(ig|x|yd)\/?$/.test(p)) return false;       // 301s to / with UTM tags
        return true;
      },
    }),
  ],
  // /events has no page of its own — send it to the current season index.
  redirects: {
    '/events': '/events/2026',
  },
  build: {
    format: 'file',
  },
});
