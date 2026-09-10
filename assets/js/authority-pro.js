/* ============================================================
   AURA.OS // AUTHORITY-PRO.JS
   Authority Panel logic — User management, access control,
   registration settings, pending approvals, search, toasts.
   Pairs with authority-pro.css (AUTHORITY).
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     CONFIG — Access modules (kept in sync with Dashboard groups)
     ============================================================ */
  var ACCESS_MODULES = [
    { key: 'core',                 label: 'Core',             icon: 'fa-gauge-high' },
    { key: 'workspace',            label: 'Workspace',        icon: 'fa-briefcase' },
    { key: 'operational',          label: 'Operational',      icon: 'fa-cogs' },
    { key: 'system',               label: 'System',           icon: 'fa-server' },
    { key: 'user_management',      label: 'User Management',  icon: 'fa-users-cog' },
    { key: 'registration_control', label: 'Data Registrasi',  icon: 'fa-clipboard-check' }
  ];

  var ROLE_CLASS = {
    MASTER: 'role-master',
    ADMIN:  'role-admin',
    MEMBER: 'role-member'
  };

  /* ============================================================
     STATE
     ============================================================ */
  var authToken = '';
  var userRole  = '';
  var usersData = [];
  var editUsername = null;
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

  function escapeAttr(text) {
    return escapeHtml(text).replace(/`/g, '&#96;');
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

  /* ============================================================
     ACCESS HELPERS
     ============================================================ */
  function accessFor(u) {
    if (u && u.access && typeof u.access === 'object') return u.access;
    if (u && u.role === 'MASTER') {
      return { core: true, workspace: true, operational: true, system: true, user_management: true, registration_control: true };
    }
    if (u && u.role === 'ADMIN') {
      return { core: true, workspace: true, operational: true, system: true, user_management: true, registration_control: true };
    }
    // MEMBER default — only Core
    return { core: true, workspace: false, operational: false, system: false, user_management: false, registration_control: false };
  }

  function canEditUser(targetUser) {
    if (userRole === 'MASTER') return true;
    if (userRole === 'ADMIN')  return targetUser.role === 'MEMBER';
    return false;
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
    // Force reflow then add show
    void t.offsetWidth;
    t.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3200);
  }

  /* ============================================================
     CUSTOM CONFIRM DIALOG (replaces native confirm())
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
     VIEW SWITCHER (User Management ↔ Data Registrasi)
     ============================================================ */
  function switchView(view) {
    var users = $('viewUsers');
    var regis = $('viewRegistration');
    if (users) users.classList.toggle('active', view === 'users');
    if (regis) regis.classList.toggle('active', view === 'registration');
    // Update nav tabs
    $$('.auth-nav-tab').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-view') === view);
    });
    // Legacy nav sub-items
    $$('.nav-sub-item').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-view') === view);
    });
    var crumb = $('crumbView');
    if (crumb) crumb.textContent = view === 'users' ? 'user-management' : 'data-registrasi';
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
        '<tr class="loading-row"><td colspan="4"><i class="fas fa-spinner"></i> Memuat data user...</td></tr>';
    }
    fetch('/api/users', { headers: { 'x-auth-token': authToken } })
      .then(function (res) {
        if (res.status === 403) {
          showToast('Sesi admin berakhir. Silakan login ulang.', 'warning');
          setTimeout(function () { window.location.href = '/Login.html'; }, 1200);
          return [];
        }
        return res.json();
      })
      .then(function (data) {
        usersData = Array.isArray(data) ? data : [];
        renderStats();
        renderTable();
      })
      .catch(function () {
        if (tbody) {
          tbody.innerHTML =
            '<tr class="empty-row"><td colspan="4"><div class="auth-empty-state">' +
            '<i class="fas fa-circle-exclamation"></i>' +
            '<div class="empty-title">Gagal memuat data user</div>' +
            '<div class="empty-sub">Periksa koneksi atau coba lagi nanti</div>' +
            '</div></td></tr>';
        }
        showToast('Gagal memuat data user', 'error');
      });
  }

  /* ============================================================
     RENDER STATS (Total / Masters / Admins / Members / Pending)
     ============================================================ */
  function renderStats() {
    var total   = usersData.length;
    var masters = usersData.filter(function (u) { return u.role === 'MASTER'; }).length;
    var admins  = usersData.filter(function (u) { return u.role === 'ADMIN';  }).length;
    var members = usersData.filter(function (u) { return u.role === 'MEMBER'; }).length;

    setText('statTotal',   total);
    setText('statMasters', masters);
    setText('statAdmins',  admins);
    setText('statMembers', members);

    var trendEl = $('statTotalTrend');
    if (trendEl) {
      var online = usersData.filter(function (u) {
        return (u.status || 'active').toLowerCase() === 'active';
      }).length;
      trendEl.innerHTML = '<i class="fas fa-circle-check"></i> ' + online + ' active';
    }
  }

  function setText(id, val) {
    var el = $(id);
    if (el) el.textContent = val;
  }

  /* ============================================================
     RENDER TABLE (with search/filter)
     ============================================================ */
  function renderTable() {
    var searchInput = $('searchInput');
    var search = searchInput ? searchInput.value.toLowerCase().trim() : '';
    var filtered = usersData.filter(function (u) {
      if (!search) return true;
      return (u.username || '').toLowerCase().indexOf(search) >= 0 ||
             (u.role || '').toLowerCase().indexOf(search) >= 0;
    });

    var tbody = $('userTableBody');
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML =
        '<tr class="empty-row"><td colspan="4"><div class="auth-empty-state">' +
        '<i class="fas fa-users-slash"></i>' +
        '<div class="empty-title">Tidak ada user ditemukan</div>' +
        '<div class="empty-sub">' + (search ? 'Coba kata kunci lain' : 'Belum ada user terdaftar') + '</div>' +
        '</div></td></tr>';
      return;
    }

    var html = '';
    filtered.forEach(function (u) {
      var acc = accessFor(u);
      var chips = ACCESS_MODULES.filter(function (m) { return acc[m.key]; })
        .map(function (m) { return '<span class="auth-chip">' + escapeHtml(m.label) + '</span>'; })
        .join('');
      if (!chips) chips = '<span class="auth-no-access">No access</span>';

      var actions;
      if (u.role === 'MASTER') {
        actions = '<button class="auth-btn auth-btn-ghost auth-btn-icon" title="Akun Master - Terproteksi" tabindex="-1"><i class="fas fa-lock"></i></button>';
      } else if (canEditUser(u)) {
        actions =
          '<button class="auth-btn auth-btn-ghost auth-btn-icon" title="Edit Access Control" onclick="window.__AUTH.openEdit(' + JSON.stringify(u.username) + ')"><i class="fas fa-key"></i></button>' +
          '<button class="auth-btn auth-btn-danger-ghost auth-btn-icon" title="Hapus User" onclick="window.__AUTH.confirmDelete(' + JSON.stringify(u.username) + ')"><i class="fas fa-trash"></i></button>';
      } else {
        actions = '<button class="auth-btn auth-btn-ghost auth-btn-icon" title="Hanya Master yang dapat mengubah Admin lain" tabindex="-1"><i class="fas fa-lock"></i></button>';
      }

      html +=
        '<tr>' +
          '<td>' +
            '<div class="auth-user-cell">' +
              '<div class="auth-avatar ' + avatarGradient(u.username) + '">' + escapeHtml(initials(u.username)) + '</div>' +
              '<div class="auth-user-name">@' + escapeHtml(u.username) + '</div>' +
            '</div>' +
          '</td>' +
          '<td><span class="auth-role-badge ' + (ROLE_CLASS[u.role] || '') + '">' + escapeHtml(u.role || 'MEMBER') + '</span></td>' +
          '<td><div class="auth-access-chips">' + chips + '</div></td>' +
          '<td class="text-right"><div class="auth-action-group">' + actions + '</div></td>' +
        '</tr>';
    });
    tbody.innerHTML = html;
  }

  /* ============================================================
     EDIT ACCESS CONTROL
     ============================================================ */
  function buildPermGrid() {
    var grid = $('permGrid');
    if (!grid) return;
    grid.innerHTML = ACCESS_MODULES.map(function (m) {
      return '' +
        '<label class="auth-perm-item" data-key="' + m.key + '">' +
          '<input type="checkbox">' +
          '<i class="fas ' + m.icon + ' perm-icon"></i>' +
          '<span class="perm-label">' + escapeHtml(m.label) + '</span>' +
          '<span class="perm-check"><i class="fas fa-check"></i></span>' +
        '</label>';
    }).join('');

    // Toggle .checked class on checkbox change
    $$('#permGrid .auth-perm-item').forEach(function (item) {
      var cb = item.querySelector('input[type="checkbox"]');
      cb.addEventListener('change', function () {
        item.classList.toggle('checked', cb.checked);
      });
    });
  }

  function setAllPerm(v) {
    $$('#permGrid .auth-perm-item').forEach(function (item) {
      var cb = item.querySelector('input[type="checkbox"]');
      cb.checked = !!v;
      item.classList.toggle('checked', !!v);
    });
  }

  function openEdit(username) {
    var u = usersData.find(function (x) { return x.username === username; });
    if (!u) return;
    if (!canEditUser(u)) {
      showToast('Akses ditolak! ' + (userRole === 'ADMIN' ? 'Admin hanya dapat mengubah user Member.' : 'Tidak memiliki hak akses.'), 'warning');
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

    var acc = accessFor(u);
    $$('#permGrid .auth-perm-item').forEach(function (item) {
      var key = item.getAttribute('data-key');
      var checked = !!acc[key];
      var cb = item.querySelector('input[type="checkbox"]');
      cb.checked = checked;
      item.classList.toggle('checked', checked);
    });

    var grantEl = $('editGrantedBy');
    if (grantEl) {
      grantEl.textContent = 'access granted by ' + (userRole === 'MASTER' ? 'master' : 'admin');
    }

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

    var access = {};
    $$('#permGrid .auth-perm-item').forEach(function (item) {
      var key = item.getAttribute('data-key');
      var cb = item.querySelector('input[type="checkbox"]');
      access[key] = !!cb.checked;
    });

    fetch('/api/users/' + encodeURIComponent(editUsername) + '/access', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': authToken },
      body: JSON.stringify({ role: role, access: access, grantedBy: authToken })
    })
      .then(function (res) { return res.json(); })
      .then(function (result) {
        if (result && result.success) {
          closeEditModal();
          showToast('Akses control @' + editUsername + ' berhasil diperbarui!', 'success');
          loadUsers();
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
      open:           $('regisOpen')      ? $('regisOpen').checked      : false,
      defaultRole:    $('regisDefaultRole') ? $('regisDefaultRole').value : 'MEMBER',
      requireApproval:$('regisApproval')  ? $('regisApproval').checked  : false
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
        setText('statPending',  list.length);
        setText('statPending2', list.length);
        var pcEl = $('pendingCount');
        if (pcEl) pcEl.textContent = list.length + ' awaiting';
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
                    '<div class="auth-user-name">@' + escapeHtml(u.username) + '</div>' +
                  '</div>' +
                '</td>' +
                '<td><span class="auth-role-badge ' + (ROLE_CLASS[u.role] || 'role-member') + '">' + escapeHtml(u.role || 'MEMBER') + '</span></td>' +
                '<td><span class="auth-status-pill pending"><i class="fas fa-hourglass-half"></i> PENDING</span></td>' +
                '<td class="text-right"><div class="auth-action-group">' +
                  '<button class="auth-btn auth-btn-success-ghost auth-btn-icon" title="Approve" onclick="window.__AUTH.actRegistration(' + JSON.stringify(u.username) + ',\'approve\')"><i class="fas fa-check"></i></button>' +
                  '<button class="auth-btn auth-btn-danger-ghost auth-btn-icon" title="Reject" onclick="window.__AUTH.actRegistration(' + JSON.stringify(u.username) + ',\'reject\')"><i class="fas fa-times"></i></button>' +
                '</div></td>' +
              '</tr>';
          }).join('');
        }
      })
      .catch(function () {
        if (wrap) wrap.style.display = 'none';
        setText('statPending',  '0');
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
     ============================================================ */
  function authGuard() {
    authToken = localStorage.getItem('aura_auth_token') || '';
    userRole  = (localStorage.getItem('aura_user_role')  || '').toUpperCase();

    if (!authToken) {
      window.location.href = '/Login.html';
      return false;
    }
    if (userRole !== 'ADMIN' && userRole !== 'MASTER') {
      // Show inline denied state instead of alert (better UX in iframe)
      var denied = $('accessDenied');
      if (denied) {
        denied.style.display = 'flex';
        var main = document.querySelector('.auth-shell');
        if (main) main.style.display = 'none';
      } else {
        window.location.href = '/Dashboard.html';
      }
      return false;
    }
    var emailEl = $('userEmail');
    if (emailEl) emailEl.textContent = authToken + '@aura.os';
    return true;
  }

  /* ============================================================
     INIT — wire events after DOM ready
     ============================================================ */
  function init() {
    if (!authGuard()) return;

    // Detect iframe embedding (Dashboard integration)
    try {
      if (window.self !== window.top) {
        document.body.classList.add('in-iframe');
      }
    } catch (e) { /* cross-origin — assume standalone */ }

    // Nav sub-menu toggle (kept for standalone view)
    var authParent = $('authParent');
    if (authParent) {
      authParent.addEventListener('click', function () {
        var sub = $('authSub');
        if (sub) sub.classList.toggle('open');
        authParent.classList.toggle('open');
      });
    }

    // Nav sub-items
    $$('.nav-sub-item').forEach(function (el) {
      el.addEventListener('click', function () {
        switchView(el.getAttribute('data-view'));
      });
    });

    // Search input
    var searchInput = $('searchInput');
    if (searchInput) {
      var debounce;
      searchInput.addEventListener('input', function () {
        clearTimeout(debounce);
        debounce = setTimeout(renderTable, 120);
      });
    }

    // Add-user modal buttons
    var addBtns = $$('[data-action="openAddUser"]');
    addBtns.forEach(function (b) { b.addEventListener('click', openModal); });
    var closeAdd = $$('[data-action="closeAddUser"]');
    closeAdd.forEach(function (b) { b.addEventListener('click', closeModal); });
    var submitAdd = $('submitAddUser');
    if (submitAdd) submitAdd.addEventListener('click', submitAddUser);

    // Edit-access modal buttons
    var closeEdit = $$('[data-action="closeEdit"]');
    closeEdit.forEach(function (b) { b.addEventListener('click', closeEditModal); });
    var permAll = $$('[data-action="permAll"]');
    permAll.forEach(function (b) { b.addEventListener('click', function () { setAllPerm(true); }); });
    var permNone = $$('[data-action="permNone"]');
    permNone.forEach(function (b) { b.addEventListener('click', function () { setAllPerm(false); }); });
    var submitEdit = $('submitEditAccess');
    if (submitEdit) submitEdit.addEventListener('click', submitEditAccess);

    // Registration settings
    var saveRegis = $$('[data-action="saveRegis"]');
    saveRegis.forEach(function (b) { b.addEventListener('click', saveRegisSettings); });

    // Logout
    var logoutBtns = $$('[data-action="logout"]');
    logoutBtns.forEach(function (b) { b.addEventListener('click', logout); });

    // Dashboard link (nav back)
    var dashBtns = $$('[data-action="goDashboard"]');
    dashBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        // If we're in an iframe, ask parent to switch back; else navigate
        try {
          if (window.self !== window.top && window.parent && typeof window.parent.switchToDashboard === 'function') {
            window.parent.switchToDashboard();
            return;
          }
        } catch (e) {}
        window.location.href = '/Dashboard.html';
      });
    });

    // Confirm dialog buttons
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

    // Close modals on overlay click (but not when clicking the modal itself)
    $$('.auth-modal-overlay').forEach(function (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    });

    // Esc to close any modal
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        $$('.auth-modal-overlay.active').forEach(function (m) { m.classList.remove('active'); });
      }
    });

    // Build perm grid + initial load
    buildPermGrid();
    loadUsers();
    loadPending(); // populate Pending stat card immediately
  }

  /* ============================================================
     PUBLIC API (called from inline onclick handlers)
     ============================================================ */
  window.__AUTH = {
    openModal:        openModal,
    closeModal:       closeModal,
    submitAddUser:    submitAddUser,
    openEdit:         openEdit,
    closeEditModal:   closeEditModal,
    submitEditAccess: submitEditAccess,
    setAllPerm:       setAllPerm,
    confirmDelete:    confirmDelete,
    saveRegisSettings:saveRegisSettings,
    actRegistration:  actRegistration,
    switchView:       switchView,
    logout:           logout
  };

  // Expose switchView globally for inline onclick on nav items (legacy support)
  window.switchView       = switchView;
  window.toggleAuthMenu   = function () {
    var sub = $('authSub'); var par = $('authParent');
    if (sub)  sub.classList.toggle('open');
    if (par)  par.classList.toggle('open');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
