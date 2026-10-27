"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GlbViewer } from "@/components/products/glb-viewer";
import { SpinViewer } from "@/components/products/spin-viewer";
import { buildAdText, type Product } from "@/lib/product";
import { formatPrice } from "@/lib/utils";
import {
  BadgeCheck, Box, Gavel, Globe2, Images, Megaphone, MessageCircle, Minus, Plus,
  Radio, Rotate3D, ShieldCheck, ShoppingCart, Star, Tag, Truck, Undo2,
} from "lucide-react";
import { toast } from "sonner";

// Full buyer-facing product page content — exactly what a customer sees:
// gallery, variants with photos, 360°, real 3D, price, shipping & policies, seller, order.
export function ProductBuyerView({
  product, lang, onAddToCart,
}: {
  product: Product; lang: "ar" | "en";
  onAddToCart?: (p: Product, qty: number) => void;
}) {
  const ar = lang === "ar";
  const [selVarId, setSelVarId] = useState<string>(product.variants[0]?.id ?? "");
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const selVar = product.variants.find((v) => v.id === selVarId) ?? product.variants[0];
  const mainImg = selVar?.image ?? product.images[imgIdx];
  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;

  function orderWhatsApp() {
    const msg = `${buildAdText(product, lang)}\n${ar ? "الكمية" : "Qty"}: ${qty}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  }

  return (
    <div className="space-y-5">
      {/* Gallery + buy box */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-2.5">
          <div className="relative overflow-hidden rounded-2xl border bg-muted">
            {mainImg ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={mainImg} src={mainImg} alt={product.name_en} className="aspect-[4/3] w-full object-cover animate-souk-in" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/brand/empty-stall.jpg" alt="" className="mx-auto w-52 py-8" />
            )}
            {discount > 0 ? <Badge variant="destructive" className="absolute start-3 top-3">-{discount}%</Badge> : null}
            {selVar?.image ? <Badge variant="accent" className="absolute end-3 top-3"><Images className="me-1 h-3 w-3" />{ar ? "صورة المتغير" : "Variant photo"}</Badge> : null}
          </div>
          {product.images.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {product.images.map((src, i) => (
                <button key={src + i} type="button" onClick={() => setImgIdx(i)} aria-label={`photo ${i + 1}`}
                  className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 min-h-11 min-w-11" style={{ borderColor: !selVar?.image && i === imgIdx ? "#00d4a4" : "transparent" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          ) : null}
          {product.angleImages?.length ? <SpinViewer images={product.angleImages} lang={lang} label={product.name_en} /> : null}
          {product.glbUrl ? <GlbViewer url={product.glbUrl} lang={lang} /> : null}
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap gap-1.5">
              <Badge>{ar ? product.category_ar : product.category}</Badge>
              <Badge variant="outline">{product.condition}</Badge>
              {product.salesMode === "auction" ? <Badge variant="gold"><Gavel className="me-1 h-3 w-3" />{ar ? "مزاد" : "Auction"}</Badge> : null}
              {product.salesMode === "live" ? <Badge variant="destructive"><Radio className="me-1 h-3 w-3" />{ar ? "بث مباشر" : "Live"}</Badge> : null}
              {product.salesMode === "campaign" ? <Badge variant="accent"><Megaphone className="me-1 h-3 w-3" />{ar ? "حملة" : "Campaign"}</Badge> : null}
            </div>
            <h1 className="mt-2 text-2xl font-black leading-9 sm:text-3xl">{ar ? product.name_ar : product.name_en}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              {product.rating ? <span className="inline-flex items-center gap-1 font-bold text-foreground"><Star className="h-4 w-4 fill-[#ffd166] text-[#ffd166]" />{product.rating} <span className="font-normal text-muted-foreground">({product.reviewCount ?? 0})</span></span> : null}
              {product.sellerName ? <span className="inline-flex items-center gap-1">{product.sellerVerified ? <BadgeCheck className="h-4 w-4 text-accent" /> : null}{product.sellerName}</span> : null}
              <span dir="auto">{product.sku}</span>
            </p>
          </div>

          <Card className="space-y-2 p-4">
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-accent">{formatPrice(selVar?.price ?? product.price, product.currency)}</span>
              {product.compareAtPrice ? <span className="pb-1 text-sm text-muted-foreground line-through">{formatPrice(product.compareAtPrice, product.currency)}</span> : null}
            </div>
            <p className="text-xs text-muted-foreground">{ar ? `متاح ${selVar?.stock ?? product.stock} قطعة` : `${selVar?.stock ?? product.stock} in stock`}</p>
            {product.variants.length > 1 ? (
              <div className="space-y-1.5 pt-1">
                <p className="text-xs font-bold text-muted-foreground">{ar ? "اختر المتغير:" : "Choose a variant:"}</p>
                <div className="flex flex-wrap gap-1.5">
                  {product.variants.map((v) => (
                    <button key={v.id} type="button" onClick={() => setSelVarId(v.id)}
                      className="flex min-h-11 items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition active:scale-[.97]"
                      style={{ borderColor: selVarId === v.id ? "#00d4a4" : undefined, background: selVarId === v.id ? "rgba(0,212,164,.08)" : undefined }}>
                      {v.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.image} alt="" className="h-8 w-8 rounded-lg object-cover" loading="lazy" />
                      ) : null}
                      <span>{ar ? (v.name_ar ?? v.name) : v.name}<br /><span className="text-accent">{formatPrice(v.price ?? product.price, product.currency)}</span></span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="flex items-center gap-2 pt-2">
              <span className="text-xs font-bold text-muted-foreground">{ar ? "الكمية:" : "Qty:"}</span>
              <Button size="sm" variant="outline" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="minus"><Minus /></Button>
              <span className="min-w-6 text-center font-black">{qty}</span>
              <Button size="sm" variant="outline" onClick={() => setQty((q) => Math.min(selVar?.stock ?? product.stock, q + 1))} aria-label="plus"><Plus /></Button>
              <span className="ms-auto font-black text-accent">{formatPrice((selVar?.price ?? product.price) * qty, product.currency)}</span>
            </div>
            <div className="flex flex-col gap-2 pt-1 sm:flex-row">
              <Button size="lg" className="flex-1" onClick={() => { onAddToCart?.(product, qty); toast.success(ar ? "اتضاف للسلة" : "Added to cart"); }}>
                <ShoppingCart />{ar ? "أضف للسلة" : "Add to cart"}
              </Button>
              <Button size="lg" variant="accent" className="flex-1 bg-[#22c55e] text-white hover:bg-[#22c55e]/90" onClick={orderWhatsApp}>
                <MessageCircle />{ar ? "اطلب واتساب" : "Order on WhatsApp"}
              </Button>
            </div>
          </Card>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-3 text-center"><Truck className="mx-auto h-4 w-4 text-primary" /><p className="mt-1 text-xs font-bold">{ar ? "التوصيل" : "Delivery"}</p><p className="text-xs text-muted-foreground">{product.shippingDetails?.etaDaysMin !== undefined ? `${product.shippingDetails.etaDaysMin}–${product.shippingDetails.etaDaysMax ?? product.shippingDetails.etaDaysMin} ${ar ? "أيام" : "days"}` : product.shipping}</p></div>
            <div className="rounded-xl border bg-card p-3 text-center"><Undo2 className="mx-auto h-4 w-4 text-primary" /><p className="mt-1 text-xs font-bold">{ar ? "الاسترجاع" : "Returns"}</p><p className="text-xs text-muted-foreground">{product.returnPolicy?.days !== undefined ? `${product.returnPolicy.days} ${ar ? "يوم" : "days"}` : (ar ? "حسب البائع" : "Per seller")}</p></div>
            <div className="rounded-xl border bg-card p-3 text-center"><ShieldCheck className="mx-auto h-4 w-4 text-primary" /><p className="mt-1 text-xs font-bold">{ar ? "تسوق آمن" : "Safe shopping"}</p><p className="text-xs text-muted-foreground">{ar ? "صور حقيقية + بائع موثق" : "Real photos + verified seller"}</p></div>
          </div>
          {product.availableCountries?.length ? (
            <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"><Globe2 className="h-3.5 w-3.5" />{ar ? "التوصيل متاح لـ:" : "Ships to:"} {product.availableCountries.map((c) => <Badge key={c} variant="outline">{c}</Badge>)}</p>
          ) : null}
        </div>
      </div>

      <Separator />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-2">
          <h2 className="font-extrabold">{ar ? "الوصف" : "Description"}</h2>
          <p className="text-sm leading-8 text-muted-foreground">{ar ? product.description_ar : product.description_en}</p>
          {product.features.length ? (
            <ul className="space-y-1.5">{product.features.map((f) => <li key={f} className="flex gap-2 text-sm leading-7"><span className="text-accent">•</span>{f}</li>)}</ul>
          ) : null}
        </div>
        <div className="space-y-2">
          <h2 className="font-extrabold">{ar ? "المواصفات" : "Specifications"}</h2>
          <div className="overflow-hidden rounded-xl border">
            {Object.entries(product.specs).map(([k, v]) => (
              <div key={k} className="grid grid-cols-2 border-b bg-card px-3.5 py-2.5 text-sm last:border-0"><span className="font-bold">{k}</span><span className="text-muted-foreground">{v}</span></div>
            ))}
            <div className="grid grid-cols-2 bg-card px-3.5 py-2.5 text-sm"><span className="font-bold"><Tag className="me-1 inline h-3.5 w-3.5" />SKU</span><span className="text-muted-foreground" dir="auto">{product.sku} · {product.brand}</span></div>
          </div>
          {product.variants.some((v) => v.image) ? (
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Images className="h-3.5 w-3.5 text-accent" />{ar ? `كل متغير بصورته الخاصة (${product.variants.filter((v) => v.image).length}/${product.variants.length})` : `Every variant with its own photo (${product.variants.filter((v) => v.image).length}/${product.variants.length})`}</p>
          ) : null}
          {product.angleImages?.length ? (
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Rotate3D className="h-3.5 w-3.5 text-accent" />{ar ? "عرض 360° بأربع زوايا مولدة" : "360° view in four generated angles"}</p>
          ) : null}
          {product.glbUrl ? (
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Box className="h-3.5 w-3.5 text-accent" />{ar ? "مجسّم حقيقي ثلاثي الأبعاد من البائع" : "Real seller-provided 3D model"}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
