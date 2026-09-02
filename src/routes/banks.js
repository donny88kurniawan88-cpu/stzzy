/* ================================================================
   ROUTES — BANKS
   ----------------------------------------------------------------
   Modul ini disiapkan untuk menampung route handler yang berkaitan
   dengan bank (formatter, validator, sync, accounts, pencairan,
   validate-rekening).

   Catatan: Seluruh logika bank saat ini masih berjalan di dalam
   `src/index.js` (section 13–15) tanpa perubahan perilaku, termasuk
   helper bank di bagian atas file. Modul ini adalah placeholder
   struktural sesuai susunan folder yang baru.
   ================================================================ */

/**
 * Handler utama untuk rute banks.
 * @param {Request} request
 * @param {object} env - Cloudflare env bindings (DB, ASSETS, ...)
 * @returns {Promise<Response|null>} Response bila cocok, null bila tidak.
 */
export async function handleBanksRoutes(/* request, env */) {
  // Placeholder — rute bank saat ini ditangani oleh src/index.js
  return null;
}

export default handleBanksRoutes;
