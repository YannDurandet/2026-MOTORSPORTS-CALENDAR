/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** "true" turns on Awin tracking. Read at build time: set it as a GitHub Actions variable (deploy.yml), not in Cloudflare. */
  readonly PUBLIC_AFFILIATE_LINKS_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Env {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL: string;
  CRON_SECRET: string;
}

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
