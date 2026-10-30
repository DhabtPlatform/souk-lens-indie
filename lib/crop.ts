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

// Oriented dimensions: sharp's metadata() reports RAW buffer dims while the
// .rotate() pipeline processes the DISPLAYED orientation — so for EXIF 5..8
// (portrait phones) width/height must be swapped by hand. Without this,
// boxes land on the wrong regions of portrait photos.
export async function orientedSize(imageBytes: Buffer): Promise<{ w: number; h: number }> {
  const m = await sharp(imageBytes).metadata();
  const swap = [5, 6, 7, 8].includes(m.orientation ?? 1);
  return {
    w: swap ? m.height ?? 0 : m.width ?? 0,
    h: swap ? m.width ?? 0 : m.height ?? 0,
  };
}

export async function cropRegions(imageBytes: Buffer, boxes: CropBox[], maxSide = 640): Promise<string[]> {
  // .rotate() first: phone portrait photos are stored landscape + EXIF flag.
  // Without it, crops/annotations land on the wrong regions (and Spark sees
  // the photo sideways). After rotate() the pixels match what the seller sees.
  const { w, h } = await orientedSize(imageBytes);
  if (!w || !h) return boxes.map(() => "");
  const out: string[] = [];
  for (const b of boxes.slice(0, 14)) {
    try {
      const r = boxToPixels(b, w, h);
      const buf = await sharp(imageBytes)
        .rotate()
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

// Numbered markers over each SAM box (set-of-marks): Spark names every
// numbered region, so names bind to boxes by construction, not by guessing.
export async function annotateBoxes(imageBytes: Buffer, boxes: CropBox[]): Promise<Buffer> {
  const { w: ww, h: hh } = await orientedSize(imageBytes);
  const w = ww ?? 1000;
  const h = hh ?? 1000;
  const s = Math.max(w, h) / 1000;
  const dots = boxes.slice(0, 14).map((b, i) => {
    const cx = ((Math.min(b.x1, b.x2) + Math.max(b.x1, b.x2)) / 2) * w;
    const cy = ((Math.min(b.y1, b.y2) + Math.max(b.y1, b.y2)) / 2) * h;
    const r = 26 * s;
    return `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(0)}" fill="#00d4a4" stroke="white" stroke-width="${(3 * s).toFixed(0)}"/><text x="${cx.toFixed(0)}" y="${(cy + 9 * s).toFixed(0)}" font-size="${(30 * s).toFixed(0)}" font-weight="900" text-anchor="middle" fill="black" font-family="Arial,sans-serif">${i + 1}</text>`;
  }).join("");
  const svg = `<svg width="${w}" height="${h}">${dots}</svg>`;
  return sharp(imageBytes).rotate().composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).jpeg({ quality: 80 }).toBuffer();
}
