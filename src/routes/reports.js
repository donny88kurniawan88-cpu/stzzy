/* ================================================================
   ROUTES — REPORTS
   ----------------------------------------------------------------
   Modul ini disiapkan untuk menampung route handler yang berkaitan
   dengan laporan (PgReport, reporting, export, dst.).

   Catatan: Modul ini adalah placeholder struktural sesuai susunan
   folder yang baru. Belum ada logika report terpisah — halaman
   PgReport.html dilayani sebagai static asset via env.ASSETS.
   ================================================================ */

/**
 * Handler utama untuk rute reports.
 * @param {Request} request
 * @param {object} env - Cloudflare env bindings (DB, ASSETS, ...)
 * @returns {Promise<Response|null>} Response bila cocok, null bila tidak.
 */
export async function handleReportsRoutes(/* request, env */) {
  // Placeholder — siap untuk pengembangan route report di masa depan
  return null;
}

export default handleReportsRoutes;
