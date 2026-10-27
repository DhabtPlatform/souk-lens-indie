"use client";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { StudioCompare } from "@/components/products/studio-compare";
import { SpinViewer } from "@/components/products/spin-viewer";
import { GlbViewer } from "@/components/products/glb-viewer";
import { buildAdText, type Product } from "@/lib/product";
import { productEconomics } from "@/lib/analytics";
import { formatPrice } from "@/lib/utils";
import { Copy, Download, Gavel, Globe2, Images, Link2, Loader2, Megaphone, MessageCircle, Radio, Rotate3D, Save, Share2, Box, Tag, Truck, Undo2 } from "lucide-react";
import { toast } from "sonner";

export function ProductDetailsSheet({
  product, lang, open, onOpenChange, editable, onSave,
}: {
  product: Product | null; lang: "ar" | "en";
  open: boolean; onOpenChange: (v: boolean) => void;
  editable?: boolean; onSave?: (id: string, patch: Partial<Product>) => void;
}) {
  const ar = lang === "ar";
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [glbDraft, setGlbDraft] = useState("");
  const [imgIdx, setImgIdx] = useState(0);
  const [selVarId, setSelVarId] = useState<string | null>(null);
  const [mediaBusy, setMediaBusy] = useState<"variants" | "spin" | null>(null);

  useEffect(() => {
    if (product) { setPrice(String(product.price)); setStock(String(product.stock)); setTitle(ar ? product.name_ar : product.name_en); setDesc(product.description_ar); setGlbDraft(product.glbUrl ?? ""); setImgIdx(0); setSelVarId(product.variants[0]?.id ?? null); setMediaBusy(null); }
  }, [product, ar]);

  if (!product) return null;
  const item = product;
  const selVar = item.variants.find((v) => v.id === selVarId) ?? item.variants[0];
  const img = selVar?.image ?? item.images[imgIdx];

  async function generateMedia(kind: "variants" | "spin") {
    if (!onSave) return;
    setMediaBusy(kind);
    try {
      const r = await fetch("/api/media", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: item.name_en,
          variants: kind === "variants" ? item.variants.map((v) => ({ id: v.id, label: `${v.name_ar ?? v.name} ${Object.values(v.attributes ?? {}).join(" ")}`.trim() })) : [],
          angles: kind === "spin",
        }),
      });
      const j = await r.json();
      if (!r.ok || j.ok === false) throw new Error(j.error ?? `HTTP ${r.status}`);
      if (kind === "variants") {
        const imgs = (j.variantImages ?? {}) as Record<string, string>;
        const ids = Object.keys(imgs);
        if (!ids.length) { toast.info(j.note ?? (ar ? "التوليد يحتاج المفتاح الحي" : "Generation needs the live key")); return; }
        onSave(item.id, { variants: item.variants.map((v) => (imgs[v.id] ? { ...v, image: imgs[v.id] } : v)) });
        toast.success(ar ? `اتولدت صور ${ids.length} متغيرات` : `${ids.length} variant shots generated`);
      } else {
        const shots = (j.angleImages ?? []) as string[];
        if (!shots.length) { toast.info(j.note ?? (ar ? "التوليد يحتاج المفتاح الحي" : "Generation needs the live key")); return; }
        onSave(item.id, { angleImages: shots });
        toast.success(ar ? "اتولد عرض 360°" : "360° views generated");
      }
    } catch (e) { toast.error(String(e)); } finally { setMediaBusy(null); }
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(item, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `${item.slug}.json`; a.click();
    URL.revokeObjectURL(a.href);
  }
  async function copyAd() {
    try { await navigator.clipboard.writeText(buildAdText(item, lang)); toast.success(ar ? "اتنسخ إعلان المنتج" : "Ad copied"); } catch { toast.error("Copy failed"); }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <div className="flex flex-wrap gap-1.5 pe-10">
            <Badge>{ar ? product.category_ar : product.category}</Badge>
            <Badge variant="outline">{product.condition}</Badge>
            <Badge variant="accent">{product.source.type}</Badge>
            {product.source.url ? <Badge variant="secondary"><Link2 className="me-1 h-3 w-3" />{ar ? "مصدر خارجي" : "External source"}</Badge> : null}
          </div>
          <SheetTitle className="text-2xl leading-9">{ar ? product.name_ar : product.name_en}</SheetTitle>
          <SheetDescription dir="auto">{product.name_en} · {product.sku} · {product.brand}</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 p-5">
          <div className="overflow-hidden rounded-2xl border bg-muted">
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt={product.name_en} className="aspect-[4/3] w-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/brand/empty-stall.jpg" alt="" className="mx-auto w-52 py-8" />
            )}
          </div>
          {product.images.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {product.images.map((src, i) => (
                <button key={src + i} type="button" onClick={() => setImgIdx(i)} className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 min-h-11 min-w-11" style={{ borderColor: i === imgIdx ? "#00d4a4" : "transparent" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          ) : null}

          {product.studioImage && product.sourceImage ? (
            <Section title={ar ? "قبل / بعد — Muse Image" : "Before / after — Muse Image"}>
              <StudioCompare before={product.sourceImage} after={product.studioImage} lang={lang} />
            </Section>
          ) : null}

          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label={ar ? "السعر" : "Price"} value={formatPrice(product.price, product.currency)} accent />
            <Stat label={ar ? "قبل الخصم" : "Before"} value={product.compareAtPrice ? formatPrice(product.compareAtPrice, product.currency) : "—"} />
            <Stat label={ar ? "المخزون" : "Stock"} value={String(product.stock)} />
          </div>

          {(() => { const eco = productEconomics(product); return (
            <Section title={ar ? "المبيعات والتكلفة والربح" : "Sales, cost & profit"}>
              <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
                <Stat label={ar ? "التكلفة" : "Unit cost"} value={formatPrice(eco.cost, product.currency)} />
                <Stat label={ar ? "ربح القطعة" : "Unit profit"} value={`${formatPrice(eco.unitProfit, product.currency)} · ${eco.marginPct}%`} accent />
                <Stat label={ar ? "اتباع" : "Sold"} value={`${eco.sold} · ${formatPrice(eco.revenue, product.currency)}`} />
                <Stat label={ar ? "صافي الربح" : "Net profit"} value={formatPrice(eco.profit, product.currency)} accent />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant={product.salesMode === "auction" ? "gold" : "secondary"}><Gavel className="me-1 h-3 w-3" />{ar ? "مزاد" : "Auction"}{product.salesMode === "auction" && product.auction ? `: ${formatPrice(product.auction.currentBid, product.currency)} · ${product.auction.bids} bids` : ""}</Badge>
                <Badge variant={product.salesMode === "live" ? "destructive" : "secondary"}><Radio className="me-1 h-3 w-3" />{ar ? "بث" : "Live"}{product.salesMode === "live" && product.liveSale ? `: ${product.liveSale.platform}` : ""}</Badge>
                <Badge variant={product.salesMode === "campaign" ? "accent" : "secondary"}><Megaphone className="me-1 h-3 w-3" />{ar ? "حملة" : "Campaign"}{product.salesMode === "campaign" && product.campaign ? `: ${product.campaign.channel}` : ""}</Badge>
                {(!product.salesMode || product.salesMode === "fixed") ? <Badge variant="outline"><Tag className="me-1 h-3 w-3" />{ar ? "سعر ثابت — فعّل قناة من إدارة المنتجات" : "Fixed price — enable a channel in Product management"}</Badge> : null}
              </div>
            </Section>
          ); })()}

          {editable ? (
            <div className="space-y-3 rounded-2xl border bg-card p-4">
              <h4 className="font-extrabold">{ar ? "تعديل سريع قبل النشر" : "Quick edit before publishing"}</h4>
              <div className="space-y-1.5"><Label htmlFor="p-title">{ar ? "الاسم" : "Name"}</Label><Input id="p-title" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label htmlFor="p-price">{ar ? "السعر" : "Price"}</Label><Input id="p-price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
                <div className="space-y-1.5"><Label htmlFor="p-stock">{ar ? "المخزون" : "Stock"}</Label><Input id="p-stock" inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} /></div>
              </div>
              <div className="space-y-1.5"><Label htmlFor="p-desc">{ar ? "الوصف" : "Description"}</Label><Textarea id="p-desc" value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} /></div>
              <Button className="w-full" onClick={() => { onSave?.(product.id, { price: Number(price) || product.price, stock: Number(stock) || 0, name_ar: ar ? title : product.name_ar, name_en: !ar ? title : product.name_en, description_ar: desc }); toast.success(ar ? "اتحفظت التعديلات" : "Saved"); }}><Save />{ar ? "حفظ التعديلات" : "Save edits"}</Button>
            </div>
          ) : null}

          <Section title={ar ? "الوصف الكامل" : "Full description"}>
            <p className="leading-8 text-muted-foreground">{product.description_ar}</p>
            <p className="leading-8 text-muted-foreground" dir="ltr">{product.description_en}</p>
          </Section>

          {product.features.length ? (
            <Section title={ar ? "المميزات" : "Features"}>
              <ul className="space-y-1.5">{product.features.map((f) => <li key={f} className="flex gap-2 text-sm leading-7"><span className="text-accent">•</span>{f}</li>)}</ul>
            </Section>
          ) : null}

          <Section title={ar ? "المتغيرات — أسعار وكميات وصور" : "Variants — prices, stock & photos"}>
            <div className="flex flex-wrap gap-1.5">
              {product.variants.map((v) => (
                <button key={v.id} type="button" onClick={() => setSelVarId(v.id)}
                  className="flex min-h-11 items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition active:scale-[.97]"
                  style={{ borderColor: selVar?.id === v.id ? "#00d4a4" : undefined, background: selVar?.id === v.id ? "rgba(0,212,164,.08)" : undefined }}>
                  {v.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.image} alt="" className="h-9 w-9 rounded-lg object-cover" loading="lazy" />
                  ) : null}
                  <span>{ar ? (v.name_ar ?? v.name) : v.name}</span>
                  <span className="text-accent">{formatPrice(v.price ?? product.price, product.currency)}</span>
                </button>
              ))}
            </div>
            <div className="overflow-hidden rounded-xl border">
              {product.variants.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-3 border-b bg-card px-3.5 py-3 text-sm last:border-0" style={{ background: selVar?.id === v.id ? "rgba(0,212,164,.05)" : undefined }}>
                  <div className="flex items-center gap-2.5">
                    {v.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.image} alt="" className="h-11 w-11 rounded-lg object-cover" loading="lazy" />
                    ) : null}
                    <div><div className="font-bold">{ar ? (v.name_ar ?? v.name) : v.name}</div><div className="text-xs text-muted-foreground">{v.sku ?? product.sku}{v.attributes ? " · " + Object.values(v.attributes).join(" / ") : ""}</div></div>
                  </div>
                  <div className="text-end"><div className="font-extrabold text-accent">{formatPrice(v.price ?? product.price, product.currency)}</div><div className="text-xs text-muted-foreground">{ar ? "متاح" : "Stock"} {v.stock ?? product.stock}</div></div>
                </div>
              ))}
            </div>
            {onSave ? (
              <div className="space-y-1.5">
                <Button variant="outline" className={`w-full ${mediaBusy === "variants" ? "btn-glow" : ""}`} disabled={mediaBusy !== null} onClick={() => generateMedia("variants")}>
                  {mediaBusy === "variants" ? <Loader2 className="animate-spin" /> : <Images />}{ar ? "ولّد صور كل المتغيرات بالذكاء" : "Generate every variant shot with AI"}
                </Button>
                <p className="text-[11px] leading-5 text-muted-foreground">{ar ? "صورة ستوديو لكل لون/مقاس من اسم المنتج — اختيار المتغير يعرض صورته فوق." : "A studio shot per color/size from the product name — selecting a variant previews its photo above."}</p>
              </div>
            ) : null}
          </Section>

          <Section title={ar ? "عرض 360° ومجسّم ثلاثي الأبعاد" : "360° & 3D model"}>
            {product.angleImages?.length ? (
              <SpinViewer images={product.angleImages} lang={lang} label={product.name_en} />
            ) : onSave ? (
              <div className="space-y-1.5">
                <Button variant="outline" className={`w-full ${mediaBusy === "spin" ? "btn-glow" : ""}`} disabled={mediaBusy !== null} onClick={() => generateMedia("spin")}>
                  {mediaBusy === "spin" ? <Loader2 className="animate-spin" /> : <Rotate3D />}{ar ? "ولّد صور 360° بالذكاء" : "Generate AI 360° views"}
                </Button>
                <p className="text-[11px] leading-5 text-muted-foreground">{ar ? "أربع زوايا (أمام/يمين/خلف/شمال) بعَارض تدوير تفاعلي — مولدة من اسم المنتج." : "Four angles (front/right/back/left) in an interactive spinner — generated from the product name."}</p>
              </div>
            ) : null}
            {product.glbUrl ? <GlbViewer url={product.glbUrl} lang={lang} /> : null}
            {editable ? (
              <div className="space-y-1.5">
                <Label htmlFor="p-glb">GLB — {ar ? "رابط أو ملف مجسّم حقيقي (اختياري)" : "real model URL or file (optional)"}</Label>
                <div className="flex gap-2">
                  <Input id="p-glb" dir="ltr" value={glbDraft.startsWith("blob:") ? "" : glbDraft} onChange={(e) => setGlbDraft(e.target.value)} placeholder="https://…/model.glb" />
                  <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-4 text-sm font-bold transition hover:border-primary/60 hover:bg-primary/5">
                    <Box className="h-4 w-4 text-accent" />{ar ? "ارفع ملف" : "Upload"}
                    <input type="file" accept=".glb,model/gltf-binary" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) { setGlbDraft(URL.createObjectURL(f)); toast.success(ar ? "اترفق المجسم للعرض" : "Model attached for viewing"); } }} />
                  </label>
                  <Button variant="outline" onClick={() => { onSave?.(product.id, { glbUrl: glbDraft.trim() || undefined }); toast.success(ar ? "اتحفظ رابط المجسم" : "Model URL saved"); }}><Box />{ar ? "حفظ" : "Save"}</Button>
                </div>
                <p className="text-[11px] leading-5 text-muted-foreground">{ar ? "ملف مرفوع يعمل هذه الجلسة فقط — للاحتفاظ الدائم ارفع المجسم على استضافة والصق رابطه. لا يوجد توليد GLB في نماذج Meta، لذا المجسم دائمًا حقيقي من البائع." : "An uploaded file works for this session only — host it and paste the URL to keep it. Meta models cannot generate GLB, so the model is always real, from the seller."}</p>
              </div>
            ) : null}
          </Section>

          {Object.keys(product.specs).length ? (
            <Section title={ar ? "المواصفات" : "Specifications"}>
              <div className="overflow-hidden rounded-xl border">
                {Object.entries(product.specs).map(([k, v]) => (
                  <div key={k} className="grid grid-cols-2 border-b bg-card px-3.5 py-2.5 text-sm last:border-0"><span className="font-bold">{k}</span><span className="text-muted-foreground">{v}</span></div>
                ))}
              </div>
            </Section>
          ) : null}

          <Section title={ar ? "الشحن والتوصيل والسياسات" : "Shipping, delivery & policies"}>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border bg-card p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground"><Truck className="h-3.5 w-3.5 text-primary" />{ar ? "الشحن والتوصيل" : "Shipping & delivery"}</div>
                <p className="mt-1 text-sm font-extrabold">{product.shippingDetails?.carrier ?? (ar ? "شحن حسب المدينة" : "City-based shipping")}</p>
                <p className="text-xs leading-6 text-muted-foreground">
                  {product.shippingDetails?.etaDaysMin !== undefined ? `${ar ? "الوصول خلال" : "Arrives in"} ${product.shippingDetails.etaDaysMin}–${product.shippingDetails.etaDaysMax ?? product.shippingDetails.etaDaysMin} ${ar ? "أيام" : "days"} · ` : ""}
                  {product.shippingDetails?.cost !== undefined ? `${ar ? "التكلفة" : "Cost"} ${formatPrice(product.shippingDetails.cost, product.currency)}` : product.shipping}
                  {product.shippingDetails?.freeOver ? ` · ${ar ? "مجاني فوق" : "Free over"} ${formatPrice(product.shippingDetails.freeOver, product.currency)}` : ""}
                  {product.shippingDetails?.shipsFrom ? ` · ${ar ? "يُشحن من" : "Ships from"} ${product.shippingDetails.shipsFrom}` : ""}
                </p>
              </div>
              <div className="rounded-xl border bg-card p-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground"><Undo2 className="h-3.5 w-3.5 text-primary" />{ar ? "الاسترجاع والضمان" : "Returns & warranty"}</div>
                <p className="mt-1 text-sm font-extrabold">{product.returnPolicy?.days !== undefined ? `${ar ? "استرجاع خلال" : "Returns within"} ${product.returnPolicy.days} ${ar ? "يوم" : "days"}` : (ar ? "حسب سياسة البائع" : "Per seller policy")}</p>
                <p className="text-xs leading-6 text-muted-foreground">{product.returnPolicy?.terms ?? ""}{product.returnPolicy?.terms ? " · " : ""}{ar ? "الضمان" : "Warranty"}: {product.warranty}</p>
              </div>
            </div>
            {product.availableCountries?.length ? (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground"><Globe2 className="h-3.5 w-3.5" />{ar ? "التوصيل متاح لـ:" : "Ships to:"}</span>
                {product.availableCountries.map((c) => <Badge key={c} variant="outline">{c}</Badge>)}
              </div>
            ) : null}
          </Section>

          <div className="flex flex-wrap gap-1.5">
            {[...product.tags, ...product.materials, ...product.colors, ...product.sizes].map((x) => <Badge key={x} variant="outline">{x}</Badge>)}
          </div>

          <Separator />
          <div className="grid gap-2 text-sm leading-7 text-muted-foreground">
            <p><strong className="text-foreground">{ar ? "الشحن:" : "Shipping:"}</strong> {product.shipping}</p>
            <p><strong className="text-foreground">{ar ? "الضمان:" : "Warranty:"}</strong> {product.warranty}</p>
            <p><strong className="text-foreground">SEO:</strong> {product.seoTitle}</p>
            {product.source.transcript ? <p><strong className="text-foreground">{ar ? "النص الصوتي:" : "Transcript:"}</strong> {product.source.transcript}</p> : null}
            {product.source.url ? <p className="break-all" dir="ltr"><strong>Source:</strong> {product.source.url}</p> : null}
          </div>

          <Section title={ar ? "انشر وبِع — قناة البائع الحقيقية" : "Publish & sell — the seller's real channel"}>
            <div className="grid gap-2 sm:grid-cols-3">
              <Button variant="accent" className="bg-[#22c55e] text-white shadow-lg shadow-[#22c55e]/25 hover:bg-[#22c55e]/90" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(buildAdText(item, lang) + (item.images[0] ? `\n${item.images[0]}` : ""))}`, "_blank", "noopener")}>
                <MessageCircle />{ar ? "واتساب" : "WhatsApp"}
              </Button>
              <Button variant="outline" onClick={copyAd}><Share2 />{ar ? "نسخ لمنشور فيسبوك" : "Copy for Facebook"}</Button>
              <Button variant="outline" onClick={downloadJson}><Download />JSON</Button>
            </div>
            <p className="text-[11px] leading-5 text-muted-foreground">{ar ? "نص الإعلان المنسق + رابط الصورة بيتبعتوا جاهزين — لأن بائع السوق بيبيع من واتساب مش من متجر تطبيقات." : "Formatted ad text + image link, ready to send — because market sellers sell on WhatsApp, not app stores."}</p>
          </Section>

          <div className="sticky bottom-0 flex gap-2 border-t bg-background/90 py-4 backdrop-blur">
            <Button className="flex-1" onClick={copyAd}><Copy />{ar ? "نسخ الإعلان" : "Copy ad"}</Button>
            <Button variant="outline" onClick={downloadJson}><Download />JSON</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return <div className="rounded-xl border bg-card p-3"><div className="text-[11px] text-muted-foreground">{label}</div><div className={accent ? "font-black text-accent" : "font-extrabold"}>{value}</div></div>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="space-y-2.5"><h4 className="font-extrabold">{title}</h4>{children}</section>;
}
