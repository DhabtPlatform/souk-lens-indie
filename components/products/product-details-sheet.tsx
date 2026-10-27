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
import { buildAdText, type Product } from "@/lib/product";
import { productEconomics } from "@/lib/analytics";
import { formatPrice } from "@/lib/utils";
import { Copy, Download, Gavel, Link2, Megaphone, Radio, Save, Tag } from "lucide-react";
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
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    if (product) { setPrice(String(product.price)); setStock(String(product.stock)); setTitle(ar ? product.name_ar : product.name_en); setDesc(product.description_ar); setImgIdx(0); }
  }, [product, ar]);

  if (!product) return null;
  const item = product;
  const img = item.images[imgIdx];

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

          <Section title={ar ? "المتغيرات والأسعار" : "Variants & prices"}>
            <div className="overflow-hidden rounded-xl border">
              {product.variants.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-3 border-b bg-card px-3.5 py-3 text-sm last:border-0">
                  <div><div className="font-bold">{ar ? (v.name_ar ?? v.name) : v.name}</div><div className="text-xs text-muted-foreground">{v.sku ?? product.sku}{v.attributes ? " · " + Object.values(v.attributes).join(" / ") : ""}</div></div>
                  <div className="text-end"><div className="font-extrabold text-accent">{formatPrice(v.price ?? product.price, product.currency)}</div><div className="text-xs text-muted-foreground">{ar ? "متاح" : "Stock"} {v.stock ?? product.stock}</div></div>
                </div>
              ))}
            </div>
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
