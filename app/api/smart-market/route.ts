import { NextRequest, NextResponse } from "next/server";
import { hasKey, sparkText } from "@/lib/meta";
import { extractText } from "@/lib/extract";
import { PRESETS, smartSearch, type Priority } from "@/lib/smart-market";

// POST { query, presetId, country, currency, budget, priority }
// Local deterministic scorer over the store catalog + optional Muse Spark intent parse (live proof).
export async function POST(req: NextRequest) {
  try {
    const { query = "", presetId, country = "EG", currency = "EGP", budget, priority = "balanced", savedProducts } = await req.json();
    let detectedPreset = presetId as string | undefined;
    let intentNote = "";

    if (!detectedPreset && hasKey() && typeof query === "string" && query.trim().length > 3) {
      try {
        const resp = await sparkText(
          `Classify this shopping request into ONE preset id from: ${PRESETS.map((p) => p.id).join(", ")}. Request: "${query}". Return JSON only: {"presetId":"...","need_ar":"one line in Arabic of what the buyer needs"}`
        );
        const text = extractText(resp);
        const clean = text.replace(/```json|```/g, "").trim();
        const obj = JSON.parse(clean.slice(clean.indexOf("{"), clean.lastIndexOf("}") + 1)) as { presetId?: string; need_ar?: string };
        if (obj.presetId && PRESETS.some((p) => p.id === obj.presetId)) { detectedPreset = obj.presetId; intentNote = obj.need_ar ?? ""; }
      } catch { /* local detector below is authoritative fallback */ }
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
      intent: { presetId: result.preset.id, title_ar: result.preset.title_ar, title_en: result.preset.title_en, note: intentNote || result.preset.desc_ar },
      bundles: result.bundles,
      alternativesBySlot: result.alternativesBySlot,
      catalogSize: result.catalogSize,
      savedCount: result.savedCount, demoCount: result.demoCount, savedIds: result.savedIds,
      presets: PRESETS.map((p) => ({ id: p.id, emoji: p.emoji, title_ar: p.title_ar, title_en: p.title_en, desc_ar: p.desc_ar, desc_en: p.desc_en })),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
