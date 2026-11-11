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

// The site's own token code, so this test can't pass while the site disagrees.
// Node runs the .ts file directly from 22.18 on.
let computeUnsubToken, unsubUrl;
try {
  ({ computeUnsubToken, unsubUrl } = await import('../src/lib/unsub-token.ts'));
} catch (err) {
  console.error('Could not load src/lib/unsub-token.ts (' + err.message + ').');
  console.error('This script needs Node 22.18 or later, which runs TypeScript files directly.');
  process.exit(1);
}

const normalised = email.toLowerCase().trim();
const computed   = await computeUnsubToken(normalised, secret);

if (cmd === 'gen') {
  const url = unsubUrl(normalised, computed);
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
