"use client";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { TraceInfo } from "@/components/products/model-trace";
import { avgSeconds, readRunStats, type RunStats } from "@/lib/run-stats";
import { Cpu, Gauge, PackageCheck, Timer, TrendingUp } from "lucide-react";

// Honest impact numbers: the pipeline time is measured live from real runs on this
// device (persisted across visits); the manual baseline is explicitly labeled as a
// seller estimate, never as measured data.
export function ImpactStrip({ trace, savedCount, lang }: { trace: TraceInfo | null; savedCount: number; lang: "ar" | "en" }) {
  const ar = lang === "ar";
  const [stats, setStats] = useState<RunStats>({ runs: 0, listings: 0, totalMs: 0 });
  useEffect(() => { setStats(readRunStats()); }, [trace]);
  const measuredSec = trace ? trace.elapsedMs / 1000 : avgSeconds(stats);
  const manualMidSec = 17.5 * 60; // midpoint of the labeled 15–20 min estimate
  const speedup = measuredSec ? Math.max(1, Math.round(manualMidSec / measuredSec)) : null;
  const samMs = trace?.stages.find((s) => s.model.includes("sam"))?.ms;
  const sparkMs = trace?.stages.find((s) => s.model.includes("spark"))?.ms;
  const imageMs = trace?.stages.find((s) => s.model.includes("image"))?.ms;

  return (
    <Card className="animate-souk-in mt-5 overflow-hidden border-gold/30 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-2 font-extrabold"><Gauge className="h-4 w-4 text-[#ffd166]" />{ar ? "الأثر بالأرقام" : "Impact in numbers"}</span>
        <Badge variant={measuredSec ? "success" : "gold"}>{measuredSec ? (ar ? `مقاس فعليًا على هذا الجهاز — ${stats.runs} ${stats.runs === 1 ? "تشغيل" : "تشغيلات"}` : `Measured on this device — ${stats.runs} run${stats.runs === 1 ? "" : "s"}`) : (ar ? "شغّل الديمو وشوف الرقم الحقيقي" : "Run the demo to measure live")}</Badge>
        {trace ? <Badge variant="outline" dir="ltr">{trace.live ? "LIVE" : "DEMO"} · {trace.endpoint}</Badge> : null}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Metric icon={<Timer />} label={ar ? "زمن Souk Lens (مقاس)" : "Souk Lens time (measured)"}
          value={measuredSec ? `${measuredSec.toFixed(1)}s` : "—"}
          sub={trace && (samMs || sparkMs || imageMs) ? `SAM ${samMs ?? "—"}ms · Spark ${sparkMs ?? "—"}ms · Image ${imageMs ?? "—"}ms` : stats.runs ? (ar ? `${stats.runs} ${stats.runs === 1 ? "تشغيل" : "تشغيلات"} · ${stats.listings} ${stats.listings === 1 ? "إعلان" : "إعلانات"} على هذا الجهاز` : `${stats.runs} run${stats.runs === 1 ? "" : "s"} · ${stats.listings} listing${stats.listings === 1 ? "" : "s"} on this device`) : (ar ? "لسه مفيش تشغيل" : "No run yet")} accent />
        <Metric icon={<Timer />} label={ar ? "زمن يدوي (تقدير سوقي)" : "Manual time (market estimate)"}
          value={ar ? "15–20 د" : "15–20 min"}
          sub={ar ? "تصوير + كتابة + تسعير يدوي — تقدير للتوضيح مش قياس" : "Shoot + write + price by hand — estimate, not measured"} />
        <Metric icon={<TrendingUp />} label={ar ? "التسريع" : "Speedup"}
          value={speedup ? `×${speedup}` : "—"}
          sub={ar ? "مبني على زمن مقاس فعليًا على هذا الجهاز" : "Based on time actually measured on this device"} accent />
        <Metric icon={<PackageCheck />} label={ar ? "منتجات كاملة محفوظة" : "Full listings saved"}
          value={String(savedCount)}
          sub={ar ? "صور + أسعار + متغيرات + مواصفات + SEO" : "Images + prices + variants + specs + SEO"} />
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Cpu className="h-3.5 w-3.5" />
        {ar ? "3 موديلات Meta في Pipeline واحد: sam-3.1 يعزل، muse-spark-1.3 يسعّر ويكتب، muse-image-1.0 ينظّف الصورة — وكل تشغيلة بتتوسم Live أو Demo بصراحة." : "Three Meta models in one pipeline: sam-3.1 segments, muse-spark-1.3 prices & writes, muse-image-1.0 cleans the shot — every run is labeled Live or Demo honestly."}
      </p>
    </Card>
  );
}

function Metric({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border bg-card p-3 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground"><span className="text-primary [&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>{label}</div>
      <div className={`mt-1 text-2xl font-black ${accent ? "text-accent" : ""}`} dir="ltr">{value}</div>
      <div className="text-[11px] leading-5 text-muted-foreground" dir="auto">{sub}</div>
    </div>
  );
}
