/* ================================================================
   ROUTES — VALIDATOR
   ----------------------------------------------------------------
   Modul ini disiapkan untuk menampung route handler yang berkaitan
   dengan validator rekening (validate-rekening, bank/validate, serta
   pembangunan database validator dari sheet).

   Catatan: Seluruh logika validator saat ini masih berjalan di
   dalam `src/index.js` (section 15 + helper buildValidatorDatabase
   FromSheets) tanpa perubahan perilaku. Modul ini adalah placeholder
   struktural sesuai susunan folder yang baru.
   ================================================================ */

/**
 * Handler utama untuk rute validator.
 * @param {Request} request
 * @param {object} env - Cloudflare env bindings (DB, ASSETS, ...)
 * @returns {Promise<Response|null>} Response bila cocok, null bila tidak.
 */
export async function handleValidatorRoutes(/* request, env */) {
  // Placeholder — rute validator saat ini ditangani oleh src/index.js
  return null;
}

export default handleValidatorRoutes;
