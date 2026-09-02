-- ============================================================
-- MIGRATION 0007 — ROLE SYSTEM UPDATE
-- Update skema & data untuk sistem 3 role: MASTER, ADMIN, MEMBER
-- Menghapus role lama (OPERATOR, CS) dan update format access.
-- ============================================================

-- ===== 1. MIGRASI ROLE LAMA KE MEMBER =====
-- User dengan role OPERATOR atau CS diubah menjadi MEMBER
UPDATE users SET role = 'MEMBER' WHERE role IN ('OPERATOR', 'CS', 'USER');

-- ===== 2. UPDATE FORMAT ACCESS CONTROL =====
-- Konversi access lama (dashboard, authority) ke format baru (core, workspace, operational, system)
-- Untuk MASTER & ADMIN: semua modul true
UPDATE users
SET access = '{"core":true,"workspace":true,"operational":true,"system":true,"user_management":true,"registration_control":true}'
WHERE role IN ('MASTER', 'ADMIN');

-- Untuk MEMBER: default hanya core=true, selebihnya ditentukan admin/master
-- Jika access lama punya dashboard=true, map ke core=true
UPDATE users
SET access = '{"core":true,"workspace":false,"operational":false,"system":false,"user_management":false,"registration_control":false}'
WHERE role = 'MEMBER'
  AND (access IS NULL OR access NOT LIKE '%core%');

-- ===== 3. UPDATE SETTING REGISTRASI =====
-- Pastikan defaultRole hanya MEMBER (bukan CS/OPERATOR)
UPDATE settings
SET value = REPLACE(value, '"defaultRole":"CS"', '"defaultRole":"MEMBER"')
WHERE key = 'registration';

UPDATE settings
SET value = REPLACE(value, '"defaultRole":"OPERATOR"', '"defaultRole":"MEMBER"')
WHERE key = 'registration';

UPDATE settings
SET value = REPLACE(value, '"defaultRole":"USER"', '"defaultRole":"MEMBER"')
WHERE key = 'registration';

-- ===== 4. TAMBAH KOLOM LAST_LOGIN =====
-- Untuk tracking kapan user terakhir login (opsional, untuk audit)
ALTER TABLE users ADD COLUMN last_login TEXT;

-- ===== 5. SEED MASTER USER JIKA BELUM ADA =====
-- Pastikan minimal ada 1 akun MASTER untuk manage sistem
-- Username: admin, Password: admin123, Role: MASTER
INSERT OR IGNORE INTO users (username, password, role, status, access, granted_by)
VALUES (
  'admin',
  'admin123',
  'MASTER',
  'ACTIVE',
  '{"core":true,"workspace":true,"operational":true,"system":true,"user_management":true,"registration_control":true}',
  'system'
);

-- ===== 6. INDEX UNTUK PERFORMANCE =====
CREATE INDEX IF NOT EXISTS idx_users_granted_by ON users(granted_by);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- ===== VERIFIKASI =====
-- Setelah migrasi, jalankan query ini untuk cek:
-- SELECT role, COUNT(*) as count FROM users GROUP BY role;
-- Expected: hanya MASTER, ADMIN, MEMBER (tidak ada OPERATOR, CS, USER)
