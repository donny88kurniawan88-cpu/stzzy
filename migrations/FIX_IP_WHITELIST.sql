-- ============================================================
-- FIX: IP Whitelist settings — gunakan single quotes
-- ============================================================

-- Hapus setting lama jika ada
DELETE FROM settings WHERE key = 'ip_whitelist';

-- Insert setting baru dengan JSON yang benar (single quotes di luar)
INSERT INTO settings (key, value) VALUES (
  'ip_whitelist',
  '{"enabled":false,"message":"IP Anda tidak ada dalam whitelist. Hubungi admin."}'
);

-- ============================================
-- Buat tabel ip_whitelist jika belum ada
-- ============================================
CREATE TABLE IF NOT EXISTS ip_whitelist (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_address  TEXT    NOT NULL UNIQUE,
  label       TEXT,
  added_by    TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ip_whitelist_ip ON ip_whitelist(ip_address);

-- ============================================
-- Buat tabel ip_login_logs jika belum ada
-- ============================================
CREATE TABLE IF NOT EXISTS ip_login_logs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_address  TEXT,
  username    TEXT,
  status      TEXT,
  user_agent  TEXT,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ip_logs_ip ON ip_login_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_logs_created ON ip_login_logs(created_at);

-- ============================================
-- Seed: IP default
-- ============================================
INSERT OR IGNORE INTO ip_whitelist (ip_address, label, added_by) VALUES
  ('127.0.0.1', 'Localhost', 'system'),
  ('::1', 'Localhost IPv6', 'system'),
  ('0.0.0.0', 'All (dev mode)', 'system');

-- ============================================
-- VERIFIKASI
-- ============================================
-- SELECT * FROM settings WHERE key = 'ip_whitelist';
-- SELECT * FROM ip_whitelist;
