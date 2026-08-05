#!/usr/bin/env node
/**
 * test-unsub-token.mjs — Generate and verify unsubscribe tokens locally.
 *
 * Usage:
 *   UNSUB_SECRET=my-secret node scripts/test-unsub-token.mjs gen user@example.com
 *   UNSUB_SECRET=my-secret node scripts/test-unsub-token.mjs verify user@example.com <token>
 *
 * The secret must match the UNSUB_SECRET env var set in Cloudflare Workers.
 */

const secret = process.env.UNSUB_SECRET;
const [,, cmd, email, token] = process.argv;

if (!secret) {
  console.error('Error: UNSUB_SECRET env var is not set.');
  process.exit(1);
}

if (!cmd || !email) {
  console.error('Usage: UNSUB_SECRET=xxx node scripts/test-unsub-token.mjs gen|verify <email> [token]');
  process.exit(1);
}

async function computeToken(email, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig   = await crypto.subtle.sign('HMAC', key, enc.encode(email.toLowerCase().trim()));
  const bytes = new Uint8Array(sig);
  return Buffer.from(bytes).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

const normalised = email.toLowerCase().trim();
const computed   = await computeToken(normalised, secret);

if (cmd === 'gen') {
  const url = `https://dord.racing/api/unsubscribe?email=${encodeURIComponent(normalised)}&token=${encodeURIComponent(computed)}`;
  console.log('Email: ', normalised);
  console.log('Token: ', computed);
  console.log('URL:   ', url);

} else if (cmd === 'verify') {
  if (!token) {
    console.error('Error: token argument is required for verify.');
    process.exit(1);
  }
  const match = computed === token;
  console.log(match ? '✓ Token is valid' : '✗ Token is INVALID');
  if (!match) {
    console.log('Expected:', computed);
    console.log('Got:     ', token);
    process.exit(1);
  }

} else {
  console.error(`Unknown command "${cmd}". Use gen or verify.`);
  process.exit(1);
}
