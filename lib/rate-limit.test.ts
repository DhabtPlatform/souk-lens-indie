import { describe, expect, it } from "vitest";
import { isRateLimited, maskIp } from "@/lib/rate-limit";

describe("rate limiter", () => {
  it("allows humans, blocks hammering, forgets old hits", () => {
    const s = new Map<string, number[]>();
    const W = 10 * 60 * 1000;
    for (let i = 0; i < 15; i++) expect(isRateLimited(s, "1.2.3.4", i * 1000, 15, W)).toBe(false);
    expect(isRateLimited(s, "1.2.3.4", 15000, 15, W)).toBe(true);
    expect(isRateLimited(s, "9.9.9.9", 15000, 15, W)).toBe(false);
    expect(isRateLimited(s, "1.2.3.4", W + 60000, 15, W)).toBe(false);
  });
  it("masks IPs for the owner log", () => {
    expect(maskIp("197.32.45.120")).toBe("197.•••.•••.120");
    expect(maskIp("unknown")).toBe("unk•••");
  });
});
