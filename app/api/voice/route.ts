import { NextRequest, NextResponse } from "next/server";
import { cleanProductShot, hasKey, listingFromText, transcribeAudio } from "@/lib/meta";
import { extractItems, extractStudioImage, extractText } from "@/lib/extract";
import { normalizeProducts } from "@/lib/product";

// POST multipart { audio: 16kHz mono WAV from the browser } OR JSON { transcript, country, currency }
// Pipeline: Muse Voice transcribe -> Muse Spark full listing -> Muse Image studio shot.
// The product keeps its source (transcript), real name and generated studio image.
export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get("content-type") ?? "";
    let transcript = "";
    let note = "";
    let country = "EG";
    let currency = "EGP";
    let transcribeMs = 0;

    if (ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      country = String(fd.get("country") ?? "EG");
      currency = String(fd.get("currency") ?? "EGP");
      const f = fd.get("audio");
      if (f instanceof File) {
        const buf = Buffer.from(await f.arrayBuffer());
        if (buf.length > 32 * 1024 * 1024) return NextResponse.json({ error: "audio too large (32MB max)" }, { status: 413 });
        if (!hasKey()) note = "Demo mode: set MODEL_API_KEY for live voice — وضع تجريبي: فعّل المفتاح للصوت الحي.";
        else {
          const t0 = Date.now();
          try {
            const tr = (await transcribeAudio(buf, f.name || "voice.wav")) as { transcript?: string; turns?: { transcript?: string }[] };
            transcript = tr?.transcript ?? "";
            if (!transcript && Array.isArray(tr?.turns)) transcript = tr.turns.map((t) => t.transcript ?? "").join(" ");
            if (!transcript) note = "لم يصل نص من نموذج الصوت — جرّب تسجيل أوضح أو اكتب الوصف، وسيُبنى الإعلان كاملًا.";
          } catch (e) {
            note = `تعذّر تحويل الصوت (${String(e).slice(0, 140)}). اكتب وصف المنتج وسيُبنى الإعلان كاملًا.`;
          }
          transcribeMs = Date.now() - t0;
        }
      }
      const manual = fd.get("transcript");
      if (typeof manual === "string" && manual.trim()) transcript = manual.trim();
    } else {
      const j = await req.json();
      transcript = String(j?.transcript ?? "");
      country = String(j?.country ?? "EG");
      currency = String(j?.currency ?? "EGP");
    }

    if (!transcript.trim()) {
      return NextResponse.json({ ok: true, live: hasKey(), transcript: "", note, products: [], items: [], analysisText: "", trace: [{ model: "muse-voice-transcribe-1.0", role: "صوت → نص", ms: transcribeMs, live: hasKey(), status: "empty" }] });
    }

    const t1 = Date.now();
    const listing = await listingFromText(`وصف صوتي للمنتج: ${transcript}`, country, currency);
    const sparkMs = Date.now() - t1;
    const text = extractText(listing);
    const raws = extractItems(listing, text);
    const t2 = Date.now();
    const studio = await cleanProductShot(String(raws[0]?.name_en ?? transcript.slice(0, 80))).catch(() => ({ error: "studio failed" }));
    const studioMs = Date.now() - t2;
    const studioImage = extractStudioImage(studio);
    const products = normalizeProducts(raws, { source: { type: "voice", transcript }, country, currency, studioImage: studioImage ?? undefined });
    if (studioImage && products[0]) products[0].images = [studioImage, ...products[0].images.filter((i) => i !== studioImage)];

    return NextResponse.json({
      ok: true, live: Boolean(process.env.MODEL_API_KEY), transcript, note: products.length ? note : "لم يُبنَ إعلان من هذا النص — جرّب وصفًا أوضح.",
      products, items: products, studioImage, analysisText: text,
      trace: [
        { model: "muse-voice-transcribe-1.0", role: "صوت → نص", ms: transcribeMs, live: hasKey(), status: transcript ? "ok" : "empty" },
        { model: "muse-spark-1.3", role: "إعلان كامل باسم فعلي وأسعار ومتغيرات", ms: sparkMs, live: hasKey(), status: products.length ? "ok" : "empty" },
        { model: "muse-image-1.0", role: "صورة ستوديو مولدة للمنتج", ms: studioMs, live: hasKey(), status: studioImage ? "ok" : "skipped" },
      ],
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
