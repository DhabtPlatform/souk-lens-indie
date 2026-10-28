import { z } from "zod";
import { safeText, uid } from "./utils";

export const ProductVariantSchema = z.object({
  id: z.string().optional(),
  name: z.string().default("Standard"),
  name_ar: z.string().optional(),
  sku: z.string().optional(),
  priceModifier: z.number().optional(),
  price: z.number().optional(),
  stock: z.number().optional(),
  attributes: z.record(z.string(), z.string()).optional(),
  image: z.string().optional(),
});
export const ShippingDetailsSchema = z.object({
  carrier: z.string().optional(),
  etaDaysMin: z.number().optional(),
  etaDaysMax: z.number().optional(),
  cost: z.number().optional(),
  freeOver: z.number().optional(),
  shipsFrom: z.string().optional(),
}).partial();
export const ReturnPolicySchema = z.object({
  days: z.number().optional(),
  terms: z.string().optional(),
}).partial();
export type ProductVariant = z.infer<typeof ProductVariantSchema> & { id: string };

export const ProductSourceSchema = z.object({
  type: z.enum(["image", "text", "voice", "url", "import", "manual"]),
  url: z.string().optional(),
  label: z.string().optional(),
  transcript: z.string().optional(),
});
export type ProductSource = z.infer<typeof ProductSourceSchema>;

export type SalesMode = "fixed" | "auction" | "live" | "campaign";
export type AuctionState = { startingPrice: number; currentBid: number; bids: number; endsInHours: number };
export type LiveSaleState = { platform: string; scheduledAt: string; expectedViewers: number };
export type CampaignState = { channel: string; budget: number; reach: number; clicks: number; conversions: number };

export type Product = {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  category: string;
  category_ar: string;
  brand: string;
  condition: "new" | "used" | "used-good" | "refurbished" | string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  currency: string;
  country: string;
  stock: number;
  sku: string;
  description_ar: string;
  description_en: string;
  shortDescription_ar: string;
  features: string[];
  specs: Record<string, string>;
  variants: ProductVariant[];
  images: string[];
  sourceImage?: string;
  studioImage?: string;
  tags: string[];
  materials: string[];
  colors: string[];
  sizes: string[];
  shipping: string;
  shippingDetails?: z.infer<typeof ShippingDetailsSchema>;
  returnPolicy?: z.infer<typeof ReturnPolicySchema>;
  availableCountries?: string[];
  glbUrl?: string;
  angleImages?: string[];
  warranty: string;
  seoTitle: string;
  seoDescription: string;
  source: ProductSource;
  qualityScore: number;
  boxId?: number;
  rating?: number;
  reviewCount?: number;
  sellerName?: string;
  sellerVerified?: boolean;
  sellerRating?: number;
  sellerSales?: number;
  deliveryDays?: number;
  shippingCost?: number;
  needSlot?: string;
  // Seller management: sales / costs / profit + alternative selling channels
  soldUnits?: number;
  salesMode?: SalesMode;
  auction?: AuctionState;
  liveSale?: LiveSaleState;
  campaign?: CampaignState;
  createdAt: string;
  updatedAt: string;
};

export type RawItem = Record<string, unknown>;

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 60) || uid("item");
}
function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
function strArr(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => (typeof x === "string" ? x : safeText((x as RawItem)?.name) || safeText((x as RawItem)?.name_ar))).filter(Boolean);
  if (typeof v === "string" && v.trim()) return v.split(/[,،|]/).map((s) => s.trim()).filter(Boolean);
  return [];
}
function specsOf(v: unknown): Record<string, string> {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const out: Record<string, string> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) out[k] = String(val);
    return out;
  }
  return {};
}

