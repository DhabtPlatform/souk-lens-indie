// Parse Meta Responses API output into text + items. No `any` leaks to UI.

export function extractText(resp: unknown): string {
  try {
    const out = (resp as { output?: unknown[] })?.output;
    if (!Array.isArray(out)) return "";
    const texts: string[] = [];
    for (const item of out) {
      const content = (item as { content?: unknown[] })?.content;
      if (!Array.isArray(content)) continue;
      for (const c of content) {
        const t = c as { type?: string; text?: string };
        if (t?.type === "output_text" && typeof t.text === "string") texts.push(t.text);
      }
    }
    return texts.join("\n");
  } catch { return ""; }
}

export function extractItems(resp: unknown, text?: string): Record<string, unknown>[] {
  const direct = (resp as { items?: unknown })?.items;
  if (Array.isArray(direct)) return direct as Record<string, unknown>[];
  const src = text ?? extractText(resp);
  try {
    const clean = src.replace(/```json|```/g, "").trim();
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start < 0 || end <= start) {
      const aStart = clean.indexOf("[");
      const aEnd = clean.lastIndexOf("]");
      if (aStart >= 0 && aEnd > aStart) {
        const arr = JSON.parse(clean.slice(aStart, aEnd + 1)) as unknown;
        return Array.isArray(arr) ? (arr as Record<string, unknown>[]) : [];
      }
      return [];
    }
    const obj = JSON.parse(clean.slice(start, end + 1)) as { items?: unknown };
    return Array.isArray(obj.items) ? (obj.items as Record<string, unknown>[]) : [];
  } catch { return []; }
}

export type Detection = { label: string; box: [number, number, number, number]; source: "sam" | "estimate" };

export function iou(a: Detection["box"], b: Detection["box"]): number {
  const x1 = Math.max(a[0], b[0]);
  const y1 = Math.max(a[1], b[1]);
  const x2 = Math.min(a[2], b[2]);
  const y2 = Math.min(a[3], b[3]);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const ua = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter;
  return ua > 0 ? inter / ua : 0;
}

// Box number from a raw Spark item (set-of-marks linkage). Infinity = unranked.
export function boxIdOf(raw: Record<string, unknown>): number {
  const v = raw.boxId ?? raw.box_number ?? raw.boxNumber;
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) && (n as number) > 0 ? (n as number) : Infinity;
}
// Merge a second segmentation pass: keep every box that does not heavily
// overlap one we already have. Raises coverage without double-counting.
export function mergeDetections(base: Detection[], extra: Detection[], thr = 0.5): Detection[] {
  const out = [...base];
  for (const d of extra) {
    if (out.every((o) => iou(o.box, d.box) < thr)) out.push(d);
  }
  return out.slice(0, 14);
}

