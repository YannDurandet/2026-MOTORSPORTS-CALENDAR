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
// SECRETS (Cloudflare Workers → the site Worker → Settings → Variables and Secrets):
//   TURSO_DATABASE_URL   libsql://your-db-name.turso.io
//   TURSO_AUTH_TOKEN     your-turso-auth-token
//   RESEND_API_KEY       re_xxxxxxxxxxxxxxxxxxxx
//   RESEND_FROM_EMAIL    DORD Racing <weekly@dord.racing>
//
// ============================================================================

export const prerender = false;

import { env } from 'cloudflare:workers';
import { createClient } from '@libsql/client/web';
import { Resend } from 'resend';
import type { APIRoute } from 'astro';
import { computeUnsubToken, unsubUrl, computeConfirmToken, confirmUrl } from '../../lib/unsub-token';

const WELCOME_TEXT = `Welcome to From The Pit Wall.

Every week: what's racing, where it is, and why the next three days are going to be chaos. All 26 series, no filler.

First briefing lands before the next race weekend.

— The Department of Racing Drivers
dord.racing

Unsubscribe: https://dord.racing/api/unsubscribe?email={EMAIL}&token={TOKEN}
(This link is personalised — do not share it.)`;

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
              <p style="margin:0 0 20px;font-family:'Courier New',Courier,monospace;font-size:14px;line-height:1.8;color:#c3c6c8;">Every week: what's racing, where it is, and why the next three days are going to be chaos. All 26 series, no filler.</p>
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

// ── Confirmation (double opt-in) ─────────────────────────────────────────────
// With UNSUB_SECRET and RESEND_API_KEY set, a sign-up is stored as 'pending'
// and only becomes 'active' when the address's owner opens the link we email
// (/api/confirm). The weekly send only reads 'active' rows. Without the secret
// the route keeps the old behaviour (active at once, welcome email), so a
// missing secret never breaks sign-up; it is logged instead.
//
// Every success answers with the same message, so the form can't be used to
// find out whether an address is subscribed. A pending address gets at most
// one confirmation email per hour.
const CONFIRM_MESSAGE = "Almost there: check your inbox and confirm your address to start receiving the briefing.";
const LEGACY_MESSAGE  = "You're in. First briefing lands before the weekend.";

function confirmText(link: string): string {
  return `Confirm your subscription to From The Pit Wall.

Someone (hopefully you) asked to receive the weekly DORD racing briefing at this address. To confirm, open this link:

${link}

If it wasn't you, ignore this email: nothing will be sent to you.

— The Department of Racing Drivers
dord.racing`;
}

