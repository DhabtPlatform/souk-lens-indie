import { describe, expect, it } from "vitest";
import { buildShareLink, parseShareLink } from "@/lib/share";
import type { Product } from "@/lib/product";

const prod = {
  id: "prod_test_1",
  name_ar: "أفوكادو",
  name_en: "Fresh Hass Avocado",
  slug: "x",
  category: "",
  category_ar: "",
  brand: "",
  condition: "new",
  price: 75,
  compareAtPrice: 95,
  currency: "EGP",
  country: "EG",
  stock: 120,
  sku: "AVO-1",
  description_ar: "",
  description_en: "Creamy green fruit",
  shortDescription_ar: "",
  features: [],
  specs: {},
  variants: [
    { id: "v1", name: "Single", price: 75, stock: 80, attributes: {} },
    { id: "v2", name: "Pack", price: 140, stock: 40, attributes: {} },
  ],
  images: ["https://example.com/a.jpg"],
  tags: [],
  materials: [],
  colors: [],
  sizes: [],
  shipping: "",
  warranty: "",
  seoTitle: "",
  seoDescription: "",
  source: { type: "image" },
  qualityScore: 90,
} as unknown as Product;

describe("share links (no backend)", () => {
  it("round-trips a product through the URL hash", () => {
    const url = buildShareLink("https://demo.test", "/product/prod_test_1", prod);
    expect(url).toBeTruthy();
    expect(url!.length).toBeLessThanOrEqual(3500);
    const back = parseShareLink(new URL(url!).hash);
    expect(back?.id).toBe("prod_test_1");
    expect(back?.name_en).toBe("Fresh Hass Avocado");
    expect(back?.price).toBe(75);
    expect(back?.variants.length).toBe(2);
  });
  it("rejects garbage hashes", () => {
    expect(parseShareLink("")).toBeNull();
    expect(parseShareLink("#s=!!!")).toBeNull();
    expect(parseShareLink("#nope")).toBeNull();
  });
});
