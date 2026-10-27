"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { CartSheet } from "@/components/cart/cart-sheet";
import { LogoMark } from "@/components/brand/logo";
import { ProductBuyerView } from "@/components/products/product-buyer-view";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useMineProducts } from "@/hooks/use-mine-products";
import type { Product } from "@/lib/product";
import type { Lang } from "@/lib/brand";
import { ArrowLeft, ShoppingCart } from "lucide-react";

const PREVIEW_KEY = "souk-lens-preview";

// Public buyer product page — exactly what a customer sees. No edit controls.
export default function BuyerProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lang, setLang] = useState<Lang>("en");
  const [product, setProduct] = useState<Product | null>(null);
  const [ready, setReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const mine = useMineProducts();
  const cart = useCart();
  const ar = lang === "ar";

  function recordOrder(items: { product: Product; qty: number }[]) {
    for (const { product: p, qty } of items) {
      const cur = mine.products.find((x) => x.id === p.id);
      if (!cur) continue;
      mine.update(p.id, { soldUnits: (cur.soldUnits ?? 0) + qty, stock: Math.max(0, cur.stock - qty) });
    }
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem("souk-lens-lang");
      const l = saved === "ar" || saved === "en" ? saved : "en";
      setLang(l); document.documentElement.lang = l; document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("souk-lens-products-v2") ?? "[]") as Product[];
      const found = saved.find((p) => p.id === id);
      if (found) { setProduct(found); setReady(true); return; }
      const preview = JSON.parse(sessionStorage.getItem(PREVIEW_KEY) ?? "null") as Product | null;
      if (preview && preview.id === id) setProduct(preview);
    } catch { /* ignore */ }
    setReady(true);
  }, [id, mine.products.length]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center gap-3 px-4 py-2.5">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Souk Lens home">
            <LogoMark className="h-9 w-9" />
          </Link>
          <Link href="/" className="min-w-0">
            <span className="block truncate text-base font-black">{ar ? "عدسة السوق" : "Souk Lens"}</span>
            <span className="block truncate text-[11px] text-muted-foreground">{ar ? "صفحة المنتج — كما يراها المشتري" : "Product page — as the buyer sees it"}</span>
          </Link>
          <div className="ms-auto flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setLang(ar ? "en" : "ar")}>{ar ? "EN" : "عربي"}</Button>
            <Button size="icon" variant={cart.count ? "default" : "outline"} onClick={() => setCartOpen(true)} aria-label="cart" className="relative">
              <ShoppingCart />
              {cart.count ? <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-black text-black">{cart.count}</span> : null}
            </Button>
            <Button size="sm" variant="ghost" asChild><Link href="/"><ArrowLeft className="flip-dir" />{ar ? "المتجر" : "Store"}</Link></Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {!ready ? null : product ? (
          <ProductBuyerView product={product} lang={lang} onAddToCart={(p, q) => cart.addMany(Array(q).fill(p))} />
        ) : (
          <div className="rounded-2xl border border-dashed px-6 py-14 text-center">
            <p className="text-lg font-extrabold">{ar ? "المنتج غير موجود هنا" : "Product not found here"}</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted-foreground">
              {ar ? "افتح صفحة المشتري من زر «صفحة المشتري» على كارت المنتج، أو احفظ المنتج في منتجاتي أولًا." : "Open the buyer page from the “Buyer page” button on the product card, or save the product to My products first."}
            </p>
            <Button asChild className="mt-4"><Link href="/">{ar ? "عودة للمتجر" : "Back to store"}</Link></Button>
          </div>
        )}
      </main>

      <CartSheet open={cartOpen} onOpenChange={setCartOpen} items={cart.items} lang={lang} setQty={cart.setQty} remove={cart.remove} clear={cart.clear} onCheckout={recordOrder} />
    </div>
  );
}
