/* ============================================================
   AURA.OS // PASARAN-PRO.JS v1.1.0
   Modul Jadwal Pasaran (Pro) — grid kartu pasaran terstruktur.
   Sumber data: SQLite D1 via GET /api/pasaran (fallback lokal).
   Fitur: edit jadwal/tutup/result/link per kartu (saja — fungsi
   COPY pindah ke modul Pk Jadwal Pasaran / pkpasaran-pro.js),
   tampilkan 1-10 / 1-25 / Semua.
   UI dirender penuh ke #pasaranView. Exposed: window.PasaranPro.
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     STATE & KONSTANTA
     ============================================================ */
  var LKEY = 'aura_pasaran_local_v1';

  var ICON_CLOCK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
  var ICON_PLUS =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
  var ICON_EDIT =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
  var ICON_SEARCH =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
  var ICON_EXT =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>';
  var ICON_REFRESH =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>';
  var ICON_TRASH =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';

  var state = {
    items: [],
    view: 'all',          // 'all' | '10' | '25'
    source: null,         // 'db' | 'local'
    loading: false,
    loaded: false,
    justId: null,
    modalMode: 'edit',    // 'edit' | 'add'
    editId: null,
    saving: false,
    armDel: false,
    armTimer: null
  };

  /* ============================================================
     HELPERS
     ============================================================ */
  function q(sel, ctx) { return (ctx || document).querySelector(sel); }
  function container() { return document.getElementById('pasaranView'); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  function toast(msg, type) {
    if (typeof window.showToast === 'function') window.showToast(msg, type);
  }

  function token() {
    return localStorage.getItem('aura_auth_token') || '';
  }

  /* "13:00 WIB" -> "13:00:00 WIB" (lengkapi detik bila belum ada) */
  function normTime(s) {
    return String(s == null ? '' : s).replace(/\b(\d{1,2}:\d{2})(:\d{2})?\b/g, function (m, hm, ss) {
      return ss ? hm + ss : hm + ':00';
    });
  }

  function fmtUpdated(ms) {
    if (!ms) return '';
    var d = new Date(ms);
    var B = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return d.getDate() + ' ' + B[d.getMonth()] + ' ' + d.getFullYear() + ' | ' +
      ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }

  function sorted() {
    return state.items.slice().sort(function (a, b) { return (a.no || 0) - (b.no || 0); });
  }

  function byId(id) {
    for (var i = 0; i < state.items.length; i++) if (String(state.items[i].id) === String(id)) return state.items[i];
    return null;
  }

  /* ============================================================
     DATA — API D1 dulu, gagal -> localStorage (mode lokal)
     ============================================================ */
  function fetchList(force) {
    state.loading = true;
    paintLoading();
    fetch('/api/pasaran', { headers: { 'x-auth-token': token() } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) {
        state.loading = false;
        if (j && j.success && Array.isArray(j.pasaran)) {
          state.items = j.pasaran;
          state.source = 'db';
          state.loaded = true;
          paint();
        } else throw new Error('bad payload');
      })
      .catch(function () {
        state.loading = false;
        state.source = 'local';
        state.loaded = true;
        try {
          var raw = localStorage.getItem(LKEY);
          var arr = raw ? JSON.parse(raw) : [];
          state.items = Array.isArray(arr) ? arr : [];
        } catch (e) { state.items = []; }
        paint();
        if (force) toast('Database tidak terjangkau — mode lokal', 'warning');
      });
  }

  function saveLocal() {
    try { localStorage.setItem(LKEY, JSON.stringify(state.items)); } catch (e) {}
  }

  /* ============================================================
     MARKUP (dibangun sekali)
     ============================================================ */
  function build() {
    var v = container();
    if (!v || v.dataset.built === '1') return;

    v.innerHTML =
      '<div class="ps-card">' +
        '<div class="ps-topline"></div>' +
        '<div class="ps-head">' +
          '<div class="ps-head-left">' +
            '<div class="ps-icon">' + ICON_CLOCK + '</div>' +
            '<div style="min-width:0;">' +
              '<h2 class="ps-title">Jadwal Pasaran</h2>' +
              '<p class="ps-sub">Jadwal, jam tutup &amp; result semua pasaran &mdash; tersimpan di database.</p>' +
            '</div>' +
          '</div>' +
          '<div class="ps-head-btns">' +
            '<button type="button" class="ps-btn ps-btn-primary" data-action="add">' + ICON_PLUS + 'Tambah Pasaran</button>' +
          '</div>' +
        '</div>' +
        '<div class="ps-stats">' +
          '<div class="ps-stat"><div class="ps-stat-k">Total Pasaran</div><div class="ps-stat-v" data-ps="total">0</div><div class="ps-stat-s">terdaftar di database</div></div>' +
          '<div class="ps-stat"><div class="ps-stat-k">Ditampilkan</div><div class="ps-stat-v" data-ps="shown">0</div><div class="ps-stat-s">sesuai filter aktif</div></div>' +
          '<div class="ps-stat"><div class="ps-stat-k">Terakhir Diubah</div><div class="ps-stat-v ps-v-sm" data-ps="last">&mdash;</div><div class="ps-stat-s">perubahan terbaru</div></div>' +
        '</div>' +
        '<div class="ps-toolbar">' +
          '<div class="ps-search">' + ICON_SEARCH +
            '<input data-ps="search" type="text" placeholder="Cari nama pasaran&hellip;" autocomplete="off">' +
          '</div>' +
          '<span class="ps-src" data-ps="src"><span class="ps-src-dot"></span><span data-ps="src-t">&mdash;</span></span>' +
          '<button type="button" class="ps-btn" data-action="refresh" title="Muat ulang dari database">' + ICON_REFRESH + 'Muat Ulang</button>' +
        '</div>' +
        '<div data-ps="content"></div>' +
        '<div class="ps-show">' +
          '<span class="ps-show-k">Tampilkan Pasaran</span>' +
          '<div class="ps-segs">' +
            '<button type="button" class="ps-seg" data-action="seg" data-range="10">1&ndash;10</button>' +
            '<button type="button" class="ps-seg" data-action="seg" data-range="25">1&ndash;25</button>' +
            '<button type="button" class="ps-seg" data-action="seg" data-range="all">Semua</button>' +
          '</div>' +
          '<span class="ps-count" data-ps="count"></span>' +
        '</div>' +
      '</div>' +
      '<div class="ps-modal" data-ps="modal">' +
        '<div class="ps-mbox">' +
          '<div class="ps-mtop"></div>' +
          '<h3 class="ps-mtitle" data-ps="mtitle">Edit Pasaran</h3>' +
          '<p class="ps-msub" data-ps="msub"></p>' +
          '<span class="ps-mnum" data-ps="mnum" style="display:none;"></span>' +
          '<div class="ps-field">' +
            '<label class="ps-label" for="psInNama">Nama Pasaran</label>' +
            '<input class="ps-input" id="psInNama" type="text" placeholder="contoh: TOTOMACAU SIANG" autocomplete="off">' +
          '</div>' +
          '<div class="ps-field ps-field-2">' +
            '<div>' +
              '<label class="ps-label" for="psInJadwal">Jadwal</label>' +
              '<input class="ps-input" id="psInJadwal" type="text" placeholder="SETIAP HARI" autocomplete="off">' +
            '</div>' +
            '<div>' +
              '<label class="ps-label" for="psInTutup">Jam Tutup</label>' +
              '<input class="ps-input" id="psInTutup" type="text" placeholder="13:00 WIB" autocomplete="off">' +
            '</div>' +
          '</div>' +
          '<div class="ps-field ps-field-2">' +
            '<div>' +
              '<label class="ps-label" for="psInResult">Jam Result</label>' +
              '<input class="ps-input" id="psInResult" type="text" placeholder="13:15 WIB" autocomplete="off">' +
            '</div>' +
            '<div>' +
              '<label class="ps-label" for="psInLink">Link Website</label>' +
              '<input class="ps-input" id="psInLink" type="text" placeholder="https://&hellip;" autocomplete="off">' +
            '</div>' +
          '</div>' +
          '<div class="ps-mfoot">' +
            '<button type="button" class="ps-btn ps-btn-danger" data-action="del" data-ps="mdel" style="display:none;">' + ICON_TRASH + 'Hapus Pasaran</button>' +
            '<div class="ps-mfoot-right">' +
              '<button type="button" class="ps-btn" data-action="close">Batal</button>' +
              '<button type="button" class="ps-btn ps-btn-primary" data-action="save">Simpan</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    v.dataset.built = '1';

    /* Event delegation sekali pada container */
    v.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('[data-action]') : null;
      if (!t || !v.contains(t)) return;
      var act = t.getAttribute('data-action');
      if (act === 'add') openModal('add');
      else if (act === 'edit') openModal('edit', t.getAttribute('data-id'));
      else if (act === 'seg') { state.view = t.getAttribute('data-range') || 'all'; paint(); }
      else if (act === 'close') closeModal();
      else if (act === 'save') save();
      else if (act === 'del') delCurrent();
      else if (act === 'refresh') fetchList(true);
    });

    var modal = q('[data-ps="modal"]', v);
    if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

    var search = q('[data-ps="search"]', v);
    if (search) search.addEventListener('input', function () { paint(); });
  }

  /* ============================================================
     PAINT
     ============================================================ */
  function paintLoading() {
    var v = container();
    if (!v) return;
    var c = q('[data-ps="content"]', v);
    if (c) c.innerHTML = '<div class="ps-loading"><span class="ps-spin"></span>Memuat data pasaran dari database&hellip;</div>';
  }

  function visibleItems() {
    var term = (searchTerm() || '').toLowerCase();
    var arr;
    if (term) {
      arr = sorted().filter(function (it) {
        return String(it.nama || '').toLowerCase().indexOf(term) !== -1;
      });
      return arr;
    }
    arr = sorted();
    if (state.view === '10') return arr.slice(0, 10);
    if (state.view === '25') return arr.slice(0, 25);
    return arr;
  }

  function searchTerm() {
    var v = container();
    var s = v && q('[data-ps="search"]', v);
    return s ? s.value.trim() : '';
  }

  function paint() {
    build();
    var v = container();
    if (!v) return;

    var total = state.items.length;
    var vis = visibleItems();

    /* Statistik */
    var elT = q('[data-ps="total"]', v); if (elT) elT.textContent = total;
    var elS = q('[data-ps="shown"]', v);
    if (elS) elS.innerHTML = vis.length + '<span class="ps-unit">/' + total + '</span>';
    var elL = q('[data-ps="last"]', v);
    if (elL) {
      var last = null;
      state.items.forEach(function (it) { if (it.updated_at && (!last || it.updated_at > last.updated_at)) last = it; });
      elL.textContent = last ? (last.nama + ' \u2014 ' + fmtUpdated(last.updated_at)) : '\u2014';
    }

    /* Sumber data */
    var src = q('[data-ps="src"]', v);
    var srcT = q('[data-ps="src-t"]', v);
    if (src && srcT) {
      if (state.source === 'db') { src.classList.remove('local'); srcT.textContent = 'SQLITE \u2022 D1'; }
      else { src.classList.add('local'); srcT.textContent = 'MODE LOKAL'; }
    }

    /* Segmented show */
    var segs = v.querySelectorAll('.ps-seg');
    for (var i = 0; i < segs.length; i++) {
      var r = segs[i].getAttribute('data-range');
      if (r === state.view) segs[i].classList.add('active');
      else segs[i].classList.remove('active');
    }

    /* Counter */
    var elC = q('[data-ps="count"]', v);
    if (elC) {
      elC.innerHTML = searchTerm()
        ? 'Hasil pencarian: <b>' + vis.length + '</b> pasaran'
        : 'Menampilkan <b>' + vis.length + '</b> dari <b>' + total + '</b> pasaran';
    }

    /* Grid */
    var c = q('[data-ps="content"]', v);
    if (!c) return;

    if (!total) {
      c.innerHTML = '<div class="ps-empty">' +
        (state.source === 'local'
          ? 'Database tidak terjangkau dan belum ada data lokal.<br>Klik <b>Tambah Pasaran</b> untuk mengisi manual, atau <b>Muat Ulang</b> setelah backend aktif.'
          : 'Belum ada pasaran &mdash; klik <b>Tambah Pasaran</b> untuk menambahkan yang pertama.') +
        '</div>';
      return;
    }
    if (!vis.length) {
      c.innerHTML = '<div class="ps-empty">Tidak ada pasaran yang cocok dengan pencarian saat ini.</div>';
      return;
    }

    c.innerHTML = '<div class="ps-grid">' + vis.map(function (it) {
      var upd = it.updated_at ? '<span class="ps-upd">DIEDIT ' + esc(fmtUpdated(it.updated_at)) + '</span>' : '';
      var link = String(it.link || '').trim();
      return '<article class="ps-item' + (String(it.id) === String(state.justId) ? ' ps-new' : '') + '">' +
        '<div class="ps-item-top">' +
          '<span class="ps-num">' + esc(it.no) + '</span>' +
          '<h3 class="ps-name" title="' + esc(it.nama) + '">' + esc(it.nama) + '</h3>' +
          '<div class="ps-acts">' +
            '<button type="button" class="ps-act" data-action="edit" data-id="' + esc(it.id) + '" title="Edit pasaran">' + ICON_EDIT + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="ps-rows">' +
          '<div class="ps-row"><span class="ps-k">Jadwal</span><span class="ps-v">' + (esc(it.jadwal) || '&mdash;') + '</span></div>' +
          '<div class="ps-row ps-row-hl"><span class="ps-k">Tutup</span><span class="ps-v">' + (esc(normTime(it.tutup)) || '&mdash;') + '</span></div>' +
          '<div class="ps-row"><span class="ps-k">Result</span><span class="ps-v">' + (esc(normTime(it.result)) || '&mdash;') + '</span></div>' +
        '</div>' +
        '<div class="ps-item-foot">' +
          '<a class="ps-visit" href="' + esc(link || '#') + '" target="_blank" rel="noopener noreferrer">Kunjungi Website ' + ICON_EXT + '</a>' +
          upd +
        '</div>' +
      '</article>';
    }).join('') + '</div>';

    state.justId = null;
  }

  /* ============================================================
     MODAL — edit / tambah
     ============================================================ */
  function openModal(mode, id) {
    build();
    var v = container();
    var modal = q('[data-ps="modal"]', v);
    if (!modal) return;

    state.modalMode = mode;
    state.editId = mode === 'edit' ? id : null;
    state.armDel = false;

    var it = mode === 'edit' ? byId(id) : null;
    if (mode === 'edit' && !it) { toast('Pasaran tidak ditemukan', 'warning'); return; }

    var mtitle = q('[data-ps="mtitle"]', v);
    var msub = q('[data-ps="msub"]', v);
    var mnum = q('[data-ps="mnum"]', v);
    var mdel = q('[data-ps="mdel"]', v);

    if (mode === 'edit') {
      mtitle.textContent = 'Edit Pasaran';
      msub.textContent = 'Ubah jadwal, jam tutup, jam result, atau link website.';
      mnum.style.display = 'inline-flex';
      mnum.innerHTML = 'NO. ' + esc(it.no) + ' \u2022 ID ' + esc(it.id);
      mdel.style.display = 'inline-flex';
      mdel.innerHTML = ICON_TRASH + 'Hapus Pasaran';
      q('#psInNama', v).value = it.nama || '';
      q('#psInJadwal', v).value = it.jadwal || '';
      q('#psInTutup', v).value = it.tutup || '';
      q('#psInResult', v).value = it.result || '';
      q('#psInLink', v).value = it.link || '';
    } else {
      mtitle.textContent = 'Tambah Pasaran';
      msub.textContent = 'Pasaran baru otomatis mendapat nomor urut berikutnya.';
      mnum.style.display = 'none';
      mdel.style.display = 'none';
      q('#psInNama', v).value = '';
      q('#psInJadwal', v).value = 'SETIAP HARI';
      q('#psInTutup', v).value = '';
      q('#psInResult', v).value = '';
      q('#psInLink', v).value = '';
    }

    modal.classList.add('open');
    setTimeout(function () { var f = q('#psInNama', v); if (f) f.focus(); }, 60);
  }

  function closeModal() {
    var v = container();
    var modal = v && q('[data-ps="modal"]', v);
    if (modal) modal.classList.remove('open');
    state.armDel = false;
    if (state.armTimer) { clearTimeout(state.armTimer); state.armTimer = null; }
  }

  function readForm() {
    var v = container();
    return {
      nama: q('#psInNama', v).value.trim().toUpperCase(),
      jadwal: q('#psInJadwal', v).value.trim() || 'SETIAP HARI',
      tutup: q('#psInTutup', v).value.trim(),
      result: q('#psInResult', v).value.trim(),
      link: q('#psInLink', v).value.trim()
    };
  }

  function save() {
    if (state.saving) return;
    var v = container();
    var data = readForm();
    if (!data.nama) { toast('Nama pasaran wajib diisi', 'warning'); q('#psInNama', v).focus(); return; }

    if (state.source === 'local') {
      if (state.modalMode === 'edit') {
        var it = byId(state.editId);
        if (!it) { toast('Pasaran tidak ditemukan', 'warning'); return; }
        Object.keys(data).forEach(function (k) { it[k] = data[k]; });
        it.updated_at = Date.now();
        it.updated_by = 'lokal';
        state.justId = it.id;
      } else {
        var no = state.items.reduce(function (m, x) { return Math.max(m, x.no || 0); }, 0) + 1;
        var nu = { id: 'p' + Date.now().toString(36) + Math.random().toString(16).slice(2, 6), no: no, nama: data.nama, jadwal: data.jadwal, tutup: data.tutup, result: data.result, link: data.link, updated_at: Date.now(), updated_by: 'lokal' };
        state.items.push(nu);
        state.justId = nu.id;
      }
      saveLocal();
      closeModal();
      paint();
      toast('Pasaran "' + data.nama + '" tersimpan (lokal)', 'success');
      return;
    }

    state.saving = true;
    var url = state.modalMode === 'edit' ? ('/api/pasaran/' + encodeURIComponent(state.editId)) : '/api/pasaran';
    var method = state.modalMode === 'edit' ? 'PUT' : 'POST';
    fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json', 'x-auth-token': token() },
      body: JSON.stringify(data)
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        state.saving = false;
        if (!res.ok || !res.j.success) throw new Error(res.j.error || 'Gagal menyimpan');
        var row = res.j.pasaran;
        var it = byId(row.id);
        if (it) Object.keys(row).forEach(function (k) { it[k] = row[k]; });
        else state.items.push(row);
        state.justId = row.id;
        closeModal();
        paint();
        toast(res.j.message || 'Pasaran tersimpan', 'success');
      })
      .catch(function (e) {
        state.saving = false;
        toast(e.message || 'Gagal menyimpan pasaran', 'error');
      });
  }

  /* ============================================================
     HAPUS (2-klik, hanya di modal edit)
     ============================================================ */
  function delCurrent() {
    if (state.modalMode !== 'edit' || !state.editId) return;
    var v = container();
    var mdel = q('[data-ps="mdel"]', v);

    if (!state.armDel) {
      state.armDel = true;
      if (mdel) { mdel.classList.add('arm'); mdel.innerHTML = ICON_TRASH + 'Yakin? Hapus'; }
      if (state.armTimer) clearTimeout(state.armTimer);
      state.armTimer = setTimeout(function () {
        state.armDel = false;
        if (mdel) { mdel.classList.remove('arm'); mdel.innerHTML = ICON_TRASH + 'Hapus Pasaran'; }
      }, 3000);
      return;
    }
    if (state.armTimer) { clearTimeout(state.armTimer); state.armTimer = null; }
    state.armDel = false;

    var id = state.editId;
    var it = byId(id);
    if (state.source === 'local') {
      state.items = state.items.filter(function (x) { return String(x.id) !== String(id); });
      saveLocal();
      closeModal();
      paint();
      toast('Pasaran ' + (it ? '"' + it.nama + '" ' : '') + 'dihapus', 'success');
      return;
    }
    fetch('/api/pasaran/' + encodeURIComponent(id), {
      method: 'DELETE',
      headers: { 'x-auth-token': token() }
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok || !res.j.success) throw new Error(res.j.error || 'Gagal menghapus');
        state.items = state.items.filter(function (x) { return String(x.id) !== String(id); });
        closeModal();
        paint();
        toast('Pasaran ' + (it ? '"' + it.nama + '" ' : '') + 'dihapus', 'success');
      })
      .catch(function (e) { toast(e.message || 'Gagal menghapus pasaran', 'error'); });
  }

  /* Escape menutup modal */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  /* ============================================================
     EXPOSE
     ============================================================ */
  window.PasaranPro = {
    render: function () { build(); if (!state.loaded && !state.loading) fetchList(); else paint(); },
    refresh: function () { fetchList(true); },
    openAdd: function () { openModal('add'); },
    state: state
  };
})();
