import { NextRequest, NextResponse } from "next/server";
import { fetchPageMeta, hasKey, ldToRawItems, sparkText } from "@/lib/meta";
import { extractItems, extractText } from "@/lib/extract";
import { FULL_PRODUCT_JSON_HINT, normalizeProducts } from "@/lib/product";

// POST { productUrl, country, currency }
// 1) fetch real page (og + JSON-LD) 2) Spark + web_search: full listing + comparison + alternatives as products
export async function POST(req: NextRequest) {
  try {
    const { productUrl, country = "EG", currency = "EGP" } = await req.json();
    if (!productUrl || typeof productUrl !== "string") return NextResponse.json({ error: "productUrl required" }, { status: 400 });
    new URL(productUrl);
    const meta = await fetchPageMeta(productUrl).catch((e) => ({ ok: false, error: String(e), title: "", image: "", description: "", ldProducts: [] as Record<string, unknown>[] }));
    const ldRaws = ldToRawItems((meta as { ldProducts?: Record<string, unknown>[] }).ldProducts ?? []);
    const baseRaw: Record<string, unknown> = ldRaws[0] ?? {
      name_en: (meta as { title?: string }).title || "External product",
      name_ar: (meta as { title?: string }).title || "منتج خارجي",
      description_ar: (meta as { description?: string }).description ?? "",
      image: (meta as { image?: string }).image ?? "",
      price: (meta as { price?: string }).price ? Number((meta as { price?: string }).price) : undefined,
    };

    if (!hasKey()) {
      const products = normalizeProducts([baseRaw], { source: { type: "url", url: productUrl }, country, currency, fallbackImage: (meta as { image?: string }).image });
      return NextResponse.json({ ok: true, live: false, meta, products, items: products, comparison: "Demo mode on this deployment: MODEL_API_KEY is not set in the host environment, so live Muse Spark + web-search comparison is off. Set it in the deployment variables to enable. (Locally the key is already in .env.)", alternatives: [] });
    }

    const resp = await sparkText(
      `You are Souk Lens comparison AI. Buyer country: ${country}, currency: ${currency}. Product page: ${productUrl} — title: "${String(baseRaw.name_en)}", desc: "${String(baseRaw.description_ar ?? "").slice(0, 400)}", sourcePrice: ${String(baseRaw.price ?? "unknown")}.
Return valid JSON only with TWO parts: {"items":[ONE full listing for THIS product with fair ${country} price], "alternatives":[3 full listings for better/cheaper alternatives available online, each with reason in description], "verdict_ar":"اشتري ده ولا بديل؟ سطر واحد", "comparison_ar":"مقارنة مختصورة بالعربي: مميزات وعيوب وسعر"}
Every listing must fill ALL fields. ${FULL_PRODUCT_JSON_HINT}`,
      { search: true, country }
    );
    const text = extractText(resp);
    let parsed: { items?: Record<string, unknown>[]; alternatives?: Record<string, unknown>[]; verdict_ar?: string; comparison_ar?: string } = {};
    try {
      const clean = text.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean.slice(clean.indexOf("{"), clean.lastIndexOf("}") + 1));
    } catch { /* fall back below */ }
    const mainRaws = (parsed.items?.length ? parsed.items : [baseRaw]).map((r) => ({ ...baseRaw, ...r, image: r.image || baseRaw.image }));
    const altRaws = parsed.alternatives ?? extractItems(resp, text).slice(1);
    const products = normalizeProducts(mainRaws, { source: { type: "url", url: productUrl }, country, currency, fallbackImage: (meta as { image?: string }).image });
    const alternatives = normalizeProducts(altRaws as Record<string, unknown>[], { source: { type: "url", url: productUrl, label: "alternative" }, country, currency });
    return NextResponse.json({
      ok: true, live: true, meta, products, items: products, alternatives,
      comparison: parsed.comparison_ar ?? text, verdict: parsed.verdict_ar ?? "", analysisText: text, raw: resp,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
