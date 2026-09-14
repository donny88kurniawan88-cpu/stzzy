/* ============================================================
   AURA.OS // LINKALT-PRO.JS v1.0.0
   Modul Link Alternatif (Pro) — tabel link terklasifikasi,
   tambah/hapus sederhana, filter kategori, pencarian.
   UI dirender penuh ke #linkAltView. Exposed: window.LinkAltPro.
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     STATE & KONSTANTA
     ============================================================ */
  var KEY = 'aura_link_alt_v1';

  var CATS = [
    { name: 'Link IP Domain',       c: '#38bdf8' },
    { name: 'Link Domain Kepala 3', c: '#a78bfa' },
    { name: 'Link Domain Kepala 8', c: '#e879f9' },
    { name: 'Link AMP',             c: '#34d399' },
    { name: 'Link Native',          c: '#fbbf24' },
    { name: 'Link RTP & Blog',      c: '#fb7185' },
    { name: 'Link DKWL Direct',     c: '#22d3ee' },
    { name: 'Link Jalur Direct',    c: '#60a5fa' },
    { name: 'Domain IT',            c: '#94a3b8' },
    { name: 'Link Fusion X',        c: '#a3e635' }
  ];

  var ICON_PLUS =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
  var ICON_TRASH =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
  var ICON_SEARCH =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
  var ICON_LINK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';

  var state = {
    items: [],
    cat: 'all',
    loaded: false,
    justAdded: null,
    armId: null,
    armTimer: null
  };

  /* ============================================================
     HELPERS
     ============================================================ */
  function q(sel, ctx) { return (ctx || document).querySelector(sel); }
  function container() { return document.getElementById('linkAltView'); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  function catIdx(name) {
    for (var i = 0; i < CATS.length; i++) if (CATS[i].name === name) return i;
    return 0;
  }

  function fmt(ms) {
    var d = new Date(ms);
    var B = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return d.getDate() + ' ' + B[d.getMonth()] + ' ' + d.getFullYear() + ' | ' +
      ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }

  function toast(msg, type) {
    if (typeof window.showToast === 'function') window.showToast(msg, type);
  }

  /* ============================================================
     DATA (localStorage — pola sama dgn keepmemo-pro)
     ============================================================ */
  function load() {
    if (state.loaded) return;
    state.loaded = true;
    try {
      var raw = localStorage.getItem(KEY);
      state.items = raw ? JSON.parse(raw) : null;
    } catch (e) { state.items = null; }
    if (!Array.isArray(state.items)) {
      var now = Date.now();
      state.items = [
        { id: 'lex1', domain: '157.230.38.70',            cat: 'Link IP Domain',       redirect: '',               created: now - 86400000 },
        { id: 'lex2', domain: 'luna86483.com',            cat: 'Link Domain Kepala 8', redirect: '',               created: now - 43200000 },
        { id: 'lex3', domain: 'jalursitus.com/lunatogel', cat: 'Link Jalur Direct',    redirect: 'jalursitus.com', created: now - 3600000 },
        { id: 'lex4', domain: 'mwamodels.com',            cat: 'Link Jalur Direct',    redirect: '',               created: now - 1800000 }
      ];
      persist();
    }
  }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state.items)); } catch (e) {}
  }

  /* ============================================================
     MARKUP (dibangun sekali, lalu partial update)
     ============================================================ */
  function build() {
    var v = container();
    if (!v || v.dataset.built === '1') return;

    var options = CATS.map(function (c) {
      return '<option value="' + esc(c.name) + '">' + esc(c.name) + '</option>';
    }).join('');

    v.innerHTML =
      '<div class="la-card">' +
        '<div class="la-topline"></div>' +
        '<div class="la-head">' +
          '<div class="la-head-left">' +
            '<div class="la-icon">' + ICON_LINK + '</div>' +
            '<div style="min-width:0;">' +
              '<h2 class="la-title">Link Alternatif</h2>' +
              '<p class="la-sub">Kelola daftar link terklasifikasi — tambah &amp; hapus dengan sederhana.</p>' +
            '</div>' +
          '</div>' +
          '<button type="button" class="la-btn la-btn-primary" data-action="add">' + ICON_PLUS + 'Tambah Link</button>' +
        '</div>' +
        '<div class="la-stats">' +
          '<div class="la-stat"><div class="la-stat-k">Total Link</div><div class="la-stat-v" data-la="total">0</div><div class="la-stat-s">seluruh kategori</div></div>' +
          '<div class="la-stat"><div class="la-stat-k">Kategori Terpakai</div><div class="la-stat-v" data-la="cat">0</div><div class="la-stat-s">jenis link aktif</div></div>' +
          '<div class="la-stat"><div class="la-stat-k">Link Terakhir</div><div class="la-stat-v la-v-sm" data-la="last">&mdash;</div><div class="la-stat-s">penambahan terbaru</div></div>' +
        '</div>' +
        '<div class="la-chips" data-la="chips"></div>' +
        '<div class="la-toolbar">' +
          '<div class="la-search">' + ICON_SEARCH +
            '<input id="laSearch" type="text" placeholder="Cari domain&hellip;" autocomplete="off">' +
          '</div>' +
          '<button type="button" class="la-btn" data-action="reset" data-la="reset" style="display:none;">Reset Filter</button>' +
        '</div>' +
        '<div class="la-twrap">' +
          '<div class="la-scroll">' +
            '<table class="la-table">' +
              '<thead><tr>' +
                '<th style="text-align:left;">Domain</th>' +
                '<th>Redirect</th>' +
                '<th>Jenis Link</th>' +
                '<th>Ditambahkan</th>' +
                '<th>Status</th>' +
                '<th>Diedit</th>' +
                '<th style="text-align:right;">Aksi</th>' +
              '</tr></thead>' +
              '<tbody data-la="body"></tbody>' +
            '</table>' +
          '</div>' +
          '<div class="la-empty" data-la="empty" style="display:none;"></div>' +
        '</div>' +
      '</div>' +
      '<div class="la-modal" data-la="modal">' +
        '<div class="la-mbox">' +
          '<div class="la-mtop"></div>' +
          '<h3 class="la-mtitle">Tambah Link Baru</h3>' +
          '<p class="la-msub">Isi domain dan klasifikasinya &mdash; redirect bersifat opsional.</p>' +
          '<div class="la-field">' +
            '<label class="la-label" for="laInDom">Domain / Link</label>' +
            '<input class="la-input" id="laInDom" type="text" placeholder="contoh: jalursitus.com/lunatogel" autocomplete="off">' +
          '</div>' +
          '<div class="la-field">' +
            '<label class="la-label" for="laInCat">Jenis Link</label>' +
            '<select class="la-select" id="laInCat">' + options + '</select>' +
          '</div>' +
          '<div class="la-field">' +
            '<label class="la-label" for="laInRed">Redirect <span class="la-opt">(opsional)</span></label>' +
            '<input class="la-input" id="laInRed" type="text" placeholder="contoh: jalursitus.com" autocomplete="off">' +
          '</div>' +
          '<div class="la-mfoot">' +
            '<button type="button" class="la-btn" data-action="close">Batal</button>' +
            '<button type="button" class="la-btn la-btn-primary" data-action="save">Simpan Link</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    v.dataset.built = '1';

    /* Event delegation sekali pada container */
    v.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('[data-action]') : null;
      if (!t || !v.contains(t)) return;
      var act = t.getAttribute('data-action');
      if (act === 'add') openAdd();
      else if (act === 'close') closeAdd();
      else if (act === 'save') save();
      else if (act === 'reset') { state.cat = 'all'; var s = q('#laSearch', v); if (s) s.value = ''; render(); }
      else if (act === 'chip') { state.cat = t.getAttribute('data-cat') || 'all'; render(); }
      else if (act === 'del') del(t.getAttribute('data-id'), t);
    });

    var modal = q('[data-la="modal"]', v);
    if (modal) {
      modal.addEventListener('click', function (e) { if (e.target === modal) closeAdd(); });
    }

    var search = q('#laSearch', v);
    if (search) search.addEventListener('input', function () { render(); });
  }

  /* ============================================================
     RENDER (chips, stats, tabel)
     ============================================================ */
  function render() {
    build();
    load();
    var v = container();
    if (!v) return;

    /* Chips kategori */
    var chipsEl = q('[data-la="chips"]', v);
    var counts = {};
    state.items.forEach(function (it) { counts[it.cat] = (counts[it.cat] || 0) + 1; });

    var h = '<button type="button" class="la-chip' + (state.cat === 'all' ? ' active' : '') + '" data-action="chip" data-cat="all">Semua<span class="la-chip-n">' + state.items.length + '</span></button>';
    CATS.forEach(function (c) {
      var n = counts[c.name] || 0;
      h += '<button type="button" class="la-chip' + (state.cat === c.name ? ' active' : '') + '" data-action="chip" data-cat="' + esc(c.name) + '">' +
        '<span class="la-chip-dot" style="background:' + c.c + ';"></span>' + esc(c.name) +
        '<span class="la-chip-n">' + n + '</span></button>';
    });
    chipsEl.innerHTML = h;

    /* Statistik */
    var used = {};
    state.items.forEach(function (it) { used[it.cat] = 1; });
    var elT = q('[data-la="total"]', v); if (elT) elT.textContent = state.items.length;
    var elC = q('[data-la="cat"]', v);
    if (elC) elC.innerHTML = Object.keys(used).length + '<span class="la-unit">/' + CATS.length + '</span>';
    var elL = q('[data-la="last"]', v);
    if (elL) {
      var last = null;
      state.items.forEach(function (it) { if (!last || it.created > last.created) last = it; });
      elL.textContent = last ? fmt(last.created) : '\u2014';
    }

    /* Filter + tabel */
    var search = q('#laSearch', v);
    var term = ((search && search.value) || '').trim().toLowerCase();
    var rows = state.items
      .filter(function (it) {
        return (state.cat === 'all' || it.cat === state.cat) &&
          (!term || it.domain.toLowerCase().indexOf(term) !== -1);
      })
      .sort(function (a, b) { return b.created - a.created; });

    var resetBtn = q('[data-la="reset"]', v);
    if (resetBtn) resetBtn.style.display = (state.cat !== 'all' || term) ? 'inline-flex' : 'none';

    var body = q('[data-la="body"]', v);
    var empty = q('[data-la="empty"]', v);
    if (!body) return;

    if (!rows.length) {
      body.innerHTML = '';
      if (empty) {
        empty.style.display = 'block';
        empty.innerHTML = state.items.length
          ? 'Tidak ada link yang cocok dengan filter / pencarian saat ini.'
          : 'Belum ada link tersimpan &mdash; klik <b>Tambah Link</b> untuk menambahkan yang pertama.';
      }
      return;
    }
    if (empty) empty.style.display = 'none';

    body.innerHTML = rows.map(function (it) {
      var cc = CATS[catIdx(it.cat)].c;
      var cls = (it.id === state.justAdded) ? ' class="la-new"' : '';
      return '<tr' + cls + '>' +
        '<td><div class="la-dom">' + esc(it.domain) + '</div><div class="la-dom-id">ID: ' + esc(String(it.id || '').slice(-8)) + '</div></td>' +
        '<td>' + (it.redirect ? esc(it.redirect) : '<span class="la-muted">&mdash;</span>') + '</td>' +
        '<td><span class="la-pill" style="color:' + cc + '; background:' + cc + '14;"><span class="la-chip-dot" style="background:' + cc + ';"></span>' + esc(it.cat) + '</span></td>' +
        '<td class="la-time">' + fmt(it.created) + '</td>' +
        '<td><span class="la-status"><span class="la-dot"></span>AMAN</span></td>' +
        '<td class="la-time la-muted">&mdash;</td>' +
        '<td style="text-align:right;"><button type="button" class="la-del" data-action="del" data-id="' + esc(it.id) + '" aria-label="Hapus link">' + ICON_TRASH + '</button></td>' +
      '</tr>';
    }).join('');

    state.justAdded = null;
  }

  /* ============================================================
     AKSI: tambah (modal), hapus (2-klik)
     ============================================================ */
  function openAdd() {
    build(); load();
    var v = container();
    var modal = q('[data-la="modal"]', v);
    if (!modal) return;
    var d = q('#laInDom', v);
    if (d) d.value = '';
    var r = q('#laInRed', v);
    if (r) r.value = '';
    modal.classList.add('open');
    setTimeout(function () { if (d) d.focus(); }, 60);
  }

  function closeAdd() {
    var v = container();
    var modal = v && q('[data-la="modal"]', v);
    if (modal) modal.classList.remove('open');
  }

  function save() {
    build(); load();
    var v = container();
    var domEl = q('#laInDom', v);
    var catEl = q('#laInCat', v);
    var redEl = q('#laInRed', v);
    if (!domEl) return;

    var dom = domEl.value.trim().replace(/^https?:\/\//i, '');
    var cat = (catEl && catEl.value) || CATS[0].name;
    var red = redEl ? redEl.value.trim().replace(/^https?:\/\//i, '') : '';

    if (!dom) { toast('Domain tidak boleh kosong', 'warning'); domEl.focus(); return; }
    var dup = state.items.some(function (it) { return it.domain.toLowerCase() === dom.toLowerCase(); });
    if (dup) { toast('Link sudah ada di daftar', 'warning'); return; }

    var id = 'l' + Date.now().toString(36) + Math.random().toString(16).slice(2, 6);
    state.items.push({ id: id, domain: dom, cat: cat, redirect: red, created: Date.now() });
    persist();
    closeAdd();
    if (state.cat !== 'all' && state.cat !== cat) state.cat = 'all';
    state.justAdded = id;
    render();
    toast('Link "' + dom + '" ditambahkan', 'success');
  }

  function disarm() {
    if (!state.armId) return;
    var v = container();
    var b = v && q('.la-del[data-id="' + state.armId + '"]', v);
    if (b) {
      b.classList.remove('arm');
      b.innerHTML = ICON_TRASH;
    }
    state.armId = null;
  }

  function del(id, btn) {
    if (state.armId !== id) {
      disarm();
      state.armId = id;
      btn.classList.add('arm');
      btn.innerHTML = 'Yakin?';
      if (state.armTimer) clearTimeout(state.armTimer);
      state.armTimer = setTimeout(disarm, 3000);
      return;
    }
    if (state.armTimer) { clearTimeout(state.armTimer); state.armTimer = null; }
    state.armId = null;
    load();
    var it = null;
    state.items = state.items.filter(function (x) { if (x.id === id) it = x; return x.id !== id; });
    persist();
    render();
    toast('Link ' + (it ? '"' + it.domain + '" ' : '') + 'dihapus', 'success');
  }

  /* Escape menutup modal */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAdd();
  });

  /* ============================================================
     EXPOSE
     ============================================================ */
  window.LinkAltPro = {
    render: render,
    openAdd: openAdd,
    closeAdd: closeAdd,
    save: save,
    del: del,
    load: load
  };
})();
