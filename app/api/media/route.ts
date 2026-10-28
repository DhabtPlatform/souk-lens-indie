import { NextRequest, NextResponse } from "next/server";
import { angleShot, cleanProductShot, hasKey, SPIN_ANGLES, variantShot } from "@/lib/meta";
import { extractStudioImage as extractImg } from "@/lib/extract";

// POST { productName, variants?: {id,label}[], angles?: boolean, studioFor?: { name: string } }
// Generates per-variant studio shots + 4 multi-angle shots (360°) via Muse Image,
// or ONE professional studio shot for a single product on demand (studioFor).
// Explicit user action only (each shot is a paid generation). Demo mode returns empty.
export async function POST(req: NextRequest) {
  try {
    const { productName = "", variants = [], angles = false, studioFor } = await req.json();
    if (!hasKey()) {
      return NextResponse.json({ ok: true, live: false, variantImages: {}, angleImages: [], studioImage: null, note: "Demo mode: set MODEL_API_KEY to generate studio shots." });
    }
    if (studioFor && typeof studioFor.name === "string" && studioFor.name.trim()) {
      try {
        const r = await cleanProductShot(studioFor.name.slice(0, 80));
        return NextResponse.json({ ok: true, live: true, studioImage: extractImg(r) });
      } catch (e) {
        return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
      }
    }
    const vList = (Array.isArray(variants) ? variants : []).slice(0, 6) as { id?: string; label?: string }[];
    const [vRes, aRes] = await Promise.all([
      Promise.all(vList.map(async (v) => {
        if (!v?.id || !v?.label) return null;
        try {
          const r = await variantShot(String(productName).slice(0, 80), String(v.label).slice(0, 80));
          return { id: v.id, url: extractImg(r) };
        } catch { return { id: v.id, url: null }; }
      })),
      angles ? Promise.all(SPIN_ANGLES.map(async (a) => {
        try {
          const r = await angleShot(String(productName).slice(0, 80), a);
          return extractImg(r);
        } catch { return null; }
      })) : Promise.resolve([]),
    ]);
    const variantImages: Record<string, string> = {};
    for (const v of vRes) if (v?.url) variantImages[v.id] = v.url;
    const angleImages = (aRes as (string | null)[]).filter((u): u is string => !!u);
    return NextResponse.json({ ok: true, live: true, variantImages, angleImages });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
