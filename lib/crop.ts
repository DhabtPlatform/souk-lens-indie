import sharp from "sharp";

// Real per-item crops from the seller's own photo using SAM's boxes.
// No generation, no hallucination, zero model cost — each product shows
// its own actual region instead of everyone sharing one picture.
export type CropBox = { x1: number; y1: number; x2: number; y2: number };

export function boxToPixels(box: CropBox, w: number, h: number, pad = 0.04) {
  const px = Math.max(0, Math.floor((Math.min(box.x1, box.x2) - pad) * w));
  const py = Math.max(0, Math.floor((Math.min(box.y1, box.y2) - pad) * h));
  const x2 = Math.min(w, Math.ceil((Math.max(box.x1, box.x2) + pad) * w));
  const y2 = Math.min(h, Math.ceil((Math.max(box.y1, box.y2) + pad) * h));
  return { left: px, top: py, width: Math.max(8, x2 - px), height: Math.max(8, y2 - py) };
}

export async function cropRegions(imageBytes: Buffer, boxes: CropBox[], maxSide = 640): Promise<string[]> {
  const meta = await sharp(imageBytes).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (!w || !h) return boxes.map(() => "");
  const out: string[] = [];
  for (const b of boxes.slice(0, 14)) {
    try {
      const r = boxToPixels(b, w, h);
      const buf = await sharp(imageBytes)
        .extract({ left: Math.min(r.left, w - 1), top: Math.min(r.top, h - 1), width: Math.min(r.width, w - r.left), height: Math.min(r.height, h - r.top) })
        .resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 72 })
        .toBuffer();
      out.push(`data:image/jpeg;base64,${buf.toString("base64")}`);
    } catch {
      out.push("");
    }
  }
  return out;
}

export function sourceBytes(imageUrl: string): Promise<Buffer | null> {
  try {
    if (imageUrl.startsWith("data:")) {
      const b64 = imageUrl.split(",", 2)[1];
      if (!b64) return Promise.resolve(null);
      return Promise.resolve(Buffer.from(b64, "base64"));
    }
    if (!/^https?:\/\//.test(imageUrl)) return Promise.resolve(null);
    return fetch(imageUrl).then((r) => (r.ok ? r.arrayBuffer().then((b) => Buffer.from(b)) : null)).catch(() => null);
  } catch {
    return Promise.resolve(null);
  }
}
