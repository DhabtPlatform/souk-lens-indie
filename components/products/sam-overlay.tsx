"use client";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Detection } from "@/lib/extract";
import type { Product } from "@/lib/product";
import { formatPrice } from "@/lib/utils";
import { PencilLine, ScanEye, ScanSearch, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#7c5cff", "#00d4a4", "#ffd166", "#ff7ab6", "#38bdf8", "#fb923c"];

// Crop a normalized box from the displayed photo into a data URL for
// re-analysis. Null when the pixels are unreadable (tainted remote image).
function cropBox(img: HTMLImageElement | null, box: Detection["box"]): string | null {
  try {
    if (!img || !img.naturalWidth) return null;
    const [x1, y1, x2, y2] = box;
    const sx = Math.max(0, Math.floor(Math.min(x1, x2) * img.naturalWidth));
    const sy = Math.max(0, Math.floor(Math.min(y1, y2) * img.naturalHeight));
    const sw = Math.min(img.naturalWidth - sx, Math.ceil((Math.abs(x2 - x1)) * img.naturalWidth));
    const sh = Math.min(img.naturalHeight - sy, Math.ceil((Math.abs(y2 - y1)) * img.naturalHeight));
    if (sw < 8 || sh < 8) return null;
    const c = document.createElement("canvas");
    c.width = Math.min(sw, 900); c.height = Math.min(sh, 900);
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.85);
  } catch {
    return null;
  }
}

