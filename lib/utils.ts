import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(value?: number | null, currency = "EGP"): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  // Follow the UI language: Arabic-Indic digits in Arabic, Latin digits in English.
  const locale = typeof document !== "undefined" && document.documentElement.lang.startsWith("en") ? "en-US" : "ar-EG";
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value) + " " + currency;
}

export function uid(prefix = "p"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

export function safeText(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

// Every server/CDN failure mode (413/500 HTML pages, empty bodies, proxy
// text) must surface as a human message. A blind response.json() turns those
// platform pages into "SyntaxError: Unexpected token …" on screen — that
// class of error must never reach a judge, in any tab.
export async function parseJsonResponse<T = Record<string, unknown>>(r: Response): Promise<T> {
  const text = await r.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    if (r.status === 413 || /too large|entity/i.test(text)) {
      const e = new Error("PAYLOAD_TOO_LARGE") as Error & { status?: number };
      e.status = r.status;
      throw e;
    }
    throw new Error(text.slice(0, 160).trim() || `HTTP ${r.status}`);
  }
}

export function isPayloadTooLarge(e: unknown): boolean {
  return e instanceof Error && e.message === "PAYLOAD_TOO_LARGE";
}
