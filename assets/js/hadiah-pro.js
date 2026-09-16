/* ============================================================
   AURA.OS // HADIAH-PRO.JS v2.0.0 — HADIAH TOGEL & PERHITUNGAN
   Refactor profesional dari page "Hadiah Togel & Perhitungan"
   milik user (hadiah-togel.js v96) ke tema dashboard AURA.OS.
   ----------------------------------------------------------------
   Fitur (mengikuti script asli, tema disesuaikan penuh):
   - Dropdown pilih pasaran BISA DIKETIK untuk mencari (29 pasaran)
   - Tab kategori: SEMUA / DISKON / BET FULL / PRIZE / TEPAT & BB
     / LAINNYA (mengikuti section yang tersedia di pasaran)
   - Kartu hadiah: nama + badge Diskon % / Hadiah x / Kei %
   - Kategori Prize tampil sebagai 3 kartu grup (PRIZE 1/2/3,
     baris 4D/3D/2D) — seperti desain asli
   - Panel KALKULATOR PERHITUNGAN (kiri): chip tipe permainan per
     pasaran, nominal -> HITUNG, hasil teks lengkap + copy
   - COPY PASARAN INI / COPY SEMUA HADIAH (gabungan dinamis:
     pasaran bernilai identik otomatis satu grup) + modal copy
     manual bila clipboard diblokir browser
   - EDIT HADIAH (MASTER only): ubah Diskon/Hadiah/Kei per baris,
     simpan per device (localStorage), sinkron ke tampilan &
     kalkulator secara langsung
   - Pilihan pasaran & tab terakhir diingat (localStorage)
   Data & mesin hitung: hadiah-data.js (window.HadiahData)
   Semua style di hadiah-pro.css — tanpa inline style.
   Exposed: window.HadiahPro
   ============================================================ */