function confirmHtml(link: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Confirm your subscription</title></head>
<body style="margin:0;padding:0;background:#0b0f12;font-family:'Courier New',Courier,monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0f12;">
    <tr><td align="center" style="padding:48px 24px;">
      <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">
        <tr><td style="padding-bottom:40px;border-bottom:1px solid #1e2830;">
          <span style="font-size:13px;font-weight:700;letter-spacing:0.18em;color:#4a7090;text-transform:uppercase;">DORD RACING</span>
        </td></tr>
        <tr><td style="padding-top:36px;">
          <p style="margin:0 0 20px;font-size:14px;line-height:1.8;color:#c3c6c8;">Someone (hopefully you) asked to receive From The Pit Wall, the weekly DORD racing briefing, at this address.</p>
          <p style="margin:0 0 32px;"><a href="${link}" style="display:inline-block;padding:11px 28px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;background:#c41e1e;color:#ffffff;text-decoration:none;">Confirm my subscription</a></p>
          <p style="margin:0 0 40px;font-size:12px;line-height:1.8;color:#8a9aaa;">If it wasn't you, ignore this email: nothing will be sent to you.</p>
        </td></tr>
        <tr><td style="border-top:1px solid #1e2830;padding-top:28px;">
          <p style="margin:0 0 4px;font-size:13px;line-height:1.6;color:#8a9aaa;">— The Department of Racing Drivers</p>
          <a href="https://dord.racing" style="font-size:13px;color:#4a7090;text-decoration:none;">dord.racing</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// GET is not supported — return 405 so browsers/crawlers get a clear signal.
export function GET(): Response {
  return new Response('Method Not Allowed', {
    status: 405,
    headers: { Allow: 'POST', 'Content-Type': 'text/plain' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // ── Guard: confirm required env vars are present ───────────────────────
    const dbUrl     = (env as any).TURSO_DATABASE_URL  ?? import.meta.env.TURSO_DATABASE_URL;
    const dbToken   = (env as any).TURSO_AUTH_TOKEN    ?? import.meta.env.TURSO_AUTH_TOKEN;
    const resendKey = (env as any).RESEND_API_KEY      ?? import.meta.env.RESEND_API_KEY;
    const fromEmail = ((env as any).RESEND_FROM_EMAIL  ?? import.meta.env.RESEND_FROM_EMAIL)
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
    // 254 characters is the longest address SMTP can deliver.
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Invalid email address.' }, 400);
    }

    // ── Connect to Turso ───────────────────────────────────────────────────
    const db = createClient({ url: dbUrl, authToken: dbToken });

    const unsubSecret = ((env as any).UNSUB_SECRET ?? import.meta.env.UNSUB_SECRET ?? '') as string;

    // ── Confirmation mode (double opt-in) ─────────────────────────────────
    if (unsubSecret && resendKey) {
      const found = await db.execute({
        sql:  `SELECT status, subscribed_at >= datetime('now', '-1 hour') AS recent FROM subscribers WHERE email = ?`,
        args: [email],
      });
      const row = found.rows[0];
      // Already subscribed, or a confirmation went out within the hour: say the
      // same thing as for a new address and send nothing.
      if (row && (row.status === 'active' || (row.status === 'pending' && Number(row.recent) === 1))) {
        return json({ ok: true, pending: true, message: CONFIRM_MESSAGE }, 200);
      }

      // Send first: if the email can't go out, nothing is stored and the
      // visitor can simply try again.
      const link = confirmUrl(email, await computeConfirmToken(email, unsubSecret));
      const { error: sendError } = await new Resend(resendKey).emails.send({
        from:    fromEmail,
        to:      email,
        subject: 'Confirm your subscription to From The Pit Wall',
        text:    confirmText(link),
        html:    confirmHtml(link),
      });
      if (sendError) {
        console.error('[subscribe] Resend error (confirmation):', sendError);
        return json({ error: "We couldn't send the confirmation email. Please try again in a moment." }, 502);
      }

      if (row) {
        // An unsubscribed address goes back to 'pending', never straight to 'active'.
        await db.execute({
          sql:  `UPDATE subscribers SET status = 'pending', subscribed_at = datetime('now') WHERE email = ? AND status != 'active'`,
          args: [email],
        });
      } else {
        try {
          await db.execute({
            sql:  "INSERT INTO subscribers (email, status) VALUES (?, 'pending')",
            args: [email],
          });
        } catch (err: any) {
          // A concurrent double-submit inserted it first: the row exists, which is all we need.
          if (!String(err?.message ?? '').includes('UNIQUE')) throw err;
        }
      }
      return json({ ok: true, pending: true, message: CONFIRM_MESSAGE }, 200);
    }

    // ── Without the secret: old behaviour (active at once) ────────────────
    if (!unsubSecret) console.error('[subscribe] UNSUB_SECRET is not set: sign-ups are activated without confirmation');

    // ── Duplicate / reactivation check ────────────────────────────────────
    const existing = await db.execute({
      sql:  'SELECT id, status FROM subscribers WHERE email = ?',
      args: [email],
    });

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      if (row.status === 'active') {
        return json({ ok: true, message: LEGACY_MESSAGE }, 200);
      }
      // Reactivate previously unsubscribed address
      await db.execute({
        sql:  `UPDATE subscribers SET status = 'active' WHERE email = ?`,
        args: [email],
      });
      return json({ ok: true, message: LEGACY_MESSAGE }, 200);
    }

    // ── Insert ─────────────────────────────────────────────────────────────
    try {
      await db.execute({
        sql:  "INSERT INTO subscribers (email, status) VALUES (?, 'active')",
        args: [email],
      });
    } catch (err: any) {
      // Concurrent double-submit can slip past the SELECT above; the UNIQUE
      // constraint catches it — treat as "already subscribed", not an error.
      if (String(err?.message ?? '').includes('UNIQUE')) {
        return json({ ok: true, message: LEGACY_MESSAGE }, 200);
      }
      throw err;
    }

    // ── Welcome email ──────────────────────────────────────────────────────
    if (resendKey) {
      try {
        const token       = unsubSecret ? await computeUnsubToken(email, unsubSecret) : '';
        const unsubLink   = token
          ? unsubUrl(email, token)
          : `mailto:weekly@dord.racing?subject=unsubscribe`;
        const welcomeText = WELCOME_TEXT.replace(
          'Unsubscribe: https://dord.racing/api/unsubscribe?email={EMAIL}&token={TOKEN}\n(This link is personalised — do not share it.)',
          `Unsubscribe: ${unsubLink}`,
        );
        const welcomeHtml = WELCOME_HTML.replace(
          'To unsubscribe, reply with "unsubscribe" in the subject line.',
          `<a href="${unsubLink}" style="color:#2a3540;">Unsubscribe</a>`,
        );
        const resend = new Resend(resendKey);
        const { error: resendError } = await resend.emails.send({
          from:    fromEmail,
          to:      email,
          subject: "You're on the grid.",
          text:    welcomeText,
          html:    welcomeHtml,
          headers: token ? {
            'List-Unsubscribe':      `<mailto:weekly@dord.racing?subject=unsubscribe>, <${unsubLink}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          } : {},
        });
        if (resendError) console.error('[subscribe] Resend error:', resendError);
      } catch (err) {
        console.error('[subscribe] Resend threw:', err);
      }
    }

    return json({ ok: true, message: LEGACY_MESSAGE }, 200);

  } catch (err: any) {
    // Log details server-side only — internal messages (DB errors, URLs)
    // must not reach the client.
    console.error('[subscribe] Unhandled error:', err?.message ?? err);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
};

// ── Helper ─────────────────────────────────────────────────────────────────
function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
