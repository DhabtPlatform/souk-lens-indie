"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useMediaQuery } from "@/hooks/use-media-query";
import { HowItWorks } from "@/components/products/how-it-works";
import { Hint } from "@/components/products/field-hint";
import { ModelTrace, STAGE_PRESETS, type TraceInfo } from "@/components/products/model-trace";
import type { Product } from "@/lib/product";
import { buildInvoice, PRESETS, type Bundle, type Priority } from "@/lib/smart-market";
import { formatPrice } from "@/lib/utils";
import {
  BadgeCheck, CheckCheck, Copy, Download, Eye, FileText, PackagePlus,
  RefreshCw, ShoppingCart, Sparkles, Star, Truck, X,
} from "lucide-react";
import { toast } from "sonner";

type SmartBundle = Bundle;
type AltMap = Record<string, (Product & { score: number })[]>;

function withTotals(b: SmartBundle): SmartBundle {
  return { ...b, ...buildInvoice(b.items) };
}

export function SmartMarket({
  lang, country, currency, onDetails, onSaveProducts, onAddToCart, savedProducts = [],
}: {
  lang: "ar" | "en"; country: string; currency: string;
  onDetails: (p: Product) => void;
  onSaveProducts: (list: Product[]) => void;
  onAddToCart: (list: Product[]) => void;
  savedProducts?: Product[];
}) {
  const ar = lang === "ar";
  const isMobile = useMediaQuery("(max-width: 900px)");
  const [query, setQuery] = useState("");
  const [presetId, setPresetId] = useState<string>("study");
  const [budget, setBudget] = useState("");
  const [priority, setPriority] = useState<Priority>("balanced");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [intent, setIntent] = useState<{ title_ar: string; title_en: string; note: string } | null>(null);
  const [bundles, setBundles] = useState<SmartBundle[]>([]);
  const [alts, setAlts] = useState<AltMap>({});
  const [activeBundle, setActiveBundle] = useState("value");
  const [scope, setScope] = useState<"store" | "web">("store");
  const [approvedId, setApprovedId] = useState<string | null>(null);
  const [invoiceNo, setInvoiceNo] = useState("");
  const [trace, setTrace] = useState<TraceInfo | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [counts, setCounts] = useState<{ total: number; saved: number; demo: number } | null>(null);

  const approved = bundles.find((b) => b.id === approvedId) ?? null;

  async function run(presetOverride?: string) {
    const pid = presetOverride ?? presetId;
    setLoading(true); setError(""); setApprovedId(null);
    const t0 = performance.now();
    try {
      const r = await fetch("/api/smart-market", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() || PRESETS.find((p) => p.id === pid)?.title_ar, presetId: pid || undefined, country, currency, budget: budget ? Number(budget) : undefined, priority, savedProducts, scope }),
      });
      const j = await r.json();
      if (!r.ok || j.ok === false) throw new Error(j.error ?? `HTTP ${r.status}`);
      setIntent(j.intent); setBundles(j.bundles as SmartBundle[]); setAlts(j.alternativesBySlot as AltMap);
      setSavedIds(new Set((j.savedIds ?? []) as string[]));
      setCounts({ total: j.catalogSize ?? 0, saved: j.savedCount ?? 0, demo: j.sampleCount ?? j.demoCount ?? 0 });
      setActiveBundle((j.bundles as SmartBundle[])[0]?.id ?? "value");
      setTrace({
        endpoint: "/api/smart-market", live: !!j.live,
        elapsedMs: Math.round(performance.now() - t0),
        count: ((j.bundles as SmartBundle[]) ?? []).reduce((n, b) => n + (b.items?.length ?? 0), 0),
        stages: (Array.isArray(j.trace) && j.trace.length ? j.trace : STAGE_PRESETS["/api/smart-market"] ?? []) as TraceInfo["stages"],
      });
      toast.success(scope === "web"
        ? (ar ? `قائمة ويب حقيقية: ${j.catalogSize} منتج من متاجر أونلاين` : `Real web list: ${j.catalogSize} online products`)
        : (ar ? `اتجمعت 3 قوائم من ${j.catalogSize} منتج في المتجر` : `3 lists built from ${j.catalogSize} store products`));
    } catch (e) { setError(String(e)); } finally { setLoading(false); }
  }

  function patchBundles(next: SmartBundle[]) { setBundles(next.map(withTotals)); }

  function moveItem(fromId: string, toId: string, productId: string) {
    if (fromId === toId) return;
    // The same product can sit in several lists at once (each list is ranked
    // independently) — the old code then refused the move entirely ("already
    // there") and the item visibly stayed put. A move ALWAYS removes from the
    // source; it adds to the target only when absent there.
    const from = bundles.find((b) => b.id === fromId);
    const item = from?.items.find((i) => i.id === productId);
    if (!from || !item) return;
    const to = bundles.find((b) => b.id === toId);
    if (!to) return;
    const merged = to.items.some((i) => i.id === productId);
    setBundles((prev) => prev.map((b) => {
      if (b.id === fromId) return withTotals({ ...b, items: b.items.filter((i) => i.id !== productId) });
      if (b.id === toId && !merged) return withTotals({ ...b, items: [...b.items, item] });
      return b;
    }));
    toast.success(merged
      ? (ar ? "كانت موجودة في القايمة التانية — اتشالت من هنا" : "Already in the other list — removed from here")
      : (ar ? "اتنقل المنتج بين القوائم" : "Moved between lists"));
  }

  function removeItem(bundleId: string, productId: string) {
    setBundles((prev) => prev.map((b) => (b.id === bundleId ? withTotals({ ...b, items: b.items.filter((i) => i.id !== productId) }) : b)));
  }

  function replaceItem(bundleId: string, item: Product & { score: number; qty: number }) {
    const slot = item.needSlot ?? "";
    const candidates = alts[slot] ?? [];
    setBundles((prev) => prev.map((b) => {
      if (b.id !== bundleId) return b;
      const ids = new Set(b.items.map((i) => i.id));
      const next = candidates.find((c) => c.id !== item.id && !ids.has(c.id)) ?? candidates.find((c) => c.id !== item.id);
      if (!next) { toast.info(ar ? "مفيش بديل تاني للحاجة دي" : "No other alternative"); return b; }
      return withTotals({ ...b, items: b.items.map((i) => (i.id === item.id ? { ...next, qty: i.qty } : i)) });
    }));
  }

  function approve(b: SmartBundle) {
    setApprovedId(b.id);
    setInvoiceNo(`SL-INV-${Date.now().toString().slice(-6)}`);
    toast.success(ar ? "اعتمدت القايمة — دي فاتورة مبدئية للمعاينة" : "List approved — preliminary invoice ready");
    setTimeout(() => document.getElementById("smart-invoice")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  function copyInvoice() {
    if (!approved) return;
    const lines = [
      `Souk Lens — ${invoiceNo}`, `${ar ? approved.title_ar : approved.title_en}`,
      ...approved.items.map((i) => `• ${ar ? i.name_ar : i.name_en} — ${formatPrice(i.price, i.currency)}`),
      `${ar ? "الإجمالي" : "Total"}: ${formatPrice(approved.total, currency)}`,
    ];
    navigator.clipboard.writeText(lines.join("\n")).then(() => toast.success(ar ? "اتنسخت الفاتورة" : "Invoice copied")).catch(() => toast.error("Copy failed"));
  }

  function downloadInvoice() {
    if (!approved) return;
    const blob = new Blob([JSON.stringify({ invoiceNo, bundle: approved }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${invoiceNo}.json`; a.click(); URL.revokeObjectURL(a.href);
  }

  const visibleBundles = isMobile ? bundles.filter((b) => b.id === activeBundle) : bundles;
  const avgRating = (b: SmartBundle) => {
    const rated = b.items.filter((i) => typeof i.rating === "number");
    return rated.length ? (rated.reduce((s, i) => s + (i.rating ?? 0), 0) / rated.length).toFixed(1) : "—";
  };

  return (
    <div className="space-y-4">
      <Card className="animate-souk-in overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><Sparkles className="text-primary" />{ar ? "السوق الذكي" : "Smart Market"}</CardTitle>
          <CardDescription className="leading-7">
            {ar ? "الفكرة تعتمد على منتجات فعلية داخل المتجر — وحاليًا النسخة تجريبية: منتجاتك المحفوظة حقيقية 100%، والباقي كتالوج عينات مُعلَّم. أو ابحث في متاجر ومنصات أخرى بقائمة ويب حقيقية." : "The idea runs on real in-store products — the current version is experimental: your saved products are 100% real, the rest is a labeled sample catalog. Or search other stores and platforms for a real web list."}
          </CardDescription>
          <div className="flex flex-wrap gap-2 pt-1" role="radiogroup" aria-label={ar ? "نطاق البحث" : "Search scope"}>
            <Button size="sm" variant={scope === "store" ? "default" : "outline"} onClick={() => setScope("store")}>{ar ? "داخل متجري (حقيقي + عينات مُعلَّمة)" : "My store (real + labeled samples)"}</Button>
            <Button size="sm" variant={scope === "web" ? "default" : "outline"} onClick={() => setScope("web")}>{ar ? "متاجر ومنصات أخرى (ويب حقيقي)" : "Other stores (real web)"}</Button>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Badge variant="gold">{ar ? "مخزون سوق تجريبي" : "Sample marketplace inventory"}</Badge>
            <Badge variant={savedProducts.length ? "accent" : "secondary"}>{ar ? `+ منتجاتك المحفوظة الحقيقية (${savedProducts.length})` : `+ your real saved products (${savedProducts.length})`}</Badge>
            {counts ? <Badge variant="outline">{ar ? `اتبحث في ${counts.total} منتج (${counts.saved} محفوظ + ${counts.demo} عينة)` : `Searched ${counts.total} (${counts.saved} saved + ${counts.demo} sample)`}</Badge> : null}
          </div>
          <p className="pt-1 text-[11px] text-muted-foreground" dir="auto">{ar ? "منتجات العينة للتوضيح فقط — بلا تقييمات أو مبيعات مخترعة، وصورها من Unsplash (التفاصيل في ATTRIBUTION.md). منتجاتك المحفوظة بياناتها كما أدخلتها أنت." : "Sample items are illustrative only — no invented reviews or sales, photos by Unsplash (see ATTRIBUTION.md). Your saved products keep exactly the data you entered."}</p>
          <div className="pt-1"><HowItWorks lang={lang} steps={ar ? ["اختار احتياجًا جاهزًا (دراسة، شقة، عروسين…) أو اكتب احتياجك بكلامك، وحدد ميزانيتك وأولويتك: أرخص سعر، أفضل جودة إعلان، أسرع توصيل، أو ثقة موثقة.", "اضغط «ابني 3 قوائم ذكية»: الوكيل الذكي يبحث في مخزون العرض ومنتجاتك المحفوظة ويجمّع 3 قوائم مرتبة حسب أولويتك.", "قارن القوائم بالإجمالي والتوفير ومدة التوصيل، وانقل أي منتج من قايمة لقايمة أو بدّله ببديل مقترح.", "اعتمد القايمة اللي عجبتك — هتطلع فاتورة مبدئية للمعاينة، ومنها ضيفها للسلة للدفع أو احفظها في منتجاتي."] : ["Pick a ready need (study, apartment, wedding…) or write your own, set your budget and priority: lowest price, best listing quality, fastest delivery, or verified trust.", "Press Build 3 smart lists: the agent searches the sample inventory and your saved products and assembles 3 ranked lists.", "Compare lists by total, savings and delivery time; move any item between lists or swap it for a suggested alternative.", "Approve the list you like — a preliminary invoice appears for review, then add it to the cart for checkout or save it to My products."]} /></div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" role="list" aria-label="presets">
            {PRESETS.map((p) => (
              <button key={p.id} type="button" onClick={() => { setPresetId(p.id); setQuery(ar ? p.title_ar : p.title_en); }}
                className={`min-h-11 shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition active:scale-[.98] ${presetId === p.id ? "border-primary bg-primary text-white shadow-lg shadow-primary/25" : "bg-card hover:border-primary/50"}`}>
                {p.emoji} {ar ? p.title_ar : p.title_en}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="smart-q">{ar ? "عاوز تشتري ايه؟" : "What do you want to buy?"}</Label>
            <Textarea id="smart-q" value={query} onChange={(e) => setQuery(e.target.value)} rows={3}
              placeholder={ar ? "مثال: عاوز أجهز شقة صغيرة بأقل من 20000، أو أغراض دراسة لابني…" : "e.g. furnish a small apartment under 20000…"} />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="smart-budget">{ar ? "الميزانية (اختياري)" : "Budget (optional)"}</Label>
              <Input id="smart-budget" inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="20000" />
              <Hint>{ar ? "اتركها فاضية بدون حد أقصى — تُستخدم لضبط القوائم على ميزانيتك." : "Leave empty for no cap — used to fit the lists to your budget."}</Hint>
            </div>
            <div className="space-y-1.5">
              <Label>{ar ? "الأهم عندك" : "Priority"}</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="balanced">{ar ? "توازن (موصى به)" : "Balanced"}</SelectItem>
                  <SelectItem value="price">{ar ? "أرخص سعر وأعلى خصم" : "Lowest price"}</SelectItem>
                  <SelectItem value="rating">{ar ? "أفضل جودة إعلان" : "Best listing quality"}</SelectItem>
                  <SelectItem value="delivery">{ar ? "أسرع توصيل" : "Fastest delivery"}</SelectItem>
                  <SelectItem value="trust">{ar ? "ثقة موثقة عند توفرها" : "Verified trust when present"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-end">
                <Button size="lg" className="w-full" onClick={() => run()} disabled={loading}>
                  <Sparkles />{loading ? (ar ? "بيجمع القوائم…" : "Building lists…") : scope === "web" ? (ar ? "ابحث في الويب" : "Search the web") : (ar ? "ابني 3 قوائم ذكية" : "Build 3 smart lists")}
                </Button>
              </div>
              <Hint>{scope === "web"
                ? (ar ? "قائمة ويب حقيقية من متاجر أونلاين بروابطها — تُحفظ وتُفوتر وتُنزّل، ولا تُدفع من هنا." : "A real web list from online stores with links — saved, invoiced and downloaded, never checked out here.")
                : (ar ? "الوكيل يبحث في الكتالوج ومنتجاتك، يجمّع 3 قوائم مرتبة، ويحسب الفواتير تلقائيًا." : "The agent searches the catalog and your products, assembles 3 ranked lists, and invoices automatically.")}</Hint>
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Card className="border-destructive/50 bg-destructive/10 p-5"><p className="font-bold">{ar ? "حصلت مشكلة" : "Error"}</p><p className="mt-1 text-sm leading-7 text-muted-foreground">{error}</p></Card>
      ) : null}

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-3">{[0, 1, 2].map((i) => <Card key={i} className="space-y-3 p-4"><Skeleton className="h-6 w-2/3" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-10 w-full" /></Card>)}</div>
      ) : null}

      {trace ? <ModelTrace trace={trace} lang={lang} /> : null}

      {intent && bundles.length ? (
        <Card className="border-accent/40 bg-accent/10 p-4 animate-souk-in">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent">{ar ? intent.title_ar : intent.title_en}</Badge>
            <span className="text-sm leading-7">{intent.note}</span>
            <span className="ms-auto text-xs text-muted-foreground">{ar ? "قارن الإجمالي والتوفير وأيام التوصيل ومتوسط التقييم تحت" : "Compare total, savings, delivery and rating below"}</span>
          </div>
        </Card>
      ) : null}

      {bundles.length && isMobile ? (
        <div className="space-y-2">
          <Label>{ar ? "اختار القايمة" : "Choose list"}</Label>
          <Select value={activeBundle} onValueChange={setActiveBundle}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{bundles.map((b) => <SelectItem key={b.id} value={b.id}>{ar ? b.title_ar : b.title_en} — {formatPrice(b.total, currency)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      ) : null}

      {visibleBundles.length ? (
        <div className="grid items-start gap-4 lg:grid-cols-3">
          {visibleBundles.map((b) => (
            <BundleCard key={b.id} bundle={b} allBundles={bundles} ar={ar} savedIds={savedIds}
              onMove={moveItem} onRemove={removeItem} onReplace={replaceItem}
              onDetails={onDetails} onApprove={() => approve(b)} approved={approvedId === b.id} avgRating={avgRating(b)} />
          ))}
        </div>
      ) : null}

      {approved ? (
        <Card id="smart-invoice" className="animate-souk-in overflow-hidden border-gold/50">
          <CardHeader className="bg-[#ffd166]/10">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="flex items-center gap-2 text-xl"><FileText className="text-[#ffd166]" />{ar ? "فاتورة مبدئية للمعاينة" : "Preliminary invoice"}</CardTitle>
              <Badge variant="gold">{invoiceNo}</Badge>
              <Badge variant="outline">{new Date().toLocaleDateString(ar ? "ar-EG" : "en-GB")}</Badge>
              <Badge variant="accent">{ar ? approved.title_ar : approved.title_en}</Badge>
            </div>
            <CardDescription>{ar ? "دي معاينة قبل الدفع — راجع الأسعار والشحن والتوصيل، وبعدين ضيفها للسلة." : "Preview before payment — review prices, shipping and delivery, then add to cart."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-hidden rounded-xl border">
              {approved.items.map((i) => (
                <div key={i.id} className="flex items-center justify-between gap-3 border-b bg-card px-3.5 py-3 text-sm last:border-0">
                  <span className="min-w-0"><span className="block truncate font-bold">{ar ? i.name_ar : i.name_en}</span><span className="text-xs text-muted-foreground">{i.sellerName} · {ar ? "توصيل" : "Delivery"} {i.deliveryDays}d</span></span>
                  <span className="shrink-0 font-extrabold">{formatPrice(i.price * i.qty, i.currency)}</span>
                </div>
              ))}
            </div>
            <div className="grid gap-2 text-sm leading-8 sm:grid-cols-2">
              <InvoiceRow label={ar ? "المجموع الفرعي" : "Subtotal"} value={formatPrice(approved.subtotal, currency)} />
              <InvoiceRow label={ar ? "وفرت من الخصومات" : "Discount savings"} value={`-${formatPrice(approved.savings, currency)}`} accent />
              <InvoiceRow label={approved.shipping === 0 ? (ar ? "الشحن (مجاني فوق 5000)" : "Shipping (free 5000+)") : (ar ? "الشحن" : "Shipping")} value={approved.shipping === 0 ? (ar ? "مجاني" : "Free") : formatPrice(approved.shipping, currency)} />
              <InvoiceRow label={ar ? "أقصى مدة توصيل" : "Max delivery"} value={`${approved.maxDeliveryDays} ${ar ? "يوم" : "days"}`} />
            </div>
            <Separator />
            <div className="flex items-center justify-between text-lg font-black"><span>{ar ? "الإجمالي المستحق" : "Grand total"}</span><span className="text-accent">{formatPrice(approved.total, currency)}</span></div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {!(approved.items.length && approved.items.some((i) => (i.source as { label?: string } | undefined)?.label === "external")) ? (
                <Button size="lg" className="flex-1" onClick={() => { onAddToCart(approved.items); toast.success(ar ? "اتضافت للسلة — افتح السلة من فوق للدفع" : "Added to cart"); }}>
                  <ShoppingCart />{ar ? "أضف للسلة للدفع" : "Add to cart & pay"}
                </Button>
              ) : (
                <div className="flex-1 rounded-xl border border-dashed p-3 text-center text-xs leading-6 text-muted-foreground">
                  {ar ? "منتجات خارجية من متاجر أخرى — لا دفع من هنا. احفظ القائمة في منتجاتك ونزّل الفاتورة." : "External products from other stores — no checkout here. Save the list to My products and download the invoice."}
                </div>
              )}
              <Button size="lg" variant="accent" onClick={() => onSaveProducts(approved.items)}><PackagePlus />{ar ? "حفظ في منتجاتي" : "Save products"}</Button>
              <Button size="lg" variant="outline" onClick={copyInvoice}><Copy />{ar ? "نسخ" : "Copy"}</Button>
              <Button size="lg" variant="outline" onClick={downloadInvoice}><Download />JSON</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function BundleCard({ bundle: b, allBundles, ar, savedIds, onMove, onRemove, onReplace, onDetails, onApprove, approved, avgRating }: {
  bundle: SmartBundle; allBundles: SmartBundle[]; ar: boolean; savedIds: Set<string>;
  onMove: (from: string, to: string, id: string) => void;
  onRemove: (bundleId: string, id: string) => void;
  onReplace: (bundleId: string, item: Product & { score: number; qty: number }) => void;
  onDetails: (p: Product) => void; onApprove: () => void; approved: boolean; avgRating: string;
}) {
  const others = allBundles.filter((x) => x.id !== b.id);
  // Controlled per-row target so the menu resets after every move and the
  // same destination can be picked again (uncontrolled kept the old value
  // and a repeat pick fired nothing).
  const [moveSel, setMoveSel] = useState<Record<string, string>>({});
  return (
    <Card className={`animate-souk-in overflow-hidden transition hover:shadow-xl hover:shadow-primary/10 ${approved ? "border-accent ring-1 ring-accent" : ""}`}>
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div><CardTitle className="text-lg">{ar ? b.title_ar : b.title_en}</CardTitle><CardDescription>{b.desc_ar}</CardDescription></div>
          {approved ? <Badge variant="accent"><CheckCheck className="me-1 h-3 w-3" />{ar ? "معتمدة" : "Approved"}</Badge> : null}
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <Mini label={ar ? "الإجمالي" : "Total"} value={formatPrice(b.total, b.items[0]?.currency ?? "EGP")} strong />
          <Mini label={ar ? "وفرت" : "Saved"} value={formatPrice(b.savings, b.items[0]?.currency ?? "EGP")} />
          <Mini label={ar ? "توصيل" : "Delivery"} value={`${b.maxDeliveryDays}d · ★${avgRating}`} />
        </div>
        <Progress value={Math.min(100, Math.round((b.items.reduce((s, i) => s + i.score, 0) / Math.max(1, b.items.length))))} />
      </CardHeader>
      <CardContent className="space-y-2.5">
        {b.items.length ? b.items.map((i) => (
          <div key={i.id} className="rounded-xl border bg-card/60 p-2.5 transition hover:border-primary/40">
            <div className="flex gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={i.images[0]} alt={i.name_en} className="h-16 w-16 shrink-0 rounded-lg object-cover" loading="lazy" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-extrabold">{ar ? i.name_ar : i.name_en}</p>
                <p className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                  {typeof i.rating === "number" ? <span className="inline-flex items-center gap-0.5"><Star className="h-3 w-3 fill-[#ffd166] text-[#ffd166]" />{i.rating} ({i.reviewCount ?? 0})</span> : null}
                  <span className="inline-flex items-center gap-0.5">{i.sellerVerified ? <BadgeCheck className="h-3.5 w-3.5 text-accent" /> : null}{i.sellerName}</span>
                  {savedIds.has(i.id) ? <Badge variant="accent" className="text-[9px]">{ar ? "من منتجاتي" : "Mine"}</Badge> : <Badge variant="gold" className="text-[9px]">{ar ? "عينة" : "Sample"}</Badge>}
                  <span className="inline-flex items-center gap-0.5"><Truck className="h-3 w-3" />{i.deliveryDays}d</span>
                </p>
                <p className="mt-0.5 text-[13px]"><strong className="text-accent">{formatPrice(i.price, i.currency)}</strong>{i.compareAtPrice ? <span className="ms-1.5 text-[11px] text-muted-foreground line-through">{formatPrice(i.compareAtPrice, i.currency)}</span> : null}<Badge variant="gold" className="ms-2">{i.score}</Badge></p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => onDetails(i)}><Eye />{ar ? "تفاصيل" : "Details"}</Button>
              <Button size="sm" variant="ghost" onClick={() => onReplace(b.id, i)} aria-label="replace"><RefreshCw /></Button>
              <Button size="sm" variant="ghost" onClick={() => onRemove(b.id, i.id)} aria-label="remove"><X className="text-destructive" /></Button>
              <div className="w-[118px]">
                <Select value={moveSel[i.id] ?? ""} onValueChange={(to) => { setMoveSel((m) => ({ ...m, [i.id]: "" })); onMove(b.id, to, i.id); }}>
                  <SelectTrigger className="h-9 min-h-9 text-xs"><SelectValue placeholder={ar ? "نقل لقايمة…" : "Move to…"} /></SelectTrigger>
                  <SelectContent>{others.map((o) => <SelectItem key={o.id} value={o.id}>{ar ? o.title_ar : o.title_en}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )) : <p className="py-6 text-center text-sm text-muted-foreground">{ar ? "القايمة فاضية — انقل لها منتجات من قايمة تانية" : "Empty — move items here"}</p>}
        <Button className="w-full" variant={approved ? "accent" : "default"} onClick={onApprove} disabled={!b.items.length}>
          <CheckCheck />{approved ? (ar ? "دي المعتمدة — شوف الفاتورة تحت" : "Approved — see invoice") : (ar ? "اعتماد القايمة دي" : "Approve this list")}
        </Button>
      </CardContent>
    </Card>
  );
}

function Mini({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className="rounded-lg bg-secondary/70 px-2 py-2"><div className="text-[10px] text-muted-foreground">{label}</div><div className={strong ? "font-black text-accent" : "font-bold"}>{value}</div></div>;
}
function InvoiceRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"><span className="text-muted-foreground">{label}</span><strong className={accent ? "text-accent" : ""}>{value}</strong></div>;
}
