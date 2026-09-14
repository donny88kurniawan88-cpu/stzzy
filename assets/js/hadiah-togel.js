"use strict";

const DATA = {"markets":{"TOTO MACAU 4D":"macau4d","TOTO MACAU 5D":"macau5d","KINGKONG":"kingkong","BANGKOK":"standard_prize","BRUNEI":"standard_prize","CHELSEA":"standard_prize","HONGKONG":"hk_sydney","HUAHIN":"standard_prize","MAGNUM4D":"standard_prize","NEVADA":"standard_prize","POIPET":"standard_prize","SYDNEY":"hk_sydney","TOTO CAMBODIA":"standard_prize","BULLSEYE":"standard_no_prize","CALIFORNIA":"standard_no_prize","CAROLINA EVE":"standard_no_prize","CAROLINA DAY":"standard_no_prize","FLORIDA EVE":"standard_no_prize","FLORIDA MID":"standard_no_prize","KENTUCKY EVE":"standard_no_prize","KENTUCKY MID":"standard_no_prize","NEW YORK EVE":"standard_no_prize","NEW YORK MID":"standard_no_prize","OREGON":"standard_no_prize","PCSO":"standard_no_prize","SINGAPORE":"standard_prize","HOKI DRAW":"hoki","JAKARTA":"jakarta","TOTOMALI":"totomali"},"profiles":{"macau4d":{"sections":{"Diskon":[{"name":"DISKON 4D","discount":33,"reward":"6.000"},{"name":"DISKON 3D","discount":24,"reward":"700"},{"name":"DISKON 2D","discount":15,"reward":"80"},{"name":"SUPER DISKON 4D","discount":66,"reward":"3.000"},{"name":"SUPER DISKON 3D","discount":59,"reward":"400"},{"name":"SUPER DISKON 2D","discount":29,"reward":"70"}],"Bet Full":[{"name":"BET FULL 4D","discount":0,"reward":"9.000"},{"name":"BET FULL 3D","discount":0,"reward":"950"},{"name":"BET FULL 2D","discount":0,"reward":"95"}],"Tepat & BB":[{"name":"4D TEPAT","discount":0,"reward":"4.000"},{"name":"4D BB","discount":0,"reward":"200"},{"name":"3D TEPAT","discount":0,"reward":"400"},{"name":"3D BB","discount":0,"reward":"100"},{"name":"2D TEPAT","discount":0,"reward":"70"},{"name":"2D BB","discount":0,"reward":"20"}],"Lainnya":[{"name":"COLOK BEBAS","discount":0,"reward":"1.6"},{"name":"COLOK BEBAS (2 Digit)","discount":0,"reward":"3.2"},{"name":"COLOK BEBAS (3 Digit)","discount":0,"reward":"4.8"},{"name":"COLOK BEBAS (4 Digit)","discount":0,"reward":"6.4"},{"name":"COLOK JITU","discount":0,"reward":"8.3"},{"name":"MACAU SHIO","discount":0,"reward":"110"},{"name":"COLOK BEBAS 2D (2 Digit)","discount":0,"reward":"7"},{"name":"COLOK BEBAS 2D (3 Digit)","discount":0,"reward":"13"},{"name":"COLOK BEBAS 2D (4 Digit)","discount":0,"reward":"21"},{"name":"COLOK NAGA (3 Digit)","discount":0,"reward":"27"},{"name":"COLOK NAGA (4 Digit)","discount":0,"reward":"41"},{"name":"SHIO","discount":0,"reward":"10"},{"name":"KOMBINASI","discount":0,"reward":"2.8"},{"name":"50 - 50","discount":0,"kei":"-5%"},{"name":"TENGAH TEPI","discount":0,"kei":"-2.2%"},{"name":"SILANG HOMO","discount":0,"kei":"-2.2%"},{"name":"KEMBANG - KEMPIS - KEMBAR","discount":0,"kei":"-2.2%"},{"name":"DASAR GANJIL - BESAR","discount":0,"kei":"-25%"},{"name":"DASAR GENAP - KECIL","discount":0,"kei":"+10%"}]}},"macau5d":{"sections":{"Diskon":[{"name":"DISKON 5D","discount":38,"reward":"50.000"},{"name":"DISKON 4D","discount":20,"reward":"7.000"},{"name":"DISKON 3D","discount":20,"reward":"750"},{"name":"DISKON 2D","discount":20,"reward":"75"}],"Bet Full":[{"name":"BET FULL 5D","discount":0,"reward":"88.000"},{"name":"BET FULL 4D","discount":0,"reward":"9.000"},{"name":"BET FULL 3D","discount":0,"reward":"950"},{"name":"BET FULL 2D","discount":0,"reward":"95"}],"Tepat & BB":[{"name":"5D TEPAT","discount":0,"reward":"50.000"},{"name":"5D BB","discount":0,"reward":"350"},{"name":"4D TEPAT","discount":0,"reward":"5.000"},{"name":"4D BB","discount":0,"reward":"180"},{"name":"3D TEPAT","discount":0,"reward":"500"},{"name":"3D BB","discount":0,"reward":"75"},{"name":"2D TEPAT","discount":0,"reward":"80"},{"name":"2D BB","discount":0,"reward":"15"}],"Lainnya":[{"name":"COLOK BEBAS","discount":0,"reward":"0.9"},{"name":"COLOK BEBAS (2 Digit)","discount":0,"reward":"1.8"},{"name":"COLOK BEBAS (3 Digit)","discount":0,"reward":"2.7"},{"name":"COLOK BEBAS (4 Digit)","discount":0,"reward":"3.6"},{"name":"COLOK BEBAS (5)","discount":0,"reward":"4.5"},{"name":"COLOK JITU","discount":0,"reward":"8"},{"name":"COLOK BEBAS 2D (2 Digit)","discount":0,"reward":"4"},{"name":"COLOK BEBAS 2D (3 Digit)","discount":0,"reward":"6"},{"name":"COLOK BEBAS 2D (4 Digit)","discount":0,"reward":"20"},{"name":"COLOK BEBAS 2D (5)","discount":0,"reward":"200"},{"name":"COLOK BEBAS 4D (4)","discount":0,"reward":"50"},{"name":"COLOK BEBAS 4D (5)","discount":0,"reward":"200"},{"name":"COLOK NAGA (3 Digit)","discount":0,"reward":"12"},{"name":"COLOK NAGA (4 Digit)","discount":0,"reward":"30"},{"name":"COLOK NAGA (5)","discount":0,"reward":"125"},{"name":"SHIO","discount":0,"reward":"10"},{"name":"KOMBINASI","discount":0,"reward":"2.7"},{"name":"50 - 50","discount":0,"kei":"-2.2%"},{"name":"TENGAH TEPI","discount":0,"kei":"-2.2%"},{"name":"DASAR GANJIL - BESAR","discount":0,"kei":"-25%"},{"name":"DASAR GENAP - KECIL","discount":0,"kei":"+10%"}]}},"kingkong":{"sections":{"Diskon":[{"name":"DISKON 4D","discount":33,"reward":"6.000"},{"name":"DISKON 3D","discount":24,"reward":"700"},{"name":"DISKON 2D","discount":15,"reward":"80"}],"Bet Full":[{"name":"BET FULL 4D","discount":0,"reward":"9.000"},{"name":"BET FULL 3D","discount":0,"reward":"950"},{"name":"BET FULL 2D","discount":0,"reward":"95"}],"Tepat & BB":[{"name":"4D TEPAT","discount":0,"reward":"4.000"},{"name":"4D BB","discount":0,"reward":"200"},{"name":"3D TEPAT","discount":0,"reward":"400"},{"name":"3D BB","discount":0,"reward":"100"},{"name":"2D TEPAT","discount":0,"reward":"70"},{"name":"2D BB","discount":0,"reward":"20"}],"Lainnya":[{"name":"COLOK BEBAS","discount":0,"reward":"1.6"},{"name":"COLOK BEBAS (2 Digit)","discount":0,"reward":"3.2"},{"name":"COLOK BEBAS (3 Digit)","discount":0,"reward":"4.8"},{"name":"COLOK BEBAS (4 Digit)","discount":0,"reward":"6.4"},{"name":"COLOK JITU","discount":0,"reward":"8.3"},{"name":"MACAU SHIO","discount":0,"reward":"110"},{"name":"COLOK BEBAS 2D (2 Digit)","discount":0,"reward":"7"},{"name":"COLOK BEBAS 2D (3 Digit)","discount":0,"reward":"13"},{"name":"COLOK BEBAS 2D (4 Digit)","discount":0,"reward":"21"},{"name":"COLOK NAGA (3 Digit)","discount":0,"reward":"27"},{"name":"COLOK NAGA (4 Digit)","discount":0,"reward":"41"},{"name":"SHIO","discount":0,"reward":"10"},{"name":"KOMBINASI","discount":0,"reward":"2.8"},{"name":"50 - 50","discount":0,"kei":"-5%"},{"name":"SILANG HOMO","discount":0,"kei":"-2.2%"},{"name":"TENGAH TEPI","discount":0,"kei":"-2.2%"},{"name":"KEMBANG - KEMPIS","discount":0,"kei":"-2.2%"},{"name":"KEMBAR","discount":0,"kei":"+50%"},{"name":"DASAR GANJIL - BESAR","discount":0,"kei":"-25%"},{"name":"DASAR GENAP - KECIL","discount":0,"kei":"+10%"}]}},"standard_prize":{"sections":{"Diskon":[{"name":"DISKON 4D","discount":66,"reward":"3.000"},{"name":"DISKON 3D","discount":59,"reward":"400"},{"name":"DISKON 2D","discount":29,"reward":"70"},{"name":"DISKON 2D DEPAN","discount":29,"reward":"65"},{"name":"DISKON 2D TENGAH","discount":29,"reward":"65"}],"Bet Full":[{"name":"BET FULL 4D","discount":0,"reward":"10.000"},{"name":"BET FULL 3D","discount":0,"reward":"1.000"},{"name":"BET FULL 2D","discount":0,"reward":"100"}],"Prize":[{"name":"PRIZE 1 - 1","discount":0,"reward":"6.500"},{"name":"PRIZE 1 - 2","discount":0,"reward":"650"},{"name":"PRIZE 1 - 3","discount":0,"reward":"70"},{"name":"PRIZE 2 - 1","discount":0,"reward":"2.100"},{"name":"PRIZE 2 - 2","discount":0,"reward":"210"},{"name":"PRIZE 2 - 3","discount":0,"reward":"20"},{"name":"PRIZE 3 - 1","discount":0,"reward":"1.100"},{"name":"PRIZE 3 - 2","discount":0,"reward":"110"},{"name":"PRIZE 3 - 3","discount":0,"reward":"8"}],"Tepat & BB":[{"name":"4D TEPAT","discount":0,"reward":"4.000"},{"name":"4D BB","discount":0,"reward":"200"},{"name":"3D TEPAT","discount":0,"reward":"400"},{"name":"3D BB","discount":0,"reward":"100"},{"name":"2D TEPAT","discount":0,"reward":"70"},{"name":"2D BB","discount":0,"reward":"20"}],"Lainnya":[{"name":"COLOK BEBAS","discount":6,"reward":"1.5"},{"name":"COLOK BEBAS (2 Digit)","discount":6,"reward":"3"},{"name":"COLOK BEBAS (3 Digit)","discount":6,"reward":"4.5"},{"name":"COLOK BEBAS (4 Digit)","discount":6,"reward":"6"},{"name":"COLOK JITU","discount":6,"reward":"8"},{"name":"MACAU SHIO","discount":10,"reward":"110"},{"name":"COLOK BEBAS 2D (2 Digit)","discount":10,"reward":"7"},{"name":"COLOK BEBAS 2D (3 Digit)","discount":10,"reward":"11"},{"name":"COLOK BEBAS 2D (4 Digit)","discount":10,"reward":"18"},{"name":"COLOK NAGA (3 Digit)","discount":10,"reward":"23"},{"name":"COLOK NAGA (4 Digit)","discount":10,"reward":"35"},{"name":"SHIO","discount":5,"reward":"9.5"},{"name":"KOMBINASI","discount":8,"reward":"2.6"},{"name":"50 - 50","discount":2,"kei":"-3%"},{"name":"TENGAH TEPI","discount":2,"kei":"-3%"},{"name":"SILANG HOMO","discount":2,"kei":"-3%"},{"name":"KEMBANG - KEMPIS - KEMBAR","discount":2,"kei":"-3%"},{"name":"DASAR GANJIL - BESAR","discount":2,"kei":"-25%"},{"name":"DASAR GENAP - KECIL","discount":2,"kei":"+10%"}]}},"hk_sydney":{"sections":{"Diskon":[{"name":"DISKON 4D","discount":66,"reward":"3.000"},{"name":"DISKON 3D","discount":59,"reward":"400"},{"name":"DISKON 2D","discount":29,"reward":"70"},{"name":"DISKON 2D DEPAN","discount":29,"reward":"65"},{"name":"DISKON 2D TENGAH","discount":29,"reward":"65"}],"Bet Full":[{"name":"BET FULL 4D","discount":0,"reward":"9.800"},{"name":"BET FULL 3D","discount":0,"reward":"980"},{"name":"BET FULL 2D","discount":0,"reward":"98"}],"Prize":[{"name":"PRIZE 1 - 1","discount":0,"reward":"6.500"},{"name":"PRIZE 1 - 2","discount":0,"reward":"650"},{"name":"PRIZE 1 - 3","discount":0,"reward":"70"},{"name":"PRIZE 2 - 1","discount":0,"reward":"2.100"},{"name":"PRIZE 2 - 2","discount":0,"reward":"210"},{"name":"PRIZE 2 - 3","discount":0,"reward":"20"},{"name":"PRIZE 3 - 1","discount":0,"reward":"1.100"},{"name":"PRIZE 3 - 2","discount":0,"reward":"110"},{"name":"PRIZE 3 - 3","discount":0,"reward":"8"}],"Tepat & BB":[{"name":"4D TEPAT","discount":0,"reward":"4.000"},{"name":"4D BB","discount":0,"reward":"200"},{"name":"3D TEPAT","discount":0,"reward":"400"},{"name":"3D BB","discount":0,"reward":"100"},{"name":"2D TEPAT","discount":0,"reward":"70"},{"name":"2D BB","discount":0,"reward":"20"}],"Lainnya":[{"name":"COLOK BEBAS","discount":6,"reward":"1.5"},{"name":"COLOK BEBAS (2 Digit)","discount":6,"reward":"3"},{"name":"COLOK BEBAS (3 Digit)","discount":6,"reward":"4.5"},{"name":"COLOK BEBAS (4 Digit)","discount":6,"reward":"6"},{"name":"COLOK JITU","discount":6,"reward":"8"},{"name":"MACAU SHIO","discount":10,"reward":"110"},{"name":"COLOK BEBAS 2D (2 Digit)","discount":10,"reward":"7"},{"name":"COLOK BEBAS 2D (3 Digit)","discount":10,"reward":"11"},{"name":"COLOK BEBAS 2D (4 Digit)","discount":10,"reward":"18"},{"name":"COLOK NAGA (3 Digit)","discount":10,"reward":"23"},{"name":"COLOK NAGA (4 Digit)","discount":10,"reward":"35"},{"name":"SHIO","discount":5,"reward":"9.5"},{"name":"KOMBINASI","discount":8,"reward":"2.6"},{"name":"50 - 50","discount":2,"kei":"-3%"},{"name":"TENGAH TEPI","discount":2,"kei":"-3%"},{"name":"SILANG HOMO","discount":2,"kei":"-3%"},{"name":"KEMBANG - KEMPIS - KEMBAR","discount":2,"kei":"-3%"},{"name":"DASAR GANJIL - BESAR","discount":2,"kei":"-25%"},{"name":"DASAR GENAP - KECIL","discount":2,"kei":"+10%"}]}},"totomali":{"sections":{"Diskon":[{"name":"DISKON 4D","discount":67,"reward":"3.000"},{"name":"DISKON 3D","discount":57,"reward":"400"},{"name":"DISKON 2D","discount":27,"reward":"70"}],"Bet Full":[{"name":"BET FULL 4D","discount":0,"reward":"10.000"},{"name":"BET FULL 3D","discount":0,"reward":"1.000"},{"name":"BET FULL 2D","discount":0,"reward":"100"}],"Prize":[{"name":"PRIZE 1 - 1","discount":0,"reward":"6.500"},{"name":"PRIZE 1 - 2","discount":0,"reward":"650"},{"name":"PRIZE 1 - 3","discount":0,"reward":"70"},{"name":"PRIZE 2 - 1","discount":0,"reward":"2.100"},{"name":"PRIZE 2 - 2","discount":0,"reward":"210"},{"name":"PRIZE 2 - 3","discount":0,"reward":"20"},{"name":"PRIZE 3 - 1","discount":0,"reward":"1.100"},{"name":"PRIZE 3 - 2","discount":0,"reward":"110"},{"name":"PRIZE 3 - 3","discount":0,"reward":"8"}],"Tepat & BB":[{"name":"4D TEPAT","discount":0,"reward":"4.000"},{"name":"4D BB","discount":0,"reward":"200"},{"name":"3D TEPAT","discount":0,"reward":"400"},{"name":"3D BB","discount":0,"reward":"100"},{"name":"2D TEPAT","discount":0,"reward":"70"},{"name":"2D BB","discount":0,"reward":"20"}],"Lainnya":[{"name":"COLOK BEBAS","discount":6,"reward":"1.6"},{"name":"COLOK BEBAS (2 Digit)","discount":6,"reward":"3.2"},{"name":"COLOK BEBAS (3 Digit)","discount":6,"reward":"4.8"},{"name":"COLOK BEBAS (4 Digit)","discount":6,"reward":"6.4"},{"name":"COLOK JITU","discount":6,"reward":"8.3"},{"name":"MACAU SHIO","discount":10,"reward":"110"},{"name":"COLOK BEBAS 2D (2 Digit)","discount":10,"reward":"7"},{"name":"COLOK BEBAS 2D (3 Digit)","discount":10,"reward":"13"},{"name":"COLOK BEBAS 2D (4 Digit)","discount":10,"reward":"21"},{"name":"COLOK NAGA (3 Digit)","discount":10,"reward":"27"},{"name":"COLOK NAGA (4 Digit)","discount":10,"reward":"41"},{"name":"SHIO","discount":5,"reward":"9.5"},{"name":"KOMBINASI","discount":8,"reward":"2.8"},{"name":"50 - 50","discount":2,"kei":"-5%"},{"name":"TENGAH TEPI","discount":2,"kei":"-2.2%"},{"name":"SILANG HOMO","discount":2,"kei":"-2.2%"},{"name":"KEMBANG - KEMPIS - KEMBAR","discount":2,"kei":"-2.2%"},{"name":"DASAR GANJIL - BESAR","discount":2,"kei":"-25%"},{"name":"DASAR GENAP - KECIL","discount":2,"kei":"+10%"}]}},"standard_no_prize":{"sections":{"Diskon":[{"name":"DISKON 4D","discount":66,"reward":"3.000"},{"name":"DISKON 3D","discount":59,"reward":"400"},{"name":"DISKON 2D","discount":29,"reward":"70"},{"name":"DISKON 2D DEPAN","discount":29,"reward":"65"},{"name":"DISKON 2D TENGAH","discount":29,"reward":"65"}],"Bet Full":[{"name":"BET FULL 4D","discount":0,"reward":"10.000"},{"name":"BET FULL 3D","discount":0,"reward":"1.000"},{"name":"BET FULL 2D","discount":0,"reward":"100"}],"Tepat & BB":[{"name":"4D TEPAT","discount":0,"reward":"4.000"},{"name":"4D BB","discount":0,"reward":"200"},{"name":"3D TEPAT","discount":0,"reward":"400"},{"name":"3D BB","discount":0,"reward":"100"},{"name":"2D TEPAT","discount":0,"reward":"70"},{"name":"2D BB","discount":0,"reward":"20"}],"Lainnya":[{"name":"COLOK BEBAS","discount":6,"reward":"1.5"},{"name":"COLOK BEBAS (2 Digit)","discount":6,"reward":"3"},{"name":"COLOK BEBAS (3 Digit)","discount":6,"reward":"4.5"},{"name":"COLOK BEBAS (4 Digit)","discount":6,"reward":"6"},{"name":"COLOK JITU","discount":6,"reward":"8"},{"name":"MACAU SHIO","discount":10,"reward":"110"},{"name":"COLOK BEBAS 2D (2 Digit)","discount":10,"reward":"7"},{"name":"COLOK BEBAS 2D (3 Digit)","discount":10,"reward":"11"},{"name":"COLOK BEBAS 2D (4 Digit)","discount":10,"reward":"18"},{"name":"COLOK NAGA (3 Digit)","discount":10,"reward":"23"},{"name":"COLOK NAGA (4 Digit)","discount":10,"reward":"35"},{"name":"SHIO","discount":5,"reward":"9.5"},{"name":"KOMBINASI","discount":8,"reward":"2.6"},{"name":"50 - 50","discount":2,"kei":"-3%"},{"name":"TENGAH TEPI","discount":2,"kei":"-3%"},{"name":"SILANG HOMO","discount":2,"kei":"-3%"},{"name":"KEMBANG - KEMPIS - KEMBAR","discount":2,"kei":"-3%"},{"name":"DASAR GANJIL - BESAR","discount":2,"kei":"-25%"},{"name":"DASAR GENAP - KECIL","discount":2,"kei":"+10%"}]}},"hoki":{"sections":{"Diskon":[{"name":"DISKON 4D","discount":20,"reward":"7.000"},{"name":"DISKON 3D","discount":20,"reward":"750"},{"name":"DISKON 2D","discount":20,"reward":"75"}],"Bet Full":[{"name":"BET FULL 4D","discount":0,"reward":"10.000"},{"name":"BET FULL 3D","discount":0,"reward":"1.000"},{"name":"BET FULL 2D","discount":0,"reward":"100"}],"Tepat & BB":[{"name":"4D TEPAT","discount":0,"reward":"5.000"},{"name":"4D BB","discount":0,"reward":"180"},{"name":"3D TEPAT","discount":0,"reward":"500"},{"name":"3D BB","discount":0,"reward":"75"},{"name":"2D TEPAT","discount":0,"reward":"80"},{"name":"2D BB","discount":0,"reward":"15"}],"Lainnya":[{"name":"COLOK BEBAS","discount":6,"reward":"0.9"},{"name":"COLOK BEBAS (2 Digit)","discount":6,"reward":"1.8"},{"name":"COLOK BEBAS (3 Digit)","discount":6,"reward":"2.7"},{"name":"COLOK BEBAS (4 Digit)","discount":6,"reward":"3.6"},{"name":"COLOK JITU","discount":6,"reward":"8"},{"name":"MACAU SHIO","discount":10,"reward":"110"},{"name":"COLOK BEBAS 2D (2 Digit)","discount":10,"reward":"4"},{"name":"COLOK BEBAS 2D (3 Digit)","discount":10,"reward":"6"},{"name":"COLOK BEBAS 2D (4 Digit)","discount":10,"reward":"20"},{"name":"COLOK NAGA (3 Digit)","discount":10,"reward":"12"},{"name":"COLOK NAGA (4 Digit)","discount":10,"reward":"30"},{"name":"SHIO","discount":5,"reward":"9.5"},{"name":"KOMBINASI","discount":8,"reward":"2.7"},{"name":"50 - 50","discount":2,"kei":"-2.2%"},{"name":"TENGAH TEPI","discount":2,"kei":"-2.2%"},{"name":"SILANG HOMO","discount":2,"kei":"-3%"},{"name":"KEMBANG - KEMPIS - KEMBAR","discount":2,"kei":"-3%"},{"name":"DASAR GANJIL - BESAR","discount":2,"kei":"-25%"},{"name":"DASAR GENAP - KECIL","discount":2,"kei":"+10%"}]}},"jakarta":{"sections":{"Diskon":[{"name":"DISKON 4D","discount":66,"reward":"3.000"},{"name":"DISKON 3D","discount":59,"reward":"400"},{"name":"DISKON 2D","discount":29,"reward":"70"}],"Bet Full":[{"name":"BET FULL 4D","discount":0,"reward":"10.000"},{"name":"BET FULL 3D","discount":0,"reward":"1.000"},{"name":"BET FULL 2D","discount":0,"reward":"100"}],"Tepat & BB":[{"name":"4D TEPAT","discount":0,"reward":"4.000"},{"name":"4D BB","discount":0,"reward":"200"},{"name":"3D TEPAT","discount":0,"reward":"400"},{"name":"3D BB","discount":0,"reward":"100"},{"name":"2D TEPAT","discount":0,"reward":"70"},{"name":"2D BB","discount":0,"reward":"20"}],"Lainnya":[{"name":"COLOK BEBAS","discount":6,"reward":"1.6"},{"name":"COLOK BEBAS (2 Digit)","discount":6,"reward":"3.2"},{"name":"COLOK BEBAS (3 Digit)","discount":6,"reward":"4.8"},{"name":"COLOK BEBAS (4 Digit)","discount":6,"reward":"6.4"},{"name":"COLOK JITU","discount":6,"reward":"8.3"},{"name":"MACAU SHIO","discount":10,"reward":"110"},{"name":"COLOK BEBAS 2D (2 Digit)","discount":10,"reward":"7"},{"name":"COLOK BEBAS 2D (3 Digit)","discount":10,"reward":"13"},{"name":"COLOK BEBAS 2D (4 Digit)","discount":10,"reward":"21"},{"name":"COLOK NAGA (3 Digit)","discount":10,"reward":"27"},{"name":"COLOK NAGA (4 Digit)","discount":10,"reward":"41"},{"name":"SHIO","discount":5,"reward":"9.5"},{"name":"KOMBINASI","discount":8,"reward":"2.8"},{"name":"50 - 50","discount":2,"kei":"-5%"},{"name":"TENGAH TEPI","discount":2,"kei":"-2.2%"},{"name":"SILANG HOMO","discount":2,"kei":"-2.2%"},{"name":"KEMBANG - KEMPIS - KEMBAR","discount":2,"kei":"-2.2%"},{"name":"DASAR GANJIL - BESAR","discount":2,"kei":"-25%"},{"name":"DASAR GENAP - KECIL","discount":2,"kei":"+10%"}]}}}};
const SPECIAL_GROUP_NAMES = {"macau4d":"TOTO MACAU 4D","macau5d":"TOTO MACAU 5D","kingkong":"KINGKONG","hk_sydney":"HONGKONG / SYDNEY","totomali":"TOTOMALI","hoki":"HOKI DRAW","jakarta":"JAKARTA"};
const COMMON_MAIN_MARKETS = ["BANGKOK", "BRUNEI", "CHELSEA", "HUAHIN", "MAGNUM4D", "NEVADA", "POIPET", "TOTO CAMBODIA", "BULLSEYE", "CALIFORNIA", "CAROLINA EVE", "CAROLINA DAY", "FLORIDA EVE", "FLORIDA MID", "KENTUCKY EVE", "KENTUCKY MID", "NEW YORK EVE", "NEW YORK MID", "OREGON", "PCSO", "SINGAPORE"];
const COMMON_EXCLUDED_MARKETS = ["TOTO MACAU 4D", "TOTO MACAU 5D", "KINGKONG", "HONGKONG", "SYDNEY", "TOTOMALI", "HOKI DRAW", "JAKARTA"];
const PRIZE_MARKETS = ["BANGKOK", "BRUNEI", "CHELSEA", "HONGKONG", "HUAHIN", "MAGNUM4D", "NEVADA", "POIPET", "SYDNEY", "TOTO CAMBODIA", "SINGAPORE", "TOTOMALI"];
const SECTION_ORDER = ["Diskon","Bet Full","Prize","Tepat & BB","Lainnya"];

