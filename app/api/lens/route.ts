import { NextRequest, NextResponse } from "next/server";
import { analyzeWithSpark, cleanProductShot, segmentImage } from "@/lib/meta";
import { annotateBoxes, cropRegions, sourceBytes } from "@/lib/crop";
import { boxIdOf, buildGrounding, extractDetections, extractItems, extractStudioImage, extractText, mergeDetections } from "@/lib/extract";
import { normalizeProducts } from "@/lib/product";

// Pipeline: SAM 3.1 -> Muse Spark (full listing) -> Muse Image (studio for first item)
// POST { imageUrl, prompt, lang, country, currency }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawUrl = body.imageUrl as string;
    const { prompt = "market goods", lang = "ar-EG", country = "EG", currency = "EGP", focus = "" } = body;
    const focusStr = typeof focus === "string" ? focus : "";
    if (!rawUrl || typeof rawUrl !== "string") return NextResponse.json({ error: "imageUrl required" }, { status: 400 });
    // Local brand assets only resolve for Meta when the deployment origin is public.
    const imageUrl = rawUrl.startsWith("/") ? `${req.nextUrl.origin}${rawUrl}` : rawUrl;
    const host = (() => { try { return new URL(imageUrl).hostname; } catch { return ""; } })();
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
      return NextResponse.json({
        ok: false,
        code: "LOCAL_URL",
        error: "هذه الصورة على جهازك المحلي (localhost) — نموذج Meta لا يستطيع الوصول إليها. ارفع الصورة من جهازك (زر الرفع يرسلها مباشرة) أو الصق رابطًا عامًا https. / This photo lives on localhost, which Meta's model cannot reach. Upload it from your device (the upload button sends it directly) or paste a public https link.",
      }, { status: 400 });
    }
    const live = Boolean(process.env.MODEL_API_KEY);
    const timed = async <T,>(fn: () => Promise<T>) => { const t0 = Date.now(); const v = await fn(); return { v, ms: Date.now() - t0 }; };
    // Sequential on purpose: SAM findings ground Spark, so a photo of hazelnuts
    // can never be described as a vase. SAM first, then Spark on its labels.
    const samPrompt = focusStr || prompt;
    const segR = await timed(() => segmentImage(imageUrl, samPrompt)).catch((e) => ({ v: { error: String(e) }, ms: 0 }));
    const seg = segR.v;
    let samDetections = extractDetections(seg, []);
    let samMs = segR.ms;
    // Thin coverage? One cheap second pass with a different focus, merged by
    // IoU so nothing double-counts. Only runs when the first pass is sparse.
    if (samDetections.length > 0 && samDetections.length < 4) {
      try {
        const segR2 = await timed(() => segmentImage(imageUrl, "small piles groups at edges"));
        samMs += segR2.ms;
        samDetections = mergeDetections(samDetections, extractDetections(segR2.v, []));
      } catch { /* single pass stands */ }
    }
    const detectionPart = samDetections.length
      ? samDetections.map((d, i) => `#${i + 1} at [${d.box.map((n) => n.toFixed(2)).join(",")}]`).join("; ")
      : extractText(seg).slice(0, 400);
    const grounding = buildGrounding(prompt, detectionPart, focusStr, samDetections.length);
    // Set-of-marks: number the SAM regions ON a copy of the photo so Spark
    // names each numbered region — names bind to boxes by construction.
    // The original photo (not the annotated copy) feeds galleries and crops.
    let sparkImage = imageUrl;
    const numbered = samDetections.length > 1;
    if (numbered) {
      try {
        const srcBytes = await sourceBytes(imageUrl);
        if (srcBytes) {
          const ann = await annotateBoxes(
            srcBytes,
            samDetections.map((d) => ({ x1: d.box[0], y1: d.box[1], x2: d.box[2], y2: d.box[3] }))
          );
          sparkImage = `data:image/jpeg;base64,${ann.toString("base64")}`;
        }
      } catch { /* original image stands */ }
    }
    const sparkR = await timed(() => analyzeWithSpark(
      sparkImage,
      lang,
      country,
      currency,
      grounding + (numbered ? "\nThe attached image has numbered markers 1.." + samDetections.length + " on the detected regions. Every item MUST include its boxId (the number nearest to it)." : "")
    ));
    let analysis = sparkR.v;
    let analysisText = extractText(analysis);
    let raws = [...extractItems(analysis, analysisText)].sort((a, b) => boxIdOf(a) - boxIdOf(b));
    let sparkMs = sparkR.ms;
    // Empty Spark response despite real SAM regions = transient model flake,
    // not proof the photo is empty. One retry only (cost control); if it is
    // still empty, the UI shows the honest no-result diagnosis instead.
    if (live && raws.length === 0 && samDetections.length > 0) {
      try {
        const retry = await timed(() => analyzeWithSpark(
          sparkImage, lang, country, currency,
          grounding + "\nPrevious attempt returned no items although regions were detected. Look again carefully and list what is visible."
        ));
        const rAnalysis = retry.v;
        const rText = extractText(rAnalysis);
        const rRaws = [...extractItems(rAnalysis, rText)].sort((a, b) => boxIdOf(a) - boxIdOf(b));
        sparkMs += retry.ms;
        if (rRaws.length > 0) { analysis = rAnalysis; analysisText = rText; raws = rRaws; }
      } catch { /* first (empty) attempt stands */ }
    }
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
    // Carry each listing's box number onto its product (map chips, crops, delete).
    products.forEach((p, i) => {
      const b = boxIdOf(raws[i] ?? {});
      if (Number.isFinite(b)) p.boxId = b;
    });
    const detections = extractDetections(seg, products.map((p) => p.name_en));
    // Real per-item crops: each SAM-boxed product leads with its own actual
    // region from the seller's photo (enhancement-only, never blocks results).
    try {
      const realBoxes = detections.filter((d) => d.source === "sam");
      if (realBoxes.length) {
        const srcBytes = await sourceBytes(imageUrl);
        if (srcBytes) {
          const crops = await cropRegions(srcBytes, realBoxes.map((d) => ({ x1: d.box[0], y1: d.box[1], x2: d.box[2], y2: d.box[3] })));
          realBoxes.forEach((d, i) => {
            const crop = crops[i];
            if (!crop) return;
            const pi = products.findIndex((p) => p.name_en.toLowerCase() === d.label.toLowerCase());
            const p = pi >= 0 ? products[pi] : products[i];
            if (!p || p.images.includes(crop)) return;
            // The shared studio shot depicts the hero item only — it must not
            // lead other products' galleries (that was the uniform-image bug).
            const rest = p.images.filter((img) => img !== studioImage && img !== crop);
            p.images = p === products[0] && studioImage ? [studioImage, crop, ...rest] : [crop, ...rest];
          });
        }
      }
    } catch { /* crops are enhancement-only */ }
    const trace = [
      { model: "sam-3.1", role: "Segmentation — عزل كل قطعة في الصورة", ms: samMs, live, status: detections.length ? "ok" : "empty" },
      { model: "muse-spark-1.3", role: "تعرّف + تسعير محلي + إعلان كامل", ms: sparkMs, live, status: products.length ? "ok" : "empty" },
      { model: "muse-image-1.0", role: "صورة ستوديو نظيفة للمنتج الأول", ms: studioR.ms, live, status: studioImage ? "ok" : "skipped" },
    ];

    return NextResponse.json({
      ok: true,
      live,
      focus: focusStr || null,
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
    const msg = String(e);
    if (msg.includes("media_url_not_fetchable") || msg.includes("robots")) {
      return NextResponse.json({
        ok: false,
        code: "UNFETCHABLE",
        error: "تعذّر على نموذج Meta جلب هذه الصورة (رابط محمي أو غير عام). جرّب رفع الصورة من جهازك — زر الرفع يرسلها مباشرة — أو استخدم رابطًا عامًا آخر. / Meta could not fetch this image (protected or non-public URL). Try uploading the photo from your device instead, or use another public link.",
      }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