export function normalizeProduct(
  raw: RawItem,
  opts: { source: ProductSource; country?: string; currency?: string; fallbackImage?: string; studioImage?: string; realImage?: string }
): Product {
  const name_en = safeText(raw.name_en, safeText(raw.title, "Untitled product"));
  const name_ar = safeText(raw.name_ar, name_en);
  const price = num(raw.price ?? raw.price_egp, 450);
  const variantsRaw = Array.isArray(raw.variants) ? raw.variants : [];
  const variants: ProductVariant[] = (variantsRaw.length ? variantsRaw : [{ name: "Standard" }]).map((v, i) => {
    const o = (typeof v === "string" ? { name: v } : (v as RawItem)) as RawItem;
    return {
      id: safeText(o.id, uid("v")),
      name: safeText(o.name, `Variant ${i + 1}`),
      name_ar: safeText(o.name_ar) || undefined,
      sku: safeText(o.sku) || undefined,
      price: o.price !== undefined ? num(o.price, price) : undefined,
      priceModifier: o.priceModifier !== undefined ? num(o.priceModifier, 0) : undefined,
      stock: o.stock !== undefined ? num(o.stock, 10) : 10,
      attributes: specsOf(o.attributes),
      image: (typeof o.image === "string" && o.image ? o.image : undefined),
    };
  });
  // Real seller photo always leads the gallery (buyer trust); generated studio shot follows for polish.
  const images = Array.from(new Set([
    opts.realImage ?? "", safeText(raw.image), safeText(raw.imageUrl), opts.studioImage ?? "", opts.fallbackImage ?? "",
    ...(Array.isArray(raw.images) ? raw.images.map((x) => safeText(x)) : []),
  ].filter((s) => s && (s.startsWith("http") || s.startsWith("data:") || s.startsWith("/")))));
  const specs = specsOf(raw.specs);
  const features = strArr(raw.features).length ? strArr(raw.features) : strArr(raw.highlights);
  const colors = strArr(raw.colors);
  const sizes = strArr(raw.sizes);
  const descAr = safeText(raw.description_ar, safeText(raw.description, `${name_ar} — منتج جاهز للبيع بمواصفات كاملة.`));
  const now = new Date().toISOString();
  return {
    id: uid("prod"),
    name_ar, name_en,
    slug: slugify(name_en),
    category: safeText(raw.category, "General"),
    category_ar: safeText(raw.category_ar, "عام"),
    brand: safeText(raw.brand, "—"),
    condition: safeText(raw.condition, "new"),
    price,
    compareAtPrice: raw.compareAtPrice ? num(raw.compareAtPrice) : raw.price_before ? num(raw.price_before) : undefined,
    costPrice: raw.costPrice ? num(raw.costPrice) : raw.cost ? num(raw.cost) : undefined,
    currency: safeText(raw.currency, opts.currency ?? "EGP"),
    country: opts.country ?? "EG",
    stock: raw.stock !== undefined ? num(raw.stock, 10) : 10,
    sku: safeText(raw.sku, `SL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`),
    description_ar: descAr,
    description_en: safeText(raw.description_en, descAr),
    shortDescription_ar: safeText(raw.shortDescription_ar, descAr.slice(0, 110)),
    features: features.length ? features : ["صورة احترافية جاهزة", "وصف بيعي عربي وإنجليزي", "متغيرات وأسعار قابلة للتعديل"],
    specs: Object.keys(specs).length ? specs : { Condition: safeText(raw.condition, "new") },
    variants,
    images,
    sourceImage: opts.realImage ?? opts.fallbackImage,
    studioImage: opts.studioImage,
    tags: strArr(raw.tags),
    materials: strArr(raw.materials ?? raw.material),
    colors,
    sizes,
    shipping: safeText(raw.shipping, "شحن حسب المدينة — يُحسب عند الطلب"),
    shippingDetails: (raw.shippingDetails && typeof raw.shippingDetails === "object" && !Array.isArray(raw.shippingDetails))
      ? {
          carrier: safeText((raw.shippingDetails as RawItem).carrier) || undefined,
          etaDaysMin: (raw.shippingDetails as RawItem).etaDaysMin !== undefined ? num((raw.shippingDetails as RawItem).etaDaysMin) : undefined,
          etaDaysMax: (raw.shippingDetails as RawItem).etaDaysMax !== undefined ? num((raw.shippingDetails as RawItem).etaDaysMax) : undefined,
          cost: (raw.shippingDetails as RawItem).cost !== undefined ? num((raw.shippingDetails as RawItem).cost) : undefined,
          freeOver: (raw.shippingDetails as RawItem).freeOver !== undefined ? num((raw.shippingDetails as RawItem).freeOver) : undefined,
          shipsFrom: safeText((raw.shippingDetails as RawItem).shipsFrom) || undefined,
        }
      : undefined,
    returnPolicy: (raw.returnPolicy && typeof raw.returnPolicy === "object" && !Array.isArray(raw.returnPolicy))
      ? {
          days: (raw.returnPolicy as RawItem).days !== undefined ? num((raw.returnPolicy as RawItem).days) : undefined,
          terms: safeText((raw.returnPolicy as RawItem).terms) || undefined,
        }
      : undefined,
    availableCountries: strArr(raw.availableCountries ?? raw.shipsToCountries).length ? strArr(raw.availableCountries ?? raw.shipsToCountries) : undefined,
    glbUrl: safeText(raw.glbUrl) || undefined,
    angleImages: Array.isArray(raw.angleImages) ? raw.angleImages.map((x) => safeText(x)).filter((s) => s && (s.startsWith("http") || s.startsWith("data:") || s.startsWith("/"))) : undefined,
    warranty: safeText(raw.warranty, "—"),
    seoTitle: safeText(raw.seoTitle, `${name_en} | Souk Lens`),
    seoDescription: safeText(raw.seoDescription, descAr.slice(0, 150)),
    source: opts.source,
    qualityScore: Math.min(100, 55 + (images.length ? 15 : 0) + (variants.length > 1 ? 15 : 5) + (Object.keys(specs).length > 1 ? 15 : 5)),
    rating: raw.rating !== undefined ? num(raw.rating) : undefined,
    reviewCount: raw.reviewCount !== undefined ? num(raw.reviewCount) : undefined,
    sellerName: safeText(raw.sellerName) || undefined,
    sellerVerified: typeof raw.sellerVerified === "boolean" ? raw.sellerVerified : undefined,
    sellerRating: raw.sellerRating !== undefined ? num(raw.sellerRating) : undefined,
    sellerSales: raw.sellerSales !== undefined ? num(raw.sellerSales) : undefined,
    deliveryDays: raw.deliveryDays !== undefined ? num(raw.deliveryDays) : undefined,
    shippingCost: raw.shippingCost !== undefined ? num(raw.shippingCost) : undefined,
    needSlot: safeText(raw.needSlot) || undefined,
    soldUnits: raw.soldUnits !== undefined ? num(raw.soldUnits) : undefined,
    salesMode: (["fixed", "auction", "live", "campaign"].includes(String(raw.salesMode)) ? raw.salesMode : undefined) as Product["salesMode"],
    createdAt: now, updatedAt: now,
  };
}

