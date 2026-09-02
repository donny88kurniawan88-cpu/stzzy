-- ============================================================
-- MIGRATION 0002 — ROLES
-- Tabel master roles untuk manajemen hak akses.
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL UNIQUE,             -- 'ADMIN' | 'USER' | ...
  description TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Seed default roles
INSERT OR IGNORE INTO roles (name, description) VALUES
  ('ADMIN', 'Akses penuh — manajemen user, bank, pencairan, settings'),
  ('USER',  'Akses terbatas sesuai access control');
