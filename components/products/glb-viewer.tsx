"use client";
import { useEffect, useState } from "react";
import { Box } from "lucide-react";

const CDN = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js";

// Real 3D model viewer for a seller-provided .glb URL (true 3D, not AI-generated).
export function GlbViewer({ url, lang }: { url: string; lang: "ar" | "en" }) {
  const ar = lang === "ar";
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (customElements.get("model-viewer")) { setReady(true); return; }
    const s = document.createElement("script");
    s.src = CDN; s.type = "module"; s.async = true;
    s.onload = () => setReady(true);
    s.onerror = () => setReady(false);
    document.head.appendChild(s);
  }, [url]);
  if (!url) return null;
  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-2xl border bg-muted" style={{ minHeight: 280 }}>
        {ready ? (
          // model-viewer is a web component (no React types) — create it imperatively.
          <GlbElement url={url} />
        ) : (
          <div className="flex h-[280px] flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
            <Box className="h-8 w-8 text-accent" />
            {ar ? "تعذر تحميل العارض ثلاثي الأبعاد (يحتاج إنترنت) — افتح الملف مباشرة:" : "3D viewer failed to load (needs internet) — open the file directly:"}
            <a href={url} target="_blank" rel="noopener" className="font-bold text-accent underline" dir="ltr">{url.slice(0, 60)}…</a>
          </div>
        )}
      </div>
      <p className="text-[11px] leading-5 text-muted-foreground">{ar ? "مجسّم حقيقي (GLB) مرفوع من البائع — اسحب للتدوير وقرّب بعجلة الفأرة." : "A real seller-uploaded GLB model — drag to rotate, scroll to zoom."}</p>
    </div>
  );
}

function GlbElement({ url }: { url: string }) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!el) return;
    el.setAttribute("src", url);
    el.setAttribute("auto-rotate", "");
    el.setAttribute("camera-controls", "");
    el.setAttribute("ar", "");
    el.setAttribute("shadow-intensity", "1");
    el.setAttribute("style", "width:100%;height:320px;background:transparent");
  }, [el, url]);
  return <div ref={(d) => { if (d && !d.firstChild) { const m = document.createElement("model-viewer"); m.setAttribute("alt", "3D product model"); d.appendChild(m); setEl(m); } }} />;
}
