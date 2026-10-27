"use client";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Bot, Camera, CheckCheck, ChevronLeft, ChevronRight, MessageCircleQuestion, Package, Pause, Play, RotateCcw, ShoppingCart, Trophy } from "lucide-react";

export type JudgeAction = "demo" | "smart" | "save" | "mine" | "cart";

const STEPS: { time: string; icon: React.ReactNode; ar: string; en: string; sayAr: string; sayEn: string; action?: JudgeAction; actionAr?: string; actionEn?: string }[] = [
  { time: "0–10s", icon: <Trophy />, ar: "الوعد في جملة", en: "The promise in one line", sayAr: "«Souk Lens مش محلل صور — دي منصة سوق كاملة للأسواق غير الرسمية: من صورة فرشة لإعلان ومزاد وسوق ذكي ودفع. أي فرشة في العالم تتحول لمتجر بيبيع — بصورة واحدة.»", sayEn: "“Souk Lens is not an image analyzer — it's a complete market platform for informal markets: from a stall photo to listing, auction, smart market and payment.”" },
  { time: "10–35s", icon: <Camera />, ar: "الديمو الحي", en: "Live demo", sayAr: "بضغطة: SAM يعزل القطعة على الخريطة، Spark يسعّر بالمحلي ويكتب الإعلان، وMuse Image يعمل صورة الستوديو — شوفوا زمن كل موديل في شريط الإثبات.", sayEn: "One click: SAM isolates the item on the map, Spark prices it locally and writes the listing, Muse Image makes the studio shot — watch each model's time in the proof bar.", action: "demo", actionAr: "شغّل الديمو الحي", actionEn: "Run live demo" },
  { time: "35–50s", icon: <Package />, ar: "الحفظ والإدارة", en: "Save & manage", sayAr: "الإعلان اتخزن كامل: صور وأسعار ومتغيرات ومواصفات. ومن إدارة المنتجات: تقرير ربح فوري، وتحويل لمزاد بمحاكاة مزايدة حية.", sayEn: "The listing saved in full: images, prices, variants, specs. In product management: instant profit report, and conversion to auction with a live bidding simulation.", action: "save", actionAr: "احفظ النتيجة وافتح منتجاتي", actionEn: "Save result & open My products" },
  { time: "50–75s", icon: <Bot />, ar: "السوق الذكي", en: "Smart Market", sayAr: "المشتري بيكتب «عاوز أجهز عروسين» — الوكيل بيبحث في المتجر ومنتجاتي، يبني 3 قوائم، وأقدر أنقل وأعتمد وأستلم فاتورة.", sayEn: "The buyer types “furnish a wedding” — the agent searches the store and my products, builds 3 lists; I can move items, approve, and get an invoice.", action: "smart", actionAr: "افتح السوق الذكي", actionEn: "Open Smart Market" },
  { time: "75–90s", icon: <ShoppingCart />, ar: "الدفع والإغلاق", en: "Checkout & close", sayAr: "من الفاتورة للسلة للدفع. تلات موديلات Meta في Pipeline واحد، لسوق غير رسمي محدش بيخدمه — هذا هو عالمنا الذي نبني له.", sayEn: "From invoice to cart to payment. Three Meta models in one pipeline, for an informal market nobody serves — this is the world we build for.", action: "cart", actionAr: "افتح السلة", actionEn: "Open cart" },
];

