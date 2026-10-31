import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { analyzeWithSpark, cleanProductShot, segmentImage } from "@/lib/meta";
import { isRateLimited, maskIp } from "@/lib/rate-limit";
import { annotateBoxes, cropRegions, cropToDataUrl, sourceBytes } from "@/lib/crop";
import { boxIdOf, buildGrounding, coverageRatio, ensureCoverage, extractDetections, extractItems, extractStudioImage, extractText, mergeDetections, mergeSameName, remapBox, sortReadingOrder, subdivideRegion } from "@/lib/extract";
import { normalizeProducts } from "@/lib/product";

// Pipeline: SAM 3.1 -> Muse Spark (full listing) -> Muse Image (studio for first item)
// POST { imageUrl, prompt, lang, country, currency }
// Paid-endpoint guard: generous per-IP sliding window (30 runs / 10 min).
// Bots and scanners burn credits one full pipeline per hit — this stops the
// hammering while a human judge (a few runs, minutes apart) never notices it.
// 429 answers carry Retry-After + X-RateLimit headers and a bilingual message.
// Every call is logged (IP + agent + counts) so the owner can see WHO spends
// in Vercel → Logs; the same ring buffer feeds the tiny owner-only footer dot.
const LENS_HITS = new Map<string, number[]>();
type LensVisit = {
  t: string; ip: string; country: string; ua: string; action: string;
  det: number; prod: number; sam: number; spark: number; img: number; live: boolean;
};
const LENS_VISITS: LensVisit[] = [];
function rememberVisit(v: LensVisit) {
  LENS_VISITS.unshift(v);
  if (LENS_VISITS.length > 100) LENS_VISITS.pop();
}
export async function GET() {
  return NextResponse.json({ ok: true, visits: LENS_VISITS.slice(0, 100) });
}
export async function POST(req: NextRequest) {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown";
    const ua = req.headers.get("user-agent") ?? "";
    const geo = (req.headers.get("x-vercel-ip-country") ?? "").toUpperCase() || "••";    const bucket = ip === "unknown" ? ua.slice(0, 60) || "unknown" : ip;
    if (isRateLimited(LENS_HITS, bucket, Date.now(), 30, 10 * 60 * 1000)) {
      console.log(`[lens-blocked] ip=${ip} ua=${ua.slice(0, 90)}`);
      rememberVisit({ t: new Date().toISOString(), ip: maskIp(ip), country: geo, ua: ua.slice(0, 80), action: "blocked", det: 0, prod: 0, sam: 0, spark: 0, img: 0, live: false });
      return NextResponse.json({
        ok: false,
        code: "RATE_LIMITED",
        error: "طلبات كثيرة جدًا من نفس المصدر — انتظر دقائق ثم أعد المحاولة. / Too many requests from this source — wait a few minutes and retry.",
      }, { status: 429, headers: { "Retry-After": "120", "X-RateLimit-Limit": "30", "X-RateLimit-Window": "10m" } });
    }
    const body = await req.json();
    const rawUrl = body.imageUrl as string;
    const { prompt = "market goods", lang = "ar-EG", country = "EG", currency = "EGP", focus = "" } = body;
    console.log(`[lens] ip=${ip} ua=${ua.slice(0, 90)} img=${typeof rawUrl === "string" && rawUrl.startsWith("data:") ? "data-uri" : String(rawUrl).slice(0, 80)}`);
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
    let samCalls = 1, sparkCalls = 1;
    // Orientation lock BEFORE Meta ever sees the photo: uploads are usually
    // canvas-normalized client-side, but ANY path that still carries an EXIF
    // rotation flag (http(s) links, pasted originals, un-normalized uploads)
    // would otherwise make SAM segment raw-buffer space while the seller sees
    // it rotated — the root cause of the portrait-vs-landscape gap. If the flag
    // is set, send pre-rotated pixels instead of the URL. Galleries keep the
    // original URL (browsers display it correctly).
    let metaImage = imageUrl;
    try {
      const b = await sourceBytes(imageUrl);
      if (b) {
        const md = await sharp(b).metadata();
        if ((md.orientation ?? 1) > 1) {
          metaImage = `data:image/jpeg;base64,${(await sharp(b).rotate().jpeg({ quality: 88 }).toBuffer()).toString("base64")}`;
        }
      }
    } catch { /* original stands */ }
    // Sequential on purpose: SAM findings ground Spark, so a photo of hazelnuts
    // can never be described as a vase. SAM first, then Spark on its labels.
    const samPrompt = focusStr || prompt;
    const segR = await timed(() => segmentImage(metaImage, samPrompt)).catch((e) => ({ v: { error: String(e) }, ms: 0 }));
    const seg = segR.v;
    let samDetections = extractDetections(seg, []);
    let samMs = segR.ms;
    // Thin coverage? One cheap second pass with a different focus, merged by
    // IoU so nothing double-counts. Runs when the first pass is sparse OR when
    // its boxes cover only a small fraction of the frame (a few salient items
    // on a big table means whole piles were likely missed — locking Spark to
    // those boxes would blind it to everything else).
    if (samDetections.length > 0 && (samDetections.length < 4 || coverageRatio(samDetections) < 0.35)) {
      try {
        const segR2 = await timed(() => segmentImage(metaImage, "scan the ENTIRE photo edge to edge for ANY sellable piles missed so far, especially matte textured ones: leafy greens, dark vegetables, roots"));
        samMs += segR2.ms; samCalls++;
        samDetections = mergeDetections(samDetections, extractDetections(segR2.v, []));
      } catch { /* single pass stands */ }
    }
    // Zero SAM regions (dense racks, overlapping garments)? One retry with an
    // item-separating focus, then an honest estimated 3×2 grid over the frame
    // so every garment still gets its own numbered region — never one
    // "collection" listing for a multi-item photo. Grid cells stay labeled
    // estimate; the single-object guard collapses them when Spark says the
    // cells show one thing.
    let gridFallback = false;
    if (samDetections.length === 0) {
      try {
        const segR0 = await timed(() => segmentImage(metaImage, "each individual item separately"));
        samMs += segR0.ms; samCalls++;
        samDetections = mergeDetections(samDetections, extractDetections(segR0.v, []));
      } catch { /* grid fallback below */ }
      if (samDetections.length === 0) {
        samDetections = subdivideRegion(
          { label: "whole scene", box: [0.02, 0.02, 0.98, 0.98], source: "estimate" as const }, 3, 2
        );
        samDetections.forEach((d, i) => { d.label = `Detected item ${i + 1}`; });
        gridFallback = samDetections.length > 1;
      }
    }
    // User discovery, now automated: big empty margins around the items starve
    // SAM (cropping them away manually fixed a real field photo). When regions
    // cluster in a small part of the frame, zoom to their union (+padding)
    // and re-segment the crop, mapping boxes back to photo space. Costs one
    // extra SAM call only when coverage is thin.
    if (samDetections.length > 0 && coverageRatio(samDetections) < 0.35) {
      try {
        const pad = 0.07;
        const ux1 = Math.max(0, Math.min(...samDetections.map((d) => d.box[0])) - pad);
        const uy1 = Math.max(0, Math.min(...samDetections.map((d) => d.box[1])) - pad);
        const ux2 = Math.min(1, Math.max(...samDetections.map((d) => d.box[2])) + pad);
        const uy2 = Math.min(1, Math.max(...samDetections.map((d) => d.box[3])) + pad);
        const ua = (ux2 - ux1) * (uy2 - uy1);
        if (ua > 0.05 && ua < 0.7) {
          const sBytes = await sourceBytes(metaImage);
          if (sBytes) {
            const region = { x1: ux1, y1: uy1, x2: ux2, y2: uy2 };
            const cropUrl = await cropToDataUrl(sBytes, region);
            if (cropUrl) {
              const segRz = await timed(() => segmentImage(cropUrl, samPrompt));
              samMs += segRz.ms; samCalls++;
              const zoomed = extractDetections(segRz.v, []).map((d) => ({ ...d, box: remapBox(d.box, region) }));
              samDetections = mergeDetections(samDetections, zoomed);
            }
          }
        }
      } catch { /* wider view stands */ }
    }
    // Still thin after the zoom? Explore the LARGEST uncovered areas: grid
    // the frame, group connected cells no box touches, and segment up to two
    // of those crops (herb piles SAM never saw the first time). Last resort
    // before Spark — each crop costs one SAM call, capped at two.
    if (samDetections.length > 0 && coverageRatio(samDetections) < 0.35) {
      try {
        const touched = (cx: number, cy: number) =>
          samDetections.some((d) => cx > d.box[0] - 0.03 && cx < d.box[2] + 0.03 && cy > d.box[1] - 0.03 && cy < d.box[3] + 0.03);
        const N = 3, open: boolean[] = [];
        for (let r = 0; r < N; r++)
          for (let c = 0; c < N; c++)
            open.push(!touched((c + 0.5) / N, (r + 0.5) / N));
        const seen = new Set<number>();
        const comps: { cells: number[] }[] = [];
        for (let i = 0; i < N * N; i++) {
          if (!open[i] || seen.has(i)) continue;
          const comp: number[] = [];
          const stack = [i];
          seen.add(i);
          while (stack.length) {
            const cur = stack.pop() as number;
            comp.push(cur);
            const r = Math.floor(cur / N), c = cur % N;
            for (const [nr, nc] of [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]) {
              if (nr < 0 || nr >= N || nc < 0 || nc >= N) continue;
              const ni = nr * N + nc;
              if (open[ni] && !seen.has(ni)) { seen.add(ni); stack.push(ni); }
            }
          }
          comps.push({ cells: comp });
        }
        comps.sort((a, b) => b.cells.length - a.cells.length);
        const sBytes = await sourceBytes(metaImage);
        if (sBytes) {
          for (const comp of comps.slice(0, 2)) {
            if (comp.cells.length / (N * N) < 0.06) continue;
            const rs = comp.cells.map((k) => Math.floor(k / N)), cs = comp.cells.map((k) => k % N);
            const pad = 0.04;
            const region = {
              x1: Math.max(0, Math.min(...cs) / N - pad), y1: Math.max(0, Math.min(...rs) / N - pad),
              x2: Math.min(1, (Math.max(...cs) + 1) / N + pad), y2: Math.min(1, (Math.max(...rs) + 1) / N + pad),
            };
            const cropUrl = await cropToDataUrl(sBytes, region);
            if (!cropUrl) continue;
            const segRe = await timed(() => segmentImage(cropUrl, "every distinct pile of items in this crop"));
            samMs += segRe.ms; samCalls++;
            const found = extractDetections(segRe.v, []).map((d) => ({ ...d, box: remapBox(d.box, region) }));
            samDetections = mergeDetections(samDetections, found);
            if (coverageRatio(samDetections) >= 0.35) break;
          }
        }
      } catch { /* found boxes stand */ }
    }
    // Whole-scene box? When SAM returns one region covering most of the frame,
    // the count cap would force a single "assortment" listing. ensureCoverage()
    // subdivides huge regions into a grid so every pile keeps its own numbered
    // box. Tight boxes (single close-up items) pass through untouched.
    // Estimate-grid cells from the zero path pass through as-is.
    const cov = ensureCoverage(samDetections);
    samDetections = cov.regions;
    const subdivided = cov.subdivided || gridFallback;
    // Visual numbering: left-to-right, top-to-bottom — before the set-of-marks
    // copy is drawn and before Spark sees the numbers, so boxIds stay bound.
    samDetections = sortReadingOrder(samDetections);
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
        const srcBytes = await sourceBytes(metaImage);
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
      grounding + (numbered ? "\nThe attached image has numbered markers 1.." + samDetections.length + " on the detected regions. Every item MUST include its boxId (the number nearest to it)." : "") + (subdivided ? "\nSome numbered cells may show the SAME single object (e.g. one pumpkin filling several cells) — then return ONE listing for it, not one per cell." : "")
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
        sparkMs += retry.ms; sparkCalls++;
        if (rRaws.length > 0) { analysis = rAnalysis; analysisText = rText; raws = rRaws; }
      } catch { /* first (empty) attempt stands */ }
    }
    // Studio image for the hero product only (cost control)
    // Deterministic pile merge BEFORE normalizing: same exact name + touching
    // regions = ONE product with a union pile crop (server-side, never model
    // whim). Nothing is missed (every region still grounds a listing) and no
    // pile ever shows up as two products.
    const merged = mergeSameName(raws, samDetections.map((d) => d.box));
    const firstName = String(merged[0]?.raw.name_en ?? prompt);
    const studioR = await timed(() => cleanProductShot(firstName)).catch((e) => ({ v: { error: String(e) }, ms: 0 }));
    const studioImage = extractStudioImage(studioR.v);
    // Studio image is the HERO product's shot only. It must never seed other
    // products' galleries — that was the uniform-image bug in the screenshot:
    // one studio bodysuit leading every card when some products missed crops.
    const products = normalizeProducts(merged.map((m) => m.raw), {
      source: { type: "image", label: prompt },
      country, currency,
      fallbackImage: imageUrl.startsWith("http") ? imageUrl : undefined,
    });
    if (studioImage && products[0] && !products[0].images.includes(studioImage)) products[0].images = [studioImage, ...products[0].images];
    // Carry each listing's box number onto its product (map chips, crops, delete).
    products.forEach((p, pi) => {
      const b = merged[pi]?.boxIds[0] ?? Infinity;
      if (Number.isFinite(b)) p.boxId = b;
    });
    // Final detections MUST reuse the SAME (possibly subdivided) regions that
    // grounded Spark. Re-parsing seg here desyncs: 1 huge SAM box vs 6
    // listings → only product #1 gets a real crop and the rest share one
    // whole-photo image (the uniform-image bug). Relabel regions by boxId.
    let detections: { label: string; box: [number, number, number, number]; source: "sam" | "estimate" }[];
    if (samDetections.length > 0) {
      // Single-object verdict on a subdivided grid (Spark decided the cells
      // show ONE thing, e.g. one pumpkin): collapse to the union box so one
      // item doesn't show six boxes.
      if (subdivided && products.length === 1 && samDetections.length > 1) {
        const u: [number, number, number, number] = [
          Math.min(...samDetections.map((d) => d.box[0])),
          Math.min(...samDetections.map((d) => d.box[1])),
          Math.max(...samDetections.map((d) => d.box[2])),
          Math.max(...samDetections.map((d) => d.box[3])),
        ];
        detections = [{ label: products[0].name_en, box: u, source: "sam" }];
      } else {
        // Every region maps to its pile's product via the merge table: full
        // detection coverage on the map, one product per pile in the cards.
        const boxToProd = new Map<number, number>();
        merged.forEach((m, pi) => m.boxIds.forEach((b) => { if (Number.isFinite(b) && !boxToProd.has(b)) boxToProd.set(b, pi); }));
        detections = samDetections.map((d, i) => {
          const pid = i + 1;
          const pi = boxToProd.get(pid);
          const match = pi !== undefined ? products[pi] : products[i];
          return { label: match?.name_en ?? d.label, box: d.box, source: d.source };
        });
      }
    } else {
      detections = extractDetections(seg, products.map((p) => p.name_en));
    }
    // Real per-item crops: ONE target box per product — the union of its pile
    // regions (multi-box group), its single region, or its positional
    // detection as fallback. Assigned positionally: exact by construction,
    // no name guessing, no shared pictures.
    let cropsOk = 0; let cropMs = 0;
    try {
      const targets: { x1: number; y1: number; x2: number; y2: number }[] = products.map((p, pi) => {
        const ids = (merged[pi]?.boxIds ?? []).filter((b) => Number.isFinite(b) && b >= 1 && b <= samDetections.length);
        if (ids.length) {
          const bs = ids.map((b) => samDetections[b - 1].box);
          return {
            x1: Math.min(...bs.map((x) => x[0])), y1: Math.min(...bs.map((x) => x[1])),
            x2: Math.max(...bs.map((x) => x[2])), y2: Math.max(...bs.map((x) => x[3])),
          };
        }
        const d = detections[pi];
        return d && d.box[2] > d.box[0] && d.box[3] > d.box[1]
          ? { x1: d.box[0], y1: d.box[1], x2: d.box[2], y2: d.box[3] }
          : { x1: 0, y1: 0, x2: 0, y2: 0 };
      });
      const validIdx = targets.map((t, i) => (t.x2 > t.x1 && t.y2 > t.y1 ? i : -1)).filter((i) => i >= 0).slice(0, 14);
      if (validIdx.length) {
        const t0 = Date.now();
        const srcBytes = await sourceBytes(imageUrl);
        if (srcBytes) {
          const crops = await cropRegions(srcBytes, validIdx.map((i) => targets[i]));
          validIdx.forEach((pi, k) => {
            const crop = crops[k];
            if (!crop) return;
            const p = products[pi];
            if (!p || p.images.includes(crop)) return;
            // The shared studio shot depicts the hero item only — it must not
            // lead other products' galleries (that was the uniform-image bug).
            const rest = p.images.filter((img) => img !== studioImage && img !== crop);
            p.images = p === products[0] && studioImage ? [studioImage, crop, ...rest] : [crop, ...rest];
            cropsOk++;
          });
        }
        cropMs = Date.now() - t0;
      }
    } catch { /* crops are enhancement-only */ }
    const trace = [
      { model: "sam-3.1", role: "Segmentation — عزل كل قطعة في الصورة", ms: samMs, live, status: detections.length ? "ok" : "empty" },
      { model: "muse-spark-1.3", role: "تعرّف + تسعير محلي + إعلان كامل", ms: sparkMs, live, status: products.length ? "ok" : "empty" },
      { model: "muse-image-1.0", role: "صورة ستوديو نظيفة للمنتج الأول", ms: studioR.ms, live, status: studioImage ? "ok" : "skipped" },
      { model: "crop", role: "قصّات حقيقية لكل منتج", ms: cropMs, live, status: cropsOk > 0 ? `ok · ${cropsOk}/${products.length}` : "skipped" },
    ];

    rememberVisit({
      t: new Date().toISOString(), ip: maskIp(ip), country: geo, ua: ua.slice(0, 80),
      action: focusStr ? `focus:${focusStr.slice(0, 24)}` : "analyze",
      det: detections.length, prod: products.length,
      sam: samCalls, spark: sparkCalls, img: studioImage ? 1 : 0, live,
    });
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
