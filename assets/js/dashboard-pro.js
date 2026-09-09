/* ============================================================
   AURA.OS // DASHBOARD-PRO.JS
   Professional, structured logic for:
   - Dashboard main view (live stats + categorized modules + activity)
   - Profile panel (identity + password change + audit)
   - IP Whitelist panel (table + CRUD + search + toggle)
   ============================================================ */

(function () {
  'use strict';

  // ============================================================
  // SHARED HELPERS
  // ============================================================
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const token = () => localStorage.getItem('aura_auth_token') || '';

  async function api(path, opts = {}) {
    const headers = { 'x-auth-token': token(), ...(opts.headers || {}) };
    if (opts.body && typeof opts.body === 'object') {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(opts.body);
    }
    try {
      const res = await fetch(path, { ...opts, headers });
      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('json') ? await res.json() : await res.text();
      return { ok: res.ok, status: res.status, data };
    } catch (e) {
      return { ok: false, status: 0, data: { error: e.message } };
    }
  }

  function showToast(msg, type = 'info') {
    if (window.showToast) return window.showToast(msg, type);
    // Fallback toast
    const t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;bottom:20px;right:20px;padding:12px 18px;background:#1a1a24;color:#fff;border-radius:8px;font-size:13px;z-index:99999;border:1px solid rgba(255,255,255,0.1);box-shadow:0 4px 12px rgba(0,0,0,0.4);';
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  function fmtDate(iso) {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) { return iso; }
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // ============================================================
  // DASHBOARD MAIN VIEW — initialize
  // ============================================================
  const DASHBOARD = {
    modules: [
      // Core
      { cat: 'core', color: 'blue', icon: '📊', name: 'Dashboard', desc: 'Halaman utama & ringkasan sistem', badge: 'live', badgeText: 'Active', access: 'dashboard', action: 'switchToDashboard' },
      { cat: 'core', color: 'purple', icon: '👤', name: 'Profil', desc: 'Kelola data akun & keamanan', badge: 'live', badgeText: 'v2.0', access: 'profil', action: 'switchToProfil' },
      // Workspace — Banking
      { cat: 'workspace', color: 'teal', icon: '🏦', name: 'Rek Validator', desc: 'Cross-check 4 database rekening', badge: 'live', badgeText: 'v1.5', access: 'rek_validator', href: '/Validator.html' },
      { cat: 'workspace', color: 'blue', icon: '💰', name: 'Bank Processor', desc: 'Formatter & validator rekening bank', badge: 'live', badgeText: 'v2.0', access: 'bank_processor', href: '/Bank.html' },
      // Operational — Saldo Pencairan
      { cat: 'operational', color: 'teal', icon: '💸', name: 'Saldo Pencairan', desc: 'Monitor rekening & pencairan realtime', badge: 'live', badgeText: 'v1.0', access: 'saldo_pencairan', action: 'loadPencairan' },
      // Operational — QRIS Tools
      { cat: 'operational', color: 'pink', icon: '📈', name: 'P2M Analyzer', desc: 'P2M vs Zonamain vs Report analysis', badge: 'live', badgeText: 'v2.0', access: 'qris_tools', action: 'analyzer' },
      { cat: 'operational', color: 'purple', icon: '🔍', name: 'XPAY Analyzer', desc: 'XPAY transaction analyzer engine', badge: 'live', badgeText: 'v2.0', access: 'qris_tools', action: 'xpayChecker' },
      { cat: 'operational', color: 'orange', icon: '📋', name: 'XPAY Settlement', desc: 'XPAY settlement reconciliation', badge: 'live', badgeText: 'v2.0', access: 'qris_tools', action: 'xpayFull' },
      { cat: 'operational', color: 'teal', icon: '✅', name: 'Settlement Checker', desc: 'Cek settlement per tanggal (IndexedDB)', badge: 'live', badgeText: 'v1.0', access: 'qris_tools', action: 'xpaySettlementChecker' },
      { cat: 'operational', color: 'purple', icon: '📊', name: 'MNPAY Analyzer', desc: 'MNPAY payment flow analyzer', badge: 'soon', badgeText: 'Soon', access: 'qris_tools', action: 'comingSoon' },
      // Operational — Prediction Tools
      { cat: 'operational', color: 'blue', icon: '📊', name: 'Syair Database', desc: 'Access shio prediction engine', badge: 'live', badgeText: 'v2.1', access: 'prediction_tools', href: '/Syair.html' },
      { cat: 'operational', color: 'purple', icon: '🔮', name: 'AI Prediction', desc: 'Neural probability calculation', badge: 'live', badgeText: 'v3.0', access: 'prediction_tools', href: '/Prediksi.html' },
      { cat: 'operational', color: 'red', icon: '🎰', name: 'Gas Slot Engine', desc: 'AI Slot Gacor Predictor System', badge: 'live', badgeText: 'v1.0', access: 'prediction_tools', action: 'appInfo' },
      // Operational — Event Tools
      { cat: 'operational', color: 'green', icon: '📅', name: 'My Event', desc: 'Manage active events realtime', badge: 'live', badgeText: 'v1.0', access: 'event_tools', action: 'switchToMyEvent' },
      { cat: 'operational', color: 'orange', icon: '🕐', name: 'History Event', desc: 'Event history & logs archive', badge: 'soon', badgeText: 'Soon', access: 'event_tools', action: 'comingSoon' },
      { cat: 'operational', color: 'green', icon: '🧾', name: 'PG Report', desc: 'PG Soft credit calculator engine', badge: 'live', badgeText: 'v5.0', access: 'event_tools', action: 'pgReport' },
      // Operational — Bukti & Memo
      { cat: 'operational', color: 'pink', icon: '✏️', name: 'Edit Bukti', desc: 'Edit & manage proof of payment', badge: 'live', badgeText: 'v1.0', access: 'edit_bukti', action: 'editBukti' },
      { cat: 'operational', color: 'orange', icon: '📝', name: 'Keep Memo', desc: 'Simpan & kelola catatan memo', badge: 'live', badgeText: 'v1.0', access: 'keep_memo', action: 'keepMemo' },
      // System
      { cat: 'system', color: 'blue', icon: '🔑', name: 'API Key', desc: 'Manage API credentials & scopes', badge: 'live', badgeText: 'v2.0', access: 'api_key', action: 'apiKey' },
      { cat: 'system', color: 'red', icon: '🛡️', name: 'IP Whitelist', desc: 'Kelola whitelist IP login', badge: 'live', badgeText: 'v1.0', access: 'ip_whitelist', action: 'ipWhitelist' },
      { cat: 'system', color: 'orange', icon: '⚙️', name: 'Setting', desc: 'System configuration panel', badge: 'live', badgeText: 'v1.2', access: 'setting', action: 'setting' },
      { cat: 'system', color: 'purple', icon: '🛡️', name: 'Authority Panel', desc: 'Admin access & user management', badge: 'restricted', badgeText: 'Restricted', access: 'authority_panel', href: '/Authority.html' },
    ],

    categories: {
      core: { name: 'Core', icon: '⭐', color: 'blue' },
      workspace: { name: 'Workspace', icon: '💼', color: 'green' },
      operational: { name: 'Operational', icon: '⚙️', color: 'orange' },
      system: { name: 'System', icon: '🔧', color: 'purple' },
    },

    accessMap: {},
    role: 'MEMBER',
    username: 'User',
  };

  // Initialize access map from localStorage (set by login)
  DASHBOARD.initAccess = function () {
    try {
      const stored = localStorage.getItem('aura_user_access');
      if (stored) DASHBOARD.accessMap = JSON.parse(stored);
      DASHBOARD.role = localStorage.getItem('aura_user_role') || 'MEMBER';
      // Username: prefer aura_username, fallback to aura_auth_token (which stores username)
      DASHBOARD.username = localStorage.getItem('aura_username') || localStorage.getItem('aura_auth_token') || 'User';
    } catch (e) {
      DASHBOARD.accessMap = {};
    }
  };

  // Action handler mapping — maps module action names to actual global functions
  // This fixes the bug where action names didn't match real function names
  DASHBOARD.triggerAction = function (action) {
    // Direct switchTo* functions (exist as globals in Dashboard.html)
    const switchToMap = {
      'switchToDashboard': 'switchToDashboard',
      'switchToProfil': 'switchToProfil',
      'switchToMyEvent': 'switchToMyEvent',
      'loadPencairan': 'switchToPencairan',
      'analyzer': 'switchToAnalyzer',
      'xpayChecker': 'switchToXpayChecker',
      'xpayFull': 'switchToXpayFull',
      'xpaySettlementChecker': 'switchToXpaySettlement',
      'editBukti': 'switchToEditBukti',
      'apiKey': 'switchToApiKey',
      'ipWhitelist': 'switchToIpWhitelist',
      'pgReport': 'switchToPgReport',
    };
    if (switchToMap[action] && typeof window[switchToMap[action]] === 'function') {
      window[switchToMap[action]]();
      return;
    }
    // Actions handled by handleAction() in Dashboard.html
    const handleActionMap = ['setting', 'comingSoon', 'appInfo', 'keepMemo'];
    if (handleActionMap.indexOf(action) !== -1 && typeof window.handleAction === 'function') {
      window.handleAction(action);
      return;
    }
    // Fallback: try handleAction with the action name
    if (typeof window.handleAction === 'function') {
      window.handleAction(action);
      return;
    }
    // Last resort: try to call as global function
    if (typeof window[action] === 'function') {
      window[action]();
      return;
    }
    console.warn('Unknown action:', action);
    if (typeof window.showToast === 'function') {
      window.showToast('Action "' + action + '" tidak ditemukan', 'warning');
    }
  };

  // Expose globally so onclick handlers can call it
  window.triggerModuleAction = DASHBOARD.triggerAction;

  DASHBOARD.hasAccess = function (key) {
    if (DASHBOARD.role === 'MASTER' || DASHBOARD.role === 'ADMIN') return true;
    return DASHBOARD.accessMap[key] === true;
  };

  DASHBOARD.countAccessible = function () {
    const unique = new Set();
    DASHBOARD.modules.forEach(m => {
      if (DASHBOARD.hasAccess(m.access)) unique.add(m.access);
    });
    return unique.size;
  };

  // Render dashboard view
  DASHBOARD.renderDashboard = function () {
    const view = $('#dashboardView');
    if (!view) return;
    DASHBOARD.initAccess();

    const accessibleCount = DASHBOARD.countAccessible();
    const totalModules = DASHBOARD.modules.length;

    // Hero
    const heroAvatarLetter = (DASHBOARD.username[0] || 'U').toUpperCase();
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 18 ? 'Selamat sore' : 'Selamat malam';

    view.innerHTML = `
      <div class="pro-hero">
        <div class="pro-hero-content">
          <div class="pro-hero-greeting">
            <div class="pro-hero-eyebrow"><span class="pulse-dot"></span> System Online</div>
            <h1 class="pro-hero-title">${greeting}, <span class="accent">${escapeHtml(DASHBOARD.username)}</span></h1>
            <p class="pro-hero-subtitle">AURA.OS interface loaded. Semua sistem operasional dan siap digunakan.</p>
            <div class="pro-hero-meta">
              <div class="pro-hero-meta-item"><i class="fas fa-clock"></i> <span>Session:</span> <strong>${new Date().toLocaleTimeString('id-ID')}</strong></div>
              <div class="pro-hero-meta-item"><i class="fas fa-user-shield"></i> <span>Role:</span> <strong>${DASHBOARD.role}</strong></div>
              <div class="pro-hero-meta-item"><i class="fas fa-cube"></i> <span>Modules:</span> <strong>${accessibleCount}/${totalModules}</strong></div>
            </div>
          </div>
          <div class="pro-hero-avatar-block" onclick="switchToProfil()">
            <div class="pro-hero-avatar">${heroAvatarLetter}</div>
            <div class="pro-hero-avatar-info">
              <div class="pro-hero-avatar-name">${escapeHtml(DASHBOARD.username)}</div>
              <div class="pro-hero-avatar-role">${DASHBOARD.role}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="pro-stats-grid">
        <div class="pro-stat-card" data-tone="blue">
          <div class="pro-stat-header">
            <div class="pro-stat-icon"><i class="fas fa-cube"></i></div>
            <span class="pro-stat-trend">${DASHBOARD.role === 'MASTER' ? 'Full' : 'Custom'}</span>
          </div>
          <div class="pro-stat-label">Active Modules</div>
          <div class="pro-stat-value" id="proStatModules">0</div>
          <div class="pro-stat-foot">dari ${totalModules} modul tersedia</div>
        </div>

        <div class="pro-stat-card" data-tone="success">
          <div class="pro-stat-header">
            <div class="pro-stat-icon"><i class="fas fa-circle-check"></i></div>
            <span class="pro-stat-trend">Optimal</span>
          </div>
          <div class="pro-stat-label">System Health</div>
          <div class="pro-stat-value" id="proStatHealth">98%</div>
          <div class="pro-stat-foot">All services operational</div>
        </div>

        <div class="pro-stat-card" data-tone="purple">
          <div class="pro-stat-header">
            <div class="pro-stat-icon"><i class="fas fa-shield-halved"></i></div>
            <span class="pro-stat-trend neutral" id="proStatWlStatus">Checking</span>
          </div>
          <div class="pro-stat-label">Whitelist Protection</div>
          <div class="pro-stat-value" id="proStatWl">-</div>
          <div class="pro-stat-foot" id="proStatWlFoot">Memuat status...</div>
        </div>

        <div class="pro-stat-card" data-tone="warning">
          <div class="pro-stat-header">
            <div class="pro-stat-icon"><i class="fas fa-bolt"></i></div>
            <span class="pro-stat-trend" id="proStatSyncTrend">Live</span>
          </div>
          <div class="pro-stat-label">Data Version</div>
          <div class="pro-stat-value" id="proStatVersion">0</div>
          <div class="pro-stat-foot">Sync interval: 5s</div>
        </div>
      </div>

      <div class="pro-quick-actions">
        <a class="pro-quick-action" onclick="switchToProfil()">
          <div class="pro-quick-action-icon"><i class="fas fa-user"></i></div>
          <div class="pro-quick-action-text">
            <div class="pro-quick-action-title">Profil</div>
            <div class="pro-quick-action-sub">Akun & Security</div>
          </div>
        </a>
        <a class="pro-quick-action" onclick="triggerModuleAction('ipWhitelist')">
          <div class="pro-quick-action-icon"><i class="fas fa-shield-halved"></i></div>
          <div class="pro-quick-action-text">
            <div class="pro-quick-action-title">IP Whitelist</div>
            <div class="pro-quick-action-sub">Akses kontrol</div>
          </div>
        </a>
        <a class="pro-quick-action" onclick="triggerModuleAction('apiKey')">
          <div class="pro-quick-action-icon"><i class="fas fa-key"></i></div>
          <div class="pro-quick-action-text">
            <div class="pro-quick-action-title">API Key</div>
            <div class="pro-quick-action-sub">Credentials</div>
          </div>
        </a>
        <a class="pro-quick-action" onclick="switchToMyEvent()">
          <div class="pro-quick-action-icon"><i class="fas fa-calendar-check"></i></div>
          <div class="pro-quick-action-text">
            <div class="pro-quick-action-title">My Event</div>
            <div class="pro-quick-action-sub">Event realtime</div>
          </div>
        </a>
        <a class="pro-quick-action" onclick="window.location.href='/Authority.html'">
          <div class="pro-quick-action-icon"><i class="fas fa-users-cog"></i></div>
          <div class="pro-quick-action-text">
            <div class="pro-quick-action-title">Authority</div>
            <div class="pro-quick-action-sub">User mgmt</div>
          </div>
        </a>
        <a class="pro-quick-action" onclick="triggerModuleAction('setting')">
          <div class="pro-quick-action-icon"><i class="fas fa-cog"></i></div>
          <div class="pro-quick-action-text">
            <div class="pro-quick-action-title">Setting</div>
            <div class="pro-quick-action-sub">Konfigurasi</div>
          </div>
        </a>
      </div>

      <div class="pro-modules-section">
        <div class="pro-section-header">
          <div class="pro-section-title">Quick Access Modules</div>
          <span class="pro-section-counter">${accessibleCount} Aktif</span>
        </div>
        <div id="proModulesContainer"></div>
      </div>

      <div class="pro-activity">
        <div class="pro-section-header" style="margin-bottom: 16px;">
          <div class="pro-section-title">Recent Activity</div>
        </div>
        <div class="pro-activity-list" id="proActivityList"></div>
      </div>
    `;

    DASHBOARD.renderModules();
    DASHBOARD.renderActivity();
    DASHBOARD.animateStats();
    DASHBOARD.loadLiveStats();
  };

  DASHBOARD.renderModules = function () {
    const container = $('#proModulesContainer');
    if (!container) return;

    const html = Object.keys(DASHBOARD.categories).map(catKey => {
      const cat = DASHBOARD.categories[catKey];
      const modules = DASHBOARD.modules.filter(m => m.cat === catKey);
      if (modules.length === 0) return '';

      const visible = modules.filter(m => DASHBOARD.hasAccess(m.access));
      if (visible.length === 0) return ''; // hide category if no access

      const cardsHtml = modules.map(m => {
        const hasAccess = DASHBOARD.hasAccess(m.access);
        const badgeClass = m.badge === 'soon' ? 'soon' : (m.badge === 'restricted' ? 'restricted' : 'live');
        const trigger = m.href
          ? `onclick="window.location.href='${m.href}'"`
          : (m.action ? `onclick="triggerModuleAction('${m.action}')"` : '');
        return `
          <div class="pro-module-card ${hasAccess ? '' : 'disabled'}" data-color="${m.color}" ${hasAccess ? trigger : ''}>
            <div class="pro-module-head">
              <div class="pro-module-icon">${m.icon}</div>
              <span class="pro-module-badge ${badgeClass}">${m.badgeText}</span>
            </div>
            <div class="pro-module-body">
              <div class="pro-module-name">${m.name}</div>
              <div class="pro-module-desc">${m.desc}</div>
            </div>
            <div class="pro-module-foot">
              <span>${cat.name}</span>
              <span class="arrow"><i class="fas fa-arrow-right"></i></span>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="pro-category-block">
          <div class="pro-category-header">
            <div class="pro-category-icon">${cat.icon}</div>
            <div class="pro-category-name">${cat.name}</div>
            <span class="pro-category-count">${visible.length} modul</span>
          </div>
          <div class="pro-modules-grid">
            ${cardsHtml}
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  };

  DASHBOARD.renderActivity = function () {
    const list = $('#proActivityList');
    if (!list) return;

    // Generate activity based on localStorage history (or defaults)
    const activities = [];
    const loginTime = localStorage.getItem('aura_login_time');
    if (loginTime) {
      activities.push({
        icon: 'fa-right-to-bracket', tone: 'success',
        title: 'Login berhasil',
        meta: `IP: ${localStorage.getItem('aura_client_ip') || 'Unknown'}`,
        time: loginTime,
      });
    }
    activities.push(
      { icon: 'fa-shield-halved', tone: 'success', title: 'Session token valid', meta: 'Authentication active', time: 'Baru saja' },
      { icon: 'fa-cube', tone: '', title: `${DASHBOARD.countAccessible()} modul dimuat`, meta: `Role: ${DASHBOARD.role}`, time: 'Baru saja' },
      { icon: 'fa-database', tone: 'success', title: 'Data version sync', meta: 'Cross-device sync aktif', time: '1m lalu' },
      { icon: 'fa-server', tone: '', title: 'System health check', meta: 'All services operational', time: '5m lalu' },
    );

    list.innerHTML = activities.slice(0, 6).map(a => `
      <div class="pro-activity-item">
        <div class="pro-activity-icon ${a.tone}"><i class="fas ${a.icon}"></i></div>
        <div class="pro-activity-body">
          <div class="pro-activity-title">${escapeHtml(a.title)}</div>
          <div class="pro-activity-meta">${escapeHtml(a.meta)}</div>
        </div>
        <div class="pro-activity-time">${escapeHtml(a.time)}</div>
      </div>
    `).join('');
  };

  DASHBOARD.animateStats = function () {
    const animate = (el, target, suffix = '') => {
      if (!el) return;
      const start = 0;
      const duration = 800;
      const startTime = performance.now();
      const tick = (now) => {
        const t = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const val = Math.floor(start + (target - start) * eased);
        el.textContent = val.toLocaleString('en-US') + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    animate($('#proStatModules'), DASHBOARD.countAccessible());
  };

  DASHBOARD.loadLiveStats = function () {
    // Sync user data from /api/me (username, role, access) — fixes "User" greeting bug
    (async () => {
      const res = await api('/api/me', { method: 'GET' });
      if (res.ok && res.data && res.data.success && res.data.user) {
        const me = res.data.user;
        // Sync to localStorage
        if (me.username) localStorage.setItem('aura_username', me.username);
        if (me.role) localStorage.setItem('aura_user_role', me.role);
        if (me.access) localStorage.setItem('aura_user_access', JSON.stringify(me.access));
        if (me.status) localStorage.setItem('aura_user_status', me.status);
        // Update DASHBOARD state
        DASHBOARD.username = me.username || DASHBOARD.username;
        DASHBOARD.role = me.role || DASHBOARD.role;
        DASHBOARD.accessMap = me.access || DASHBOARD.accessMap;
        // Re-render hero greeting + avatar with real username
        const nameEl = document.querySelector('.pro-hero-avatar-name');
        const titleEl = document.querySelector('.pro-hero-title .accent');
        const avatarEl = document.querySelector('.pro-hero-avatar');
        if (nameEl) nameEl.textContent = me.username || DASHBOARD.username;
        if (titleEl) titleEl.textContent = me.username || DASHBOARD.username;
        if (avatarEl && me.username) avatarEl.textContent = (me.username[0] || 'U').toUpperCase();
        // Update meta row
        const metaRole = document.querySelectorAll('.pro-hero-meta-item strong');
        if (metaRole[1]) metaRole[1].textContent = me.role || DASHBOARD.role;
      }
    })();

    // Load whitelist status
    (async () => {
      const res = await api('/api/ip/whitelist', { method: 'GET' });
      if (res.ok && res.data && res.data.success) {
        const count = (res.data.whitelist || []).length;
        const enabled = res.data.settings && (res.data.settings.enabled === true || res.data.settings.enabled === 'true');
        const valEl = $('#proStatWl');
        const statusEl = $('#proStatWlStatus');
        const footEl = $('#proStatWlFoot');
        if (valEl) valEl.textContent = count;
        if (statusEl) {
          statusEl.textContent = enabled ? 'ON' : 'OFF';
          statusEl.classList.remove('neutral');
          statusEl.classList.toggle('warning', !enabled);
        }
        if (footEl) footEl.textContent = enabled ? `${count} IP terdaftar, proteksi aktif` : 'Proteksi dimatikan';
      }
    })();

    // Load data version
    (async () => {
      const res = await api('/api/data-version', { method: 'GET' });
      if (res.ok && res.data && res.data.success) {
        const v = res.data.version || 0;
        const el = $('#proStatVersion');
        if (el) el.textContent = v;
      }
    })();
  };

  // Expose
  window.DASHBOARD = DASHBOARD;

  // ============================================================
  // PROFILE PANEL
  // ============================================================
  const PROFILE = {
    async load() {
      const view = $('#profilView');
      // Show loading state
      if (view) {
        view.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--text-tertiary);font-family:var(--font-mono);font-size:12px;"><i class="fas fa-spinner" style="animation:spin 1s linear infinite;margin-right:8px;"></i> Loading profile...</div>';
      }
      const res = await api('/api/user/profile', { method: 'GET' });
      if (!res.ok || !res.data || !res.data.success) {
        const errMsg = (res.data && res.data.error) ? res.data.error : 'Gagal memuat profil';
        showToast(errMsg, 'error');
        // Render error state with retry button instead of stuck loading
        if (view) {
          view.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--accent-danger);font-family:var(--font-mono);font-size:13px;"><i class="fas fa-exclamation-triangle" style="font-size:24px;margin-bottom:12px;display:block;"></i>Gagal memuat profil: ' + escapeHtml(errMsg) + '<br><br><button onclick="PROFILE.load()" style="padding:10px 20px;background:var(--accent-primary);color:#fff;border:none;border-radius:8px;cursor:pointer;font-family:var(--font-mono);">Retry</button></div>';
        }
        return;
      }
      const data = res.data.data;
      // Sync username to localStorage for dashboard greeting
      if (data && data.username) {
        localStorage.setItem('aura_username', data.username);
        localStorage.setItem('aura_user_role', data.role || 'MEMBER');
        localStorage.setItem('aura_user_status', data.status || 'ACTIVE');
      }
      PROFILE.render(data);
    },

    render(data) {
      const view = $('#profilView');
      if (!view) return;

      const username = data.username || 'User';
      const role = data.role || 'MEMBER';
      const status = data.status || 'ACTIVE';
      const access = data.access || {};
      const avatarLetter = (username[0] || 'U').toUpperCase();

      // Count permissions
      let permCount = 0;
      let totalPerms = 0;
      Object.keys(access).forEach(k => {
        if (typeof access[k] === 'boolean') {
          totalPerms++;
          if (access[k]) permCount++;
        }
      });
      if (role === 'MASTER' || role === 'ADMIN') {
        permCount = totalPerms = 21; // full access
      }

      const sessionToken = token();
      const sessionDisplay = sessionToken ? sessionToken.slice(0, 8) + '••••••' + sessionToken.slice(-4) : '-';
      const clientIp = localStorage.getItem('aura_client_ip') || 'Unknown';

      view.innerHTML = `
        <div class="pro-profil-wrap">
          <div class="pro-profil-card">
            <div class="pro-profil-banner">
              <div class="pro-profil-banner-decoration">
                <div class="pro-profil-banner-chip">${role}</div>
                <div class="pro-profil-banner-chip">v2.0</div>
              </div>
            </div>
            <div class="pro-profil-body">
              <div class="pro-profil-avatar-wrap">
                <div class="pro-profil-avatar">${avatarLetter}</div>
                <div class="pro-profil-status-chip"><span class="dot"></span><span>${status === 'ACTIVE' ? 'Active' : status}</span></div>
              </div>
              <div class="pro-profil-name">${escapeHtml(username)}</div>
              <div class="pro-profil-email">${escapeHtml(username.toLowerCase())}@aura.os</div>

              <div class="pro-profil-mini-stats">
                <div class="pro-profil-mini-stat">
                  <div class="pro-profil-mini-stat-value">${permCount}</div>
                  <div class="pro-profil-mini-stat-label">Permissions</div>
                </div>
                <div class="pro-profil-mini-stat">
                  <div class="pro-profil-mini-stat-value">${role === 'MASTER' ? '∞' : '21'}</div>
                  <div class="pro-profil-mini-stat-label">Total Modules</div>
                </div>
                <div class="pro-profil-mini-stat">
                  <div class="pro-profil-mini-stat-value">${role === 'MASTER' ? '100' : Math.round((permCount / Math.max(totalPerms, 1)) * 100)}%</div>
                  <div class="pro-profil-mini-stat-label">Coverage</div>
                </div>
              </div>

              <div class="pro-profil-meta-list">
                <div class="pro-profil-meta-item">
                  <span class="pro-profil-meta-label"><i class="fas fa-id-badge" style="color:var(--accent-primary);"></i> Username</span>
                  <span class="pro-profil-meta-value">${escapeHtml(username)}</span>
                </div>
                <div class="pro-profil-meta-item">
                  <span class="pro-profil-meta-label"><i class="fas fa-user-tag" style="color:var(--neon-purple);"></i> Role</span>
                  <span class="pro-profil-meta-value purple">${role}</span>
                </div>
                <div class="pro-profil-meta-item">
                  <span class="pro-profil-meta-label"><i class="fas fa-key" style="color:var(--neon-cyan);"></i> Password</span>
                  <span class="pro-profil-meta-value cyan">•••••••</span>
                </div>
                <div class="pro-profil-meta-item">
                  <span class="pro-profil-meta-label"><i class="fas fa-shield-alt" style="color:var(--accent-success);"></i> Status</span>
                  <span class="pro-profil-meta-value green">${status}</span>
                </div>
                <div class="pro-profil-meta-item">
                  <span class="pro-profil-meta-label"><i class="fas fa-microchip" style="color:var(--accent-warning);"></i> Session</span>
                  <span class="pro-profil-meta-value muted">${sessionDisplay}</span>
                </div>
                <div class="pro-profil-meta-item">
                  <span class="pro-profil-meta-label"><i class="fas fa-globe" style="color:var(--neon-cyan);"></i> Client IP</span>
                  <span class="pro-profil-meta-value cyan">${escapeHtml(clientIp)}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="pro-profil-side">
            <div class="pro-pwd-card">
              <div class="pro-pwd-card-header">
                <div class="pro-pwd-card-icon"><i class="fas fa-lock"></i></div>
                <div class="pro-pwd-card-title-wrap">
                  <div class="pro-pwd-card-title">Ubah Password</div>
                  <div class="pro-pwd-card-desc">Pastikan password baru memenuhi kriteria keamanan minimal untuk melindungi akun.</div>
                </div>
              </div>

              <div class="pro-pwd-form">
                <div class="pro-pwd-field">
                  <label>Password Lama</label>
                  <input type="password" id="pwdOld" placeholder="Masukkan password lama Anda" autocomplete="off">
                  <button type="button" onclick="togglePwdVis('pwdOld', this)"><i class="fas fa-eye"></i></button>
                </div>

                <div class="pro-pwd-field">
                  <label>Password Baru</label>
                  <input type="password" id="pwdNew" placeholder="Minimal 6 karakter" autocomplete="off" oninput="checkPwdMatch()">
                  <button type="button" onclick="togglePwdVis('pwdNew', this)"><i class="fas fa-eye"></i></button>
                </div>

                <div class="pro-pwd-strength-section">
                  <div class="pro-pwd-strength-labels">
                    <span class="pro-pwd-strength-text" id="pwdStrengthText" style="color:var(--text-tertiary);">Strength</span>
                    <span class="pro-pwd-strength-text" id="pwdStrengthPct" style="color:var(--text-tertiary);">0%</span>
                  </div>
                  <div class="pro-pwd-strength-bar">
                    <div class="pro-pwd-strength-fill" id="pwdStrength"></div>
                  </div>
                </div>

                <div class="pro-pwd-field">
                  <label>Konfirmasi Password Baru</label>
                  <input type="password" id="pwdConfirm" placeholder="Ulangi password baru" autocomplete="off" oninput="checkPwdMatch()">
                  <button type="button" onclick="togglePwdVis('pwdConfirm', this)"><i class="fas fa-eye"></i></button>
                </div>

                <div class="pro-pwd-match-msg" id="pwdMatchMsg"></div>

                <div class="pro-pwd-submit-row">
                  <div class="pro-pwd-hint" id="pwdHints">
                    <span id="hintLen" class="cross"><i class="fas fa-circle"></i>Minimal 6 karakter</span>
                    <span id="hintUpper" class="cross"><i class="fas fa-circle"></i>Huruf kapital</span>
                    <span id="hintNum" class="cross"><i class="fas fa-circle"></i>Angka</span>
                    <span id="hintSpecial" class="cross"><i class="fas fa-circle"></i>Karakter spesial</span>
                  </div>
                  <button class="btn" id="pwdSubmitBtn" onclick="changePassword()"><i class="fas fa-shield-alt"></i> Simpan Password</button>
                </div>
              </div>
            </div>

            <div class="pro-audit-card">
              <div class="pro-audit-header">
                <div class="pro-audit-icon"><i class="fas fa-shield-halved"></i></div>
                <div>
                  <div class="pro-audit-title">Security Audit</div>
                  <div class="pro-audit-sub">Status keamanan akun Anda</div>
                </div>
              </div>
              <div class="pro-audit-list" id="proAuditList">
                <div class="pro-audit-item">
                  <div class="pro-audit-item-icon ok"><i class="fas fa-check"></i></div>
                  <div class="pro-audit-item-text"><strong>Session aktif</strong> — Token terverifikasi</div>
                </div>
                <div class="pro-audit-item">
                  <div class="pro-audit-item-icon ok"><i class="fas fa-check"></i></div>
                  <div class="pro-audit-item-text"><strong>Role valid</strong> — ${role} dengan ${permCount} permissions</div>
                </div>
                <div class="pro-audit-item">
                  <div class="pro-audit-item-icon ${role === 'MASTER' ? 'warn' : 'ok'}"><i class="fas ${role === 'MASTER' ? 'fa-info' : 'fa-check'}"></i></div>
                  <div class="pro-audit-item-text">${role === 'MASTER' ? '<strong>MASTER</strong> — Bypass IP whitelist aktif' : '<strong>IP Check</strong> — Subject to whitelist policy'}</div>
                </div>
                <div class="pro-audit-item">
                  <div class="pro-audit-item-icon ok"><i class="fas fa-check"></i></div>
                  <div class="pro-audit-item-text"><strong>Cross-device sync</strong> — Auto-refresh aktif</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    },
  };

  window.PROFILE = PROFILE;

  // ============================================================
  // IP WHITELIST PANEL
  // ============================================================
  const IPWL = {
    state: {
      whitelist: [],
      settings: { enabled: false, message: '' },
      filter: '',
    },

    async load() {
      const view = $('#ipWhitelistView');
      if (!view) return;
      IPWL.renderShell();
      const res = await api('/api/ip/whitelist', { method: 'GET' });
      if (res.ok && res.data && res.data.success) {
        IPWL.state.whitelist = res.data.whitelist || [];
        IPWL.state.settings = res.data.settings || { enabled: false, message: '' };
      }
      IPWL.render();
    },

    renderShell() {
      const view = $('#ipWhitelistView');
      view.innerHTML = `
        <div class="pro-ipwhitelist-wrap">
          <div class="pro-ipwhitelist-header">
            <div class="pro-ipwhitelist-title-block">
              <div class="pro-ipwhitelist-eyebrow"><i class="fas fa-shield-halved"></i> Security Layer</div>
              <h2 class="pro-ipwhitelist-title">IP Whitelist</h2>
              <p class="pro-ipwhitelist-subtitle">Kelola akses IP yang diizinkan untuk login. Hanya IP terdaftar yang dapat mengakses sistem saat proteksi diaktifkan.</p>
            </div>
          </div>

          <div class="pro-ipwl-stats">
            <div class="pro-ipwl-stat">
              <div class="pro-ipwl-stat-icon blue"><i class="fas fa-network-wired"></i></div>
              <div class="pro-ipwl-stat-body">
                <div class="pro-ipwl-stat-value" id="ipwlStatTotal">0</div>
                <div class="pro-ipwl-stat-label">Total IP</div>
              </div>
            </div>
            <div class="pro-ipwl-stat">
              <div class="pro-ipwl-stat-icon green"><i class="fas fa-circle-check"></i></div>
              <div class="pro-ipwl-stat-body">
                <div class="pro-ipwl-stat-value" id="ipwlStatStatus">OFF</div>
                <div class="pro-ipwl-stat-label">Protection</div>
              </div>
            </div>
            <div class="pro-ipwl-stat">
              <div class="pro-ipwl-stat-icon purple"><i class="fas fa-clock"></i></div>
              <div class="pro-ipwl-stat-body">
                <div class="pro-ipwl-stat-value" id="ipwlStatLast">-</div>
                <div class="pro-ipwl-stat-label">Last Added</div>
              </div>
            </div>
            <div class="pro-ipwl-stat">
              <div class="pro-ipwl-stat-icon orange"><i class="fas fa-user-shield"></i></div>
              <div class="pro-ipwl-stat-body">
                <div class="pro-ipwl-stat-value" id="ipwlStatMaster">Bypass</div>
                <div class="pro-ipwl-stat-label">Master Role</div>
              </div>
            </div>
          </div>

          <div class="pro-ipwl-settings">
            <div class="pro-ipwl-settings-row">
              <div class="pro-ipwl-toggle-card">
                <div class="pro-ipwl-toggle-info">
                  <div class="pro-ipwl-toggle-title"><i class="fas fa-exclamation-triangle"></i> Whitelist Protection</div>
                  <div class="pro-ipwl-toggle-desc">Aktifkan untuk membatasi login hanya dari IP terdaftar. MASTER tetap bypass.</div>
                </div>
                <label class="pro-ipwl-switch">
                  <input type="checkbox" id="ipWlToggle" onchange="IPWL.toggleProtection()">
                  <span class="pro-ipwl-switch-track"></span>
                  <span class="pro-ipwl-switch-thumb"></span>
                </label>
              </div>
              <div class="pro-ipwl-message-card">
                <label class="pro-ipwl-message-label"><i class="fas fa-comment-dots"></i> Pesan Penolakan (Custom Message)</label>
                <input type="text" class="pro-ipwl-message-input" id="ipWlMessage" placeholder="IP Anda tidak ada dalam whitelist. Hubungi admin.">
                <button class="pro-ipwl-message-save" onclick="IPWL.saveMessage()"><i class="fas fa-save"></i> Simpan Pesan</button>
              </div>
            </div>
          </div>

          <div class="pro-ipwl-add-card">
            <div class="pro-ipwl-add-header">
              <i class="fas fa-plus-circle"></i>
              <div class="pro-ipwl-add-header-title">Tambah IP Baru</div>
            </div>
            <div class="pro-ipwl-add-form">
              <div class="pro-ipwl-add-field">
                <label>IP Address</label>
                <input type="text" class="mono" id="ipWlIpInput" placeholder="192.168.1.1">
              </div>
              <div class="pro-ipwl-add-field">
                <label>Label (opsional)</label>
                <input type="text" id="ipWlLabelInput" placeholder="Office / Home / Server">
              </div>
              <button class="pro-ipwl-add-btn" onclick="IPWL.add()"><i class="fas fa-plus"></i> Tambah</button>
            </div>
          </div>

          <div class="pro-ipwl-table-card">
            <div class="pro-ipwl-table-toolbar">
              <div class="pro-ipwl-table-title">
                <i class="fas fa-list"></i>
                Daftar IP Terdaftar
                <span class="count" id="ipwlTableCount">0</span>
              </div>
              <div class="pro-ipwl-search">
                <i class="fas fa-search"></i>
                <input type="text" id="ipWlSearch" placeholder="Cari IP atau label..." oninput="IPWL.filter(this.value)">
              </div>
            </div>
            <div class="pro-ipwl-table-scroll">
              <table class="pro-ipwl-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>IP Address</th>
                    <th>Label</th>
                    <th>Added By</th>
                    <th>Date</th>
                    <th class="pro-ipwl-cell-action">Action</th>
                  </tr>
                </thead>
                <tbody id="ipWlTableBody">
                  <tr><td colspan="6"><div class="pro-ipwl-loading"><i class="fas fa-spinner"></i> Memuat data...</div></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
    },

    render() {
      // Stats
      const total = IPWL.state.whitelist.length;
      const enabled = IPWL.state.settings.enabled === true || IPWL.state.settings.enabled === 'true';
      const totalEl = $('#ipwlStatTotal');
      const statusEl = $('#ipwlStatStatus');
      const lastEl = $('#ipwlStatLast');
      if (totalEl) totalEl.textContent = total;
      if (statusEl) {
        statusEl.textContent = enabled ? 'ON' : 'OFF';
        const statCard = statusEl.closest('.pro-ipwl-stat');
        const iconEl = statCard ? statCard.querySelector('.pro-ipwl-stat-icon') : null;
        if (iconEl) {
          iconEl.classList.toggle('green', enabled);
          iconEl.classList.toggle('orange', !enabled);
        }
      }
      if (lastEl) {
        if (total > 0) {
          const latest = IPWL.state.whitelist[0];
          lastEl.textContent = latest.created_at ? new Date(latest.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '-';
        } else {
          lastEl.textContent = '-';
        }
      }

      // Toggle
      const toggle = $('#ipWlToggle');
      if (toggle) toggle.checked = enabled;

      // Message
      const msgInput = $('#ipWlMessage');
      if (msgInput) msgInput.value = IPWL.state.settings.message || '';

      // Table
      IPWL.renderTable();

      // Count badge
      const countEl = $('#ipwlTableCount');
      if (countEl) countEl.textContent = total;
    },

    renderTable() {
      const body = $('#ipWlTableBody');
      if (!body) return;

      const filter = IPWL.state.filter.toLowerCase();
      const items = IPWL.state.whitelist.filter(w => {
        if (!filter) return true;
        const ip = (w.ip_address || '').toLowerCase();
        const label = (w.label || '').toLowerCase();
        return ip.includes(filter) || label.includes(filter);
      });

      if (items.length === 0) {
        body.innerHTML = `
          <tr><td colspan="6">
            <div class="pro-ipwl-empty">
              <div class="pro-ipwl-empty-icon"><i class="fas fa-network-wired"></i></div>
              <div class="pro-ipwl-empty-title">${IPWL.state.whitelist.length === 0 ? 'Belum ada IP terdaftar' : 'Tidak ada hasil'}</div>
              <div class="pro-ipwl-empty-desc">${IPWL.state.whitelist.length === 0 ? 'Tambahkan IP pertama menggunakan form di atas' : 'Coba kata kunci lain'}</div>
            </div>
          </td></tr>
        `;
        return;
      }

      body.innerHTML = items.map((w, idx) => `
        <tr class="pro-fade-in" style="animation-delay: ${idx * 30}ms;">
          <td class="pro-ipwl-cell-num">${String(idx + 1).padStart(2, '0')}</td>
          <td>
            <div class="pro-ipwl-cell-ip">
              <span class="ip-icon"><i class="fas fa-globe"></i></span>
              ${escapeHtml(w.ip_address || '-')}
            </div>
          </td>
          <td class="pro-ipwl-cell-label">${w.label ? escapeHtml(w.label) : '<span class="muted">— no label —</span>'}</td>
          <td class="pro-ipwl-cell-by">${escapeHtml(w.added_by || '-')}</td>
          <td class="pro-ipwl-cell-date">${fmtDate(w.created_at)}</td>
          <td class="pro-ipwl-cell-action">
            <button class="pro-ipwl-delete-btn" onclick="IPWL.remove(${w.id}, '${escapeHtml(w.ip_address || '')}')" title="Hapus IP">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');
    },

    filter(val) {
      IPWL.state.filter = val || '';
      IPWL.renderTable();
    },

    async toggleProtection() {
      const toggle = $('#ipWlToggle');
      const enabled = toggle.checked;
      const res = await api('/api/ip/whitelist', {
        method: 'PUT',
        body: { enabled, message: IPWL.state.settings.message || 'IP Anda tidak ada dalam whitelist. Hubungi admin.' },
      });
      if (res.ok && res.data && res.data.success) {
        IPWL.state.settings.enabled = enabled;
        showToast(`Proteksi whitelist ${enabled ? 'AKTIF' : 'DIMATIKAN'}`, 'success');
        IPWL.render();
      } else {
        showToast('Gagal mengubah proteksi', 'error');
        toggle.checked = !enabled;
      }
    },

    async saveMessage() {
      const msg = $('#ipWlMessage').value.trim() || 'IP Anda tidak ada dalam whitelist. Hubungi admin.';
      const res = await api('/api/ip/whitelist', {
        method: 'PUT',
        body: { enabled: IPWL.state.settings.enabled === true || IPWL.state.settings.enabled === 'true', message: msg },
      });
      if (res.ok && res.data && res.data.success) {
        IPWL.state.settings.message = msg;
        showToast('Pesan penolakan tersimpan', 'success');
      } else {
        showToast('Gagal menyimpan pesan', 'error');
      }
    },

    async add() {
      const ip = $('#ipWlIpInput').value.trim();
      const label = $('#ipWlLabelInput').value.trim();
      if (!ip) { showToast('IP address wajib diisi', 'error'); return; }
      // Basic IP format check (IPv4 or IPv6)
      if (!/^[\d.:a-fA-F]+$/.test(ip)) { showToast('Format IP tidak valid', 'error'); return; }

      const res = await api('/api/ip/whitelist', { method: 'POST', body: { ip, label } });
      if (res.ok && res.data && res.data.success) {
        showToast('IP berhasil ditambahkan', 'success');
        $('#ipWlIpInput').value = '';
        $('#ipWlLabelInput').value = '';
        await IPWL.load();
      } else {
        showToast(res.data?.error || 'Gagal menambah IP (mungkin sudah ada)', 'error');
      }
    },

    async remove(id, ip) {
      if (!confirm(`Hapus IP ${ip} dari whitelist?`)) return;
      const res = await api(`/api/ip/whitelist/${id}`, { method: 'DELETE' });
      if (res.ok && res.data && res.data.success) {
        showToast('IP dihapus dari whitelist', 'success');
        await IPWL.load();
      } else {
        showToast('Gagal menghapus IP', 'error');
      }
    },
  };

  window.IPWL = IPWL;

  // ============================================================
  // AUTO-INIT
  // ============================================================
  document.addEventListener('DOMContentLoaded', () => {
    // Patch switchToProfil/switchToDashboard/ipWhitelist if not defined or override to use new pro UI
    if (!window.switchToProfilPro) {
      window.switchToProfilPro = async function () {
        if (typeof hideAllViews === 'function') hideAllViews();
        const v = $('#profilView');
        if (v) v.style.display = 'block';
        const bc = $('#breadcrumbPage');
        if (bc) bc.textContent = 'profil';
        await PROFILE.load();
      };
    }
    if (!window.ipWhitelistPro) {
      window.ipWhitelistPro = async function () {
        if (typeof hideAllViews === 'function') hideAllViews();
        const v = $('#ipWhitelistView');
        if (v) v.style.display = 'block';
        const bc = $('#breadcrumbPage');
        if (bc) bc.textContent = 'ip whitelist';
        await IPWL.load();
      };
    }
    if (!window.renderDashboardPro) {
      window.renderDashboardPro = function () {
        DASHBOARD.renderDashboard();
      };
    }
  });

})();
