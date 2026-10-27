"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { CartItem } from "@/hooks/use-cart";
import { buildInvoice } from "@/lib/smart-market";
import { formatPrice } from "@/lib/utils";
import { CheckCheck, Minus, Plus, ShieldCheck, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function CartSheet({
  open, onOpenChange, items, lang, setQty, remove, clear,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  items: CartItem[]; lang: "ar" | "en";
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void; clear: () => void;
}) {
  const ar = lang === "ar";
  const [orderNo, setOrderNo] = useState("");
  const totals = buildInvoice(items.map((i) => ({ price: i.product.price, compareAtPrice: i.product.compareAtPrice, shippingCost: i.product.shippingCost, deliveryDays: i.product.deliveryDays, qty: i.qty })));
  const currency = items[0]?.product.currency ?? "EGP";

  function checkout() {
    setOrderNo(`SL-ORD-${Date.now().toString().slice(-6)}`);
    toast.success(ar ? "اتأكد الطلب (دفع تجريبي للهاكثون)" : "Order confirmed (hackathon demo payment)");
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setOrderNo(""); }}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-2xl"><ShoppingCart className="text-primary" />{ar ? "سلة الدفع" : "Checkout cart"}</SheetTitle>
          <SheetDescription>{ar ? "منتجات بكل تفاصيلها من السوق الذكي أو نتائج البحث — عدّل الكمية وادفع." : "Full-detail products from Smart Market or search — adjust qty and pay."}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 p-5">
          {orderNo ? (
            <div className="space-y-3 rounded-2xl border border-accent/50 bg-accent/10 p-5 text-center animate-souk-in">
              <CheckCheck className="mx-auto h-10 w-10 text-accent" />
              <h3 className="text-xl font-black">{ar ? "تم تأكيد الطلب" : "Order confirmed"}</h3>
              <Badge variant="accent">{orderNo}</Badge>
              <p className="text-sm leading-7 text-muted-foreground">{ar ? "دي محاكاة دفع لعرض الهاكثون — في الإنتاج تتصل ببوابة دفع البائع مباشرة بدون احتجاز أموال في المنصة." : "Demo payment for the hackathon — in production it connects to the seller gateway directly."}</p>
              <Button variant="outline" onClick={() => { clear(); setOrderNo(""); onOpenChange(false); }}>{ar ? "ابدأ طلب جديد" : "New order"}</Button>
            </div>
          ) : items.length ? (
            <>
              <div className="space-y-2.5">
                {items.map(({ product: p, qty }) => (
                  <div key={p.id} className="flex gap-3 rounded-xl border bg-card p-3 animate-souk-in">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.images[0] ?? "/brand/empty-stall.jpg"} alt={p.name_en} className="h-[72px] w-[72px] shrink-0 rounded-lg object-cover" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold">{ar ? p.name_ar : p.name_en}</p>
                      <p className="text-xs text-muted-foreground">{p.sellerName ?? p.brand} · {p.sku}</p>
                      <p className="mt-1 text-sm font-black text-accent">{formatPrice(p.price * qty, p.currency)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => setQty(p.id, qty - 1)} aria-label="minus"><Minus /></Button>
                        <span className="min-w-6 text-center font-black">{qty}</span>
                        <Button size="sm" variant="outline" onClick={() => setQty(p.id, qty + 1)} aria-label="plus"><Plus /></Button>
                        <Button size="sm" variant="ghost" className="ms-auto" onClick={() => remove(p.id)} aria-label="remove"><Trash2 className="text-destructive" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-2 text-sm leading-8">
                <Row label={ar ? "المجموع الفرعي" : "Subtotal"} value={formatPrice(totals.subtotal, currency)} />
                <Row label={ar ? "توفير الخصومات" : "Savings"} value={`-${formatPrice(totals.savings, currency)}`} accent />
                <Row label={ar ? "الشحن" : "Shipping"} value={totals.shipping === 0 ? (ar ? "مجاني" : "Free") : formatPrice(totals.shipping, currency)} />
                <Row label={ar ? "التوصيل خلال" : "Delivery within"} value={`${totals.maxDeliveryDays} ${ar ? "يوم" : "days"}`} />
              </div>
              <Separator />
              <div className="flex items-center justify-between text-lg font-black"><span>{ar ? "الإجمالي" : "Total"}</span><span className="text-accent">{formatPrice(totals.total, currency)}</span></div>
              <Button size="lg" className="w-full" onClick={checkout}><ShieldCheck />{ar ? "تأكيد الدفع" : "Confirm payment"}</Button>
              <Button variant="ghost" className="w-full" onClick={clear}>{ar ? "إفراغ السلة" : "Clear cart"}</Button>
            </>
          ) : (
            <div className="py-8 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/empty-stall.jpg" alt="" className="mx-auto w-40 rounded-3xl" />
              <p className="mt-3 font-extrabold">{ar ? "السلة فاضية" : "Cart is empty"}</p>
              <p className="text-sm leading-7 text-muted-foreground">{ar ? "اعتمد قايمة من السوق الذكي وضيفها هنا للدفع." : "Approve a Smart Market list and add it here."}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return <div className="flex items-center justify-between"><span className="text-muted-foreground">{label}</span><strong className={accent ? "text-accent" : ""}>{value}</strong></div>;
}
