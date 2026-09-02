-- ============================================================
-- MIGRATION 0005 — BANK ACCOUNTS
-- Tabel bank_accounts untuk validator rekening.
-- Digunakan oleh rute /api/bank/sync, /api/bank/accounts, dan
-- /api/validate-rekening di src/index.js.
-- ============================================================

CREATE TABLE IF NOT EXISTS bank_accounts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  bank        TEXT,
  nama        TEXT,
  no_rek      TEXT,
  sheet       TEXT,
  status      TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Index untuk pencarian rekening (sudah dibuat oleh kode sync)
CREATE INDEX IF NOT EXISTS idx_bank_accounts_norek ON bank_accounts(no_rek);
