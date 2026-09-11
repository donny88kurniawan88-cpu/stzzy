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
    void t.offsetWidth; // Force reflow
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
    confirmBtn.className = 'btn ' + (icon === 'danger' ? 'btn-danger-ghost' : 'btn-primary');
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
     VIEW SWITCHER
     ============================================================ */
  function switchView(view) {
    var users = $('viewUsers');
    var regis = $('viewRegistration');
    if (users) users.classList.toggle('active', view === 'users');
    if (regis) regis.classList.toggle('active', view === 'registration');
    $$('.auth-nav-tab').forEach(function (el) {
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
     RENDER STATS
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
     RENDER TABLE
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
          '<button class="auth-btn auth-btn-ghost auth-btn-icon" title="Edit Access Control" onclick="window.__AUTH.openEdit(\'' + escapeAttr(u.username) + '\')"><i class="fas fa-key"></i></button>' +
          '<button class="auth-btn auth-btn-danger-ghost auth-btn-icon" title="Hapus User" data-delete-user="' + escapeHtml(u.username) + '"><i class="fas fa-trash"></i></button>';
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
     EDIT ACCESS CONTROL (NEW LOGIC)
     ============================================================ */
  function renderAccessGrid(user) {
    var grid = $('permGrid');
    if (!grid) return;

    var acc = accessFor(user);
    var isLocked = (user.role === 'MASTER' || user.role === 'ADMIN');

    var html = '';
    ACCESS_MODULES.forEach(function (mod) {
      var checked = acc[mod.key] ? 'checked' : '';
      var disabled = isLocked ? 'disabled' : '';
      var lockedClass = isLocked ? 'access-item--locked' : '';

      html +=
        '<label class="access-item ' + lockedClass + '">' +
          '<div class="access-item__left">' +
            '<i class="fas ' + mod.icon + '"></i>' +
            '<span>' + escapeHtml(mod.label) + '</span>' +
          '</div>' +
          '<div class="access-item__right">' +
            '<input type="checkbox" class="access-checkbox" ' +
                   'data-module="' + mod.key + '" ' + checked + ' ' + disabled + '>' +
          '</div>' +
        '</label>';
    });
    grid.innerHTML = html;
  }

  function openEdit(username) {
    var u = usersData.find(function (x) { return x.username === username; });
    if (!u) return;
    if (!canEditUser(u)) {
      showToast('Akses ditolak! ' + (userRole === 'ADMIN' ? 'Admin hanya dapat mengubah user Member.' : 'Tidak memiliki hak akses.'), 'warning');
      return;
    }

    editUsername = username;

    // Set User Info
    var avatarEl = $('editAvatar');
    if (avatarEl) {
      avatarEl.textContent = initials(u.username);
      avatarEl.className = 'user-avatar ' + avatarGradient(u.username);
    }
    setText('editUserLabel', '@' + u.username);
    setText('editGrantedBy', 'access granted by ' + (userRole === 'MASTER' ? 'master' : 'admin'));

    // Set Role
    var roleSelect = $('editRole');
    var optMaster = $('optMaster');
    var roleHint = $('roleHint');
    if (roleSelect) {
      roleSelect.value = u.role || 'MEMBER';
      if (userRole === 'ADMIN') {
        roleSelect.value = 'MEMBER';
        roleSelect.disabled = true;
        if (roleHint) roleHint.textContent = 'Admin hanya dapat mengubah user Member.';
      } else {
        roleSelect.disabled = false;
        if (roleHint) roleHint.textContent = 'Anda dapat mengubah role user ini.';
      }
      if (optMaster) optMaster.hidden = (userRole !== 'MASTER');
    }

    // Render Access Checkboxes
    renderAccessGrid(u);

    // Show Modal
    var modal = $('editModal');
    if (modal) modal.classList.add('active');
  }

  function closeEditModal() {
    var modal = $('editModal');
    if (modal) modal.classList.remove('active');
    editUsername = null;
  }

  function setAllPerm(v) {
    if (!editUsername) return;
    var u = usersData.find(function (x) { return x.username === editUsername; });
    if (u && (u.role === 'MASTER' || u.role === 'ADMIN')) {
      showToast('Akses Master/Admin sudah penuh dan tidak dapat diubah.', 'warning');
      return;
    }
    var checkboxes = $$('#permGrid .access-checkbox:not(:disabled)');
    checkboxes.forEach(function (cb) {
      cb.checked = !!v;
    });
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
    $$('#permGrid .access-checkbox').forEach(function (cb) {
      access[cb.getAttribute('data-module')] = cb.checked;
    });

    // Lock full access for Master/Admin
    if (role === 'MASTER' || role === 'ADMIN') {
      ACCESS_MODULES.forEach(function (mod) { access[mod.key] = true; });
    }

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
     REGISTRATION SETTINGS
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
     PENDING REGISTRATIONS
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
                  '<button class="auth-btn auth-btn-success-ghost auth-btn-icon" title="Approve" data-reg-action="approve" data-reg-user="' + escapeHtml(u.username) + '"><i class="fas fa-check"></i></button>' +
                  '<button class="auth-btn auth-btn-danger-ghost auth-btn-icon" title="Reject" data-reg-action="reject" data-reg-user="' + escapeHtml(u.username) + '"><i class="fas fa-times"></i></button>' +
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
     LOGOUT & AUTH GUARD
     ============================================================ */
  function logout() {
    localStorage.clear();
    window.location.href = '/Login.html';
  }

  function authGuard() {
    authToken = localStorage.getItem('aura_auth_token') || '';
    userRole  = (localStorage.getItem('aura_user_role')  || '').toUpperCase();

    if (!authToken) {
      window.location.href = '/Login.html';
      return false;
    }
    if (userRole !== 'ADMIN' && userRole !== 'MASTER') {
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
     INIT
     ============================================================ */
  function init() {
    if (!authGuard()) return;

    try {
      if (window.self !== window.top) {
        document.body.classList.add('in-iframe');
      }
    } catch (e) { /* cross-origin */ }

    // Nav sub-menu toggle
    var authParent = $('authParent');
    if (authParent) {
      authParent.addEventListener('click', function () {
        var sub = $('authSub');
        if (sub) sub.classList.toggle('open');
        authParent.classList.toggle('open');
      });
    }

    // Search input debounce
    var searchInput = $('searchInput');
    if (searchInput) {
      var debounce;
      searchInput.addEventListener('input', function () {
        clearTimeout(debounce);
        debounce = setTimeout(renderTable, 120);
      });
    }

    // Event delegation for dynamic tables
    var userTableBody = $('userTableBody');
    if (userTableBody) {
      userTableBody.addEventListener('click', function(e) {
        var editBtn = e.target.closest('[onclick*="openEdit"]');
        var delBtn = e.target.closest('[data-delete-user]');
        // Note: openEdit is called directly via onclick attribute now for simplicity
        if (delBtn) { confirmDelete(delBtn.getAttribute('data-delete-user')); }
      });
    }

    var pendingBody = $('pendingBody');
    if (pendingBody) {
      pendingBody.addEventListener('click', function(e) {
        var btn = e.target.closest('[data-reg-action]');
        if (btn) { actRegistration(btn.getAttribute('data-reg-user'), btn.getAttribute('data-reg-action')); }
      });
    }

    // Add-user modal buttons
    var submitAdd = $('submitAddUser');
    if (submitAdd) submitAdd.addEventListener('click', submitAddUser);

    // Edit-access modal buttons
    var submitEdit = $('submitEditAccess');
    if (submitEdit) submitEdit.addEventListener('click', submitEditAccess);

    // Registration settings
    var saveRegis = $$('[data-action="saveRegis"]');
    saveRegis.forEach(function (b) { b.addEventListener('click', saveRegisSettings); });

    // Logout
    var logoutBtns = $$('[data-action="logout"]');
    logoutBtns.forEach(function (b) { b.addEventListener('click', logout); });

    // Dashboard link
    var dashBtns = $$('[data-action="goDashboard"]');
    dashBtns.forEach(function (b) {
      b.addEventListener('click', function () {
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

    // Close modals on overlay click
    $$('.modal-overlay').forEach(function (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    });

    // Esc to close any modal
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        $$('.modal-overlay.active').forEach(function (m) { m.classList.remove('active'); });
      }
    });

    // Initial Load
    loadUsers();
    loadPending();
  }

  /* ============================================================
     PUBLIC API (Global Access)
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

  window.switchView = switchView;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