export function SamOverlay({ image, detections, products, lang, onDetails, onInspectBox, onRemoveBox, onMoveBox }: {
  image: string; detections: Detection[]; products: Product[]; lang: "ar" | "en"; onDetails: (p: Product) => void;
  onInspectBox: (crop: string, name: string) => void;
  onRemoveBox: (i: number) => void;
  onMoveBox: (i: number, box: Detection["box"]) => void;
}) {
  const ar = lang === "ar";
  const [active, setActive] = useState(0);
  const [correctName, setCorrectName] = useState("");
  const [adjust, setAdjust] = useState(false);
  const [dragBox, setDragBox] = useState<Detection["box"] | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const dragId = useRef<number | null>(null);
  const dragStart = useRef<{ x: number; y: number; box: Detection["box"] } | null>(null);
  if (!detections.length || !image) return null;
  const isSam = detections[0]?.source === "sam";
  const productFor = (i: number) => products[i] ?? products.find((p) => p.name_en.toLowerCase().includes(detections[i].label.toLowerCase().split(" ")[0])) ?? null;
  const d = detections[Math.min(active, detections.length - 1)];
  const p = productFor(Math.min(active, detections.length - 1));

  function inspect(name: string) {
    const crop = cropBox(imgRef.current, d.box);
    if (!crop) { toast.error(ar ? "تعذّر قصّ المنطقة من هذه الصورة — جرّب رفعها من جهازك" : "Could not crop this photo — try uploading it from your device"); return; }
    onInspectBox(crop, name.trim());
    setCorrectName("");
  }

  return (
    <Card className="animate-souk-in overflow-hidden border-primary/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
          <ScanEye className="text-primary" />{ar ? "خريطة SAM 3.1 — اضغط على أي قطعة" : "SAM 3.1 map — tap any item"}
          <Badge variant={isSam ? "success" : "gold"}>{isSam ? "SAM 3.1 · Live boxes" : ar ? "مواضع تقديرية للعرض" : "Estimated demo positions"}</Badge>
          <Badge variant="secondary">{detections.length} {ar ? "قطعة" : "items"}</Badge>
          <Button size="sm" variant={adjust ? "default" : "outline"} onClick={() => setAdjust((v) => !v)} className="ms-auto">
            <Settings2 className="me-1 h-3.5 w-3.5" />{ar ? "ضبط المربعات" : "Adjust boxes"}
          </Button>
        </CardTitle>
        <CardDescription>{ar ? "كل مربع ملوّن = منتج عزله SAM وبنى Spark إعلانه. اضغط المربع أو اسمه تحت لفتح الإعلان الكامل." : "Each colored box is an item SAM isolated and Spark listed. Tap the box or its chip for the full listing."}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          ref={wrapRef}
          className="relative overflow-hidden rounded-2xl border bg-muted"
          style={{ touchAction: adjust ? "none" : undefined }}
          onPointerMove={(e) => {
            if (!adjust || dragId.current === null || !wrapRef.current || !dragStart.current) return;
            const r = wrapRef.current.getBoundingClientRect();
            const st = dragStart.current;
            const dx = (e.clientX - st.x) / r.width;
            const dy = (e.clientY - st.y) / r.height;
            const [x1, y1, x2, y2] = st.box;
            const w = x2 - x1, h = y2 - y1;
            const nx1 = Math.min(Math.max(0, x1 + dx), 1 - w);
            const ny1 = Math.min(Math.max(0, y1 + dy), 1 - h);
            setDragBox([nx1, ny1, nx1 + w, ny1 + h]);
          }}
          onPointerUp={() => {
            if (adjust && dragId.current !== null && dragBox) onMoveBox(dragId.current, dragBox);
            dragId.current = null; dragStart.current = null; setDragBox(null);
          }}
          onPointerCancel={() => { dragId.current = null; dragStart.current = null; setDragBox(null); }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imgRef} src={image} alt="SAM segmentation" crossOrigin="anonymous" className="max-h-[420px] w-full object-cover" />
          {detections.map((d, i) => {
            const [x1, y1, x2, y2] = (adjust && dragId.current === i && dragBox) ? dragBox : d.box;
            const c = COLORS[i % COLORS.length];
            const p = productFor(i);
            return (
              <button key={i} type="button" aria-label={d.label}
                onMouseEnter={() => setActive(i)}
                onPointerDown={(e) => { if (adjust) { dragId.current = i; dragStart.current = { x: e.clientX, y: e.clientY, box: d.box }; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); } }}
                onClick={() => { if (adjust) { setActive(i); return; } setActive(i); if (p) onDetails(p); }}
                className="group absolute transition-all duration-200" style={{ cursor: adjust ? "move" : undefined, left: `${x1 * 100}%`, top: `${y1 * 100}%`, width: `${(x2 - x1) * 100}%`, height: `${(y2 - y1) * 100}%`, border: `2.5px solid ${c}`, background: active === i ? `${c}38` : `${c}14`, borderRadius: 12, boxShadow: active === i ? `0 0 0 4px ${c}30, 0 10px 30px -10px ${c}` : undefined, zIndex: active === i ? 3 : 2 }}>
                <span className="absolute -top-3 start-2 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-black text-black shadow" style={{ background: c }}>{p?.boxId ?? i + 1}</span>
                <span
                  role="button" aria-label={ar ? "حذف المربع" : "Delete box"} tabIndex={0}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onRemoveBox(i); }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onRemoveBox(i); } }}
                  className="absolute -top-3 end-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-[13px] font-black text-white backdrop-blur transition hover:bg-red-500"
                >×</span>
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
        {/* Human-in-the-loop: inspect or correct the active box */}
        <div className="space-y-2 rounded-2xl border border-primary/30 bg-primary/[0.04] p-3">
          <p className="text-xs font-extrabold" dir="auto">
            {ar ? `المربع ${Math.min(active, detections.length - 1) + 1}: ${d.label}` : `Box ${Math.min(active, detections.length - 1) + 1}: ${d.label}`}
            {p ? ` · ${formatPrice(p.price, p.currency)}` : ""}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button size="sm" variant="outline" onClick={() => inspect(d.label)}>
              <ScanSearch className="me-1 h-3.5 w-3.5" />{ar ? "حلّل هذه المنطقة وحدها" : "Analyze this region alone"}
            </Button>
            <div className="flex flex-1 gap-2">
              <Input value={correctName} onChange={(e) => setCorrectName(e.target.value)} placeholder={ar ? "ليس صحيحًا؟ اكتب الاسم الصحيح…" : "Wrong? Type the right name…"} className="h-9" />
              <Button size="sm" disabled={!correctName.trim()} onClick={() => inspect(correctName)}>
                <PencilLine className="me-1 h-3.5 w-3.5" />{ar ? "صحّح وحلّل" : "Correct & analyze"}
              </Button>
            </div>
          </div>
          <p className="text-[11px] leading-5 text-muted-foreground">{ar ? "المنطقة تُقص من صورتك وتُحلل كصورة جديدة بالاسم الذي تكتبه — أنت تصحح الذكاء." : "The region is cropped from your photo and analyzed as a new image under the name you type — you correct the AI."}</p>
        </div>
      </CardContent>
    </Card>
  );
}
