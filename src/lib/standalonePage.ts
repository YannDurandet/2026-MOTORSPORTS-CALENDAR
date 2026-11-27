/**
 * The one standalone HTML page shell for token-bearing API pages
 * (/api/confirm, /api/unsubscribe) — ADR-0001.
 *
 * These pages sit outside the site's design tokens on purpose (they are opened
 * from email links, where the site CSS isn't loaded), but the shell itself —
 * CSS, escaping, document frame, noindex + no-store headers — is shared so the
 * two pages can never drift apart. Both carry per-recipient tokens in the URL,
 * so every page built here is `noindex` and `private, no-store`.
 */

export const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CSS = `
  body{margin:0;padding:0;background:#0b0f12;font-family:'Courier New',Courier,monospace;color:#c3c6c8;}
  .wrap{max-width:520px;margin:80px auto;padding:0 24px;}
  .brand{font-size:11px;font-weight:700;letter-spacing:.18em;color:#4a7090;text-transform:uppercase;margin-bottom:48px;}
  h1{font-size:20px;font-weight:700;color:#e8f0f5;margin:0 0 16px;letter-spacing:-.01em;}
  p{font-size:14px;line-height:1.8;color:#8a9aaa;margin:0 0 28px;}
  .email{color:#c3c6c8;font-weight:700;}
  .btn{display:inline-block;padding:11px 28px;font-family:'Courier New',Courier,monospace;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;background:#c41e1e;color:#fff;border:none;cursor:pointer;text-decoration:none;}
  .btn:hover{background:#a01818;}
  .btn:focus-visible{outline:2px solid #e8f0f5;outline-offset:2px;}
  .done{font-size:14px;color:#4a7090;letter-spacing:.06em;}
  .back{display:block;margin-top:32px;font-size:11px;color:#8a9aaa;text-decoration:none;letter-spacing:.08em;}
  .back:hover{color:#c3c6c8;}
`.trim();

/**
 * A complete standalone page. `title` is the part before "— From The Pit Wall";
 * `body` is the inner HTML of the wrap (escape untrusted values with escapeHtml).
 */
export function standalonePage(title: string, body: string, status = 200): Response {
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${title} — From The Pit Wall</title>
<style>${CSS}</style></head><body>
<main class="wrap">
  <div class="brand">DORD Racing — From The Pit Wall</div>
  ${body}
  <a href="https://dord.racing" class="back">← dord.racing</a>
</main>
</body></html>`;
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store' },
  });
}
