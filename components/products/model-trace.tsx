"use client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckCheck, CircleDashed, Cpu, Timer } from "lucide-react";

export type TraceStage = { model: string; role: string; ms?: number; live?: boolean; status?: string };
export type TraceInfo = { endpoint: string; live: boolean; elapsedMs: number; count: number; stages: TraceStage[] };

// API roles arrive in Arabic; judges read English — translate known strings, else show raw.
const ROLE_EN: Record<string, string> = {
  "Segmentation — عزل القطع": "Segmentation — isolate items",
  "عزل كل قطعة في الصورة": "Isolate every item in the photo",
  "تعرّف + تسعير + إعلان كامل": "Recognize + price + full listing",
  "تسعير محلي + إعلان كامل": "Local pricing + full listing",
  "صورة ستوديو نظيفة": "Clean studio shot",
  "صورة ستوديو نظيفة للمنتج الأول": "Clean studio shot for the first product",
  "قصّات حقيقية لكل منتج": "Real crop per product",
  "إعلان كامل من الوصف": "Full listing from the description",
  "صورة ستوديو": "Studio shot",
  "صوت → نص": "Speech → text",
  "إعلان كامل": "Full listing",
  "إعلان كامل من النص": "Full listing from the text",
  "بيانات الرابط الحقيقية OG/JSON-LD": "Real link data OG/JSON-LD",
  "مقارنة وبدائل وحكم": "Compare, alternatives & verdict",
  "مقارنة وبدائل وحكم نهائي": "Compare, alternatives & final verdict",
  "منتجات JSON-LD الحقيقية": "Real JSON-LD products",
  "إكمال إعلانات المتجر": "Complete the store listings",
  "فهم نية الشراء (عند توفر المفتاح)": "Understand buying intent (with key)",
  "فهم نية الشراء (حي مع المفتاح)": "Understand buying intent (live with key)",
  "قائمة ويب حقيقية بروابط متاجر": "Real web list with shop links",
  "تجميع الفاتورة": "Invoice totals",
  "ترتيب: تقييم × خصم × توصيل × ثقة بائع": "Rank: rating × discount × delivery × seller trust",
  "ترتيب: تقييم × خصم × توصيل × ثقة": "Rank: rating × discount × delivery × trust",
};

export function roleIn(lang: "ar" | "en", role: string) {
  if (lang === "en") return ROLE_EN[role] ?? role;
  return role;
}

export function ModelTrace({ trace, lang }: { trace: TraceInfo | null; lang: "ar" | "en" }) {
  const ar = lang === "ar";
  if (!trace) return null;
  return (
    <Card className="animate-souk-in overflow-hidden border-accent/30 bg-accent/5 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-2 font-extrabold"><Cpu className="h-4 w-4 text-accent" />{ar ? "إثبات تشغيل موديلات Meta" : "Meta model run proof"}</span>
        <Badge variant={trace.live ? "success" : "gold"}>{trace.live ? "LIVE · api.meta.ai/v1" : ar ? "Demo — نفس الـPipeline" : "Demo — same pipeline"}</Badge>
        <Badge variant="outline" dir="ltr">{trace.endpoint}</Badge>
        <span className="ms-auto flex items-center gap-1 text-xs font-bold text-muted-foreground"><Timer className="h-3.5 w-3.5" />{(trace.elapsedMs / 1000).toFixed(1)}s · {trace.count} {ar ? "منتج" : "products"}</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {trace.stages.map((s, i) => (
          <div key={s.model + i} className="relative rounded-xl border bg-card p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-black" dir="ltr">{s.model}</span>
              {s.status === "ok" || s.status?.startsWith("ok ") || !s.status ? <CheckCheck className="h-4 w-4 text-accent" /> : <CircleDashed className="h-4 w-4 text-muted-foreground" />}
            </div>
            <p className="mt-1 text-[11px] leading-5 text-muted-foreground" dir="auto">{roleIn(lang, s.role)}</p>
            <p className="mt-1 text-[11px] font-bold text-accent" dir="ltr">{typeof s.ms === "number" ? `${s.ms} ms` : s.status ?? "done"}</p>
            {i < trace.stages.length - 1 ? <span className="flip-dir absolute -end-2 top-1/2 z-10 hidden -translate-y-1/2 text-muted-foreground sm:block">→</span> : null}
          </div>
        ))}
      </div>
    </Card>
  );
}

export const STAGE_PRESETS: Record<string, TraceStage[]> = {
  "/api/lens": [
    { model: "sam-3.1", role: "Segmentation — عزل القطع" },
    { model: "muse-spark-1.3", role: "تعرّف + تسعير + إعلان كامل" },
    { model: "muse-image-1.0", role: "صورة ستوديو نظيفة" },
  ],
  "/api/generate": [
    { model: "muse-spark-1.3", role: "إعلان كامل من الوصف" },
    { model: "muse-image-1.0", role: "صورة ستوديو" },
  ],
  "/api/voice-listing": [
    { model: "muse-voice", role: "صوت → نص" },
    { model: "muse-spark-1.3", role: "إعلان كامل" },
    { model: "muse-image-1.0", role: "صورة ستوديو" },
  ],
  "/api/compare": [
    { model: "page fetch", role: "بيانات الرابط الحقيقية OG/JSON-LD" },
    { model: "muse-spark-1.3 + web_search", role: "مقارنة وبدائل وحكم" },
  ],
  "/api/import": [
    { model: "page fetch", role: "منتجات JSON-LD الحقيقية" },
    { model: "muse-spark-1.3", role: "إكمال إعلانات المتجر" },
  ],
  "/api/smart-market": [
    { model: "muse-spark-1.3", role: "فهم نية الشراء (عند توفر المفتاح)" },
    { model: "souk ranker", role: "ترتيب: تقييم × خصم × توصيل × ثقة بائع" },
  ],
};
