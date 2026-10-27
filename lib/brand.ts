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
  rawJson: { ar: "عرض JSON الخام للحكام", en: "Show raw JSON for judges" },
  hideJson: { ar: "إخفاء JSON الخام", en: "Hide raw JSON" },
  live: { ar: "LIVE — Meta API متصل", en: "LIVE — Meta API connected" },
  mock: { ar: "وضع تجريبي — أضف MODEL_API_KEY للتفعيل الحي", en: "Demo mode — set MODEL_API_KEY for live" },
};

export const COUNTRIES = [
  { code: "EG", ar: "مصر", en: "Egypt", currency: "EGP", currency_ar: "جنيه" },
  { code: "SA", ar: "السعودية", en: "Saudi Arabia", currency: "SAR", currency_ar: "ريال" },
  { code: "AE", ar: "الإمارات", en: "UAE", currency: "AED", currency_ar: "درهم" },
  { code: "US", ar: "أمريكا", en: "USA", currency: "USD", currency_ar: "دولار" },
];

export const t = (key: string, lang: Lang) =>
  STR[key]?.[lang] ?? key;
