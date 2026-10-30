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

export function boxArea(box: Detection["box"]): number {
  return Math.max(0, box[2] - box[0]) * Math.max(0, box[3] - box[1]);
}

// Split one huge region (whole-scene box) into a cols×rows grid so every pile
// keeps its own numbered region. Pure deterministic geometry on top of a real
// SAM detection — never invented positions. Small boxes pass through untouched.
export function subdivideRegion(d: Detection, cols = 3, rows = 2): Detection[] {
  const [x1, y1, x2, y2] = d.box;
  const w = (x2 - x1) / cols, h = (y2 - y1) / rows;
  const out: Detection[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      out.push({
        label: `${d.label} · ${r * cols + c + 1}`,
        box: [x1 + c * w, y1 + r * h, x1 + (c + 1) * w, y1 + (r + 1) * h],
        source: d.source,
      });
  return out;
}

// Whole-scene boxes (>70% of frame) would force a single "assortment"
// listing under the count cap. Split them into a grid so every pile keeps
// its own numbered region; tight boxes pass through untouched.
export function ensureCoverage(detections: Detection[]): { regions: Detection[]; subdivided: boolean } {
  const split = detections
    .flatMap((d) => (d.source === "sam" && boxArea(d.box) > 0.7 ? subdivideRegion(d, 3, 2) : [d]))
    .slice(0, 14);
  const subdivided = split.length !== detections.length;
  if (subdivided) split.forEach((d, i) => { d.label = `Detected item ${i + 1}`; });
  return { regions: split, subdivided };
}

// SAM returns boxes in detection-confidence order, not visual order — so box 1
// could sit on the RIGHT item while box 2 sits on the left, looking "mirrored"
// to the seller. Sort row-major (top-to-bottom bands, left-to-right inside)
// BEFORE annotating/grounding so numbers follow the visual layout. Numbering
// still binds by construction (annotate happens after the sort).
export function sortReadingOrder(ds: Detection[]): Detection[] {
  const sorted = [...ds].sort((a, b) => a.box[1] - b.box[1]);
  const rows: Detection[][] = [];
  for (const d of sorted) {
    const row = rows.find((r) => Math.abs(r[0].box[1] - d.box[1]) < 0.18);
    if (row) row.push(d);
    else rows.push([d]);
  }
  rows.forEach((r) => r.sort((a, b) => a.box[0] - b.box[0]));
  return rows.flat();
}

// Do two normalized boxes touch or overlap (with a small tolerance for pile
// neighbours)? Used to merge same-name regions into one pile product.
export function touches(a: Detection["box"], b: Detection["box"], pad = 0.05): boolean {
  return a[0] - pad < b[2] && b[0] - pad < a[2] && a[1] - pad < b[3] && b[1] - pad < a[3];
}

// Deterministic pile merge (server-side, never model whim): raws sharing the
// exact same name whose regions touch form ONE product (connected pile);
// separated same-name regions stay split; different names never merge; and one
// generic name covering everything never collapses the whole photo.
export function mergeSameName(
  raws: Record<string, unknown>[],
  boxes: Detection["box"][]
): { raw: Record<string, unknown>; boxIds: number[] }[] {
  const keyOf = (r: Record<string, unknown>) =>
    String(r.name_en ?? r.title ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  const groups = new Map<string, number[]>();
  raws.forEach((r, i) => {
    const k = keyOf(r) || `__blank${i}`;
    const g = groups.get(k);
    if (g) g.push(i);
    else groups.set(k, [i]);
  });
  const solo = (raw: Record<string, unknown>) => ({ raw, boxIds: [boxIdOf(raw)] });
  // One generic name ("fresh vegetables") covering a whole diverse photo must
  // never collapse it — but small same-name sets (two carrot regions) merge.
  if (groups.size <= 1 && raws.length > 4) return raws.map(solo);
  const boxOf = (i: number): Detection["box"] | null => {
    const b = boxIdOf(raws[i]);
    return Number.isFinite(b) && (b as number) >= 1 && (b as number) <= boxes.length ? boxes[(b as number) - 1] : null;
  };
  const out: { raw: Record<string, unknown>; boxIds: number[] }[] = [];
  for (const [, members] of groups) {
    const remaining = [...members];
    while (remaining.length) {
      const comp = [remaining.shift() as number];
      let grew = true;
      while (grew) {
        grew = false;
        for (let k = remaining.length - 1; k >= 0; k--) {
          const bb = boxOf(remaining[k]);
          const positioned = comp.some((ci) => { const cb = boxOf(ci); return !!cb && !!bb && touches(cb, bb); });
          const unpositioned = !bb && comp.every((ci) => !boxOf(ci));
          if (positioned || unpositioned) { comp.push(remaining.splice(k, 1)[0]); grew = true; }
        }
      }
      comp.sort((a, b) => a - b);
      out.push({ raw: raws[comp[0]], boxIds: comp.map((i) => boxIdOf(raws[i])) });
    }
  }
  const rank = (m: { boxIds: number[] }) => Math.min(...m.boxIds.map((x) => (Number.isFinite(x) ? x : 1e9)));
  return out.sort((a, b) => rank(a) - rank(b));
}

// Map a box from crop-local (0..1 of the crop) back to photo-global (0..1),
// so a zoomed re-segmentation lands on the original frame.
export function remapBox(box: Detection["box"], region: { x1: number; y1: number; x2: number; y2: number }): Detection["box"] {
  const w = Math.max(1e-6, region.x2 - region.x1), h = Math.max(1e-6, region.y2 - region.y1);
  const cl = (n: number) => Math.min(1, Math.max(0, n));
  return [cl(region.x1 + box[0] * w), cl(region.y1 + box[1] * h), cl(region.x1 + box[2] * w), cl(region.y1 + box[3] * h)];
}

// Fraction of the frame covered by SAM regions (overlaps double-count — it is
// a cheap density signal, not an exact area). Thin coverage (a few boxes on a
// big empty table) means SAM likely missed whole piles, so the route fires
// another pass instead of locking Spark to the few boxes it did see.
export function coverageRatio(ds: Detection[]): number {
  return ds.reduce((s, d) => s + boxArea(d.box), 0);
}
// names to generate listings for ONLY. Appended to the Spark grounding so the
// instruction travels with the model prompt, honestly labeled end to end.
export function buildGrounding(prompt: string, detectionPart: string, focus = "", maxItems = 0): string {
  const base = detectionPart || `${prompt} · `;
  const cap = maxItems > 0
    ? `\nCOUNT RULE: SAM found exactly ${maxItems} item region(s) above. Return AT MOST ${maxItems} listing(s), each tied to one numbered region (#1..#${maxItems}). Never list anything not visible in one of these regions.`
    : "";
  const f = focus.trim().replace(/\s+/g, " ");
  // Coverage with consistent naming: EVERY numbered region gets its own
  // listing (nothing missed), but identical-looking neighbours must carry
  // EXACTLY the same name (same spelling) so the server can deterministically
  // merge one pile into one product. Different kinds get different names.
  // Never merge regions into one combined "assortment" listing.
  const cover = !f && maxItems > 1
    ? `\nCOVERAGE RULE: give EVERY numbered region above its own separate listing — never merge multiple regions into one combined listing. Name identical-looking neighbours EXACTLY the same (same spelling, same pile = same name) so touching piles form one product; different kinds, colours, or clearly separated positions get different names. If a region holds no sellable item, skip just that region.`
    : "";
  // Name honesty, always on: a name must survive a look at the actual pixels.
  const verify = `\nNAME CHECK: verify every name against its region's real color and shape before listing (green round citrus is lime, never apple; orange roots are carrots). When unsure between two names for identical neighbours, use one name for all of them.`;
  if (!f) return `${prompt}: ${base}${cap}${cover}${verify}`;
  return `${prompt}: ${base}\nSELLER FOCUS: build listings ONLY for these visible items: ${f}. Use the seller's exact names — never rename them to something else. Ignore every other object in the photo.${cap}${verify}`;
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
