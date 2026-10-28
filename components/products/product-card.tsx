"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { buildAdText, type Product } from "@/lib/product";
import { cn, formatPrice } from "@/lib/utils";
import { BadgeCheck, Box, Check, ChevronDown, Copy, ExternalLink, Eye, Gavel, Globe2, ImageOff, Images, Megaphone, PackagePlus, Radio, Rotate3D, ShoppingCart, Sparkles, Star, Trash2, Truck, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { ProductBuyerView } from "@/components/products/product-buyer-view";

const SOURCE_LABEL: Record<string, { ar: string; en: string; variant: "default" | "accent" | "gold" | "secondary" }> = {
  image: { ar: "من صورة", en: "From image", variant: "default" },
  text: { ar: "من وصف", en: "From text", variant: "accent" },
  voice: { ar: "من صوت", en: "From voice", variant: "gold" },
  url: { ar: "من رابط", en: "From URL", variant: "secondary" },
  import: { ar: "نقل متجر", en: "Store import", variant: "accent" },
  manual: { ar: "يدوي", en: "Manual", variant: "secondary" },
};

export function ProductCard({
  product, lang, isMine, onAdd, onRemove, onDetails, onCart, onOpenPage, mediaBusy, onStudioShot,
}: {
  product: Product; lang: "ar" | "en";
  isMine?: boolean;
  onAdd?: (p: Product) => void;
  onRemove?: (id: string) => void;
  onDetails: (p: Product) => void;
  onCart?: (p: Product) => void;
  onOpenPage?: (p: Product) => void;
  mediaBusy?: boolean;
  onStudioShot?: (p: Product) => void;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const [added, setAdded] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [imgError, setImgError] = useState(false);
  const ar = lang === "ar";
  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;
  const img = product.images[imgIdx];
  const srcLabel = SOURCE_LABEL[product.source.type] ?? SOURCE_LABEL.manual;

  async function copyAd() {
    try { await navigator.clipboard.writeText(buildAdText(product, lang)); toast.success(ar ? "اتنسخ إعلان المنتج" : "Ad copied"); }
    catch { toast.error(ar ? "تعذر النسخ" : "Copy failed"); }
  }

  return (
    <Card className="group overflow-hidden animate-souk-in hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex flex-col md:flex-row">
      <div className="relative aspect-[4/3] bg-muted overflow-hidden md:aspect-auto md:min-h-[270px] md:w-72 lg:w-80 shrink-0">
        {img && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={product.name_en} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" onError={() => setImgError(true)} />
        ) : (
          <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 text-muted-foreground md:min-h-[270px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/empty-stall.jpg" alt="" className="w-28 rounded-xl opacity-80" />
            <span className="inline-flex items-center gap-1 text-xs"><ImageOff className="h-3.5 w-3.5" />{ar ? "بدون صورة" : "No image"}</span>
          </div>
        )}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <Badge variant={srcLabel.variant}>{ar ? srcLabel.ar : srcLabel.en}</Badge>
          {discount > 0 ? <Badge variant="destructive">-{discount}%</Badge> : null}
        </div>
        {product.images.length > 1 ? (
          <div className="absolute inset-x-3 bottom-3 flex gap-1.5 overflow-x-auto no-scrollbar">
            {product.images.slice(0, 5).map((src, i) => (
              <button key={src + i} type="button" onClick={() => { setImgIdx(i); setImgError(false); }} aria-label={`image ${i + 1}`}
                className={cn("h-11 w-11 shrink-0 overflow-hidden rounded-lg border-2 transition min-h-11 min-w-11", i === imgIdx ? "border-accent" : "border-white/30 opacity-70 hover:opacity-100")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-extrabold leading-8">{ar ? product.name_ar : product.name_en}</h3>
            <p className="truncate text-xs text-muted-foreground" dir="auto">{product.name_en} · {product.sku}</p>
          </div>
          <div className="shrink-0 text-end">
            <div className="text-xl font-black text-accent">{formatPrice(product.price, product.currency)}</div>
            {product.compareAtPrice ? <div className="text-xs text-muted-foreground line-through">{formatPrice(product.compareAtPrice, product.currency)}</div> : null}
          </div>
        </div>

        <p className="line-clamp-2 text-[13px] leading-6 text-muted-foreground">{ar ? product.shortDescription_ar : product.description_en}</p>

        {product.rating ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-bold text-foreground"><Star className="h-3.5 w-3.5 fill-[#ffd166] text-[#ffd166]" />{product.rating} <span className="font-normal text-muted-foreground">({product.reviewCount ?? 0})</span></span>
            {product.sellerName ? <span className="inline-flex items-center gap-1">{product.sellerVerified ? <BadgeCheck className="h-4 w-4 text-accent" /> : null}{product.sellerName}</span> : null}
            {product.deliveryDays ? <span className="inline-flex items-center gap-1"><Truck className="h-3.5 w-3.5" />{product.deliveryDays}{ar ? " يوم" : "d"}</span> : null}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{ar ? product.category_ar : product.category}</Badge>
          <Badge variant="outline">{product.condition}</Badge>
          <Badge variant={product.stock > 0 ? "success" : "destructive"}>{ar ? `متاح ${product.stock}` : `Stock ${product.stock}`}</Badge>
          {product.brand !== "—" ? <Badge variant="secondary">{product.brand}</Badge> : null}
          {product.salesMode === "auction" ? <Badge variant="gold"><Gavel className="me-1 h-3 w-3" />{ar ? "مزاد" : "Auction"}</Badge> : null}
          {product.salesMode === "live" ? <Badge variant="destructive"><Radio className="me-1 h-3 w-3" />{ar ? "بث مباشر" : "Live"}</Badge> : null}
          {product.salesMode === "campaign" ? <Badge variant="accent"><Megaphone className="me-1 h-3 w-3" />{ar ? "حملة" : "Campaign"}</Badge> : null}
        </div>

        {product.variants.length ? (
          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-1.5">
              {product.variants.slice(0, 4).map((v) => (
                <span key={v.id} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2 py-1 text-[11px] font-bold text-secondary-foreground">
                  {v.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.image} alt="" className="h-5 w-5 rounded-full object-cover" loading="lazy" />
                  ) : null}
                  {ar ? (v.name_ar ?? v.name) : v.name}{typeof v.price === "number" ? ` · ${formatPrice(v.price, product.currency)}` : ""}
                </span>
              ))}
              {product.variants.length > 4 ? <span className="text-[11px] text-muted-foreground">+{product.variants.length - 4}</span> : null}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline"><Images className="me-1 h-3 w-3" />{product.variants.length} {ar ? "متغيرات" : "variants"}{product.variants.some((v) => v.image) ? (ar ? " بالصور" : " with photos") : ""}</Badge>
              {product.angleImages?.length ? <Badge variant="gold"><Rotate3D className="me-1 h-3 w-3" />360°</Badge> : null}
              {product.glbUrl ? <Badge variant="accent"><Box className="me-1 h-3 w-3" />3D</Badge> : null}
              {product.shippingDetails?.etaDaysMin !== undefined ? <Badge variant="outline"><Truck className="me-1 h-3 w-3" />{ar ? `التوصيل ${product.shippingDetails.etaDaysMin}–${product.shippingDetails.etaDaysMax ?? product.shippingDetails.etaDaysMin} يوم` : `Delivery ${product.shippingDetails.etaDaysMin}–${product.shippingDetails.etaDaysMax ?? product.shippingDetails.etaDaysMin}d`}</Badge> : null}
              {product.returnPolicy?.days !== undefined ? <Badge variant="outline"><Undo2 className="me-1 h-3 w-3" />{ar ? `استرجاع ${product.returnPolicy.days} يوم` : `${product.returnPolicy.days}-day returns`}</Badge> : null}
              {product.availableCountries?.length ? <Badge variant="outline"><Globe2 className="me-1 h-3 w-3" />{product.availableCountries.length} {ar ? "دول" : "countries"}</Badge> : null}
            </div>
          </div>
        ) : null}

        <div className="mt-auto space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-gold" />{ar ? "اكتمال الإعلان" : "Listing quality"}</span>
            <span className="font-bold text-foreground">{product.qualityScore}%</span>
          </div>
          <Progress value={product.qualityScore} />
        </div>
      </CardContent>

      <CardFooter className="flex-col items-stretch gap-2.5 p-5 pt-0">
        <div className="flex gap-2">
          <Button className="flex-1" size="lg" variant="outline" onClick={() => onDetails(product)}><Eye />{ar ? "التفاصيل" : "Details"}</Button>
          {isMine ? (
            <Button size="lg" variant="ghost" onClick={() => onRemove?.(product.id)} aria-label="delete"><Trash2 className="text-destructive" /></Button>
          ) : (
            <Button className="flex-1" size="lg" variant={added ? "accent" : "default"} onClick={() => { onAdd?.(product); setAdded(true); toast.success(ar ? "اتضاف لمنتجاتك بكامل تفاصيله" : "Saved with full details"); }}>
              {added ? <Check /> : <PackagePlus />}{added ? (ar ? "اتضاف" : "Added") : (ar ? "حفظ المنتج" : "Save")}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button className="flex-1" variant="secondary" onClick={() => setExpanded((v) => !v)} aria-label="expand full section" title={ar ? "قسم كامل بالتفاصيل تحت الكارت" : "Full section below the card"}>
            <ChevronDown className={`transition-transform ${expanded ? "rotate-180" : ""}`} />{expanded ? (ar ? "إخفاء القسم" : "Hide section") : (ar ? "القسم الكامل" : "Full section")}
          </Button>
          {onOpenPage ? <Button className="flex-1" variant="secondary" onClick={() => onOpenPage(product)} aria-label="buyer page" title={ar ? "صفحة المشتري الكاملة" : "Full buyer page"}><ExternalLink />{ar ? "صفحة المشتري" : "Buyer page"}</Button> : null}
          {onCart ? <Button size="lg" variant="accent" onClick={() => { onCart(product); toast.success(ar ? "اتضاف للسلة" : "Added to cart"); }} aria-label="add to cart"><ShoppingCart /></Button> : null}
          {onStudioShot && !product.studioImage ? <Button size="lg" variant="ghost" disabled={mediaBusy} onClick={() => onStudioShot(product)} aria-label="studio shot" title={ar ? "ولّد صورة ستوديو احترافية لهذا المنتج" : "Generate a professional studio shot for this product"}><Sparkles /></Button> : null}
          <Button size="lg" variant="ghost" onClick={copyAd} aria-label="copy ad"><Copy /></Button>
        </div>
      </CardFooter>
      </div>
      </div>
      {expanded ? (
        <div className="space-y-3 border-t bg-muted/30 p-5 animate-souk-in">
          <div className="flex items-center gap-2 text-sm font-extrabold">
            <Eye className="h-4 w-4 text-primary" />{ar ? "القسم الكامل — كل التفاصيل وخيارات التعديل" : "Full section — all details & edit options"}
            {mediaBusy ? <span className="ms-auto inline-flex items-center gap-1 text-[11px] text-accent"><span className="h-2 w-2 animate-pulse rounded-full bg-accent" />{ar ? "توليد صور المتغيرات و360°…" : "Generating variant & 360° shots…"}</span> : null}
          </div>
          <ProductBuyerView product={product} lang={lang} onAddToCart={onCart ? (p, q) => { for (let i = 0; i < q; i++) onCart(p); } : undefined} />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => onDetails(product)}><Eye />{ar ? "تعديل كامل" : "Full edit"}</Button>
            {onOpenPage ? <Button size="sm" variant="outline" onClick={() => onOpenPage(product)}><ExternalLink />{ar ? "صفحة المشتري" : "Buyer page"}</Button> : null}
            {isMine ? <Button size="sm" variant="ghost" onClick={() => onRemove?.(product.id)}><Trash2 className="text-destructive" />{ar ? "حذف" : "Delete"}</Button> : null}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
