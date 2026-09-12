/* ============================================================
   AURA.OS // PKPASARAN-PRO.JS v1.0.0
   Modul Pk Jadwal Pasaran (Pro) — kontrol & status realtime.
   Fitur:
   - Status tiap pasaran berdasar jam WIB saat ini:
     BUKA (sebelum tutup) / TUTUP (tutup s.d. result) /
     RESULT (sudah keluar) / LIBUR (hari tutup mingguan).
   - HOKI DRAW result 24x: otomatis digenerate 24 sesi/hari
     (tutup HH:00, result HH:10) — copy memakai format:
       "Pasaran HOKI DRAW\t\nJam Tutup :\t00:00 WIB\n..."
   - Copy pasaran (per kartu) & Copy All (list terfilter),
     dipindah dari modul Jadwal Pasaran.
   - Chip negara asal pasaran.
   - Control panel: jam WIB live, filter status + search +
     statistik, refresh.
   - Panel Hasil Resmi: SGP 4D & Toto + Magnum 4D Classic,
     diambil server-side dari situs resmi via
     /api/pasaran/results/{sg4d,sgtoto,magnum}.
   Data sumber: GET /api/pasaran (SQLite D1, fallback lokal).
   UI dirender penuh ke #pkPasaranView. Exposed: window.PkPasaran.
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     STATE & KONSTANTA
     ============================================================ */
  var LKEY = 'aura_pasaran_local_v1'; // sama dengan pasaran-pro.js (sumber data sama)
  var HOKI_RESULT_OFFSET = 10;        // jam result = jam tutup + 10 menit (contoh user: 00:00 -> 00:10)

  var ICON_COPY =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  var ICON_SEARCH =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
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

  /* Negara asal pasaran — urutan penting (kata kunci spesifik dulu) */
  var COUNTRIES = [
    ['TOTOMACAU', '\u{1F1F2}\u{1F1F4}', 'Macau'],
    ['MAGNUM4D', '\u{1F1F2}\u{1F1FE}', 'Malaysia'],
    ['TOTOMALI', '\u{1F1F2}\u{1F1FE}', 'Malaysia'],
    ['SINGAPORE', '\u{1F1F8}\u{1F1EC}', 'Singapura'],
    ['KING KONG', '\u{1F1ED}\u{1F1F0}', 'Hong Kong'],
    ['HOKI', '\u{1F1ED}\u{1F1F0}', 'Hong Kong'],
    ['HONGKONG', '\u{1F1ED}\u{1F1F0}', 'Hong Kong'],
    ['KENTUCKY', '\u{1F1FA}\u{1F1F8}', 'Amerika'],
    ['FLORIDA', '\u{1F1FA}\u{1F1F8}', 'Amerika'],
    ['NEW YORK', '\u{1F1FA}\u{1F1F8}', 'Amerika'],
    ['NEWYORKEVE', '\u{1F1FA}\u{1F1F8}', 'Amerika'],
    ['OREGON', '\u{1F1FA}\u{1F1F8}', 'Amerika'],
    ['CALIFORNIA', '\u{1F1FA}\u{1F1F8}', 'Amerika'],
    ['CAROLINA', '\u{1F1FA}\u{1F1F8}', 'Amerika'],
    ['NEVADA', '\u{1F1FA}\u{1F1F8}', 'Amerika'],
    ['HUAHIN', '\u{1F1F9}\u{1F1ED}', 'Thailand'],
    ['BANGKOK', '\u{1F1F9}\u{1F1ED}', 'Thailand'],
    ['BRUNEI', '\u{1F1E7}\u{1F1F3}', 'Brunei'],
    ['TOTOCAMBODIA', '\u{1F1F0}\u{1F1ED}', 'Kamboja'],
    ['POIPET', '\u{1F1F0}\u{1F1ED}', 'Kamboja'],
    ['CHELSEA', '\u{1F1EC}\u{1F1E7}', 'Inggris'],
    ['BULLSEYE', '\u{1F1F3}\u{1F1FF}', 'Selandia Baru'],
    ['SYDNEY', '\u{1F1E6}\u{1F1FA}', 'Australia'],
    ['JAKARTA', '\u{1F1EE}\u{1F1E9}', 'Indonesia'],
    ['PCSO', '\u{1F1F5}\u{1F1ED}', 'Filipina']
  ];
  var FLAG_DEFAULT = ['\u{1F30D}', 'Internasional'];

  var DAY_NAMES = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
  var DAY_SHORT = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  var ST_META = {
    buka:   { cls: 'pk-st-buka-b',   label: 'BUKA' },
    tutup:  { cls: 'pk-st-tutup-b',  label: 'TUTUP' },
    result: { cls: 'pk-st-result-b', label: 'RESULT' },
    libur:  { cls: 'pk-st-libur-b',  label: 'LIBUR' },
    khusus: { cls: 'pk-st-libur-b',  label: 'KHUSUS' }
  };

  var state = {
    items: [],
    filter: 'all',        // all | buka | tutup | result
    source: null,
    loading: false,
    loaded: false,
    lastList: [],         // hasil deriveList() terakhir (untuk copy per kartu)
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

  /* Nilai jam utk COPY — contoh user: "00:00 WIB" (tanpa detik).
     Teks non-jam (mis. "Selasa & Jumat TUTUP") dikeluarkan apa adanya. */
  function copyTime(s) {
    var m = String(s == null ? '' : s).match(/\b(\d{1,2}):(\d{2})(?::\d{2})?\s*WIB\b/i);
    if (!m) return String(s == null ? '' : s).trim() || '-';
    return pad2(parseInt(m[1], 10)) + ':' + m[2] + ' WIB';
  }

  function countryOf(nama) {
    var n = String(nama || '').toUpperCase();
    for (var i = 0; i < COUNTRIES.length; i++) {
      if (n.indexOf(COUNTRIES[i][0]) !== -1) return { flag: COUNTRIES[i][1], name: COUNTRIES[i][2] };
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

  /* Ekspansi list: 1 baris D1 -> kartu-kartu view (HOKI DRAW = 24 sesi) */
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

  /* Nama ternormalisasi utk pencarian tanpa spasi:
     "hokidraw" cocok dgn "HOKI DRAW", "totomacau" dgn "TOTOMACAU SIANG" */
  function normKey(s) {
    return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  function visibleItems() {
    var term = normKey(searchTerm());
    var f = state.filter;
    return state.lastList.filter(function (it) {
      if (f === 'tutup') { if (it.st !== 'tutup' && it.st !== 'libur') return false; }
      else if (f !== 'all' && it.st !== f) return false;
      if (term && normKey(it.nama).indexOf(term) === -1) return false;
      return true;
    });
  }

  function searchTerm() {
    var v = container();
    var s = v && q('[data-pk="search"]', v);
    return s ? s.value.trim() : '';
  }

  /* ============================================================
     FORMAT COPY (dipindah dari Jadwal Pasaran — contoh user)
     "Pasaran HOKI DRAW\t
      Jam Tutup :\t00:00 WIB
      Jam Result :\t00:10 WIB
      Link :\thttps://hokidraw.com/"
     ============================================================ */
  function buildCopy(it) {
    return 'Pasaran ' + (it.nama || '') + '\t\n' +
      'Jam Tutup :\t' + copyTime(it.tutup) + '\n' +
      'Jam Result :\t' + copyTime(it.result) + '\n' +
      'Link :\t' + (it.link || '-');
  }

  function buildCopyAll() {
    var vis = visibleItems();
    return vis.map(buildCopy).join('\n\n');
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
    var card = container().querySelector('[data-keycard="' + key + '"]');
    if (card) {
      card.classList.remove('pk-new');
      void card.offsetWidth;
      card.classList.add('pk-new');
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
    paintList('<span class="pk-spin"></span>Memuat data pasaran dari database&hellip;');
    fetch('/api/pasaran', { headers: { 'x-auth-token': token() } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) {
        state.loading = false;
        if (j && j.success && Array.isArray(j.pasaran)) {
          state.items = j.pasaran;
          state.source = 'db';
          state.loaded = true;
          paint();
          if (state.resLoaded) paintResCard('magnum'); // chip jadwal magnum butuh data pasaran
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
        paint();
        if (state.resLoaded) paintResCard('magnum');
        if (force) toast('Database tidak terjangkau — mode lokal', 'warning');
      });
  }

  /* ============================================================
     HASIL RESMI (SGP 4D / Toto, Magnum)
     ============================================================ */
  function loadRes(kind, force) {
    var r = state.res[kind];
    if (r.st === 'loading') return;
    r.st = 'loading'; r.err = '';
    paintResCard(kind);
    fetch('/api/pasaran/results/' + kind + (force ? '?fresh=1' : ''), { headers: { 'x-auth-token': token() } })
      .then(function (res) { return res.json().then(function (j) { return { ok: res.ok, j: j }; }); })
      .then(function (out) {
        if (out.ok && out.j && out.j.success && out.j.data) {
          r.st = 'ok'; r.data = out.j.data; r.err = '';
        } else {
          r.st = 'err'; r.data = null; r.err = (out.j && out.j.error) || 'Gagal memuat hasil';
        }
        paintResCard(kind);
      })
      .catch(function (e) {
        r.st = 'err'; r.data = null; r.err = e.message || 'Gagal memuat hasil';
        paintResCard(kind);
      });
  }

  function loadAllRes(force) {
    if (state.resLoaded && !force) return;
    state.resLoaded = true;
    loadRes('sg4d', force);
    loadRes('sgtoto', force);
    loadRes('magnum', force);
  }

  function numGrid(arr, cls) {
    if (!arr || !arr.length) return '<div class="pk-res-empty">Belum ada data</div>';
    return '<div class="pk-subnums-g">' + arr.map(function (n) {
      return '<span class="pk-subnum">' + esc(n) + '</span>';
    }).join('') + '</div>';
  }

  function resMeta(data) {
    return '<div class="pk-res-meta">' +
      '<span class="pk-res-drawno">DRAW #' + esc(data.drawNo || '?') + '</span>' +
      '<span>' + esc(data.date || '') + '</span>' +
      '</div>';
  }

  function paintResCard(kind) {
    var v = container();
    if (!v) return;
    var card = q('[data-res="' + kind + '"]', v);
    if (!card) return;
    var body = q('[data-res-body]', card);
    var r = state.res[kind];
    var btn = q('[data-res-refresh]', card);
    if (btn) btn.classList[r.st === 'loading' ? 'add' : 'remove']('spin');

    var info = {
      sg4d:   { logo: '\u{1F1F8}\u{1F1EC}', name: 'SGP — 4D' },
      sgtoto: { logo: '\u{1F1F8}\u{1F1EC}', name: 'SGP — Toto' },
      magnum: { logo: '\u{1F1F2}\u{1F1FE}', name: 'Magnum 4D Classic' }
    }[kind];

    var head =
      '<div class="pk-res-card-top">' +
        '<div class="pk-res-site"><span class="pk-res-logo">' + info.logo + '</span><span class="pk-res-name">' + info.name + '</span></div>' +
        '<button type="button" class="pk-res-refresh" data-action="resrefresh" data-res="' + kind + '" title="Muat ulang hasil">' + ICON_REFRESH + '</button>' +
      '</div>';

    if (r.st === 'loading') {
      body.innerHTML = head + '<div class="pk-res-loading"><span class="pk-spin"></span>Mengambil hasil dari situs resmi&hellip;</div>';
      return;
    }
    if (r.st === 'err' || !r.data) {
      body.innerHTML = head +
        '<div class="pk-res-error">' + esc(r.err || 'Hasil belum tersedia.') +
        '<br><button type="button" class="pk-btn" data-action="resrefresh" data-res="' + kind + '">' + ICON_REFRESH + 'Coba Lagi</button></div>';
      return;
    }

    var d = r.data;
    var html = head + resMeta(d);

    if (kind === 'sg4d') {
      html +=
        '<div class="pk-prizes">' +
          '<div class="pk-prize"><div class="pk-prize-k pk-pk-1">1st Prize</div><div class="pk-prize-v">' + esc(d.first) + '</div></div>' +
          '<div class="pk-prize"><div class="pk-prize-k">2nd Prize</div><div class="pk-prize-v">' + esc(d.second) + '</div></div>' +
          '<div class="pk-prize"><div class="pk-prize-k">3rd Prize</div><div class="pk-prize-v">' + esc(d.third) + '</div></div>' +
        '</div>' +
        '<div class="pk-subnums"><div class="pk-subnums-k"><span>Starter Prizes</span><span>' + (d.starters || []).length + '</span></div>' + numGrid(d.starters) + '</div>' +
        '<div class="pk-subnums"><div class="pk-subnums-k"><span>Consolation</span><span>' + (d.consolation || []).length + '</span></div>' + numGrid(d.consolation) + '</div>';
    } else if (kind === 'sgtoto') {
      var balls = (d.numbers || []).map(function (n) {
        return '<span class="pk-ball">' + esc(n) + '</span>';
      }).join('<span class="pk-plus-sep"></span>');
      html +=
        '<div class="pk-balls">' + balls +
          '<span class="pk-plus-sep">+</span><span class="pk-ball pk-ball-add">' + esc(d.additional || '-') + '</span>' +
        '</div>' +
        '<div class="pk-jackpot"><span class="pk-jackpot-k">Group 1 Prize</span><span class="pk-jackpot-v">' + esc(d.jackpot || '-') + '</span></div>';
    } else {
      var magRow = null;
      state.items.forEach(function (it) { if (String(it.nama || '').toUpperCase().indexOf('MAGNUM') !== -1 && !magRow) magRow = it; });
      var jadwal = magRow ? (magRow.jadwal || '') : '';
      html += '<div style="margin-bottom:10px;">';
      if (jadwal) {
        html += '<span class="pk-res-cal">' + ICON_CAL + 'Jadwal: ' + esc(jadwal) + '</span>';
      }
      html += '</div>' +
        '<div class="pk-prizes">' +
          '<div class="pk-prize"><div class="pk-prize-k pk-pk-1">1st Prize</div><div class="pk-prize-v">' + esc(d.first || '-') + '</div></div>' +
          '<div class="pk-prize"><div class="pk-prize-k">2nd Prize</div><div class="pk-prize-v">' + esc(d.second || '-') + '</div></div>' +
          '<div class="pk-prize"><div class="pk-prize-k">3rd Prize</div><div class="pk-prize-v">' + esc(d.third || '-') + '</div></div>' +
        '</div>' +
        '<div class="pk-subnums"><div class="pk-subnums-k"><span>Special</span><span>' + (d.special || []).length + '</span></div>' + numGrid(d.special) + '</div>' +
        '<div class="pk-subnums"><div class="pk-subnums-k"><span>Consolation</span><span>' + (d.consolation || []).length + '</span></div>' + numGrid(d.consolation) + '</div>';
    }
    body.innerHTML = html;
  }

  /* ============================================================
     MARKUP (dibangun sekali)
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
              '<p class="pk-sub">Status buka / tutup / result realtime &mdash; copy format pasaran &amp; hasil resmi.</p>' +
            '</div>' +
          '</div>' +
          '<div class="pk-head-btns">' +
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
          '<div class="pk-fchips">' +
            '<button type="button" class="pk-fchip" data-action="filter" data-f="all"><span class="pk-dot"></span>Semua <span class="pk-fc-n" data-pk="fc-all">0</span></button>' +
            '<button type="button" class="pk-fchip" data-action="filter" data-f="buka"><span class="pk-dot"></span>Buka <span class="pk-fc-n" data-pk="fc-buka">0</span></button>' +
            '<button type="button" class="pk-fchip" data-action="filter" data-f="tutup"><span class="pk-dot"></span>Tutup <span class="pk-fc-n" data-pk="fc-tutup">0</span></button>' +
            '<button type="button" class="pk-fchip" data-action="filter" data-f="result"><span class="pk-dot"></span>Result <span class="pk-fc-n" data-pk="fc-result">0</span></button>' +
          '</div>' +
          '<div class="pk-search">' + ICON_SEARCH +
            '<input data-pk="search" type="text" placeholder="Cari pasaran (mis. hokidraw, sydney)&hellip;" autocomplete="off">' +
          '</div>' +
          '<button type="button" class="pk-btn" data-action="refresh" title="Muat ulang data pasaran">' + ICON_REFRESH + 'Refresh</button>' +
        '</div>' +
        '<div data-pk="content"></div>' +
        '<div class="pk-count" data-pk="count"></div>' +
        '<div class="pk-res">' +
          '<div class="pk-res-head">' +
            '<span class="pk-res-title">' + ICON_TROPHY + 'Hasil Resmi Hari Ini</span>' +
            '<span class="pk-res-note">Diambil langsung dari situs resmi Singapore Pools &amp; Magnum 4D (cache 5 menit)</span>' +
          '</div>' +
          '<div class="pk-res-grid">' +
            '<div class="pk-res-card" data-res="sg4d"><div data-res-body></div></div>' +
            '<div class="pk-res-card" data-res="sgtoto"><div data-res-body></div></div>' +
            '<div class="pk-res-card" data-res="magnum"><div data-res-body></div></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    v.dataset.built = '1';

    /* Event delegation sekali */
    v.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('[data-action]') : null;
      if (!t || !v.contains(t)) return;
      var act = t.getAttribute('data-action');
      if (act === 'copy') copyOne(t.getAttribute('data-key'));
      else if (act === 'copyall') copyAll();
      else if (act === 'filter') { state.filter = t.getAttribute('data-f') || 'all'; paint(); }
      else if (act === 'refresh') fetchList(true);
      else if (act === 'resrefresh') loadRes(t.getAttribute('data-res'), true);
    });

    var search = q('[data-pk="search"]', v);
    if (search) search.addEventListener('input', function () { paint(); });
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
        ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][now.date.getMonth()] +
        ' ' + now.date.getFullYear());
    }
    if (now.mi !== lastMinute) {
      lastMinute = now.mi;
      if (state.loaded) paint(); // status kartu ikut berganti begitu menit berubah
    }
  }

  /* ============================================================
     PAINT
     ============================================================ */
  function paintList(html) {
    var v = container();
    if (!v) return;
    var c = q('[data-pk="content"]', v);
    if (c) c.innerHTML = html;
  }

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

    var elCnt = q('[data-pk="count"]', v);
    if (elCnt) {
      var term = searchTerm();
      elCnt.innerHTML = term
        ? 'Hasil pencarian "<b>' + esc(term) + '</b>": <b>' + vis.length + '</b> entri'
        : 'Menampilkan <b>' + vis.length + '</b> dari <b>' + total + '</b> entri pasaran';
    }

    if (!state.loaded && state.loading) return; // paintList sedang menampilkan loading

    if (!state.items.length) {
      paintList('<div class="pk-empty">' +
        (state.source === 'local'
          ? 'Database tidak terjangkau dan belum ada data lokal.<br>Buka <b>Jadwal All Pasaran</b> lalu <b>Tambah Pasaran</b>, atau klik <b>Refresh</b> setelah backend aktif.'
          : 'Belum ada pasaran &mdash; tambahkan lewat menu <b>Jadwal All Pasaran</b>.') +
        '</div>');
      return;
    }
    if (!vis.length) {
      paintList('<div class="pk-empty">Tidak ada pasaran yang cocok dengan filter/pencarian saat ini.</div>');
      return;
    }

    paintList('<div class="pk-grid">' + vis.map(function (it) {
      var meta = ST_META[it.st] || ST_META.khusus;
      var slotChip = it.hoki ? '<span class="pk-slot">SESI ' + it.slot + '</span>' : '';
      var note = it.note ? '<span class="pk-slot" title="' + esc(it.note) + '">' + esc(it.note) + '</span>' : '';
      return '<article class="pk-item pk-st-' + it.st + '" data-keycard="' + esc(it.key) + '">' +
        '<div class="pk-item-top">' +
          '<span class="pk-num">' + esc(it.no) + '</span>' +
          '<h3 class="pk-name" title="' + esc(it.nama) + '">' + esc(it.nama) + '</h3>' +
          '<button type="button" class="pk-copy" data-action="copy" data-key="' + esc(it.key) + '" title="Copy format pasaran">' + ICON_COPY + '</button>' +
        '</div>' +
        '<div class="pk-item-meta">' +
          '<span class="pk-flag"><span class="pk-flag-ic">' + it.flag + '</span>' + esc(it.country) + '</span>' +
          '<span class="pk-st ' + meta.cls + '"><span class="pk-st-dot"></span>' + meta.label + '</span>' +
        '</div>' +
        '<div class="pk-rows">' +
          '<div class="pk-row"><span class="pk-k">Jadwal</span><span class="pk-v">' + (esc(it.jadwal) || '&mdash;') + '</span></div>' +
          '<div class="pk-row pk-row-hl"><span class="pk-k">Tutup</span><span class="pk-v">' + (esc(copyTime(it.tutup)) || '&mdash;') + '</span></div>' +
          '<div class="pk-row"><span class="pk-k">Result</span><span class="pk-v">' + (esc(copyTime(it.result)) || '&mdash;') + '</span></div>' +
        '</div>' +
        '<div class="pk-item-foot">' +
          '<a class="pk-visit" href="' + esc(it.link || '#') + '" target="_blank" rel="noopener noreferrer"><span>Kunjungi Website</span>' + ICON_EXT + '</a>' +
          (slotChip || note) +
        '</div>' +
      '</article>';
    }).join('') + '</div>');
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
      else paint();
    },
    refresh: function () { fetchList(true); loadAllRes(true); },
    copyAll: copyAll,
    buildCopy: buildCopy,
    buildCopyAll: buildCopyAll,
    state: state
  };
})();
