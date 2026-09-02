-- ============================================================
-- MIGRATION 0003 — SESSIONS
-- Tabel sessions untuk token autentikasi (alternatif/pendamping KV).
-- ============================================================

CREATE TABLE IF NOT EXISTS sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  token       TEXT    NOT NULL UNIQUE,
  username    TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  expires_at  TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_token    ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_username ON sessions(username);
