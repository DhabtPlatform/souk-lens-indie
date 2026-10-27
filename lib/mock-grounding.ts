// Grounded demo data: the mock pipeline names what was actually asked/detected,
// never a fixed unrelated object. Shared by SAM and Spark mocks.
export const KEYWORD_ITEMS: Record<string, { label: string; name_ar: string; name_en: string; category_ar: string; category: string; price: number; compare: number; cost: number; desc_ar: string }> = {
  avocado: { label: "avocado", name_ar: "أفوكادو طازج", name_en: "Fresh avocado", category_ar: "خضار وفاكهة", category: "Produce", price: 95, compare: 120, cost: 60, desc_ar: "أفوكادو طازج جاهز للأكل، مناسب للسلطات والدايت." },
  hazelnut: { label: "hazelnuts", name_ar: "بندق مقشر", name_en: "Shelled hazelnuts", category_ar: "مكسرات", category: "Nuts & snacks", price: 420, compare: 520, cost: 280, desc_ar: "بندق مقشر فاخر للتحميص والحلويات، وزن صافٍ." },
  nut: { label: "mixed nuts", name_ar: "مكسرات مشكلة", name_en: "Mixed nuts", category_ar: "مكسرات", category: "Nuts & snacks", price: 380, compare: 460, cost: 250, desc_ar: "مكسرات مشكلة طازجة (بندق ولوز وكاجو) للتقديم والضيافة." },
  lamp: { label: "brass lamp", name_ar: "مصباح نحاس يدوي", name_en: "Handmade brass lamp", category_ar: "ديكور منزلي", category: "Home decor", price: 850, compare: 1100, cost: 500, desc_ar: "مصباح نحاس شغل يدوي، حالته ممتازة ومنوّر أي ركن." },
  chair: { label: "wooden chair", name_ar: "كرسي خشب زان", name_en: "Beech wood chair", category_ar: "أثاث", category: "Furniture", price: 1450, compare: 1800, cost: 900, desc_ar: "كرسي خشب زان بحالة ممتازة، متين ومناسب للبيت والمكتب." },
  shoe: { label: "sneakers", name_ar: "حذاء رياضي", name_en: "Running sneakers", category_ar: "أحذية", category: "Fashion", price: 690, compare: 890, cost: 420, desc_ar: "حذاء رياضي مريح، جديد، مناسب للجري والمشاوير اليومية." },
  bag: { label: "leather bag", name_ar: "شنطة جلد", name_en: "Leather bag", category_ar: "إكسسوارات", category: "Fashion", price: 780, compare: 990, cost: 480, desc_ar: "شنطة جلد عملية بخامة ممتازة وتقفيل نظيف." },
  vase: { label: "ceramic vase", name_ar: "مزهرية سيراميك", name_en: "Ceramic vase", category_ar: "ديكور منزلي", category: "Home decor", price: 320, compare: 420, cost: 180, desc_ar: "مزهرية سيراميك ألوان هادية تنفع للديكور والهدايا." },
  fruit: { label: "fresh fruit", name_ar: "فاكهة طازجة", name_en: "Fresh fruit", category_ar: "خضار وفاكهة", category: "Produce", price: 65, compare: 85, cost: 40, desc_ar: "فاكهة طازجة مختارة يوم بيوم من السوق." },
  clothes: { label: "clothing", name_ar: "ملابس", name_en: "Clothing item", category_ar: "ملابس", category: "Fashion", price: 350, compare: 450, cost: 210, desc_ar: "قطعة ملابس بخامة مريحة وحالة ممتازة." },
};

export function keywordOf(text: string): string | null {
  const t = text.toLowerCase();
  const arMap: [RegExp, string][] = [[/أفوكادو|افوكادو/, "avocado"], [/بندق/, "hazelnut"], [/مكسرات/, "nut"], [/مصباح|أباجورة|اباجورة/, "lamp"], [/كرسي/, "chair"], [/حذاء|شوز|كوتشي/, "shoe"], [/شنطة|حقيبة/, "bag"], [/مزهرية|فازة/, "vase"], [/فاكهة|فواكه/, "fruit"], [/ملابس|هدوم/, "clothes"]];
  for (const [re, k] of arMap) if (re.test(t)) return k;
  for (const k of Object.keys(KEYWORD_ITEMS)) if (t.includes(k)) return k;
  if (t.includes("sneaker") || t.includes("shoe")) return "shoe";
  if (t.includes("nut")) return "nut";
  return null;
}

export function mockItem(text: string) {
  const key = keywordOf(text);
  const base = key ? KEYWORD_ITEMS[key] : KEYWORD_ITEMS.lamp;
  if (key) {
    return {
      name_ar: base.name_ar, name_en: base.name_en, category: base.category, category_ar: base.category_ar, brand: "—",
      condition: "new", price: base.price, compareAtPrice: base.compare, costPrice: base.cost, currency: "EGP", stock: 10, sku: `SL-${key.toUpperCase()}-01`,
      description_ar: base.desc_ar, description_en: base.desc_ar, shortDescription_ar: base.name_ar,
      features: ["منتج حقيقي من الصورة", "وصف وأسعار قابلة للتعديل", "جاهز للنشر والمشاركة"],
      specs: { Item: base.label }, variants: [{ name: "Standard", name_ar: "قياسي", price: base.price, stock: 10 }],
      tags: [base.label], materials: [], colors: [], sizes: [],
      shipping: "شحن حسب المدينة", warranty: "—", seoTitle: `${base.name_en} | Souk Lens`, seoDescription: base.desc_ar,
      shippingDetails: { carrier: "Souk Express", etaDaysMin: 1, etaDaysMax: 3, cost: 40, freeOver: 500, shipsFrom: "Cairo" },
      returnPolicy: { days: 14, terms: "استرجاع خلال 14 يوم بحالته الأصلية" },
      availableCountries: ["EG", "SA", "AE"],
    };
  }
  return null;
}
