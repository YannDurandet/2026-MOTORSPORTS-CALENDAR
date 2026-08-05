/**
 * src/lib/unsub-token.ts
 * HMAC-SHA256 token helpers for the unsubscribe flow.
 * Uses the Web Crypto API — works in Cloudflare Workers edge runtime.
 */

export async function computeUnsubToken(email: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig   = await crypto.subtle.sign('HMAC', key, enc.encode(email.toLowerCase().trim()));
  const bytes = new Uint8Array(sig);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function verifyUnsubToken(email: string, token: string, secret: string): Promise<boolean> {
  try {
    const expected = await computeUnsubToken(email, secret);
    if (expected.length !== token.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
    return diff === 0;
  } catch { return false; }
}

export function unsubUrl(email: string, token: string): string {
  return `https://dord.racing/api/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
}
