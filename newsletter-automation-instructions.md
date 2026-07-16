# DORD — Automate Weekly Newsletter via Cloudflare Worker Cron
## Instructions for Coding Claude

---

## CONTEXT

There's an existing `send-newsletter.ts` script that sends the weekly newsletter via Resend. The goal is to have Cloudflare run it automatically every Monday morning — no manual trigger needed.

---

## WHAT TO BUILD

A Cloudflare Worker with a cron trigger set to `0 8 * * 1` (every Monday 8:00 UTC).

The Worker calls the same logic as `send-newsletter.ts`.

---

## STEP 1 — Read the existing script first

Read `send-newsletter.ts` in full before doing anything else. Understand:
- What data it fetches (race calendar? hardcoded content?)
- How it calls Resend (direct API fetch or Resend SDK?)
- What env vars it uses (RESEND_API_KEY, subscriber list ID, etc.)
- Any Node.js-specific APIs it uses (fs, path — these won't work in CF Workers)

---

## STEP 2 — Create the Worker file

Create `workers/newsletter.ts`:

```ts
export default {
  // HTTP handler (optional — useful for manual trigger in dev)
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
    // Optional: add a secret header check so only you can trigger manually
    if (request.headers.get('X-Cron-Secret') !== env.CRON_SECRET) {
      return new Response('Unauthorized', { status: 401 });
    }
    await sendNewsletter(env);
    return new Response('Newsletter sent', { status: 200 });
  },

  // Cron handler — runs on schedule
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(sendNewsletter(env));
  },
};

interface Env {
  RESEND_API_KEY: string;
  CRON_SECRET: string;
  // add any other env vars the script needs
}

async function sendNewsletter(env: Env): Promise<void> {
  // PORT THE LOGIC FROM send-newsletter.ts HERE
  // Replace any process.env.X with env.X
  // Replace any Node.js fs/path calls with fetch() equivalents
  // Resend SDK or direct fetch both work fine in CF Workers
}
```

**Important:** If the existing script uses `import { Resend } from 'resend'` (the npm SDK), that works in CF Workers. If it reads files from disk with `fs`, those calls need to be replaced with `fetch()` against your own API endpoints.

---

## STEP 3 — Add `wrangler.toml`

If a `wrangler.toml` already exists at the project root, add the scheduled trigger to it. If not, create it:

```toml
name = "dord-newsletter"
main = "workers/newsletter.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[triggers]
crons = ["0 8 * * 1"]
```

`nodejs_compat` flag allows most Node.js APIs including the Resend SDK to work in the Worker environment.

---

## STEP 4 — Set secrets in Cloudflare dashboard

Do NOT commit API keys to the repo. After deploying, run:

```bash
wrangler secret put RESEND_API_KEY
# paste the key when prompted

wrangler secret put CRON_SECRET
# paste any random string — used to protect the manual HTTP trigger
```

Or set them in Cloudflare Dashboard → Workers → dord-newsletter → Settings → Variables.

---

## STEP 5 — Deploy

```bash
wrangler deploy
```

Verify in Cloudflare Dashboard → Workers → dord-newsletter → Triggers → Cron Triggers. You should see `0 8 * * 1` listed.

---

## STEP 6 — Test without waiting for Monday

In the Cloudflare Dashboard:
Workers → dord-newsletter → Triggers → Cron Triggers → click **Test** next to the cron.

Or trigger it via HTTP (uses the fetch handler):
```bash
curl -X POST https://dord-newsletter.YOUR_SUBDOMAIN.workers.dev \
  -H "X-Cron-Secret: YOUR_CRON_SECRET"
```

---

## TIMING NOTE

`0 8 * * 1` = Monday 08:00 UTC = Monday 10:00 Paris time (CEST in summer).

If you'd rather it send at a different time, adjust accordingly:
- Monday 7:00 UTC = `0 7 * * 1`  
- Monday 9:00 UTC = `0 9 * * 1`

---

## IF THE NEWSLETTER CONTENT IS HARDCODED

If `send-newsletter.ts` currently generates content manually (you write the text each week and run the script), then the automation won't be "fully" automated — you'd still need to write the content.

In that case, consider a two-step approach:
1. **This week:** automate the *sending* mechanics — the Worker reads a draft from a Cloudflare KV store or a JSON file in the repo, sends whatever is there
2. **Later:** auto-generate the content from the race calendar data (next weekend's events, last weekend's results from your data layer)

If you want the content auto-generated too, say so and I'll write separate instructions for that.