(function () {
  'use strict';

  var HD = window.HadiahData;

  /* ============================================================
     1. IKON (SVG inline, senada modul pro lain)
     ============================================================ */
  var ICON_TROPHY =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>';
  var ICON_SEARCH =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>';
  var ICON_CHEV =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
  var ICON_COPY =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  var ICON_EDIT =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';

  /* ============================================================
     2. STATE & UTIL
     ============================================================ */
  var LS_SEL = 'aura_hadiah_sel_v2';

  var state = {
    market: '',
    tab: 'Semua',
    dropOpen: false,
    dropQuery: '',
    isMaster: false,
    calcType: 'Diskon'
  };

  var el = {};

  function h(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function norm(s) { return String(s || '').replace(/\s+/g, ' ').trim().toLowerCase(); }

  function getToken() {
    try { return localStorage.getItem('aura_auth_token') || ''; } catch (e) { return ''; }
  }
  function roleLocal() {
    try { return (localStorage.getItem('aura_user_role') || 'MEMBER').toUpperCase(); } catch (e) { return 'MEMBER'; }
  }

  /* MASTER check: localStorage dulu (instan), lalu konfirmasi /api/me */
  function refreshMasterAccess() {
    state.isMaster = roleLocal() === 'MASTER';
    paintEditBtn();
    var token = getToken();
    if (!token) return;
    fetch('/api/me', { headers: { 'x-auth-token': token } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !data.success) return;
        var me = data.user || data.data;
        if (!me || !me.role) return;
        state.isMaster = String(me.role).toUpperCase() === 'MASTER';
        paintEditBtn();
      })
      .catch(function () { /* silent */ });
  }

  function requireMaster() {
    if (state.isMaster) return true;
    flash(el.btnEdit, 'HANYA MASTER ADMINISTRATOR', 1600);
    return false;
  }

  function flash(button, text, ms) {
    if (!button) return;
    var original = button.textContent;
    button.textContent = text;
    setTimeout(function () { button.textContent = original; }, ms || 1400);
  }

  /* ============================================================
     3. COPY UTIL (clipboard + fallback modal manual)
     ============================================================ */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; })
        .catch(function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-99999px';
    ta.style.top = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }

  function openManual(text) {
    el.manualText.value = text;
    el.manualModal.classList.add('is-show');
    setTimeout(function () {
      try {
        el.manualText.focus();
        el.manualText.select();
        el.manualText.setSelectionRange(0, el.manualText.value.length);
      } catch (e) { /* noop */ }
    }, 30);
  }

  function closeManual() {
    el.manualModal.classList.remove('is-show');
  }

  function doCopy(text, btn, okLabel) {
    return copyText(text).then(function (ok) {
      if (ok) {
        flash(btn, okLabel || 'TERSALIN \u2713');
      } else {
        openManual(text);
        flash(btn, 'COPY MANUAL DIBUKA', 1500);
      }
    });
  }

  /* ============================================================
     4. BANGUN SHELL UI (sekali per render)
     ============================================================ */
  function buildShell(host) {
    host.innerHTML = '';
    var wrap = h('div', 'dh-wrap');

    /* --- header panel --- */
    var head = h('section', 'dh-panel dh-head');
    var headBody = h('div', 'dh-head-body');
    var eye = h('span', 'dh-eyebrow');
    eye.appendChild(h('i', 'dh-dot'));
    eye.appendChild(document.createTextNode('HADIAH TOGEL \u2022 LIVECHAT ESSENTIALS'));
    headBody.appendChild(eye);

    var title = h('h2', 'dh-title');
    title.appendChild(document.createTextNode('Hadiah Togel & '));
    title.appendChild(h('span', 'dh-accent', 'Perhitungan'));
    headBody.appendChild(title);
    headBody.appendChild(h('p', 'dh-sub',
      'Informasi hadiah, diskon, kei dan prize semua pasaran \u2014 lengkap dengan kalkulator perhitungan, copy cepat, dan edit hadiah khusus Master Administrator.'));
    head.appendChild(headBody);

    var side = h('div', 'dh-head-side');
    var st1 = h('div', 'dh-stat');
    st1.appendChild(h('b', null, String(HD.allMarkets().length)));
    st1.appendChild(h('span', null, 'PASARAN'));
    var st2 = h('div', 'dh-stat');
    st2.id = 'dhStatRules';
    st2.appendChild(h('b', null, '0'));
    st2.appendChild(h('span', null, 'ATURAN'));
    side.appendChild(st1);
    side.appendChild(st2);
    head.appendChild(side);
    wrap.appendChild(head);

    /* --- toolbar: dropdown + aksi --- */
    var ctrl = h('section', 'dh-panel');
    var row = h('div', 'dh-control-row');

    var drop = h('div', 'dh-drop');
    drop.id = 'dhDropWrap';
    var btn = h('button', 'dh-drop-btn');
    btn.type = 'button';
    btn.id = 'dhDropBtn';
    btn.setAttribute('aria-haspopup', 'listbox');
    var ic = h('span', 'dh-drop-ic');
    ic.innerHTML = ICON_TROPHY;
    var lbl = h('span', 'dh-drop-label', 'PILIH PASARAN');
    lbl.id = 'dhDropLabel';
    var chev = h('span', 'dh-drop-chev');
    chev.innerHTML = ICON_CHEV;
    btn.appendChild(ic);
    btn.appendChild(lbl);
    btn.appendChild(chev);
    drop.appendChild(btn);

    var panel = h('div', 'dh-drop-panel');
    panel.id = 'dhDropPanel';
    panel.style.display = 'none';
    var srch = h('div', 'dh-drop-search');
    srch.innerHTML = ICON_SEARCH;
    var inp = h('input');
    inp.type = 'text';
    inp.id = 'dhDropSearch';
    inp.placeholder = 'Cari pasaran \u2014 ketik nama\u2026';
    inp.autocomplete = 'off';
    inp.spellcheck = false;
    srch.appendChild(inp);
    panel.appendChild(srch);
    var list = h('div', 'dh-drop-list');
    list.id = 'dhDropList';
    panel.appendChild(list);
    drop.appendChild(panel);
    row.appendChild(drop);

    row.appendChild(h('div', 'dh-spacer'));

    var btnCopyCur = h('button', 'dh-btn-ghost');
    btnCopyCur.type = 'button';
    btnCopyCur.id = 'dhCopyCurrent';
    btnCopyCur.innerHTML = ICON_COPY;
    btnCopyCur.appendChild(document.createTextNode('COPY PASARAN INI'));
    row.appendChild(btnCopyCur);

    var btnCopyAll = h('button', 'dh-btn-gold');
    btnCopyAll.type = 'button';
    btnCopyAll.id = 'dhCopyAll';
    btnCopyAll.innerHTML = ICON_COPY;
    btnCopyAll.appendChild(document.createTextNode('COPY SEMUA HADIAH'));
    row.appendChild(btnCopyAll);

    var btnEdit = h('button', 'dh-btn-edit');
    btnEdit.type = 'button';
    btnEdit.id = 'dhEditBtn';
    btnEdit.hidden = true;
    btnEdit.innerHTML = ICON_EDIT;
    btnEdit.appendChild(document.createTextNode('EDIT HADIAH'));
    row.appendChild(btnEdit);

    ctrl.appendChild(row);

    /* --- tab kategori --- */
    var tabs = h('div', 'dh-tabs');
    tabs.id = 'dhTabs';
    ctrl.appendChild(tabs);
    wrap.appendChild(ctrl);

    /* --- kotak pasaran aktif --- */
    var mbox = h('div', 'dh-market-box');
    mbox.id = 'dhMarketBox';
    mbox.style.display = 'none';
    wrap.appendChild(mbox);

    /* --- workspace: kalkulator (kiri) + konten (kanan) --- */
    var workspace = h('div', 'dh-workspace');

    var calcPanel = h('section', 'dh-panel dh-calcpanel');
    var calcHead = h('div', 'dh-calc-head');
    var calcTitle = h('h3', 'dh-calc-title', 'KALKULATOR PERHITUNGAN');
    calcTitle.id = 'dhCalcTitle';
    var calcSub = h('div', 'dh-calc-sub', 'Pilih pasaran untuk memulai perhitungan.');
    calcSub.id = 'dhCalcSub';
    calcHead.appendChild(calcTitle);
    calcHead.appendChild(calcSub);
    calcPanel.appendChild(calcHead);
    var calcHost = h('div', 'dh-calc-host');
    calcHost.id = 'dhCalcHost';
    calcPanel.appendChild(calcHost);
    workspace.appendChild(calcPanel);

    var right = h('div', 'dh-right');
    var marketHead = h('div', 'dh-market-head');
    var mhLeft = h('div', 'dh-market-head-left');
    var mTitle = h('div', 'dh-market-title', '-');
    mTitle.id = 'dhMarketTitle';
    var mStatus = h('div', 'dh-market-status');
    mStatus.id = 'dhMarketStatus';
    mhLeft.appendChild(mTitle);
    mhLeft.appendChild(mStatus);
    var mhRight = h('div', 'dh-market-head-side');
    var mNote = h('div', 'dh-market-note');
    mNote.id = 'dhMarketNote';
    mhRight.appendChild(mNote);
    marketHead.appendChild(mhLeft);
    marketHead.appendChild(mhRight);
    right.appendChild(marketHead);

    var content = h('div', 'dh-content');
    content.id = 'dhContent';
    right.appendChild(content);
    workspace.appendChild(right);
    wrap.appendChild(workspace);

    var empty = h('div', 'dh-empty', 'SILAKAN PILIH PASARAN TERLEBIH DAHULU');
    empty.id = 'dhEmpty';
    wrap.appendChild(empty);

    /* --- legend --- */
    wrap.appendChild(h('div', 'dh-legend',
      'Keterangan: daftar hadiah gabungan disembunyikan dari tampilan. Gunakan COPY SEMUA HADIAH untuk menyalin seluruh daftar hadiah lengkap, termasuk Prize dan pasaran khusus.'));

    /* --- modal copy manual --- */
    var manualModal = h('div', 'dh-modal');
    manualModal.id = 'dhManualModal';
    var manualCard = h('div', 'dh-modal-card');
    var manualTop = h('div', 'dh-modal-top');
    var manualInfo = h('div');
    manualInfo.appendChild(h('b', null, 'Copy Manual'));
    manualInfo.appendChild(h('div', 'dh-modal-sub',
      'Jika copy otomatis diblokir browser, teks sudah dipilih. Tekan Ctrl + C.'));
    var manualClose = h('button', 'dh-btn-ghost', 'TUTUP');
    manualClose.type = 'button';
    manualClose.id = 'dhManualClose';
    manualTop.appendChild(manualInfo);
    manualTop.appendChild(manualClose);
    manualCard.appendChild(manualTop);
    var manualText = h('textarea', 'dh-modal-textarea');
    manualText.id = 'dhManualText';
    manualCard.appendChild(manualText);
    manualModal.appendChild(manualCard);
    wrap.appendChild(manualModal);

    /* --- modal edit hadiah (master) --- */
    var editorModal = h('div', 'dh-modal');
    editorModal.id = 'dhEditorModal';
    var editorCard = h('div', 'dh-modal-card dh-editor-card');
    var editorTop = h('div', 'dh-modal-top');
    var editorInfo = h('div');
    editorInfo.appendChild(h('div', 'dh-editor-title', 'Edit Hadiah Pasaran'));
    editorInfo.appendChild(h('div', 'dh-modal-sub', 'MASTER ADMINISTRATOR ONLY'));
    var editorLabel = h('div', 'dh-modal-sub');
    editorLabel.id = 'dhEditorLabel';
    editorLabel.textContent = 'Pasaran aktif: -';
    editorInfo.appendChild(editorLabel);
    editorInfo.appendChild(h('div', 'dh-modal-sub',
      'Ubah langsung kolom Diskon, Hadiah, atau Kei. Simpan untuk menerapkan perubahan pada pasaran aktif.'));
    var editorActions = h('div', 'dh-modal-actions');
    var editorReset = h('button', 'dh-btn-ghost', 'RESET PASARAN INI');
    editorReset.type = 'button';
    editorReset.id = 'dhEditorReset';
    var editorSave = h('button', 'dh-btn-gold', 'SIMPAN PERUBAHAN');
    editorSave.type = 'button';
    editorSave.id = 'dhEditorSave';
    var editorClose = h('button', 'dh-btn-ghost', 'TUTUP');
    editorClose.type = 'button';
    editorClose.id = 'dhEditorClose';
    editorActions.appendChild(editorReset);
    editorActions.appendChild(editorSave);
    editorActions.appendChild(editorClose);
    editorTop.appendChild(editorInfo);
    editorTop.appendChild(editorActions);
    editorCard.appendChild(editorTop);

    var editorWrap = h('div', 'dh-editor-wrap');
    var editorTable = h('table', 'dh-editor-table');
    var thead = h('thead');
    var thr = h('tr');
    ['Section', 'Nama Permainan', 'Diskon (%)', 'Hadiah', 'Kei'].forEach(function (t) {
      thr.appendChild(h('th', null, t));
    });
    thead.appendChild(thr);
    editorTable.appendChild(thead);
    var tbody = h('tbody');
    tbody.id = 'dhEditorBody';
    editorTable.appendChild(tbody);
    editorWrap.appendChild(editorTable);
    editorCard.appendChild(editorWrap);
    editorCard.appendChild(h('div', 'dh-editor-note',
      'Catatan: perubahan disimpan di browser pada perangkat ini. Reset pasaran ini akan mengembalikan data hadiah pasaran aktif ke kondisi awal.'));
    editorModal.appendChild(editorCard);
    wrap.appendChild(editorModal);

    host.appendChild(wrap);

    /* simpan referensi */
    el.wrap = wrap;
    el.drop = drop; el.dropBtn = btn; el.dropLabel = lbl;
    el.dropPanel = panel; el.dropSearch = inp; el.dropList = list;
    el.tabs = tabs; el.mbox = mbox; el.empty = empty;
    el.calcTitle = calcTitle; el.calcSub = calcSub; el.calcHost = calcHost;
    el.mTitle = mTitle; el.mStatus = mStatus; el.mNote = mNote;
    el.content = content;
    el.btnCopyCur = btnCopyCur; el.btnCopyAll = btnCopyAll; el.btnEdit = btnEdit;
    el.manualModal = manualModal; el.manualText = manualText; el.manualClose = manualClose;
    el.editorModal = editorModal; el.editorLabel = editorLabel; el.editorBody = tbody;
    el.editorSave = editorSave; el.editorClose = editorClose; el.editorReset = editorReset;

    wireShellEvents();
  }

  /* ============================================================
     5. EVENT SHELL
     ============================================================ */
  function wireShellEvents() {
    el.dropBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      state.dropOpen ? closeDrop() : openDrop();
    });
    el.dropSearch.addEventListener('input', function () {
      state.dropQuery = el.dropSearch.value;
      paintDropList();
    });
    el.dropSearch.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var first = el.dropList.querySelector('.dh-opt');
        if (first) { selectMarket(first.dataset.m); closeDrop(); }
      } else if (e.key === 'Escape') {
        closeDrop();
      }
    });
    el.dropPanel.addEventListener('click', function (e) { e.stopPropagation(); });

    el.btnCopyCur.addEventListener('click', function () {
      if (!state.market) return;
      doCopy(HD.marketText(state.market), el.btnCopyCur, 'PASARAN TERSALIN \u2713');
    });
    el.btnCopyAll.addEventListener('click', function () {
      doCopy(HD.allGroupsText(), el.btnCopyAll, 'SEMUA TERSALIN \u2713');
    });
    el.btnEdit.addEventListener('click', function () {
      if (!requireMaster()) return;
      openEditor();
    });

    el.manualClose.addEventListener('click', closeManual);
    el.manualModal.addEventListener('click', function (e) {
      if (e.target === el.manualModal) closeManual();
    });

    el.editorClose.addEventListener('click', closeEditor);
    el.editorSave.addEventListener('click', function () {
      if (!requireMaster()) return;
      applyEditor();
    });
    el.editorReset.addEventListener('click', function () {
      if (!requireMaster()) return;
      HD.resetOverride(state.market);
      closeEditor();
      paintAll();
      flash(el.btnEdit, 'PASARAN DI-RESET \u2713', 1500);
    });
    el.editorModal.addEventListener('click', function (e) {
      if (e.target === el.editorModal) closeEditor();
    });

    /* tutup dropdown global: klik di luar / Escape (anti duplikat listener) */
    if (!window.__dhDropOutside) {
      window.__dhDropOutside = true;
      document.addEventListener('click', function (e) {
        var wrapEl = document.getElementById('dhDropWrap');
        if (!wrapEl) return;
        if (!wrapEl.contains(e.target)) closeDrop();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        var dropPanel = document.getElementById('dhDropPanel');
        if (dropPanel && dropPanel.style.display !== 'none') closeDrop();
        var em = document.getElementById('dhEditorModal');
        if (em && em.classList.contains('is-show')) closeEditor();
        var mm = document.getElementById('dhManualModal');
        if (mm && mm.classList.contains('is-show')) closeManual();
      });
    }

    /* tab kategori (delegasi) */
    el.tabs.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.dh-tab') : null;
      if (!b || !b.dataset.tab) return;
      state.tab = b.dataset.tab;
      saveSel();
      syncTabs();
      paintContent();
    });
  }

  /* ============================================================
     6. DROPDOWN PASARAN (bisa diketik untuk mencari)
     ============================================================ */
  function openDrop() {
    state.dropOpen = true;
    state.dropQuery = '';
    if (el.dropSearch) el.dropSearch.value = '';
    el.drop.classList.add('is-open');
    el.dropPanel.style.display = 'block';
    paintDropList();
    try { el.dropSearch.focus(); } catch (e) { /* noop */ }
  }
  function closeDrop() {
    state.dropOpen = false;
    if (el.drop) el.drop.classList.remove('is-open');
    if (el.dropPanel) el.dropPanel.style.display = 'none';
  }
  function paintDropList() {
    var q = norm(state.dropQuery);
    var names = HD.allMarkets().filter(function (m) { return !q || norm(m).indexOf(q) !== -1; });
    el.dropList.innerHTML = '';
    if (!names.length) {
      el.dropList.appendChild(h('div', 'dh-opt-none', 'Pasaran tidak ditemukan \u2014 "' + state.dropQuery + '"'));
      return;
    }
    names.forEach(function (m) {
      var b = h('button', 'dh-opt' + (m === state.market ? ' is-sel' : ''));
      b.type = 'button';
      b.dataset.m = m;
      b.appendChild(h('span', 'dh-opt-name', m));
      b.appendChild(h('span', 'dh-opt-chip', ruleCount(m) + ' ATURAN'));
      b.addEventListener('click', function () {
        selectMarket(m);
        closeDrop();
      });
      el.dropList.appendChild(b);
    });
  }

  function selectMarket(m) {
    if (HD.allMarkets().indexOf(m) === -1) return;
    state.market = m;
    state.tab = 'Semua';
    state.calcType = 'Diskon';
    saveSel();
    paintAll();
  }

  function saveSel() {
    try {
      localStorage.setItem(LS_SEL, JSON.stringify({ market: state.market, tab: state.tab }));
    } catch (e) { /* noop */ }
  }
  function loadSel() {
    try {
      var raw = localStorage.getItem(LS_SEL);
      if (!raw) return;
      var d = JSON.parse(raw);
      if (d && HD.allMarkets().indexOf(d.market) !== -1) state.market = d.market;
      if (d && d.tab) state.tab = d.tab;
    } catch (e) { /* noop */ }
  }

  /* ============================================================
     7. RENDER UTAMA
     ============================================================ */
  function ruleCount(m) {
    var sections = HD.sectionsFor(m);
    var n = 0;
    HD.SECTION_ORDER.forEach(function (name) {
      (sections[name] || []).forEach(function () { n++; });
    });
    return n;
  }

  function paintAll() {
    if (!el.wrap) return;
    closeDrop();
    el.dropLabel.textContent = state.market || 'PILIH PASARAN';
    el.drop.classList.toggle('is-picked', !!state.market);
    paintEditBtn();
    paintTabs();
    paintMarketBox();
    paintCalcPanel();
    paintContent();
  }

  function paintEditBtn() {
    if (el.btnEdit) el.btnEdit.hidden = !state.isMaster;
  }

  function paintTabs() {
    var tabs = el.tabs;
    tabs.innerHTML = '';
    var available = ['Semua'];
    if (state.market) {
      var sections = HD.sectionsFor(state.market);
      HD.SECTION_ORDER.forEach(function (name) {
        if (sections[name]) available.push(name);
      });
    }
    if (available.indexOf(state.tab) === -1) state.tab = 'Semua';
    available.forEach(function (name) {
      var b = h('button', 'dh-tab' + (name === state.tab ? ' is-on' : ''));
      b.type = 'button';
      b.dataset.tab = name;
      b.textContent = name;
      tabs.appendChild(b);
    });
  }

  /* sinkronkan highlight tab dgn state.tab (dipakai handler klik) */
  function syncTabs() {
    if (!el.tabs) return;
    Array.prototype.forEach.call(el.tabs.querySelectorAll('.dh-tab'), function (b) {
      b.classList.toggle('is-on', (b.dataset.tab || 'Semua') === state.tab);
    });
  }

  function paintMarketBox() {
    var box = el.mbox;
    box.innerHTML = '';
    if (!state.market) { box.style.display = 'none'; return; }
    box.style.display = 'flex';

    var logoURL = HD.MARKET_LOGOS[state.market];
    if (logoURL) {
      var img = h('img', 'dh-market-logo');
      img.src = logoURL;
      img.alt = state.market;
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      img.addEventListener('error', function () {
        var fb = h('div', 'dh-market-fallback', state.market);
        if (img.parentNode) img.parentNode.replaceChild(fb, img);
      });
      box.appendChild(img);
    } else {
      box.appendChild(h('div', 'dh-market-fallback', state.market));
    }

    var info = h('div', 'dh-market-info');
    info.appendChild(h('b', null, state.market));
    var meta = h('span');
    meta.appendChild(document.createTextNode(ruleCount(state.market) + ' ATURAN \u2022 '));
    var hasPrize = !!HD.sectionsFor(state.market)['Prize'];
    var em = h('em', null, hasPrize ? 'PRIZE AKTIF' : 'TANPA PRIZE');
    meta.appendChild(em);
    info.appendChild(meta);
    box.appendChild(info);

    var stat = el.wrap ? document.getElementById('dhStatRules') : null;
    if (stat && stat.firstChild) stat.firstChild.textContent = String(ruleCount(state.market));
  }

  /* --- konten pasaran: section + kartu + prize grouped --- */
  function badge(label, cls) {
    var b = h('span', 'dh-badge ' + cls, label);
    return b;
  }

  function cardHtml(item) {
    var card = h('article', 'dh-card');
    card.appendChild(h('div', 'dh-card-name', HD.copyTitleCase(item.name)));
    var meta = h('div', 'dh-card-meta');
    meta.appendChild(badge('Diskon: ' + item.discount + '%', 'dh-badge-diskon'));
    if (item.reward !== undefined) meta.appendChild(badge('Hadiah: x' + item.reward, 'dh-badge-hadiah'));
    if (item.kei !== undefined) meta.appendChild(badge('Kei: ' + item.kei, 'dh-badge-kei'));
    card.appendChild(meta);
    return card;
  }

  function prizeSectionHtml(list) {
    var groups = {
      '1': { title: 'PRIZE 1', rows: [] },
      '2': { title: 'PRIZE 2', rows: [] },
      '3': { title: 'PRIZE 3', rows: [] }
    };
    var digitMap = { '1': '4D', '2': '3D', '3': '2D' };

    list.forEach(function (item) {
      var match = String(item.name || '').match(/PRIZE\s*(\d+)\s*-\s*(\d+)/i);
      if (!match || !groups[match[1]]) return;
      groups[match[1]].rows.push({
        digitLabel: digitMap[match[2]] || (match[2] + 'D'),
        discount: item.discount,
        reward: item.reward,
        kei: item.kei
      });
    });

    var sec = h('section', 'dh-section');
    var st = h('div', 'dh-section-title');
    st.appendChild(h('h2', null, 'Prize'));
    sec.appendChild(st);

    var cards = h('div', 'dh-prize-cards');
    ['1', '2', '3'].forEach(function (key) {
      var g = groups[key];
      if (!g.rows.length) return;
      var pc = h('article', 'dh-prize-card');
      pc.appendChild(h('h3', null, g.title));
      g.rows.forEach(function (row) {
        var r = h('div', 'dh-prize-row');
        r.appendChild(h('div', 'dh-prize-digit', row.digitLabel));
        var meta = h('div', 'dh-prize-meta');
        meta.appendChild(badge('Diskon: ' + row.discount + '%', 'dh-badge-diskon'));
        if (row.reward !== undefined) meta.appendChild(badge('Hadiah: x' + row.reward, 'dh-badge-hadiah'));
        if (row.kei !== undefined) meta.appendChild(badge('Kei: ' + row.kei, 'dh-badge-kei'));
        r.appendChild(meta);
        pc.appendChild(r);
      });
      cards.appendChild(pc);
    });
    sec.appendChild(cards);
    return sec;
  }

  function paintContent() {
    var content = el.content;
    content.innerHTML = '';
    var has = !!state.market;
    el.empty.style.display = has ? 'none' : 'block';

    el.mTitle.textContent = state.market || '-';
    if (!has) {
      el.mStatus.textContent = '';
      el.mStatus.className = 'dh-market-status';
      el.mNote.textContent = '';
      return;
    }

    var sections = HD.sectionsFor(state.market);
    var hasPrize = !!sections['Prize'];
    el.mNote.textContent = hasPrize
      ? 'Pasaran ini memiliki kategori Prize.'
      : 'Pasaran ini tidak memiliki kategori Prize.';
    el.mStatus.textContent = 'Kalkulator perhitungan tersedia untuk pasaran ini.';
    el.mStatus.className = 'dh-market-status is-ok';

    var painted = 0;
    HD.SECTION_ORDER.forEach(function (sectionName) {
      if (!sections[sectionName]) return;
      if (state.tab !== 'Semua' && state.tab !== sectionName) return;

      var items = sections[sectionName];
      if (!items.length) return;

      if (sectionName === 'Prize') {
        content.appendChild(prizeSectionHtml(items));
        painted++;
        return;
      }

      var sec = h('section', 'dh-section');
      var st = h('div', 'dh-section-title');
      st.appendChild(h('h2', null, sectionName));
      sec.appendChild(st);
      var grid = h('div', 'dh-grid');
      items.forEach(function (item) { grid.appendChild(cardHtml(item)); });
      sec.appendChild(grid);
      content.appendChild(sec);
      painted++;
    });

    if (!painted) {
      content.appendChild(h('div', 'dh-empty dh-empty-sm', 'TIDAK ADA DATA PADA KATEGORI INI'));
    }
  }

  /* ============================================================
     8. KALKULATOR PERHITUNGAN (panel kiri)
     ============================================================ */
  function paintCalcPanel() {
    var host = el.calcHost;
    host.innerHTML = '';

    if (!state.market) {
      el.calcTitle.textContent = 'KALKULATOR PERHITUNGAN';
      el.calcSub.textContent = 'Pilih pasaran untuk memulai perhitungan.';
      host.appendChild(h('div', 'dh-calc-hint',
        'Pilih pasaran pada dropdown di atas, lalu pilih tipe permainan dan masukkan nominal betting.'));
      return;
    }

    var types = HD.marketCalcTypes(state.market);
    if (types.indexOf(state.calcType) === -1) state.calcType = types[0];

    el.calcTitle.textContent = 'KALKULATOR PERHITUNGAN ' + state.market;
    el.calcSub.textContent = 'Nilai diambil langsung dari daftar hadiah pasaran ini. Pilih tipe, masukkan nominal, lalu tekan HITUNG.';

    var chips = h('div', 'dh-calc-types');
    types.forEach(function (type) {
      var b = h('button', 'dh-chip' + (type === state.calcType ? ' is-on' : ''));
      b.type = 'button';
      b.textContent = type;
      b.addEventListener('click', function () {
        state.calcType = type;
        chips.querySelectorAll('.dh-chip').forEach(function (x) { x.classList.remove('is-on'); });
        b.classList.add('is-on');
      });
      chips.appendChild(b);
    });
    host.appendChild(chips);

    var controls = h('div', 'dh-calc-controls');
    var input = h('input', 'dh-calc-input');
    input.type = 'number';
    input.min = '1';
    input.step = '1';
    input.inputMode = 'numeric';
    input.placeholder = 'Masukkan nominal betting\u2026 contoh 1000';
    var hit = h('button', 'dh-calc-hit', 'HITUNG');
    hit.type = 'button';
    var reset = h('button', 'dh-calc-reset', 'RESET');
    reset.type = 'button';
    controls.appendChild(input);
    controls.appendChild(hit);
    controls.appendChild(reset);
    host.appendChild(controls);

    var resultWrap = h('div', 'dh-calc-outwrap');
    var result = h('pre', 'dh-calc-result');
    var actions = h('div', 'dh-calc-actions');
    var copyBtn = h('button', 'dh-btn-gold', 'COPY HASIL PERHITUNGAN');
    copyBtn.type = 'button';
    actions.appendChild(copyBtn);
    resultWrap.appendChild(result);
    resultWrap.appendChild(actions);
    host.appendChild(resultWrap);

    function doCalc() {
      var bet = Number(input.value);
      if (!Number.isFinite(bet) || bet <= 0) {
        result.textContent = 'Masukkan nominal betting yang valid terlebih dahulu.';
        resultWrap.classList.add('is-show');
        return;
      }
      result.textContent = HD.marketCalcText(state.market, state.calcType, bet);
      resultWrap.classList.add('is-show');
    }

    hit.addEventListener('click', doCalc);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') doCalc(); });
    reset.addEventListener('click', function () {
      input.value = '';
      result.textContent = '';
      resultWrap.classList.remove('is-show');
      try { input.focus(); } catch (e) { /* noop */ }
    });
    copyBtn.addEventListener('click', function () {
      if (!result.textContent.trim()) {
        result.textContent = 'Hitung terlebih dahulu sebelum menyalin hasil.';
        resultWrap.classList.add('is-show');
        return;
      }
      doCopy(result.textContent, copyBtn);
    });
  }

  /* ============================================================
     9. EDITOR HADIAH (MASTER ONLY)
     ============================================================ */
  function openEditor() {
    if (!state.market) return;
    el.editorLabel.textContent = 'Pasaran aktif: ' + state.market;
    el.editorBody.innerHTML = '';

    var sections = HD.sectionsFor(state.market);
    HD.SECTION_ORDER.forEach(function (sectionName) {
      var items = sections[sectionName] || [];
      items.forEach(function (item, index) {
        var tr = h('tr');
        tr.appendChild(h('td', 'dh-col-section', sectionName));
        tr.appendChild(h('td', 'dh-col-name', HD.copyTitleCase(item.name)));
        tr.appendChild(buildEditorCell(sectionName, index, 'discount', item.discount));
        tr.appendChild(buildEditorCell(sectionName, index, 'reward', item.reward));
        tr.appendChild(buildEditorCell(sectionName, index, 'kei', item.kei));
        el.editorBody.appendChild(tr);
      });
    });

    el.editorModal.classList.add('is-show');
  }

  function buildEditorCell(section, index, field, value) {
    var td = h('td');
    var input = h('input', 'dh-editor-input');
    input.type = 'text';
    input.inputMode = 'text';
    input.value = value == null ? '' : String(value);
    input.dataset.section = section;
    input.dataset.index = String(index);
    input.dataset.field = field;
    td.appendChild(input);
    return td;
  }

  function closeEditor() {
    el.editorModal.classList.remove('is-show');
  }

  function collectEditedSections() {
    var draft = JSON.parse(JSON.stringify(HD.sectionsFor(state.market)));
    el.editorBody.querySelectorAll('.dh-editor-input').forEach(function (input) {
      var section = input.dataset.section;
      var index = Number(input.dataset.index);
      var field = input.dataset.field;
      var raw = input.value.trim();

      if (!draft[section] || !draft[section][index]) return;

      if (field === 'discount') {
        var n = Number(raw);
        draft[section][index].discount = raw === '' ? 0 : (Number.isFinite(n) ? n : 0);
        return;
      }
      if (field === 'reward') {
        if (raw === '') delete draft[section][index].reward;
        else draft[section][index].reward = raw;
        return;
      }
      if (field === 'kei') {
        if (raw === '') delete draft[section][index].kei;
        else draft[section][index].kei = raw;
      }
    });
    return draft;
  }

  function applyEditor() {
    HD.applyOverride(state.market, collectEditedSections());
    closeEditor();
    paintAll();
    flash(el.btnEdit, 'TERSIMPAN & KALKULATOR SINKRON \u2713', 1800);
  }

  /* ============================================================
     10. ENTRY POINT
     ============================================================ */
  function render() {
    if (!HD) {
      var host0 = document.getElementById('hadiahView');
      if (host0) host0.innerHTML = '<div class="dh-empty">Modul data hadiah (hadiah-data.js) belum dimuat.</div>';
      return;
    }
    var host = document.getElementById('hadiahView');
    if (!host) return;
    buildShell(host);
    loadSel();
    paintAll();
    refreshMasterAccess();
  }

  /* expose */
  window.HadiahPro = {
    render: render,
    selectMarket: selectMarket,
    openDrop: openDrop,
    closeDrop: closeDrop,
    setFilter: function (t) { state.tab = t; saveSel(); paintAll(); },
    openEditor: openEditor,
    closeEditor: closeEditor,
    state: state,
    markets: function () { return HD.allMarkets(); }
  };
})();
