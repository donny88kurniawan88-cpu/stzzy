/* ============================================================
   SALDO QRIS — v1.0.0 (v3.13.0 / Task 32)
   4 toggle pages: V2HIM · XPAY · MINERAPAY · ORION
   - Sumber data: Google Sheet saldo QRIS via proxy worker
     GET /api/qris-saldo (header x-auth-token)
   - Kalkulator saldo per page:
       Saldo Akhir (sheet) − Fee Tax & Transaksi − Fee Transaksi
       Pending + Transaksi Withdraw Failed + Pending Deposit
       − Saldo Dashboard  =  SALDO BERSIH
   - Nilai otomatis dari sheet (badge AUTO), nilai manual
     (Withdraw Failed / Pending Deposit / Saldo Dashboard)
     tersimpan di localStorage dan bisa diedit.
   API global: window.SaldoQris { render, refresh, setTab, state }
   ============================================================ */
(function () {
  'use strict';

  /* ===== CONFIG PAGE (4 provider) ===== */
  var PAGES = [
    { key: 'v2him',     label: 'V2HIM',     icon: 'fa-shield-halved', color: '#8b5cf6', color2: '#7c3aed', grad: 'linear-gradient(135deg,#8b5cf6 0%,#6d28d9 100%)',
      match: function (n) { return /V2HIM/.test(n); } },
    { key: 'xpay',      label: 'XPAY',      icon: 'fa-bolt',          color: '#06b6d4', color2: '#0891b2', grad: 'linear-gradient(135deg,#22d3ee 0%,#0891b2 100%)',
      match: function (n) { return /XPAY/.test(n); } },
    { key: 'minerapay', label: 'MINERAPAY', icon: 'fa-layer-group',   color: '#10b981', color2: '#059669', grad: 'linear-gradient(135deg,#34d399 0%,#059669 100%)',
      match: function (n) { return /MINERAPAY/.test(n) && !/ORION/.test(n); } },
    { key: 'orion',     label: 'ORION',     icon: 'fa-star',          color: '#f59e0b', color2: '#d97706', grad: 'linear-gradient(135deg,#fbbf24 0%,#d97706 100%)',
      match: function (n) { return /ORION/.test(n); } }
  ];

  /* ===== KALKULATOR: definisi field per page (urut = urut hitung) =====
     auto: nama metric sheet (di-aggregate utk gate page) atau null=manual */
  var CALC_FIELDS = [
    { key: 'saldoSheet',     label: 'Saldo Akhir (Spreadsheet)', op: '=',  auto: 'saldo',    hint: 'Baris SALDO >>> sheet' },
    { key: 'feeTax',         label: 'Fee Tax & Transaksi',       op: '\u2212', auto: 'feeAll',   hint: 'TOTAL BIAYA ALL + KAS1' },
    { key: 'feePending',     label: 'Fee Transaksi Pending',     op: '\u2212', auto: 'pendinganDocs', hint: 'TOTAL PENDINGAN DOCS' },
    { key: 'withdrawFailed', label: 'Transaksi Withdraw Failed', op: '+',  auto: null,       hint: 'Input manual' },
    { key: 'pendingDeposit', label: 'Pending Deposit',           op: '+',  auto: null,       hint: 'Input manual' },
    { key: 'saldoDashboard', label: 'Saldo Dashboard',           op: '\u2212', auto: null,       hint: 'Input manual (rekonsiliasi)' }
  ];

  var LS_CALC = 'aura_sq_calc_v1';
  var LS_TAB = 'aura_sq_tab_v1';

  var state = {
    loaded: false, loading: false,
    data: null, err: null, lastSync: null,
    tab: 'v2him', calc: {}
  };

  /* ===== HELPERS ===== */
  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function fmt(n) {
    var v = Number(n) || 0;
    var neg = v < 0; var a = Math.abs(v);
    var s = a.toLocaleString('id-ID', { maximumFractionDigits: 2 });
    return neg ? '\u2212' + s : s;
  }
  function fmtRp(n) { return 'Rp ' + fmt(n); }
  function token() { return localStorage.getItem('aura_auth_token') || ''; }
  function lsGet(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* aggregate metric utk sekumpulan index gate */
  function sumMetric(sheet, metric, idxs) {
    var arr = sheet[metric] || [];
    var t = 0;
    for (var i = 0; i < idxs.length; i++) t += (Number(arr[idxs[i]]) || 0);
    return t;
  }
  function pageIdxs(sheet, page) {
    var out = [];
    var gates = sheet.gates || [];
    for (var i = 0; i < gates.length; i++) if (page.match(gates[i])) out.push(i);
    return out;
  }
  /* nilai auto kalkulator utk page */
  function autoValues(sheet, page) {
    var idxs = pageIdxs(sheet, page);
    return {
      saldoSheet: sumMetric(sheet, 'saldo', idxs),
      feeTax: sumMetric(sheet, 'biayaAll', idxs) + sumMetric(sheet, 'biayaAllKas1', idxs),
      feePending: sumMetric(sheet, 'pendinganDocs', idxs),
      withdrawFailed: 0,
      pendingDeposit: 0,
      saldoDashboard: 0
    };
  }
  function calcValues(page) {
    var sheet = state.data && state.data.sheet; if (!sheet) return null;
    var auto = autoValues(sheet, page);
    var over = (state.calc[page.key] || {});
    var vals = {};
    CALC_FIELDS.forEach(function (f) {
      var v = over[f.key] != null ? Number(over[f.key]) : auto[f.key];
      vals[f.key] = isFinite(v) ? v : 0;
    });
    var result = vals.saldoSheet - vals.feeTax - vals.feePending + vals.withdrawFailed + vals.pendingDeposit - vals.saldoDashboard;
    return { auto: auto, vals: vals, result: result, overridden: Object.keys(over).length };
  }

  /* count-up animation */
  function countUp(node, to, prefix) {
    if (!node) return;
    var from = Number(node.getAttribute('data-cur')) || 0;
    var t0 = null, DUR = 750;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / DUR);
      var e = 1 - Math.pow(1 - p, 3);
      var cur = from + (to - from) * e;
      node.textContent = (prefix || '') + fmt(Math.round(cur));
      if (p < 1) requestAnimationFrame(step);
      else node.setAttribute('data-cur', String(to));
    }
    node.setAttribute('data-cur', String(from));
    requestAnimationFrame(step);
  }

  /* ===== RENDER SKELETON (sekali per masuk view) ===== */
  var wired = false;
  function render() {
    var root = el('saldoQrisView');
    if (!root) return;
    state.tab = lsGet(LS_TAB, 'v2him');
    if (!PAGES.some(function (p) { return p.key === state.tab; })) state.tab = 'v2him';
    state.calc = lsGet(LS_CALC, {});

    root.innerHTML =
      '<div class="sq-wrap">' +
        '<div class="sq-head">' +
          '<div class="sq-head-l">' +
            '<div class="sq-eyebrow"><span class="sq-dot"></span> Operational \u00b7 QRIS Balance</div>' +
            '<div class="sq-title"><i class="fas fa-wallet"></i> Saldo QRIS</div>' +
            '<div class="sq-sub">Monitoring saldo gate QRIS + kalkulator saldo bersih \u2014 sumber: Google Sheet <b>DB &amp; DATA REK</b></div>' +
          '</div>' +
          '<div class="sq-head-r">' +
            '<div class="sq-sync" id="sqSync"><i class="fas fa-clock"></i> <span>belum sync</span></div>' +
            '<button class="sq-refresh" id="sqRefresh" title="Ambil data sheet terbaru"><i class="fas fa-rotate"></i> Refresh</button>' +
          '</div>' +
        '</div>' +
        '<div class="sq-tabs" id="sqTabs">' +
          '<div class="sq-ind" id="sqInd"></div>' +
          PAGES.map(function (p, i) {
            return '<button class="sq-tab' + (p.key === state.tab ? ' active' : '') + '" data-tab="' + p.key + '" style="--sqc:' + p.color + ';--sqc2:' + p.color2 + '">' +
              '<i class="fas ' + p.icon + '"></i><span>' + p.label + '</span>' +
            '</button>';
          }).join('') +
        '</div>' +
        '<div class="sq-body" id="sqBody"></div>' +
      '</div>';

    /* delegation sekali (guard anti duplikat saat re-render) */
    if (!wired) {
      root.addEventListener('click', onClick);
      root.addEventListener('input', onInput);
      root.addEventListener('focusin', onFocusIn);
      root.addEventListener('focusout', onFocusOut);
      window.addEventListener('resize', moveInd);
      wired = true;
    }

    moveInd();
    if (state.data) {
      paintBody();
      /* stale-while-revalidate: sheet lama > 2 menit -> re-sync diam-diam */
      if (!state.lastSync || (Date.now() - state.lastSync) > 120000) refresh();
    } else refresh();
  }

  function moveInd() {
    var tabs = el('sqTabs'); if (!tabs) return;
    var ind = el('sqInd'); if (!ind) return;
    var act = tabs.querySelector('.sq-tab.active');
    if (!act) return;
    ind.style.width = act.offsetWidth + 'px';
    ind.style.transform = 'translateX(' + (act.offsetLeft) + 'px)';
    ind.style.background = getComputedStyle(act).getPropertyValue('--sqc') || '#8b5cf6';
  }

  /* ===== DATA ===== */
  function refresh() {
    if (state.loading) return;
    state.loading = true; state.err = null;
    var body = el('sqBody');
    if (body && !state.data) body.innerHTML = sqSkeletonHtml();
    var btn = el('sqRefresh');
    if (btn) btn.classList.add('busy');
    var sync = el('sqSync');
    if (sync) sync.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> <span>sync sheet\u2026</span>';

    fetch('/api/qris-saldo', { headers: { 'x-auth-token': token() } })
      .then(function (r) { return r.json().catch(function () { return { success: false, error: 'Respon tidak valid' }; }); })
      .then(function (d) {
        state.loading = false;
        if (btn) btn.classList.remove('busy');
        if (d && d.success && d.sheet) {
          state.data = d;
          state.lastSync = Date.now();
          state.err = null;
          paintBody();
          if (typeof window.showToast === 'function') window.showToast('Saldo QRIS tersinkron dari Google Sheet', 'success');
        } else {
          state.err = (d && d.error) || 'Gagal memuat data sheet';
          paintError();
          if (typeof window.showToast === 'function') window.showToast(state.err, 'error');
        }
      })
      .catch(function (e) {
        state.loading = false;
        if (btn) btn.classList.remove('busy');
        state.err = 'Koneksi gagal: ' + (e && e.message ? e.message : 'network');
        paintError();
      });
  }

  function paintError() {
    var body = el('sqBody'); if (!body) return;
    body.innerHTML =
      '<div class="sq-error">' +
        '<div class="sq-error-ic"><i class="fas fa-triangle-exclamation"></i></div>' +
        '<div class="sq-error-t">Gagal memuat saldo QRIS</div>' +
        '<div class="sq-error-d">' + esc(state.err || '-') + '</div>' +
        '<div class="sq-error-h">Pastikan sheet dibagikan publik (viewer) lalu coba lagi.</div>' +
        '<button class="sq-btn-retry" data-action="sqretry"><i class="fas fa-rotate"></i> Coba Lagi</button>' +
      '</div>';
  }

  function sqSkeletonHtml() {
    var cards = '';
    for (var i = 0; i < 4; i++) cards += '<div class="sq-card sk"><div class="sq-sk sq-sk-l"></div><div class="sq-sk sq-sk-v"></div><div class="sq-sk sq-sk-s"></div></div>';
    return '<div class="sq-skel"><div class="sq-stats">' + cards + '</div>' +
      '<div class="sq-calcwrap"><div class="sq-calc">' + '<div class="sq-step sk"><div class="sq-sk sq-sk-c"></div></div>'.repeat(4) + '</div>' +
      '<div class="sq-rescol"><div class="sq-result sk"><div class="sq-sk sq-sk-r"></div></div></div></div></div>';
  }

  /* expose */
  window.SaldoQris = {
    render: render,
    refresh: refresh,
    setTab: setTab,
    state: state,
    PAGES: PAGES
  };

  /* === bagian 2: interaksi + paint === */

  function setTab(key) {
    if (!PAGES.some(function (p) { return p.key === key; })) return;
    state.tab = key;
    lsSet(LS_TAB, key);
    var tabs = el('sqTabs'); if (tabs) {
      Array.prototype.forEach.call(tabs.querySelectorAll('.sq-tab'), function (b) {
        b.classList.toggle('active', b.getAttribute('data-tab') === key);
      });
    }
    moveInd();
    paintBody();
  }

  function page() {
    for (var i = 0; i < PAGES.length; i++) if (PAGES[i].key === state.tab) return PAGES[i];
    return PAGES[0];
  }

  /* ===== EVENTS (delegasi di root) ===== */
  function onClick(e) {
    var t = e.target.closest ? e.target : null;
    if (!t) return;
    var tabBtn = e.target.closest('.sq-tab');
    if (tabBtn) { setTab(tabBtn.getAttribute('data-tab')); return; }
    if (e.target.closest('#sqRefresh')) { refresh(); return; }
    var act = e.target.closest('[data-action]');
    if (!act) return;
    var a = act.getAttribute('data-action');
    if (a === 'sqretry') refresh();
    else if (a === 'sqreset') {
      delete state.calc[state.tab];
      lsSet(LS_CALC, state.calc);
      paintBody();
      if (typeof window.showToast === 'function') window.showToast('Kalkulator dikembalikan ke nilai sheet', 'info');
    }
  }
  function onInput(e) {
    var inp = e.target.closest('.sq-step input');
    if (!inp) return;
    var key = inp.getAttribute('data-fkey');
    var raw = inp.value.replace(/[^\d\-,]/g, '').replace(/,/g, '.');
    var v = parseFloat(raw);
    var over = state.calc[state.tab] || (state.calc[state.tab] = {});
    over[key] = isFinite(v) ? v : 0;
    lsSet(LS_CALC, state.calc);
    recalcLive();
  }
  /* simpan fokus: hanya update hasil, TIDAK re-render input (pelajaran Task 29) */
  function recalcLive() {
    var p = page();
    var c = calcValues(p); if (!c) return;
    var resVal = document.querySelector('#sqResVal');
    if (resVal) resVal.textContent = fmtRp(c.result);
    var resBox = document.querySelector('.sq-result');
    if (resBox) {
      resBox.classList.toggle('neg', c.result < 0);
      resBox.classList.add('flash');
      setTimeout(function () { resBox.classList.remove('flash'); }, 450);
    }
    var note = document.querySelector('#sqResNote');
    if (note) {
      note.className = 'sq-result-chip ' + (c.result < 0 ? 'neg' : 'pos');
      note.innerHTML = c.result < 0
        ? '<i class="fas fa-arrow-trend-down"></i> Saldo minus ' + fmt(Math.abs(c.result))
        : '<i class="fas fa-circle-check"></i> Saldo aman (surplus ' + fmt(c.result) + ')';
    }
    var br = document.querySelector('#sqResBreak');
    if (br) br.textContent = formulaText(c);
    /* badge MANUAL pada field yg diubah */
    var inp = document.activeElement;
    if (inp && inp.classList && inp.classList.contains('sq-num')) {
      var wrap = inp.closest('.sq-step');
      if (wrap) {
        var badge = wrap.querySelector('.sq-src');
        if (badge) { badge.textContent = 'MANUAL'; badge.classList.add('man'); }
      }
    }
  }
  function onFocusIn(e) {
    var inp = e.target.closest && e.target.closest('.sq-step input');
    if (inp) inp.value = String(Number(inp.getAttribute('data-raw')) || 0);
  }
  function onFocusOut(e) {
    var inp = e.target.closest && e.target.closest('.sq-step input');
    if (!inp) return;
    var key = inp.getAttribute('data-fkey');
    var over = state.calc[state.tab] || {};
    var v = Number(over[key]) || 0;
    inp.setAttribute('data-raw', String(v));
    inp.value = fmt(v);
  }

  function formulaText(c) {
    return 'Saldo Bersih = Saldo Akhir ' + fmt(c.vals.saldoSheet) +
      ' \u2212 Fee Tax & Transaksi ' + fmt(c.vals.feeTax) +
      ' \u2212 Fee Transaksi Pending ' + fmt(c.vals.feePending) +
      ' + Withdraw Failed ' + fmt(c.vals.withdrawFailed) +
      ' + Pending Deposit ' + fmt(c.vals.pendingDeposit) +
      ' \u2212 Saldo Dashboard ' + fmt(c.vals.saldoDashboard);
  }

  /* ===== PAINT BODY ===== */
  function paintBody() {
    var body = el('sqBody'); if (!body) return;
    if (state.err && !state.data) { paintError(); return; }
    var sheet = state.data && state.data.sheet;
    if (!sheet) { body.innerHTML = sqSkeletonHtml(); return; }
    var p = page();
    var c = calcValues(p); if (!c) return;
    var idxs = pageIdxs(sheet, p);
    var gates = idxs.map(function (i) { return sheet.gates[i]; });

    /* --- stat cards --- */
    var saldoNow = c.vals.saldoSheet, saldoAwal = sumMetric(sheet, 'saldoAwal', idxs);
    var pending = c.vals.feePending, biaya = c.vals.feeTax;
    var delta = saldoNow - saldoAwal;
    var deltaPct = saldoAwal > 0 ? Math.round(delta / saldoAwal * 1000) / 10 : 0;
    var stats =
      '<div class="sq-stats">' +
        '<div class="sq-card c1 anim d0"><div class="sq-card-ic" style="background:' + p.grad + '"><i class="fas fa-sack-dollar"></i></div>' +
          '<div class="sq-card-label">Saldo Akhir (Sheet)</div><div class="sq-card-val" id="sqSt0">0</div>' +
          '<div class="sq-card-sub"><span class="sq-delta ' + (delta >= 0 ? 'up' : 'down') + '"><i class="fas ' + (delta >= 0 ? 'fa-caret-up' : 'fa-caret-down') + '"></i> ' + fmt(Math.abs(delta)) + ' (' + fmt(deltaPct) + '%)</span> vs saldo awal</div></div>' +
        '<div class="sq-card c2 anim d1"><div class="sq-card-ic" style="background:linear-gradient(135deg,#64748b,#334155)"><i class="fas fa-flag-checkered"></i></div>' +
          '<div class="sq-card-label">Saldo Awal</div><div class="sq-card-val" id="sqSt1">0</div><div class="sq-card-sub">posisi awal periode</div></div>' +
        '<div class="sq-card c3 anim d2"><div class="sq-card-ic" style="background:linear-gradient(135deg,#fb923c,#ea580c)"><i class="fas fa-hourglass-half"></i></div>' +
          '<div class="sq-card-label">Fee Transaksi Pending</div><div class="sq-card-val" id="sqSt2">0</div><div class="sq-card-sub">TOTAL PENDINGAN DOCS</div></div>' +
        '<div class="sq-card c4 anim d3"><div class="sq-card-ic" style="background:linear-gradient(135deg,#f43f5e,#be123c)"><i class="fas fa-receipt"></i></div>' +
          '<div class="sq-card-label">Fee Tax &amp; Transaksi</div><div class="sq-card-val" id="sqSt3">0</div><div class="sq-card-sub">TOTAL BIAYA ALL + KAS1</div></div>' +
      '</div>';

    /* --- kalkulator --- */
    var steps = '';
    CALC_FIELDS.forEach(function (f, i) {
      var isAuto = f.auto != null;
      var isOver = (state.calc[p.key] || {})[f.key] != null;
      var src = isOver ? 'MANUAL' : (isAuto ? 'AUTO' : 'MANUAL');
      steps +=
        '<div class="sq-step anim d' + Math.min(i + 1, 4) + '">' +
          '<div class="sq-op">' + f.op + '</div>' +
          '<div class="sq-stepinfo">' +
            '<div class="sq-steplabel">' + esc(f.label) + '</div>' +
            '<div class="sq-stepsub">' + esc(f.hint) + (f.key === 'saldoDashboard' ? ' \u2014 ' + esc(p.label) : '') + '</div>' +
          '</div>' +
          '<span class="sq-src' + (src === 'MANUAL' ? ' man' : '') + '">' + src + '</span>' +
          '<input class="sq-num" data-fkey="' + f.key + '" data-raw="' + c.vals[f.key] + '" value="' + fmt(c.vals[f.key]) + '" inputmode="numeric" autocomplete="off" spellcheck="false">' +
        '</div>';
    });

    var calcHtml =
      '<div class="sq-calcwrap">' +
        '<div class="sq-calc">' +
          '<div class="sq-calc-head"><i class="fas fa-calculator"></i> Kalkulator Saldo \u2014 ' + esc(p.label) +
            '<button class="sq-reset" data-action="sqreset" title="Kembalikan ke nilai sheet"><i class="fas fa-rotate-left"></i> Reset</button></div>' +
          steps +
          '<div class="sq-formula"><i class="fas fa-equals"></i> <span>' + esc(formulaText(c)) + '</span></div>' +
        '</div>' +
        '<div class="sq-rescol">' +
          '<div class="sq-result' + (c.result < 0 ? ' neg' : '') + '">' +
            '<div class="sq-result-top"><span class="sq-result-label"><i class="fas fa-coins"></i> SALDO BERSIH \u2014 ' + esc(p.label) + '</span>' +
            '<span class="sq-result-chip ' + (c.result < 0 ? 'neg' : 'pos') + '" id="sqResNote">' + (c.result < 0 ? '<i class="fas fa-arrow-trend-down"></i> Saldo minus ' + fmt(Math.abs(c.result)) : '<i class="fas fa-circle-check"></i> Saldo aman (surplus ' + fmt(c.result) + ')') + '</span></div>' +
            '<div class="sq-result-val" id="sqResVal">' + fmtRp(c.result) + '</div>' +
            '<div class="sq-result-break" id="sqResBreak">' + esc(formulaText(c)) + '</div>' +
            '<div class="sq-result-foot"><span class="sq-live"><span class="sq-dot2"></span> live recalculating</span><span>' + (idxs.length) + ' gate digabung</span></div>' +
          '</div>' +
          '<div class="sq-gates">' +
            '<div class="sq-gates-t"><i class="fas fa-plug-circle-check"></i> Gate terdeteksi (' + idxs.length + ')</div>' +
            (gates.length ? gates.map(function (g) { return '<span class="sq-gate"><span class="sq-gate-dot" style="background:' + p.color + '"></span>' + esc(g) + '</span>'; }).join('') : '<span class="sq-gate none">Tidak ada gate ' + esc(p.label) + ' di sheet</span>') +
          '</div>' +
        '</div>' +
      '</div>';

    /* --- tabel data gate (tegas) --- */
    var metrics = [
      ['Saldo Akhir (SALDO)', 'saldo', 1],
      ['Saldo Awal', 'saldoAwal', 1],
      ['Limit Harian', 'limitHarian', 1],
      ['Adjust Saldo', 'adjustSaldo', 1],
      ['Total Approved Docs', 'approvedDocs', 1],
      ['Total Pendingan Docs', 'pendinganDocs', 1],
      ['Biaya Harian Kas1', 'biayaHarianKas1', 1],
      ['Biaya Harian', 'biayaHarian', 1],
      ['Biaya All Kas1', 'biayaAllKas1', 1],
      ['Biaya All (Fee Tax & Transaksi)', 'biayaAll', 1]
    ];
    var th = '<th class="sq-thm">METRIK</th>' + gates.map(function (g) { return '<th>' + esc(g) + '</th>'; }).join('') + '<th class="sq-tht">TOTAL</th>';
    var trs = metrics.map(function (m, ri) {
      var tds = idxs.map(function (i2) { return '<td class="num">' + fmt(sheet[m[1]][i2]) + '</td>'; }).join('');
      return '<tr' + (ri % 2 ? ' class="even"' : '') + '><td class="m">' + esc(m[0]) + '</td>' + tds + '<td class="num tot">' + fmt(sumMetric(sheet, m[1], idxs)) + '</td></tr>';
    }).join('');
    var trBank = '<tr class="even"><td class="m">Jenis Bank</td>' + idxs.map(function (i2) { return '<td class="ctr">' + esc(sheet.jenisBank[i2] || '-') + '</td>'; }).join('') + '<td class="ctr tot">' + esc((sheet.jenisBank[idxs[0]] || '-')) + '</td></tr>';
    var trKet =
      '<tr><td class="m">Keterangan Harian</td>' + idxs.map(function (i2) { var k = sheet.ketHarian[i2] || '-'; return '<td class="ctr' + (/^KLOP$/i.test(k) ? ' ok' : (/^-$/.test(k) ? '' : ' bad')) + '">' + esc(k) + '</td>'; }).join('') + '<td class="ctr tot">-</td></tr>' +
      '<tr class="even"><td class="m">Keterangan Biaya All</td>' + idxs.map(function (i2) { var k = sheet.ketAll[i2] || '-'; return '<td class="ctr' + (/^KLOP$/i.test(k) ? ' ok' : (/^-$/.test(k) ? '' : ' bad')) + '">' + esc(k) + '</td>'; }).join('') + '<td class="ctr tot">-</td></tr>';
    var trAgg =
      '<tr><td class="m">Agregat Sheet \u2014 PENDINGAN DOCS QRIS</td><td colspan="' + (idxs.length + 1) + '" class="num tot2">' + fmt(sheet.agg ? sheet.agg.pendinganDocsQris : 0) + '</td></tr>' +
      '<tr class="even"><td class="m">Agregat Sheet \u2014 APPROVED DOCS QRIS</td><td colspan="' + (idxs.length + 1) + '" class="num tot2">' + fmt(sheet.agg ? sheet.agg.approvedDocsQris : 0) + '</td></tr>';

    var tableHtml =
      '<div class="sq-tablewrap anim d2">' +
        '<div class="sq-table-head"><i class="fas fa-table-list"></i> Data Mentah Gate \u2014 ' + esc(p.label) +
        '<span class="sq-period"><i class="fas fa-file-lines"></i> ' + esc(sheet.period || 'ALL QRIS') + '</span></div>' +
        '<div class="sq-tscroll"><table class="sq-table">' +
          '<thead><tr>' + th + '</tr></thead>' +
          '<tbody>' + trBank + trs + trKet + trAgg + '</tbody>' +
        '</table></div>' +
      '</div>';

    body.innerHTML = stats + calcHtml + tableHtml;

    /* count-up stats */
    countUp(el('sqSt0'), saldoNow, 'Rp ');
    countUp(el('sqSt1'), saldoAwal, 'Rp ');
    countUp(el('sqSt2'), pending, 'Rp ');
    countUp(el('sqSt3'), biaya, 'Rp ');

    /* sync chip */
    var sync = el('sqSync');
    if (sync && state.lastSync) {
      var d = new Date(state.lastSync);
      sync.innerHTML = '<i class="fas fa-clock"></i> <span>sync ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2) + '</span>';
    }
  }
})();
