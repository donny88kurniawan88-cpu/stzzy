/* ============================================================
   AURA.OS // MYEVENT-PRO.JS
   Professional rendering logic for My Event panel
   - Replaces inline renderMyEventStats + renderMyEventTable
   - Polished badges, copy buttons, screenshot thumbnails
   - Sticky header, zebra rows, status row accents
   ============================================================ */

(function () {
  'use strict';

  // SVG icon for bukti/lampiran column (lucide-image)
  var BUKTI_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path></svg>';

  // Escape HTML helper
  function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // Format hadiah: "2000" → "Rp 2,000"
  function formatHadiah(val) {
    if (!val || val === '-' || val === '') return '<span style="color:var(--text-tertiary);">-</span>';
    var s = String(val).trim();
    s = s.replace(/Rp\.?\s*/i, '');
    var digits = s.replace(/[^0-9]/g, '');
    if (!digits) return escapeHtml(val);
    var formatted = parseInt(digits, 10).toLocaleString('en-US');
    return '<span class="pro-me-hadiah">Rp ' + formatted + '</span>';
  }

  // Render stats cards with progress bars
  function renderMyEventStatsPro(events) {
    var total = events.length;
    var approved = events.filter(function (e) { return (e.status || '').toUpperCase() === 'APPROVED'; }).length;
    var rejected = events.filter(function (e) { return (e.status || '').toUpperCase() === 'REJECTED'; }).length;
    var pending = events.filter(function (e) { return (e.status || '').toUpperCase() === 'PENDING'; }).length;
    var pct = function (n) { return total > 0 ? Math.round((n / total) * 100) : 0; };

    var html = '';
    html += '<div class="pro-me-stat total">';
    html += '<div class="pro-me-stat-label"><i class="fas fa-layer-group"></i> Total</div>';
    html += '<div class="pro-me-stat-value">' + total + '</div>';
    html += '<div class="pro-me-stat-bar"><div class="pro-me-stat-bar-fill" style="width:100%"></div></div>';
    html += '</div>';

    html += '<div class="pro-me-stat approved">';
    html += '<div class="pro-me-stat-label"><i class="fas fa-circle-check"></i> Approved</div>';
    html += '<div class="pro-me-stat-value">' + approved + '</div>';
    html += '<div class="pro-me-stat-bar"><div class="pro-me-stat-bar-fill" style="width:' + pct(approved) + '%"></div></div>';
    html += '</div>';

    html += '<div class="pro-me-stat rejected">';
    html += '<div class="pro-me-stat-label"><i class="fas fa-circle-xmark"></i> Rejected</div>';
    html += '<div class="pro-me-stat-value">' + rejected + '</div>';
    html += '<div class="pro-me-stat-bar"><div class="pro-me-stat-bar-fill" style="width:' + pct(rejected) + '%"></div></div>';
    html += '</div>';

    html += '<div class="pro-me-stat pending">';
    html += '<div class="pro-me-stat-label"><i class="fas fa-clock"></i> Pending</div>';
    html += '<div class="pro-me-stat-value">' + pending + '</div>';
    html += '<div class="pro-me-stat-bar"><div class="pro-me-stat-bar-fill" style="width:' + pct(pending) + '%"></div></div>';
    html += '</div>';

    var statsEl = document.getElementById('myEventStats');
    if (statsEl) statsEl.innerHTML = html;
  }

  // Render table rows
  function renderMyEventTablePro(events) {
    var tbody = document.getElementById('myEventBody');
    if (!tbody) return;

    if (!events || events.length === 0) {
      tbody.innerHTML = '' +
        '<tr><td colspan="11">' +
        '<div class="pro-me-empty">' +
        '<div class="pro-me-empty-icon"><i class="fas fa-inbox"></i></div>' +
        '<div class="pro-me-empty-title">Belum ada data event</div>' +
        '<div class="pro-me-empty-desc">Data dari extension akan muncul di sini secara otomatis</div>' +
        '</div>' +
        '</td></tr>';
      return;
    }

    var html = '';
    events.forEach(function (e, idx) {
      var statusUp = (e.status || 'PENDING').toUpperCase();
      var rowClass = 'row-' + statusUp.toLowerCase();

      // Status badge with dot
      var statusIcon = statusUp === 'APPROVED' ? 'fa-circle-check'
        : statusUp === 'REJECTED' ? 'fa-circle-xmark'
        : 'fa-clock';
      var statusBadge = '<span class="pro-me-badge ' + statusUp.toLowerCase() + '"><i class="fas ' + statusIcon + '" style="font-size:9px;"></i> ' + statusUp + '</span>';

      // Game badge
      var gameBadge = e.tipe_game
        ? '<span class="pro-me-badge game">' + escapeHtml(e.tipe_game) + '</span>'
        : '<span style="color:var(--text-tertiary);">-</span>';

      // KLAIM
      var klaimVal = e.klaim || '';
      var klaimBadge;
      if (klaimVal && /^https?:\/\//i.test(klaimVal)) {
        var shortUrl = klaimVal.replace(/^https?:\/\//i, '');
        if (shortUrl.length > 25) shortUrl = shortUrl.substring(0, 22) + '...';
        klaimBadge = '<a href="' + escapeHtml(klaimVal) + '" target="_blank" class="pro-me-link" title="' + escapeHtml(klaimVal) + '"><i class="fas fa-link"></i> ' + escapeHtml(shortUrl) + '</a>';
      } else if (klaimVal) {
        klaimBadge = '<span class="pro-me-badge klaim">' + escapeHtml(klaimVal) + '</span>';
      } else {
        klaimBadge = '<span style="color:var(--text-tertiary);">-</span>';
      }

      // Tanggal
      var tanggal = e.tanggal || (e.created_at ? new Date(e.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-');

      // BUKTI
      var buktiUrl = e.bukti_screenshot || (klaimVal && /^https?:\/\//i.test(klaimVal) ? klaimVal : '');
      var bukti = buktiUrl
        ? '<div class="pro-me-screenshot" onclick="MyEventPro.showBukti(\'' + escapeHtml(buktiUrl).replace(/'/g, '&#39;') + '\')" title="Lihat bukti">' + BUKTI_SVG + '</div>'
        : '<div class="pro-me-screenshot disabled" title="Tidak ada bukti">' + BUKTI_SVG + '</div>';

      // Build row
      html += '<tr class="' + rowClass + '" data-userid="' + escapeHtml((e.user_id || '').toLowerCase()) + '" data-id="' + (e.id || '') + '">';
      html += '<td><input type="checkbox" class="me-row-check" value="' + (e.id || '') + '" onchange="MyEventPro.toggleRow(this)"></td>';
      html += '<td><span style="font-weight:600;">' + escapeHtml(e.situs || '-') + '</span></td>';
      html += '<td><div class="pro-me-cell-copy"><span class="pro-me-mono">' + escapeHtml(e.user_id || '-') + '</span><button class="pro-me-copy-btn" onclick="MyEventPro.copy(\'' + escapeHtml(e.user_id || '') + '\', this)" title="Copy"><i class="fas fa-copy"></i></button></div></td>';
      html += '<td>' + gameBadge + '</td>';
      html += '<td><div class="pro-me-cell-copy"><span class="pro-me-mono">' + escapeHtml(e.kode_tiket || '-') + '</span><button class="pro-me-copy-btn" onclick="MyEventPro.copy(\'' + escapeHtml(e.kode_tiket || '') + '\', this)" title="Copy"><i class="fas fa-copy"></i></button></div></td>';
      html += '<td><div class="pro-me-cell-copy">' + formatHadiah(e.hadiah) + '<button class="pro-me-copy-btn" onclick="MyEventPro.copy(\'' + escapeHtml(String(e.hadiah || '')) + '\', this)" title="Copy"><i class="fas fa-copy"></i></button></div></td>';
      html += '<td>' + klaimBadge + '</td>';
      html += '<td>' + bukti + '</td>';
      html += '<td>' + statusBadge + '</td>';
      html += '<td><span style="font-size:11.5px; color:var(--text-secondary);">' + escapeHtml(e.keterangan || '-') + '</span></td>';
      html += '<td style="font-size:11px; color:var(--text-tertiary); white-space:nowrap; font-family:var(--font-mono);">' + escapeHtml(tanggal) + '</td>';
      html += '</tr>';
    });

    tbody.innerHTML = html;

    // Update count badge
    var countEl = document.getElementById('myEventCount');
    if (countEl) countEl.textContent = events.length;
  }

  // Copy to clipboard with feedback
  function copyTextPro(text, btn) {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text).then(function () {
        if (btn) {
          var original = btn.innerHTML;
          btn.innerHTML = '<i class="fas fa-check"></i>';
          btn.classList.add('copied');
          setTimeout(function () {
            btn.innerHTML = original;
            btn.classList.remove('copied');
          }, 1200);
        }
        if (typeof showToast === 'function') showToast('Tersalin: ' + (text.length > 30 ? text.substring(0, 30) + '...' : text), 'success');
      }).catch(function () {
        // Fallback
        var ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (e2) {}
        document.body.removeChild(ta);
        if (typeof showToast === 'function') showToast('Tersalin', 'success');
      });
    } catch (e) {
      if (typeof showToast === 'function') showToast('Gagal copy', 'error');
    }
  }

  // Toggle row selection visual
  function toggleRow(checkbox) {
    var row = checkbox.closest('tr');
    if (!row) return;
    if (checkbox.checked) {
      row.classList.add('row-selected');
    } else {
      row.classList.remove('row-selected');
    }
    // Update select-all checkbox state
    var allCheckboxes = document.querySelectorAll('.me-row-check');
    var selectAll = document.getElementById('myEventSelectAll');
    if (selectAll) {
      var checkedCount = Array.from(allCheckboxes).filter(function (cb) { return cb.checked; }).length;
      selectAll.checked = allCheckboxes.length > 0 && checkedCount === allCheckboxes.length;
      selectAll.indeterminate = checkedCount > 0 && checkedCount < allCheckboxes.length;
    }
  }

  // Select all with visual feedback
  function selectAllPro(master) {
    document.querySelectorAll('.me-row-check').forEach(function (cb) {
      cb.checked = master.checked;
      var row = cb.closest('tr');
      if (row) {
        if (master.checked) row.classList.add('row-selected');
        else row.classList.remove('row-selected');
      }
    });
  }

  // Filter by User ID
  function filterMyEventPro() {
    var query = (document.getElementById('myEventSearch').value || '').toLowerCase().trim();
    if (typeof myEventData === 'undefined') return;
    var filtered = myEventData.filter(function (e) {
      return !query || String(e.user_id || '').toLowerCase().includes(query);
    });
    renderMyEventTablePro(filtered);
  }

  // Delete selected
  function deleteSelectedPro() {
    var ids = Array.from(document.querySelectorAll('.me-row-check:checked')).map(function (cb) { return parseInt(cb.value, 10); }).filter(function (id) { return !isNaN(id); });
    if (ids.length === 0) {
      if (typeof showToast === 'function') showToast('Pilih baris yang ingin dihapus', 'warning');
      return;
    }
    if (!confirm('Hapus ' + ids.length + ' baris terpilih?')) return;
    var token = localStorage.getItem('aura_auth_token') || '';
    fetch('/api/event/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify({ ids: ids })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.success) {
          if (typeof showToast === 'function') showToast(ids.length + ' baris dihapus', 'success');
          if (typeof loadMyEventData === 'function') loadMyEventData();
        } else {
          if (typeof showToast === 'function') showToast(data.error || 'Gagal hapus', 'error');
        }
      })
      .catch(function () { if (typeof showToast === 'function') showToast('Kesalahan koneksi', 'error'); });
  }

  // Delete all
  function deleteAllPro() {
    if (!confirm('Hapus SEMUA data event? Tindakan ini tidak dapat dibatalkan.')) return;
    var token = localStorage.getItem('aura_auth_token') || '';
    fetch('/api/event/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
      body: JSON.stringify({ all: true })
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.success) {
          if (typeof showToast === 'function') showToast('Semua event dihapus', 'success');
          if (typeof loadMyEventData === 'function') loadMyEventData();
        } else {
          if (typeof showToast === 'function') showToast(data.error || 'Gagal hapus semua', 'error');
        }
      })
      .catch(function () { if (typeof showToast === 'function') showToast('Kesalahan koneksi', 'error'); });
  }

  // Update header count + last update time
  function updateHeaderPro(eventCount) {
    var countEl = document.getElementById('myEventCount');
    if (countEl) countEl.textContent = eventCount;
    var lastUpdateEl = document.getElementById('myEventLastUpdate');
    if (lastUpdateEl) {
      var now = new Date();
      lastUpdateEl.textContent = 'Updated ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
  }

  // Initialize — replace global functions to use Pro versions
  function init() {
    // Replace global functions (called from Dashboard.html)
    window.renderMyEventStats = renderMyEventStatsPro;
    window.renderMyEventTable = renderMyEventTablePro;
    window.filterMyEvent = filterMyEventPro;
    window.toggleSelectAllMyEvent = selectAllPro;
    window.deleteMyEventSelected = deleteSelectedPro;
    window.deleteMyEventAll = deleteAllPro;
    window.copyText = function (text) { copyTextPro(text, null); };

    // Add count + last-update elements if missing
    var statsEl = document.getElementById('myEventStats');
    if (statsEl && !document.getElementById('myEventCount')) {
      // Already in HTML if pro header is rendered
    }
  }

  // ============================================================
  // BUKTI POPUP — show screenshot with link field on top
  // ============================================================
  function showBukti(url) {
    if (!url) {
      if (typeof showToast === 'function') showToast('Tidak ada bukti screenshot', 'warning');
      return;
    }

    // Remove existing popup if any
    var existing = document.getElementById('proMeBuktiOverlay');
    if (existing) existing.remove();

    // Decode HTML entities from escapeHtml
    var txt = document.createElement('textarea');
    txt.innerHTML = url;
    var cleanUrl = txt.value;

    // Create overlay
    var overlay = document.createElement('div');
    overlay.id = 'proMeBuktiOverlay';
    overlay.className = 'pro-me-bukti-overlay';
    overlay.onclick = function(e) {
      if (e.target === overlay) closeBukti();
    };

    // Build popup content
    overlay.innerHTML = '' +
      '<div class="pro-me-bukti-modal">' +
        '<div class="pro-me-bukti-header">' +
          '<div class="pro-me-bukti-title">' +
            '<i class="fas fa-image"></i>' +
            '<span>Bukti Screenshot</span>' +
          '</div>' +
          '<button class="pro-me-bukti-close" onclick="MyEventPro.closeBukti()" title="Tutup">' +
            '<i class="fas fa-times"></i>' +
          '</button>' +
        '</div>' +
        '<div class="pro-me-bukti-body">' +
          // Link field on top
          '<div class="pro-me-bukti-link-section">' +
            '<label class="pro-me-bukti-link-label">' +
              '<i class="fas fa-link"></i> Link Screenshot' +
            '</label>' +
            '<div class="pro-me-bukti-link-row">' +
              '<input type="text" class="pro-me-bukti-link-input" id="proMeBuktiLink" value="' + escapeHtml(cleanUrl) + '" readonly>' +
              '<button class="pro-me-bukti-link-copy" onclick="MyEventPro.copyLink()" title="Copy link">' +
                '<i class="fas fa-copy"></i>' +
              '</button>' +
              '<a href="' + escapeHtml(cleanUrl) + '" target="_blank" class="pro-me-bukti-link-open" title="Buka di tab baru">' +
                '<i class="fas fa-external-link-alt"></i>' +
              '</a>' +
            '</div>' +
          '</div>' +
          // Screenshot image below
          '<div class="pro-me-bukti-image-section">' +
            '<div class="pro-me-bukti-image-label">' +
              '<i class="fas fa-paperclip"></i> Lampiran Screenshot' +
            '</div>' +
            '<div class="pro-me-bukti-image-wrap">' +
              '<img src="' + escapeHtml(cleanUrl) + '" alt="Bukti Screenshot" class="pro-me-bukti-img" ' +
                'onerror="this.style.display=\'none\'; this.parentElement.innerHTML=\'<div class=\\\'pro-me-bukti-img-error\\\'><i class=\\\'fas fa-exclamation-triangle\\\'></i><span>Gagal memuat gambar</span><a href=\\\'' + escapeHtml(cleanUrl) + '\\\' target=\\\'_blank\\\' class=\\\'pro-me-bukti-img-error-link\\\'>Buka link manual</a></div>\';">' +
                'onclick="MyEventPro.zoomImage(this)" ' +
                'loading="lazy">' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="pro-me-bukti-footer">' +
          '<span class="pro-me-bukti-footer-info">' +
            '<i class="fas fa-info-circle"></i> Klik gambar untuk zoom' +
          '</span>' +
          '<button class="pro-me-bukti-footer-btn" onclick="MyEventPro.closeBukti()">' +
            '<i class="fas fa-check"></i> Tutup' +
          '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // Animate in
    setTimeout(function() {
      overlay.classList.add('active');
    }, 10);

    // ESC key to close
    document.addEventListener('keydown', _buktiEscHandler);
  }

  function closeBukti() {
    var overlay = document.getElementById('proMeBuktiOverlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    setTimeout(function() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      document.body.style.overflow = '';
    }, 250);
    document.removeEventListener('keydown', _buktiEscHandler);
  }

  function _buktiEscHandler(e) {
    if (e.key === 'Escape' || e.keyCode === 27) {
      closeBukti();
    }
  }

  function copyLink() {
    var input = document.getElementById('proMeBuktiLink');
    if (!input) return;
    copyTextPro(input.value, null);
  }

  function zoomImage(img) {
    if (img.style.cursor === 'zoom-out') {
      img.style.cursor = 'zoom-in';
      img.classList.remove('zoomed');
    } else {
      img.style.cursor = 'zoom-out';
      img.classList.add('zoomed');
    }
  }

  // Expose API
  window.MyEventPro = {
    renderStats: renderMyEventStatsPro,
    renderTable: renderMyEventTablePro,
    copy: copyTextPro,
    toggleRow: toggleRow,
    selectAll: selectAllPro,
    filter: filterMyEventPro,
    deleteSelected: deleteSelectedPro,
    deleteAll: deleteAllPro,
    updateHeader: updateHeaderPro,
    showBukti: showBukti,
    closeBukti: closeBukti,
    copyLink: copyLink,
    zoomImage: zoomImage,
    init: init
  };

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
