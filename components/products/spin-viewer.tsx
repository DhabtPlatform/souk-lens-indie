"use client";
import { useRef, useState } from "react";
import { Rotate3D } from "lucide-react";

// Interactive 360° viewer over AI multi-angle shots: drag (or swipe) to rotate.
export function SpinViewer({ images, lang, label }: { images: string[]; lang: "ar" | "en"; label: string }) {
  const ar = lang === "ar";
  const [idx, setIdx] = useState(0);
  const startX = useRef<number | null>(null);
  const startIdx = useRef(0);
  if (!images.length) return null;
  const n = images.length;

  function onDown(x: number) { startX.current = x; startIdx.current = idx; }
  function onMove(x: number) {
    if (startX.current === null) return;
    const dx = x - startX.current;
    const step = Math.trunc(dx / 40);
    if (step !== 0) { setIdx(((startIdx.current + step) % n + n) % n); startX.current = x; startIdx.current = ((startIdx.current + step) % n + n) % n; }
  }
  function onUp() { startX.current = null; }

  return (
    <div className="space-y-2">
      <div
        className="relative aspect-[4/3] cursor-grab touch-none select-none overflow-hidden rounded-2xl border bg-muted active:cursor-grabbing"
        onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); onDown(e.clientX); }}
        onPointerMove={(e) => onMove(e.clientX)}
        onPointerUp={onUp} onPointerCancel={onUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[idx]} alt={label} className="h-full w-full object-cover" draggable={false} />
        <span className="absolute start-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
          <Rotate3D className="h-3.5 w-3.5" />{ar ? "اسحب للتدوير" : "Drag to rotate"} · {idx + 1}/{n}
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {images.map((src, i) => (
          <button key={src + i} type="button" onClick={() => setIdx(i)} aria-label={`angle ${i + 1}`}
            className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 min-h-11 min-w-11" style={{ borderColor: i === idx ? "#00d4a4" : "transparent" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>
      <p className="text-[11px] leading-5 text-muted-foreground">{ar ? "زوايا مولدة بالذكاء (Muse Image) من اسم المنتج — للعرض والتقريب، وليست مسحًا ثلاثي الأبعاد حقيقيًا." : "AI-generated angles (Muse Image) from the product name — for display, not a true 3D scan."}</p>
    </div>
  );
}
