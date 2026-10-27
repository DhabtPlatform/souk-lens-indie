"use client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
      <img src="/brand/empty-stall.png" alt="" className={compact ? "w-28 rounded-2xl" : "w-44 rounded-3xl"} />
      <h3 className="text-lg font-extrabold">{ar ? "لسه مفيش منتجات هنا" : "Nothing here yet"}</h3>
      <p className="max-w-md text-sm leading-7 text-muted-foreground">
        {ar ? "صوّر منتج، اتكلم عنه، الصق رابط، أو انقل متجرك — وكل نتيجة هتتحول لإعلان كامل بيتخزن بكل تفاصيله وصوره." : "Snap it, say it, paste a link, or import a store — every result becomes a full listing saved with all details and images."}
      </p>
    </Card>
  );
}
