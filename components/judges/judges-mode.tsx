"use client";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Bot, Camera, CheckCheck, ChevronLeft, ChevronRight, Package, Pause, Play, RotateCcw, ShoppingCart, Trophy } from "lucide-react";

export type JudgeAction = "demo" | "smart" | "save" | "mine" | "cart";

const STEPS: { time: string; icon: React.ReactNode; ar: string; en: string; sayAr: string; sayEn: string; action?: JudgeAction; actionAr?: string; actionEn?: string }[] = [
  { time: "0–10s", icon: <Trophy />, ar: "الوعد في جملة", en: "The promise in one line", sayAr: "Souk Lens منصة سوق كاملة للأسواق غير الرسمية: من صورة فرشة واحدة إلى إعلان ومزاد وسوق ذكي ودفع.", sayEn: "Souk Lens is a complete market platform for informal markets: from one stall photo to listing, auction, smart market and payment." },
  { time: "10–35s", icon: <Camera />, ar: "الديمو الحي", en: "Live demo", sayAr: "بضغطة واحدة: SAM يعزل القطعة على الخريطة، Spark يسعّر محليًا ويكتب الإعلان، وMuse Image يعمل صورة الستوديو، وزمن كل موديل يظهر في شريط الإثبات.", sayEn: "One click: SAM isolates the item on the map, Spark prices it locally and writes the listing, Muse Image makes the studio shot, and each model's measured time appears in the proof bar.", action: "demo", actionAr: "شغّل الديمو الحي", actionEn: "Run live demo" },
  { time: "35–50s", icon: <Package />, ar: "الحفظ والإدارة", en: "Save & manage", sayAr: "الإعلان اتخزن كامل: صور وأسعار ومتغيرات ومواصفات. ومن إدارة المنتجات: تقرير ربح فوري، وتحويل لمزاد بمحاكاة مزايدة حية.", sayEn: "The listing saved in full: images, prices, variants, specs. In product management: instant profit report, and conversion to auction with a live bidding simulation.", action: "save", actionAr: "احفظ النتيجة وافتح منتجاتي", actionEn: "Save result & open My products" },
  { time: "50–75s", icon: <Bot />, ar: "السوق الذكي", en: "Smart Market", sayAr: "المشتري بيكتب احتياجه — الوكيل بيبحث في المتجر والمنتجات المحفوظة، يبني 3 قوائم قابلة للنقل والاعتماد، وتطلع فاتورة مبدئية.", sayEn: "The buyer states a need — the agent searches the store and saved products, builds 3 movable lists to approve, and produces a preliminary invoice.", action: "smart", actionAr: "افتح السوق الذكي", actionEn: "Open Smart Market" },
  { time: "75–90s", icon: <ShoppingCart />, ar: "الدفع والإغلاق", en: "Checkout & close", sayAr: "من الفاتورة إلى السلة إلى الدفع، عبر ثلاث موديلات Meta في مسار واحد.", sayEn: "From invoice to cart to payment, through three Meta models in one pipeline.", action: "cart", actionAr: "افتح السلة", actionEn: "Open cart" },
];

export function JudgesMode({ open, onOpenChange, lang, onAction, hasResults }: {
  open: boolean; onOpenChange: (v: boolean) => void; lang: "ar" | "en";
  onAction: (a: JudgeAction) => void; hasResults: boolean;
}) {
  const ar = lang === "ar";
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) { timer.current = setInterval(() => setElapsed((e) => Math.min(90, e + 1)), 1000); }
    else if (timer.current) clearInterval(timer.current);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [running]);
  useEffect(() => { if (elapsed >= 90) setRunning(false); }, [elapsed]);

  const s = STEPS[step];
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-2xl"><Trophy className="text-[#ffd166]" />{ar ? "جولة المنتج — 90 ثانية" : "Product tour — 90 seconds"}</SheetTitle>
          <SheetDescription>{ar ? "جولة حيّة خطوة بخطوة في المنتج بعدّاد 90 ثانية." : "A step-by-step live product walkthrough on a 90-second timer."}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 p-5">
          <div className="rounded-2xl border border-gold/40 bg-[#ffd166]/5 p-4">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="gold" dir="ltr">{s.time}</Badge>
              <span className="text-2xl font-black" dir="ltr">{String(Math.floor(elapsed / 60)).padStart(1, "0")}:{String(elapsed % 60).padStart(2, "0")} / 1:30</span>
              <div className="flex gap-1.5">
                <Button size="sm" variant={running ? "destructive" : "default"} onClick={() => setRunning((v) => !v)}>{running ? <Pause /> : <Play />}{running ? (ar ? "إيقاف" : "Pause") : (ar ? "ابدأ العداد" : "Start timer")}</Button>
                <Button size="sm" variant="outline" onClick={() => { setElapsed(0); setStep(0); setRunning(false); }} aria-label="reset"><RotateCcw /></Button>
              </div>
            </div>
            <Progress value={Math.round((elapsed / 90) * 100)} className="mt-3" />
            <div className="mt-3 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary [&_svg]:h-4.5 [&_svg]:w-4.5">{s.icon}</span>
              <h3 className="font-extrabold">{ar ? s.ar : s.en}</h3>
              <span className="ms-auto text-xs text-muted-foreground">{step + 1} / {STEPS.length}</span>
            </div>
            <p className="mt-2 rounded-xl bg-card p-3 leading-8 text-muted-foreground">{ar ? s.sayAr : s.sayEn}</p>
            {s.action ? (
              <Button className="mt-3 w-full" variant="accent" disabled={s.action === "save" && !hasResults}
                onClick={() => { onAction(s.action!); if (s.action !== "demo") onOpenChange(false); }}>
                <CheckCheck />{ar ? s.actionAr : s.actionEn}{s.action === "save" && !hasResults ? (ar ? " (شغّل الديمو الأول)" : " (run demo first)") : ""}
              </Button>
            ) : null}
            <div className="mt-3 flex gap-2">
              <Button variant="outline" className="flex-1" disabled={step === 0} onClick={() => setStep((v) => Math.max(0, v - 1))}><ChevronRight className="flip-dir" />{ar ? "السابق" : "Back"}</Button>
              <Button className="flex-1" disabled={step === STEPS.length - 1} onClick={() => setStep((v) => Math.min(STEPS.length - 1, v + 1))}>{ar ? "التالي" : "Next"}<ChevronLeft className="flip-dir" /></Button>
            </div>
          </div>

          <div className="space-y-2">
            {STEPS.map((x, i) => (
              <button key={i} type="button" onClick={() => setStep(i)} className={`flex min-h-11 w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-start text-sm font-bold transition ${i === step ? "border-primary bg-primary/10" : "bg-card hover:border-primary/40"} ${i < step ? "opacity-70" : ""}`}>
                <span className={i < step ? "text-accent" : "text-muted-foreground"}>{i < step ? <CheckCheck className="h-4 w-4" /> : x.icon}</span>
                {ar ? x.ar : x.en}<span className="ms-auto text-[11px] text-muted-foreground" dir="ltr">{x.time}</span>
              </button>
            ))}
          </div>

          <p className="rounded-xl border border-accent/30 bg-accent/5 p-3 text-xs leading-6 text-muted-foreground">
            {ar ? "جولة سريعة في المنتج كاملًا: تحليل، حفظ وإدارة، سوق ذكي، ودفع — في 90 ثانية." : "A fast walkthrough of the full product: analysis, saving and management, smart market, and checkout — in 90 seconds."}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