// Seller focus: "all items" (default) or a comma-separated list of visible item
// names to generate listings for ONLY. Appended to the Spark grounding so the
// instruction travels with the model prompt, honestly labeled end to end.
export function buildGrounding(prompt: string, detectionPart: string, focus = "", maxItems = 0): string {
  const base = detectionPart || `${prompt} · `;
  const cap = maxItems > 0
    ? `\nCOUNT RULE: SAM found exactly ${maxItems} item region(s) above. Return AT MOST ${maxItems} listing(s), each tied to one numbered region (#1..#${maxItems}). Never list anything not visible in one of these regions.`
    : "";
  const f = focus.trim().replace(/\s+/g, " ");
  const cover = !f && maxItems > 1
    ? `\nCOVERAGE RULE: give EVERY numbered region above its own separate listing — never merge multiple regions into one combined listing. If a region holds no sellable item, skip just that region.`
    : "";
  if (!f) return `${prompt}: ${base}${cap}${cover}`;
  return `${prompt}: ${base}\nSELLER FOCUS: build listings ONLY for these visible items: ${f}. Use the seller's exact names — never rename them to something else. Ignore every other object in the photo.${cap}`;
}
// Find SAM-style detections anywhere in the response; boxes normalized to 0..1 (x1,y1,x2,y2).
// SAM 3.1 actually returns text like:
//   <|box;x1=662;y1=228;x2=1173;y2=643;w=1280;h=853|><|mask;...|>
// so parse that format first (real model coordinates), then structured box arrays.
export function extractDetections(seg: unknown, fallbackLabels: string[] = []): Detection[] {
  const found: Detection[] = [];
  const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
  const samText = extractText(seg);
  const boxRe = /box;x1=(\d+(?:\.\d+)?);y1=(\d+(?:\.\d+)?);x2=(\d+(?:\.\d+)?);y2=(\d+(?:\.\d+)?)(?:;w=(\d+(?:\.\d+)?);h=(\d+(?:\.\d+)?))?/g;
  for (const m of samText.matchAll(boxRe)) {
    let [x1, y1, x2, y2] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
    const w = m[5] ? Number(m[5]) : 0;
    const h = m[6] ? Number(m[6]) : 0;
    if (w > 0 && h > 0) { x1 /= w; y1 /= h; x2 /= w; y2 /= h; }
    else if (Math.max(x1, y1, x2, y2) > 1.5) { x1 /= 1000; y1 /= 1000; x2 /= 1000; y2 /= 1000; }
    if (x2 > x1 && y2 > y1) {
      found.push({
        label: fallbackLabels[found.length] ?? `Detected item ${found.length + 1}`,
        box: [clamp01(x1), clamp01(y1), clamp01(x2), clamp01(y2)],
        source: "sam",
      });
    }
    if (found.length >= 14) return found;
  }
  if (found.length) return found;

  const seen = new Set<unknown>();
  function walk(v: unknown, depth: number) {
    if (!v || typeof v !== "object" || depth > 6 || seen.has(v)) return;
    seen.add(v);
    const o = v as Record<string, unknown>;
    const boxRaw = (o.box ?? o.bbox ?? o.bounding_box) as unknown;
    const label = typeof o.label === "string" ? o.label : typeof o.name === "string" ? o.name : "";
    if (Array.isArray(boxRaw) && boxRaw.length >= 4 && label) {
      let [x1, y1, x2, y2] = boxRaw.slice(0, 4).map((n) => Number(n));
      if ([x1, y1, x2, y2].every(Number.isFinite)) {
        if (Math.max(x1, y1, x2, y2) > 1.5) { x1 /= 1000; y1 /= 1000; x2 /= 1000; y2 /= 1000; } // 0..1000 scale
        if (x2 > x1 && y2 > y1) found.push({ label, box: [clamp01(x1), clamp01(y1), clamp01(x2), clamp01(y2)], source: "sam" });
      }
    }
    for (const val of Object.values(o)) walk(val, depth + 1);
  }
  walk(seg, 0);
  if (found.length) return found.slice(0, 14);
  // Honest fallback: evenly placed estimate boxes matched to the listings Spark returned.
  const labels = fallbackLabels.filter(Boolean).slice(0, 8);
  return labels.map((label, i) => {
    const cols = labels.length <= 2 ? labels.length : 3;
    const col = i % cols; const row = Math.floor(i / cols);
    const w = 0.92 / cols; const x1 = 0.04 + col * w;
    return { label, box: [x1, 0.08 + row * 0.44, x1 + w - 0.04, 0.08 + row * 0.44 + 0.36] as [number, number, number, number], source: "estimate" as const };
  });
}

export function extractStudioImage(studio: unknown): string | null {
  try {
    const d = (studio as { data?: Record<string, unknown>[] })?.data?.[0];
    if (!d) return null;
    if (typeof d.url === "string") return d.url;
    if (typeof d.b64_json === "string") return `data:image/png;base64,${d.b64_json}`;
    if (typeof d.image_url === "string") return d.image_url;
    return null;
  } catch { return null; }
}

export function extractImageGenResult(resp: unknown): string | null {
  try {
    const out = (resp as { output?: Record<string, unknown>[] })?.output;
    if (Array.isArray(out)) {
      for (const o of out) {
        if (o?.type === "image_generation_call" && typeof o.result === "string") return `data:image/png;base64,${o.result}`;
      }
    }
    return extractStudioImage(resp);
  } catch { return null; }
}
