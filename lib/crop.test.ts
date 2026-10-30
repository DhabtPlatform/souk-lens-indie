import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { cropRegions } from "@/lib/crop";

// Portrait-photo regression test: a phone portrait is stored as LANDSCAPE
// pixels + EXIF orientation 6 (rotate 90 CW to display). Crops must land in
// DISPLAYED space (what the seller sees), never raw-buffer space.
describe("EXIF orientation", () => {
  it("crops the displayed top half as red, not a raw-buffer mix", async () => {
    const W = 800, H = 400;
    const px = Buffer.alloc(W * H * 3);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 3;
        if (x < W / 2) px[i] = 255; // left = red
        else px[i + 2] = 255; // right = blue
      }
    const exifPortrait = await sharp(px, { raw: { width: W, height: H, channels: 3 } })
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();
    // Displayed: 400x800 portrait, red on top. Crop displayed top half.
    const [crop] = await cropRegions(exifPortrait, [{ x1: 0, y1: 0, x2: 1, y2: 0.5 }]);
    expect(crop.startsWith("data:image/jpeg")).toBe(true);
    const { data, info } = await sharp(Buffer.from(crop.split(",")[1], "base64")).raw().toBuffer({ resolveWithObject: true });
    expect(info.width).toBeLessThanOrEqual(info.height); // portrait-ish, not landscape
    let r = 0, b = 0;
    for (let i = 0; i < data.length; i += 3) { r += data[i]; b += data[i + 2]; }
    expect(r).toBeGreaterThan(b * 3); // red top, not a red/blue mix
  });
});
