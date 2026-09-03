-- ============================================================
-- MIGRATION 0008 — IP WHITELIST SYSTEM
-- Sistem deteksi IP, whitelist, dan kontrol akses login
-- ============================================================

-- ============================================
-- TABLE: ip_whitelist
-- Menyimpan daftar IP yang diizinkan login
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
-- TABLE: ip_login_logs
-- Mencatat semua percobaan login (IP, status, timestamp)
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
-- SETTINGS: IP whitelist configuration
-- ============================================
INSERT OR IGNORE INTO settings (key, value) VALUES (
  'ip_whitelist',
  '{"enabled":false,"message":"IP Anda tidak ada dalam whitelist. Hubungi admin."}'
);

-- ============================================
-- SEED: Tambah localhost & beberapa IP default
-- ============================================
INSERT OR IGNORE INTO ip_whitelist (ip_address, label, added_by) VALUES
  ('127.0.0.1', 'Localhost', 'system'),
  ('::1', 'Localhost IPv6', 'system'),
  ('0.0.0.0', 'All (dev mode)', 'system');
