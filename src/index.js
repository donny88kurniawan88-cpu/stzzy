// ============================================================
// BANK LOGIC — PORT DARI GOOGLE APPS SCRIPT
// ============================================================

// ---------- FORMATTER HELPERS (persis versi GAS) ----------
function extractFormatterBankNameV2(raw) {
  raw = raw.toUpperCase();
  if (raw.includes("MANDIRI")) return "Bank Mandiri";
  if (raw.includes("BCA")) return "Bank BCA";
  if (raw.includes("BRI")) return "Bank BRI";
  if (raw.includes("BNI")) return "Bank BNI";
  if (raw.includes("DANAMON")) return "Bank Danamon";
  if (raw.includes("CIMB")) return "Bank CIMB";
  if (raw.includes("SINARMAS")) return "Bank Sinarmas";
  if (raw.includes("BSI")) return "Bank BSI";
  if (raw.includes("SEABANK")) return "Bank SeaBank";
  if (raw.includes("JAGO")) return "Bank Jago";
  return "Bank " + raw.charAt(0) + raw.slice(1).toLowerCase();
}

function extractFormatterBankName(text) {
  var bankMappings = { 'BCA': ['BCA', 'KAS BCA'], 'BRI': ['BRI', 'BRI BIZ', 'IBBIZ BRI'], 'BNI': ['BNI'], 'DANAMON': ['DANAMON'], 'SINARMAS': ['SINARMAS'], 'MANDIRI': ['MANDIRI'], 'BSI': ['BSI'], 'SEABANK': ['SEABANK'], 'BANK JAGO': ['BANK JAGO', 'JAGO'] };
  var upperText = text.toUpperCase();
  for (var standardName in bankMappings) {
    for (var i = 0; i < bankMappings[standardName].length; i++) {
      if (upperText.includes(bankMappings[standardName][i].toUpperCase())) return extractFormatterBankNameV2(standardName);
    }
  }
  return '';
}

function cleanNominalValue(value) {
  if (!value) return '';
  var cleaned = value.replace(/[^\d\.,]/g, '');
  if (cleaned.includes('.') && cleaned.includes(',')) cleaned = cleaned.replace(/\./g, '').replace(/,/g, '');
  else if (cleaned.includes(',') && !cleaned.includes('.')) cleaned = cleaned.replace(/,/g, '');
  else if (cleaned.includes('.')) {
    var parts = cleaned.split('.');
    if (parts[parts.length - 1].length === 2 || parts[parts.length - 1].length === 3) cleaned = cleaned.replace(/\./g, '');
  }
  return cleaned.replace(/[^\d]/g, '');
}

function extractFormatterNominal(text) {
  var patterns = [/Rp\.?\s*([\d\.,]+)\s*[,-]?/i, /Nominal\s*:\s*([\d\.,]+)/i, /([\d\.,]+)\s*[,-]$/, /:?\s*([\d\.,]+)/i];
  for (var i = 0; i < patterns.length; i++) {
    var match = text.match(patterns[i]);
    if (match) {
      var val = cleanNominalValue(match[1].trim());
      if (val && val !== '0') return val;
    }
  }
  return '';
}

function formatFormatterNominal(nominal) {
  var clean = nominal.toString().replace(/[^\d]/g, '');
  if (!clean || clean === '0') return { dotted: '0', comma: '0' };
  return {
    dotted: clean.replace(/\B(?=(\d{3})+(?!\d))/g, "."),
    comma: clean.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  };
}

function saveBankRecordComplete(bank, nama, noRek, info, nominal, results) {
  if (bank && nama && noRek && nominal) {
    var nominalNum = parseInt(nominal, 10);
    if (isNaN(nominalNum) || nominalNum <= 0) return;
    var nominalData = formatFormatterNominal(nominalNum.toString());
    results.push({
      bank: bank,
      nama: nama.toUpperCase(),
      noRek: noRek,
      info: info || '',
      nominal_comma: nominalData.comma,
      nominal_dotted: nominalData.dotted
    });
  }
}

// ---------- FORMATTER UTAMA (persis versi GAS) ----------
function processBankDataLogic(inputText) {
  var lines = inputText.split('\n');
  var results = [];
  var currentBank = '', currentNama = '', currentNomor = '', currentInfo = '', currentNominal = '';
  var isInTransactionBlock = false;

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (line === '') {
      if (currentBank && currentNama && currentNomor && currentNominal) {
        saveBankRecordComplete(currentBank, currentNama, currentNomor, currentInfo, currentNominal, results);
        currentBank = ''; currentNama = ''; currentNomor = ''; currentNominal = '';
      }
      continue;
    }

    if (line.toLowerCase().startsWith('info :')) { currentInfo = line.replace(/Info\s*:\s*/i, '').trim(); continue; }
    if (line.toLowerCase().startsWith('perihal :')) { isInTransactionBlock = true; continue; }
    if (line.includes('@TogelUP') || line.includes('**********')) {
      isInTransactionBlock = false;
      if (currentBank && currentNama && currentNomor && currentNominal) {
        saveBankRecordComplete(currentBank, currentNama, currentNomor, currentInfo, currentNominal, results);
        currentBank = ''; currentNama = ''; currentNomor = ''; currentNominal = '';
      }
      continue;
    }

    if (isInTransactionBlock || !line.includes('@')) {
      if ((line.toLowerCase().includes('bank') || line.toLowerCase().includes('kas ')) && !currentBank) {
        var matchNewFormat = line.match(/KAS\s+([A-Z]+)\s*-/i);
        if (matchNewFormat) {
          currentBank = extractFormatterBankNameV2(matchNewFormat[1].trim());
        } else {
          var bn = extractFormatterBankName(line);
          if (bn) { currentBank = bn; continue; }
        }
      }

      if ((line.toLowerCase().includes('nama') || line.toLowerCase().includes('rekening') || line.toLowerCase().includes('a.n') || line.toLowerCase().includes('atas nama')) && !currentNama) {
        var np = [/Nama\s*Rekening\s*:\s*(.+)/i, /NAMA\s*REKENING\s*:\s*(.+)/i, /Nama\s*:\s*(.+)/i, /a\.n\.?\s*(.+)/i, /Atas\s*Nama\s*:\s*(.+)/i];
        for (var p = 0; p < np.length; p++) { var m = line.match(np[p]); if (m) { currentNama = m[1].trim(); break; } }
        if (currentNama) continue;
      }

      if ((line.toLowerCase().includes('nomor') || line.toLowerCase().includes('no') || line.toLowerCase().includes('rekening') || line.match(/\d{10,}/)) && !currentNomor) {
        var rp = [/Nomor\s*Rekening\s*:\s*(\d+)/i, /NOMOR\s*REKENING\s*:\s*(\d+)/i, /No\.?\s*Rek\.?\s*:\s*(\d+)/i, /No\.?\s*:\s*(\d+)/i, /:?\s*(\d{10,})/, /Rekening\s*:\s*(\d+)/i];
        for (var p2 = 0; p2 < rp.length; p2++) { var m2 = line.match(rp[p2]); if (m2) { currentNomor = m2[1].trim(); break; } }
        if (currentNomor) continue;
      }

      if ((line.toLowerCase().includes('nominal') || line.toLowerCase().includes('rp') || line.toLowerCase().includes('jumlah') || line.match(/(?:Rp|rp)/i))) {
        var extractedNominal = extractFormatterNominal(line);
        if (extractedNominal && extractedNominal !== '0') {
          currentNominal = extractedNominal;
          if (currentBank && currentNama && currentNomor && currentNominal) {
            saveBankRecordComplete(currentBank, currentNama, currentNomor, currentInfo, currentNominal, results);
            currentBank = ''; currentNama = ''; currentNomor = ''; currentNominal = '';
          }
        }
      }
    }
  }

  if (currentBank && currentNama && currentNomor && currentNominal) {
    saveBankRecordComplete(currentBank, currentNama, currentNomor, currentInfo, currentNominal, results);
  }

  var output = '';
  results.forEach(function (record, index) {
    output += record.bank + '\t' + record.nama + '\t' + record.noRek + '\t' + record.nominal_comma;
    if (index < results.length - 1) output += '\n';
  });

  return { success: true, data: output, count: results.length, records: results };
}

// ---------- VALIDATOR: CARI DI D1 (1 query, index no_rek) ----------
async function findInDatabaseD1(cleanInput, env) {
  var result = { found: false, bank: '', nama: '', sheetName: '', cleanedRek: cleanInput, status: '', leadingZeroAdded: 0 };

  // ⚡ OPTIMASI: 1 query untuk 4 varian (asli + 1-3 nol tambahan), bukan 4 query berurutan
  var row = await env.DB.prepare(
    "SELECT no_rek, bank, nama, sheet, status FROM bank_accounts WHERE no_rek IN (?, ?, ?, ?) LIMIT 1"
  ).bind(cleanInput, '0' + cleanInput, '00' + cleanInput, '000' + cleanInput).first();

  if (row) {
    result.found = true;
    result.bank = row.bank;
    result.nama = row.nama;
    result.sheetName = row.sheet;
    result.status = row.status;
    result.cleanedRek = row.no_rek;
    result.leadingZeroAdded = row.no_rek.length - cleanInput.length;
  }
  return result;
}

// ---------- VALIDATOR UTAMA (bank murni dari DB, status terpisah) ----------
async function processBankDataValidatorLogic(inputData, env) {
  var lines = inputData.trim().split('\n');
  var results = [];
  var warnings = [];

  for (var li = 0; li < lines.length; li++) {
    var line = lines[li];
    var parts = line.split('\t');
    if (parts.length < 2) continue;

    var inputNama = '', inputRek = '', inputNominal = '';
    for (var p = 0; p < parts.length; p++) {
      var cleanPart = parts[p].replace(/\D/g, '');
      if (cleanPart.length >= 8 && !inputRek) inputRek = parts[p].trim();
    }
    if (parts.length >= 3) {
      inputNama = parts[0].trim();
      if (!inputRek) inputRek = parts[1].trim();
      inputNominal = parts[2].trim();
    } else if (parts.length === 2) {
      inputNama = parts[0].trim();
      if (!inputRek) inputRek = parts[1].trim();
      inputNominal = '-';
    }
    if (!inputRek || inputRek.replace(/\D/g, '').length < 5) continue;

    var matchResult = await findInDatabaseD1(inputRek.replace(/\D/g, ''), env);
    var finalBank = 'BANK TIDAK DIKETAHUI';
    var finalStatus = 'TIDAK DITEMUKAN';
    var finalRek = matchResult.cleanedRek || inputRek;
    var warning = '';

    if (!matchResult.found) {
      finalStatus = 'TIDAK DITEMUKAN';
      warning = 'TIDAK DITEMUKAN DI DB';
    } else {
      finalStatus = matchResult.status || 'TERDAFTAR';
      finalBank = matchResult.bank || 'BANK TIDAK DIKETAHUI';
    }

    if (matchResult.leadingZeroAdded > 0) {
      warning = 'Auto-tambah ' + matchResult.leadingZeroAdded + ' nol di depan';
    }

    results.push({
      bank: finalBank,
      nama: inputNama.toUpperCase(),
      noRek: finalRek,
      nominal: inputNominal,
      status: finalStatus,
      warning: warning,
      found: matchResult.found
    });

    if (warning && finalStatus === 'TIDAK DITEMUKAN') warnings.push(warning);
  }

  return { success: true, results: results, warnings: warnings, count: results.length };
}

// ---------- SHEET SYNC ----------
// ⬇️ SUMBER DATABASE: spreadsheet Anda
const VALIDATOR_SHEET_IDS = [
  '1r6EgJuTN2PL_hQGaU-dtMa4SctG-AeIYHJzs2RmeefI'
];

// ============================================================
// ⬇️ FALLBACK NAMA TAB — sesuaikan dengan nama tab spreadsheet Anda
// ============================================================
const FALLBACK_SHEET_NAMES = [
  'KAS BERSIH (AKTIF)',
  'KAS BERSIH (BERMASALAH+CABUT KAS1)',
  'KAS KOTOR (AKTIF)',
  'KAS KOTOR (BERMASALAH+CABUT KAS1)',
  'WD BERSIH (AKTIF)',
  'WD BERSIH (BERMASALAH+CABUT KAS1)',
  'WD KOTOR (AKTIF)',
  'WD KOTOR (BERMASALAH+CABUT KAS1)',
  'REKENING DEPOSIT (AKTIF)',
  'REKENING DEPOSIT (BERMASALAH+CABUT KAS1)'
];

// ============================================================
// DETEKSI LABEL BLOK BANK — BERLAKU UNTUK SEMUA POLA:
// "KAS BCA", "WD BRI", "KAS MANDIRI", "BCA", "MANDIRI KOTOR", dll.
// Word-boundary supaya nama orang (Sabrina, Brian) tidak salah deteksi.
// ============================================================
const BANK_LABEL_KEYWORDS = ['BCA', 'BRI', 'BNI', 'MANDIRI', 'DANAMON', 'BSI', 'CIMB', 'SINARMAS', 'SEABANK', 'JAGO', 'PANIN', 'PERMATA', 'MEGA', 'BTPN', 'SAHABAT', 'SAMBA', 'JENIUS', 'NEO'];
const LABEL_HEADER_EXCLUDE = ['NAMA', 'NOMOR', 'STATUS', 'KETERANGAN', 'KET.', 'SALDO', 'PENDING', 'TOTAL', 'NO.', 'HEADER', 'JUMLAH', 'REKENING', 'DEPOSIT'];

function isBankBlockLabel(cell) {
  const up = cell.toUpperCase().split('\n')[0].trim();
  if (up === '' || up.length > 45) return false;
  if (/\d{6,}/.test(up)) return false;
  if (LABEL_HEADER_EXCLUDE.some(w => up.includes(w))) return false;
  if (/^(KAS|WD)\s+\S+/i.test(up)) return true;
  return BANK_LABEL_KEYWORDS.some(k => new RegExp('\\b' + k + '\\b').test(up));
}

