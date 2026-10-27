import { NextRequest, NextResponse } from "next/server";
import { cleanProductShot, listingFromText } from "@/lib/meta";
import { extractItems, extractStudioImage, extractText } from "@/lib/extract";
import { normalizeProducts } from "@/lib/product";

// POST { description, country, currency, imageUrl? } -> full listing + studio image.
// imageUrl = optional REAL seller photo (URL or upload) — leads the gallery for buyer trust.
export async function POST(req: NextRequest) {
  try {
    const { description, country = "EG", currency = "EGP", imageUrl } = await req.json();
    if (!description || typeof description !== "string") return NextResponse.json({ error: "description required" }, { status: 400 });
    const realImage = typeof imageUrl === "string" && imageUrl ? imageUrl : undefined;
    const listing = await listingFromText(description, country, currency);
    const text = extractText(listing);
    const raws = extractItems(listing, text);
    const studio = await cleanProductShot(String(raws[0]?.name_en ?? description.slice(0, 80))).catch((e) => ({ error: String(e) }));
    const studioImage = extractStudioImage(studio);
    const products = normalizeProducts(raws, { source: { type: "text", label: description.slice(0, 80) }, country, currency, studioImage: studioImage ?? undefined, realImage });
    if (studioImage && products[0] && !products[0].images.includes(studioImage)) products[0].images = [studioImage, ...products[0].images];
    return NextResponse.json({ ok: true, live: Boolean(process.env.MODEL_API_KEY), products, items: products, analysisText: text, studioImage, raw: { listing, studio } });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
