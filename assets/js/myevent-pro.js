/* ============================================================
   AURA.OS // MYEVENT-PRO.JS
   Professional rendering logic for My Event panel
   - Replaces inline renderMyEventStats + renderMyEventTable
   - Polished badges, copy buttons, screenshot thumbnails
   - Sticky header, zebra rows, status row accents
   ============================================================ */

(function () {
  'use strict';

  // ============================================================
  // PAGINATION / SHOW-DATA STATE
  // - mePage: halaman aktif, mePerPage: baris per halaman (toggle "Show")
  // - meDataset: hasil filter terakhir (sumber pagination)
  // - mePage STABIL saat auto-refresh — user tidak lompat ke halaman 1
  // ============================================================
  var mePage = 1;
  var mePerPage = 10;
  var meDataset = [];
  var PER_PAGE_OPTIONS = [10, 25, 50, 100];

  // Baca query search User ID yang sedang aktif ('' jika kosong)
  function getSearchQuery() {
    var el = document.getElementById('myEventSearch');
    return el ? (el.value || '').toLowerCase().trim() : '';
  }

  // ============================================================
  // AUTOREFRESH GUARD — pause selama search by User ID aktif
  // (interval auto-refresh 10s dihentikan supaya hasil search
  //  tidak tertimpa render ulang; resume saat search dikosongkan)
  // ============================================================
  function setRefreshTag(state) {
    var tag = document.querySelector('.pro-me-sub .auto-refresh-tag');
    if (!tag) return;
    if (state === 'paused') {
      tag.classList.add('paused');
      tag.innerHTML = '<i class="fas fa-pause"></i> Auto-refresh pause · search aktif';
    } else {
      tag.classList.remove('paused');
      tag.innerHTML = '<i class="fas fa-sync-alt"></i> Auto-refresh 10s';
    }
  }

  function pauseMyEventAutorefresh() {
    if (window.__myEventInterval) {
      clearInterval(window.__myEventInterval);
      window.__myEventInterval = null;
    }
    setRefreshTag('paused');
  }

  function resumeMyEventAutorefresh() {
    // hanya resume bila view My Event sedang terlihat
    var mev = document.getElementById('myEventView');
    if (!mev || mev.style.display === 'none') return;
    if (window.__myEventInterval) return;
    if (getSearchQuery()) return; // masih ada query — jangan nyalakan
    window.__myEventInterval = setInterval(function () {
      if (typeof window.loadMyEventData === 'function') window.loadMyEventData();
    }, 10000);
    setRefreshTag('active');
  }

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

  // Render table rows (dengan pagination — render per halaman)
  function renderMyEventTablePro(events) {
    var tbody = document.getElementById('myEventBody');
    if (!tbody) return;

    // SAFETY NET: bila search by User ID sedang aktif, pertahankan hasil
    // filter (mis. render ulang slipped through) — view tidak lompat ke
    // daftar penuh. Logika filter sama persis dgn filterMyEventPro.
    var activeQuery = getSearchQuery();
    if (activeQuery && events && events.length) {
      events = events.filter(function (e) {
        return String(e.user_id || '').toLowerCase().includes(activeQuery);
      });
    }

    // Simpan dataset utk pagination + clamp halaman (posisi halaman dipertahankan)
    meDataset = events || [];
    var totalRows = meDataset.length;
    var totalPages = Math.max(1, Math.ceil(totalRows / mePerPage));
    if (mePage > totalPages) mePage = totalPages;

    if (!events || events.length === 0) {
      var emptyTitle = activeQuery ? ('Tidak ada hasil untuk "' + escapeHtml(activeQuery) + '"') : 'Belum ada data event';
      var emptyDesc = activeQuery ? 'Coba kata kunci User ID lain' : 'Data dari extension akan muncul di sini secara otomatis';
      tbody.innerHTML = '' +
        '<tr><td colspan="11">' +
        '<div class="pro-me-empty">' +
        '<div class="pro-me-empty-icon"><i class="fas fa-inbox"></i></div>' +
        '<div class="pro-me-empty-title">' + emptyTitle + '</div>' +
        '<div class="pro-me-empty-desc">' + emptyDesc + '</div>' +
        '</div>' +
        '</td></tr>';
      var countElEmpty = document.getElementById('myEventCount');
      if (countElEmpty) countElEmpty.textContent = 0;
      renderMyEventPagination();
      return;
    }

    var html = '';

    // Detect duplicate kode_tiket (periode) — if same kode_tiket appears 2+ times, mark it
    // (dihitung atas SELURUH hasil filter, bukan hanya halaman aktif — perilaku asli dipertahankan)
    var tiketCount = {};
    events.forEach(function (e) {
      var kt = (e.kode_tiket || '').trim();
      if (kt) tiketCount[kt] = (tiketCount[kt] || 0) + 1;
    });

    // Slice halaman aktif untuk render baris
    var startIdx = (mePage - 1) * mePerPage;
    var pageEvents = events.slice(startIdx, startIdx + mePerPage);

    pageEvents.forEach(function (e, idx) {
      var statusUp = (e.status || 'PENDING').toUpperCase();
      var rowClass = 'row-' + statusUp.toLowerCase();

      // Check if this kode_tiket is duplicate
      var currentTiket = (e.kode_tiket || '').trim();
      var isDuplicate = currentTiket && tiketCount[currentTiket] > 1;

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
      html += '<td><div class="pro-me-cell-copy"><span class="pro-me-mono">' + escapeHtml(e.kode_tiket || '-') + '</span>' + (isDuplicate ? ' <span class="pro-me-badge duplicate" title="Periode ini muncul ' + tiketCount[currentTiket] + 'x"><i class="fas fa-exclamation-triangle" style="font-size:8px;"></i> DUP</span>' : '') + '<button class="pro-me-copy-btn" onclick="MyEventPro.copy(\'' + escapeHtml(e.kode_tiket || '') + '\', this)" title="Copy"><i class="fas fa-copy"></i></button></div></td>';
      html += '<td><div class="pro-me-cell-copy">' + formatHadiah(e.hadiah) + '<button class="pro-me-copy-btn" onclick="MyEventPro.copy(\'' + escapeHtml(String(e.hadiah || '')) + '\', this)" title="Copy"><i class="fas fa-copy"></i></button></div></td>';
      html += '<td>' + klaimBadge + '</td>';
      html += '<td>' + bukti + '</td>';
      html += '<td>' + statusBadge + '</td>';
      html += '<td><span style="font-size:11.5px; color:var(--text-secondary);">' + escapeHtml(e.keterangan || '-') + '</span></td>';
      html += '<td style="font-size:11px; color:var(--text-tertiary); white-space:nowrap; font-family:var(--font-mono);">' + escapeHtml(tanggal) + '</td>';
      html += '</tr>';
    });

    tbody.innerHTML = html;

    // Update count badge — total hasil filter (semantik asli dipertahankan)
    var countEl = document.getElementById('myEventCount');
    if (countEl) countEl.textContent = totalRows;

    // Render footer pagination (Showing X - Y out of Z + tombol halaman)
    renderMyEventPagination();
  }

  // ============================================================
  // PAGINATION FOOTER — "Showing 1 - 10 out of 436" + « ‹ 1 2 … 44 › »
  // + toggle "Show" (jumlah baris per halaman)
  // ============================================================
  function renderMyEventPagination() {
    var el = document.getElementById('myEventPagination');
    if (!el) return;

    var total = meDataset.length;
    var totalPages = Math.max(1, Math.ceil(total / mePerPage));
    var page = Math.min(Math.max(1, mePage), totalPages);
    var from = total === 0 ? 0 : (page - 1) * mePerPage + 1;
    var to = Math.min(page * mePerPage, total);

    var html = '';
    html += '<div class="pro-me-page-left">';
    html += '<span class="pro-me-page-info">Showing ' + from + ' - ' + to + ' out of ' + total + '</span>';
    html += '<label class="pro-me-page-show">Show';
    html += '<select class="pro-me-perpage" title="Jumlah baris per halaman" onchange="MyEventPro.setPerPage(this.value)">';
    PER_PAGE_OPTIONS.forEach(function (n) {
      html += '<option value="' + n + '"' + (n === mePerPage ? ' selected' : '') + '>' + n + '</option>';
    });
    html += '</select>';
    html += '</label>';
    html += '</div>';

    html += '<div class="pro-me-page-right">';
    if (totalPages > 1) {
      html += pageBtnHtml(1, '«', 'first', page, totalPages);
      html += pageBtnHtml(page - 1, '‹', 'prev', page, totalPages);
      // window halaman: {1, last, page-1, page, page+1} + ellipsis di celah
      var pages = {};
      [1, totalPages, page - 1, page, page + 1].forEach(function (p) {
        if (p >= 1 && p <= totalPages) pages[p] = true;
      });
      var sorted = Object.keys(pages).map(Number).sort(function (a, b) { return a - b; });
      var prevP = 0;
      sorted.forEach(function (p) {
        if (prevP && p - prevP > 1) html += '<span class="pro-me-page-ellipsis">…</span>';
        html += pageBtnHtml(p, String(p), '', page, totalPages);
        prevP = p;
      });
      html += pageBtnHtml(page + 1, '›', 'next', page, totalPages);
      html += pageBtnHtml(totalPages, '»', 'last', page, totalPages);
    }
    html += '</div>';

    el.innerHTML = html;
  }

  function pageBtnHtml(target, label, mode, page, totalPages) {
    var disabled = (mode === 'first' || mode === 'prev') ? page <= 1 : (mode === 'next' || mode === 'last') ? page >= totalPages : false;
    var active = (!mode && target === page) ? ' active' : '';
    return '<button type="button" class="pro-me-page-btn' + active + '"' + (disabled ? ' disabled' : '') +
      ' onclick="MyEventPro.goToPage(' + target + ')" title="Halaman ' + target + '">' + label + '</button>';
  }

  function goToPage(p) {
    var totalPages = Math.max(1, Math.ceil(meDataset.length / mePerPage));
    var np = Math.min(Math.max(1, parseInt(p, 10) || 1), totalPages);
    if (np === mePage && document.getElementById('myEventPagination')) return;
    mePage = np;
    renderMyEventTablePro(meDataset);
    var wrap = document.querySelector('#myEventView .pro-me-table-wrap');
    if (wrap) wrap.scrollTop = 0;
  }

  function setPerPage(v) {
    var n = parseInt(v, 10);
    if (isNaN(n) || PER_PAGE_OPTIONS.indexOf(n) === -1) return;
    mePerPage = n;
    mePage = 1; // ganti ukuran halaman -> mulai dari halaman 1
    renderMyEventTablePro(meDataset);
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
    mePage = 1; // query baru -> mulai dari halaman 1
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

    // ---- AUTOREFRESH GUARD: pause saat search User ID aktif ----
    var searchEl = document.getElementById('myEventSearch');
    if (searchEl) {
      searchEl.addEventListener('input', function () {
        if (getSearchQuery()) pauseMyEventAutorefresh();
        else resumeMyEventAutorefresh();
      });
    }

    // Wrap switchToMyEvent: masuk view dengan search masih terisi ->
    // jangan jalankan auto-refresh (interval dari fungsi asli langsung dipause)
    if (typeof window.switchToMyEvent === 'function' && !window.__meSwitchWrapped) {
      window.__meSwitchWrapped = true;
      var _origSwitchToMyEvent = window.switchToMyEvent;
      window.switchToMyEvent = function () {
        _origSwitchToMyEvent.apply(this, arguments);
        if (getSearchQuery()) pauseMyEventAutorefresh();
      };
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

    // Create overlay via DOM API (not innerHTML) to avoid quote escaping issues
    var overlay = document.createElement('div');
    overlay.id = 'proMeBuktiOverlay';
    overlay.className = 'pro-me-bukti-overlay';
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeBukti();
    });

    // Modal container
    var modal = document.createElement('div');
    modal.className = 'pro-me-bukti-modal';

    // Header
    var header = document.createElement('div');
    header.className = 'pro-me-bukti-header';
    var titleDiv = document.createElement('div');
    titleDiv.className = 'pro-me-bukti-title';
    titleDiv.innerHTML = '<i class="fas fa-image"></i><span>Bukti Screenshot</span>';
    var closeBtn = document.createElement('button');
    closeBtn.className = 'pro-me-bukti-close';
    closeBtn.title = 'Tutup';
    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
    closeBtn.addEventListener('click', closeBukti);
    header.appendChild(titleDiv);
    header.appendChild(closeBtn);
    modal.appendChild(header);

    // Body
    var body = document.createElement('div');
    body.className = 'pro-me-bukti-body';

    // Link section (top)
    var linkSection = document.createElement('div');
    linkSection.className = 'pro-me-bukti-link-section';
    var linkLabel = document.createElement('label');
    linkLabel.className = 'pro-me-bukti-link-label';
    linkLabel.innerHTML = '<i class="fas fa-link"></i> Link Screenshot';
    var linkRow = document.createElement('div');
    linkRow.className = 'pro-me-bukti-link-row';
    var linkInput = document.createElement('input');
    linkInput.type = 'text';
    linkInput.className = 'pro-me-bukti-link-input';
    linkInput.id = 'proMeBuktiLink';
    linkInput.value = cleanUrl;
    linkInput.readOnly = true;
    var copyBtn = document.createElement('button');
    copyBtn.className = 'pro-me-bukti-link-copy';
    copyBtn.title = 'Copy link';
    copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
    copyBtn.addEventListener('click', copyLink);
    var openLink = document.createElement('a');
    openLink.href = cleanUrl;
    openLink.target = '_blank';
    openLink.className = 'pro-me-bukti-link-open';
    openLink.title = 'Buka di tab baru';
    openLink.innerHTML = '<i class="fas fa-external-link-alt"></i>';
    linkRow.appendChild(linkInput);
    linkRow.appendChild(copyBtn);
    linkRow.appendChild(openLink);
    linkSection.appendChild(linkLabel);
    linkSection.appendChild(linkRow);
    body.appendChild(linkSection);

    // Image section (below)
    var imgSection = document.createElement('div');
    imgSection.className = 'pro-me-bukti-image-section';
    var imgLabel = document.createElement('div');
    imgLabel.className = 'pro-me-bukti-image-label';
    imgLabel.innerHTML = '<i class="fas fa-paperclip"></i> Lampiran Screenshot';
    var imgWrap = document.createElement('div');
    imgWrap.className = 'pro-me-bukti-image-wrap';

    // Create image via DOM API — no innerHTML, no quote escaping issues
    var img = document.createElement('img');
    img.src = cleanUrl;
    img.alt = 'Bukti Screenshot';
    img.className = 'pro-me-bukti-img';
    img.loading = 'lazy';
    img.addEventListener('click', function() { zoomImage(img); });
    img.addEventListener('error', function() {
      // Replace with error state via DOM (no innerHTML string issues)
      imgWrap.innerHTML = '';
      var errDiv = document.createElement('div');
      errDiv.className = 'pro-me-bukti-img-error';
      errDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>Gagal memuat gambar</span>';
      var errLink = document.createElement('a');
      errLink.href = cleanUrl;
      errLink.target = '_blank';
      errLink.className = 'pro-me-bukti-img-error-link';
      errLink.innerHTML = '<i class="fas fa-external-link-alt"></i> Buka link manual';
      errDiv.appendChild(errLink);
      imgWrap.appendChild(errDiv);
    });
    imgWrap.appendChild(img);
    imgSection.appendChild(imgLabel);
    imgSection.appendChild(imgWrap);
    body.appendChild(imgSection);
    modal.appendChild(body);

    // Footer
    var footer = document.createElement('div');
    footer.className = 'pro-me-bukti-footer';
    var footerInfo = document.createElement('span');
    footerInfo.className = 'pro-me-bukti-footer-info';
    footerInfo.innerHTML = '<i class="fas fa-info-circle"></i> Klik gambar untuk zoom';
    var footerBtn = document.createElement('button');
    footerBtn.className = 'pro-me-bukti-footer-btn';
    footerBtn.innerHTML = '<i class="fas fa-check"></i> Tutup';
    footerBtn.addEventListener('click', closeBukti);
    footer.appendChild(footerInfo);
    footer.appendChild(footerBtn);
    modal.appendChild(footer);

    overlay.appendChild(modal);
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
    goToPage: goToPage,
    setPerPage: setPerPage,
    init: init
  };

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
