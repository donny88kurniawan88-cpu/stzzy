/* ============================================================
   AURA.OS // KEEPMEMO-PRO.JS
   Full Keep Memo panel — Notes (CRUD), Calendar (month nav),
   Reminders (CRUD + upcoming toasts). Exposed as window.KeepMemoPro.
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     STATE & CONSTANTS
     ============================================================ */
  var NOTES_KEY = 'aura_notes';
  var REMINDERS_KEY = 'aura_reminders';
  var LOGINS_KEY = 'aura_logins';
  var ACTIVE_TAB_KEY = 'aura_keepmemo_tab';

  var NOTE_COLORS = [
    { key: 'blue',    value: '#3b82f6' },
    { key: 'green',   value: '#10b981' },
    { key: 'orange',  value: '#f59e0b' },
    { key: 'pink',    value: '#ec4899' },
    { key: 'purple',  value: '#8b5cf6' },
    { key: 'teal',    value: '#14b8a6' },
    { key: 'red',     value: '#ef4444' },
    { key: 'cyan',    value: '#06b6d4' }
  ];

  var state = {
    notes: [],
    reminders: [],
    logins: [],
    activeTab: 'notes',
    calendarDate: new Date(),
    selectedDay: null,
    editingNoteId: null,
    editingReminderId: null,
    editingLoginId: null,
    loginRevealed: {},
    selectedNoteColor: 'blue',
    reminderCheckTimer: null,
    lastReminderToastKeys: {}
  };

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

  function escapeAttr(text) {
    return escapeHtml(text).replace(/`/g, '&#96;');
  }

  function uuid() {
    return 'km-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8);
  }

  function showToast(msg, type) {
    try {
      if (typeof window.showToast === 'function') {
        window.showToast(msg, type || 'info');
      } else {
        console.log('[KeepMemo]', msg);
      }
    } catch (e) { console.log('[KeepMemo]', msg); }
  }

  function addTerminalLog(msg) {
    try {
      if (typeof window.addTerminalLog === 'function') {
        window.addTerminalLog(msg);
      }
    } catch (e) {}
  }

  function loadNotes() {
    try {
      var raw = localStorage.getItem(NOTES_KEY);
      state.notes = raw ? JSON.parse(raw) : [];
    } catch (e) { state.notes = []; }
  }

  function saveNotes() {
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(state.notes));
    } catch (e) { console.error('Save notes error:', e); }
  }

  function loadReminders() {
    try {
      var raw = localStorage.getItem(REMINDERS_KEY);
      state.reminders = raw ? JSON.parse(raw) : [];
    } catch (e) { state.reminders = []; }
  }

  function saveReminders() {
    try {
      localStorage.setItem(REMINDERS_KEY, JSON.stringify(state.reminders));
    } catch (e) { console.error('Save reminders error:', e); }
  }

  function loadLogins() {
    try {
      var raw = localStorage.getItem(LOGINS_KEY);
      state.logins = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(state.logins)) state.logins = [];
    } catch (e) { state.logins = []; }
  }

  function saveLogins() {
    try {
      localStorage.setItem(LOGINS_KEY, JSON.stringify(state.logins));
    } catch (e) { console.error('Save logins error:', e); }
  }

  function getColorValue(key) {
    for (var i = 0; i < NOTE_COLORS.length; i++) {
      if (NOTE_COLORS[i].key === key) return NOTE_COLORS[i].value;
    }
    return NOTE_COLORS[0].value;
  }

  function formatRelativeTime(ts) {
    if (!ts) return '';
    var now = Date.now();
    var diff = now - ts;
    var sec = Math.floor(diff / 1000);
    var min = Math.floor(sec / 60);
    var hr = Math.floor(min / 60);
    var day = Math.floor(hr / 24);
    if (sec < 60) return 'just now';
    if (min < 60) return min + 'm ago';
    if (hr < 24) return hr + 'h ago';
    if (day < 7) return day + 'd ago';
    var d = new Date(ts);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
  }

  function formatDateShort(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function pad2(n) { return String(n).padStart(2, '0'); }

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  /* ============================================================
     TAB SWITCHING
     ============================================================ */
  function switchTab(tab) {
    state.activeTab = tab;
    localStorage.setItem(ACTIVE_TAB_KEY, tab);
    $$('.km-tab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-tab') === tab);
    });
    $$('.km-panel').forEach(function (p) {
      p.classList.toggle('active', p.getAttribute('data-panel') === tab);
    });
    if (tab === 'calendar') renderCalendar();
    if (tab === 'reminders') renderReminders();
    if (tab === 'notes') renderNotes();
    if (tab === 'logins') renderLogins();
  }

  /* ============================================================
     NOTES CRUD
     ============================================================ */
  function renderNotes() {
    var container = $('#kmNotesList');
    if (!container) return;
    var search = ($('#kmNotesSearch') && $('#kmNotesSearch').value || '').toLowerCase().trim();
    var filtered = state.notes.slice().sort(function (a, b) {
      return (b.updated_at || 0) - (a.updated_at || 0);
    }).filter(function (n) {
      if (!search) return true;
      return (n.title || '').toLowerCase().indexOf(search) >= 0 ||
             (n.content || '').toLowerCase().indexOf(search) >= 0;
    });

    if (filtered.length === 0) {
      container.innerHTML = '' +
        '<div class="km-empty">' +
          '<div class="km-empty-icon"><i class="fas fa-bookmark"></i></div>' +
          '<div class="km-empty-title">' + (search ? 'No matching notes' : 'Belum ada notes') + '</div>' +
          '<div class="km-empty-desc">' + (search ? 'Coba kata kunci lain.' : 'Klik "+ New Note" untuk membuat catatan pertama.') + '</div>' +
        '</div>';
      return;
    }

    var html = '<div class="km-notes-grid">';
    filtered.forEach(function (n) {
      var colorVal = getColorValue(n.color || 'blue');
      var preview = (n.content || '').substring(0, 200);
      var timeLabel = formatRelativeTime(n.updated_at || n.created_at);
      html += '' +
        '<div class="km-note-card" data-id="' + escapeAttr(n.id) + '" style="--note-color:' + colorVal + ';">' +
          '<div class="km-note-header">' +
            '<h4 class="km-note-title">' + escapeHtml(n.title || 'Untitled') + '</h4>' +
            '<div class="km-note-color-dot" style="background:' + colorVal + ';"></div>' +
          '</div>' +
          '<div class="km-note-content">' + escapeHtml(preview || '(empty)') + '</div>' +
          '<div class="km-note-footer">' +
            '<span class="km-note-time"><i class="fas fa-clock" style="margin-right:3px;"></i>' + escapeHtml(timeLabel) + '</span>' +
            '<div class="km-note-actions">' +
              '<button class="km-btn icon edit" data-note-edit="' + escapeAttr(n.id) + '" title="Edit"><i class="fas fa-pen"></i></button>' +
              '<button class="km-btn icon danger" data-note-delete="' + escapeAttr(n.id) + '" title="Delete"><i class="fas fa-trash"></i></button>' +
            '</div>' +
          '</div>' +
        '</div>';
    });
    html += '</div>';
    container.innerHTML = html;

    // Wire events
    $$('[data-note-edit]', container).forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        openNoteModal(btn.getAttribute('data-note-edit'));
      });
    });
    $$('[data-note-delete]', container).forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        deleteNote(btn.getAttribute('data-note-delete'));
      });
    });
    $$('.km-note-card', container).forEach(function (card) {
      card.addEventListener('click', function () {
        openNoteModal(card.getAttribute('data-id'));
      });
    });
  }

  function openNoteModal(noteId) {
    state.editingNoteId = noteId || null;
    var note = noteId ? state.notes.filter(function (n) { return n.id === noteId; })[0] : null;
    state.selectedNoteColor = note ? (note.color || 'blue') : 'blue';

    var overlay = $('#kmNoteModal');
    if (!overlay) return;

    $('#kmNoteModalTitle').innerHTML = note ? '<i class="fas fa-pen"></i> Edit Note' : '<i class="fas fa-plus"></i> New Note';
    $('#kmNoteTitle').value = note ? (note.title || '') : '';
    $('#kmNoteContent').value = note ? (note.content || '') : '';
    renderNoteColorPicker();

    overlay.classList.add('active');
    setTimeout(function () { $('#kmNoteTitle').focus(); }, 200);
  }

  function closeNoteModal() {
    var overlay = $('#kmNoteModal');
    if (overlay) overlay.classList.remove('active');
    state.editingNoteId = null;
  }

  function renderNoteColorPicker() {
    var container = $('#kmNoteColors');
    if (!container) return;
    var html = '';
    NOTE_COLORS.forEach(function (c) {
      var isActive = c.key === state.selectedNoteColor;
      html += '<div class="km-color-swatch' + (isActive ? ' active' : '') + '" data-color="' + c.key + '" style="background:' + c.value + '; --swatch-color:' + c.value + ';" role="button" tabindex="0" aria-label="' + c.key + '"></div>';
    });
    container.innerHTML = html;
    $$('.km-color-swatch', container).forEach(function (sw) {
      sw.addEventListener('click', function () {
        state.selectedNoteColor = sw.getAttribute('data-color');
        renderNoteColorPicker();
      });
    });
  }

  function saveNote() {
    var title = $('#kmNoteTitle').value.trim();
    var content = $('#kmNoteContent').value.trim();
    if (!title && !content) {
      showToast('Title or content required', 'warning');
      return;
    }
    if (!title) title = 'Untitled';
    var now = Date.now();
    if (state.editingNoteId) {
      // Update
      state.notes.forEach(function (n) {
        if (n.id === state.editingNoteId) {
          n.title = title;
          n.content = content;
          n.color = state.selectedNoteColor;
          n.updated_at = now;
        }
      });
      showToast('Note updated', 'success');
      addTerminalLog('KeepMemo: note updated (' + state.editingNoteId + ')');
    } else {
      // Create
      var note = {
        id: uuid(),
        title: title,
        content: content,
        color: state.selectedNoteColor,
        created_at: now,
        updated_at: now
      };
      state.notes.push(note);
      showToast('Note created', 'success');
      addTerminalLog('KeepMemo: note created (' + note.id + ')');
    }
    saveNotes();
    closeNoteModal();
    renderNotes();
    updateTabBadges();
  }

  function deleteNote(id) {
    var note = state.notes.filter(function (n) { return n.id === id; })[0];
    if (!note) return;
    if (typeof window.showPopup === 'function') {
      window.showPopup(
        'Delete Note',
        '<div style="padding:18px; color:var(--text-secondary); text-align:center;"><p>Delete note <strong style="color:var(--text-primary);">' + escapeHtml(note.title || 'Untitled') + '</strong>?</p><p style="font-size:12px; color:var(--text-tertiary); margin-top:6px;">This action cannot be undone.</p></div>',
        true,
        function () { confirmDeleteNote(id); }
      );
    } else {
      if (confirm('Delete this note?')) confirmDeleteNote(id);
    }
  }

  function confirmDeleteNote(id) {
    state.notes = state.notes.filter(function (n) { return n.id !== id; });
    saveNotes();
    renderNotes();
    updateTabBadges();
    showToast('Note deleted', 'success');
    addTerminalLog('KeepMemo: note deleted (' + id + ')');
  }

  /* ============================================================
     CALENDAR
     ============================================================ */
  function renderCalendar() {
    var container = $('#kmCalendarGrid');
    var monthLabel = $('#kmCalMonth');
    if (!container || !monthLabel) return;

    var d = state.calendarDate;
    var year = d.getFullYear();
    var month = d.getMonth();

    monthLabel.innerHTML = '<i class="fas fa-calendar"></i> ' + d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    var firstDay = new Date(year, month, 1);
    var lastDay = new Date(year, month + 1, 0);
    var startDow = firstDay.getDay(); // 0=Sun
    var daysInMonth = lastDay.getDate();

    // Build reminders map by date string
    var reminderMap = {};
    state.reminders.forEach(function (r) {
      if (!r.date) return;
      if (!reminderMap[r.date]) reminderMap[r.date] = [];
      reminderMap[r.date].push(r);
    });

    var today = todayStr();
    var html = '<div class="km-cal-weekdays">';
    var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayNames.forEach(function (dn) {
      html += '<div class="km-cal-weekday">' + dn + '</div>';
    });
    html += '</div><div class="km-cal-days">';

    // Empty cells before start
    for (var i = 0; i < startDow; i++) {
      html += '<div class="km-cal-day empty"></div>';
    }
    // Days
    for (var day = 1; day <= daysInMonth; day++) {
      var dateStr = year + '-' + pad2(month + 1) + '-' + pad2(day);
      var hasRem = !!reminderMap[dateStr];
      var isToday = dateStr === today;
      var isSelected = dateStr === state.selectedDay;
      var classes = 'km-cal-day';
      if (hasRem) classes += ' has-reminder reminder-day';
      if (isToday) classes += ' today';
      if (isSelected) classes += ' selected';
      html += '<div class="' + classes + '" data-date="' + dateStr + '" role="button" tabindex="0">' + day + '</div>';
    }
    html += '</div>';
    container.innerHTML = html;

    // Wire clicks
    $$('.km-cal-day[data-date]', container).forEach(function (cell) {
      cell.addEventListener('click', function () {
        state.selectedDay = cell.getAttribute('data-date');
        renderCalendar();
        renderCalendarDetail();
      });
      cell.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          cell.click();
        }
      });
    });

    renderCalendarDetail();
  }

  function renderCalendarDetail() {
    var container = $('#kmCalDetail');
    if (!container) return;
    var dateStr = state.selectedDay;
    if (!dateStr) {
      container.innerHTML = '' +
        '<div class="km-cal-detail-title"><i class="fas fa-info-circle"></i> Day Detail</div>' +
        '<div class="km-cal-detail-empty">Click a day to see reminders for that date.</div>';
      return;
    }
    var dayReminders = state.reminders.filter(function (r) { return r.date === dateStr; });
    dayReminders.sort(function (a, b) {
      return (a.time || '').localeCompare(b.time || '');
    });

    var title = '<div class="km-cal-detail-title"><i class="fas fa-calendar-day"></i> ' + formatDateShort(dateStr) + ' (' + dayReminders.length + ' reminder' + (dayReminders.length === 1 ? '' : 's') + ')</div>';
    if (dayReminders.length === 0) {
      container.innerHTML = title + '<div class="km-cal-detail-empty">No reminders on this day. Click "Add Reminder" to create one.</div>';
      return;
    }
    var html = title + '<div class="km-cal-detail-list">';
    dayReminders.forEach(function (r) {
      html += '' +
        '<div class="km-cal-detail-item' + (r.done ? ' done' : '') + '">' +
          '<span class="km-cal-detail-time">' + escapeHtml(r.time || '--:--') + '</span>' +
          '<span class="km-cal-detail-text">' + escapeHtml(r.title) + '</span>' +
        '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  function navigateMonth(delta) {
    var d = new Date(state.calendarDate);
    d.setMonth(d.getMonth() + delta);
    state.calendarDate = d;
    state.selectedDay = null;
    renderCalendar();
  }

  function goToToday() {
    state.calendarDate = new Date();
    state.selectedDay = todayStr();
    renderCalendar();
  }

  /* ============================================================
     REMINDERS CRUD
     ============================================================ */
  function renderReminders() {
    var container = $('#kmRemindersList');
    if (!container) return;
    var sorted = state.reminders.slice().sort(function (a, b) {
      var aKey = (a.date || '') + ' ' + (a.time || '');
      var bKey = (b.date || '') + ' ' + (b.time || '');
      return aKey.localeCompare(bKey);
    });

    if (sorted.length === 0) {
      container.innerHTML = '' +
        '<div class="km-empty">' +
          '<div class="km-empty-icon"><i class="fas fa-bell"></i></div>' +
          '<div class="km-empty-title">No reminders yet</div>' +
          '<div class="km-empty-desc">Click "+ New Reminder" to create your first reminder.</div>' +
        '</div>';
      return;
    }

    var now = Date.now();
    var oneHourFromNow = now + 60 * 60 * 1000;

    var html = '<div class="km-reminders-list">';
    sorted.forEach(function (r) {
      var isUpcoming = false;
      if (!r.done && r.date) {
        var remTime = new Date(r.date + 'T' + (r.time || '00:00') + ':00').getTime();
        if (!isNaN(remTime) && remTime >= now && remTime <= oneHourFromNow) {
          isUpcoming = true;
        }
      }
      var statusPill;
      if (r.done) statusPill = '<span class="km-reminder-status-pill done">Done</span>';
      else if (isUpcoming) statusPill = '<span class="km-reminder-status-pill upcoming">Soon</span>';
      else statusPill = '<span class="km-reminder-status-pill active">Active</span>';

      var classes = 'km-reminder-card';
      if (r.done) classes += ' done';
      if (isUpcoming) classes += ' upcoming';

      html += '' +
        '<div class="' + classes + '" data-id="' + escapeAttr(r.id) + '" style="--rem-color:' + (isUpcoming ? '#f59e0b' : (r.done ? '#10b981' : '#ec4899')) + ';">' +
          '<button class="km-reminder-check" data-rem-toggle="' + escapeAttr(r.id) + '" title="' + (r.done ? 'Mark as not done' : 'Mark as done') + '"><i class="fas fa-check"></i></button>' +
          '<div class="km-reminder-info">' +
            '<div class="km-reminder-title">' + escapeHtml(r.title || 'Untitled') + '</div>' +
            '<div class="km-reminder-meta">' +
              (r.date ? '<span class="km-reminder-date"><i class="fas fa-calendar"></i> ' + escapeHtml(formatDateShort(r.date)) + '</span>' : '') +
              (r.time ? '<span class="km-reminder-time"><i class="fas fa-clock"></i> ' + escapeHtml(r.time) + '</span>' : '') +
              statusPill +
            '</div>' +
            (r.description ? '<div class="km-reminder-desc">' + escapeHtml(r.description) + '</div>' : '') +
          '</div>' +
          '<div class="km-reminder-actions">' +
            '<button class="km-btn icon edit" data-rem-edit="' + escapeAttr(r.id) + '" title="Edit"><i class="fas fa-pen"></i></button>' +
            '<button class="km-btn icon danger" data-rem-delete="' + escapeAttr(r.id) + '" title="Delete"><i class="fas fa-trash"></i></button>' +
          '</div>' +
        '</div>';
    });
    html += '</div>';
    container.innerHTML = html;

    // Wire events
    $$('[data-rem-toggle]', container).forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleReminderDone(btn.getAttribute('data-rem-toggle'));
      });
    });
    $$('[data-rem-edit]', container).forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        openReminderModal(btn.getAttribute('data-rem-edit'));
      });
    });
    $$('[data-rem-delete]', container).forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        deleteReminder(btn.getAttribute('data-rem-delete'));
      });
    });
  }

  function openReminderModal(reminderId) {
    state.editingReminderId = reminderId || null;
    var r = reminderId ? state.reminders.filter(function (x) { return x.id === reminderId; })[0] : null;

    var overlay = $('#kmReminderModal');
    if (!overlay) return;

    $('#kmReminderModalTitle').innerHTML = r ? '<i class="fas fa-pen"></i> Edit Reminder' : '<i class="fas fa-plus"></i> New Reminder';
    $('#kmReminderTitle').value = r ? (r.title || '') : '';
    $('#kmReminderDate').value = r ? (r.date || '') : todayStr();
    $('#kmReminderTime').value = r ? (r.time || '09:00') : '09:00';
    $('#kmReminderDesc').value = r ? (r.description || '') : '';

    overlay.classList.add('active');
    setTimeout(function () { $('#kmReminderTitle').focus(); }, 200);
  }

  function closeReminderModal() {
    var overlay = $('#kmReminderModal');
    if (overlay) overlay.classList.remove('active');
    state.editingReminderId = null;
  }

  function saveReminder() {
    var title = $('#kmReminderTitle').value.trim();
    var date = $('#kmReminderDate').value;
    var time = $('#kmReminderTime').value;
    var desc = $('#kmReminderDesc').value.trim();
    if (!title) {
      showToast('Title required', 'warning');
      return;
    }
    if (!date) {
      showToast('Date required', 'warning');
      return;
    }
    var now = Date.now();
    if (state.editingReminderId) {
      state.reminders.forEach(function (r) {
        if (r.id === state.editingReminderId) {
          r.title = title;
          r.date = date;
          r.time = time;
          r.description = desc;
        }
      });
      showToast('Reminder updated', 'success');
      addTerminalLog('KeepMemo: reminder updated (' + state.editingReminderId + ')');
    } else {
      var rem = {
        id: uuid(),
        title: title,
        date: date,
        time: time,
        description: desc,
        done: false,
        created_at: now
      };
      state.reminders.push(rem);
      showToast('Reminder created', 'success');
      addTerminalLog('KeepMemo: reminder created (' + rem.id + ')');
    }
    saveReminders();
    closeReminderModal();
    renderReminders();
    renderCalendar();
    updateTabBadges();
  }

  function deleteReminder(id) {
    var r = state.reminders.filter(function (x) { return x.id === id; })[0];
    if (!r) return;
    if (typeof window.showPopup === 'function') {
      window.showPopup(
        'Delete Reminder',
        '<div style="padding:18px; color:var(--text-secondary); text-align:center;"><p>Delete reminder <strong style="color:var(--text-primary);">' + escapeHtml(r.title) + '</strong>?</p><p style="font-size:12px; color:var(--text-tertiary); margin-top:6px;">This action cannot be undone.</p></div>',
        true,
        function () { confirmDeleteReminder(id); }
      );
    } else {
      if (confirm('Delete this reminder?')) confirmDeleteReminder(id);
    }
  }

  function confirmDeleteReminder(id) {
    state.reminders = state.reminders.filter(function (r) { return r.id !== id; });
    saveReminders();
    renderReminders();
    renderCalendar();
    updateTabBadges();
    showToast('Reminder deleted', 'success');
    addTerminalLog('KeepMemo: reminder deleted (' + id + ')');
  }

  function toggleReminderDone(id) {
    state.reminders.forEach(function (r) {
      if (r.id === id) r.done = !r.done;
    });
    saveReminders();
    renderReminders();
    renderCalendar();
    showToast('Reminder marked as ' + (state.reminders.filter(function (r) { return r.id === id; })[0].done ? 'done' : 'active'), 'success');
  }

  /* ============================================================
     UPCOMING REMINDER CHECK (within next hour)
     ============================================================ */
  function checkUpcomingReminders() {
    var now = Date.now();
    var oneHourFromNow = now + 60 * 60 * 1000;
    state.reminders.forEach(function (r) {
      if (r.done || !r.date || !r.time) return;
      var remTime = new Date(r.date + 'T' + r.time + ':00').getTime();
      if (isNaN(remTime)) return;
      var toastKey = r.id + '_' + r.date + '_' + r.time;
      // Fire toast once when reminder enters the next-hour window OR fires exactly
      if (remTime >= now && remTime <= oneHourFromNow) {
        if (!state.lastReminderToastKeys[toastKey]) {
          state.lastReminderToastKeys[toastKey] = true;
          var minsAway = Math.max(0, Math.round((remTime - now) / 60000));
          var msg = 'Reminder: ' + r.title + ' — ' + (minsAway === 0 ? 'now' : 'in ' + minsAway + 'm') + ' (' + r.time + ')';
          showToast(msg, 'warning');
          addTerminalLog('Reminder upcoming: ' + r.title + ' @ ' + r.date + ' ' + r.time);
        }
      }
      // Also fire AT the time (allow re-fire even after window)
      if (Math.abs(remTime - now) < 60000 && !state.lastReminderToastKeys[toastKey + '_fire']) {
        state.lastReminderToastKeys[toastKey + '_fire'] = true;
        showToast('Reminder NOW: ' + r.title, 'warning');
      }
    });
  }

  /* ============================================================
     LOGIN DATA (DATA LOGIN) — Link, Username/Email, Password,
     PIN, Noted. Popup card 5 field terstruktur.
     ============================================================ */
  function hostOf(url) {
    var s = (url || '').trim();
    if (!s) return 'Login';
    try {
      var u = new URL(s);
      return u.hostname || s;
    } catch (e) {
      return s.replace(/^https?:\/\//i, '').split('/')[0] || s;
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e2) {}
    document.body.removeChild(ta);
  }

  function copyLoginText(text, label) {
    if (!text) {
      showToast((label || 'Data') + ' kosong', 'warning');
      return;
    }
    var done = function () { showToast((label || 'Data') + ' tersalin ke clipboard', 'success'); };
    try {
      navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text); done(); });
    } catch (e) {
      fallbackCopy(text);
      done();
    }
  }

  function renderLogins() {
    var container = $('#kmLoginsList');
    if (!container) return;
    var search = ($('#kmLoginsSearch') && $('#kmLoginsSearch').value || '').toLowerCase().trim();
    var filtered = state.logins.slice().sort(function (a, b) {
      return (b.updated_at || b.created_at || 0) - (a.updated_at || a.created_at || 0);
    }).filter(function (l) {
      if (!search) return true;
      return (l.link || '').toLowerCase().indexOf(search) >= 0 ||
             (l.username || '').toLowerCase().indexOf(search) >= 0 ||
             (l.noted || '').toLowerCase().indexOf(search) >= 0;
    });

    if (filtered.length === 0) {
      container.innerHTML = '' +
        '<div class="km-empty">' +
          '<div class="km-empty-icon"><i class="fas fa-user-lock"></i></div>' +
          '<div class="km-empty-title">' + (search ? 'No matching login data' : 'Belum ada data login') + '</div>' +
          '<div class="km-empty-desc">' + (search ? 'Coba kata kunci lain.' : 'Klik "+ Add Login" untuk menyimpan data login pertama.') + '</div>' +
        '</div>';
      return;
    }

    var html = '<div class="km-logins-grid">';
    filtered.forEach(function (l) {
      var id = l.id;
      var revealed = state.loginRevealed[id] || {};
      var host = hostOf(l.link);
      var passMask = revealed.pass ? escapeHtml(l.password || '') : '••••••••';
      var pinMask = revealed.pin ? escapeHtml(l.pin || '') : '••••••';
      var timeLabel = formatRelativeTime(l.updated_at || l.created_at);
      html += '' +
        '<div class="km-login-card" data-login-id="' + escapeAttr(id) + '">' +
          '<div class="km-login-head">' +
            '<div class="km-login-avatar"><i class="fas fa-user-lock"></i></div>' +
            '<div class="km-login-idwrap">' +
              '<div class="km-login-title">' + escapeHtml(host) + '</div>' +
              (l.link ? '<a class="km-login-link" href="' + escapeAttr(l.link) + '" target="_blank" rel="noopener noreferrer" title="' + escapeAttr(l.link) + '"><i class="fas fa-link"></i> ' + escapeHtml(l.link.length > 42 ? l.link.substring(0, 40) + '…' : l.link) + '</a>' : '<span class="km-login-link" style="color:var(--text-tertiary);">-</span>') +
            '</div>' +
            '<div class="km-login-topactions">' +
              '<span class="km-login-time" title="Terakhir diubah"><i class="fas fa-clock"></i> ' + escapeHtml(timeLabel) + '</span>' +
              '<button class="km-btn icon edit" data-login-edit="' + escapeAttr(id) + '" title="Edit"><i class="fas fa-pen"></i></button>' +
              '<button class="km-btn icon danger" data-login-delete="' + escapeAttr(id) + '" title="Delete"><i class="fas fa-trash"></i></button>' +
            '</div>' +
          '</div>' +
          '<div class="km-login-grid">' +
            '<div class="km-login-field">' +
              '<label class="km-login-label"><i class="fas fa-envelope"></i> Username / Email</label>' +
              '<div class="km-login-val">' +
                '<span class="km-login-mono">' + escapeHtml(l.username || '-') + '</span>' +
                '<button class="km-mini-btn" data-login-copy="' + escapeAttr(id) + '" data-field="username" title="Copy username"><i class="fas fa-copy"></i></button>' +
              '</div>' +
            '</div>' +
            '<div class="km-login-field">' +
              '<label class="km-login-label"><i class="fas fa-key"></i> Password</label>' +
              '<div class="km-login-val">' +
                '<span class="km-login-mono">' + passMask + '</span>' +
                '<button class="km-mini-btn' + (revealed.pass ? ' on' : '') + '" data-login-reveal="pass" title="' + (revealed.pass ? 'Sembunyikan' : 'Tampilkan') + ' password"><i class="fas fa-' + (revealed.pass ? 'eye-slash' : 'eye') + '"></i></button>' +
                '<button class="km-mini-btn" data-login-copy="' + escapeAttr(id) + '" data-field="password" title="Copy password"><i class="fas fa-copy"></i></button>' +
              '</div>' +
            '</div>' +
            '<div class="km-login-field pin">' +
              '<label class="km-login-label"><i class="fas fa-shield-halved"></i> PIN</label>' +
              '<div class="km-login-val">' +
                '<span class="km-login-mono">' + pinMask + '</span>' +
                '<button class="km-mini-btn' + (revealed.pin ? ' on' : '') + '" data-login-reveal="pin" title="' + (revealed.pin ? 'Sembunyikan' : 'Tampilkan') + ' PIN"><i class="fas fa-' + (revealed.pin ? 'eye-slash' : 'eye') + '"></i></button>' +
                '<button class="km-mini-btn" data-login-copy="' + escapeAttr(id) + '" data-field="pin" title="Copy PIN"><i class="fas fa-copy"></i></button>' +
              '</div>' +
            '</div>' +
            '<div class="km-login-field noted">' +
              '<label class="km-login-label"><i class="fas fa-note-sticky"></i> Noted</label>' +
              '<div class="km-login-val noted">' + escapeHtml(l.noted || '-') + '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
    });
    html += '</div>';
    container.innerHTML = html;

    // Wire events (delegation per element, pola sama dgn notes)
    $$('[data-login-edit]', container).forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        openLoginModal(btn.getAttribute('data-login-edit'));
      });
    });
    $$('[data-login-delete]', container).forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        deleteLogin(btn.getAttribute('data-login-delete'));
      });
    });
    $$('[data-login-reveal]', container).forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var card = btn.closest('.km-login-card');
        if (!card) return;
        toggleLoginReveal(card.getAttribute('data-login-id'), btn.getAttribute('data-login-reveal'));
      });
    });
    $$('[data-login-copy]', container).forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var card = btn.closest('.km-login-card');
        if (!card) return;
        var id = card.getAttribute('data-login-id');
        var field = btn.getAttribute('data-field');
        var item = state.logins.filter(function (x) { return x.id === id; })[0];
        if (!item) return;
        var labels = { username: 'Username', password: 'Password', pin: 'PIN' };
        copyLoginText(item[field] || '', labels[field] || field);
      });
    });
  }

  function openLoginModal(loginId) {
    state.editingLoginId = loginId || null;
    var item = loginId ? state.logins.filter(function (l) { return l.id === loginId; })[0] : null;

    var overlay = $('#kmLoginModal');
    if (!overlay) return;

    $('#kmLoginModalTitle').innerHTML = item ? '<i class="fas fa-pen"></i> Edit Data Login' : '<i class="fas fa-user-plus"></i> Simpan Data Login';
    $('#kmLoginLink').value = item ? (item.link || '') : '';
    $('#kmLoginUser').value = item ? (item.username || '') : '';
    $('#kmLoginPass').value = item ? (item.password || '') : '';
    $('#kmLoginPin').value = item ? (item.pin || '') : '';
    $('#kmLoginNoted').value = item ? (item.noted || '') : '';
    // Reset eye ke mode tersembunyi
    resetLoginModalEyes();

    overlay.classList.add('active');
    setTimeout(function () { $('#kmLoginLink').focus(); }, 200);
  }

  function closeLoginModal() {
    var overlay = $('#kmLoginModal');
    if (overlay) overlay.classList.remove('active');
    state.editingLoginId = null;
  }

  function resetLoginModalEyes() {
    [['kmLoginPass', 'kmLoginPassEye'], ['kmLoginPin', 'kmLoginPinEye']].forEach(function (pair) {
      var input = document.getElementById(pair[0]);
      var btn = document.getElementById(pair[1]);
      if (input) input.type = 'password';
      if (btn) {
        btn.classList.remove('on');
        var icon = btn.querySelector('i');
        if (icon) icon.className = 'fas fa-eye';
      }
    });
  }

  function toggleLoginModalEye(inputId, btnId) {
    var input = document.getElementById(inputId);
    var btn = document.getElementById(btnId);
    if (!input || !btn) return;
    var icon = btn.querySelector('i');
    if (input.type === 'password') {
      input.type = 'text';
      if (icon) icon.className = 'fas fa-eye-slash';
      btn.classList.add('on');
    } else {
      input.type = 'password';
      if (icon) icon.className = 'fas fa-eye';
      btn.classList.remove('on');
    }
  }

  function saveLogin() {
    var link = $('#kmLoginLink').value.trim();
    var username = $('#kmLoginUser').value.trim();
    var password = $('#kmLoginPass').value;
    var pin = $('#kmLoginPin').value.trim();
    var noted = $('#kmLoginNoted').value.trim();

    if (!link) {
      showToast('Link wajib diisi', 'warning');
      return;
    }
    if (!username) {
      showToast('Username / Email wajib diisi', 'warning');
      return;
    }

    var now = Date.now();
    if (state.editingLoginId) {
      state.logins.forEach(function (l) {
        if (l.id === state.editingLoginId) {
          l.link = link;
          l.username = username;
          l.password = password;
          l.pin = pin;
          l.noted = noted;
          l.updated_at = now;
        }
      });
      showToast('Data login diperbarui', 'success');
      addTerminalLog('KeepMemo: login data updated (' + state.editingLoginId + ')');
    } else {
      var item = {
        id: uuid(),
        link: link,
        username: username,
        password: password,
        pin: pin,
        noted: noted,
        created_at: now,
        updated_at: now
      };
      state.logins.push(item);
      showToast('Data login tersimpan', 'success');
      addTerminalLog('KeepMemo: login data created (' + item.id + ')');
    }
    saveLogins();
    closeLoginModal();
    renderLogins();
    updateTabBadges();
  }

  function deleteLogin(id) {
    var item = state.logins.filter(function (l) { return l.id === id; })[0];
    if (!item) return;
    if (typeof window.showPopup === 'function') {
      window.showPopup(
        'Delete Login Data',
        '<div style="padding:18px; color:var(--text-secondary); text-align:center;"><p>Hapus data login <strong style="color:var(--text-primary);">' + escapeHtml(hostOf(item.link)) + '</strong>?</p><p style="font-size:12px; color:var(--text-tertiary); margin-top:6px;">This action cannot be undone.</p></div>',
        true,
        function () { confirmDeleteLogin(id); }
      );
    } else {
      if (confirm('Hapus data login ini?')) confirmDeleteLogin(id);
    }
  }

  function confirmDeleteLogin(id) {
    state.logins = state.logins.filter(function (l) { return l.id !== id; });
    delete state.loginRevealed[id];
    saveLogins();
    renderLogins();
    updateTabBadges();
    showToast('Data login dihapus', 'success');
    addTerminalLog('KeepMemo: login data deleted (' + id + ')');
  }

  function toggleLoginReveal(id, field) {
    if (!state.loginRevealed[id]) state.loginRevealed[id] = {};
    state.loginRevealed[id][field] = !state.loginRevealed[id][field];
    renderLogins();
  }

  /* ============================================================
     EXPORT
     ============================================================ */
  function exportData() {
    var exportObj = {
      _meta: {
        exported_at: new Date().toISOString(),
        app: 'AURA.OS Keep Memo',
        version: '1.1.0'
      },
      notes: state.notes,
      reminders: state.reminders,
      logins: state.logins
    };
    var json = JSON.stringify(exportObj, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    var ts = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    a.download = 'aura-keepmemo-' + ts + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    showToast('Data exported (' + state.notes.length + ' notes, ' + state.reminders.length + ' reminders, ' + state.logins.length + ' logins)', 'success');
    addTerminalLog('KeepMemo: export (' + state.notes.length + ' notes, ' + state.reminders.length + ' reminders, ' + state.logins.length + ' logins)');
  }

  /* ============================================================
     TAB BADGES
     ============================================================ */
  function updateTabBadges() {
    var notesBadge = $('#kmTabNotesBadge');
    var remBadge = $('#kmTabRemindersBadge');
    var loginBadge = $('#kmTabLoginsBadge');
    if (notesBadge) notesBadge.textContent = String(state.notes.length);
    if (remBadge) remBadge.textContent = String(state.reminders.length);
    if (loginBadge) loginBadge.textContent = String(state.logins.length);
  }

  /* ============================================================
     RENDER SHELL
     ============================================================ */
  function renderShell(container) {
    var html = '' +
      '<div class="kmWrap pro-keepmemo">' +
        '<div class="km-header">' +
          '<div class="km-title-block">' +
            '<div class="km-eyebrow"><span class="pulse-dot"></span> Productivity Suite</div>' +
            '<div class="km-title"><i class="fas fa-bookmark"></i> Keep Memo</div>' +
            '<div class="sp-sub" style="font-size:12.5px; color:#64748b;">Notes, calendar, reminders & data login <span class="km-stat-tag"><i class="fas fa-cloud"></i> Local Storage</span></div>' +
          '</div>' +
          '<div style="display:flex; gap:8px;">' +
            '<button class="km-btn secondary" id="kmExportBtn"><i class="fas fa-file-export"></i> Export</button>' +
          '</div>' +
        '</div>' +

        '<div class="km-tabs">' +
          '<button class="km-tab active" data-tab="notes"><i class="fas fa-bookmark"></i> Notes <span class="km-tab-badge" id="kmTabNotesBadge">0</span></button>' +
          '<button class="km-tab" data-tab="calendar"><i class="fas fa-calendar"></i> Calendar</button>' +
          '<button class="km-tab" data-tab="reminders"><i class="fas fa-bell"></i> Reminders <span class="km-tab-badge" id="kmTabRemindersBadge">0</span></button>' +
          '<button class="km-tab" data-tab="logins"><i class="fas fa-user-lock"></i> Data Login <span class="km-tab-badge" id="kmTabLoginsBadge">0</span></button>' +
        '</div>' +

        // NOTES PANEL
        '<div class="km-panel active" data-panel="notes">' +
          '<div class="km-toolbar">' +
            '<div class="km-search"><i class="fas fa-search"></i><input type="text" id="kmNotesSearch" placeholder="Search notes..."></div>' +
            '<button class="km-btn" id="kmNewNoteBtn"><i class="fas fa-plus"></i> New Note</button>' +
          '</div>' +
          '<div id="kmNotesList"></div>' +
        '</div>' +

        // CALENDAR PANEL
        '<div class="km-panel" data-panel="calendar">' +
          '<div class="km-cal-header">' +
            '<div class="km-cal-month" id="kmCalMonth"><i class="fas fa-calendar"></i> Loading...</div>' +
            '<div class="km-cal-nav">' +
              '<button class="km-btn icon" id="kmCalPrev" title="Previous month"><i class="fas fa-chevron-left"></i></button>' +
              '<button class="km-btn secondary" id="kmCalToday" style="padding:9px 14px; font-size:12px;"><i class="fas fa-crosshairs"></i> Today</button>' +
              '<button class="km-btn icon" id="kmCalNext" title="Next month"><i class="fas fa-chevron-right"></i></button>' +
            '</div>' +
          '</div>' +
          '<div class="km-cal-grid" id="kmCalendarGrid"></div>' +
          '<div class="km-cal-detail" id="kmCalDetail">' +
            '<div class="km-cal-detail-title"><i class="fas fa-info-circle"></i> Day Detail</div>' +
            '<div class="km-cal-detail-empty">Click a day to see reminders for that date.</div>' +
          '</div>' +
        '</div>' +

        // REMINDERS PANEL
        '<div class="km-panel" data-panel="reminders">' +
          '<div class="km-toolbar">' +
            '<div class="km-search" style="flex:0 0 auto; min-width:0;"></div>' +
            '<button class="km-btn" id="kmNewReminderBtn" style="margin-left:auto;"><i class="fas fa-plus"></i> New Reminder</button>' +
          '</div>' +
          '<div id="kmRemindersList"></div>' +
        '</div>' +

        // LOGIN DATA PANEL
        '<div class="km-panel" data-panel="logins">' +
          '<div class="km-toolbar">' +
            '<div class="km-search"><i class="fas fa-search"></i><input type="text" id="kmLoginsSearch" placeholder="Search link, username, noted..."></div>' +
            '<button class="km-btn" id="kmNewLoginBtn"><i class="fas fa-plus"></i> Add Login</button>' +
          '</div>' +
          '<div id="kmLoginsList"></div>' +
        '</div>' +
      '</div>' +

      // NOTE MODAL
      '<div class="km-modal-overlay" id="kmNoteModal">' +
        '<div class="km-modal">' +
          '<div class="km-modal-header">' +
            '<div class="km-modal-title" id="kmNoteModalTitle"><i class="fas fa-plus"></i> New Note</div>' +
            '<button class="km-modal-close" id="kmNoteModalClose"><i class="fas fa-times"></i></button>' +
          '</div>' +
          '<div class="km-modal-body">' +
            '<div class="km-field">' +
              '<label class="km-field-label">Title</label>' +
              '<input type="text" class="km-input" id="kmNoteTitle" placeholder="Note title..." maxlength="80">' +
            '</div>' +
            '<div class="km-field">' +
              '<label class="km-field-label">Content</label>' +
              '<textarea class="km-textarea" id="kmNoteContent" placeholder="Write your note..." maxlength="2000"></textarea>' +
            '</div>' +
            '<div class="km-field">' +
              '<label class="km-field-label">Color Tag</label>' +
              '<div class="km-color-picker" id="kmNoteColors"></div>' +
            '</div>' +
          '</div>' +
          '<div class="km-modal-footer">' +
            '<button class="km-btn secondary" id="kmNoteModalCancel">Cancel</button>' +
            '<button class="km-btn" id="kmNoteModalSave"><i class="fas fa-save"></i> Save Note</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // REMINDER MODAL
      '<div class="km-modal-overlay" id="kmReminderModal">' +
        '<div class="km-modal">' +
          '<div class="km-modal-header">' +
            '<div class="km-modal-title" id="kmReminderModalTitle"><i class="fas fa-plus"></i> New Reminder</div>' +
            '<button class="km-modal-close" id="kmReminderModalClose"><i class="fas fa-times"></i></button>' +
          '</div>' +
          '<div class="km-modal-body">' +
            '<div class="km-field">' +
              '<label class="km-field-label">Title</label>' +
              '<input type="text" class="km-input" id="kmReminderTitle" placeholder="Reminder title..." maxlength="80">' +
            '</div>' +
            '<div class="km-field-row">' +
              '<div class="km-field">' +
                '<label class="km-field-label">Date</label>' +
                '<input type="date" class="km-input" id="kmReminderDate">' +
              '</div>' +
              '<div class="km-field">' +
                '<label class="km-field-label">Time</label>' +
                '<input type="time" class="km-input" id="kmReminderTime">' +
              '</div>' +
            '</div>' +
            '<div class="km-field">' +
              '<label class="km-field-label">Description (optional)</label>' +
              '<textarea class="km-textarea" id="kmReminderDesc" placeholder="Add details..." maxlength="500" style="min-height:60px;"></textarea>' +
            '</div>' +
          '</div>' +
          '<div class="km-modal-footer">' +
            '<button class="km-btn secondary" id="kmReminderModalCancel">Cancel</button>' +
            '<button class="km-btn" id="kmReminderModalSave"><i class="fas fa-save"></i> Save Reminder</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // LOGIN DATA MODAL — 5 kolom terpisah dalam satu card popup
      '<div class="km-modal-overlay" id="kmLoginModal">' +
        '<div class="km-modal km-login-modal">' +
          '<div class="km-modal-header login">' +
            '<div class="km-modal-title" id="kmLoginModalTitle"><i class="fas fa-user-plus"></i> Simpan Data Login</div>' +
            '<button class="km-modal-close" id="kmLoginModalClose"><i class="fas fa-times"></i></button>' +
          '</div>' +
          '<div class="km-modal-body">' +
            '<div class="km-login-form-note"><i class="fas fa-shield-halved"></i> Data login tersimpan lokal di perangkat ini — password & PIN termasking otomatis</div>' +
            '<div class="km-field">' +
              '<label class="km-field-label"><i class="fas fa-link"></i> Link</label>' +
              '<div class="km-input-iconwrap">' +
                '<i class="fas fa-globe"></i>' +
                '<input type="text" class="km-input has-icon" id="kmLoginLink" placeholder="https://situs.com/login" maxlength="300">' +
              '</div>' +
            '</div>' +
            '<div class="km-field">' +
              '<label class="km-field-label"><i class="fas fa-envelope"></i> Username / Email</label>' +
              '<div class="km-input-iconwrap">' +
                '<i class="fas fa-user"></i>' +
                '<input type="text" class="km-input has-icon" id="kmLoginUser" placeholder="username atau email" maxlength="120">' +
              '</div>' +
            '</div>' +
            '<div class="km-field-row">' +
              '<div class="km-field">' +
                '<label class="km-field-label"><i class="fas fa-key"></i> Password</label>' +
                '<div class="km-input-iconwrap">' +
                  '<i class="fas fa-asterisk"></i>' +
                  '<input type="password" class="km-input has-icon has-eye" id="kmLoginPass" placeholder="password" maxlength="64" autocomplete="off">' +
                  '<button type="button" class="km-eye-btn" id="kmLoginPassEye" title="Show/Hide password"><i class="fas fa-eye"></i></button>' +
                '</div>' +
              '</div>' +
              '<div class="km-field km-field-pin">' +
                '<label class="km-field-label"><i class="fas fa-shield-halved"></i> PIN</label>' +
                '<div class="km-input-iconwrap">' +
                  '<i class="fas fa-hashtag"></i>' +
                  '<input type="password" class="km-input has-icon has-eye" id="kmLoginPin" placeholder="pin" maxlength="8" inputmode="numeric" autocomplete="off">' +
                  '<button type="button" class="km-eye-btn" id="kmLoginPinEye" title="Show/Hide PIN"><i class="fas fa-eye"></i></button>' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="km-field">' +
              '<label class="km-field-label"><i class="fas fa-note-sticky"></i> Noted</label>' +
              '<textarea class="km-textarea" id="kmLoginNoted" placeholder="Catatan tambahan..." maxlength="500" style="min-height:64px;"></textarea>' +
            '</div>' +
          '</div>' +
          '<div class="km-modal-footer">' +
            '<button class="km-btn secondary" id="kmLoginModalCancel">Cancel</button>' +
            '<button class="km-btn" id="kmLoginModalSave"><i class="fas fa-user-lock"></i> Save Login</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    container.innerHTML = html;
  }

  /* ============================================================
     WIRE EVENTS
     ============================================================ */
  function wireEvents() {
    // Tabs
    $$('.km-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        switchTab(tab.getAttribute('data-tab'));
      });
    });

    // Notes
    var newNoteBtn = $('#kmNewNoteBtn');
    if (newNoteBtn) newNoteBtn.addEventListener('click', function () { openNoteModal(null); });

    var notesSearch = $('#kmNotesSearch');
    if (notesSearch) notesSearch.addEventListener('input', renderNotes);

    var noteSave = $('#kmNoteModalSave');
    if (noteSave) noteSave.addEventListener('click', saveNote);

    var noteCancel = $('#kmNoteModalCancel');
    if (noteCancel) noteCancel.addEventListener('click', closeNoteModal);

    var noteClose = $('#kmNoteModalClose');
    if (noteClose) noteClose.addEventListener('click', closeNoteModal);

    var noteModal = $('#kmNoteModal');
    if (noteModal) noteModal.addEventListener('click', function (e) {
      if (e.target === noteModal) closeNoteModal();
    });

    // Calendar
    var calPrev = $('#kmCalPrev');
    if (calPrev) calPrev.addEventListener('click', function () { navigateMonth(-1); });
    var calNext = $('#kmCalNext');
    if (calNext) calNext.addEventListener('click', function () { navigateMonth(1); });
    var calToday = $('#kmCalToday');
    if (calToday) calToday.addEventListener('click', goToToday);

    // Reminders
    var newRemBtn = $('#kmNewReminderBtn');
    if (newRemBtn) newRemBtn.addEventListener('click', function () { openReminderModal(null); });

    var remSave = $('#kmReminderModalSave');
    if (remSave) remSave.addEventListener('click', saveReminder);

    var remCancel = $('#kmReminderModalCancel');
    if (remCancel) remCancel.addEventListener('click', closeReminderModal);

    var remClose = $('#kmReminderModalClose');
    if (remClose) remClose.addEventListener('click', closeReminderModal);

    var remModal = $('#kmReminderModal');
    if (remModal) remModal.addEventListener('click', function (e) {
      if (e.target === remModal) closeReminderModal();
    });

    // Login Data
    var newLoginBtn = $('#kmNewLoginBtn');
    if (newLoginBtn) newLoginBtn.addEventListener('click', function () { openLoginModal(null); });

    var loginsSearch = $('#kmLoginsSearch');
    if (loginsSearch) loginsSearch.addEventListener('input', renderLogins);

    var loginSave = $('#kmLoginModalSave');
    if (loginSave) loginSave.addEventListener('click', saveLogin);

    var loginCancel = $('#kmLoginModalCancel');
    if (loginCancel) loginCancel.addEventListener('click', closeLoginModal);

    var loginClose = $('#kmLoginModalClose');
    if (loginClose) loginClose.addEventListener('click', closeLoginModal);

    var loginModal = $('#kmLoginModal');
    if (loginModal) loginModal.addEventListener('click', function (e) {
      if (e.target === loginModal) closeLoginModal();
    });

    var passEye = $('#kmLoginPassEye');
    if (passEye) passEye.addEventListener('click', function () { toggleLoginModalEye('kmLoginPass', 'kmLoginPassEye'); });

    var pinEye = $('#kmLoginPinEye');
    if (pinEye) pinEye.addEventListener('click', function () { toggleLoginModalEye('kmLoginPin', 'kmLoginPinEye'); });

    // Export
    var exportBtn = $('#kmExportBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportData);

    // Keyboard escape to close modals
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if ($('#kmNoteModal') && $('#kmNoteModal').classList.contains('active')) closeNoteModal();
        if ($('#kmReminderModal') && $('#kmReminderModal').classList.contains('active')) closeReminderModal();
        if ($('#kmLoginModal') && $('#kmLoginModal').classList.contains('active')) closeLoginModal();
      }
      // Ctrl/Cmd+Enter to save in modals
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if ($('#kmNoteModal') && $('#kmNoteModal').classList.contains('active')) saveNote();
        if ($('#kmReminderModal') && $('#kmReminderModal').classList.contains('active')) saveReminder();
        if ($('#kmLoginModal') && $('#kmLoginModal').classList.contains('active')) saveLogin();
      }
    });
  }

  /* ============================================================
     PUBLIC API
     ============================================================ */
  function load() {
    var container = document.getElementById('keepMemoView');
    if (!container) {
      console.warn('KeepMemoPro: #keepMemoView container not found');
      return;
    }
    loadNotes();
    loadReminders();
    loadLogins();
    renderShell(container);
    wireEvents();

    // Restore active tab
    var savedTab = localStorage.getItem(ACTIVE_TAB_KEY);
    if (savedTab && savedTab !== 'notes') {
      switchTab(savedTab);
    } else {
      renderNotes();
    }
    updateTabBadges();

    // Start reminder checker
    if (state.reminderCheckTimer) clearInterval(state.reminderCheckTimer);
    state.reminderCheckTimer = setInterval(checkUpcomingReminders, 30000); // every 30s
    checkUpcomingReminders(); // initial check

    addTerminalLog('KeepMemoPro panel loaded (' + state.notes.length + ' notes, ' + state.reminders.length + ' reminders, ' + state.logins.length + ' logins)');
  }

  function init() {
    loadNotes();
    loadReminders();
    loadLogins();
    // Start reminder checker on init so toasts fire even if user hasn't opened the panel
    if (state.reminderCheckTimer) clearInterval(state.reminderCheckTimer);
    state.reminderCheckTimer = setInterval(checkUpcomingReminders, 30000);
    setTimeout(checkUpcomingReminders, 5000); // first check after 5s
  }

  // Boot-time init
  init();

  // Expose public API
  window.KeepMemoPro = {
    init: init,
    load: load,
    getNotes: function () { return state.notes.slice(); },
    getReminders: function () { return state.reminders.slice(); },
    getLogins: function () { return state.logins.slice(); },
    refresh: function () {
      loadNotes();
      loadReminders();
      loadLogins();
      renderNotes();
      renderReminders();
      renderCalendar();
      renderLogins();
      updateTabBadges();
    },
    exportData: exportData
  };

})();
