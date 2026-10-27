import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brand — Souk Lens",
  description: "Souk Lens brand identity: logo system, colors, typography, RTL/LTR usage.",
};

const SWATCH = [
  { n: "Primary Violet", e: "AI / innovation", c: "#7C5CFF" },
  { n: "Accent Mint", e: "Trust / growth / price", c: "#00D4A4" },
  { n: "Discovery Gold", e: "The gem the lens found", c: "#FFD166" },
  { n: "Ink", e: "Text on dark", c: "#F6F6F8" },
  { n: "Card", e: "Surfaces", c: "#16161D" },
  { n: "Base", e: "Background", c: "#0B0B10" },
];

const S: Record<string, React.CSSProperties> = {
  page: { maxWidth: 980, margin: "0 auto", padding: "28px 20px 60px", fontFamily: "'Inter','Tajawal','Cairo','Segoe UI',system-ui,sans-serif", color: "#F6F6F8" },
  h2: { fontSize: 24, margin: "38px 0 12px", fontWeight: 800 },
  p: { opacity: 0.78, lineHeight: 1.9, margin: "6px 0" },
  card: { background: "#14141D", border: "1px solid #262636", borderRadius: 16, padding: 18 },
  chip: { display: "inline-block", padding: "4px 12px", borderRadius: 99, background: "#1E1E2A", border: "1px solid #262636", fontSize: 12, fontWeight: 700 },
};

