import { NextRequest, NextResponse } from "next/server";

// Geo detect for first-visit defaults: country (+currency via the app's
// country list) and language. Vercel header first (free, instant),
// public IP lookup as fallback. Never throws — returns nulls on failure
// and the client falls back to browser language + app defaults.
const ARABIC_COUNTRIES = new Set([
  "EG", "SA", "AE", "DZ", "BH", "KM", "DJ", "IQ", "JO", "KW", "LB",
  "LY", "MR", "MA", "OM", "PS", "QA", "SD", "SO", "SY", "TN", "YE",
]);

async function lookupCountry(): Promise<{ code: string; via: string } | null> {
  for (const url of ["https://ipwho.is/?fields=country_code", "https://ipapi.co/json/"]) {
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 4000);
      const r = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "SoukLens/1.0" } });
      clearTimeout(to);
      if (!r.ok) continue;
      const j = (await r.json()) as { country_code?: string; country?: string };
      const code = String(j.country_code ?? j.country ?? "").toUpperCase();
      if (/^[A-Z]{2}$/.test(code)) return { code, via: url.includes("ipwho") ? "ipwho.is" : "ipapi.co" };
    } catch { /* try next source */ }
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const headerCountry = (req.headers.get("x-vercel-ip-country") ?? "").toUpperCase();
    const found = /^[A-Z]{2}$/.test(headerCountry)
      ? { code: headerCountry, via: "vercel-header" }
      : await lookupCountry();
    if (!found) return NextResponse.json({ ok: true, country: null, lang: null, source: "none" });
    return NextResponse.json({
      ok: true,
      country: found.code,
      lang: ARABIC_COUNTRIES.has(found.code) ? "ar" : "en",
      source: found.via,
    });
  } catch {
    return NextResponse.json({ ok: true, country: null, lang: null, source: "none" });
  }
}
