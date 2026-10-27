"use client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Gavel, Quote, ScanEye, Sparkles, Store } from "lucide-react";

// A clearly-labeled illustrative seller journey (scenario, not a paid testimonial).
// Judges see the full loop: messy stall -> SAM -> listing -> studio -> auction/smart sale.
const STEPS = [
  { icon: <Camera />, ar: "يصوّر الفرشة بهاتفه", en: "Snaps the stall with his phone", sec: "0:00" },
  { icon: <ScanEye />, ar: "SAM يعزل كل قطعة", en: "SAM isolates every item", sec: "0:10" },
  { icon: <Sparkles />, ar: "إعلان كامل بسعر محلي", en: "Full listing, local price", sec: "0:25" },
  { icon: <Store />, ar: "ينشر ويبيع: ثابت، مزاد، بث أو حملة", en: "Sells: fixed, auction, live or campaign", sec: "0:60" },
];

export function SellerStory({ lang }: { lang: "ar" | "en" }) {
  const ar = lang === "ar";
  return (
    <Card className="animate-souk-in mt-5 overflow-hidden">
      <div className="grid md:grid-cols-[300px_1fr]">
        <div className="relative min-h-44">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/hero-souq.jpg" alt="market stall" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <Badge variant="gold">{ar ? "قصة عرض توضيحية" : "Illustrative demo story"}</Badge>
            <p className="mt-1.5 text-sm font-extrabold leading-6 text-white">{ar ? "بائع سوق غير رسمي — من فرشة فوضوية لمتجر بيبيع" : "An informal-market seller — from messy stall to a selling store"}</p>
          </div>
        </div>
        <div>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg"><Quote className="text-primary" />{ar ? "رحلة البائع في دقيقة" : "The seller journey in a minute"}</CardTitle>
            <CardDescription>
              {ar ? "سيناريو توضيحي مبني على قدرات حقيقية في التطبيق — مش شهادة عميل مدفوعة. كل خطوة تحت تقدر تنفذها بنفسك من التبويبات." : "An illustrative scenario built on real in-app capabilities — not a paid testimonial. You can run every step yourself from the tabs."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-4">
              {STEPS.map((s, i) => (
                <div key={i} className="relative rounded-xl border bg-card p-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary [&_svg]:h-4.5 [&_svg]:w-4.5">{s.icon}</span>
                  <p className="mt-2 text-[13px] font-bold leading-6">{ar ? s.ar : s.en}</p>
                  <span className="text-[11px] font-black text-accent" dir="ltr">{s.sec}</span>
                  {i < STEPS.length - 1 ? <span className="flip-dir absolute -end-2 top-5 z-10 hidden text-muted-foreground sm:block">→</span> : null}
                </div>
              ))}
            </div>
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-accent/10 p-3 text-sm leading-7">
              <Gavel className="mt-1 h-4 w-4 shrink-0 text-accent" />
              {ar ? "«أنا مبعرفش أكتب إعلانات ولا أصوّر حلو. صوّرت الفرشة، وهو عمل الباقي — وبعت أول قطعة من المزاد.» — صوت البائع في سيناريو العرض، وهدفه إن أي بائع يقدر يعمل نفس الرحلة من غير ما يقرأ كلمة تقنية." : "“I can't write ads or shoot well. I snapped the stall, it did the rest — and my first piece sold at auction.” — the seller's voice in this demo scenario; the point is any seller can take the same journey without reading a single technical word."}
            </p>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}
