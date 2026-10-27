import { describe, expect, it } from "vitest";
import { productEconomics, summarize } from "@/lib/analytics";
import type { Product } from "@/lib/product";

const p = (over: Partial<Product> = {}) =>
  ({
    id: "p1",
    name_ar: "",
    name_en: "Test",
    price: 100,
    costPrice: 60,
    currency: "EGP",
    stock: 10,
    soldUnits: 4,
    variants: [],
    images: [],
    specs: {},
    features: [],
    ...over,
  } as unknown as Product);

describe("actual-only economics", () => {
  it("profits come only from real entries", () => {
    const e = productEconomics(p());
    expect(e.sold).toBe(4);
    expect(e.revenue).toBe(400);
    expect(e.totalCost).toBe(240);
    expect(e.profit).toBe(160);
  });
  it("stays zero with no entries", () => {
    const e = productEconomics(p({ soldUnits: 0 }));
    expect(e.revenue).toBe(0);
    expect(e.profit).toBe(0);
  });
  it("summarizes honestly across products", () => {
    const s = summarize([p(), p({ soldUnits: 0, price: 50, costPrice: 20 })]);
    expect(s.unitsSold).toBe(4);
    expect(s.profit).toBe(160);
  });
});
