/* ============================================================
   AURA.OS // HADIAH-DATA.JS v1.0.0 — DATA HADIAH & MESIN PERHITUNGAN
   Sumber data: script resmi user "Hadiah Togel & Perhitungan"
   (hadiah-togel.js v96) — nilai hadiah/diskon/kei DIPERTAHANKAN
   PERSIS tanpa perubahan.
   ----------------------------------------------------------------
   Tanggung jawab modul (shared, tanpa render/DOM):
   1. DATA          : 29 pasaran -> 9 profile hadiah (sections)
   2. MARKET_LOGOS  : logo resmi pasaran (CDN) utk tampilan
   3. Overrides     : EDIT HADIAH master (localStorage per device)
   4. Copy engine   : teks copy per pasaran / gabungan dinamis
   5. Calc engine   : teks perhitungan lengkap per tipe permainan
   Dipakai oleh: hadiah-pro.js (view Hadiah Togel) dan
   pkperhitungan-pro.js (view Pk Perhitungan).
   ============================================================ */

(function () {
  'use strict';

  var DATA = {"markets":{"TOTO MACAU 4D":"macau4d","TOTO MACAU 5D":"macau5d","KINGKONG":"kingkong","BANGKOK":"standard_prize","BRUNEI":"standard_prize","CHELSEA":"standard_prize","HONGKONG":"hk_sydney","HUAHIN":"standard_prize","MAGNUM4D":"standard_prize","NEVADA":"standard_prize","POIPET":"standard_prize","SYDNEY":"hk_sydney","TOTO CAMBODIA":"standard_prize","BULLSEYE":"standard_no_prize","CALIFORNIA":"standard_no_prize","CAROLINA EVE":"standard_no_prize","CAROLINA DAY":"standard_no_prize","FLORIDA EVE":"standard_no_prize","FLORIDA MID":"standard_no_prize","KENTUCKY EVE":"standard_no_prize","KENTUCKY MID":"standard_no_prize","NEW YORK EVE":"standard_no_prize","NEW YORK MID":"standard_no_prize","OREGON":"standard_no_prize","PCSO":"standard_no_prize","SINGAPORE":"standard_prize","HOKI DRAW":"hoki","JAKARTA":"jakarta","TOTOMALI":"totomali"},"profiles":{"macau4d":{"sections":{"Diskon":[{"name":"DISKON 4D","discount":33,"reward":"6.000"},{"name":"DISKON 3D","discount":24,"reward":"700"},{"name":"DISKON 2D","discount":15,"reward":"80"},{"name":"SUPER DISKON 4D","discount":66,"reward":"3.000"},{"name":"SUPER DISKON 3D","discount":59,"reward":"400"},{"name":"SUPER DISKON 2D","discount":29,"reward":"70"}],"Bet Full":[{"name":"BET FULL 4D","discount":0,"reward":"9.000"},{"name":"BET FULL 3D","discount":0,"reward":"950"},{"name":"BET FULL 2D","discount":0,"reward":"95"}],"Tepat & BB":[{"name":"4D TEPAT","discount":0,"reward":"4.000"},{"name":"4D BB","discount":0,"reward":"200"},{"name":"3D TEPAT","discount":0,"reward":"400"},{"name":"3D BB","discount":0,"reward":"100"},{"name":"2D TEPAT","discount":0,"reward":"70"},{"name":"2D BB","discount":0,"reward":"20"}],"Lainnya":[{"name":"COLOK BEBAS","discount":0,"reward":"1.6"},{"name":"COLOK BEBAS (2 Digit)","discount":0,"reward":"3.2"},{"name":"COLOK BEBAS (3 Digit)","discount":0,"reward":"4.8"},{"name":"COLOK BEBAS (4 Digit)","discount":0,"reward":"6.4"},{"name":"COLOK JITU","discount":0,"reward":"8.3"},{"name":"MACAU SHIO","discount":0,"reward":"110"},{"name":"COLOK BEBAS 2D (2 Digit)","discount":0,"reward":"7"},{"name":"COLOK BEBAS 2D (3 Digit)","discount":0,"reward":"13"},{"name":"COLOK BEBAS 2D (4 Digit)","discount":0,"reward":"21"},{"name":"COLOK NAGA (3 Digit)","discount":0,"reward":"27"},{"name":"COLOK NAGA (4 Digit)","discount":0,"reward":"41"},{"name":"SHIO","discount":0,"reward":"10"},{"name":"KOMBINASI","discount":0,"reward":"2.8"},{"name":"50 - 50","discount":0,"kei":"-5%"},{"name":"TENGAH TEPI","discount":0,"kei":"-2.2%"},{"name":"SILANG HOMO","discount":0,"kei":"-2.2%"},{"name":"KEMBANG - KEMPIS - KEMBAR","discount":0,"kei":"-2.2%"},{"name":"DASAR GANJIL - BESAR","discount":0,"kei":"-25%"},{"name":"DASAR GENAP - KECIL","discount":0,"kei":"+10%"}]}},"macau5d":{"sections":{"Diskon":[{"name":"DISKON 5D","discount":38,"reward":"50.000"},{"name":"DISKON 4D","discount":20,"reward":"7.000"},{"name":"DISKON 3D","discount":20,"reward":"750"},{"name":"DISKON 2D","discount":20,"reward":"75"}],"Bet Full":[{"name":"BET FULL 5D","discount":0,"reward":"88.000"},{"name":"BET FULL 4D","discount":0,"reward":"9.000"},{"name":"BET FULL 3D","discount":0,"reward":"950"},{"name":"BET FULL 2D","discount":0,"reward":"95"}],"Tepat & BB":[{"name":"5D TEPAT","discount":0,"reward":"50.000"},{"name":"5D BB","discount":0,"reward":"350"},{"name":"4D TEPAT","discount":0,"reward":"5.000"},{"name":"4D BB","discount":0,"reward":"180"},{"name":"3D TEPAT","discount":0,"reward":"500"},{"name":"3D BB","discount":0,"reward":"75"},{"name":"2D TEPAT","discount":0,"reward":"80"},{"name":"2D BB","discount":0,"reward":"15"}],"Lainnya":[{"name":"COLOK BEBAS","discount":0,"reward":"0.9"},{"name":"COLOK BEBAS (2 Digit)","discount":0,"reward":"1.8"},{"name":"COLOK BEBAS (3 Digit)","discount":0,"reward":"2.7"},{"name":"COLOK BEBAS (4 Digit)","discount":0,"reward":"3.6"},{"name":"COLOK BEBAS (5)","discount":0,"reward":"4.5"},{"name":"COLOK JITU","discount":0,"reward":"8"},{"name":"COLOK BEBAS 2D (2 Digit)","discount":0,"reward":"4"},{"name":"COLOK BEBAS 2D (3 Digit)","discount":0,"reward":"6"},{"name":"COLOK BEBAS 2D (4 Digit)","discount":0,"reward":"20"},{"name":"COLOK BEBAS 2D (5)","discount":0,"reward":"200"},{"name":"COLOK BEBAS 4D (4)","discount":0,"reward":"50"},{"name":"COLOK BEBAS 4D (5)","discount":0,"reward":"200"},{"name":"COLOK NAGA (3 Digit)","discount":0,"reward":"12"},{"name":"COLOK NAGA (4 Digit)","discount":0,"reward":"30"},{"name":"COLOK NAGA (5)","discount":0,"reward":"125"},{"name":"SHIO","discount":0,"reward":"10"},{"name":"KOMBINASI","discount":0,"reward":"2.7"},{"name":"50 - 50","discount":0,"kei":"-2.2%"},{"name":"TENGAH TEPI","discount":0,"kei":"-2.2%"},{"name":"DASAR GANJIL - BESAR","discount":0,"kei":"-25%"},{"name":"DASAR GENAP - KECIL","discount":0,"kei":"+10%"}]}},"kingkong":{"sections":{"Diskon":[{"name":"DISKON 4D","discount":33,"reward":"6.000"},{"name":"DISKON 3D","discount":24,"reward":"700"},{"name":"DISKON 2D","discount":15,"reward":"80"}],"Bet Full":[{"name":"BET FULL 4D","discount":0,"reward":"9.000"},{"name":"BET FULL 3D","discount":0,"reward":"950"},{"name":"BET FULL 2D","discount":0,"reward":"95"}],"Tepat & BB":[{"name":"4D TEPAT","discount":0,"reward":"4.000"},{"name":"4D BB","discount":0,"reward":"200"},{"name":"3D TEPAT","discount":0,"reward":"400"},{"name":"3D BB","discount":0,"reward":"100"},{"name":"2D TEPAT","discount":0,"reward":"70"},{"name":"2D BB","discount":0,"reward":"20"}],"Lainnya":[{"name":"COLOK BEBAS","discount":0,"reward":"1.6"},{"name":"COLOK BEBAS (2 Digit)","discount":0,"reward":"3.2"},{"name":"COLOK BEBAS (3 Digit)","discount":0,"reward":"4.8"},{"name":"COLOK BEBAS (4 Digit)","discount":0,"reward":"6.4"},{"name":"COLOK JITU","discount":0,"reward":"8.3"},{"name":"MACAU SHIO","discount":0,"reward":"110"},{"name":"COLOK BEBAS 2D (2 Digit)","discount":0,"reward":"7"},{"name":"COLOK BEBAS 2D (3 Digit)","discount":0,"reward":"13"},{"name":"COLOK BEBAS 2D (4 Digit)","discount":0,"reward":"21"},{"name":"COLOK NAGA (3 Digit)","discount":0,"reward":"27"},{"name":"COLOK NAGA (4 Digit)","discount":0,"reward":"41"},{"name":"SHIO","discount":0,"reward":"10"},{"name":"KOMBINASI","discount":0,"reward":"2.8"},{"name":"50 - 50","discount":0,"kei":"-5%"},{"name":"SILANG HOMO","discount":0,"kei":"-2.2%"},{"name":"TENGAH TEPI","discount":0,"kei":"-2.2%"},{"name":"KEMBANG - KEMPIS","discount":0,"kei":"-2.2%"},{"name":"KEMBAR","discount":0,"kei":"+50%"},{"name":"DASAR GANJIL - BESAR","discount":0,"kei":"-25%"},{"name":"DASAR GENAP - KECIL","discount":0,"kei":"+10%"}]}},"standard_prize":{"sections":{"Diskon":[{"name":"DISKON 4D","discount":66,"reward":"3.000"},{"name":"DISKON 3D","discount":59,"reward":"400"},{"name":"DISKON 2D","discount":29,"reward":"70"},{"name":"DISKON 2D DEPAN","discount":29,"reward":"65"},{"name":"DISKON 2D TENGAH","discount":29,"reward":"65"}],"Bet Full":[{"name":"BET FULL 4D","discount":0,"reward":"10.000"},{"name":"BET FULL 3D","discount":0,"reward":"1.000"},{"name":"BET FULL 2D","discount":0,"reward":"100"}],"Prize":[{"name":"PRIZE 1 - 1","discount":0,"reward":"6.500"},{"name":"PRIZE 1 - 2","discount":0,"reward":"650"},{"name":"PRIZE 1 - 3","discount":0,"reward":"70"},{"name":"PRIZE 2 - 1","discount":0,"reward":"2.100"},{"name":"PRIZE 2 - 2","discount":0,"reward":"210"},{"name":"PRIZE 2 - 3","discount":0,"reward":"20"},{"name":"PRIZE 3 - 1","discount":0,"reward":"1.100"},{"name":"PRIZE 3 - 2","discount":0,"reward":"110"},{"name":"PRIZE 3 - 3","discount":0,"reward":"8"}],"Tepat & BB":[{"name":"4D TEPAT","discount":0,"reward":"4.000"},{"name":"4D BB","discount":0,"reward":"200"},{"name":"3D TEPAT","discount":0,"reward":"400"},{"name":"3D BB","discount":0,"reward":"100"},{"name":"2D TEPAT","discount":0,"reward":"70"},{"name":"2D BB","discount":0,"reward":"20"}],"Lainnya":[{"name":"COLOK BEBAS","discount":6,"reward":"1.5"},{"name":"COLOK BEBAS (2 Digit)","discount":6,"reward":"3"},{"name":"COLOK BEBAS (3 Digit)","discount":6,"reward":"4.5"},{"name":"COLOK BEBAS (4 Digit)","discount":6,"reward":"6"},{"name":"COLOK JITU","discount":6,"reward":"8"},{"name":"MACAU SHIO","discount":10,"reward":"110"},{"name":"COLOK BEBAS 2D (2 Digit)","discount":10,"reward":"7"},{"name":"COLOK BEBAS 2D (3 Digit)","discount":10,"reward":"11"},{"name":"COLOK BEBAS 2D (4 Digit)","discount":10,"reward":"18"},{"name":"COLOK NAGA (3 Digit)","discount":10,"reward":"23"},{"name":"COLOK NAGA (4 Digit)","discount":10,"reward":"35"},{"name":"SHIO","discount":5,"reward":"9.5"},{"name":"KOMBINASI","discount":8,"reward":"2.6"},{"name":"50 - 50","discount":2,"kei":"-3%"},{"name":"TENGAH TEPI","discount":2,"kei":"-3%"},{"name":"SILANG HOMO","discount":2,"kei":"-3%"},{"name":"KEMBANG - KEMPIS - KEMBAR","discount":2,"kei":"-3%"},{"name":"DASAR GANJIL - BESAR","discount":2,"kei":"-25%"},{"name":"DASAR GENAP - KECIL","discount":2,"kei":"+10%"}]}},"hk_sydney":{"sections":{"Diskon":[{"name":"DISKON 4D","discount":66,"reward":"3.000"},{"name":"DISKON 3D","discount":59,"reward":"400"},{"name":"DISKON 2D","discount":29,"reward":"70"},{"name":"DISKON 2D DEPAN","discount":29,"reward":"65"},{"name":"DISKON 2D TENGAH","discount":29,"reward":"65"}],"Bet Full":[{"name":"BET FULL 4D","discount":0,"reward":"9.800"},{"name":"BET FULL 3D","discount":0,"reward":"980"},{"name":"BET FULL 2D","discount":0,"reward":"98"}],"Prize":[{"name":"PRIZE 1 - 1","discount":0,"reward":"6.500"},{"name":"PRIZE 1 - 2","discount":0,"reward":"650"},{"name":"PRIZE 1 - 3","discount":0,"reward":"70"},{"name":"PRIZE 2 - 1","discount":0,"reward":"2.100"},{"name":"PRIZE 2 - 2","discount":0,"reward":"210"},{"name":"PRIZE 2 - 3","discount":0,"reward":"20"},{"name":"PRIZE 3 - 1","discount":0,"reward":"1.100"},{"name":"PRIZE 3 - 2","discount":0,"reward":"110"},{"name":"PRIZE 3 - 3","discount":0,"reward":"8"}],"Tepat & BB":[{"name":"4D TEPAT","discount":0,"reward":"4.000"},{"name":"4D BB","discount":0,"reward":"200"},{"name":"3D TEPAT","discount":0,"reward":"400"},{"name":"3D BB","discount":0,"reward":"100"},{"name":"2D TEPAT","discount":0,"reward":"70"},{"name":"2D BB","discount":0,"reward":"20"}],"Lainnya":[{"name":"COLOK BEBAS","discount":6,"reward":"1.5"},{"name":"COLOK BEBAS (2 Digit)","discount":6,"reward":"3"},{"name":"COLOK BEBAS (3 Digit)","discount":6,"reward":"4.5"},{"name":"COLOK BEBAS (4 Digit)","discount":6,"reward":"6"},{"name":"COLOK JITU","discount":6,"reward":"8"},{"name":"MACAU SHIO","discount":10,"reward":"110"},{"name":"COLOK BEBAS 2D (2 Digit)","discount":10,"reward":"7"},{"name":"COLOK BEBAS 2D (3 Digit)","discount":10,"reward":"11"},{"name":"COLOK BEBAS 2D (4 Digit)","discount":10,"reward":"18"},{"name":"COLOK NAGA (3 Digit)","discount":10,"reward":"23"},{"name":"COLOK NAGA (4 Digit)","discount":10,"reward":"35"},{"name":"SHIO","discount":5,"reward":"9.5"},{"name":"KOMBINASI","discount":8,"reward":"2.6"},{"name":"50 - 50","discount":2,"kei":"-3%"},{"name":"TENGAH TEPI","discount":2,"kei":"-3%"},{"name":"SILANG HOMO","discount":2,"kei":"-3%"},{"name":"KEMBANG - KEMPIS - KEMBAR","discount":2,"kei":"-3%"},{"name":"DASAR GANJIL - BESAR","discount":2,"kei":"-25%"},{"name":"DASAR GENAP - KECIL","discount":2,"kei":"+10%"}]}},"totomali":{"sections":{"Diskon":[{"name":"DISKON 4D","discount":67,"reward":"3.000"},{"name":"DISKON 3D","discount":57,"reward":"400"},{"name":"DISKON 2D","discount":27,"reward":"70"}],"Bet Full":[{"name":"BET FULL 4D","discount":0,"reward":"10.000"},{"name":"BET FULL 3D","discount":0,"reward":"1.000"},{"name":"BET FULL 2D","discount":0,"reward":"100"}],"Prize":[{"name":"PRIZE 1 - 1","discount":0,"reward":"6.500"},{"name":"PRIZE 1 - 2","discount":0,"reward":"650"},{"name":"PRIZE 1 - 3","discount":0,"reward":"70"},{"name":"PRIZE 2 - 1","discount":0,"reward":"2.100"},{"name":"PRIZE 2 - 2","discount":0,"reward":"210"},{"name":"PRIZE 2 - 3","discount":0,"reward":"20"},{"name":"PRIZE 3 - 1","discount":0,"reward":"1.100"},{"name":"PRIZE 3 - 2","discount":0,"reward":"110"},{"name":"PRIZE 3 - 3","discount":0,"reward":"8"}],"Tepat & BB":[{"name":"4D TEPAT","discount":0,"reward":"4.000"},{"name":"4D BB","discount":0,"reward":"200"},{"name":"3D TEPAT","discount":0,"reward":"400"},{"name":"3D BB","discount":0,"reward":"100"},{"name":"2D TEPAT","discount":0,"reward":"70"},{"name":"2D BB","discount":0,"reward":"20"}],"Lainnya":[{"name":"COLOK BEBAS","discount":6,"reward":"1.6"},{"name":"COLOK BEBAS (2 Digit)","discount":6,"reward":"3.2"},{"name":"COLOK BEBAS (3 Digit)","discount":6,"reward":"4.8"},{"name":"COLOK BEBAS (4 Digit)","discount":6,"reward":"6.4"},{"name":"COLOK JITU","discount":6,"reward":"8.3"},{"name":"MACAU SHIO","discount":10,"reward":"110"},{"name":"COLOK BEBAS 2D (2 Digit)","discount":10,"reward":"7"},{"name":"COLOK BEBAS 2D (3 Digit)","discount":10,"reward":"13"},{"name":"COLOK BEBAS 2D (4 Digit)","discount":10,"reward":"21"},{"name":"COLOK NAGA (3 Digit)","discount":10,"reward":"27"},{"name":"COLOK NAGA (4 Digit)","discount":10,"reward":"41"},{"name":"SHIO","discount":5,"reward":"9.5"},{"name":"KOMBINASI","discount":8,"reward":"2.8"},{"name":"50 - 50","discount":2,"kei":"-5%"},{"name":"TENGAH TEPI","discount":2,"kei":"-2.2%"},{"name":"SILANG HOMO","discount":2,"kei":"-2.2%"},{"name":"KEMBANG - KEMPIS - KEMBAR","discount":2,"kei":"-2.2%"},{"name":"DASAR GANJIL - BESAR","discount":2,"kei":"-25%"},{"name":"DASAR GENAP - KECIL","discount":2,"kei":"+10%"}]}},"standard_no_prize":{"sections":{"Diskon":[{"name":"DISKON 4D","discount":66,"reward":"3.000"},{"name":"DISKON 3D","discount":59,"reward":"400"},{"name":"DISKON 2D","discount":29,"reward":"70"},{"name":"DISKON 2D DEPAN","discount":29,"reward":"65"},{"name":"DISKON 2D TENGAH","discount":29,"reward":"65"}],"Bet Full":[{"name":"BET FULL 4D","discount":0,"reward":"10.000"},{"name":"BET FULL 3D","discount":0,"reward":"1.000"},{"name":"BET FULL 2D","discount":0,"reward":"100"}],"Tepat & BB":[{"name":"4D TEPAT","discount":0,"reward":"4.000"},{"name":"4D BB","discount":0,"reward":"200"},{"name":"3D TEPAT","discount":0,"reward":"400"},{"name":"3D BB","discount":0,"reward":"100"},{"name":"2D TEPAT","discount":0,"reward":"70"},{"name":"2D BB","discount":0,"reward":"20"}],"Lainnya":[{"name":"COLOK BEBAS","discount":6,"reward":"1.5"},{"name":"COLOK BEBAS (2 Digit)","discount":6,"reward":"3"},{"name":"COLOK BEBAS (3 Digit)","discount":6,"reward":"4.5"},{"name":"COLOK BEBAS (4 Digit)","discount":6,"reward":"6"},{"name":"COLOK JITU","discount":6,"reward":"8"},{"name":"MACAU SHIO","discount":10,"reward":"110"},{"name":"COLOK BEBAS 2D (2 Digit)","discount":10,"reward":"7"},{"name":"COLOK BEBAS 2D (3 Digit)","discount":10,"reward":"11"},{"name":"COLOK BEBAS 2D (4 Digit)","discount":10,"reward":"18"},{"name":"COLOK NAGA (3 Digit)","discount":10,"reward":"23"},{"name":"COLOK NAGA (4 Digit)","discount":10,"reward":"35"},{"name":"SHIO","discount":5,"reward":"9.5"},{"name":"KOMBINASI","discount":8,"reward":"2.6"},{"name":"50 - 50","discount":2,"kei":"-3%"},{"name":"TENGAH TEPI","discount":2,"kei":"-3%"},{"name":"SILANG HOMO","discount":2,"kei":"-3%"},{"name":"KEMBANG - KEMPIS - KEMBAR","discount":2,"kei":"-3%"},{"name":"DASAR GANJIL - BESAR","discount":2,"kei":"-25%"},{"name":"DASAR GENAP - KECIL","discount":2,"kei":"+10%"}]}},"hoki":{"sections":{"Diskon":[{"name":"DISKON 4D","discount":20,"reward":"7.000"},{"name":"DISKON 3D","discount":20,"reward":"750"},{"name":"DISKON 2D","discount":20,"reward":"75"}],"Bet Full":[{"name":"BET FULL 4D","discount":0,"reward":"10.000"},{"name":"BET FULL 3D","discount":0,"reward":"1.000"},{"name":"BET FULL 2D","discount":0,"reward":"100"}],"Tepat & BB":[{"name":"4D TEPAT","discount":0,"reward":"5.000"},{"name":"4D BB","discount":0,"reward":"180"},{"name":"3D TEPAT","discount":0,"reward":"500"},{"name":"3D BB","discount":0,"reward":"75"},{"name":"2D TEPAT","discount":0,"reward":"80"},{"name":"2D BB","discount":0,"reward":"15"}],"Lainnya":[{"name":"COLOK BEBAS","discount":6,"reward":"0.9"},{"name":"COLOK BEBAS (2 Digit)","discount":6,"reward":"1.8"},{"name":"COLOK BEBAS (3 Digit)","discount":6,"reward":"2.7"},{"name":"COLOK BEBAS (4 Digit)","discount":6,"reward":"3.6"},{"name":"COLOK JITU","discount":6,"reward":"8"},{"name":"MACAU SHIO","discount":10,"reward":"110"},{"name":"COLOK BEBAS 2D (2 Digit)","discount":10,"reward":"4"},{"name":"COLOK BEBAS 2D (3 Digit)","discount":10,"reward":"6"},{"name":"COLOK BEBAS 2D (4 Digit)","discount":10,"reward":"20"},{"name":"COLOK NAGA (3 Digit)","discount":10,"reward":"12"},{"name":"COLOK NAGA (4 Digit)","discount":10,"reward":"30"},{"name":"SHIO","discount":5,"reward":"9.5"},{"name":"KOMBINASI","discount":8,"reward":"2.7"},{"name":"50 - 50","discount":2,"kei":"-2.2%"},{"name":"TENGAH TEPI","discount":2,"kei":"-2.2%"},{"name":"SILANG HOMO","discount":2,"kei":"-3%"},{"name":"KEMBANG - KEMPIS - KEMBAR","discount":2,"kei":"-3%"},{"name":"DASAR GANJIL - BESAR","discount":2,"kei":"-25%"},{"name":"DASAR GENAP - KECIL","discount":2,"kei":"+10%"}]}},"jakarta":{"sections":{"Diskon":[{"name":"DISKON 4D","discount":66,"reward":"3.000"},{"name":"DISKON 3D","discount":59,"reward":"400"},{"name":"DISKON 2D","discount":29,"reward":"70"}],"Bet Full":[{"name":"BET FULL 4D","discount":0,"reward":"10.000"},{"name":"BET FULL 3D","discount":0,"reward":"1.000"},{"name":"BET FULL 2D","discount":0,"reward":"100"}],"Tepat & BB":[{"name":"4D TEPAT","discount":0,"reward":"4.000"},{"name":"4D BB","discount":0,"reward":"200"},{"name":"3D TEPAT","discount":0,"reward":"400"},{"name":"3D BB","discount":0,"reward":"100"},{"name":"2D TEPAT","discount":0,"reward":"70"},{"name":"2D BB","discount":0,"reward":"20"}],"Lainnya":[{"name":"COLOK BEBAS","discount":6,"reward":"1.6"},{"name":"COLOK BEBAS (2 Digit)","discount":6,"reward":"3.2"},{"name":"COLOK BEBAS (3 Digit)","discount":6,"reward":"4.8"},{"name":"COLOK BEBAS (4 Digit)","discount":6,"reward":"6.4"},{"name":"COLOK JITU","discount":6,"reward":"8.3"},{"name":"MACAU SHIO","discount":10,"reward":"110"},{"name":"COLOK BEBAS 2D (2 Digit)","discount":10,"reward":"7"},{"name":"COLOK BEBAS 2D (3 Digit)","discount":10,"reward":"13"},{"name":"COLOK BEBAS 2D (4 Digit)","discount":10,"reward":"21"},{"name":"COLOK NAGA (3 Digit)","discount":10,"reward":"27"},{"name":"COLOK NAGA (4 Digit)","discount":10,"reward":"41"},{"name":"SHIO","discount":5,"reward":"9.5"},{"name":"KOMBINASI","discount":8,"reward":"2.8"},{"name":"50 - 50","discount":2,"kei":"-5%"},{"name":"TENGAH TEPI","discount":2,"kei":"-2.2%"},{"name":"SILANG HOMO","discount":2,"kei":"-2.2%"},{"name":"KEMBANG - KEMPIS - KEMBAR","discount":2,"kei":"-2.2%"},{"name":"DASAR GANJIL - BESAR","discount":2,"kei":"-25%"},{"name":"DASAR GENAP - KECIL","discount":2,"kei":"+10%"}]}}}};

  /* ============================================================
     2. KONSTANTA GRUP PASARAN (persis script asli user)
     ============================================================ */
  var SPECIAL_GROUP_NAMES = {"macau4d":"TOTO MACAU 4D","macau5d":"TOTO MACAU 5D","kingkong":"KINGKONG","hk_sydney":"HONGKONG / SYDNEY","totomali":"TOTOMALI","hoki":"HOKI DRAW","jakarta":"JAKARTA"};
  var COMMON_MAIN_MARKETS = ["BANGKOK", "BRUNEI", "CHELSEA", "HUAHIN", "MAGNUM4D", "NEVADA", "POIPET", "TOTO CAMBODIA", "BULLSEYE", "CALIFORNIA", "CAROLINA EVE", "CAROLINA DAY", "FLORIDA EVE", "FLORIDA MID", "KENTUCKY EVE", "KENTUCKY MID", "NEW YORK EVE", "NEW YORK MID", "OREGON", "PCSO", "SINGAPORE"];
  var COMMON_EXCLUDED_MARKETS = ["TOTO MACAU 4D", "TOTO MACAU 5D", "KINGKONG", "HONGKONG", "SYDNEY", "TOTOMALI", "HOKI DRAW", "JAKARTA"];
  var PRIZE_MARKETS = ["BANGKOK", "BRUNEI", "CHELSEA", "HONGKONG", "HUAHIN", "MAGNUM4D", "NEVADA", "POIPET", "SYDNEY", "TOTO CAMBODIA", "SINGAPORE", "TOTOMALI"];
  var SECTION_ORDER = ["Diskon","Bet Full","Prize","Tepat & BB","Lainnya"];

  /* ============================================================
     3. LOGO PASARAN (CDN resmi — dipakai sebagai fallback identitas)
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
     4. OVERRIDE ENGINE — hasil EDIT HADIAH (master, per device)
     ============================================================ */
  var OVERRIDE_KEY = 'hadiah_market_overrides_v1';
  var MARKET_OVERRIDES = loadMarketOverrides();

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadMarketOverrides() {
    try {
      var raw = localStorage.getItem(OVERRIDE_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch (err) {
      return {};
    }
  }

  function saveMarketOverrides() {
    try {
      localStorage.setItem(OVERRIDE_KEY, JSON.stringify(MARKET_OVERRIDES));
    } catch (err) { /* noop */ }
  }

  function allMarkets() {
    return Object.keys(DATA.markets);
  }

  function profileKeyFor(market) {
    return DATA.markets[market];
  }

  function profileFor(market) {
    return DATA.profiles[DATA.markets[market]];
  }

  /* sections pasaran = override (bila master pernah edit) -> profile asli */
  function sectionsFor(market) {
    if (MARKET_OVERRIDES[market]) return MARKET_OVERRIDES[market];
    var p = profileFor(market);
    return p ? p.sections : {};
  }

  function hasOverride(market) {
    return !!MARKET_OVERRIDES[market];
  }

  function applyOverride(market, sections) {
    MARKET_OVERRIDES[market] = sections;
    saveMarketOverrides();
  }

  function resetOverride(market) {
    delete MARKET_OVERRIDES[market];
    saveMarketOverrides();
  }

  /* ============================================================
     5. HELPER UMUM
     ============================================================ */
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function copyTitleCase(value) {
    var s = String(value == null ? '' : value).toLowerCase();
    s = s.replace(/\b[a-z]/g, function (ch) { return ch.toUpperCase(); });
    s = s
      .replace(/(\d+)d\b/gi, function (_, n) { return n + 'D'; })
      .replace(/\bBb\b/g, 'BB')
      .replace(/\bKei\b/g, 'Kei');
    return s;
  }

  function normName(value) {
    return String(value || '').toUpperCase().replace(/\s+/g, ' ').trim();
  }

  function rp(value) {
    var n = Number(value || 0);
    return 'Rp.' + Math.round(n).toLocaleString('id-ID');
  }

  /* "6.000" -> 6000 (ribuan) ; "1.5" -> 1.5 (desimal) — persis script asli */
  function parseRewardMultiplier(value) {
    var raw = String(value == null ? '' : value).trim();
    if (!raw) return 0;
    if (/^\d{1,3}(?:\.\d{3})+$/.test(raw)) {
      return Number(raw.replace(/\./g, ''));
    }
    var normalized = raw.replace(',', '.');
    var n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
  }

  function calcDiscountReward(bet, discount, reward) {
    var bayar = bet * (1 - discount / 100);
    var hadiah = bet * reward;
    return { bayar: bayar, hadiah: hadiah, total: bayar + hadiah };
  }

  /* kei minus: hasil kei dibulatkan ke ATAS lalu dipotong diskon (persis asli) */
  function negativeKeiCalc(bet, keiAbs, discount) {
    var hasilKei = Math.ceil(bet + bet * (keiAbs / 100));
    var bayar = Math.ceil((bet + bet * (keiAbs / 100)) * (1 - discount / 100));
    var total = Math.ceil(bet + ((bet + bet * (keiAbs / 100)) * (1 - discount / 100)));
    return { hasilKei: hasilKei, bayar: bayar, total: total };
  }

  /* ============================================================
     6. COPY ENGINE — teks item / pasaran / gabungan dinamis
     ============================================================ */
  function itemLine(item) {
    var s = copyTitleCase(item.name) + ' | Diskon: ' + item.discount + '%';
    if (item.reward !== undefined) s += ' | Hadiah: x' + item.reward;
    if (item.kei !== undefined) s += ' | Kei: ' + item.kei;
    return s;
  }

  function sectionText(name, items) {
    var lines = ['=== ' + name + ' ==='];
    items.forEach(function (item) { lines.push(itemLine(item)); });
    return lines.join('\n');
  }

  function prizeCopyLines(items) {
    var groups = {
      '1': { title: 'Prize 1', rows: [] },
      '2': { title: 'Prize 2', rows: [] },
      '3': { title: 'Prize 3', rows: [] }
    };
    var digitMap = { '1': '4D', '2': '3D', '3': '2D' };

    items.forEach(function (item) {
      var match = String(item.name || '').match(/PRIZE\s*(\d+)\s*-\s*(\d+)/i);
      if (!match || !groups[match[1]]) return;
      groups[match[1]].rows.push({
        digit: digitMap[match[2]] || (match[2] + 'D'),
        discount: item.discount,
        reward: item.reward
      });
    });

    var lines = ['=== Prize ==='];
    ['1', '2', '3'].forEach(function (key) {
      var group = groups[key];
      if (!group.rows.length) return;
      lines.push(group.title);
      group.rows.forEach(function (row) {
        lines.push(row.digit + ' | Diskon: ' + row.discount + '% | Hadiah: x' + row.reward);
      });
      lines.push('');
    });

    if (lines[lines.length - 1] === '') lines.pop();
    return lines;
  }

  function marketText(market) {
    var sections = sectionsFor(market);
    var lines = [market, ''];

    SECTION_ORDER.forEach(function (sectionName) {
      if (!sections[sectionName]) return;
      if (sectionName === 'Prize') {
        var pl = prizeCopyLines(sections[sectionName]);
        lines.push.apply(lines, pl);
        lines.push('');
        return;
      }
      lines.push(sectionText(sectionName, sections[sectionName]));
      lines.push('');
    });

    return lines.join('\n').trim();
  }

  /* ---- gabungan dinamis: pasaran bernilai identik otomatis satu grup ---- */
  var COPY_NON_PRIZE_SECTIONS = ['Diskon', 'Bet Full', 'Tepat & BB', 'Lainnya'];

  function normalizedCopyValue(field, value) {
    if (field === 'reward') return parseRewardMultiplier(value);
    if (field === 'discount') {
      var n = Number(value || 0);
      return Number.isFinite(n) ? n : 0;
    }
    if (field === 'kei') {
      var k = parseFloat(String(value == null ? '' : value).replace('%', ''));
      return Number.isFinite(k) ? k : null;
    }
    return String(value == null ? '' : value).trim().toUpperCase();
  }

  function sectionSignatureForMarket(market, sectionNames) {
    var sections = sectionsFor(market);
    var normalized = sectionNames.map(function (sectionName) {
      var items = sections[sectionName] || [];
      return {
        section: sectionName,
        items: items.map(function (item) {
          return {
            name: normalizedCopyValue('name', item.name),
            discount: normalizedCopyValue('discount', item.discount),
            reward: item.reward === undefined ? null : normalizedCopyValue('reward', item.reward),
            kei: item.kei === undefined ? null : normalizedCopyValue('kei', item.kei)
          };
        })
      };
    });
    return JSON.stringify(normalized);
  }

  function groupMarketsByCurrentValues(markets, sectionNames) {
    var groupsBySignature = new Map();
    markets.forEach(function (market) {
      var signature = sectionSignatureForMarket(market, sectionNames);
      if (!groupsBySignature.has(signature)) {
        groupsBySignature.set(signature, { signature: signature, markets: [], sampleMarket: market });
      }
      groupsBySignature.get(signature).markets.push(market);
    });
    return Array.from(groupsBySignature.values());
  }

  function nonPrizeGroupText(group) {
    var sections = sectionsFor(group.sampleMarket);
    var lines = [];
    if (group.markets.length === 1) {
      lines.push('Hadiah pasaran ' + group.markets[0]);
    } else {
      lines.push('Hadiah pasaran gabungan');
    }
    lines.push('');
    lines.push('Pasaran yang menggunakan hadiah ini:');
    lines.push(group.markets.join(' / '));
    lines.push('');
    COPY_NON_PRIZE_SECTIONS.forEach(function (sectionName) {
      var items = sections[sectionName];
      if (!items || !items.length) return;
      lines.push(sectionText(sectionName, items));
      lines.push('');
    });
    return lines.join('\n').trim();
  }

  function prizeGroupText(group) {
    var sections = sectionsFor(group.sampleMarket);
    var prizeItems = sections['Prize'] || [];
    var lines = [
      'Hadiah khusus Prize 1, Prize 2 & Prize 3',
      '',
      'Pasaran yang menggunakan hadiah Prize ini:',
      group.markets.join(' / '),
      ''
    ];
    var pl = prizeCopyLines(prizeItems);
    lines.push.apply(lines, pl);
    return lines.join('\n').trim();
  }

  function allGroupsText() {
    var all = allMarkets();
    var nonPrizeGroups = groupMarketsByCurrentValues(all, COPY_NON_PRIZE_SECTIONS);
    var marketsWithPrize = all.filter(function (market) {
      var prize = sectionsFor(market)['Prize'];
      return Array.isArray(prize) && prize.length > 0;
    });
    var prizeGroups = groupMarketsByCurrentValues(marketsWithPrize, ['Prize']);
    var blocks = [];
    nonPrizeGroups.forEach(function (g) { blocks.push(nonPrizeGroupText(g)); });
    prizeGroups.forEach(function (g) { blocks.push(prizeGroupText(g)); });
    return blocks.join('\n\n========================================\n\n');
  }

  /* ============================================================
     7. CALC ENGINE — teks perhitungan per tipe (data-driven,
        mengikuti rumus & format kalimat PERSIS script asli user)
     ============================================================ */
  var COMMON_CALC_TYPES = [
    'Diskon', 'Full', 'Bolak Balik', 'Colok Bebas', 'Colok Bebas 2D',
    'Colok Naga', 'Colok Jitu', 'Shio', 'Macau Shio', 'Kombinasi',
    '50-50', 'Silang Homo', 'Tengah Tepi', 'Kembang - Kempis - Kembar', 'Dasar'
  ];

  var KINGKONG_CALC_TYPES = [
    'Diskon', 'Full', 'Bolak Balik', 'Colok Bebas', 'Colok Bebas 2D',
    'Colok Naga', 'Colok Jitu', 'Shio', 'Macau Shio', 'Kombinasi',
    '50-50', 'Silang Homo', 'Tengah Tepi', 'Kembang - Kempis', 'Kembar', 'Dasar'
  ];

  var MACAU4D_CALC_TYPES = [
    'Diskon', 'Super Diskon', 'Full', 'Bolak Balik', 'Colok Bebas', 'Colok Bebas 2D',
    'Colok Naga', 'Colok Jitu', 'Macau Shio', 'Shio', 'Kombinasi', '50-50',
    'Silang Homo', 'Tengah Tepi', 'Kembang - Kempis - Kembar', 'Dasar'
  ];

  var MACAU5D_CALC_TYPES = [
    'Diskon', 'Full', 'Bolak Balik', 'Colok Bebas', 'Colok Bebas 2D', 'Colok Bebas 4D',
    'Colok Naga', 'Colok Jitu', 'Shio', 'Kombinasi', '50-50', 'Tengah Tepi', 'Dasar'
  ];

  var PROFILE_CALC_TYPES = [
    'Diskon', 'Full', 'Bolak Balik', 'Colok Bebas', 'Colok Bebas 2D', 'Colok Naga',
    'Colok Jitu', 'Macau Shio', 'Shio', 'Kombinasi', '50-50', 'Silang Homo',
    'Tengah Tepi', 'Kembang - Kempis - Kembar', 'Dasar'
  ];

  /* pasaran Prize: chip "Prize" disisipkan setelah "Full" (persis asli) */
  function calcTypesForMarket(baseTypes, market) {
    var types = baseTypes.slice();
    if (PRIZE_MARKETS.indexOf(market) !== -1 && types.indexOf('Prize') === -1) {
      var fullIndex = types.indexOf('Full');
      if (fullIndex >= 0) types.splice(fullIndex + 1, 0, 'Prize');
      else types.unshift('Prize');
    }
    return types;
  }

  function marketCalcTypes(market) {
    var base;
    if (market === 'KINGKONG') base = KINGKONG_CALC_TYPES;
    else if (market === 'TOTO MACAU 4D') base = MACAU4D_CALC_TYPES;
    else if (market === 'TOTO MACAU 5D') base = MACAU5D_CALC_TYPES;
    else if (market === 'TOTOMALI' || market === 'HOKI DRAW' || market === 'JAKARTA') base = PROFILE_CALC_TYPES;
    else base = COMMON_CALC_TYPES;
    return calcTypesForMarket(base, market);
  }

  function items(market, sectionName) {
    var sections = sectionsFor(market);
    return sections[sectionName] || [];
  }

  function rewardLines(lines, bet, market, title, list, options) {
    var opts = options || {};
    var showTotal = opts.showTotal !== false;

    lines.push('Jika Anda Betting Tipe ' + title + ' ' + market + ' Dengan Nominal ' + rp(bet) + ':');

    list.forEach(function (item) {
      var discount = Number(item.discount || 0);
      var reward = parseRewardMultiplier(item.reward);
      var rewardLabel = String(item.reward != null ? item.reward : reward);
      var c = calcDiscountReward(bet, discount, reward);

      lines.push('');
      lines.push(copyTitleCase(item.name));
      lines.push('- Diskon = ' + discount + '%');
      lines.push('- Hadiah = x' + rewardLabel);
      lines.push('- Bettingan - (Bettingan x Diskon) = ' + rp(bet) + ' - (' + rp(bet) + ' x ' + discount + '%) = ' + rp(c.bayar));
      lines.push('- Maka yang Anda bayarkan = ' + rp(c.bayar));
      lines.push('- Bettingan x Hadiah = ' + rp(bet) + ' x ' + rewardLabel + ' = ' + rp(c.hadiah));
      if (showTotal) {
        lines.push('- Jika menang, Total = ' + rp(c.bayar) + ' + ' + rp(c.hadiah) + ' = ' + rp(c.total));
      }
    });
  }

  function fullLines(lines, bet, market, list) {
    lines.push('Jika Anda Betting Tipe Full ' + market + ' Dengan Nominal ' + rp(bet) + ':');
    list.forEach(function (item) {
      var reward = parseRewardMultiplier(item.reward);
      var rewardLabel = String(item.reward != null ? item.reward : reward);
      var label = copyTitleCase(item.name).replace(/^Bet Full\s*/i, 'Hadiah ');
      lines.push('- ' + label + ' = ' + rp(bet) + ' x ' + rewardLabel + ' = ' + rp(bet * reward));
    });
  }

  function bolakBalikLines(lines, bet, market, list) {
    lines.push('Jika Anda Betting Tipe Bolak Balik ' + market + ' Dengan Nominal ' + rp(bet) + ':');
    list.forEach(function (item) {
      var reward = parseRewardMultiplier(item.reward);
      var rewardLabel = String(item.reward != null ? item.reward : reward);
      var label = copyTitleCase(item.name);
      if (/\sBB$/i.test(label)) label = label.replace(/\sBB$/i, ' Terbalik / BB');
      lines.push('- ' + label + ' = ' + rp(bet) + ' x ' + rewardLabel + ' = ' + rp(bet * reward));
    });
  }

  function keiItemLines(lines, bet, market, item, labelOverride) {
    if (!item) return;
    var discount = Number(item.discount || 0);
    var kei = parseFloat(String(item.kei || '0').replace('%', '')) || 0;
    var label = labelOverride || copyTitleCase(item.name);

    lines.push(label);
    lines.push('- Diskon = ' + discount + '%');
    lines.push('- Kei = ' + (kei > 0 ? '+' : '') + kei + '%');

    if (kei < 0) {
      var c = negativeKeiCalc(bet, Math.abs(kei), discount);
      lines.push('- Bettingan - (Bettingan x Kei ' + kei + '%) = ' + rp(bet) + ' - (' + rp(bet) + ' x ' + kei + '%) = ' + rp(c.hasilKei));
      if (discount > 0) {
        lines.push('- Hasil Kei - (Hasil Kei x Diskon ' + discount + '%) = ' + rp(c.hasilKei) + ' - (' + rp(c.hasilKei) + ' x ' + discount + '%) = ' + rp(c.bayar));
      }
      lines.push('- Maka yang Anda bayarkan = ' + rp(c.bayar));
      lines.push('- Jika menang, Total Kemenangan = ' + rp(bet) + ' + ' + rp(c.bayar) + ' = ' + rp(c.total));
    } else {
      var bayar = bet * (1 - discount / 100);
      var nilaiKei = bet * (kei / 100);
      var menang = bet + nilaiKei;
      var total = bayar + menang;
      lines.push('- Bettingan - (Bettingan x Diskon ' + discount + '%) = ' + rp(bet) + ' - (' + rp(bet) + ' x ' + discount + '%) = ' + rp(bayar));
      lines.push('- Bettingan x Kei ' + kei + '% = ' + rp(bet) + ' x ' + kei + '% = ' + rp(nilaiKei));
      lines.push('- Jika menang = Bettingan + Kei = ' + rp(bet) + ' + ' + rp(nilaiKei) + ' = ' + rp(menang));
      lines.push('- Total yang Anda dapatkan = ' + rp(bayar) + ' + ' + rp(menang) + ' = ' + rp(total));
    }
  }

  function prizeCalcText(market, bet) {
    var list = items(market, 'Prize');
    if (!list.length) return 'Pasaran ' + market + ' tidak memiliki kategori Prize.';

    var groups = {
      '1': { title: 'PRIZE 1', rows: [] },
      '2': { title: 'PRIZE 2', rows: [] },
      '3': { title: 'PRIZE 3', rows: [] }
    };
    var digitMap = { '1': '4D', '2': '3D', '3': '2D' };

    list.forEach(function (item) {
      var match = String(item.name || '').match(/PRIZE\s*(\d+)\s*-\s*(\d+)/i);
      if (!match || !groups[match[1]]) return;
      groups[match[1]].rows.push({
        digit: digitMap[match[2]] || (match[2] + 'D'),
        reward: parseRewardMultiplier(item.reward),
        rewardLabel: String(item.reward != null ? item.reward : ''),
        discount: Number(item.discount || 0)
      });
    });

    var lines = ['Jika anda Betting Tipe Prize Dengan nominal ' + rp(bet) + ' Berikut Perhitungan dan Kemenangan anda :'];
    ['1', '2', '3'].forEach(function (key) {
      var group = groups[key];
      if (!group.rows.length) return;
      lines.push('');
      lines.push(group.title);
      group.rows.forEach(function (row) {
        lines.push(row.digit + ' = ' + rp(bet) + ' x ' + row.rewardLabel + ' = ' + rp(bet * row.reward) + ',-');
      });
    });
    return lines.join('\n');
  }

  /* fungsi inti: satu sumber rumus utk SEMUA kalkulator (persis asli) */
  function marketCalcText(market, type, bet) {
    var sections = sectionsFor(market);
    var diskonItems = sections['Diskon'] || [];
    var fullItems = sections['Bet Full'] || [];
    var tepatItems = sections['Tepat & BB'] || [];
    var lainnya = sections['Lainnya'] || [];
    var lines = [];

    if (type === 'Prize') {
      return prizeCalcText(market, bet);
    }

    if (type === 'Diskon') {
      var dItems = diskonItems.filter(function (item) {
        return normName(item.name).indexOf('SUPER DISKON') !== 0;
      });
      rewardLines(lines, bet, market, 'Diskon', dItems, { showTotal: false });
    }

    else if (type === 'Super Diskon') {
      var sdItems = diskonItems.filter(function (item) {
        return normName(item.name).indexOf('SUPER DISKON') === 0;
      });
      rewardLines(lines, bet, market, 'Super Diskon', sdItems, { showTotal: false });
    }

    else if (type === 'Full') {
      fullLines(lines, bet, market, fullItems);
    }

    else if (type === 'Bolak Balik') {
      bolakBalikLines(lines, bet, market, tepatItems);
    }

    else if (type === 'Colok Bebas') {
      var cbItems = lainnya.filter(function (item) {
        var n = normName(item.name);
        return n.indexOf('COLOK BEBAS') === 0 && n.indexOf('COLOK BEBAS 2D') !== 0 && n.indexOf('COLOK BEBAS 4D') !== 0;
      });
      rewardLines(lines, bet, market, 'Colok Bebas', cbItems);
    }

    else if (type === 'Colok Bebas 2D') {
      var cb2 = lainnya.filter(function (item) { return normName(item.name).indexOf('COLOK BEBAS 2D') === 0; });
      rewardLines(lines, bet, market, 'Colok Bebas 2D', cb2);
    }

    else if (type === 'Colok Bebas 4D') {
      var cb4 = lainnya.filter(function (item) { return normName(item.name).indexOf('COLOK BEBAS 4D') === 0; });
      rewardLines(lines, bet, market, 'Colok Bebas 4D', cb4);
    }

    else if (type === 'Colok Naga') {
      var cnItems = lainnya.filter(function (item) { return normName(item.name).indexOf('COLOK NAGA') === 0; });
      rewardLines(lines, bet, market, 'Colok Naga', cnItems);
    }

    else if (type === 'Colok Jitu') {
      var cjItems = lainnya.filter(function (item) { return normName(item.name) === 'COLOK JITU'; });
      rewardLines(lines, bet, market, 'Colok Jitu', cjItems);
    }

    else if (type === 'Shio') {
      var sItems = lainnya.filter(function (item) { return normName(item.name) === 'SHIO'; });
      rewardLines(lines, bet, market, 'Shio', sItems);
    }

    else if (type === 'Macau Shio') {
      var msItems = lainnya.filter(function (item) { return normName(item.name) === 'MACAU SHIO'; });
      rewardLines(lines, bet, market, 'Macau Shio', msItems);
    }

    else if (type === 'Kombinasi') {
      var kItems = lainnya.filter(function (item) { return normName(item.name) === 'KOMBINASI'; });
      rewardLines(lines, bet, market, 'Kombinasi', kItems);
    }

    else if (type === '50-50') {
      var item50 = lainnya.find(function (item) { return normName(item.name).replace(/\s/g, '') === '50-50'; });
      lines.push('Jika Anda Betting Tipe 50-50 ' + market + ' Dengan Nominal ' + rp(bet) + ':');
      if (item50) keiItemLines(lines, bet, market, item50, '50-50');
    }

    else if (type === 'Silang Homo') {
      var shItem = lainnya.find(function (item) { return normName(item.name) === 'SILANG HOMO'; });
      lines.push('Jika Anda Betting Tipe Silang Homo ' + market + ' Dengan Nominal ' + rp(bet) + ':');
      if (shItem) keiItemLines(lines, bet, market, shItem, 'Silang Homo');
    }

    else if (type === 'Tengah Tepi') {
      var ttItem = lainnya.find(function (item) { return normName(item.name) === 'TENGAH TEPI'; });
      lines.push('Jika Anda Betting Tipe Tengah Tepi ' + market + ' Dengan Nominal ' + rp(bet) + ':');
      if (ttItem) keiItemLines(lines, bet, market, ttItem, 'Tengah Tepi');
    }

    else if (type === 'Kembang - Kempis - Kembar') {
      var kkk = lainnya.find(function (item) { return normName(item.name) === 'KEMBANG - KEMPIS - KEMBAR'; });
      lines.push('Jika Anda Betting Tipe Kembang - Kempis - Kembar ' + market + ' Dengan Nominal ' + rp(bet) + ':');
      if (kkk) keiItemLines(lines, bet, market, kkk, 'Kembang - Kempis - Kembar');
    }

    else if (type === 'Kembang - Kempis') {
      var kk = lainnya.find(function (item) { return normName(item.name) === 'KEMBANG - KEMPIS'; });
      lines.push('Jika Anda Betting Tipe Kembang - Kempis ' + market + ' Dengan Nominal ' + rp(bet) + ':');
      if (kk) keiItemLines(lines, bet, market, kk, 'Kembang - Kempis');
    }

    else if (type === 'Kembar') {
      var kembar = lainnya.find(function (item) { return normName(item.name) === 'KEMBAR'; });
      lines.push('Jika Anda Betting Tipe Kembar ' + market + ' Dengan Nominal ' + rp(bet) + ':');
      if (kembar) keiItemLines(lines, bet, market, kembar, 'Kembar');
    }

    else if (type === 'Dasar') {
      var ganjil = lainnya.find(function (item) { return normName(item.name) === 'DASAR GANJIL - BESAR'; });
      var genap = lainnya.find(function (item) { return normName(item.name) === 'DASAR GENAP - KECIL'; });
      lines.push('Jika Anda Betting Tipe Dasar ' + market + ' Dengan Nominal ' + rp(bet) + ':');
      if (ganjil) {
        lines.push('');
        keiItemLines(lines, bet, market, ganjil, 'Tipe Taruhan: Ganjil / Besar');
      }
      if (genap) {
        lines.push('');
        keiItemLines(lines, bet, market, genap, 'Tipe Taruhan: Genap / Kecil');
      }
    }

    if (!lines.length) {
      return 'Data perhitungan untuk tipe ' + type + ' pada pasaran ' + market + ' belum tersedia.';
    }
    return lines.join('\n');
  }

  /* ============================================================
     8. EXPOSE
     ============================================================ */
  window.HadiahData = {
    DATA: DATA,
    SPECIAL_GROUP_NAMES: SPECIAL_GROUP_NAMES,
    COMMON_MAIN_MARKETS: COMMON_MAIN_MARKETS,
    COMMON_EXCLUDED_MARKETS: COMMON_EXCLUDED_MARKETS,
    PRIZE_MARKETS: PRIZE_MARKETS,
    SECTION_ORDER: SECTION_ORDER,
    MARKET_LOGOS: MARKET_LOGOS,
    allMarkets: allMarkets,
    profileFor: profileFor,
    profileKeyFor: profileKeyFor,
    sectionsFor: sectionsFor,
    hasOverride: hasOverride,
    applyOverride: applyOverride,
    resetOverride: resetOverride,
    escapeHtml: escapeHtml,
    copyTitleCase: copyTitleCase,
    normName: normName,
    rp: rp,
    parseRewardMultiplier: parseRewardMultiplier,
    calcDiscountReward: calcDiscountReward,
    negativeKeiCalc: negativeKeiCalc,
    itemLine: itemLine,
    sectionText: sectionText,
    prizeCopyLines: prizeCopyLines,
    marketText: marketText,
    allGroupsText: allGroupsText,
    marketCalcTypes: marketCalcTypes,
    marketCalcText: marketCalcText,
    prizeCalcText: prizeCalcText
  };
})();
