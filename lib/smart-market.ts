import type { Product } from "./product";

// ---- Demo catalog: the "whole store" the smart market searches ----
// In production this is replaced by the marketplace DB; shape = full Product + trust/delivery signals.
export type NeedSlot = { key: string; label_ar: string; label_en: string; match: string[] };
export type Preset = { id: string; title_ar: string; title_en: string; desc_ar: string; desc_en: string; emoji: string; slots: NeedSlot[] };

export const PRESETS: Preset[] = [
  {
    id: "study", emoji: "🎒", title_ar: "أغراض الدراسة", title_en: "Study supplies",
    desc_ar: "شنطة وأدوات وكشاكيل وإضاءة مكتب للطالب", desc_en: "Bag, tools, notebooks and desk light",
    slots: [
      { key: "bag", label_ar: "شنطة مدرسية", label_en: "School bag", match: ["bag", "شنطة", "backpack"] },
      { key: "stationery", label_ar: "أدوات مكتبية", label_en: "Stationery set", match: ["stationery", "أدوات", "pens"] },
      { key: "notebooks", label_ar: "كشاكيل وكراسات", label_en: "Notebooks", match: ["notebook", "كشاكيل", "كراسات"] },
      { key: "desk-light", label_ar: "إضاءة مكتب", label_en: "Desk light", match: ["desk-light", "إضاءة", "lamp"] },
      { key: "bottle", label_ar: "زجاجة مياه", label_en: "Water bottle", match: ["bottle", "زجاجة"] },
    ],
  },
  {
    id: "apartment", emoji: "🏠", title_ar: "تجهيز شقة", title_en: "Furnish an apartment",
    desc_ar: "أساسيات غرفة المعيشة والمطبخ والنوم لشقة جديدة", desc_en: "Living, kitchen and bedroom essentials",
    slots: [
      { key: "sofa", label_ar: "كنبة / ركنة", label_en: "Sofa", match: ["sofa", "كنبة", "ركنة"] },
      { key: "cookware", label_ar: "طقم حلل", label_en: "Cookware set", match: ["cookware", "حلل", "pots"] },
      { key: "bedding", label_ar: "مفروشات سرير", label_en: "Bedding", match: ["bedding", "مفروشات", "ملايات"] },
      { key: "kettle", label_ar: "غلاية كهربائية", label_en: "Electric kettle", match: ["kettle", "غلاية"] },
      { key: "curtains", label_ar: "ستائر", label_en: "Curtains", match: ["curtain", "ستائر"] },
    ],
  },
  {
    id: "wedding", emoji: "💍", title_ar: "تجهيز عروسين", title_en: "Newlyweds setup",
    desc_ar: "جهاز عروسين: مطبخ ومفروشات وأجهزة أساسية", desc_en: "Kitchen, linens and core appliances",
    slots: [
      { key: "cookware", label_ar: "طقم حلل", label_en: "Cookware set", match: ["cookware", "حلل", "pots"] },
      { key: "dinnerware", label_ar: "طقم سفرة", label_en: "Dinnerware", match: ["dinnerware", "سفرة", "plates"] },
      { key: "bedding", label_ar: "مفروشات سرير", label_en: "Bedding", match: ["bedding", "مفروشات", "ملايات"] },
      { key: "blender", label_ar: "خلاط", label_en: "Blender", match: ["blender", "خلاط"] },
      { key: "towels", label_ar: "طقم فوط", label_en: "Towel set", match: ["towel", "فوط"] },
    ],
  },
  {
    id: "office", emoji: "💻", title_ar: "مكتب منزلي", title_en: "Home office",
    desc_ar: "كرسي ومكتب وإضاءة وتنظيم للشغل من البيت", desc_en: "Chair, desk, light and organization",
    slots: [
      { key: "chair", label_ar: "كرسي مكتب", label_en: "Office chair", match: ["chair", "كرسي"] },
      { key: "desk-light", label_ar: "إضاءة مكتب", label_en: "Desk light", match: ["desk-light", "إضاءة", "lamp"] },
      { key: "organizer", label_ar: "منظم مكتب", label_en: "Desk organizer", match: ["organizer", "منظم"] },
      { key: "notebooks", label_ar: "نوت بوك", label_en: "Notebooks", match: ["notebook", "كشاكيل", "نوت"] },
    ],
  },
  {
    id: "baby", emoji: "👶", title_ar: "مولود جديد", title_en: "New baby",
    desc_ar: "أساسيات المولود: نوم واستحمام وملابس", desc_en: "Sleep, bath and clothing essentials",
    slots: [
      { key: "crib-bedding", label_ar: "مفروشات سرير أطفال", label_en: "Crib bedding", match: ["bedding", "مفروشات", "أطفال"] },
      { key: "towels", label_ar: "فوط أطفال", label_en: "Baby towels", match: ["towel", "فوط"] },
      { key: "bottle", label_ar: "ببرونة / زجاجة", label_en: "Baby bottle", match: ["bottle", "زجاجة", "ببرونة"] },
      { key: "bag", label_ar: "شنطة مولود", label_en: "Baby bag", match: ["bag", "شنطة"] },
    ],
  },
];

