import { NextRequest, NextResponse } from "next/server";
import { fetchPageMeta, hasKey, ldToRawItems, sparkText } from "@/lib/meta";
import { extractText } from "@/lib/extract";
import { FULL_PRODUCT_JSON_HINT, normalizeProducts } from "@/lib/product";

// POST { storeUrl, country, currency } -> migrate a whole store: real JSON-LD products first, Spark enrichment for the rest
export async function POST(req: NextRequest) {
  try {
    const { storeUrl, country = "EG", currency = "EGP" } = await req.json();
    if (!storeUrl || typeof storeUrl !== "string") return NextResponse.json({ error: "storeUrl required" }, { status: 400 });
    new URL(storeUrl);
    const meta = await fetchPageMeta(storeUrl).catch((e) => ({ ok: false, error: String(e), title: "", image: "", images: [] as string[], description: "", ldProducts: [] as Record<string, unknown>[] }));
    const ldRaws = ldToRawItems((meta as { ldProducts?: Record<string, unknown>[] }).ldProducts ?? []);

    if (ldRaws.length >= 2 && !hasKey()) {
      const products = normalizeProducts(ldRaws, { source: { type: "import", url: storeUrl }, country, currency });
      return NextResponse.json({ ok: true, live: false, source: "json-ld", meta, products, items: products });
    }
    if (!hasKey()) {
      const raws = ldRaws.length ? ldRaws : [
        { name_ar: "منتج مستورد 1", name_en: "Imported product 1", price: 500, currency, source: storeUrl },
        { name_ar: "منتج مستورد 2", name_en: "Imported product 2", price: 750, currency, source: storeUrl },
      ];
      const products = normalizeProducts(raws as Record<string, unknown>[], { source: { type: "import", url: storeUrl }, country, currency });
      return NextResponse.json({ ok: true, live: false, meta, products, items: products, note: "MOCK: ضع MODEL_API_KEY للاستيراد الذكي الكامل." });
    }

    const seed = ldRaws.length ? `Real products found in page JSON-LD (use these first, enrich missing fields): ${JSON.stringify(ldRaws).slice(0, 2500)}` : "No JSON-LD products found — infer representative catalog from store title/description and images.";
    const resp = await sparkText(
      `Store migration task. Source store: ${storeUrl}. Title: "${(meta as { title?: string }).title ?? ""}". Description: "${(meta as { description?: string }).description ?? ""}". Buyer country: ${country}, currency: ${currency}. ${seed}
Return valid JSON only: migrate up to 10 products. Every product must be a COMPLETE listing ready to publish in the new store: all fields, variants with prices, specs, features, stock, SKU, SEO, image URL if known from source. ${FULL_PRODUCT_JSON_HINT}`
    );
    const text = extractText(resp);
    let raws: Record<string, unknown>[] = ldRaws;
    try {
      const clean = text.replace(/```json|```/g, "").trim();
      const obj = JSON.parse(clean.slice(clean.indexOf("{"), clean.lastIndexOf("}") + 1)) as { items?: Record<string, unknown>[] };
      if (Array.isArray(obj.items) && obj.items.length) raws = obj.items;
    } catch { /* keep ld */ }
    const products = normalizeProducts(raws, { source: { type: "import", url: storeUrl }, country, currency, fallbackImage: (meta as { image?: string }).image });
    return NextResponse.json({ ok: true, live: true, source: ldRaws.length ? "json-ld+spark" : "spark", meta, products, items: products, analysisText: text, raw: resp });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
