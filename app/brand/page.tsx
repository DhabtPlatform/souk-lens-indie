import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brand — Souk Lens عدسة السوق",
  description: "Souk Lens brand identity: logo system, colors, typography, RTL/LTR usage.",
};

const SWATCH = [
  { n: "Primary Violet", ar: "بنفسجي الابتكار", e: "AI / innovation", c: "#7C5CFF", dark: true },
  { n: "Accent Mint", ar: "نعناعي النمو", e: "Trust / growth / price", c: "#00D4A4", dark: false },
  { n: "Discovery Gold", ar: "ذهبي الاكتشاف", e: "The gem the lens found", c: "#FFD166", dark: false },
  { n: "Ink", ar: "الحبر", e: "Text on dark", c: "#F6F6F8", dark: false },
  { n: "Card", ar: "السطح", e: "Surfaces", c: "#16161D", dark: true },
  { n: "Base", ar: "الخلفية", e: "Background", c: "#0B0B10", dark: true },
];

const S: Record<string, React.CSSProperties> = {
  page: { maxWidth: 980, margin: "0 auto", padding: "28px 20px 60px", fontFamily: "'Tajawal','Cairo','Inter','Segoe UI',system-ui,sans-serif", color: "#F6F6F8" },
  h2: { fontSize: 24, margin: "38px 0 12px", fontWeight: 800 },
  p: { opacity: 0.78, lineHeight: 2, margin: "6px 0" },
  card: { background: "#14141D", border: "1px solid #262636", borderRadius: 16, padding: 18 },
  chip: { display: "inline-block", padding: "4px 12px", borderRadius: 99, background: "#1E1E2A", border: "1px solid #262636", fontSize: 12, fontWeight: 700 },
};

