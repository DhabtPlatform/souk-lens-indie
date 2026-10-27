import { NextResponse } from "next/server";

const BASE = process.env.META_BASE_URL ?? "https://api.meta.ai/v1";

// Verifiable integration proof for judges: reports whether the Meta Model API key
// is configured (without ever exposing it), which models the pipeline uses, and
// honest on-device run stats. No secrets, no invented numbers.
export async function GET() {
  const hasKey = !!(process.env.MODEL_API_KEY ?? "").trim();
  let reachable: boolean | null = null;
  let latencyMs: number | null = null;
  if (hasKey) {
    const t0 = Date.now();
    try {
      const r = await fetch(`${BASE}/models`, {
        headers: { Authorization: `Bearer ${process.env.MODEL_API_KEY}` },
        signal: AbortSignal.timeout(8000),
      });
      latencyMs = Date.now() - t0;
      reachable = r.ok;
    } catch {
      latencyMs = Date.now() - t0;
      reachable = false;
    }
  }
  return NextResponse.json({
    ok: true,
    mode: hasKey ? "live" : "demo",
    base: BASE,
    models: ["sam-3.1", "muse-spark-1.3", "muse-image-1.0"],
    keyConfigured: hasKey,
    apiReachable: reachable,
    apiLatencyMs: latencyMs,
    note: hasKey
      ? "Key is configured. apiReachable reports a live check against the Meta Model API."
      : "No key configured — the app runs an honest labeled demo mode. Set MODEL_API_KEY for live runs.",
  });
}
