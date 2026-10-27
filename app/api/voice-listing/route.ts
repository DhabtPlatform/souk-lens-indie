import { NextRequest, NextResponse } from "next/server";
import { cleanProductShot, listingFromText } from "@/lib/meta";
import { extractItems, extractStudioImage, extractText } from "@/lib/extract";
import { normalizeProducts } from "@/lib/product";

// POST { transcript, country, currency } -> used by voice flow after transcription (and direct text fallback)
export async function POST(req: NextRequest) {
  try {
    const { transcript, country = "EG", currency = "EGP" } = await req.json();
    if (!transcript || typeof transcript !== "string" || !transcript.trim()) return NextResponse.json({ error: "transcript required" }, { status: 400 });
    const listing = await listingFromText(transcript, country, currency);
    const text = extractText(listing);
    const raws = extractItems(listing, text);
    const studio = await cleanProductShot(String(raws[0]?.name_en ?? transcript.slice(0, 80))).catch((e) => ({ error: String(e) }));
    const studioImage = extractStudioImage(studio);
    const products = normalizeProducts(raws, { source: { type: "voice", transcript }, country, currency, studioImage: studioImage ?? undefined });
    if (studioImage && products[0]) products[0].images = [studioImage, ...products[0].images.filter((i) => i !== studioImage)];
    return NextResponse.json({ ok: true, live: Boolean(process.env.MODEL_API_KEY), transcript, products, items: products, studioImage, analysisText: text });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
