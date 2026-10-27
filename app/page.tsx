"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AppHeader, type Country } from "@/components/layout/app-header";
import { CartSheet } from "@/components/cart/cart-sheet";
import { ProductCard } from "@/components/products/product-card";
import { ProductDetailsSheet } from "@/components/products/product-details-sheet";
import { SellerDashboard } from "@/components/products/seller-dashboard";
import { SmartMarket } from "@/components/smart/smart-market";
import { EmptyState, ProductSkeletonGrid } from "@/components/products/states";
import { ModelTrace, STAGE_PRESETS, type TraceInfo } from "@/components/products/model-trace";
import { SamOverlay } from "@/components/products/sam-overlay";
import { StudioCompare } from "@/components/products/studio-compare";
import type { Detection } from "@/lib/extract";
import { ImpactStrip } from "@/components/judges/impact-strip";
import { JudgesMode, type JudgeAction } from "@/components/judges/judges-mode";
import { SellerStory } from "@/components/judges/seller-story";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/use-cart";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useMineProducts } from "@/hooks/use-mine-products";
import { COUNTRIES, t, type Lang } from "@/lib/brand";
import type { Product } from "@/lib/product";
import {
  ArrowLeftRight, Bot, Camera, CheckCheck, Download, FileJson, Gavel, ImagePlus, Link2, Megaphone, Mic, Package,
  Radio, Search, ShoppingCart, Sparkles, Square, Store, Trash2, TriangleAlert, Trophy, Type, Wand2,
} from "lucide-react";
import { toast } from "sonner";

type TabKey = "analyze" | "generate" | "compare" | "voice" | "import" | "smart" | "mine";
const SAMPLE = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Avocado_Hass_-_single_and_halved.jpg/1280px-Avocado_Hass_-_single_and_halved.jpg";
const TABS: { key: TabKey; icon: React.ReactNode }[] = [
  { key: "analyze", icon: <Camera /> }, { key: "generate", icon: <Type /> }, { key: "voice", icon: <Mic /> },
  { key: "compare", icon: <ArrowLeftRight /> }, { key: "import", icon: <Store /> },
  { key: "smart", icon: <Bot /> }, { key: "mine", icon: <Package /> },
];
const MOBILE_TABS: { key: TabKey; icon: React.ReactNode }[] = [
  { key: "analyze", icon: <Camera /> }, { key: "smart", icon: <Bot /> }, { key: "voice", icon: <Mic /> },
  { key: "import", icon: <Store /> }, { key: "mine", icon: <Package /> },
];

