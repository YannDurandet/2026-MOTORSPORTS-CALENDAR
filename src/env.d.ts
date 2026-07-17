/// <reference types="astro/client" />

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