const MARKET_OVERRIDE_KEY = "hadiah_market_overrides_v1";
let MARKET_OVERRIDES = loadMarketOverrides();

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadMarketOverrides() {
  try {
    const raw = localStorage.getItem(MARKET_OVERRIDE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (err) {
    return {};
  }
}

function saveMarketOverrides() {
  localStorage.setItem(MARKET_OVERRIDE_KEY, JSON.stringify(MARKET_OVERRIDES));
}


let currentMarket = "TOTO MACAU 4D";
if (!DATA.markets[currentMarket]) currentMarket = Object.keys(DATA.markets)[0];
let currentTab = "Semua";

const el = id => document.getElementById(id);
const marketPicker = el("marketPicker");
const marketPickerBtn = el("marketPickerBtn");
const marketPickerLabel = el("marketPickerLabel");
const marketMenu = el("marketMenu");
const marketSearch = el("marketSearch");
const marketOptions = el("marketOptions");
const tabs = el("tabs");
const content = el("content");
const marketTitle = el("marketTitle");
const marketNote = el("marketNote");
const marketCalcStatus = el("marketCalcStatus");
const calculatorHost = el("calculatorHost");
const mainCalculatorPanel = el("mainCalculatorPanel");
const calculatorPanelTitle = el("calculatorPanelTitle");
const calculatorPanelSub = el("calculatorPanelSub");
const copyCurrentBtn = el("copyCurrentBtn");
const copyAllBtn = el("copyAllBtn");
const editRewardsBtn = el("editRewardsBtn");
let HADIAH_IS_MASTER = false;

async function readHadiahMasterSession() {
  try {
    const response = await fetch("/api/session", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Accept": "application/json" }
    });

    if (!response.ok) return false;

    const data = await response.json();
    return Boolean(data && data.authenticated && data.user && data.user.isMaster);
  } catch (error) {
    return false;
  }
}

async function refreshHadiahMasterAccess() {
  HADIAH_IS_MASTER = await readHadiahMasterSession();
  editRewardsBtn.hidden = !HADIAH_IS_MASTER;

  if (!HADIAH_IS_MASTER && editorModal.classList.contains("show")) {
    closeEditorModal();
  }

  return HADIAH_IS_MASTER;
}

async function requireHadiahMaster() {
  const allowed = await refreshHadiahMasterAccess();

  if (!allowed) {
    alert("EDIT HADIAH hanya dapat digunakan oleh Master Administrator.");
    return false;
  }

  return true;
}
const manualModal = el("manualModal");
const manualText = el("manualText");
const manualCloseBtn = el("manualCloseBtn");
const editorModal = el("editorModal");
const editorMarketLabel = el("editorMarketLabel");
const editorTableBody = el("editorTableBody");
const editorSaveBtn = el("editorSaveBtn");
const editorCloseBtn = el("editorCloseBtn");
const editorResetBtn = el("editorResetBtn");


function isCommonMainMarket(market) {
  return COMMON_MAIN_MARKETS.includes(market);
}

function updateMainCalculatorVisibility() {
  if (!mainCalculatorPanel) return;

  calculatorHost.innerHTML = "";

  if (isCommonMainMarket(currentMarket)) {
    mainCalculatorPanel.style.display = "";
    calculatorPanelTitle.textContent = "KALKULATOR PERHITUNGAN HADIAH";
    calculatorPanelSub.textContent = "Pasaran aktif: " + currentMarket + ". Mengikuti hadiah utama untuk kelompok pasaran ini.";
    appendCommonCalculator(calculatorHost);
    return;
  }

  if (currentMarket === "KINGKONG") {
    mainCalculatorPanel.style.display = "";
    calculatorPanelTitle.textContent = "KALKULATOR PERHITUNGAN KINGKONG";
    calculatorPanelSub.textContent = "Perhitungan khusus KINGKONG sesuai hadiah, diskon, dan Kei KINGKONG.";
    appendKingkongCalculator(calculatorHost);
    return;
  }

  if (currentMarket === "HONGKONG" || currentMarket === "SYDNEY") {
    mainCalculatorPanel.style.display = "";
    calculatorPanelTitle.textContent = "KALKULATOR PERHITUNGAN " + currentMarket;
    calculatorPanelSub.textContent = "Perhitungan khusus " + currentMarket + ". Bet Full menggunakan x9.800 / x980 / x98.";
    appendHkSydneyCalculator(calculatorHost);
    return;
  }

  if (currentMarket === "TOTO MACAU 4D") {
    mainCalculatorPanel.style.display = "";
    calculatorPanelTitle.textContent = "Perhitungan Togel";
    calculatorPanelSub.textContent = "";
    appendMacau4DCalculator(calculatorHost);
    return;
  }

  if (currentMarket === "TOTO MACAU 5D") {
    mainCalculatorPanel.style.display = "";
    calculatorPanelTitle.textContent = "KALKULATOR PERHITUNGAN TOTO MACAU 5D";
    calculatorPanelSub.textContent = "Perhitungan khusus TOTO MACAU 5D sesuai hadiah 5D, 4D, 3D, 2D dan kategori lainnya.";
    appendMacau5DCalculator(calculatorHost);
    return;
  }

  if (currentMarket === "TOTOMALI" || currentMarket === "HOKI DRAW" || currentMarket === "JAKARTA") {
    mainCalculatorPanel.style.display = "";
    calculatorPanelTitle.textContent = "KALKULATOR PERHITUNGAN " + currentMarket;
    calculatorPanelSub.textContent = "Perhitungan khusus " + currentMarket + " mengikuti hadiah, diskon, dan Kei pasaran ini.";
    appendProfileMarketCalculator(calculatorHost, currentMarket);
    return;
  }

  mainCalculatorPanel.style.display = "none";
}

function profileFor(market) {
  return DATA.profiles[DATA.markets[market]];
}

function sectionsFor(market) {
  if (MARKET_OVERRIDES[market]) return MARKET_OVERRIDES[market];
  return profileFor(market).sections;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  })[ch]);
}

