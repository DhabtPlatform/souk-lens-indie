import { NextRequest, NextResponse } from "next/server";
import { hasKey, listingFromText, transcribeAudio } from "@/lib/meta";
import { extractItems, extractText } from "@/lib/extract";
import { normalizeProducts } from "@/lib/product";

// POST multipart { audio } OR JSON { transcript, country, currency }
// Meta transcribe needs WAV mono 16/24kHz; browser webm usually 400 -> graceful fallback to manual text.
export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get("content-type") ?? "";
    let transcript = "";
    let note = "";
    let country = "EG";
    let currency = "EGP";

    if (ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      country = String(fd.get("country") ?? "EG");
      currency = String(fd.get("currency") ?? "EGP");
      const f = fd.get("audio");
      if (f instanceof File) {
        const buf = Buffer.from(await f.arrayBuffer());
        if (buf.length > 32 * 1024 * 1024) return NextResponse.json({ error: "audio too large (32MB max)" }, { status: 413 });
        if (!hasKey()) note = "MOCK: ضع MODEL_API_KEY للتحويل الصوتي الحقيقي — اكتب الوصف يدويا.";
        else {
          try {
            const tr = (await transcribeAudio(buf, f.name || "voice.wav")) as { transcript?: string; turns?: { transcript?: string }[] };
            transcript = tr?.transcript ?? "";
            if (!transcript && Array.isArray(tr?.turns)) transcript = tr.turns.map((t) => t.transcript ?? "").join(" ");
          } catch (e) {
            note = `تعذر تحويل الصوت تلقائيا (${String(e).slice(0, 140)}). اكتب وصف المنتج وهنولد الإعلان كامل.`;
          }
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

    if (!transcript.trim()) return NextResponse.json({ ok: true, live: hasKey(), transcript: "", note, products: [], items: [], analysisText: "" });

    const listing = await listingFromText(`إعلان من وصف صوتي: ${transcript}`, country, currency);
    const text = extractText(listing);
    const raws = extractItems(listing, text);
    const products = normalizeProducts(raws, { source: { type: "voice", transcript }, country, currency });
    return NextResponse.json({ ok: true, live: Boolean(process.env.MODEL_API_KEY), transcript, note, products, items: products, analysisText: text });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
