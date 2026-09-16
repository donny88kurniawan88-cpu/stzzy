/* ============================================================
   AURA.OS // PKPERHITUNGAN-PRO.JS v1.0.0 — PK PERHITUNGAN HADIAH
   View kalkulator perhitungan hadiah togel (child menu dari
   Hadiah Togel). Sumber rumus: script resmi user "Hadiah Togel &
   Perhitungan" (hadiah-togel.js v96) — PERSIS tanpa perubahan,
   mesin hitung ada di hadiah-data.js (window.HadiahData).
   ----------------------------------------------------------------
   Fitur:
   - Dropdown pilih pasaran BISA DIKETIK untuk mencari (29 pasaran)
   - Chip tipe permainan OTOMATIS mengikuti pasaran:
     common / KINGKONG / TOTO MACAU 4D / TOTO MACAU 5D / profile
     (TOTOMALI, HOKI DRAW, JAKARTA) — chip "Prize" otomatis muncul
     pada pasaran berganti Prize
   - Nominal betting -> HITUNG -> hasil teks perhitungan lengkap
     (format kalimat persis script asli) + COPY HASIL PERHITUNGAN
     + fallback copy manual bila clipboard diblokir browser
   - Pilihan pasaran & tipe terakhir diingat (localStorage)
   Semua style di hadiah-pro.css — tanpa inline style.
   Exposed: window.PkPerhitungan
   ============================================================ */

