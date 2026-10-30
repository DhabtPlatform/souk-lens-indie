import { describe, expect, it } from "vitest";
import { boxArea, buildGrounding, ensureCoverage, extractDetections, mergeDetections, sortReadingOrder, subdivideRegion } from "@/lib/extract";

describe("SAM native box parsing", () => {
  it("parses real box;x1=.. coordinates", () => {
    const text = "items <|box;x1=662;y1=228;x2=1173;y2=643;w=1280;h=853|><|mask;x=1|>";
    const resp = { output: [{ content: [{ type: "output_text", text }] }] };
    const d = extractDetections(resp, ["Avocado"]);
    expect(d.length).toBeGreaterThan(0);
    expect(d[0].source).toBe("sam");
    const [x1, y1, x2, y2] = d[0].box;
    expect(x1).toBeCloseTo(662 / 1280, 4);
    expect(y1).toBeCloseTo(228 / 853, 4);
    expect(x2).toBeCloseTo(1173 / 1280, 4);
    expect(y2).toBeCloseTo(643 / 853, 4);
  });
});
describe("seller focus grounding", () => {
  it("stays neutral without focus (all items)", () => {
    const g = buildGrounding("market goods", "#1 at [0.1,0.2]", "");
    expect(g).not.toContain("SELLER FOCUS");
    expect(g).toContain("#1 at [0.1,0.2]");
  });
  it("instructs ONLY the named items with focus", () => {
    const g = buildGrounding("market goods", "#1 at [0.1,0.2]", "tomato, cucumber", 2);
    expect(g).toContain("SELLER FOCUS");
    expect(g).toContain("tomato, cucumber");
    expect(g).toContain("ONLY");
    expect(g).toContain("never rename them");
    expect(g).toContain("AT MOST 2");
  });
  it("caps listings to SAM regions without focus", () => {
    const g = buildGrounding("market goods", "#1 at [0.1,0.2]", "", 1);
    expect(g).not.toContain("SELLER FOCUS");
    expect(g).toContain("AT MOST 1");
  });
  it("groups touching same-kind regions into one pile listing", () => {
    const g = buildGrounding("market goods", "#1 at [0.1,0.2]; #2 at [0.5,0.5]", "", 2);
    expect(g).toContain("GROUPING RULE");
    expect(g).toContain("ONE pile");
    expect(g).toContain("Identical neighbours must share one name");
  });
  it("skips the grouping rule for a single region and for seller focus", () => {
    expect(buildGrounding("market goods", "#1 at [0.1,0.2]", "", 1)).not.toContain("GROUPING RULE");
    expect(buildGrounding("market goods", "#1 at [0.1,0.2]; #2 at [0.5,0.5]", "tomato", 2)).not.toContain("GROUPING RULE");
  });
  it("returns empty (not fake boxes) for garbage", () => {
    expect(extractDetections({ nothing: true }, [])).toEqual([]);
  });
  it("merges a second pass without double-counting", () => {
    const a = [{ label: "x", box: [0, 0, 0.5, 0.5] as [number, number, number, number], source: "sam" as const }];
    const b = [
      { label: "y", box: [0.05, 0.05, 0.45, 0.45] as [number, number, number, number], source: "sam" as const },
      { label: "z", box: [0.6, 0.6, 0.9, 0.9] as [number, number, number, number], source: "sam" as const },
    ];
    const m = mergeDetections(a, b);
    expect(m.length).toBe(2);
    expect(m[1].label).toBe("z");
  });
  it("splits a whole-scene box into an exact tiling grid", () => {
    const big = { label: "Detected item 1", box: [0.02, 0.02, 0.98, 0.98] as [number, number, number, number], source: "sam" as const };
    expect(boxArea(big.box)).toBeGreaterThan(0.7);
    const cells = subdivideRegion(big, 3, 2);
    expect(cells).toHaveLength(6);
    // First cell starts at parent origin, last cell ends at parent far corner.
    expect(cells[0].box[0]).toBeCloseTo(0.02, 6);
    expect(cells[0].box[1]).toBeCloseTo(0.02, 6);
    expect(cells[5].box[2]).toBeCloseTo(0.98, 6);
    expect(cells[5].box[3]).toBeCloseTo(0.98, 6);
    // Every cell stays inside the parent box.
    for (const c of cells) {
      expect(c.box[0]).toBeGreaterThanOrEqual(0.02);
      expect(c.box[1]).toBeGreaterThanOrEqual(0.02);
      expect(c.box[2]).toBeLessThanOrEqual(0.98);
      expect(c.box[3]).toBeLessThanOrEqual(0.98);
      expect(c.box[2]).toBeGreaterThan(c.box[0]);
      expect(c.box[3]).toBeGreaterThan(c.box[1]);
    }
  });
  it("leaves small single-item boxes below the split threshold", () => {
    const small = { label: "x", box: [0.2, 0.2, 0.5, 0.6] as [number, number, number, number], source: "sam" as const };
    expect(boxArea(small.box)).toBeLessThan(0.7);
  });
  it("ensureCoverage splits one huge region, keeps tight ones", () => {
    const huge = { label: "Detected item 1", box: [0, 0, 1, 1] as [number, number, number, number], source: "sam" as const };
    const r1 = ensureCoverage([huge]);
    expect(r1.subdivided).toBe(true);
    expect(r1.regions).toHaveLength(6);
    expect(r1.regions[0].label).toBe("Detected item 1");
    const tight = { label: "Detected item 1", box: [0.2, 0.2, 0.5, 0.6] as [number, number, number, number], source: "sam" as const };
    const r2 = ensureCoverage([tight]);
    expect(r2.subdivided).toBe(false);
    expect(r2.regions).toHaveLength(1);
  });
  it("sortReadingOrder numbers left-to-right, top-to-bottom", () => {    const right = { label: "r", box: [0.55, 0.26, 0.92, 0.75] as [number, number, number, number], source: "sam" as const };
    const left = { label: "l", box: [0.07, 0.26, 0.5, 0.74] as [number, number, number, number], source: "sam" as const };
    const bottom = { label: "b", box: [0.1, 0.8, 0.4, 0.95] as [number, number, number, number], source: "sam" as const };
    const out = sortReadingOrder([right, bottom, left]);
    expect(out.map((d) => d.label)).toEqual(["l", "r", "b"]);
  });
  it("zero-SAM fallback grid stays honest estimate with 6 cells in-frame", () => {
    const cells = subdivideRegion(
      { label: "whole scene", box: [0.02, 0.02, 0.98, 0.98], source: "estimate" as const }, 3, 2
    );
    expect(cells).toHaveLength(6);
    for (const c of cells) {
      expect(c.source).toBe("estimate");
      expect(c.box[0]).toBeGreaterThanOrEqual(0.02);
      expect(c.box[1]).toBeGreaterThanOrEqual(0.02);
      expect(c.box[2]).toBeLessThanOrEqual(0.98);
      expect(c.box[3]).toBeLessThanOrEqual(0.98);
    }
  });
});