type RawCatalog = {
  slotKeys: string[]; name_ar: string; name_en: string; category_ar: string; price: number; before?: number; cost?: number;
  rating: number; reviews: number; seller: string; verified: boolean; sellerRating: number; sales: number;
  days: number; ship: number; img: string; brand: string;
};

const U = (id: string) => `https://images.unsplash.com/${id}?w=800&q=80`;
const C: RawCatalog[] = [
  { slotKeys: ["bag"], name_ar: "شنطة مدرسية ضد المياه", name_en: "Waterproof school backpack", category_ar: "دراسة", price: 649, before: 899, rating: 4.8, reviews: 2310, seller: "Souk Pro", verified: true, sellerRating: 4.9, sales: 8200, days: 2, ship: 40, img: U("photo-1553062407-98eeb64c6a62"), brand: "EduPack" },
  { slotKeys: ["bag"], name_ar: "شنطة ظهر اقتصادية", name_en: "Budget backpack", category_ar: "دراسة", price: 399, before: 520, rating: 4.4, reviews: 940, seller: "Cairo Deals", verified: true, sellerRating: 4.6, sales: 3100, days: 3, ship: 35, img: U("photo-1491637639811-60e2756cc1c7"), brand: "CityBag" },
  { slotKeys: ["bag"], name_ar: "شنطة أطفال خفيفة", name_en: "Kids lightweight bag", category_ar: "أطفال", price: 459, before: 599, rating: 4.6, reviews: 1204, seller: "Kids World", verified: false, sellerRating: 4.5, sales: 1900, days: 4, ship: 45, img: U("photo-1503944583220-79d8926ad5e2"), brand: "Kiddo" },
  { slotKeys: ["stationery"], name_ar: "طقم أدوات مكتبية 32 قطعة", name_en: "32-piece stationery set", category_ar: "دراسة", price: 219, before: 299, rating: 4.9, reviews: 3120, seller: "Souk Pro", verified: true, sellerRating: 4.9, sales: 12000, days: 1, ship: 30, img: U("photo-1456735190827-d1262f71b8a3"), brand: "WriteWell" },
  { slotKeys: ["stationery"], name_ar: "علبة أقلام وألوان", name_en: "Pens and colors box", category_ar: "دراسة", price: 149, before: 190, rating: 4.5, reviews: 860, seller: "Cairo Deals", verified: true, sellerRating: 4.6, sales: 4200, days: 2, ship: 30, img: U("photo-1513364776144-60967b0f800f"), brand: "ColorLab" },
  { slotKeys: ["notebooks"], name_ar: "باكت كشاكيل 10 × 60 ورقة", name_en: "10 notebooks pack", category_ar: "دراسة", price: 180, before: 240, rating: 4.7, reviews: 2040, seller: "Paper House", verified: true, sellerRating: 4.8, sales: 9000, days: 1, ship: 25, img: U("photo-1531346878377-a5be20888e57"), brand: "PaperHouse" },
  { slotKeys: ["notebooks"], name_ar: "نوت بوك جلد A5", name_en: "A5 leather notebook", category_ar: "مكتب", price: 260, before: 340, rating: 4.8, reviews: 1120, seller: "Paper House", verified: true, sellerRating: 4.8, sales: 3600, days: 2, ship: 30, img: U("photo-1544816155-12df9643f363"), brand: "PaperHouse" },
  { slotKeys: ["desk-light", "lamp"], name_ar: "أباجورة مكتب LED بعين مريحة", name_en: "LED eye-care desk lamp", category_ar: "إضاءة", price: 549, before: 799, rating: 4.8, reviews: 1780, seller: "LightHub", verified: true, sellerRating: 4.9, sales: 5400, days: 2, ship: 40, img: U("photo-1507473885765-e6ed057f782c"), brand: "Luma" },
  { slotKeys: ["desk-light", "lamp"], name_ar: "مصباح مكتب اقتصادي", name_en: "Budget desk lamp", category_ar: "إضاءة", price: 329, before: 430, rating: 4.3, reviews: 640, seller: "Cairo Deals", verified: false, sellerRating: 4.4, sales: 1500, days: 3, ship: 35, img: U("photo-1513506003901-1e6a229e2d15"), brand: "Luma" },
  { slotKeys: ["bottle"], name_ar: "زجاجة مياه ستانلس 750مل", name_en: "Stainless bottle 750ml", category_ar: "دراسة", price: 299, before: 380, rating: 4.7, reviews: 2210, seller: "Souk Pro", verified: true, sellerRating: 4.9, sales: 8800, days: 1, ship: 30, img: U("photo-1602143407151-7111542de6e8"), brand: "Hydro" },
  { slotKeys: ["bottle"], name_ar: "ببرونة أطفال ضد المغص", name_en: "Anti-colic baby bottle", category_ar: "أطفال", price: 240, before: 310, rating: 4.9, reviews: 3310, seller: "Kids World", verified: true, sellerRating: 4.9, sales: 11000, days: 2, ship: 35, img: U("photo-1519689680058-324335c77eba"), brand: "BabyCare" },
  { slotKeys: ["sofa"], name_ar: "ركنة قماش 3 أفراد", name_en: "3-seat fabric corner sofa", category_ar: "أثاث", price: 12499, before: 15999, rating: 4.7, reviews: 890, seller: "HomeStyle", verified: true, sellerRating: 4.8, sales: 1200, days: 5, ship: 499, img: U("photo-1555041469-a586c61ea9bc"), brand: "HomeStyle" },
  { slotKeys: ["sofa"], name_ar: "كنبة سرير اقتصادية", name_en: "Budget sofa bed", category_ar: "أثاث", price: 8999, before: 10999, rating: 4.4, reviews: 510, seller: "FurnitureEG", verified: true, sellerRating: 4.6, sales: 700, days: 7, ship: 399, img: U("photo-1493663284031-b7e3aefcae8e"), brand: "Comfy" },
  { slotKeys: ["cookware", "pots"], name_ar: "طقم حلل جرانيت 10 قطع", name_en: "Granite cookware 10 pcs", category_ar: "مطبخ", price: 2899, before: 3900, rating: 4.8, reviews: 2670, seller: "KitchenPro", verified: true, sellerRating: 4.9, sales: 6300, days: 2, ship: 60, img: U("photo-1584990347449-a2d4c2c6d9e8"), brand: "Granita" },
  { slotKeys: ["cookware", "pots"], name_ar: "طقم حلل ستانلس اقتصادي", name_en: "Budget stainless pots", category_ar: "مطبخ", price: 1749, before: 2200, rating: 4.4, reviews: 980, seller: "KitchenPro", verified: true, sellerRating: 4.9, sales: 2900, days: 3, ship: 55, img: U("photo-1585515320310-259814833e62"), brand: "SteelCook" },
  { slotKeys: ["bedding"], name_ar: "طقم ملايات قطن 4 قطع", name_en: "Cotton bedding 4 pcs", category_ar: "مفروشات", price: 899, before: 1250, rating: 4.8, reviews: 1890, seller: "CottonHouse", verified: true, sellerRating: 4.9, sales: 5700, days: 2, ship: 45, img: U("photo-1522771739844-6a9f6d5f14af"), brand: "CottonHouse" },
  { slotKeys: ["bedding", "crib-bedding"], name_ar: "مفروشات سرير أطفال قطن", name_en: "Kids cotton bedding", category_ar: "أطفال", price: 649, before: 850, rating: 4.9, reviews: 1430, seller: "Kids World", verified: true, sellerRating: 4.9, sales: 4100, days: 2, ship: 40, img: U("photo-1519689680058-324335c77eba"), brand: "BabyCare" },
  { slotKeys: ["kettle"], name_ar: "غلاية ستانلس 1.8 لتر", name_en: "Stainless kettle 1.8L", category_ar: "مطبخ", price: 749, before: 999, rating: 4.6, reviews: 3120, seller: "KitchenPro", verified: true, sellerRating: 4.9, sales: 9800, days: 1, ship: 40, img: U("photo-1594213114663-d94db9b17125"), brand: "QuickHeat" },
  { slotKeys: ["curtains", "curtain"], name_ar: "ستارة بلاك أوت 2 ضلفة", name_en: "Blackout curtains pair", category_ar: "مفروشات", price: 1099, before: 1450, rating: 4.5, reviews: 760, seller: "CottonHouse", verified: true, sellerRating: 4.9, sales: 2100, days: 3, ship: 50, img: U("photo-1513694203232-719a280e022f"), brand: "CottonHouse" },
  { slotKeys: ["dinnerware", "plates"], name_ar: "طقم سفرة بورسلين 24 قطعة", name_en: "Porcelain dinnerware 24 pcs", category_ar: "مطبخ", price: 2199, before: 2899, rating: 4.7, reviews: 1340, seller: "KitchenPro", verified: true, sellerRating: 4.9, sales: 3400, days: 2, ship: 60, img: U("photo-1603199506016-b9a594b593c0"), brand: "Porcela" },
  { slotKeys: ["blender"], name_ar: "خلاط 600 وات + مطحنة", name_en: "Blender 600W + grinder", category_ar: "أجهزة", price: 1599, before: 2100, rating: 4.6, reviews: 2980, seller: "ElectroEG", verified: true, sellerRating: 4.8, sales: 7600, days: 2, ship: 55, img: U("photo-1570222094114-d054a817e56b"), brand: "BlendPro" },
  { slotKeys: ["towels"], name_ar: "طقم فوط قطن 6 قطع", name_en: "Cotton towels 6 pcs", category_ar: "مفروشات", price: 549, before: 720, rating: 4.8, reviews: 1670, seller: "CottonHouse", verified: true, sellerRating: 4.9, sales: 5200, days: 1, ship: 35, img: U("photo-1620626011761-996317b8d101"), brand: "CottonHouse" },
  { slotKeys: ["chair"], name_ar: "كرسي مكتب مريح شبك", name_en: "Ergonomic mesh chair", category_ar: "مكتب", price: 3499, before: 4600, rating: 4.7, reviews: 1980, seller: "OfficeHub", verified: true, sellerRating: 4.8, sales: 4300, days: 3, ship: 120, img: U("photo-1505797149-35ebcb05a6fd"), brand: "ErgoSeat" },
  { slotKeys: ["chair"], name_ar: "كرسي مكتب اقتصادي", name_en: "Budget office chair", category_ar: "مكتب", price: 2199, before: 2800, rating: 4.3, reviews: 720, seller: "OfficeHub", verified: false, sellerRating: 4.5, sales: 1600, days: 4, ship: 100, img: U("photo-1688578735352-9a6f2ac3b70a"), brand: "ErgoSeat" },
  { slotKeys: ["organizer"], name_ar: "منظم مكتب خشب", name_en: "Wooden desk organizer", category_ar: "مكتب", price: 349, before: 460, rating: 4.6, reviews: 890, seller: "Paper House", verified: true, sellerRating: 4.8, sales: 2700, days: 2, ship: 30, img: U("photo-1507925921958-8a62f3d1a50d"), brand: "DeskArt" },
];