(function () {
  'use strict';

  var HD = window.HadiahData;

  var ICON_SEARCH =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>';
  var ICON_CHEV =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
  var ICON_CALC =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="11" x2="8" y2="11.01"/><line x1="12" y1="11" x2="12" y2="11.01"/><line x1="16" y1="11" x2="16" y2="11.01"/><line x1="8" y1="15" x2="8" y2="15.01"/><line x1="12" y1="15" x2="12" y2="15.01"/><line x1="16" y1="15" x2="16" y2="15.01"/><line x1="8" y1="19" x2="8" y2="19.01"/><line x1="12" y1="19" x2="12" y2="19.01"/><line x1="16" y1="19" x2="16" y2="19.01"/></svg>';
  var ICON_COPY =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

  var LS_SEL = 'aura_pkperhitungan_sel_v1';

  var state = { market: '', calcType: 'Diskon', dropOpen: false, dropQuery: '' };
  var el = {};

  function h(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function norm(s) { return String(s || '').replace(/\s+/g, ' ').trim().toLowerCase(); }

  function flash(button, text, ms) {
    if (!button) return;
    var original = button.textContent;
    button.textContent = text;
    setTimeout(function () { button.textContent = original; }, ms || 1400);
  }

  /* ============================================================
     COPY UTIL (clipboard + fallback modal manual)
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

  function doCopy(text, btn) {
    return copyText(text).then(function (ok) {
      if (ok) {
        flash(btn, 'TERSALIN \u2713');
      } else {
        openManual(text);
        flash(btn, 'COPY MANUAL DIBUKA', 1500);
      }
    });
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

  /* ============================================================
     SHELL UI
     ============================================================ */
  function buildShell(host) {
    host.innerHTML = '';
    var wrap = h('div', 'dh-wrap pk-wrap');

    /* --- header --- */
    var head = h('section', 'dh-panel dh-head');
    var headBody = h('div', 'dh-head-body');
    var eye = h('span', 'dh-eyebrow');
    eye.appendChild(h('i', 'dh-dot'));
    eye.appendChild(document.createTextNode('PK PERHITUNGAN \u2022 LIVECHAT ESSENTIALS'));
    headBody.appendChild(eye);
    var title = h('h2', 'dh-title');
    title.appendChild(document.createTextNode('Kalkulator '));
    title.appendChild(h('span', 'dh-accent', 'Perhitungan Hadiah'));
    headBody.appendChild(title);
    headBody.appendChild(h('p', 'dh-sub',
      'Hitung hadiah semua pasaran sesuai aturan masing-masing \u2014 diskon, bet full, bolak balik, colok, shio, kombinasi, kei, dasar, hingga Prize. Pilih pasaran lalu tekan HITUNG.'));
    head.appendChild(headBody);
    var side = h('div', 'dh-head-side');
    var st1 = h('div', 'dh-stat');
    st1.appendChild(h('b', null, String(HD.allMarkets().length)));
    st1.appendChild(h('span', null, 'PASARAN'));
    var st2 = h('div', 'dh-stat');
    st2.appendChild(h('b', null, '1'));
    st2.appendChild(h('span', null, 'KALKULATOR / PASARAN'));
    side.appendChild(st1);
    side.appendChild(st2);
    head.appendChild(side);
    wrap.appendChild(head);

    /* --- toolbar: dropdown pasaran --- */
    var ctrl = h('section', 'dh-panel');
    var row = h('div', 'dh-control-row');

    var drop = h('div', 'dh-drop');
    drop.id = 'pkDropWrap';
    var btn = h('button', 'dh-drop-btn');
    btn.type = 'button';
    btn.id = 'pkDropBtn';
    btn.setAttribute('aria-haspopup', 'listbox');
    var ic = h('span', 'dh-drop-ic');
    ic.innerHTML = ICON_CALC;
    var lbl = h('span', 'dh-drop-label', 'PILIH PASARAN');
    lbl.id = 'pkDropLabel';
    var chev = h('span', 'dh-drop-chev');
    chev.innerHTML = ICON_CHEV;
    btn.appendChild(ic);
    btn.appendChild(lbl);
    btn.appendChild(chev);
    drop.appendChild(btn);

    var panel = h('div', 'dh-drop-panel');
    panel.id = 'pkDropPanel';
    panel.style.display = 'none';
    var srch = h('div', 'dh-drop-search');
    srch.innerHTML = ICON_SEARCH;
    var inp = h('input');
    inp.type = 'text';
    inp.id = 'pkDropSearch';
    inp.placeholder = 'Cari pasaran \u2014 ketik nama\u2026';
    inp.autocomplete = 'off';
    inp.spellcheck = false;
    srch.appendChild(inp);
    panel.appendChild(srch);
    var list = h('div', 'dh-drop-list');
    list.id = 'pkDropList';
    panel.appendChild(list);
    drop.appendChild(panel);
    row.appendChild(drop);

    row.appendChild(h('div', 'dh-spacer'));
    var note = h('div', 'dh-toolbar-note', 'Kalkulator mengikuti hadiah, diskon & Kei pasaran aktif.');
    row.appendChild(note);

    ctrl.appendChild(row);
    wrap.appendChild(ctrl);

    /* --- kotak pasaran aktif --- */
    var mbox = h('div', 'dh-market-box');
    mbox.id = 'pkMarketBox';
    mbox.style.display = 'none';
    wrap.appendChild(mbox);

    /* --- panel kalkulator --- */
    var calcPanel = h('section', 'dh-panel dh-calcpanel dh-calcpanel-lg');
    var calcTitle = h('h3', 'dh-calc-title', 'KALKULATOR PERHITUNGAN');
    calcTitle.id = 'pkCalcTitle';
    var calcSub = h('div', 'dh-calc-sub', 'Pilih pasaran untuk memulai perhitungan.');
    calcSub.id = 'pkCalcSub';
    calcPanel.appendChild(calcTitle);
    calcPanel.appendChild(calcSub);

    var calcHost = h('div', 'dh-calc-host');
    calcHost.id = 'pkCalcHost';
    calcPanel.appendChild(calcHost);
    wrap.appendChild(calcPanel);

    var empty = h('div', 'dh-empty', 'SILAKAN PILIH PASARAN TERLEBIH DAHULU');
    empty.id = 'pkEmpty';
    wrap.appendChild(empty);

    /* --- modal copy manual --- */
    var manualModal = h('div', 'dh-modal');
    manualModal.id = 'pkManualModal';
    var manualCard = h('div', 'dh-modal-card');
    var manualTop = h('div', 'dh-modal-top');
    var manualInfo = h('div');
    manualInfo.appendChild(h('b', null, 'Copy Manual'));
    manualInfo.appendChild(h('div', 'dh-modal-sub',
      'Jika copy otomatis diblokir browser, teks sudah dipilih. Tekan Ctrl + C.'));
    var manualClose = h('button', 'dh-btn-ghost', 'TUTUP');
    manualClose.type = 'button';
    manualClose.id = 'pkManualClose';
    manualTop.appendChild(manualInfo);
    manualTop.appendChild(manualClose);
    manualCard.appendChild(manualTop);
    var manualText = h('textarea', 'dh-modal-textarea');
    manualText.id = 'pkManualText';
    manualCard.appendChild(manualText);
    manualModal.appendChild(manualCard);
    wrap.appendChild(manualModal);

    host.appendChild(wrap);

    el.wrap = wrap;
    el.drop = drop; el.dropBtn = btn; el.dropLabel = lbl;
    el.dropPanel = panel; el.dropSearch = inp; el.dropList = list;
    el.mbox = mbox; el.empty = empty;
    el.calcTitle = calcTitle; el.calcSub = calcSub; el.calcHost = calcHost;
    el.manualModal = manualModal; el.manualText = manualText; el.manualClose = manualClose;

    wireEvents();
  }

  /* ============================================================
     EVENTS
     ============================================================ */
  function wireEvents() {
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
    el.manualClose.addEventListener('click', closeManual);
    el.manualModal.addEventListener('click', function (e) {
      if (e.target === el.manualModal) closeManual();
    });

    if (!window.__pkDropOutside) {
      window.__pkDropOutside = true;
      document.addEventListener('click', function (e) {
        var wrapEl = document.getElementById('pkDropWrap');
        if (!wrapEl) return;
        if (!wrapEl.contains(e.target)) closeDrop();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        var p = document.getElementById('pkDropPanel');
        if (p && p.style.display !== 'none') closeDrop();
        var m = document.getElementById('pkManualModal');
        if (m && m.classList.contains('is-show')) closeManual();
      });
    }
  }

  /* ============================================================
     DROPDOWN PASARAN
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
      b.appendChild(h('span', 'dh-opt-chip', HD.marketCalcTypes(m).length + ' TIPE'));
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
    var types = HD.marketCalcTypes(m);
    if (types.indexOf(state.calcType) === -1) state.calcType = types[0];
    saveSel();
    paintAll();
  }

  function saveSel() {
    try {
      localStorage.setItem(LS_SEL, JSON.stringify({ market: state.market, calcType: state.calcType }));
    } catch (e) { /* noop */ }
  }
  function loadSel() {
    try {
      var raw = localStorage.getItem(LS_SEL);
      if (!raw) return;
      var d = JSON.parse(raw);
      if (d && HD.allMarkets().indexOf(d.market) !== -1) state.market = d.market;
      if (d && d.calcType) state.calcType = d.calcType;
    } catch (e) { /* noop */ }
  }

  /* ============================================================
     RENDER
     ============================================================ */
  function calcGroupLabel(market) {
    if (market === 'KINGKONG') return 'Kalkulator khusus KINGKONG.';
    if (market === 'TOTO MACAU 4D') return 'Kalkulator khusus TOTO MACAU 4D (termasuk Super Diskon).';
    if (market === 'TOTO MACAU 5D') return 'Kalkulator khusus TOTO MACAU 5D.';
    if (market === 'HONGKONG' || market === 'SYDNEY') {
      return 'Kalkulator khusus ' + market + ' \u2014 Bet Full menggunakan x9.800 / x980 / x98.';
    }
    if (market === 'TOTOMALI' || market === 'HOKI DRAW' || market === 'JAKARTA') {
      return 'Kalkulator khusus ' + market + '.';
    }
    return 'Kalkulator hadiah utama untuk kelompok pasaran ini.';
  }

  function paintAll() {
    if (!el.wrap) return;
    closeDrop();
    el.dropLabel.textContent = state.market || 'PILIH PASARAN';
    el.drop.classList.toggle('is-picked', !!state.market);
    paintMarketBox();
    paintCalc();
    el.empty.style.display = state.market ? 'none' : 'block';
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
    info.appendChild(h('span', null, calcGroupLabel(state.market)));
    box.appendChild(info);
  }

  function paintCalc() {
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
    el.calcSub.textContent = calcGroupLabel(state.market) + ' Pilih tipe, masukkan nominal betting, lalu tekan HITUNG.';

    var chips = h('div', 'dh-calc-types');
    types.forEach(function (type) {
      var b = h('button', 'dh-chip' + (type === state.calcType ? ' is-on' : ''));
      b.type = 'button';
      b.textContent = type;
      b.addEventListener('click', function () {
        state.calcType = type;
        saveSel();
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
     ENTRY POINT
     ============================================================ */
  function render() {
    if (!HD) {
      var host0 = document.getElementById('pkPerhitunganView');
      if (host0) host0.innerHTML = '<div class="dh-empty">Modul data hadiah (hadiah-data.js) belum dimuat.</div>';
      return;
    }
    var host = document.getElementById('pkPerhitunganView');
    if (!host) return;
    buildShell(host);
    loadSel();
    paintAll();
  }

  /* expose */
  window.PkPerhitungan = {
    render: render,
    selectMarket: selectMarket,
    openDrop: openDrop,
    closeDrop: closeDrop,
    state: state,
    markets: function () { return HD.allMarkets(); }
  };
})();
