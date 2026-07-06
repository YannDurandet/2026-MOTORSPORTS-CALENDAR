import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://dord.racing',
  base: '/',
  adapter: cloudflare(),
  build: {
    format: 'file',
  },
});