// ===== CLEAN BANK LABEL: hapus prefix "NO", "NO.", "NOMOR" dari label bank =====
// Misal: "NO KAS BCA" → "KAS BCA", "NO. WD BRI" → "WD BRI"
// Hanya hapus prefix di AWAL text, tidak hapus "NO" di tengah.
function cleanBankLabel(label) {
  if (!label) return label;
  let cleaned = label.trim();
  // Hapus prefix "NO." atau "NO " atau "NOMOR " di awal (case insensitive)
  cleaned = cleaned.replace(/^(NO\.?\s+|NOMOR\s+)+/i, '');
  return cleaned.trim();
}

// ============================================================
// NAMA REKENG PARSER — Pendekatan C (Hybrid: Header + Validation)
// Hanya untuk fungsi ini. Tidak mengubah logic lain.
// ============================================================

// Pattern keterangan/status yang BUKAN nama rekening (blacklist)
const KETERANGAN_PATTERNS = [
  /^CABUT\s+KAS/i,
  /^DANA\s+MASUK/i,
  /^DI\s+OFFKAN/i,
  /^OFFKAN/i,
  /^TIDAK\s+DIKETAHUI/i,
  /SEMENTARA/i,
  /BERMASALAH/i,
  /^BLOKIR/i,
  /^TUTUP/i,
  /^NONAKTIF/i,
  /^PENDING/i,
  /^PROSES/i,
  /^GAGAL/i,
  /^SUSPEND/i,
  /^REJECT/i,
  /^CANCEL/i,
  /^HAPUS/i,
  /^KOSONG/i,
  /^BELUM/i,
  /^SUDAH\s+(DI|D)/i,
  /^AKAN\s+DI/i,
  /^HARUS\s+DI/i,
  /^PERLU\s+DI/i,
  /^DI\s+(PROSES|CEK|TARIK|TRANSFER|BAYAR|KIRIM|TERIMA|OFF|HAPUS|TUTUP|BLOK)/i,
  /^SUDAH\s+(OFF|TUTUP|BLOK|HAPUS)/i,
  /^AKAN\s+(OFF|TUTUP|BLOK|HAPUS)/i,
];

// Pattern ciri-ciri NAMA ORANG (whitelist heuristik)
// Nama orang Indonesia biasanya: 2-5 kata, ada spasi, Title Case atau Mixed Case,
// minimal 3 huruf, tanpa angka, panjang 5-60 char
function isLikelyPersonName(text) {
  if (!text || typeof text !== 'string') return false;
  const t = text.trim();
  if (t.length < 3 || t.length > 60) return false;
  // Tolak kalau ada angka
  if (/\d/.test(t)) return false;
  // Tolak kalau ada karakter aneh (kecuali titik, apostrof, spasi, strip)
  if (!/^[A-Za-z\s.'-]+$/.test(t)) return false;
  // Harus ada minimal 1 spasi (2+ kata) ATAU minimal 4 huruf (nama tunggal)
  const words = t.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 1) return false;
  // Tolak kalau satu kata dan pendek (< 4 huruf)
  if (words.length === 1 && t.length < 4) return false;
  // Tolak kalau match pattern keterangan
  for (const pat of KETERANGAN_PATTERNS) {
    if (pat.test(t)) return false;
  }
  // Tolak kalau match label bank block
  if (isBankBlockLabel(t)) return false;
  // Tolak kalau ALL CAPS dan ada kata dari LABEL_HEADER_EXCLUDE
  const up = t.toUpperCase();
  if (LABEL_HEADER_EXCLUDE.some(w => up.includes(w))) return false;
  // Ciri nama orang: tidak semua huruf besar (kecuali singkatan 1-3 huruf)
  // Tapi di sheet Indonesia, nama sering ALL CAPS. Jadi kita allow ALL CAPS
  // asal tidak match keterangan pattern.
  return true;
}

// Cek apakah text adalah keterangan (bukan nama)
function isKeterangan(text) {
  if (!text || typeof text !== 'string') return false;
  const t = text.trim();
  if (t === '') return false;
  const up = t.toUpperCase();
  // Cek pattern keterangan
  for (const pat of KETERANGAN_PATTERNS) {
    if (pat.test(t)) return true;
  }
  // Cek LABEL_HEADER_EXCLUDE
  if (LABEL_HEADER_EXCLUDE.some(w => up.includes(w))) return true;
  // Cek label bank block
  if (isBankBlockLabel(t)) return true;
  // Ciri keterangan: ALL CAPS + ada angka + pendek
  if (up === t && /\d/.test(t) && t.length <= 30) return true;
  return false;
}

// Deteksi kolom NAMA berdasarkan header row (row pertama yang punya "NAMA")
// Return: index kolom NAMA, atau -1 kalau tidak ketemu
function detectNamaColumn(values, maxScanRows) {
  const maxRows = Math.min(maxScanRows || 5, values.length);
  for (let r = 0; r < maxRows; r++) {
    const row = values[r] || [];
    for (let c = 0; c < row.length; c++) {
      const cell = String(row[c] || '').trim().toUpperCase();
      // Header harus persis "NAMA" atau "NAMA REKENING" atau "ATAS NAMA"
      // Bukan "KETERANGAN", "NOMOR", dll
      if (cell === 'NAMA' || cell === 'NAMA REKENING' || cell === 'ATAS NAMA' || cell === 'A.N') {
        return c;
      }
    }
  }
  return -1;
}

// ===== MAIN: extractNamaRekening (Hybrid) =====
// row: row data saat ini
// defaultColNama: kolom NAMA default (dari isShifted logic, tetap dipakai sebagai fallback)
// rekCol: index kolom rekening (untuk exclude)
// values: semua rows (untuk header detection)
// rowIndex: index row saat ini (untuk batasi scan header)
function extractNamaRekening(row, defaultColNama, rekCol, values, rowIndex) {
  // ===== LAYER 1: Header Detection =====
  // Cari kolom NAMA dari header (row 0-4). Kalau ketemu, pakai itu.
  // Kalau tidak ketemu, pakai defaultColNama (logic lama).
  let headerColNama = detectNamaColumn(values, 5);
  let colNama = headerColNama >= 0 ? headerColNama : defaultColNama;

  // ===== LAYER 2: Baca value dari kolom NAMA + Validasi =====
  let candidate = String(row[colNama] || '').trim();

  // Validasi: kalau candidate match keterangan pattern → reject
  if (candidate && isKeterangan(candidate)) {
    candidate = '';
  }

  // Validasi: kalau candidate tidak terlihat seperti nama orang → reject
  // (tapi allow kalau ada huruf minimal, mungkin nama all-caps)
  if (candidate && !/[A-Za-z]{3,}/.test(candidate)) {
    candidate = '';
  }

  // Kalau candidate valid → return
  if (candidate && /[A-Za-z]/.test(candidate)) {
    return candidate;
  }

  // ===== LAYER 3: Smart Fallback =====
  // Kolom NAMA kosong/invalid → cari kolom lain yang terlihat seperti nama orang
  let best = '';
  let bestScore = 0;

  for (let c2 = 0; c2 < row.length; c2++) {
    if (c2 === rekCol) continue;          // skip kolom rekening
    if (c2 === colNama) continue;          // skip kolom NAMA (sudah dicek)
    const t = String(row[c2] || '').trim();
    if (t === '') continue;

    // Skip kalau match keterangan
    if (isKeterangan(t)) continue;

    // Skip kalau tidak ada huruf 3+
    if (!/[A-Za-z]{3,}/.test(t)) continue;

    // Skip kalau ada 5+ digit (kemungkinan nomor)
    if (/\d{5,}/.test(t)) continue;

    // Skip kalau terlalu panjang (> 60 char)
    if (t.length > 60) continue;

    // Scoring: kandidat nama
    let score = 0;
    // Score 1: ada spasi (2+ kata) — ciri nama orang
    if (/\s/.test(t)) score += 3;
    // Score 2: tidak ada angka
    if (!/\d/.test(t)) score += 2;
    // Score 3: panjang reasonable (5-40 char)
    if (t.length >= 5 && t.length <= 40) score += 2;
    // Score 4: tidak all-caps (Title/Mixed Case = ciri nama)
    if (t !== t.toUpperCase()) score += 3;
    // Score 5: posisi (kolom setelah rekening = biasanya nama di kanan)
    if (c2 > rekCol) score += 1;
    // Score 6: kalau isLikelyPersonName → bonus
    if (isLikelyPersonName(t)) score += 2;

    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }

  return best;
}

function parseCsvSimple(text) {
  const rows = []; let row = [], cur = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
      else cur += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ',') { row.push(cur); cur = ''; }
      else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
      else if (ch !== '\r') cur += ch;
    }
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

