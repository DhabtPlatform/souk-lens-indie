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
import { blobToWav16k } from "@/lib/wav";
import { HowItWorks } from "@/components/products/how-it-works";
import { Hint } from "@/components/products/field-hint";
import { ImpactStrip } from "@/components/judges/impact-strip";
import { JudgesMode, type JudgeAction } from "@/components/judges/judges-mode";
import { SellerStory } from "@/components/judges/seller-story";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Radio, Search, ShieldCheck, ShoppingBag, ShoppingCart, Sparkles, Square, Store, Trash2, TriangleAlert, Type, Wand2,
} from "lucide-react";
import { toast } from "sonner";

type TabKey = "analyze" | "generate" | "compare" | "voice" | "import" | "smart" | "mine";
type TabSection = "seller" | "buyer";
const SAMPLE = "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Avocado_Hass_-_single_and_halved.jpg/1280px-Avocado_Hass_-_single_and_halved.jpg";
// Seller creates & sells (photo/text/voice/import + product management);
// buyer compares & buys (smart market + URL comparison).
const TABS: { key: TabKey; icon: React.ReactNode; section: TabSection; color: string }[] = [
  { key: "analyze", icon: <Camera />, section: "seller", color: "#7c5cff" },
  { key: "generate", icon: <Type />, section: "seller", color: "#38bdf8" },
  { key: "voice", icon: <Mic />, section: "seller", color: "#f472b6" },
  { key: "import", icon: <Store />, section: "seller", color: "#14b8a6" },
  { key: "mine", icon: <Package />, section: "seller", color: "#fb7185" },
  { key: "smart", icon: <Bot />, section: "buyer", color: "#eab308" },
  { key: "compare", icon: <ArrowLeftRight />, section: "buyer", color: "#f59e0b" },
];
const SECTIONS: { key: TabSection; icon: React.ReactNode }[] = [
  { key: "seller", icon: <Store /> }, { key: "buyer", icon: <ShoppingBag /> },
];
const BOTTOM_TABS: { key: TabKey; icon: React.ReactNode; color: string }[] = [
  { key: "analyze", icon: <Camera />, color: "#7c5cff" }, { key: "voice", icon: <Mic />, color: "#f472b6" },
  { key: "smart", icon: <Bot />, color: "#eab308" }, { key: "compare", icon: <ArrowLeftRight />, color: "#f59e0b" },
  { key: "mine", icon: <Package />, color: "#fb7185" },
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
  const [voiceAudioUrl, setVoiceAudioUrl] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [imgMode, setImgMode] = useState<"both" | "real" | "generated">("both");
  const [mediaJobs, setMediaJobs] = useState<Record<string, boolean>>({});
  const enrichingRef = useRef<Set<string>>(new Set());
  const [sourceImg, setSourceImg] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mine = useMineProducts();
  const cart = useCart();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const ar = lang === "ar";

  // Presenter coach (private): opens only via ?coach=1 or Ctrl+Shift+J — never visible to visitors/judges.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("coach")) setJudgesOpen(true);
    const onKey = (e: KeyboardEvent) => { if (e.ctrlKey && e.shiftKey && e.code === "KeyJ") setJudgesOpen(true); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
  function openBuyerPage(p: Product) {
    try { sessionStorage.setItem("souk-lens-preview", JSON.stringify(p)); } catch { /* ignore */ }
    window.open(`/product/${p.id}`, "_blank", "noopener");
  }

  // Auto media enrichment for the hero product: variant shots (≤3) + 360° angles.
  // Non-blocking — results render instantly, media attaches when ready. Live only,
  // skipped in real-only photo mode. GLB can't be generated by Meta models (kept URL/upload).
  async function enrichMedia(p: Product) {
    if (!p || enrichingRef.current.has(p.id)) return;
    enrichingRef.current.add(p.id);
    setMediaJobs((m) => ({ ...m, [p.id]: true }));
    try {
      const r = await fetch("/api/media", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: p.name_en,
          variants: p.variants.slice(0, 3).map((v) => ({ id: v.id, label: `${v.name_ar ?? v.name} ${Object.values(v.attributes ?? {}).join(" ")}`.trim() })),
          angles: !p.angleImages?.length,
        }),
      });
      const j = await r.json();
      const patch: Partial<Product> = {};
      const imgs = (j.variantImages ?? {}) as Record<string, string>;
      if (Object.keys(imgs).length) patch.variants = p.variants.map((v) => (imgs[v.id] ? { ...v, image: imgs[v.id] } : v));
      if (Array.isArray(j.angleImages) && (j.angleImages as string[]).length) patch.angleImages = j.angleImages as string[];
      if (Object.keys(patch).length) {
        patchProduct(p.id, patch);
        toast.success(ar ? "اكتملت صور المتغيرات و360° تلقائيًا" : "Variant & 360° shots auto-completed");
      }
    } catch { /* silent — manual buttons remain */ } finally {
      enrichingRef.current.delete(p.id);
      setMediaJobs((m) => { const n = { ...m }; delete n[p.id]; return n; });
    }
  }
  function patchProduct(id: string, patch: Partial<Product>) {
    setResults((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    setAlternatives((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    if (mine.products.some((p) => p.id === id)) mine.update(id, patch);
    setSelected((prev) => (prev?.id === id ? { ...prev, ...patch } : prev));
  }

  async function postJson(path: string, body: Record<string, unknown>) {
    setLoading(true); setError(""); setResults([]); setAlternatives([]); setComparison(""); setVerdict(""); setStudio(null); setRaw(null); setDetections([]); setTrace(null); setSourceImg("");
    const t0 = performance.now();
    try {
      const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      if (!r.ok || j.ok === false) throw new Error(j.error ?? `HTTP ${r.status}`);
      setLive(!!j.live); setRaw(j.raw ?? j);
      setDetections((j.detections ?? []) as Detection[]);
      if (typeof body.imageUrl === "string") setSourceImg(body.imageUrl);
      const stages = (Array.isArray(j.trace) && j.trace.length ? j.trace : STAGE_PRESETS[path] ?? []) as TraceInfo["stages"];
      const list = ((j.products ?? j.items ?? []) as Product[]);
      setTrace({ endpoint: path, live: !!j.live, elapsedMs: Math.round(performance.now() - t0), count: list.length, stages });
      setResults(list);
      setAlternatives((j.alternatives ?? []) as Product[]);
      if (typeof j.comparison === "string") setComparison(j.comparison);
      if (typeof j.verdict === "string") setVerdict(j.verdict);
      if (typeof j.transcript === "string" && j.transcript) setDesc(j.transcript);
      if (typeof j.note === "string" && j.note) toast.info(j.note);
      if (typeof j.studioImage === "string") setStudio(j.studioImage);
      const count = list.length;
      if (count) toast.success(ar ? `تم إنشاء ${count} إعلان كامل` : `${count} full listings created`);
      if (j.live && (body.imageMode ?? "both") !== "real" && list[0]) enrichMedia(list[0]);
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
  const runGenerate = () => postJson("/api/generate", { description: desc, country: country.code, currency: country.currency, imageUrl: photoUrl || undefined, imageMode: imgMode });
  const runVoiceListing = () => postJson("/api/voice-listing", { transcript: desc, country: country.code, currency: country.currency, imageUrl: photoUrl || undefined, imageMode: imgMode });
  const runCompare = () => postJson("/api/compare", { productUrl: extUrl, country: country.code, currency: country.currency });
  const runImport = () => postJson("/api/import", { storeUrl: extUrl, country: country.code, currency: country.currency });

  function onImageFile(f: File | undefined) {
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => { setImageUrl(String(rd.result)); toast.success(ar ? "اتحملت الصورة" : "Image loaded"); };
    rd.readAsDataURL(f);
  }
  function onPhotoFile(f: File | undefined) {
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => { setPhotoUrl(String(rd.result)); toast.success(ar ? "اترفقت الصورة الحقيقية" : "Real photo attached"); };
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
        setVoiceAudioUrl(URL.createObjectURL(blob));
        setLoading(true); setError("");
        const t0 = performance.now();
        try {
          // Meta voice needs 16kHz mono WAV — convert in-browser, then transcribe for real.
          let audioFile: Blob = blob; let fileName = "voice.webm";
          try { audioFile = await blobToWav16k(blob); fileName = "voice.wav"; }
          catch { /* send original as last resort */ }
          const fd = new FormData();
          fd.append("audio", audioFile, fileName); fd.append("country", country.code); fd.append("currency", country.currency);
          if (photoUrl) fd.append("photo", photoUrl);
          fd.append("imageMode", imgMode);
          const r = await fetch("/api/voice", { method: "POST", body: fd });
          const j = await r.json();
          setLive(!!j.live); setRaw(j);
          const prods = (j.products ?? []) as Product[];
          setTrace({ endpoint: "/api/voice", live: !!j.live, elapsedMs: Math.round(performance.now() - t0), count: prods.length, stages: (Array.isArray(j.trace) && j.trace.length ? j.trace : STAGE_PRESETS["/api/voice-listing"] ?? []) as TraceInfo["stages"] });
          if (j.transcript) { setDesc(j.transcript); setResults(prods); if (prods.length) toast.success(ar ? "اتحول صوتك لإعلان كامل بالاسم والصور" : "Your voice became a full listing with name & images"); if (j.live && imgMode !== "real" && prods[0]) enrichMedia(prods[0]); }
          else { setResults([]); toast.info(j.note ?? (ar ? "اكتب وصف المنتج وهنولد الإعلان" : "Type the description to generate")); }
          if (typeof j.note === "string" && j.note && j.transcript) toast.info(j.note);
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

        {/* Mode switch: grouped Seller/Buyer tabs on desktop, grouped Select on mobile */}
        {isMobile ? (
          <div className="mt-5 space-y-2">
            <Label>{ar ? "اختار القسم والطريقة" : "Choose section & mode"}</Label>
            <Select value={tab} onValueChange={(v) => setTab(v as TabKey)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SECTIONS.map(({ key: section }) => (
                  <SelectGroup key={section}>
                    <SelectLabel>{ar ? (section === "seller" ? "للبائع — أنشئ وبِع" : "للمشتري — قارن واشترِ") : (section === "seller" ? "Seller — create & sell" : "Buyer — compare & buy")}</SelectLabel>
                    {TABS.filter((tb) => tb.section === section).map(({ key, color }) => (
                      <SelectItem key={key} value={key}><span className="flex items-center gap-2"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />{t(key, lang)}{key === "mine" ? ` (${mine.products.length})` : ""}</span></SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} dir={ar ? "rtl" : "ltr"} className="mt-5">
          {!isMobile ? (
            <TabsList className="grid w-full gap-2 bg-transparent p-0 md:grid-cols-2">
              {SECTIONS.map(({ key: section, icon: sIcon }) => (
                <div key={section} className="rounded-2xl border bg-muted/70 p-1.5 backdrop-blur">
                  <div className="flex items-center gap-1.5 px-2 pb-1 pt-0.5 text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                    <span className="[&_svg]:h-3.5 [&_svg]:w-3.5">{sIcon}</span>
                    {ar ? (section === "seller" ? "للبائع — أنشئ وبِع" : "للمشتري — قارن واشترِ") : (section === "seller" ? "Seller — create & sell" : "Buyer — compare & buy")}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {TABS.filter((tb) => tb.section === section).map(({ key, icon, color }) => (
                      <TabsTrigger key={key} value={key} className="tab-trigger ps-6" style={{ ["--tab-color" as string]: color } as React.CSSProperties}>{icon}{t(key, lang)}{key === "mine" && mine.products.length ? ` (${mine.products.length})` : ""}</TabsTrigger>
                    ))}
                  </div>
                </div>
              ))}
            </TabsList>
          ) : null}

          <TabsContent value="analyze">
            <InputCard title={ar ? "تحليل صورة سوق" : "Analyze a market photo"} desc={ar ? "ارفع صورة أو الصق رابط — SAM يعزل، Spark يكتب الإعلان كامل، وMuse Image ينضف صورة المنتج." : "Upload or paste a link — SAM segments, Spark writes the full listing, Muse Image cleans the shot."} icon={<Camera className="text-primary" />} steps={HOW.analyze[lang]} lang={lang}>
              <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
                <div className="space-y-3">
                  <div className="space-y-1.5"><Label>{ar ? "رابط الصورة" : "Image URL"}</Label><Input dir="ltr" value={imageUrl.startsWith("data:") ? "" : imageUrl} placeholder="https://…" onChange={(e) => setImageUrl(e.target.value)} /><Hint>{ar ? "رابط مباشر لصورة (https) — أو ارفع من جهازك في المربع تحت." : "Direct image link (https) — or upload from your device below."}</Hint></div>
                  <div className="space-y-1.5"><Label>{ar ? "بتدور على ايه؟ (اختياري)" : "Looking for? (optional)"}</Label><Input value={imageLabel} onChange={(e) => setImageLabel(e.target.value)} placeholder={ar ? "مثال: lamp, clothes, fruit" : "e.g. lamp, clothes"} /><Hint>{ar ? "كلمة تدل النموذج على ما يهمك في الصورة فيعزله بدقة أعلى." : "A word that tells the model what matters in the photo for sharper detection."}</Hint></div>
                  <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-card/50 p-5 text-center transition hover:border-primary/60 hover:bg-primary/5">
                    <ImagePlus className="h-6 w-6 text-accent" />
                    <span className="text-sm font-bold">{ar ? "ارفع صورة من جهازك" : "Upload from your device"}</span>
                    <span className="text-xs text-muted-foreground">{ar ? "تتبعت مباشرة بدون رابط خارجي" : "Sent directly, no external link needed"}</span>
                    <input type="file" accept="image/*" hidden onChange={(e) => onImageFile(e.target.files?.[0])} />
                  </label>
                  <div className="space-y-1.5"><Button size="lg" className="w-full sm:w-auto" onClick={runAnalyze} disabled={loading || !imageUrl}><Wand2 />{loading ? t("analyzing", lang) : (ar ? "حلّل وابني الإعلانات" : "Analyze & build listings")}</Button><Hint>{ar ? "يشغّل SAM ثم Spark ثم Muse Image بالترتيب على نفس الصورة." : "Runs SAM, then Spark, then Muse Image in order on the same photo."}</Hint></div>
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
            <InputCard title={ar ? "إعلان من وصف مكتوب" : "Listing from a written description"} desc={ar ? "اكتب اللي عندك بجملة واحدة — وهنرجع منتج كامل بالأسعار والمتغيرات والمواصفات وصورة ستوديو." : "Write what you have in one sentence — get a full product with prices, variants, specs and a studio image."} icon={<Type className="text-primary" />} steps={HOW.generate[lang]} lang={lang}>
              <div className="space-y-1.5"><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={5} placeholder={t("descPlaceholder", lang)} /><Hint>{ar ? "جملة واحدة تكفي — السعر والمواصفات والمتغيرات تُستنتج تلقائيًا." : "One sentence is enough — price, specs and variants are inferred automatically."}</Hint></div>
              <div className="flex flex-wrap gap-2">
                {["كرسي خشب زان بحالة ممتازة", "مصباح نحاس يدوي قديم شغال", "حذاء رياضي مقاس 42 جديد"].map((x) => (
                  <Button key={x} variant="outline" size="sm" onClick={() => setDesc(x)}>{x}</Button>
                ))}
              </div>
              <RealPhotoPicker photoUrl={photoUrl} setPhotoUrl={setPhotoUrl} onFile={onPhotoFile} lang={lang} mode={imgMode} setMode={setImgMode} />
              <TrustNote lang={lang} />
              <div className="space-y-1.5"><Button size="lg" onClick={runGenerate} disabled={loading || !desc.trim()} className={loading ? "btn-glow" : undefined}><Sparkles />{loading ? t("analyzing", lang) : (ar ? "ولّد إعلان كامل" : "Generate full listing")}</Button><Hint>{ar ? "يخرج إعلانًا كاملًا مع صورة ستوديو مولدة في نتيجة واحدة." : "Produces a full listing plus a generated studio shot in one result."}</Hint></div>
            </InputCard>
          </TabsContent>

          <TabsContent value="voice">
            <InputCard title={ar ? "إعلان بصوتك" : "Listing from your voice"} desc={ar ? "سجل وصف المنتج — Muse Voice يحوله لنص، وSpark يبني الإعلان كامل. لو التسجيل متاحش، اكتب وهنكمل." : "Record the product — Muse Voice transcribes, Spark builds the full listing. Fallback: type it."} icon={<Mic className="text-primary" />} steps={HOW.voice[lang]} lang={lang}>
              <div className="flex flex-col items-center gap-4 py-2">
                <Button size="lg" variant={recording ? "destructive" : "default"} onClick={toggleRecord} className={recording ? "animate-recording h-16 w-16 rounded-full p-0" : "h-16 w-16 rounded-full p-0"}>
                  {recording ? <Square /> : <Mic className="h-6 w-6" />}
                </Button>
                <p className="text-sm text-muted-foreground">{recording ? (ar ? "بيسجل… اضغط للإيقاف" : "Recording… tap to stop") : (ar ? "اضغط واتكلم عن المنتج — بيتحول لـ WAV وبيتحلل بنموذج Meta للصوت" : "Tap and describe — converted to WAV and transcribed by Meta's voice model")}</p>
                <Hint>{ar ? "لازم تضغط إيقاف الأول — نموذج Meta يستقبل ملف صوت كاملًا ولا يدعم البث الحي، والتحليل يبدأ بعد الإيقاف مباشرة." : "You must tap stop first — Meta's model accepts a complete audio file only (no live streaming); analysis starts right after stopping."}</Hint>
                {voiceAudioUrl ? (
                  <div className="w-full space-y-1.5">
                    <Label>{ar ? "تسجيلك (المصدر)" : "Your recording (source)"}</Label>
                    <audio controls src={voiceAudioUrl} className="w-full" />
                    <Hint>{ar ? "زر التشغيل للمراجعة فقط — التحليل يعمل على الملف مباشرة بدون تشغيله." : "Playback is for your review only — analysis runs on the file directly without playing it."}</Hint>
                  </div>
                ) : null}
              </div>
              <Separator />
              <div className="space-y-1.5"><Label>{ar ? "النص (قابل للتعديل)" : "Transcript (editable)"}</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} placeholder={t("descPlaceholder", lang)} /><Hint>{ar ? "راجع النص وصححه هنا قبل بناء الإعلان — هو نفس ما قلته بالظبط." : "Review and fix the text here before building — exactly what you said."}</Hint></div>
              <RealPhotoPicker photoUrl={photoUrl} setPhotoUrl={setPhotoUrl} onFile={onPhotoFile} lang={lang} mode={imgMode} setMode={setImgMode} />
              <TrustNote lang={lang} />
              <div className="space-y-1.5"><Button size="lg" onClick={runVoiceListing} disabled={loading || !desc.trim()} className={loading ? "btn-glow" : undefined}><Sparkles />{ar ? "ابني الإعلان من النص" : "Build listing from text"}</Button><Hint>{ar ? "يبني الإعلان من النص الظاهر فوق — عدّله أولًا لو احتجت." : "Builds the listing from the text above — edit it first if needed."}</Hint></div>
            </InputCard>
          </TabsContent>

          <TabsContent value="compare">
            <InputCard title={ar ? "قارن منتج خارجي" : "Compare an external product"} desc={ar ? "الصق رابط أي منتج — هنجيب بياناته الحقيقية، نبني إعلانه، ونقترح بدائل أفضل وأرخص لبلدك مع الحكم النهائي." : "Paste any product link — we fetch its real data, build its listing, and suggest better/cheaper alternatives for your country."} icon={<ArrowLeftRight className="text-primary" />} steps={HOW.compare[lang]} lang={lang}>
              <div className="space-y-1.5"><div className="flex flex-col gap-2 sm:flex-row">
                <Input dir="ltr" value={extUrl} onChange={(e) => setExtUrl(e.target.value)} placeholder={t("urlPlaceholder", lang)} className="flex-1" />
                <Button size="lg" onClick={runCompare} disabled={loading || !extUrl.trim()}><Search />{loading ? t("analyzing", lang) : (ar ? "قارن دلوقتي" : "Compare now")}</Button>
              </div><Hint>{ar ? "أي رابط منتج من أي متجر — صورة المنتج هنا حقيقية من الرابط نفسه، أما البدائل المقترحة فقد تستخدم صورًا مولدة." : "Any product link from any store — the photo here is real, taken from the link itself; suggested alternatives may use generated shots."}</Hint></div>
            </InputCard>
          </TabsContent>

          <TabsContent value="import">
            <InputCard title={ar ? "انقل متجرك كله" : "Migrate your whole store"} desc={ar ? "الصق رابط متجرك القديم — هنجلب منتجاته الحقيقية (JSON-LD) ونكمل الناقص بالذكاء: وصف وأسعار ومتغيرات ومواصفات جاهزة للنشر." : "Paste your old store — we pull its real products (JSON-LD) and complete the rest with AI: descriptions, prices, variants and specs."} icon={<Store className="text-primary" />} steps={HOW.import[lang]} lang={lang}>
              <div className="space-y-1.5"><div className="flex flex-col gap-2 sm:flex-row">
                <Input dir="ltr" value={extUrl} onChange={(e) => setExtUrl(e.target.value)} placeholder={t("urlPlaceholder", lang)} className="flex-1" />
                <Button size="lg" onClick={runImport} disabled={loading || !extUrl.trim()}><Download />{loading ? t("analyzing", lang) : (ar ? "انقل المنتجات" : "Import products")}</Button>
              </div><Hint>{ar ? "رابط الصفحة الرئيسية لمتجرك القديم — تُسحب المنتجات الحقيقية ويُكمَل الناقص بالذكاء." : "Your old store's homepage link — real products are pulled and AI completes what's missing."}</Hint></div>
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
              <SellerDashboard products={mine.products} lang={lang} onPatch={patchProduct} onDetails={openDetails} onRemove={mine.remove} />
            ) : null}
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{ar ? "منتجاتي المحفوظة — إدارة المنتجات" : "My saved products — product management"}</CardTitle>
                    <CardDescription>{ar ? "كل منتج محفوظ بكامل تفاصيله وصوره ومتغيراته وأسعاره — افتحه، عدّله، حوّله لمزاد/بث/حملة من التقرير فوق، انسخ إعلانه، أو صدّره." : "Every saved product keeps full details, images, variants and prices — open, edit, convert to auction/live/campaign from the report above, copy its ad, or export."}</CardDescription>
                    <div className="pt-1"><HowItWorks lang={lang} steps={ar ? ["أي نتيجة من أي تبويب احفظها هنا بالزر المخصص — بتتخزن محليًا بكامل التفاصيل والصور.", "اضغط «التفاصيل» على أي منتج: عدّل السعر والمخزون والوصف، انسخ الإعلان الجاهز، أو انشره على واتساب وفيسبوك.", "من التفاصيل أيضًا: ولّد صورة لكل متغير (لون/مقاس) بالذكاء، وولّد عرض 360° بأربع زوايا، أو الصق رابط مجسّم GLB حقيقي للعرض ثلاثي الأبعاد.", "من لوحة التقارير فوق: حدّث التكلفة والمبيعات لكل منتج وشوف الربح لحظيًا، وحوّل المنتج لمزاد أو بث مباشر أو حملة خارجية — وعدّل أو احذف أي منتج من صفّه مباشرة.", "ابحث بالاسم أو الكود، صدّر كل منتجاتك JSON، أو ضيف أي منتج للسلة للدفع."] : ["Save any result from any tab here with its button — stored locally with full details and images.", "Press Details on any product: edit price, stock and description, copy the ready ad, or publish it to WhatsApp and Facebook.", "Also from Details: generate an AI shot per variant (color/size), generate 360° views in four angles, or paste a real GLB link for true 3D.", "From the reports board above: update each product's cost and sales, watch profit live, convert to auction/live/campaign — and edit or delete any product right from its row.", "Search by name or SKU, export everything as JSON, or add any product to the cart for checkout."]} /></div>
                  </div>
                  <Badge variant="accent">{mine.products.length}</Badge>
                </div>
                <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={mineQuery} onChange={(e) => setMineQuery(e.target.value)} placeholder={ar ? "ابحث بالاسم أو الكود…" : "Search name or SKU…"} className="ps-9" />
                  </div>
                  <div className="space-y-1.5"><Button variant="outline" onClick={exportMine} disabled={!mine.products.length}><FileJson />{ar ? "تصدير JSON" : "Export JSON"}</Button><Hint>{ar ? "ملف بكل منتجاتك وتفاصيلها وصورها." : "A file with all your products, details and images."}</Hint></div>
                  <div className="space-y-1.5"><Button variant="ghost" onClick={() => { mine.clear(); toast.success(ar ? "اتمسحت منتجاتك" : "Cleared"); }} disabled={!mine.products.length}><Trash2 />{ar ? "مسح الكل" : "Clear"}</Button><Hint>{ar ? "يمسح التخزين المحلي نهائيًا." : "Permanently wipes local storage."}</Hint></div>
                </div>
              </CardHeader>
              <CardContent>
                {!mine.loaded || filteredMine.length ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredMine.map((p) => <ProductCard key={p.id} product={p} lang={lang} isMine onRemove={mine.remove} onDetails={openDetails} onCart={(x) => addToCart([x])} onOpenPage={openBuyerPage} mediaBusy={!!mediaJobs[p.id]} />)}
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
            <p className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/5 px-3 py-2 text-[12px] leading-6 text-muted-foreground">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              {ar ? "كل منتج يُخصب تلقائيًا: صور المتغيرات + عرض 360° + دعم مجسّم GLB ثلاثي الأبعاد — افتح القسم الكامل تحت أي كارت أو زر صفحة المشتري لرؤيتها كما يراها العميل." : "Every product is auto-enriched: variant photos + 360° views + GLB 3D support — expand the full section under any card or open the buyer page to see it as customers do."}
            </p>

            <HowItWorks lang={lang} steps={ar ? ["شريط الإثبات فوق يوضح كل موديل اشتغل في إيه وخد وقت قد إيه وهل كان حيًا أم تجريبيًا.", "خريطة SAM: كل مربع ملوّن منتج حقيقي في الصورة — اضغطه لفتح إعلانه الكامل.", "سلايدر قبل/بعد يقارن صورة السوق الأصلية بصورة الستوديو المولدة.", "كروت المنتجات: احفظ في منتجاتي، ضيف للسلة، أو افتح التفاصيل الكاملة.", "زر JSON الخام يعرض الرد الأصلي للموديلات للمراجعة التقنية."] : ["The proof bar above shows what each model did, how long it took, and whether it was live or demo.", "SAM map: every colored box is a real item in the photo — tap it to open its full listing.", "The before/after slider compares the original market shot with the generated studio shot.", "Product cards: save to My products, add to cart, or open full details.", "The raw JSON button reveals the models' original response for technical review."]} />

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

            {(() => {
              // The "before" shot must belong to THIS run only — never a stale image from another tab.
              const beforeImg = !loading && !error && results[0]?.studioImage
                ? (results[0].sourceImage || (detections.length ? sourceImg : ""))
                : "";
              return beforeImg ? (
                <Card className="animate-souk-in img-flash space-y-3 p-4">
                  <h3 className="font-extrabold">{ar ? "من صورة المنتج لصورة ستوديو" : "From product photo to studio shot"}</h3>
                  <StudioCompare before={beforeImg} after={results[0].studioImage!} lang={lang} />
                  <TrustNote lang={lang} />
                </Card>
              ) : null;
            })()}

            {!loading && !error && results.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((p) => <ProductCard key={p.id} product={p} lang={lang} onAdd={mine.add} onDetails={openDetails} onCart={(x) => addToCart([x])} onOpenPage={openBuyerPage} mediaBusy={!!mediaJobs[p.id]} />)}
              </div>
            ) : null}

            {!loading && !error && !results.length && !comparison ? <EmptyState lang={lang} compact /> : null}

            {verdict ? <Card className="border-accent/40 bg-accent/10 p-5 animate-souk-in"><h3 className="font-extrabold text-accent">{ar ? "الحكم النهائي" : "Verdict"}</h3><p className="mt-1 leading-8">{verdict}</p></Card> : null}
            {comparison ? <Card className="p-5 animate-souk-in"><h3 className="mb-2 font-extrabold">{ar ? "المقارنة التفصيلية" : "Detailed comparison"}</h3><p className="whitespace-pre-wrap leading-8 text-muted-foreground">{comparison}</p></Card> : null}

            {alternatives.length ? (
              <div className="space-y-3">
                <h3 className="text-lg font-black">{ar ? "بدائل أفضل لبلدك" : "Better alternatives for your country"}</h3>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {alternatives.map((p) => <ProductCard key={p.id} product={p} lang={lang} onAdd={mine.add} onDetails={openDetails} onCart={(x) => addToCart([x])} onOpenPage={openBuyerPage} />)}
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
          {BOTTOM_TABS.map(({ key, icon, color }) => (
            <button key={key} type="button" onClick={() => setTab(key)} style={tab === key ? { color } : undefined} className={`flex min-h-[60px] flex-col items-center justify-center gap-1 text-[10px] font-bold transition ${tab === key ? "" : "text-muted-foreground"}`}>
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

function TrustNote({ lang }: { lang: "ar" | "en" }) {
  const ar = lang === "ar";
  return (
    <p className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/5 px-3 py-2 text-[12px] leading-6 text-muted-foreground">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
      {ar ? "نصيحة للبائع: الصورة الحقيقية للمنتج تبني ثقة المشتري وتتمم البيع — الصورة المولدة للتجميل والعرض فقط." : "Seller tip: a real product photo earns buyer trust and closes the sale — generated shots are for polish only."}
    </p>
  );
}

function RealPhotoPicker({ photoUrl, setPhotoUrl, onFile, lang, mode, setMode }: { photoUrl: string; setPhotoUrl: (v: string) => void; onFile: (f: File | undefined) => void; lang: "ar" | "en"; mode: "both" | "real" | "generated"; setMode: (m: "both" | "real" | "generated") => void }) {
  const ar = lang === "ar";
  const modes = [
    { k: "both" as const, ar: "الحقيقية + المولدة", en: "Real + generated" },
    { k: "real" as const, ar: "الحقيقية فقط", en: "Real only" },
    { k: "generated" as const, ar: "المولدة فقط", en: "Generated only" },
  ];
  return (
    <div className="space-y-1.5">
      <Label>{ar ? "صورة حقيقية للمنتج (اختياري — موثوقة أكثر)" : "Real product photo (optional — more trusted)"}</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input dir="ltr" value={photoUrl.startsWith("data:") ? "" : photoUrl} placeholder="https://…" onChange={(e) => setPhotoUrl(e.target.value)} className="flex-1" />
        <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-4 text-sm font-bold transition hover:border-primary/60 hover:bg-primary/5">
          <ImagePlus className="h-4 w-4 text-accent" />{ar ? "ارفع صورة" : "Upload"}
          <input type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
      </div>
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="real product" className="h-24 w-24 rounded-xl border object-cover" />
      ) : null}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-bold text-muted-foreground">{ar ? "صور الإعلان:" : "Listing photos:"}</span>
        {modes.map((m) => (
          <button key={m.k} type="button" onClick={() => setMode(m.k)}
            className={`min-h-9 rounded-full border px-3 text-xs font-bold transition active:scale-[.97] ${mode === m.k ? "border-accent bg-accent text-accent-foreground shadow-lg shadow-accent/20" : "bg-card hover:border-accent/50"}`}>
            {ar ? m.ar : m.en}
          </button>
        ))}
      </div>
      <Hint>{ar ? "الحقيقية تتصدر لأن المشتري يصدقها (بدونها تُطلب منك أولًا)، والمولدة للتجميل فقط." : "Real leads because buyers trust it (requested first without one); generated is for polish only."}</Hint>
    </div>
  );
}

function InputCard({ title, desc, icon, steps, lang, children }: { title: string; desc: string; icon: React.ReactNode; steps?: string[]; lang?: "ar" | "en"; children: React.ReactNode }) {
  return (
    <Card className="animate-souk-in overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">{icon}{title}</CardTitle>
        <CardDescription className="leading-7">{desc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps?.length ? <HowItWorks steps={steps} lang={lang ?? "en"} /> : null}
        {children}
      </CardContent>
    </Card>
  );
}

const HOW: Record<TabKey, { ar: string[]; en: string[] }> = {
  analyze: {
    ar: ["الصق رابط صورة أو ارفعها من جهازك — المعاينة على اليمين بتوريك اللي هيتحلل.", "اكتب اسم الحاجة اللي بتدور عليها (اختياري) عشان التحديد يبقى أدق.", "اضغط «حلّل وابني الإعلانات»: SAM يعزل القطع، وSpark يكتب لكل قطعة إعلانًا كاملًا بالسعر والمتغيرات، وMuse Image ينضّف صورة أول منتج.", "اضغط أي مربع على خريطة SAM عشان تفتح إعلانه، واسحب سلايدر قبل/بعد لمقارنة صورة السوق بصورة الستوديو.", "اضغط «حفظ الكل» عشان المنتجات تروح منتجاتي بكامل تفاصيلها وصورها."],
    en: ["Paste an image URL or upload from your device — the preview shows what will be analyzed.", "Name what you're looking for (optional) for sharper detection.", "Press Analyze: SAM isolates each item, Spark writes a full listing with price and variants per item, Muse Image cleans the hero shot.", "Tap any box on the SAM map to open its listing, and drag the before/after slider to compare market vs studio.", "Press Save all to keep the products in My products with full details and images."],
  },
  generate: {
    ar: ["اكتب جملة واحدة توصف المنتج (مثال: كرسي خشب زان بحالة ممتازة) أو اضغط مثالًا جاهزًا.", "اضغط «ولّد إعلان كامل»: Spark يبني المنتج بالأسعار والمتغيرات والمواصفات، وMuse Image يولّد صورة ستوديو.", "راجع النتيجة واحفظها في منتجاتي أو ضيفها للسلة مباشرة."],
    en: ["Write one sentence describing the product, or tap a ready example.", "Press Generate: Spark builds the product with prices, variants and specs, and Muse Image generates a studio shot.", "Review the result, save it to My products or add it to the cart."],
  },
  voice: {
    ar: ["اضغط زر المايك واتكلم عن المنتج، ثم اضغط للإيقاف — التسجيل بيتحول تلقائيًا لصيغة WAV اللي يقبلها نموذج Meta.", "بعد الإيقاف بيظهر النص المفرّغ وتقدر تسمع تسجيلك الأصلي وتعدّل النص قبل النشر.", "اضغط «ابني الإعلان من النص»: Spark يبني إعلانًا باسم فعلي وأسعار ومتغيرات، وMuse Image يولّد صورة المنتج.", "النص الصوتي بيتحفظ كمصدر مع المنتج وبيظهر في تفاصيله."],
    en: ["Tap the mic, describe the product, tap to stop — the recording auto-converts to the WAV format Meta's model accepts.", "After stopping, the transcript appears; you can replay your original audio and edit the text before publishing.", "Press Build: Spark builds a listing with a real name, prices and variants, and Muse Image generates the shot.", "The transcript is saved as the product's source and shown in its details."],
  },
  compare: {
    ar: ["الصق رابط أي منتج خارجي — بنجيب بياناته الحقيقية (العنوان والصورة والسعر) ونبني إعلانه.", "Spark مع بحث الويب بيقترح بدائل أفضل وأرخص لبلدك مع مقارنة وحكم نهائي.", "احفظ المنتج الأصلي أو أي بديل في منتجاتي أو ضيفه للسلة."],
    en: ["Paste any external product link — we fetch its real data (title, image, price) and build its listing.", "Spark with web search suggests better, cheaper alternatives for your country, with a comparison and final verdict.", "Save the original or any alternative to My products or the cart."],
  },
  import: {
    ar: ["الصق رابط متجرك القديم — بنسحب منتجاته الحقيقية (JSON-LD) ونكمّل الناقص بالذكاء: وصف وأسعار ومتغيرات ومواصفات.", "راجع المنتجات المستوردة واحفظها كلها في منتجاتي جاهزة للنشر.", "من هناك تقدر تحوّل أي منتج لمزاد أو بث أو حملة خارجية."],
    en: ["Paste your old store link — we pull its real products (JSON-LD) and AI completes the rest: descriptions, prices, variants, specs.", "Review the imported products and save them all to My products, ready to publish.", "From there convert any product to auction, live sale or external campaign."],
  },
  smart: { ar: [], en: [] },
  mine: { ar: [], en: [] },
};
