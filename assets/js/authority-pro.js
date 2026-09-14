/* ============================================================
   AURA.OS // AUTHORITY-PRO.JS  v2.3
   Authority Panel logic — User management, FULL access-control
   matrix (32 keys: grup > menu > sub-menu, mengikuti struktur
   menu Dashboard), registration settings, pending approvals,
   filters, toasts.
   Pairs with authority-pro.css (AUTHORITY) v2.3
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     ACCESS TREE — LENGKAP 32 KEY (3 tingkat), mengikuti struktur
     sidebar Dashboard: GRUP > MENU > SUB-MENU.
     Harus sinkron dengan VALID_MODULES di src/index.js:
       core, workspace, operational, system,
       user_management, registration_control,
       dashboard, profil, banking_tools, rek_validator,
       bank_processor, saldo_pencairan, qris_tools,
       p2m_analyzer, xpay_analyzer, xpay_settlement,
       settlement_checker, mnpay_analyzer,
       prediction_tools, syair_database, ai_prediction,
       gas_slot_engine, event_tools, my_event, history_event,
       pg_report, edit_bukti, keep_memo,
       api_key, setting, ip_whitelist, authority_panel
     ============================================================ */

  /* Peta anak -> induk (untuk migrasi data legacy yang hanya
     memiliki akses level menu — sub-menu mewarisi induknya).
     Harus sinkron dengan CHILD_TO_PARENT di src/index.js. */
  var CHILD_PARENT = {
    p2m_analyzer: 'qris_tools', xpay_analyzer: 'qris_tools',
    xpay_settlement: 'qris_tools', settlement_checker: 'qris_tools',
    mnpay_analyzer: 'qris_tools',
    syair_database: 'prediction_tools', ai_prediction: 'prediction_tools',
    gas_slot_engine: 'prediction_tools',
    my_event: 'event_tools', history_event: 'event_tools',
    pg_report: 'event_tools',
    /* v2.5.0 — Livechat Essentials */
    prediksi_all_pasaran: 'livechat_essentials',
    jadwal_all_pasaran: 'livechat_essentials',
    pk_jadwal_pasaran: 'jadwal_all_pasaran',
    link_alternatif: 'livechat_essentials',
    perhitungan_parlay: 'livechat_essentials',
    hadiah_togel: 'livechat_essentials',
    pk_perhitungan: 'hadiah_togel'
  };
  var ACCESS_TREE = [
    {
      key: 'core', label: 'Core', icon: 'fa-gauge-high', color: 'blue',
      desc: 'Modul inti sistem',
      items: [
        { key: 'dashboard', label: 'Dashboard', icon: 'fa-house' },
        { key: 'profil',    label: 'Profil',    icon: 'fa-user' }
      ]
    },
    {
      key: 'workspace', label: 'Workspace', icon: 'fa-briefcase', color: 'purple',
      desc: 'Tools perbankan & pemrosesan data rekening',
      items: [
        { key: 'banking_tools', label: 'Banking Tools', icon: 'fa-credit-card', children: [
          { key: 'rek_validator',  label: 'Rek Validator',  icon: 'fa-magnifying-glass-dollar' },
          { key: 'bank_processor', label: 'Bank Processor', icon: 'fa-money-bill-transfer' }
        ] }
      ]
    },
    {
      key: 'operational', label: 'Operational', icon: 'fa-gears', color: 'teal',
      desc: 'Operasional harian, QRIS, prediksi & event',
      items: [
        { key: 'saldo_pencairan',  label: 'Saldo Pencairan',  icon: 'fa-layer-group' },
        { key: 'qris_tools',       label: 'QRIS Tools',       icon: 'fa-qrcode', children: [
          { key: 'p2m_analyzer',       label: 'P2M Analyzer',       icon: 'fa-magnifying-glass-chart' },
          { key: 'xpay_analyzer',      label: 'XPAY Analyzer',      icon: 'fa-satellite-dish' },
          { key: 'xpay_settlement',    label: 'XPAY Settlement',    icon: 'fa-file-invoice-dollar' },
          { key: 'settlement_checker', label: 'Settlement Checker', icon: 'fa-clipboard-check' },
          { key: 'mnpay_analyzer',     label: 'MNPAY Analyzer',     icon: 'fa-chart-bar' }
        ] },
        { key: 'prediction_tools', label: 'Prediction Tools', icon: 'fa-clock', children: [
          { key: 'syair_database',  label: 'Syair Database',  icon: 'fa-book-open' },
          { key: 'ai_prediction',   label: 'AI Prediction',   icon: 'fa-brain' },
          { key: 'gas_slot_engine', label: 'Gas Slot Engine', icon: 'fa-fire-flame-curved' }
        ] },
        { key: 'event_tools',      label: 'Event Tools',      icon: 'fa-calendar-days', children: [
          { key: 'my_event',      label: 'My Event',      icon: 'fa-calendar-day' },
          { key: 'history_event', label: 'History Event', icon: 'fa-clock-rotate-left' },
          { key: 'pg_report',     label: 'PG Report',     icon: 'fa-calculator' }
        ] },
        { key: 'livechat_essentials', label: 'Livechat Essentials', icon: 'fa-headset', color: 'pink', children: [
          { key: 'prediksi_all_pasaran', label: 'Prediksi All Pasaran', icon: 'fa-lightbulb' },
          { key: 'jadwal_all_pasaran',   label: 'Jadwal All Pasaran',   icon: 'fa-clock', children: [
            { key: 'pk_jadwal_pasaran', label: 'Pk Jadwal Pasaran', icon: 'fa-turn-up' }
          ] },
          { key: 'link_alternatif',      label: 'Link Alternatif',      icon: 'fa-link' },
          { key: 'perhitungan_parlay',   label: 'Perhitungan Parlay',   icon: 'fa-shuffle' },
          { key: 'hadiah_togel',         label: 'Hadiah Togel',         icon: 'fa-gift', children: [
            { key: 'pk_perhitungan',    label: 'Pk Perhitungan',    icon: 'fa-turn-up' }
          ] }
        ] },
        { key: 'edit_bukti',       label: 'Edit Bukti',       icon: 'fa-pen-to-square' },
        { key: 'keep_memo',        label: 'Keep Memo',        icon: 'fa-clipboard' }
      ]
    },
    {
      key: 'system', label: 'System', icon: 'fa-server', color: 'danger',
      desc: 'Konfigurasi sistem, keamanan & authority',
      items: [
        { key: 'api_key',       label: 'API Key',       icon: 'fa-key' },
        { key: 'ip_whitelist',  label: 'IP Whitelist',  icon: 'fa-globe' },
        { key: 'setting',       label: 'Setting',       icon: 'fa-gear' },
        { key: 'authority_panel', label: 'Authority Panel', icon: 'fa-user-shield', children: [
          { key: 'user_management',      label: 'User Management', icon: 'fa-users-cog' },
          { key: 'registration_control', label: 'Data Registrasi', icon: 'fa-clipboard-check' }
        ] }
      ]
    }
  ];

  /* Flat list 40 key (urutan sama dengan VALID_MODULES backend) */
  var ALL_KEYS = (function () {
    var keys = ['core', 'workspace', 'operational', 'system'];
    ACCESS_TREE.forEach(function (g) {
      keys.push(g.key);
      /* v2.5.0 — rekursif: semua level sub-menu masuk daftar key */
      (function walk(list) {
        list.forEach(function (n) {
          keys.push(n.key);
          if (n.children) walk(n.children);
        });
      })(g.items);
    });
    /* dedupe (group keys sudah masuk di awal) */
    var seen = {}, out = [];
    keys.forEach(function (k) { if (!seen[k]) { seen[k] = 1; out.push(k); } });
    return out;
  })();

  var ROLE_CLASS = { MASTER: 'role-master', ADMIN: 'role-admin', MEMBER: 'role-member' };
  var PAGE_SIZE = 8;

  /* ============================================================
     STATE
     ============================================================ */
  var authToken = '';
  var userRole = '';
  var userAccess = {};      /* access milisendiri (dari /api/me) */
  var isViewOnly = false;   /* MEMBER dengan authority_panel=true */
  var usersData = [];
  /* v2.4.0 — versi UI ini ditulis ke badge #uiVer di modal Edit Access.
     Bila badge TIDAK menunjukkan versi ini = browser masih memuat file lama (cache). */
  var UI_VERSION = '2.5.0';
  var backendLegacy = false; /* true = backend terdeteksi membuang key sub-menu saat save */
  var editUsername = null;
  var currentPage = 1;
  var regisSettings = { open: true, defaultRole: 'MEMBER', requireApproval: false };
  var confirmCallback = null;

  /* ============================================================
     HELPERS
     ============================================================ */
  function $(id)  { return document.getElementById(id); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function initials(name) {
    return (name || '??').substring(0, 2).toUpperCase();
  }

  function avatarGradient(name) {
    var n = (name || '').toLowerCase();
    var hash = 0;
    for (var i = 0; i < n.length; i++) hash = (hash * 31 + n.charCodeAt(i)) >>> 0;
    var mod = hash % 3;
    if (mod === 0) return 'warning-pink';
    if (mod === 1) return 'purple-teal';
    return 'success-blue';
  }

  function setText(id, val) {
    var el = $(id);
    if (el) el.textContent = val;
  }

  /* ============================================================
     ACCESS HELPERS
     ============================================================ */
  /* Default access per role — sinkron dengan defaultAccessFor() backend */
  function defaultAccessFor(role) {
    var acc = {};
    ALL_KEYS.forEach(function (k) { acc[k] = false; });
    if (role === 'MASTER' || role === 'ADMIN') {
      ALL_KEYS.forEach(function (k) { acc[k] = true; });
    } else {
      acc.core = true; acc.dashboard = true; acc.profil = true;
    }
    return acc;
  }

  /* Ambil access user target — merged dengan default role-nya.
     MIGRASI LEGACY: key sub-menu yang BELUM ADA di data lama
     (data hanya level menu) mewarisi nilai menu induknya, agar
     akses user yang sudah berjalan tidak tiba-tiba hilang di modal. */
  function accessFor(u) {
    var base = defaultAccessFor(u ? u.role : 'MEMBER');
    if (u && u.access && typeof u.access === 'object') {
      ALL_KEYS.forEach(function (k) {
        if (typeof u.access[k] === 'boolean') base[k] = u.access[k];
      });
      Object.keys(CHILD_PARENT).forEach(function (c) {
        if (typeof u.access[c] !== 'boolean') base[c] = base[CHILD_PARENT[c]];
      });
    }
    return base;
  }

  function countEnabledModules(acc) {
    var n = 0;
    ALL_KEYS.forEach(function (k) { if (acc[k]) n++; });
    return n;
  }

  /* Apakah role user saat ini boleh memodifikasi user lain? */
  function canEditUser(targetUser) {
    if (isViewOnly) return false;
    if (userRole === 'MASTER') return true;
    if (userRole === 'ADMIN')  return targetUser.role === 'MEMBER';
    return false;
  }

  /* Tab Authority yang boleh dilihat user saat ini */
  function tabAllowed(key) {
    if (userRole === 'MASTER') return true;
    return !!userAccess[key];
  }

  /* ============================================================
     TOAST
     ============================================================ */
  var toastTimer = null;
  function showToast(msg, type) {
    var t = $('toastEl');
    if (!t) return;
    type = type || 'info';
    var iconMap = {
      success: 'fa-circle-check',
      error:   'fa-circle-exclamation',
      warning: 'fa-triangle-exclamation',
      info:    'fa-circle-info'
    };
    t.className = 'auth-toast ' + type;
    t.innerHTML =
      '<div class="auth-toast-icon"><i class="fas ' + (iconMap[type] || iconMap.info) + '"></i></div>' +
      '<div class="auth-toast-content">' + escapeHtml(msg) + '</div>';
    void t.offsetWidth;
    t.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3200);
  }

  /* ============================================================
     CUSTOM CONFIRM DIALOG
     ============================================================ */
  function showConfirm(opts) {
    opts = opts || {};
    var overlay = $('confirmOverlay');
    if (!overlay) return;

    var icon   = opts.icon || 'danger';
    var iconFa = opts.iconFa || 'fa-triangle-exclamation';
    var title  = opts.title || 'Konfirmasi';
    var desc   = opts.desc || '';
    var target = opts.target || '';
    var confirmText = opts.confirmText || 'Hapus';
    var cancelText  = opts.cancelText  || 'Batal';

    var iconEl = overlay.querySelector('.auth-confirm-icon');
    iconEl.className = 'auth-confirm-icon ' + icon;
    iconEl.innerHTML = '<i class="fas ' + iconFa + '"></i>';

    overlay.querySelector('.auth-confirm-title').textContent = title;
    overlay.querySelector('.auth-confirm-desc').textContent = desc;

    var targetEl = overlay.querySelector('.auth-confirm-target');
    if (target) {
      targetEl.style.display = 'inline-block';
      targetEl.textContent = target;
    } else {
      targetEl.style.display = 'none';
    }

    var confirmBtn = overlay.querySelector('[data-confirm-btn]');
    var cancelBtn  = overlay.querySelector('[data-cancel-btn]');
    confirmBtn.innerHTML = '<i class="fas ' + (icon === 'danger' ? 'fa-trash' : 'fa-check') + '"></i> ' + escapeHtml(confirmText);
    confirmBtn.className = 'auth-btn ' + (icon === 'danger' ? 'auth-btn-danger-ghost' : 'auth-btn-primary');
    cancelBtn.innerHTML = escapeHtml(cancelText);

    confirmCallback = typeof opts.onConfirm === 'function' ? opts.onConfirm : null;
    overlay.classList.add('active');
  }

  function closeConfirm() {
    var overlay = $('confirmOverlay');
    if (overlay) overlay.classList.remove('active');
    confirmCallback = null;
  }

  /* ============================================================
     VIEW SWITCHER (User Management <-> Data Registrasi)
     ============================================================ */
  function switchView(view) {
    var users = $('viewUsers');
    var regis = $('viewRegistration');
    var noMod = $('noModuleState');
    if (users) users.classList.toggle('active', view === 'users');
    if (regis) regis.classList.toggle('active', view === 'registration');
    if (noMod) noMod.style.display = 'none';

    $$('.auth-side-item').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-view') === view);
    });

    if (view === 'registration') {
      loadRegisSettings();
      loadPending();
    }
  }

  /* ============================================================
     LOAD USERS
     ============================================================ */
  function loadUsers() {
    var tbody = $('userTableBody');
    if (tbody) {
      tbody.innerHTML =
        '<tr class="loading-row"><td colspan="5"><i class="fas fa-spinner"></i> Memuat data user...</td></tr>';
    }
    fetch('/api/users', { headers: { 'x-auth-token': authToken } })
      .then(function (res) {
        if (res.status === 401 || res.status === 403) {
          showToast('Sesi berakhir atau akses ditolak. Silakan login ulang.', 'warning');
          setTimeout(function () { window.location.href = '/Login.html'; }, 1200);
          return [];
        }
        return res.json();
      })
      .then(function (data) {
        usersData = Array.isArray(data) ? data : [];
        currentPage = 1;
        renderStats();
        renderTable();
      })
      .catch(function () {
        if (tbody) {
          tbody.innerHTML =
            '<tr class="empty-row"><td colspan="5"><div class="auth-empty-state">' +
            '<i class="fas fa-circle-exclamation"></i>' +
            '<div class="empty-title">Gagal memuat data user</div>' +
            '<div class="empty-sub">Periksa koneksi atau coba lagi nanti</div>' +
            '</div></td></tr>';
        }
        showToast('Gagal memuat data user', 'error');
      });
  }

  /* ============================================================
     RENDER STATS
     ============================================================ */
  function renderStats() {
    var total   = usersData.length;
    var masters = usersData.filter(function (u) { return u.role === 'MASTER'; }).length;
    var admins  = usersData.filter(function (u) { return u.role === 'ADMIN';  }).length;
    var members = usersData.filter(function (u) { return u.role === 'MEMBER'; }).length;
    var pendings = usersData.filter(function (u) { return (u.status || '').toUpperCase() === 'PENDING'; }).length;

    setText('statTotal',   total);
    setText('statMasters', masters);
    setText('statAdmins',  admins);
    setText('statMembers', members);
    setText('statPending', pendings);

    var trendEl = $('statTotalTrend');
    if (trendEl) {
      var active = usersData.filter(function (u) {
        return (u.status || 'ACTIVE').toUpperCase() === 'ACTIVE';
      }).length;
      trendEl.innerHTML = '<i class="fas fa-circle-check"></i> ' + active + ' active';
    }
  }

  /* ============================================================
     RENDER TABLE (search + role/status filter + pagination)
     ============================================================ */
  function getFilteredUsers() {
    var searchInput = $('searchInput');
    var search = searchInput ? searchInput.value.toLowerCase().trim() : '';
    var roleF = ($('filterRole')   && $('filterRole').value)   || 'ALL';
    var stF   = ($('filterStatus') && $('filterStatus').value) || 'ALL';

    return usersData.filter(function (u) {
      if (roleF !== 'ALL' && (u.role || '').toUpperCase() !== roleF) return false;
      if (stF !== 'ALL' && (u.status || 'ACTIVE').toUpperCase() !== stF) return false;
      if (!search) return true;
      var hay = ((u.username || '') + ' ' + (u.role || '') + ' ' + (u.granted_by || '')).toLowerCase();
      return hay.indexOf(search) >= 0;
    });
  }

  /* Access summary chips: 4 grup + jumlah modul */
  function renderAccessChips(acc) {
    var groupDefs = [
      { key: 'core',        label: 'Core',        cls: 'g-blue' },
      { key: 'workspace',   label: 'Workspace',   cls: 'g-purple' },
      { key: 'operational', label: 'Operational', cls: 'g-teal' },
      { key: 'system',      label: 'System',      cls: 'g-red' }
    ];
    var chips = groupDefs.map(function (g) {
      return '<span class="auth-gchip ' + (acc[g.key] ? g.cls : 'g-off') + '" title="' + g.label + '">' +
             g.label.charAt(0) + '</span>';
    }).join('');
    var n = countEnabledModules(acc);
    var cnt = '<span class="auth-modcount">' + n + ' modul</span>';
    return '<div class="auth-access-summary">' + chips + cnt + '</div>';
  }

  function renderTable() {
    var tbody = $('userTableBody');
    if (!tbody) return;

    var filtered = getFilteredUsers();
    var totalFiltered = filtered.length;
    var totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    var start = (currentPage - 1) * PAGE_SIZE;
    var pageItems = filtered.slice(start, start + PAGE_SIZE);

    /* counter chip + hint — selalu sinkron dengan baris tabel */
    var countEl = $('tableCount');
    if (countEl) countEl.innerHTML = '<i class="fas fa-user"></i> ' + totalFiltered + ' user';
    var hintEl = $('tableCountHint');
    if (hintEl) {
      var totalAll = usersData.length;
      if (totalFiltered !== totalAll) {
        hintEl.textContent = 'filter aktif \u00b7 ' + totalFiltered + ' dari ' + totalAll + ' total';
      } else if (totalPages > 1) {
        hintEl.textContent = totalAll + ' user \u00b7 halaman ' + currentPage + '/' + totalPages;
      } else {
        hintEl.textContent = totalAll + ' total user terdaftar';
      }
    }

    /* pagination bar */
    var pgBar = $('paginationBar');
    if (pgBar) pgBar.style.display = totalFiltered > PAGE_SIZE ? 'flex' : 'none';
    setText('pageInfo', 'Page ' + currentPage + ' / ' + totalPages);
    var prevB = $('pagePrev'), nextB = $('pageNext');
    if (prevB) prevB.disabled = currentPage <= 1;
    if (nextB) nextB.disabled = currentPage >= totalPages;

    if (totalFiltered === 0) {
      var searchVal = $('searchInput') ? $('searchInput').value : '';
      tbody.innerHTML =
        '<tr class="empty-row"><td colspan="5"><div class="auth-empty-state">' +
        '<i class="fas fa-users-slash"></i>' +
        '<div class="empty-title">Tidak ada user ditemukan</div>' +
        '<div class="empty-sub">' + (searchVal ? 'Coba kata kunci atau filter lain' : 'Belum ada user terdaftar') + '</div>' +
        '</div></td></tr>';
      return;
    }

    var html = '';
    pageItems.forEach(function (u) {
      var acc = accessFor(u);
      var status = (u.status || 'ACTIVE').toUpperCase();
      var granted = u.granted_by ? 'granted by @' + u.granted_by : '';

      var actions;
      if (u.role === 'MASTER') {
        actions = '<button class="auth-btn auth-btn-ghost auth-btn-icon" title="Akun Master - Terproteksi" tabindex="-1"><i class="fas fa-lock"></i></button>';
      } else if (canEditUser(u)) {
        actions =
          '<button class="auth-btn auth-btn-ghost auth-btn-icon" title="Edit Access Control" data-edit-user="' + escapeHtml(u.username) + '"><i class="fas fa-key"></i></button>' +
          '<button class="auth-btn auth-btn-danger-ghost auth-btn-icon" title="Hapus User" data-delete-user="' + escapeHtml(u.username) + '"><i class="fas fa-trash"></i></button>';
      } else {
        var lockTitle = isViewOnly
          ? 'Mode lihat-saja: tidak memiliki hak modifikasi'
          : 'Hanya Master yang dapat mengubah Admin lain';
        actions = '<button class="auth-btn auth-btn-ghost auth-btn-icon" title="' + lockTitle + '" tabindex="-1"><i class="fas fa-lock"></i></button>';
      }

      html +=
        '<tr>' +
          '<td>' +
            '<div class="auth-user-cell">' +
              '<div class="auth-avatar ' + avatarGradient(u.username) + '">' + escapeHtml(initials(u.username)) + '</div>' +
              '<div class="auth-user-meta">' +
                '<div class="auth-user-name">@' + escapeHtml(u.username) + '</div>' +
                (granted ? '<div class="auth-user-sub">' + escapeHtml(granted) + '</div>' : '') +
              '</div>' +
            '</div>' +
          '</td>' +
          '<td><span class="auth-role-badge ' + (ROLE_CLASS[u.role] || '') + '">' + escapeHtml(u.role || 'MEMBER') + '</span></td>' +
          '<td>' +
            (status === 'PENDING'
              ? '<span class="auth-status-pill pending"><i class="fas fa-hourglass-half"></i> PENDING</span>'
              : '<span class="auth-status-pill active"><i class="fas fa-circle-check"></i> ACTIVE</span>') +
          '</td>' +
          '<td>' + renderAccessChips(acc) + '</td>' +
          '<td class="text-right"><div class="auth-action-group">' + actions + '</div></td>' +
        '</tr>';
    });
    tbody.innerHTML = html;
  }

  /* ============================================================
     ACCESS MATRIX (Edit modal) — dibangun dari ACCESS_TREE
     ============================================================ */
  function buildPermMatrix() {
    var matrix = $('permMatrix');
    if (!matrix) return;
    var html = '';

    ACCESS_TREE.forEach(function (g) {
      html +=
        '<div class="auth-perm-group" data-group="' + g.key + '">' +
          '<div class="auth-perm-group-head">' +
            '<label class="auth-perm-master" data-key="' + g.key + '">' +
              '<input type="checkbox" data-role="group">' +
              /* Checkmark digambar murni via CSS (.perm-box::before) — TIDAK bergantung font/CDN apa pun, pasti selalu tampil */
              '<span class="perm-box" aria-hidden="true"></span>' +
              '<span class="perm-gicon ' + (g.color || 'blue') + '"><i class="fas ' + g.icon + '"></i></span>' +
              '<span class="perm-gtext">' +
                '<span class="perm-glabel">' + escapeHtml(g.label) + '</span>' +
                '<span class="perm-gdesc">' + escapeHtml(g.desc) + '</span>' +
              '</span>' +
            '</label>' +
          '</div>' +
          '<div class="auth-perm-children">';

      g.items.forEach(function (it) {
        html += renderPermItem(it, 0);
      });

      html += '</div></div>';
    });

    matrix.innerHTML = html;

    /* wire events: parent/grup toggle -> cascade ke anak; leaf toggle -> propagate ke atas */
    $$('#permMatrix input[type="checkbox"]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var label = cb.closest('.auth-perm-master') || cb.closest('.auth-perm-item');
        var key = label.getAttribute('data-key');
        var f = findNode(key);
        var hasKids = f && ((f.isGroup && f.node.items && f.node.items.length) ||
                            (!f.isGroup && f.node.children && f.node.children.length));
        if (hasKids) setSubtree(key, cb.checked);
        /* FIX v2.4.0 (BUG CENTANG TIDAK MUNCUL): klik sub-menu TANPA anak (leaf,
           mis. Rek Validator) tidak pernah lewat setSubtree/setChecked sehingga
           class visual 'checked' tidak terpasang -> kotak tampak kosong padahal
           state checkbox true. Pasang langsung + flash feedback animasi. */
        label.classList.toggle('checked', cb.checked);
        flashPerm(key, cb.checked);
        refreshAllParents();
        syncAllCheckedVisual(); /* jaring pengaman: semua baris dipaksa sinkron */
        updateSummary();
      });
    });
  }

  function renderPermItem(it, depth) {
    var hasKids = it.children && it.children.length;
    var tag = hasKids
      ? '<span class="perm-tag" title="Centang untuk mengaktifkan ' + it.children.length + ' sub-menu di dalamnya">grup &middot; ' + it.children.length + ' sub</span>'
      : '';
    var html =
      '<div class="auth-perm-node" data-node="' + it.key + '">' +
        '<label class="auth-perm-item" data-key="' + it.key + '">' +
          '<input type="checkbox">' +
          '<span class="perm-box" aria-hidden="true"></span>' +
          '<i class="fas ' + it.icon + ' perm-icon"></i>' +
          '<span class="perm-label">' + escapeHtml(it.label) + '</span>' +
          tag +
        '</label>';

    if (hasKids) {
      html += '<div class="auth-perm-subtree">';
      it.children.forEach(function (c) {
        html += renderPermItem(c, depth + 1);
      });
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  function findNode(key) {
    var found = null;
    ACCESS_TREE.forEach(function (g) {
      if (found) return;
      if (g.key === key) { found = { isGroup: true, node: g, parent: null }; return; }
      /* v2.5.0 — rekursif: mendukung sub-menu bertingkat (mis. pk_jadwal_pasaran) */
      (function walk(list, parent) {
        list.forEach(function (n) {
          if (found) return;
          if (n.key === key) { found = { isGroup: false, node: n, parent: parent }; return; }
          if (n.children) walk(n.children, n.key);
        });
      })(g.items, g.key);
    });
    return found;
  }

  function getChecked(key) {
    var item = document.querySelector('#permMatrix [data-key="' + key + '"] input');
    return item ? item.checked : false;
  }

  function setChecked(key, val) {
    var item = document.querySelector('#permMatrix [data-key="' + key + '"] input');
    if (item) {
      item.checked = !!val;
      var wrap = item.closest('.auth-perm-master') || item.closest('.auth-perm-item');
      if (wrap) wrap.classList.toggle('checked', !!val);
    }
  }

  /* Set checkbox untuk node + seluruh subtree-nya (jika grup).
     Anak yang berubah state diberi highlight flash agar jelas tercentang.
     v2.5.0 — rekursif penuh: menangani sub-menu bertingkat (pk_*). */
  function setSubtree(key, val) {
    var found = findNode(key);
    if (!found) return;
    setChecked(key, val);
    var roots = found.isGroup ? found.node.items : (found.node.children || null);
    (function walk(list) {
      if (!list) return;
      list.forEach(function (n) {
        flashPerm(n.key, val);
        setChecked(n.key, val);
        if (n.children) walk(n.children);
      });
    })(roots);
  }

  /* Efek visual singkat pada baris sub-menu ketika ikut tercentang oleh induknya */
  function flashPerm(key, val) {
    var el = document.querySelector('#permMatrix [data-key="' + key + '"]');
    if (!el) return;
    el.classList.remove('perm-flash-on', 'perm-flash-off');
    void el.offsetWidth;
    el.classList.add(val ? 'perm-flash-on' : 'perm-flash-off');
    setTimeout(function () { el.classList.remove('perm-flash-on', 'perm-flash-off'); }, 900);
  }

  /* Kumpulkan key node + seluruh keturunannya */
  function collectKeys(it, fn) {
    fn(it.key);
    if (it.children) it.children.forEach(function (c) { collectKeys(c, fn); });
  }

  /* Hitung ulang state SEMUA induk (item beranak + 4 grup):
     - item beranak : checked jika ada anak aktif, indeterminate jika parsial
     - grup         : checked jika semua aktif, indeterminate jika parsial  */
  function refreshAllParents() {
    /* 1) Item beranak (banking_tools, authority_panel) */
    ACCESS_TREE.forEach(function (g) {
      g.items.forEach(function (it) {
        if (!it.children) return;
        syncParentItem(it.key);
        it.children.forEach(function (c) { if (c.children) syncParentItem(c.key); });
      });
    });

    /* 2) Grup tingkat atas */
    ACCESS_TREE.forEach(function (g) {
      var any = false, all = true, total = 0;
      g.items.forEach(function (it) {
        collectKeys(it, function (k) {
          total++;
          if (getChecked(k)) any = true; else all = false;
        });
      });
      var gcb = document.querySelector('#permMatrix .auth-perm-master[data-key="' + g.key + '"] input');
      if (gcb) {
        if (any && all)      { gcb.indeterminate = false; gcb.checked = true; }
        else if (any)        { gcb.indeterminate = true;  gcb.checked = false; }
        else                 { gcb.indeterminate = false; gcb.checked = false; }
        var w2 = gcb.closest('.auth-perm-master');
        if (w2) w2.classList.toggle('checked', any);
      }
    });
  }

  function syncParentItem(ikey) {
    var wrap = document.querySelector('#permMatrix .auth-perm-node[data-node="' + ikey + '"]');
    if (!wrap) return;
    var cb  = wrap.querySelector(':scope > label input');
    var sub = wrap.querySelector(':scope > .auth-perm-subtree');
    if (!cb || !sub) return;
    var kids = Array.prototype.slice.call(sub.querySelectorAll('input'));
    var anyK = kids.some(function (k) { return k.checked; });
    var allK = kids.length > 0 && kids.every(function (k) { return k.checked; });
    cb.indeterminate = anyK && !allK;
    cb.checked = anyK;
    var w = cb.closest('.auth-perm-item');
    if (w) w.classList.toggle('checked', anyK);
  }

  function collectAccessFromMatrix() {
    var access = {};
    /* 1) Kumpulkan state mentah semua checkbox */
    $$('#permMatrix [data-key]').forEach(function (el) {
      var key = el.getAttribute('data-key');
      var cb = el.querySelector('input[type="checkbox"]');
      if (cb) access[key] = !!cb.checked;
    });
    /* 2) Konsistensi hierarki: grup/item-induk wajib true jika ada
          keturunan aktif — agar menu induk tidak tersembunyi di Dashboard
          padahal sub-modulnya diizinkan (indeterminate != false). */
    ACCESS_TREE.forEach(function (g) {
      var anyGroup = false;
      g.items.forEach(function (it) {
        var anyItem = false;
        collectKeys(it, function (k) { if (access[k]) anyItem = true; });
        if (it.children) access[it.key] = access[it.key] || anyItem;
        if (access[it.key]) anyGroup = true;
      });
      access[g.key] = access[g.key] || anyGroup;
    });
    return access;
  }

  function applyAccessToMatrix(acc) {
    $$('#permMatrix [data-key]').forEach(function (el) {
      var key = el.getAttribute('data-key');
      var cb = el.querySelector('input[type="checkbox"]');
      if (!cb) return;
      var wrap = cb.closest('.auth-perm-master') || cb.closest('.auth-perm-item');
      var val = !!(acc && acc[key]);
      cb.checked = val;
      cb.indeterminate = false;
      if (wrap) wrap.classList.toggle('checked', val);
    });
    /* recompute indeterminate/checked utk semua induk */
    refreshAllParents();
    syncAllCheckedVisual(); /* FIX v2.4.0 */
    updateSummary();
  }

  /* FIX v2.4.0 — paksa class visual 'checked' pada SEMUA label mengikuti
     state input aktual. Menjamin centang SELALU tampak apa pun jalurnya. */
  function syncAllCheckedVisual() {
    $$('#permMatrix [data-key]').forEach(function (el) {
      var cb = el.querySelector('input[type="checkbox"]');
      if (cb) el.classList.toggle('checked', !!cb.checked);
    });
  }

  function updateSummary() {
    var acc = collectAccessFromMatrix();
    var n = 0;
    ALL_KEYS.forEach(function (k) { if (acc[k]) n++; });
    var el = $('editSummary');
    if (el) el.textContent = n + ' / ' + (ALL_KEYS.length) + ' modul aktif';
  }

  function setAllPerm(v) {
    $$('#permMatrix input[type="checkbox"]').forEach(function (cb) {
      cb.indeterminate = false;
      cb.checked = !!v;
      var wrap = cb.closest('.auth-perm-master') || cb.closest('.auth-perm-item');
      if (wrap) wrap.classList.toggle('checked', !!v);
    });
    refreshAllParents();
    syncAllCheckedVisual(); /* FIX v2.4.0 */
    updateSummary();
  }

  function presetFull() { setAllPerm(true); }
  function presetCore() {
    setAllPerm(false);
    ['core', 'dashboard', 'profil'].forEach(function (k) { setChecked(k, true); });
    syncAllCheckedVisual(); /* FIX v2.4.0 */
    updateSummary();
  }
  function presetNone() { setAllPerm(false); }

  /* ============================================================
     v2.4.0 — DETEKSI BACKEND LAMA
     Backend lama hanya menyimpan sebagian key: centang sub-menu hilang
     setelah save tanpa peringatan. Setelah save sukses, data user
     di-fetch ulang & dibandingkan; bila ada key yang hilang -> banner
     peringatan keras di modal + toast.
     ============================================================ */
  function verifySavedAccess(username, sentAccess) {
    fetch('/api/users', { headers: { 'x-auth-token': authToken } })
      .then(function (r) { return r.json(); })
      .then(function (list) {
        var arr = Array.isArray(list) ? list : [];
        var u = arr.find(function (x) { return x.username === username; });
        if (!u) return;
        var saved = accessFor(u);
        var lost = Object.keys(sentAccess).filter(function (k) { return sentAccess[k] && !saved[k]; });
        if (lost.length) {
          backendLegacy = true;
          showToast('PERINGATAN: ' + lost.length + ' akses sub-menu TIDAK tersimpan — backend lama terdeteksi. Deploy src/index.js terbaru!', 'error');
        } else {
          backendLegacy = false;
        }
        updateBackendWarn(lost);
      })
      .catch(function () {});
  }

  function updateBackendWarn(lost) {
    var w = $('backendWarn');
    if (!w) return;
    if (backendLegacy) {
      var n = (lost && lost.length) ? lost.length : 'beberapa';
      w.innerHTML = '<i class="fas fa-triangle-exclamation"></i><div>' +
        '<b>Backend lama terdeteksi — ' + n + ' akses sub-menu TIDAK tersimpan ke server.</b> ' +
        'Solusi: deploy file <code>src/index.js</code> terbaru ke Cloudflare Workers, lalu ulangi simpan akses.</div>';
      w.style.display = 'flex';
    } else {
      w.style.display = 'none';
    }
  }

  /* ============================================================
     EDIT ACCESS CONTROL
     ============================================================ */
  function openEdit(username) {
    var u = usersData.find(function (x) { return x.username === username; });
    if (!u) return;
    if (!canEditUser(u)) {
      showToast('Akses ditolak! ' + (isViewOnly ? 'Anda dalam mode lihat-saja.' : (userRole === 'ADMIN' ? 'Admin hanya dapat mengubah user Member.' : 'Tidak memiliki hak akses.')), 'warning');
      return;
    }

    editUsername = username;
    var avatarEl = $('editAvatar');
    if (avatarEl) {
      avatarEl.textContent = initials(u.username);
      avatarEl.className = 'auth-avatar ' + avatarGradient(u.username);
    }
    setText('editUserLabel', '@' + u.username);

    var editRoleSelect = $('editRole');
    if (editRoleSelect) {
      editRoleSelect.value = u.role || 'MEMBER';
      if (userRole === 'ADMIN') {
        editRoleSelect.value = 'MEMBER';
        editRoleSelect.disabled = true;
        editRoleSelect.title = 'Admin hanya dapat mengubah user Member. Master dapat mengubah role.';
      } else {
        editRoleSelect.disabled = false;
        editRoleSelect.title = '';
      }
    }

    var grantEl = $('editGrantedBy');
    if (grantEl) {
      grantEl.textContent = u.granted_by
        ? 'access granted by @' + u.granted_by
        : 'access granted by ' + (userRole === 'MASTER' ? 'master' : 'admin');
    }

    applyAccessToMatrix(accessFor(u));
    updateSummary();
    updateBackendWarn(); /* v2.4.0 — tampilkan banner bila backend lama terdeteksi sebelumnya */

    var modal = $('editModal');
    if (modal) modal.classList.add('active');
  }

  function closeEditModal() {
    var modal = $('editModal');
    if (modal) modal.classList.remove('active');
    editUsername = null;
  }

  function submitEditAccess() {
    if (!editUsername) return;
    var roleSelect = $('editRole');
    var role = roleSelect ? roleSelect.value : 'MEMBER';

    if (userRole === 'ADMIN' && role !== 'MEMBER') {
      showToast('Akses ditolak! Admin hanya dapat mengubah user Member.', 'warning');
      return;
    }

    var access = collectAccessFromMatrix();
    var savedUsername = editUsername; /* v2.4.0 — editUsername dinolkan oleh closeEditModal */

    fetch('/api/users/' + encodeURIComponent(editUsername) + '/access', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': authToken },
      body: JSON.stringify({ role: role, access: access, grantedBy: authToken })
    })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (result && result.success) {
          closeEditModal();
          showToast('Access control @' + savedUsername + ' berhasil diperbarui!', 'success');
          loadUsers();
          /* v2.4.0 — verifikasi data benar-benar tersimpan (deteksi backend lama) */
          verifySavedAccess(savedUsername, access);
        } else {
          showToast((result && result.error) || 'Gagal menyimpan akses', 'error');
        }
      })
      .catch(function () {
        showToast('Kesalahan koneksi', 'error');
      });
  }

  /* ============================================================
     ADD USER MODAL
     ============================================================ */
  function openModal() {
    var m = $('addModal');
    if (m) m.classList.add('active');
  }

  function closeModal() {
    var m = $('addModal');
    if (m) m.classList.remove('active');
  }

  function submitAddUser() {
    var username = ($('addUsername') && $('addUsername').value || '').trim();
    var password = ($('addPassword') && $('addPassword').value || '');
    var role     = ($('addRole')     && $('addRole').value     || '');

    if (!username || !password || !role) {
      showToast('Semua kolom wajib diisi!', 'warning');
      return;
    }

    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': authToken },
      body: JSON.stringify({ username: username, password: password, role: role })
    })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (result && result.success) {
          closeModal();
          showToast('User @' + username + ' berhasil ditambahkan!', 'success');
          if ($('addUsername')) $('addUsername').value = '';
          if ($('addPassword')) $('addPassword').value = '';
          if ($('addRole'))     $('addRole').value = '';
          loadUsers();
        } else {
          showToast((result && result.error) || 'Gagal menambah user', 'error');
        }
      })
      .catch(function () {
        showToast('Kesalahan koneksi', 'error');
      });
  }

  /* ============================================================
     DELETE USER
     ============================================================ */
  function confirmDelete(username) {
    showConfirm({
      icon: 'danger',
      iconFa: 'fa-trash',
      title: 'Hapus User',
      desc: 'User akan dihapus permanen dari database. Aksi ini tidak dapat dibatalkan.',
      target: '@' + username,
      confirmText: 'Hapus',
      cancelText: 'Batal',
      onConfirm: function () {
        fetch('/api/users/' + encodeURIComponent(username), {
          method: 'DELETE',
          headers: { 'x-auth-token': authToken }
        })
          .then(function (res) { return res.json(); })
          .then(function (data) {
            if (data && data.success) {
              showToast('User @' + username + ' berhasil dihapus!', 'success');
              loadUsers();
            } else {
              showToast((data && data.error) || 'Gagal menghapus user', 'error');
            }
          })
          .catch(function () {
            showToast('Kesalahan koneksi', 'error');
          });
      }
    });
  }

  /* ============================================================
     REGISTRATION SETTINGS — LOAD / RENDER / SAVE
     ============================================================ */
  function loadRegisSettings() {
    fetch('/api/settings/registration', { headers: { 'x-auth-token': authToken } })
      .then(function (res) {
        if (!res.ok) return null;
        return res.json();
      })
      .then(function (data) {
        if (data && typeof data === 'object') {
          regisSettings = {
            open: data.open !== undefined ? !!data.open : regisSettings.open,
            defaultRole: data.defaultRole || regisSettings.defaultRole,
            requireApproval: !!data.requireApproval
          };
        }
        renderRegisSettings();
      })
      .catch(function () { renderRegisSettings(); });
  }

  function renderRegisSettings() {
    var openCb = $('regisOpen');
    var apprCb = $('regisApproval');
    var roleSel = $('regisDefaultRole');
    if (openCb)  openCb.checked  = !!regisSettings.open;
    if (apprCb)  apprCb.checked  = !!regisSettings.requireApproval;
    if (roleSel) roleSel.value   = regisSettings.defaultRole || 'MEMBER';

    var st = $('statRegisStatus');
    if (st) {
      st.innerHTML = regisSettings.open
        ? '<span class="auth-status-pill open"><i class="fas fa-circle-check"></i> OPEN</span>'
        : '<span class="auth-status-pill closed"><i class="fas fa-circle-xmark"></i> CLOSED</span>';
    }
    setText('statDefaultRole', regisSettings.defaultRole || 'MEMBER');
  }

  function saveRegisSettings() {
    var payload = {
      open:            $('regisOpen')       ? $('regisOpen').checked       : false,
      defaultRole:     $('regisDefaultRole') ? $('regisDefaultRole').value : 'MEMBER',
      requireApproval: $('regisApproval')   ? $('regisApproval').checked   : false
    };
    fetch('/api/settings/registration', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': authToken },
      body: JSON.stringify(payload)
    })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (result && result.success) {
          regisSettings = payload;
          renderRegisSettings();
          showToast('Konfigurasi registrasi tersimpan!', 'success');
          loadPending();
        } else {
          showToast((result && result.error) || 'Gagal menyimpan konfigurasi', 'error');
        }
      })
      .catch(function () {
        showToast('Kesalahan koneksi', 'error');
      });
  }

  /* ============================================================
     PENDING REGISTRATIONS — LOAD / APPROVE / REJECT
     ============================================================ */
  function loadPending() {
    var wrap = $('pendingWrap');
    var tbody = $('pendingBody');
    fetch('/api/registrations/pending', { headers: { 'x-auth-token': authToken } })
      .then(function (res) {
        if (!res.ok) {
          if (wrap) wrap.style.display = 'none';
          setText('statPending', '0');
          return null;
        }
        return res.json();
      })
      .then(function (list) {
        if (!list) return;
        list = Array.isArray(list) ? list : [];
        setText('statPending2', list.length);
        var pcEl = $('pendingCount');
        if (pcEl) pcEl.innerHTML = '<i class="fas fa-hourglass-half"></i> ' + list.length + ' awaiting';
        if (!list.length) {
          if (wrap) wrap.style.display = 'none';
          return;
        }
        if (wrap) wrap.style.display = 'block';
        if (tbody) {
          tbody.innerHTML = list.map(function (u) {
            return '' +
              '<tr>' +
                '<td>' +
                  '<div class="auth-user-cell">' +
                    '<div class="auth-avatar ' + avatarGradient(u.username) + '">' + escapeHtml(initials(u.username)) + '</div>' +
                    '<div class="auth-user-meta"><div class="auth-user-name">@' + escapeHtml(u.username) + '</div></div>' +
                  '</div>' +
                '</td>' +
                '<td><span class="auth-role-badge ' + (ROLE_CLASS[u.role] || 'role-member') + '">' + escapeHtml(u.role || 'MEMBER') + '</span></td>' +
                '<td><span class="auth-status-pill pending"><i class="fas fa-hourglass-half"></i> PENDING</span></td>' +
                '<td class="text-right"><div class="auth-action-group">' +
                  '<button class="auth-btn auth-btn-success-ghost auth-btn-icon" title="Approve" data-reg-action="approve" data-reg-user="' + escapeHtml(u.username) + '"><i class="fas fa-check"></i></button>' +
                  '<button class="auth-btn auth-btn-danger-ghost auth-btn-icon" title="Reject" data-reg-action="reject" data-reg-user="' + escapeHtml(u.username) + '"><i class="fas fa-times"></i></button>' +
                '</div></td>' +
              '</tr>';
          }).join('');
        }
      })
      .catch(function () {
        if (wrap) wrap.style.display = 'none';
        setText('statPending2', '0');
      });
  }

  function actRegistration(username, action) {
    showConfirm({
      icon: action === 'approve' ? 'info' : 'danger',
      iconFa: action === 'approve' ? 'fa-circle-check' : 'fa-ban',
      title: action === 'approve' ? 'Setujui Registrasi' : 'Tolak Registrasi',
      desc: action === 'approve'
        ? 'User akan diaktifkan dan dapat login ke sistem.'
        : 'User akan ditolak dan dihapus dari antrian pending.',
      target: '@' + username,
      confirmText: action === 'approve' ? 'Setujui' : 'Tolak',
      cancelText: 'Batal',
      onConfirm: function () {
        fetch('/api/registrations/' + encodeURIComponent(username), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-auth-token': authToken },
          body: JSON.stringify({ action: action })
        })
          .then(function (res) { return res.json(); })
          .then(function (result) {
            if (result && result.success) {
              showToast('Registrasi @' + username + ' berhasil ' + (action === 'approve' ? 'disetujui!' : 'ditolak!'),
                action === 'approve' ? 'success' : 'warning');
              loadPending();
              loadUsers();
            } else {
              showToast((result && result.error) || 'Gagal memproses', 'error');
            }
          })
          .catch(function () {
            showToast('Kesalahan koneksi', 'error');
          });
      }
    });
  }

  /* ============================================================
     LOGOUT
     ============================================================ */
  function logout() {
    localStorage.clear();
    window.location.href = '/Login.html';
  }

  /* ============================================================
     AUTH GUARD
     - ADMIN / MASTER           -> full mode
     - MEMBER + authority_panel -> view-only mode
     - selainnya                -> access denied overlay
     ============================================================ */
  function authGuard() {
    authToken = localStorage.getItem('aura_auth_token') || '';
    userRole  = (localStorage.getItem('aura_user_role')  || '').toUpperCase();

    if (!authToken) {
      window.location.href = '/Login.html';
      return Promise.resolve(false);
    }

    return fetch('/api/me', { headers: { 'x-auth-token': authToken } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (data && data.success && data.user) {
          userRole = (data.user.role || userRole).toUpperCase();
          userAccess = data.user.access || {};
        } else {
          try { userAccess = JSON.parse(localStorage.getItem('aura_user_access') || '{}'); } catch (e) { userAccess = {}; }
        }

        var allowed = (userRole === 'ADMIN' || userRole === 'MASTER') || !!userAccess.authority_panel;
        if (!allowed) {
          var denied = $('accessDenied');
          if (denied) {
            denied.style.display = 'flex';
            var main = $('authShell');
            if (main) main.style.display = 'none';
            var tb = document.querySelector('.auth-topbar');
            if (tb) tb.style.display = 'none';
          } else {
            window.location.href = '/Dashboard.html';
          }
          return false;
        }

        isViewOnly = !(userRole === 'ADMIN' || userRole === 'MASTER');
        applyPermissionUI();

        var chip = $('topRoleChip');
        if (chip) {
          if (isViewOnly) {
            chip.innerHTML = '<i class="fas fa-eye"></i> VIEW-ONLY';
            chip.classList.add('view-only');
          } else {
            chip.innerHTML = '<i class="fas fa-' + (userRole === 'MASTER' ? 'crown' : 'shield-halved') + '"></i> ' + userRole;
            chip.classList.add(userRole === 'MASTER' ? 'chip-master' : 'chip-admin');
          }
        }
        return true;
      })
      .catch(function () {
        /* jaringan gagal: fallback ke role lokal */
        var allowed = (userRole === 'ADMIN' || userRole === 'MASTER');
        if (!allowed) {
          window.location.href = '/Dashboard.html';
          return false;
        }
        applyPermissionUI();
        return true;
      });
  }

  /* Sembunyikan tab & tombol sesuai permission user aktif */
  function applyPermissionUI() {
    var canUsers = tabAllowed('user_management');
    var canRegis = tabAllowed('registration_control');

    var sideUsers = $('sideUsers');
    var sideRegis = $('sideRegis');
    if (sideUsers) sideUsers.style.display = canUsers ? '' : 'none';
    if (sideRegis) sideRegis.style.display = canRegis ? '' : 'none';

    var noMod = $('noModuleState');
    if (!canUsers && !canRegis) {
      var shell = $('authShell');
      if (shell) shell.classList.add('all-hidden');
      if (noMod) noMod.style.display = 'flex';
      var content = document.querySelector('.auth-content');
      if (content) content.style.display = 'none';
      return;
    }

    /* Add User hanya untuk role yang boleh memutasi */
    var addBtn = $('addUserBtn');
    if (addBtn && isViewOnly) addBtn.style.display = 'none';

    /* Aktifkan tab pertama yang tersedia */
    if (canUsers) {
      switchView('users');
    } else if (canRegis) {
      switchView('registration');
    }
  }

  /* ============================================================
     INIT — wire events after DOM ready
     ============================================================ */
  function init() {
    authGuard().then(function (ok) {
      if (!ok) return;

      /* Mode embed: jika dirender di dalam dashboard (iframe) -> layout compact */
      try {
        if (window.self !== window.top) {
          document.body.classList.add('in-iframe');
        }
      } catch (e) { /* cross-origin — anggap standalone */ }

      /* Sidebar sub-menu */
      $$('.auth-side-item').forEach(function (el) {
        el.addEventListener('click', function () {
          switchView(el.getAttribute('data-view'));
        });
      });

      /* Search + filters */
      var searchInput = $('searchInput');
      if (searchInput) {
        var debounce;
        searchInput.addEventListener('input', function () {
          clearTimeout(debounce);
          debounce = setTimeout(function () { currentPage = 1; renderTable(); }, 120);
        });
      }
      var fr = $('filterRole'), fs = $('filterStatus');
      if (fr) fr.addEventListener('change', function () { currentPage = 1; renderTable(); });
      if (fs) fs.addEventListener('change', function () { currentPage = 1; renderTable(); });

      /* Pagination */
      var pPrev = $('pagePrev'), pNext = $('pageNext');
      if (pPrev) pPrev.addEventListener('click', function () { if (currentPage > 1) { currentPage--; renderTable(); } });
      if (pNext) pNext.addEventListener('click', function () { currentPage++; renderTable(); });

      /* Refresh buttons */
      var rU = $('refreshUsersBtn');
      if (rU) rU.addEventListener('click', function () { loadUsers(); showToast('Data user di-refresh', 'info'); });
      var rR = $('refreshRegisBtn');
      if (rR) rR.addEventListener('click', function () { loadRegisSettings(); loadPending(); showToast('Data registrasi di-refresh', 'info'); });

      /* Event delegation: edit/delete buttons */
      var userTableBody = $('userTableBody');
      if (userTableBody) {
        userTableBody.addEventListener('click', function (e) {
          var editBtn = e.target.closest('[data-edit-user]');
          var delBtn = e.target.closest('[data-delete-user]');
          if (editBtn) { openEdit(editBtn.getAttribute('data-edit-user')); }
          if (delBtn) { confirmDelete(delBtn.getAttribute('data-delete-user')); }
        });
      }

      /* Event delegation: approve/reject buttons */
      var pendingBody = $('pendingBody');
      if (pendingBody) {
        pendingBody.addEventListener('click', function (e) {
          var btn = e.target.closest('[data-reg-action]');
          if (btn) { actRegistration(btn.getAttribute('data-reg-user'), btn.getAttribute('data-reg-action')); }
        });
      }

      /* Add-user modal */
      $$('[data-action="openAddUser"]').forEach(function (b) { b.addEventListener('click', openModal); });
      $$('[data-action="closeAddUser"]').forEach(function (b) { b.addEventListener('click', closeModal); });
      var submitAdd = $('submitAddUser');
      if (submitAdd) submitAdd.addEventListener('click', submitAddUser);

      /* Edit-access modal */
      $$('[data-action="closeEdit"]').forEach(function (b) { b.addEventListener('click', closeEditModal); });
      $$('[data-action="permAll"]').forEach(function (b) { b.addEventListener('click', function () { setAllPerm(true); }); });
      $$('[data-action="permNone"]').forEach(function (b) { b.addEventListener('click', function () { setAllPerm(false); }); });
      $$('[data-action="presetFull"]').forEach(function (b) { b.addEventListener('click', presetFull); });
      $$('[data-action="presetCore"]').forEach(function (b) { b.addEventListener('click', presetCore); });
      $$('[data-action="presetNone"]').forEach(function (b) { b.addEventListener('click', presetNone); });
      var submitEdit = $('submitEditAccess');
      if (submitEdit) submitEdit.addEventListener('click', submitEditAccess);

      /* Registration settings */
      $$('[data-action="saveRegis"]').forEach(function (b) { b.addEventListener('click', saveRegisSettings); });

      /* Logout */
      $$('[data-action="logout"]').forEach(function (b) { b.addEventListener('click', logout); });

      /* Dashboard link */
      $$('[data-action="goDashboard"]').forEach(function (b) {
        b.addEventListener('click', function () {
          /* Jika inline di dashboard: kembalikan tampilan dashboard pada parent */
          try {
            if (window.self !== window.top && window.parent && typeof window.parent.switchToDashboard === 'function') {
              window.parent.switchToDashboard();
              return;
            }
          } catch (e) {}
          window.location.href = '/Dashboard.html';
        });
      });

      /* Confirm dialog */
      var confirmBtn = $('confirmConfirmBtn');
      if (confirmBtn) {
        confirmBtn.addEventListener('click', function () {
          var cb = confirmCallback;
          closeConfirm();
          if (typeof cb === 'function') {
            try { cb(); } catch (e) { console.error('[authority-pro] confirm callback error', e); }
          }
        });
      }
      var cancelBtn = $('confirmCancelBtn');
      if (cancelBtn) cancelBtn.addEventListener('click', closeConfirm);

      /* Overlay click close + Esc */
      $$('.auth-modal-overlay').forEach(function (overlay) {
        overlay.addEventListener('click', function (e) {
          if (e.target === overlay) overlay.classList.remove('active');
        });
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          $$('.auth-modal-overlay.active').forEach(function (m) { m.classList.remove('active'); });
        }
      });

      /* Build matrix + initial load */
      buildPermMatrix();
      loadUsers();
      loadPending();

      /* v2.4.0 — badge versi UI di modal Edit Access: bukti file baru termuat */
      var verEl = $('uiVer');
      if (verEl) verEl.textContent = 'UI v' + UI_VERSION;
    });
  }

  /* ============================================================
     PUBLIC API
     ============================================================ */
  window.__AUTH = {
    openModal:         openModal,
    closeModal:        closeModal,
    submitAddUser:     submitAddUser,
    openEdit:          openEdit,
    closeEditModal:    closeEditModal,
    submitEditAccess:  submitEditAccess,
    setAllPerm:        setAllPerm,
    confirmDelete:     confirmDelete,
    saveRegisSettings: saveRegisSettings,
    actRegistration:   actRegistration,
    switchView:        switchView,
    logout:            logout
  };

  window.switchView = switchView;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
