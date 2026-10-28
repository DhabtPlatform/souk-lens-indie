"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCheck, RotateCcw, SearchX } from "lucide-react";

export function ProductSkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden p-0">
          <Skeleton className="aspect-[4/3] rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" />
            <div className="flex gap-2"><Skeleton className="h-9 flex-1" /><Skeleton className="h-9 flex-1" /></div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function EmptyState({ lang, compact }: { lang: "ar" | "en"; compact?: boolean }) {
  const ar = lang === "ar";
  return (
    <Card className="flex flex-col items-center gap-3 border-dashed px-6 py-10 text-center animate-souk-in">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/empty-stall.jpg" alt="" className={compact ? "w-28 rounded-2xl" : "w-44 rounded-3xl"} />
      <h3 className="text-lg font-extrabold">{ar ? "لسه مفيش منتجات هنا" : "Nothing here yet"}</h3>
      <p className="max-w-md text-sm leading-7 text-muted-foreground">
        {ar ? "صوّر منتج، اتكلم عنه، الصق رابط، أو انقل متجرك — وكل نتيجة هتتحول لإعلان كامل بيتخزن بكل تفاصيله وصوره." : "Snap it, say it, paste a link, or import a store — every result becomes a full listing saved with all details and images."}
      </p>
    </Card>
  );
}

// Elegant no-result diagnosis: never end a run in silence. Shows what each
// stage actually found (real measured numbers) + why + what to try next.
export function NoResultDiagnosis({ lang, samCount, elapsedMs, live, onRetry }: {
  lang: "ar" | "en"; samCount: number; elapsedMs: number; live: boolean; onRetry: () => void;
}) {
  const ar = lang === "ar";
  return (
    <Card className="animate-souk-in space-y-4 border-gold/40 bg-gold/[0.04] p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/15"><SearchX className="h-5 w-5 text-gold" /></span>
        <div>
          <h3 className="text-lg font-black">{ar ? "لم نجد أصنافًا واضحة في هذه الصورة" : "No clear items found in this photo"}</h3>
          <p className="text-xs text-muted-foreground" dir="ltr">
            SAM 3.1: {samCount} {ar ? "مناطق" : "regions"} · Muse Spark: 0 {ar ? "إعلانات" : "listings"} · {(elapsedMs / 1000).toFixed(1)}s · {live ? "LIVE" : "Demo"}
          </p>
        </div>
      </div>
      <ul className="space-y-1.5 text-sm leading-7 text-muted-foreground">
        {(samCount === 0 ? [
          ar ? "الصورة ضبابية أو مظلمة أو بعيدة — قرّب من الفرشة وحسّن الإضاءة." : "Photo is blurry, dark, or too far — move closer to the stall with better light.",
        ] : [
          ar ? "عُزلت مناطق لكن لا يوجد صنف بيع واضح داخلها — قرّب من الصنف نفسه." : "Regions were isolated but hold no clear sellable item — get closer to the item itself.",
        ]).concat([
          ar ? "سمِّ الصنف في حقل «صنف معين» (طماطم، خيار) ليركز عليه النموذج." : "Name the item in “Specific item(s)” (tomato, cucumber) so the model focuses on it.",
          ar ? "أو جرّب صورة بسطة حقيقية من الأزرار الجاهزة — مضمونة الأصناف." : "Or try a ready real-stall photo — guaranteed items.",
        ]).map((t) => (
          <li key={t} className="flex gap-2"><span className="text-accent">•</span><span>{t}</span></li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onRetry}><RotateCcw className="me-1 h-4 w-4" />{ar ? "حاول مجددًا" : "Try again"}</Button>
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><CheckCheck className="h-3.5 w-3.5 text-accent" />{ar ? "لا تُحتسب أصناف وهمية — الصفر الحقيقي أفضل من رقم مخترع." : "No phantom items counted — a true zero beats an invented number."}</span>
      </div>
    </Card>
  );
}
