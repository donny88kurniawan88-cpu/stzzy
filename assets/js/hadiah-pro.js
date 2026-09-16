/* ============================================================
   AURA.OS // HADIAH-PRO.JS v1.0.0 — DISKON & HADIAH PASARAN
   Modul Hadiah Togel (Pro) — refactor profesional dari script
   kalkulator "DISKON & HADIAH PASARAN TOGEL" milik user:
   - Data lengkap 29 pasaran (hadiah x, diskon %, kei %, prize)
     dipertahankan PERSIS dari script asli.
   - Dropdown pilih pasaran BISA DIKETIK untuk mencari (senada
     modul Prediksi/Pk Jadwal), Enter = pilih match pertama,
     Escape / klik di luar = tutup.
   - Tab kategori: SEMUA / DISKON / BET FULL / PRIZE / TEPAT & BB
     / LAINNYA + divider per kategori pada mode SEMUA.
   - Kartu hitung: nominal -> BAYAR / MENANG / TOTAL / MIN.
     Rumus PERSIS script asli (termasuk kei minus/plus,
     pembulatan ceil/round, min 1.000 vs 100).
   - Logo pasaran resmi (CDN) + fallback teks bila gagal load.
   - Pilihan pasaran & tab terakhir diingat (localStorage).
   - Semua style di hadiah-pro.css — tanpa inline style.
   Exposed: window.HadiahPro.
   ============================================================ */

