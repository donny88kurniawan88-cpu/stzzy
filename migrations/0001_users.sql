-- ============================================================
-- MIGRATION 0001 — USERS
-- Tabel utama untuk autentikasi & manajemen user.
-- Digunakan oleh seluruh rute /api/login, /api/users, /api/register,
-- /api/user/password, /api/user/profile di src/index.js.
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  username    TEXT    NOT NULL UNIQUE,
  password    TEXT    NOT NULL,
  role        TEXT    NOT NULL DEFAULT 'USER',
  status      TEXT    NOT NULL DEFAULT 'PENDING',   -- 'ACTIVE' | 'PENDING'
  access      TEXT,                                  -- JSON string access control
  granted_by  TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Index untuk pencarian user berdasarkan username (sudah otomatis unique)
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role   ON users(role);
