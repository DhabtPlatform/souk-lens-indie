// Souk Lens brand + i18n (AR/EN) + country/market config.
// Lean indie file: no dependency on the private Dhabt store.

export const BRAND = {
  name_ar: "عدسة السوق",
  name_en: "Souk Lens",
  tagline_ar: "صوّر، اتكلم، ابحث — وحول أي حاجة لإعلان جاهز",
  tagline_en: "See it. Sell it. Anywhere.",
  // Mark concept: a lens that found the gem — souk arch inside the lens, stall baseline, gold discovery dot.
  mark: "lens + souk arch + gold gem",
  colors: { primary: "#7c5cff", primaryBright: "#8b6cff", accent: "#00d4a4", accentDeep: "#00c2a8", gold: "#ffd166", bg: "#0b0b10", card: "#16161d", ink: "#f6f6f8", muted: "#a7a7b8" },
  gradient: "linear-gradient(135deg,#8b6cff 0%,#7c5cff 52%,#00c2a8 100%)",
  clearspace: "height of the gold gem on all sides",
  minSizePx: 24,
  fonts: "'Tajawal','Cairo','Segoe UI',system-ui,sans-serif",
  fontsLatin: "'Inter','Tajawal',system-ui,sans-serif",
};

export type Lang = "ar" | "en";

export const STR: Record<string, { ar: string; en: string }> = {
  analyze: { ar: "تحليل صورة", en: "Analyze image" },
  generate: { ar: "توليد من وصف", en: "Generate from text" },
  compare: { ar: "مقارنة رابط", en: "Compare URL" },
  voice: { ar: "إعلان بالصوت", en: "Voice to ad" },
  import: { ar: "نقل متجر", en: "Import store" },
  smart: { ar: "السوق الذكي", en: "Smart Market" },
  mine: { ar: "منتجاتي", en: "My products" },
  run: { ar: "نفّذ", en: "Run" },
  analyzing: { ar: "يحلل...", en: "Working..." },
  addProduct: { ar: "أضف كمنتج", en: "Add as product" },
  added: { ar: "اتضاف", en: "Added" },
  price: { ar: "السعر", en: "Price" },
  country: { ar: "البلد", en: "Country" },
  descPlaceholder: { ar: "اوصف المنتج: كرسي خشب زان بحالة ممتازة...", en: "Describe the product..." },
  urlPlaceholder: { ar: "الصق رابط منتج أو متجر https://...", en: "Paste a product or store URL https://..." },
  noItems: { ar: "لا توجد نتائج — جرب مدخل أوضح.", en: "No results — try a clearer input." },
  rawJson: { ar: "عرض JSON التقني", en: "View model JSON" },
  hideJson: { ar: "إخفاء JSON التقني", en: "Hide model JSON" },
  live: { ar: "LIVE — Meta API متصل", en: "LIVE — Meta API connected" },
  mock: { ar: "معاينة تجريبية", en: "Demo preview" },
};

export const t = (key: string, lang: Lang) =>
  STR[key]?.[lang] ?? key;

