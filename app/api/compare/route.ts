import { NextRequest, NextResponse } from "next/server";
import { fetchPageMeta, hasKey, ldToRawItems, sparkText } from "@/lib/meta";
import { extractItems, extractText } from "@/lib/extract";
import { FULL_PRODUCT_JSON_HINT, normalizeProducts } from "@/lib/product";

// POST { productUrl, country, currency }
// 1) fetch real page (og + JSON-LD) 2) Spark + web_search: full listing + comparison + alternatives as products
export async function POST(req: NextRequest) {
  try {
    const { productUrl, country = "EG", currency = "EGP", store = [] } = await req.json();
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

    // The buyer's own store (saved + current results, brief only — no heavy
    // images) so Spark checks it FIRST; web search is the fallback with MANY
    // alternatives instead of 3.
    type Brief = { id?: string; name_en?: string; name_ar?: string; price?: number; currency?: string; category?: string; image?: string };
    const briefs: Brief[] = (Array.isArray(store) ? store : []).slice(0, 24).map((s) => ({
      id: String((s as Brief)?.id ?? ""),
      name_en: String((s as Brief)?.name_en ?? ""),
      name_ar: String((s as Brief)?.name_ar ?? ""),
      price: Number((s as Brief)?.price ?? 0),
      currency: String((s as Brief)?.currency ?? currency),
      category: String((s as Brief)?.category ?? ""),
      image: String((s as Brief)?.image ?? ""),
    })).filter((b) => b.id && b.name_en);

    if (!hasKey()) {
      const products = normalizeProducts([baseRaw], { source: { type: "url", url: productUrl }, country, currency, fallbackImage: (meta as { image?: string }).image });
      return NextResponse.json({ ok: true, live: false, meta, products, items: products, comparison: "Demo mode on this deployment: MODEL_API_KEY is not set in the host environment, so live Muse Spark + web-search comparison is off. Set it in the deployment variables to enable. (Locally the key is already in .env.)", alternatives: [] });
    }

    const resp = await sparkText(
      `You are Souk Lens comparison AI. Buyer country: ${country}, currency: ${currency}. Product page: ${productUrl} — title: "${String(baseRaw.name_en)}", desc: "${String(baseRaw.description_ar ?? "").slice(0, 400)}", sourcePrice: ${String(baseRaw.price ?? "unknown")}.
THE BUYER'S OWN STORE (check FIRST — a match here beats any online shop):
${briefs.length ? briefs.map((s, i) => `${i + 1}. [id:${s.id}] ${s.name_en} | ${s.name_ar} | ${s.price} ${s.currency} | ${s.category}`).join("\n") : "(store empty — go straight to web search)"}
Return valid JSON only: {"items":[ONE full listing for THIS product with fair ${country} price], "storeMatchIds":[ids from the store list above that are the SAME kind of product — [] when none], "storeReasons":{"<id>":"one Arabic line why it fits or falls short"}, "alternatives":[ONLY when storeMatchIds is empty: up to 8 full listings for similar products REALLY sold online right now — use web_search and prefer MANY different stores. Every alternative MUST carry: the real shop name in "sellerName", the real product page link in "url", the price converted to ${currency}, and one Arabic reason line at the very start of "description_ar" beginning with "السبب: ". Never invent shops, prices or links — only listings web_search actually returned], "verdict_ar":"سطر واحد: اشترِ من متجرك (واذكر اسمه) إن وُجد مثيل، وإلا رشّح أفضل بديل أونلاين باسمه", "comparison_ar":"مقارنة مختصرة بالعربي: مميزات وعيوب وسعر — واذكر بدائل المتجر أولًا إن وُجدت"}
Every listing must fill ALL fields. ${FULL_PRODUCT_JSON_HINT}`,
      { search: true, country }
    );
    const text = extractText(resp);
    let parsed: { items?: Record<string, unknown>[]; alternatives?: Record<string, unknown>[]; storeMatchIds?: string[]; storeReasons?: Record<string, string>; verdict_ar?: string; comparison_ar?: string } = {};
    try {
      const clean = text.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean.slice(clean.indexOf("{"), clean.lastIndexOf("}") + 1));
    } catch { /* fall back below */ }
    const mainRaws = (parsed.items?.length ? parsed.items : [baseRaw]).map((r) => ({ ...baseRaw, ...r, image: r.image || baseRaw.image }));
    // Store first: matched own-store items become alternatives with their real
    // data + the model's Arabic reason. Otherwise up to 8 REAL web listings,
    // each carrying its shop name and page link (never invented).
    const validStoreIds = (parsed.storeMatchIds ?? []).filter((id) => briefs.some((b) => b.id === id));
    let altRaws: Record<string, unknown>[];
    if (validStoreIds.length) {
      const reasons = parsed.storeReasons ?? {};
      altRaws = validStoreIds.map((id) => {
        const b = briefs.find((x) => x.id === id) as Brief;
        const reason = reasons[id] ? `من متجرك: ${reasons[id]}` : "من متجرك: صنف مطابق لما تبحث عنه.";
        return {
          name_en: b.name_en, name_ar: b.name_ar, price: b.price, currency: b.currency,
          category: b.category, image: b.image, sellerName: "متجرك (Your store)",
          description_ar: `${reason} ${b.name_ar} — بسعر ${b.price} ${b.currency}.`,
        };
      });
    } else {
      altRaws = ((parsed.alternatives ?? extractItems(resp, text).slice(1)) as Record<string, unknown>[]).slice(0, 8);
    }
    const products = normalizeProducts(mainRaws, { source: { type: "url", url: productUrl }, country, currency, fallbackImage: (meta as { image?: string }).image });
    const alternatives = normalizeProducts(altRaws as Record<string, unknown>[], { source: { type: "url", url: productUrl, label: "alternative" }, country, currency });
    alternatives.forEach((p, i) => {
      const link = (altRaws[i] as Record<string, unknown>)?.url ?? (altRaws[i] as Record<string, unknown>)?.link ?? (altRaws[i] as Record<string, unknown>)?.storeUrl;
      if (typeof link === "string" && link) p.source = { ...p.source, url: link };
    });
    // Real shop photos, not placeholders: fetch each alternative's own page
    // and lead its gallery with that page's og:image shots (parallel, each
    // fails independently). Whatever can't be fetched keeps the existing
    // image — a photo is never invented.
    await Promise.all(alternatives.map(async (p) => {
      const link = (p.source as { url?: string })?.url;
      if (!link || !/^https?:\/\//.test(link)) return;
      try {
        const m = await fetchPageMeta(link);
        const shots = [m.image, ...(m.images ?? [])].filter((u): u is string => typeof u === "string" && !!u && !p.images.includes(u)).slice(0, 3);
        if (shots.length) p.images = [...shots, ...p.images];
      } catch { /* keep existing image */ }
    }));
    return NextResponse.json({
      ok: true, live: true, meta, products, items: products, alternatives,
      comparison: parsed.comparison_ar ?? text, verdict: parsed.verdict_ar ?? "", analysisText: text, raw: resp,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
