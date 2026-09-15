/* ============================================================
   AURA.OS // PREDIKSI-PRO.JS v1.2.0 — PREDIKSI ALL PASARAN
   Modul Prediksi All Pasaran (Pro):
   - Menarik data pasaran dari menu Jadwal Pasaran (D1 SQLite
     via GET /api/pasaran, fallback localStorage — sumber sama).
   - Toggle dropdown pilih pasaran (bisa diketik utk mencari) +
     chip filter status: SEMUA / BUKA / TUTUP / RESULT. HOKI = 24 sesi.
   - Prediksi dibangkitkan TERDETERMINISTIK (seeded RNG: nama
     pasaran + sesi + TANGGAL EDISI) sehingga stabil sepanjang
     periode, berganti otomatis tiap hari / sesi HOKI.
   - v1.2.0 (perbaikan + fitur):
     a) FIX KARTU HILANG: repaint menit-an (pr-noanim) dulu
        membuat elemen ber-opacity:0 hilang selamanya — kini CSS
        memakai pola backwards sehingga konten selalu terlihat.
     b) RESULT -> PREDIKSI OTOMATIS TANGGAL BERIKUTNYA: pasaran
        yang result-nya sudah keluar otomatis diprediksi untuk
        draw berikutnya (besok / hari-buka berikutnya; HOKI =
        sesi jam berikutnya), lengkap dgn chip keterangan.
     c) PILIHAN UBAH TANGGAL: chip tanggal bisa diklik -> popover
        datepicker (TERAPKAN / OTOMATIS) — semua prediksi (kartu,
        copy pasaran, copy all) mengikuti tanggal pilihan + badge
        MANUAL. Kembali otomatis kapan saja.
   - Card popup animasi gaya berita (senada Pk Jadwal Pasaran),
     format prediksi persis contoh user (BBFS, Angka Ikut, 4D,
     3D, 2D, Colok Bebas/Macau/Shio, Invest Twin, footer UPS).
   - Copy pasaran & Copy All (semua pasaran hasil filter).
   Exposed: window.PrediksiPro.
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     STATE & KONSTANTA
     ============================================================ */
  var LKEY = 'aura_pasaran_local_v1'; // sama dgn pasaran-pro.js (sumber data sama)
  var HOKI_RESULT_OFFSET = 10;        // result = tutup + 10 menit (00:00 -> 00:10)

  var ICON_COPY =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  var ICON_REFRESH =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>';
  var ICON_CLOCK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
  var ICON_CHEV =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
  var ICON_CHECK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var ICON_MAGIC =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8L19 13"/><path d="M15 9h0"/><path d="M17.8 6.2L19 5"/><path d="M12.2 6.2L11 5"/><path d="M12.2 11.8L11 13"/><path d="M3 21l9-9"/><path d="M12.2 15.8L11 17"/></svg>';
  var ICON_STAR =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  var ICON_BOLT =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>';
  var ICON_SEARCH =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>';
  var ICON_NEXT =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
  var ICON_CALENDAR =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';

  /* Negara pasaran — acuan tabel 53 pasaran (sama dgn pkpasaran-pro.js) */
  var COUNTRY_REF = [
    ['KINGKONG4DMALAM', '\u{1F30D}', '-'],
    ['KINGKONG4DSORE', '\u{1F1F2}\u{1F1F4}', 'Macau'],
    ['KINGKONG', '\u{1F1F2}\u{1F1F4}', 'Macau'],
    ['HOKI', '\u{1F30D}', '-'],
    ['TOTOMACAU', '\u{1F1F2}\u{1F1F4}', 'Macau'],
    ['MACAU', '\u{1F1F2}\u{1F1F4}', 'Macau'],
    ['MAGNUM', '\u{1F1F2}\u{1F1FE}', 'Malaysia'],
    ['TOTOMALI', '\u{1F1F2}\u{1F1F1}', 'Mali of Africa'],
    ['SINGAPORE', '\u{1F1F8}\u{1F1EC}', 'Singapore'],
    ['HONGKONG', '\u{1F1ED}\u{1F1F0}', 'Hongkong'],
    ['KENTUCKY', '\u{1F1FA}\u{1F1F8}', 'Amerika Serikat'],
    ['FLORIDA', '\u{1F1FA}\u{1F1F8}', 'Amerika Serikat'],
    ['NEWYORK', '\u{1F1FA}\u{1F1F8}', 'Amerika Serikat'],
    ['OREGON', '\u{1F1FA}\u{1F1F8}', 'Amerika Serikat'],
    ['CALIFORNIA', '\u{1F1FA}\u{1F1F8}', 'Amerika Serikat'],
    ['CAROLINA', '\u{1F1FA}\u{1F1F8}', 'Amerika Serikat'],
    ['NEVADA', '\u{1F1FA}\u{1F1F8}', 'Amerika Serikat'],
    ['HUAHIN', '\u{1F1F9}\u{1F1ED}', 'Thailand'],
    ['BANGKOK', '\u{1F1F9}\u{1F1ED}', 'Thailand'],
    ['BRUNEI', '\u{1F1E7}\u{1F1F3}', 'Brunei Darussalam'],
    ['TOTOCAMBODIA', '\u{1F1F0}\u{1F1ED}', 'Cambodia'],
    ['CAMBODIA', '\u{1F1F0}\u{1F1ED}', 'Cambodia'],
    ['POIPET', '\u{1F1F0}\u{1F1ED}', 'Cambodia'],
    ['CHELSEA', '\u{1F1EC}\u{1F1E7}', 'London'],
    ['BULLSEYE', '\u{1F1F3}\u{1F1FF}', 'New Zealand'],
    ['SYDNEY', '\u{1F1E6}\u{1F1FA}', 'Australia'],
    ['JAKARTA', '\u{1F1EE}\u{1F1E9}', 'Indonesia'],
    ['PCSO', '\u{1F1F5}\u{1F1ED}', 'Filipina']
  ];
  var FLAG_DEFAULT = ['\u{1F30D}', '-'];

  var DAY_NAMES = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
  var DAY_SHORT = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  var MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  /* Tabel shio — acuan user (urutan persis gambar) */
  var SHIO_LIST = ['KUDA', 'ULAR', 'NAGA', 'KELINCI', 'HARIMAU', 'KERBAU',
    'TIKUS', 'BABI', 'ANJING', 'AYAM', 'MONYET', 'KAMBING'];

  var ST_META = {
    buka:   { label: 'BUKA',   cls: 'pr-st-buka'   },
    tutup:  { label: 'TUTUP',  cls: 'pr-st-tutup'  },
    result: { label: 'RESULT', cls: 'pr-st-result' },
    libur:  { label: 'LIBUR',  cls: 'pr-st-libur'  },
    khusus: { label: 'KHUSUS', cls: 'pr-st-libur'  }
  };

  var state = {
    items: [],
    source: null,          // 'db' | 'local'
    loading: false,
    loaded: false,
    sel: '',               // key pasaran terpilih (id D1, HOKI = id dasar)
    selLocked: false,      // user sudah memilih manual
    filter: 'all',         // all | buka | tutup | result
    dropQuery: '',         // kata kunci pencarian dropdown
    viewDate: '',          // tanggal edisi manual 'YYYY-MM-DD' ('' = otomatis)
    lastList: [],          // hasil deriveList() (76 entri, HOKI = 24)
    built: false,
    animate: true
  };

  var clockTimer = null;
  var lastMinute = -1;

  /* ============================================================
     HELPERS DASAR
     ============================================================ */
  function q(sel, ctx) { return (ctx || document).querySelector(sel); }
  function container() { return document.getElementById('prediksiView'); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  function toast(msg, type) {
    if (typeof window.showToast === 'function') window.showToast(msg, type);
  }

  function token() {
    return localStorage.getItem('aura_auth_token') || '';
  }

  function pad2(n) { return ('0' + n).slice(-2); }

  /* Waktu sekarang WIB (UTC+7) */
  function wibNow() {
    var d = new Date();
    var w = new Date(d.getTime() + d.getTimezoneOffset() * 60000 + 7 * 3600000);
    return {
      h: w.getHours(), mi: w.getMinutes(), s: w.getSeconds(),
      m: w.getHours() * 60 + w.getMinutes() + w.getSeconds() / 60,
      day: w.getDay(), date: w
    };
  }

  function parseHM(s) {
    var m = String(s == null ? '' : s).match(/\b(\d{1,2}):(\d{2})(?::\d{2})?\s*WIB\b/i);
    if (!m) return null;
    var h = parseInt(m[1], 10), mm = parseInt(m[2], 10);
    if (h > 23 || mm > 59) return null;
    return h * 60 + mm;
  }

  function normKey(s) {
    return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  function countryOf(nama) {
    var n = normKey(nama);
    for (var i = 0; i < COUNTRY_REF.length; i++) {
      if (n.indexOf(COUNTRY_REF[i][0]) !== -1) return { flag: COUNTRY_REF[i][1], name: COUNTRY_REF[i][2] };
    }
    return { flag: FLAG_DEFAULT[0], name: FLAG_DEFAULT[1] };
  }

  function closedDaysOf(text) {
    var T = String(text || '').toUpperCase();
    var idx = T.indexOf('TUTUP');
    if (idx === -1) return null;
    var head = T.slice(0, idx);
    var found = [];
    for (var i = 0; i < DAY_NAMES.length; i++) {
      if (head.indexOf(DAY_NAMES[i]) !== -1) found.push(i);
    }
    return found.length ? found : null;
  }

  function drawDaysOf(text) {
    var T = String(text || '').toUpperCase();
    if (!T || T.indexOf('TUTUP') !== -1 || T.indexOf('SETIAP') !== -1) return '';
    var found = [];
    for (var i = 0; i < DAY_NAMES.length; i++) {
      if (T.indexOf(DAY_NAMES[i]) !== -1) found.push(DAY_SHORT[i]);
    }
    return found.length >= 2 ? found.join(', ') : '';
  }

  function sorted() {
    return state.items.slice().sort(function (a, b) { return (a.no || 0) - (b.no || 0); });
  }

  /* Tanggal WIB format "14 Sep 2026" + kunci seed "2026-09-14" */
  function wibDateParts() {
    var d = wibNow().date;
    return {
      label: d.getDate() + ' ' + MONTH_SHORT[d.getMonth()] + ' ' + d.getFullYear(),
      seed: dateToSeed(d)
    };
  }

  function dateToSeed(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  /* '2026-09-15' -> '15 Sep 2026' (invalid -> '') */
  function seedToLabel(seed) {
    var p = String(seed || '').split('-');
    if (p.length !== 3) return '';
    var y = parseInt(p[0], 10), mi = parseInt(p[1], 10) - 1, dd = parseInt(p[2], 10);
    if (!(y >= 2000 && y <= 2200) || mi < 0 || mi > 11 || !(dd >= 1 && dd <= 31)) return '';
    return dd + ' ' + MONTH_SHORT[mi] + ' ' + y;
  }

  function addDays(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }

  /* Hari-buka berikutnya: mulai n hari dr d, lewati hari tutup */
  function nextOpenDay(d, closed, n) {
    var x = addDays(d, n || 1), guard = 0;
    while (closed && closed.indexOf(x.getDay()) !== -1 && guard < 8) { x = addDays(x, 1); guard++; }
    return x;
  }

  /* ============================================================
     STATUS PASARAN vs WAKTU WIB (pola pkpasaran-pro.js)
     ============================================================ */
  function statusOf(row, now) {
    var closed = closedDaysOf(row.jadwal) || closedDaysOf(row.tutup);
    if (closed && closed.indexOf(now.day) !== -1) {
      return { st: 'libur', note: 'Libur — ' + closed.map(function (i) { return DAY_SHORT[i]; }).join(' & ') };
    }
    var tu = parseHM(row.tutup), re = parseHM(row.result);
    if (tu == null && re == null) {
      var dd = drawDaysOf(row.jadwal);
      return { st: 'khusus', note: dd ? 'Draw: ' + dd : 'Jadwal khusus' };
    }
    if (tu != null && re != null) {
      if (now.m < tu) return { st: 'buka', note: '' };
      if (now.m < re) return { st: 'tutup', note: 'Menunggu result' };
      return { st: 'result', note: 'Result sudah keluar' };
    }
    if (tu != null) return { st: now.m < tu ? 'buka' : 'tutup', note: '' };
    return { st: 'result', note: '' };
  }

  function hokiSlotStatus(h, now) {
    var tu = h * 60, re = h * 60 + HOKI_RESULT_OFFSET;
    if (now.m < tu) return 'buka';
    if (now.m < re) return 'tutup';
    return 'result';
  }

  function isHokiRow(it) {
    var nU = String(it.nama || '').toUpperCase();
    var tU = String(it.tutup || '').toUpperCase();
    var rU = String(it.result || '').toUpperCase();
    return nU.indexOf('HOKI') !== -1 && (tU.indexOf('24X') !== -1 || rU.indexOf('1 JAM') !== -1 || nU.indexOf('HOKI DRAW') !== -1);
  }

  /* Ekspansi list: 1 baris D1 -> entri view (HOKI DRAW = 24 sesi) */
  function deriveList() {
    var now = wibNow();
    var out = [];
    sorted().forEach(function (it) {
      var base = {
        id: it.id, no: it.no || 0,
        nama: String(it.nama || '').toUpperCase(),
        jadwal: it.jadwal || 'SETIAP HARI',
        link: it.link || ''
      };
      var ctry = countryOf(base.nama);
      if (isHokiRow(it)) {
        for (var h = 0; h < 24; h++) {
          out.push({
            key: base.id + '-s' + h, no: base.no, sub: h,
            nama: base.nama, jadwal: base.jadwal,
            tutup: pad2(h) + ':00 WIB',
            result: pad2(h) + ':' + pad2(HOKI_RESULT_OFFSET) + ' WIB',
            link: base.link,
            st: hokiSlotStatus(h, now), note: '',
            hoki: true, slot: pad2(h) + ':00',
            flag: ctry.flag, country: ctry.name
          });
        }
      } else {
        var s = statusOf(it, now);
        out.push({
          key: String(base.id), no: base.no, sub: -1,
          nama: base.nama, jadwal: base.jadwal,
          tutup: it.tutup || '', result: it.result || '', link: base.link,
          st: s.st, note: s.note,
          hoki: false, slot: '',
          flag: ctry.flag, country: ctry.name
        });
      }
    });
    out.sort(function (a, b) { return (a.no * 100 + (a.sub + 1)) - (b.no * 100 + (b.sub + 1)); });
    return out;
  }

  /* ============================================================
     GENERATOR PREDIKSI — SEEDED (deterministik per hari/sesi)
     ============================================================ */
  function hashStr(s) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  /* mulberry32 — PRNG kecil cepat & deterministik */
  function makeRng(seedStr) {
    var a = hashStr(seedStr);
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ============================================================
     EDISI PREDIKSI — tanggal/sesi target sebuah prediksi
     - Result SUDAH KELUAR -> otomatis geser ke draw BERIKUTNYA:
       pasaran = besok / hari-buka berikutnya; HOKI = sesi +1 jam
       (23:00 -> besok 00:00). Disertai chip keterangan.
     - LIBUR -> draw berikutnya pada hari yang tidak tutup.
     - Tanggal manual (state.viewDate) -> semua prediksi memakai
       tanggal tersebut (HOKI tetap sesi terpilih).
     ============================================================ */
  function editionOf(it) {
    var manual = /^\d{4}-\d{2}-\d{2}$/.test(state.viewDate || '');
    var d = wibNow().date;
    var slot = it.hoki ? (it.sub >= 0 ? it.sub : 0) : -1;
    var rolled = false, note = '';

    if (manual) {
      var p = state.viewDate.split('-');
      d = new Date(wibNow().date.getTime());
      d.setFullYear(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
    } else if (it.hoki) {
      if (it.st === 'result') {
        slot = (slot + 1) % 24;
        if (slot === 0) d = addDays(d, 1);
        rolled = true;
        note = 'Result sesi ' + it.slot + ' sudah keluar \u2014 prediksi otomatis sesi ' + pad2(slot) + ':00';
      }
    } else {
      var closed = closedDaysOf(it.jadwal) || closedDaysOf(it.tutup);
      if (it.st === 'result') {
        d = nextOpenDay(d, closed, 1);
        rolled = true;
        note = 'Result sudah keluar \u2014 prediksi otomatis draw berikutnya';
      } else if (it.st === 'libur' && closed) {
        d = nextOpenDay(d, closed, 1);
        rolled = true;
        note = 'Libur \u2014 prediksi otomatis draw berikutnya';
      }
    }

    var seed = dateToSeed(d);
    return {
      seed: seed,
      label: seedToLabel(seed),
      hokiSlot: it.hoki ? pad2(slot) + ':00' : '',
      rolled: rolled,
      note: note,
      manual: manual
    };
  }

  /* Prediksi utk 1 entri pasaran — PERSIS format contoh user.
     ATURAN: satu baris TANPA angka kembar (4D/3D/2D/Colok Bebas/Colok
     Macau). Invest Twin wajib angka kembar & tak sama dlm 1 baris
     (11/44/77 — bukan 11/11). Colok Shio = 3 shio beda dr tabel. */
  function genPrediction(it) {
    var ed = editionOf(it);
    var r = makeRng(normKey(it.nama) + (it.hoki ? '|' + ed.hokiSlot : '') + '|' + ed.seed);
    function dig(n) { var s = ''; for (var i = 0; i < n; i++) s += String(Math.floor(r() * 10)); return s; }
    function dig1() { return String(Math.floor(r() * 10)); }
    function pick(arr) { return arr[Math.floor(r() * arr.length)]; }

    var bbfs = dig(7);
    var angkaIkut = dig(5);

    /* Sampel grup unik dari digit BBFS — anti kembar dalam satu baris */
    function uniqBBFS(n, count) {
      var seen = {}, out = [], guard = 0;
      while (out.length < count && guard < 400) {
        guard++;
        var s = '';
        for (var i = 0; i < n; i++) s += bbfs.charAt(Math.floor(r() * 7));
        if (seen[s]) continue;
        seen[s] = 1; out.push(s);
      }
      /* fallback nyaris mustahil (BBFS digit seragam): lengkapi dr digit penuh */
      while (out.length < count) {
        var t = dig(n);
        if (!seen[t]) { seen[t] = 1; out.push(t); }
      }
      return out;
    }

    var d4 = uniqBBFS(4, 4);
    var d3 = uniqBBFS(3, 4);
    var d2 = uniqBBFS(2, 10);

    /* Colok Bebas: dua digit beda (3/5 — bukan 3/3) */
    var cb1 = dig1(), cb2 = dig1();
    while (cb2 === cb1) cb2 = dig1();
    var colokBebas = cb1 + '/' + cb2;

    /* Colok Macau: 3 grup unik (88/17/76) */
    var colokMacau = uniqBBFS(2, 3).join('/');

    /* Colok Shio: 3 shio BEDA — ikut tabel shio acuan */
    var shioPool = SHIO_LIST.slice(), shioOut = [], si;
    for (si = 0; si < 3; si++) shioOut.push(shioPool.splice(Math.floor(r() * shioPool.length), 1)[0]);
    var colokShio = shioOut.join('/');

    /* Invest Twin: angka kembar & tak sama satu baris (11/44/77 — bukan 11/11) */
    var twins = ['00', '11', '22', '33', '44', '55', '66', '77', '88', '99'], twinOut = [], ti;
    for (ti = 0; ti < 3; ti++) twinOut.push(twins.splice(Math.floor(r() * twins.length), 1)[0]);
    var investTwin = twinOut.join('/');

    return {
      bbfs: bbfs,
      angkaIkut: angkaIkut,
      d4: d4, d3: d3, d2: d2,
      colokBebas: colokBebas,
      colokMacau: colokMacau,
      colokShio: colokShio,
      investTwin: investTwin,
      dateLabel: ed.label,
      seed: ed.seed,
      hokiSlot: ed.hokiSlot,
      rolled: ed.rolled,
      note: ed.note,
      manual: ed.manual,
      ups: 'Biasakan UPS - UTAMAKAN PREDIKSI SENDIRI'
    };
  }

  /* Teks copy — PERSIS contoh user (spasi sebelum ":" dipertahankan).
     HOKI memakai slot TARGET (bisa bergeser otomatis setelah result). */
  function buildCopy(it, p) {
    var nama = it.nama + (it.hoki ? ' ' + (p.hokiSlot || it.slot) : '');
    return 'Prediksi ' + nama + '\n' +
      p.dateLabel + '\n' +
      'BBFS KUAT: ' + p.bbfs + '\n' +
      'Angka Ikut : ' + p.angkaIkut + '\n' +
      '4D (BB): ' + p.d4.join(' ') + '\n' +
      '3D (BB) : ' + p.d3.join(' ') + '\n' +
      '2D (BB): ' + p.d2.join(' ') + '\n' +
      'Colok Bebas : ' + p.colokBebas + '\n' +
      'Colok Macau : ' + p.colokMacau + '\n' +
      'Colok Shio : ' + p.colokShio + '\n' +
      'Invest Twin : ' + p.investTwin + '\n' +
      p.ups;
  }

  function copyText(text, okMsg) {
    var done = function () { toast(okMsg, 'success'); };
    var fail = function () {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        done();
      } catch (e) { toast('Gagal menyalin', 'error'); }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fail);
    } else fail();
  }

  /* ============================================================
     FILTER & SELEKSI
     ============================================================ */
  function apiGetAll() {
    return fetch('/api/pasaran', { headers: { 'x-auth-token': token() } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }

  function loadLocal() {
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem(LKEY) || 'null'); } catch (e) { raw = null; }
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.pasaran)) return raw.pasaran;
    return [];
  }

  function load(manual) {
    if (state.loading) return;
    state.loading = true;
    paintSrc('<i class="pr-spin"></i> Memuat data pasaran…');
    apiGetAll()
      .then(function (j) {
        if (!j || !j.success || !Array.isArray(j.pasaran)) throw new Error('bad payload');
        state.items = j.pasaran;
        state.source = 'db';
      })
      .catch(function () {
        state.items = loadLocal();
        state.source = 'local';
      })
      .then(function () {
        state.loading = false;
        state.loaded = true;
        state.lastList = deriveList();
        ensureSelection();
        state.animate = true;
        paint();
        paintSrc(state.source === 'db'
          ? '<span class="pr-src-tag pr-src-db"><i class="fas fa-database"></i> SQLITE&#8226;D1</span> ' + state.items.length + ' pasaran dari Jadwal Pasaran'
          : '<span class="pr-src-tag pr-src-local"><i class="fas fa-cloud"></i> MODE LOKAL</span> backend tidak terjangkau — data contoh');
        if (manual) toast(state.source === 'db' ? 'Data pasaran dimuat dari database' : 'Backend tidak terjangkau — mode lokal', state.source === 'db' ? 'success' : 'error');
      });
  }

  function paintSrc(html) {
    var el = document.getElementById('prSrc');
    if (el) el.innerHTML = html;
  }

  /* ============================================================
     FILTER + SELEKSI
     ============================================================ */
  function visibleItems() {
    var f = state.filter;
    return state.lastList.filter(function (it) {
      if (f === 'tutup') { if (it.st !== 'tutup' && it.st !== 'libur') return false; }
      else if (f !== 'all' && it.st !== f) return false;
      return true;
    });
  }

  /* Opsi dropdown — ikut filter chip + kata kunci ketikan (HOKI = 24 sesi) */
  function dropOptions() {
    var kw = normKey(state.dropQuery || '');
    return visibleItems().filter(function (it) {
      if (!kw) return true;
      var hay = normKey(it.nama) + ' ' + normKey(it.slot || '') + ' ' + normKey(it.country || '') + ' SESI';
      return hay.indexOf(kw) !== -1;
    });
  }

  function selectedEntry() {
    if (!state.sel) return null;
    for (var i = 0; i < state.lastList.length; i++) {
      if (state.lastList[i].key === state.sel) return state.lastList[i];
    }
    return null;
  }

  /* Auto-pilih: sesi/pasaran dgn result terdekat berikutnya */
  function ensureSelection() {
    state.lastList = deriveList();
    if (state.sel) {
      var ok = false;
      state.lastList.forEach(function (it) { if (it.key === state.sel) ok = true; });
      if (ok) return;
    }
    var now = wibNow();
    var best = null, bestDelta = 1e9;
    state.lastList.forEach(function (it) {
      if (it.st === 'libur' || it.st === 'khusus') return;
      var re = parseHM(it.result);
      if (re == null) return;
      var d = re - now.m;
      if (d <= 0) d += 24 * 60;
      if (d < bestDelta) { bestDelta = d; best = it; }
    });
    state.sel = best ? best.key : (state.lastList.length ? state.lastList[0].key : '');
    state.selLocked = false;
  }

  function selectKey(key, opts) {
    state.sel = String(key || '');
    state.selLocked = !!opts && !!opts.manual;
    closeDrop();
    state.animate = true;
    paint();
  }

  function setFilter(f) {
    state.filter = f;
    state.animate = true;
    paint();
  }

  /* ============================================================
     BUILD UI (sekali) — control panel + dropdown + area card
     ============================================================ */
  function build() {
    var c = container();
    if (!c || c.dataset.built) return;
    c.dataset.built = '1';
    c.innerHTML =
      '<div class="pr-wrap">' +
        '<div class="pr-panel prIn">' +
          '<div class="pr-panel-top">' +
            '<div class="pr-clock" title="Waktu Indonesia Barat"><span class="pr-live-dot"></span><span id="prClock" class="pr-clock-time">--:--:-- WIB</span></div>' +
            '<div class="pr-chips" id="prChips">' +
              '<button class="pr-chip pr-chip-all is-on" data-filter="all">SEMUA <b id="prCntAll">0</b></button>' +
              '<button class="pr-chip pr-chip-buka" data-filter="buka"><i class="pr-dot pr-dot-buka"></i>BUKA <b id="prCntBuka">0</b></button>' +
              '<button class="pr-chip pr-chip-tutup" data-filter="tutup"><i class="pr-dot pr-dot-tutup"></i>TUTUP <b id="prCntTutup">0</b></button>' +
              '<button class="pr-chip pr-chip-result" data-filter="result"><i class="pr-dot pr-dot-result"></i>RESULT <b id="prCntResult">0</b></button>' +
            '</div>' +
            '<div class="pr-panel-actions">' +
              '<button class="pr-btn" data-action="copyall" title="Copy prediksi semua pasaran (ikut filter)">' + ICON_COPY + '<span>Copy All</span></button>' +
              '<button class="pr-btn pr-btn-icon" data-action="refresh" title="Muat ulang data">' + ICON_REFRESH + '</button>' +
            '</div>' +
          '</div>' +
          '<div class="pr-dropwrap" id="prDropWrap">' +
            '<button class="pr-dropbtn" data-action="droptoggle" aria-haspopup="listbox">' +
              '<span class="pr-drop-flag" id="prDropFlag">' + FLAG_DEFAULT[0] + '</span>' +
              '<span class="pr-drop-label" id="prDropLabel">Pilih pasaran&#8230;</span>' +
              '<span class="pr-drop-sub" id="prDropSub"></span>' +
              '<span class="pr-drop-chev' + (ICON_CHEV ? ' pr-chev-svg' : '') + '">' + ICON_CHEV + '</span>' +
            '</button>' +
            '<div class="pr-dropdown" id="prDropdown" style="display:none;" role="listbox">' +
              '<div class="pr-drop-searchbox">' +
                '<span class="pr-drop-search-ico">' + ICON_SEARCH + '</span>' +
                '<input id="prDropSearch" class="pr-drop-search" type="text" autocomplete="off" spellcheck="false" placeholder="Ketik utk cari pasaran\u2026" />' +
              '</div>' +
              '<div class="pr-drop-list" id="prDropList"></div>' +
            '</div>' +
          '</div>' +
          '<div class="pr-src" id="prSrc"></div>' +
        '</div>' +
        '<div id="prCardArea"></div>' +
      '</div>';
  }

  /* ============================================================
     PAINT — chip counter, dropdown, card prediksi
     ============================================================ */
  function paint() {
    var c = container();
    if (!c || !c.dataset.built) return;
    var noanim = !state.animate;
    state.animate = false;

    /* counter chips */
    var cnt = { all: state.lastList.length, buka: 0, tutup: 0, result: 0 };
    state.lastList.forEach(function (it) {
      if (it.st === 'buka') cnt.buka++;
      else if (it.st === 'tutup' || it.st === 'libur' || it.st === 'khusus') cnt.tutup++;
      else if (it.st === 'result') cnt.result++;
    });
    setTxt('prCntAll', cnt.all); setTxt('prCntBuka', cnt.buka);
    setTxt('prCntTutup', cnt.tutup); setTxt('prCntResult', cnt.result);
    var chips = q('#prChips', c);
    if (chips) {
      [].forEach.call(chips.querySelectorAll('.pr-chip'), function (b) {
        b.classList.toggle('is-on', b.getAttribute('data-filter') === state.filter);
      });
    }

    /* tombol dropdown */
    var sel = selectedEntry();
    var lbl = document.getElementById('prDropLabel');
    var flg = document.getElementById('prDropFlag');
    var sub = document.getElementById('prDropSub');
    if (lbl) lbl.textContent = sel ? sel.nama + (sel.hoki ? ' \u00B7 SESI ' + sel.slot : '') : 'Pilih pasaran\u2026';
    if (flg) flg.textContent = sel ? sel.flag : FLAG_DEFAULT[0];
    if (sub) {
      if (sel) {
        var m = ST_META[sel.st] || ST_META.khusus;
        sub.innerHTML = '<span class="pr-pill ' + m.cls + '">' + m.label + '</span>';
      } else sub.innerHTML = '';
    }

    /* isi dropdown */
    paintDrop();

    /* card prediksi */
    var area = document.getElementById('prCardArea');
    if (!area) return;
    if (!sel) {
      area.innerHTML =
        '<div class="pr-empty prPop' + (noanim ? ' pr-noanim' : '') + '">' +
          '<div class="pr-empty-icon">' + ICON_STAR + '</div>' +
          '<div class="pr-empty-title">Belum ada pasaran dipilih</div>' +
          '<div class="pr-empty-sub">Buka dropdown di atas lalu pilih pasaran untuk melihat prediksi lengkap: BBFS, Angka Ikut, 4D/3D/2D, Colok &amp; Invest Twin.</div>' +
        '</div>';
      return;
    }
    /* pertahankan popover tanggal saat repaint (mis. tick menitan) */
    var keepPop = datePopOpen();
    var keepVal = '';
    var keepInp = document.getElementById('prDateInput');
    if (keepPop && keepInp) keepVal = keepInp.value;
    area.innerHTML = cardHTML(sel, noanim);
    if (keepPop) {
      var np = document.getElementById('prDatePop');
      if (np) {
        np.style.display = 'block';
        var ni = document.getElementById('prDateInput');
        if (ni && keepVal) ni.value = keepVal;
      }
    }
  }

  function setTxt(id, v) { var el = document.getElementById(id); if (el) el.textContent = String(v); }

  function paintDrop() {
    var list = document.getElementById('prDropList');
    if (!list) return;
    var opts = dropOptions();
    var kw = String(state.dropQuery || '').trim();
    var h = '';
    if (!opts.length) {
      h = '<div class="pr-drop-empty">' + (kw
        ? 'Tidak ada pasaran cocok &quot;' + esc(kw) + '&quot;'
        : 'Tidak ada pasaran pada filter ini') + '</div>';
    }
    opts.forEach(function (o, i) {
      var m = ST_META[o.st] || ST_META.khusus;
      h +=
        '<button class="pr-opt' + (o.key === state.sel ? ' is-sel' : '') + '" data-key="' + esc(o.key) + '" style="--i:' + i + '" role="option">' +
          '<span class="pr-opt-no">' + pad2(o.no || 0) + '</span>' +
          '<span class="pr-opt-flag">' + o.flag + '</span>' +
          '<span class="pr-opt-name">' + esc(o.nama) + (o.hoki ? ' <em class="pr-opt-sesi">SESI ' + o.slot + '</em>' : '') + '</span>' +
          '<span class="pr-pill ' + m.cls + '">' + m.label + '</span>' +
          '<span class="pr-opt-check">' + ICON_CHECK + '</span>' +
        '</button>';
    });
    list.innerHTML = h;
    /* auto-scroll ke opsi terpilih (hanya saat tanpa pencarian) */
    if (!kw) {
      var selEl = list.querySelector('.pr-opt.is-sel');
      if (selEl) list.scrollTop = Math.max(0, selEl.offsetTop - list.clientHeight / 2);
    } else list.scrollTop = 0;
  }

  function openDrop() {
    var dd = document.getElementById('prDropdown');
    var btn = q('#prDropWrap .pr-dropbtn');
    if (dd) { dd.style.display = 'block'; }
    if (btn) btn.classList.add('is-open');
    paintDrop();
    /* fokuskan kotak pencarian agar langsung bisa mengetik */
    var si = document.getElementById('prDropSearch');
    if (si) setTimeout(function () { try { si.focus(); si.select(); } catch (e) { /* noop */ } }, 60);
  }

  function closeDrop() {
    var dd = document.getElementById('prDropdown');
    var btn = q('#prDropWrap .pr-dropbtn');
    if (dd) dd.style.display = 'none';
    if (btn) btn.classList.remove('is-open');
    /* reset kata kunci pencarian */
    state.dropQuery = '';
    var si = document.getElementById('prDropSearch');
    if (si) si.value = '';
  }

  function dropIsOpen() {
    var dd = document.getElementById('prDropdown');
    return !!dd && dd.style.display !== 'none';
  }

  /* ============================================================
     CARD PREDIKSI — gaya berita, animasi popup
     ============================================================ */
  function headChars(text) {
    var out = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      out += ch === ' ' ? ' ' : '<span class="pr-ch" style="--ci:' + i + '">' + esc(ch) + '</span>';
    }
    return out;
  }

  function cardHTML(it, noanim) {
    var p = genPrediction(it);
    var m = ST_META[it.st] || ST_META.khusus;
    var hs = p.hokiSlot || it.slot || '';
    var namaFull = it.nama + (it.hoki ? ' ' + hs : '');
    var jadwalNote = it.hoki ? 'Rolling tiap 1 jam \u2014 sesi ' + hs + ' WIB (tutup :' + hs.slice(0, 2) + ':00, result :' + hs.slice(0, 2) + ':' + pad2(HOKI_RESULT_OFFSET) + ' WIB)'
      : (it.note ? esc(it.note) : esc(it.jadwal));

    /* digit tiles */
    function tiles(str, cls) {
      var h = '';
      for (var i = 0; i < str.length; i++) {
        h += '<span class="' + cls + '" style="--i:' + i + '">' + esc(str.charAt(i)) + '</span>';
      }
      return h;
    }
    function nums(arr, cls) {
      var h = '';
      arr.forEach(function (n, i) { h += '<span class="' + cls + '" style="--i:' + i + '">' + esc(n) + '</span>'; });
      return h;
    }

    var ticker =
      'BREAKING \u2014 BBFS KUAT ' + p.bbfs +
      ' \u2022 ANGKA IKUT ' + p.angkaIkut +
      ' \u2022 4D ' + p.d4.join(' ') +
      ' \u2022 3D ' + p.d3.join(' ') +
      ' \u2022 2D ' + p.d2.join(' ') +
      ' \u2022 COLOK BEBAS ' + p.colokBebas +
      ' \u2022 COLOK MACAU ' + p.colokMacau +
      ' \u2022 SHIO ' + p.colokShio.split('/').join('-') +
      ' \u2022 INVEST TWIN ' + p.investTwin +
      ' \u2022 UTAMAKAN PREDIKSI SENDIRI \u2022 ';

    return '' +
      '<article class="pr-card' + (noanim ? ' pr-noanim' : '') + '">' +
        '<div class="pr-banner">' +
          '<div class="pr-topline"></div>' +
          '<div class="pr-kicker"><span class="pr-live-dot"></span>PREDIKSI PASARAN<span class="pr-edition">EDISI ' + esc(p.dateLabel.toUpperCase()) + '</span></div>' +
          '<h2 class="pr-headline">Prediksi ' + headChars(namaFull) + '</h2>' +
          '<div class="pr-dateline">' +
            '<span class="pr-flagchip">' + it.flag + ' ' + esc(it.country) + '</span>' +
            '<span class="pr-datewrap">' +
              '<button type="button" class="pr-datechip' + (p.manual ? ' is-manual' : '') + '" data-action="dateedit" title="Klik untuk mengubah tanggal edisi prediksi">' +
                ICON_CALENDAR + esc(p.dateLabel) + (p.manual ? '<span class="pr-date-man">MANUAL</span>' : '') +
              '</button>' + datePopHTML() +
            '</span>' +
            '<span class="pr-pill ' + m.cls + '">' + m.label + '</span>' +
            (p.rolled && p.note ? '<span class="pr-rollchip">' + ICON_NEXT + esc(p.note) + '</span>' : '') +
            '<span class="pr-jadwalchip">' + ICON_BOLT + jadwalNote + '</span>' +
          '</div>' +
          '<div class="pr-ticker"><div class="pr-ticker-inner"><span>' + esc(ticker) + '</span><span>' + esc(ticker) + '</span></div></div>' +
        '</div>' +
        '<div class="pr-body">' +
          '<div class="pr-sec pr-sec-bbfs" style="--i:0">' +
            '<div class="pr-sec-label"><span class="pr-sec-bar"></span>BBFS KUAT</div>' +
            '<div class="pr-bbfs">' + tiles(p.bbfs, 'pr-tile') + '</div>' +
          '</div>' +
          '<div class="pr-sec" style="--i:1">' +
            '<div class="pr-sec-label"><span class="pr-sec-bar"></span>ANGKA IKUT</div>' +
            '<div class="pr-ai">' + tiles(p.angkaIkut, 'pr-tile pr-tile-sm') + '</div>' +
          '</div>' +
          '<div class="pr-sec" style="--i:2">' +
            '<div class="pr-sec-label"><span class="pr-sec-bar"></span>4D (BB)</div>' +
            '<div class="pr-nums">' + nums(p.d4, 'pr-num pr-num-4d') + '</div>' +
          '</div>' +
          '<div class="pr-sec" style="--i:3">' +
            '<div class="pr-sec-label"><span class="pr-sec-bar"></span>3D (BB)</div>' +
            '<div class="pr-nums">' + nums(p.d3, 'pr-num pr-num-3d') + '</div>' +
          '</div>' +
          '<div class="pr-sec" style="--i:4">' +
            '<div class="pr-sec-label"><span class="pr-sec-bar"></span>2D (BB)</div>' +
            '<div class="pr-nums">' + nums(p.d2, 'pr-num pr-num-2d') + '</div>' +
          '</div>' +
          '<div class="pr-grid2">' +
            '<div class="pr-sec pr-mini" style="--i:5"><div class="pr-sec-label"><span class="pr-sec-bar"></span>COLOK BEBAS</div><div class="pr-val">' + esc(p.colokBebas) + '</div></div>' +
            '<div class="pr-sec pr-mini" style="--i:6"><div class="pr-sec-label"><span class="pr-sec-bar"></span>COLOK MACAU</div><div class="pr-val">' + esc(p.colokMacau) + '</div></div>' +
            '<div class="pr-sec pr-mini" style="--i:7"><div class="pr-sec-label"><span class="pr-sec-bar"></span>COLOK SHIO</div><div class="pr-val pr-val-shio">' + shioChips(p.colokShio) + '</div></div>' +
            '<div class="pr-sec pr-mini" style="--i:8"><div class="pr-sec-label"><span class="pr-sec-bar"></span>INVEST TWIN</div><div class="pr-val">' + esc(p.investTwin) + '</div></div>' +
          '</div>' +
          '<div class="pr-ups" style="--i:9">' + ICON_STAR + '<span>' + esc(p.ups) + '</span></div>' +
        '</div>' +
        '<div class="pr-cardfoot">' +
          '<button class="pr-btn pr-btn-copy" data-action="copy">' + ICON_COPY + '<span>Copy Pasaran</span></button>' +
          '<span class="pr-note">' + (it.hoki ? 'Prediksi sesi berganti tiap jam \u2022 ' : 'Prediksi berganti tiap hari \u2022 ') + 'stabil sepanjang periode</span>' +
        '</div>' +
      '</article>';
  }

  function shioChips(slash) {
    return slash.split('/').map(function (s, i) {
      return '<span class="pr-shio" style="--i:' + i + '">' + esc(s) + '</span>';
    }).join('');
  }

  /* ============================================================
     POPOVER UBAH TANGGAL EDISI
     ============================================================ */
  function datePopHTML() {
    var val = /^\d{4}-\d{2}-\d{2}$/.test(state.viewDate || '') ? state.viewDate : wibDateParts().seed;
    return '<div class="pr-datepop" id="prDatePop" style="display:none;" role="dialog" aria-label="Ubah tanggal edisi prediksi">' +
      '<span class="pr-datepop-label">UBAH TANGGAL EDISI</span>' +
      '<input type="date" id="prDateInput" value="' + esc(val) + '" />' +
      '<div class="pr-datepop-actions">' +
        '<button type="button" class="pr-btn pr-btn-copy" data-action="dateapply">TERAPKAN</button>' +
        '<button type="button" class="pr-btn" data-action="datereset">OTOMATIS</button>' +
      '</div>' +
      '<div class="pr-datepop-note">Prediksi dibuat utk tanggal pilihan &amp; stabil pada tanggal itu. Pilih OTOMATIS agar kembali mengikuti hari ini \u2014 bergeser sendiri ke draw berikutnya setelah result keluar.</div>' +
    '</div>';
  }

  function datePopOpen() {
    var p = document.getElementById('prDatePop');
    return !!p && p.style.display !== 'none';
  }

  function openDatePop() {
    var p = document.getElementById('prDatePop');
    if (!p) return;
    p.style.display = 'block';
    var inp = document.getElementById('prDateInput');
    if (inp) {
      inp.value = /^\d{4}-\d{2}-\d{2}$/.test(state.viewDate || '') ? state.viewDate : wibDateParts().seed;
      setTimeout(function () { try { inp.focus(); } catch (e) { /* noop */ } }, 50);
    }
  }

  function closeDatePop() {
    var p = document.getElementById('prDatePop');
    if (p) p.style.display = 'none';
  }

  function applyViewDate() {
    var inp = document.getElementById('prDateInput');
    var v = inp ? String(inp.value || '') : '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) { toast('Pilih tanggal dulu sebelum diterapkan', 'error'); return; }
    state.viewDate = v;
    closeDatePop();
    state.animate = false;
    paint();
    toast('Prediksi memakai tanggal ' + seedToLabel(v) + ' (MANUAL)');
  }

  function clearViewDate() {
    state.viewDate = '';
    closeDatePop();
    state.animate = false;
    paint();
    toast('Tanggal kembali OTOMATIS \u2014 ikut hari ini / geser setelah result');
  }

  /* ============================================================
     AKSI COPY
     ============================================================ */
  function copySelected() {
    var it = selectedEntry();
    if (!it) { toast('Pilih pasaran dulu', 'error'); return ''; }
    var p = genPrediction(it);
    var nama = it.nama + (it.hoki ? ' ' + (p.hokiSlot || it.slot) : '');
    var txt = buildCopy(it, p);
    copyText(txt, 'Prediksi "' + nama + '" tersalin');
    return txt;
  }

  function copyAllVisible() {
    var vis = visibleItems();
    if (!vis.length) { toast('Tidak ada pasaran pada filter ini', 'error'); return ''; }
    var txt = vis.map(function (it) { return buildCopy(it, genPrediction(it)); }).join('\n\n');
    copyText(txt, vis.length + ' prediksi pasaran tersalin');
    return txt;
  }

  /* ============================================================
     JAM WIB LIVE + REPAINT PER MENIT
     ============================================================ */
  function tickClock() {
    var el = document.getElementById('prClock');
    var n = wibNow();
    if (el) el.textContent = pad2(n.h) + ':' + pad2(n.mi) + ':' + pad2(n.s) + ' WIB';
    if (n.h * 60 + n.mi !== lastMinute) {
      var first = lastMinute === -1;
      lastMinute = n.h * 60 + n.mi;
      if (!first && state.loaded && !state.loading) {
        state.lastList = deriveList();
        ensureSelection();
        paint(); /* pr-noanim: paint() mematikan animate -> tanpa replay */
      }
    }
  }

  function startClock() {
    if (clockTimer) return;
    tickClock();
    clockTimer = setInterval(tickClock, 1000);
  }

  /* ============================================================
     EVENT DELEGATION (sekali, pada container)
     ============================================================ */
  function bindEvents() {
    var c = container();
    if (!c || c.dataset.prBound) return;
    c.dataset.prBound = '1';

    c.addEventListener('click', function (ev) {
      var t = ev.target;
      var actEl = t.closest ? t.closest('[data-action]') : null;
      if (actEl && c.contains(actEl)) {
        var act = actEl.getAttribute('data-action');
        if (act === 'droptoggle') {
          if (dropIsOpen()) closeDrop(); else openDrop();
          return;
        }
        if (act === 'refresh') { load(true); return; }
        if (act === 'copy') { copySelected(); return; }
        if (act === 'copyall') { copyAllVisible(); return; }
        if (act === 'dateedit') { if (datePopOpen()) closeDatePop(); else openDatePop(); return; }
        if (act === 'dateapply') { applyViewDate(); return; }
        if (act === 'datereset') { clearViewDate(); return; }
      }
      var chipEl = t.closest ? t.closest('.pr-chip[data-filter]') : null;
      if (chipEl && c.contains(chipEl)) { setFilter(chipEl.getAttribute('data-filter')); return; }
      var optEl = t.closest ? t.closest('.pr-opt[data-key]') : null;
      if (optEl && c.contains(optEl)) { selectKey(optEl.getAttribute('data-key'), { manual: true }); return; }
    });

    /* kotak pencarian dropdown: ketik -> filter opsi; Enter -> pilih match pertama */
    var si = document.getElementById('prDropSearch');
    if (si && !si.dataset.prBound) {
      si.dataset.prBound = '1';
      si.addEventListener('input', function () {
        state.dropQuery = si.value || '';
        paintDrop();
      });
      si.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') {
          var opts = dropOptions();
          if (opts.length) selectKey(opts[0].key, { manual: true });
          ev.preventDefault();
        }
        /* Escape ditangani listener document (tutup dropdown) */
      });
    }

    /* klik di luar dropdown / popover tanggal -> tutup */
    if (!document.__prDropOutside) {
      document.__prDropOutside = true;
      document.addEventListener('click', function (ev) {
        var t = ev.target;
        if (dropIsOpen() && !(t.closest && t.closest('#prDropWrap'))) closeDrop();
        if (datePopOpen() && !(t.closest && t.closest('.pr-datewrap'))) closeDatePop();
      });
    }

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') {
        if (dropIsOpen()) closeDrop();
        if (datePopOpen()) closeDatePop();
      }
    });
  }

  /* ============================================================
     RENDER (dipanggil switchToPrediksi)
     ============================================================ */
  function render() {
    build();
    bindEvents();
    startClock();
    if (!state.loaded && !state.loading) load(false);
    else {
      state.lastList = deriveList();
      ensureSelection();
      state.animate = true;
      paint();
    }
  }

  /* ============================================================
     EXPOSE
     ============================================================ */
  window.PrediksiPro = {
    render: render,
    refresh: function () { load(true); },
    copy: copySelected,
    copyAll: copyAllVisible,
    select: function (key) { selectKey(key, { manual: true }); },
    setFilter: function (f) { setFilter(String(f || 'all')); },
    openDrop: openDrop,
    closeDrop: closeDrop,
    buildCopy: buildCopy,
    genPrediction: genPrediction,
    editionOf: editionOf,
    setViewDate: function (v) {
      var s = String(v || '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
      state.viewDate = s; state.animate = false; paint(); return true;
    },
    clearViewDate: function () { state.viewDate = ''; state.animate = false; paint(); },
    repaint: function () { state.animate = false; paint(); },
    seedToLabel: seedToLabel,
    visibleItems: visibleItems,
    state: state
  };
})();