function highlight(value, query) {
  const safe = escapeHtml(value);
  if (!query) return safe;
  const q = String(query).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return safe.replace(new RegExp("(" + q + ")", "ig"), "<mark>$1</mark>");
}


function buildEditorRowsHtml(market) {
  const sections = sectionsFor(market);
  const rows = [];

  SECTION_ORDER.forEach(sectionName => {
    const items = sections[sectionName] || [];
    items.forEach((item, index) => {
      rows.push(`
        <tr>
          <td class="col-section">${escapeHtml(sectionName)}</td>
          <td class="col-name">${escapeHtml(copyTitleCase(item.name))}</td>
          <td><input class="editor-input" data-section="${escapeHtml(sectionName)}" data-index="${index}" data-field="discount" value="${escapeHtml(item.discount ?? "")}"></td>
          <td><input class="editor-input" data-section="${escapeHtml(sectionName)}" data-index="${index}" data-field="reward" value="${escapeHtml(item.reward ?? "")}"></td>
          <td><input class="editor-input" data-section="${escapeHtml(sectionName)}" data-index="${index}" data-field="kei" value="${escapeHtml(item.kei ?? "")}"></td>
        </tr>
      `);
    });
  });

  return rows.join("");
}

function openEditorModal() {
  editorMarketLabel.textContent = "Pasaran aktif: " + currentMarket;
  editorTableBody.innerHTML = buildEditorRowsHtml(currentMarket);
  editorModal.classList.add("show");
}

function closeEditorModal() {
  editorModal.classList.remove("show");
}

function collectEditedSections() {
  const draft = deepClone(sectionsFor(currentMarket));
  const inputs = editorTableBody.querySelectorAll(".editor-input");

  inputs.forEach(input => {
    const section = input.dataset.section;
    const index = Number(input.dataset.index);
    const field = input.dataset.field;
    const raw = input.value.trim();

    if (!draft[section] || !draft[section][index]) return;

    if (field === "discount") {
      draft[section][index].discount = raw === "" ? 0 : Number(raw);
      if (!Number.isFinite(draft[section][index].discount)) draft[section][index].discount = 0;
      return;
    }

    if (field === "reward") {
      if (raw === "") delete draft[section][index].reward;
      else draft[section][index].reward = raw;
      return;
    }

    if (field === "kei") {
      if (raw === "") delete draft[section][index].kei;
      else draft[section][index].kei = raw;
    }
  });

  return draft;
}

function applyEditorChanges() {
  MARKET_OVERRIDES[currentMarket] = collectEditedSections();
  saveMarketOverrides();
  renderTabs();
  renderCurrentMarket();
  updateMainCalculatorVisibility();
  closeEditorModal();
  flashButton(editRewardsBtn, "TERSIMPAN & KALKULATOR SINKRON ✓", 1800);
}

function resetCurrentMarketOverride() {
  delete MARKET_OVERRIDES[currentMarket];
  saveMarketOverrides();
  renderTabs();
  renderCurrentMarket();
  updateMainCalculatorVisibility();
  closeEditorModal();
}

function copyTitleCase(value) {
  let s = String(value ?? "").toLowerCase();

  s = s.replace(/\b[a-z]/g, ch => ch.toUpperCase());

  s = s
    .replace(/(\d+)d\b/gi, (_, n) => n + "D")
    .replace(/\bBb\b/g, "BB")
    .replace(/\bKei\b/g, "Kei");

  return s;
}

function itemLine(item) {
  let s = copyTitleCase(item.name) + " | Diskon: " + item.discount + "%";
  if (item.reward !== undefined) s += " | Hadiah: x" + item.reward;
  if (item.kei !== undefined) s += " | Kei: " + item.kei;
  return s;
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {}
  }

  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly","");
  ta.style.position = "fixed";
  ta.style.left = "-99999px";
  ta.style.top = "0";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  ta.setSelectionRange(0, ta.value.length);

  let ok = false;
  try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
  ta.remove();
  return ok;
}

function openManual(text) {
  manualText.value = text;
  manualModal.classList.add("show");
  setTimeout(() => {
    manualText.focus();
    manualText.select();
    manualText.setSelectionRange(0, manualText.value.length);
  }, 30);
}

function flashButton(button, text, ms=1200) {
  const original = button.textContent;
  button.textContent = text;
  setTimeout(() => button.textContent = original, ms);
}

/* MARKET PICKER */
function renderMarketOptions(filter="") {
  const q = String(filter).trim().toLowerCase();
  const names = Object.keys(DATA.markets).filter(name => name.toLowerCase().includes(q));

  marketOptions.innerHTML = "";
  if (!names.length) {
    const d = document.createElement("div");
    d.className = "market-empty";
    d.textContent = "Pasaran tidak ditemukan.";
    marketOptions.appendChild(d);
    return;
  }

  names.forEach(name => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "market-option" + (name === currentMarket ? " active" : "");
    b.textContent = name;
    b.addEventListener("click", () => selectMarket(name));
    marketOptions.appendChild(b);
  });
}

function openMarketPicker() {
  marketPicker.classList.add("open");
  marketSearch.value = "";
  renderMarketOptions();
  setTimeout(() => marketSearch.focus(), 20);
}

function closeMarketPicker() {
  marketPicker.classList.remove("open");
}

function selectMarket(name) {
  if (!DATA.markets[name]) return;
  currentMarket = name;
  localStorage.setItem("hadiah_market", currentMarket);
  marketPickerLabel.textContent = currentMarket;
  currentTab = "Semua";
  closeMarketPicker();
  renderMarketOptions();
  renderTabs();
  renderCurrentMarket();
  updateMainCalculatorVisibility();
}

marketPickerLabel.textContent = currentMarket;
renderMarketOptions();

marketPickerBtn.addEventListener("click", e => {
  e.stopPropagation();
  marketPicker.classList.contains("open") ? closeMarketPicker() : openMarketPicker();
});
marketSearch.addEventListener("input", () => renderMarketOptions(marketSearch.value));
marketMenu.addEventListener("click", e => e.stopPropagation());
document.addEventListener("click", closeMarketPicker);
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeMarketPicker();
});

/* CURRENT MARKET */
function renderTabs() {
  const sections = sectionsFor(currentMarket);
  const available = ["Semua", ...SECTION_ORDER.filter(name => sections[name])];
  if (!available.includes(currentTab)) currentTab = "Semua";

  tabs.innerHTML = "";
  available.forEach(name => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tab" + (name === currentTab ? " active" : "");
    b.textContent = name;
    b.addEventListener("click", () => {
      currentTab = name;
      renderTabs();
      renderCurrentMarket();
    });
    tabs.appendChild(b);
  });
}

function cardHtml(item, query) {
  const reward = item.reward !== undefined
    ? `<span class="badge reward">Hadiah: x${escapeHtml(item.reward)}</span>` : "";
  const kei = item.kei !== undefined
    ? `<span class="badge kei">Kei: ${escapeHtml(item.kei)}</span>` : "";

  return `<article class="card">
    <div class="name">${highlight(item.name, query)}</div>
    <div class="meta">
      <span class="badge discount">Diskon: ${item.discount}%</span>
      ${reward}${kei}
    </div>
  </article>`;
}


function groupedPrizeSectionHtml(items) {
  const groups = {
    "1": { title: "PRIZE 1", rows: [] },
    "2": { title: "PRIZE 2", rows: [] },
    "3": { title: "PRIZE 3", rows: [] }
  };
  const digitMap = { "1": "4D", "2": "3D", "3": "2D" };

  items.forEach(item => {
    const match = String(item.name || "").match(/PRIZE\s*(\d+)\s*-\s*(\d+)/i);
    if (!match) return;

    const prizeNo = match[1];
    const digitNo = match[2];
    if (!groups[prizeNo]) return;

    groups[prizeNo].rows.push({
      digitLabel: digitMap[digitNo] || (digitNo + "D"),
      discount: item.discount,
      reward: item.reward,
      kei: item.kei
    });
  });

  const ordered = ["1","2","3"].filter(key => groups[key].rows.length);

  return `<section class="section">
    <div class="section-title"><h2>Prize</h2></div>
    <div class="prize-market-cards">
      ${ordered.map(key => {
        const group = groups[key];
        return `<article class="prize-market-card">
          <h3>${group.title}</h3>
          ${group.rows.map(row => `
            <div class="prize-market-row">
              <div class="prize-market-digit">${escapeHtml(row.digitLabel)}</div>
              <div class="prize-market-meta">
                <span class="badge discount">Diskon: ${escapeHtml(String(row.discount))}%</span>
                ${row.reward !== undefined ? `<span class="badge reward">Hadiah: x${escapeHtml(row.reward)}</span>` : ""}
                ${row.kei !== undefined ? `<span class="badge kei">Kei: ${escapeHtml(row.kei)}</span>` : ""}
              </div>
            </div>
          `).join("")}
        </article>`;
      }).join("")}
    </div>
  </section>`;
}

function renderCurrentMarket() {
  const sections = sectionsFor(currentMarket);
  const query = "";

  marketTitle.textContent = currentMarket;
  marketNote.textContent = sections.Prize
    ? "Pasaran ini memiliki kategori Prize."
    : "Pasaran ini tidak memiliki kategori Prize.";

  if (marketCalcStatus) {
    if (isCommonMainMarket(currentMarket)) {
      marketCalcStatus.textContent = "Kalkulator hadiah utama tersedia untuk pasaran ini.";
      marketCalcStatus.className = "market-calc-status";
    } else if (currentMarket === "KINGKONG") {
      marketCalcStatus.textContent = "Kalkulator perhitungan khusus KINGKONG tersedia.";
      marketCalcStatus.className = "market-calc-status";
    } else if (currentMarket === "HONGKONG" || currentMarket === "SYDNEY") {
      marketCalcStatus.textContent = "Kalkulator khusus " + currentMarket + " tersedia.";
      marketCalcStatus.className = "market-calc-status";
    } else if (
      currentMarket === "TOTO MACAU 4D" ||
      currentMarket === "TOTO MACAU 5D" ||
      currentMarket === "TOTOMALI" ||
      currentMarket === "HOKI DRAW" ||
      currentMarket === "JAKARTA"
    ) {
      marketCalcStatus.textContent = "Kalkulator khusus " + currentMarket + " tersedia.";
      marketCalcStatus.className = "market-calc-status";
    } else {
      marketCalcStatus.textContent = "Perhitungan khusus pasaran ini belum ditampilkan.";
      marketCalcStatus.className = "market-calc-status no-calc";
    }
  }

  let html = "";
  SECTION_ORDER.forEach(sectionName => {
    if (!sections[sectionName]) return;
    if (currentTab !== "Semua" && currentTab !== sectionName) return;

    let items = sections[sectionName];
    if (query) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        String(item.reward ?? "").toLowerCase().includes(query) ||
        String(item.kei ?? "").toLowerCase().includes(query)
      );
    }
    if (!items.length) return;

    if (sectionName === "Prize") {
      html += groupedPrizeSectionHtml(items);
      return;
    }

    html += `<section class="section">
      <div class="section-title"><h2>${escapeHtml(sectionName)}</h2></div>
      <div class="grid">${items.map(item => cardHtml(item, query)).join("")}</div>
    </section>`;
  });

  content.innerHTML = html || '<div class="empty">Tidak ada data yang cocok.</div>';
}


function prizeCopyLines(items) {
  const groups = {
    "1": { title: "Prize 1", rows: [] },
    "2": { title: "Prize 2", rows: [] },
    "3": { title: "Prize 3", rows: [] }
  };
  const digitMap = { "1": "4D", "2": "3D", "3": "2D" };

  items.forEach(item => {
    const match = String(item.name || "").match(/PRIZE\s*(\d+)\s*-\s*(\d+)/i);
    if (!match || !groups[match[1]]) return;

    groups[match[1]].rows.push({
      digit: digitMap[match[2]] || (match[2] + "D"),
      discount: item.discount,
      reward: item.reward
    });
  });

  const lines = ["=== Prize ==="];

  ["1","2","3"].forEach(key => {
    const group = groups[key];
    if (!group.rows.length) return;

    lines.push(group.title);
    group.rows.forEach(row => {
      lines.push(row.digit + " | Diskon: " + row.discount + "% | Hadiah: x" + row.reward);
    });
    lines.push("");
  });

  if (lines[lines.length - 1] === "") lines.pop();
  return lines;
}


function currentMarketText() {
  const sections = sectionsFor(currentMarket);
  const lines = [currentMarket, ""];

  SECTION_ORDER.forEach(sectionName => {
    if (!sections[sectionName]) return;

    if (sectionName === "Prize") {
      lines.push(...prizeCopyLines(sections[sectionName]));
      lines.push("");
      return;
    }

    lines.push("=== " + sectionName + " ===");
    sections[sectionName].forEach(item => lines.push(itemLine(item)));
    lines.push("");
  });

  return lines.join("\n").trim();
}



/* GROUPING */
function commonMainSections() {
  const src = DATA.profiles["standard_no_prize"].sections;
  return {
    "Diskon": src["Diskon"],
    "Bet Full": src["Bet Full"],
    "Tepat & BB": src["Tepat & BB"],
    "Lainnya": src["Lainnya"]
  };
}

function commonMainTitle() {
  return "Hadiah semua pasaran kecuali: " + COMMON_EXCLUDED_MARKETS.join(" / ");
}

function prizeTitle() {
  return "Hadiah khusus Prize 1, Prize 2 & Prize 3";
}

function sectionText(name, items) {
  const lines = ["=== " + name + " ==="];
  items.forEach(item => lines.push(itemLine(item)));
  return lines.join("\n");
}

function commonMainText() {
  const sections = commonMainSections();
  const lines = [
    commonMainTitle(),
    "",
    "Pasaran yang menggunakan hadiah ini:",
    COMMON_MAIN_MARKETS.join(" / "),
    ""
  ];

  ["Diskon","Bet Full","Tepat & BB","Lainnya"].forEach(name => {
    lines.push(sectionText(name, sections[name]));
    lines.push("");
  });

  return lines.join("\n").trim();
}

function prizeOnlyText() {
  return [
    "Hadiah khusus Prize 1, Prize 2 & Prize 3",
    "Sistem betting Prize 1, Prize 2 & Prize 3 hanya khusus pada pasaran berikut:",
    PRIZE_MARKETS.join(" / "),
    "",
    "Prize 1",
    "4D | Diskon: 0% | Hadiah: x6500",
    "3D | Diskon: 0% | Hadiah: x650",
    "2D | Diskon: 0% | Hadiah: x70",
    "",
    "Prize 2",
    "4D | Diskon: 0% | Hadiah: x2100",
    "3D | Diskon: 0% | Hadiah: x210",
    "2D | Diskon: 0% | Hadiah: x20",
    "",
    "Prize 3",
    "4D | Diskon: 0% | Hadiah: x1100",
    "3D | Diskon: 0% | Hadiah: x110",
    "2D | Diskon: 0% | Hadiah: x8"
  ].join("\n");
}

function marketsForProfile(profileKey) {
  return Object.keys(DATA.markets).filter(market => DATA.markets[market] === profileKey);
}

function specialText(profileKey) {
  const sections = DATA.profiles[profileKey].sections;
  const title = SPECIAL_GROUP_NAMES[profileKey];
  const lines = [title, ""];

  SECTION_ORDER.forEach(name => {
    if (!sections[name]) return;
    if (name === "Prize") return;
    lines.push(sectionText(name, sections[name]));
    lines.push("");
  });

  return lines.join("\n").trim();
}


const COPY_NON_PRIZE_SECTIONS = ["Diskon", "Bet Full", "Tepat & BB", "Lainnya"];

function normalizedCopyValue(field, value) {
  if (field === "reward") {
    return parseRewardMultiplier(value);
  }

  if (field === "discount") {
    const n = Number(value || 0);
    return Number.isFinite(n) ? n : 0;
  }

  if (field === "kei") {
    const n = parseFloat(String(value ?? "").replace("%", ""));
    return Number.isFinite(n) ? n : null;
  }

  return String(value ?? "").trim().toUpperCase();
}

function sectionSignatureForMarket(market, sectionNames) {
  const sections = sectionsFor(market);

  const normalized = sectionNames.map(sectionName => {
    const items = sections[sectionName] || [];

    return {
      section: sectionName,
      items: items.map(item => ({
        name: normalizedCopyValue("name", item.name),
        discount: normalizedCopyValue("discount", item.discount),
        reward: item.reward === undefined ? null : normalizedCopyValue("reward", item.reward),
        kei: item.kei === undefined ? null : normalizedCopyValue("kei", item.kei)
      }))
    };
  });

  return JSON.stringify(normalized);
}

