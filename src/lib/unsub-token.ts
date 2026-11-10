/**
 * src/lib/unsub-token.ts
 * HMAC-SHA256 token helpers for the newsletter's unsubscribe and confirm links.
 * Uses the Web Crypto API — works in Cloudflare Workers edge runtime.
 *
 * Both use UNSUB_SECRET. The unsubscribe token signs the bare address (its
 * format is shared with workers/newsletter.ts and scripts/test-unsub-token.mjs,
 * so it must not change); the confirm token signs "confirm:<address>", so one
 * can never be used as the other.
 */

async function sign(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig   = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  const bytes = new Uint8Array(sig);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** Constant-time comparison, so a wrong token takes as long as a right one. */
function sameToken(expected: string, token: string): boolean {
  if (expected.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  return diff === 0;
}

const normalise = (email: string) => email.toLowerCase().trim();

export async function computeUnsubToken(email: string, secret: string): Promise<string> {
  return sign(normalise(email), secret);
}

export async function verifyUnsubToken(email: string, token: string, secret: string): Promise<boolean> {
  try {
    return sameToken(await computeUnsubToken(email, secret), token);
  } catch { return false; }
}

export function unsubUrl(email: string, token: string): string {
  return `https://dord.racing/api/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
}

/** Token for the "confirm your subscription" link sent on sign-up. */
export async function computeConfirmToken(email: string, secret: string): Promise<string> {
  return sign(`confirm:${normalise(email)}`, secret);
}

export async function verifyConfirmToken(email: string, token: string, secret: string): Promise<boolean> {
  try {
    return sameToken(await computeConfirmToken(email, secret), token);
  } catch { return false; }
}

export function confirmUrl(email: string, token: string): string {
  return `https://dord.racing/api/confirm?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
}
