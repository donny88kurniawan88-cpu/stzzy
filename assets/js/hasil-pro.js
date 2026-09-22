/* ============================================================
   AURA.OS // HASIL-PRO.JS v1.2.0
   Modul Hasil Result (Pro) — di bawah menu Prediction Tools.
   ============================================================
   v1.2.0 (Task 25):
   - TAB IKUT BERGERAK: setTab() kini sinkron class .active (dulu
     indikator tab mentok di tab lama walau isi sudah pindah) +
     animasi fade-slide body tiap ganti tab / masuk menu.
   - DROPDOWN FIX: label "— Semua Pasaran —" pakai karakter em-dash
     asli; dulu "&mdash;" ter-escape dobel & tampil literal.
   - SHIO BULLETPROOF: window.ShioData hilang di deployment tertentu
     ("Cannot read properties of undefined (reading 'parseText')")
     -> ensureShioData() auto-load /js/shio-data.js + FALLBACK ENGINE
     built-in (rumus & parser sama persis) sehingga tabel shio + OCR
     tetap berfungsi apa pun kondisi deployment.
   - FORMAT BARU (permintaan user): "Prize 1 : 1234 , SHIO : Monyet"
     (dulu "Result 1"), baris tanggal "Hari Selasa, 22 Sep 2026".
   - FITUR BARU: kolom Situs — icon link ke situs resmi pasaran
     (dari data link menu Jadwal Pasaran) di tabel Checklist Status.
   Fitur (permintaan user):
   1. CHECKLIST STATUS — menarik data pasaran + jadwal buka/tutup/
      result dari menu Jadwal Pasaran (/api/pasaran). Checklist
      pasaran: TUTUP, BELUM RESULT, SEDANG RESULT (+ DONE & LIBUR),
      ceklis manual per tanggal.
   2. HITUNG WAKTU TUTUP — tabel crosscheck: jam tutup, waktu
      sekarang (WIB live), jam result, countdown ke result
      berikutnya, status AMAN (buka) / TIDAK AMAN (tutup/libur).
   3. KARTU HASIL PENGELUARAN — input result per pasaran (1-3
      prize), toggle dropdown pilih pasaran, format tampil & copy:
        Hasil Pengeluaran HONGKONG
        Hari Senin, 21 Sep 2026
        Result 1 : 0935, SHIO : Monyet
        Result 2 : 2507
        Result 3 : 3338
        Selamat Kepada Pemenang, Salam JP
   4. TABEL SHIO — membaca urutan tabel shio (rumus wajib:
      (N-1) mod 12, 00 = angka ke-100) + menu update tabel shio
      dari gambar jpg/png (OCR Tesseract.js) dengan validasi
      rumus anti-asal-asalan (baris melanggar rumus = ditolak).
   Data: /api/pasaran, /api/hasil, /api/shio (D1) + fallback lokal.
   Exposed: window.HasilPro
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     KONSTANTA & STATE
     ============================================================ */
  var LKEY_PS = 'aura_pasaran_local_v1';      // sama dgn pasaran-pro.js
  var LKEY_HASIL = 'aura_hasil_local_v1';     // fallback hasil saat DB tak terjangkau
  var LKEY_CEK = 'aura_hasil_ceklis_v1';      // ceklis manual per tanggal (cache/fallback D1)
  var HOKI_OFFSET = 10;                        // result sesi = tutup + 10 menit

  var DAY_UP = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
  var DAY_TITLE = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  var MON_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  var MON_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  var ST_META = {
    belum:  { label: 'BELUM RESULT', cls: 'hs-st-belum'  },
    sedang: { label: 'SEDANG RESULT', cls: 'hs-st-sedang' },
    tutup:  { label: 'TUTUP',        cls: 'hs-st-tutup'  },
    done:   { label: 'DONE',         cls: 'hs-st-done'   },
    libur:  { label: 'LIBUR',        cls: 'hs-st-libur'  },
    khusus: { label: 'KHUSUS',       cls: 'hs-st-libur'  }
  };

  var state = {
    items: [],            // pasaran (sumber sama dgn Jadwal Pasaran)
    source: null,         // 'db' | 'local'
    tab: 'status',        // 'status' | 'hasil' | 'shio'
    tanggal: '',          // YYYY-MM-DD WIB utk simpan/tampil result
    filter: 'all',        // all|belum|sedang|tutup|done|libur
    search: '',
    hasil: [],            // rows /api/hasil utk tanggal terpilih
    hasilById: {},        // pasaran_id -> row
    hasilSource: null,
    cek: {},              // { pasaranId: true } utk tanggal terpilih
    cekSource: null,      // 'db' | 'local'
    sel: '',              // pasaran terpilih di tab hasil ('' = semua)
    dropOpen: false,
    saving: false,
    loaded: false,
    loading: false,
    armClear: null,       // id kartu yg tombol clear-nya armed
    shio: {
      ocrBusy: false,
      ocrProg: 0,
      parsed: null,       // hasil parseText
      rows: null,         // preview editable [{name, numsStr}]
      err: ''
    }
  };

  var tickTimer = null;
  var lastPaintSec = -1;

  /* ============================================================
     SHIO FALLBACK ENGINE (v1.2.0 — bulletproof)
     Kenapa ada: sebagian deployment tidak memuat /js/shio-data.js
     (Dashboard lama / aset 404) sehingga tab shio kosong dan OCR
     crash dgn "Cannot read properties of undefined (reading
     'parseText')". Engine di bawah = salinan semangat shio-data.js:
     rumus (N-1) mod 12, 00 = angka ke-100, parser OCR + validasi.
     Dipasang HANYA bila window.ShioData benar-benar tak tersedia.
     ============================================================ */
  function installShioFallback() {
    if (window.ShioData && typeof window.ShioData.parseText === 'function') return;
    var LKEY = 'aura_shio_order_v1';
    var DEF = ['Kuda', 'Ular', 'Naga', 'Kelinci', 'Harimau', 'Kerbau', 'Tikus', 'Babi', 'Anjing', 'Ayam', 'Monyet', 'Kambing'];
    var st = { ord: DEF.slice(), source: 'default', updated_by: null, updated_at: null, loaded: false };
    try {
      var raw = localStorage.getItem(LKEY);
      if (raw) {
        var j = JSON.parse(raw);
        if (j && Array.isArray(j.ord) && j.ord.length === 12) {
          st.ord = j.ord.map(String); st.source = 'local';
          st.updated_by = j.updated_by || null; st.updated_at = j.updated_at || null;
        }
      }
    } catch (e) {}
    function pad2(n) { return ('0' + n).slice(-2); }
    function normName(s) { return String(s == null ? '' : s).toLowerCase().replace(/[^a-z]/g, ''); }
    function normKey(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
    function lev(a, b) {
      if (a === b) return 0;
      var m = a.length, n = b.length;
      if (!m) return n; if (!n) return m;
      var prev = new Array(n + 1), cur = new Array(n + 1), i, j;
      for (j = 0; j <= n; j++) prev[j] = j;
      for (i = 1; i <= m; i++) {
        cur[0] = i;
        for (j = 1; j <= n; j++) {
          var cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
          cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
        }
        var t = prev; prev = cur; cur = t;
      }
      return prev[n];
    }
    function matchShioName(rawS) {
      var t = normName(rawS);
      if (!t) return null;
      var best = null, bestD = 99;
      for (var i = 0; i < DEF.length; i++) {
        var c = normName(DEF[i]);
        var d = lev(t, c);
        if (t.indexOf(c) !== -1 || c.indexOf(t) !== -1) {
          if (Math.min(t.length, c.length) >= 4) d = 0;
        }
        if (d < bestD) { bestD = d; best = DEF[i]; }
      }
      return bestD <= 2 ? best : null;
    }
    function indexOfNumber(n) {
      var v = parseInt(n, 10);
      if (isNaN(v)) return -1;
      v = ((v % 100) + 100) % 100;
      if (v === 0) v = 100;
      return (v - 1) % 12;
    }
    function shioOf(two) {
      var s = String(two == null ? '' : two).trim();
      if (!/^\d{1,4}$/.test(s)) return '';
      var last2 = s.length >= 2 ? s.slice(-2) : pad2(parseInt(s, 10));
      var idx = indexOfNumber(last2);
      return idx < 0 ? '' : (st.ord[idx] || '');
    }
    function numbersFor(i) {
      var out = [];
      for (var n = i + 1; n <= 99; n += 12) out.push(pad2(n));
      if (i === 3) out.push('00');
      return out;
    }
    function validateStructure(ord) {
      if (!Array.isArray(ord) || ord.length !== 12) return { ok: false, error: 'Urutan shio harus tepat 12 nama (sekarang: ' + (ord ? ord.length : 0) + ')' };
      var seen = {};
      for (var i = 0; i < ord.length; i++) {
        var m = matchShioName(ord[i]);
        if (!m) return { ok: false, error: 'Nama shio tidak dikenali pada urutan ke-' + (i + 1) + ': "' + ord[i] + '"' };
        var k = normKey(m);
        if (seen[k]) return { ok: false, error: 'Shio "' + m + '" muncul dua kali' };
        seen[k] = 1;
      }
      return { ok: true, ord: ord.map(matchShioName) };
    }
    function parseText(text) {
      var lines = String(text == null ? '' : text).split(/\r?\n/);
      var found = {}, orderSeen = [], errors = [];
      function addNums(name, seg) {
        var f = found[name], seen = {};
        f.nums.forEach(function (s) { seen[s] = 1; });
        var re = /\d{1,3}/g, m;
        while ((m = re.exec(seg)) !== null) {
          var v = parseInt(m[0], 10);
          if (isNaN(v) || v < 0 || v > 100) continue;
          var two = v === 100 ? '00' : pad2(v % 100);
          if (v <= 99 && !seen[two]) { f.nums.push(two); seen[two] = 1; }
        }
      }
      var pendingName = null;
      for (var li = 0; li < lines.length; li++) {
        var line = lines[li];
        if (!line || !line.trim()) continue;
        var clean = line.replace(/([A-Za-z])\d+/g, '$1').replace(/\d+([A-Za-z])/g, '$1');
        var numOnly = /^\W*\d[\d\s,.:;|-]*\W*$/.test(clean.trim());
        if (numOnly && pendingName) { addNums(pendingName, clean); pendingName = null; continue; }
        var tokRe = /[A-Za-z]+/g, tm, toks = [];
        while ((tm = tokRe.exec(clean)) !== null) toks.push({ w: tm[0], i: tm.index });
        var marks = [];
        for (var ti = 0; ti < toks.length; ti++) {
          var m1 = matchShioName(toks[ti].w);
          if (m1) marks.push({ name: m1, start: toks[ti].i, end: toks[ti].i + toks[ti].w.length });
          else if (ti + 1 < toks.length) {
            var m2 = matchShioName(toks[ti].w + toks[ti + 1].w);
            if (m2) { marks.push({ name: m2, start: toks[ti].i, end: toks[ti + 1].i + toks[ti + 1].w.length }); ti++; }
          }
        }
        if (marks.length) {
          marks.sort(function (a, b) { return a.start - b.start; });
          var lastMark = null;
          for (var mi = 0; mi < marks.length; mi++) {
            var mk = marks[mi];
            if (!found[mk.name]) { found[mk.name] = { name: mk.name, nums: [] }; orderSeen.push(mk.name); }
            var segEnd = (mi + 1 < marks.length) ? marks[mi + 1].start : clean.length;
            var seg = clean.slice(mk.end, segEnd);
            if (/\d/.test(seg)) addNums(mk.name, seg);
            lastMark = mk;
          }
          pendingName = /\d/.test(clean) ? null : (lastMark ? lastMark.name : null);
        } else {
          if (!numOnly) pendingName = null;
        }
      }
      Object.keys(found).forEach(function (k) { if (!found[k].nums.length) delete found[k]; });
      var names = orderSeen.filter(function (n) { return found[n]; });
      var rows = names.map(function (n) {
        var f = found[n], minV = 101;
        f.nums.forEach(function (s) { var v = s === '00' ? 100 : parseInt(s, 10); if (v < minV) minV = v; });
        return { name: n, nums: f.nums.slice(), minV: minV };
      }).sort(function (a, b) { return a.minV - b.minV; });
      var order = rows.map(function (r) { return r.name; });
      var struct = validateStructure(order);
      if (!struct.ok) errors.push(struct.error);
      rows.forEach(function (r, idx) {
        r.idx = idx; r.bad = [];
        r.nums.forEach(function (s) { if (indexOfNumber(s) !== idx) r.bad.push(s); });
        r.ok = r.bad.length === 0;
        if (!r.ok) errors.push(r.name + ': angka ' + r.bad.join(', ') + ' tidak sesuai rumus');
      });
      var complete = names.length === 12;
      if (!complete && text && text.trim()) errors.push('Hanya ' + names.length + ' dari 12 shio terbaca — perbaiki manual pada grid preview');
      return { rows: rows, order: order, valid: complete && rows.every(function (r) { return r.ok; }) && struct.ok, errors: errors, count: names.length };
    }
    function saveLocal() {
      try { localStorage.setItem(LKEY, JSON.stringify({ ord: st.ord, source: st.source, updated_by: st.updated_by, updated_at: st.updated_at })); } catch (e) {}
    }
    function load() {
      return fetch('/api/shio', { headers: { 'x-auth-token': (localStorage.getItem('aura_auth_token') || '') } })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j && j.success && j.shio && Array.isArray(j.shio.ord) && j.shio.ord.length === 12) {
            st.ord = j.shio.ord.map(String);
            st.source = j.source === 'd1' ? 'd1' : 'default';
            st.updated_by = j.shio.updated_by || null;
            st.updated_at = j.shio.updated_at || null;
            saveLocal();
          }
          st.loaded = true;
          return st;
        })
        .catch(function () { st.loaded = true; return st; });
    }
    function saveOrder(ord) {
      var chk = validateStructure(ord);
      if (!chk.ok) return Promise.resolve({ ok: false, error: chk.error });
      return fetch('/api/shio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': (localStorage.getItem('aura_auth_token') || '') },
        body: JSON.stringify({ ord: ord })
      })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok && j && j.success, j: j }; }); })
        .then(function (res) {
          if (res.ok) { st.ord = ord.map(String); st.source = 'd1'; st.updated_at = Date.now(); saveLocal(); return { ok: true, j: res.j }; }
          return { ok: false, error: (res.j && (res.j.error || res.j.message)) || 'Gagal menyimpan shio' };
        })
        .catch(function (e) { return { ok: false, error: 'Database tidak terjangkau — shio tidak tersimpan (' + (e.message || 'network') + ')' }; });
    }
    window.ShioData = {
      DEFAULT_ORDER: DEF.slice(),
      load: load,
      saveOrder: saveOrder,
      shioOf: shioOf,
      numbersFor: numbersFor,
      indexOfNumber: indexOfNumber,
      parseText: parseText,
      validateStructure: validateStructure,
      matchShioName: matchShioName,
      state: st,
      order: function () { return st.ord.slice(); }
    };
  }

  /* Pastikan engine shio tersedia: sudah ada -> langsung; belum ->
     coba muat /js/shio-data.js dinamis; gagal juga -> pasang fallback. */
  var shioEnsuring = null;
  function ensureShioData() {
    if (window.ShioData && typeof window.ShioData.parseText === 'function') return Promise.resolve(true);
    if (shioEnsuring) return shioEnsuring;
    shioEnsuring = new Promise(function (res) {
      try {
        var s = document.createElement('script');
        s.src = '/js/shio-data.js?v=1.0.1';
        s.onload = function () { res(!!(window.ShioData && typeof window.ShioData.parseText === 'function')); };
        s.onerror = function () { res(false); };
        document.head.appendChild(s);
      } catch (e) { res(false); }
    }).then(function (ok) {
      if (!ok) installShioFallback();
      shioEnsuring = null;
      return true;
    });
    return shioEnsuring;
  }

  /* ============================================================
     WAKTU WIB
     ============================================================ */
  function pad2(n) { return ('0' + n).slice(-2); }

  /* Bagian tanggal-jam WIB (UTC+7) dari epoch ms */
  function wibParts(ms) {
    var d = new Date(ms + 7 * 3600000);
    return {
      y: d.getUTCFullYear(), mo: d.getUTCMonth(), d: d.getUTCDate(),
      h: d.getUTCHours(), mi: d.getUTCMinutes(), s: d.getUTCSeconds(),
      day: d.getUTCDay(), m: d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60
    };
  }

  function wibMs(y, mo, d, h, mi, s) {
    return Date.UTC(y, mo, d, h, mi, s || 0) - 7 * 3600000;
  }

  function wibNow() {
    var now = Date.now();
    var p = wibParts(now);
    p.ms = now;
    return p;
  }

  function dateStrOf(p) {
    return p.y + '-' + pad2(p.mo + 1) + '-' + pad2(p.d);
  }

  /* 'YYYY-MM-DD' -> parts tampilan (pakai Date lokal, aman utk label) */
  function partsOfDateStr(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
    if (!m) return null;
    var dt = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
    return { y: dt.getFullYear(), mo: dt.getMonth(), d: dt.getDate(), day: dt.getDay() };
  }

  function fmtDateShort(s) {
    var p = partsOfDateStr(s);
    return p ? DAY_TITLE[p.day] + ', ' + p.d + ' ' + MON_SHORT[p.mo] + ' ' + p.y : '-';
  }

  function fmtDateFullUp(s) {
    var p = partsOfDateStr(s);
    return p ? DAY_UP[p.day] + ', ' + p.d + ' ' + MON_FULL[p.mo].toUpperCase() + ' ' + p.y : '-';
  }

  function todayWIB() {
    return dateStrOf(wibNow());
  }

  /* ============================================================
     HELPERS
     ============================================================ */
  function q(sel, ctx) { return (ctx || document).querySelector(sel); }
  function container() { return document.getElementById('hasilView'); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function toast(msg, type) {
    if (typeof window.showToast === 'function') window.showToast(msg, type);
  }

  function token() {
    return localStorage.getItem('aura_auth_token') || '';
  }

  function normKey(s) {
    return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  /* "13:05 WIB" / "13:05:00 WIB" / "13:05" / "13.05" -> menit dari tengah malam.
     v1.1: suffix WIB TIDAK wajib — data produksi bisa disimpan tanpa WIB
     (dulu format tanpa WIB membuat jadwal tak terbaca & Next Result salah). */
  function parseHM(s) {
    var m = String(s == null ? '' : s).match(/\b(\d{1,2})[:.](\d{2})(?::\d{2})?(\s*WIB)?\b/i);
    if (!m) return null;
    var h = parseInt(m[1], 10), mm = parseInt(m[2], 10);
    if (h > 23 || mm > 59) return null;
    return h * 60 + mm;
  }

  function hmOnly(s) {
    var m = parseHM(s);
    if (m == null) return '';
    return pad2(Math.floor(m / 60)) + ':' + pad2(m % 60) + ' WIB';
  }

  /* epoch ms -> "HH:MM WIB" (utk label jam target next result) */
  function hmOfMs(ms) {
    var p = wibParts(ms);
    return pad2(p.h) + ':' + pad2(p.mi) + ' WIB';
  }

  /* "Selasa & Jumat TUTUP" -> [2,5] */
  function closedDaysOf(text) {
    var T = String(text || '').toUpperCase();
    var idx = T.indexOf('TUTUP');
    if (idx === -1) return null;
    var head = T.slice(0, idx);
    var found = [];
    for (var i = 0; i < DAY_UP.length; i++) {
      if (head.indexOf(DAY_UP[i]) !== -1) found.push(i);
    }
    return found.length ? found : null;
  }

  function isHokiRow(it) {
    var nU = normKey(it.nama);
    var tU = String(it.tutup || '').toUpperCase();
    var rU = String(it.result || '').toUpperCase();
    return nU.indexOf('HOKI') !== -1 && (tU.indexOf('24X') !== -1 || rU.indexOf('1 JAM') !== -1 || normKey(it.nama) === 'HOKIDRAW' || nU.indexOf('HOKIDRAW') !== -1);
  }

  function sortedPasaran() {
    return state.items.slice().sort(function (a, b) { return (a.no || 0) - (b.no || 0); });
  }

  /* ============================================================
     STATUS & COUNTDOWN (engine sama semangatnya dgn pkpasaran-pro)
     ============================================================ */
  /* Status pasaran vs waktu WIB sekarang:
     buka -> 'belum' | antara tutup-result -> 'sedang' | lewat result -> 'tutup'
     (DONE dihitung terpisah dari data result yang sudah diinput) */
  function statusOf(it, now) {
    var closed = closedDaysOf(it.jadwal) || closedDaysOf(it.tutup);
    if (closed && closed.indexOf(now.day) !== -1) return 'libur';
    var tu = parseHM(it.tutup), re = parseHM(it.result);
    if (tu == null && re == null) return 'khusus';
    if (tu != null && re != null) {
      if (now.m < tu) return 'belum';
      if (now.m < re) return 'sedang';
      return 'tutup';
    }
    if (tu != null) return now.m < tu ? 'belum' : 'sedang';
    return 'tutup';
  }

  function hokiSlotStatus(now) {
    var re = now.h * 60 + HOKI_OFFSET;
    if (now.m < re) return 'sedang';      // sesi berjalan: tutup :00 -> result :10
    return 'tutup';                        // result sesi sudah lewat
  }

  /* ms absolut (epoch) result berikutnya utk pasaran ini */
  function nextResultMs(it, now) {
    if (isHokiRow(it)) {
      var addMin = HOKI_OFFSET - (now.m % 60);
      if (addMin <= 0) addMin += 60;
      return now.ms + addMin * 60000;
    }
    var closed = closedDaysOf(it.jadwal) || closedDaysOf(it.tutup);
    var tu = parseHM(it.tutup), re = parseHM(it.result);
    var target = (re != null) ? re : (tu != null ? tu : null);
    if (target == null) return null;
    var k = 0;
    if (closed) {
      /* hari ini libur -> mulai besok */
      if (closed.indexOf(now.day) !== -1) k = 1;
    } else if (now.m < target) {
      k = 0;
    } else {
      k = 1;
    }
    if (closed) {
      for (var guard = 0; guard < 8 && closed.indexOf((now.day + k) % 7) !== -1; guard++) k++;
    }
    return wibMs(now.y, now.mo, now.d + k, Math.floor(target / 60), target % 60, 0);
  }

  function fmtCountdown(msLeft) {
    if (msLeft == null) return '&mdash;';
    if (msLeft < 0) msLeft = 0;
    var tot = Math.floor(msLeft / 1000);
    var h = Math.floor(tot / 3600), m = Math.floor((tot % 3600) / 60), s = tot % 60;
    return pad2(h) + ':' + pad2(m) + ':' + pad2(s);
  }

  function fmtClock(p) {
    return pad2(p.h) + ':' + pad2(p.mi) + ':' + pad2(p.s);
  }

  /* chip status final (memperhitungkan DONE dari hasil terinput) */
  function chipOf(it, now) {
    var st = isHokiRow(it) ? hokiSlotStatus(now) : statusOf(it, now);
    var row = state.hasilById[String(it.id)];
    if (row && Array.isArray(row.items) && row.items.length) st = 'done';
    return st;
  }

  /* ============================================================
     DATA — pasaran (sumber sama dgn Jadwal Pasaran) + hasil + shio
     ============================================================ */
  function fetchPasaran() {
    state.loading = true;
    return fetch('/api/pasaran', { headers: { 'x-auth-token': token() } })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        state.loading = false;
        if (j && j.success && Array.isArray(j.pasaran)) {
          state.items = j.pasaran;
          state.source = 'db';
        } else throw new Error('bad payload');
      })
      .catch(function () {
        state.loading = false;
        state.source = 'local';
        try {
          var arr = JSON.parse(localStorage.getItem(LKEY_PS) || '[]');
          state.items = Array.isArray(arr) ? arr : [];
        } catch (e) { state.items = []; }
      });
  }

  function localHasilAll() {
    try { return JSON.parse(localStorage.getItem(LKEY_HASIL) || '{}'); } catch (e) { return {}; }
  }

  function saveLocalHasil(store) {
    try { localStorage.setItem(LKEY_HASIL, JSON.stringify(store)); } catch (e) {}
  }

  function fetchHasil() {
    state.hasil = [];
    state.hasilById = {};
    return fetch('/api/hasil?tanggal=' + encodeURIComponent(state.tanggal), { headers: { 'x-auth-token': token() } })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && j.success && Array.isArray(j.hasil)) {
          state.hasil = j.hasil;
          state.hasilSource = 'db';
        } else throw new Error('bad payload');
        indexHasil();
      })
      .catch(function () {
        var store = localHasilAll();
        state.hasil = (store[state.tanggal] || []);
        state.hasilSource = 'local';
        indexHasil();
      });
  }

  function indexHasil() {
    var map = {};
    state.hasil.forEach(function (r) { map[String(r.pasaran_id)] = r; });
    state.hasilById = map;
  }

  function localCekOf(tgl) {
    try {
      var all = JSON.parse(localStorage.getItem(LKEY_CEK) || '{}');
      return all[tgl] || {};
    } catch (e) { return {}; }
  }

  function saveLocalCek(tgl, map) {
    try {
      var all = JSON.parse(localStorage.getItem(LKEY_CEK) || '{}');
      all[tgl] = map;
      localStorage.setItem(LKEY_CEK, JSON.stringify(all));
    } catch (e) {}
  }

  /* v1.1 FIX "ceklis tidak tersimpan":
     (1) dulu loadCek() TIDAK dipanggil saat render awal -> state.cek = {}
         dan centang pertama MENIMPA semua centang lama utk tanggal tsb;
     (2) dulu hanya localStorage (per device). Sekarang ceklis persist
         ke D1 via /api/hasil/ceklis (sinkron antar device), localStorage
         hanya cache/fallback offline. */
  function fetchCeklis() {
    state.cek = localCekOf(state.tanggal);   // optimistic dari cache
    return fetch('/api/hasil/ceklis?tanggal=' + encodeURIComponent(state.tanggal), { headers: { 'x-auth-token': token() } })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && j.success && Array.isArray(j.ceklis)) {
          var map = {};
          j.ceklis.forEach(function (r) { if (r && r.pasaran_id != null) map[String(r.pasaran_id)] = true; });
          state.cek = map;
          saveLocalCek(state.tanggal, map);
          state.cekSource = 'db';
        } else throw new Error('bad payload');
      })
      .catch(function () { state.cekSource = 'local'; })
      .then(function () { if (state.tab === 'status' && state.loaded) paintBody(); });
  }

  /* dipakai setDate() — alias agar seluruh titik muat ceklis konsisten */
  function loadCek() { fetchCeklis(); }

  /* set/unset satu centang + persist (D1 dulu, selalu cache lokal) */
  function setCek(id, on) {
    var k = String(id);
    if (on) state.cek[k] = true; else delete state.cek[k];
    saveLocalCek(state.tanggal, state.cek);
    fetch('/api/hasil/ceklis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token() },
      body: JSON.stringify({ pasaran_id: isNaN(parseInt(id, 10)) ? id : parseInt(id, 10), tanggal: state.tanggal, on: !!on })
    }).catch(function () {});
  }

  /* ============================================================
     BUILD SHELL (sekali)
     ============================================================ */
  var ICON_REFRESH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>';
  var ICON_CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
  var ICON_TROPHY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>';
  var ICON_IMG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
  var ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var ICON_EXT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';

  /* v1.2 FITUR (permintaan user): icon direct-link situs resmi pasaran.
     Sumber link = field `link` di data pasaran (menu Jadwal Pasaran). */
  function webCell(it) {
    var link = String(it.link || '').trim();
    if (!link || link === '#') return '<span class="hs-web-none" title="Tidak ada link situs resmi">\u2014</span>';
    var href = /^https?:\/\//i.test(link) ? link : 'https://' + link;
    return '<a class="hs-web" href="' + esc(href) + '" target="_blank" rel="noopener noreferrer" title="Situs resmi ' + esc(it.nama) + '" aria-label="Situs resmi ' + esc(it.nama) + '">' + ICON_EXT + '</a>';
  }

  function build() {
    var v = container();
    if (!v || v.dataset.built === '1') return;

    v.innerHTML =
      '<div class="hs-wrap">' +
        '<div class="hs-card">' +
          '<div class="hs-topline"></div>' +
          '<div class="hs-head">' +
            '<div class="hs-head-left">' +
              '<div class="hs-icon">' + ICON_TROPHY + '</div>' +
              '<div style="min-width:0;">' +
                '<h2 class="hs-title">Hasil Result</h2>' +
                '<p class="hs-sub">Checklist status, hitung waktu tutup &amp; hasil pengeluaran semua pasaran.</p>' +
              '</div>' +
            '</div>' +
            '<div class="hs-head-btns">' +
              '<span class="hs-src" data-hs="src"><span class="hs-src-dot"></span><span data-hs="src-t">&mdash;</span></span>' +
              '<button type="button" class="hs-btn" data-action="refresh" title="Muat ulang data">' + ICON_REFRESH + 'Muat Ulang</button>' +
            '</div>' +
          '</div>' +
          '<div class="hs-tabs">' +
            '<button type="button" class="hs-tab" data-action="tab" data-tab="status">Checklist Status</button>' +
            '<button type="button" class="hs-tab" data-action="tab" data-tab="hasil">Hasil Pengeluaran</button>' +
            '<button type="button" class="hs-tab" data-action="tab" data-tab="shio">Tabel Shio</button>' +
          '</div>' +
          '<div data-hs="clockbar" class="hs-clockbar"></div>' +
          '<div data-hs="body"></div>' +
        '</div>' +
      '</div>';

    v.dataset.built = '1';

    v.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('[data-action]') : null;
      if (!t || !v.contains(t)) return;
      var act = t.getAttribute('data-action');
      if (act === 'tab') setTab(t.getAttribute('data-tab'));
      else if (act === 'refresh') refreshAll(true);
      else if (act === 'chip') { state.filter = t.getAttribute('data-filter') || 'all'; paintBody(); }
      else if (act === 'cek') toggleCek(t.getAttribute('data-id'), t);
      else if (act === 'drop') toggleDrop();
      else if (act === 'dropitem') pickDrop(t.getAttribute('data-id'));
      else if (act === 'prize') cyclePrize(t.getAttribute('data-id'));
      else if (act === 'save') saveCard(t.getAttribute('data-id'));
      else if (act === 'copy') copyCard(t.getAttribute('data-id'));
      else if (act === 'clear') clearCard(t.getAttribute('data-id'), t);
      else if (act === 'ocrpick') pickOcr();
      else if (act === 'ocrparse') parseOcrText();
      else if (act === 'shiofix') fixShioFromFormula();
      else if (act === 'shiostd') useStdShio();
      else if (act === 'shiosave') saveShio();
    });

    v.addEventListener('input', function (e) {
      var el = e.target;
      if (!el || !v.contains(el)) return;
      if (el.getAttribute && el.getAttribute('data-hs-search') != null) {
        state.search = el.value.trim();
        if (state.tab === 'status') paintStatus();
        else if (state.tab === 'hasil') paintHasil();
      } else if (el.getAttribute && el.getAttribute('data-hs-date') != null) {
        setDate(el.value);
      } else if (el.classList && el.classList.contains('hs-ocr-text')) {
        state.shio.ocrText = el.value;
      }
    });

    v.addEventListener('change', function (e) {
      var el = e.target;
      if (el && el.id === 'hsOcrFile' && el.files && el.files[0]) runOcr(el.files[0]);
      if (el && el.classList && el.classList.contains('hs-pv-name')) syncShioRow(el);
      if (el && el.classList && el.classList.contains('hs-pv-nums')) syncShioRow(el);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { state.dropOpen = false; paintDrop(); }
    });
    document.addEventListener('click', function (e) {
      if (!state.dropOpen) return;
      var w = e.target && e.target.closest ? e.target.closest('[data-hs-ddwrap]') : null;
      if (!w) { state.dropOpen = false; paintDrop(); }
    }, true);

    /* v1.1: drag & drop gambar shio langsung ke dropzone */
    v.addEventListener('dragover', function (e) {
      if (e.target && e.target.closest && e.target.closest('#hsDropzone')) e.preventDefault();
    });
    v.addEventListener('drop', function (e) {
      var z = e.target && e.target.closest ? e.target.closest('#hsDropzone') : null;
      if (!z) return;
      e.preventDefault();
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) runOcr(f);
    });
  }

  /* ============================================================
     TAB
     ============================================================ */
  function setTab(tab) {
    state.tab = (tab === 'hasil' || tab === 'shio') ? tab : 'status';
    var v = container();
    if (v) syncTabs(v);   /* v1.2 FIX "UI tidak mengikuti": indikator tab wajib pindah */
    paintBody(true);      /* v1.2: + animasi fade-slide body saat ganti tab */
  }

  /* v1.2 — sinkronkan class .active pada tab bar ke state.tab.
     Dulu hanya paintAll() yang meng-update tab; setTab() tidak, sehingga
     user sudah di tab Hasil Pengeluaran tapi underline mentok di tab lama. */
  function syncTabs(v) {
    var tabs = v.querySelectorAll('.hs-tab');
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].getAttribute('data-tab') === state.tab) tabs[i].classList.add('active');
      else tabs[i].classList.remove('active');
    }
  }

  function setDate(v) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v || ''))) return;
    state.tanggal = v;
    loadCek();
    fetchHasil().then(function () { paintBody(); });
  }

  function refreshAll(force) {
    fetchPasaran().then(function () {
      return fetchHasil();
    }).then(function () {
      return fetchCeklis();
    }).then(function () {
      state.loaded = true;
      paintAll(state._enterAnim === true);   /* v1.2: animasi entrance saat buka menu */
      state._enterAnim = false;
      if (force) toast('Data dimuat (' + (state.source === 'db' ? 'database' : 'mode lokal') + ')', 'success');
    });
    if (window.ShioData && typeof window.ShioData.load === 'function') window.ShioData.load();
  }

  function paintAll(anim) {
    var v = container();
    if (!v) return;
    /* sumber */
    var src = q('[data-hs="src"]', v), srcT = q('[data-hs="src-t"]', v);
    if (src && srcT) {
      if (state.source === 'db') { src.classList.remove('local'); srcT.textContent = 'SQLITE \u2022 D1'; }
      else { src.classList.add('local'); srcT.textContent = 'MODE LOKAL'; }
    }
    /* tabs (v1.2: helper bersama dgn setTab) */
    syncTabs(v);
    paintBody(anim === true);
  }

  function paintBody(anim) {
    var v = container();
    if (!v) return;
    var body = q('[data-hs="body"]', v);
    if (!body) return;
    /* v1.2: animasi entrance body — HANYA saat pindah tab / masuk menu,
       bukan pada repaint data biasa (aman-animasi: keyframes + backwards) */
    if (anim === true) {
      body.classList.remove('hs-anim');
      void body.offsetWidth;   /* paksa reflow agar animasi re-trigger */
      body.classList.add('hs-anim');
    }
    if (!state.tanggal) state.tanggal = todayWIB();
    if (!state.items.length && state.loading && !state.loaded) {
      body.innerHTML = '<div class="hs-loading"><span class="hs-spin"></span>Memuat data pasaran dari database&hellip;</div>';
      return;
    }
    if (state.tab === 'status') paintStatusInto(body);
    else if (state.tab === 'hasil') paintHasilInto(body);
    else paintShioInto(body);
  }

  function paintStatus() { paintBody(); }
  function paintHasil() { paintBody(); }
  function paintDrop() { if (state.tab === 'hasil') paintBody(); }

  /* ============================================================
     TAB 1+2 — CHECKLIST STATUS & HITUNG WAKTU TUTUP (satu tabel)
     ============================================================ */
  function statusFilterOk(st) {
    if (state.filter === 'all') return true;
    if (state.filter === 'belum') return st === 'belum';
    if (state.filter === 'sedang') return st === 'sedang';
    if (state.filter === 'tutup') return st === 'tutup';
    if (state.filter === 'done') return st === 'done';
    if (state.filter === 'libur') return st === 'libur' || st === 'khusus';
    return true;
  }

  function matchSearch(it) {
    if (!state.search) return true;
    return normKey(it.nama).indexOf(normKey(state.search)) !== -1;
  }

  function paintStatusInto(body) {
    var now = wibNow();
    var list = sortedPasaran();
    var chips = { all: 0, belum: 0, sedang: 0, tutup: 0, done: 0, libur: 0 };
    var nextPend = null;   // result berikutnya yg BELUM diinput (v1.1)
    var nextAny = null;    // fallback: result terdekat apa pun
    var isToday = state.tanggal === todayWIB();

    var rows = list.map(function (it) {
      var st = chipOf(it, now);
      chips.all++;
      chips[st === 'khusus' ? 'libur' : st]++;
      var nms = nextResultMs(it, now);
      if (nms != null) {
        if (!nextAny || nms < nextAny.at) nextAny = { at: nms, nama: it.nama };
        /* v1.1 FIX "next result" — pasaran yang resultnya SUDAH diinput (done)
           hari ini tidak lagi jadi kandidat next result; ambil jadwal pasaran
           berikutnya yang masih menunggu input. */
        if (!(isToday && st === 'done') && (!nextPend || nms < nextPend.at)) {
          nextPend = { at: nms, nama: it.nama };
        }
      }
      return { it: it, st: st, nms: nms };
    }).filter(function (r) { return statusFilterOk(r.st) && matchSearch(r.it); });

    var doneCount = chips.done;
    var belumCount = chips.all - doneCount;
    var nextShow = nextPend || nextAny;
    var nextLabel = nextShow
      ? '<b class="hs-next-jam">' + hmOfMs(nextShow.at) + '</b> <span class="hs-next-cd">' + fmtCountdown(nextShow.at - now.ms).slice(0, 5) + '</span> &bull; ' + esc(nextShow.nama)
      : '&mdash;';

    var h = [];
    h.push('<div class="hs-stats">');
    h.push('<div class="hs-stat"><div class="hs-stat-k">Total Pasaran Aktif</div><div class="hs-stat-v">' + chips.all + '</div><div class="hs-stat-s">dari menu Jadwal Pasaran</div></div>');
    h.push('<div class="hs-stat"><div class="hs-stat-k">Sudah Done</div><div class="hs-stat-v hs-ok">' + doneCount + '</div><div class="hs-stat-s">result sudah diinput</div></div>');
    h.push('<div class="hs-stat"><div class="hs-stat-k">Belum Result</div><div class="hs-stat-v hs-warn">' + belumCount + '</div><div class="hs-stat-s">menunggu input result</div></div>');
    h.push('<div class="hs-stat"><div class="hs-stat-k">Next Result</div><div class="hs-stat-v hs-v-sm">' + nextLabel + '</div><div class="hs-stat-s">jadwal berikutnya yang belum diinput</div></div>');
    h.push('</div>');

    h.push('<div class="hs-toolbar">' +
      '<label class="hs-datewrap">Tanggal Result <input type="date" data-hs-date value="' + esc(state.tanggal) + '"></label>' +
      '<div class="hs-searchbox"><input type="text" data-hs-search placeholder="Cari pasaran&hellip;" value="' + esc(state.search) + '"></div>' +
      '<div class="hs-chips">');
    var CHIP_DEFS = [['all', 'Semua'], ['belum', 'Belum Result'], ['sedang', 'Sedang Result'], ['tutup', 'Tutup'], ['done', 'Done'], ['libur', 'Libur']];
    CHIP_DEFS.forEach(function (cd) {
      h.push('<button type="button" class="hs-chip' + (state.filter === cd[0] ? ' active' : '') + '" data-action="chip" data-filter="' + cd[0] + '">' + cd[1] + ' <b>' + (chips[cd[0]] || 0) + '</b></button>');
    });
    h.push('</div></div>');

    /* tabel crosscheck: jam tutup + waktu sekarang + jam result + countdown + status + situs resmi + ceklis */
    h.push('<div class="hs-tablewrap"><table class="hs-table"><thead><tr>' +
      '<th>Pasaran</th><th>Jadwal</th><th>Jam Tutup</th><th>Waktu Sekarang</th><th>Jam Result</th><th>Countdown Result</th><th>Status</th><th class="hs-th-web" title="Link situs resmi pasaran (dari Jadwal Pasaran)">Situs</th><th class="hs-th-cek" title="Centang bila result pasaran ini sudah dicek">Ceklis</th>' +
      '</tr></thead><tbody>');

    if (!rows.length) {
      h.push('<tr><td colspan="9" class="hs-empty">' + (state.items.length ? 'Tidak ada pasaran yang cocok dengan filter/pencarian.' : 'Belum ada pasaran — isi dulu di menu Jadwal Pasaran.') + '</td></tr>');
    }

    rows.forEach(function (r) {
      var it = r.it;
      var hoki = isHokiRow(it);
      var meta = ST_META[r.st] || ST_META.tutup;
      var cd = r.nms != null ? '<span data-cd-ms="' + r.nms + '">' + fmtCountdown(r.nms - now.ms) + '</span>' : '&mdash;';
      var cek = !!state.cek[String(it.id)];
      h.push('<tr class="hs-tr ' + (cek ? 'hs-trcek' : '') + '" data-cekrow="' + esc(it.id) + '">' +
        '<td class="hs-tdname">' + esc(it.nama) + (hoki ? '<span class="hs-td-sub">result 24x sehari</span>' : '') + '</td>' +
        '<td class="hs-tdmut">' + esc(it.jadwal || 'SETIAP HARI') + '</td>' +
        '<td class="hs-tdmut">' + (hoki ? '24x SEHARI' : (esc(hmOnly(it.tutup)) || '&mdash;')) + '</td>' +
        '<td class="hs-tdnow" data-hs-now>' + fmtClock(now) + '</td>' +
        '<td class="hs-tdmut">' + (hoki ? 'SETIAP 1 JAM' : (esc(hmOnly(it.result)) || '&mdash;')) + '</td>' +
        '<td class="hs-tdcd">' + cd + '</td>' +
        '<td><span class="hs-st ' + meta.cls + '" title="' + meta.title + '">' + meta.label + '</span></td>' +
        '<td class="hs-tdweb">' + webCell(it) + '</td>' +
        '<td class="hs-tdcek"><button type="button" class="hs-cek' + (cek ? ' on' : '') + '" data-action="cek" data-id="' + esc(it.id) + '" aria-label="Ceklis ' + esc(it.nama) + '">' + (cek ? ICON_CHECK : '') + '</button></td>' +
        '</tr>');
    });
    h.push('</tbody></table></div>');

    h.push('<div class="hs-note">Status dihitung realtime vs jam WIB: <b class="hs-c-b">BELUM RESULT</b> = masih buka &middot; <b class="hs-c-a">SEDANG RESULT</b> = sudah tutup, menunggu result &middot; <b class="hs-c-r">TUTUP</b> = result sudah lewat &middot; <b class="hs-c-g">DONE</b> = result sudah diinput. Countdown menghitung waktu menuju result berikutnya &mdash; pasaran libur dihitung ke hari buka berikutnya.</div>');

    body.innerHTML = h.join('');
    ST_META.belum.title = 'Masih buka — belum result';
    ST_META.sedang.title = 'Sudah tutup — sedang menunggu result';
    ST_META.tutup.title = 'Result sudah lewat — pasaran tutup';
  }

  function toggleCek(id, btn) {
    var k = String(id);
    var on = !state.cek[k];
    setCek(id, on);   // v1.1: persist D1 + cache lokal (dulu saveCek() menimpa centang lama)
    var tr = btn && btn.closest ? btn.closest('tr') : null;
    if (tr) {
      if (on) { tr.classList.add('hs-trcek'); btn.classList.add('on'); btn.innerHTML = ICON_CHECK; }
      else { tr.classList.remove('hs-trcek'); btn.classList.remove('on'); btn.innerHTML = ''; }
    }
  }

  /* ============================================================
     TAB HASIL — kartu hasil pengeluaran + toggle dropdown pasaran
     ============================================================ */
  function dropItems() {
    var seen = {}, out = [];
    sortedPasaran().forEach(function (it) {
      if (seen[String(it.id)]) return;
      seen[String(it.id)] = 1;
      out.push(it);
    });
    return out;
  }

  function visibleCards() {
    var now = wibNow();
    return sortedPasaran().filter(function (it) {
      if (state.sel && String(it.id) !== String(state.sel)) return false;
      return matchSearch(it);
    }).map(function (it) { return { it: it, st: chipOf(it, now) }; });
  }

  function paintHasilInto(body) {
    var now = wibNow();
    var items = dropItems();
    /* v1.2 FIX: label "— Semua Pasaran —" pakai karakter em-dash ASLI.
       Dulu '&mdash;' lalu di-esc() -> '&amp;mdash;' -> tampil literal. */
    var selName = '\u2014 Semua Pasaran \u2014';
    if (state.sel) {
      var s = null;
      items.forEach(function (it) { if (String(it.id) === String(state.sel)) s = it; });
      selName = s ? s.nama : selName;
    }

    var h = [];
    h.push('<div class="hs-toolbar">' +
      '<label class="hs-datewrap">Tanggal Result <input type="date" data-hs-date value="' + esc(state.tanggal) + '"></label>' +
      '<div class="hs-dd" data-hs-ddwrap>' +
        '<button type="button" class="hs-ddbtn" data-action="drop"><span class="hs-ddlabel">' + esc(selName) + '</span><span class="hs-ddchev">' + ICON_CHEV + '</span></button>' +
        '<div class="hs-ddlist' + (state.dropOpen ? ' open' : '') + '">');
    h.push('<button type="button" class="hs-dditem' + (!state.sel ? ' active' : '') + '" data-action="dropitem" data-id="">\u2014 Semua Pasaran \u2014</button>');
    items.forEach(function (it) {
      h.push('<button type="button" class="hs-dditem' + (String(state.sel) === String(it.id) ? ' active' : '') + '" data-action="dropitem" data-id="' + esc(it.id) + '">' + esc(it.nama) + '</button>');
    });
    h.push('</div></div>' +
      '<div class="hs-searchbox"><input type="text" data-hs-search placeholder="Cari pasaran&hellip;" value="' + esc(state.search) + '"></div>' +
      '</div>');

    var cards = visibleCards();
    if (!cards.length) {
      h.push('<div class="hs-empty">' + (state.items.length ? 'Tidak ada pasaran yang cocok dengan pilihan/pencarian.' : 'Belum ada pasaran — isi dulu di menu Jadwal Pasaran.') + '</div>');
    } else {
      h.push('<div class="hs-cards">');
      cards.forEach(function (c) { h.push(cardHtml(c.it, c.st, now)); });
      h.push('</div>');
    }
    body.innerHTML = h.join('');
  }

  function cardItemsOf(it) {
    var row = state.hasilById[String(it.id)];
    var items = (row && Array.isArray(row.items)) ? row.items : [];
    var prize = row ? Math.min(3, Math.max(1, parseInt(row.prize, 10) || 1)) : 1;
    return { row: row, items: items, prize: prize };
  }

  function cardHtml(it, st, now) {
    var hoki = isHokiRow(it);
    var meta = ST_META[st] || ST_META.tutup;
    var cd = cardItemsOf(it);
    var lastBy = cd.row && cd.row.updated_by ? esc(cd.row.updated_by) : '';

    var h = [];
    h.push('<article class="hs-card-item" data-card="' + esc(it.id) + '">');
    h.push('<div class="hs-chead"><div style="min-width:0;"><h3 class="hs-cname">' + esc(it.nama) + '</h3>' +
      '<div class="hs-cmeta">' + (hoki ? 'SETIAP 1 JAM &bull; 24x SEHARI' : (esc(hmOnly(it.result)) || 'JADWAL KHUSUS')) + ' &bull; <span data-prize-label="' + esc(it.id) + '">' + cd.prize + ' Prize</span></div></div>' +
      '<span class="hs-st ' + meta.cls + '">' + meta.label + '</span></div>');

    /* input result (v1.2: label PRIZE — format baru permintaan user) */
    h.push('<div class="hs-rinwrap">');
    for (var n = 1; n <= 3; n++) {
      var val = '';
      cd.items.forEach(function (x) { if (parseInt(x.n, 10) === n) val = x.val; });
      h.push('<div class="hs-rinrow' + (n > cd.prize ? ' hide' : '') + '" data-rin="' + n + '">' +
        '<label class="hs-rinlab">PRIZE ' + n + '</label>' +
        '<input class="hs-rin" type="text" inputmode="numeric" maxlength="4" placeholder="' + (n === 1 ? 'Input angka&hellip;' : 'Opsional') + '" value="' + esc(val) + '" data-rinin="' + esc(it.id) + '-' + n + '">' +
        '</div>');
    }
    h.push('</div>');

    h.push('<div class="hs-btnrow">' +
      '<button type="button" class="hs-btn hs-btn-primary" data-action="save" data-id="' + esc(it.id) + '">Simpan Result</button>' +
      '<button type="button" class="hs-btn" data-action="copy" data-id="' + esc(it.id) + '">Copy</button>' +
      '<button type="button" class="hs-btn hs-ghost" data-action="prize" data-id="' + esc(it.id) + '" title="Ganti jumlah result/prize (1-3)">&times;' + cd.prize + ' Prize</button>' +
      '<button type="button" class="hs-btn hs-btn-danger' + (state.armClear === String(it.id) ? ' arm' : '') + '" data-action="clear" data-id="' + esc(it.id) + '">' + (state.armClear === String(it.id) ? 'Yakin? Hapus Result' : 'Clear Result') + '</button>' +
      '</div>');

    /* panel format hasil (v1.2: format persis permintaan user —
       "Hasil Pengeluaran BANGKOK 0930 / Hari Selasa, 22 Sep 2026 /
       Prize 1 : 1234 , SHIO : Monyet / ... / Salam JP") */
    var tgl = state.tanggal;
    h.push('<div class="hs-resbox">');
    h.push('<div class="hs-reshead"><span>Hasil Pengeluaran ' + esc(it.nama) + '</span><span class="hs-restag">' + meta.label + '</span></div>');
    h.push('<div class="hs-resday"><span>Hari ' + fmtDateShort(tgl) + '</span><span>' + esc(it.nama) + '</span></div>');
    var shown = 0;
    var sd = ShioSnapshot();
    cd.items.forEach(function (x) {
      shown++;
      var shio = shown === 1 ? shioOfVal(x.val, sd) : '';
      h.push('<div class="hs-resrow"><span>Prize ' + esc(x.n) + ' :</span><b>' + esc(x.val) + (shio ? '<span class="hs-resshio"> , SHIO : ' + esc(shio) + '</span>' : '') + '</b></div>');
    });
    if (!shown) h.push('<div class="hs-resrow"><span>Prize :</span><b>-</b></div>');
    h.push('<div class="hs-resfoot"><span>Selamat Kepada Pemenang, Salam JP</span><span>' + (hoki ? 'SETIAP 1 JAM' : (esc(hmOnly(it.result)) || '&mdash;')) + '</span></div>');
    h.push('</div>');

    if (lastBy) h.push('<div class="hs-cfoot">Terakhir disimpan oleh <b>' + lastBy + '</b></div>');
    h.push('</article>');
    return h.join('');
  }

  /* snapshot urutan shio aktif utk render cepat */
  function ShioSnapshot() {
    return (window.ShioData && window.ShioData.order) ? window.ShioData.order() : [];
  }

  function shioOfVal(val, ord) {
    if (!window.ShioData || !val) return '';
    var s = String(val).replace(/\D/g, '');
    if (!s) return '';
    var last2 = s.length >= 2 ? s.slice(-2) : ('0' + s).slice(-2);
    var idx = window.ShioData.indexOfNumber(last2);
    if (idx < 0 || !ord || !ord.length) return '';
    return ord[idx] || '';
  }

  function toggleDrop() { state.dropOpen = !state.dropOpen; paintDrop(); }

  function pickDrop(id) {
    state.sel = id || '';
    state.dropOpen = false;
    paintBody();
  }

  function cyclePrize(id) {
    var it = byId(id);
    if (!it) return;
    var v = container();
    var wrap = v.querySelector('[data-card="' + cssEsc(String(it.id)) + '"]');
    var btn = wrap ? wrap.querySelector('[data-action="prize"]') : null;
    /* baca prize AKTIF dari tombol (bukan state DB) agar cycle 1->2->3->1 konsisten */
    var cur = btn ? (parseInt(btn.textContent.replace(/\D/g, ''), 10) || 1) : 1;
    var next = cur >= 3 ? 1 : cur + 1;
    if (btn) btn.innerHTML = '&times;' + next + ' Prize';
    if (wrap) {
      var rows = wrap.querySelectorAll('[data-rin]');
      for (var i = 0; i < rows.length; i++) {
        var n = parseInt(rows[i].getAttribute('data-rin'), 10);
        if (n <= next) rows[i].classList.remove('hide');
        else rows[i].classList.add('hide');
      }
      var lab = wrap.querySelector('[data-prize-label]');
      if (lab) lab.textContent = next + ' Prize';
    }
    /* simpan prize langsung bila row sudah ada di DB (dgn items terkini) */
    var row = state.hasilById[String(it.id)];
    if (row && row.id != null && state.hasilSource === 'db') {
      fetch('/api/hasil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token() },
        body: JSON.stringify({ pasaran_id: it.id, pasaran_nama: it.nama, tanggal: state.tanggal, prize: next, items: readCardInputs(it.id, next) })
      });
    }
  }

  function cssEsc(s) {
    return (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/["\\\]]/g, '\\$&');
  }

  function byId(id) {
    for (var i = 0; i < state.items.length; i++) if (String(state.items[i].id) === String(id)) return state.items[i];
    return null;
  }

  function readCardInputs(id, prize) {
    var v = container();
    var wrap = v && v.querySelector('[data-card="' + cssEsc(String(id)) + '"]');
    var items = [];
    for (var n = 1; n <= 3; n++) {
      var inp = wrap && wrap.querySelector('[data-rinin="' + cssEsc(String(id) + '-' + n) + '"]');
      if (!inp) continue;
      var val = String(inp.value || '').replace(/\D/g, '').slice(0, 4);
      if (val) items.push({ n: n, val: val });
    }
    return items;
  }

  function saveCard(id) {
    if (state.saving) return;
    var it = byId(id);
    if (!it) return;
    var v = container();
    var wrap = v.querySelector('[data-card="' + cssEsc(String(id)) + '"]');
    var prizeBtn = wrap ? wrap.querySelector('[data-action="prize"]') : null;
    var prize = prizeBtn ? (parseInt(prizeBtn.textContent.replace(/\D/g, ''), 10) || 1) : 1;
    var items = readCardInputs(id, prize);
    var digitOk = items.every(function (x) { return x.val.length >= 2; });
    if (items.length && !digitOk) { toast('Nomor result minimal 2 digit', 'warning'); return; }

    if (state.hasilSource === 'local' || state.source === 'local') {
      var store = localHasilAll();
      var arr = store[state.tanggal] || [];
      var row = null;
      arr.forEach(function (r) { if (String(r.pasaran_id) === String(id)) row = r; });
      if (items.length) {
        if (row) { row.items = items; row.prize = prize; row.updated_by = 'lokal'; row.updated_at = Date.now(); }
        else arr.push({ id: 'l' + Date.now().toString(36), pasaran_id: it.id, pasaran_nama: it.nama, tanggal: state.tanggal, prize: prize, items: items, updated_by: 'lokal', updated_at: Date.now() });
      } else {
        arr = arr.filter(function (r) { return String(r.pasaran_id) !== String(id); });
      }
      store[state.tanggal] = arr;
      saveLocalHasil(store);
      return fetchHasil().then(function () { paintBody(); toast(items.length ? 'Result "' + it.nama + '" tersimpan (lokal)' : 'Result "' + it.nama + '" dibersihkan', 'success'); });
    }

    state.saving = true;
    fetch('/api/hasil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token() },
      body: JSON.stringify({ pasaran_id: it.id, pasaran_nama: it.nama, tanggal: state.tanggal, prize: prize, items: items })
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        state.saving = false;
        if (!res.ok || !res.j.success) throw new Error(res.j.error || 'Gagal menyimpan');
        return fetchHasil().then(function () {
          paintBody();
          toast(res.j.message || 'Result tersimpan', 'success');
        });
      })
      .catch(function (e) {
        state.saving = false;
        toast(e.message || 'Gagal menyimpan result', 'error');
      });
  }

  function clearCard(id, btn) {
    var it = byId(id);
    if (!it) return;
    var key = String(id);
    if (state.armClear !== key) {
      state.armClear = key;
      if (btn) { btn.classList.add('arm'); btn.textContent = 'Yakin? Hapus Result'; }
      setTimeout(function () {
        if (state.armClear === key) {
          state.armClear = null;
          var b = container().querySelector('[data-card="' + cssEsc(key) + '"] [data-action="clear"]');
          if (b) { b.classList.remove('arm'); b.textContent = 'Clear Result'; }
        }
      }, 3000);
      return;
    }
    state.armClear = null;
    var row = state.hasilById[key];
    if (state.hasilSource === 'local' || state.source === 'local' || !row || row.id == null) {
      var store = localHasilAll();
      store[state.tanggal] = (store[state.tanggal] || []).filter(function (r) { return String(r.pasaran_id) !== key; });
      saveLocalHasil(store);
      return fetchHasil().then(function () { paintBody(); toast('Result "' + it.nama + '" dihapus', 'success'); });
    }
    fetch('/api/hasil?id=' + encodeURIComponent(row.id), { method: 'DELETE', headers: { 'x-auth-token': token() } })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j.success) throw new Error(j.error || 'Gagal menghapus');
        return fetchHasil().then(function () { paintBody(); toast('Result "' + it.nama + '" dihapus', 'success'); });
      })
      .catch(function (e) { toast(e.message || 'Gagal menghapus result', 'error'); });
  }

  /* ============================================================
     FORMAT COPY — persis format user
     ============================================================ */
  function buildCopy(it) {
    var cd = cardItemsOf(it);
    var ord = ShioSnapshot();
    var lines = [];
    lines.push('Hasil Pengeluaran ' + String(it.nama || '').toUpperCase());
    lines.push('Hari ' + fmtDateShort(state.tanggal));
    var firstDone = false;
    cd.items.forEach(function (x) {
      var shio = '';
      if (!firstDone) { shio = shioOfVal(x.val, ord); firstDone = true; }
      lines.push('Prize ' + x.n + ' : ' + x.val + (shio ? ' , SHIO : ' + shio : ''));
    });
    if (!cd.items.length) lines.push('Prize : -');
    lines.push('Selamat Kepada Pemenang, Salam JP');
    return lines.join('\n');
  }

  function copyCard(id) {
    var it = byId(id);
    if (!it) return;
    var txt = buildCopy(it);
    function fallbackCopy() {
      try {
        var ta = document.createElement('textarea');
        ta.value = txt;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        toast('Format hasil "' + it.nama + '" tersalin', 'success');
      } catch (e) { toast('Gagal menyalin', 'error'); }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(function () {
        toast('Format hasil "' + it.nama + '" tersalin', 'success');
      }).catch(fallbackCopy);
    } else fallbackCopy();
  }

  /* ============================================================
     TAB SHIO — tabel + update via gambar (OCR) + validasi rumus
     ============================================================ */
  function paintShioInto(body) {
    var sd = window.ShioData && window.ShioData.state ? window.ShioData.state : null;
    var ord = ShioSnapshot();
    var h = [];

    /* v1.2 FIX "tabel shio tidak dapat membaca": bila engine shio belum
       ada (window.ShioData undefined — penyebab error lama "Cannot read
       properties of undefined (reading 'parseText')" + tabel kosong),
       muat sekarang (auto-load / fallback engine), repaint saat siap. */
    if (!window.ShioData || !ord.length) {
      h.push('<div class="hs-loading"><span class="hs-spin"></span>Menyiapkan modul tabel shio&hellip;</div>');
      body.innerHTML = h.join('');
      ensureShioData().then(function () {
        if (window.ShioData && typeof window.ShioData.load === 'function') return window.ShioData.load();
        return null;
      }).then(function () { if (state.tab === 'shio') paintBody(); });
      return;
    }

    h.push('<div class="hs-shiogrid"><div class="hs-shioleft">');
    h.push('<div class="hs-shiohead"><h3 class="hs-h3">Tabel Shio Aktif</h3>' +
      '<span class="hs-shiosrc">' + (sd ? (sd.source === 'd1' ? 'SQLITE \u2022 D1' : (sd.source === 'local' ? 'MODE LOKAL' : 'TABEL STANDAR')) : 'TABEL STANDAR') + '</span></div>');
    h.push('<p class="hs-shiorumus">Rumus wajib: angka 2D <code>n</code> &rarr; shio ke-<code>((n&minus;1) mod 12) + 1</code>; angka <code>00</code> dihitung angka ke-100. Contoh: <b>35 &rarr; (35&minus;1) mod 12 = 10</b> &rarr; shio ke-11 dari urutan.</p>');
    h.push('<div class="hs-tablewrap hs-tablewrap-sm"><table class="hs-table hs-shiotable"><thead><tr><th>No</th><th>Nama Shio</th><th>Nomor Terkait</th></tr></thead><tbody>');
    for (var i = 0; i < ord.length; i++) {
      var nums = window.ShioData ? window.ShioData.numbersFor(i) : [];
      h.push('<tr><td class="hs-tdno">' + pad2(i + 1) + '</td><td class="hs-tdname">' + esc(ord[i]) + '</td><td class="hs-tdnums">' + nums.join(', ') + '</td></tr>');
    }
    h.push('</tbody></table></div>');
    if (sd && sd.updated_by) {
      h.push('<div class="hs-cfoot">Terakhir diubah oleh <b>' + esc(sd.updated_by) + '</b></div>');
    }
    h.push('</div><div class="hs-shioright">');

    /* panel update */
    h.push('<div class="hs-shioupdate">');
    h.push('<h3 class="hs-h3">' + ICON_IMG + ' Update Tabel Shio (Gambar JPG/PNG)</h3>');
    h.push('<p class="hs-shiorumus">Upload foto/scan tabel shio &mdash; sistem membaca teks (OCR), lalu <b>memvalidasi tiap angka dengan rumus</b>. Baris yang angkanya melanggar rumus ditandai SALAH dan wajib diperbaiki sebelum bisa disimpan.</p>');
    h.push('<div class="hs-dropzone" id="hsDropzone" data-action="ocrpick" tabindex="0">' +
      '<input type="file" id="hsOcrFile" accept="image/jpeg,image/png,image/jpg,image/webp" style="display:none;">' +
      (state.shio.ocrBusy
        ? '<div class="hs-ocrbusy"><span class="hs-spin"></span>Membaca gambar&hellip; ' + state.shio.ocrProg + '%</div>'
        : '<b>Klik untuk pilih gambar tabel shio</b><span>JPG / PNG — teks nama shio + nomor terkait</span>') +
      '</div>');

    h.push('<label class="hs-lab">Teks hasil bacaan (bisa diedit / tempel manual)</label>');
    h.push('<textarea class="hs-ocr-text" rows="6" placeholder="Contoh format:\nKuda 01, 13, 25, 37, 49, 61, 73, 85, 97\nUlar 02, 14, 26, 38, 50, 62, 74, 86, 98\n...">' + esc(state.shio.ocrText) + '</textarea>');
    h.push('<div class="hs-btnrow"><button type="button" class="hs-btn hs-btn-primary" data-action="ocrparse">Parse &amp; Validasi</button></div>');
    if (state.shio.err) h.push('<div class="hs-parseerr">' + esc(state.shio.err) + '</div>');

    if (state.shio.rows) {
      var p = state.shio.parsed;
      h.push('<div class="hs-pvmeta' + (p && p.valid ? ' ok' : '') + '">' + (p && p.valid
        ? ICON_CHECK + ' Tabel valid — 12 shio terbaca &amp; semua angka sesuai rumus.'
        : 'Terbaca ' + (p ? p.count : 0) + ' dari 12 shio — perbaiki baris bertanda SALAH di bawah.') + '</div>');
      h.push('<div class="hs-pvgrid">');
      state.shio.rows.forEach(function (r, i) {
        var nums = String(r.numsStr || '').split(/\s*,\s*/).filter(Boolean);
        var bad = [];
        nums.forEach(function (s) {
          if (!/^\d{1,2}$/.test(s)) { bad.push(s); return; }
          var idx = window.ShioData ? window.ShioData.indexOfNumber(s) : -1;
          if (idx !== i) bad.push(s);
        });
        var ok = !bad.length && !!r.name;
        h.push('<div class="hs-pvrow' + (ok ? ' ok' : ' bad') + '">' +
          '<span class="hs-pvidx">' + pad2(i + 1) + '</span>' +
          pvSelect(i, r.name) +
          '<input class="hs-pv-nums" data-pvrow="' + i + '" type="text" value="' + esc(r.numsStr) + '" placeholder="01, 13, 25, ...">' +
          '<span class="hs-pvst" title="' + (ok ? 'Sesuai rumus' : 'Melanggar rumus: ' + esc(bad.join(', '))) + '">' + (ok ? '\u2713' : '\u2717') + '</span>' +
          '</div>');
      });
      h.push('</div>');
      h.push('<div class="hs-btnrow">' +
        '<button type="button" class="hs-btn" data-action="shiofix">Rapikan dari Rumus</button>' +
        '<button type="button" class="hs-btn" data-action="shiostd">Tabel Standar</button>' +
        '<button type="button" class="hs-btn hs-btn-primary" data-action="shiosave">Simpan Shio</button>' +
        '</div>');
      h.push('<p class="hs-shiorumus">Petunjuk: kolom nomor WAJIB mengikuti rumus urutan — shio pada baris ke-N memiliki angka N, N+12, N+24, &hellip; (00 selalu baris ke-4). Tombol <b>Rapikan dari Rumus</b> mengisi nomor otomatis dari urutan nama.</p>');
    }
    h.push('</div>');
    h.push('</div>');

    body.innerHTML = h.join('');
  }

  function pvSelect(i, name) {
    var ord = window.ShioData ? window.ShioData.DEFAULT_ORDER : [];
    var out = '<select class="hs-pv-name" data-pvrow="' + i + '">';
    for (var k = 0; k < ord.length; k++) {
      out += '<option value="' + esc(ord[k]) + '"' + (ord[k] === name ? ' selected' : '') + '>' + esc(ord[k]) + '</option>';
    }
    return out + '</select>';
  }

  function pickOcr() {
    var f = document.getElementById('hsOcrFile');
    if (f) f.click();
  }

  /* v1.1 — Tesseract multi-CDN (jsdelivr -> unpkg) + fallback versi
     Dulu: satu URL jsdelivr; kalau CDN diblokir/lambat, upload "tidak berfungsi". */
  var TESS_CDNS = [
    { js: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js', worker: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js', core: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.0' },
    { js: 'https://unpkg.com/tesseract.js@5.1.1/dist/tesseract.min.js', worker: 'https://unpkg.com/tesseract.js@5.1.1/dist/worker.min.js', core: 'https://unpkg.com/tesseract.js-core@5.1.0' },
    { js: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js', worker: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js', core: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5' }
  ];
  var tessCdnIdx = -1;

  function loadTesseract(idx) {
    if (window.Tesseract && tessCdnIdx >= 0) return Promise.resolve(tessCdnIdx);
    if (idx == null) idx = 0;
    if (idx >= TESS_CDNS.length) {
      return Promise.reject(new Error('Gagal memuat pustaka OCR dari semua CDN — periksa koneksi, atau tempel teks manual di kotak bawah'));
    }
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = TESS_CDNS[idx].js;
      s.onload = function () { tessCdnIdx = idx; res(idx); };
      s.onerror = function () { rej(idx + 1); };
      document.head.appendChild(s);
    }).catch(function (next) { return loadTesseract(next); });
  }

  /* Pra-proses gambar utk akurasi OCR: skala ke sisi-panjang ~1600px,
     grayscale + peregangan kontras (foto HP gelap/kabur jauh lebih terbaca).
     Gagal apa pun -> kembalikan dataURL asli. */
  function prepImage(dataUrl, cb) {
    var img = new Image();
    img.onload = function () {
      try {
        var w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
        if (!w || !h) { cb(dataUrl); return; }
        var long = Math.max(w, h);
        var scale = long < 700 ? (1600 / long) : (long > 2400 ? (1600 / long) : 1);
        var cw = Math.max(1, Math.round(w * scale)), ch = Math.max(1, Math.round(h * scale));
        var c = document.createElement('canvas'); c.width = cw; c.height = ch;
        var ctx = c.getContext('2d');
        if (!ctx) { cb(dataUrl); return; }
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cw, ch);
        ctx.drawImage(img, 0, 0, cw, ch);
        var d = ctx.getImageData(0, 0, cw, ch), px = d.data;
        var n = cw * ch, gray = new Uint8ClampedArray(n), i, r, g, b, v;
        var mn = 255, mx = 0;
        for (i = 0; i < n; i++) {
          r = px[i * 4]; g = px[i * 4 + 1]; b = px[i * 4 + 2];
          v = (r * 299 + g * 587 + b * 114) / 1000;
          gray[i] = v;
          if (v < mn) mn = v; if (v > mx) mx = v;
        }
        var range = Math.max(1, mx - mn);
        for (i = 0; i < n; i++) {
          v = Math.max(0, Math.min(255, (gray[i] - mn) * 255 / range));
          px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = v; px[i * 4 + 3] = 255;
        }
        ctx.putImageData(d, 0, 0);
        cb(c.toDataURL('image/jpeg', 0.92));
      } catch (e) { cb(dataUrl); }
    };
    img.onerror = function () { cb(dataUrl); };
    img.src = dataUrl;
  }

  function runOcr(file) {
    if (!/image\/(jpeg|jpg|png|webp)/.test(file.type || '')) { toast('Format harus JPG/PNG', 'warning'); return; }
    if (state.shio.ocrBusy) return;
    state.shio.ocrBusy = true;
    state.shio.ocrProg = 0;
    state.shio.err = '';
    paintBody();
    var reader = new FileReader();
    reader.onload = function () {
      prepImage(reader.result, function (imgUrl) {
        loadTesseract(0).then(function (cdnIdx) {
          var cdn = TESS_CDNS[cdnIdx] || TESS_CDNS[0];
          var worker = null;
          return window.Tesseract.createWorker('eng', 1, {
            workerPath: cdn.worker,
            corePath: cdn.core,
            logger: function (m) {
              if (m && typeof m.progress === 'number') {
                state.shio.ocrProg = Math.round(m.progress * 100);
                var el = container().querySelector('.hs-ocrbusy');
                if (el) {
                  var stTxt = (m.status === 'recognizing text') ? 'Membaca gambar' : 'Menyiapkan OCR';
                  el.innerHTML = '<span class="hs-spin"></span>' + stTxt + '\u2026 ' + state.shio.ocrProg + '%';
                }
              }
            }
          }).then(function (w) { worker = w; return w.recognize(imgUrl); })
            .then(function (res) {
              try { if (worker) worker.terminate(); } catch (e2) {}
              return res;
            });
        }).then(function (res) {
          state.shio.ocrBusy = false;
          var txt = (res && res.data && res.data.text ? res.data.text : '').trim();
          if (!txt) {
            state.shio.err = 'Teks tidak terbaca dari gambar — coba foto lebih tajam/terang (tegak lurus), atau tempel teks manual di kotak bawah.';
            paintBody();
            toast(state.shio.err, 'warning');
            return;
          }
          /* v1.1 FIX "upload shio tidak berfungsi": dulu parseOcrText()
             membaca DOM textarea yang BELUM dirender ulang (masih kosong)
             sehingga selalu gagal "Teks masih kosong". Sekarang teks OCR
             disimpan ke state dulu, DOM dirender, baru parse dari STATE. */
          state.shio.ocrText = txt;
          paintBody();
          parseOcrText(true);
        }).catch(function (e) {
          state.shio.ocrBusy = false;
          state.shio.err = (e && e.message) ? e.message : 'OCR gagal — coba lagi atau tempel teks manual';
          paintBody();
          toast(state.shio.err, 'error');
        });
      });
    };
    reader.onerror = function () {
      state.shio.ocrBusy = false;
      paintBody();
      toast('Gagal membaca file gambar', 'error');
    };
    reader.readAsDataURL(file);
  }

  function parseOcrText(silent) {
    var v = container();
    var ta = v && v.querySelector('.hs-ocr-text');
    /* v1.1: STATE jadi sumber utama — DOM textarea bisa belum dirender ulang
       setelah OCR selesai (dulu selalu terbaca kosong). Event 'input' tetap
       menyinkronkan edit manual user ke state, jadi aman dua arah. */
    var domText = ta ? ta.value : '';
    var text = (state.shio.ocrText != null && state.shio.ocrText !== '') ? state.shio.ocrText : domText;
    state.shio.ocrText = text;
    if (!String(text).trim()) {
      state.shio.err = 'Teks masih kosong — upload gambar atau tempel teks tabel shio dulu.';
      state.shio.rows = null;
      state.shio.parsed = null;
      paintBody();
      return;
    }
    var p = null;
    if (!window.ShioData || typeof window.ShioData.parseText !== 'function') {
      /* v1.2: engine belum ada -> muat dulu, BARU parse (dulu: crash
         "Cannot read properties of undefined (reading 'parseText')") */
      ensureShioData().then(function () { parseOcrText(silent); });
      return;
    }
    p = window.ShioData.parseText(text);
    state.shio.parsed = p;
    state.shio.rows = p.rows.map(function (r) { return { name: r.name, numsStr: r.nums.join(', ') }; });
    /* pastikan 12 baris (isi kosong bila kurang) */
    var def = window.ShioData.DEFAULT_ORDER;
    while (state.shio.rows.length < 12) {
      state.shio.rows.push({ name: def[state.shio.rows.length], numsStr: '' });
    }
    state.shio.err = '';
    paintBody();
    if (!silent) {
      if (p.valid) toast('Tabel shio terbaca & valid sesuai rumus — silakan Simpan', 'success');
      else toast(p.count + ' dari 12 shio terbaca — perbaiki baris bertanda SALAH', 'warning');
    }
  }

  function syncShioRow(el) {
    var i = parseInt(el.getAttribute('data-pvrow'), 10);
    if (isNaN(i) || !state.shio.rows || !state.shio.rows[i]) return;
    if (el.classList.contains('hs-pv-name')) state.shio.rows[i].name = el.value;
    else state.shio.rows[i].numsStr = el.value;
    repaintShioPreviewOnly();
  }

  /* update ulang hanya tab shio (tanpa kehilangan fokus input) */
  function repaintShioPreviewOnly() {
    var v = container();
    if (!v || state.tab !== 'shio') return;
    var active = document.activeElement;
    var activeKey = active && active.getAttribute ? (active.classList.contains('hs-pv-nums') || active.classList.contains('hs-pv-name') ? active.getAttribute('data-pvrow') : null) : null;
    paintBody();
    if (activeKey != null) {
      var el = v.querySelector('.hs-pv-nums[data-pvrow="' + activeKey + '"]');
      if (el) { el.focus(); try { el.setSelectionRange(el.value.length, el.value.length); } catch (e) {} }
    }
  }

  function fixShioFromFormula() {
    if (!state.shio.rows) return;
    if (!window.ShioData || typeof window.ShioData.numbersFor !== 'function') { ensureShioData().then(fixShioFromFormula); return; }
    state.shio.rows = state.shio.rows.map(function (r, i) {
      return { name: r.name, numsStr: (window.ShioData ? window.ShioData.numbersFor(i) : []).join(', ') };
    });
    repaintShioPreviewOnly();
    toast('Nomor diisi otomatis dari rumus urutan', 'success');
  }

  function useStdShio() {
    if (!window.ShioData) { ensureShioData().then(useStdShio); return; }
    var def = window.ShioData ? window.ShioData.DEFAULT_ORDER : [];
    state.shio.rows = def.map(function (name, i) {
      return { name: name, numsStr: (window.ShioData ? window.ShioData.numbersFor(i) : []).join(', ') };
    });
    state.shio.parsed = { valid: true, count: 12, errors: [] };
    repaintShioPreviewOnly();
  }

  function saveShio() {
    if (!state.shio.rows) return;
    if (!window.ShioData || typeof window.ShioData.validateStructure !== 'function') { ensureShioData().then(saveShio); return; }
    var ord = state.shio.rows.map(function (r) { return r.name; });
    var struct = window.ShioData.validateStructure(ord);
    if (!struct.ok) { toast(struct.error, 'error'); return; }
    for (var i = 0; i < state.shio.rows.length; i++) {
      var nums = String(state.shio.rows[i].numsStr || '').split(/\s*,\s*/).filter(Boolean);
      if (!nums.length) { toast('Baris ke-' + (i + 1) + ' (' + ord[i] + ') belum ada nomornya — klik Rapikan dari Rumus', 'warning'); return; }
      for (var k = 0; k < nums.length; k++) {
        var s = nums[k];
        if (!/^\d{1,2}$/.test(s) || (window.ShioData.indexOfNumber(s) !== i)) {
          toast('Baris ke-' + (i + 1) + ' (' + ord[i] + '): angka ' + s + ' melanggar rumus — tidak boleh asal-asalan', 'error');
          return;
        }
      }
    }
    window.ShioData.saveOrder(ord).then(function (res) {
      if (res.ok) {
        toast('Tabel shio tersimpan & aktif', 'success');
        state.shio.rows = null;
        state.shio.parsed = null;
        paintBody();
      } else {
        toast(res.error || 'Gagal menyimpan shio', 'error');
      }
    });
  }

  /* ============================================================
     TICK REALTIME — jam + countdown + auto-repaint per 30 detik
     ============================================================ */
  function tick() {
    var v = container();
    if (!v || container().offsetParent === null) return;
    var now = wibNow();
    var clockbar = q('[data-hs="clockbar"]', v);
    if (clockbar) clockbar.textContent = 'Waktu sekarang (WIB) \u2014 ' + DAY_TITLE[now.day] + ', ' + now.d + ' ' + MON_SHORT[now.mo] + ' ' + now.y + ' \u2022 ' + fmtClock(now);
    var nowCells = v.querySelectorAll('[data-hs-now]');
    for (var i = 0; i < nowCells.length; i++) nowCells[i].textContent = fmtClock(now);
    var cds = v.querySelectorAll('[data-cd-ms]');
    for (var j = 0; j < cds.length; j++) {
      var at = parseInt(cds[j].getAttribute('data-cd-ms'), 10);
      cds[j].textContent = fmtCountdown(at - now.ms);
    }
    if (now.s !== lastPaintSec && now.s % 30 === 0 && (state.tab === 'status')) {
      lastPaintSec = now.s;
      paintBody();
    }
    lastPaintSec = now.s;
  }

  /* ============================================================
     EXPOSE
     ============================================================ */
  window.HasilPro = {
    render: function () {
      build();
      if (!state.tanggal) state.tanggal = todayWIB();
      /* v1.2: pastikan engine shio siap SEBELUM dipakai (auto-load /
         fallback) — akar perbaikan "tabel shio tidak dapat membaca" */
      ensureShioData().then(function () {
        if (window.ShioData && typeof window.ShioData.load === 'function' && !window.ShioData.state.loaded) return window.ShioData.load();
        return null;
      });
      if (!state.loaded && !state.loading) { state._enterAnim = true; refreshAll(false); }
      else paintAll(true);
      if (!tickTimer) tickTimer = setInterval(tick, 1000);
      tick();
    },
    refresh: function () { refreshAll(true); },
    setTab: setTab,
    state: state,
    buildCopy: buildCopy,
    ensureShioData: ensureShioData,
    parseShioText: function (t) { return ensureShioData().then(function () { return window.ShioData.parseText(t); }); }
  };
})();
