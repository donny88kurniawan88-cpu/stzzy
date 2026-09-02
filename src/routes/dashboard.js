/* ================================================================
   ROUTES — DASHBOARD
   ----------------------------------------------------------------
   Modul ini disiapkan untuk menampung route handler yang berkaitan
   dengan dashboard (ringkasan data untuk halaman Dashboard.html).

   Catatan: Halaman Dashboard.html saat ini dilayani sebagai static
   asset via env.ASSETS (section 1 di src/index.js). Modul ini adalah
   placeholder struktural sesuai susunan folder yang baru.
   ================================================================ */

/**
 * Handler utama untuk rute dashboard.
 * @param {Request} request
 * @param {object} env - Cloudflare env bindings (DB, ASSETS, ...)
 * @returns {Promise<Response|null>} Response bila cocok, null bila tidak.
 */
export async function handleDashboardRoutes(/* request, env */) {
  // Placeholder — siap untuk pengembangan route dashboard di masa depan
  return null;
}

export default handleDashboardRoutes;
