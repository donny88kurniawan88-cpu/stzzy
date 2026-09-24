/* ============================================================
   AURA.OS // PKPASARAN-PRO.JS v2.0.0 — NEWS EDITION
   Modul Pk Jadwal Pasaran (Pro) — gaya siaran berita.
   Perubahan v2.0.0 (permintaan user):
   - TANPA card grid data pasaran.
   - TANPA search pasaran — diganti TOGGLE DROPDOWN pilih pasaran.
   - Memilih pasaran -> animasi TABEL berita (hanya pasaran
     terpilih + informasi negara asalnya), gaya news classy.
   - Data negara mengikuti acuan tabel user (53 pasaran).
   - Headline bergaya berita: font serif animasi + ticker.
   - Singapore 4D & Toto: keterangan NEXT DRAW dari situs resmi
     (/api/pasaran/results/sg4d|sgtoto -> field nextDraw).
   Dipertahankan:
   - Status BUKA/TUTUP/RESULT/LIBUR realtime vs jam WIB.
   - HOKI DRAW: 24 sesi otomatis per 1 jam (tutup :50 result :00).
   - Copy pasaran & Copy All (format tab, dipindah dari Jadwal).
   - Control panel: jam WIB live, filter status, refresh, stat.
   Data sumber: GET /api/pasaran (SQLite D1, fallback lokal).
   Exposed: window.PkPasaran.
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     STATE & KONSTANTA
     ============================================================ */
  var LKEY = 'aura_pasaran_local_v1'; // sama dengan pasaran-pro.js (sumber data sama)
  var HOKI_CLOSE_MIN = 50;            // betclosed tiap jam menit-50 (h:50) — jadwal baru user
  var HOKI_RESULT_OFFSET = 10;        // window betclosed -> result = 10 menit (result tepat :00 jam berikutnya)

  var ICON_COPY =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  var ICON_EXT =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>';
  var ICON_REFRESH =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>';
  var ICON_CLOCK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
  var ICON_TROPHY =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>';
  var ICON_CAL =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
  var ICON_GLOBE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
  var ICON_CHEV =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
  var ICON_CHECK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var ICON_SIGNAL =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/></svg>';

  /* ============================================================
     NEGARA ASAL PASARAN — ACUAN TABEL USER (gambar terlampir).
     Urutan penting: keyword spesifik dulu, umum kemudian.
     "KING KONG 4D MALAM" = "-" di acuan (didahulukan sebelum
     "KING KONG" yang acuannya MACAU). "-" = flag netral globe.
     ============================================================ */
  var COUNTRY_REF = [
    ['KINGKONG4DMALAM', '\u{1F30D}', '-'],                 // acuan: -
    ['KINGKONG4DSORE', '\u{1F1F2}\u{1F1F4}', 'Macau'],     // acuan: MACAU (kingkong pools sore)
    ['KINGKONG', '\u{1F1F2}\u{1F1F4}', 'Macau'],
    ['HOKI', '\u{1F30D}', '-'],                            // acuan: -
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

  var ST_META = {
    buka:   { label: 'BUKA',   cls: 'pk-st-buka'   },
    tutup:  { label: 'TUTUP',  cls: 'pk-st-tutup'  },
    result: { label: 'RESULT', cls: 'pk-st-result' },
    libur:  { label: 'LIBUR',  cls: 'pk-st-libur'  },
    khusus: { label: 'KHUSUS', cls: 'pk-st-libur'  }
  };

  var state = {
    items: [],
    source: null,          // 'db' | 'local'
    loading: false,
    loaded: false,
    sel: '',               // key pasaran terpilih di dropdown
    selLocked: false,      // true = user sudah memilih manual (jangan auto-ganti)
    filter: 'all',         // all | buka | tutup | result
    lastList: [],          // hasil deriveList()
    animate: true,        // true = tabel animasi masuk (saat ganti pasaran/filter)
    res: {
      sg4d:   { st: 'idle', data: null, err: '' },
      sgtoto: { st: 'idle', data: null, err: '' },
      magnum: { st: 'idle', data: null, err: '' }
    },
    resLoaded: false
  };

  var clockTimer = null;
  var lastMinute = -1;

  /* ============================================================
     HELPERS DASAR
     ============================================================ */
  function q(sel, ctx) { return (ctx || document).querySelector(sel); }
  function container() { return document.getElementById('pkPasaranView'); }

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

  /* Waktu sekarang dalam WIB (UTC+7) */
  function wibNow() {
    var d = new Date();
    var w = new Date(d.getTime() + d.getTimezoneOffset() * 60000 + 7 * 3600000);
    return {
      h: w.getHours(), mi: w.getMinutes(), s: w.getSeconds(),
      m: w.getHours() * 60 + w.getMinutes() + w.getSeconds() / 60,
      day: w.getDay(), date: w
    };
  }

  /* "13:05 WIB" / "13:05:00 WIB" -> menit-dari-tengah-malam, atau null */
  function parseHM(s) {
    var m = String(s == null ? '' : s).match(/\b(\d{1,2}):(\d{2})(?::\d{2})?\s*WIB\b/i);
    if (!m) return null;
    var h = parseInt(m[1], 10), mm = parseInt(m[2], 10);
    if (h > 23 || mm > 59) return null;
    return h * 60 + mm;
  }

  /* Nilai jam utk COPY — contoh user: "00:00 WIB" (tanpa detik) */
  function copyTime(s) {
    var m = String(s == null ? '' : s).match(/\b(\d{1,2}):(\d{2})(?::\d{2})?\s*WIB\b/i);
    if (!m) return String(s == null ? '' : s).trim() || '-';
    return pad2(parseInt(m[1], 10)) + ':' + m[2] + ' WIB';
  }

  function normKey(s) {
    return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  /* Negara pasaran — murni dari acuan tabel user */
  function countryOf(nama) {
    var n = normKey(nama);
    for (var i = 0; i < COUNTRY_REF.length; i++) {
      if (n.indexOf(COUNTRY_REF[i][0]) !== -1) return { flag: COUNTRY_REF[i][1], name: COUNTRY_REF[i][2] };
    }
    return { flag: FLAG_DEFAULT[0], name: FLAG_DEFAULT[1] };
  }

  /* Deteksi hari-tutup mingguan: "Selasa & Jumat TUTUP", "MINGGU TUTUP" */
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

  /* Jadwal draw-hari tanpa kata TUTUP (mis. Magnum: "Rabu, Sabtu & Minggu") */
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

  /* ============================================================
     STATUS PASARAN vs WAKTU WIB SAAT INI
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
    var tu = h * 60 + HOKI_CLOSE_MIN, re = (h + 1) * 60;
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
            tutup: pad2(h) + ':50 WIB',
            result: pad2((h + 1) % 24) + ':00 WIB',
            link: base.link,
            st: hokiSlotStatus(h, now), note: '',
            hoki: true, slot: pad2(h) + ':50',
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

  /* Entri pasaran non-HOKI unik utk dropdown (HOKI = 1 pilihan).
     Mengikuti filter status chips — sama dengan aturan visibleItems. */
  function dropOptions() {
    var now = wibNow();
    var f = state.filter;
    var seen = {};
    var out = [];
    sorted().forEach(function (it) {
      var nama = String(it.nama || '').toUpperCase();
      if (seen[nama]) return;
      seen[nama] = true;
      var ctry = countryOf(nama);
      var hoki = isHokiRow(it);
      var st = hoki ? hokiSlotStatus(now.h, now) : statusOf(it, now).st;
      if (f === 'tutup') { if (st !== 'tutup' && st !== 'libur') return; }
      else if (f !== 'all' && st !== f) return;
      out.push({ key: String(it.id), no: it.no || 0, nama: nama, jadwal: it.jadwal || '', st: st, hoki: hoki, flag: ctry.flag, country: ctry.name });
    });
    return out;
  }

  /* ============================================================
     FILTER STATUS (chips) — dropdown & copy all mengikuti filter
     ============================================================ */
  function visibleItems() {
    var f = state.filter;
    return state.lastList.filter(function (it) {
      if (f === 'tutup') { if (it.st !== 'tutup' && it.st !== 'libur') return false; }
      else if (f !== 'all' && it.st !== f) return false;
      return true;
    });
  }

  function selectedItems() {
    /* baris-baris tabel = pasaran terpilih saja
       (HOKI DRAW = 24 sesi sekaligus; pasaran lain = 1 baris) */
    if (!state.sel) return [];
    var pre = state.sel + '-s';
    var out = [];
    state.lastList.forEach(function (it) {
      if (it.hoki ? it.key.indexOf(pre) === 0 : it.key === state.sel) out.push(it);
    });
    return out;
  }

  /* Auto-pilih: pasaran dgn result terdekat berikutnya (bukan libur).
     Selalu menghitung ulang lastList agar dipanggil kapan pun aman. */
  function ensureSelection() {
    state.lastList = deriveList();
    if (state.selLocked && state.sel) {
      var still = false;
      state.lastList.forEach(function (it) { if (it.key === state.sel) still = true; });
      if (still) return;
      state.selLocked = false;
    }
    if (state.sel) {
      var pre = state.sel + '-s';
      var ok = false;
      state.lastList.forEach(function (it) {
        if (it.key === state.sel || (it.hoki && it.key.indexOf(pre) === 0)) ok = true;
      });
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
    /* kunci dropdown = id dasar pasaran (sesi HOKI: buang akhiran -sXX) */
    if (best) {
      state.sel = best.hoki ? String(best.key).split('-s')[0] : best.key;
    } else {
      state.sel = state.lastList.length ? String(state.lastList[0].no && state.lastList[0].id ? state.lastList[0].id : state.lastList[0].key).split('-s')[0] : '';
    }
  }

  /* ============================================================
     FORMAT COPY (dipindah dari Jadwal Pasaran — contoh user)
     "Pasaran HOKI DRAW\t
      Jam Tutup :\t00:00 WIB
      Jam Result :\t00:10 WIB
      Link :\thttps://hokidraw.com/"
     ============================================================ */
  function buildCopy(it) {
    return 'Pasaran ' + (it.nama || '') + (it.hoki ? ' ' + it.slot : '') + '\t\n' +
      'Jam Tutup :\t' + copyTime(it.tutup) + '\n' +
      'Jam Result :\t' + copyTime(it.result) + '\n' +
      'Link :\t' + (it.link || '-');
  }

  function buildCopyAll() {
    return visibleItems().map(buildCopy).join('\n\n');
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
      } catch (e) { toast('Gagal menyalin ke clipboard', 'error'); }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fail);
    } else fail();
  }

  function copyOne(key) {
    var it = null;
    state.lastList.forEach(function (x) { if (x.key === key) it = x; });
    if (!it) { toast('Pasaran tidak ditemukan', 'warning'); return; }
    copyText(buildCopy(it), '"' + it.nama + (it.hoki ? ' ' + it.slot : '') + '" tersalin');
    var tr = container().querySelector('[data-keyrow="' + key + '"]');
    if (tr) {
      tr.classList.remove('pk-flash');
      void tr.offsetWidth;
      tr.classList.add('pk-flash');
    }
  }

  function copyAll() {
    if (!state.loaded || !state.lastList.length) { toast('Data pasaran belum termuat', 'warning'); return; }
    var vis = visibleItems();
    if (!vis.length) { toast('Tidak ada pasaran pada filter saat ini', 'warning'); return; }
    copyText(buildCopyAll(), vis.length + ' pasaran tersalin');
  }

  /* ============================================================
     DATA — API D1 dulu, gagal -> localStorage (mode lokal)
     ============================================================ */
  function fetchList(force) {
    state.loading = true;
    paintBody('<div class="pk-loading"><span class="pk-spin"></span>Memuat data pasaran dari database&hellip;</div>');
    fetch('/api/pasaran', { headers: { 'x-auth-token': token() } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) {
        state.loading = false;
        if (j && j.success && Array.isArray(j.pasaran)) {
          state.items = j.pasaran;
          state.source = 'db';
          state.loaded = true;
          afterData(force);
        } else throw new Error('bad payload');
      })
      .catch(function () {
        state.loading = false;
        state.source = 'local';
        state.loaded = true;
        try {
          var raw = localStorage.getItem(LKEY);
          var arr = raw ? JSON.parse(raw) : [];
          state.items = Array.isArray(arr) ? arr : [];
        } catch (e) { state.items = []; }
        afterData(force);
        if (force) toast('Database tidak terjangkau — mode lokal', 'warning');
      });
  }

  function afterData(force) {
    state.animate = true; // data baru = animasi masuk
    ensureSelection();
    paint();
    paintSource();
    if (state.resLoaded) paintResBlock('magnum'); // chip jadwal magnum butuh data pasaran
  }

  function paintSource() {
    var v = container();
    if (!v) return;
    var el = q('[data-pk="source"]', v);
    if (!el) return;
    if (state.source === 'db') {
      el.textContent = 'SQLITE\u2022D1';
      el.className = 'pk-src pk-src-db';
    } else if (state.source === 'local') {
      el.textContent = 'MODE LOKAL';
      el.className = 'pk-src pk-src-local';
    } else {
      el.textContent = '\u2026';
      el.className = 'pk-src';
    }
  }

  /* ============================================================
     HASIL RESMI (SGP 4D / Toto + Magnum) — gaya berita
     ============================================================ */
  function loadRes(kind, force) {
    var r = state.res[kind];
    if (r.st === 'loading') return;
    r.st = 'loading'; r.err = '';
    paintResBlock(kind);
    fetch('/api/pasaran/results/' + kind + (force ? '?fresh=1' : ''), { headers: { 'x-auth-token': token() } })
      .then(function (res) { return res.json().then(function (j) { return { ok: res.ok, j: j }; }); })
      .then(function (out) {
        if (out.ok && out.j && out.j.success && out.j.data) {
          r.st = 'ok'; r.data = out.j.data; r.err = '';
        } else {
          r.st = 'err'; r.data = null; r.err = (out.j && out.j.error) || 'Gagal memuat hasil';
        }
        paintResBlock(kind);
      })
      .catch(function (e) {
        r.st = 'err'; r.data = null; r.err = e.message || 'Gagal memuat hasil';
        paintResBlock(kind);
      });
  }

  function loadAllRes(force) {
    if (state.resLoaded && !force) return;
    state.resLoaded = true;
    loadRes('sg4d', force);
    loadRes('sgtoto', force);
    loadRes('magnum', force);
  }

  function numGrid(arr) {
    if (!arr || !arr.length) return '<div class="pk-res-none">Belum ada data</div>';
    return '<div class="pk-numgrid">' + arr.map(function (n, i) {
      return '<span class="pk-numcell" style="--i:' + i + '">' + esc(n) + '</span>';
    }).join('') + '</div>';
  }

  function resHead(kind, flag, name) {
    return '<div class="pk-res-top">' +
      '<div class="pk-res-id"><span class="pk-res-flag">' + flag + '</span>' +
      '<span class="pk-res-name">' + esc(name) + '</span>' +
      '<span class="pk-res-official">' + ICON_SIGNAL + 'RESMI</span></div>' +
      '<button type="button" class="pk-res-refresh" data-action="resrefresh" data-res="' + kind + '" title="Muat ulang hasil">' + ICON_REFRESH + '</button>' +
      '</div>';
  }

  function nextDrawBar(label, value, gold) {
    if (!value) return '';
    return '<div class="pk-next' + (gold ? ' pk-next-gold' : '') + '">' + ICON_CAL +
      '<span class="pk-next-k">' + esc(label) + '</span>' +
      '<span class="pk-next-v">' + esc(value) + '</span></div>';
  }

  function prizeRows(d, keys) {
    /* keys: [['first','1st Prize'],...] — baris tabel hadiah + animasi angka */
    return '<div class="pk-prizetable">' + keys.map(function (k, i) {
      return '<div class="pk-prizerow' + (i === 0 ? ' pk-prizerow-1' : '') + '" style="--i:' + i + '">' +
        '<span class="pk-prize-k">' + esc(k[1]) + '</span>' +
        '<span class="pk-prize-v">' + (esc(d[k[0]]) || '&mdash;') + '</span></div>';
    }).join('') + '</div>';
  }

  function paintResBlock(kind) {
    var v = container();
    if (!v) return;
    var block = q('[data-res="' + kind + '"]', v);
    if (!block) return;
    var body = q('[data-res-body]', block);
    var r = state.res[kind];
    var btn = q('[data-res-refresh]', block);
    if (btn) btn.classList[r.st === 'loading' ? 'add' : 'remove']('spin');

    var info = {
      sg4d:   { flag: '\u{1F1F8}\u{1F1EC}', name: 'SINGAPORE POOLS \u2014 4D' },
      sgtoto: { flag: '\u{1F1F8}\u{1F1EC}', name: 'SINGAPORE POOLS \u2014 TOTO' },
      magnum: { flag: '\u{1F1F2}\u{1F1FE}', name: 'MAGNUM 4D CLASSIC' }
    }[kind];

    if (r.st === 'loading') {
      body.innerHTML = resHead(kind, info.flag, info.name) +
        '<div class="pk-skel"><div class="pk-skrow" style="width:52%"></div><div class="pk-skrow" style="width:78%"></div><div class="pk-skrow" style="width:64%"></div><div class="pk-skrow" style="width:71%"></div></div>' +
        '<div class="pk-res-foot">Mengambil hasil dari situs resmi&hellip;</div>';
      return;
    }
    if (r.st === 'err' || !r.data) {
      body.innerHTML = resHead(kind, info.flag, info.name) +
        '<div class="pk-res-error">' + esc(r.err || 'Hasil belum tersedia.') + '</div>' +
        '<button type="button" class="pk-btn" data-action="resrefresh" data-res="' + kind + '">' + ICON_REFRESH + 'Coba Lagi</button>';
      return;
    }

    var d = r.data;
    var meta = '<div class="pk-res-meta">' +
      '<span class="pk-res-drawno">DRAW #' + esc(d.drawNo || '?') + '</span>' +
      '<span class="pk-res-date">' + esc(d.date || '') + '</span></div>';
    var html = resHead(kind, info.flag, info.name) + meta;

    if (kind === 'sg4d') {
      html += nextDrawBar('NEXT DRAW', d.nextDraw || 'Segera diumumkan situs resmi', true) +
        prizeRows(d, [['first', '1st Prize'], ['second', '2nd Prize'], ['third', '3rd Prize']]) +
        '<div class="pk-res-sect"><div class="pk-res-sect-k"><span>Starter Prizes</span><span>' + (d.starters || []).length + '</span></div>' + numGrid(d.starters) + '</div>' +
        '<div class="pk-res-sect"><div class="pk-res-sect-k"><span>Consolation Prizes</span><span>' + (d.consolation || []).length + '</span></div>' + numGrid(d.consolation) + '</div>';
    } else if (kind === 'sgtoto') {
      var balls = (d.numbers || []).map(function (n, i) {
        return '<span class="pk-ball" style="--i:' + i + '">' + esc(n) + '</span>';
      }).join('<span class="pk-plus-sep"></span>');
      html += nextDrawBar('NEXT DRAW', d.nextDraw || 'Segera diumumkan situs resmi', true) +
        (d.nextJackpot ? nextDrawBar('EST. JACKPOT BERIKUTNYA', d.nextJackpot, false) : '') +
        '<div class="pk-balls">' + balls +
          '<span class="pk-plus-sep">+</span><span class="pk-ball pk-ball-add">' + esc(d.additional || '-') + '</span>' +
        '</div>' +
        '<div class="pk-jackpotbar"><span class="pk-jackpot-k">GROUP 1 PRIZE</span><span class="pk-jackpot-v">' + esc(d.jackpot || '-') + '</span></div>';
    } else {
      var magRow = null;
      state.items.forEach(function (it) { if (String(it.nama || '').toUpperCase().indexOf('MAGNUM') !== -1 && !magRow) magRow = it; });
      var jadwal = magRow ? (magRow.jadwal || '') : '';
      html += (jadwal ? '<div class="pk-res-calwrap"><span class="pk-res-cal">' + ICON_CAL + 'Jadwal: ' + esc(jadwal) + '</span></div>' : '') +
        prizeRows(d, [['first', '1st Prize'], ['second', '2nd Prize'], ['third', '3rd Prize']]) +
        '<div class="pk-res-sect"><div class="pk-res-sect-k"><span>Special Prizes</span><span>' + (d.special || []).length + '</span></div>' + numGrid(d.special) + '</div>' +
        '<div class="pk-res-sect"><div class="pk-res-sect-k"><span>Consolation Prizes</span><span>' + (d.consolation || []).length + '</span></div>' + numGrid(d.consolation) + '</div>';
    }
    html += '<div class="pk-res-foot">Sumber: ' + esc(d.site || '') + ' \u2022 cache 5 menit</div>';
    body.innerHTML = html;
  }

  /* ============================================================
     MARKUP (dibangun sekali) — dropdown, chips, berita, tabel
     ============================================================ */
  function build() {
    var v = container();
    if (!v || v.dataset.built === '1') return;

    v.innerHTML =
      '<div class="pk-card">' +
        '<div class="pk-topline"></div>' +
        '<div class="pk-head">' +
          '<div class="pk-head-left">' +
            '<div class="pk-icon">' + ICON_GLOBE + '</div>' +
            '<div style="min-width:0;">' +
              '<h2 class="pk-title">Pk Jadwal Pasaran</h2>' +
              '<p class="pk-sub">Siaran status pasaran realtime &mdash; pilih pasaran untuk melihat laporan lengkapnya.</p>' +
            '</div>' +
          '</div>' +
          '<div class="pk-head-btns">' +
            '<span class="pk-src" data-pk="source">\u2026</span>' +
            '<span class="pk-clock"><span class="pk-clock-dot"></span><span data-pk="clock">--:--:-- WIB</span></span>' +
            '<button type="button" class="pk-btn pk-btn-primary" data-action="copyall">' + ICON_COPY + 'Copy All Pasaran</button>' +
          '</div>' +
        '</div>' +
        '<div class="pk-stats">' +
          '<div class="pk-stat"><div class="pk-stat-k">Total Sesi</div><div class="pk-stat-v" data-pk="total">0</div><div class="pk-stat-s">termasuk 24 sesi HOKI DRAW</div></div>' +
          '<div class="pk-stat pk-stat-buka"><div class="pk-stat-k">Buka</div><div class="pk-stat-v" data-pk="buka">0</div><div class="pk-stat-s">masih menerima pasang</div></div>' +
          '<div class="pk-stat pk-stat-tutup"><div class="pk-stat-k">Tutup</div><div class="pk-stat-v" data-pk="tutup">0</div><div class="pk-stat-s">menunggu result</div></div>' +
          '<div class="pk-stat pk-stat-result"><div class="pk-stat-k">Result</div><div class="pk-stat-v" data-pk="result">0</div><div class="pk-stat-s">sudah keluar hari ini</div></div>' +
        '</div>' +
        '<div class="pk-toolbar">' +
          '<div class="pk-dd" data-pk="dd">' +
            '<button type="button" class="pk-dd-btn" data-action="ddtoggle" aria-expanded="false">' +
              '<span class="pk-dd-cur" data-pk="ddcur">' + ICON_GLOBE + '<span class="pk-dd-cur-t">Pilih Pasaran&hellip;</span></span>' +
              '<span class="pk-dd-chev">' + ICON_CHEV + '</span>' +
            '</button>' +
            '<div class="pk-dd-panel" data-pk="ddpanel" hidden>' +
              '<div class="pk-dd-list" data-pk="ddlist"></div>' +
            '</div>' +
          '</div>' +
          '<div class="pk-fchips">' +
            '<button type="button" class="pk-fchip" data-action="filter" data-f="all"><span class="pk-dot"></span>Semua <span class="pk-fc-n" data-pk="fc-all">0</span></button>' +
            '<button type="button" class="pk-fchip" data-action="filter" data-f="buka"><span class="pk-dot"></span>Buka <span class="pk-fc-n" data-pk="fc-buka">0</span></button>' +
            '<button type="button" class="pk-fchip" data-action="filter" data-f="tutup"><span class="pk-dot"></span>Tutup <span class="pk-fc-n" data-pk="fc-tutup">0</span></button>' +
            '<button type="button" class="pk-fchip" data-action="filter" data-f="result"><span class="pk-dot"></span>Result <span class="pk-fc-n" data-pk="fc-result">0</span></button>' +
          '</div>' +
          '<button type="button" class="pk-btn" data-action="refresh" title="Muat ulang data pasaran">' + ICON_REFRESH + 'Refresh</button>' +
        '</div>' +
        '<div data-pk="news"></div>' +
        '<div data-pk="body"></div>' +
        '<div class="pk-count" data-pk="count"></div>' +
        '<div class="pk-res">' +
          '<div class="pk-res-head">' +
            '<span class="pk-res-title">' + ICON_TROPHY + 'Hasil Resmi Hari Ini</span>' +
            '<span class="pk-res-note">Langsung dari situs resmi Singapore Pools &amp; Magnum 4D</span>' +
          '</div>' +
          '<div class="pk-res-grid">' +
            '<div class="pk-res-block" data-res="sg4d"><div data-res-body></div></div>' +
            '<div class="pk-res-block" data-res="sgtoto"><div data-res-body></div></div>' +
            '<div class="pk-res-block" data-res="magnum"><div data-res-body></div></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    v.dataset.built = '1';

    /* Event delegation sekali */
    v.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('[data-action]') : null;
      if (!t || !v.contains(t)) return;
      var act = t.getAttribute('data-action');
      if (act === 'ddtoggle') toggleDrop();
      else if (act === 'ddselect') selectPasaran(t.getAttribute('data-key'), true);
      else if (act === 'copy') copyOne(t.getAttribute('data-key'));
      else if (act === 'copyall') copyAll();
      else if (act === 'filter') {
        state.filter = t.getAttribute('data-f') || 'all';
        state.animate = true; // ganti filter = animasi ulang
        ensureSelection();
        paint();
      }
      else if (act === 'refresh') fetchList(true);
      else if (act === 'resrefresh') loadRes(t.getAttribute('data-res'), true);
    });

    /* Klik di luar dropdown & Escape menutup dropdown */
    document.addEventListener('click', function (e) {
      var v2 = container();
      if (!v2) return;
      var dd = q('[data-pk="dd"]', v2);
      if (dd && !dd.contains(e.target)) closeDrop();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrop();
    });
  }

  /* ============================================================
     DROPDOWN PASARAN (toggle — tanpa search)
     ============================================================ */
  function isOpen() {
    var v = container();
    var p = v && q('[data-pk="ddpanel"]', v);
    return !!(p && !p.hidden);
  }

  function toggleDrop() {
    if (isOpen()) closeDrop();
    else openDrop();
  }

  function openDrop() {
    var v = container();
    if (!v) return;
    var p = q('[data-pk="ddpanel"]', v);
    var btn = q('[data-pk="dd"] .pk-dd-btn', v);
    if (!p) return;
    q('[data-pk="ddlist"]', v).innerHTML = dropOptions().map(function (o) {
      var meta = ST_META[o.st] || ST_META.khusus;
      var selCls = o.key === state.sel ? ' pk-dd-opt-sel' : '';
      return '<button type="button" class="pk-dd-opt' + selCls + '" data-action="ddselect" data-key="' + esc(o.key) + '">' +
        '<span class="pk-dd-no">' + esc(o.no) + '</span>' +
        '<span class="pk-dd-flag">' + o.flag + '</span>' +
        '<span class="pk-dd-name" title="' + esc(o.nama) + '">' + esc(o.nama) + '</span>' +
        (o.hoki ? '<span class="pk-dd-24">24 SESI</span>' : '') +
        '<span class="pk-dd-st ' + meta.cls + '"><span class="pk-st-dot"></span>' + meta.label + '</span>' +
        '<span class="pk-dd-check">' + ICON_CHECK + '</span>' +
      '</button>';
    }).join('');
    p.hidden = false;
    if (btn) btn.setAttribute('aria-expanded', 'true');
    /* scroll ke opsi terpilih */
    setTimeout(function () {
      var selEl = q('.pk-dd-opt-sel', p);
      if (selEl && selEl.scrollIntoView) selEl.scrollIntoView({ block: 'center' });
    }, 30);
  }

  function closeDrop() {
    var v = container();
    if (!v) return;
    var p = q('[data-pk="ddpanel"]', v);
    var btn = q('[data-pk="dd"] .pk-dd-btn', v);
    if (p && !p.hidden) {
      p.hidden = true;
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }
  }

  function selectPasaran(key, byUser) {
    if (!key) return;
    state.sel = key;
    if (byUser) state.selLocked = true;
    closeDrop();
    state.animate = true; // pasaran baru = animasi tabel masuk
    paint();
  }

  /* ============================================================
     BANNER BERITA — headline animasi utk pasaran terpilih
     ============================================================ */
  function headlineHTML(nama) {
    /* tiap huruf = span (stagger fadeUp); spasi dipertahankan */
    var out = '';
    for (var i = 0; i < nama.length; i++) {
      var ch = nama.charAt(i);
      out += ch === ' '
        ? '<span class="pk-hl-sp"> </span>'
        : '<span class="pk-hl-ch" style="--i:' + i + '">' + esc(ch) + '</span>';
    }
    return out;
  }

  function paintNews(it) {
    var v = container();
    if (!v) return;
    var n = q('[data-pk="news"]', v);
    if (!n) return;
    if (!it) { n.innerHTML = ''; return; }
    var meta = ST_META[it.st] || ST_META.khusus;
    var now = wibNow();
    var dateline = DAY_SHORT[now.day] + ', ' + now.date.getDate() + ' ' + MONTH_SHORT[now.date.getMonth()] + ' ' + now.date.getFullYear();
    var ticker =
      'PASARAN ' + it.nama + ' \u2022 NEGARA: ' + it.country + ' \u2022 STATUS: ' + meta.label +
      (it.hoki ? ' \u2022 SESI ' + it.slot + ' WIB' : '') +
      ' \u2022 JAM TUTUP: ' + copyTime(it.tutup) + ' \u2022 JAM RESULT: ' + copyTime(it.result) +
      ' \u2022 LINK: ' + (it.link || '-') + ' \u2022 ';
    n.innerHTML =
      '<div class="pk-news pk-news-' + it.st + '">' +
        '<div class="pk-news-top">' +
          '<span class="pk-live"><span class="pk-live-dot"></span>LIVE</span>' +
          '<span class="pk-kicker">LAPORAN PASARAN</span>' +
          '<span class="pk-dateline">' + esc(dateline) + ' \u2014 WIB</span>' +
        '</div>' +
        '<div class="pk-headline-row">' +
          '<span class="pk-news-flag">' + it.flag + '</span>' +
          '<h3 class="pk-headline">' + headlineHTML(it.nama) + '</h3>' +
        '</div>' +
        '<div class="pk-news-meta">' +
          '<span class="pk-ctry"><span class="pk-ctry-k">NEGARA</span><span class="pk-ctry-v">' + it.flag + ' ' + esc(it.country) + '</span></span>' +
          '<span class="pk-st ' + meta.cls + '"><span class="pk-st-dot"></span>' + meta.label + '</span>' +
          (it.hoki ? '<span class="pk-slot">SESI ' + it.slot + ' WIB</span>' : '') +
          (it.note ? '<span class="pk-note">' + esc(it.note) + '</span>' : '') +
        '</div>' +
        '<div class="pk-ticker">' +
          '<span class="pk-ticker-tag">BREAKING</span>' +
          '<div class="pk-ticker-win"><div class="pk-ticker-move"><span>' + esc(ticker) + '</span><span>' + esc(ticker) + '</span></div></div>' +
        '</div>' +
      '</div>';
  }

  /* ============================================================
     TABEL PASARAN TERPILIH — baris animasi masuk
     ============================================================ */
  function tableRowsHTML(rows, animate) {
    var now = wibNow();
    /* sesi HOKI aktif = sesi terakhir yg jam tutupnya sudah lewat */
    var activeHoki = null;
    rows.forEach(function (it) {
      if (it.hoki && parseHM(it.tutup) != null && now.m >= parseHM(it.tutup)) {
        if (activeHoki == null || parseHM(it.tutup) > parseHM(activeHoki.tutup)) activeHoki = it;
      }
    });
    return rows.map(function (it, i) {
      var meta = ST_META[it.st] || ST_META.khusus;
      var isNow = activeHoki && it.key === activeHoki.key;
      var jadwalCell = it.hoki
        ? '<span class="pk-sesichip">SESI ' + it.slot + '</span>'
        : esc(it.jadwal || '\u2014');
      return '<tr class="pk-tr pk-strow-' + it.st + (isNow ? ' pk-tr-now' : '') + (animate ? '' : ' pk-noanim') + '" style="--i:' + i + '" data-keyrow="' + esc(it.key) + '">' +
        '<td class="pk-td-no">' + esc(it.no) + '</td>' +
        '<td class="pk-td-nama"><span class="pk-td-nama-t">' + esc(it.nama) + '</span>' +
          (it.hoki ? '<span class="pk-td-sub">result 24x sehari</span>' : '') + '</td>' +
        '<td class="pk-td-negara"><span class="pk-flagcell"><span class="pk-flagcell-ic">' + it.flag + '</span>' + esc(it.country) + '</span></td>' +
        '<td class="pk-td-jadwal">' + jadwalCell + '</td>' +
        '<td class="pk-td-jam pk-td-tutup">' + esc(copyTime(it.tutup)) + '</td>' +
        '<td class="pk-td-jam pk-td-result">' + esc(copyTime(it.result)) + '</td>' +
        '<td class="pk-td-st"><span class="pk-st ' + meta.cls + '"><span class="pk-st-dot"></span>' + meta.label + '</span></td>' +
        '<td class="pk-td-aksi">' +
          '<a class="pk-actbtn" href="' + esc(it.link || '#') + '" target="_blank" rel="noopener noreferrer" title="Buka website pasaran">' + ICON_EXT + '</a>' +
          '<button type="button" class="pk-actbtn" data-action="copy" data-key="' + esc(it.key) + '" title="Copy format pasaran">' + ICON_COPY + '</button>' +
        '</td>' +
      '</tr>';
    }).join('');
  }

  function paintTable(rows, animate) {
    var v = container();
    if (!v) return;
    var b = q('[data-pk="body"]', v);
    if (!b) return;
    if (!rows.length) {
      b.innerHTML = '<div class="pk-empty">Tidak ada baris untuk ditampilkan pada filter saat ini.</div>';
      return;
    }
    b.innerHTML =
      '<div class="pk-tablewrap">' +
        '<table class="pk-table">' +
          '<thead><tr>' +
            '<th class="pk-th-no">No</th>' +
            '<th>Pasaran</th>' +
            '<th>Negara Asal</th>' +
            '<th>Jadwal</th>' +
            '<th>Jam Tutup</th>' +
            '<th>Jam Result</th>' +
            '<th>Status</th>' +
            '<th class="pk-th-aksi">Aksi</th>' +
          '</tr></thead>' +
          '<tbody>' + tableRowsHTML(rows, animate) + '</tbody>' +
        '</table>' +
      '</div>';
  }

  function paintBody(html) {
    var v = container();
    if (!v) return;
    var b = q('[data-pk="body"]', v);
    if (b) b.innerHTML = html;
  }

  /* ============================================================
     JAM WIB LIVE + repaint per menit (status selalu segar)
     ============================================================ */
  function startClock() {
    if (clockTimer) return;
    clockTimer = setInterval(function () {
      var v = container();
      if (!v || v.style.display === 'none') return;
      tickClock();
    }, 1000);
    tickClock();
  }

  function tickClock() {
    var v = container();
    if (!v) return;
    var now = wibNow();
    var el = q('[data-pk="clock"]', v);
    if (el) {
      el.textContent = pad2(now.h) + ':' + pad2(now.mi) + ':' + pad2(now.s) + ' WIB';
      el.setAttribute('title', DAY_SHORT[now.day] + ', ' + now.date.getDate() + ' ' +
        MONTH_SHORT[now.date.getMonth()] + ' ' + now.date.getFullYear());
    }
    if (now.mi !== lastMinute) {
      lastMinute = now.mi;
      if (state.loaded && !state.selLocked) ensureSelection();
      if (state.loaded) {
        state.animate = false; // repaint menit-an TANPA replay animasi
        paint();
      }
    }
  }

  /* ============================================================
     PAINT UTAMA
     ============================================================ */
  function paint() {
    build();
    var v = container();
    if (!v) return;

    state.lastList = deriveList();
    var total = state.lastList.length;
    var nBuka = 0, nTutup = 0, nResult = 0;
    state.lastList.forEach(function (it) {
      if (it.st === 'buka') nBuka++;
      else if (it.st === 'tutup' || it.st === 'libur' || it.st === 'khusus') nTutup++;
      else nResult++;
    });
    var vis = visibleItems();
    var rows = selectedItems();
    var selItem = rows.length ? rows[0] : null;
    /* banner HOKI DRAW = sesi yang sedang aktif (terakhir tutup) */
    if (selItem && selItem.hoki) {
      var nowB = wibNow(), act = null;
      rows.forEach(function (it) {
        var tu = parseHM(it.tutup);
        if (tu != null && nowB.m >= tu && (act == null || tu > parseHM(act.tutup))) act = it;
      });
      if (act) selItem = act;
    }

    var elT = q('[data-pk="total"]', v); if (elT) elT.textContent = total;
    var elB = q('[data-pk="buka"]', v); if (elB) elB.textContent = nBuka;
    var elC = q('[data-pk="tutup"]', v); if (elC) elC.textContent = nTutup;
    var elR = q('[data-pk="result"]', v); if (elR) elR.textContent = nResult;
    var fcA = q('[data-pk="fc-all"]', v); if (fcA) fcA.textContent = total;
    var fcB = q('[data-pk="fc-buka"]', v); if (fcB) fcB.textContent = nBuka;
    var fcT = q('[data-pk="fc-tutup"]', v); if (fcT) fcT.textContent = nTutup;
    var fcR = q('[data-pk="fc-result"]', v); if (fcR) fcR.textContent = nResult;

    var chips = v.querySelectorAll('.pk-fchip');
    for (var i = 0; i < chips.length; i++) {
      if (chips[i].getAttribute('data-f') === state.filter) chips[i].classList.add('active');
      else chips[i].classList.remove('active');
    }

    /* tombol dropdown: pasaran terpilih */
    var cur = q('[data-pk="ddcur"]', v);
    if (cur) {
      if (selItem) {
        var m0 = ST_META[selItem.st] || ST_META.khusus;
        cur.innerHTML = '<span class="pk-dd-cur-f">' + selItem.flag + '</span>' +
          '<span class="pk-dd-cur-t">' + esc(selItem.nama) + '</span>' +
          '<span class="pk-dd-cur-st ' + m0.cls + '"><span class="pk-st-dot"></span>' + m0.label + '</span>';
      } else {
        cur.innerHTML = ICON_GLOBE + '<span class="pk-dd-cur-t">Pilih Pasaran&hellip;</span>';
      }
    }

    var elCnt = q('[data-pk="count"]', v);
    if (elCnt) {
      elCnt.innerHTML = selItem
        ? 'Menampilkan <b>1</b> pasaran terpilih \u2022 <b>' + rows.length + '</b> baris \u2022 dari <b>' + total + '</b> total sesi'
        : 'Menampilkan <b>0</b> pasaran \u2022 dari <b>' + total + '</b> total sesi';
    }

    if (!state.loaded && state.loading) return; // loading sedang tampil

    if (!state.items.length) {
      paintNews(null);
      paintBody('<div class="pk-empty">' +
        (state.source === 'local'
          ? 'Database tidak terjangkau dan belum ada data lokal.<br>Buka <b>Jadwal All Pasaran</b> lalu <b>Tambah Pasaran</b>, atau klik <b>Refresh</b> setelah backend aktif.'
          : 'Belum ada pasaran &mdash; tambahkan lewat menu <b>Jadwal All Pasaran</b>.') +
        '</div>');
      return;
    }
    if (!rows.length) {
      paintNews(null);
      paintBody('<div class="pk-empty">Pilih pasaran pada dropdown di atas untuk melihat laporannya.</div>');
      return;
    }

    var animate = state.animate;
    state.animate = false;
    paintNews(selItem);
    paintTable(rows, animate);
  }

  /* ============================================================
     EXPOSE
     ============================================================ */
  window.PkPasaran = {
    render: function () {
      build();
      startClock();
      loadAllRes(false);
      if (!state.loaded && !state.loading) fetchList();
      else { ensureSelection(); paint(); }
    },
    refresh: function () { fetchList(true); loadAllRes(true); },
    select: function (key) { selectPasaran(key, true); },
    copyAll: copyAll,
    buildCopy: buildCopy,
    buildCopyAll: buildCopyAll,
    state: state
  };
})();
