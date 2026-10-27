"use client";
import { useState } from "react";
import { Label } from "@/components/ui/label";

// Before/After slider: original market shot vs Muse Image studio shot.
export function StudioCompare({ before, after, lang }: { before: string; after: string; lang: "ar" | "en" }) {
  const ar = lang === "ar";
  const rtl = ar;
  const [pos, setPos] = useState(55);
  if (!before || !after || before === after) return null;
  // Studio shot reveals from the inline-start edge (right in RTL, left in LTR).
  const clip = rtl ? `inset(0 0 0 ${100 - pos}%)` : `inset(0 ${100 - pos}% 0 0)`;
  const handlePos = rtl ? { right: `${pos}%`, transform: "translate(50%,-50%)" } : { left: `${pos}%`, transform: "translate(-50%,-50%)" };
  return (
    <div className="space-y-2">
      <div className="relative aspect-[4/3] select-none overflow-hidden rounded-2xl border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={before} alt="original" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={after} alt="studio" className="absolute inset-0 h-full w-full object-cover" style={{ clipPath: clip }} draggable={false} />
        <div className="absolute inset-y-0 z-10 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,.6)]" style={rtl ? { right: `${pos}%` } : { left: `${pos}%` }}>
          <span className="absolute top-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-black text-black shadow-lg" style={handlePos}>↔</span>
        </div>
        <span className="absolute start-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">{ar ? "ستوديو Muse Image" : "Muse Image studio"}</span>
        <span className="absolute end-2 top-2 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">{ar ? "الأصل من السوق" : "Original market shot"}</span>
      </div>
      <div className="flex items-center gap-3">
        <Label className="shrink-0 text-xs">{ar ? "قارن قبل/بعد" : "Compare before/after"}</Label>
        <input type="range" min={5} max={95} value={pos} onChange={(e) => setPos(Number(e.target.value))} className="h-11 w-full accent-[#00d4a4]" aria-label="before after slider" />
      </div>
    </div>
  );
}
