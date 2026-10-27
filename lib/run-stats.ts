"use client";

// Persistent per-device run statistics: every real pipeline run on this device
// (any tab) is recorded here — runs, listings produced, total elapsed ms.
// These are the "real results" numbers shown in the impact strip:
// measured on this device, never invented, never reset by navigation.
export type RunStats = { runs: number; listings: number; totalMs: number };

const KEY = "souk-lens-run-stats-v1";

export function readRunStats(): RunStats {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<RunStats> | null;
    if (raw && typeof raw === "object") {
      return {
        runs: Math.max(0, Number(raw.runs) || 0),
        listings: Math.max(0, Number(raw.listings) || 0),
        totalMs: Math.max(0, Number(raw.totalMs) || 0),
      };
    }
  } catch { /* first visit */ }
  return { runs: 0, listings: 0, totalMs: 0 };
}

export function recordRun(elapsedMs: number, listings: number): RunStats {
  const s = readRunStats();
  const next: RunStats = {
    runs: s.runs + 1,
    listings: s.listings + Math.max(0, listings),
    totalMs: s.totalMs + Math.max(0, Math.round(elapsedMs)),
  };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  return next;
}

export function avgSeconds(s: RunStats): number | null {
  return s.runs > 0 ? s.totalMs / 1000 / s.runs : null;
}
