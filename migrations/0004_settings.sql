-- ============================================================
-- MIGRATION 0004 — SETTINGS
-- Tabel key-value untuk konfigurasi aplikasi (mis. status registrasi).
-- Digunakan oleh rute /api/settings/registration* di src/index.js.
-- ============================================================

CREATE TABLE IF NOT EXISTS settings (
  key    TEXT PRIMARY KEY,
  value  TEXT
);

-- Seed default: registrasi tertutup
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('registration', '{"open":false,"message":"Registrasi sedang ditutup."}');