function groupMarketsByCurrentValues(markets, sectionNames) {
  const groupsBySignature = new Map();

  markets.forEach(market => {
    const signature = sectionSignatureForMarket(market, sectionNames);

    if (!groupsBySignature.has(signature)) {
      groupsBySignature.set(signature, {
        signature,
        markets: [],
        sampleMarket: market
      });
    }

    groupsBySignature.get(signature).markets.push(market);
  });

  return Array.from(groupsBySignature.values());
}

function dynamicNonPrizeGroupText(group) {
  const sections = sectionsFor(group.sampleMarket);
  const lines = [];

  if (group.markets.length === 1) {
    lines.push("Hadiah pasaran " + group.markets[0]);
  } else {
    lines.push("Hadiah pasaran gabungan");
  }

  lines.push("");
  lines.push("Pasaran yang menggunakan hadiah ini:");
  lines.push(group.markets.join(" / "));
  lines.push("");

  COPY_NON_PRIZE_SECTIONS.forEach(sectionName => {
    const items = sections[sectionName];
    if (!items || !items.length) return;

    lines.push(sectionText(sectionName, items));
    lines.push("");
  });

  return lines.join("\n").trim();
}

function dynamicPrizeGroupText(group) {
  const sections = sectionsFor(group.sampleMarket);
  const prizeItems = sections["Prize"] || [];
  const lines = [
    "Hadiah khusus Prize 1, Prize 2 & Prize 3",
    "",
    "Pasaran yang menggunakan hadiah Prize ini:",
    group.markets.join(" / "),
    ""
  ];

  lines.push(...prizeCopyLines(prizeItems));
  return lines.join("\n").trim();
}

function dynamicAllGroupsText() {
  const allMarkets = Object.keys(DATA.markets);

  // Semua hadiah non-Prize dibandingkan berdasarkan nilai AKTUAL.
  // Pasaran dengan data identik otomatis masuk grup yang sama.
  const nonPrizeGroups = groupMarketsByCurrentValues(
    allMarkets,
    COPY_NON_PRIZE_SECTIONS
  );

  // Prize tetap dipisahkan sebagai kategori sendiri,
  // tetapi nilai Prize juga dikelompokkan otomatis bila suatu hari diedit.
  const marketsWithPrize = allMarkets.filter(market => {
    const prize = sectionsFor(market)["Prize"];
    return Array.isArray(prize) && prize.length > 0;
  });

  const prizeGroups = groupMarketsByCurrentValues(
    marketsWithPrize,
    ["Prize"]
  );

  const blocks = [
    ...nonPrizeGroups.map(dynamicNonPrizeGroupText),
    ...prizeGroups.map(dynamicPrizeGroupText)
  ];

  return blocks.join("\n\n========================================\n\n");
}



const COMMON_CALC_TYPES = [
  "Diskon",
  "Full",
  "Bolak Balik",
  "Colok Bebas",
  "Colok Bebas 2D",
  "Colok Naga",
  "Colok Jitu",
  "Shio",
  "Macau Shio",
  "Kombinasi",
  "50-50",
  "Silang Homo",
  "Tengah Tepi",
  "Kembang - Kempis - Kembar",
  "Dasar"
];

function rp(value) {
  const n = Number(value || 0);
  return "Rp." + Math.round(n).toLocaleString("id-ID");
}


function calcTypesForMarket(baseTypes, market = currentMarket) {
  const types = [...baseTypes];

  if (PRIZE_MARKETS.includes(market) && !types.includes("Prize")) {
    const fullIndex = types.indexOf("Full");
    if (fullIndex >= 0) {
      types.splice(fullIndex + 1, 0, "Prize");
    } else {
      types.unshift("Prize");
    }
  }

  return types;
}

function prizeCalcText(bet) {
  return [
    "Jika anda Betting Tipe Prize Dengan nominal " + rp(bet) + " Berikut Perhitungan dan Kemenangan anda :",
    "",
    "PRIZE 1",
    "4D = " + rp(bet) + " x 6500 = " + rp(bet * 6500) + ",-",
    "3D = " + rp(bet) + " x 650 = " + rp(bet * 650) + ",-",
    "2D = " + rp(bet) + " x 70 = " + rp(bet * 70) + ",-",
    "",
    "PRIZE 2",
    "4D = " + rp(bet) + " x 2100 = " + rp(bet * 2100) + ",-",
    "3D = " + rp(bet) + " x 210 = " + rp(bet * 210) + ",-",
    "2D = " + rp(bet) + " x 20 = " + rp(bet * 20) + ",-",
    "",
    "PRIZE 3",
    "4D = " + rp(bet) + " x 1100 = " + rp(bet * 1100) + ",-",
    "3D = " + rp(bet) + " x 110 = " + rp(bet * 110) + ",-",
    "2D = " + rp(bet) + " x 8 = " + rp(bet * 8) + ",-"
  ].join("\n");
}


function calcDiscountReward(bet, discount, reward) {
  const bayar = bet * (1 - discount / 100);
  const hadiah = bet * reward;
  return {bayar, hadiah, total: bayar + hadiah};
}


