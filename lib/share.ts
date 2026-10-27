import type { Product } from "@/lib/product";

const http = (u: unknown) => typeof u === "string" && /^https?:\/\//.test(u);
// Shared-link previews work with zero backend: the listing travels inside the
// URL fragment (#s=...). Only small remote (http) images are embedded —
// base64 shots stay on the seller's device, so links stay short and honest.
export function buildShareLink(origin: string, path: string, p: Product): string | null {
  try {
    const mini = {
      id: p.id,
      name_ar: p.name_ar?.slice(0, 90) ?? "",
      name_en: p.name_en?.slice(0, 90) ?? "",
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      currency: p.currency,
      stock: p.stock,
      images: (p.images ?? []).filter(http).slice(0, 3),
      sourceImage: http(p.sourceImage) ? p.sourceImage : undefined,
      studioImage: http(p.studioImage) ? p.studioImage : undefined,
      description_en: p.description_en?.slice(0, 280) ?? "",
      variants: (p.variants ?? []).slice(0, 6).map((v) => ({
        id: v.id,
        name: v.name?.slice(0, 40),
        price: v.price ?? p.price,
        stock: v.stock ?? 0,
        image: http(v.image) ? v.image : undefined,
      })),
    };
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(mini))))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const url = `${origin}${path}#s=${b64}`;
    return url.length <= 3500 ? url : null;
  } catch {
    return null;
  }
}

export function parseShareLink(hash: string): Product | null {
  try {
    const m = hash.match(/#s=([A-Za-z0-9\-_]+)/);
    if (!m) return null;
    const json = decodeURIComponent(escape(atob(m[1].replace(/-/g, "+").replace(/_/g, "/"))));
    const o = JSON.parse(json) as Record<string, unknown>;
    if (!o || typeof o.id !== "string" || typeof o.name_en !== "string") return null;
    const v = (o.variants ?? []) as { id: string; name: string; price: number; stock: number; image?: string }[];
    return {
      id: o.id as string,
      name_ar: (o.name_ar as string) ?? "",
      name_en: o.name_en as string,
      slug: o.id as string,
      category: "",
      category_ar: "",
      brand: "",
      condition: "new",
      price: Number(o.price) || 0,
      compareAtPrice: o.compareAtPrice as number | undefined,
      currency: (o.currency as string) ?? "EGP",
      country: "",
      stock: Number(o.stock) || 0,
      sku: o.id as string,
      description_ar: "",
      description_en: (o.description_en as string) ?? "",
      shortDescription_ar: "",
      features: [],
      specs: {},
      variants: v.map((x, i) => ({ id: String(x.id ?? i), name: String(x.name ?? ""), price: Number(x.price) || 0, stock: Number(x.stock) || 0, image: x.image as string | undefined, attributes: {} as Record<string, string> })),
      images: ((o.images ?? []) as string[]).filter(http),
      sourceImage: o.sourceImage as string | undefined,
      studioImage: o.studioImage as string | undefined,
      tags: [],
      materials: [],
      colors: [],
      sizes: [],
      shipping: "",
      warranty: "",
      seoTitle: o.name_en as string,
      seoDescription: "",
      source: { type: "url", label: "shared-link" },
      qualityScore: 0,
      soldUnits: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Product;
  } catch {
    return null;
  }
}