// Full world coverage: geo-detect returns ANY country code, so the list must
// contain every country or the detection silently falls back to Egypt.
// Compact code→currency map (source of truth); display names come from Intl
// in both languages (no hand-typed typos); Arabic currency nicknames for the
// majors, currency code itself elsewhere.
const CURRENCY_BY_COUNTRY: Record<string, string> = {
  AD: "EUR", AE: "AED", AF: "AFN", AG: "XCD", AL: "ALL", AM: "AMD", AO: "AOA", AQ: "USD",
  AR: "ARS", AT: "EUR", AU: "AUD", AW: "AWG", AX: "EUR", AZ: "AZN",
  BA: "BAM", BB: "BBD", BD: "BDT", BE: "EUR", BF: "XOF", BG: "EUR", BH: "BHD", BI: "BIF",
  BJ: "XOF", BL: "EUR", BM: "BMD", BN: "BND", BO: "BOB", BQ: "USD", BR: "BRL", BS: "BSD",
  BT: "BTN", BV: "NOK", BW: "BWP", BY: "BYN", BZ: "BZD",
  CA: "CAD", CC: "AUD", CD: "CDF", CF: "XAF", CG: "XAF", CH: "CHF", CI: "XOF", CK: "NZD",
  CL: "CLP", CM: "XAF", CN: "CNY", CO: "COP", CR: "CRC", CU: "CUP", CV: "CVE", CW: "ANG",
  CX: "AUD", CY: "EUR", CZ: "CZK",
  DE: "EUR", DJ: "DJF", DK: "DKK", DM: "XCD", DO: "DOP", DZ: "DZD",
  EC: "USD", EE: "EUR", EG: "EGP", EH: "MAD", ER: "ERN", ES: "EUR", ET: "ETB",
  FI: "EUR", FJ: "FJD", FK: "FKP", FM: "USD", FO: "DKK", FR: "EUR",
  GA: "XAF", GB: "GBP", GD: "XCD", GE: "GEL", GF: "EUR", GG: "GBP", GH: "GHS", GI: "GIP",
  GL: "DKK", GM: "GMD", GN: "GNF", GP: "EUR", GQ: "XAF", GR: "EUR", GS: "GBP", GT: "GTQ",
  GU: "USD", GW: "XOF", GY: "GYD",
  HK: "HKD", HM: "AUD", HN: "HNL", HR: "EUR", HT: "HTG", HU: "HUF",
  ID: "IDR", IE: "EUR", IL: "ILS", IM: "GBP", IN: "INR", IO: "USD", IQ: "IQD", IR: "IRR",
  IS: "ISK", IT: "EUR",
  JE: "GBP", JM: "JMD", JO: "JOD", JP: "JPY",
  KE: "KES", KG: "KGS", KH: "KHR", KI: "AUD", KM: "KMF", KN: "XCD", KP: "KPW", KR: "KRW",
  KW: "KWD", KY: "KYD", KZ: "KZT",
  LA: "LAK", LB: "LBP", LC: "XCD", LI: "CHF", LK: "LKR", LR: "LRD", LS: "LSL", LT: "EUR",
  LU: "EUR", LV: "EUR", LY: "LYD",
  MA: "MAD", MC: "EUR", MD: "MDL", ME: "EUR", MF: "EUR", MG: "MGA", MH: "USD", MK: "MKD",
  ML: "XOF", MM: "MMK", MN: "MNT", MO: "MOP", MP: "USD", MQ: "EUR", MR: "MRU", MS: "XCD",
  MT: "EUR", MU: "MUR", MV: "MVR", MW: "MWK", MX: "MXN", MY: "MYR", MZ: "MZN",
  NA: "NAD", NC: "XPF", NE: "XOF", NF: "AUD", NG: "NGN", NI: "NIO", NL: "EUR", NO: "NOK",
  NP: "NPR", NR: "AUD", NU: "NZD", NZ: "NZD",
  OM: "OMR",
  PA: "PAB", PE: "PEN", PF: "XPF", PG: "PGK", PH: "PHP", PK: "PKR", PL: "PLN", PM: "EUR",
  PN: "NZD", PR: "USD", PS: "ILS", PT: "EUR", PW: "USD", PY: "PYG",
  QA: "QAR",
  RE: "EUR", RO: "RON", RS: "RSD", RU: "RUB", RW: "RWF",
  SA: "SAR", SB: "SBD", SC: "SCR", SD: "SDG", SE: "SEK", SG: "SGD", SH: "SHP", SI: "EUR",
  SJ: "NOK", SK: "EUR", SL: "SLE", SM: "EUR", SN: "XOF", SO: "SOS", SR: "SRD", SS: "SSP",
  ST: "STN", SV: "USD", SX: "ANG", SY: "SYP", SZ: "SZL",
  TC: "USD", TD: "XAF", TF: "EUR", TG: "XOF", TH: "THB", TJ: "TJS", TK: "NZD", TL: "USD",
  TM: "TMT", TN: "TND", TO: "TOP", TR: "TRY", TT: "TTD", TV: "AUD", TW: "TWD", TZ: "TZS",
  UA: "UAH", UG: "UGX", US: "USD", UY: "UYU", UZ: "UZS",
  VA: "EUR", VC: "XCD", VE: "VES", VG: "USD", VI: "USD", VN: "VND", VU: "VUV",
  WF: "XPF", WS: "WST",
  XK: "EUR",
  YE: "YER", YT: "EUR",
  ZA: "ZAR", ZM: "ZMW", ZW: "ZWG",
};

const CURRENCY_AR: Record<string, string> = {
  USD: "دولار", EUR: "يورو", GBP: "جنيه إسترليني", EGP: "جنيه", SAR: "ريال", AED: "درهم",
  KWD: "دينار كويتي", BHD: "دينار بحريني", QAR: "ريال قطري", OMR: "ريال عُماني",
  JOD: "دينار أردني", IQD: "دينار عراقي", LBP: "ليرة لبنانية", SYP: "ليرة سورية",
  YER: "ريال يمني", SDG: "جنيه سوداني", LYD: "دينار ليبي", TND: "دينار تونسي",
  DZD: "دينار جزائري", MAD: "درهم مغربي", MRU: "أوقية", TRY: "ليرة تركية",
  INR: "روبية هندية", PKR: "روبية باكستانية", BDT: "تاكا", JPY: "ين", CNY: "يوان",
  KRW: "وون", ILS: "شيكل", CAD: "دولار كندي", AUD: "دولار أسترالي", CHF: "فرنك سويسري",
  SEK: "كرونة سويدية", NOK: "كرونة نرويجية", DKK: "كرونة دنماركية", RUB: "روبل",
  BRL: "ريال برازيلي", MXN: "بيزو مكسيكي",
};

function regionName(code: string, locale: "ar" | "en"): string {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

export const COUNTRIES = [
  { code: "EG", ar: "مصر", en: "Egypt", currency: "EGP", currency_ar: "جنيه" },
  ...Object.keys(CURRENCY_BY_COUNTRY)
    .filter((c) => c !== "EG")
    .sort((a, b) => regionName(a, "en").localeCompare(regionName(b, "en")))
    .map((code) => {
      const currency = CURRENCY_BY_COUNTRY[code];
      return {
        code,
        ar: regionName(code, "ar"),
        en: regionName(code, "en"),
        currency,
        currency_ar: CURRENCY_AR[currency] ?? currency,
      };
    }),
];