function parseRewardMultiplier(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return 0;

  // Format hadiah memakai titik baik sebagai ribuan (6.000) maupun desimal (1.5).
  // Jika pola titiknya 3 digit per grup, anggap sebagai pemisah ribuan.
  if (/^\d{1,3}(?:\.\d{3})+$/.test(raw)) {
    return Number(raw.replace(/\./g, ""));
  }

  const normalized = raw.replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function dynamicNormName(value) {
  return String(value || "").toUpperCase().replace(/\s+/g, " ").trim();
}

function dynamicItems(market, sectionName) {
  const sections = sectionsFor(market);
  return sections[sectionName] || [];
}

function dynamicRewardLines(lines, bet, market, title, items, options = {}) {
  const simpleOnly = !!options.simpleOnly;
  const showTotal = options.showTotal !== false;

  lines.push("Jika Anda Betting Tipe " + title + " " + market + " Dengan Nominal " + rp(bet) + ":");

  items.forEach((item, index) => {
    const discount = Number(item.discount || 0);
    const reward = parseRewardMultiplier(item.reward);
    const rewardLabel = String(item.reward ?? reward);
    const c = calcDiscountReward(bet, discount, reward);

    if (items.length > 1 || !simpleOnly) lines.push("");
    lines.push(copyTitleCase(item.name));

    if (simpleOnly) {
      lines.push("- Hadiah = x" + rewardLabel);
      lines.push("- Menang = " + rp(bet) + " x " + rewardLabel + " = " + rp(c.hadiah));
      return;
    }

    lines.push("- Diskon = " + discount + "%");
    lines.push("- Hadiah = x" + rewardLabel);
    lines.push("- Bettingan - (Bettingan x Diskon) = " + rp(bet) + " - (" + rp(bet) + " x " + discount + "%) = " + rp(c.bayar));
    lines.push("- Maka yang Anda bayarkan = " + rp(c.bayar));
    lines.push("- Bettingan x Hadiah = " + rp(bet) + " x " + rewardLabel + " = " + rp(c.hadiah));
    if (showTotal) {
      lines.push("- Jika menang, Total = " + rp(c.bayar) + " + " + rp(c.hadiah) + " = " + rp(c.total));
    }
  });
}

function dynamicFullLines(lines, bet, market, items) {
  lines.push("Jika Anda Betting Tipe Full " + market + " Dengan Nominal " + rp(bet) + ":");

  items.forEach(item => {
    const reward = parseRewardMultiplier(item.reward);
    const rewardLabel = String(item.reward ?? reward);
    const label = copyTitleCase(item.name).replace(/^Bet Full\s*/i, "Hadiah ");
    lines.push("- " + label + " = " + rp(bet) + " x " + rewardLabel + " = " + rp(bet * reward));
  });
}

function dynamicBolakBalikLines(lines, bet, market, items) {
  lines.push("Jika Anda Betting Tipe Bolak Balik " + market + " Dengan Nominal " + rp(bet) + ":");

  items.forEach(item => {
    const reward = parseRewardMultiplier(item.reward);
    const rewardLabel = String(item.reward ?? reward);
    let label = copyTitleCase(item.name);
    if (/\sBB$/i.test(label)) label = label.replace(/\sBB$/i, " Terbalik / BB");
    lines.push("- " + label + " = " + rp(bet) + " x " + rewardLabel + " = " + rp(bet * reward));
  });
}

function dynamicKeiItemLines(lines, bet, market, item, labelOverride = "") {
  if (!item) return;

  const discount = Number(item.discount || 0);
  const kei = parseFloat(String(item.kei || "0").replace("%", "")) || 0;
  const label = labelOverride || copyTitleCase(item.name);

  lines.push(label);
  lines.push("- Diskon = " + discount + "%");
  lines.push("- Kei = " + (kei > 0 ? "+" : "") + kei + "%");

  if (kei < 0) {
    const c = negativeKeiCalc(bet, Math.abs(kei), discount);
    lines.push("- Bettingan - (Bettingan x Kei " + kei + "%) = " + rp(bet) + " - (" + rp(bet) + " x " + kei + "%) = " + rp(c.hasilKei));

    if (discount > 0) {
      lines.push("- Hasil Kei - (Hasil Kei x Diskon " + discount + "%) = " + rp(c.hasilKei) + " - (" + rp(c.hasilKei) + " x " + discount + "%) = " + rp(c.bayar));
    }

    lines.push("- Maka yang Anda bayarkan = " + rp(c.bayar));
    lines.push("- Jika menang, Total Kemenangan = " + rp(bet) + " + " + rp(c.bayar) + " = " + rp(c.total));
  } else {
    const bayar = bet * (1 - discount / 100);
    const nilaiKei = bet * (kei / 100);
    const menang = bet + nilaiKei;
    const total = bayar + menang;

    lines.push("- Bettingan - (Bettingan x Diskon " + discount + "%) = " + rp(bet) + " - (" + rp(bet) + " x " + discount + "%) = " + rp(bayar));
    lines.push("- Bettingan x Kei " + kei + "% = " + rp(bet) + " x " + kei + "% = " + rp(nilaiKei));
    lines.push("- Jika menang = Bettingan + Kei = " + rp(bet) + " + " + rp(nilaiKei) + " = " + rp(menang));
    lines.push("- Total yang Anda dapatkan = " + rp(bayar) + " + " + rp(menang) + " = " + rp(total));
  }
}

function dynamicPrizeCalcText(market, bet) {
  const items = dynamicItems(market, "Prize");
  if (!items.length) return "Pasaran " + market + " tidak memiliki kategori Prize.";

  const groups = {
    "1": { title: "PRIZE 1", rows: [] },
    "2": { title: "PRIZE 2", rows: [] },
    "3": { title: "PRIZE 3", rows: [] }
  };
  const digitMap = { "1": "4D", "2": "3D", "3": "2D" };

  items.forEach(item => {
    const match = String(item.name || "").match(/PRIZE\s*(\d+)\s*-\s*(\d+)/i);
    if (!match || !groups[match[1]]) return;
    groups[match[1]].rows.push({
      digit: digitMap[match[2]] || (match[2] + "D"),
      reward: parseRewardMultiplier(item.reward),
      rewardLabel: String(item.reward ?? ""),
      discount: Number(item.discount || 0)
    });
  });

  const lines = [
    "Jika anda Betting Tipe Prize Dengan nominal " + rp(bet) + " Berikut Perhitungan dan Kemenangan anda :"
  ];

  ["1", "2", "3"].forEach(key => {
    const group = groups[key];
    if (!group.rows.length) return;
    lines.push("");
    lines.push(group.title);

    group.rows.forEach(row => {
      lines.push(row.digit + " = " + rp(bet) + " x " + row.rewardLabel + " = " + rp(bet * row.reward) + ",-");
    });
  });

  return lines.join("\n");
}

function dynamicMarketCalcText(market, type, bet) {
  const sections = sectionsFor(market);
  const diskonItems = sections["Diskon"] || [];
  const fullItems = sections["Bet Full"] || [];
  const tepatItems = sections["Tepat & BB"] || [];
  const lainnya = sections["Lainnya"] || [];
  const lines = [];

  if (type === "Prize") {
    return dynamicPrizeCalcText(market, bet);
  }

  if (type === "Diskon") {
    const items = diskonItems.filter(item => !dynamicNormName(item.name).startsWith("SUPER DISKON"));
    dynamicRewardLines(lines, bet, market, "Diskon", items, {showTotal:false});
  }

  else if (type === "Super Diskon") {
    const items = diskonItems.filter(item => dynamicNormName(item.name).startsWith("SUPER DISKON"));
    dynamicRewardLines(lines, bet, market, "Super Diskon", items, {showTotal:false});
  }

  else if (type === "Full") {
    dynamicFullLines(lines, bet, market, fullItems);
  }

  else if (type === "Bolak Balik") {
    dynamicBolakBalikLines(lines, bet, market, tepatItems);
  }

  else if (type === "Colok Bebas") {
    const items = lainnya.filter(item => {
      const n = dynamicNormName(item.name);
      return n.startsWith("COLOK BEBAS") &&
             !n.startsWith("COLOK BEBAS 2D") &&
             !n.startsWith("COLOK BEBAS 4D");
    });
    dynamicRewardLines(lines, bet, market, "Colok Bebas", items);
  }

  else if (type === "Colok Bebas 2D") {
    const items = lainnya.filter(item => dynamicNormName(item.name).startsWith("COLOK BEBAS 2D"));
    dynamicRewardLines(lines, bet, market, "Colok Bebas 2D", items);
  }

  else if (type === "Colok Bebas 4D") {
    const items = lainnya.filter(item => dynamicNormName(item.name).startsWith("COLOK BEBAS 4D"));
    dynamicRewardLines(lines, bet, market, "Colok Bebas 4D", items);
  }

  else if (type === "Colok Naga") {
    const items = lainnya.filter(item => dynamicNormName(item.name).startsWith("COLOK NAGA"));
    dynamicRewardLines(lines, bet, market, "Colok Naga", items);
  }

  else if (type === "Colok Jitu") {
    const items = lainnya.filter(item => dynamicNormName(item.name) === "COLOK JITU");
    dynamicRewardLines(lines, bet, market, "Colok Jitu", items);
  }

  else if (type === "Shio") {
    const items = lainnya.filter(item => dynamicNormName(item.name) === "SHIO");
    dynamicRewardLines(lines, bet, market, "Shio", items);
  }

  else if (type === "Macau Shio") {
    const items = lainnya.filter(item => dynamicNormName(item.name) === "MACAU SHIO");
    dynamicRewardLines(lines, bet, market, "Macau Shio", items);
  }

  else if (type === "Kombinasi") {
    const items = lainnya.filter(item => dynamicNormName(item.name) === "KOMBINASI");
    dynamicRewardLines(lines, bet, market, "Kombinasi", items);
  }

  else if (type === "50-50") {
    const item = lainnya.find(item => dynamicNormName(item.name).replace(/\s/g, "") === "50-50");
    lines.push("Jika Anda Betting Tipe 50-50 " + market + " Dengan Nominal " + rp(bet) + ":");
    if (item) dynamicKeiItemLines(lines, bet, market, item, "50-50");
  }

  else if (type === "Silang Homo") {
    const item = lainnya.find(item => dynamicNormName(item.name) === "SILANG HOMO");
    lines.push("Jika Anda Betting Tipe Silang Homo " + market + " Dengan Nominal " + rp(bet) + ":");
    if (item) dynamicKeiItemLines(lines, bet, market, item, "Silang Homo");
  }

  else if (type === "Tengah Tepi") {
    const item = lainnya.find(item => dynamicNormName(item.name) === "TENGAH TEPI");
    lines.push("Jika Anda Betting Tipe Tengah Tepi " + market + " Dengan Nominal " + rp(bet) + ":");
    if (item) dynamicKeiItemLines(lines, bet, market, item, "Tengah Tepi");
  }

  else if (type === "Kembang - Kempis - Kembar") {
    const item = lainnya.find(item => dynamicNormName(item.name) === "KEMBANG - KEMPIS - KEMBAR");
    lines.push("Jika Anda Betting Tipe Kembang - Kempis - Kembar " + market + " Dengan Nominal " + rp(bet) + ":");
    if (item) dynamicKeiItemLines(lines, bet, market, item, "Kembang - Kempis - Kembar");
  }

  else if (type === "Kembang - Kempis") {
    const item = lainnya.find(item => dynamicNormName(item.name) === "KEMBANG - KEMPIS");
    lines.push("Jika Anda Betting Tipe Kembang - Kempis " + market + " Dengan Nominal " + rp(bet) + ":");
    if (item) dynamicKeiItemLines(lines, bet, market, item, "Kembang - Kempis");
  }

  else if (type === "Kembar") {
    const item = lainnya.find(item => dynamicNormName(item.name) === "KEMBAR");
    lines.push("Jika Anda Betting Tipe Kembar " + market + " Dengan Nominal " + rp(bet) + ":");
    if (item) dynamicKeiItemLines(lines, bet, market, item, "Kembar");
  }

  else if (type === "Dasar") {
    const ganjil = lainnya.find(item => dynamicNormName(item.name) === "DASAR GANJIL - BESAR");
    const genap = lainnya.find(item => dynamicNormName(item.name) === "DASAR GENAP - KECIL");

    lines.push("Jika Anda Betting Tipe Dasar " + market + " Dengan Nominal " + rp(bet) + ":");

    if (ganjil) {
      lines.push("");
      dynamicKeiItemLines(lines, bet, market, ganjil, "Tipe Taruhan: Ganjil / Besar");
    }
    if (genap) {
      lines.push("");
      dynamicKeiItemLines(lines, bet, market, genap, "Tipe Taruhan: Genap / Kecil");
    }
  }

  if (!lines.length) {
    return "Data perhitungan untuk tipe " + type + " pada pasaran " + market + " belum tersedia.";
  }

  return lines.join("\n");
}

function negativeKeiCalc(bet, keiAbs, discount) {
  // Mengikuti pola ROUNDUP pada rumus: betting + kei, lalu dipotong diskon.
  const hasilKei = Math.ceil(bet + bet * (keiAbs / 100));
  const bayar = Math.ceil((bet + bet * (keiAbs / 100)) * (1 - discount / 100));
  const total = Math.ceil(bet + ((bet + bet * (keiAbs / 100)) * (1 - discount / 100)));
  return {hasilKei, bayar, total};
}

function commonCalcText(type, bet) {
  if (type === "Prize") return dynamicPrizeCalcText(currentMarket, bet);

  const lines = [];
  const add = s => lines.push(s);

  if (type === "Diskon") {
    const rows = [
      ["Diskon 4D", 66, 3000],
      ["Diskon 3D", 59, 400],
      ["Diskon 2D", 29, 70],
      ["Diskon 2D Depan / Tengah", 29, 65]
    ];
    add("Jika Anda Betting Tipe Diskon Dengan Nominal " + rp(bet) + ", Berikut Perhitungan dan Kemenangan Anda:");
    add("");
    rows.forEach((r, i) => {
      const [name, disc, mult] = r;
      const c = calcDiscountReward(bet, disc, mult);
      add(name);
      add("- Diskon = " + disc + "%");
      add("- Hadiah = x" + mult.toLocaleString("id-ID"));
      add("- Bettingan - (Bettingan x Diskon) = " + rp(bet) + " - (" + rp(bet) + " x " + disc + "%) = " + rp(c.bayar));
      add("- Maka yang Anda bayarkan = " + rp(c.bayar));
      add("- Menang = " + rp(bet) + " x " + mult.toLocaleString("id-ID") + " = " + rp(c.hadiah));
      if (i < rows.length - 1) add("");
    });
  }

  else if (type === "Full") {
    add("Jika Anda Betting Tipe FULL Dengan Nominal " + rp(bet) + ":");
    add("- Hadiah 4D = " + rp(bet) + " x 10.000 = " + rp(bet * 10000));
    add("- Hadiah 3D = " + rp(bet) + " x 1.000 = " + rp(bet * 1000));
    add("- Hadiah 2D = " + rp(bet) + " x 100 = " + rp(bet * 100));
  }

  else if (type === "Bolak Balik") {
    add("Jika Anda Betting Tipe Bolak Balik Dengan Nominal " + rp(bet) + ":");
    add("- 4D Tepat = " + rp(bet) + " x 4.000 = " + rp(bet * 4000));
    add("- 4D Terbalik / BB = " + rp(bet) + " x 200 = " + rp(bet * 200));
    add("- 3D Tepat = " + rp(bet) + " x 400 = " + rp(bet * 400));
    add("- 3D Terbalik / BB = " + rp(bet) + " x 100 = " + rp(bet * 100));
    add("- 2D Tepat = " + rp(bet) + " x 70 = " + rp(bet * 70));
    add("- 2D Terbalik / BB = " + rp(bet) + " x 20 = " + rp(bet * 20));
  }

  else if (type === "Colok Bebas") {
    const rows = [
      ["1 Digit", 1.5],
      ["2 Digit", 3],
      ["3 Digit", 4.5],
      ["4 Digit", 6]
    ];
    add("Jika Anda Betting Tipe Colok Bebas Dengan Nominal " + rp(bet) + ":");
    rows.forEach((r, i) => {
      const c = calcDiscountReward(bet, 6, r[1]);
      add("");
      add("Untuk Kategori Colok Bebas (" + r[0] + ")");
      add("- Diskon = 6%");
      add("- Hadiah = x" + r[1]);
      add("- Bettingan - (Bettingan x Diskon) = " + rp(bet) + " - (" + rp(bet) + " x 6%) = " + rp(c.bayar));
      add("- Maka yang Anda bayarkan = " + rp(c.bayar));
      add("- Bettingan x Hadiah = " + rp(bet) + " x " + r[1] + " = " + rp(c.hadiah));
      add("- Jika menang, Total = " + rp(c.bayar) + " + " + rp(c.hadiah) + " = " + rp(c.total));
    });
  }

  else if (type === "Colok Bebas 2D") {
    const rows = [
      ["2 Digit", 7],
      ["3 Digit", 11],
      ["4 Digit", 18]
    ];
    add("Jika Anda Betting Tipe Colok Bebas 2D Dengan Nominal " + rp(bet) + ":");
    rows.forEach(r => {
      const c = calcDiscountReward(bet, 10, r[1]);
      add("");
      add("Untuk Kategori Colok Bebas 2D (" + r[0] + ")");
      add("- Diskon = 10%");
      add("- Hadiah = x" + r[1]);
      add("- Yang Anda bayarkan = " + rp(c.bayar));
      add("- Bettingan x Hadiah = " + rp(bet) + " x " + r[1] + " = " + rp(c.hadiah));
      add("- Jika menang, Total = " + rp(c.bayar) + " + " + rp(c.hadiah) + " = " + rp(c.total));
    });
  }

  else if (type === "Colok Naga") {
    const rows = [["3 Digit", 23], ["4 Digit", 35]];
    add("Jika Anda Betting Tipe Colok Naga Dengan Nominal " + rp(bet) + ":");
    rows.forEach(r => {
      const c = calcDiscountReward(bet, 10, r[1]);
      add("");
      add("Untuk Kategori Colok Naga (" + r[0] + ")");
      add("- Diskon = 10%");
      add("- Hadiah = x" + r[1]);
      add("- Yang Anda bayarkan = " + rp(c.bayar));
      add("- Bettingan x Hadiah = " + rp(bet) + " x " + r[1] + " = " + rp(c.hadiah));
      add("- Jika menang, Total = " + rp(c.hadiah) + " + " + rp(c.bayar) + " = " + rp(c.total));
    });
  }

  else if (type === "Colok Jitu") {
    const c = calcDiscountReward(bet, 6, 8);
    add("Jika Anda Betting Tipe Colok Jitu Dengan Nominal " + rp(bet) + ":");
    add("- Diskon = 6%");
    add("- Hadiah = x8");
    add("- Yang Anda bayarkan = " + rp(c.bayar));
    add("- Bettingan x Hadiah = " + rp(bet) + " x 8 = " + rp(c.hadiah));
    add("- Jika menang, Total = " + rp(c.bayar) + " + " + rp(c.hadiah) + " = " + rp(c.total));
  }

  else if (type === "Shio") {
    const c = calcDiscountReward(bet, 5, 9.5);
    add("Jika Anda Betting Tipe Shio Dengan Nominal " + rp(bet) + ":");
    add("- Diskon = 5%");
    add("- Hadiah = x9.5");
    add("- Yang Anda bayarkan = " + rp(c.bayar));
    add("- Bettingan x Hadiah = " + rp(bet) + " x 9.5 = " + rp(c.hadiah));
    add("- Jika menang, Total = " + rp(c.bayar) + " + " + rp(c.hadiah) + " = " + rp(c.total));
  }

  else if (type === "Macau Shio") {
    const c = calcDiscountReward(bet, 10, 110);
    add("Jika Anda Betting Tipe Macau Shio Dengan Nominal " + rp(bet) + ":");
    add("- Diskon = 10%");
    add("- Hadiah = x110");
    add("- Yang Anda bayarkan = " + rp(c.bayar));
    add("- Bettingan x Hadiah = " + rp(bet) + " x 110 = " + rp(c.hadiah));
    add("- Jika menang, Total = " + rp(c.hadiah) + " + " + rp(c.bayar) + " = " + rp(c.total));
  }

  else if (type === "Kombinasi") {
    const c = calcDiscountReward(bet, 8, 2.6);
    add("Jika Anda Betting Tipe Kombinasi Dengan Nominal " + rp(bet) + ":");
    add("- Diskon = 8%");
    add("- Hadiah = x2.6");
    add("- Yang Anda bayarkan = " + rp(c.bayar));
    add("- Bettingan x Hadiah = " + rp(bet) + " x 2.6 = " + rp(c.hadiah));
    add("- Jika menang, Total = " + rp(c.hadiah) + " + " + rp(c.bayar) + " = " + rp(c.total));
  }

  else if (type === "50-50" || type === "Silang Homo" || type === "Tengah Tepi" || type === "Kembang - Kempis - Kembar") {
    const c = negativeKeiCalc(bet, 3, 2);
    add("Jika Anda Betting Tipe " + type + " Dengan Nominal " + rp(bet) + ":");
    add("- Kei = -3%");
    add("- Diskon = 2%");
    add("- Bettingan - (Bettingan x Kei -3%) = " + rp(bet) + " - (" + rp(bet) + " x -3%) = " + rp(c.hasilKei));
    add("- Hasil Kei - (Hasil Kei x Diskon 2%) = " + rp(c.hasilKei) + " - (" + rp(c.hasilKei) + " x 2%) = " + rp(c.bayar));
    add("- Maka yang Anda bayarkan = " + rp(c.bayar));
    add("- Jika menang, Total Kemenangan = " + rp(bet) + " + " + rp(c.bayar) + " = " + rp(c.total));
  }

  else if (type === "Dasar") {
    // Ganjil/Besar
    const hasilKeiMinus = bet + bet * 0.25;
    const bayarMinus = hasilKeiMinus * 0.98;
    const totalMinus = bet + bayarMinus;

    add("Jika Anda Betting Tipe Dasar Dengan Nominal " + rp(bet) + ":");
    add("");
    add("Tipe Taruhan: Ganjil / Besar");
    add("- Diskon = 2%");
    add("- Kei = -25%");
    add("- Bettingan - (Bettingan x Kei -25%) = " + rp(bet) + " - (" + rp(bet) + " x -25%) = " + rp(hasilKeiMinus));
    add("- Hasil Kei - (Hasil Kei x Diskon 2%) = " + rp(hasilKeiMinus) + " - (" + rp(hasilKeiMinus) + " x 2%) = " + rp(bayarMinus));
    add("- Jika menang, Total = " + rp(bet) + " + " + rp(bayarMinus) + " = " + rp(totalMinus));

    // Genap/Kecil
    const setelahDiskon = bet * 0.98;
    const keiPlus = bet * 0.10;
    const bayarPlus = setelahDiskon + keiPlus;
    const totalPlus = bet + bayarPlus;

    add("");
    add("Tipe Taruhan: Genap / Kecil");
    add("- Diskon = 2%");
    add("- Kei = +10%");
    add("- Bettingan - (Bettingan x Diskon 2%) = " + rp(bet) + " - (" + rp(bet) + " x 2%) = " + rp(setelahDiskon));
    add("- Bettingan x Kei 10% = " + rp(bet) + " x 10% = " + rp(keiPlus));
    add("- Yang Anda bayarkan + Kei = " + rp(setelahDiskon) + " + " + rp(keiPlus) + " = " + rp(bayarPlus));
    add("- Jika menang, Total = " + rp(bet) + " + " + rp(bayarPlus) + " = " + rp(totalPlus));
  }

  return lines.join("\n");
}


const KINGKONG_CALC_TYPES = [
  "Diskon",
  "Full",
  "Bolak Balik",
  "Colok Bebas",
  "Colok Bebas 2D",
  "Colok Naga",
  "Colok Jitu",
  "Shio",
  "Macau Shio",
  "Kombinasi",
  "50-50",
  "Silang Homo",
  "Tengah Tepi",
  "Kembang - Kempis",
  "Kembar",
  "Dasar"
];

function kingkongNegativeKei(bet, keiAbs) {
  const hasilKei = Math.ceil(bet + bet * (keiAbs / 100));
  const bayar = hasilKei; // Diskon KINGKONG untuk tipe Kei ini = 0%
  const total = Math.ceil(bet + bayar);
  return { hasilKei, bayar, total };
}

function kingkongPositiveKei(bet, keiPercent) {
  // Mengikuti logika script kalkulator awal:
  // bayar = betting setelah diskon (diskon KINGKONG = 0%)
  // menang = betting + nilai Kei positif
  // total = bayar + menang
  const bayar = Math.round(bet);
  const nilaiKei = Math.round(bet * (keiPercent / 100));
  const menang = Math.round(bet + nilaiKei);
  const total = Math.round(bayar + menang);
  return { bayar, nilaiKei, menang, total };
}

function kingkongRewardCalc(bet, reward) {
  const bayar = Math.round(bet); // diskon 0%
  const hadiah = Math.round(bet * reward);
  const total = Math.round(bayar + hadiah);
  return { bayar, hadiah, total };
}

function kingkongCalcText(type, bet) {
  const lines = [];
  const add = s => lines.push(s);

  if (type === "Diskon") {
    const rows = [
      ["Diskon 4D", 33, 6000],
      ["Diskon 3D", 24, 700],
      ["Diskon 2D", 15, 80]
    ];

    add("Jika Anda Betting Tipe Diskon KINGKONG Dengan Nominal " + rp(bet) + ", Berikut Perhitungan dan Kemenangan Anda:");
    add("");

    rows.forEach((r, index) => {
      const [name, disc, reward] = r;
      const bayar = Math.round(bet * (1 - disc / 100));
      const menang = Math.round(bet * reward);

      add(name);
      add("- Diskon = " + disc + "%");
      add("- Hadiah = x" + reward.toLocaleString("id-ID"));
      add("- Bettingan - (Bettingan x Diskon) = " + rp(bet) + " - (" + rp(bet) + " x " + disc + "%) = " + rp(bayar));
      add("- Maka yang Anda bayarkan = " + rp(bayar));
      add("- Menang Hitungan nilai bettingan = " + rp(bet) + " x " + reward.toLocaleString("id-ID") + " = " + rp(menang));
      if (index < rows.length - 1) add("");
    });
  }

  else if (type === "Full") {
    add("Jika Anda Betting Tipe FULL KINGKONG Dengan Nominal " + rp(bet) + ":");
    add("- Hadiah 4D = " + rp(bet) + " x 9.000 = " + rp(bet * 9000));
    add("- Hadiah 3D = " + rp(bet) + " x 950 = " + rp(bet * 950));
    add("- Hadiah 2D = " + rp(bet) + " x 95 = " + rp(bet * 95));
  }

  else if (type === "Bolak Balik") {
    add("Jika Anda Betting Tipe Bolak Balik KINGKONG Dengan Nominal " + rp(bet) + ":");
    add("- 4D Tepat = " + rp(bet) + " x 4.000 = " + rp(bet * 4000));
    add("- 4D Terbalik / BB = " + rp(bet) + " x 200 = " + rp(bet * 200));
    add("- 3D Tepat = " + rp(bet) + " x 400 = " + rp(bet * 400));
    add("- 3D Terbalik / BB = " + rp(bet) + " x 100 = " + rp(bet * 100));
    add("- 2D Tepat = " + rp(bet) + " x 70 = " + rp(bet * 70));
    add("- 2D Terbalik / BB = " + rp(bet) + " x 20 = " + rp(bet * 20));
  }

  else if (type === "Colok Bebas") {
    const rows = [
      ["1 Digit", 1.6],
      ["2 Digit", 3.2],
      ["3 Digit", 4.8],
      ["4 Digit", 6.4]
    ];

    add("Jika Anda Betting Tipe Colok Bebas KINGKONG Dengan Nominal " + rp(bet) + ":");

    rows.forEach(r => {
      const c = kingkongRewardCalc(bet, r[1]);
      add("");
      add("Untuk Kategori Colok Bebas (" + r[0] + ")");
      add("- Diskon = 0%");
      add("- Hadiah = x" + r[1]);
      add("- Bettingan - (Bettingan x Diskon) = " + rp(bet) + " - (" + rp(bet) + " x 0%) = " + rp(c.bayar));
      add("- Maka yang Anda bayarkan = " + rp(c.bayar));
      add("- Bettingan x Hadiah = " + rp(bet) + " x " + r[1] + " = " + rp(c.hadiah));
      add("- Jika menang, Total = " + rp(c.bayar) + " + " + rp(c.hadiah) + " = " + rp(c.total));
    });
  }

  else if (type === "Colok Bebas 2D") {
    const rows = [
      ["2 Digit", 7],
      ["3 Digit", 13],
      ["4 Digit", 21]
    ];

    add("Jika Anda Betting Tipe Colok Bebas 2D KINGKONG Dengan Nominal " + rp(bet) + ":");

    rows.forEach(r => {
      const c = kingkongRewardCalc(bet, r[1]);
      add("");
      add("Untuk Kategori Colok Bebas 2D (" + r[0] + ")");
      add("- Diskon = 0%");
      add("- Hadiah = x" + r[1]);
      add("- Yang Anda bayarkan = " + rp(c.bayar));
      add("- Bettingan x Hadiah = " + rp(bet) + " x " + r[1] + " = " + rp(c.hadiah));
      add("- Jika menang, Total = " + rp(c.bayar) + " + " + rp(c.hadiah) + " = " + rp(c.total));
    });
  }

  else if (type === "Colok Naga") {
    const rows = [
      ["3 Digit", 27],
      ["4 Digit", 41]
    ];

    add("Jika Anda Betting Tipe Colok Naga KINGKONG Dengan Nominal " + rp(bet) + ":");

    rows.forEach(r => {
      const c = kingkongRewardCalc(bet, r[1]);
      add("");
      add("Untuk Kategori Colok Naga (" + r[0] + ")");
      add("- Diskon = 0%");
      add("- Hadiah = x" + r[1]);
      add("- Yang Anda bayarkan = " + rp(c.bayar));
      add("- Bettingan x Hadiah = " + rp(bet) + " x " + r[1] + " = " + rp(c.hadiah));
      add("- Jika menang, Total = " + rp(c.hadiah) + " + " + rp(c.bayar) + " = " + rp(c.total));
    });
  }

  else if (type === "Colok Jitu") {
    const c = kingkongRewardCalc(bet, 8.3);
    add("Jika Anda Betting Tipe Colok Jitu KINGKONG Dengan Nominal " + rp(bet) + ":");
    add("- Diskon = 0%");
    add("- Hadiah = x8.3");
    add("- Yang Anda bayarkan = " + rp(c.bayar));
    add("- Bettingan x Hadiah = " + rp(bet) + " x 8.3 = " + rp(c.hadiah));
    add("- Jika menang, Total = " + rp(c.bayar) + " + " + rp(c.hadiah) + " = " + rp(c.total));
  }

  else if (type === "Shio") {
    const c = kingkongRewardCalc(bet, 10);
    add("Jika Anda Betting Tipe Shio KINGKONG Dengan Nominal " + rp(bet) + ":");
    add("- Diskon = 0%");
    add("- Hadiah = x10");
    add("- Yang Anda bayarkan = " + rp(c.bayar));
    add("- Bettingan x Hadiah = " + rp(bet) + " x 10 = " + rp(c.hadiah));
    add("- Jika menang, Total = " + rp(c.bayar) + " + " + rp(c.hadiah) + " = " + rp(c.total));
  }

  else if (type === "Macau Shio") {
    const c = kingkongRewardCalc(bet, 110);
    add("Jika Anda Betting Tipe Macau Shio KINGKONG Dengan Nominal " + rp(bet) + ":");
    add("- Diskon = 0%");
    add("- Hadiah = x110");
    add("- Yang Anda bayarkan = " + rp(c.bayar));
    add("- Bettingan x Hadiah = " + rp(bet) + " x 110 = " + rp(c.hadiah));
    add("- Jika menang, Total = " + rp(c.hadiah) + " + " + rp(c.bayar) + " = " + rp(c.total));
  }

  else if (type === "Kombinasi") {
    const c = kingkongRewardCalc(bet, 2.8);
    add("Jika Anda Betting Tipe Kombinasi KINGKONG Dengan Nominal " + rp(bet) + ":");
    add("- Diskon = 0%");
    add("- Hadiah = x2.8");
    add("- Yang Anda bayarkan = " + rp(c.bayar));
    add("- Bettingan x Hadiah = " + rp(bet) + " x 2.8 = " + rp(c.hadiah));
    add("- Jika menang, Total = " + rp(c.hadiah) + " + " + rp(c.bayar) + " = " + rp(c.total));
  }

  else if (type === "50-50") {
    const c = kingkongNegativeKei(bet, 5);
    add("Jika Anda Betting Tipe 50-50 KINGKONG Dengan Nominal " + rp(bet) + ":");
    add("- Kei = -5%");
    add("- Diskon = 0%");
    add("- Bettingan - (Bettingan x Kei -5%) = " + rp(bet) + " - (" + rp(bet) + " x -5%) = " + rp(c.hasilKei));
    add("- Maka yang Anda bayarkan = " + rp(c.bayar));
    add("- Jika menang, Total Kemenangan = " + rp(bet) + " + " + rp(c.bayar) + " = " + rp(c.total));
  }

  else if (type === "Silang Homo" || type === "Tengah Tepi" || type === "Kembang - Kempis") {
    const c = kingkongNegativeKei(bet, 2.2);
    add("Jika Anda Betting Tipe " + type + " KINGKONG Dengan Nominal " + rp(bet) + ":");
    add("- Kei = -2.2%");
    add("- Diskon = 0%");
    add("- Bettingan - (Bettingan x Kei -2.2%) = " + rp(bet) + " - (" + rp(bet) + " x -2.2%) = " + rp(c.hasilKei));
    add("- Maka yang Anda bayarkan = " + rp(c.bayar));
    add("- Jika menang, Total Kemenangan = " + rp(bet) + " + " + rp(c.bayar) + " = " + rp(c.total));
  }

  else if (type === "Kembar") {
    const c = kingkongPositiveKei(bet, 50);
    add("Jika Anda Betting Tipe Kembar KINGKONG Dengan Nominal " + rp(bet) + ":");
    add("- Kei = +50%");
    add("- Diskon = 0%");
    add("- Yang Anda bayarkan = " + rp(c.bayar));
    add("- Nilai Kei 50% = " + rp(bet) + " x 50% = " + rp(c.nilaiKei));
    add("- Jika menang = Bettingan + Kei = " + rp(bet) + " + " + rp(c.nilaiKei) + " = " + rp(c.menang));
    add("- Total yang Anda dapatkan = " + rp(c.bayar) + " + " + rp(c.menang) + " = " + rp(c.total));
  }

  else if (type === "Dasar") {
    const minus = kingkongNegativeKei(bet, 25);
    const plus = kingkongPositiveKei(bet, 10);

    add("Jika Anda Betting Tipe Dasar KINGKONG Dengan Nominal " + rp(bet) + ":");
    add("");
    add("Tipe Taruhan: Ganjil / Besar");
    add("- Diskon = 0%");
    add("- Kei = -25%");
    add("- Bettingan - (Bettingan x Kei -25%) = " + rp(bet) + " - (" + rp(bet) + " x -25%) = " + rp(minus.hasilKei));
    add("- Maka yang Anda bayarkan = " + rp(minus.bayar));
    add("- Jika menang, Total = " + rp(bet) + " + " + rp(minus.bayar) + " = " + rp(minus.total));

    add("");
    add("Tipe Taruhan: Genap / Kecil");
    add("- Diskon = 0%");
    add("- Kei = +10%");
    add("- Yang Anda bayarkan = " + rp(plus.bayar));
    add("- Nilai Kei 10% = " + rp(bet) + " x 10% = " + rp(plus.nilaiKei));
    add("- Jika menang = Bettingan + Kei = " + rp(bet) + " + " + rp(plus.nilaiKei) + " = " + rp(plus.menang));
    add("- Total yang Anda dapatkan = " + rp(plus.bayar) + " + " + rp(plus.menang) + " = " + rp(plus.total));
  }

  return lines.join("\n");
}

function appendKingkongCalculator(body) {
  const wrap = document.createElement("div");
  wrap.className = "common-calc";

  const title = document.createElement("div");
  title.className = "common-calc-title";
  title.textContent = "KALKULATOR PERHITUNGAN KINGKONG";

  const sub = document.createElement("div");
  sub.className = "common-calc-sub";
  sub.textContent = "Pasaran aktif: KINGKONG. Perhitungan mengikuti hadiah KINGKONG.";

  const types = document.createElement("div");
  types.className = "calc-types";

  let selectedType = "Diskon";

  KINGKONG_CALC_TYPES.forEach(type => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "calc-type" + (type === selectedType ? " active" : "");
    b.textContent = type;

    b.addEventListener("click", () => {
      selectedType = type;
      types.querySelectorAll(".calc-type").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
    });

    types.appendChild(b);
  });

  const controls = document.createElement("div");
  controls.className = "calc-controls";

  const input = document.createElement("input");
  input.type = "number";
  input.min = "1";
  input.step = "1";
  input.inputMode = "numeric";
  input.className = "calc-nominal";
  input.placeholder = "Masukkan nominal betting KINGKONG... contoh 1000";

  const hit = document.createElement("button");
  hit.type = "button";
  hit.className = "calc-action calc-hit";
  hit.textContent = "HITUNG";

  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = "calc-action calc-reset";
  reset.textContent = "RESET";

  controls.append(input, hit, reset);

  const resultWrap = document.createElement("div");
  resultWrap.className = "calc-result-wrap";

  const result = document.createElement("pre");
  result.className = "calc-result";

  const resultActions = document.createElement("div");
  resultActions.className = "calc-result-actions";

  const copyResult = document.createElement("button");
  copyResult.type = "button";
  copyResult.className = "small-btn gold";
  copyResult.textContent = "COPY HASIL PERHITUNGAN";

  resultActions.appendChild(copyResult);
  resultWrap.append(result, resultActions);

  function doCalc() {
    const bet = Number(input.value);

    if (!Number.isFinite(bet) || bet <= 0) {
      result.textContent = "Masukkan nominal betting yang valid terlebih dahulu.";
      resultWrap.classList.add("show");
      return;
    }

    result.textContent = dynamicMarketCalcText(currentMarket, selectedType, bet);
    resultWrap.classList.add("show");
  }

  hit.addEventListener("click", doCalc);

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") doCalc();
  });

  reset.addEventListener("click", () => {
    input.value = "";
    result.textContent = "";
    resultWrap.classList.remove("show");
    input.focus();
  });

  copyResult.addEventListener("click", async () => {
    if (!result.textContent.trim()) {
      result.textContent = "Hitung terlebih dahulu sebelum menyalin hasil.";
      resultWrap.classList.add("show");
      return;
    }

    const ok = await copyText(result.textContent);

    if (ok) {
      flashButton(copyResult, "TERSALIN ✓");
    } else {
      openManual(result.textContent);
      flashButton(copyResult, "COPY MANUAL DIBUKA", 1500);
    }
  });

  wrap.append(title, sub, types, controls, resultWrap);
  body.appendChild(wrap);
}



