// =============================================================================
// workers/sendBatches.ts — batching and the "already sent" log for the weekly
// newsletter. Kept apart from newsletter.ts so it can be tested with fakes:
// it never touches Resend or Turso itself, the caller passes those in.
//
//  - Recipients already logged for this issue are skipped, so running the send
//    again (cron retry, manual POST) only fills the gaps.
//  - Up to 100 messages per provider call (Resend's batch limit), with a pause
//    between calls to stay under the provider's request rate.
//  - Each batch has an idempotency key derived from the issue and its
//    recipients: if the provider accepted a batch but logging it failed, the
//    next run sends the same batch again and the provider ignores it.
//  - A failed batch is retried when the provider says it is temporary (rate
//    limit, server error). Logs carry counts, never addresses.
// =============================================================================

export interface Outgoing {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  headers: Record<string, string>;
}

export interface BatchResult {
  ok: boolean;
  /** Worth another try (rate limit, timeout, server error). */
  retryable?: boolean;
  error?: string;
}

export interface SendDeps {
  /** Addresses already sent this issue. */
  alreadySent(): Promise<Set<string>>;
  sendBatch(batch: Outgoing[], idempotencyKey: string): Promise<BatchResult>;
  /** Log a delivered batch. May throw: the send carries on. */
  recordSent(emails: string[]): Promise<void>;
  sleep(ms: number): Promise<void>;
  log(message: string): void;
}

export interface SendOptions {
  /** Identifies the issue, e.g. the Friday of the weekend: "2026-11-13". */
  issue: string;
  batchSize?: number;
  pauseMs?: number;
  retries?: number;
}

export interface SendSummary { sent: number; skipped: number; failed: number }

async function keyFor(issue: string, emails: string[]): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(emails.join('\n')));
  const hex = [...new Uint8Array(digest)].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join('');
  return `newsletter-${issue}-${hex}`;
}

export async function sendInBatches(
  recipients: string[],
  build: (to: string) => Promise<Outgoing>,
  deps: SendDeps,
  { issue, batchSize = 100, pauseMs = 600, retries = 2 }: SendOptions,
): Promise<SendSummary> {
  const done = await deps.alreadySent();
  const todo = recipients.filter(e => !done.has(e));
  const summary: SendSummary = { sent: 0, skipped: recipients.length - todo.length, failed: 0 };

  for (let i = 0; i < todo.length; i += batchSize) {
    const emails = todo.slice(i, i + batchSize);
    const batch = await Promise.all(emails.map(build));
    const key = await keyFor(issue, emails);

    let result: BatchResult = { ok: false, error: 'not sent' };
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) await deps.sleep(2000 * attempt);
      result = await deps.sendBatch(batch, key);
      if (result.ok || !result.retryable) break;
    }

    if (result.ok) {
      summary.sent += emails.length;
      try {
        await deps.recordSent(emails);
      } catch (err: any) {
        deps.log(`could not log a batch of ${emails.length} as sent (${err?.message ?? err}); a re-run will resend it under the same idempotency key`);
      }
    } else {
      summary.failed += emails.length;
      deps.log(`batch of ${emails.length} failed: ${result.error ?? 'unknown error'}`);
    }

    if (i + batchSize < todo.length) await deps.sleep(pauseMs);
  }
  return summary;
}
