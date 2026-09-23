/* ============================================================
   AURA.OS // DASHBOARD-PRO.JS  v3.1
   Professional rendering logic for Dashboard, Profil, and
   IP Whitelist panels. Replaces inline HTML stubs with
   polished pro layouts rendered from JS.
   v3.1: akses per SUB-MENU (32 key) — kartu modul, quick access
   & hero count mengikuti akses granular; refreshAccessUI() untuk
   sinkronisasi live saat access user diubah dari Authority Panel.

   Public API (window):
     - DASHBOARD   (render / refresh dashboard panel)
     - PROFILE     (load + render profile panel)
     - IPWL        (load + render + manage IP whitelist panel)
   Patches:
     - window.switchToDashboard / switchToProfil / switchToIpWhitelist
       are wrapped on init to trigger Pro rendering.
   ============================================================ */

(function () {
  'use strict';

  // ============================================================
  // HELPERS
  // ============================================================
  function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function safeJson(str, fallback) {
    try { return JSON.parse(str); } catch (e) { return fallback; }
  }

  function getLS(key, fallback) {
    var v = localStorage.getItem(key);
    if (v === null || v === undefined) return fallback;
    return v;
  }

  function formatRelativeTime(ts) {
    if (!ts) return '-';
    var d = new Date(ts);
    if (isNaN(d.getTime())) return escapeHtml(ts);
    var now = Date.now();
    var diff = Math.floor((now - d.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
  }

  function formatDateTime(ts) {
    if (!ts) return '-';
    var d = new Date(ts);
    if (isNaN(d.getTime())) return escapeHtml(ts);
    return d.toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  function getToken() {
    return getLS('aura_auth_token', '');
  }

  function genSessionId() {
    var chars = 'abcdef0123456789';
    var id = '';
    for (var i = 0; i < 8; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
    return id + '…';
  }

  function showToastSafe(msg, type) {
    if (typeof showToast === 'function') showToast(msg, type);
    else if (typeof window.toast === 'function') window.toast(msg, type);
    else console.log('[toast:' + (type || 'info') + ']', msg);
  }

  function logSafe(msg) {
    if (typeof addTerminalLog === 'function') {
      try { addTerminalLog(msg); } catch (e) {}
    }
  }

  // ============================================================
  // DASHBOARD
  // ============================================================
  var DASHBOARD = {
    accessMap: {},
    role: 'MEMBER',
    username: 'User',
    stats: { activeModules: 0, systemHealth: 99, whitelistOn: false, dataVersion: 0 },
    _liveLoaded: false,

    // --- Module catalog (22 modules, 4 categories) ---
    categories: {
      core:        { name: 'Core',        icon: 'fa-gauge-high',   color: 'blue' },
      workspace:   { name: 'Workspace',   icon: 'fa-briefcase',    color: 'teal' },
      operational: { name: 'Operational', icon: 'fa-diagram-project', color: 'orange' },
      system:      { name: 'System',      icon: 'fa-server',       color: 'purple' }
    },

    modules: [
      // CORE
      { cat: 'core', color: 'blue',   icon: 'fa-display',         name: 'Dashboard',       desc: 'Main control panel & system overview',   badge: 'live',       badgeText: 'Live',      access: null,                  action: 'switchToDashboard' },
      { cat: 'core', color: 'purple', icon: 'fa-id-card-clip',    name: 'Profil',          desc: 'Identity, password & security audit',    badge: 'live',       badgeText: 'Live',      access: null,                  action: 'switchToProfil' },
      // WORKSPACE
      { cat: 'workspace', color: 'teal',   icon: 'fa-landmark',         name: 'Rek Validator',    desc: 'Validasi rekening via 1 database',      badge: 'live',  badgeText: 'v1.5.0',   access: 'rek_validator',     href: '/Validator.html' },
      { cat: 'workspace', color: 'blue',   icon: 'fa-building-columns',  name: 'Bank Processor', desc: 'Formatter & validator rekening bank',  badge: 'live',  badgeText: 'v2.0.0',   access: 'bank_processor',    href: '/Bank.html' },
      // OPERATIONAL
      { cat: 'operational', color: 'orange', icon: 'fa-money-bill-trend-up', name: 'Saldo Pencairan', desc: 'Monitor rekening & pencairan saldo', badge: 'live',    badgeText: 'v1.0.0',   access: 'saldo_pencairan',   action: 'loadPencairan' },
      { cat: 'operational', color: 'green',  icon: 'fa-wallet',              name: 'Saldo QRIS',      desc: 'Saldo QRIS 4 provider + kalkulator saldo bersih', badge: 'live', badgeText: 'v1.0.0', access: 'saldo_qris', action: 'loadSaldoQris' },
      { cat: 'operational', color: 'pink',   icon: 'fa-magnifying-glass-chart', name: 'P2M Analyzer', desc: 'P2M vs Zonamain vs Report analysis',  badge: 'live',    badgeText: 'v2.0.0',   access: 'p2m_analyzer',      action: 'analyzer' },
      { cat: 'operational', color: 'purple', icon: 'fa-satellite-dish',  name: 'XPAY Analyzer',      desc: 'XPAY transaction analyzer engine',     badge: 'live',       badgeText: 'v2.0.0',   access: 'xpay_analyzer',     action: 'xpayChecker' },
      { cat: 'operational', color: 'orange', icon: 'fa-file-invoice-dollar', name: 'XPAY Settlement', desc: 'XPAY settlement reconciliation',     badge: 'live',    badgeText: 'v2.0.0',   access: 'xpay_settlement',   action: 'xpayFull' },
      { cat: 'operational', color: 'teal',   icon: 'fa-clipboard-check', name: 'Settlement Checker', desc: 'Cek settlement per tanggal',          badge: 'live',       badgeText: 'v1.0.0',   access: 'settlement_checker', action: 'xpaySettlementChecker' },
      { cat: 'operational', color: 'purple', icon: 'fa-chart-bar',       name: 'MNPAY Analyzer',     desc: 'MNPAY payment flow analyzer',          badge: 'soon',       badgeText: 'Soon',     access: 'mnpay_analyzer',    action: 'comingSoon' },
      { cat: 'operational', color: 'blue',   icon: 'fa-book-open',       name: 'Syair Database',     desc: 'Access shio prediction engine',        badge: 'live',       badgeText: 'v2.1.0',   access: 'syair_database',    href: '/Syair.html' },
      { cat: 'operational', color: 'purple', icon: 'fa-brain',           name: 'AI Prediction',      desc: 'Neural probability calculation',       badge: 'live',       badgeText: 'v3.0.0',   access: 'ai_prediction',     href: '/Prediksi.html' },
      { cat: 'operational', color: 'red',    icon: 'fa-fire-flame-curved', name: 'Gas Slot Engine',  desc: 'AI Slot Gacor Predictor System',       badge: 'info',       badgeText: 'v1.0.0',   access: 'gas_slot_engine',   action: 'appInfo' },
      { cat: 'operational', color: 'green',  icon: 'fa-calendar-day',    name: 'My Event',           desc: 'Manage active events',                 badge: 'live',       badgeText: 'v1.0.0',   access: 'my_event',          action: 'switchToMyEvent' },
      { cat: 'operational', color: 'orange', icon: 'fa-clock-rotate-left', name: 'History Event',    desc: 'Event history & logs',                 badge: 'soon',       badgeText: 'Soon',     access: 'history_event',     action: 'comingSoon' },
      { cat: 'operational', color: 'green',  icon: 'fa-calculator',      name: 'PG Report',          desc: 'PG Soft credit calculator engine',     badge: 'live',       badgeText: 'v5.0.0',   access: 'pg_report',         action: 'pgReport' },
      { cat: 'operational', color: 'pink',   icon: 'fa-image',           name: 'Edit Bukti',         desc: 'Edit & manage proof of payment',       badge: 'live',       badgeText: 'v1.0.0',   access: 'edit_bukti',        action: 'editBukti' },
      { cat: 'operational', color: 'orange', icon: 'fa-bookmark',        name: 'Keep Memo',          desc: 'Simpan & kelola catatan memo',         badge: 'live',       badgeText: 'v1.0.0',   access: 'keep_memo',         action: 'keepMemo' },
      // SYSTEM
      { cat: 'system', color: 'blue',   icon: 'fa-key',            name: 'API Key',         desc: 'Manage API credentials',          badge: 'live',       badgeText: 'v2.0.0',   access: 'api_key',           action: 'apiKey' },
      { cat: 'system', color: 'red',    icon: 'fa-shield-halved', name: 'IP Whitelist',    desc: 'Kelola whitelist IP login',       badge: 'live',       badgeText: 'v1.0.0',   access: 'ip_whitelist',      action: 'ipWhitelist' },
      { cat: 'system', color: 'orange', icon: 'fa-sliders',       name: 'Setting',         desc: 'System configuration panel',      badge: 'info',       badgeText: 'v1.2.0',   access: 'setting',           action: 'setting' },
      { cat: 'system', color: 'purple', icon: 'fa-user-gear',     name: 'Authority Panel', desc: 'Admin access & user management',  badge: 'restricted', badgeText: 'Restricted', access: 'authority_panel', action: 'authority' }
    ],

    // --- Access handling ---
    /* Peta sub-menu -> menu induk (migrasi data legacy level-menu).
       Harus sinkron dengan CHILD_PARENT authority-pro.js & CHILD_TO_PARENT src/index.js */
    SUBMENU_PARENT: {
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
    },

    initAccess: function () {
      this.role = (getLS('aura_user_role', 'MEMBER') || 'MEMBER').toUpperCase();
      this.username = getLS('aura_auth_token', 'User') || 'User';
      var raw = getLS('aura_user_access', '');
      this.accessMap = safeJson(raw, {}) || {};
    },

    hasAccess: function (key) {
      if (!key) return true;
      // MASTER = full bypass
      if (this.role === 'MASTER') return true;
      // ADMIN bypass per existing Dashboard.html policy? Only MASTER bypasses.
      // Keep ADMIN subject to access map (mirrors applyAccess behavior).
      if (this.accessMap[key] === true) return true;
      // Migrasi legacy: data lama hanya punya akses level menu —
      // key sub-menu yang belum pernah disimpan mewarisi induknya.
      if (!(key in this.accessMap)) {
        var parent = this.SUBMENU_PARENT[key];
        if (parent && this.accessMap[parent] === true) return true;
      }
      return false;
    },

    // --- Action router ---
    triggerAction: function (action) {
      var map = {
        loadPencairan:            'switchToPencairan',
        loadSaldoQris:            'switchToSaldoQris',
        analyzer:                 'switchToAnalyzer',
        xpayChecker:              'switchToXpayChecker',
        xpayFull:                 'switchToXpayFull',
        xpaySettlementChecker:    'switchToXpaySettlement',
        editBukti:                'switchToEditBukti',
        apiKey:                   'switchToApiKey',
        ipWhitelist:              'switchToIpWhitelist',
        pgReport:                 'switchToPgReport',
        authority:                'switchToAuthority',
        switchToDashboard:        'switchToDashboard',
        switchToProfil:           'switchToProfil',
        switchToMyEvent:          'switchToMyEvent'
      };
      var fn = map[action];
      if (fn && typeof window[fn] === 'function') {
        try { window[fn](); } catch (e) { console.error('[dashboard-pro] action error', e); }
        return;
      }
      // Fall back to handleAction for misc actions (setting/comingSoon/appInfo/keepMemo)
      if (typeof window.handleAction === 'function') {
        try { window.handleAction(action); } catch (e) { console.error('[dashboard-pro] handleAction error', e); }
      } else {
        showToastSafe('Aksi tidak tersedia: ' + action, 'warning');
      }
    },

    // --- Greeting helper ---
    _greeting: function () {
      var h = new Date().getHours();
      if (h < 11)  return { word: 'Selamat pagi',  icon: 'fa-sun' };
      if (h < 15)  return { word: 'Selamat siang', icon: 'fa-cloud-sun' };
      if (h < 19)  return { word: 'Selamat sore',  icon: 'fa-cloud-moon' };
      return            { word: 'Selamat malam',  icon: 'fa-moon' };
    },

    // --- Render: hero ---
    _renderHero: function () {
      var g = this._greeting();
      var name = this.username || 'User';
      var initial = (name.charAt(0) || 'U').toUpperCase();
      var role = this.role;
      var session = genSessionId();
      var moduleCount = this.modules.filter(function (m) { return DASHBOARD.hasAccess(m.access); }).length;

      return '' +
        '<div class="pro-hero">' +
          '<div class="pro-hero-body">' +
            '<div class="pro-hero-eyebrow"><span class="pulse-dot"></span> AURA.OS // DASHBOARD</div>' +
            '<h1 class="pro-hero-title">' + g.word + ', <span class="accent">' + escapeHtml(name) + '</span> <i class="fas ' + g.icon + '" style="font-size:0.7em; opacity:0.7; margin-left:6px;"></i></h1>' +
            '<p class="pro-hero-subtitle">Quantum interface loaded. All systems operational. Pilih modul di bawah untuk memulai sesi kerja Anda.</p>' +
            '<div class="pro-hero-meta">' +
              '<span class="pro-hero-meta-item"><i class="fas fa-microchip"></i> Session <strong style="color:var(--text-secondary);">' + session + '</strong></span>' +
              '<span class="pro-hero-meta-divider"></span>' +
              '<span class="pro-hero-meta-item"><i class="fas fa-user-tag"></i> Role <strong style="color:var(--text-secondary);">' + escapeHtml(role) + '</strong></span>' +
              '<span class="pro-hero-meta-divider"></span>' +
              '<span class="pro-hero-meta-item"><i class="fas fa-cubes"></i> Modules <strong style="color:var(--text-secondary);">' + moduleCount + '</strong></span>' +
            '</div>' +
          '</div>' +
          '<div class="pro-hero-avatar">' +
            '<div class="pro-hero-avatar-chip">' + escapeHtml(initial) + '</div>' +
            '<div class="pro-hero-avatar-info">' +
              '<span class="label">Signed in</span>' +
              '<span class="value">' + escapeHtml(name) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>';
    },

    // --- Render: stats ---
    _renderStats: function () {
      var active = this.stats.activeModules || this.modules.filter(function (m) { return DASHBOARD.hasAccess(m.access); }).length;
      var health = this.stats.systemHealth;
      var wl = this.stats.whitelistOn;
      var ver = this.stats.dataVersion || 0;

      return '' +
        '<div class="pro-stats-grid">' +
          this._statCard('blue',    'fa-cubes',           'Active Modules',     active, 'up',   '+' + Math.max(0, active - 16) + ' this week', 'Modules ready to use') +
          this._statCard('success', 'fa-heart-pulse',     'System Health',      health + '%', health > 95 ? 'up' : 'flat', health > 95 ? 'Optimal' : 'Stable', 'Worker + D1 status') +
          this._statCard(wl ? 'success' : 'warning', 'fa-shield-halved', 'Whitelist Protection', wl ? 'ON' : 'OFF', wl ? 'up' : 'flat', wl ? 'Enforced' : 'Disabled', wl ? 'IP filter active' : 'Open login mode') +
          this._statCard('purple',  'fa-code-branch',     'Data Version',       'v' + ver, 'flat', 'Synced', 'Last DB sync state') +
        '</div>';
    },

    _statCard: function (tone, icon, label, value, trend, trendText, foot) {
      var trendIcon = trend === 'up' ? 'fa-arrow-trend-up' : trend === 'down' ? 'fa-arrow-trend-down' : 'fa-minus';
      return '' +
        '<div class="pro-stat-card ' + tone + '" style="animation-delay:0.05s">' +
          '<div class="pro-stat-header">' +
            '<div class="pro-stat-icon"><i class="fas ' + icon + '"></i></div>' +
            '<span class="pro-stat-trend ' + trend + '"><i class="fas ' + trendIcon + '"></i> ' + escapeHtml(trendText) + '</span>' +
          '</div>' +
          '<div class="pro-stat-label">' + escapeHtml(label) + '</div>' +
          '<div class="pro-stat-value" data-stat-target="' + escapeHtml(String(value)) + '">' + escapeHtml(String(value)) + '</div>' +
          '<div class="pro-stat-foot"><i class="fas fa-circle-info"></i> ' + escapeHtml(foot) + '</div>' +
        '</div>';
    },

    // --- Render: quick actions ---
    _renderQuickActions: function () {
      var qa = [
        { icon: 'fa-gear',            title: 'Setting',        sub: 'System config',      action: 'setting',        access: 'setting' },
        { icon: 'fa-calendar-check',  title: 'My Event',       sub: 'Manage events',      action: 'switchToMyEvent', access: 'my_event' },
        { icon: 'fa-chart-line',      title: 'P2M Analyzer',   sub: 'Transaction analyzer', action: 'analyzer',     access: 'p2m_analyzer' },
        { icon: 'fa-key',             title: 'API Key',        sub: 'Manage credentials', action: 'apiKey',        access: 'api_key' },
        { icon: 'fa-shield-halved',   title: 'IP Whitelist',   sub: 'Login IP filter',    action: 'ipWhitelist',   access: 'ip_whitelist' },
        { icon: 'fa-user-shield',     title: 'Profil',         sub: 'Account & security', action: 'switchToProfil', access: null }
      ];

      var self = this;
      var html = '<div class="pro-quick-actions">';
      qa.forEach(function (q, i) {
        if (!self.hasAccess(q.access)) return;
        var trigger = q.href
          ? 'window.location.href=\'' + q.href + '\''
          : 'window.triggerModuleAction(\'' + q.action + '\')';
        html += '' +
          '<button class="pro-quick-btn" style="animation-delay:' + (0.05 + i * 0.04) + 's" onclick="' + trigger + '">' +
            '<div class="pro-quick-icon"><i class="fas ' + q.icon + '"></i></div>' +
            '<div class="pro-quick-text">' +
              '<span class="pro-quick-title">' + escapeHtml(q.title) + '</span>' +
              '<span class="pro-quick-sub">' + escapeHtml(q.sub) + '</span>' +
            '</div>' +
          '</button>';
      });
      html += '</div>';
      return html;
    },

    // --- Render: modules section ---
    _renderModulesSection: function () {
      var self = this;
      var order = ['core', 'workspace', 'operational', 'system'];
      var totalVisible = 0;

      var blocksHtml = '';
      order.forEach(function (catKey) {
        var cat = self.categories[catKey];
        if (!cat) return;
        var list = self.modules.filter(function (m) {
          return m.cat === catKey && self.hasAccess(m.access);
        });
        if (list.length === 0) return;
        totalVisible += list.length;

        blocksHtml += '' +
          '<div class="pro-category-block ' + catKey + '">' +
            '<div class="pro-category-header">' +
              '<div class="pro-category-icon"><i class="fas ' + cat.icon + '"></i></div>' +
              '<div class="pro-category-name">' + escapeHtml(cat.name) + '</div>' +
              '<span class="pro-category-count">' + list.length + ' modules</span>' +
            '</div>' +
            '<div class="pro-modules-grid">' +
              list.map(function (m, idx) { return self._renderModuleCard(m, idx); }).join('') +
            '</div>' +
          '</div>';
      });

      return '' +
        '<div class="pro-modules-section">' +
          '<div class="pro-section-header">' +
            '<div class="pro-section-title">Modules</div>' +
            '<span class="pro-section-counter">' + totalVisible + ' active</span>' +
          '</div>' +
          blocksHtml +
        '</div>';
    },

    _renderModuleCard: function (m, idx) {
      var cat = this.categories[m.cat] || {};
      var trigger;
      if (m.href) {
        trigger = 'window.location.href=\'' + m.href + '\'';
      } else if (m.action) {
        trigger = 'window.triggerModuleAction(\'' + m.action + '\')';
      } else {
        trigger = '';
      }

      var restrictedCls = m.badge === 'restricted' ? ' is-restricted' : '';
      var liveDot = m.badge === 'live' ? '<span class="live-dot"></span>' : '';

      return '' +
        '<div class="pro-module-card ' + m.color + restrictedCls + '" style="animation-delay:' + (idx * 0.04) + 's" ' +
          (trigger ? 'onclick="' + trigger + '" role="button" tabindex="0"' : '') + '>' +
          '<div class="pro-module-top">' +
            '<div class="pro-module-icon"><i class="fas ' + m.icon + '"></i></div>' +
            '<span class="pro-module-badge ' + m.badge + '">' + liveDot + escapeHtml(m.badgeText) + '</span>' +
          '</div>' +
          '<div class="pro-module-name">' + escapeHtml(m.name) + '</div>' +
          '<div class="pro-module-desc">' + escapeHtml(m.desc) + '</div>' +
          '<div class="pro-module-foot">' +
            '<span class="pro-module-cat">' + escapeHtml(cat.name || m.cat) + '</span>' +
            '<span class="pro-module-arrow"><i class="fas fa-arrow-right"></i></span>' +
          '</div>' +
        '</div>';
    },

    // --- Render: activity feed ---
    _renderActivity: function () {
      var items = this._buildActivity();
      var html = '' +
        '<div class="pro-activity">' +
          '<div class="pro-section-header" style="margin-bottom:12px;">' +
            '<div class="pro-section-title" style="font-size:14px;">Recent Activity</div>' +
            '<span class="pro-section-counter">' + items.length + ' logs</span>' +
          '</div>' +
          '<div class="pro-activity-list">';

      items.forEach(function (it) {
        html += '' +
          '<div class="pro-activity-item ' + (it.tone || '') + '">' +
            '<div class="pro-activity-icon"><i class="fas ' + it.icon + '"></i></div>' +
            '<div class="pro-activity-body">' +
              '<div class="pro-activity-title">' + escapeHtml(it.title) + '</div>' +
              '<div class="pro-activity-meta">' + escapeHtml(it.meta) + '</div>' +
            '</div>' +
            '<div class="pro-activity-time">' + escapeHtml(it.time) + '</div>' +
          '</div>';
      });

      html += '</div></div>';
      return html;
    },

    _buildActivity: function () {
      var items = [];
      var now = new Date();
      var role = this.role;
      var name = this.username;

      // From localStorage
      var since = getLS('aura_user_since', '');
      var status = getLS('aura_user_status', 'Active');
      var memo = getLS('aura_memo', '');

      items.push({
        icon: 'fa-right-to-bracket', tone: 'success',
        title: 'Session started',
        meta: 'User ' + name + ' · role ' + role,
        time: 'just now'
      });

      if (status && status.toLowerCase() === 'active') {
        items.push({
          icon: 'fa-shield-halved', tone: 'success',
          title: 'Access control applied',
          meta: role + ' role verified · ' + Object.keys(this.accessMap).length + ' scopes',
          time: 'just now'
        });
      }

      if (this.stats.whitelistOn) {
        items.push({
          icon: 'fa-network-wired', tone: 'purple',
          title: 'IP Whitelist protection active',
          meta: 'Login restricted to registered IPs',
          time: formatRelativeTime(now.getTime() - 1000 * 60 * 5)
        });
      } else {
        items.push({
          icon: 'fa-triangle-exclamation', tone: 'warning',
          title: 'Whitelist protection disabled',
          meta: 'Open login mode — consider enabling IP filter',
          time: formatRelativeTime(now.getTime() - 1000 * 60 * 5)
        });
      }

      if (since) {
        items.push({
          icon: 'fa-user-plus', tone: '',
          title: 'Account created',
          meta: 'Member since ' + since,
          time: formatRelativeTime(since)
        });
      }

      if (memo) {
        items.push({
          icon: 'fa-note-sticky', tone: 'warning',
          title: 'Memo stored locally',
          meta: memo.length + ' chars saved in Keep Memo',
          time: formatRelativeTime(now.getTime() - 1000 * 60 * 60 * 2)
        });
      }

      items.push({
        icon: 'fa-database', tone: 'purple',
        title: 'Data version synced',
        meta: 'DB version v' + (this.stats.dataVersion || 0),
        time: formatRelativeTime(now.getTime() - 1000 * 60 * 60 * 6)
      });

      return items.slice(0, 6);
    },

    // --- Counter animation ---
    animateStats: function (root) {
      if (!root) return;
      var nodes = root.querySelectorAll('.pro-stat-value[data-stat-target]');
      nodes.forEach(function (el) {
        var target = el.getAttribute('data-stat-target') || '';
        // Try numeric prefix animation
        var m = String(target).match(/^(\d+)(.*)$/);
        if (!m) { el.textContent = target; return; }
        var end = parseInt(m[1], 10);
        var suffix = m[2] || '';
        var start = 0;
        var dur = 700;
        var t0 = null;
        function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min(1, (ts - t0) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          var cur = Math.round(start + (end - start) * eased);
          el.textContent = cur + suffix;
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = end + suffix;
        }
        requestAnimationFrame(step);
      });
    },

    // --- Master render ---
    renderDashboard: function () {
      this.initAccess();
      var root = document.getElementById('dashboardView');
      if (!root) { console.warn('[dashboard-pro] #dashboardView not found'); return; }

      // No opacity manipulation — let CSS animations handle smooth entrance
      // This prevents the "flash + fade" janky effect
      var html = '' +
        this._renderHero() +
        this._renderStats() +
        '<div class="pro-section-header" style="margin-top:6px; margin-bottom:12px;"><div class="pro-section-title" style="font-size:14px;">Quick Access</div></div>' +
        this._renderQuickActions() +
        this._renderModulesSection() +
        this._renderActivity();

      root.innerHTML = html;
      this.animateStats(root);
      logSafe('Pro dashboard rendered');
    },

    renderModules: function () {
      // Re-render just the modules section (kept for API parity)
      var root = document.getElementById('dashboardView');
      if (!root) return;
      var sec = root.querySelector('.pro-modules-section');
      if (sec) sec.outerHTML = this._renderModulesSection();
    },

    renderActivity: function () {
      var root = document.getElementById('dashboardView');
      if (!root) return;
      var act = root.querySelector('.pro-activity');
      if (act) act.outerHTML = this._renderActivity();
    },

    // --- Live stats sync ---
    loadLiveStats: function () {
      var self = this;
      var token = getToken();

      // /api/me — username, role, access
      fetch('/api/me', { headers: { 'x-auth-token': token } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          if (!data || !data.success) return;
          var me = data.user || data.data;
          if (!me) return;
          if (me.role) {
            self.role = me.role.toUpperCase();
            localStorage.setItem('aura_user_role', self.role);
          }
          if (me.access) {
            self.accessMap = me.access || {};
            localStorage.setItem('aura_user_access', JSON.stringify(self.accessMap));
          }
          if (me.username) self.username = me.username;
          if (data.version !== undefined) {
            self.stats.dataVersion = data.version;
            localStorage.setItem('aura_data_version', String(data.version));
          }
          self._refreshStatsBlock();
          // Re-render kartu modul + quick access agar akses terbaru langsung terpakai
          self.refreshAccessUI();
        })
        .catch(function () { /* silent */ });

      // /api/ip/whitelist — protection status
      fetch('/api/ip/whitelist', { headers: { 'x-auth-token': token } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          if (!data || !data.success) return;
          if (data.settings && typeof data.settings.enabled === 'boolean') {
            self.stats.whitelistOn = !!data.settings.enabled;
          }
          if (data.whitelist) {
            // Active modules count = visible modules (computed) — keep simple
          }
          self._refreshStatsBlock();
        })
        .catch(function () { /* silent */ });

      // /api/data-version — version number fallback
      fetch('/api/data-version', { headers: { 'x-auth-token': token } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          if (!data) return;
          var v = data.version !== undefined ? data.version : (data.data && data.data.version);
          if (v !== undefined && v !== null) {
            self.stats.dataVersion = v;
            localStorage.setItem('aura_data_version', String(v));
            self._refreshStatsBlock();
          }
        })
        .catch(function () { /* silent */ });

      this._liveLoaded = true;
    },

    _refreshStatsBlock: function () {
      var root = document.getElementById('dashboardView');
      if (!root) return;
      // Only refresh if currently on dashboard view (visible)
      if (root.style.display === 'none') return;
      var existing = root.querySelector('.pro-stats-grid');
      if (!existing) return;
      var tmp = document.createElement('div');
      tmp.innerHTML = this._renderStats();
      var fresh = tmp.firstElementChild;
      if (fresh) {
        existing.replaceWith(fresh);
        this.animateStats(root);
      }
    },

    /* Re-render seluruh dashboard view (hero, stats, quick access,
       module cards, activity) bila view sedang terlihat — dipanggil
       dari applyAccess() Dashboard.html saat access user berubah
       (mis. kartu Setting dicabut dari Authority Panel). */
    refreshAccessUI: function () {
      var root = document.getElementById('dashboardView');
      if (!root) return;
      if (root.style.display === 'none') return;
      // Hanya jika dashboard pernah dirender (bukan placeholder loading)
      if (!root.querySelector('.pro-modules-section')) return;
      this.renderDashboard();
      logSafe('Dashboard re-rendered — access updated');
    }
  };

  // ============================================================
  // PROFILE
  // ============================================================
  var PROFILE = {
    _containerId: 'profilView',
    _lastData: null,

    load: function () {
      var self = this;
      var root = document.getElementById(this._containerId);
      if (!root) { console.warn('[dashboard-pro] #' + this._containerId + ' not found'); return; }

      // Show loading skeleton immediately
      root.innerHTML = this._renderLoading();

      var token = getToken();
      fetch('/api/user/profile', { headers: { 'x-auth-token': token } })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function (data) {
          if (!data.success) throw new Error(data.error || 'Profile load failed');
          var d = data.data || data.user || {};
          // Sync to localStorage (mirror existing switchToProfil behavior)
          if (d.username) localStorage.setItem('aura_auth_token', d.username);
          if (d.status)   localStorage.setItem('aura_user_status', d.status);
          if (d.since)    localStorage.setItem('aura_user_since', d.since);
          self._lastData = d;
          self.render(d);
          logSafe('Pro profile rendered');
        })
        .catch(function (err) {
          console.error('[dashboard-pro] profile load error', err);
          self._renderRetry(err && err.message ? err.message : 'Tidak dapat terhubung ke server');
        });
    },

    render: function (data) {
      var root = document.getElementById(this._containerId);
      if (!root) return;

      // No opacity manipulation — CSS animations handle smooth entrance
      // This prevents janky "flash then fade" effect
      this._doRender(data, root);
    },

    _doRender: function (data, root) {
      DASHBOARD.initAccess();
      var d = data || {};
      var username = d.username || getLS('aura_auth_token', 'User');
      var email    = d.email || (username + '@aura.os');
      var status   = (d.status || getLS('aura_user_status', 'Active'));
      var since    = d.since || getLS('aura_user_since', '-');
      var role     = DASHBOARD.role;
      var initial  = (username.charAt(0) || 'U').toUpperCase();
      var session  = genSessionId();

      // Compute coverage from access map
      var allKeys = ['rek_validator','bank_processor','qris_tools','prediction_tools','saldo_pencairan','authority_panel','ip_whitelist','edit_bukti','keep_memo','setting','api_key','event_tools'];
      var granted = 0;
      allKeys.forEach(function (k) { if (DASHBOARD.hasAccess(k)) granted++; });
      var total = allKeys.length;
      var coverage = total > 0 ? Math.round((granted / total) * 100) : 0;
      var permissions = role === 'MASTER' ? 'ALL' : granted + '/' + total;

      // Stored password (masked) — mirrors original switchToProfil logic
      var storedPass = getLS('aura_user_pass', '');
      var pwdMask = storedPass.length > 3
        ? storedPass.substring(0, 2) + '•••••' + storedPass.substring(storedPass.length - 2)
        : '•••••••';

      // Client IP detection (read from topIpText if available)
      var clientIp = (document.getElementById('topIpText') && document.getElementById('topIpText').textContent) || 'Detecting…';

      root.innerHTML = '' +
        '<div class="pro-profil-wrap">' +
          // Identity card
          '<div class="pro-profil-card">' +
            '<div class="pro-profil-banner"></div>' +
            '<div class="pro-profil-body">' +
              '<div class="pro-profil-avatar-wrap">' +
                '<div class="pro-profil-avatar">' + escapeHtml(initial) + '</div>' +
                '<span class="pro-profil-status-chip"><span class="dot"></span>' + escapeHtml(status) + '</span>' +
              '</div>' +
              '<div class="pro-profil-name">' + escapeHtml(username) + '</div>' +
              '<div class="pro-profil-email">' + escapeHtml(email) + '</div>' +
              '<div class="pro-profil-mini-stats">' +
                '<div class="pro-profil-mini-stat"><div class="pro-profil-mini-stat-value">' + escapeHtml(String(permissions)) + '</div><div class="pro-profil-mini-stat-label">Permissions</div></div>' +
                '<div class="pro-profil-mini-stat"><div class="pro-profil-mini-stat-value">' + total + '</div><div class="pro-profil-mini-stat-label">Total Scopes</div></div>' +
                '<div class="pro-profil-mini-stat"><div class="pro-profil-mini-stat-value">' + coverage + '%</div><div class="pro-profil-mini-stat-label">Coverage</div></div>' +
              '</div>' +
              '<div class="pro-profil-meta-list">' +
                this._metaItem('fa-id-badge', 'Username', escapeHtml(username), '') +
                this._metaItem('fa-user-tag', 'Role', escapeHtml(role), role === 'MASTER' ? 'warn' : 'purple') +
                this._metaItem('fa-key', 'Password', escapeHtml(pwdMask), 'purple') +
                this._metaItem('fa-shield-halved', 'Status', escapeHtml(status), status.toLowerCase() === 'active' ? 'green' : 'warn') +
                this._metaItem('fa-microchip', 'Session', escapeHtml(session), 'cyan') +
                this._metaItem('fa-globe', 'Client IP', escapeHtml(clientIp), 'cyan') +
              '</div>' +
            '</div>' +
          '</div>' +
          // Right column
          '<div class="pro-profil-right">' +
            this._renderPwdCard() +
            this._renderAuditCard({ status: status, since: since, role: role, coverage: coverage, wlOn: DASHBOARD.stats.whitelistOn }) +
          '</div>' +
        '</div>';

      // Wire password form behavior
      this._wirePwdForm();
    },

    _metaItem: function (icon, label, value, tone) {
      return '' +
        '<div class="pro-profil-meta-item">' +
          '<span class="pro-profil-meta-label"><i class="fas ' + icon + '"></i> ' + escapeHtml(label) + '</span>' +
          '<span class="pro-profil-meta-value ' + (tone || '') + '">' + value + '</span>' +
        '</div>';
    },

    _renderPwdCard: function () {
      return '' +
        '<div class="pro-pwd-card">' +
          '<div class="pro-card-head">' +
            '<div class="pro-card-head-icon"><i class="fas fa-lock"></i></div>' +
            '<div class="pro-card-title">Ubah Password</div>' +
          '</div>' +
          '<div class="pro-card-desc">Pastikan password baru memenuhi kriteria keamanan minimal untuk melindungi akun.</div>' +
          '<div class="pro-pwd-form">' +
            '<div class="pro-pwd-field">' +
              '<label class="pro-pwd-field-label">Password Lama</label>' +
              '<div class="pro-pwd-input-wrap">' +
                '<input type="password" id="proPwdOld" placeholder="•••••••" autocomplete="current-password">' +
                '<button type="button" class="pro-pwd-toggle" data-target="proPwdOld"><i class="fas fa-eye"></i></button>' +
              '</div>' +
            '</div>' +
            '<div class="pro-pwd-field">' +
              '<label class="pro-pwd-field-label">Password Baru</label>' +
              '<div class="pro-pwd-input-wrap">' +
                '<input type="password" id="proPwdNew" placeholder="Min. 8 karakter" autocomplete="new-password">' +
                '<button type="button" class="pro-pwd-toggle" data-target="proPwdNew"><i class="fas fa-eye"></i></button>' +
              '</div>' +
              '<div class="pro-pwd-strength-row">' +
                '<span class="pro-pwd-strength-text" id="proPwdStrengthText">Strength</span>' +
                '<span class="pro-pwd-strength-pct" id="proPwdStrengthPct">0%</span>' +
              '</div>' +
              '<div class="pro-pwd-strength-bar"><div class="pro-pwd-strength-fill" id="proPwdStrengthFill"></div></div>' +
            '</div>' +
            '<div class="pro-pwd-field">' +
              '<label class="pro-pwd-field-label">Konfirmasi Password</label>' +
              '<div class="pro-pwd-input-wrap">' +
                '<input type="password" id="proPwdConfirm" placeholder="Ulangi password baru" autocomplete="new-password">' +
                '<button type="button" class="pro-pwd-toggle" data-target="proPwdConfirm"><i class="fas fa-eye"></i></button>' +
              '</div>' +
              '<div class="pro-pwd-match-msg" id="proPwdMatchMsg"></div>' +
            '</div>' +
            '<div class="pro-pwd-hints" id="proPwdHints">' +
              '<div class="pro-pwd-hint cross" data-rule="len">Min. 8 karakter</div>' +
              '<div class="pro-pwd-hint cross" data-rule="upper">Huruf besar (A-Z)</div>' +
              '<div class="pro-pwd-hint cross" data-rule="num">Angka (0-9)</div>' +
              '<div class="pro-pwd-hint cross" data-rule="special">Simbol (!@#$…)</div>' +
            '</div>' +
            '<button class="pro-pwd-submit" id="proPwdSubmit" type="button"><i class="fas fa-shield-halved"></i> Perbarui Password</button>' +
          '</div>' +
        '</div>';
    },

    _wirePwdForm: function () {
      var self = this;
      var newInput = document.getElementById('proPwdNew');
      var confirmInput = document.getElementById('proPwdConfirm');
      var fill = document.getElementById('proPwdStrengthFill');
      var pctEl = document.getElementById('proPwdStrengthPct');
      var textEl = document.getElementById('proPwdStrengthText');
      var matchEl = document.getElementById('proPwdMatchMsg');
      var hintsWrap = document.getElementById('proPwdHints');
      var submit = document.getElementById('proPwdSubmit');

      // Toggle show/hide
      document.querySelectorAll('.pro-pwd-toggle').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var target = document.getElementById(btn.getAttribute('data-target'));
          if (!target) return;
          var isPw = target.type === 'password';
          target.type = isPw ? 'text' : 'password';
          btn.innerHTML = '<i class="fas ' + (isPw ? 'fa-eye-slash' : 'fa-eye') + '"></i>';
        });
      });

      function evalStrength(v) {
        var rules = {
          len: v.length >= 8,
          upper: /[A-Z]/.test(v),
          num: /[0-9]/.test(v),
          special: /[^A-Za-z0-9]/.test(v)
        };
        var score = Object.keys(rules).filter(function (k) { return rules[k]; }).length;
        var pct = Math.round((score / 4) * 100);
        return { rules: rules, pct: pct };
      }

      function updateHints(rules) {
        if (!hintsWrap) return;
        Object.keys(rules).forEach(function (k) {
          var el = hintsWrap.querySelector('[data-rule="' + k + '"]');
          if (!el) return;
          el.classList.remove('cross', 'check');
          el.classList.add(rules[k] ? 'check' : 'cross');
        });
      }

      function update() {
        var v = newInput.value || '';
        var res = evalStrength(v);
        if (fill) fill.style.width = res.pct + '%';
        if (pctEl) pctEl.textContent = res.pct + '%';
        if (textEl) {
          var label = res.pct === 0 ? 'Strength' : res.pct < 50 ? 'Weak' : res.pct < 100 ? 'Good' : 'Strong';
          textEl.textContent = label;
          textEl.style.color = res.pct === 0 ? 'var(--text-tertiary)' : res.pct < 50 ? '#f87171' : res.pct < 100 ? '#fbbf24' : '#34d399';
        }
        if (pctEl) {
          pctEl.style.color = res.pct === 0 ? 'var(--text-tertiary)' : res.pct < 50 ? '#f87171' : res.pct < 100 ? '#fbbf24' : '#34d399';
        }
        updateHints(res.rules);

        // Match check
        if (matchEl) {
          var cv = confirmInput.value || '';
          if (!cv) {
            matchEl.textContent = '';
            matchEl.style.color = '';
          } else if (cv === v) {
            matchEl.textContent = '✓ Password cocok';
            matchEl.style.color = '#34d399';
          } else {
            matchEl.textContent = '✗ Password tidak cocok';
            matchEl.style.color = '#f87171';
          }
        }
      }

      if (newInput) newInput.addEventListener('input', update);
      if (confirmInput) confirmInput.addEventListener('input', update);

      if (submit) {
        submit.addEventListener('click', function () {
          self._submitPassword();
        });
      }
    },

    _submitPassword: function () {
      var oldEl = document.getElementById('proPwdOld');
      var newEl = document.getElementById('proPwdNew');
      var confEl = document.getElementById('proPwdConfirm');
      var submit = document.getElementById('proPwdSubmit');
      if (!oldEl || !newEl || !confEl) return;

      var oldV = oldEl.value;
      var newV = newEl.value;
      var confV = confEl.value;

      if (!oldV || !newV || !confV) { showToastSafe('Semua field wajib diisi', 'warning'); return; }
      if (newV.length < 8) { showToastSafe('Password baru minimal 8 karakter', 'warning'); return; }
      if (newV !== confV) { showToastSafe('Konfirmasi password tidak cocok', 'warning'); return; }

      var btn = submit;
      var original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan…';

      var token = getToken();
      fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ oldPassword: oldV, newPassword: newV })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          btn.disabled = false;
          btn.innerHTML = original;
          if (data.success) {
            showToastSafe('Password berhasil diperbarui', 'success');
            localStorage.setItem('aura_user_pass', newV);
            oldEl.value = ''; newEl.value = ''; confEl.value = '';
            // Reset strength UI
            var fill = document.getElementById('proPwdStrengthFill');
            if (fill) fill.style.width = '0%';
            var pct = document.getElementById('proPwdStrengthPct');
            if (pct) { pct.textContent = '0%'; pct.style.color = ''; }
            var txt = document.getElementById('proPwdStrengthText');
            if (txt) { txt.textContent = 'Strength'; txt.style.color = ''; }
            var msg = document.getElementById('proPwdMatchMsg');
            if (msg) msg.textContent = '';
            logSafe('Password updated via Pro panel');
          } else {
            showToastSafe(data.error || 'Gagal memperbarui password', 'error');
          }
        })
        .catch(function () {
          btn.disabled = false;
          btn.innerHTML = original;
          showToastSafe('Tidak dapat terhubung ke server', 'error');
        });
    },

    _renderAuditCard: function (info) {
      var items = [
        {
          tone: info.status && info.status.toLowerCase() === 'active' ? 'ok' : 'warn',
          icon: 'fa-user-shield',
          title: 'Account Status',
          desc: 'Status akun: ' + (info.status || 'Active'),
          state: info.status || 'Active'
        },
        {
          tone: info.role === 'MASTER' ? 'warn' : (info.role === 'ADMIN' ? 'info' : 'ok'),
          icon: 'fa-user-tag',
          title: 'Role & Permissions',
          desc: 'Role ' + (info.role || 'MEMBER') + ' · coverage ' + (info.coverage || 0) + '%',
          state: info.role || 'MEMBER'
        },
        {
          tone: info.wlOn ? 'ok' : 'warn',
          icon: 'fa-shield-halved',
          title: 'IP Whitelist Protection',
          desc: info.wlOn ? 'Login dibatasi ke IP terdaftar' : 'Proteksi IP nonaktif — disarankan diaktifkan',
          state: info.wlOn ? 'Enforced' : 'Open'
        },
        {
          tone: 'info',
          icon: 'fa-calendar-day',
          title: 'Member Since',
          desc: 'Akun terdaftar sejak ' + (info.since || '-'),
          state: info.since ? 'Verified' : 'N/A'
        }
      ];

      var html = '' +
        '<div class="pro-audit-card">' +
          '<div class="pro-card-head">' +
            '<div class="pro-card-head-icon"><i class="fas fa-shield-halved"></i></div>' +
            '<div class="pro-card-title">Security Audit</div>' +
          '</div>' +
          '<div class="pro-card-desc">Ringkasan status keamanan akun Anda.</div>' +
          '<div class="pro-audit-list">';

      items.forEach(function (it) {
        html += '' +
          '<div class="pro-audit-item ' + it.tone + '">' +
            '<div class="pro-audit-item-icon"><i class="fas ' + it.icon + '"></i></div>' +
            '<div class="pro-audit-item-body">' +
              '<div class="pro-audit-item-title">' + escapeHtml(it.title) + '</div>' +
              '<div class="pro-audit-item-desc">' + escapeHtml(it.desc) + '</div>' +
            '</div>' +
            '<span class="pro-audit-item-state">' + escapeHtml(it.state) + '</span>' +
          '</div>';
      });

      html += '</div></div>';
      return html;
    },

    _renderLoading: function () {
      return '' +
        '<div class="pro-profil-wrap">' +
          '<div class="pro-profil-card">' +
            '<div class="pro-profil-banner pro-skeleton-shimmer"></div>' +
            '<div class="pro-profil-body">' +
              '<div class="pro-profil-avatar-wrap">' +
                '<div class="pro-skeleton-circle pro-skeleton-shimmer"></div>' +
                '<div class="pro-skeleton-pill pro-skeleton-shimmer" style="width:60px;height:20px;"></div>' +
              '</div>' +
              '<div class="pro-skeleton-line pro-skeleton-shimmer" style="width:60%;height:22px;margin-bottom:8px;"></div>' +
              '<div class="pro-skeleton-line pro-skeleton-shimmer" style="width:40%;height:14px;margin-bottom:20px;"></div>' +
              '<div class="pro-profil-mini-stats">' +
                '<div class="pro-skeleton-box pro-skeleton-shimmer" style="height:50px;border-radius:10px;"></div>' +
                '<div class="pro-skeleton-box pro-skeleton-shimmer" style="height:50px;border-radius:10px;"></div>' +
                '<div class="pro-skeleton-box pro-skeleton-shimmer" style="height:50px;border-radius:10px;"></div>' +
              '</div>' +
              '<div style="margin-top:20px;">' +
                '<div class="pro-skeleton-line pro-skeleton-shimmer" style="width:100%;height:14px;margin-bottom:12px;"></div>' +
                '<div class="pro-skeleton-line pro-skeleton-shimmer" style="width:100%;height:14px;margin-bottom:12px;"></div>' +
                '<div class="pro-skeleton-line pro-skeleton-shimmer" style="width:80%;height:14px;"></div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="pro-profil-right">' +
            '<div class="pro-pwd-card">' +
              '<div class="pro-skeleton-line pro-skeleton-shimmer" style="width:40%;height:18px;margin-bottom:16px;"></div>' +
              '<div class="pro-skeleton-line pro-skeleton-shimmer" style="width:100%;height:40px;margin-bottom:14px;border-radius:10px;"></div>' +
              '<div class="pro-skeleton-line pro-skeleton-shimmer" style="width:100%;height:40px;margin-bottom:14px;border-radius:10px;"></div>' +
              '<div class="pro-skeleton-line pro-skeleton-shimmer" style="width:100%;height:40px;margin-bottom:14px;border-radius:10px;"></div>' +
              '<div class="pro-skeleton-line pro-skeleton-shimmer" style="width:30%;height:36px;margin-top:8px;border-radius:10px;"></div>' +
            '</div>' +
            '<div class="pro-audit-card" style="margin-top:16px;">' +
              '<div class="pro-skeleton-line pro-skeleton-shimmer" style="width:50%;height:16px;margin-bottom:16px;"></div>' +
              '<div class="pro-skeleton-line pro-skeleton-shimmer" style="width:100%;height:36px;margin-bottom:10px;border-radius:10px;"></div>' +
              '<div class="pro-skeleton-line pro-skeleton-shimmer" style="width:100%;height:36px;margin-bottom:10px;border-radius:10px;"></div>' +
              '<div class="pro-skeleton-line pro-skeleton-shimmer" style="width:90%;height:36px;border-radius:10px;"></div>' +
            '</div>' +
          '</div>' +
        '</div>';
    },

    _renderRetry: function (msg) {
      var self = this;
      var root = document.getElementById(this._containerId);
      if (!root) return;
      root.innerHTML = '' +
        '<div class="pro-retry-block">' +
          '<i class="fas fa-triangle-exclamation"></i>' +
          '<div class="msg">Gagal memuat profil: ' + escapeHtml(msg || 'unknown error') + '</div>' +
          '<button class="pro-retry-btn" id="proProfilRetry"><i class="fas fa-rotate-right"></i> Coba lagi</button>' +
        '</div>';
      var btn = document.getElementById('proProfilRetry');
      if (btn) btn.addEventListener('click', function () { self.load(); });
    }
  };

  // ============================================================
  // IPWL — IP Whitelist
  // ============================================================
  var IPWL = {
    state: {
      whitelist: [],
      settings: { enabled: false, message: '' },
      filter: ''
    },

    load: function () {
      var root = document.getElementById('ipWhitelistView');
      if (!root) { console.warn('[dashboard-pro] #ipWhitelistView not found'); return; }
      // No opacity manipulation — CSS animations handle smooth entrance
      this.renderShell();
      this._fetch();
    },

    _fetch: function () {
      var self = this;
      var token = getToken();
      this._renderTableLoading();
      fetch('/api/ip/whitelist', { headers: { 'x-auth-token': token } })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (!data.success) {
            self._renderTableError(data.error || 'Gagal memuat data');
            return;
          }
          self.state.whitelist = Array.isArray(data.whitelist) ? data.whitelist : [];
          if (data.settings) self.state.settings = data.settings;
          self.render();
          // Sync dashboard whitelist flag
          DASHBOARD.stats.whitelistOn = !!(data.settings && data.settings.enabled);
        })
        .catch(function () {
          self._renderTableError('Gagal terhubung ke server');
        });
    },

    renderShell: function () {
      var root = document.getElementById('ipWhitelistView');
      if (!root) return;
      root.innerHTML = '' +
        '<div class="pro-ipwhitelist-wrap">' +
          // Header
          '<div class="pro-ipwl-header">' +
            '<div class="pro-ipwl-eyebrow"><span class="pulse-dot"></span> AURA.OS // IP WHITELIST</div>' +
            '<h2 class="pro-ipwl-title"><i class="fas fa-shield-halved"></i> IP Whitelist</h2>' +
            '<p class="pro-ipwl-subtitle">Kelola akses IP untuk login. Hanya IP terdaftar yang dapat masuk saat proteksi aktif.</p>' +
          '</div>' +
          // Stats
          '<div class="pro-ipwl-stats" id="proIpwlStats"></div>' +
          // Settings (toggle + message)
          '<div class="pro-ipwl-settings">' +
            // Toggle card
            '<div class="pro-ipwl-setting-card toggle">' +
              '<div class="pro-ipwl-setting-head">' +
                '<div class="pro-ipwl-setting-icon"><i class="fas fa-shield-halved"></i></div>' +
                '<div class="pro-ipwl-setting-title">Whitelist Protection</div>' +
              '</div>' +
              '<div class="pro-ipwl-setting-desc">Aktifkan untuk membatasi login hanya dari IP yang terdaftar.</div>' +
              '<div class="pro-ipwl-toggle-row">' +
                '<span class="pro-ipwl-toggle-state off" id="proIpwlToggleState">Disabled</span>' +
                '<label class="pro-ipwl-switch">' +
                  '<input type="checkbox" id="proIpwlToggle">' +
                  '<span class="pro-ipwl-switch-track"></span>' +
                  '<span class="pro-ipwl-switch-thumb"></span>' +
                '</label>' +
              '</div>' +
            '</div>' +
            // Message card
            '<div class="pro-ipwl-setting-card message">' +
              '<div class="pro-ipwl-setting-head">' +
                '<div class="pro-ipwl-setting-icon"><i class="fas fa-comment-dots"></i></div>' +
                '<div class="pro-ipwl-setting-title">Pesan Penolakan</div>' +
              '</div>' +
              '<div class="pro-ipwl-setting-desc">Pesan yang ditampilkan saat IP ditolak.</div>' +
              '<input type="text" id="proIpwlMessage" class="pro-ipwl-msg-input" placeholder="IP Anda tidak ada dalam whitelist. Hubungi admin.">' +
              '<button class="pro-ipwl-save-btn" id="proIpwlSaveMsg"><i class="fas fa-save"></i> Simpan Pesan</button>' +
            '</div>' +
          '</div>' +
          // Add IP form
          '<div class="pro-ipwl-add-card">' +
            '<div class="pro-ipwl-add-grid">' +
              '<div>' +
                '<label class="pro-ipwl-field-label">IP Address</label>' +
                '<input type="text" id="proIpwlIpInput" class="pro-ipwl-input mono" placeholder="192.168.1.1">' +
              '</div>' +
              '<div>' +
                '<label class="pro-ipwl-field-label">Label</label>' +
                '<input type="text" id="proIpwlLabelInput" class="pro-ipwl-input" placeholder="Office / Home">' +
              '</div>' +
              '<button class="pro-ipwl-add-btn" id="proIpwlAddBtn"><i class="fas fa-plus"></i> Tambah</button>' +
            '</div>' +
          '</div>' +
          // Table card
          '<div class="pro-ipwl-table-card">' +
            '<div class="pro-ipwl-toolbar">' +
              '<div class="pro-ipwl-toolbar-left">' +
                '<div class="pro-ipwl-toolbar-title"><i class="fas fa-list-check"></i> Daftar IP Terdaftar</div>' +
                '<span class="pro-ipwl-toolbar-count" id="proIpwlCount">0</span>' +
              '</div>' +
              '<div class="pro-ipwl-search">' +
                '<i class="fas fa-magnifying-glass"></i>' +
                '<input type="text" id="proIpwlSearch" placeholder="Cari IP atau label…">' +
              '</div>' +
            '</div>' +
            '<div class="pro-ipwl-table-wrap">' +
              '<table class="pro-ipwl-table">' +
                '<thead>' +
                  '<tr>' +
                    '<th><span class="th-inner"><i class="fas fa-network-wired"></i> IP Address</span></th>' +
                    '<th><span class="th-inner"><i class="fas fa-tag"></i> Label</span></th>' +
                    '<th><span class="th-inner"><i class="fas fa-user-gear"></i> Added By</span></th>' +
                    '<th><span class="th-inner"><i class="fas fa-clock"></i> Added</span></th>' +
                    '<th><span class="th-inner"><i class="fas fa-circle-check"></i> Status</span></th>' +
                    '<th style="text-align:right;"><span class="th-inner">Aksi</span></th>' +
                  '</tr>' +
                '</thead>' +
                '<tbody id="proIpwlBody"></tbody>' +
              '</table>' +
            '</div>' +
          '</div>' +
        '</div>';

      // Wire events
      var self = this;
      var toggle = document.getElementById('proIpwlToggle');
      if (toggle) toggle.addEventListener('change', function () { self.toggleProtection(); });
      var saveMsg = document.getElementById('proIpwlSaveMsg');
      if (saveMsg) saveMsg.addEventListener('click', function () { self.saveMessage(); });
      var addBtn = document.getElementById('proIpwlAddBtn');
      if (addBtn) addBtn.addEventListener('click', function () { self.add(); });
      var search = document.getElementById('proIpwlSearch');
      if (search) search.addEventListener('input', function () { self.filter(search.value); });

      // Enter-to-submit on add form
      var ipInput = document.getElementById('proIpwlIpInput');
      var labelInput = document.getElementById('proIpwlLabelInput');
      if (ipInput) ipInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') self.add(); });
      if (labelInput) labelInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') self.add(); });
    },

    render: function () {
      this._renderStats();
      this._renderToggle();
      this._renderMessage();
      this._renderTable();
    },

    _renderStats: function () {
      var el = document.getElementById('proIpwlStats');
      if (!el) return;
      var total = this.state.whitelist.length;
      var protection = this.state.settings.enabled ? 'ON' : 'OFF';
      var lastAdded = '-';
      if (this.state.whitelist.length > 0) {
        // Try to find most recent by created_at/added_at
        var sorted = this.state.whitelist.slice().sort(function (a, b) {
          var ta = new Date(a.created_at || a.added_at || 0).getTime();
          var tb = new Date(b.created_at || b.added_at || 0).getTime();
          return tb - ta;
        });
        lastAdded = (sorted[0].ip || '-');
      }
      var masterRole = DASHBOARD.role === 'MASTER' ? 'Yes' : 'No';

      el.innerHTML = '' +
        DASHBOARD._statCard.call(DASHBOARD, 'blue',    'fa-network-wired',  'Total IP',           String(total),  total > 0 ? 'up' : 'flat', total + ' registered', 'Whitelist entries') +
        DASHBOARD._statCard.call(DASHBOARD, this.state.settings.enabled ? 'success' : 'warning', 'fa-shield-halved', 'Protection', protection, this.state.settings.enabled ? 'up' : 'flat', this.state.settings.enabled ? 'Enforced' : 'Disabled', 'Login IP filter') +
        DASHBOARD._statCard.call(DASHBOARD, 'purple',  'fa-clock-rotate-left', 'Last Added',       lastAdded === '-' ? '-' : '', 'flat', lastAdded === '-' ? 'No IPs yet' : 'Most recent', lastAdded || '—') +
        DASHBOARD._statCard.call(DASHBOARD, 'warning', 'fa-crown',          'Master Role',       masterRole, 'flat', DASHBOARD.role, 'Current user privilege');
    },

    _renderToggle: function () {
      var toggle = document.getElementById('proIpwlToggle');
      var state = document.getElementById('proIpwlToggleState');
      if (toggle) toggle.checked = !!this.state.settings.enabled;
      if (state) {
        state.textContent = this.state.settings.enabled ? 'Enabled' : 'Disabled';
        state.className = 'pro-ipwl-toggle-state ' + (this.state.settings.enabled ? 'on' : 'off');
      }
    },

    _renderMessage: function () {
      var input = document.getElementById('proIpwlMessage');
      if (input && typeof this.state.settings.message === 'string') {
        input.value = this.state.settings.message;
      }
    },

    renderTable: function () { this._renderTable(); },

    _renderTable: function () {
      var body = document.getElementById('proIpwlBody');
      var countEl = document.getElementById('proIpwlCount');
      if (!body) return;

      var list = this.state.whitelist || [];
      var q = (this.state.filter || '').toLowerCase().trim();
      var filtered = list.filter(function (it) {
        if (!q) return true;
        return String(it.ip || '').toLowerCase().includes(q) ||
               String(it.label || '').toLowerCase().includes(q) ||
               String(it.added_by || '').toLowerCase().includes(q);
      });

      if (countEl) countEl.textContent = filtered.length;

      if (list.length === 0) {
        body.innerHTML = '' +
          '<tr><td colspan="6">' +
            '<div class="pro-ipwl-empty">' +
              '<div class="pro-ipwl-empty-icon"><i class="fas fa-inbox"></i></div>' +
              '<div class="pro-ipwl-empty-title">Belum ada IP terdaftar</div>' +
              '<div class="pro-ipwl-empty-desc">Tambahkan IP pertama menggunakan form di atas</div>' +
            '</div>' +
          '</td></tr>';
        return;
      }

      if (filtered.length === 0) {
        body.innerHTML = '' +
          '<tr><td colspan="6">' +
            '<div class="pro-ipwl-empty">' +
              '<div class="pro-ipwl-empty-icon"><i class="fas fa-magnifying-glass"></i></div>' +
              '<div class="pro-ipwl-empty-title">Tidak ada hasil</div>' +
              '<div class="pro-ipwl-empty-desc">Tidak ada IP yang cocok dengan "' + escapeHtml(q) + '"</div>' +
            '</div>' +
          '</td></tr>';
        return;
      }

      var self = this;
      var html = '';
      filtered.forEach(function (it) {
        var ip = it.ip || '-';
        var label = it.label || '';
        var addedBy = it.added_by || '-';
        var addedAt = it.created_at || it.added_at || '';
        var status = (it.role || (addedBy === DASHBOARD.username ? 'active' : 'active'));
        var statusCls = 'active';
        var statusText = 'Active';
        if (String(addedBy).toUpperCase() === 'MASTER' || String(it.role).toUpperCase() === 'MASTER') {
          statusCls = 'master'; statusText = 'Master';
        } else if (String(it.role).toUpperCase() === 'ADMIN') {
          statusCls = 'admin'; statusText = 'Admin';
        }

        html += '' +
          '<tr>' +
            '<td><div class="pro-ipwl-ip-cell"><span class="ip-dot"></span>' + escapeHtml(ip) + '</div></td>' +
            '<td><span class="pro-ipwl-label-cell' + (label ? '' : ' empty') + '">' + (label ? escapeHtml(label) : '— no label —') + '</span></td>' +
            '<td><span class="pro-ipwl-by-cell">' + escapeHtml(addedBy) + '</span></td>' +
            '<td><span class="pro-ipwl-date-cell">' + (addedAt ? escapeHtml(formatDateTime(addedAt)) : '-') + '</span></td>' +
            '<td><span class="pro-ipwl-status-cell ' + statusCls + '">' + escapeHtml(statusText) + '</span></td>' +
            '<td style="text-align:right;">' +
              '<button class="pro-ipwl-action-btn" onclick="window.IPWL.remove(' + (it.id || 0) + ', \'' + escapeHtml(ip).replace(/'/g, "\\'") + '\')"><i class="fas fa-trash"></i> Hapus</button>' +
            '</td>' +
          '</tr>';
      });

      body.innerHTML = html;
    },

    _renderTableLoading: function () {
      var body = document.getElementById('proIpwlBody');
      if (!body) return;
      body.innerHTML = '' +
        '<tr><td colspan="6">' +
          '<div class="pro-ipwl-loading">' +
            '<div class="pro-ipwl-loading-spinner"></div>' +
            '<div class="pro-ipwl-loading-text">Memuat data whitelist…</div>' +
          '</div>' +
        '</td></tr>';
    },

    _renderTableError: function (msg) {
      var body = document.getElementById('proIpwlBody');
      if (!body) return;
      body.innerHTML = '' +
        '<tr><td colspan="6">' +
          '<div class="pro-ipwl-empty">' +
            '<div class="pro-ipwl-empty-icon" style="color:var(--accent-danger);"><i class="fas fa-triangle-exclamation"></i></div>' +
            '<div class="pro-ipwl-empty-title" style="color:var(--accent-danger);">' + escapeHtml(msg || 'Gagal memuat data') + '</div>' +
            '<div class="pro-ipwl-empty-desc">Periksa koneksi atau coba lagi nanti</div>' +
          '</div>' +
        '</td></tr>';
    },

    filter: function (val) {
      this.state.filter = val || '';
      this._renderTable();
    },

    toggleProtection: function () {
      var self = this;
      var toggle = document.getElementById('proIpwlToggle');
      if (!toggle) return;
      var enabled = toggle.checked;
      var msgInput = document.getElementById('proIpwlMessage');
      var message = msgInput ? msgInput.value : (this.state.settings.message || '');
      var token = getToken();

      fetch('/api/ip/whitelist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ enabled: enabled, message: message })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            self.state.settings.enabled = enabled;
            self.state.settings.message = message;
            self._renderToggle();
            self._renderStats();
            DASHBOARD.stats.whitelistOn = enabled;
            showToastSafe('Whitelist protection ' + (enabled ? 'diaktifkan' : 'dinonaktifkan'), 'success');
            logSafe('IP Whitelist ' + (enabled ? 'enabled' : 'disabled'));
          } else {
            showToastSafe(data.error || 'Gagal mengubah setting', 'error');
            // Revert toggle
            toggle.checked = !enabled;
            self._renderToggle();
          }
        })
        .catch(function () {
          showToastSafe('Gagal terhubung ke server', 'error');
          toggle.checked = !enabled;
          self._renderToggle();
        });
    },

    saveMessage: function () {
      var self = this;
      var msgInput = document.getElementById('proIpwlMessage');
      if (!msgInput) return;
      var message = msgInput.value;
      var enabled = !!(this.state.settings.enabled);
      var token = getToken();

      fetch('/api/ip/whitelist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ enabled: enabled, message: message })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            self.state.settings.message = message;
            showToastSafe('Pesan penolakan disimpan', 'success');
            logSafe('IP Whitelist message updated');
          } else {
            showToastSafe(data.error || 'Gagal menyimpan pesan', 'error');
          }
        })
        .catch(function () {
          showToastSafe('Gagal terhubung ke server', 'error');
        });
    },

    add: function () {
      var self = this;
      var ipInput = document.getElementById('proIpwlIpInput');
      var labelInput = document.getElementById('proIpwlLabelInput');
      if (!ipInput) return;
      var ip = (ipInput.value || '').trim();
      var label = (labelInput ? labelInput.value : '').trim();
      if (!ip) { showToastSafe('IP wajib diisi', 'warning'); ipInput.focus(); return; }

      var token = getToken();
      fetch('/api/ip/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({ ip: ip, label: label })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            showToastSafe('IP berhasil ditambahkan', 'success');
            logSafe('IP added to whitelist: ' + ip);
            ipInput.value = '';
            if (labelInput) labelInput.value = '';
            self._fetch();
          } else {
            showToastSafe(data.error || 'Gagal menambahkan IP', 'error');
          }
        })
        .catch(function () {
          showToastSafe('Gagal terhubung ke server', 'error');
        });
    },

    remove: function (id, ip) {
      var self = this;
      if (!confirm('Hapus IP ' + (ip || '') + ' dari whitelist?')) return;
      var token = getToken();
      fetch('/api/ip/whitelist/' + encodeURIComponent(id), {
        method: 'DELETE',
        headers: { 'x-auth-token': token }
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.success) {
            showToastSafe('IP berhasil dihapus', 'success');
            logSafe('IP removed from whitelist: id=' + id);
            self._fetch();
          } else {
            showToastSafe(data.error || 'Gagal menghapus IP', 'error');
          }
        })
        .catch(function () {
          showToastSafe('Gagal terhubung ke server', 'error');
        });
    }
  };

  // ============================================================
  // INIT + PATCH GLOBAL SWITCHERS
  // ============================================================
  function _patchSwitchers() {
    // Save references to original switchers (defined in Dashboard.html)
    var origProfil = window.switchToProfil;
    var origDash = window.switchToDashboard;
    var origIp = window.switchToIpWhitelist;

    window.switchToProfil = function () {
      if (typeof origProfil === 'function') {
        try { origProfil(); } catch (e) {}
      } else {
        // Fallback: hide all views, show profil
        if (typeof window.hideAllViews === 'function') window.hideAllViews();
        var v = document.getElementById('profilView');
        if (v) v.style.display = 'block';
      }
      PROFILE.load();
    };

    window.switchToDashboard = function () {
      if (typeof origDash === 'function') {
        try { origDash(); } catch (e) {}
      } else {
        if (typeof window.hideAllViews === 'function') window.hideAllViews();
        var v = document.getElementById('dashboardView');
        if (v) v.style.display = 'block';
      }
      DASHBOARD.renderDashboard();
    };

    window.switchToIpWhitelist = function () {
      if (typeof origIp === 'function') {
        try { origIp(); } catch (e) {}
      } else {
        if (typeof window.hideAllViews === 'function') window.hideAllViews();
        var v = document.getElementById('ipWhitelistView');
        if (v) v.style.display = 'block';
      }
      IPWL.load();
    };
  }

  function init() {
    // Expose public API
    window.DASHBOARD = DASHBOARD;
    window.PROFILE = PROFILE;
    window.IPWL = IPWL;
    window.triggerModuleAction = function (action) { DASHBOARD.triggerAction(action); };

    // Patch switchers (defensive — only patch once)
    if (!window.__dashboardProPatched) {
      _patchSwitchers();
      window.__dashboardProPatched = true;
    }

    // Auto-render dashboard if it is currently visible (initial load)
    DASHBOARD.initAccess();
    var dashView = document.getElementById('dashboardView');
    if (dashView && dashView.style.display !== 'none') {
      // Defer to allow Dashboard.html's own init to settle
      setTimeout(function () {
        DASHBOARD.renderDashboard();
        DASHBOARD.loadLiveStats();
      }, 60);
    } else {
      // Still preload live stats in background
      DASHBOARD.loadLiveStats();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