function hkSydneyCalcText(type, bet) {
  // Semua hadiah HONGKONG / SYDNEY sama dengan grup hadiah utama,
  // kecuali BET FULL.
  if (type !== "Full") {
    return commonCalcText(type, bet);
  }

  const lines = [];
  lines.push("Jika Anda Betting Tipe FULL " + currentMarket + " Dengan Nominal " + rp(bet) + ":");
  lines.push("- Hadiah 4D = " + rp(bet) + " x 9.800 = " + rp(bet * 9800));
  lines.push("- Hadiah 3D = " + rp(bet) + " x 980 = " + rp(bet * 980));
  lines.push("- Hadiah 2D = " + rp(bet) + " x 98 = " + rp(bet * 98));
  return lines.join("\n");
}

function appendHkSydneyCalculator(body) {
  const wrap = document.createElement("div");
  wrap.className = "common-calc";

  const title = document.createElement("div");
  title.className = "common-calc-title";
  title.textContent = "KALKULATOR PERHITUNGAN " + currentMarket;

  const sub = document.createElement("div");
  sub.className = "common-calc-sub";
  sub.textContent =
    "Pasaran aktif: " + currentMarket +
    ". Semua perhitungan mengikuti hadiah utama, kecuali Bet Full: 4D x9.800 / 3D x980 / 2D x98.";

  const types = document.createElement("div");
  types.className = "calc-types";

  let selectedType = "Diskon";

  calcTypesForMarket(COMMON_CALC_TYPES, currentMarket).forEach(type => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "calc-type" + (type === selectedType ? " active" : "");
    b.textContent = type;

    b.addEventListener("click", () => {
      selectedType = type;
      types.querySelectorAll(".calc-type").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
    });

    types.appendChild(b);
  });

  const controls = document.createElement("div");
  controls.className = "calc-controls";

  const input = document.createElement("input");
  input.type = "number";
  input.min = "1";
  input.step = "1";
  input.inputMode = "numeric";
  input.className = "calc-nominal";
  input.placeholder = "Masukkan nominal betting " + currentMarket + "... contoh 1000";

  const hit = document.createElement("button");
  hit.type = "button";
  hit.className = "calc-action calc-hit";
  hit.textContent = "HITUNG";

  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = "calc-action calc-reset";
  reset.textContent = "RESET";

  controls.append(input, hit, reset);

  const resultWrap = document.createElement("div");
  resultWrap.className = "calc-result-wrap";

  const result = document.createElement("pre");
  result.className = "calc-result";

  const resultActions = document.createElement("div");
  resultActions.className = "calc-result-actions";

  const copyResult = document.createElement("button");
  copyResult.type = "button";
  copyResult.className = "small-btn gold";
  copyResult.textContent = "COPY HASIL PERHITUNGAN";

  resultActions.appendChild(copyResult);
  resultWrap.append(result, resultActions);

  function doCalc() {
    const bet = Number(input.value);

    if (!Number.isFinite(bet) || bet <= 0) {
      result.textContent = "Masukkan nominal betting yang valid terlebih dahulu.";
      resultWrap.classList.add("show");
      return;
    }

    result.textContent = dynamicMarketCalcText(currentMarket, selectedType, bet);
    resultWrap.classList.add("show");
  }

  hit.addEventListener("click", doCalc);

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") doCalc();
  });

  reset.addEventListener("click", () => {
    input.value = "";
    result.textContent = "";
    resultWrap.classList.remove("show");
    input.focus();
  });

  copyResult.addEventListener("click", async () => {
    if (!result.textContent.trim()) {
      result.textContent = "Hitung terlebih dahulu sebelum menyalin hasil.";
      resultWrap.classList.add("show");
      return;
    }

    const ok = await copyText(result.textContent);

    if (ok) {
      flashButton(copyResult, "TERSALIN ✓");
    } else {
      openManual(result.textContent);
      flashButton(copyResult, "COPY MANUAL DIBUKA", 1500);
    }
  });

  wrap.append(title, sub, types, controls, resultWrap);
  body.appendChild(wrap);
}



const MACAU4D_CALC_TYPES = [
  "Diskon","Super Diskon","Full","Bolak Balik","Colok Bebas","Colok Bebas 2D",
  "Colok Naga","Colok Jitu","Macau Shio","Shio","Kombinasi","50-50",
  "Silang Homo","Tengah Tepi","Kembang - Kempis - Kembar","Dasar"
];

const MACAU5D_CALC_TYPES = [
  "Diskon","Full","Bolak Balik","Colok Bebas","Colok Bebas 2D","Colok Bebas 4D",
  "Colok Naga","Colok Jitu","Shio","Kombinasi","50-50","Tengah Tepi","Dasar"
];

function zeroDiscRewardLines(lines, bet, title, rows) {
  lines.push(title);
  rows.forEach(row => {
    const c = kingkongRewardCalc(bet, row[1]);
    lines.push("");
    lines.push(row[0]);
    lines.push("- Diskon = 0%");
    lines.push("- Hadiah = x" + row[1]);
    lines.push("- Yang Anda bayarkan = " + rp(c.bayar));
    lines.push("- Bettingan x Hadiah = " + rp(bet) + " x " + row[1] + " = " + rp(c.hadiah));
    lines.push("- Jika menang, Total = " + rp(c.bayar) + " + " + rp(c.hadiah) + " = " + rp(c.total));
  });
}

