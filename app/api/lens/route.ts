import { NextRequest, NextResponse } from "next/server";
import { analyzeWithSpark, cleanProductShot, segmentImage } from "@/lib/meta";
import { extractDetections, extractItems, extractStudioImage, extractText } from "@/lib/extract";
import { normalizeProducts } from "@/lib/product";

// Pipeline: SAM 3.1 -> Muse Spark (full listing) -> Muse Image (studio for first item)
// POST { imageUrl, prompt, lang, country, currency }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUrl = body.imageUrl as string;
    const { prompt = "market goods", lang = "ar-EG", country = "EG", currency = "EGP" } = body;
    if (!rawUrl || typeof rawUrl !== "string") return NextResponse.json({ error: "imageUrl required" }, { status: 400 });
    // Local brand assets only resolve for Meta when the deployment origin is public.
    const imageUrl = rawUrl.startsWith("/") ? `${req.nextUrl.origin}${rawUrl}` : rawUrl;
    const live = Boolean(process.env.MODEL_API_KEY);
    const timed = async <T,>(fn: () => Promise<T>) => { const t0 = Date.now(); const v = await fn(); return { v, ms: Date.now() - t0 }; };
    // Sequential on purpose: SAM findings ground Spark, so a photo of hazelnuts
    // can never be described as a vase. SAM first, then Spark on its labels.
    const segR = await timed(() => segmentImage(imageUrl, prompt)).catch((e) => ({ v: { error: String(e) }, ms: 0 }));
    const seg = segR.v;
    const samDetections = extractDetections(seg, []);
    const grounding = samDetections.length
      ? `${prompt}: ${samDetections.map((d, i) => `#${i + 1} at [${d.box.map((n) => n.toFixed(2)).join(",")}]`).join("; ")}`
      : `${prompt} · ${extractText(seg).slice(0, 400)}`;
    const sparkR = await timed(() => analyzeWithSpark(imageUrl, lang, country, currency, grounding));
    const analysis = sparkR.v;
    const analysisText = extractText(analysis);
    const raws = extractItems(analysis, analysisText);
    // Studio image for the hero product only (cost control)
    const firstName = String(raws[0]?.name_en ?? prompt);
    const studioR = await timed(() => cleanProductShot(firstName)).catch((e) => ({ v: { error: String(e) }, ms: 0 }));
    const studioImage = extractStudioImage(studioR.v);
    const products = normalizeProducts(raws, {
      source: { type: "image", label: prompt },
      country, currency,
      fallbackImage: imageUrl.startsWith("http") ? imageUrl : undefined,
      studioImage: studioImage ?? undefined,
    });
    if (studioImage && products[0] && !products[0].images.includes(studioImage)) products[0].images = [studioImage, ...products[0].images];
    const detections = extractDetections(seg, products.map((p) => p.name_en));
    const trace = [
      { model: "sam-3.1", role: "Segmentation — عزل كل قطعة في الصورة", ms: segR.ms, live, status: detections.length ? "ok" : "empty" },
      { model: "muse-spark-1.3", role: "تعرّف + تسعير محلي + إعلان كامل", ms: sparkR.ms, live, status: products.length ? "ok" : "empty" },
      { model: "muse-image-1.0", role: "صورة ستوديو نظيفة للمنتج الأول", ms: studioR.ms, live, status: studioImage ? "ok" : "skipped" },
    ];

    return NextResponse.json({
      ok: true,
      live,
      models: { sam: "sam-3.1", spark: "muse-spark-1.3", image: "muse-image-1.0" },
      trace,
      detections,
      detectionSource: detections[0]?.source ?? "estimate",
      products,
      items: products, // backward compat
      analysisText,
      segText: extractText(seg).slice(0, 2000),
      segmentation: seg,
      studioImage,
      raw: { segmentation: seg, analysis, studio: studioR.v },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
