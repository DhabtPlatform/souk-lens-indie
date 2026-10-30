import { NextRequest, NextResponse } from "next/server";
import { fetchPageMeta, hasKey, sparkText } from "@/lib/meta";
import { extractItems, extractText } from "@/lib/extract";
import { FULL_PRODUCT_JSON_HINT, normalizeProducts } from "@/lib/product";
import { PRESETS, buildInvoice, smartSearch, type Priority } from "@/lib/smart-market";

// POST { query, presetId, country, currency, budget, priority, scope }
// scope "store" (default): the honest hybrid — your REAL saved products plus a
// LABELED sample catalog (experimental until a real marketplace DB exists).
// scope "web": live web_search over real online stores — external items can be
// saved + invoiced + downloaded, never checked out here.
export async function POST(req: NextRequest) {
  try {
    const { query = "", presetId, country = "EG", currency = "EGP", budget, priority = "balanced", savedProducts, scope = "store" } = await req.json();
    let detectedPreset = presetId as string | undefined;
    let intentNote = "";
    const t0 = Date.now();
    let intentMs = 0;

    if (!detectedPreset && hasKey() && typeof query === "string" && query.trim().length > 3) {
      try {
        const ti = Date.now();
        const resp = await sparkText(
          `Classify this shopping request into ONE preset id from: ${PRESETS.map((p) => p.id).join(", ")}. Request: "${query}". Return JSON only: {"presetId":"...","need_ar":"one line in Arabic of what the buyer needs"}`
        );
        const text = extractText(resp);
        const clean = text.replace(/```json|```/g, "").trim();
        const obj = JSON.parse(clean.slice(clean.indexOf("{"), clean.lastIndexOf("}") + 1)) as { presetId?: string; need_ar?: string };
        if (obj.presetId && PRESETS.some((p) => p.id === obj.presetId)) { detectedPreset = obj.presetId; intentNote = obj.need_ar ?? ""; }
        intentMs = Date.now() - ti;
      } catch { /* local detector below is authoritative fallback */ }
    }

    const tb = Date.now();

    // ---- Web scope: real online stores, no checkout here ----
    if (scope === "web") {
      if (!hasKey()) {
        return NextResponse.json({
          ok: false,
          error: "البحث في المتاجر الخارجية يحتاج المفتاح الحي (MODEL_API_KEY) — بدونه اعمل داخل متجرك. / External store search needs the live key — use in-store scope without it.",
        }, { status: 400 });
      }
      const need = String(query ?? "").trim() || PRESETS.find((p) => p.id === presetId)?.title_ar || "تسوق";
      const t1 = Date.now();
      const resp = await sparkText(
        `You are a shopping agent. Buyer need: "${need}" — country ${country}, prices in ${currency}.
Use web_search and return ONE ranked list of up to 8 REAL products sold online RIGHT NOW that together cover this need.
Return JSON only: {"items":[up to 8 full listings — every one MUST carry: the real shop name in "sellerName", the real product page link in "url", the price converted to ${currency}, and one Arabic reason line at the very start of "description_ar" beginning with "السبب: "], "note_ar":"one Arabic line describing the list"}
Never invent shops, prices or links — only listings web_search actually returned. ${FULL_PRODUCT_JSON_HINT}
CRITICAL: the hint above does not list them, so ADD these two REQUIRED keys to EVERY item or drop the item: "sellerName" (the real shop name, never empty, never "online store") and "url" (the real product page link starting with http, never empty, never "#"). An item without both keys is invalid — return fewer valid items rather than items without them.`,
        { search: true, country }
      );
      const wtext = extractText(resp);
      let wparsed: { items?: Record<string, unknown>[]; note_ar?: string } = {};
      try {
        const clean = wtext.replace(/```json|```/g, "").trim();
        wparsed = JSON.parse(clean.slice(clean.indexOf("{"), clean.lastIndexOf("}") + 1));
      } catch { /* items fallback below */ }
      const wRaws = ((wparsed.items?.length ? wparsed.items : extractItems(resp, wtext)) as Record<string, unknown>[])
        // Only sourced listings survive: no real link + no real shop = dropped.
        .filter((r) => typeof r?.url === "string" && /^https?:\/\//.test(r.url as string) && typeof r?.sellerName === "string" && (r.sellerName as string).trim().length > 1)
        .slice(0, 8);
      if (!wRaws.length) {
        return NextResponse.json({
          ok: false,
          error: "البحث الخارجي لم يرجع روابط متاجر حقيقية هذه المرة — أعد المحاولة بصياغة أخرى، أو اعمل داخل متجرك. / Web search returned no sourced listings this time — retry with different wording, or use in-store scope.",
        }, { status: 502 });
      }
      const wProducts = normalizeProducts(wRaws, { source: { type: "url", label: "external" }, country, currency });
      wProducts.forEach((p, i) => {
        const link = (wRaws[i] as Record<string, unknown>)?.url ?? (wRaws[i] as Record<string, unknown>)?.link;
        if (typeof link === "string" && link) p.source = { ...p.source, url: link };
      });
      await Promise.all(wProducts.map(async (p) => {
        const link = (p.source as { url?: string })?.url;
        if (!link || !/^https?:\/\//.test(link)) return;
        try {
          const m = await fetchPageMeta(link);
          const shots = [m.image, ...(m.images ?? [])].filter((u): u is string => typeof u === "string" && !!u && !p.images.includes(u)).slice(0, 3);
          if (shots.length) p.images = [...shots, ...p.images];
        } catch { /* keep existing image */ }
      }));
      const webItems = wProducts.map((p, i) => ({ ...p, score: Math.max(60, 92 - i * 3), qty: 1 }));
      const webBundle = {
        id: "web", title_ar: "قائمة الويب — متاجر أخرى", title_en: "Web list — other stores",
        desc_ar: "منتجات حقيقية من متاجر أونلاين — تُحفظ وتُفوتر وتُنزّل، ولا تُدفع من هنا",
        strategy: "balanced" as Priority, items: webItems, ...buildInvoice(webItems),
      };
      return NextResponse.json({
        ok: true, live: true, scope: "web",
        trace: [
          { model: "muse-spark-1.3 + web_search", role: "قائمة ويب حقيقية بروابط متاجر", ms: Date.now() - t1, live: true },
          { model: "souk ranker (local)", role: "تجميع الفاتورة", ms: Date.now() - tb, live: false },
        ],
        intent: { presetId: "web", title_ar: need, title_en: need, note: wparsed.note_ar ?? "" },
        bundles: [webBundle], alternativesBySlot: {},
        catalogSize: webItems.length, savedCount: 0, demoCount: 0, sampleCount: 0, savedIds: [],
        presets: PRESETS.map((p) => ({ id: p.id, emoji: p.emoji, title_ar: p.title_ar, title_en: p.title_en, desc_ar: p.desc_ar, desc_en: p.desc_en })),
      });
    }

    const result = smartSearch({
      query: String(query ?? ""), presetId: detectedPreset,
      country, currency,
      budget: typeof budget === "number" && budget > 0 ? budget : undefined,
      priority: (["balanced", "price", "rating", "delivery", "trust"].includes(priority) ? priority : "balanced") as Priority,
      extraProducts: Array.isArray(savedProducts) ? savedProducts : undefined,
    });

    return NextResponse.json({
      ok: true,
      live: hasKey(),
      trace: [
        { model: "muse-spark-1.3", role: "فهم نية الشراء (حي مع المفتاح)", ms: intentMs, live: hasKey() },
        { model: "souk ranker (local)", role: "ترتيب: تقييم × خصم × توصيل × ثقة", ms: Date.now() - tb, live: false },
      ],
      intent: { presetId: result.preset.id, title_ar: result.preset.title_ar, title_en: result.preset.title_en, note: intentNote || result.preset.desc_ar },
      bundles: result.bundles,
      alternativesBySlot: result.alternativesBySlot,
      catalogSize: result.catalogSize,
      savedCount: result.savedCount, demoCount: result.demoCount, sampleCount: result.sampleCount, savedIds: result.savedIds,
      presets: PRESETS.map((p) => ({ id: p.id, emoji: p.emoji, title_ar: p.title_ar, title_en: p.title_en, desc_ar: p.desc_ar, desc_en: p.desc_en })),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
