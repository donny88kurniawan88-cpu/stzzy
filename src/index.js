export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Routing Halaman HTML
    if (url.pathname === '/') return env.ASSETS.fetch(new Request(new URL('/Dashboard.html', request.url), request));
    if (url.pathname === '/login' || url.pathname === '/Login.html') return env.ASSETS.fetch(new Request(new URL('/Login.html', request.url), request));
    if (url.pathname === '/authority' || url.pathname === '/Authority.html') return env.ASSETS.fetch(new Request(new URL('/Authority.html', request.url), request));
    if (url.pathname === '/syair' || url.pathname === '/Syair.html') return env.ASSETS.fetch(new Request(new URL('/Syair.html', request.url), request));
    if (url.pathname === '/prediksi' || url.pathname === '/Prediksi.html') return env.ASSETS.fetch(new Request(new URL('/Prediksi.html', request.url), request));
    if (url.pathname === '/validator' || url.pathname === '/Validator.html') return env.ASSETS.fetch(new Request(new URL('/Validator.html', request.url), request));

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

    // 2. API LOGIN
    if (url.pathname === '/api/login' && request.method === 'POST') {
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

    // 3. API GET USERS (Hanya Admin) + status & access untuk Authority Panel
    if (url.pathname === '/api/users' && request.method === 'GET') {
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

    // 4. API ADD USER (Hanya Admin)
    if (url.pathname === '/api/users' && request.method === 'POST') {
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

    // 5. API DELETE USER (Hanya Admin)
    if (url.pathname.startsWith('/api/users/') && request.method === 'DELETE') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const usernameToDelete = decodeURIComponent(url.pathname.split('/').pop());
        
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

    // 6. API PUBLIC: STATUS REGISTRASI (dipakai Login.html, tanpa token)
    if (url.pathname === '/api/settings/registration/public' && request.method === 'GET') {
      const setting = await getRegisSetting();
      return Response.json({ open: setting.open });
    }

    // 7. API GET KONFIGURASI REGISTRASI (Hanya Admin)
    if (url.pathname === '/api/settings/registration' && request.method === 'GET') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      return Response.json(await getRegisSetting());
    }

    // 8. API SIMPAN KONFIGURASI REGISTRASI (Hanya Admin)
    if (url.pathname === '/api/settings/registration' && request.method === 'PUT') {
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

    // 9. API EDIT ACCESS CONTROL USER (Hanya Admin/Master)
    const accessMatch = url.pathname.match(/^\/api\/users\/([^/]+)\/access$/);
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

    // 10. API DAFTAR REGISTRASI PENDING (Hanya Admin)
    if (url.pathname === '/api/registrations/pending' && request.method === 'GET') {
      if (!await isAdmin(request)) return Response.json({ error: 'Akses Ditolak! Hanya Admin.' }, { status: 403 });
      try {
        const { results } = await env.DB.prepare("SELECT username, role, status FROM users WHERE status = 'PENDING'").all();
        return Response.json(results);
      } catch (err) {
        return Response.json({ error: 'Gagal mengambil data' }, { status: 500 });
      }
    }

    // 11. API APPROVE / REJECT REGISTRASI (Hanya Admin)
    const regisMatch = url.pathname.match(/^\/api\/registrations\/([^/]+)$/);
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

    // 12. API REGISTER (Publik — otomatis dicek statusbuka/tutup)
    if (url.pathname === '/api/register' && request.method === 'POST') {
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

    return env.ASSETS.fetch(request);
  },
};