export function normalizeProducts(
  raws: RawItem[],
  opts: Parameters<typeof normalizeProduct>[1]
): Product[] {
  return raws.map((r) => normalizeProduct(r, opts));
}

export function buildAdText(p: Product, lang: "ar" | "en" = "ar"): string {
  const priceLine = `${p.price} ${p.currency}`;
  if (lang === "en") {
    return `${p.name_en}\n${p.description_en}\nPrice: ${priceLine}\nCategory: ${p.category} · Condition: ${p.condition}\nVariants: ${p.variants.map((v) => v.name).join(", ")}\nSKU: ${p.sku}`;
  }
  return `${p.name_ar}\n${p.description_ar}\nالسعر: ${priceLine}\nالفئة: ${p.category_ar} · الحالة: ${p.condition}\nالمتغيرات: ${p.variants.map((v) => v.name_ar ?? v.name).join("، ")}\nكود المنتج: ${p.sku}\nالمميزات:\n${p.features.map((f) => `• ${f}`).join("\n")}`;
}

export const FULL_PRODUCT_JSON_HINT = `Return valid JSON only: {"items":[{"name_ar":"","name_en":"","category":"","category_ar":"","brand":"","condition":"new|used|used-good","price":0,"compareAtPrice":0,"costPrice":0,"currency":"","stock":10,"sku":"","description_ar":"","description_en":"","shortDescription_ar":"","features":[""],"specs":{"":""},"variants":[{"name":"","name_ar":"","price":0,"stock":10,"attributes":{"color":"","size":""}}],"tags":[""],"materials":[""],"colors":[""],"sizes":[""],"shipping":"","shippingDetails":{"carrier":"","etaDaysMin":1,"etaDaysMax":3,"cost":0,"freeOver":0,"shipsFrom":""},"returnPolicy":{"days":14,"terms":""},"availableCountries":[""],"warranty":"","seoTitle":"","seoDescription":""}]}`;
