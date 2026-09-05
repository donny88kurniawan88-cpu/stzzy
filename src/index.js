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
              kasLabel = cell.toUpperCase().split('\n')[0].trim();
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

            let namaFinal = String(row[COL_NAMA] || '').trim();
            if (!namaFinal || !/[A-Za-z]/.test(namaFinal)) {
              namaFinal = '';
              let best = '';
              for (let c2 = 0; c2 < row.length; c2++) {
                if (c2 === rekCol) continue;
                const t = String(row[c2] || '').trim();
                if (t !== '' && /[A-Za-z]{3,}/.test(t) && !isBankBlockLabel(t) && !/\d{5,}/.test(t) && t.length <= 40) {
                  if (c2 < rekCol && t.length > best.length) best = t;
                  else if (best === '' && t.length > best.length) best = t;
                }
              }
              namaFinal = best;
            }

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
      // Sub-menu keys (2)
      'user_management', 'registration_control',
      // Module item keys (15) — match Dashboard data-access-item attributes
      'dashboard', 'profil', 'banking_tools', 'rek_validator', 'bank_processor',
      'saldo_pencairan', 'qris_tools', 'prediction_tools', 'event_tools',
      'edit_bukti', 'keep_memo', 'api_key', 'setting', 'ip_whitelist', 'authority_panel'
    ];

    // ===== DEFAULT ACCESS PER ROLE =====
    // MASTER: full access tak terbatas (semua modul true)
    // ADMIN:  Core, Workspace, Operational, System, User Management, Registrasi
    // MEMBER: hanya Core (selebihnya ditentukan oleh Admin/Master)
    function defaultAccessFor(role) {
      // MASTER: full access tak terbatas (semua 21 modul true)
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
          saldo_pencairan: true, qris_tools: true, prediction_tools: true,
          event_tools: true, edit_bukti: true, keep_memo: true,
          // Operational items
          api_key: true, setting: true,
          // System items
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
          saldo_pencairan: true, qris_tools: true, prediction_tools: true,
          event_tools: true, edit_bukti: true, keep_memo: true,
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
        saldo_pencairan: false, qris_tools: false, prediction_tools: false,
        event_tools: false, edit_bukti: false, keep_memo: false,
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

    // ===== SAFE JSON PARSE =====
    // Parse access JSON dengan aman — fallback ke defaultAccessFor jika rusak/null
    function safeParseAccess(accessStr, role) {
      const defaults = defaultAccessFor(role);
      if (!accessStr) return defaults;
      try {
        const parsed = JSON.parse(accessStr);
        if (parsed && typeof parsed === 'object') {
          // Merge: ensure all 20 keys exist (fill missing from defaults)
          const merged = {};
          VALID_MODULES.forEach(m => {
            merged[m] = (typeof parsed[m] === 'boolean') ? parsed[m] : defaults[m];
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
              // Match exact OR ::1 (localhost) OR IPv4-mapped IPv6
              // NOTE: 0.0.0.0 is NOT a wildcard — it's a literal IP. Only exact matches allowed.
              const allowed = wlIps.some(ip =>
                ip === clientIp ||
                ip === '::1' ||
                ip === '::ffff:' + clientIp ||
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

        // If blocked — log BLOCKED and return 403 BEFORE checking credentials
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
    // 3. API GET USERS (Hanya Admin)
    // ============================================
    if (path === '/api/users' && request.method === 'GET') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const { results } = await env.DB.prepare("SELECT username, role, status, access FROM users").all();
        const users = results.map(u => ({
          username: u.username,
          role: u.role,
          status: u.status,
          access: safeParseAccess(u.access, u.role)
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
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      return Response.json(await getRegisSetting());
    }

    // ============================================
    // 8. API SIMPAN KONFIGURASI REGISTRASI
    // ============================================
    if (path === '/api/settings/registration' && request.method === 'PUT') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const body = await request.json();
        const setting = {
          open: !!body.open,
          defaultRole: body.defaultRole === 'MEMBER' ? 'MEMBER' : 'MEMBER',
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
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
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
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
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
        const user = await env.DB.prepare("SELECT username, role, status, access, created_at FROM users WHERE username = ?").bind(username).first();
        if (!user) return Response.json({ success: false, error: 'User tidak ditemukan' }, { status: 404 });

        return Response.json({
          success: true,
          data: {
            username: user.username,
            role: user.role,
            status: user.status,
            access: user.access ? JSON.parse(user.access) : null,
            since: user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'
          }
        });
      } catch (err) {
        return Response.json({ success: false, error: 'Gagal mengambil profil' }, { status: 500 });
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
              ip === '::1' ||
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
          w.ip_address === '::1' ||
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
    // FALLBACK: serve static assets
    // ============================================
    return env.ASSETS.fetch(request);
  },
};
