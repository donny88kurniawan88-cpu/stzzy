-- ============================================================
-- 0011 HASIL RESULT + TABEL SHIO + CEKLIS (v3.6.1)
-- Jalankan: npx wrangler d1 execute aura-db --remote --file=migrations/0011_hasil_shio.sql
-- Catatan: Worker juga auto-ensure tabel ini saat GET /api/hasil,
--          GET /api/shio atau /api/hasil/ceklis pertama kali,
--          jadi langkah ini opsional.
-- PENTING: sengaja TANPA komentar inline di dalam statement --
--          komentar "--" di akhir baris bisa "menelan" sisa
--          statement bila tool membuang newline (incomplete input).
-- ============================================================

CREATE TABLE IF NOT EXISTS hasil_result (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pasaran_id INTEGER NOT NULL,
  pasaran_nama TEXT NOT NULL,
  tanggal TEXT NOT NULL,
  prize INTEGER NOT NULL DEFAULT 1,
  items TEXT NOT NULL DEFAULT '[]',
  updated_by TEXT,
  updated_at INTEGER
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_hasil_uniq ON hasil_result(pasaran_id, tanggal);

CREATE TABLE IF NOT EXISTS shio_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ord TEXT NOT NULL,
  updated_by TEXT,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS hasil_ceklis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pasaran_id INTEGER NOT NULL,
  tanggal TEXT NOT NULL,
  done_by TEXT,
  updated_at INTEGER
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ceklis_uniq ON hasil_ceklis(pasaran_id, tanggal);