export default function BrandPage() {
  return (
    <main dir="rtl" style={{ background: "radial-gradient(900px 480px at 85% -10%, rgba(124,92,255,.25), transparent 60%), #0B0B10", minHeight: "100vh" }}>
      <div style={S.page}>
        <a href="/" style={{ color: "#00D4A4", fontWeight: 700, textDecoration: "none" }}>→ عودة للتطبيق</a>

        <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap", marginTop: 22 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Souk Lens mark" width={92} height={92} style={{ borderRadius: 22 }} />
          <div>
            <h1 style={{ fontSize: 40, margin: 0, fontWeight: 900 }}>هوية Souk Lens</h1>
            <p style={{ ...S.p, margin: 0 }}>عدسة السوق · <span dir="ltr" style={{ letterSpacing: 3, color: "#00D4A4", fontWeight: 700 }}>SEE IT · SELL IT · ANYWHERE</span></p>
          </div>
        </div>
        <p style={S.p}>
          فكرة العلامة: <strong>عدسة وجدت الجوهرة</strong> — حلقة عدسة تحتضن قوس سوق شرقي، تحتها خط الفرشة،
          والنقطة الذهبية هي القطعة الثمينة وسط الزحمة. التدرج بنفسجي ← نعناعي = من ذكاء الموديل لنمو البائع.
          العلامة تعمل بنفس القوة عربي RTL وإنجليزي LTR، من 24px فافيكون لغطاء عرض 1200px.
        </p>

        <h2 style={S.h2}>نظام الشعار</h2>
        <div style={{ display: "grid", gap: 12 }}>
          <LogoCard src="/brand/logo-horizontal-ar.svg" label="Arabic lockup — الشعار الأفقي العربي (العلامة يمين النص في RTL)" />
          <LogoCard src="/brand/logo-horizontal-en.svg" label="English lockup — الشعار الأفقي الإنجليزي (العلامة يسار النص في LTR)" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 12 }}>
            <LogoCard src="/logo.svg" label="App icon / favicon" />
            <LogoCard src="/brand/logo-mono.svg" label="Mono — طباعة ومستندات" />
            <LogoCard src="/brand/logo-primary.svg" label="Primary (legacy path)" />
          </div>
          <LogoCard src="/brand/og-cover.svg" label="OG cover — صورة المشاركة والعروض 1200×630" />
        </div>

        <h2 style={S.h2}>البناء والاستخدام</h2>
        <div style={{ ...S.card, lineHeight: 2.1 }}>
          <p style={{ margin: 0 }}>مساحة الأمان = ارتفاع النقطة الذهبية من كل الجهات · الحد الأدنى للعرض 24px · العلامة على الداكن دائمًا، وعلى الفاتح تُستخدم نسخة Mono الداكنة.</p>
          <p style={{ margin: 0 }}>ممنوع: تدوير العلامة، تغيير التدرج، فصل النقطة الذهبية، أو وضع الشعار الملون على خلفية فاتحة.</p>
          <p style={{ margin: 0 }}>الاتجاه: في RTL تسبق العلامة النص من اليمين، وفي LTR من اليسار — بدون قلب العلامة نفسها أبدًا (القوس والنقطة ثابتان).</p>
        </div>

        <h2 style={S.h2}>الألوان</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 12 }}>
          {SWATCH.map((s) => (
            <div key={s.c} style={{ background: "#14141D", borderRadius: 14, overflow: "hidden", border: "1px solid #262636" }}>
              <div style={{ height: 70, background: s.c }} />
              <div style={{ padding: 10, fontSize: 13, lineHeight: 1.9 }}>
                <strong>{s.n}</strong><br /><span style={{ opacity: 0.7 }}>{s.ar} · {s.e}</span><br />
                <code dir="ltr">{s.c}</code>
              </div>
            </div>
          ))}
        </div>

        <h2 style={S.h2}>الخطوط والاتجاه</h2>
        <div style={S.card}>
          <p style={{ fontSize: 26, fontWeight: 800, margin: "0 0 6px" }}>Tajawal / Cairo — العربية أولًا بوزن 800 للعناوين</p>
          <p dir="ltr" style={{ fontSize: 20, fontWeight: 700, margin: "0 0 6px", textAlign: "left", fontFamily: "'Inter',system-ui,sans-serif" }}>Inter — Latin UI, prices &amp; SKUs in English mode</p>
          <p style={S.p}>القاعدة: المحاذاة والأسهم والانزلاقات تتبع الاتجاه المنطقي (RTL/LTR) تلقائيًا، والأرقام تتبع لغة الواجهة، والروابط وأكواد JSON تبقى LTR دائمًا.</p>
        </div>

        <h2 style={S.h2}>صور العلامة المولدة</h2>
        <p style={S.p}>مولدة بـ <code dir="ltr">muse-image-1.0</code> عبر <code dir="ltr">scripts/gen-brand-images.mjs</code> — الشعار المتجه يبقى الأصل للدقة، والصور للخلفيات والحالات الفارغة.</p>
        <div style={{ display: "grid", gap: 12 }}>
          <LogoCard src="/brand/hero-souq.png" label="Hero — خلفية التطبيق" />
          <LogoCard src="/brand/empty-stall.png" label="Empty state" />
        </div>

        <h2 style={S.h2}>نبرة الصوت</h2>
        <p style={S.p}>مصري ودود + إنجليزي بسيط عالمي. جمل قصيرة، كل فعل له زر، لا مصطلحات تقنية في وجه البائع — وفي وجه الحكام: أرقام وزمن تشغيل حقيقي.</p>
        <p><span style={S.chip}>Brand v2 · 2026</span></p>
      </div>
    </main>
  );
}

function LogoCard({ src, label }: { src: string; label: string }) {
  return (
    <div style={{ background: "#14141D", borderRadius: 14, padding: 16, border: "1px solid #262636" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={label} style={{ maxWidth: "100%", borderRadius: 10, background: "#0B0B10", padding: 12, boxSizing: "border-box" }} />
      <p style={{ opacity: 0.75, fontSize: 13, marginBottom: 0 }}>{label} — <code dir="ltr">{src}</code> · <a href={src} download style={{ color: "#00D4A4" }}>تنزيل</a></p>
    </div>
  );
}
