/* ================================================================
   ROUTES — USERS
   ----------------------------------------------------------------
   Modul ini disiapkan untuk menampung route handler yang berkaitan
   dengan manajemen user (CRUD user, access control, registrasi
   pending, dst).

   Catatan: Seluruh logika user management saat ini masih berjalan
   di dalam `src/index.js` (section 3–11) tanpa perubahan perilaku.
   Modul ini adalah placeholder struktural sesuai susunan folder
   yang baru, siap dipakai ketika rute-rute tersebut dipindahkan
   secara bertahap di masa depan.
   ================================================================ */

/**
 * Handler utama untuk rute users.
 * @param {Request} request
 * @param {object} env - Cloudflare env bindings (DB, ASSETS, AUTH_KV, ...)
 * @returns {Promise<Response|null>} Response bila cocok, null bila tidak.
 */
export async function handleUsersRoutes(/* request, env */) {
  // Placeholder — rute users saat ini ditangani oleh src/index.js
  return null;
}

export default handleUsersRoutes;