const QA: { qAr: string; qEn: string; aAr: string; aEn: string }[] = [
  { qAr: "إيه الفرق عن ChatGPT؟", qEn: "How is this different from ChatGPT?", aAr: "ChatGPT بيكتب نص. إحنا Pipeline: SAM 3.1 يعزل القطع بصريًا، Spark يسعّر محليًا ويبني منتجًا كاملًا بمتغيرات ومخزون، Muse Image ينضّف الصورة، وبعده حفظ وبيع ومزاد وسوق ذكي — منتج متكامل مش رد محادثة.", aEn: "ChatGPT writes text. We are a pipeline: SAM 3.1 visually isolates items, Spark prices locally and builds a full product with variants and stock, Muse Image cleans the shot — then saving, selling, auctions and a smart market. A complete product, not a chat reply." },
  { qAr: "الكتالوج وأرقام المبيعات حقيقية؟", qEn: "Is the catalog / sales data real?", aAr: "موسومة في الواجهة نفسها كبيانات تجريبية للعرض وقابلة للتعديل. الحقيقي والمقاس: زمن تشغيل الموديلات، والإعلانات المولدة Live، ومنتجات المستخدم المحفوظة اللي السوق الذكي بيبحث فيها فعلًا.", aEn: "Labeled in the UI itself as demo data, and editable. What's real and measured: model run times, the Live-generated listings, and the user's saved products that Smart Market actually searches." },
  { qAr: "لو الـAPI وقع يوم العرض؟", qEn: "What if the API fails on demo day?", aAr: "نفس الـPipeline بيشتغل بوضع Demo من غير مفتاح، وكل خطوة موسومة Live أو Demo بصراحة — العرض مش بيقع، وبيان الشفافية ده نفسه نقطة قوة.", aEn: "The same pipeline runs in Demo mode without a key, and every step is honestly labeled Live or Demo — the show never dies, and that transparency is itself a strength." },
  { qAr: "إزاي هتكسبوا فلوس؟", qEn: "How will you make money?", aAr: "قنوات البيع جاهزة في المنتج: عمولة على المزادات والحملات الخارجية والبث، واشتراك بائعين للإدارة والتقارير — الدفع في الإنتاج لبوابة البائع مباشرة بدون احتجاز أموال.", aEn: "Selling channels are built into the product: commission on auctions, external campaigns and live sales, plus a seller subscription for management and reports — production payments go straight to the seller's gateway." },
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
          <SheetTitle className="flex items-center gap-2 text-2xl"><Trophy className="text-[#ffd166]" />{ar ? "جولة 90 ثانية" : "Guided 90-second tour"}</SheetTitle>
          <SheetDescription>{ar ? "سكريبت عرض حي خطوة بخطوة: قول الجملة، نفّذ الحركة، وعدّاد بيحافظ على وقتك. ومعاه إجابات الأسئلة الصعبة وخطة بديلة." : "A step-by-step live pitch script: say the line, run the action, a timer keeps your pace. Plus tough-question answers and a fallback plan."}</SheetDescription>
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

          <div>
            <h4 className="mb-2 flex items-center gap-2 font-extrabold"><MessageCircleQuestion className="h-4 w-4 text-primary" />{ar ? "أسئلة الحكام الصعبة — وإجاباتها" : "Tough judge questions — answered"}</h4>
            <div className="space-y-2">
              {QA.map((x, i) => (
                <details key={i} className="group rounded-xl border bg-card px-3.5 py-2.5">
                  <summary className="cursor-pointer py-1 text-sm font-bold marker:text-accent">{ar ? x.qAr : x.qEn}</summary>
                  <p className="pb-1.5 pt-1 text-sm leading-7 text-muted-foreground">{ar ? x.aAr : x.aEn}</p>
                </details>
              ))}
            </div>
          </div>

          <p className="rounded-xl border border-accent/30 bg-accent/5 p-3 text-xs leading-6 text-muted-foreground">
            {ar ? "الخطة البديلة: لو وقعت الشبكة، كمل بنفس الخطوات — الـPipeline بيشتغل Demo بنفس النتائج البصرية وكل حاجة موسومة بصراحة. ولو وقع الجهاز، السكريبت ده محفوظ في DEMO_SCRIPT.md مع لقطات الهوية في صفحة البراند." : "Fallback: if the network dies, keep the same steps — the pipeline runs in Demo with the same visuals, all honestly labeled. If the machine dies, this script lives in DEMO_SCRIPT.md with brand shots on the Brand page."}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
