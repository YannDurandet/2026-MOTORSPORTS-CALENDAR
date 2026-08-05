// ============================================================================
// /api/unsubscribe — Token-based one-click unsubscribe (RFC 8058)
//
// URL format: /api/unsubscribe?email=user@example.com&token=<hmac>
//
// GET  → render confirmation page with Unsubscribe button
// POST → process unsubscribe
//        • body "List-Unsubscribe=One-Click" → RFC 8058 (email client), return 200
//        • any other body OR empty → browser form submit, return HTML confirmation
//
// Required env var: UNSUB_SECRET (any random string ≥ 32 chars)
// Token = base64url(HMAC-SHA256(email, UNSUB_SECRET))
// ============================================================================

export const prerender = false;

import { env } from 'cloudflare:workers';
import { createClient } from '@libsql/client/web';
import type { APIRoute } from 'astro';
import { verifyUnsubToken } from '../../lib/unsub-token';

// ── Shared: mark email as unsubscribed ───────────────────────────────────────

async function doUnsubscribe(email: string, dbUrl: string, dbToken: string): Promise<void> {
  const db = createClient({ url: dbUrl, authToken: dbToken });
  await db.execute({
    sql:  `UPDATE subscribers SET status = 'unsubscribed' WHERE email = ?`,
    args: [email.toLowerCase().trim()],
  });
}

// ── HTML page helpers ─────────────────────────────────────────────────────────

const CSS = `
  body{margin:0;padding:0;background:#0b0f12;font-family:'Courier New',Courier,monospace;color:#c3c6c8;}
  .wrap{max-width:520px;margin:80px auto;padding:0 24px;}
  .brand{font-size:11px;font-weight:700;letter-spacing:.18em;color:#4a7090;text-transform:uppercase;margin-bottom:48px;}
  h1{font-size:20px;font-weight:700;color:#e8f0f5;margin:0 0 16px;letter-spacing:-.01em;}
  p{font-size:14px;line-height:1.8;color:#8a9aaa;margin:0 0 28px;}
  .email{color:#c3c6c8;font-weight:700;}
  .btn{display:inline-block;padding:11px 28px;font-family:'Courier New',Courier,monospace;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;background:#c41e1e;color:#fff;border:none;cursor:pointer;text-decoration:none;}
  .btn:hover{background:#a01818;}
  .done{font-size:14px;color:#4a7090;letter-spacing:.06em;}
  .back{display:block;margin-top:32px;font-size:11px;color:#3a5060;text-decoration:none;letter-spacing:.08em;}
  .back:hover{color:#4a7090;}
`.trim();

function confirmPage(email: string, token: string): Response {
  const safeEmail = email.replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Unsubscribe — From The Pit Wall</title>
<style>${CSS}</style></head><body>
<div class="wrap">
  <div class="brand">DORD Racing — From The Pit Wall</div>
  <h1>Unsubscribe</h1>
  <p>Confirm you'd like to remove <span class="email">${safeEmail}</span> from the weekly briefing.</p>
  <form method="POST" action="/api/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}">
    <button class="btn" type="submit">Confirm unsubscribe</button>
  </form>
  <a href="https://dord.racing" class="back">← dord.racing</a>
</div>
</body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

function donePage(email: string): Response {
  const safeEmail = email.replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Unsubscribed — From The Pit Wall</title>
<style>${CSS}</style></head><body>
<div class="wrap">
  <div class="brand">DORD Racing — From The Pit Wall</div>
  <h1>You're off the grid.</h1>
  <p class="done"><span class="email">${safeEmail}</span> has been removed.</p>
  <p>No more emails. If you ever want back in, <a href="https://dord.racing" style="color:#4a7090;">head to dord.racing</a> and re-subscribe.</p>
  <a href="https://dord.racing" class="back">← dord.racing</a>
</div>
</body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

function errorPage(msg: string, status = 400): Response {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Error — From The Pit Wall</title>
<style>${CSS}</style></head><body>
<div class="wrap">
  <div class="brand">DORD Racing</div>
  <h1>Something went wrong</h1>
  <p>${msg}</p>
  <a href="https://dord.racing" class="back">← dord.racing</a>
</div>
</body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

// ── Route handlers ────────────────────────────────────────────────────────────

export const GET: APIRoute = async ({ url }) => {
  const email = (url.searchParams.get('email') ?? '').trim().toLowerCase();
  const token = url.searchParams.get('token') ?? '';

  const secret = (env as any).UNSUB_SECRET ?? import.meta.env.UNSUB_SECRET ?? '';
  if (!secret) return errorPage('Unsubscribe is not configured.', 500);

  if (!email || !token) return errorPage('Missing email or token.');

  const valid = await verifyUnsubToken(email, token, secret);
  if (!valid) return errorPage('This unsubscribe link is invalid or has expired.');

  return confirmPage(email, token);
};

export const POST: APIRoute = async ({ request, url }) => {
  const email = (url.searchParams.get('email') ?? '').trim().toLowerCase();
  const token = url.searchParams.get('token') ?? '';

  const secret = (env as any).UNSUB_SECRET ?? import.meta.env.UNSUB_SECRET ?? '';
  if (!secret) return new Response('Server misconfiguration', { status: 500 });

  if (!email || !token) return new Response('Missing parameters', { status: 400 });

  const valid = await verifyUnsubToken(email, token, secret);
  if (!valid) return new Response('Invalid token', { status: 403 });

  const dbUrl   = (env as any).TURSO_DATABASE_URL ?? import.meta.env.TURSO_DATABASE_URL;
  const dbToken = (env as any).TURSO_AUTH_TOKEN   ?? import.meta.env.TURSO_AUTH_TOKEN;
  if (!dbUrl || !dbToken) return new Response('Server misconfiguration', { status: 500 });

  try {
    await doUnsubscribe(email, dbUrl, dbToken);
  } catch (err: any) {
    console.error('[unsubscribe] DB error:', err?.message ?? err);
    return new Response('Database error', { status: 500 });
  }

  // RFC 8058: email clients POST body "List-Unsubscribe=One-Click" — return plain 200
  const ct   = request.headers.get('content-type') ?? '';
  const body = ct.includes('application/x-www-form-urlencoded') ? await request.text() : '';
  if (body.includes('List-Unsubscribe=One-Click')) {
    return new Response('Unsubscribed', { status: 200 });
  }

  // Browser form submit — return confirmation page
  return donePage(email);
};