function discountedLines(lines, bet, title, rows) {
  lines.push(title);
  lines.push("");
  rows.forEach((row, i) => {
    const bayar = Math.round(bet * (1 - row[1] / 100));
    const menang = Math.round(bet * row[2]);
    lines.push(row[0]);
    lines.push("- Diskon = " + row[1] + "%");
    lines.push("- Hadiah = x" + Number(row[2]).toLocaleString("id-ID"));
    lines.push("- Bettingan - (Bettingan x Diskon) = " + rp(bet) + " - (" + rp(bet) + " x " + row[1] + "%) = " + rp(bayar));
    lines.push("- Maka yang Anda bayarkan = " + rp(bayar));
    lines.push("- Menang = " + rp(bet) + " x " + Number(row[2]).toLocaleString("id-ID") + " = " + rp(menang));
    if (i < rows.length - 1) lines.push("");
  });
}

function negativeKeiLines(lines, bet, label, keiAbs) {
  const c = kingkongNegativeKei(bet, keiAbs);
  lines.push("Jika Anda Betting Tipe " + label + " Dengan Nominal " + rp(bet) + ":");
  lines.push("- Kei = -" + keiAbs + "%");
  lines.push("- Diskon = 0%");
  lines.push("- Bettingan - (Bettingan x Kei -" + keiAbs + "%) = " + rp(bet) + " - (" + rp(bet) + " x -" + keiAbs + "%) = " + rp(c.hasilKei));
  lines.push("- Maka yang Anda bayarkan = " + rp(c.bayar));
  lines.push("- Jika menang, Total Kemenangan = " + rp(bet) + " + " + rp(c.bayar) + " = " + rp(c.total));
}

function dasarZeroDiscountLines(lines, bet, marketLabel) {
  const minus = kingkongNegativeKei(bet, 25);
  const plus = kingkongPositiveKei(bet, 10);
  lines.push("Jika Anda Betting Tipe Dasar " + marketLabel + " Dengan Nominal " + rp(bet) + ":");
  lines.push("");
  lines.push("Tipe Taruhan: Ganjil / Besar");
  lines.push("- Diskon = 0%");
  lines.push("- Kei = -25%");
  lines.push("- Hasil Kei = " + rp(minus.hasilKei));
  lines.push("- Maka yang Anda bayarkan = " + rp(minus.bayar));
  lines.push("- Jika menang, Total = " + rp(minus.total));
  lines.push("");
  lines.push("Tipe Taruhan: Genap / Kecil");
  lines.push("- Diskon = 0%");
  lines.push("- Kei = +10%");
  lines.push("- Yang Anda bayarkan = " + rp(plus.bayar));
  lines.push("- Nilai Kei 10% = " + rp(plus.nilaiKei));
  lines.push("- Jika menang = " + rp(plus.menang));
  lines.push("- Total yang Anda dapatkan = " + rp(plus.total));
}

function macau4DCalcText(type, bet) {
  const lines = [];
  if (type === "Diskon") {
    discountedLines(lines, bet, "Jika Anda Betting Tipe Diskon TOTO MACAU 4D Dengan Nominal " + rp(bet) + ":", [
      ["Diskon 4D",33,6000],["Diskon 3D",24,700],["Diskon 2D",15,80]
    ]);
  } else if (type === "Super Diskon") {
    discountedLines(lines, bet, "Jika Anda Betting Tipe Super Diskon TOTO MACAU 4D Dengan Nominal " + rp(bet) + ":", [
      ["Super Diskon 4D",66,3000],["Super Diskon 3D",59,400],["Super Diskon 2D",29,70]
    ]);
  } else if (type === "Full") {
    lines.push("Jika Anda Betting Tipe FULL TOTO MACAU 4D Dengan Nominal " + rp(bet) + ":");
    lines.push("- Hadiah 4D = " + rp(bet) + " x 9.000 = " + rp(bet*9000));
    lines.push("- Hadiah 3D = " + rp(bet) + " x 950 = " + rp(bet*950));
    lines.push("- Hadiah 2D = " + rp(bet) + " x 95 = " + rp(bet*95));
  } else if (type === "Bolak Balik") {
    lines.push("Jika Anda Betting Tipe Bolak Balik TOTO MACAU 4D Dengan Nominal " + rp(bet) + ":");
    [["4D Tepat",4000],["4D Terbalik / BB",200],["3D Tepat",400],["3D Terbalik / BB",100],["2D Tepat",70],["2D Terbalik / BB",20]].forEach(r => lines.push("- " + r[0] + " = " + rp(bet) + " x " + Number(r[1]).toLocaleString("id-ID") + " = " + rp(bet*r[1])));
  } else if (type === "Colok Bebas") {
    zeroDiscRewardLines(lines, bet, "Jika Anda Betting Tipe Colok Bebas TOTO MACAU 4D Dengan Nominal " + rp(bet) + ":", [["1 Digit",1.6],["2 Digit",3.2],["3 Digit",4.8],["4 Digit",6.4]]);
  } else if (type === "Colok Bebas 2D") {
    zeroDiscRewardLines(lines, bet, "Jika Anda Betting Tipe Colok Bebas 2D TOTO MACAU 4D Dengan Nominal " + rp(bet) + ":", [["2 Digit",7],["3 Digit",13],["4 Digit",21]]);
  } else if (type === "Colok Naga") {
    zeroDiscRewardLines(lines, bet, "Jika Anda Betting Tipe Colok Naga TOTO MACAU 4D Dengan Nominal " + rp(bet) + ":", [["3 Digit",27],["4 Digit",41]]);
  } else if (type === "Colok Jitu") {
    zeroDiscRewardLines(lines, bet, "Jika Anda Betting Tipe Colok Jitu TOTO MACAU 4D Dengan Nominal " + rp(bet) + ":", [["Colok Jitu",8.3]]);
  } else if (type === "Macau Shio") {
    zeroDiscRewardLines(lines, bet, "Jika Anda Betting Tipe Macau Shio TOTO MACAU 4D Dengan Nominal " + rp(bet) + ":", [["Macau Shio",110]]);
  } else if (type === "Shio") {
    zeroDiscRewardLines(lines, bet, "Jika Anda Betting Tipe Shio TOTO MACAU 4D Dengan Nominal " + rp(bet) + ":", [["Shio",10]]);
  } else if (type === "Kombinasi") {
    zeroDiscRewardLines(lines, bet, "Jika Anda Betting Tipe Kombinasi TOTO MACAU 4D Dengan Nominal " + rp(bet) + ":", [["Kombinasi",2.8]]);
  } else if (type === "50-50") {
    negativeKeiLines(lines, bet, "50-50 TOTO MACAU 4D", 5);
  } else if (["Silang Homo","Tengah Tepi","Kembang - Kempis - Kembar"].includes(type)) {
    negativeKeiLines(lines, bet, type + " TOTO MACAU 4D", 2.2);
  } else if (type === "Dasar") {
    dasarZeroDiscountLines(lines, bet, "TOTO MACAU 4D");
  }
  return lines.join("\n");
}

function macau5DCalcText(type, bet) {
  const lines = [];
  if (type === "Diskon") {
    discountedLines(lines, bet, "Jika Anda Betting Tipe Diskon TOTO MACAU 5D Dengan Nominal " + rp(bet) + ":", [
      ["Diskon 5D",38,50000],["Diskon 4D",20,7000],["Diskon 3D",20,750],["Diskon 2D",20,75]
    ]);
  } else if (type === "Full") {
    lines.push("Jika Anda Betting Tipe FULL TOTO MACAU 5D Dengan Nominal " + rp(bet) + ":");
    [["Hadiah 5D",88000],["Hadiah 4D",9000],["Hadiah 3D",950],["Hadiah 2D",95]].forEach(r => lines.push("- " + r[0] + " = " + rp(bet) + " x " + Number(r[1]).toLocaleString("id-ID") + " = " + rp(bet*r[1])));
  } else if (type === "Bolak Balik") {
    lines.push("Jika Anda Betting Tipe Bolak Balik TOTO MACAU 5D Dengan Nominal " + rp(bet) + ":");
    [["5D Tepat",50000],["5D Terbalik / BB",350],["4D Tepat",5000],["4D Terbalik / BB",180],["3D Tepat",500],["3D Terbalik / BB",75],["2D Tepat",80],["2D Terbalik / BB",15]].forEach(r => lines.push("- " + r[0] + " = " + rp(bet) + " x " + Number(r[1]).toLocaleString("id-ID") + " = " + rp(bet*r[1])));
  } else if (type === "Colok Bebas") {
    zeroDiscRewardLines(lines, bet, "Jika Anda Betting Tipe Colok Bebas TOTO MACAU 5D Dengan Nominal " + rp(bet) + ":", [["1 Digit",0.9],["2 Digit",1.8],["3 Digit",2.7],["4 Digit",3.6],["5 Digit",4.5]]);
  } else if (type === "Colok Bebas 2D") {
    zeroDiscRewardLines(lines, bet, "Jika Anda Betting Tipe Colok Bebas 2D TOTO MACAU 5D Dengan Nominal " + rp(bet) + ":", [["2 Digit",4],["3 Digit",6],["4 Digit",20],["5 Digit",200]]);
  } else if (type === "Colok Bebas 4D") {
    zeroDiscRewardLines(lines, bet, "Jika Anda Betting Tipe Colok Bebas 4D TOTO MACAU 5D Dengan Nominal " + rp(bet) + ":", [["4 Digit",50],["5 Digit",200]]);
  } else if (type === "Colok Naga") {
    zeroDiscRewardLines(lines, bet, "Jika Anda Betting Tipe Colok Naga TOTO MACAU 5D Dengan Nominal " + rp(bet) + ":", [["3 Digit",12],["4 Digit",30],["5 Digit",125]]);
  } else if (type === "Colok Jitu") {
    zeroDiscRewardLines(lines, bet, "Jika Anda Betting Tipe Colok Jitu TOTO MACAU 5D Dengan Nominal " + rp(bet) + ":", [["Colok Jitu",8]]);
  } else if (type === "Shio") {
    zeroDiscRewardLines(lines, bet, "Jika Anda Betting Tipe Shio TOTO MACAU 5D Dengan Nominal " + rp(bet) + ":", [["Shio",10]]);
  } else if (type === "Kombinasi") {
    zeroDiscRewardLines(lines, bet, "Jika Anda Betting Tipe Kombinasi TOTO MACAU 5D Dengan Nominal " + rp(bet) + ":", [["Kombinasi",2.7]]);
  } else if (type === "50-50" || type === "Tengah Tepi") {
    negativeKeiLines(lines, bet, type + " TOTO MACAU 5D", 2.2);
  } else if (type === "Dasar") {
    dasarZeroDiscountLines(lines, bet, "TOTO MACAU 5D");
  }
  return lines.join("\n");
}

function appendSimpleSpecialCalculator(body, titleText, subText, typesList, calcFn) {
  const wrap = document.createElement("div"); wrap.className = "common-calc";
  const title = document.createElement("div"); title.className = "common-calc-title"; title.textContent = titleText;
  const sub = document.createElement("div"); sub.className = "common-calc-sub"; sub.textContent = subText;
  if (!String(titleText || "").trim()) title.style.display = "none";
  if (!String(subText || "").trim()) sub.style.display = "none";
  const types = document.createElement("div"); types.className = "calc-types";
  const availableTypes = calcTypesForMarket(typesList, currentMarket);
  let selectedType = availableTypes[0];
  availableTypes.forEach(type => {
    const b=document.createElement("button"); b.type="button"; b.className="calc-type"+(type===selectedType?" active":""); b.textContent=type;
    b.addEventListener("click",()=>{selectedType=type;types.querySelectorAll(".calc-type").forEach(x=>x.classList.remove("active"));b.classList.add("active")});
    types.appendChild(b);
  });
  const controls=document.createElement("div"); controls.className="calc-controls";
  const input=document.createElement("input"); input.type="number"; input.min="1"; input.step="1"; input.inputMode="numeric"; input.className="calc-nominal"; input.placeholder="Masukkan nominal betting... contoh 1000";
  const hit=document.createElement("button"); hit.type="button"; hit.className="calc-action calc-hit"; hit.textContent="HITUNG";
  const reset=document.createElement("button"); reset.type="button"; reset.className="calc-action calc-reset"; reset.textContent="RESET";
  controls.append(input,hit,reset);
  const resultWrap=document.createElement("div"); resultWrap.className="calc-result-wrap";
  const result=document.createElement("pre"); result.className="calc-result";
  const actions=document.createElement("div"); actions.className="calc-result-actions";
  const copy=document.createElement("button"); copy.type="button"; copy.className="small-btn gold"; copy.textContent="COPY HASIL PERHITUNGAN";
  actions.appendChild(copy); resultWrap.append(result,actions);
  function doCalc(){const bet=Number(input.value);if(!Number.isFinite(bet)||bet<=0){result.textContent="Masukkan nominal betting yang valid terlebih dahulu.";resultWrap.classList.add("show");return;}result.textContent=dynamicMarketCalcText(currentMarket,selectedType,bet);resultWrap.classList.add("show");}
  hit.addEventListener("click",doCalc); input.addEventListener("keydown",e=>{if(e.key==="Enter")doCalc()});
  reset.addEventListener("click",()=>{input.value="";result.textContent="";resultWrap.classList.remove("show");input.focus()});
  copy.addEventListener("click",async()=>{if(!result.textContent.trim()){result.textContent="Hitung terlebih dahulu sebelum menyalin hasil.";resultWrap.classList.add("show");return;}const ok=await copyText(result.textContent);if(ok)flashButton(copy,"TERSALIN ✓");else{openManual(result.textContent);flashButton(copy,"COPY MANUAL DIBUKA",1500)}});
  wrap.append(title,sub,types,controls,resultWrap); body.appendChild(wrap);
}

function appendMacau4DCalculator(body) {
  appendSimpleSpecialCalculator(body,"","",MACAU4D_CALC_TYPES,macau4DCalcText);
}
function appendMacau5DCalculator(body) {
  appendSimpleSpecialCalculator(body,"KALKULATOR PERHITUNGAN TOTO MACAU 5D","Pasaran aktif: TOTO MACAU 5D. Mengikuti hadiah TOTO MACAU 5D.",MACAU5D_CALC_TYPES,macau5DCalcText);
}


/* =========================================================
   PROFILE-DRIVEN CALCULATOR
   Dipakai untuk TOTOMALI / HOKI DRAW / JAKARTA
   Nilai dibaca langsung dari DATA profile masing-masing.
   ========================================================= */

const PROFILE_MARKET_CALC_TYPES = [
  "Diskon",
  "Full",
  "Bolak Balik",
  "Colok Bebas",
  "Colok Bebas 2D",
  "Colok Naga",
  "Colok Jitu",
  "Macau Shio",
  "Shio",
  "Kombinasi",
  "50-50",
  "Silang Homo",
  "Tengah Tepi",
  "Kembang - Kempis - Kembar",
  "Dasar"
];

function normCalcTitle(s) {
  return String(s || "").toUpperCase().replace(/\s+/g, " ").trim();
}

function profileItems(market, sectionName) {
  const sections = sectionsFor(market);
  return sections[sectionName] || [];
}

function profileRewardDetail(lines, bet, market, heading, items) {
  lines.push("Jika Anda Betting Tipe " + heading + " " + market + " Dengan Nominal " + rp(bet) + ":");

  items.forEach(item => {
    const discount = Number(item.discount || 0);
    const reward = Number(item.reward || 0);
    const c = calcDiscountReward(bet, discount, reward);

    lines.push("");
    lines.push(item.name);
    lines.push("- Diskon = " + discount + "%");
    lines.push("- Hadiah = x" + item.reward);
    lines.push("- Bettingan - (Bettingan x Diskon) = " + rp(bet) + " - (" + rp(bet) + " x " + discount + "%) = " + rp(c.bayar));
    lines.push("- Maka yang Anda bayarkan = " + rp(c.bayar));
    lines.push("- Bettingan x Hadiah = " + rp(bet) + " x " + item.reward + " = " + rp(c.hadiah));
    lines.push("- Jika menang, Total = " + rp(c.bayar) + " + " + rp(c.hadiah) + " = " + rp(c.total));
  });
}

