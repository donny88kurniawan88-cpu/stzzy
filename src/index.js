// ============================================================
// BANK LOGIC — PORT 1:1 DARI GOOGLE APPS SCRIPT
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

// ---------- VALIDATOR: CARI DI D1 (pengganti findInDatabase GAS) ----------
async function findInDatabaseD1(cleanInput, env) {
  var result = { found: false, bank: '', sheetName: '', cleanedRek: cleanInput, status: '', leadingZeroAdded: 0 };

  var row = await env.DB.prepare("SELECT sheet, status FROM bank_accounts WHERE no_rek = ? LIMIT 1").bind(cleanInput).first();
  if (row) { result.found = true; result.sheetName = row.sheet; result.status = row.status; return result; }

  // Auto-tambah 1-3 nol di depan (persis logika GAS)
  for (var z = 1; z <= 3; z++) {
    var withZero = '0'.repeat(z) + cleanInput;
    row = await env.DB.prepare("SELECT sheet, status FROM bank_accounts WHERE no_rek = ? LIMIT 1").bind(withZero).first();
    if (row) {
      result.found = true; result.sheetName = row.sheet; result.cleanedRek = withZero;
      result.leadingZeroAdded = z; result.status = row.status;
      return result;
    }
  }
  return result;
}

// ---------- VALIDATOR UTAMA (persis versi GAS, DB dari D1) ----------
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
    var rawSheetName = matchResult.sheetName || '';
    var finalBank = 'BANK TIDAK DIKETAHUI';
    var finalStatus = 'TIDAK DITEMUKAN';
    var finalRek = matchResult.cleanedRek || inputRek;
    var warning = '';

    if (!matchResult.found) {
      finalStatus = 'TIDAK DITEMUKAN';
      warning = 'TIDAK DITEMUKAN DI DB';
    } else {
      var sheetUpper = rawSheetName.toUpperCase();
      var detectedBank = 'BANK';
      if (sheetUpper.indexOf('BCA') !== -1) detectedBank = 'BCA';
      else if (sheetUpper.indexOf('BRI') !== -1) detectedBank = 'BRI';
      else if (sheetUpper.indexOf('MANDIRI') !== -1) detectedBank = 'MANDIRI';
      else if (sheetUpper.indexOf('DANAMON') !== -1) detectedBank = 'DANAMON';
      else if (sheetUpper.indexOf('BNI') !== -1) detectedBank = 'BNI';
      else if (sheetUpper.indexOf('BSI') !== -1) detectedBank = 'BSI';
      else if (sheetUpper.indexOf('CIMB') !== -1) detectedBank = 'CIMB';
      else if (sheetUpper.indexOf('SINARMAS') !== -1) detectedBank = 'SINARMAS';
      else if (sheetUpper.indexOf('SEABANK') !== -1) detectedBank = 'SEABANK';
      else if (sheetUpper.indexOf('JAGO') !== -1) detectedBank = 'BANK JAGO';

      finalStatus = matchResult.status || 'TERDAFTAR';
      finalBank = 'KAS ' + detectedBank + ' (' + finalStatus + ')';
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

// ---------- SHEET SYNC (pengganti buildValidatorDatabase / SpreadsheetApp) ----------
const VALIDATOR_SHEET_IDS = [
  '1GdC17R2pzPu_aileNn8pnxiY0bLncIlDA9wFdQ9YI5I',
  '1_uHytMjQ3_RbX9GUk8CEMSCeTMksmYJvXNqqNNFY4Ps',
  '1E5cn45Bv4TGF7cltm9L7H4PFVoPEY4I1FeIiQLtIE7M'
];

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

async function fetchSheetNames(sheetId) {
  try {
    const res = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/htmlview`);
    if (!res.ok) return [];
    const html = await res.text();
    const names = [];
    const re = /sheet-button-\d+[\s\S]*?>([^<>]+)<\/a>/g;
    let m;
    while ((m = re.exec(html)) !== null) {
      const nm = m[1].trim();
      if (nm && !names.includes(nm)) names.push(nm);
    }
    return names;
  } catch (e) { return []; }
}

// Bangun database { sheetName: [{cleaned, status}] } dari 3 Google Sheets
async function buildValidatorDatabaseFromSheets() {
  const db = {};
  for (const id of VALIDATOR_SHEET_IDS) {
    try {
      let names = await fetchSheetNames(id);
      if (!names.length) names = [''];
      for (const name of names) {
        const csvUrl = name
          ? `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}`
          : `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv`;
        const res = await fetch(csvUrl);
        if (!res.ok) continue;
        const values = parseCsvSimple(await res.text());

        // === SCAN LABEL STATUS (persis GAS: KAS BERSIH / KAS KOTOR per baris) ===
        const statusMap = {};
        for (let r = 0; r < values.length; r++) {
          for (let c = 0; c < values[r].length; c++) {
            const cellStr = String(values[r][c] || '').trim().toUpperCase();
            if (cellStr.indexOf('KAS BERSIH') !== -1) statusMap[r] = 'BERSIH';
            else if (cellStr.indexOf('KAS KOTOR') !== -1) statusMap[r] = 'KOTOR';
          }
        }

        // === EKSTRAK REKENING (persis GAS) ===
        let currentCategory = (name || 'SHEET').toUpperCase();
        let currentStatus = '';
        for (let r2 = 0; r2 < values.length; r2++) {
          if (statusMap[r2]) { currentStatus = statusMap[r2]; continue; }
          const row2 = values[r2];
          let hasLongNumber = false, rekening = '';
          for (let c2 = 0; c2 < row2.length; c2++) {
            const cleanNum = String(row2[c2] || '').replace(/\D/g, '');
            if (cleanNum.length >= 8 && cleanNum.length <= 20) {
              hasLongNumber = true; rekening = cleanNum; break;
            }
          }
          if (hasLongNumber) {
            if (!db[currentCategory]) db[currentCategory] = [];
            db[currentCategory].push({ cleaned: rekening, status: currentStatus });
          } else {
            for (let c3 = 0; c3 < row2.length; c3++) {
              const cellTxt = String(row2[c3] || '').trim().toUpperCase();
              if (cellTxt !== '' && cellTxt.length < 100) {
                const keywords = ['BCA', 'BRI', 'MANDIRI', 'DANAMON', 'BNI', 'BSI', 'CIMB', 'KAS ', 'WD ', 'SINARMAS', 'JAGO', 'REKENING', 'DEPOSIT'];
                if (keywords.some(k => cellTxt.includes(k))) {
                  if (!statusMap[r2]) currentCategory = cellTxt.split('\n')[0].trim();
                  break;
                }
              }
            }
          }
        }
      }
    } catch (e) { /* skip sheet yang gagal */ }
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

    const VALID_ROLES = ['MASTER', 'ADMIN', 'OPERATOR', 'CS', 'MEMBER'];
    const VALID_MODULES = ['dashboard', 'authority', 'user_management', 'registration_control'];

    // ============================================
    // 2. API LOGIN
    // ============================================
    if (path === '/api/login' && request.method === 'POST') {
      try {
        const { username, password } = await request.json();
        const { results } = await env.DB.prepare("SELECT * FROM users WHERE username = ? AND password = ?").bind(username, password).all();

        if (results.length > 0) {
          const user = results[0];
          if (user.status === 'PENDING') {
            return Response.json({ success: false, error: 'Akun Anda menunggu persetujuan admin!' }, { status: 403 });
          }
          return Response.json({ success: true, message: 'Login berhasil!', user: { username: user.username, role: user.role } });
        } else {
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
          access: u.access ? JSON.parse(u.access) : null
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

        const access = JSON.stringify({ dashboard: true, authority: false, user_management: false, registration_control: false });
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

        const target = await env.DB.prepare("SELECT role FROM users WHERE username = ?").bind(usernameToDelete).first();
        if (target && target.role === 'MASTER') return Response.json({ error: 'Akun MASTER tidak dapat dihapus!' }, { status: 403 });

        await env.DB.prepare("DELETE FROM users WHERE username = ?").bind(usernameToDelete).run();
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
          defaultRole: ['MEMBER', 'CS', 'OPERATOR'].includes(body.defaultRole) ? body.defaultRole : 'MEMBER',
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
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const username = decodeURIComponent(accessMatch[1]);
        const body = await request.json();

        const user = await env.DB.prepare("SELECT role FROM users WHERE username = ?").bind(username).first();
        if (!user) return Response.json({ error: 'User tidak ditemukan' }, { status: 404 });
        if (user.role === 'MASTER') return Response.json({ error: 'Akun MASTER tidak dapat diubah!' }, { status: 403 });

        const newRole = VALID_ROLES.includes(body.role) ? body.role : user.role;
        const access = {};
        VALID_MODULES.forEach(m => access[m] = !!(body.access && body.access[m]));
        const grantedBy = request.headers.get('x-auth-token');

        await env.DB.prepare("UPDATE users SET role = ?, access = ?, granted_by = ? WHERE username = ?")
          .bind(newRole, JSON.stringify(access), grantedBy, username).run();
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

        const access = JSON.stringify({ dashboard: true, authority: false, user_management: false, registration_control: false });
        const status = setting.requireApproval ? 'PENDING' : 'ACTIVE';

        await env.DB.prepare("INSERT INTO users (username, password, role, status, access) VALUES (?, ?, ?, ?, ?)")
          .bind(body.username, body.password, setting.defaultRole, status, access).run();

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
    // 14. API BANK FORMATTER — logika GAS asli 1:1
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
    // 15. API BANK VALIDATOR — logika GAS asli 1:1 (DB: D1)
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
    // 15b. SYNC DATABASE DARI 3 GOOGLE SHEETS → D1
    //      (pengganti buildValidatorDatabase + CacheService)
    // ============================================
    if (path === '/api/bank/sync' && request.method === 'POST') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const db = await buildValidatorDatabaseFromSheets();
        let total = 0, sheets = [];
        for (const sheetName in db) { sheets.push(sheetName + ' (' + db[sheetName].length + ')'); total += db[sheetName].length; }

        if (total === 0) {
          return Response.json({ success: false, error: '0 rekening tersinkron — pastikan 3 Google Sheets di-share "Anyone with link: Viewer"', sheets: sheets }, { status: 500 });
        }

        await env.DB.prepare("DELETE FROM bank_accounts").run();
        for (const sheetName in db) {
          for (const rec of db[sheetName]) {
            await env.DB.prepare(
              "INSERT INTO bank_accounts (bank, nama, no_rek, sheet, status, created_at) VALUES (?, ?, ?, ?, ?, ?)"
            ).bind('', '', rec.cleaned, sheetName, rec.status, Date.now()).run();
          }
        }
        return Response.json({ success: true, total: total, sheets: sheets, message: 'Database validator tersinkron: ' + total + ' rekening' });
      } catch (err) {
        return Response.json({ error: 'Gagal sync: ' + err.message }, { status: 500 });
      }
    }

    // 15c. List rekening (admin) — cek hasil sync
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
    // FALLBACK: serve static assets
    // ============================================
    return env.ASSETS.fetch(request);
  },
};