function toProduct(r: RawCatalog, currency: string, country: string): Product {
  const now = new Date().toISOString();
  return {
    id: `cat_${r.name_en.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    name_ar: r.name_ar, name_en: r.name_en, slug: r.name_en.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    category: r.category_ar, category_ar: r.category_ar, brand: r.brand, condition: "new",
    price: r.price, compareAtPrice: r.before, costPrice: r.cost, currency, country,
    stock: 20, sku: `CAT-${Math.abs(r.name_en.split("").reduce((a, c) => a + c.charCodeAt(0), 0))}`,
    description_ar: `${r.name_ar} — منتج تجريبي داخل مخزون العرض، توصيل تقديري خلال ${r.days} أيام.`,
    description_en: `${r.name_en} — sample listing in the demo inventory, estimated delivery in ${r.days} days.`,
    shortDescription_ar: r.name_ar,
    features: ["منتج تجريبي للعرض", `توصيل تقديري ${r.days} أيام`],
    specs: { Brand: r.brand, Source: "Sample inventory", Delivery: `${r.days} days` },
    variants: [{ id: `v_${r.name_en.slice(0, 6)}`, name: "Standard", name_ar: "قياسي", price: r.price, stock: 20 }],
    images: [r.img], tags: r.slotKeys, materials: [], colors: [], sizes: [],
    shipping: `شحن ${r.ship} ${currency} — توصيل ${r.days} أيام`, warranty: "استبدال 14 يوم",
    seoTitle: `${r.name_en} | Souk Lens`, seoDescription: r.name_ar,
    source: { type: "manual", label: "sample-inventory" }, qualityScore: 82,
    // Sample inventory carries NO invented reviews, seller ratings or sales history.
    rating: undefined, reviewCount: undefined, sellerName: "Sample inventory", sellerVerified: false,
    sellerRating: undefined, sellerSales: undefined, deliveryDays: r.days, shippingCost: r.ship,
    needSlot: r.slotKeys[0], createdAt: now, updatedAt: now,
  };
}

export type Priority = "balanced" | "price" | "rating" | "delivery" | "trust";

const WEIGHTS: Record<Priority, { rating: number; discount: number; price: number; delivery: number; trust: number }> = {
  balanced: { rating: 0.3, discount: 0.2, price: 0.2, delivery: 0.15, trust: 0.15 },
  price: { rating: 0.15, discount: 0.25, price: 0.4, delivery: 0.1, trust: 0.1 },
  rating: { rating: 0.45, discount: 0.1, price: 0.15, delivery: 0.1, trust: 0.2 },
  delivery: { rating: 0.15, discount: 0.1, price: 0.15, delivery: 0.45, trust: 0.15 },
  trust: { rating: 0.2, discount: 0.1, price: 0.1, delivery: 0.1, trust: 0.5 },
};

export function scoreProduct(p: Product, priority: Priority, minPrice: number, maxPrice: number): number {
  const w = WEIGHTS[priority];
  // Real listing rating when present; otherwise listing completeness (qualityScore) — never an invented review score.
  const rating = p.rating ? p.rating / 5 : Math.min(1, (p.qualityScore ?? 70) / 100);
  const discount = p.compareAtPrice && p.compareAtPrice > p.price ? (p.compareAtPrice - p.price) / p.compareAtPrice : 0;
  const priceScore = maxPrice > minPrice ? 1 - (p.price - minPrice) / (maxPrice - minPrice) : 1;
  const delivery = 1 / Math.max(1, p.deliveryDays ?? 3);
  const trust = p.sellerVerified ? 0.6 + ((p.sellerRating ?? 4.5) / 5) * 0.4 : p.sellerRating ? ((p.sellerRating / 5) * 0.5) : 0.25;
  return Math.round((w.rating * rating + w.discount * Math.min(1, discount * 2) + w.price * priceScore + w.delivery * delivery + w.trust * trust) * 100);
}

export type Bundle = {
  id: string; title_ar: string; title_en: string; desc_ar: string; strategy: Priority;
  items: (Product & { score: number; qty: number })[];
  subtotal: number; compareTotal: number; savings: number; shipping: number; total: number; maxDeliveryDays: number;
};

export function buildInvoice(items: { price: number; compareAtPrice?: number; shippingCost?: number; deliveryDays?: number; qty: number }[]) {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const compareTotal = items.reduce((s, i) => s + (i.compareAtPrice ?? i.price) * i.qty, 0);
  const shipping = subtotal >= 5000 ? 0 : items.reduce((s, i) => s + (i.shippingCost ?? 40), 0);
  return {
    subtotal, compareTotal, savings: compareTotal - subtotal, shipping,
    total: subtotal + shipping, maxDeliveryDays: Math.max(1, ...items.map((i) => i.deliveryDays ?? 3)),
  };
}

function slotCandidates(catalog: Product[], slot: NeedSlot, preset: Preset): Product[] {
  return catalog.filter((p) => {
    const tagMatched = p.tags.some((tg) => tg === slot.key || slot.match.includes(tg));
    // Saved user products rarely carry slot tags — match them by name/category/specs text too.
    const haystack = `${p.name_en} ${p.name_ar} ${p.category} ${p.category_ar} ${p.tags.join(" ")} ${Object.values(p.specs).join(" ")}`.toLowerCase();
    const textMatched = slot.match.some((m) => m.length > 2 && haystack.includes(m.toLowerCase())) || haystack.includes(slot.key.replace("-", " "));
    if (!tagMatched && !textMatched) return false;
    // A baby bottle must never fill a school bottle slot (and vice versa outside the baby preset)
    const isBabyProduct = /baby|ببرونة|أطفال/i.test(`${p.name_en} ${p.name_ar} ${p.category_ar}`);
    if (isBabyProduct && preset.id !== "baby") return false;
    if (!isBabyProduct && preset.id === "baby" && slot.key === "bottle") return false;
    return true;
  });
}

function makeBundle(id: string, title_ar: string, title_en: string, desc_ar: string, strategy: Priority, preset: Preset, catalog: Product[], budget?: number): Bundle {
  const items: Bundle["items"] = [];
  for (const slot of preset.slots) {
    const candidates = slotCandidates(catalog, slot, preset);
    if (!candidates.length) continue;
    const prices = candidates.map((c) => c.price);
    const scored = candidates.map((c) => ({ ...c, needSlot: slot.key, score: scoreProduct(c, strategy, Math.min(...prices), Math.max(...prices)), qty: 1 }));
    scored.sort((a, b) => b.score - a.score);
    let pick = scored[0];
    if (budget && strategy === "price") {
      const perSlot = budget / preset.slots.length;
      pick = scored.find((s) => s.price <= perSlot * 1.4) ?? scored[scored.length - 1];
    }
    items.push(pick);
  }
  return { id, title_ar, title_en, desc_ar, strategy, items, ...buildInvoice(items) };
}

const KEYWORD_PRESET: [RegExp, string][] = [
  [/دراس|مدرس|طالب|جامع|study|school|student/i, "study"],
  [/شقه|شقة|تجهيز ش|فرش|apartment|furnish|بيت جديد/i, "apartment"],
  [/عروس|جواز|زواج|wedding|bride|عريس/i, "wedding"],
  [/مكتب|شغل من البيت|office|work from home/i, "office"],
  [/مولود|بيبي|طفل|baby|newborn/i, "baby"],
];

export function detectPreset(query: string, presetId?: string): Preset {
  if (presetId) { const p = PRESETS.find((x) => x.id === presetId); if (p) return p; }
  for (const [re, id] of KEYWORD_PRESET) if (re.test(query)) return PRESETS.find((p) => p.id === id) ?? PRESETS[0];
  return PRESETS[0];
}

export function smartSearch(opts: { query: string; presetId?: string; country?: string; currency?: string; budget?: number; priority?: Priority; extraProducts?: Product[] }) {
  const preset = detectPreset(opts.query, opts.presetId);
  const currency = opts.currency ?? "EGP";
  // Unified search space: sample marketplace inventory + the user's own saved products (real, full listings).
  // No invented trust signals are added to saved products — only operational delivery estimates.
  const saved = (opts.extraProducts ?? []).slice(0, 100).map((p) => ({
    ...p,
    sellerName: p.sellerName ?? "My saved products",
    deliveryDays: p.deliveryDays ?? p.shippingDetails?.etaDaysMax ?? 3,
    shippingCost: p.shippingCost ?? p.shippingDetails?.cost ?? 40,
    currency: p.currency || currency,
  }));
  const demoCatalog = C.map((r) => toProduct(r, currency, opts.country ?? "EG"));
  const savedIds = new Set(saved.map((p) => p.id));
  const catalog = [...saved, ...demoCatalog.filter((p) => !savedIds.has(p.id))];
  const allBundles: Bundle[] = [
    makeBundle("value", "أفضل قيمة", "Best value", "أحسن توازن بين السعر والخصم واكتمال الإعلان", "price", preset, catalog, opts.budget),
    makeBundle("top", "أفضل مطابقة وجودة", "Best match & quality", "اكتمال إعلان وثقة موثقة عند توفرها", opts.priority === "trust" ? "trust" : "rating", preset, catalog, opts.budget),
    makeBundle("fast", "أسرع توصيل", "Fastest delivery", "أقل أيام توصيل لباب البيت", "delivery", preset, catalog, opts.budget),
  ];
  const firstId = opts.priority === "rating" || opts.priority === "trust" ? "top" : opts.priority === "delivery" ? "fast" : "value";
  const bundles = [...allBundles.filter((b) => b.id === firstId), ...allBundles.filter((b) => b.id !== firstId)];
  // Alternatives per slot (for replace/move): all candidates scored balanced
  const alternativesBySlot: Record<string, (Product & { score: number })[]> = {};
  for (const slot of preset.slots) {
    const candidates = slotCandidates(catalog, slot, preset);
    const prices = candidates.map((c) => c.price);
    alternativesBySlot[slot.key] = candidates
      .map((c) => ({ ...c, needSlot: slot.key, score: scoreProduct(c, "balanced", Math.min(...prices), Math.max(...prices)) }))
      .sort((a, b) => b.score - a.score);
  }
  return { preset, bundles, alternativesBySlot, catalogSize: catalog.length, savedCount: saved.length, demoCount: demoCatalog.length, sampleCount: demoCatalog.length, savedIds: [...savedIds] };
}