export default function BrandPage() {
  return (
    <main dir="ltr" style={{ background: "radial-gradient(900px 480px at 85% -10%, rgba(124,92,255,.25), transparent 60%), #0B0B10", minHeight: "100vh" }}>
      <div style={S.page}>
        <a href="/" style={{ color: "#00D4A4", fontWeight: 700, textDecoration: "none" }}>← Back to the app</a>

        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap", marginTop: 22 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Souk Lens mark" width={92} height={92} style={{ borderRadius: 22 }} />
          <div>
            <h1 style={{ fontSize: 40, margin: 0, fontWeight: 900 }}>Souk Lens identity <span lang="ar">عدسة السوق</span></h1>
            <p style={{ ...S.p, margin: 0 }}><span dir="ltr" style={{ letterSpacing: 3, color: "#00D4A4", fontWeight: 700 }}>SEE IT · SELL IT · ANYWHERE</span></p>
          </div>
        </div>
        <p style={S.p}>
          The mark concept: <strong>a lens that found the gem</strong> — a lens ring holding an eastern souk arch,
          a stall baseline beneath it, and the gold dot is the precious item in the crowd.
          The violet → mint gradient runs from model intelligence to seller growth.
          The mark works at full strength in Arabic RTL and English LTR, from a 24px favicon to a 1200px cover.
        </p>

        <h2 style={S.h2}>Drawn logotype — the brand name as artwork</h2>
        <p style={S.p}>
          The name is <strong>drawn, not typed</strong>: custom monolinear letterforms authored as vector paths —
          no font dependency, identical on every screen and in every pitch deck. Both O's are lens rings,
          the SOUK O carries the gold gem at its core, and LENS runs violet → mint.
        </p>
        <div style={{ display: "grid", gap: 12 }}>
          <LogoCard src="/brand/wordmark.svg" label="Primary logotype — dark surfaces" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12 }}>
            <LogoCard src="/brand/wordmark-mono.svg" label="Mono logotype — light surfaces & print" light />
          </div>
        </div>

        <h2 style={S.h2}>Logo system</h2>
        <div style={{ display: "grid", gap: 12 }}>
          <LogoCard src="/brand/logo-horizontal-en.svg" label="English lockup — evolved mark + drawn wordmark" />
          <LogoCard src="/brand/logo-horizontal-ar.svg" label="Arabic lockup — mark right of the Arabic name in RTL" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12 }}>
            <LogoCard src="/logo.svg" label="App icon / favicon — evolved mark (sheen + sparkle)" />
            <LogoCard src="/brand/logo-mono.svg" label="Mono mark — print and documents" />
            <LogoCard src="/brand/logo-primary.svg" label="Primary (legacy path)" />
          </div>
          <LogoCard src="/brand/og-cover.svg" label="OG cover — sharing and pitch image 1200×630" />
        </div>

        <h2 style={S.h2}>Construction & usage</h2>
        <div style={{ ...S.card, lineHeight: 1.9 }}>
          <p style={{ margin: 0 }}>Clear space = the gold dot height on all sides · minimum width 24px · the color mark lives on dark backgrounds; on light backgrounds use the dark Mono version.</p>
          <p style={{ margin: 0 }}>Never: rotate the mark, change its gradient, detach the gold dot, or place the color logo on a light background.</p>
          <p style={{ margin: 0 }}>Direction: in RTL the mark leads from the right, in LTR from the left — the mark itself is never mirrored (arch and dot stay fixed).</p>
        </div>

        <h2 style={S.h2}>Colors</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12 }}>
          {SWATCH.map((s) => (
            <div key={s.c} style={{ background: "#14141D", borderRadius: 14, overflow: "hidden", border: "1px solid #262636" }}>
              <div style={{ height: 70, background: s.c }} />
              <div style={{ padding: 10, fontSize: 13, lineHeight: 1.9 }}>
                <strong>{s.n}</strong><br /><span style={{ opacity: 0.7 }}>{s.e}</span><br />
                <code dir="ltr">{s.c}</code>
              </div>
            </div>
          ))}
        </div>

        <h2 style={S.h2}>Typography & direction</h2>
        <div style={S.card}>
          <p dir="ltr" style={{ fontSize: 20, fontWeight: 700, margin: "0 0 6px", textAlign: "left", fontFamily: "'Inter',system-ui,sans-serif" }}>Inter — Latin UI, prices &amp; SKUs in English mode</p>
          <p lang="ar" dir="rtl" style={{ fontSize: 26, fontWeight: 800, margin: "0 0 6px", textAlign: "right" }}>Tajawal / Cairo — العربية أولًا في الوضع العربي</p>
          <p style={S.p}>Rule: alignment, arrows and sliders follow the logical direction (RTL/LTR) automatically, digits follow the UI language, and links plus JSON code stay LTR always.</p>
        </div>

        <h2 style={S.h2}>Generated brand imagery</h2>
        <p style={S.p}>Generated with <code dir="ltr">muse-image-1.0</code> via <code dir="ltr">scripts/gen-brand-images.mjs</code> — the vector logo stays the source of truth for sharpness; imagery is for backgrounds and empty states.</p>
        <div style={{ display: "grid", gap: 12 }}>
          <LogoCard src="/brand/hero-souq.jpg" label="Hero — app background" />
          <LogoCard src="/brand/empty-stall.jpg" label="Empty state" />
        </div>

        <h2 style={S.h2}>Voice & tone</h2>
        <p style={S.p}>Friendly Egyptian Arabic + simple global English. Short sentences, every action has a button, no technical jargon facing the seller — and real numbers and run timings facing the judges.</p>
        <p><span style={S.chip}>Brand v3 · drawn logotype · 2026</span></p>
      </div>
    </main>
  );
}

function LogoCard({ src, label, light }: { src: string; label: string; light?: boolean }) {
  return (
    <div style={{ background: "#14141D", borderRadius: 14, padding: 16, border: "1px solid #262636" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={label} style={{ maxWidth: "100%", borderRadius: 10, background: light ? "#F6F6F8" : "#0B0B10", padding: 12, boxSizing: "border-box" }} />
      <p style={{ opacity: 0.75, fontSize: 13, marginBottom: 0 }}>{label} — <code dir="ltr">{src}</code> · <a href={src} download style={{ color: "#00D4A4" }}>Download</a></p>
    </div>
  );
}
