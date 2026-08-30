export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ============================================
    // 1. ROUTING HALAMAN HTML
    // ============================================
    if (path === '/') return env.ASSETS.fetch(new Request(new URL('/Dashboard.html', request.url), request));
    if (path === '/login' || path === '/Login.html') return env.ASSETS.fetch(new Request(new URL('/Login.html', request.url), request));
    if (path === '/register' || path === '/Register.html') return env.ASSETS.fetch(new Request(new URL('/Register.html', request.url), request));
    if (path === '/authority' || path === '/Authority.html') return env.ASSETS.fetch(new Request(new URL('/Authority.html', request.url), request));
    if (path === '/syair' || path === '/Syair.html') return env.ASSETS.fetch(new Request(new URL('/Syair.html', request.url), request));
    if (path === '/prediksi' || path === '/Prediksi.html') return env.ASSETS.fetch(new Request(new URL('/Prediksi.html', request.url), request));
    if (path === '/validator' || path === '/Validator.html') return env.ASSETS.fetch(new Request(new URL('/Validator.html', request.url), request));
    // ⬇️ BARU: Data Comparison Analyzer
    if (path === '/analyzer' || path === '/Analyzer.html') return env.ASSETS.fetch(new Request(new URL('/Analyzer.html', request.url), request));
    // ⬇️ BARU: PG Soft Calculator
    if (path === '/pgreport' || path === '/PgReport.html') return env.ASSETS.fetch(new Request(new URL('/PgReport.html', request.url), request));

    // ============================================
    // HELPERS
    // ============================================

    // Fungsi helper untuk cek role admin/master dari header
    async function isAdmin(req) {
      const username = req.headers.get('x-auth-token');
      if (!username) return false;
      const user = await env.DB.prepare("SELECT role FROM users WHERE username = ?").bind(username).first();
      return !!(user && (user.role === 'ADMIN' || user.role === 'MASTER'));
    }

    // Fungsi helper: ambil konfigurasi registrasi dari tabel settings
    async function getRegisSetting() {
      const row = await env.DB.prepare("SELECT value FROM settings WHERE key = 'registration'").first();
      return row ? JSON.parse(row.value) : { open: true, defaultRole: 'MEMBER', requireApproval: false };
    }

    const VALID_ROLES = ['MASTER', 'ADMIN', 'OPERATOR', 'CS', 'MEMBER'];
    const VALID_MODULES = ['dashboard', 'authority', 'user_management', 'registration_control'];

    // ============================================
    // 2. API LOGIN
    // ============================================
    if (path === '/api/login' && request.method === 'POST') {
      try {
        const { username, password } = await request.json();
        const { results } = await env.DB.prepare("SELECT * FROM users WHERE username = ? AND password = ?").bind(username, password).all();
        
        if (results.length > 0) {
          const user = results[0];
          // Tolak akun yang masih menunggu persetujuan admin
          if (user.status === 'PENDING') {
            return Response.json({ success: false, error: 'Akun Anda menunggu persetujuan admin!' }, { status: 403 });
          }
          return Response.json({ success: true, message: 'Login berhasil!', user: { username: user.username, role: user.role } });
        } else {
          return Response.json({ success: false, error: 'Username atau Password salah!' });
        }
      } catch (err) {
        return Response.json({ success: false, error: 'Server Error: ' + err.message }, { status: 500 });
      }
    }

    // ============================================
    // 3. API GET USERS (Hanya Admin) + status & access untuk Authority Panel
    // ============================================
    if (path === '/api/users' && request.method === 'GET') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const { results } = await env.DB.prepare("SELECT username, role, status, access FROM users").all();
        const users = results.map(u => ({
          username: u.username,
          role: u.role,
          status: u.status,
          access: u.access ? JSON.parse(u.access) : null
        }));
        return Response.json(users);
      } catch (err) {
        return Response.json({ error: 'Gagal mengambil data' }, { status: 500 });
      }
    }

    // ============================================
    // 4. API ADD USER (Hanya Admin)
    // ============================================
    if (path === '/api/users' && request.method === 'POST') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const { username, password, role } = await request.json();
        if (!username || !password || !role) return Response.json({ error: 'Data tidak lengkap' }, { status: 400 });
        
        const access = JSON.stringify({ dashboard: true, authority: false, user_management: false, registration_control: false });
        await env.DB.prepare("INSERT INTO users (username, password, role, status, access) VALUES (?, ?, ?, 'ACTIVE', ?)").bind(username, password, role, access).run();
        return Response.json({ success: true, message: 'User berhasil ditambahkan' });
      } catch (err) {
        return Response.json({ error: 'Username sudah ada atau format salah' }, { status: 500 });
      }
    }

    // ============================================
    // 5. API DELETE USER (Hanya Admin) — proteksi diri sendiri & MASTER
    // ============================================
    if (path.startsWith('/api/users/') && !path.endsWith('/access') && request.method === 'DELETE') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const usernameToDelete = decodeURIComponent(path.split('/').pop());
        
        // Keamanan: Jangan biarkan admin menghapus dirinya sendiri
        const reqUser = request.headers.get('x-auth-token');
        if (reqUser === usernameToDelete) return Response.json({ error: 'Anda tidak bisa menghapus akun sendiri!' }, { status: 400 });

        // Keamanan: Akun MASTER tidak boleh dihapus
        const target = await env.DB.prepare("SELECT role FROM users WHERE username = ?").bind(usernameToDelete).first();
        if (target && target.role === 'MASTER') return Response.json({ error: 'Akun MASTER tidak dapat dihapus!' }, { status: 403 });

        await env.DB.prepare("DELETE FROM users WHERE username = ?").bind(usernameToDelete).run();
        return Response.json({ success: true, message: 'User berhasil dihapus' });
      } catch (err) {
        return Response.json({ error: 'Gagal menghapus user' }, { status: 500 });
      }
    }

    // ============================================
    // 6. API PUBLIC: STATUS REGISTRASI (dipakai Login.html, tanpa token)
    // ============================================
    if (path === '/api/settings/registration/public' && request.method === 'GET') {
      const setting = await getRegisSetting();
      return Response.json({ open: setting.open });
    }

    // ============================================
    // 7. API GET KONFIGURASI REGISTRASI (Hanya Admin)
    // ============================================
    if (path === '/api/settings/registration' && request.method === 'GET') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      return Response.json(await getRegisSetting());
    }

    // ============================================
    // 8. API SIMPAN KONFIGURASI REGISTRASI (Hanya Admin)
    // ============================================
    if (path === '/api/settings/registration' && request.method === 'PUT') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const body = await request.json();
        const setting = {
          open: !!body.open,
          defaultRole: ['MEMBER', 'CS', 'OPERATOR'].includes(body.defaultRole) ? body.defaultRole : 'MEMBER',
          requireApproval: !!body.requireApproval
        };
        await env.DB.prepare("UPDATE settings SET value = ? WHERE key = 'registration'").bind(JSON.stringify(setting)).run();
        return Response.json({ success: true, message: 'Konfigurasi registrasi tersimpan' });
      } catch (err) {
        return Response.json({ error: 'Gagal menyimpan konfigurasi' }, { status: 500 });
      }
    }

    // ============================================
    // 9. API EDIT ACCESS CONTROL USER (Hanya Admin/Master)
    // ============================================
    const accessMatch = path.match(/^\/api\/users\/([^/]+)\/access$/);
    if (accessMatch && request.method === 'PUT') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const username = decodeURIComponent(accessMatch[1]);
        const body = await request.json();

        const user = await env.DB.prepare("SELECT role FROM users WHERE username = ?").bind(username).first();
        if (!user) return Response.json({ error: 'User tidak ditemukan' }, { status: 404 });
        if (user.role === 'MASTER') return Response.json({ error: 'Akun MASTER tidak dapat diubah!' }, { status: 403 });

        const newRole = VALID_ROLES.includes(body.role) ? body.role : user.role;
        const access = {};
        VALID_MODULES.forEach(m => access[m] = !!(body.access && body.access[m]));
        const grantedBy = request.headers.get('x-auth-token');

        await env.DB.prepare("UPDATE users SET role = ?, access = ?, granted_by = ? WHERE username = ?")
          .bind(newRole, JSON.stringify(access), grantedBy, username).run();
        return Response.json({ success: true, message: 'Access control diperbarui oleh ' + grantedBy });
      } catch (err) {
        return Response.json({ error: 'Gagal menyimpan akses: ' + err.message }, { status: 500 });
      }
    }

    // ============================================
    // 10. API DAFTAR REGISTRASI PENDING (Hanya Admin)
    // ============================================
    if (path === '/api/registrations/pending' && request.method === 'GET') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const { results } = await env.DB.prepare("SELECT username, role, status FROM users WHERE status = 'PENDING'").all();
        return Response.json(results);
      } catch (err) {
        return Response.json({ error: 'Gagal mengambil data' }, { status: 500 });
      }
    }

    // ============================================
    // 11. API APPROVE / REJECT REGISTRASI (Hanya Admin)
    // ============================================
    const regisMatch = path.match(/^\/api\/registrations\/([^/]+)$/);
    if (regisMatch && request.method === 'PUT') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const username = decodeURIComponent(regisMatch[1]);
        const body = await request.json();

        if (body.action === 'approve') {
          await env.DB.prepare("UPDATE users SET status = 'ACTIVE' WHERE username = ? AND status = 'PENDING'").bind(username).run();
          return Response.json({ success: true, message: 'Registrasi disetujui' });
        } else if (body.action === 'reject') {
          await env.DB.prepare("DELETE FROM users WHERE username = ? AND status = 'PENDING'").bind(username).run();
          return Response.json({ success: true, message: 'Registrasi ditolak' });
        }
        return Response.json({ error: 'Action tidak valid' }, { status: 400 });
      } catch (err) {
        return Response.json({ error: 'Gagal memproses: ' + err.message }, { status: 500 });
      }
    }

    // ============================================
    // 12. API REGISTER (Publik — otomatis dicek status buka/tutup)
    // ============================================
    if (path === '/api/register' && request.method === 'POST') {
      try {
        const setting = await getRegisSetting();
        if (!setting.open) return Response.json({ error: 'Pendaftaran sedang ditutup!' }, { status: 403 });

        const body = await request.json();
        if (!body.username || !body.password) return Response.json({ error: 'Username & password wajib diisi' }, { status: 400 });

        const exists = await env.DB.prepare("SELECT id FROM users WHERE username = ?").bind(body.username).first();
        if (exists) return Response.json({ error: 'Username sudah terdaftar!' }, { status: 409 });

        const access = JSON.stringify({ dashboard: true, authority: false, user_management: false, registration_control: false });
        const status = setting.requireApproval ? 'PENDING' : 'ACTIVE';

        await env.DB.prepare("INSERT INTO users (username, password, role, status, access) VALUES (?, ?, ?, ?, ?)")
          .bind(body.username, body.password, setting.defaultRole, status, access).run();

        return Response.json({ success: true, pending: setting.requireApproval });
      } catch (err) {
        return Response.json({ error: 'Gagal mendaftar: ' + err.message }, { status: 500 });
      }
    }

    // ============================================
    // 13. API PENCAIRAN / SALDO KAS (Hanya Admin) — BARU
    // ============================================

    // 13a. GET: ambil data per tanggal (dipakai tombol CEK SALDO di Dashboard)
    if (path === '/api/pencairan' && request.method === 'GET') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const date = url.searchParams.get('date') || new Date().toISOString().slice(0, 10);
        const { results } = await env.DB.prepare(
          "SELECT * FROM pencairan WHERE date = ? ORDER BY id ASC"
        ).bind(date).all();

        const rows = (results || []).map(r => ({
          id: r.id,
          sheet: r.sheet,
          nama: r.nama,
          rek: r.rek,
          saldoN9: r.saldo_n9,
          pending: r.pending,
          saldoAsli: r.saldo_asli,
          cair: r.cair,
          status: r.status,
          ket: r.ket
        }));

        // Hitung totals server-side
        const totals = rows.reduce((acc, r) => ({
          totalN9: acc.totalN9 + r.saldoN9,
          totalPending: acc.totalPending + r.pending,
          totalAsli: acc.totalAsli + r.saldoAsli,
          totalCair: acc.totalCair + r.cair,
          belumProses: acc.belumProses + (r.status !== 'OK' ? r.cair : 0)
        }), { totalN9: 0, totalPending: 0, totalAsli: 0, totalCair: 0, belumProses: 0 });

        return Response.json({ date: date, rows: rows, totals: totals, count: rows.length });
      } catch (err) {
        return Response.json({ error: 'Gagal mengambil data: ' + err.message }, { status: 500 });
      }
    }

    // 13b. POST: tambah data (1 baris atau array massal)
    if (path === '/api/pencairan' && request.method === 'POST') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const body = await request.json();
        const items = Array.isArray(body) ? body : [body];
        const createdBy = request.headers.get('x-auth-token');
        let inserted = 0;

        for (const item of items) {
          if (!item.date) continue;
          await env.DB.prepare(
            "INSERT INTO pencairan (date, sheet, nama, rek, saldo_n9, pending, saldo_asli, cair, status, ket, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
          ).bind(
            item.date,
            item.sheet || '',
            item.nama || '',
            item.rek || '',
            parseInt(item.saldoN9) || 0,
            parseInt(item.pending) || 0,
            parseInt(item.saldoAsli) || 0,
            parseInt(item.cair) || 0,
            item.status || 'PENDING',
            item.ket || '',
            createdBy,
            Date.now()
          ).run();
          inserted++;
        }

        return Response.json({ success: true, inserted: inserted, message: inserted + ' baris berhasil ditambahkan' });
      } catch (err) {
        return Response.json({ error: 'Gagal menambah data: ' + err.message }, { status: 500 });
      }
    }

    // 13c. PUT: update baris pencairan by id (ubah status, nominal, dll)
    const cairMatch = path.match(/^\/api\/pencairan\/(\d+)$/);
    if (cairMatch && request.method === 'PUT') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const id = cairMatch[1];
        const body = await request.json();

        const existing = await env.DB.prepare("SELECT * FROM pencairan WHERE id = ?").bind(id).first();
        if (!existing) return Response.json({ error: 'Data tidak ditemukan' }, { status: 404 });

        await env.DB.prepare(
          "UPDATE pencairan SET sheet = ?, nama = ?, rek = ?, saldo_n9 = ?, pending = ?, saldo_asli = ?, cair = ?, status = ?, ket = ? WHERE id = ?"
        ).bind(
          body.sheet !== undefined ? body.sheet : existing.sheet,
          body.nama !== undefined ? body.nama : existing.nama,
          body.rek !== undefined ? body.rek : existing.rek,
          body.saldoN9 !== undefined ? parseInt(body.saldoN9) || 0 : existing.saldo_n9,
          body.pending !== undefined ? parseInt(body.pending) || 0 : existing.pending,
          body.saldoAsli !== undefined ? parseInt(body.saldoAsli) || 0 : existing.saldo_asli,
          body.cair !== undefined ? parseInt(body.cair) || 0 : existing.cair,
          body.status !== undefined ? body.status : existing.status,
          body.ket !== undefined ? body.ket : existing.ket,
          id
        ).run();

        return Response.json({ success: true, message: 'Data pencairan diperbarui' });
      } catch (err) {
        return Response.json({ error: 'Gagal update: ' + err.message }, { status: 500 });
      }
    }

    // 13d. DELETE: hapus baris pencairan by id
    if (cairMatch && request.method === 'DELETE') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        await env.DB.prepare("DELETE FROM pencairan WHERE id = ?").bind(cairMatch[1]).run();
        return Response.json({ success: true, message: 'Data pencairan dihapus' });
      } catch (err) {
        return Response.json({ error: 'Gagal menghapus: ' + err.message }, { status: 500 });
      }
    }

    // ============================================
    // FALLBACK: serve static assets
    // ============================================
    return env.ASSETS.fetch(request);
  },
};
