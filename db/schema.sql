-- dord.racing — Turso (SQLite) schema
-- Run once against your Turso database:
--   npx turso db shell dord-subscribers < db/schema.sql

CREATE TABLE IF NOT EXISTS subscribers (
  id            INTEGER  PRIMARY KEY AUTOINCREMENT,
  email         TEXT     NOT NULL UNIQUE,
  status        TEXT     NOT NULL DEFAULT 'active',   -- 'active' | 'unsubscribed'
  subscribed_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Index for duplicate checks and future unsubscribe lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers (email);

-- Weekly newsletter: which address got which issue (issue = the Friday of the
-- weekend, YYYY-MM-DD). Lets a second run of the same issue send only to the
-- addresses the first one missed. workers/newsletter.ts creates it if missing.
CREATE TABLE IF NOT EXISTS newsletter_sends (
  week    TEXT     NOT NULL,
  email   TEXT     NOT NULL,
  sent_at DATETIME NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (week, email)
);