(function () {
  'use strict';

  /* ============================================================
     1. IKON (SVG inline, senada modul pro lain)
     ============================================================ */
  var ICON_TROPHY =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>';
  var ICON_SEARCH =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>';
  var ICON_CHEV =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
  var ICON_REFRESH =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>';

  /* ============================================================
     2. LOGO PASARAN (CDN resmi — sama dgn script asli user)
     ============================================================ */
  var MARKET_LOGOS = {
    'HOKI DRAW': 'https://cdn.areabermain.club/assets/cdn/az4/2024/12/25/20241225/1de5162dbfea7a85f41b654a2c3a4d07/logo-1.png',
    'JAKARTA': 'https://cdn.areabermain.club/assets/cdn/az4/2025/08/18/20250818/57824d39d3564ef0ebad1b4297693dc9/logo-jakarta-pools-jpg.png',
    'BANGKOK': 'https://bangkokpoolstoday.com/assets/img/bangkokpools_logo.png',
    'BRUNEI': 'https://bruneipools.com/assets/img/brunei-logo.png',
    'BULLSEYE': 'https://cdn.areabermain.club/assets/cdn/az4/2024/08/11/20240811/f07d4e2a6517ef1cea9e2a897e4abb98/nz-bullseye.png',
    'CALIFORNIA': 'https://cdn.areabermain.club/assets/cdn/az4/2025/08/18/20250818/c89c3a35f7323e90e2e2c5c255bdb7ae/california-pools-jpg.png',
    'CAROLINA DAY': 'https://cdn.areabermain.club/assets/cdn/az4/2025/08/18/20250818/816329e82e136b1e9faad6d14c8c81bc/carolina-day-pools-jpg.png',
    'CAROLINA EVE': 'https://cdn.areabermain.club/assets/cdn/az4/2025/08/18/20250818/799cce2ab08aca8bfb3a4a9c7484d78e/carolina-eve-jpg.png',
    'CHELSEA': 'https://chelseapools.co.uk/assets/img/chelseaPools_logo.png',
    'FLORIDA EVE': 'https://cdn.areabermain.club/assets/cdn/az4/2025/08/18/20250818/801479ca02e15020fac8df0024814152/florida-eve-new-2.png',
    'FLORIDA MID': 'https://cdn.areabermain.club/assets/cdn/az4/2025/08/18/20250818/1ffa2459adcc8330fa8874792d59eb1a/florida-mid.png',
    'HONGKONG': 'https://cdn.animaapp.com/projects/66be29ddeca4d2e95aa7b4ce/releases/66be3e204d8f7eb28bb5de15/img/hongkong-lotto-1.png',
    'HUAHIN': 'https://huahinlottery.com/assets/img/logo.png',
    'KENTUCKY EVE': 'https://cdn.areabermain.club/assets/cdn/az4/2025/08/18/20250818/ae8e720c8b7d930856cf3f364cc10158/kentucky-eve.png',
    'KENTUCKY MID': 'https://kentuckymid.com/wp-content/uploads/2022/07/KENTUCKY-MID.png',
    'MAGNUM4D': 'https://cdn.areabermain.club/assets/cdn/az4/2024/08/11/20240811/8889f1c5fc738b5148145100c08a0ebc/439-4390693-max-pengeluaran-magnum-4d-hari-clipart-removebg-preview.png',
    'NEVADA': 'https://cdn.areabermain.club/assets/cdn/az5/2025/08/20/20250820/9c934bcc2fc7552398b144d4b7f15203/nevada.png',
    'NEW YORK EVE': 'https://cdn.areabermain.club/assets/cdn/az4/2025/08/18/20250818/1f9a654060201e07442bc78def1bc135/new-york-eve.png',
    'NEW YORK MID': 'https://cdn.areabermain.club/assets/cdn/az4/2025/08/18/20250818/7fb415d09885f1a79bfc30b48803cc4d/new-york-mid.png',
    'OREGON': 'https://cdn.areabermain.club/assets/cdn/az4/2025/08/18/20250818/7715823646164db9d67d280a402dfb51/oregon-jpg.png',
    'PCSO': 'https://cdn.areabermain.club/assets/cdn/az4/2025/08/18/20250818/a67d9fd134f7211cbe08bd89bd64f79d/pcso-2.png',
    'POIPET': 'https://poipetlottery.com/img/logo.png',
    'SINGAPORE': 'https://cdn.areabermain.club/assets/cdn/az4/2025/08/18/20250818/ae20d56fcb2d0dea6b0ae637c6bed566/singapore-new.png',
    'SYDNEY': 'https://cdn.areabermain.club/assets/cdn/az4/2025/08/18/20250818/1d9ba1f974240b7b5c5e48fa2ef98e0e/sydney-2.png',
    'TOTOMALI': 'https://cdn.areabermain.club/assets/cdn/az4/2025/08/18/20250818/383a30e8a8e65f1d0da9fb7fa850d853/channels4-banner.png',
    'TOTO MACAU 4D': 'https://cdn.areabermain.club/assets/cdn/az4/2025/08/18/20250818/033094b5e73f842fcbcc3b235c029e7c/macau-logo.png',
    'TOTO MACAU 5D': 'https://cdn.areabermain.club/assets/cdn/az4/2025/08/18/20250818/3cbd41c8d7267cad6a5e55a1f08fd72d/macau-5d-removebg-preview.png',
    'KINGKONG': 'https://cdn.areabermain.club/assets/cdn/az4/2025/08/18/20250818/32f87d6c932b0d2eee9b6e1c9028ab41/logo-2.png',
    'TOTO CAMBODIA': 'https://totocambodialive.com/assets/img/logo.png'
  };

  /* ============================================================
     3. DATA PASARAN (hadiah/diskon/kei — PERSIS script asli)
     ============================================================ */
  var CFG = {};

  function cfg(name, map) { CFG[name] = { map: map || {} }; }

  /* blok PRIZE 1/2/3 (pasaran dgn prize resmi) */
  function prizeBlock(p14, p13, p12, p24, p23, p22, p34, p33, p32) {
    return {
      'PRIZE 1 - 1': { hadiah: p14, diskon: 0 }, 'PRIZE 1 - 2': { hadiah: p13, diskon: 0 }, 'PRIZE 1 - 3': { hadiah: p12, diskon: 0 },
      'PRIZE 2 - 1': { hadiah: p24, diskon: 0 }, 'PRIZE 2 - 2': { hadiah: p23, diskon: 0 }, 'PRIZE 2 - 3': { hadiah: p22, diskon: 0 },
      'PRIZE 3 - 1': { hadiah: p34, diskon: 0 }, 'PRIZE 3 - 2': { hadiah: p33, diskon: 0 }, 'PRIZE 3 - 3': { hadiah: p32, diskon: 0 }
    };
  }

  cfg('TOTO MACAU 4D', {
    'DISKON 4D': { hadiah: 6000, diskon: 33 }, 'DISKON 3D': { hadiah: 700, diskon: 24 }, 'DISKON 2D': { hadiah: 80, diskon: 15 },
    'SUPER DISKON 4D': { hadiah: 3000, diskon: 66 }, 'SUPER DISKON 3D': { hadiah: 400, diskon: 59 }, 'SUPER DISKON 2D': { hadiah: 70, diskon: 29 },
    'BET FULL 4D': { hadiah: 9000 }, 'BET FULL 3D': { hadiah: 950 }, 'BET FULL 2D': { hadiah: 95 },
    '4D TEPAT': { hadiah: 4000 }, '4D BB': { hadiah: 200 }, '3D TEPAT': { hadiah: 400 }, '3D BB': { hadiah: 100 }, '2D TEPAT': { hadiah: 70 }, '2D BB': { hadiah: 20 },
    'COLOK BEBAS': { hadiah: 1.6, diskon: 0 }, 'COLOK BEBAS ( 2 )': { hadiah: 3.2, diskon: 0 }, 'COLOK BEBAS ( 3 )': { hadiah: 4.8, diskon: 0 }, 'COLOK BEBAS ( 4 )': { hadiah: 6.4, diskon: 0 },
    'COLOK JITU': { hadiah: 8.3 }, 'MACAU SHIO': { hadiah: 110 },
    'COLOK BEBAS 2D ( 2 )': { hadiah: 7 }, 'COLOK BEBAS 2D ( 3 )': { hadiah: 13 }, 'COLOK BEBAS 2D ( 4 )': { hadiah: 21 },
    'COLOK NAGA ( 3 )': { hadiah: 27 }, 'COLOK NAGA ( 4 )': { hadiah: 41 },
    'SHIO': { hadiah: 10 }, '50 - 50': { kei: -5 }, 'TENGAH TEPI': { kei: -2.2 }, 'KOMBINASI': { hadiah: 2.8 }, 'SILANG HOMO': { kei: -2.2 }, 'KEMBANG - KEMPIS - KEMBAR': { kei: -2.2 }, 'DASAR GANJIL - BESAR': { kei: -25 }, 'DASAR GENAP - KECIL': { kei: 10 }
  });

  cfg('TOTO MACAU 5D', {
    'DISKON 5D': { hadiah: 50000, diskon: 38 }, 'DISKON 4D': { hadiah: 7000, diskon: 20 }, 'DISKON 3D': { hadiah: 750, diskon: 20 }, 'DISKON 2D': { hadiah: 75, diskon: 20 },
    'BET FULL 5D': { hadiah: 88000 }, 'BET FULL 4D': { hadiah: 9000 }, 'BET FULL 3D': { hadiah: 950 }, 'BET FULL 2D': { hadiah: 95 },
    '5D TEPAT': { hadiah: 50000 }, '5D BB': { hadiah: 350 }, '4D TEPAT': { hadiah: 5000 }, '4D BB': { hadiah: 180 }, '3D TEPAT': { hadiah: 500 }, '3D BB': { hadiah: 75 }, '2D TEPAT': { hadiah: 80 }, '2D BB': { hadiah: 15 },
    'COLOK BEBAS': { hadiah: 0.9, diskon: 0 }, 'COLOK BEBAS ( 2 )': { hadiah: 1.8, diskon: 0 }, 'COLOK BEBAS ( 3 )': { hadiah: 2.7, diskon: 0 }, 'COLOK BEBAS ( 4 )': { hadiah: 3.6, diskon: 0 }, 'COLOK BEBAS ( 5 )': { hadiah: 4.5, diskon: 0 },
    'COLOK JITU': { hadiah: 8 }, 'COLOK BEBAS 2D ( 2 )': { hadiah: 4 }, 'COLOK BEBAS 2D ( 3 )': { hadiah: 6 }, 'COLOK BEBAS 2D ( 4 )': { hadiah: 20 }, 'COLOK BEBAS 2D ( 5 )': { hadiah: 200 },
    'COLOK BEBAS 4D ( 4 )': { hadiah: 50 }, 'COLOK BEBAS 4D ( 5 )': { hadiah: 200 }, 'COLOK NAGA ( 3 )': { hadiah: 12 }, 'COLOK NAGA ( 4 )': { hadiah: 30 }, 'COLOK NAGA ( 5 )': { hadiah: 125 },
    'SHIO': { hadiah: 10 }, '50 - 50': { kei: -2.2 }, 'KOMBINASI': { hadiah: 2.7 }, 'TENGAH TEPI': { kei: -2.2 }, 'DASAR GANJIL - BESAR': { kei: -25 }, 'DASAR GENAP - KECIL': { kei: 10 }
  });

  cfg('KINGKONG', {
    'DISKON 4D': { hadiah: 6000, diskon: 33 }, 'DISKON 3D': { hadiah: 700, diskon: 24 }, 'DISKON 2D': { hadiah: 80, diskon: 15 },
    'BET FULL 4D': { hadiah: 9000 }, 'BET FULL 3D': { hadiah: 950 }, 'BET FULL 2D': { hadiah: 95 },
    '4D TEPAT': { hadiah: 4000 }, '4D BB': { hadiah: 200 }, '3D TEPAT': { hadiah: 400 }, '3D BB': { hadiah: 100 }, '2D TEPAT': { hadiah: 70 }, '2D BB': { hadiah: 20 },
    'COLOK BEBAS': { hadiah: 1.6, diskon: 0 }, 'COLOK BEBAS ( 2 )': { hadiah: 3.2, diskon: 0 }, 'COLOK BEBAS ( 3 )': { hadiah: 4.8, diskon: 0 }, 'COLOK BEBAS ( 4 )': { hadiah: 6.4, diskon: 0 },
    'COLOK JITU': { hadiah: 8.3 }, 'MACAU SHIO': { hadiah: 110 }, 'COLOK BEBAS 2D ( 2 )': { hadiah: 7 }, 'COLOK BEBAS 2D ( 3 )': { hadiah: 13 }, 'COLOK BEBAS 2D ( 4 )': { hadiah: 21 },
    'COLOK NAGA ( 3 )': { hadiah: 27 }, 'COLOK NAGA ( 4 )': { hadiah: 41 },
    'SHIO': { hadiah: 10 }, '50 - 50': { kei: -5 }, 'KOMBINASI': { hadiah: 2.8 }, 'SILANG HOMO': { kei: -2.2 }, 'TENGAH TEPI': { kei: -2.2 }, 'KEMBANG - KEMPIS': { kei: -2.2 }, 'KEMBAR': { kei: 50 }, 'DASAR GANJIL - BESAR': { kei: -25 }, 'DASAR GENAP - KECIL': { kei: 10 }
  });

  /* pasaran standar + prize resmi */
  ['BANGKOK', 'BRUNEI', 'CHELSEA', 'HONGKONG', 'HUAHIN', 'MAGNUM4D', 'NEVADA', 'POIPET', 'SYDNEY', 'TOTO CAMBODIA', 'TOTOMALI'].forEach(function (name) {
    var base = {
      'DISKON 4D': { hadiah: 3000, diskon: 66 }, 'DISKON 3D': { hadiah: 400, diskon: 59 }, 'DISKON 2D': { hadiah: 70, diskon: 29 },
      'DISKON 2D DEPAN': { hadiah: 65, diskon: 29 }, 'DISKON 2D TENGAH': { hadiah: 65, diskon: 29 },
      'BET FULL 4D': { hadiah: 10000, diskon: 0 }, 'BET FULL 3D': { hadiah: 1000, diskon: 0 }, 'BET FULL 2D': { hadiah: 100, diskon: 0 },
      '4D TEPAT': { hadiah: 4000 }, '4D BB': { hadiah: 200 }, '3D TEPAT': { hadiah: 400 }, '3D BB': { hadiah: 100 }, '2D TEPAT': { hadiah: 70 }, '2D BB': { hadiah: 20 },
      'COLOK BEBAS': { hadiah: 1.5, diskon: 6 }, 'COLOK BEBAS ( 2 )': { hadiah: 3, diskon: 6 }, 'COLOK BEBAS ( 3 )': { hadiah: 4.5, diskon: 6 }, 'COLOK BEBAS ( 4 )': { hadiah: 6, diskon: 6 },
      'COLOK JITU': { hadiah: 8, diskon: 6 }, 'MACAU SHIO': { hadiah: 110, diskon: 10 },
      'COLOK BEBAS 2D ( 2 )': { hadiah: 7, diskon: 10 }, 'COLOK BEBAS 2D ( 3 )': { hadiah: 11, diskon: 10 }, 'COLOK BEBAS 2D ( 4 )': { hadiah: 18, diskon: 10 },
      'COLOK NAGA ( 3 )': { hadiah: 23, diskon: 10 }, 'COLOK NAGA ( 4 )': { hadiah: 35, diskon: 10 },
      'SHIO': { hadiah: 9.5, diskon: 5 }, '50 - 50': { kei: -3, diskon: 2 }, 'TENGAH TEPI': { kei: -3, diskon: 2 }, 'SILANG HOMO': { kei: -3, diskon: 2 }, 'KEMBANG - KEMPIS - KEMBAR': { kei: -3, diskon: 2 },
      'KOMBINASI': { hadiah: 2.6, diskon: 8 }, 'DASAR GANJIL - BESAR': { kei: -25, diskon: 2 }, 'DASAR GENAP - KECIL': { kei: 10, diskon: 2 }
    };
    if (name === 'HONGKONG' || name === 'SYDNEY') {
      base['BET FULL 4D'] = { hadiah: 9800, diskon: 0 };
      base['BET FULL 3D'] = { hadiah: 980, diskon: 0 };
      base['BET FULL 2D'] = { hadiah: 98, diskon: 0 };
    }
    if (name === 'TOTOMALI') {
      base['DISKON 4D'] = { hadiah: 3000, diskon: 67 }; base['DISKON 3D'] = { hadiah: 400, diskon: 57 }; base['DISKON 2D'] = { hadiah: 70, diskon: 27 };
      delete base['DISKON 2D DEPAN']; delete base['DISKON 2D TENGAH'];
      base['COLOK BEBAS'] = { hadiah: 1.6, diskon: 6 }; base['COLOK BEBAS ( 2 )'] = { hadiah: 3.2, diskon: 6 }; base['COLOK BEBAS ( 3 )'] = { hadiah: 4.8, diskon: 6 }; base['COLOK BEBAS ( 4 )'] = { hadiah: 6.4, diskon: 6 };
      base['COLOK JITU'] = { hadiah: 8.3, diskon: 6 }; base['MACAU SHIO'] = { hadiah: 110, diskon: 10 };
      base['COLOK BEBAS 2D ( 2 )'] = { hadiah: 7, diskon: 10 }; base['COLOK BEBAS 2D ( 3 )'] = { hadiah: 13, diskon: 10 }; base['COLOK BEBAS 2D ( 4 )'] = { hadiah: 21, diskon: 10 };
      base['COLOK NAGA ( 3 )'] = { hadiah: 27, diskon: 10 }; base['COLOK NAGA ( 4 )'] = { hadiah: 41, diskon: 10 };
      base['SHIO'] = { hadiah: 9.5, diskon: 5 }; base['50 - 50'] = { kei: -5, diskon: 2 }; base['TENGAH TEPI'] = { kei: -2.2, diskon: 2 }; base['SILANG HOMO'] = { kei: -2.2, diskon: 2 }; base['KEMBANG - KEMPIS - KEMBAR'] = { kei: -2.2, diskon: 2 };
      base['KOMBINASI'] = { hadiah: 2.8, diskon: 8 }; base['DASAR GANJIL - BESAR'] = { kei: -25, diskon: 2 }; base['DASAR GENAP - KECIL'] = { kei: 10, diskon: 2 };
    }
    cfg(name, Object.assign(base, prizeBlock(6500, 650, 70, 2100, 210, 20, 1100, 110, 8)));
  });

  /* pasaran tanpa prize (incl. HOKI DRAW & JAKARTA variant) */
  ['BULLSEYE', 'CALIFORNIA', 'CAROLINA EVE', 'CAROLINA DAY', 'FLORIDA EVE', 'FLORIDA MID', 'KENTUCKY EVE', 'KENTUCKY MID', 'NEW YORK EVE', 'NEW YORK MID', 'OREGON', 'PCSO', 'HOKI DRAW', 'JAKARTA'].forEach(function (name) {
    var isHoki = name === 'HOKI DRAW', isJak = name === 'JAKARTA';
    var base = {
      'DISKON 4D': { hadiah: isHoki ? 7000 : 3000, diskon: isHoki ? 20 : 66 },
      'DISKON 3D': { hadiah: isHoki ? 750 : 400, diskon: isHoki ? 20 : 59 },
      'DISKON 2D': { hadiah: isHoki ? 75 : 70, diskon: isHoki ? 20 : 29 },
      'BET FULL 4D': { hadiah: 10000, diskon: 0 }, 'BET FULL 3D': { hadiah: 1000, diskon: 0 }, 'BET FULL 2D': { hadiah: 100, diskon: 0 },
      '4D TEPAT': { hadiah: isHoki ? 5000 : 4000 }, '4D BB': { hadiah: isHoki ? 180 : 200 },
      '3D TEPAT': { hadiah: isHoki ? 500 : 400 }, '3D BB': { hadiah: isHoki ? 75 : 100 },
      '2D TEPAT': { hadiah: isHoki ? 80 : 70 }, '2D BB': { hadiah: isHoki ? 15 : 20 }
    };
    if (!isHoki && !isJak) {
      base['DISKON 2D DEPAN'] = { hadiah: 65, diskon: 29 };
      base['DISKON 2D TENGAH'] = { hadiah: 65, diskon: 29 };
    }
    var others = isHoki ? {
      'COLOK BEBAS': { hadiah: 0.9, diskon: 6 }, 'COLOK BEBAS ( 2 )': { hadiah: 1.8, diskon: 6 }, 'COLOK BEBAS ( 3 )': { hadiah: 2.7, diskon: 6 }, 'COLOK BEBAS ( 4 )': { hadiah: 3.6, diskon: 6 },
      'COLOK JITU': { hadiah: 8, diskon: 6 }, 'MACAU SHIO': { hadiah: 110, diskon: 10 }, 'COLOK BEBAS 2D ( 2 )': { hadiah: 4, diskon: 10 }, 'COLOK BEBAS 2D ( 3 )': { hadiah: 6, diskon: 10 }, 'COLOK BEBAS 2D ( 4 )': { hadiah: 20, diskon: 10 },
      'COLOK NAGA ( 3 )': { diskon: 10, hadiah: 12 }, 'COLOK NAGA ( 4 )': { diskon: 10, hadiah: 30 },
      'SHIO': { hadiah: 9.5, diskon: 5 }, '50 - 50': { kei: -2.2, diskon: 2 }, 'TENGAH TEPI': { kei: -2.2, diskon: 2 }, 'SILANG HOMO': { kei: -3, diskon: 2 }, 'KEMBANG - KEMPIS - KEMBAR': { kei: -3, diskon: 2 },
      'KOMBINASI': { hadiah: 2.7, diskon: 8 }, 'DASAR GANJIL - BESAR': { kei: -25, diskon: 2 }, 'DASAR GENAP - KECIL': { kei: 10, diskon: 2 }
    } : (isJak ? {
      'COLOK BEBAS': { hadiah: 1.6, diskon: 6 }, 'COLOK BEBAS ( 2 )': { hadiah: 3.2, diskon: 6 }, 'COLOK BEBAS ( 3 )': { hadiah: 4.8, diskon: 6 }, 'COLOK BEBAS ( 4 )': { hadiah: 6.4, diskon: 6 },
      'COLOK JITU': { hadiah: 8.3, diskon: 6 }, 'MACAU SHIO': { hadiah: 110, diskon: 10 },
      'COLOK BEBAS 2D ( 2 )': { hadiah: 7, diskon: 10 }, 'COLOK BEBAS 2D ( 3 )': { hadiah: 13, diskon: 10 }, 'COLOK BEBAS 2D ( 4 )': { hadiah: 21, diskon: 10 },
      'COLOK NAGA ( 3 )': { hadiah: 27, diskon: 10 }, 'COLOK NAGA ( 4 )': { hadiah: 41, diskon: 10 },
      'SHIO': { hadiah: 9.5, diskon: 5 }, '50 - 50': { kei: -5, diskon: 2 }, 'TENGAH TEPI': { kei: -2.2, diskon: 2 }, 'SILANG HOMO': { kei: -2.2, diskon: 2 }, 'KEMBANG - KEMPIS - KEMBAR': { kei: -2.2, diskon: 2 },
      'KOMBINASI': { hadiah: 2.8, diskon: 8 }, 'DASAR GANJIL - BESAR': { kei: -25, diskon: 2 }, 'DASAR GENAP - KECIL': { kei: 10, diskon: 2 }
    } : {
      'COLOK BEBAS': { hadiah: 1.5, diskon: 6 }, 'COLOK BEBAS ( 2 )': { hadiah: 3, diskon: 6 }, 'COLOK BEBAS ( 3 )': { hadiah: 4.5, diskon: 6 }, 'COLOK BEBAS ( 4 )': { hadiah: 6, diskon: 6 },
      'COLOK JITU': { hadiah: 8, diskon: 6 }, 'MACAU SHIO': { hadiah: 110, diskon: 10 },
      'COLOK BEBAS 2D ( 2 )': { hadiah: 7, diskon: 10 }, 'COLOK BEBAS 2D ( 3 )': { hadiah: 11, diskon: 10 }, 'COLOK BEBAS 2D ( 4 )': { hadiah: 18, diskon: 10 },
      'COLOK NAGA ( 3 )': { hadiah: 23, diskon: 10 }, 'COLOK NAGA ( 4 )': { hadiah: 35, diskon: 10 },
      'SHIO': { hadiah: 9.5, diskon: 5 }, '50 - 50': { kei: -3, diskon: 2 }, 'TENGAH TEPI': { kei: -3, diskon: 2 }, 'SILANG HOMO': { kei: -3, diskon: 2 }, 'KEMBANG - KEMPIS - KEMBAR': { kei: -3, diskon: 2 },
      'KOMBINASI': { hadiah: 2.6, diskon: 8 }, 'DASAR GANJIL - BESAR': { kei: -25, diskon: 2 }, 'DASAR GENAP - KECIL': { kei: 10, diskon: 2 }
    });
    cfg(name, Object.assign(base, others));
  });

  cfg('SINGAPORE', (function () {
    var base = {
      'DISKON 4D': { hadiah: 3000, diskon: 66.5 }, 'DISKON 3D': { hadiah: 400, diskon: 59.5 }, 'DISKON 2D': { hadiah: 70, diskon: 29.5 },
      'DISKON 2D DEPAN': { hadiah: 65, diskon: 29.5 }, 'DISKON 2D TENGAH': { hadiah: 65, diskon: 29.5 },
      'BET FULL 4D': { hadiah: 10000, diskon: 0 }, 'BET FULL 3D': { hadiah: 1000, diskon: 0 }, 'BET FULL 2D': { hadiah: 100, diskon: 0 },
      '4D TEPAT': { hadiah: 4000 }, '4D BB': { hadiah: 200 }, '3D TEPAT': { hadiah: 400 }, '3D BB': { hadiah: 100 }, '2D TEPAT': { hadiah: 70 }, '2D BB': { hadiah: 20 },
      'COLOK BEBAS': { hadiah: 1.5, diskon: 6 }, 'COLOK BEBAS ( 2 )': { hadiah: 3, diskon: 6 }, 'COLOK BEBAS ( 3 )': { hadiah: 4.5, diskon: 6 }, 'COLOK BEBAS ( 4 )': { hadiah: 6, diskon: 6 },
      'COLOK JITU': { hadiah: 8, diskon: 6 }, 'MACAU SHIO': { hadiah: 110, diskon: 10 },
      'COLOK BEBAS 2D ( 2 )': { hadiah: 7, diskon: 10 }, 'COLOK BEBAS 2D ( 3 )': { hadiah: 11, diskon: 10 }, 'COLOK BEBAS 2D ( 4 )': { hadiah: 18, diskon: 10 },
      'COLOK NAGA ( 3 )': { hadiah: 23, diskon: 10 }, 'COLOK NAGA ( 4 )': { hadiah: 35, diskon: 10 },
      'SHIO': { hadiah: 9.5, diskon: 5 }, '50 - 50': { kei: -3, diskon: 2 }, 'TENGAH TEPI': { kei: -3, diskon: 2 }, 'SILANG HOMO': { kei: -3, diskon: 2 }, 'KEMBANG - KEMPIS - KEMBAR': { kei: -3, diskon: 2 },
      'KOMBINASI': { hadiah: 2.6, diskon: 8 }, 'DASAR GANJIL - BESAR': { kei: -25, diskon: 2 }, 'DASAR GENAP - KECIL': { kei: 10, diskon: 2 }
    };
    return Object.assign(base, prizeBlock(6500, 650, 70, 2100, 210, 20, 1100, 110, 8));
  })());

  /* ============================================================
     4. HELPER
     ============================================================ */
  var LS_KEY = 'aura_hadiah_sel_v1'; // ingat pasaran + tab terakhir

  function norm(s) { return String(s || '').replace(/\s+/g, ' ').trim().toLowerCase(); }
  function idr(n) { return Number(n || 0).toLocaleString('id-ID'); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* pasaran dgn TOTAL ditampilkan (aturan script asli) */
  function isPlusTotal(title) {
    var t = norm(title);
    return /^colok bebas(\s*\(\s*\d+\s*\))?$/.test(t) || /^colok bebas 2d/.test(t) ||
      /^colok bebas 4d/.test(t) || /^colok jitu/.test(t) || /^colok naga/.test(t) ||
      /^macau shio/.test(t) || /^shio$/.test(t) || /^kombinasi$/.test(t);
  }

  /* minimal bet 1.000 (selain itu 100) — aturan script asli */
  function isMin1000(t) {
    var keys = {
      'colok bebas': 1, 'colok bebas 2d': 1, 'colok bebas 4d': 1, 'colok naga': 1,
      'colok jitu': 1, 'macau shio': 1, 'shio': 1, 'kombinasi': 1, 'silang homo': 1,
      '50 - 50': 1, 'tengah tepi': 1, 'kembang - kempis - kembar': 1,
      'dasar ganjil - besar': 1, 'dasar genap - kecil': 1
    };
    if (keys[t]) return true;
    return /^colok bebas\s*\(\s*\d+\s*\)$/.test(t) || /^colok bebas 2d\s*\(\s*\d+\s*\)$/.test(t) ||
      /^colok bebas 4d\s*\(\s*\d+\s*\)$/.test(t) || /^colok naga\s*\(\s*\d+\s*\)$/.test(t);
  }

  /* kategori kartu — aturan script asli */
  function tagOf(title) {
    var t = norm(title);
    if (t.indexOf('super diskon') === 0 || t.indexOf('diskon') === 0) return 'diskon';
    if (t.indexOf('bet full') === 0) return 'betfull';
    if (t.indexOf('prize') === 0) return 'prize';
    if (t.indexOf('tepat') > -1 || /\bbb\b/.test(t)) return 'tepatbb';
    return 'lain';
  }
  var TAG_LABEL = { diskon: 'Diskon', betfull: 'Bet Full', prize: 'Prize', tepatbb: 'Tepat & BB', lain: 'Lainnya' };
  var TAG_ORDER = ['diskon', 'betfull', 'prize', 'tepatbb', 'lain'];
  var TABS = [['all', 'SEMUA'], ['diskon', 'DISKON'], ['betfull', 'BET FULL'], ['prize', 'PRIZE'], ['tepatbb', 'TEPAT & BB'], ['lain', 'LAINNYA']];

  function marketList() { return Object.keys(CFG).sort(); }
  function ruleCount(m) { return Object.keys(CFG[m] ? CFG[m].map : {}).length; }
  function hasPrize(m) {
    var map = CFG[m] ? CFG[m].map : {};
    for (var k in map) if (tagOf(k) === 'prize') return true;
    return false;
  }

  /* ============================================================
     5. STATE & ELEMEN
     ============================================================ */
  var state = { market: '', filter: 'all', dropOpen: false, dropQuery: '' };
  var el = {};

  function h(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function svg(icon) { var d = document.createElement('span'); d.innerHTML = icon; return d.firstChild; }

  /* ============================================================
     6. BANGUN SHELL UI (sekali per render)
     ============================================================ */
  function buildShell(host) {
    host.innerHTML = '';
    var wrap = h('div', 'dh-wrap');

    /* --- header --- */
    var head = h('section', 'dh-panel dh-head');
    var body = h('div', 'dh-head-body');
    var eye = h('span', 'dh-eyebrow');
    eye.appendChild(h('i', 'dh-dot'));
    eye.appendChild(document.createTextNode('KALKULATOR • LIVECHAT ESSENTIALS'));
    var title = h('h2', 'dh-title');
    title.appendChild(document.createTextNode('Diskon & '));
    var acc = h('span', 'dh-accent', 'Hadiah Pasaran');
    title.appendChild(acc);
    body.appendChild(eye);
    body.appendChild(title);
    body.appendChild(h('p', 'dh-sub', 'Hitung bayar, hadiah dan total untuk semua pasaran — pilih pasaran, pilih kategori, masukkan nominal taruhan lalu tekan HITUNG.'));
    head.appendChild(body);
    var side = h('div', 'dh-head-side');
    var st1 = h('div', 'dh-stat');
    st1.appendChild(h('b', null, String(marketList().length)));
    st1.appendChild(h('span', null, 'PASARAN'));
    var st2 = h('div', 'dh-stat');
    st2.id = 'dhStatRules';
    st2.appendChild(h('b', null, '0'));
    st2.appendChild(h('span', null, 'ATURAN'));
    side.appendChild(st1); side.appendChild(st2);
    head.appendChild(side);
    wrap.appendChild(head);

    /* --- kontrol: dropdown + reset --- */
    var ctrl = h('section', 'dh-panel');
    var row = h('div', 'dh-control-row');

    var drop = h('div', 'dh-drop');
    drop.id = 'dhDropWrap';
    var btn = h('button', 'dh-drop-btn');
    btn.type = 'button';
    btn.id = 'dhDropBtn';
    btn.setAttribute('aria-haspopup', 'listbox');
    var ic = h('span', 'dh-drop-ic');
    ic.appendChild(svg(ICON_TROPHY));
    var lbl = h('span', 'dh-drop-label', 'PILIH PASARAN');
    lbl.id = 'dhDropLabel';
    var chev = h('span', 'dh-drop-chev');
    chev.appendChild(svg(ICON_CHEV));
    btn.appendChild(ic); btn.appendChild(lbl); btn.appendChild(chev);
    drop.appendChild(btn);

    var panel = h('div', 'dh-drop-panel');
    panel.id = 'dhDropPanel';
    panel.style.display = 'none';
    var srch = h('div', 'dh-drop-search');
    srch.appendChild(svg(ICON_SEARCH));
    var inp = h('input');
    inp.type = 'text';
    inp.id = 'dhDropSearch';
    inp.placeholder = 'Cari pasaran — ketik nama…';
    inp.autocomplete = 'off';
    inp.spellcheck = false;
    srch.appendChild(inp);
    panel.appendChild(srch);
    var list = h('div', 'dh-drop-list');
    list.id = 'dhDropList';
    panel.appendChild(list);
    drop.appendChild(panel);
    row.appendChild(drop);

    var sp = h('div', 'dh-spacer');
    row.appendChild(sp);
    var resetSel = h('button', 'dh-btn-ghost');
    resetSel.type = 'button';
    resetSel.id = 'dhResetSel';
    resetSel.appendChild(svg(ICON_REFRESH));
    resetSel.appendChild(document.createTextNode('RESET'));
    row.appendChild(resetSel);
    ctrl.appendChild(row);

    /* --- tab kategori --- */
    var tabs = h('div', 'dh-tabs');
    tabs.id = 'dhTabs';
    TABS.forEach(function (t) {
      var b = h('button', 'dh-tab' + (t[0] === 'all' ? ' is-on' : ''));
      b.type = 'button';
      b.dataset.k = t[0];
      b.appendChild(document.createTextNode(t[1]));
      b.appendChild(h('b', null, String(countByTag(t[0]))));
      tabs.appendChild(b);
    });
    ctrl.appendChild(tabs);

    /* --- kotak pasaran terpilih --- */
    var mbox = h('div', 'dh-market-box');
    mbox.id = 'dhMarketBox';
    mbox.style.display = 'none';
    ctrl.appendChild(mbox);

    wrap.appendChild(ctrl);

    /* --- grid + empty --- */
    var grid = h('div', 'dh-grid');
    grid.id = 'dhGrid';
    wrap.appendChild(grid);
    var empty = h('div', 'dh-empty', 'SILAKAN PILIH PASARAN TERLEBIH DAHULU');
    empty.id = 'dhEmpty';
    wrap.appendChild(empty);

    host.appendChild(wrap);

    /* simpan referensi */
    el.wrap = wrap; el.drop = drop; el.dropBtn = btn; el.dropLabel = lbl;
    el.dropPanel = panel; el.dropSearch = inp; el.dropList = list;
    el.tabs = tabs; el.mbox = mbox; el.grid = grid; el.empty = empty;
    el.statRules = st2;

    /* --- events --- */
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      state.dropOpen ? closeDrop() : openDrop();
    });
    inp.addEventListener('input', function () {
      state.dropQuery = inp.value;
      paintDropList();
    });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var first = el.dropList.querySelector('.dh-opt');
        if (first) { selectMarket(first.dataset.m); closeDrop(); }
      } else if (e.key === 'Escape') {
        closeDrop();
      }
    });
    panel.addEventListener('click', function (e) { e.stopPropagation(); });
    resetSel.addEventListener('click', function () {
      state.market = ''; state.filter = 'all';
      saveSel();
      syncTabs();
      paintAll();
    });
    tabs.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.dh-tab') : null;
      if (!b) return;
      state.filter = b.dataset.k || 'all';
      saveSel();
      syncTabs();
      paintAll();
    });

    /* tutup dropdown: klik di luar / Escape (document-level, pola prediksi-pro) */
    if (!window.__dhDropOutside) {
      window.__dhDropOutside = true;
      document.addEventListener('click', function (e) {
        var wrapEl = document.getElementById('dhDropWrap');
        if (!wrapEl) return;
        if (!wrapEl.contains(e.target)) closeDrop();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          var p = document.getElementById('dhDropPanel');
          if (p && p.style.display !== 'none') closeDrop();
        }
      });
    }
  }

  function countByTag(tag) {
    if (tag === 'all') {
      var n = 0;
      marketList().forEach(function (m) { n += ruleCount(m); });
      return n;
    }
    var c = 0;
    marketList().forEach(function (m) {
      var map = CFG[m].map;
      for (var k in map) if (tagOf(k) === tag) c++;
    });
    return c;
  }

  /* ============================================================
     7. DROPDOWN (bisa diketik utk mencari)
     ============================================================ */
  function openDrop() {
    state.dropOpen = true;
    state.dropQuery = '';
    if (el.dropSearch) el.dropSearch.value = '';
    el.drop.classList.add('is-open');
    el.dropPanel.style.display = 'block';
    paintDropList();
    try { el.dropSearch.focus(); } catch (e) { /* noop */ }
  }
  function closeDrop() {
    state.dropOpen = false;
    if (el.drop) el.drop.classList.remove('is-open');
    if (el.dropPanel) el.dropPanel.style.display = 'none';
  }
  function paintDropList() {
    var q = norm(state.dropQuery);
    var names = marketList().filter(function (m) { return !q || norm(m).indexOf(q) !== -1; });
    el.dropList.innerHTML = '';
    if (!names.length) {
      el.dropList.appendChild(h('div', 'dh-opt-none', 'Tidak ada pasaran yang cocok — "' + state.dropQuery + '"'));
      return;
    }
    names.forEach(function (m) {
      var b = h('button', 'dh-opt' + (m === state.market ? ' is-sel' : ''));
      b.type = 'button';
      b.dataset.m = m;
      b.appendChild(h('span', 'dh-opt-name', m));
      b.appendChild(h('span', 'dh-opt-chip', ruleCount(m) + ' RULES'));
      b.addEventListener('click', function () {
        selectMarket(m);
        closeDrop();
      });
      el.dropList.appendChild(b);
    });
  }

  function selectMarket(m) {
    if (!CFG[m]) return;
    state.market = m;
    saveSel();
    paintAll();
  }

  function saveSel() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ market: state.market, filter: state.filter }));
    } catch (e) { /* noop */ }
  }
  function loadSel() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      var d = JSON.parse(raw);
      if (d && CFG[d.market]) state.market = d.market;
      if (d && TABS.some(function (t) { return t[0] === d.filter; })) state.filter = d.filter;
    } catch (e) { /* noop */ }
  }

  function syncTabs() {
    if (!el.tabs) return;
    Array.prototype.forEach.call(el.tabs.querySelectorAll('.dh-tab'), function (b) {
      b.classList.toggle('is-on', (b.dataset.k || 'all') === state.filter);
    });
  }

  /* ============================================================
     8. RENDER (kotak pasaran + grid kartu)
     ============================================================ */
  function paintAll() {
    if (!el.wrap) return;
    closeDrop();
    syncTabs();
    el.dropLabel.textContent = state.market || 'PILIH PASARAN';
    el.drop.classList.toggle('is-picked', !!state.market);
    paintMarketBox();
    paintGrid();
  }

  function paintMarketBox() {
    var box = el.mbox;
    box.innerHTML = '';
    if (!state.market) { box.style.display = 'none'; return; }
    box.style.display = 'flex';

    var logoURL = MARKET_LOGOS[state.market];
    if (logoURL) {
      var img = h('img', 'dh-market-logo');
      img.src = logoURL;
      img.alt = state.market;
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      img.addEventListener('error', function () {
        var fb = h('div', 'dh-market-fallback', state.market);
        if (img.parentNode) img.parentNode.replaceChild(fb, img);
      });
      box.appendChild(img);
    } else {
      box.appendChild(h('div', 'dh-market-fallback', state.market));
    }

    var info = h('div', 'dh-market-info');
    info.appendChild(h('b', null, state.market));
    var meta = h('span');
    meta.appendChild(document.createTextNode(ruleCount(state.market) + ' ATURAN • '));
    var em = h('em', null, hasPrize(state.market) ? 'PRIZE AKTIF' : 'TANPA PRIZE');
    meta.appendChild(em);
    info.appendChild(meta);
    box.appendChild(info);
  }

  function paintGrid() {
    var grid = el.grid;
    grid.innerHTML = '';
    var has = !!state.market;
    el.empty.style.display = has ? 'none' : 'block';
    if (el.statRules) el.statRules.firstChild.textContent = has ? String(ruleCount(state.market)) : '0';
    if (!has) return;

    var map = CFG[state.market].map;
    var items = [];
    for (var k in map) {
      var tag = tagOf(k);
      if (state.filter !== 'all' && tag !== state.filter) continue;
      var d = map[k];
      items.push({ title: k, tag: tag, hadiah: d.hadiah, diskon: d.diskon, kei: d.kei });
    }
    if (!items.length) {
      el.empty.style.display = 'block';
      el.empty.textContent = 'TIDAK ADA ATURAN PADA KATEGORI INI';
      return;
    }

    var i = 0;
    if (state.filter === 'all') {
      TAG_ORDER.forEach(function (tag) {
        var sub = items.filter(function (x) { return x.tag === tag; });
        if (!sub.length) return;
        var div = h('div', 'dh-divider');
        div.appendChild(h('span', 'dh-divider-label', TAG_LABEL[tag].toUpperCase()));
        grid.appendChild(div);
        sub.forEach(function (item) {
          grid.appendChild(createCard(item, i++));
        });
      });
    } else {
      items.forEach(function (item) {
        grid.appendChild(createCard(item, i++));
      });
    }
  }

  /* ============================================================
     9. KARTU HITUNG (rumus PERSIS script asli)
     ============================================================ */
  function createCard(item, idx) {
    var card = h('div', 'dh-card');
    card.style.setProperty('--i', String(idx));

    var top = h('div', 'dh-card-top');
    top.appendChild(h('h3', 'dh-card-title', item.title));
    top.appendChild(h('span', 'dh-tag dh-tag-' + item.tag, TAG_LABEL[item.tag].toUpperCase()));
    card.appendChild(top);

    var isKei = item.kei != null;
    var meta = h('div', 'dh-meta');
    if (isKei) {
      meta.appendChild(document.createTextNode('Diskon ' + (item.diskon || 0) + '% \u00A0·\u00A0 '));
      meta.appendChild(h('span', 'dh-meta-kei', 'Kei ' + item.kei + '%'));
    } else {
      meta.appendChild(document.createTextNode('Diskon ' + (item.diskon || 0) + '% \u00A0·\u00A0 '));
      meta.appendChild(h('b', null, 'Hadiah x' + idr(item.hadiah || 0)));
    }
    card.appendChild(meta);

    var row = h('div', 'dh-row');
    var inp = h('input', 'dh-input');
    inp.type = 'number';
    inp.inputMode = 'numeric';
    inp.min = '0';
    inp.placeholder = 'NOMINAL TARUHAN';
    row.appendChild(inp);
    card.appendChild(row);

    var actions = h('div', 'dh-actions');
    var bHit = h('button', 'dh-btn', 'HITUNG');
    bHit.type = 'button';
    var bRes = h('button', 'dh-btn dh-btn-sec', 'RESET');
    bRes.type = 'button';
    actions.appendChild(bHit); actions.appendChild(bRes);
    card.appendChild(actions);

    var out = h('div', 'dh-out');
    var pPay = h('div', 'dh-pill dh-pill-pay');
    var pWin = h('div', 'dh-pill dh-pill-win');
    var pSum = h('div', 'dh-pill dh-pill-sum');
    var pMin = h('div', 'dh-pill dh-pill-min');
    out.appendChild(pPay); out.appendChild(pWin); out.appendChild(pSum); out.appendChild(pMin);
    card.appendChild(out);

    function hitung() {
      var v = parseFloat(inp.value);
      var min = isMin1000(norm(item.title)) ? 1000 : 100;
      if (isNaN(v) || v < min) {
        out.classList.add('is-show');
        pMin.style.display = 'block';
        pMin.textContent = 'MIN : ' + idr(min);
        pPay.style.display = pWin.style.display = pSum.style.display = 'none';
        return;
      }
      var bayar, menang, total;
      if (isKei) {
        var k = item.kei;
        if (k < 0) {
          var pre = v + v * Math.abs(k) / 100;
          bayar = Math.ceil(pre * (1 - (item.diskon || 0) / 100));
          menang = Math.round(v);
        } else {
          bayar = Math.round(v * (1 - (item.diskon || 0) / 100));
          menang = Math.round(v + v * (k / 100));
        }
        total = bayar + menang;
      } else {
        bayar = Math.round(v * (1 - (item.diskon || 0) / 100));
        menang = Math.round(v * (item.hadiah || 0));
        total = bayar + menang;
      }
      out.classList.add('is-show');
      pMin.style.display = 'none';
      pPay.style.display = 'block';
      pPay.textContent = 'BAYAR : ' + idr(bayar);
      pWin.style.display = 'block';
      pWin.textContent = 'MENANG : ' + idr(menang);
      var showSum = isPlusTotal(item.title) || isKei;
      pSum.style.display = showSum ? 'block' : 'none';
      pSum.textContent = 'TOTAL : ' + idr(total);
    }
    function reset() {
      inp.value = '';
      out.classList.remove('is-show');
    }

    bHit.addEventListener('click', hitung);
    bRes.addEventListener('click', reset);
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') hitung();
    });
    return card;
  }

  /* ============================================================
     10. ENTRY POINT
     ============================================================ */
  function render() {
    var host = document.getElementById('hadiahView');
    if (!host) return;
    buildShell(host);
    loadSel();
    paintAll();
  }

  /* expose */
  window.HadiahPro = {
    render: render,
    selectMarket: selectMarket,
    openDrop: openDrop,
    closeDrop: closeDrop,
    setFilter: function (f) { state.filter = f; saveSel(); syncTabs(); render(); },
    state: state,
    markets: marketList,
    cfg: CFG
  };
})();
