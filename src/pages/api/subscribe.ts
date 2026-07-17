// ============================================================================
// /api/subscribe — Newsletter signup endpoint
// ============================================================================
//
// SETUP CHECKLIST (one-time):
//   [x] Server adapter added (astro.config.mjs → @astrojs/cloudflare)
//   [x] Turso DB created and schema applied
//   [x] TURSO_DATABASE_URL added to deployment env vars (Cloudflare Workers → Settings → Variables)
//   [x] TURSO_AUTH_TOKEN added to deployment env vars
//   [x] RESEND_API_KEY added to deployment env vars
//   [x] RESEND_FROM_EMAIL added to deployment env vars
//
// ENV VARS (Cloudflare Pages → Settings → Environment Variables):
//   TURSO_DATABASE_URL   libsql://your-db-name.turso.io
//   TURSO_AUTH_TOKEN     your-turso-auth-token
//   RESEND_API_KEY       re_xxxxxxxxxxxxxxxxxxxx
//   RESEND_FROM_EMAIL    DORD Racing <weekly@dord.racing>
//
// ============================================================================

export const prerender = false;

// Use the /web build — required for Cloudflare Workers (no Node.js APIs).
import { createClient } from '@libsql/client/web';
import { Resend } from 'resend';
import type { APIRoute } from 'astro';

const WELCOME_TEXT = `Welcome to From The Pit Wall.

Every week: what's racing, where it is, and why the next three days are going to be chaos. All 25 series, no filler.

First briefing lands before the next race weekend.

— The Department of Racing Drivers
dord.racing

To unsubscribe, reply with "unsubscribe" in the subject line.`;

const WELCOME_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>You're on the grid.</title>
</head>
<body style="margin:0;padding:0;background:#0b0f12;font-family:'Courier New',Courier,monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0f12;">
    <tr>
      <td align="center" style="padding:48px 24px;">
        <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">

          <!-- Wordmark -->
          <tr>
            <td style="padding-bottom:40px;border-bottom:1px solid #1e2830;">
              <span style="font-family:'Courier New',Courier,monospace;font-size:13px;font-weight:700;letter-spacing:0.18em;color:#4a7090;text-transform:uppercase;">DORD RACING</span>
            </td>
          </tr>

          <!-- Headline -->
          <tr>
            <td style="padding-top:36px;padding-bottom:28px;">
              <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:11px;font-weight:700;letter-spacing:0.14em;color:#4a7090;text-transform:uppercase;">FROM THE PIT WALL</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td>
              <p style="margin:0 0 20px;font-family:'Courier New',Courier,monospace;font-size:14px;line-height:1.8;color:#c3c6c8;">Welcome to From The Pit Wall.</p>
              <p style="margin:0 0 20px;font-family:'Courier New',Courier,monospace;font-size:14px;line-height:1.8;color:#c3c6c8;">Every week: what's racing, where it is, and why the next three days are going to be chaos. All 25 series, no filler.</p>
              <p style="margin:0 0 40px;font-family:'Courier New',Courier,monospace;font-size:14px;line-height:1.8;color:#c3c6c8;">First briefing lands before the next race weekend.</p>
            </td>
          </tr>

          <!-- Sign-off -->
          <tr>
            <td style="border-top:1px solid #1e2830;padding-top:28px;">
              <p style="margin:0 0 4px;font-family:'Courier New',Courier,monospace;font-size:13px;line-height:1.6;color:#8a9aaa;">— The Department of Racing Drivers</p>
              <a href="https://dord.racing" style="font-family:'Courier New',Courier,monospace;font-size:13px;color:#4a7090;text-decoration:none;">dord.racing</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:36px;">
              <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#2a3540;line-height:1.6;">To unsubscribe, reply with "unsubscribe" in the subject line.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// GET is not supported — return 405 so browsers/crawlers get a clear signal.
export function GET(): Response {
  return new Response('Method Not Allowed', {
    status: 405,
    headers: { Allow: 'POST', 'Content-Type': 'text/plain' },
  });
}

export const POST: APIRoute = async ({ request, locals }) => {
  // ── Guard: confirm required env vars are present ───────────────────────
  // Prefer Cloudflare runtime env (secrets set via dashboard/wrangler),
  // fall back to import.meta.env for local dev.
  const runtimeEnv = (locals as any)?.runtime?.env ?? {};
  const dbUrl      = (runtimeEnv.TURSO_DATABASE_URL  ?? import.meta.env.TURSO_DATABASE_URL)  as string | undefined;
  const dbToken    = (runtimeEnv.TURSO_AUTH_TOKEN    ?? import.meta.env.TURSO_AUTH_TOKEN)    as string | undefined;
  const resendKey  = (runtimeEnv.RESEND_API_KEY      ?? import.meta.env.RESEND_API_KEY)      as string | undefined;
  const fromEmail  = ((runtimeEnv.RESEND_FROM_EMAIL  ?? import.meta.env.RESEND_FROM_EMAIL)   as string | undefined)
                     ?? 'DORD Racing <weekly@dord.racing>';

  if (!dbUrl || !dbToken) {
    console.error('[subscribe] Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
    return json({ error: 'Server configuration error.' }, 500);
  }

  // ── Parse body ─────────────────────────────────────────────────────────
  let email: string;
  try {
    const body = await request.json();
    email = (typeof body?.email === 'string' ? body.email : '').trim().toLowerCase();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  // ── Validate email ─────────────────────────────────────────────────────
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Invalid email address.' }, 400);
  }

  // ── Connect to Turso ───────────────────────────────────────────────────
  const db = createClient({ url: dbUrl, authToken: dbToken });

  // ── Duplicate check ────────────────────────────────────────────────────
  const existing = await db.execute({
    sql:  'SELECT id FROM subscribers WHERE email = ?',
    args: [email],
  });

  if (existing.rows.length > 0) {
    return json({ ok: true, message: "You're already on the list." }, 200);
  }

  // ── Insert ─────────────────────────────────────────────────────────────
  await db.execute({
    sql:  'INSERT INTO subscribers (email) VALUES (?)',
    args: [email],
  });

  // ── Welcome email ──────────────────────────────────────────────────────
  // Fire-and-forget: a Resend failure must never break the subscription.
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      const { error: resendError } = await resend.emails.send({
        from:    fromEmail,
        to:      email,
        subject: "You're on the grid.",
        text:    WELCOME_TEXT,
        html:    WELCOME_HTML,
      });
      if (resendError) {
        console.error('[subscribe] Resend error:', resendError);
      }
    } catch (err) {
      console.error('[subscribe] Resend threw:', err);
    }
  } else {
    console.warn('[subscribe] RESEND_API_KEY not set — welcome email skipped.');
  }
  // ──────────────────────────────────────────────────────────────────────

  return json({ ok: true, message: "You're in. First briefing lands before the weekend." }, 200);
};

// ── Helper ─────────────────────────────────────────────────────────────────
function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
