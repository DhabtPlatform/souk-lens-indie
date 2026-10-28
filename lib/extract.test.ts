import { describe, expect, it } from "vitest";
import { buildGrounding, extractDetections } from "@/lib/extract";

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
  it("returns empty (not fake boxes) for garbage", () => {
    expect(extractDetections({ nothing: true }, [])).toEqual([]);
  });
});