export default function Page() {
  const [lang, setLang] = useState<Lang>("en");
  const [tab, setTab] = useState<TabKey>("analyze");
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [imageUrl, setImageUrl] = useState(SAMPLE);
  const [imageLabel, setImageLabel] = useState("");
  const [desc, setDesc] = useState("");
  const [extUrl, setExtUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [live, setLive] = useState(false);
  const [results, setResults] = useState<Product[]>([]);
  const [alternatives, setAlternatives] = useState<Product[]>([]);
  const [comparison, setComparison] = useState("");
  const [verdict, setVerdict] = useState("");
  const [studio, setStudio] = useState<string | null>(null);
  const [raw, setRaw] = useState<unknown>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [mineQuery, setMineQuery] = useState("");
  const [recording, setRecording] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [trace, setTrace] = useState<TraceInfo | null>(null);
  const [judgesOpen, setJudgesOpen] = useState(false);
  const [sourceImg, setSourceImg] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mine = useMineProducts();
  const cart = useCart();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const ar = lang === "ar";

  // PWA: seller installs the app and the shell works offline in the market.
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => { /* non-fatal */ });
    }
  }, []);

  // Restore saved language/country once, then keep <html lang/dir> + storage in sync.
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem("souk-lens-lang");
      if (savedLang === "en" || savedLang === "ar") setLang(savedLang);
      const savedCountry = localStorage.getItem("souk-lens-country");
      const found = COUNTRIES.find((c) => c.code === savedCountry);
      if (found) setCountry(found);
    } catch { /* first visit */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = ar ? "rtl" : "ltr";
    try { localStorage.setItem("souk-lens-lang", lang); } catch { /* ignore */ }
  }, [lang, ar]);

  useEffect(() => {
    try { localStorage.setItem("souk-lens-country", country.code); } catch { /* ignore */ }
  }, [country]);

  const filteredMine = useMemo(() => {
    const q = mineQuery.trim().toLowerCase();
    if (!q) return mine.products;
    return mine.products.filter((p) => [p.name_ar, p.name_en, p.category, p.sku].join(" ").toLowerCase().includes(q));
  }, [mine.products, mineQuery]);

  function openDetails(p: Product) { setSelected(p); setDetailsOpen(true); }
  function patchProduct(id: string, patch: Partial<Product>) {
    setResults((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    setAlternatives((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    if (mine.products.some((p) => p.id === id)) mine.update(id, patch);
    setSelected((prev) => (prev?.id === id ? { ...prev, ...patch } : prev));
  }

  async function postJson(path: string, body: Record<string, unknown>) {
    setLoading(true); setError(""); setResults([]); setAlternatives([]); setComparison(""); setVerdict(""); setStudio(null); setRaw(null); setDetections([]); setTrace(null);
    const t0 = performance.now();
    try {
      const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok || j.ok === false) throw new Error(j.error ?? `HTTP ${r.status}`);
      setLive(!!j.live); setRaw(j.raw ?? j);
      setDetections((j.detections ?? []) as Detection[]);
      if (typeof body.imageUrl === "string") setSourceImg(body.imageUrl);
      const stages = (Array.isArray(j.trace) && j.trace.length ? j.trace : STAGE_PRESETS[path] ?? []) as TraceInfo["stages"];
      setTrace({ endpoint: path, live: !!j.live, elapsedMs: Math.round(performance.now() - t0), count: ((j.products ?? j.items ?? []) as Product[]).length, stages });
      setResults((j.products ?? j.items ?? []) as Product[]);
      setAlternatives((j.alternatives ?? []) as Product[]);
      if (typeof j.comparison === "string") setComparison(j.comparison);
      if (typeof j.verdict === "string") setVerdict(j.verdict);
      if (typeof j.transcript === "string" && j.transcript) setDesc(j.transcript);
      if (typeof j.note === "string" && j.note) toast.info(j.note);
      if (typeof j.studioImage === "string") setStudio(j.studioImage);
      const count = ((j.products ?? j.items ?? []) as Product[]).length;
      if (count) toast.success(ar ? `تم إنشاء ${count} إعلان كامل` : `${count} full listings created`);
    } catch (e) { setError(String(e)); } finally { setLoading(false); }
  }

  const runAnalyze = () => postJson("/api/lens", { imageUrl, prompt: imageLabel || "market goods", lang: ar ? "ar-EG" : "en", country: country.code, currency: country.currency });
  const runDemo = () => { setTab("analyze"); setImageUrl(SAMPLE); setImageLabel("avocado"); postJson("/api/lens", { imageUrl: SAMPLE, prompt: "avocado", lang: ar ? "ar-EG" : "en", country: country.code, currency: country.currency }); };
  function handleJudgeAction(a: JudgeAction) {
    if (a === "demo") runDemo();
    else if (a === "smart") setTab("smart");
    else if (a === "mine") setTab("mine");
    else if (a === "cart") setCartOpen(true);
    else if (a === "save") { if (results.length) { addAll(results); } }
  }
  const runGenerate = () => postJson("/api/generate", { description: desc, country: country.code, currency: country.currency });
  const runVoiceListing = () => postJson("/api/voice-listing", { transcript: desc, country: country.code, currency: country.currency });
  const runCompare = () => postJson("/api/compare", { productUrl: extUrl, country: country.code, currency: country.currency });
  const runImport = () => postJson("/api/import", { storeUrl: extUrl, country: country.code, currency: country.currency });

  function onImageFile(f: File | undefined) {
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => { setImageUrl(String(rd.result)); toast.success(ar ? "اتحملت الصورة" : "Image loaded"); };
    rd.readAsDataURL(f);
  }

  async function toggleRecord() {
    if (recording) { recorderRef.current?.stop(); setRecording(false); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      recorderRef.current = mr; chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        const fd = new FormData();
        fd.append("audio", blob, "voice.webm"); fd.append("country", country.code); fd.append("currency", country.currency);
        setLoading(true); setError("");
        try {
          const r = await fetch("/api/voice", { method: "POST", body: fd });
          const j = await r.json();
          setLive(!!j.live); setRaw(j);
          if (j.transcript) { setDesc(j.transcript); setResults((j.products ?? []) as Product[]); if ((j.products ?? []).length) toast.success(ar ? "اتحول الصوت لإعلان كامل" : "Voice became a full listing"); }
          else { setResults([]); toast.info(j.note ?? (ar ? "اكتب وصف المنتج وهنولد الإعلان" : "Type the description to generate")); }
        } catch (e) { setError(String(e)); } finally { setLoading(false); }
      };
      mr.start(); setRecording(true);
    } catch { toast.error(ar ? "تعذر فتح المايك — اسمح بالوصول أو اكتب الوصف" : "Mic blocked — allow access or type"); }
  }

  function addAll(list: Product[]) { mine.addMany(list); toast.success(ar ? `اتحفظ ${list.length} منتج بكل التفاصيل والصور` : `${list.length} products saved in full`); setTab("mine"); }
  function saveSmart(list: Product[]) { mine.addMany(list); toast.success(ar ? `اتحفظت ${list.length} منتج من السوق الذكي بكل تفاصيلها` : `Saved ${list.length} smart-market products in full`); }
  function addToCart(list: Product[]) { cart.addMany(list); setCartOpen(true); }
  function exportMine() {
    const blob = new Blob([JSON.stringify(mine.products, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "souk-lens-products.json"; a.click(); URL.revokeObjectURL(a.href);
  }

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <AppHeader lang={lang} setLang={setLang} country={country} setCountry={setCountry} live={live} cartCount={cart.count} onCartClick={() => setCartOpen(true)} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Hero */}
        <section className="relative mt-5 overflow-hidden rounded-[1.75rem] border shadow-2xl shadow-primary/10">
          <Image src="/brand/hero-souq.jpg" alt="Souk Lens hero" width={1600} height={800} className="h-[300px] w-full object-cover sm:h-[340px]" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b10] via-[#0b0b10]/55 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
            <div className="flex flex-wrap gap-2">
              <Badge variant="gold">Meta Hackathon · Indie</Badge>
              <Badge variant="accent">SAM 3.1 · Muse Spark · Muse Image · Voice</Badge>
            </div>
            <h1 className="mt-3 max-w-2xl text-3xl font-black leading-tight sm:text-5xl">{ar ? <>أي حاجة… تتحول <span className="gradient-text">لإعلان جاهز للبيع</span></> : "Anything becomes a ready-to-sell listing"}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
              {ar ? "صورة، صوت، وصف، رابط منتج، أو متجر كامل — النتيجة دايما منتج محفوظ بكل تفاصيله: صور، أسعار، متغيرات، مواصفات، مخزون وSEO. والسوق الذكي يجمع لك الشراء كله في قوائم وفاتورة واحدة." : "A photo, voice note, description, product link, or a whole store — the result is always a saved product with images, prices, variants, specs, stock and SEO. Smart Market bundles your whole purchase into lists and one invoice."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="lg" variant="gold" onClick={() => setJudgesOpen(true)}><Trophy />{ar ? "جولة 90 ثانية" : "Guided 90-second tour"}</Button>
              <Button size="lg" variant="gold" onClick={runDemo} disabled={loading}><Sparkles />{ar ? "ديمو بضغطة واحدة" : "One-click demo"}</Button>
              <Button size="lg" variant="accent" onClick={() => setTab("smart")}><Bot />{ar ? "جرّب السوق الذكي" : "Try Smart Market"}</Button>
              <Button size="lg" variant="outline" className="glass text-white hover:text-white" onClick={() => setTab("analyze")}><Camera />{ar ? "حلّل صورة سوق" : "Analyze a photo"}</Button>
              <Button size="lg" variant="outline" className="glass text-white hover:text-white" onClick={() => setCartOpen(true)}><ShoppingCart />{ar ? `السلة (${cart.count})` : `Cart (${cart.count})`}</Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
              <span className="glass rounded-full px-3 py-1.5">{mine.products.length} {ar ? "منتج محفوظ" : "saved products"}</span>
              <span className="glass rounded-full px-3 py-1.5">{country.code} · {country.currency}</span>
              <span className="glass animate-glow rounded-full px-3 py-1.5">{live ? "● LIVE" : "Demo / Live ready"}</span>
              <span className="glass hidden rounded-full px-3 py-1.5 sm:inline-flex"><Gavel className="me-1 h-3.5 w-3.5" />{ar ? "مزاد" : "Auction"} · <Radio className="mx-1 h-3.5 w-3.5" />{ar ? "بث" : "Live"} · <Megaphone className="mx-1 h-3.5 w-3.5" />{ar ? "حملات" : "Campaigns"}</span>
            </div>
          </div>
        </section>

        <ImpactStrip trace={trace} savedCount={mine.products.length} lang={lang} />
        <SellerStory lang={lang} />

        {/* Mode switch: Tabs on desktop, Select on mobile (component branching, not shrink) */}
        {isMobile ? (
          <div className="mt-5 space-y-2">
            <Label>{ar ? "اختار طريقة الإنشاء" : "Choose creation mode"}</Label>
            <Select value={tab} onValueChange={(v) => setTab(v as TabKey)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TABS.map(({ key }) => <SelectItem key={key} value={key}>{t(key, lang)}{key === "mine" ? ` (${mine.products.length})` : ""}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        ) : null}

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="mt-5">
          {!isMobile ? (
            <TabsList className="flex w-full flex-wrap justify-start gap-1">
              {TABS.map(({ key, icon }) => (
                <TabsTrigger key={key} value={key}>{icon}{t(key, lang)}{key === "mine" && mine.products.length ? ` (${mine.products.length})` : ""}</TabsTrigger>
              ))}
            </TabsList>
          ) : null}

          <TabsContent value="analyze">
            <InputCard title={ar ? "تحليل صورة سوق" : "Analyze a market photo"} desc={ar ? "ارفع صورة أو الصق رابط — SAM يعزل، Spark يكتب الإعلان كامل، وMuse Image ينضف صورة المنتج." : "Upload or paste a link — SAM segments, Spark writes the full listing, Muse Image cleans the shot."} icon={<Camera className="text-primary" />}>
              <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
                <div className="space-y-3">
                  <div className="space-y-1.5"><Label>{ar ? "رابط الصورة" : "Image URL"}</Label><Input dir="ltr" value={imageUrl.startsWith("data:") ? "" : imageUrl} placeholder="https://…" onChange={(e) => setImageUrl(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>{ar ? "بتدور على ايه؟ (اختياري)" : "Looking for? (optional)"}</Label><Input value={imageLabel} onChange={(e) => setImageLabel(e.target.value)} placeholder={ar ? "مثال: lamp, clothes, fruit" : "e.g. lamp, clothes"} /></div>
                  <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-card/50 p-5 text-center transition hover:border-primary/60 hover:bg-primary/5">
                    <ImagePlus className="h-6 w-6 text-accent" />
                    <span className="text-sm font-bold">{ar ? "ارفع صورة من جهازك" : "Upload from your device"}</span>
                    <span className="text-xs text-muted-foreground">{ar ? "تتبعت مباشرة بدون رابط خارجي" : "Sent directly, no external link needed"}</span>
                    <input type="file" accept="image/*" hidden onChange={(e) => onImageFile(e.target.files?.[0])} />
                  </label>
                  <Button size="lg" className="w-full sm:w-auto" onClick={runAnalyze} disabled={loading || !imageUrl}><Wand2 />{loading ? t("analyzing", lang) : (ar ? "حلّل وابني الإعلانات" : "Analyze & build listings")}</Button>
                </div>
                <div className="overflow-hidden rounded-2xl border bg-muted">
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt="input" className="h-full max-h-[330px] w-full object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="/brand/empty-stall.jpg" alt="" className="mx-auto w-44 py-10" />
                  )}
                </div>
              </div>
            </InputCard>
          </TabsContent>

          <TabsContent value="generate">
            <InputCard title={ar ? "إعلان من وصف مكتوب" : "Listing from a written description"} desc={ar ? "اكتب اللي عندك بجملة واحدة — وهنرجع منتج كامل بالأسعار والمتغيرات والمواصفات وصورة ستوديو." : "Write what you have in one sentence — get a full product with prices, variants, specs and a studio image."} icon={<Type className="text-primary" />}>
              <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={5} placeholder={t("descPlaceholder", lang)} />
              <div className="flex flex-wrap gap-2">
                {["كرسي خشب زان بحالة ممتازة", "مصباح نحاس يدوي قديم شغال", "حذاء رياضي مقاس 42 جديد"].map((x) => (
                  <Button key={x} variant="outline" size="sm" onClick={() => setDesc(x)}>{x}</Button>
                ))}
              </div>
              <Button size="lg" onClick={runGenerate} disabled={loading || !desc.trim()}><Sparkles />{loading ? t("analyzing", lang) : (ar ? "ولّد إعلان كامل" : "Generate full listing")}</Button>
            </InputCard>
          </TabsContent>

          <TabsContent value="voice">
            <InputCard title={ar ? "إعلان بصوتك" : "Listing from your voice"} desc={ar ? "سجل وصف المنتج — Muse Voice يحوله لنص، وSpark يبني الإعلان كامل. لو التسجيل متاحش، اكتب وهنكمل." : "Record the product — Muse Voice transcribes, Spark builds the full listing. Fallback: type it."} icon={<Mic className="text-primary" />}>
              <div className="flex flex-col items-center gap-4 py-2">
                <Button size="lg" variant={recording ? "destructive" : "default"} onClick={toggleRecord} className={recording ? "animate-recording h-16 w-16 rounded-full p-0" : "h-16 w-16 rounded-full p-0"}>
                  {recording ? <Square /> : <Mic className="h-6 w-6" />}
                </Button>
                <p className="text-sm text-muted-foreground">{recording ? (ar ? "بيسجل… اضغط للإيقاف" : "Recording… tap to stop") : (ar ? "اضغط واتكلم عن المنتج" : "Tap and describe the product")}</p>
              </div>
              <Separator />
              <div className="space-y-1.5"><Label>{ar ? "النص (قابل للتعديل)" : "Transcript (editable)"}</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} placeholder={t("descPlaceholder", lang)} /></div>
              <Button size="lg" onClick={runVoiceListing} disabled={loading || !desc.trim()}><Sparkles />{ar ? "ابني الإعلان من النص" : "Build listing from text"}</Button>
            </InputCard>
          </TabsContent>

          <TabsContent value="compare">
            <InputCard title={ar ? "قارن منتج خارجي" : "Compare an external product"} desc={ar ? "الصق رابط أي منتج — هنجيب بياناته الحقيقية، نبني إعلانه، ونقترح بدائل أفضل وأرخص لبلدك مع الحكم النهائي." : "Paste any product link — we fetch its real data, build its listing, and suggest better/cheaper alternatives for your country."} icon={<ArrowLeftRight className="text-primary" />}>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input dir="ltr" value={extUrl} onChange={(e) => setExtUrl(e.target.value)} placeholder={t("urlPlaceholder", lang)} className="flex-1" />
                <Button size="lg" onClick={runCompare} disabled={loading || !extUrl.trim()}><Search />{loading ? t("analyzing", lang) : (ar ? "قارن دلوقتي" : "Compare now")}</Button>
              </div>
            </InputCard>
          </TabsContent>

          <TabsContent value="import">
            <InputCard title={ar ? "انقل متجرك كله" : "Migrate your whole store"} desc={ar ? "الصق رابط متجرك القديم — هنجلب منتجاته الحقيقية (JSON-LD) ونكمل الناقص بالذكاء: وصف وأسعار ومتغيرات ومواصفات جاهزة للنشر." : "Paste your old store — we pull its real products (JSON-LD) and complete the rest with AI: descriptions, prices, variants and specs."} icon={<Store className="text-primary" />}>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input dir="ltr" value={extUrl} onChange={(e) => setExtUrl(e.target.value)} placeholder={t("urlPlaceholder", lang)} className="flex-1" />
                <Button size="lg" onClick={runImport} disabled={loading || !extUrl.trim()}><Download />{loading ? t("analyzing", lang) : (ar ? "انقل المنتجات" : "Import products")}</Button>
              </div>
            </InputCard>
          </TabsContent>

          <TabsContent value="smart">
            <SmartMarket
              lang={lang} country={country.code} currency={country.currency}
              savedProducts={mine.products}
              onDetails={openDetails}
              onSaveProducts={saveSmart}
              onAddToCart={addToCart}
            />
          </TabsContent>

          <TabsContent value="mine">
            <div className="space-y-4">
            {mine.products.length ? (
              <SellerDashboard products={mine.products} lang={lang} onPatch={patchProduct} onDetails={openDetails} />
            ) : null}
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{ar ? "منتجاتي المحفوظة — إدارة المنتجات" : "My saved products — product management"}</CardTitle>
                    <CardDescription>{ar ? "كل منتج محفوظ بكامل تفاصيله وصوره ومتغيراته وأسعاره — افتحه، عدّله، حوّله لمزاد/بث/حملة من التقرير فوق، انسخ إعلانه، أو صدّره." : "Every saved product keeps full details, images, variants and prices — open, edit, convert to auction/live/campaign from the report above, copy its ad, or export."}</CardDescription>
                  </div>
                  <Badge variant="accent">{mine.products.length}</Badge>
                </div>
                <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={mineQuery} onChange={(e) => setMineQuery(e.target.value)} placeholder={ar ? "ابحث بالاسم أو الكود…" : "Search name or SKU…"} className="ps-9" />
                  </div>
                  <Button variant="outline" onClick={exportMine} disabled={!mine.products.length}><FileJson />{ar ? "تصدير JSON" : "Export JSON"}</Button>
                  <Button variant="ghost" onClick={() => { mine.clear(); toast.success(ar ? "اتمسحت منتجاتك" : "Cleared"); }} disabled={!mine.products.length}><Trash2 />{ar ? "مسح الكل" : "Clear"}</Button>
                </div>
              </CardHeader>
              <CardContent>
                {!mine.loaded || filteredMine.length ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredMine.map((p) => <ProductCard key={p.id} product={p} lang={lang} isMine onRemove={mine.remove} onDetails={openDetails} onCart={(x) => addToCart([x])} />)}
                  </div>
                ) : <EmptyState lang={lang} />}
              </CardContent>
            </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Results (all create tabs share this) */}
        {tab !== "mine" && tab !== "smart" ? (
          <section className="mt-6 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black">{ar ? "النتيجة" : "Result"}</h2>
              <Badge variant={live ? "success" : "secondary"}>{live ? t("live", lang) : t("mock", lang)}</Badge>
              <span className="text-xs text-muted-foreground">sam-3.1 + muse-spark-1.3 + muse-image-1.0 + muse-voice</span>
              {results.length ? <Button className="ms-auto" variant="accent" onClick={() => addAll(results)}><CheckCheck />{ar ? `حفظ الكل (${results.length})` : `Save all (${results.length})`}</Button> : null}
            </div>

            <ModelTrace trace={trace} lang={lang} />

            {error ? (
              <Card className="border-destructive/50 bg-destructive/10 p-5 animate-souk-in">
                <div className="flex items-start gap-3">
                  <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                  <div><h3 className="font-extrabold">{ar ? "حصلت مشكلة" : "Something went wrong"}</h3><p className="mt-1 break-words text-sm leading-7 text-muted-foreground">{error}</p></div>
                </div>
              </Card>
            ) : null}

            {loading ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  {["SAM 3.1", "Muse Spark", "Muse Image"].map((s, i) => <Badge key={s} variant={i === 0 ? "default" : "secondary"}>{s}</Badge>)}
                  <span className="text-muted-foreground">{ar ? "بيبني إعلانات كاملة…" : "Building full listings…"}</span>
                </div>
                <ProductSkeletonGrid />
              </div>
            ) : null}

            {!loading && !error && results.length && detections.length ? (
              <SamOverlay image={sourceImg || imageUrl} detections={detections} products={results} lang={lang} onDetails={openDetails} />
            ) : null}

            {!loading && !error && results[0]?.studioImage && (results[0].sourceImage || sourceImg) ? (
              <Card className="animate-souk-in p-4">
                <h3 className="mb-3 font-extrabold">{ar ? "من فرشة السوق لصورة ستوديو" : "From market stall to studio shot"}</h3>
                <StudioCompare before={(results[0].sourceImage || sourceImg)} after={results[0].studioImage} lang={lang} />
              </Card>
            ) : null}

            {!loading && !error && results.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((p) => <ProductCard key={p.id} product={p} lang={lang} onAdd={mine.add} onDetails={openDetails} onCart={(x) => addToCart([x])} />)}
              </div>
            ) : null}

            {!loading && !error && !results.length && !comparison ? <EmptyState lang={lang} compact /> : null}

            {verdict ? <Card className="border-accent/40 bg-accent/10 p-5 animate-souk-in"><h3 className="font-extrabold text-accent">{ar ? "الحكم النهائي" : "Verdict"}</h3><p className="mt-1 leading-8">{verdict}</p></Card> : null}
            {comparison ? <Card className="p-5 animate-souk-in"><h3 className="mb-2 font-extrabold">{ar ? "المقارنة التفصيلية" : "Detailed comparison"}</h3><p className="whitespace-pre-wrap leading-8 text-muted-foreground">{comparison}</p></Card> : null}

            {alternatives.length ? (
              <div className="space-y-3">
                <h3 className="text-lg font-black">{ar ? "بدائل أفضل لبلدك" : "Better alternatives for your country"}</h3>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {alternatives.map((p) => <ProductCard key={p.id} product={p} lang={lang} onAdd={mine.add} onDetails={openDetails} onCart={(x) => addToCart([x])} />)}
                </div>
              </div>
            ) : null}

            {studio && !results.length ? (
              <div className="overflow-hidden rounded-2xl border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={studio} alt="studio" className="w-full object-cover" />
              </div>
            ) : null}

            <div>
              <Button variant="ghost" size="sm" onClick={() => setShowRaw((v) => !v)}><FileJson />{showRaw ? t("hideJson", lang) : t("rawJson", lang)}</Button>
              {showRaw ? <pre dir="ltr" className="custom-scroll mt-2 max-h-96 overflow-auto rounded-2xl border bg-[#101016] p-4 text-xs leading-6">{JSON.stringify(raw, null, 2)}</pre> : null}
            </div>
          </section>
        ) : null}

        <footer className="flex flex-wrap items-center gap-2 py-8 text-xs text-muted-foreground">
          <span>Souk Lens · Meta Global AI Developer Hackathon (Indie) · {country.code} {country.currency}</span>
          <a href="/brand" className="font-bold text-accent hover:underline">{ar ? "الهوية والبراند" : "Brand identity"}</a>
          <span className="ms-auto hidden sm:inline">Next.js · shadcn/ui · Tailwind · Meta Model API</span>
        </footer>
      </main>

      {/* Mobile bottom navigation (pattern conversion, not shrink) */}
      {isMobile ? (
        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-background/90 backdrop-blur-xl md:hidden">
          {MOBILE_TABS.map(({ key, icon }) => (
            <button key={key} type="button" onClick={() => setTab(key)} className={`flex min-h-[60px] flex-col items-center justify-center gap-1 text-[10px] font-bold transition ${tab === key ? "text-primary" : "text-muted-foreground"}`}>
              {icon}<span>{t(key, lang)}{key === "mine" && mine.products.length ? ` ${mine.products.length}` : ""}</span>
            </button>
          ))}
        </nav>
      ) : null}

      <ProductDetailsSheet product={selected} lang={lang} open={detailsOpen} onOpenChange={setDetailsOpen} editable onSave={patchProduct} />
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} items={cart.items} lang={lang} setQty={cart.setQty} remove={cart.remove} clear={cart.clear} />
      <JudgesMode open={judgesOpen} onOpenChange={setJudgesOpen} lang={lang} onAction={handleJudgeAction} hasResults={results.length > 0} />
    </div>
  );
}

function InputCard({ title, desc, icon, children }: { title: string; desc: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="animate-souk-in overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">{icon}{title}</CardTitle>
        <CardDescription className="leading-7">{desc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}
