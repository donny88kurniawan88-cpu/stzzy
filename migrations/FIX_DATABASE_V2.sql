-- ============================================================
-- FIX DATABASE v2 — Format Access Control Lengkap (20 keys)
-- Jalankan SEMUA query ini di D1 database Anda (aura-db)
-- ============================================================

-- ============================================
-- STEP 1: UPDATE ROLE LAMA MENJADI 3 ROLE SAJA
-- ============================================
UPDATE users SET role = 'MEMBER' WHERE role IS NULL OR role = '';
UPDATE users SET role = 'MEMBER' WHERE role = 'OPERATOR';
UPDATE users SET role = 'MEMBER' WHERE role = 'CS';
UPDATE users SET role = 'MEMBER' WHERE role = 'USER';

-- ============================================
-- STEP 2: UPDATE FORMAT ACCESS CONTROL (20 KEYS)
-- ============================================

-- 2a. MASTER → semua modul + semua items TRUE
UPDATE users
SET access = '{"core":true,"workspace":true,"operational":true,"system":true,"dashboard":true,"profil":true,"banking_tools":true,"rek_validator":true,"bank_processor":true,"saldo_pencairan":true,"qris_tools":true,"prediction_tools":true,"event_tools":true,"edit_bukti":true,"keep_memo":true,"api_key":true,"setting":true,"authority_panel":true,"user_management":true,"registration_control":true}'
WHERE role = 'MASTER';

-- 2b. ADMIN → Core semua + Workspace + Operational + System (Authority Panel + User Management only, bukan API Key/Setting)
UPDATE users
SET access = '{"core":true,"workspace":true,"operational":true,"system":true,"dashboard":true,"profil":true,"banking_tools":true,"rek_validator":true,"bank_processor":true,"saldo_pencairan":true,"qris_tools":true,"prediction_tools":true,"event_tools":true,"edit_bukti":true,"keep_memo":true,"api_key":false,"setting":false,"authority_panel":true,"user_management":true,"registration_control":false}'
WHERE role = 'ADMIN';

-- 2c. MEMBER → default hanya Core (dashboard + profil)
UPDATE users
SET access = '{"core":true,"workspace":false,"operational":false,"system":false,"dashboard":true,"profil":true,"banking_tools":false,"rek_validator":false,"bank_processor":false,"saldo_pencairan":false,"qris_tools":false,"prediction_tools":false,"event_tools":false,"edit_bukti":false,"keep_memo":false,"api_key":false,"setting":false,"authority_panel":false,"user_management":false,"registration_control":false}'
WHERE role = 'MEMBER';

-- 2d. Fix user dengan access NULL atau kosong
UPDATE users
SET access = '{"core":true,"workspace":false,"operational":false,"system":false,"dashboard":true,"profil":true,"banking_tools":false,"rek_validator":false,"bank_processor":false,"saldo_pencairan":false,"qris_tools":false,"prediction_tools":false,"event_tools":false,"edit_bukti":false,"keep_memo":false,"api_key":false,"setting":false,"authority_panel":false,"user_management":false,"registration_control":false}'
WHERE access IS NULL OR access = '';

-- ============================================
-- STEP 3: UPDATE SETTINGS REGISTRASI
-- ============================================
INSERT OR IGNORE INTO settings (key, value) VALUES ('registration', '{"open":true,"defaultRole":"MEMBER","requireApproval":false}');
UPDATE settings
SET value = '{"open":true,"defaultRole":"MEMBER","requireApproval":false}'
WHERE key = 'registration';

-- ============================================
-- STEP 4: TAMBAH KOLOM JIKA BELUM ADA
-- ============================================
ALTER TABLE users ADD COLUMN last_login TEXT;
ALTER TABLE users ADD COLUMN granted_by TEXT;

-- ============================================
-- STEP 5: UPDATE AKUN MASTER ANDA
-- ============================================
UPDATE users
SET role = 'MASTER',
    status = 'ACTIVE',
    password = 'caill2233@',
    access = '{"core":true,"workspace":true,"operational":true,"system":true,"dashboard":true,"profil":true,"banking_tools":true,"rek_validator":true,"bank_processor":true,"saldo_pencairan":true,"qris_tools":true,"prediction_tools":true,"event_tools":true,"edit_bukti":true,"keep_memo":true,"api_key":true,"setting":true,"authority_panel":true,"user_management":true,"registration_control":true}',
    granted_by = 'system'
WHERE username = 'donny';

-- ============================================
-- STEP 6: PASTIKAN ADA MINIMAL 1 MASTER
-- ============================================
INSERT OR IGNORE INTO users (username, password, role, status, access, granted_by)
VALUES (
  'admin',
  'admin123',
  'MASTER',
  'ACTIVE',
  '{"core":true,"workspace":true,"operational":true,"system":true,"dashboard":true,"profil":true,"banking_tools":true,"rek_validator":true,"bank_processor":true,"saldo_pencairan":true,"qris_tools":true,"prediction_tools":true,"event_tools":true,"edit_bukti":true,"keep_memo":true,"api_key":true,"setting":true,"authority_panel":true,"user_management":true,"registration_control":true}',
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
--
-- Expected:
-- - Semua role hanya: MASTER, ADMIN, atau MEMBER
-- - access format: {"core":true,"workspace":...,"dashboard":...,"api_key":...}
-- - MASTER: semua 20 keys = true
-- - ADMIN: 18 keys true, api_key=false, setting=false
-- - MEMBER: hanya core+dashboard+profil=true, selebihnya false
-- - Minimal 1 user dengan role MASTER
