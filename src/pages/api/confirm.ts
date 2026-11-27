// ============================================================================
// /api/confirm — second step of the newsletter sign-up (double opt-in)
//
// URL format: /api/confirm?email=user@example.com&token=<hmac>
// The link is emailed by /api/subscribe; the token is
// base64url(HMAC-SHA256("confirm:" + email, UNSUB_SECRET)), see src/lib/unsub-token.ts.
//
// GET  → page with a "Confirm" button. GET changes nothing, so a mail scanner
//        that opens links on its own can't subscribe anyone.
// POST → 'pending' becomes 'active'.
//
// Standalone HTML shell shared with /api/unsubscribe: src/lib/standalonePage.ts.
// ============================================================================

export const prerender = false;

import { env } from 'cloudflare:workers';
import { createClient } from '@libsql/client/web';
import type { APIRoute } from 'astro';
import { verifyConfirmToken } from '../../lib/unsub-token';
import { escapeHtml, standalonePage as page } from '../../lib/standalonePage';

const invalid = () => page('Link not valid',
  `<h1>This link is not valid</h1><p>It may be incomplete. Sign up again on dord.racing and use the link in the newest email.</p>`, 400);

async function readParams(url: URL) {
  const email = (url.searchParams.get('email') ?? '').trim().toLowerCase();
  const token = url.searchParams.get('token') ?? '';
  const secret = ((env as any).UNSUB_SECRET ?? import.meta.env.UNSUB_SECRET ?? '') as string;
  const valid = !!secret && !!email && !!token && await verifyConfirmToken(email, token, secret);
  return { email, token, secret, valid };
}

export const GET: APIRoute = async ({ url }) => {
  const { email, token, secret, valid } = await readParams(url);
  if (!secret) return page('Not available', '<h1>Something went wrong</h1><p>Confirmation is not configured.</p>', 500);
  if (!valid) return invalid();
  return page('Confirm your subscription', `
  <h1>Confirm your subscription</h1>
  <p>Start sending the weekly briefing to <span class="email">${escapeHtml(email)}</span>?</p>
  <form method="POST" action="/api/confirm?email=${encodeURIComponent(email)}&amp;token=${encodeURIComponent(token)}">
    <button class="btn" type="submit">Confirm</button>
  </form>`);
};

export const POST: APIRoute = async ({ url }) => {
  const { email, secret, valid } = await readParams(url);
  if (!secret) return page('Not available', '<h1>Something went wrong</h1><p>Confirmation is not configured.</p>', 500);
  if (!valid) return invalid();

  const dbUrl   = (env as any).TURSO_DATABASE_URL ?? import.meta.env.TURSO_DATABASE_URL;
  const dbToken = (env as any).TURSO_AUTH_TOKEN   ?? import.meta.env.TURSO_AUTH_TOKEN;
  if (!dbUrl || !dbToken) return page('Not available', '<h1>Something went wrong</h1><p>Please try again later.</p>', 500);

  try {
    const db = createClient({ url: dbUrl, authToken: dbToken });
    await db.execute({
      sql:  `UPDATE subscribers SET status = 'active', subscribed_at = datetime('now') WHERE email = ? AND status = 'pending'`,
      args: [email],
    });
    const now = await db.execute({ sql: 'SELECT status FROM subscribers WHERE email = ?', args: [email] });
    // Confirmed now or earlier: same answer. Unsubscribed since, or never signed up: ask to sign up again.
    if (now.rows[0]?.status !== 'active') {
      return page('Link expired', `<h1>This link has expired</h1><p>Sign up again on dord.racing and use the link in the newest email.</p>`, 410);
    }
  } catch (err: any) {
    console.error('[confirm] DB error:', err?.message ?? err);
    return page('Not available', '<h1>Something went wrong</h1><p>Please try again later.</p>', 500);
  }

  return page("You're on the grid", `
  <h1>You're on the grid.</h1>
  <p><span class="email">${escapeHtml(email)}</span> will get the weekly briefing. The first one lands before the next race weekend.</p>
  <p>Every email has an unsubscribe link at the bottom.</p>`);
};
