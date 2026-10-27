"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Detection } from "@/lib/extract";
import type { Product } from "@/lib/product";
import { formatPrice } from "@/lib/utils";
import { ScanEye } from "lucide-react";

const COLORS = ["#7c5cff", "#00d4a4", "#ffd166", "#ff7ab6", "#38bdf8", "#fb923c"];

export function SamOverlay({ image, detections, products, lang, onDetails }: {
  image: string; detections: Detection[]; products: Product[]; lang: "ar" | "en"; onDetails: (p: Product) => void;
}) {
  const ar = lang === "ar";
  const [active, setActive] = useState(0);
  if (!detections.length || !image) return null;
  const isSam = detections[0]?.source === "sam";
  const productFor = (i: number) => products[i] ?? products.find((p) => p.name_en.toLowerCase().includes(detections[i].label.toLowerCase().split(" ")[0])) ?? null;

  return (
    <Card className="animate-souk-in overflow-hidden border-primary/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
          <ScanEye className="text-primary" />{ar ? "خريطة SAM 3.1 — اضغط على أي قطعة" : "SAM 3.1 map — tap any item"}
          <Badge variant={isSam ? "success" : "gold"}>{isSam ? "SAM 3.1 · Live boxes" : ar ? "مواضع تقديرية للعرض" : "Estimated demo positions"}</Badge>
          <Badge variant="secondary">{detections.length} {ar ? "قطعة" : "items"}</Badge>
        </CardTitle>
        <CardDescription>{ar ? "كل مربع ملوّن = منتج عزله SAM وبنى Spark إعلانه. اضغط المربع أو اسمه تحت لفتح الإعلان الكامل." : "Each colored box is an item SAM isolated and Spark listed. Tap the box or its chip for the full listing."}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative overflow-hidden rounded-2xl border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="SAM segmentation" className="max-h-[420px] w-full object-cover" />
          {detections.map((d, i) => {
            const [x1, y1, x2, y2] = d.box;
            const c = COLORS[i % COLORS.length];
            const p = productFor(i);
            return (
              <button key={i} type="button" aria-label={d.label}
                onMouseEnter={() => setActive(i)} onClick={() => { setActive(i); if (p) onDetails(p); }}
                className="group absolute transition-all duration-200"
                style={{ left: `${x1 * 100}%`, top: `${y1 * 100}%`, width: `${(x2 - x1) * 100}%`, height: `${(y2 - y1) * 100}%`, border: `2.5px solid ${c}`, background: active === i ? `${c}38` : `${c}14`, borderRadius: 12, boxShadow: active === i ? `0 0 0 4px ${c}30, 0 10px 30px -10px ${c}` : undefined, zIndex: active === i ? 3 : 2 }}>
                <span className="absolute -top-3 start-2 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-black text-black shadow" style={{ background: c }}>{i + 1}</span>
                <span className="absolute inset-x-1 bottom-1 truncate rounded-md bg-black/65 px-1.5 py-0.5 text-start text-[10px] font-bold text-white opacity-0 backdrop-blur transition group-hover:opacity-100" style={{ opacity: active === i ? 1 : undefined }}>{d.label}{p ? ` · ${formatPrice(p.price, p.currency)}` : ""}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {detections.map((d, i) => {
            const p = productFor(i);
            return (
              <button key={i} type="button" onMouseEnter={() => setActive(i)} onClick={() => p && onDetails(p)}
                className={`min-h-11 rounded-full border px-3 py-1.5 text-xs font-bold transition active:scale-[.97] ${active === i ? "text-black" : "bg-card hover:border-primary/50"}`}
                style={active === i ? { background: COLORS[i % COLORS.length], borderColor: "transparent" } : undefined}>
                {i + 1}. {ar && p ? p.name_ar : d.label}{p ? ` — ${formatPrice(p.price, p.currency)}` : ""}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
