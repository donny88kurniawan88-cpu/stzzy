-- ============================================================
-- FIX URGENT: Access niorbayu & asasas54 semua false
-- Jalankan query ini di D1 database Anda
-- ============================================================

-- ============================================
-- FIX niorbayu (ADMIN) — set ke default ADMIN access
-- ============================================
UPDATE users
SET access = '{"core":true,"workspace":true,"operational":true,"system":true,"dashboard":true,"profil":true,"banking_tools":true,"rek_validator":true,"bank_processor":true,"saldo_pencairan":true,"qris_tools":true,"prediction_tools":true,"event_tools":true,"edit_bukti":true,"keep_memo":true,"api_key":false,"setting":false,"authority_panel":true,"user_management":true,"registration_control":false}'
WHERE username = 'niorbayu';

-- ============================================
-- FIX asasas54 (MEMBER) — set ke default MEMBER access
-- ============================================
UPDATE users
SET access = '{"core":true,"workspace":false,"operational":false,"system":false,"dashboard":true,"profil":true,"banking_tools":false,"rek_validator":false,"bank_processor":false,"saldo_pencairan":false,"qris_tools":false,"prediction_tools":false,"event_tools":false,"edit_bukti":false,"keep_memo":false,"api_key":false,"setting":false,"authority_panel":false,"user_management":false,"registration_control":false}'
WHERE username = 'asasas54';

-- ============================================
-- FIX SEMUA ADMIN — pastikan default ADMIN access
-- ============================================
UPDATE users
SET access = '{"core":true,"workspace":true,"operational":true,"system":true,"dashboard":true,"profil":true,"banking_tools":true,"rek_validator":true,"bank_processor":true,"saldo_pencairan":true,"qris_tools":true,"prediction_tools":true,"event_tools":true,"edit_bukti":true,"keep_memo":true,"api_key":false,"setting":false,"authority_panel":true,"user_management":true,"registration_control":false}'
WHERE role = 'ADMIN';

-- ============================================
-- FIX SEMUA MEMBER — pastikan default MEMBER access
-- ============================================
UPDATE users
SET access = '{"core":true,"workspace":false,"operational":false,"system":false,"dashboard":true,"profil":true,"banking_tools":false,"rek_validator":false,"bank_processor":false,"saldo_pencairan":false,"qris_tools":false,"prediction_tools":false,"event_tools":false,"edit_bukti":false,"keep_memo":false,"api_key":false,"setting":false,"authority_panel":false,"user_management":false,"registration_control":false}'
WHERE role = 'MEMBER';

-- ============================================
-- FIX SEMUA MASTER — pastikan full access
-- ============================================
UPDATE users
SET access = '{"core":true,"workspace":true,"operational":true,"system":true,"dashboard":true,"profil":true,"banking_tools":true,"rek_validator":true,"bank_processor":true,"saldo_pencairan":true,"qris_tools":true,"prediction_tools":true,"event_tools":true,"edit_bukti":true,"keep_memo":true,"api_key":true,"setting":true,"authority_panel":true,"user_management":true,"registration_control":true}'
WHERE role = 'MASTER';

-- ============================================
-- VERIFIKASI — jalankan query ini untuk cek
-- ============================================
-- SELECT username, role, substr(access, 1, 80) as access_preview FROM users;
--
-- Expected:
-- donny     | MASTER | {"core":true,"workspace":true,"operational":true,"system":true,"dashboard":true,...
-- niorbayu  | ADMIN  | {"core":true,"workspace":true,"operational":true,"system":true,"dashboard":true,...
-- asasas54  | MEMBER | {"core":true,"workspace":false,"operational":false,"system":false,"dashboard":true,...
-- admin     | MASTER | {"core":true,"workspace":true,"operational":true,"system":true,"dashboard":true,...
