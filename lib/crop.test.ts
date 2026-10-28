import { describe, expect, it } from "vitest";
import { boxToPixels } from "@/lib/crop";

describe("real crop math", () => {
  it("maps normalized boxes to pixels with padding + clamp", () => {
    const r = boxToPixels({ x1: 0.25, y1: 0.25, x2: 0.75, y2: 0.75 }, 1000, 800);
    expect(r.left).toBeLessThanOrEqual(250);
    expect(r.top).toBeLessThanOrEqual(200);
    expect(r.left + r.width).toBeGreaterThanOrEqual(750);
    expect(r.top + r.height).toBeGreaterThanOrEqual(600);
  });
  it("never escapes the image", () => {
    const r = boxToPixels({ x1: -0.5, y1: -0.5, x2: 1.5, y2: 1.5 }, 100, 100);
    expect(r.left).toBe(0);
    expect(r.top).toBe(0);
    expect(r.left + r.width).toBeLessThanOrEqual(100);
    expect(r.top + r.height).toBeLessThanOrEqual(100);
  });
});
