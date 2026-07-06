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


