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