// Deteksi otomatis nama tab (internal)
async function detectSheetNames(sheetId) {
  try {
    const res = await fetch('https://docs.google.com/spreadsheets/d/' + sheetId + '/gviz/tq?tqx=out:json');
    if (res.ok) {
      const text = await res.text();
      const titles = [...text.matchAll(/\"title\":\"((?:[^\"\\]|\\.)*)\"/g)].map(x => x[1].replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16))));
      if (titles.length) return [...new Set(titles)];
    }
  } catch (e) {}
  try {
    const res = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/htmlview`);
    if (!res.ok) return [];
    const html = await res.text();
    const names = [];
    const patterns = [
      /sheet-button-\d+[^>]*>([^<>]+)<\/a>/g,
      /"name":"([^"]+)","gid":\d+/g,
      /aria-label="([^"]+)"[^>]*class="[^"]*sheet-button/g,
      /<option[^>]*value="\d+"[^>]*>([^<]+)<\/option>/g
    ];
    for (const re of patterns) {
      let m;
      while ((m = re.exec(html)) !== null) {
        const nm = m[1].trim().replace(/&amp;/g, '&');
        if (nm && !names.includes(nm)) names.push(nm);
      }
      if (names.length) break;
    }
    return names;
  } catch (e) { return []; }
}

async function fetchSheetNames(sheetId) {
  const detected = await detectSheetNames(sheetId);
  if (detected.length > 1) return detected;
  return FALLBACK_SHEET_NAMES;
}

// ============================================================
// PARSER v4 — konten + label SEMUA pola bank + fetch PARALEL
// ============================================================
async function buildValidatorDatabaseFromSheets() {
  const db = {};
  for (const id of VALIDATOR_SHEET_IDS) {
    try {
      let names = await fetchSheetNames(id);
      if (!names.length) names = [''];

      // ⚡ OPTIMASI: download semua tab SECARA PARALEL (bukan satu per satu)
      const fetched = await Promise.all(names.map(async (name) => {
        const csvUrl = name
          ? `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}`
          : `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv`;
        try {
          const res = await fetch(csvUrl);
          if (!res.ok) return null;
          return { name, values: parseCsvSimple(await res.text()) };
        } catch (e) { return null; }
      }));

      for (const sheetData of fetched) {
        if (!sheetData || !sheetData.values.length) continue;
        const name = sheetData.name;
        const values = sheetData.values;

        const sheetNameUpper = (name || 'SHEET').toUpperCase();
        const status = sheetNameUpper; // STATUS = NAMA SHEET

        const isShifted = sheetNameUpper.includes('BERMASALAH') || sheetNameUpper.includes('DEPOSIT');
        const COL_NAMA = isShifted ? 5 : 4;
        const COL_REK = isShifted ? 6 : 5;

        let currentBank = '';

        for (let r = 0; r < values.length; r++) {
          const row = values[r] || [];
          if (row.length === 0) continue;

          // === 1. SCAN BARIS: cari rekening + label blok bank (semua pola) ===
          let rekClean = '';
          let rekCol = -1;
          let kasLabel = '';
          let labelCol = -1;

          for (let c = 0; c < row.length; c++) {
            const cell = String(row[c] || '').trim();
            if (cell === '') continue;

            if (kasLabel === '' && isBankBlockLabel(cell)) {
              kasLabel = cleanBankLabel(cell.toUpperCase().split('\n')[0].trim());
              labelCol = c;
            }

            if (rekClean === '') {
              const digits = cell.replace(/\D/g, '');
              const isThousandSeparated = /^\d{1,3}([.,]\d{3})+([.,]\d{3})*$/.test(cell.replace(/Rp\.?\s*/i, ''));
              if (!isThousandSeparated && digits.length >= 8 && digits.length <= 20) {
                const letters = (cell.match(/[A-Za-z]/g) || []).length;
                if (letters <= 8 || digits.length >= 10) {
                  rekClean = digits;
                  rekCol = c;
                }
              }
            }
          }

          // === 2. BARIS LABEL BLOK ===
          if (kasLabel !== '' && rekClean === '') {
            currentBank = kasLabel;
            continue;
          }

          // === 3. BARIS DATA ===
          if (rekClean !== '') {
            // Label sebaris hanya valid kalau DI KIRI rekening (bukan nama orang di kanan)
            if (kasLabel !== '' && labelCol !== -1 && labelCol < rekCol) currentBank = kasLabel;

            // ===== NAMA PARSER (Hybrid: Header + Validation) =====
            // Pendekatan C: cek kolom NAMA (header-detected), validasi bukan keterangan,
            // fallback smart ke kolom lain yang terlihat seperti nama orang.
            let namaFinal = extractNamaRekening(row, COL_NAMA, rekCol, values, r);

            const cat = currentBank || sheetNameUpper;
            if (!db[cat]) db[cat] = [];
            db[cat].push({ cleaned: rekClean, status: status, nama: namaFinal.toUpperCase(), sheet: sheetNameUpper });
          }
        }
      }
    } catch (e) { /* skip sheet gagal */ }
  }
  return db;
}

// ============================================================
// MAIN WORKER
// ============================================================
// ============================================================
// HASIL RESMI PASARAN — cache isolate + fetch helper (v3.1.0)
// ============================================================
const PS_RES_CACHE = Object.create(null);
const PS_RES_TTL_MS = 5 * 60 * 1000;

function psCacheGet(k) {
  const c = PS_RES_CACHE[k];
  if (c && (Date.now() - c.t) < PS_RES_TTL_MS) return c.v;
  return null;
}
function psCacheSet(k, v) { PS_RES_CACHE[k] = { t: Date.now(), v: v }; }

async function psFetch(url) {
  const ac = new AbortController();
  const timer = setTimeout(function () { try { ac.abort(); } catch (e) {} }, 12000);
  try {
    const r = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8'
      },
      signal: ac.signal
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.text();
  } finally { clearTimeout(timer); }
}

function psAttr(html, cls) {
  let m = html.match(new RegExp("class=['\"]" + cls + "['\"]>([^<]*)<"));
  return m ? m[1].trim() : '';
}

function psParseSG4D(html) {
  if (!html || html.indexOf('tdFirstPrize') === -1) return null;
  function prize(cls) {
    let m = html.match(new RegExp("td" + cls + "Prize['\"]?>(\\d{4})<"));
    return m ? m[1] : '';
  }
  function tbodyNums(cls) {
    let m = html.match(new RegExp("<tbody class=['\"]" + cls + "['\"]>([\\s\\S]*?)</tbody>"));
    return m ? (m[1].match(/\b\d{4}\b/g) || []) : [];
  }
  const first = prize('First');
  if (!first) return null;
  return {
    site: 'Singapore Pools', url: 'https://www.singaporepools.com.sg/en/product/Pages/4d_results.aspx',
    drawNo: (html.match(/Draw No\.\s*(\d+)/) || ['', ''])[1],
    date: psAttr(html, 'drawDate'),
    first: first, second: prize('Second'), third: prize('Third'),
    starters: tbodyNums('tbodyStarterPrizes'),
    consolation: tbodyNums('tbodyConsolationPrizes')
  };
}

function psParseSGToto(html) {
  if (!html || html.indexOf("class='win1'") === -1) return null;
  const nums = [];
  for (let i = 1; i <= 6; i++) {
    const m = html.match(new RegExp("class=['\"]win" + i + "['\"]>(\\d+)<"));
    nums.push(m ? m[1] : '');
  }
  if (!nums[0]) return null;
  return {
    site: 'Singapore Pools', url: 'https://www.singaporepools.com.sg/en/product/Pages/toto_results.aspx',
    drawNo: (html.match(/Draw No\.\s*(\d+)/) || ['', ''])[1],
    date: psAttr(html, 'drawDate'),
    numbers: nums,
    additional: (html.match(/class=['\"]additional['\"]>(\d+)</) || ['', ''])[1],
    jackpot: (html.match(/class=['\"]jackpotPrize['\"]>([^<]*)</) || ['', ''])[1].trim()
  };
}

function psParseMagnum(html) {
  if (!html || html.length < 500) return null;
  const head = html.slice(0, 4000);
  if (/request is blocked|service unavailable|just a moment|access denied|captcha|are you a human/i.test(head)) return null;
  const txt = html.replace(/<script[\s\S]*?<\/script>/gi, ' ')
                  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
                  .replace(/<[^>]*>/g, ' ')
                  .replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
  function grab4(re) { const m = txt.match(re); return m ? m[1] : ''; }
  const drawNo = grab4(/Draw\s*(?:No|Number)[.:]?\s*([0-9]{3,6})/i);
  const first = grab4(/(?:1st|First)\s*Prize[:\s]*([0-9]{4})\b/i);
  if (!first) return null;
  const second = grab4(/(?:2nd|Second)\s*Prize[:\s]*([0-9]{4})\b/i);
  const third = grab4(/(?:3rd|Third)\s*Prize[:\s]*([0-9]{4})\b/i);
  const sp = txt.match(/Special\s*(?:Prizes?)?[:\s]*((?:\b[0-9]{4}\b[\s,]*){2,})/i);
  const co = txt.match(/Consolation\s*(?:Prizes?)?[:\s]*((?:\b[0-9]{4}\b[\s,]*){2,})/i);
  const dm = txt.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})\b/);
  return {
    site: 'Magnum 4D', url: 'https://www.magnum4d.my',
    drawNo: drawNo, date: dm ? (dm[1] + '/' + dm[2] + '/' + dm[3]) : '',
    first: first, second: second, third: third,
    special: sp ? (sp[1].match(/\b\d{4}\b/g) || []) : [],
    consolation: co ? (co[1].match(/\b\d{4}\b/g) || []) : []
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ============================================
    // 1. ROUTING HALAMAN HTML
    // ============================================
    if (path === '/') return env.ASSETS.fetch(new Request(new URL('/Dashboard.html', request.url), request));
    if (path === '/login' || path === '/Login.html') return env.ASSETS.fetch(new Request(new URL('/Login.html', request.url), request));
    if (path === '/register' || path === '/Register.html') return env.ASSETS.fetch(new Request(new URL('/Register.html', request.url), request));
    if (path === '/authority' || path === '/Authority.html') return env.ASSETS.fetch(new Request(new URL('/Authority.html', request.url), request));
    if (path === '/syair' || path === '/Syair.html') return env.ASSETS.fetch(new Request(new URL('/Syair.html', request.url), request));
    if (path === '/prediksi' || path === '/Prediksi.html') return env.ASSETS.fetch(new Request(new URL('/Prediksi.html', request.url), request));
    if (path === '/validator' || path === '/Validator.html') return env.ASSETS.fetch(new Request(new URL('/Validator.html', request.url), request));
    if (path === '/analyzer' || path === '/Analyzer.html') return env.ASSETS.fetch(new Request(new URL('/Analyzer.html', request.url), request));
    if (path === '/pgreport' || path === '/PgReport.html') return env.ASSETS.fetch(new Request(new URL('/PgReport.html', request.url), request));
    if (path === '/bank' || path === '/Bank.html') return env.ASSETS.fetch(new Request(new URL('/Bank.html', request.url), request));
    if (path === '/myevent' || path === '/MyEvent.html') return env.ASSETS.fetch(new Request(new URL('/MyEvent.html', request.url), request));

    // ============================================
    // HELPERS
    // ============================================
    async function isAdmin(req) {
      const username = req.headers.get('x-auth-token');
      if (!username) return false;
      const user = await env.DB.prepare("SELECT role FROM users WHERE username = ?").bind(username).first();
      return !!(user && (user.role === 'ADMIN' || user.role === 'MASTER'));
    }

    async function isUser(req) {
      const username = req.headers.get('x-auth-token');
      if (!username) return false;
      const user = await env.DB.prepare("SELECT username FROM users WHERE username = ?").bind(username).first();
      return !!user;
    }

    async function getRegisSetting() {
      const row = await env.DB.prepare("SELECT value FROM settings WHERE key = 'registration'").first();
      return row ? JSON.parse(row.value) : { open: true, defaultRole: 'MEMBER', requireApproval: false };
    }

    const VALID_ROLES = ['MASTER', 'ADMIN', 'MEMBER'];
    const VALID_MODULES = [
      // Group keys (4)
      'core', 'workspace', 'operational', 'system',
      // Sub-menu keys (2) — Authority Panel
      'user_management', 'registration_control',
      // Module item keys (15) — match Dashboard data-access-item attributes
      'dashboard', 'profil', 'banking_tools', 'rek_validator', 'bank_processor',
      'saldo_pencairan', 'qris_tools', 'prediction_tools', 'event_tools',
      'edit_bukti', 'keep_memo', 'api_key', 'setting', 'ip_whitelist', 'authority_panel',
      // Sub-menu item keys (11) — level menu > sub-menu (v2.3)
      'p2m_analyzer', 'xpay_analyzer', 'xpay_settlement', 'settlement_checker', 'mnpay_analyzer',
      'syair_database', 'ai_prediction', 'gas_slot_engine',
      'my_event', 'history_event', 'pg_report',
      // Livechat Essentials (8) — v2.5 (termasuk sub-menu bertingkat pk_*)
      'livechat_essentials', 'prediksi_all_pasaran', 'jadwal_all_pasaran', 'pk_jadwal_pasaran',
      'link_alternatif', 'perhitungan_parlay', 'hadiah_togel', 'pk_perhitungan'
    ];

    // Peta sub-menu -> menu induk (migrasi data legacy level-menu).
    // Harus sinkron dengan CHILD_PARENT authority-pro.js & CHILD_PARENT_MAP Dashboard.html
    const CHILD_TO_PARENT = {
      p2m_analyzer: 'qris_tools', xpay_analyzer: 'qris_tools',
      xpay_settlement: 'qris_tools', settlement_checker: 'qris_tools',
      mnpay_analyzer: 'qris_tools',
      syair_database: 'prediction_tools', ai_prediction: 'prediction_tools',
      gas_slot_engine: 'prediction_tools',
      my_event: 'event_tools', history_event: 'event_tools',
      pg_report: 'event_tools',
      // Livechat Essentials (v2.5)
      prediksi_all_pasaran: 'livechat_essentials',
      jadwal_all_pasaran: 'livechat_essentials',
      pk_jadwal_pasaran: 'jadwal_all_pasaran',
      link_alternatif: 'livechat_essentials',
      perhitungan_parlay: 'livechat_essentials',
      hadiah_togel: 'livechat_essentials',
      pk_perhitungan: 'hadiah_togel'
    };

    // ===== DEFAULT ACCESS PER ROLE =====
    // MASTER: full access tak terbatas (semua modul true)
    // ADMIN:  Core, Workspace, Operational, System, User Management, Registrasi
    // MEMBER: hanya Core (selebihnya ditentukan oleh Admin/Master)
    function defaultAccessFor(role) {
      // MASTER: full access tak terbatas (semua 32 modul true)
      if (role === 'MASTER') {
        return {
          // Groups
          core: true, workspace: true, operational: true, system: true,
          // Sub-menu (System)
          user_management: true, registration_control: true,
          // Core items
          dashboard: true, profil: true,
          // Workspace items
          banking_tools: true, rek_validator: true, bank_processor: true,
          saldo_pencairan: true, qris_tools: true,
          p2m_analyzer: true, xpay_analyzer: true, xpay_settlement: true,
          settlement_checker: true, mnpay_analyzer: true,
          prediction_tools: true, syair_database: true, ai_prediction: true,
          gas_slot_engine: true,
          event_tools: true, my_event: true, history_event: true, pg_report: true,
          livechat_essentials: true, prediksi_all_pasaran: true,
          jadwal_all_pasaran: true, pk_jadwal_pasaran: true,
          link_alternatif: true, perhitungan_parlay: true,
          hadiah_togel: true, pk_perhitungan: true,
          edit_bukti: true, keep_memo: true,
          // System items
          api_key: true, setting: true,
          ip_whitelist: true, authority_panel: true
        };
      }
      // ADMIN: Core + Workspace + Operational + System(Authority+UM only)
      if (role === 'ADMIN') {
        return {
          core: true, workspace: true, operational: true, system: true,
          user_management: true, registration_control: true,
          dashboard: true, profil: true,
          banking_tools: true, rek_validator: true, bank_processor: true,
          saldo_pencairan: true, qris_tools: true,
          p2m_analyzer: true, xpay_analyzer: true, xpay_settlement: true,
          settlement_checker: true, mnpay_analyzer: true,
          prediction_tools: true, syair_database: true, ai_prediction: true,
          gas_slot_engine: true,
          event_tools: true, my_event: true, history_event: true, pg_report: true,
          livechat_essentials: true, prediksi_all_pasaran: true,
          jadwal_all_pasaran: true, pk_jadwal_pasaran: true,
          link_alternatif: true, perhitungan_parlay: true,
          hadiah_togel: true, pk_perhitungan: true,
          edit_bukti: true, keep_memo: true,
          api_key: true, setting: true,
          ip_whitelist: true, authority_panel: true
        };
      }
      // MEMBER: default hanya Core (dashboard + profil)
      return {
        core: true, workspace: false, operational: false, system: false,
        user_management: false, registration_control: false,
        dashboard: true, profil: true,
        banking_tools: false, rek_validator: false, bank_processor: false,
        saldo_pencairan: false, qris_tools: false,
        p2m_analyzer: false, xpay_analyzer: false, xpay_settlement: false,
        settlement_checker: false, mnpay_analyzer: false,
        prediction_tools: false, syair_database: false, ai_prediction: false,
        gas_slot_engine: false,
        event_tools: false, my_event: false, history_event: false, pg_report: false,
        livechat_essentials: false, prediksi_all_pasaran: false,
        jadwal_all_pasaran: false, pk_jadwal_pasaran: false,
        link_alternatif: false, perhitungan_parlay: false,
        hadiah_togel: false, pk_perhitungan: false,
        edit_bukti: false, keep_memo: false,
        api_key: false, setting: false,
        ip_whitelist: false, authority_panel: false
      };
    }

    // Ambil role user yang sedang request (dari x-auth-token header)
    async function getRequesterRole(req) {
      const username = req.headers.get('x-auth-token');
      if (!username) return null;
      const user = await env.DB.prepare("SELECT role FROM users WHERE username = ?").bind(username).first();
      return user ? user.role : null;
    }

    async function isMaster(req) {
      return await getRequesterRole(req) === 'MASTER';
    }

    // ===== ACCESS-AWARE PERMISSION HELPERS =====
    // Selain role (ADMIN/MASTER), API authority juga menghormati flag
    // access control per-user yang disimpan di kolom users.access (JSON).
    // - canViewUsers           : boleh melihat daftar user (User Management)
    // - canManageRegistration  : boleh melihat/mengatur registrasi mandiri
    // Mutasi (add/delete/edit access) TETAP role-gated (ADMIN/MASTER saja).
    async function getUserAccess(req) {
      const username = req.headers.get('x-auth-token');
      if (!username) return null;
      const user = await env.DB.prepare("SELECT role, access FROM users WHERE username = ?").bind(username).first();
      if (!user) return null;
      return safeParseAccess(user.access, user.role);
    }

    async function canViewUsers(req) {
      if (await isAdmin(req)) return true;
      const acc = await getUserAccess(req);
      return !!(acc && acc.user_management === true);
    }

    async function canManageRegistration(req) {
      if (await isAdmin(req)) return true;
      const acc = await getUserAccess(req);
      return !!(acc && acc.registration_control === true);
    }

    // ===== SAFE JSON PARSE =====
    // Parse access JSON dengan aman — fallback ke defaultAccessFor jika rusak/null
    function safeParseAccess(accessStr, role) {
      const defaults = defaultAccessFor(role);
      if (!accessStr) return defaults;
      try {
        const parsed = JSON.parse(accessStr);
        if (parsed && typeof parsed === 'object') {
          // Merge: ensure all 32 keys exist (fill missing from defaults)
          const merged = {};
          VALID_MODULES.forEach(m => {
            merged[m] = (typeof parsed[m] === 'boolean') ? parsed[m] : defaults[m];
          });
          // Migrasi legacy: key sub-menu yang belum pernah disimpan di data
          // lama mewarisi akses menu induknya (agar akses berjalan tidak hilang)
          Object.keys(CHILD_TO_PARENT).forEach(child => {
            if (typeof parsed[child] !== 'boolean') merged[child] = merged[CHILD_TO_PARENT[child]];
          });
          return merged;
        }
        return defaults;
      } catch (e) {
        // JSON rusak (mis. {dashboard: true} tanpa quotes) — gunakan default
        return defaults;
      }
    }

    // ============================================
    // 2. API LOGIN
    // ============================================
    if (path === '/api/login' && request.method === 'POST') {
      try {
        const { username, password } = await request.json();

        // ===== DETECT IP =====
        const clientIp = request.headers.get('cf-connecting-ip') ||
                         request.headers.get('x-real-ip') ||
                         (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
                         '127.0.0.1';
        const userAgent = request.headers.get('user-agent') || '';

        // ===== CHECK IP WHITELIST (server-side enforcement) =====
        // This is the authoritative block. Client-side check in Login.html is just UX.
        let ipBlocked = false;
        let blockMessage = '';
        try {
          const wlSetting = await env.DB.prepare("SELECT value FROM settings WHERE key = 'ip_whitelist'").first();
          if (wlSetting && wlSetting.value) {
            let wlConfig;
            try { wlConfig = JSON.parse(wlSetting.value); } catch(e) { wlConfig = { enabled: false }; }
            // Lenient enabled check: accept boolean true OR string 'true'
            const is_enabled = wlConfig.enabled === true || wlConfig.enabled === 'true';
            if (is_enabled) {
              // Whitelist is ON — check if IP is allowed
              const { results: wlResults } = await env.DB.prepare("SELECT ip_address FROM ip_whitelist").all();
              const wlIps = (wlResults || []).map(w => (w.ip_address || '').trim()).filter(ip => ip !== '');
              // Match: exact OR client is localhost OR IPv4-mapped IPv6
              // NOTE: 0.0.0.0 is NOT a wildcard — only exact matches allowed.
              //       ::1 check is for CLIENT being localhost, NOT for DB entry being ::1.
              const allowed = wlIps.some(ip =>
                ip === clientIp ||                           // exact match
                (clientIp === '::1' && ip === '::1') ||      // client is localhost AND ::1 is whitelisted
                ip === '::ffff:' + clientIp ||               // IPv4-mapped IPv6
                clientIp === '::ffff:' + ip
              );
              if (!allowed) {
                ipBlocked = true;
                blockMessage = wlConfig.message || 'IP Anda tidak ada dalam whitelist. Hubungi admin.';
              }
            }
          }
        } catch(wlErr) {
          // Whitelist table might not exist yet — log but don't block
          console.error('IP whitelist check error:', wlErr);
        }

        // If blocked — check if user is MASTER (MASTER bypasses IP whitelist)
        if (ipBlocked && username) {
          try {
            const masterCheck = await env.DB.prepare("SELECT role FROM users WHERE username = ?").bind(username).first();
            if (masterCheck && masterCheck.role === 'MASTER') {
              // MASTER bypasses IP whitelist — allow login from any IP
              ipBlocked = false;
              try { await env.DB.prepare("INSERT INTO ip_login_logs (ip_address, username, status, user_agent) VALUES (?, ?, 'MASTER_BYPASS', ?)").bind(clientIp, username, userAgent).run(); } catch(e) {}
            }
          } catch(e) {
            // If user check fails, keep the block (fail-safe)
          }
        }

        // If still blocked — log BLOCKED and return 403 BEFORE checking credentials
        if (ipBlocked) {
          try { await env.DB.prepare("INSERT INTO ip_login_logs (ip_address, username, status, user_agent) VALUES (?, ?, 'BLOCKED', ?)").bind(clientIp, username || '', userAgent).run(); } catch(e) {}
          return Response.json({ success: false, error: blockMessage + ' (IP: ' + clientIp + ')' }, { status: 403 });
        }

        const { results } = await env.DB.prepare("SELECT * FROM users WHERE username = ? AND password = ?").bind(username, password).all();

        if (results.length > 0) {
          const user = results[0];
          if (user.status === 'PENDING') {
            // Log pending
            try { await env.DB.prepare("INSERT INTO ip_login_logs (ip_address, username, status, user_agent) VALUES (?, ?, 'PENDING', ?)").bind(clientIp, username, userAgent).run(); } catch(e) {}
            return Response.json({ success: false, error: 'Akun Anda menunggu persetujuan admin!' }, { status: 403 });
          }
          // Log success
          try { await env.DB.prepare("INSERT INTO ip_login_logs (ip_address, username, status, user_agent) VALUES (?, ?, 'SUCCESS', ?)").bind(clientIp, username, userAgent).run(); } catch(e) {}
          return Response.json({ success: true, message: 'Login berhasil!', user: { username: user.username, role: user.role, access: safeParseAccess(user.access, user.role) } });
        } else {
          // Log failed
          try { await env.DB.prepare("INSERT INTO ip_login_logs (ip_address, username, status, user_agent) VALUES (?, ?, 'FAILED', ?)").bind(clientIp, username || '', userAgent).run(); } catch(e) {}
          return Response.json({ success: false, error: 'Username atau Password salah!' });
        }
      } catch (err) {
        return Response.json({ success: false, error: 'Server Error: ' + err.message }, { status: 500 });
      }
    }

    // ============================================
    // 3. API GET USERS (Admin, atau user dengan flag user_management)
    // ============================================
    if (path === '/api/users' && request.method === 'GET') {
      if (!await canViewUsers(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const { results } = await env.DB.prepare("SELECT username, role, status, access, granted_by, created_at FROM users").all();
        const users = results.map(u => ({
          username: u.username,
          role: u.role,
          status: u.status,
          access: safeParseAccess(u.access, u.role),
          granted_by: u.granted_by || null,
          created_at: u.created_at || null
        }));
        return Response.json(users);
      } catch (err) {
        return Response.json({ error: 'Gagal mengambil data' }, { status: 500 });
      }
    }

    // ============================================
    // 4. API ADD USER (Hanya Admin)
    // ============================================
    if (path === '/api/users' && request.method === 'POST') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const { username, password, role } = await request.json();
        if (!username || !password || !role) return Response.json({ error: 'Data tidak lengkap' }, { status: 400 });
        if (!VALID_ROLES.includes(role)) return Response.json({ error: 'Role tidak valid! Pilih: MASTER, ADMIN, atau MEMBER.' }, { status: 400 });

        const access = JSON.stringify(defaultAccessFor(role));
        await env.DB.prepare("INSERT INTO users (username, password, role, status, access) VALUES (?, ?, ?, 'ACTIVE', ?)").bind(username, password, role, access).run();
        return Response.json({ success: true, message: 'User berhasil ditambahkan' });
      } catch (err) {
        return Response.json({ error: 'Username sudah ada atau format salah' }, { status: 500 });
      }
    }

    // ============================================
    // 5. API DELETE USER (Hanya Admin)
    // ============================================
    if (path.startsWith('/api/users/') && !path.endsWith('/access') && request.method === 'DELETE') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const usernameToDelete = decodeURIComponent(path.split('/').pop());

        const reqUser = request.headers.get('x-auth-token');
        if (reqUser === usernameToDelete) return Response.json({ error: 'Anda tidak bisa menghapus akun sendiri!' }, { status: 400 });

        const requesterRole = await getRequesterRole(request);
        const target = await env.DB.prepare("SELECT role FROM users WHERE username = ?").bind(usernameToDelete).first();
        if (!target) return Response.json({ error: 'User tidak ditemukan' }, { status: 404 });
        if (target.role === 'MASTER') return Response.json({ error: 'Akun MASTER tidak dapat dihapus!' }, { status: 403 });
        // ADMIN tidak boleh hapus ADMIN lain — hanya MASTER yang bisa
        if (requesterRole === 'ADMIN' && target.role === 'ADMIN') {
          return Response.json({ error: 'Admin tidak dapat menghapus Admin lain! Hanya Master.' }, { status: 403 });
        }

        await env.DB.prepare("DELETE FROM users WHERE username = ?").bind(usernameToDelete).run();
        // Bump data_version so all devices (including the deleted user's devices) refresh.
        // The deleted user's device will get 404 from /api/me → auto-logout to Login page.
        try {
          const dvRow = await env.DB.prepare("SELECT value FROM settings WHERE key = 'data_version'").first();
          let dv = 0;
          if (dvRow && dvRow.value) { try { dv = parseInt(JSON.parse(dvRow.value), 10) || 0; } catch(e) { dv = parseInt(dvRow.value, 10) || 0; } }
          dv++;
          await env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('data_version', ?)").bind(JSON.stringify(dv)).run();
        } catch(e) {}
        return Response.json({ success: true, message: 'User berhasil dihapus' });
      } catch (err) {
        return Response.json({ error: 'Gagal menghapus user' }, { status: 500 });
      }
    }

    // ============================================
    // 6. API PUBLIC: STATUS REGISTRASI
    // ============================================
    if (path === '/api/settings/registration/public' && request.method === 'GET') {
      const setting = await getRegisSetting();
      return Response.json({ open: setting.open });
    }

    // ============================================
    // 7. API GET KONFIGURASI REGISTRASI
    // ============================================
    if (path === '/api/settings/registration' && request.method === 'GET') {
      if (!await canManageRegistration(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      return Response.json(await getRegisSetting());
    }

    // ============================================
    // 8. API SIMPAN KONFIGURASI REGISTRASI
    // ============================================
    if (path === '/api/settings/registration' && request.method === 'PUT') {
      if (!await canManageRegistration(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const body = await request.json();
        const setting = {
          open: !!body.open,
          // FIX: sebelumnya selalu MEMBER (bug ternary). Master/Admin boleh
          // memilih MEMBER atau ADMIN sebagai default role pendaftar.
          defaultRole: (body.defaultRole && VALID_ROLES.includes(body.defaultRole) && body.defaultRole !== 'MASTER')
            ? body.defaultRole
            : 'MEMBER',
          requireApproval: !!body.requireApproval
        };
        await env.DB.prepare("UPDATE settings SET value = ? WHERE key = 'registration'").bind(JSON.stringify(setting)).run();
        return Response.json({ success: true, message: 'Konfigurasi registrasi tersimpan' });
      } catch (err) {
        return Response.json({ error: 'Gagal menyimpan konfigurasi' }, { status: 500 });
      }
    }

    // ============================================
    // 9. API EDIT ACCESS CONTROL USER
    // ============================================
    const accessMatch = path.match(/^\/api\/users\/([^/]+)\/access$/);
    if (accessMatch && request.method === 'PUT') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Master/Admin.' }, { status: 403 });
      try {
        const username = decodeURIComponent(accessMatch[1]);
        const body = await request.json();
        const requesterRole = await getRequesterRole(request);

        const user = await env.DB.prepare("SELECT role FROM users WHERE username = ?").bind(username).first();
        if (!user) return Response.json({ error: 'User tidak ditemukan' }, { status: 404 });
        if (user.role === 'MASTER') return Response.json({ error: 'Akun MASTER tidak dapat diubah!' }, { status: 403 });

        // ===== ROLE-BASED PERMISSION ENFORCEMENT =====
        // ADMIN hanya boleh edit user MEMBER
        if (requesterRole === 'ADMIN') {
          if (user.role !== 'MEMBER') {
            return Response.json({ error: 'Admin hanya dapat mengubah user Member! User ini adalah ' + user.role + '.' }, { status: 403 });
          }
          // Admin tidak boleh set role selain MEMBER
          if (body.role && body.role !== 'MEMBER') {
            return Response.json({ error: 'Admin tidak dapat mengubah role Member! Hanya Master yang bisa promote.' }, { status: 403 });
          }
        }
        // MASTER boleh edit siapa saja (kecuali MASTER lain — sudah dicek di atas)

        // Validasi role baru
        const newRole = body.role && VALID_ROLES.includes(body.role) ? body.role : user.role;
        // Merge logic: preserve existing access for keys not sent in body
        // (avoid overwriting missing keys with false)
        const existingAccess = safeParseAccess(user.access, user.role);
        const access = {};
        VALID_MODULES.forEach(m => {
          if (body.access && typeof body.access[m] === 'boolean') {
            access[m] = body.access[m];
          } else if (typeof existingAccess[m] === 'boolean') {
            access[m] = existingAccess[m];
          } else {
            access[m] = false;
          }
        });
        const grantedBy = request.headers.get('x-auth-token');

        await env.DB.prepare("UPDATE users SET role = ?, access = ?, granted_by = ? WHERE username = ?")
          .bind(newRole, JSON.stringify(access), grantedBy, username).run();
        // Bump data_version so all devices refresh their access
        try {
          const dvRow = await env.DB.prepare("SELECT value FROM settings WHERE key = 'data_version'").first();
          let dv = 0;
          if (dvRow && dvRow.value) { try { dv = parseInt(JSON.parse(dvRow.value), 10) || 0; } catch(e) { dv = parseInt(dvRow.value, 10) || 0; } }
          dv++;
          await env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('data_version', ?)").bind(JSON.stringify(dv)).run();
        } catch(e) {}
        return Response.json({ success: true, message: 'Access control diperbarui oleh ' + grantedBy });
      } catch (err) {
        return Response.json({ error: 'Gagal menyimpan akses: ' + err.message }, { status: 500 });
      }
    }

    // ============================================
    // 10. API DAFTAR REGISTRASI PENDING
    // ============================================
    if (path === '/api/registrations/pending' && request.method === 'GET') {
      if (!await canManageRegistration(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const { results } = await env.DB.prepare("SELECT username, role, status FROM users WHERE status = 'PENDING'").all();
        return Response.json(results);
      } catch (err) {
        return Response.json({ error: 'Gagal mengambil data' }, { status: 500 });
      }
    }

    // ============================================
    // 11. API APPROVE / REJECT REGISTRASI
    // ============================================
    const regisMatch = path.match(/^\/api\/registrations\/([^/]+)$/);
    if (regisMatch && request.method === 'PUT') {
      if (!await canManageRegistration(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const username = decodeURIComponent(regisMatch[1]);
        const body = await request.json();

        if (body.action === 'approve') {
          await env.DB.prepare("UPDATE users SET status = 'ACTIVE' WHERE username = ? AND status = 'PENDING'").bind(username).run();
          return Response.json({ success: true, message: 'Registrasi disetujui' });
        } else if (body.action === 'reject') {
          await env.DB.prepare("DELETE FROM users WHERE username = ? AND status = 'PENDING'").bind(username).run();
          // Bump data_version (rejected user's device will get 404 → auto-logout)
          try {
            const dvRow = await env.DB.prepare("SELECT value FROM settings WHERE key = 'data_version'").first();
            let dv = 0;
            if (dvRow && dvRow.value) { try { dv = parseInt(JSON.parse(dvRow.value), 10) || 0; } catch(e) { dv = parseInt(dvRow.value, 10) || 0; } }
            dv++;
            await env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('data_version', ?)").bind(JSON.stringify(dv)).run();
          } catch(e) {}
          return Response.json({ success: true, message: 'Registrasi ditolak' });
        }
        return Response.json({ error: 'Action tidak valid' }, { status: 400 });
      } catch (err) {
        return Response.json({ error: 'Gagal memproses: ' + err.message }, { status: 500 });
      }
    }

    // ============================================
    // 12. API REGISTER (Publik)
    // ============================================
    if (path === '/api/register' && request.method === 'POST') {
      try {
        const setting = await getRegisSetting();
        if (!setting.open) return Response.json({ error: 'Pendaftaran sedang ditutup!' }, { status: 403 });

        const body = await request.json();
        if (!body.username || !body.password) return Response.json({ error: 'Username & password wajib diisi' }, { status: 400 });

        const exists = await env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(body.username).first();
        if (exists) return Response.json({ error: 'Username sudah terdaftar!' }, { status: 409 });

        const regRole = (setting.defaultRole && VALID_ROLES.includes(setting.defaultRole)) ? setting.defaultRole : 'MEMBER';
        const access = JSON.stringify(defaultAccessFor(regRole));
        const status = setting.requireApproval ? 'PENDING' : 'ACTIVE';

        await env.DB.prepare("INSERT INTO users (username, password, role, status, access) VALUES (?, ?, ?, ?, ?)")
          .bind(body.username, body.password, regRole, status, access).run();

        return Response.json({ success: true, pending: setting.requireApproval });
      } catch (err) {
        return Response.json({ error: 'Gagal mendaftar: ' + err.message }, { status: 500 });
      }
    }

    // ============================================
    // 13. API PENCAIRAN / SALDO KAS (Hanya Admin)
    // ============================================

    // 13a. GET: data per tanggal
    if (path === '/api/pencairan' && request.method === 'GET') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const date = url.searchParams.get('date') || new Date().toISOString().slice(0, 10);
        const { results } = await env.DB.prepare("SELECT * FROM pencairan WHERE date = ? ORDER BY id ASC").bind(date).all();

        const rows = (results || []).map(r => ({
          id: r.id, sheet: r.sheet, nama: r.nama, rek: r.rek,
          saldoN9: r.saldo_n9, pending: r.pending, saldoAsli: r.saldo_asli,
          cair: r.cair, status: r.status, ket: r.ket
        }));

        const totals = rows.reduce((acc, r) => ({
          totalN9: acc.totalN9 + r.saldoN9,
          totalPending: acc.totalPending + r.pending,
          totalAsli: acc.totalAsli + r.saldoAsli,
          totalCair: acc.totalCair + r.cair,
          belumProses: acc.belumProses + (r.status !== 'OK' ? r.cair : 0)
        }), { totalN9: 0, totalPending: 0, totalAsli: 0, totalCair: 0, belumProses: 0 });

        return Response.json({ date: date, rows: rows, totals: totals, count: rows.length });
      } catch (err) {
        return Response.json({ error: 'Gagal mengambil data: ' + err.message }, { status: 500 });
      }
    }

    // 13b. POST: tambah data (1 baris atau array)
    if (path === '/api/pencairan' && request.method === 'POST') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const body = await request.json();
        const items = Array.isArray(body) ? body : [body];
        const createdBy = request.headers.get('x-auth-token');
        let inserted = 0;

        for (const item of items) {
          if (!item.date) continue;
          await env.DB.prepare(
            "INSERT INTO pencairan (date, sheet, nama, rek, saldo_n9, pending, saldo_asli, cair, status, ket, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
          ).bind(
            item.date, item.sheet || '', item.nama || '', item.rek || '',
            parseInt(item.saldoN9) || 0, parseInt(item.pending) || 0,
            parseInt(item.saldoAsli) || 0, parseInt(item.cair) || 0,
            item.status || 'PENDING', item.ket || '', createdBy, Date.now()
          ).run();
          inserted++;
        }

        return Response.json({ success: true, inserted: inserted, message: inserted + ' baris berhasil ditambahkan' });
      } catch (err) {
        return Response.json({ error: 'Gagal menambah data: ' + err.message }, { status: 500 });
      }
    }

    // 13c. PUT: update baris by id
    const cairMatch = path.match(/^\/api\/pencairan\/(\d+)$/);
    if (cairMatch && request.method === 'PUT') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const id = cairMatch[1];
        const body = await request.json();

        const existing = await env.DB.prepare("SELECT * FROM pencairan WHERE id = ?").bind(id).first();
        if (!existing) return Response.json({ error: 'Data tidak ditemukan' }, { status: 404 });

        await env.DB.prepare(
          "UPDATE pencairan SET sheet = ?, nama = ?, rek = ?, saldo_n9 = ?, pending = ?, saldo_asli = ?, cair = ?, status = ?, ket = ? WHERE id = ?"
        ).bind(
          body.sheet !== undefined ? body.sheet : existing.sheet,
          body.nama !== undefined ? body.nama : existing.nama,
          body.rek !== undefined ? body.rek : existing.rek,
          body.saldoN9 !== undefined ? parseInt(body.saldoN9) || 0 : existing.saldo_n9,
          body.pending !== undefined ? parseInt(body.pending) || 0 : existing.pending,
          body.saldoAsli !== undefined ? parseInt(body.saldoAsli) || 0 : existing.saldo_asli,
          body.cair !== undefined ? parseInt(body.cair) || 0 : existing.cair,
          body.status !== undefined ? body.status : existing.status,
          body.ket !== undefined ? body.ket : existing.ket,
          id
        ).run();

        return Response.json({ success: true, message: 'Data pencairan diperbarui' });
      } catch (err) {
        return Response.json({ error: 'Gagal update: ' + err.message }, { status: 500 });
      }
    }

    // 13d. DELETE: hapus baris by id
    if (cairMatch && request.method === 'DELETE') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        await env.DB.prepare("DELETE FROM pencairan WHERE id = ?").bind(cairMatch[1]).run();
        return Response.json({ success: true, message: 'Data pencairan dihapus' });
      } catch (err) {
        return Response.json({ error: 'Gagal menghapus: ' + err.message }, { status: 500 });
      }
    }

    // ============================================
    // 13f. API JADWAL PASARAN (SQLite D1 — panel terhubung database)
    // ============================================
    const PASARAN_SEED = [
    { no: 1, nama: "HOKI DRAW", jadwal: "SETIAP HARI", tutup: "RESULT 24x", result: "SETIAP 1 JAM", link: "https://hokidraw.com/" },
    { no: 2, nama: "TOTO MACAU PAGI", jadwal: "SETIAP HARI", tutup: "00:00 WIB", result: "00:15 WIB", link: "https://www.totomacau-pools.us/" },
    { no: 3, nama: "KENTUCKY MIDDAY", jadwal: "SETIAP HARI", tutup: "00:05 WIB", result: "00:20 WIB", link: "https://www.kylottery.com/apps/draw_games/pick4/index.html" },
    { no: 4, nama: "FLORIDA MIDDAY", jadwal: "SETIAP HARI", tutup: "00:20 WIB", result: "00:30 WIB", link: "https://floridalottery.com/games/draw-games/pick-4" },
    { no: 5, nama: "HUAHIN 0100", jadwal: "SETIAP HARI", tutup: "00:45 WIB", result: "01:00 WIB", link: "https://huahinlottery.com/" },
    { no: 6, nama: "NEW YORK MIDDAY", jadwal: "SETIAP HARI", tutup: "01:15 WIB", result: "01:25 WIB", link: "http://nylottery.ny.gov/wps/portal/Home/Lottery/home/your+lottery/winning+numbers/win4pastwinning+numbers" },
    { no: 7, nama: "BANGKOK 0130", jadwal: "SETIAP HARI", tutup: "01:15 WIB", result: "01:30 WIB", link: "https://bangkokpoolstoday.com/" },
    { no: 8, nama: "CAROLINA DAY", jadwal: "SETIAP HARI", tutup: "01:45 WIB", result: "02:00 WIB", link: "https://www.wral.com/entertainment/lottery/" },
    { no: 9, nama: "BRUNEI 02", jadwal: "SETIAP HARI", tutup: "02:30 WIB", result: "02:45 WIB", link: "https://bruneipools.com/" },
    { no: 10, nama: "OREGON03", jadwal: "SETIAP HARI", tutup: "02:50 WIB", result: "03:00 WIB", link: "https://www.oregonlottery.org/pick-4/winning-numbers/" },
    { no: 11, nama: "OREGON06", jadwal: "SETIAP HARI", tutup: "05:50 WIB", result: "06:00 WIB", link: "https://www.oregonlottery.org/pick-4/winning-numbers/" },
    { no: 12, nama: "CALIFORNIA", jadwal: "SETIAP HARI", tutup: "08:25 WIB", result: "08:30 WIB", link: "https://www.calottery.com/draw-games/daily-4" },
    { no: 13, nama: "FLORIDA EVENING", jadwal: "SETIAP HARI", tutup: "08:35 WIB", result: "08:45 WIB", link: "https://floridalottery.com/games/draw-games/pick-4" },
    { no: 14, nama: "OREGON09", jadwal: "SETIAP HARI", tutup: "08:50 WIB", result: "09:00 WIB", link: "https://www.oregonlottery.org/pick-4/winning-numbers/" },
    { no: 15, nama: "BANGKOK 0930", jadwal: "SETIAP HARI", tutup: "09:15 WIB", result: "09:30 WIB", link: "https://bangkokpoolstoday.com/" },
    { no: 16, nama: "NEWYORKEVE", jadwal: "SETIAP HARI", tutup: "09:25 WIB", result: "09:35 WIB", link: "http://nylottery.ny.gov/wps/portal/Home/Lottery/home/your+lottery/winning+numbers/win4pastwinning+numbers" },
    { no: 17, nama: "KENTUCKYEVE", jadwal: "SETIAP HARI", tutup: "09:45 WIB", result: "10:00 WIB", link: "https://www.kylottery.com/apps/draw_games/pick4/index.html" },
    { no: 18, nama: "CAROLINAEVE", jadwal: "SETIAP HARI", tutup: "10:17 WIB", result: "10:22 WIB", link: "http://www.wral.com/news/video/1075494/" },
    { no: 19, nama: "TOTOCAMBODIA", jadwal: "SETIAP HARI", tutup: "10:45 WIB", result: "11:00 WIB", link: "https://totocambodialive.com/live-draw.html" },
    { no: 20, nama: "CHELSEA 11", jadwal: "SETIAP HARI", tutup: "11:00 WIB", result: "11:15 WIB", link: "https://chelseapools.co.uk/live-draw.html" },
    { no: 21, nama: "OREGON12", jadwal: "SETIAP HARI", tutup: "11:50 WIB", result: "12:00 WIB", link: "https://www.oregonlottery.org/pick-4/winning-numbers/" },
    { no: 22, nama: "POIPET12", jadwal: "SETIAP HARI", tutup: "12:15 WIB", result: "12:30 WIB", link: "https://poipetlottery.com/" },
    { no: 23, nama: "TOTOMACAU SIANG", jadwal: "SETIAP HARI", tutup: "13:00 WIB", result: "13:15 WIB", link: "https://www.totomacau-pools.us/" },
    { no: 24, nama: "BULLSEYE", jadwal: "SETIAP HARI", tutup: "13:00 WIB", result: "13:15 WIB", link: "https://mylotto.co.nz/results/bullseye" },
    { no: 25, nama: "SYDNEY", jadwal: "SETIAP HARI", tutup: "13:49 WIB", result: "14:05 WIB", link: "https://sydneyfunlotto.net/" },
    { no: 26, nama: "JAKARTA 1400", jadwal: "SETIAP HARI", tutup: "13:55 WIB", result: "14:10 WIB", link: "https://jakartapool.com/" },
    { no: 27, nama: "BRUNEI 14", jadwal: "SETIAP HARI", tutup: "14:30 WIB", result: "14:45 WIB", link: "https://bruneipools.com/" },
    { no: 28, nama: "CHELSEA 15", jadwal: "SETIAP HARI", tutup: "15:00 WIB", result: "15:15 WIB", link: "https://chelseapools.co.uk/live-draw.html" },
    { no: 29, nama: "TOTOMACAU 5D SORE", jadwal: "SETIAP HARI", tutup: "15:15 WIB", result: "15:30 WIB", link: "https://www.totomacau-pools.us/" },
    { no: 30, nama: "TOTOMALI 1530", jadwal: "SETIAP HARI", tutup: "15:15 WIB", result: "15:30 WIB", link: "https://totomali.com/" },
    { no: 31, nama: "POIPET15", jadwal: "SETIAP HARI", tutup: "15:15 WIB", result: "15:30 WIB", link: "https://poipetlottery.com/" },
    { no: 32, nama: "TOTOMACAU SORE", jadwal: "SETIAP HARI", tutup: "16:00 WIB", result: "16:15 WIB", link: "https://www.totomacau-pools.us/" },
    { no: 33, nama: "HUAHIN 1630", jadwal: "SETIAP HARI", tutup: "16:15 WIB", result: "16:30 WIB", link: "https://huahinlottery.com/" },
    { no: 34, nama: "KING KONG 4D SORE", jadwal: "SETIAP HARI", tutup: "17:00 WIB", result: "17:15 WIB", link: "https://kingkongpools.id/" },
    { no: 35, nama: "SINGAPORE", jadwal: "Selasa & Jumat TUTUP", tutup: "17:30 WIB", result: "17:45 WIB", link: "http://www.singaporepools.com.sg" },
    { no: 36, nama: "MAGNUM4D", jadwal: "Rabu, Sabtu & Minggu", tutup: "18:10 WIB", result: "18:40 WIB", link: "http://www.magnum4d.my/en" },
    { no: 37, nama: "TOTOMACAU MALAM I", jadwal: "SETIAP HARI", tutup: "19:00 WIB", result: "19:15 WIB", link: "https://www.totomacau-pools.us/" },
    { no: 38, nama: "CHELSEA 19", jadwal: "SETIAP HARI", tutup: "19:00 WIB", result: "19:15 WIB", link: "https://chelseapools.co.uk/live-draw.html" },
    { no: 39, nama: "POIPET19", jadwal: "SETIAP HARI", tutup: "19:30 WIB", result: "19:45 WIB", link: "https://poipetlottery.com/" },
    { no: 40, nama: "PCSO", jadwal: "MINGGU TUTUP", tutup: "19:50 WIB", result: "20:10 WIB", link: "https://www.pcso.gov.ph/" },
    { no: 41, nama: "TOTOMALI 2030", jadwal: "SETIAP HARI", tutup: "20:15 WIB", result: "20:30 WIB", link: "https://totomali.com/" },
    { no: 42, nama: "HUAHIN 2100", jadwal: "SETIAP HARI", tutup: "20:45 WIB", result: "21:00 WIB", link: "https://huahinlottery.com/" },
    { no: 43, nama: "CHELSEA 21", jadwal: "SETIAP HARI", tutup: "21:00 WIB", result: "21:15 WIB", link: "https://chelseapools.co.uk/live-draw.html" },
    { no: 44, nama: "TOTOMACAU 5D MALAM", jadwal: "SETIAP HARI", tutup: "21:15 WIB", result: "21:25 WIB", link: "https://www.totomacau-pools.us/" },
    { no: 45, nama: "NEVADA", jadwal: "SETIAP HARI", tutup: "21:15 WIB", result: "21:30 WIB", link: "https://www.nevadalottery.us/" },
    { no: 46, nama: "BRUNEI21", jadwal: "SETIAP HARI", tutup: "21:30 WIB", result: "21:45 WIB", link: "https://bruneipools.com/" },
    { no: 47, nama: "TOTOMACAU MALAM II", jadwal: "SETIAP HARI", tutup: "22:00 WIB", result: "22:15 WIB", link: "https://www.totomacau-pools.us/" },
    { no: 48, nama: "POIPET22", jadwal: "SETIAP HARI", tutup: "22:30 WIB", result: "22:45 WIB", link: "https://poipetlottery.com/" },
    { no: 49, nama: "HONGKONG", jadwal: "SETIAP HARI", tutup: "22:59 WIB", result: "23:15 WIB", link: "https://hongkongfunlotto.net/" },
    { no: 50, nama: "TOTOMACAU MALAM III", jadwal: "SETIAP HARI", tutup: "23:00 WIB", result: "23:15 WIB", link: "https://www.totomacau-pools.us/" },
    { no: 51, nama: "TOTOMALI 2330", jadwal: "SETIAP HARI", tutup: "23:15 WIB", result: "23:30 WIB", link: "https://totomali.com/" },
    { no: 52, nama: "JAKARTA 2330", jadwal: "SETIAP HARI", tutup: "23:25 WIB", result: "23:40 WIB", link: "https://jakartapool.com/" },
    { no: 53, nama: "KING KONG 4D MALAM", jadwal: "SETIAP HARI", tutup: "23:30 WIB", result: "23:45 WIB", link: "https://kingkongpools.id/" }
    ];

    // Pastikan tabel pasaran ada (auto-migrate) + seed awal bila kosong.
    async function ensurePasaranTable() {
      try {
        await env.DB.prepare("SELECT no FROM pasaran LIMIT 1").first();
        return;
      } catch (e) {
        await env.DB.prepare(
          "CREATE TABLE IF NOT EXISTS pasaran (id INTEGER PRIMARY KEY AUTOINCREMENT, no INTEGER NOT NULL DEFAULT 0, nama TEXT NOT NULL, jadwal TEXT NOT NULL DEFAULT 'SETIAP HARI', tutup TEXT NOT NULL DEFAULT '', result TEXT NOT NULL DEFAULT '', link TEXT NOT NULL DEFAULT '', updated_by TEXT, updated_at INTEGER)"
        ).run();
        try { await env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_pasaran_no ON pasaran(no)").run(); } catch (e2) {}
        const c = await env.DB.prepare("SELECT COUNT(*) AS c FROM pasaran").first();
        if (!c || c.c === 0) {
          const stmts = PASARAN_SEED.map((p) =>
            env.DB.prepare("INSERT INTO pasaran (no, nama, jadwal, tutup, result, link) VALUES (?, ?, ?, ?, ?, ?)")
              .bind(p.no, p.nama, p.jadwal, p.tutup, p.result, p.link)
          );
          await env.DB.batch(stmts);
        }
      }
    }

    // 13f-1. GET: seluruh pasaran (urut nomor)
    if (path === '/api/pasaran' && request.method === 'GET') {
      if (!await isUser(request)) return Response.json({ error: 'Akses Ditolak! Login dulu.' }, { status: 403 });
      try {
        await ensurePasaranTable();
        const { results } = await env.DB.prepare(
          "SELECT id, no, nama, jadwal, tutup, result, link, updated_by, updated_at FROM pasaran ORDER BY no ASC"
        ).all();
        return Response.json({ success: true, source: 'd1', pasaran: results || [] });
      } catch (err) {
        return Response.json({ error: 'Gagal mengambil pasaran: ' + err.message }, { status: 500 });
      }
    }

    // 13f-2. POST: tambah pasaran baru (no otomatis = max+1)
    if (path === '/api/pasaran' && request.method === 'POST') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        await ensurePasaranTable();
        const body = await request.json();
        const nama = String(body.nama || '').trim().toUpperCase();
        if (!nama) return Response.json({ error: 'Nama pasaran wajib diisi' }, { status: 400 });
        const maxRow = await env.DB.prepare("SELECT COALESCE(MAX(no), 0) AS m FROM pasaran").first();
        const no = (maxRow ? maxRow.m : 0) + 1;
        await env.DB.prepare(
          "INSERT INTO pasaran (no, nama, jadwal, tutup, result, link, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(
          no, nama,
          String(body.jadwal || '').trim() || 'SETIAP HARI',
          String(body.tutup || '').trim(),
          String(body.result || '').trim(),
          String(body.link || '').trim(),
          request.headers.get('x-auth-token'), Date.now()
        ).run();
        const row = await env.DB.prepare(
          "SELECT id, no, nama, jadwal, tutup, result, link, updated_by, updated_at FROM pasaran WHERE no = ?"
        ).bind(no).first();
        return Response.json({ success: true, message: 'Pasaran "' + nama + '" ditambahkan', pasaran: row });
      } catch (err) {
        return Response.json({ error: 'Gagal menambah pasaran: ' + err.message }, { status: 500 });
      }
    }

    // 13f-3. PUT /api/pasaran/:id — edit pasaran
    const psMatch = path.match(/^\/api\/pasaran\/(\d+)$/);
    if (psMatch && request.method === 'PUT') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        await ensurePasaranTable();
        const id = psMatch[1];
        const body = await request.json();
        const existing = await env.DB.prepare("SELECT * FROM pasaran WHERE id = ?").bind(id).first();
        if (!existing) return Response.json({ error: 'Pasaran tidak ditemukan' }, { status: 404 });
        const nama = body.nama !== undefined ? String(body.nama).trim().toUpperCase() : existing.nama;
        if (!nama) return Response.json({ error: 'Nama pasaran wajib diisi' }, { status: 400 });
        await env.DB.prepare(
          "UPDATE pasaran SET nama = ?, jadwal = ?, tutup = ?, result = ?, link = ?, updated_by = ?, updated_at = ? WHERE id = ?"
        ).bind(
          nama,
          body.jadwal !== undefined ? String(body.jadwal).trim() : existing.jadwal,
          body.tutup !== undefined ? String(body.tutup).trim() : existing.tutup,
          body.result !== undefined ? String(body.result).trim() : existing.result,
          body.link !== undefined ? String(body.link).trim() : existing.link,
          request.headers.get('x-auth-token'), Date.now(),
          id
        ).run();
        const row = await env.DB.prepare(
          "SELECT id, no, nama, jadwal, tutup, result, link, updated_by, updated_at FROM pasaran WHERE id = ?"
        ).bind(id).first();
        return Response.json({ success: true, message: 'Pasaran "' + nama + '" diperbarui', pasaran: row });
      } catch (err) {
        return Response.json({ error: 'Gagal update pasaran: ' + err.message }, { status: 500 });
      }
    }

    // 13f-4. DELETE /api/pasaran/:id — hapus pasaran
    if (psMatch && request.method === 'DELETE') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        await ensurePasaranTable();
        const del = await env.DB.prepare("DELETE FROM pasaran WHERE id = ?").bind(psMatch[1]).run();
        return Response.json({ success: true, message: 'Pasaran dihapus', removed: del.meta ? del.meta.changes : 1 });
      } catch (err) {
        return Response.json({ error: 'Gagal menghapus pasaran: ' + err.message }, { status: 500 });
      }
    }

    // ============================================
    // 13g. API HASIL RESMI PASARAN (v3.1.0 — server-side fetch + parse + cache 5 menit)
    //      GET /api/pasaran/results/sg4d | sgtoto | magnum
    // ============================================
    const psResMatch = path.match(/^\/api\/pasaran\/results\/(sg4d|sgtoto|magnum)$/);
    if (psResMatch && request.method === 'GET') {
      if (!await isUser(request)) return Response.json({ success: false, error: 'Akses Ditolak! Login dulu.' }, { status: 403 });
      const psKind = psResMatch[1];
      const psCached = psCacheGet(psKind);
      if (psCached) return Response.json({ success: true, cached: true, data: psCached });
      try {
        let psData = null;
        if (psKind === 'sg4d') {
          psData = psParseSG4D(await psFetch('https://www.singaporepools.com.sg/DataFileArchive/Lottery/Output/fourd_result_top_draws_en.html'));
        } else if (psKind === 'sgtoto') {
          psData = psParseSGToto(await psFetch('https://www.singaporepools.com.sg/DataFileArchive/Lottery/Output/toto_result_top_draws_en.html'));
        } else {
          psData = psParseMagnum(await psFetch('https://www.magnum4d.my/'));
        }
        if (!psData) {
          return Response.json({ success: false, error: 'Gagal membaca hasil dari situs resmi — format berubah atau akses otomatis ditolak. Coba lagi nanti.' }, { status: 502 });
        }
        psCacheSet(psKind, psData);
        return Response.json({ success: true, cached: false, data: psData });
      } catch (psErr) {
        return Response.json({ success: false, error: 'Gagal mengambil data: ' + psErr.message }, { status: 502 });
      }
    }

    // ============================================
    // 14. API BANK FORMATTER
    // ============================================
    if (path === '/api/bank/format' && request.method === 'POST') {
      if (!await isUser(request)) return Response.json({ success: false, error: 'Akses Ditolak! Login dulu.' }, { status: 403 });
      try {
        const body = await request.json();
        const input = (body.input || '').trim();
        if (!input) return Response.json({ success: false, error: 'Input kosong' }, { status: 400 });
        const out = processBankDataLogic(input);
        return Response.json(out);
      } catch (err) {
        return Response.json({ success: false, error: 'Gagal format: ' + err.message }, { status: 500 });
      }
    }

    // ============================================
    // 15. API BANK VALIDATOR
    // ============================================
    if (path === '/api/bank/validate' && request.method === 'POST') {
      if (!await isUser(request)) return Response.json({ success: false, error: 'Akses Ditolak! Login dulu.' }, { status: 403 });
      try {
        const body = await request.json();
        const input = (body.input || '').trim();
        if (!input) return Response.json({ success: false, error: 'Input kosong' }, { status: 400 });
        const out = await processBankDataValidatorLogic(input, env);
        return Response.json(out);
      } catch (err) {
        return Response.json({ success: false, error: 'Gagal validasi: ' + err.message }, { status: 500 });
      }
    }

    // ============================================
    // 15b. SYNC DATABASE — ⚡ VERSI CEPAT (batch insert)
    // ============================================
    if (path === '/api/bank/sync' && request.method === 'POST') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const t0 = Date.now();
        const db = await buildValidatorDatabaseFromSheets();
        const tFetch = Date.now();

        let total = 0, sheets = [];
        const statements = [];
        const now = Date.now();

        for (const cat in db) {
          sheets.push(cat + ' (' + db[cat].length + ')');
          for (const rec of db[cat]) {
            total++;
            statements.push(
              env.DB.prepare(
                "INSERT INTO bank_accounts (bank, nama, no_rek, sheet, status, created_at) VALUES (?, ?, ?, ?, ?, ?)"
              ).bind(cat, rec.nama || '', rec.cleaned, rec.sheet || cat, rec.status || cat, now)
            );
          }
        }

        if (total === 0) {
          return Response.json({ success: false, error: '0 rekening tersinkron — cek FALLBACK_SHEET_NAMES / share sheet (Viewer)', sheets: sheets }, { status: 500 });
        }

        // ⚡ OPTIMASI: hapus + buat index + insert dalam BATCH (bukan satu-satu)
        await env.DB.batch([
          env.DB.prepare("DELETE FROM bank_accounts"),
          env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_bank_accounts_norek ON bank_accounts(no_rek)")
        ]);

        // Insert per chunk 100 statement (aman untuk batas D1 batch)
        for (let i = 0; i < statements.length; i += 100) {
          await env.DB.batch(statements.slice(i, i + 100));
        }

        const tDone = Date.now();
        return Response.json({
          success: true,
          total: total,
          sheets: sheets,
          timing: { fetchSheets: (tFetch - t0) + 'ms', writeDb: (tDone - tFetch) + 'ms', total: (tDone - t0) + 'ms' },
          message: 'Sync selesai: ' + total + ' rekening dalam ' + (tDone - t0) + 'ms'
        });
      } catch (err) {
        return Response.json({ error: 'Gagal sync: ' + err.message }, { status: 500 });
      }
    }

    // 15c. List rekening (admin)
    if (path === '/api/bank/accounts' && request.method === 'GET') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const { results } = await env.DB.prepare("SELECT * FROM bank_accounts ORDER BY id DESC LIMIT 500").all();
        return Response.json(results || []);
      } catch (err) {
        return Response.json({ error: 'Gagal mengambil data: ' + err.message }, { status: 500 });
      }
    }

        // ============================================
    // 16. API VALIDATOR REKENING (halaman /validator)
    //     Format input fleksibel: "BANK, NAMA, REK" / rekening polos
    //     Output shape identik ekspektasi frontend
    // ============================================
    if (path === '/api/validate-rekening' && request.method === 'POST') {
      if (!await isUser(request)) return Response.json({ success: false, error: 'Akses Ditolak! Login dulu.' }, { status: 403 });
      try {
        const body = await request.json();
        const input = String(body.input || '').trim();
        if (!input) return Response.json({ success: false, error: 'Input kosong' }, { status: 400 });

        // Parse input fleksibel (mirror parseInputData frontend)
        const lines = input.split(/[\n;]+/);
        const parsed = [];
        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line) continue;
          let bank = '', nama = '', rek = '';
          if (line.includes(',')) {
            const parts = line.split(',').map(p => p.trim()).filter(p => p);
            if (parts.length >= 3) { bank = parts[0]; nama = parts[1]; rek = parts[2].replace(/\D/g, ''); }
            else if (parts.length === 2) {
              if (/\d{5,}/.test(parts[1])) { nama = parts[0]; rek = parts[1].replace(/\D/g, ''); }
              else { bank = parts[0]; nama = parts[1]; }
            } else {
              const m = line.match(/\d{5,}/); if (m) rek = m[0];
            }
          } else {
            const m = line.match(/\d{5,}/);
            if (m) { rek = m[0]; nama = line.replace(m[0], '').trim(); }
          }
          if (rek || nama || bank) parsed.push({ bank, nama, rekening: rek });
        }
        if (parsed.length === 0) return Response.json({ success: false, error: 'Tidak ada data valid di input' }, { status: 400 });

        const results = [];
        let foundCount = 0, lzCount = 0;

        for (const p of parsed) {
          const clean = (p.rekening || '').replace(/\D/g, '');
          const matches = [];

          if (clean) {
            const rows = await env.DB.prepare(
              "SELECT no_rek, bank, nama, sheet, status FROM bank_accounts WHERE no_rek IN (?, ?, ?, ?)"
            ).bind(clean, '0' + clean, '00' + clean, '000' + clean).all();

            for (const row of (rows.results || [])) {
              matches.push({
                category: row.sheet && row.bank && row.sheet !== row.bank
                  ? row.bank + ' — ' + row.sheet
                  : (row.bank || row.sheet || 'TERDAFTAR'),
                label: row.bank || row.sheet || 'TERDAFTAR',
                jenisBank: row.bank || '-',
                row: 0,
                dbNama: row.nama || '',
                status: row.status || '',
                dbRek: row.no_rek
              });
            }

            // Fallback dua arah: strip leading zero dari input
            if (matches.length === 0) {
              const stripped = clean.replace(/^0+/, '');
              if (stripped !== clean && stripped.length >= 5) {
                const r2 = await env.DB.prepare(
                  "SELECT no_rek, bank, nama, sheet, status FROM bank_accounts WHERE no_rek = ?"
                ).bind(stripped).first();
                if (r2) {
                  matches.push({ category: r2.bank || r2.sheet || 'TERDAFTAR', label: r2.bank || 'TERDAFTAR', jenisBank: r2.bank || '-', row: 0, dbNama: r2.nama || '', status: r2.status || '', dbRek: r2.no_rek, strippedZero: true });
                }
              }
            }
          }

          const found = matches.length > 0;
          let leadingZeroAdded = 0;
          if (found) {
            const firstDb = matches[0].dbRek || clean;
            leadingZeroAdded = firstDb.length - clean.length;
          }
          const foundWithLeadingZero = found && leadingZeroAdded !== 0;
          if (found) foundCount++;
          if (foundWithLeadingZero) lzCount++;

          results.push({
            input: p.rekening,
            rekening: found ? (matches[0].dbRek || p.rekening) : p.rekening,
            found: found,
            foundWithLeadingZero: foundWithLeadingZero,
            leadingZeroAdded: leadingZeroAdded,
            categories: [...new Set(matches.map(m => m.category))],
            matches: matches,
            inputBank: p.bank,
            inputNama: p.nama
          });
        }

        return Response.json({
          success: true,
          inputCount: parsed.length,
          results: results,
          leadingZeroCount: lzCount,
          statistics: {
            total: parsed.length,
            found: foundCount,
            notFound: parsed.length - foundCount,
            foundPercentage: parsed.length ? Math.round((foundCount / parsed.length) * 100) : 0
          }
        });
      } catch (err) {
        return Response.json({ success: false, error: 'Gagal validasi: ' + err.message }, { status: 500 });
      }
    }
      // ============================================
    // 17. API UBAH PASSWORD
    // ============================================
    if (path === '/api/user/password' && request.method === 'PUT') {
      const username = request.headers.get('x-auth-token');
      if (!username) return Response.json({ success: false, error: 'Login dulu.' }, { status: 401 });
      try {
        const body = await request.json();
        const { oldPassword, newPassword } = body;

        if (!oldPassword || !newPassword) return Response.json({ success: false, error: 'Password lama dan baru wajib diisi' }, { status: 400 });
        if (newPassword.length < 6) return Response.json({ success: false, error: 'Password baru minimal 6 karakter' }, { status: 400 });
        if (oldPassword === newPassword) return Response.json({ success: false, error: 'Password baru tidak boleh sama' }, { status: 400 });

        const user = await env.DB.prepare("SELECT password FROM users WHERE username = ?").bind(username).first();
        if (!user) return Response.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 });
        if (user.password !== oldPassword) return Response.json({ success: false, error: 'Password lama salah' }, { status: 401 });

        await env.DB.prepare("UPDATE users SET password = ? WHERE username = ?").bind(newPassword, username).run();
        return Response.json({ success: true, message: 'Password berhasil diubah' });
      } catch (err) {
        return Response.json({ success: false, error: 'Gagal mengubah password' }, { status: 500 });
      }
    }

    // ============================================
    // 18. API GET PROFIL USER
    // ============================================
    if (path === '/api/user/profile' && request.method === 'GET') {
      const username = request.headers.get('x-auth-token');
      if (!username) return Response.json({ success: false, error: 'Login dulu.' }, { status: 401 });
      try {
        // SELECT * untuk avoid error kalau kolom created_at/granted_by belum ada
        const user = await env.DB.prepare("SELECT * FROM users WHERE username = ?").bind(username).first();
        if (!user) return Response.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 });

        // Safe parse access — gunakan safeParseAccess agar tidak throw pada JSON rusak
        var profileAccess = null;
        try {
          profileAccess = user.access ? safeParseAccess(user.access, user.role || 'MEMBER') : null;
        } catch(e2) {
          profileAccess = defaultAccessFor(user.role || 'MEMBER');
        }

        // Safe access to created_at (mungkin tidak ada di database lama)
        var sinceVal = '-';
        try {
          if (user.created_at) {
            var d = new Date(user.created_at);
            if (!isNaN(d.getTime())) {
              sinceVal = d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
            }
          }
        } catch(e3) { sinceVal = '-'; }

        return Response.json({
          success: true,
          data: {
            username: user.username,
            role: user.role,
            status: user.status,
            access: profileAccess,
            since: sinceVal
          }
        });
      } catch (err) {
        return Response.json({ success: false, error: 'Gagal mengambil profil: ' + (err.message || err) }, { status: 500 });
      }
    }

    // ============================================
    // API /api/me — Get current user + access from DB
    // ============================================
    if (path === '/api/me' && request.method === 'GET') {
      const username = request.headers.get('x-auth-token');
      if (!username) return Response.json({ success: false, error: 'Not authenticated' }, { status: 401 });
      try {
        const user = await env.DB.prepare("SELECT username, role, status, access FROM users WHERE username = ?").bind(username).first();
        if (!user) return Response.json({ success: false, error: 'User not found' }, { status: 404 });
        const access = safeParseAccess(user.access, user.role);
        return Response.json({
          success: true,
          user: { username: user.username, role: user.role, status: user.status, access: access }
        });
      } catch (err) {
        return Response.json({ success: false, error: 'Server error' }, { status: 500 });
      }
    }

    // ============================================
    // API IP DETECT
    // ============================================
    if (path === '/api/ip/detect' && request.method === 'GET') {
      const cfIp = request.headers.get('cf-connecting-ip');
      const xfwd = request.headers.get('x-forwarded-for');
      const xreal = request.headers.get('x-real-ip');
      let ip = cfIp || xreal || '';
      if (!ip && xfwd) ip = xfwd.split(',')[0].trim();
      if (!ip) ip = '127.0.0.1';
      return Response.json({ success: true, ip: ip });
    }

    // ============================================
    // API IP CHECK (PUBLIC — no auth required)
    // Checks requester's IP against whitelist.
    // Used by Login.html before submitting login form.
    // Returns: { success, ip, enabled, allowed, message }
    // ============================================
    if (path === '/api/ip/check' && request.method === 'GET') {
      const cfIp = request.headers.get('cf-connecting-ip');
      const xfwd = request.headers.get('x-forwarded-for');
      const xreal = request.headers.get('x-real-ip');
      let clientIp = cfIp || xreal || '';
      if (!clientIp && xfwd) clientIp = xfwd.split(',')[0].trim();
      if (!clientIp) clientIp = '127.0.0.1';

      // Parse query string to get username (for MASTER bypass check)
      const url = new URL(request.url);
      const checkUsername = url.searchParams.get('username') || '';

      // MASTER bypass: if username is provided and is MASTER, allow from any IP
      if (checkUsername) {
        try {
          const masterCheck = await env.DB.prepare("SELECT role FROM users WHERE username = ?").bind(checkUsername).first();
          if (masterCheck && masterCheck.role === 'MASTER') {
            return Response.json({
              success: true,
              ip: clientIp,
              enabled: false,
              allowed: true,
              bypass: true,
              message: ''
            });
          }
        } catch(e) {
          // If user check fails, continue with normal IP check
        }
      }

      try {
        const wlSetting = await env.DB.prepare("SELECT value FROM settings WHERE key = 'ip_whitelist'").first();
        if (wlSetting && wlSetting.value) {
          let wlConfig;
          try { wlConfig = JSON.parse(wlSetting.value); } catch(e) { wlConfig = { enabled: false }; }
          const is_enabled = wlConfig.enabled === true || wlConfig.enabled === 'true';
          if (is_enabled) {
            const { results: wlResults } = await env.DB.prepare("SELECT ip_address FROM ip_whitelist").all();
            const wlIps = (wlResults || []).map(w => (w.ip_address || '').trim()).filter(ip => ip !== '');
            const allowed = wlIps.some(ip =>
              ip === clientIp ||
              (clientIp === '::1' && ip === '::1') ||
              ip === '::ffff:' + clientIp ||
              clientIp === '::ffff:' + ip
            );
            return Response.json({
              success: true,
              ip: clientIp,
              enabled: true,
              allowed: allowed,
              message: allowed ? '' : (wlConfig.message || 'IP Anda tidak ada dalam whitelist. Hubungi admin.')
            });
          }
        }
        // Whitelist disabled or not configured
        return Response.json({ success: true, ip: clientIp, enabled: false, allowed: true, message: '' });
      } catch (wlErr) {
        // Tables might not exist yet — allow login (fail open)
        return Response.json({ success: true, ip: clientIp, enabled: false, allowed: true, message: '' });
      }
    }

    // ============================================
    // API IP DEBUG (admin only) — diagnostic endpoint
    // Shows current whitelist state, settings, and requester IP
    // ============================================
    if (path === '/api/ip/debug' && request.method === 'GET') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      const cfIp = request.headers.get('cf-connecting-ip');
      const xfwd = request.headers.get('x-forwarded-for');
      const xreal = request.headers.get('x-real-ip');
      let clientIp = cfIp || xreal || '';
      if (!clientIp && xfwd) clientIp = xfwd.split(',')[0].trim();
      if (!clientIp) clientIp = '127.0.0.1';

      let settings = { enabled: false, message: '' };
      let whitelist = [];
      let error = null;
      try {
        const wlSetting = await env.DB.prepare("SELECT value FROM settings WHERE key = 'ip_whitelist'").first();
        if (wlSetting && wlSetting.value) {
          try { settings = JSON.parse(wlSetting.value); } catch(e) { settings = { enabled: false, raw: wlSetting.value }; }
        }
        const { results: wlResults } = await env.DB.prepare("SELECT id, ip_address, label, added_by, created_at FROM ip_whitelist ORDER BY id").all();
        whitelist = wlResults || [];
      } catch(e) {
        error = e.message;
      }

      // Check what would happen if login was attempted now
      const is_enabled = settings.enabled === true || settings.enabled === 'true';
      let wouldBlock = false;
      if (is_enabled) {
        const allowed = whitelist.some(w =>
          w.ip_address === clientIp ||
          (clientIp === '::1' && w.ip_address === '::1') ||
          w.ip_address === '::ffff:' + clientIp ||
          clientIp === '::ffff:' + w.ip_address
        );
        wouldBlock = !allowed;
      }

      return Response.json({
        success: true,
        client_ip: clientIp,
        headers: {
          'cf-connecting-ip': cfIp || null,
          'x-real-ip': xreal || null,
          'x-forwarded-for': xfwd || null
        },
        settings: settings,
        settings_enabled_parsed: is_enabled,
        whitelist: whitelist,
        whitelist_count: whitelist.length,
        would_block_login: wouldBlock,
        error: error
      });
    }

    // ============================================
    // API DATA VERSION (PUBLIC — no auth)
    // Returns current data_version counter.
    // Dashboard polls this every 30s to detect access changes
    // made from other devices. If version changes → re-fetch /api/me.
    // ============================================
    if (path === '/api/data-version' && request.method === 'GET') {
      try {
        const row = await env.DB.prepare("SELECT value FROM settings WHERE key = 'data_version'").first();
        let version = 0;
        if (row && row.value) {
          try { version = parseInt(JSON.parse(row.value), 10) || 0; } catch(e) { version = parseInt(row.value, 10) || 0; }
        }
        return Response.json({ success: true, version: version });
      } catch(e) {
        return Response.json({ success: true, version: 0 });
      }
    }

    // ============================================
    // API DATA VERSION BUMP (admin only)
    // Increments data_version — forces all devices to refresh.
    // Called when: access changed, user added/deleted, clear all data.
    // ============================================
    if (path === '/api/data-version/bump' && request.method === 'POST') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const row = await env.DB.prepare("SELECT value FROM settings WHERE key = 'data_version'").first();
        let version = 0;
        if (row && row.value) {
          try { version = parseInt(JSON.parse(row.value), 10) || 0; } catch(e) { version = parseInt(row.value, 10) || 0; }
        }
        version++;
        await env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('data_version', ?)").bind(JSON.stringify(version)).run();
        return Response.json({ success: true, version: version, message: 'Data version bumped. All devices will refresh.' });
      } catch(e) {
        return Response.json({ success: false, error: 'Gagal bump version: ' + e.message }, { status: 500 });
      }
    }

    // ============================================
    // API CLEAR ALL LOCAL DATA (admin only)
    // Bumps data_version + clears all sessions.
    // All devices will detect version change → clear localStorage → re-fetch access.
    // ============================================
    if (path === '/api/clear-all-data' && request.method === 'POST') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        // Bump data_version to force all devices to refresh
        const row = await env.DB.prepare("SELECT value FROM settings WHERE key = 'data_version'").first();
        let version = 0;
        if (row && row.value) {
          try { version = parseInt(JSON.parse(row.value), 10) || 0; } catch(e) { version = parseInt(row.value, 10) || 0; }
        }
        version++;
        await env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('data_version', ?)").bind(JSON.stringify(version)).run();
        return Response.json({
          success: true,
          version: version,
          message: 'Semua perangkat akan refresh data access. Version: ' + version
        });
      } catch(e) {
        return Response.json({ success: false, error: 'Gagal clear data: ' + e.message }, { status: 500 });
      }
    }

    // ============================================
    // API IP WHITELIST (GET/POST/PUT)
    // ============================================
    if (path === '/api/ip/whitelist' && (request.method === 'GET' || request.method === 'POST' || request.method === 'PUT')) {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak!' }, { status: 403 });
      if (request.method === 'GET') {
        try {
          const { results: wl } = await env.DB.prepare("SELECT * FROM ip_whitelist ORDER BY id DESC").all();
          const settingRow = await env.DB.prepare("SELECT value FROM settings WHERE key = 'ip_whitelist'").first();
          let ipSettings = { enabled: false, message: 'IP Anda tidak ada dalam whitelist.' };
          if (settingRow) { try { ipSettings = JSON.parse(settingRow.value); } catch(e) {} }
          return Response.json({ success: true, whitelist: wl || [], settings: ipSettings });
        } catch (err) {
          return Response.json({ success: true, whitelist: [], settings: { enabled: false, message: 'IP Anda tidak ada dalam whitelist.' } });
        }
      }
      if (request.method === 'POST') {
        try {
          const { ip, label } = await request.json();
          if (!ip) return Response.json({ error: 'IP wajib diisi' }, { status: 400 });
          const grantedBy = request.headers.get('x-auth-token');
          await env.DB.prepare("INSERT INTO ip_whitelist (ip_address, label, added_by) VALUES (?, ?, ?)").bind(ip, label || '', grantedBy).run();
          return Response.json({ success: true, message: 'IP ditambahkan ke whitelist' });
        } catch (err) { return Response.json({ error: 'IP sudah ada atau gagal' }, { status: 500 }); }
      }
      if (request.method === 'PUT') {
        try {
          const { enabled, message } = await request.json();
          const setting = JSON.stringify({ enabled: !!enabled, message: message || 'IP Anda tidak ada dalam whitelist.' });
          await env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('ip_whitelist', ?)").bind(setting).run();
          return Response.json({ success: true, message: 'Pengaturan IP whitelist disimpan' });
        } catch (err) { return Response.json({ error: 'Gagal menyimpan pengaturan' }, { status: 500 }); }
      }
    }

    // ============================================
    // API IP WHITELIST DELETE
    // ============================================
    const ipDeleteMatch = path.match(/^\/api\/ip\/whitelist\/(\d+)$/);
    if (ipDeleteMatch && request.method === 'DELETE') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak!' }, { status: 403 });
      try {
        const id = parseInt(ipDeleteMatch[1]);
        await env.DB.prepare("DELETE FROM ip_whitelist WHERE id = ?").bind(id).run();
        return Response.json({ success: true, message: 'IP dihapus dari whitelist' });
      } catch (err) { return Response.json({ error: 'Gagal menghapus IP' }, { status: 500 }); }
    }


    // ============================================
    // API EVENT SUBMIT (PUBLIC — x-api-key header)
    // Used by browser extension to submit event data
    // ============================================
    // Accept POST on BOTH /api/event/submit AND /api/event/list (extension uses /list URL)
    if ((path === '/api/event/submit' || path === '/api/event/list') && request.method === 'POST') {
      try {
        // API key validation — accept both x-api-key and X-API-Key headers
        const apiKey = request.headers.get('x-api-key') || request.headers.get('X-API-Key') || '';
        if (!apiKey) return Response.json({ error: 'API key wajib diisi (header x-api-key)' }, { status: 401 });
        const keyRow = await env.DB.prepare("SELECT id, label, scope, active FROM api_keys WHERE key = ?").bind(apiKey).first();
        if (!keyRow || !keyRow.active) {
          return Response.json({ error: 'API key tidak valid atau telah dicabut' }, { status: 403 });
        }
        const body = await request.json();
        // ===== FIELD MAPPING: accept BOTH extension format AND standard format =====
        // Extension: { date, userId, bec, scater, periode, lampiran, situs, game, status, reason }
        // Standard:  { situs, user_id, tipe_game, kode_tiket, hadiah, klaim, bukti_screenshot, status, keterangan, tanggal }
        const situs_val = body.situs || body.site || '';
        const user_id_val = body.user_id || body.userId || '';
        const tipe_game_val = body.tipe_game || body.game || '';
        const kode_tiket_val = body.kode_tiket || body.periode || body.roundId || '';
        const hadiah_val = body.hadiah || body.bec || body.amount || '';
        // KLAIM = metode klaim (Livechat, marketing, WA, dll)
        // BUKTI = URL printscreen/screenshot (dari extension field: lampiran/shot)
        const klaim_val = body.klaim || '';
        const bukti_val = body.bukti_screenshot || body.lampiran || body.shot || '';
        // Status mapping: Success->APPROVED, Rejected->REJECTED, Pending->PENDING
        let status_val = (body.status || 'PENDING').toUpperCase();
        if (status_val === 'SUCCESS') status_val = 'APPROVED';
        const keterangan_val = body.keterangan || body.reason || '';
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const tanggal_val = body.tanggal || body.date || (pad(now.getDate()) + ' ' + months[now.getMonth()] + ' ' + now.getFullYear() + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds()));
        const result = await env.DB.prepare(
          "INSERT INTO events (situs, user_id, tipe_game, kode_tiket, hadiah, klaim, bukti_screenshot, status, keterangan, tanggal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(
          situs_val || null,
          String(user_id_val),
          tipe_game_val || null,
          String(kode_tiket_val),
          hadiah_val || null,
          klaim_val || null,
          bukti_val || null,
          status_val,
          keterangan_val || null,
          tanggal_val
        ).run();
        return Response.json({ success: true, id: result.meta ? result.meta.last_row_id : null, message: 'Event tersimpan' });
      } catch (err) {
        return Response.json({ error: 'Gagal submit event: ' + (err.message || err) }, { status: 500 });
      }
    }

    // ============================================
    // API EVENT LIST (ADMIN — x-auth-token header)
    // Returns events from last 2 days + auto-cleanup older
    // ============================================
    if (path === '/api/event/list' && request.method === 'GET') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak!' }, { status: 403 });
      try {
        // Auto-cleanup: delete events older than 2 days
        await env.DB.prepare("DELETE FROM events WHERE created_at < datetime('now', '-2 days')").run();
        // Return recent events
        const { results } = await env.DB.prepare("SELECT * FROM events ORDER BY datetime(created_at) DESC LIMIT 500").all();
        return Response.json({ success: true, events: results || [] });
      } catch (err) {
        return Response.json({ error: 'Gagal memuat event: ' + (err.message || err) }, { status: 500 });
      }
    }

    // ============================================
    // API EVENT DELETE (ADMIN)
    // Body: { ids: [1,2,3] } or { all: true }
    // ============================================
    if (path === '/api/event/delete' && request.method === 'DELETE') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak!' }, { status: 403 });
      try {
        const body = await request.json();
        if (body.all === true) {
          await env.DB.prepare("DELETE FROM events").run();
          return Response.json({ success: true, message: 'Semua event dihapus' });
        }
        const ids = Array.isArray(body.ids) ? body.ids.map(Number).filter((n) => !isNaN(n)) : [];
        if (ids.length === 0) return Response.json({ error: 'ids array wajib diisi atau set all=true' }, { status: 400 });
        const placeholders = ids.map(() => '?').join(',');
        await env.DB.prepare("DELETE FROM events WHERE id IN (" + placeholders + ")").bind(...ids).run();
        return Response.json({ success: true, message: ids.length + ' event dihapus' });
      } catch (err) {
        return Response.json({ error: 'Gagal menghapus event: ' + (err.message || err) }, { status: 500 });
      }
    }

    // ============================================
    // API APIKEYS LIST (ADMIN)
    // ============================================
    if (path === '/api/apikeys' && request.method === 'GET') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak!' }, { status: 403 });
      try {
        let { results } = await env.DB.prepare("SELECT id, key, label, scope, created_by, created_at, active FROM api_keys ORDER BY datetime(created_at) DESC").all();
        // Backward compat: if scope column doesn't exist yet, add default
        if (results && results.length > 0 && results[0].scope === undefined) {
          results = results.map(function(k) { k.scope = k.scope || 'all'; return k; });
        }
        return Response.json({ success: true, keys: results || [] });
      } catch (err) {
        return Response.json({ error: 'Gagal memuat API keys: ' + (err.message || err) }, { status: 500 });
      }
    }

    // ============================================
    // API APIKEYS CREATE (ADMIN)
    // Body: { label }
    // ============================================
    if (path === '/api/apikeys' && request.method === 'POST') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak!' }, { status: 403 });
      try {
        const body = await request.json().catch(() => ({}));
        const label = (body && body.label) ? String(body.label).slice(0, 80) : '';
        const scope = (body && body.scope) ? String(body.scope).slice(0, 40) : 'all';
        const grantedBy = request.headers.get('x-auth-token') || '';
        // Generate 32-char random key (uppercase + digits, no ambiguous chars)
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnpqrstuvwxyz';
        let key = '';
        const buf = new Uint8Array(32);
        crypto.getRandomValues(buf);
        for (let i = 0; i < 32; i++) key += chars[buf[i] % chars.length];
        let result;
        try {
          result = await env.DB.prepare(
            "INSERT INTO api_keys (key, label, scope, created_by) VALUES (?, ?, ?, ?)"
          ).bind(key, label, scope, grantedBy).run();
        } catch(e) {
          // Fallback: scope column might not exist yet
          result = await env.DB.prepare(
            "INSERT INTO api_keys (key, label, created_by) VALUES (?, ?, ?)"
          ).bind(key, label, grantedBy).run();
        }
        const newId = result.meta ? result.meta.last_row_id : null;
        return Response.json({ success: true, id: newId, key: key, label: label, scope: scope, created_by: grantedBy, created_at: new Date().toISOString(), active: 1 });
      } catch (err) {
        return Response.json({ error: 'Gagal membuat API key: ' + (err.message || err) }, { status: 500 });
      }
    }

    // ============================================
    // API APIKEYS DELETE / REVOKE (ADMIN)
    // DELETE /api/apikeys/:id
    // ============================================
    const apiKeyDeleteMatch = path.match(/^\/api\/apikeys\/(\d+)$/);
    if (apiKeyDeleteMatch && request.method === 'DELETE') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak!' }, { status: 403 });
      try {
        const id = parseInt(apiKeyDeleteMatch[1]);
        await env.DB.prepare("DELETE FROM api_keys WHERE id = ?").bind(id).run();
        return Response.json({ success: true, message: 'API key dihapus' });
      } catch (err) {
        return Response.json({ error: 'Gagal menghapus API key: ' + (err.message || err) }, { status: 500 });
      }
    }

    // ============================================
    // BUKTI GENERATOR — serve static files from /bukti-generator/
    // ============================================
    // ============================================
    // XPAY TOOLS — serve static files from /xpay-tools/
    // ============================================
    // ============================================
    // ANALYZER TOOLS — serve static files from /analyzer-tools/
    // ============================================
    if (path.startsWith('/analyzer-tools/')) {
      return env.ASSETS.fetch(new Request(new URL(path, request.url), request));
    }

    if (path.startsWith('/xpay-tools/')) {
      return env.ASSETS.fetch(new Request(new URL(path, request.url), request));
    }

    if (path.startsWith('/bukti-generator/')) {
      return env.ASSETS.fetch(new Request(new URL(path, request.url), request));
    }

    // ============================================
    // FALLBACK: serve static assets
    // ============================================
    return env.ASSETS.fetch(request);
  },
};
