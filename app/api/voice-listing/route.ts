import { NextRequest, NextResponse } from "next/server";
import { cleanProductShot, listingFromText } from "@/lib/meta";
import { extractItems, extractStudioImage, extractText } from "@/lib/extract";
import { normalizeProducts } from "@/lib/product";

// POST { transcript, country, currency, imageUrl? } -> used by voice flow after transcription (and direct text fallback).
// imageUrl = optional REAL seller photo — leads the gallery for buyer trust.
export async function POST(req: NextRequest) {
  try {
    const { transcript, country = "EG", currency = "EGP", imageUrl } = await req.json();
    if (!transcript || typeof transcript !== "string" || !transcript.trim()) return NextResponse.json({ error: "transcript required" }, { status: 400 });
    const realImage = typeof imageUrl === "string" && imageUrl ? imageUrl : undefined;
    const t1 = Date.now();
    const listing = await listingFromText(transcript, country, currency);
    const sparkMs = Date.now() - t1;
    const text = extractText(listing);
    const raws = extractItems(listing, text);
    const t2 = Date.now();
    const studio = await cleanProductShot(String(raws[0]?.name_en ?? transcript.slice(0, 80))).catch((e) => ({ error: String(e) }));
    const studioMs = Date.now() - t2;
    const studioImage = extractStudioImage(studio);
    const products = normalizeProducts(raws, { source: { type: "voice", transcript }, country, currency, studioImage: studioImage ?? undefined, realImage });
    if (studioImage && products[0]) products[0].images = [studioImage, ...products[0].images.filter((i) => i !== studioImage)];
    return NextResponse.json({
      ok: true, live: Boolean(process.env.MODEL_API_KEY), transcript, products, items: products, studioImage, analysisText: text,
      trace: [
        { model: "muse-voice-transcribe-1.0", role: "صوت → نص (من التسجيل أو النص المكتوب)", ms: 0, live: Boolean(process.env.MODEL_API_KEY), status: "ok" },
        { model: "muse-spark-1.3", role: "إعلان كامل باسم فعلي وأسعار ومتغيرات", ms: sparkMs, live: Boolean(process.env.MODEL_API_KEY), status: products.length ? "ok" : "empty" },
        { model: "muse-image-1.0", role: "صورة ستوديو مولدة للمنتج", ms: studioMs, live: Boolean(process.env.MODEL_API_KEY), status: studioImage ? "ok" : "skipped" },
      ],
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
