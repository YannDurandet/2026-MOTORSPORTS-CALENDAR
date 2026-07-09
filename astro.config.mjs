import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://dord.racing',
  base: '/',
  adapter: cloudflare(),
  integrations: [sitemap()],
  build: {
    format: 'file',
  },
});
