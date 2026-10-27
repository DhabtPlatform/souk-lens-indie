"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { buildAdText, type Product } from "@/lib/product";
import { cn, formatPrice } from "@/lib/utils";
import { BadgeCheck, Check, Copy, Eye, Gavel, ImageOff, Megaphone, PackagePlus, Radio, ShoppingCart, Sparkles, Star, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";

const SOURCE_LABEL: Record<string, { ar: string; en: string; variant: "default" | "accent" | "gold" | "secondary" }> = {
  image: { ar: "من صورة", en: "From image", variant: "default" },
  text: { ar: "من وصف", en: "From text", variant: "accent" },
  voice: { ar: "من صوت", en: "From voice", variant: "gold" },
  url: { ar: "من رابط", en: "From URL", variant: "secondary" },
  import: { ar: "نقل متجر", en: "Store import", variant: "accent" },
  manual: { ar: "يدوي", en: "Manual", variant: "secondary" },
};

export function ProductCard({
  product, lang, isMine, onAdd, onRemove, onDetails, onCart,
}: {
  product: Product; lang: "ar" | "en";
  isMine?: boolean;
  onAdd?: (p: Product) => void;
  onRemove?: (id: string) => void;
  onDetails: (p: Product) => void;
  onCart?: (p: Product) => void;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const [added, setAdded] = useState(false);
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
    <Card className="group overflow-hidden animate-souk-in hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-0.5 flex flex-col">
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {img && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={product.name_en} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" onError={() => setImgError(true)} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/empty-stall.png" alt="" className="w-28 rounded-xl opacity-80" />
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

      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-extrabold leading-7">{ar ? product.name_ar : product.name_en}</h3>
            <p className="truncate text-xs text-muted-foreground" dir="auto">{product.name_en} · {product.sku}</p>
          </div>
          <div className="shrink-0 text-end">
            <div className="text-lg font-black text-accent">{formatPrice(product.price, product.currency)}</div>
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
          <div className="flex flex-wrap gap-1.5">
            {product.variants.slice(0, 4).map((v) => (
              <span key={v.id} className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-secondary-foreground">
                {ar ? (v.name_ar ?? v.name) : v.name}{typeof v.price === "number" ? ` · ${formatPrice(v.price, product.currency)}` : ""}
              </span>
            ))}
            {product.variants.length > 4 ? <span className="text-[11px] text-muted-foreground">+{product.variants.length - 4}</span> : null}
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

      <CardFooter className="gap-2 p-4 pt-0">
        <Button className="flex-1" variant="outline" onClick={() => onDetails(product)}><Eye />{ar ? "التفاصيل" : "Details"}</Button>
        {onCart ? <Button size="icon" variant="accent" onClick={() => { onCart(product); toast.success(ar ? "اتضاف للسلة" : "Added to cart"); }} aria-label="add to cart"><ShoppingCart /></Button> : null}
        <Button size="icon" variant="ghost" onClick={copyAd} aria-label="copy ad"><Copy /></Button>
        {isMine ? (
          <Button size="icon" variant="ghost" onClick={() => onRemove?.(product.id)} aria-label="delete"><Trash2 className="text-destructive" /></Button>
        ) : (
          <Button className="flex-1" variant={added ? "accent" : "default"} onClick={() => { onAdd?.(product); setAdded(true); toast.success(ar ? "اتضاف لمنتجاتك بكامل تفاصيله" : "Saved with full details"); }}>
            {added ? <Check /> : <PackagePlus />}{added ? (ar ? "اتضاف" : "Added") : (ar ? "حفظ المنتج" : "Save")}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