function profileKeiDetail(lines, bet, market, item) {
  const discount = Number(item.discount || 0);
  const kei = parseFloat(String(item.kei || "0").replace("%",""));

  lines.push("Jika Anda Betting Tipe " + item.name + " " + market + " Dengan Nominal " + rp(bet) + ":");
  lines.push("- Kei = " + (kei >= 0 ? "+" : "") + kei + "%");
  lines.push("- Diskon = " + discount + "%");

  if (kei < 0) {
    const c = negativeKeiCalc(bet, Math.abs(kei), discount);
    lines.push("- Bettingan - (Bettingan x Kei " + kei + "%) = " + rp(bet) + " - (" + rp(bet) + " x " + kei + "%) = " + rp(c.hasilKei));

    if (discount > 0) {
      lines.push("- Hasil Kei - (Hasil Kei x Diskon " + discount + "%) = " + rp(c.hasilKei) + " - (" + rp(c.hasilKei) + " x " + discount + "%) = " + rp(c.bayar));
    }

    lines.push("- Maka yang Anda bayarkan = " + rp(c.bayar));
    lines.push("- Jika menang, Total Kemenangan = " + rp(bet) + " + " + rp(c.bayar) + " = " + rp(c.total));
  } else {
    const bayar = bet * (1 - discount / 100);
    const nilaiKei = bet * (kei / 100);
    const menang = bet + nilaiKei;
    const total = bayar + menang;

    lines.push("- Bettingan - (Bettingan x Diskon " + discount + "%) = " + rp(bet) + " - (" + rp(bet) + " x " + discount + "%) = " + rp(bayar));
    lines.push("- Bettingan x Kei " + kei + "% = " + rp(bet) + " x " + kei + "% = " + rp(nilaiKei));
    lines.push("- Jika menang = Bettingan + Kei = " + rp(bet) + " + " + rp(nilaiKei) + " = " + rp(menang));
    lines.push("- Total yang Anda dapatkan = " + rp(bayar) + " + " + rp(menang) + " = " + rp(total));
  }
}

function profileMarketCalcText(market, type, bet) {
  if (type === "Prize" && PRIZE_MARKETS.includes(market)) return prizeCalcText(bet);

  const lines = [];
  const diskon = profileItems(market, "Diskon");
  const full = profileItems(market, "Bet Full");
  const tepat = profileItems(market, "Tepat & BB");
  const lainnya = profileItems(market, "Lainnya");

  if (type === "Diskon") {
    profileRewardDetail(lines, bet, market, "Diskon", diskon);
  }

  else if (type === "Full") {
    lines.push("Jika Anda Betting Tipe FULL " + market + " Dengan Nominal " + rp(bet) + ":");
    full.forEach(item => {
      lines.push("- " + item.name.replace("BET FULL ","Hadiah ") + " = " + rp(bet) + " x " + item.reward + " = " + rp(bet * Number(item.reward)));
    });
  }

  else if (type === "Bolak Balik") {
    lines.push("Jika Anda Betting Tipe Bolak Balik " + market + " Dengan Nominal " + rp(bet) + ":");
    tepat.forEach(item => {
      const label = item.name.replace(" BB"," Terbalik / BB");
      lines.push("- " + label + " = " + rp(bet) + " x " + item.reward + " = " + rp(bet * Number(item.reward)));
    });
  }

  else if (type === "Colok Bebas") {
    const items = lainnya.filter(item => {
      const n = normCalcTitle(item.name);
      return n.startsWith("COLOK BEBAS") &&
             !n.startsWith("COLOK BEBAS 2D") &&
             !n.startsWith("COLOK BEBAS 4D");
    });
    profileRewardDetail(lines, bet, market, "Colok Bebas", items);
  }

  else if (type === "Colok Bebas 2D") {
    const items = lainnya.filter(item => normCalcTitle(item.name).startsWith("COLOK BEBAS 2D"));
    profileRewardDetail(lines, bet, market, "Colok Bebas 2D", items);
  }

  else if (type === "Colok Naga") {
    const items = lainnya.filter(item => normCalcTitle(item.name).startsWith("COLOK NAGA"));
    profileRewardDetail(lines, bet, market, "Colok Naga", items);
  }

  else if (type === "Colok Jitu") {
    const items = lainnya.filter(item => normCalcTitle(item.name) === "COLOK JITU");
    profileRewardDetail(lines, bet, market, "Colok Jitu", items);
  }

  else if (type === "Macau Shio") {
    const items = lainnya.filter(item => normCalcTitle(item.name) === "MACAU SHIO");
    profileRewardDetail(lines, bet, market, "Macau Shio", items);
  }

  else if (type === "Shio") {
    const items = lainnya.filter(item => normCalcTitle(item.name) === "SHIO");
    profileRewardDetail(lines, bet, market, "Shio", items);
  }

  else if (type === "Kombinasi") {
    const items = lainnya.filter(item => normCalcTitle(item.name) === "KOMBINASI");
    profileRewardDetail(lines, bet, market, "Kombinasi", items);
  }

  else if (type === "50-50") {
    const item = lainnya.find(item => normCalcTitle(item.name).replace(/\s/g,"") === "50-50");
    if (item) profileKeiDetail(lines, bet, market, item);
  }

  else if (type === "Silang Homo") {
    const item = lainnya.find(item => normCalcTitle(item.name) === "SILANG HOMO");
    if (item) profileKeiDetail(lines, bet, market, item);
  }

  else if (type === "Tengah Tepi") {
    const item = lainnya.find(item => normCalcTitle(item.name) === "TENGAH TEPI");
    if (item) profileKeiDetail(lines, bet, market, item);
  }

  else if (type === "Kembang - Kempis - Kembar") {
    const item = lainnya.find(item => normCalcTitle(item.name) === "KEMBANG - KEMPIS - KEMBAR");
    if (item) profileKeiDetail(lines, bet, market, item);
  }

  else if (type === "Dasar") {
    const ganjil = lainnya.find(item => normCalcTitle(item.name) === "DASAR GANJIL - BESAR");
    const genap = lainnya.find(item => normCalcTitle(item.name) === "DASAR GENAP - KECIL");

    lines.push("Jika Anda Betting Tipe Dasar " + market + " Dengan Nominal " + rp(bet) + ":");

    if (ganjil) {
      lines.push("");
      lines.push("Tipe Taruhan: Ganjil / Besar");
      profileKeiDetail(lines, bet, market, ganjil);
    }

    if (genap) {
      lines.push("");
      lines.push("Tipe Taruhan: Genap / Kecil");
      profileKeiDetail(lines, bet, market, genap);
    }
  }

  return lines.join("\n");
}

function appendProfileMarketCalculator(body, market) {
  appendSimpleSpecialCalculator(
    body,
    "KALKULATOR PERHITUNGAN " + market,
    "Pasaran aktif: " + market + ". Nilai diambil langsung dari daftar hadiah pasaran ini.",
    PROFILE_MARKET_CALC_TYPES,
    (type, bet) => profileMarketCalcText(market, type, bet)
  );
}


function appendCommonCalculator(body) {
  const wrap = document.createElement("div");
  wrap.className = "common-calc";

  const title = document.createElement("div");
  title.className = "common-calc-title";
  title.textContent = "KALKULATOR PERHITUNGAN HADIAH";

  const sub = document.createElement("div");
  sub.className = "common-calc-sub";
  sub.textContent = "Pasaran aktif: " + currentMarket + ". Pilih tipe permainan, masukkan nominal betting, lalu tekan HITUNG.";

  const types = document.createElement("div");
  types.className = "calc-types";

  let selectedType = "Diskon";

  calcTypesForMarket(COMMON_CALC_TYPES, currentMarket).forEach(type => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "calc-type" + (type === selectedType ? " active" : "");
    b.textContent = type;

    b.addEventListener("click", () => {
      selectedType = type;
      types.querySelectorAll(".calc-type").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
    });

    types.appendChild(b);
  });

  const controls = document.createElement("div");
  controls.className = "calc-controls";

  const input = document.createElement("input");
  input.type = "number";
  input.min = "1";
  input.step = "1";
  input.inputMode = "numeric";
  input.className = "calc-nominal";
  input.placeholder = "Masukkan nominal betting... contoh 1000";

  const hit = document.createElement("button");
  hit.type = "button";
  hit.className = "calc-action calc-hit";
  hit.textContent = "HITUNG";

  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = "calc-action calc-reset";
  reset.textContent = "RESET";

  controls.append(input, hit, reset);

  const resultWrap = document.createElement("div");
  resultWrap.className = "calc-result-wrap";

  const result = document.createElement("pre");
  result.className = "calc-result";

  const resultActions = document.createElement("div");
  resultActions.className = "calc-result-actions";

  const copyResult = document.createElement("button");
  copyResult.type = "button";
  copyResult.className = "small-btn gold";
  copyResult.textContent = "COPY HASIL PERHITUNGAN";

  resultActions.appendChild(copyResult);
  resultWrap.append(result, resultActions);

  function doCalc() {
    const bet = Number(input.value);
    if (!Number.isFinite(bet) || bet <= 0) {
      result.textContent = "Masukkan nominal betting yang valid terlebih dahulu.";
      resultWrap.classList.add("show");
      return;
    }

    result.textContent = dynamicMarketCalcText(currentMarket, selectedType, bet);
    resultWrap.classList.add("show");
  }

  hit.addEventListener("click", doCalc);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") doCalc();
  });

  reset.addEventListener("click", () => {
    input.value = "";
    result.textContent = "";
    resultWrap.classList.remove("show");
    input.focus();
  });

  copyResult.addEventListener("click", async () => {
    if (!result.textContent.trim()) {
      result.textContent = "Hitung terlebih dahulu sebelum menyalin hasil.";
      resultWrap.classList.add("show");
      return;
    }

    const ok = await copyText(result.textContent);
    if (ok) {
      flashButton(copyResult, "TERSALIN ✓");
    } else {
      openManual(result.textContent);
      flashButton(copyResult, "COPY MANUAL DIBUKA", 1500);
    }
  });

  wrap.append(title, sub, types, controls, resultWrap);

  // Kalkulator ditaruh paling atas pada isi grup.
  body.insertBefore(wrap, body.firstChild);
}


function appendPrizeGroupBox(open=false) {
  const details = document.createElement("details");
  details.className = "group-box prize-box";
  details.open = open;

  const summary = document.createElement("summary");

  const title = document.createElement("div");
  title.className = "group-title";
  title.innerHTML =
    "HADIAH KHUSUS PRIZE 1, PRIZE 2 &amp; PRIZE 3" +
    `<span class="group-count">${PRIZE_MARKETS.length} pasaran memiliki sistem betting Prize</span>`;

  const plus = document.createElement("span");
  plus.className = "plus";
  summary.append(title, plus);

  const body = document.createElement("div");
  body.className = "group-body";

  const intro = document.createElement("div");
  intro.className = "prize-special-intro";
  intro.innerHTML =
    "<b>Sistem bettingan Prize 1, Prize 2 &amp; Prize 3 hanya khusus pada pasaran berikut :</b><br>" +
    escapeHtml(PRIZE_MARKETS.join(" / "));
  body.appendChild(intro);

  const cards = document.createElement("div");
  cards.className = "prize-cards";

  const prizeData = [
    {
      title: "Hadiah Prize 1",
      rows: [
        ["Hadiah 4D", "x 6500"],
        ["Hadiah 3D", "x 650"],
        ["Hadiah 2D", "x 70"]
      ]
    },
    {
      title: "Hadiah Prize 2",
      rows: [
        ["Hadiah 4D", "x 2100"],
        ["Hadiah 3D", "x 210"],
        ["Hadiah 2D", "x 20"]
      ]
    },
    {
      title: "Hadiah Prize 3",
      rows: [
        ["Hadiah 4D", "x 1100"],
        ["Hadiah 3D", "x 110"],
        ["Hadiah 2D", "x 8"]
      ]
    }
  ];

  prizeData.forEach(group => {
    const card = document.createElement("div");
    card.className = "prize-card";

    const h = document.createElement("h3");
    h.textContent = group.title;
    card.appendChild(h);

    group.rows.forEach(row => {
      const line = document.createElement("div");
      line.className = "prize-row";
      line.innerHTML =
        `<span>${escapeHtml(row[0])}</span>` +
        `<strong>${escapeHtml(row[1])}</strong>`;
      card.appendChild(line);
    });

    cards.appendChild(card);
  });

  body.appendChild(cards);

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "small-btn gold copy-group";
  copyBtn.textContent = "COPY HADIAH PRIZE";

  copyBtn.addEventListener("click", async e => {
    e.preventDefault();
    e.stopPropagation();

    const value = prizeOnlyText();
    const ok = await copyText(value);

    if (ok) {
      flashButton(copyBtn, "TERSALIN ✓");
    } else {
      openManual(value);
      flashButton(copyBtn, "COPY MANUAL DIBUKA", 1500);
    }
  });

  body.appendChild(copyBtn);
  details.append(summary, body);
  groupList.appendChild(details);
}

function appendGroupBox(titleText, countText, sections, copyValue, className="", open=false) {
  const details = document.createElement("details");
  details.className = "group-box " + className;
  details.open = open;

  const summary = document.createElement("summary");

  const title = document.createElement("div");
  title.className = "group-title";
  title.innerHTML = escapeHtml(titleText) +
    `<span class="group-count">${escapeHtml(countText)}</span>`;

  const plus = document.createElement("span");
  plus.className = "plus";

  summary.append(title, plus);

  const body = document.createElement("div");
  body.className = "group-body";

  sections.forEach(section => {
    const sec = document.createElement("div");
    sec.className = "group-section";

    const h = document.createElement("h3");
    h.textContent = section.name;

    const pre = document.createElement("pre");
    pre.className = "group-lines";
    pre.textContent = section.items.map(itemLine).join("\n");

    sec.append(h, pre);
    body.appendChild(sec);
  });

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "small-btn gold copy-group";
  copyBtn.textContent = "COPY GRUP INI";

  copyBtn.addEventListener("click", async e => {
    e.preventDefault();
    e.stopPropagation();

    const ok = await copyText(copyValue);
    if (ok) {
      flashButton(copyBtn, "TERSALIN ✓");
    } else {
      openManual(copyValue);
      flashButton(copyBtn, "COPY MANUAL DIBUKA", 1500);
    }
  });

  body.appendChild(copyBtn);
  details.append(summary, body);
  groupList.appendChild(details);
  return details;
}

function renderGroups() {
  groupList.innerHTML = "";

  const common = commonMainSections();

  // GRUP 1 — hadiah utama yang benar-benar sama
  const commonBox = appendGroupBox(
    commonMainTitle(),
    COMMON_MAIN_MARKETS.length + " pasaran memakai hadiah utama yang sama",
    [
      {name:"Diskon", items:common["Diskon"]},
      {name:"Bet Full", items:common["Bet Full"]},
      {name:"Tepat & BB", items:common["Tepat & BB"]},
      {name:"Lainnya", items:common["Lainnya"]}
    ],
    commonMainText(),
    "main-common",
    true
  );

  appendCommonCalculator(commonBox.querySelector(".group-body"));

  // GRUP 2 — Prize berdiri sendiri dengan format khusus
  appendPrizeGroupBox(false);

  // GRUP KHUSUS — hanya yang beda hadiah SELAIN Prize
  ["macau4d","macau5d","kingkong","hk_sydney","totomali","hoki","jakarta"].forEach(profileKey => {
    const sections = DATA.profiles[profileKey].sections;
    const visible = [];

    SECTION_ORDER.forEach(name => {
      if (!sections[name]) return;
      if (name === "Prize") return;
      visible.push({name:name, items:sections[name]});
    });

    appendGroupBox(
      SPECIAL_GROUP_NAMES[profileKey],
      marketsForProfile(profileKey).length + " pasaran — hadiah non-Prize berbeda",
      visible,
      specialText(profileKey)
    );
  });
}

function allGroupsText() {
  return dynamicAllGroupsText();
}

copyCurrentBtn.addEventListener("click", async () => {
  const text = currentMarketText();
  if (await copyText(text)) {
    flashButton(copyCurrentBtn, "PASARAN TERSALIN ✓", 1400);
  } else {
    openManual(text);
    flashButton(copyCurrentBtn, "COPY MANUAL DIBUKA", 1500);
  }
});

copyAllBtn.addEventListener("click", async () => {
  const text = allGroupsText();
  const ok = await copyText(text);

  if (ok) {
    flashButton(copyAllBtn, "SEMUA TERSALIN ✓", 1400);
  } else {
    openManual(text);
    flashButton(copyAllBtn, "COPY MANUAL DIBUKA", 1500);
  }
});


manualCloseBtn.addEventListener("click", () => manualModal.classList.remove("show"));
manualModal.addEventListener("click", e => {
  if (e.target === manualModal) manualModal.classList.remove("show");
});

editRewardsBtn.addEventListener("click", async () => {
  if (!(await requireHadiahMaster())) return;
  openEditorModal();
});
editorCloseBtn.addEventListener("click", closeEditorModal);
editorSaveBtn.addEventListener("click", async () => {
  if (!(await requireHadiahMaster())) return;
  applyEditorChanges();
});
editorResetBtn.addEventListener("click", async () => {
  if (!(await requireHadiahMaster())) return;
  resetCurrentMarketOverride();
});
editorModal.addEventListener("click", e => {
  if (e.target === editorModal) closeEditorModal();
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && editorModal.classList.contains("show")) closeEditorModal();
});

refreshHadiahMasterAccess();
renderTabs();
renderCurrentMarket();
updateMainCalculatorVisibility();
