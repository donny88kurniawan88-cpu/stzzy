-- ============================================================
-- MIGRATION 0006 — PENCAIRAN
-- Tabel pencairan untuk saldo kas / pencairan harian.
-- Digunakan oleh rute /api/pencairan* di src/index.js.
-- ============================================================

CREATE TABLE IF NOT EXISTS pencairan (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  date        TEXT,
  sheet       TEXT,
  nama        TEXT,
  rek         TEXT,
  saldo_n9    TEXT,
  pending     TEXT,
  saldo_asli  TEXT,
  cair        TEXT,
  status      TEXT,
  ket         TEXT,
  created_by  TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pencairan_date ON pencairan(date);
