-- ============================================================
-- FIX DATABASE: Role System + Access Control
-- Jalankan SEMUA query ini di D1 database Anda (aura-db)
-- ============================================================

-- ============================================
-- STEP 1: UPDATE ROLE LAMA MENJADI MEMBER
-- ============================================
-- Semua user dengan role OPERATOR, CS, USER, NULL diubah ke MEMBER
UPDATE users SET role = 'MEMBER' WHERE role IS NULL OR role = '';
UPDATE users SET role = 'MEMBER' WHERE role = 'OPERATOR';
UPDATE users SET role = 'MEMBER' WHERE role = 'CS';
UPDATE users SET role = 'MEMBER' WHERE role = 'USER';

-- ============================================
-- STEP 2: UPDATE FORMAT ACCESS CONTROL
-- ============================================

-- 2a. MASTER & ADMIN → semua modul true (format baru)
UPDATE users
SET access = '{"core":true,"workspace":true,"operational":true,"system":true,"user_management":true,"registration_control":true}'
WHERE role = 'MASTER';

UPDATE users
SET access = '{"core":true,"workspace":true,"operational":true,"system":true,"user_management":true,"registration_control":true}'
WHERE role = 'ADMIN';

-- 2b. MEMBER → default hanya core=true (format baru)
UPDATE users
SET access = '{"core":true,"workspace":false,"operational":false,"system":false,"user_management":false,"registration_control":false}'
WHERE role = 'MEMBER';

-- 2c. Jika ada user dengan access NULL atau rusak, fix semua
UPDATE users SET access = '{"core":true,"workspace":false,"operational":false,"system":false,"user_management":false,"registration_control":false}'
WHERE access IS NULL OR access = '';

-- ============================================
-- STEP 3: UPDATE SETTINGS REGISTRASI
-- ============================================
UPDATE settings
SET value = '{"open":true,"defaultRole":"MEMBER","requireApproval":false}'
WHERE key = 'registration';

-- ============================================
-- STEP 4: TAMBAH KOLOM JIKA BELUM ADA
-- ============================================
-- (Jika kolom sudah ada, query ini akan error — abaikan)
ALTER TABLE users ADD COLUMN last_login TEXT;
ALTER TABLE users ADD COLUMN granted_by TEXT;

-- ============================================
-- STEP 5: UPDATE AKUN MASTER ANDA
-- ============================================
-- Update user "donny" sebagai MASTER dengan password barunya
-- Ganti username/password sesuai akun Anda yang sebenarnya
UPDATE users
SET role = 'MASTER',
    status = 'ACTIVE',
    password = 'caill2233@',
    access = '{"core":true,"workspace":true,"operational":true,"system":true,"user_management":true,"registration_control":true}',
    granted_by = 'system'
WHERE username = 'donny';

-- ============================================
-- STEP 6: PASTIKAN ADA MINIMAL 1 MASTER
-- ============================================
-- Jika belum ada akun MASTER, buat default
INSERT OR IGNORE INTO users (username, password, role, status, access, granted_by)
VALUES (
  'admin',
  'admin123',
  'MASTER',
  'ACTIVE',
  '{"core":true,"workspace":true,"operational":true,"system":true,"user_management":true,"registration_control":true}',
  'system'
);

-- ============================================
-- STEP 7: INDEX UNTUK PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_granted_by ON users(granted_by);

-- ============================================
-- VERIFIKASI — jalankan query ini untuk cek hasil
-- ============================================
-- SELECT username, role, status, access FROM users;
-- SELECT * FROM settings WHERE key = 'registration';
--
-- Expected output:
-- - Semua role hanya: MASTER, ADMIN, atau MEMBER
-- - access format: {"core":true,"workspace":...,"system":...}
-- - Minimal 1 user dengan role MASTER
