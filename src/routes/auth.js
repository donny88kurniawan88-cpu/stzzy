/* ================================================================
   AURA.OS — AUTH BACKEND (Cloudflare Workers + KV)
   ================================================================ */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/* ===== HELPERS ===== */

/* Hash SHA-256 */
async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/* Generate random hex string */
function randomHex(len) {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

/* Generate session token */
function generateToken() {
  return 'aura_' + randomHex(32);
}

/* Hash password with salt */
async function hashPassword(password, salt) {
  return await sha256(salt + ':' + password + ':aura_os');
}

/* JSON response helper */
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

/* Verify token from Authorization header, returns email or null */
async function verifyToken(request, KV) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.replace('Bearer ', '');
  const email = await KV.get('session:' + token);
  return email || null;
}

/* Get user data from KV */
async function getUser(email, KV) {
  const raw = await KV.get('user:' + email);
  return raw ? JSON.parse(raw) : null;
}

/* Save user data to KV */
async function saveUser(email, data, KV) {
  await KV.put('user:' + email, JSON.stringify(data));
}

/* ================================================================
   ROUTES
   ================================================================ */

export default {
  async fetch(request, env) {
    const { method } = request;
    const url = new URL(request.url);
    const path = url.pathname;
    const KV = env.AUTH_KV;

    /* Preflight */
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    try {
      /* ------ POST /api/auth/register ------ */
      if (path === '/api/auth/register' && method === 'POST') {
        const body = await request.json();
        const { email, name, password } = body;

        if (!email || !name || !password) {
          return json({ success: false, message: 'Email, nama, dan password wajib diisi' }, 400);
        }
        if (password.length < 6) {
          return json({ success: false, message: 'Password minimal 6 karakter' }, 400);
        }

        /* Cek sudah ada */
        const existing = await getUser(email, KV);
        if (existing) {
          return json({ success: false, message: 'Email sudah terdaftar' }, 409);
        }

        /* Buat user baru */
        const salt = randomHex(16);
        const passwordHash = await hashPassword(password, salt);
        const since = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

        const user = {
          email,
          name,
          passwordHash,
          salt,
          status: 'Active',
          since,
          createdAt: new Date().toISOString(),
        };

        await saveUser(email, user, KV);

        /* Auto login */
        const token = generateToken();
        await KV.put('session:' + token, email, { expirationTtl: 86400 * 7 }); /* 7 hari */

        return json({
          success: true,
          message: 'Registrasi berhasil',
          data: {
            token,
            user: { email: user.email, name: user.name, status: user.status, since: user.since },
          },
        }, 201);
      }

      /* ------ POST /api/auth/login ------ */
      if (path === '/api/auth/login' && method === 'POST') {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
          return json({ success: false, message: 'Email dan password wajib diisi' }, 400);
        }

        const user = await getUser(email, KV);
        if (!user) {
          return json({ success: false, message: 'Email tidak ditemukan' }, 404);
        }

        const hash = await hashPassword(password, user.salt);
        if (hash !== user.passwordHash) {
          return json({ success: false, message: 'Password salah' }, 401);
        }

        const token = generateToken();
        await KV.put('session:' + token, email, { expirationTtl: 86400 * 7 });

        return json({
          success: true,
          message: 'Login berhasil',
          data: {
            token,
            user: { email: user.email, name: user.name, status: user.status, since: user.since },
          },
        });
      }

      /* ------ GET /api/auth/me ------ */
      if (path === '/api/auth/me' && method === 'GET') {
        const email = await verifyToken(request, KV);
        if (!email) {
          return json({ success: false, message: 'Token tidak valid atau expired' }, 401);
        }

        const user = await getUser(email, KV);
        if (!user) {
          return json({ success: false, message: 'User tidak ditemukan' }, 404);
        }

        return json({
          success: true,
          data: {
            email: user.email,
            name: user.name,
            status: user.status,
            since: user.since,
            createdAt: user.createdAt,
          },
        });
      }

      /* ------ POST /api/auth/change-password ------ */
      if (path === '/api/auth/change-password' && method === 'POST') {
        const email = await verifyToken(request, KV);
        if (!email) {
          return json({ success: false, message: 'Token tidak valid atau expired' }, 401);
        }

        const body = await request.json();
        const { oldPassword, newPassword } = body;

        if (!oldPassword || !newPassword) {
          return json({ success: false, message: 'Password lama dan baru wajib diisi' }, 400);
        }
        if (newPassword.length < 6) {
          return json({ success: false, message: 'Password baru minimal 6 karakter' }, 400);
        }
        if (oldPassword === newPassword) {
          return json({ success: false, message: 'Password baru tidak boleh sama dengan yang lama' }, 400);
        }

        const user = await getUser(email, KV);
        if (!user) {
          return json({ success: false, message: 'User tidak ditemukan' }, 404);
        }

        /* Verifikasi password lama */
        const oldHash = await hashPassword(oldPassword, user.salt);
        if (oldHash !== user.passwordHash) {
          return json({ success: false, message: 'Password lama salah' }, 401);
        }

        /* Generate salt baru & hash password baru */
        const newSalt = randomHex(16);
        const newHash = await hashPassword(newPassword, newSalt);

        /* Update user */
        user.passwordHash = newHash;
        user.salt = newSalt;
        user.passwordChangedAt = new Date().toISOString();
        await saveUser(email, user, KV);

        /* Invalidate semua session lama (opsional keamanan) */
        /* Jika ingin force re-login setelah ganti password, uncomment:
        const list = await KV.list({ prefix: 'session:' });
        for (const key of list.keys) {
          const val = await KV.get(key.name);
          if (val === email) await KV.delete(key.name);
        }
        */

        return json({
          success: true,
          message: 'Password berhasil diubah',
        });
      }

      /* ------ POST /api/auth/logout ------ */
      if (path === '/api/auth/logout' && method === 'POST') {
        const auth = request.headers.get('Authorization');
        if (auth && auth.startsWith('Bearer ')) {
          const token = auth.replace('Bearer ', '');
          await KV.delete('session:' + token);
        }
        return json({ success: true, message: 'Logout berhasil' });
      }

      /* ------ 404 ------ */
      return json({ success: false, message: 'Endpoint tidak ditemukan' }, 404);

    } catch (err) {
      return json({ success: false, message: 'Internal server error', error: err.message }, 500);
    }
  },
};
