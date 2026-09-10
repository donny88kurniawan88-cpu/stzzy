/* ============================================================
   AURA.OS // SETTING-PRO.JS
   Inline Setting panel — themes, toggles, data management,
   system info. Exposed as window.SettingPro.
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     THEME PRESETS — 6 themes. Each defines the full set of
     accent CSS variables applied to :root.
     ============================================================ */
  var THEMES = {
    aurora: {
      name: 'Aurora Dark',
      desc: '#3b82f6 · #8b5cf6',
      isDefault: true,
      swatch: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'],
      vars: {
        '--bg-primary': '#0a0a0f',
        '--bg-secondary': '#111118',
        '--bg-tertiary': '#1a1a24',
        '--accent-primary': '#3b82f6',
        '--accent-primary-light': 'rgba(59, 130, 246, 0.12)',
        '--accent-primary-dark': '#2563eb',
        '--accent-primary-glow': 'rgba(59, 130, 246, 0.35)',
        '--accent-purple': '#8b5cf6',
        '--accent-purple-light': 'rgba(139, 92, 246, 0.10)',
        '--accent-success': '#10b981',
        '--accent-success-light': 'rgba(16, 185, 129, 0.12)',
        '--accent-success-glow': 'rgba(16, 185, 129, 0.35)',
        '--accent-warning': '#f59e0b',
        '--accent-warning-light': 'rgba(245, 158, 11, 0.12)',
        '--accent-danger': '#ef4444',
        '--accent-danger-light': 'rgba(239, 68, 68, 0.12)',
        '--accent-pink': '#ec4899',
        '--accent-teal': '#14b8a6'
      }
    },
    midnight: {
      name: 'Midnight Blue',
      desc: '#0ea5e9 · #6366f1',
      swatch: ['#0ea5e9', '#6366f1', '#22c55e', '#f97316', '#ef4444'],
      vars: {
        '--bg-primary': '#070b14',
        '--bg-secondary': '#0e1626',
        '--bg-tertiary': '#16213a',
        '--accent-primary': '#0ea5e9',
        '--accent-primary-light': 'rgba(14, 165, 233, 0.12)',
        '--accent-primary-dark': '#0284c7',
        '--accent-primary-glow': 'rgba(14, 165, 233, 0.35)',
        '--accent-purple': '#6366f1',
        '--accent-purple-light': 'rgba(99, 102, 241, 0.10)',
        '--accent-success': '#22c55e',
        '--accent-success-light': 'rgba(34, 197, 94, 0.12)',
        '--accent-success-glow': 'rgba(34, 197, 94, 0.35)',
        '--accent-warning': '#f97316',
        '--accent-warning-light': 'rgba(249, 115, 22, 0.12)',
        '--accent-danger': '#ef4444',
        '--accent-danger-light': 'rgba(239, 68, 68, 0.12)',
        '--accent-pink': '#ec4899',
        '--accent-teal': '#06b6d4'
      }
    },
    carbon: {
      name: 'Carbon',
      desc: '#64748b · #94a3b8',
      swatch: ['#64748b', '#94a3b8', '#10b981', '#eab308', '#f43f5e'],
      vars: {
        '--bg-primary': '#08080a',
        '--bg-secondary': '#0e0e11',
        '--bg-tertiary': '#16161a',
        '--accent-primary': '#64748b',
        '--accent-primary-light': 'rgba(100, 116, 139, 0.12)',
        '--accent-primary-dark': '#475569',
        '--accent-primary-glow': 'rgba(100, 116, 139, 0.35)',
        '--accent-purple': '#a78bfa',
        '--accent-purple-light': 'rgba(167, 139, 250, 0.10)',
        '--accent-success': '#10b981',
        '--accent-success-light': 'rgba(16, 185, 129, 0.12)',
        '--accent-success-glow': 'rgba(16, 185, 129, 0.35)',
        '--accent-warning': '#eab308',
        '--accent-warning-light': 'rgba(234, 179, 8, 0.12)',
        '--accent-danger': '#f43f5e',
        '--accent-danger-light': 'rgba(244, 63, 94, 0.12)',
        '--accent-pink': '#ec4899',
        '--accent-teal': '#14b8a6'
      }
    },
    forest: {
      name: 'Forest',
      desc: '#10b981 · #84cc16',
      swatch: ['#10b981', '#84cc16', '#22c55e', '#f59e0b', '#ef4444'],
      vars: {
        '--bg-primary': '#0a0f0c',
        '--bg-secondary': '#0f1813',
        '--bg-tertiary': '#15211b',
        '--accent-primary': '#10b981',
        '--accent-primary-light': 'rgba(16, 185, 129, 0.12)',
        '--accent-primary-dark': '#059669',
        '--accent-primary-glow': 'rgba(16, 185, 129, 0.35)',
        '--accent-purple': '#84cc16',
        '--accent-purple-light': 'rgba(132, 204, 22, 0.10)',
        '--accent-success': '#22c55e',
        '--accent-success-light': 'rgba(34, 197, 94, 0.12)',
        '--accent-success-glow': 'rgba(34, 197, 94, 0.35)',
        '--accent-warning': '#f59e0b',
        '--accent-warning-light': 'rgba(245, 158, 11, 0.12)',
        '--accent-danger': '#ef4444',
        '--accent-danger-light': 'rgba(239, 68, 68, 0.12)',
        '--accent-pink': '#ec4899',
        '--accent-teal': '#14b8a6'
      }
    },
    sunset: {
      name: 'Sunset',
      desc: '#f97316 · #ec4899',
      swatch: ['#f97316', '#ec4899', '#fbbf24', '#a855f7', '#ef4444'],
      vars: {
        '--bg-primary': '#0f0807',
        '--bg-secondary': '#1a0e0c',
        '--bg-tertiary': '#241513',
        '--accent-primary': '#f97316',
        '--accent-primary-light': 'rgba(249, 115, 22, 0.12)',
        '--accent-primary-dark': '#ea580c',
        '--accent-primary-glow': 'rgba(249, 115, 22, 0.35)',
        '--accent-purple': '#a855f7',
        '--accent-purple-light': 'rgba(168, 85, 247, 0.10)',
        '--accent-success': '#fbbf24',
        '--accent-success-light': 'rgba(251, 191, 36, 0.12)',
        '--accent-success-glow': 'rgba(251, 191, 36, 0.35)',
        '--accent-warning': '#fb923c',
        '--accent-warning-light': 'rgba(251, 146, 60, 0.12)',
        '--accent-danger': '#ef4444',
        '--accent-danger-light': 'rgba(239, 68, 68, 0.12)',
        '--accent-pink': '#ec4899',
        '--accent-teal': '#14b8a6'
      }
    },
    royal: {
      name: 'Royal Purple',
      desc: '#8b5cf6 · #d946ef',
      swatch: ['#8b5cf6', '#d946ef', '#06b6d4', '#f59e0b', '#ef4444'],
      vars: {
        '--bg-primary': '#0a0712',
        '--bg-secondary': '#130e1f',
        '--bg-tertiary': '#1c1530',
        '--accent-primary': '#8b5cf6',
        '--accent-primary-light': 'rgba(139, 92, 246, 0.12)',
        '--accent-primary-dark': '#7c3aed',
        '--accent-primary-glow': 'rgba(139, 92, 246, 0.35)',
        '--accent-purple': '#d946ef',
        '--accent-purple-light': 'rgba(217, 70, 239, 0.10)',
        '--accent-success': '#06b6d4',
        '--accent-success-light': 'rgba(6, 182, 212, 0.12)',
        '--accent-success-glow': 'rgba(6, 182, 212, 0.35)',
        '--accent-warning': '#f59e0b',
        '--accent-warning-light': 'rgba(245, 158, 11, 0.12)',
        '--accent-danger': '#ef4444',
        '--accent-danger-light': 'rgba(239, 68, 68, 0.12)',
        '--accent-pink': '#ec4899',
        '--accent-teal': '#14b8a6'
      }
    }
  };

  var THEME_ORDER = ['aurora', 'midnight', 'carbon', 'forest', 'sunset', 'royal'];

  /* ============================================================
     HELPERS
     ============================================================ */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function getSettings() {
    try {
      var raw = localStorage.getItem('aura_settings');
      if (!raw) return {};
      return JSON.parse(raw);
    } catch (e) { return {}; }
  }

  function saveSettings(obj) {
    try {
      localStorage.setItem('aura_settings', JSON.stringify(obj || {}));
    } catch (e) { console.error('SettingPro save error:', e); }
  }

  function getSetting(key, fallback) {
    var s = getSettings();
    return s[key] !== undefined ? s[key] : fallback;
  }

  function setSetting(key, value) {
    var s = getSettings();
    s[key] = value;
    saveSettings(s);
  }

  function showToast(msg, type) {
    try {
      if (typeof window.showToast === 'function') {
        window.showToast(msg, type || 'info');
      } else {
        console.log('[SettingPro]', msg);
      }
    } catch (e) { console.log('[SettingPro]', msg); }
  }

  function addTerminalLog(msg) {
    try {
      if (typeof window.addTerminalLog === 'function') {
        window.addTerminalLog(msg);
      }
    } catch (e) {}
  }

  /* ============================================================
     THEME LOGIC
     ============================================================ */
  function applyTheme(themeKey) {
    var theme = THEMES[themeKey];
    if (!theme) return;
    var root = document.documentElement;
    Object.keys(theme.vars).forEach(function (key) {
      root.style.setProperty(key, theme.vars[key]);
    });
    localStorage.setItem('aura_theme', themeKey);
    // Update active state on cards
    $$('.sp-theme-card').forEach(function (card) {
      if (card.getAttribute('data-theme') === themeKey) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
    });
    addTerminalLog('Theme applied: ' + theme.name + ' (' + themeKey + ')');
  }

  function getCurrentTheme() {
    return localStorage.getItem('aura_theme') || 'aurora';
  }

  function renderThemes() {
    var container = $('#spThemes');
    if (!container) return;
    var current = getCurrentTheme();
    var html = '';
    THEME_ORDER.forEach(function (key) {
      var t = THEMES[key];
      var isActive = key === current;
      var swatchHtml = t.swatch.map(function (c) {
        return '<div style="background:' + c + ';"></div>';
      }).join('');
      html += '' +
        '<div class="sp-theme-card' + (isActive ? ' active' : '') + '" data-theme="' + key + '" role="button" tabindex="0" aria-label="Apply ' + escapeHtml(t.name) + ' theme">' +
          '<div class="sp-theme-swatch">' + swatchHtml + '</div>' +
          '<div class="sp-theme-name">' +
            escapeHtml(t.name) +
            (t.isDefault ? '<span class="sp-default-pill">Default</span>' : '') +
          '</div>' +
          '<div class="sp-theme-desc">' + escapeHtml(t.desc) + '</div>' +
        '</div>';
    });
    container.innerHTML = html;
    // Wire click
    $$('.sp-theme-card', container).forEach(function (card) {
      card.addEventListener('click', function () {
        var key = card.getAttribute('data-theme');
        applyTheme(key);
        showToast('Theme: ' + THEMES[key].name + ' applied', 'success');
      });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
    });
  }

  /* ============================================================
     GENERAL SETTINGS — toggles + refresh interval
     ============================================================ */
  function renderGeneralSettings() {
    var autoScroll = getSetting('autoScroll', true);
    var toastNotif = getSetting('toastNotif', true);
    var refreshInterval = getSetting('refreshInterval', 10);

    var autoScrollEl = $('#spAutoScroll');
    var toastNotifEl = $('#spToastNotif');
    var refreshEl = $('#spRefreshInterval');

    if (autoScrollEl) autoScrollEl.checked = !!autoScroll;
    if (toastNotifEl) toastNotifEl.checked = !!toastNotif;
    if (refreshEl) refreshEl.value = String(refreshInterval);
  }

  function wireGeneralSettings() {
    var autoScrollEl = $('#spAutoScroll');
    var toastNotifEl = $('#spToastNotif');
    var refreshEl = $('#spRefreshInterval');

    if (autoScrollEl) {
      autoScrollEl.addEventListener('change', function () {
        setSetting('autoScroll', autoScrollEl.checked);
        showToast('Terminal auto-scroll ' + (autoScrollEl.checked ? 'enabled' : 'disabled'), 'success');
        addTerminalLog('Setting: autoScroll=' + autoScrollEl.checked);
      });
    }
    if (toastNotifEl) {
      toastNotifEl.addEventListener('change', function () {
        setSetting('toastNotif', toastNotifEl.checked);
        showToast('Toast notifications ' + (toastNotifEl.checked ? 'enabled' : 'disabled'), 'success');
        addTerminalLog('Setting: toastNotif=' + toastNotifEl.checked);
      });
    }
    if (refreshEl) {
      refreshEl.addEventListener('change', function () {
        var val = parseInt(refreshEl.value, 10) || 10;
        setSetting('refreshInterval', val);
        showToast('Auto-refresh set to ' + val + 's', 'success');
        addTerminalLog('Setting: refreshInterval=' + val + 's');
      });
    }
  }

  /* ============================================================
     DATA MANAGEMENT — Clear, Export, Reset
     ============================================================ */
  function clearAllLocalData() {
    // Preserve admin auth token — only clear stale access/role/memo data
    var preservedToken = localStorage.getItem('aura_auth_token') || '';
    var preservedTheme = localStorage.getItem('aura_theme') || 'aurora';

    // Call API to bump data_version (forces all OTHER devices to refresh)
    var fetchOpts = { method: 'POST' };
    if (preservedToken) {
      fetchOpts.headers = { 'x-auth-token': preservedToken };
    }

    addTerminalLog('Clear all data requested...');
    showToast('Clearing all local data...', 'info');

    fetch('/api/clear-all-data', fetchOpts)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        // Clear stale access/role/memo data but KEEP auth token + theme
        localStorage.removeItem('aura_user_role');
        localStorage.removeItem('aura_user_access');
        localStorage.removeItem('aura_data_version');
        localStorage.removeItem('aura_memo');
        localStorage.removeItem('aura_notes');
        localStorage.removeItem('aura_reminders');
        localStorage.removeItem('aura_settings');

        // Restore theme
        if (preservedTheme) localStorage.setItem('aura_theme', preservedTheme);

        if (data && data.success) {
          localStorage.setItem('aura_data_version', String(data.version));
          showToast('Clear all data berhasil. Version: ' + data.version + '. Semua perangkat akan refresh.', 'success');
          addTerminalLog('Clear all data — version bumped to ' + data.version);
          // Re-fetch fresh access from database (admin stays logged in)
          fetch('/api/me', { headers: { 'x-auth-token': preservedToken } })
            .then(function (r) { return r.json(); })
            .then(function (meData) {
              if (meData && meData.success) {
                var me = meData.user || meData.data;
                if (me) {
                  localStorage.setItem('aura_user_role', me.role || 'MEMBER');
                  localStorage.setItem('aura_user_access', JSON.stringify(me.access || {}));
                  if (typeof window.applyAccess === 'function') {
                    window.applyAccess(me.role || 'MEMBER', me.access || {});
                  }
                  showToast('Access control refreshed', 'success');
                  setTimeout(function () { location.reload(); }, 1200);
                } else {
                  setTimeout(function () { location.reload(); }, 1200);
                }
              } else {
                setTimeout(function () { location.reload(); }, 1200);
              }
            })
            .catch(function () { setTimeout(function () { location.reload(); }, 1200); });
        } else {
          showToast('Clear lokal berhasil (API sync gagal: ' + ((data && data.error) || 'unknown') + ')', 'success');
          addTerminalLog('All local data cleared (API sync failed)');
          setTimeout(function () { location.reload(); }, 1200);
        }
      })
      .catch(function (err) {
        // Fallback: clear stale data but keep token + theme
        localStorage.removeItem('aura_user_role');
        localStorage.removeItem('aura_user_access');
        localStorage.removeItem('aura_data_version');
        localStorage.removeItem('aura_memo');
        localStorage.removeItem('aura_notes');
        localStorage.removeItem('aura_reminders');
        localStorage.removeItem('aura_settings');
        if (preservedTheme) localStorage.setItem('aura_theme', preservedTheme);
        showToast('Clear lokal berhasil (koneksi error)', 'success');
        addTerminalLog('All local data cleared (connection error)');
        setTimeout(function () { location.reload(); }, 1000);
      });
  }

  function exportSettings() {
    var exportObj = {
      _meta: {
        exported_at: new Date().toISOString(),
        app: 'AURA.OS Dashboard',
        version: '1.0.0'
      },
      settings: getSettings(),
      theme: localStorage.getItem('aura_theme') || 'aurora',
      notes: [],
      reminders: []
    };
    try {
      var notesRaw = localStorage.getItem('aura_notes');
      if (notesRaw) exportObj.notes = JSON.parse(notesRaw);
    } catch (e) {}
    try {
      var remRaw = localStorage.getItem('aura_reminders');
      if (remRaw) exportObj.reminders = JSON.parse(remRaw);
    } catch (e) {}

    var json = JSON.stringify(exportObj, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    var ts = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    a.download = 'aura-settings-' + ts + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    showToast('Settings exported to JSON file', 'success');
    addTerminalLog('Settings exported (' + json.length + ' bytes)');
  }

  function resetToDefault() {
    localStorage.removeItem('aura_settings');
    localStorage.setItem('aura_theme', 'aurora');
    applyTheme('aurora');
    renderGeneralSettings();
    showToast('Settings reset to default. Theme: Aurora Dark.', 'success');
    addTerminalLog('Settings reset to default');
  }

  function wireDataManagement() {
    var clearBtn = $('#spClearData');
    var exportBtn = $('#spExportSettings');
    var resetBtn = $('#spResetDefault');

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (typeof window.showPopup === 'function') {
          window.showPopup(
            'Konfirmasi Clear All Data',
            '<div style="padding:20px; color:var(--text-secondary); text-align:center;"><p style="margin-bottom:12px;">Semua data lokal akan dihapus dan <strong style="color:var(--accent-warning);">semua perangkat</strong> yang sedang membuka Dashboard akan otomatis refresh access control.</p><p style="font-size:12px; color:var(--text-tertiary);">Anda tetap login di perangkat ini.</p></div>',
            true,
            function () { clearAllLocalData(); }
          );
        } else {
          if (confirm('Clear all local data? Auth token will be preserved.')) {
            clearAllLocalData();
          }
        }
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', exportSettings);
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (typeof window.showPopup === 'function') {
          window.showPopup(
            'Reset Settings to Default',
            '<div style="padding:20px; color:var(--text-secondary); text-align:center;"><p style="margin-bottom:12px;">Semua pengaturan akan dikembalikan ke default.</p><p style="font-size:12px; color:var(--text-tertiary);">Theme: Aurora Dark. Notes & reminders tetap utuh.</p></div>',
            true,
            function () { resetToDefault(); }
          );
        } else {
          if (confirm('Reset all settings to default?')) resetToDefault();
        }
      });
    }
  }

  /* ============================================================
     SYSTEM INFO
     ============================================================ */
  var bootTime = Date.now();

  function formatUptime(ms) {
    var s = Math.floor(ms / 1000);
    var d = Math.floor(s / 86400);
    var h = Math.floor((s % 86400) / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    if (d > 0) return d + 'd ' + h + 'h ' + m + 'm';
    if (h > 0) return h + 'h ' + m + 'm ' + sec + 's';
    if (m > 0) return m + 'm ' + sec + 's';
    return sec + 's';
  }

  function renderSystemInfo() {
    var versionEl = $('#spSysVersion');
    var uptimeEl = $('#spSysUptime');
    var dbEl = $('#spSysDb');
    var storageEl = $('#spSysStorage');
    var themeEl = $('#spSysTheme');
    var notesEl = $('#spSysNotes');
    var remindersEl = $('#spSysReminders');

    if (versionEl) versionEl.textContent = 'v1.0.0';

    if (uptimeEl) {
      function tickUptime() {
        if (!uptimeEl) return;
        uptimeEl.textContent = formatUptime(Date.now() - bootTime);
      }
      tickUptime();
      if (window.__spUptimeInterval) clearInterval(window.__spUptimeInterval);
      window.__spUptimeInterval = setInterval(tickUptime, 1000);
    }

    if (dbEl) {
      var dbDot = dbEl.querySelector('.sp-status-dot');
      dbEl.innerHTML = '<span class="sp-status-dot"></span> Online';
      // Verify API health
      fetch('/api/me', { headers: { 'x-auth-token': localStorage.getItem('aura_auth_token') || '' } })
        .then(function (r) {
          if (dbEl) {
            if (r.ok) {
              dbEl.innerHTML = '<span class="sp-status-dot"></span> Online';
            } else if (r.status === 401 || r.status === 404) {
              dbEl.innerHTML = '<span class="sp-status-dot warning"></span> Auth Issue';
            } else {
              dbEl.innerHTML = '<span class="sp-status-dot warning"></span> Degraded';
            }
          }
        })
        .catch(function () {
          if (dbEl) dbEl.innerHTML = '<span class="sp-status-dot offline"></span> Offline';
        });
    }

    if (storageEl) {
      try {
        var total = 0;
        for (var i = 0; i < localStorage.length; i++) {
          var key = localStorage.key(i);
          if (key) {
            var val = localStorage.getItem(key) || '';
            total += key.length + val.length;
          }
        }
        var kb = (total / 1024).toFixed(1);
        storageEl.textContent = kb + ' KB';
      } catch (e) {
        storageEl.textContent = '—';
      }
    }

    if (themeEl) {
      var tk = localStorage.getItem('aura_theme') || 'aurora';
      themeEl.textContent = THEMES[tk] ? THEMES[tk].name : 'Aurora Dark';
    }

    if (notesEl) {
      try {
        var n = JSON.parse(localStorage.getItem('aura_notes') || '[]');
        notesEl.textContent = String(n.length);
      } catch (e) { notesEl.textContent = '0'; }
    }

    if (remindersEl) {
      try {
        var r = JSON.parse(localStorage.getItem('aura_reminders') || '[]');
        remindersEl.textContent = String(r.length);
      } catch (e) { remindersEl.textContent = '0'; }
    }
  }

  /* ============================================================
     RENDER — full panel HTML
     ============================================================ */
  function renderShell(container) {
    var html = '' +
      '<div class="settingWrap pro-setting">' +
        '<div class="sp-header">' +
          '<div class="sp-title-block">' +
            '<div class="sp-eyebrow"><span class="pulse-dot"></span> System Configuration</div>' +
            '<div class="sp-title"><i class="fas fa-sliders"></i> Setting</div>' +
            '<div class="sp-sub">Tema, preferensi, dan manajemen data <span class="version-tag"><i class="fas fa-code-branch"></i> v1.0.0</span></div>' +
          '</div>' +
        '</div>' +

        '<div class="sp-grid">' +
          // THEME SELECTOR (full width)
          '<div class="sp-card">' +
            '<div class="sp-card-head">' +
              '<div class="sp-card-icon"><i class="fas fa-palette"></i></div>' +
              '<div>' +
                '<h3 class="sp-card-title">Theme Selector</h3>' +
                '<div class="sp-card-sub">Pilih tema visual — disimpan ke localStorage</div>' +
              '</div>' +
            '</div>' +
            '<div class="sp-themes" id="spThemes"></div>' +
          '</div>' +
        '</div>' +

        '<div class="sp-grid two-col" style="margin-top:22px;">' +
          // GENERAL SETTINGS
          '<div class="sp-card">' +
            '<div class="sp-card-head">' +
              '<div class="sp-card-icon blue"><i class="fas fa-toggle-on"></i></div>' +
              '<div>' +
                '<h3 class="sp-card-title">General Settings</h3>' +
                '<div class="sp-card-sub">Preferensi dashboard & terminal</div>' +
              '</div>' +
            '</div>' +
            '<div class="sp-row">' +
              '<div class="sp-row-info">' +
                '<div class="sp-row-label">Terminal Auto-Scroll</div>' +
                '<div class="sp-row-desc">Scroll terminal otomatis ke bottom saat log baru</div>' +
              '</div>' +
              '<label class="sp-switch"><input type="checkbox" id="spAutoScroll"><span class="sp-switch-slider"></span></label>' +
            '</div>' +
            '<div class="sp-row">' +
              '<div class="sp-row-info">' +
                '<div class="sp-row-label">Toast Notifications</div>' +
                '<div class="sp-row-desc">Tampilkan notifikasi toast untuk aksi user</div>' +
              '</div>' +
              '<label class="sp-switch"><input type="checkbox" id="spToastNotif"><span class="sp-switch-slider"></span></label>' +
            '</div>' +
            '<div class="sp-row" style="flex-direction:column; align-items:stretch; gap:8px;">' +
              '<div class="sp-row-info">' +
                '<div class="sp-row-label">Auto-refresh Interval</div>' +
                '<div class="sp-row-desc">Interval polling data dashboard (My Event, dll)</div>' +
              '</div>' +
              '<select class="sp-select" id="spRefreshInterval">' +
                '<option value="5">5 seconds (real-time)</option>' +
                '<option value="10">10 seconds (recommended)</option>' +
                '<option value="30">30 seconds (balanced)</option>' +
                '<option value="60">60 seconds (low-power)</option>' +
              '</select>' +
            '</div>' +
          '</div>' +

          // SYSTEM INFO
          '<div class="sp-card">' +
            '<div class="sp-card-head">' +
              '<div class="sp-card-icon teal"><i class="fas fa-circle-info"></i></div>' +
              '<div>' +
                '<h3 class="sp-card-title">System Info</h3>' +
                '<div class="sp-card-sub">Status sistem & runtime</div>' +
              '</div>' +
            '</div>' +
            '<div class="sp-info-list">' +
              '<div class="sp-info-row"><span class="sp-info-label"><i class="fas fa-code-branch"></i> Version</span><span class="sp-info-value" id="spSysVersion">v1.0.0</span></div>' +
              '<div class="sp-info-row"><span class="sp-info-label"><i class="fas fa-clock"></i> Uptime</span><span class="sp-info-value" id="spSysUptime">0s</span></div>' +
              '<div class="sp-info-row"><span class="sp-info-label"><i class="fas fa-database"></i> Database</span><span class="sp-info-value" id="spSysDb"><span class="sp-status-dot"></span> Checking...</span></div>' +
              '<div class="sp-info-row"><span class="sp-info-label"><i class="fas fa-hard-drive"></i> Storage Used</span><span class="sp-info-value" id="spSysStorage">—</span></div>' +
              '<div class="sp-info-row"><span class="sp-info-label"><i class="fas fa-palette"></i> Active Theme</span><span class="sp-info-value" id="spSysTheme">Aurora Dark</span></div>' +
              '<div class="sp-info-row"><span class="sp-info-label"><i class="fas fa-bookmark"></i> Notes</span><span class="sp-info-value" id="spSysNotes">0</span></div>' +
              '<div class="sp-info-row"><span class="sp-info-label"><i class="fas fa-bell"></i> Reminders</span><span class="sp-info-value" id="spSysReminders">0</span></div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        // DATA MANAGEMENT (full width)
        '<div class="sp-grid" style="margin-top:22px;">' +
          '<div class="sp-card">' +
            '<div class="sp-card-head">' +
              '<div class="sp-card-icon orange"><i class="fas fa-database"></i></div>' +
              '<div>' +
                '<h3 class="sp-card-title">Data Management</h3>' +
                '<div class="sp-card-sub">Backup, reset, dan clear data lokal</div>' +
              '</div>' +
            '</div>' +
            '<div class="sp-row" style="flex-direction:column; align-items:stretch; gap:8px;">' +
              '<div class="sp-row-info">' +
                '<div class="sp-row-label">Export Settings & Data</div>' +
                '<div class="sp-row-desc">Download semua settings, notes, dan reminders sebagai JSON</div>' +
              '</div>' +
              '<button class="sp-btn success" id="spExportSettings"><i class="fas fa-file-export"></i> Export to JSON</button>' +
            '</div>' +
            '<div class="sp-row" style="flex-direction:column; align-items:stretch; gap:8px;">' +
              '<div class="sp-row-info">' +
                '<div class="sp-row-label">Reset Settings to Default</div>' +
                '<div class="sp-row-desc">Kembalikan settings & theme ke default (notes & reminders tetap)</div>' +
              '</div>' +
              '<button class="sp-btn warn" id="spResetDefault"><i class="fas fa-rotate-left"></i> Reset to Default</button>' +
            '</div>' +
            '<div class="sp-row" style="flex-direction:column; align-items:stretch; gap:8px; border-color:rgba(239,68,68,0.18); background:rgba(239,68,68,0.04);">' +
              '<div class="sp-row-info">' +
                '<div class="sp-row-label" style="color:#f87171;">Clear All Local Data</div>' +
                '<div class="sp-row-desc">Hapus SEMUA data lokal (kecuali auth token). Semua perangkat akan refresh.</div>' +
              '</div>' +
              '<button class="sp-btn danger" id="spClearData"><i class="fas fa-trash-can"></i> Clear All Local Data</button>' +
            '</div>' +
          '</div>' +
        '</div>' +

      '</div>';

    container.innerHTML = html;
  }

  /* ============================================================
     PUBLIC API
     ============================================================ */
  function load() {
    var container = document.getElementById('settingView');
    if (!container) {
      console.warn('SettingPro: #settingView container not found');
      return;
    }
    renderShell(container);
    renderThemes();
    renderGeneralSettings();
    wireGeneralSettings();
    wireDataManagement();
    renderSystemInfo();
    addTerminalLog('SettingPro panel loaded');
  }

  function init() {
    // Apply theme on init (in case user reloads page)
    var tk = localStorage.getItem('aura_theme') || 'aurora';
    if (THEMES[tk]) {
      var theme = THEMES[tk];
      Object.keys(theme.vars).forEach(function (key) {
        document.documentElement.style.setProperty(key, theme.vars[key]);
      });
    }
    // If #settingView is already in DOM, render immediately
    var container = document.getElementById('settingView');
    if (container && container.getAttribute('data-sp-ready') !== '1') {
      // Don't auto-render — wait for switchToSetting() to call load()
      // But mark as ready for the boot-time theme application above
    }
  }

  // Boot-time: apply saved theme ASAP (before paint if possible)
  init();

  // Expose public API
  window.SettingPro = {
    init: init,
    load: load,
    applyTheme: applyTheme,
    getCurrentTheme: getCurrentTheme,
    getThemes: function () { return THEMES; },
    save: function () { saveSettings(getSettings()); },
    getSettings: getSettings,
    exportSettings: exportSettings,
    resetToDefault: resetToDefault,
    clearAllLocalData: clearAllLocalData
  };

})();
