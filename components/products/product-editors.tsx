"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Product, ProductVariant } from "@/lib/product";
import { uid } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { PencilLine, Plus, Save, Trash2, Truck, Undo2 } from "lucide-react";
import { toast } from "sonner";

type SaveFn = (id: string, patch: Partial<Product>) => void;

const num = (v: string, fallback: number) => {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
};

/* ---------------- Variants: full add / edit / delete ---------------- */
type VariantRow = { id: string; name: string; name_ar: string; price: string; stock: string; image?: string };

function rowsFrom(p: Product): VariantRow[] {
  return p.variants.map((v) => ({
    id: v.id,
    name: v.name,
    name_ar: v.name_ar ?? "",
    price: String(v.price ?? p.price),
    stock: String(v.stock ?? p.stock),
    image: v.image,
  }));
}

export function VariantManager({ product, lang, onSave }: { product: Product; lang: "ar" | "en"; onSave: SaveFn }) {
  const ar = lang === "ar";
  const [rows, setRows] = useState<VariantRow[]>(() => rowsFrom(product));
  const [nvName, setNvName] = useState("");
  const [nvPrice, setNvPrice] = useState("");
  const [nvStock, setNvStock] = useState("");
  useEffect(() => { setRows(rowsFrom(product)); }, [product.id]);

  const set = (i: number, k: keyof VariantRow, v: string) =>
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  function save() {
    for (const r of rows) {
      if (!r.name.trim()) { toast.error(ar ? "كل متغير يحتاج اسمًا" : "Every variant needs a name"); return; }
    }
    const byId = new Map(product.variants.map((v) => [v.id, v]));
    const variants: ProductVariant[] = rows.map((r) => {
      const orig = byId.get(r.id);
      return {
        ...(orig ?? { attributes: {} as Record<string, string> }),
        id: r.id,
        name: r.name.trim(),
        ...(r.name_ar.trim() ? { name_ar: r.name_ar.trim() } : {}),
        price: num(r.price, product.price),
        stock: Math.max(0, Math.floor(num(r.stock, product.stock))),
        ...(r.image ? { image: r.image } : {}),
      };
    });
    onSave(product.id, { variants });
    toast.success(ar ? "اتحفظت المتغيرات" : "Variants saved");
  }

  function addVariant() {
    if (!nvName.trim()) { toast.error(ar ? "اكتب اسم المتغير الجديد" : "Name the new variant"); return; }
    setRows((prev) => [...prev, {
      id: uid("v"), name: nvName.trim(), name_ar: "",
      price: nvPrice.trim() === "" ? String(product.price) : nvPrice,
      stock: nvStock.trim() === "" ? String(product.stock) : nvStock,
    }]);
    setNvName(""); setNvPrice(""); setNvStock("");
  }

  function removeVariant(i: number) {
    if (rows.length <= 1) { toast.error(ar ? "لازم يفضل متغير واحد على الأقل" : "Keep at least one variant"); return; }
    setRows((prev) => prev.filter((_, j) => j !== i));
  }

  return (
    <div className="space-y-2 rounded-2xl border bg-card p-4">
      <h4 className="flex items-center gap-1.5 font-extrabold"><PencilLine className="h-4 w-4 text-accent" />{ar ? "تعديل المتغيرات" : "Edit variants"}</h4>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={r.id} className="grid grid-cols-[1fr_84px_70px_36px] items-end gap-1.5 sm:grid-cols-[1fr_1fr_96px_80px_36px]">
            <div className="space-y-1"><Label>{ar ? "الاسم" : "Name"}</Label><Input value={r.name} onChange={(e) => set(i, "name", e.target.value)} /></div>
            <div className="space-y-1"><Label>{ar ? "بالعربي" : "Arabic"}</Label><Input value={r.name_ar} onChange={(e) => set(i, "name_ar", e.target.value)} placeholder="—" /></div>
            <div className="space-y-1"><Label>{ar ? "السعر" : "Price"}</Label><Input inputMode="decimal" value={r.price} onChange={(e) => set(i, "price", e.target.value)} dir="ltr" /></div>
            <div className="space-y-1"><Label>{ar ? "مخزون" : "Stock"}</Label><Input inputMode="numeric" value={r.stock} onChange={(e) => set(i, "stock", e.target.value)} dir="ltr" /></div>
            <Button size="icon" variant="ghost" onClick={() => removeVariant(i)} aria-label="delete variant"><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[1fr_84px_70px_36px] items-end gap-1.5 sm:grid-cols-[1fr_1fr_96px_80px_36px]">
        <div className="space-y-1"><Label>{ar ? "متغير جديد" : "New variant"}</Label><Input value={nvName} onChange={(e) => setNvName(e.target.value)} placeholder={ar ? "مثال: علبة 2 كيلو" : "e.g. 2kg box"} /></div>
        <div className="space-y-1"><Label>‎</Label><Input value={nvPrice} onChange={(e) => setNvPrice(e.target.value)} placeholder={String(product.price)} dir="ltr" inputMode="decimal" /></div>
        <div className="space-y-1"><Label>‎</Label><Input value={nvStock} onChange={(e) => setNvStock(e.target.value)} placeholder={String(product.stock)} dir="ltr" inputMode="numeric" /></div>
        <Button size="icon" onClick={addVariant} aria-label="add variant"><Plus className="h-4 w-4" /></Button>
      </div>
      <Button className="w-full" onClick={save}><Save />{ar ? `حفظ ${rows.length} متغيرات` : `Save ${rows.length} variants`}</Button>
      <p className="text-[11px] leading-5 text-muted-foreground">{ar ? "السعر والمخزون لكل متغير ينعكسان على البطاقة وصفحة المشتري والسلة فورًا." : "Per-variant price and stock reflect instantly on the card, buyer page and cart."}</p>
    </div>
  );
}

/* ---------------- Shipping, returns, warranty, countries ---------------- */
export function PolicyEditor({ product, lang, onSave }: { product: Product; lang: "ar" | "en"; onSave: SaveFn }) {
  const ar = lang === "ar";
  const sd = product.shippingDetails ?? {};
  const rp = product.returnPolicy ?? {};
  const [carrier, setCarrier] = useState(sd.carrier ?? "");
  const [etaMin, setEtaMin] = useState(sd.etaDaysMin !== undefined ? String(sd.etaDaysMin) : "");
  const [etaMax, setEtaMax] = useState(sd.etaDaysMax !== undefined ? String(sd.etaDaysMax) : "");
  const [cost, setCost] = useState(sd.cost !== undefined ? String(sd.cost) : "");
  const [freeOver, setFreeOver] = useState(sd.freeOver !== undefined ? String(sd.freeOver) : "");
  const [shipsFrom, setShipsFrom] = useState(sd.shipsFrom ?? "");
  const [retDays, setRetDays] = useState(rp.days !== undefined ? String(rp.days) : "");
  const [retTerms, setRetTerms] = useState(rp.terms ?? "");
  const [warranty, setWarranty] = useState(product.warranty === "—" ? "" : product.warranty);
  const [shipping, setShipping] = useState(product.shipping);
  const [countries, setCountries] = useState((product.availableCountries ?? []).join(", "));
  const [compareAt, setCompareAt] = useState(product.compareAtPrice !== undefined ? String(product.compareAtPrice) : "");
  const [costPrice, setCostPrice] = useState(product.costPrice !== undefined ? String(product.costPrice) : "");
  useEffect(() => {
    const s2 = product.shippingDetails ?? {}; const r2 = product.returnPolicy ?? {};
    setCarrier(s2.carrier ?? ""); setEtaMin(s2.etaDaysMin !== undefined ? String(s2.etaDaysMin) : "");
    setEtaMax(s2.etaDaysMax !== undefined ? String(s2.etaDaysMax) : ""); setCost(s2.cost !== undefined ? String(s2.cost) : "");
    setFreeOver(s2.freeOver !== undefined ? String(s2.freeOver) : ""); setShipsFrom(s2.shipsFrom ?? "");
    setRetDays(r2.days !== undefined ? String(r2.days) : ""); setRetTerms(r2.terms ?? "");
    setWarranty(product.warranty === "—" ? "" : product.warranty); setShipping(product.shipping);
    setCountries((product.availableCountries ?? []).join(", "));
    setCompareAt(product.compareAtPrice !== undefined ? String(product.compareAtPrice) : "");
    setCostPrice(product.costPrice !== undefined ? String(product.costPrice) : "");
  }, [product.id]);

  const optNum = (v: string) => (v.trim() === "" ? undefined : num(v, NaN));

  function save() {
    const etaMinN = optNum(etaMin); const etaMaxN = optNum(etaMax);
    const costN = optNum(cost); const freeOverN = optNum(freeOver); const retDaysN = optNum(retDays);
    const cmpN = optNum(compareAt); const costPN = optNum(costPrice);
    if ([etaMinN, etaMaxN, costN, freeOverN, retDaysN, cmpN, costPN].some((n) => n !== undefined && !Number.isFinite(n as number))) {
      toast.error(ar ? "راجع الأرقام المدخلة" : "Check the numbers you typed"); return;
    }
    onSave(product.id, {
      ...(cmpN !== undefined ? { compareAtPrice: cmpN } : { compareAtPrice: undefined }),
      ...(costPN !== undefined ? { costPrice: costPN } : { costPrice: undefined }),
      shipping: shipping.trim() || product.shipping,
      warranty: warranty.trim() || "—",
      availableCountries: countries.split(/[,،]/).map((s) => s.trim()).filter(Boolean).length
        ? countries.split(/[,،]/).map((s) => s.trim()).filter(Boolean)
        : undefined,
      shippingDetails: {
        ...(carrier.trim() ? { carrier: carrier.trim() } : {}),
        ...(etaMinN !== undefined ? { etaDaysMin: Math.max(0, Math.floor(etaMinN)) } : {}),
        ...(etaMaxN !== undefined ? { etaDaysMax: Math.max(0, Math.floor(etaMaxN)) } : {}),
        ...(costN !== undefined ? { cost: costN } : {}),
        ...(freeOverN !== undefined ? { freeOver: freeOverN } : {}),
        ...(shipsFrom.trim() ? { shipsFrom: shipsFrom.trim() } : {}),
      },
      returnPolicy: {
        ...(retDaysN !== undefined ? { days: Math.max(0, Math.floor(retDaysN)) } : {}),
        ...(retTerms.trim() ? { terms: retTerms.trim() } : {}),
      },
    });
    toast.success(ar ? "اتحفظت الأسعار والسياسات" : "Prices & policies saved");
  }

  const money = (v: string, set: (s: string) => void, label: string) => (
    <div className="space-y-1"><Label>{label}</Label><Input inputMode="decimal" dir="ltr" value={v} placeholder="—" onChange={(e) => set(e.target.value)} /></div>
  );

  return (
    <div className="space-y-3 rounded-2xl border bg-card p-4">
      <h4 className="flex items-center gap-1.5 font-extrabold"><Truck className="h-4 w-4 text-accent" />{ar ? "الأسعار والشحن والسياسات" : "Pricing, shipping & policies"}</h4>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {money(compareAt, setCompareAt, ar ? "قبل الخصم" : "Compare-at")}
        {money(costPrice, setCostPrice, ar ? "التكلفة" : "Unit cost")}
        {money(cost, setCost, ar ? "تكلفة الشحن" : "Shipping cost")}
        {money(freeOver, setFreeOver, ar ? "شحن مجاني فوق" : "Free over")}
        {money(etaMin, setEtaMin, ar ? "وصول من (يوم)" : "ETA from (d)")}
        {money(etaMax, setEtaMax, ar ? "وصول إلى (يوم)" : "ETA to (d)")}
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <div className="space-y-1"><Label>{ar ? "شركة الشحن" : "Carrier"}</Label><Input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder={ar ? "مثال: البريد المصري" : "e.g. Local courier"} /></div>
        <div className="space-y-1"><Label>{ar ? "يُشحن من" : "Ships from"}</Label><Input value={shipsFrom} onChange={(e) => setShipsFrom(e.target.value)} placeholder={ar ? "مثال: القاهرة" : "e.g. Cairo"} /></div>
        <div className="space-y-1"><Label>{ar ? "وصف الشحن" : "Shipping note"}</Label><Input value={shipping} onChange={(e) => setShipping(e.target.value)} /></div>
        <div className="space-y-1"><Label>{ar ? "الضمان" : "Warranty"}</Label><Input value={warranty} onChange={(e) => setWarranty(e.target.value)} placeholder="—" /></div>
        <div className="space-y-1"><Label>{ar ? "أيام الاسترجاع" : "Return days"}</Label><Input inputMode="numeric" dir="ltr" value={retDays} onChange={(e) => setRetDays(e.target.value)} placeholder="14" /></div>
        <div className="space-y-1"><Label>{ar ? "شروط الاسترجاع" : "Return terms"}</Label><Input value={retTerms} onChange={(e) => setRetTerms(e.target.value)} /></div>
      </div>
      <div className="space-y-1"><Label>{ar ? "دول التوصيل (افصل بفاصلة)" : "Ship-to countries (comma separated)"}</Label><Input value={countries} onChange={(e) => setCountries(e.target.value)} dir="auto" placeholder="EG, SA, AE" /></div>
      <Button className="w-full" onClick={save}><Save />{ar ? "حفظ الأسعار والسياسات" : "Save pricing & policies"}</Button>
      <p className="flex items-center gap-1.5 text-[11px] leading-5 text-muted-foreground"><Undo2 className="h-3.5 w-3.5 shrink-0" />{ar ? "التكلفة تدخل في حساب الربح، وأيام الاسترجاع والشحن تظهر للمشتري فورًا." : "Unit cost feeds profit math; returns and shipping show to buyers instantly."}</p>
    </div>
  );
}

/* ---------------- Specs (key-value) + features (one per line) ---------------- */
export function SpecsEditor({ product, lang, onSave }: { product: Product; lang: "ar" | "en"; onSave: SaveFn }) {
  const ar = lang === "ar";
  const [rows, setRows] = useState(() => Object.entries(product.specs));
  const [nk, setNk] = useState(""); const [nv, setNv] = useState("");
  useEffect(() => { setRows(Object.entries(product.specs)); }, [product.id]);
  return (
    <div className="space-y-2 rounded-2xl border bg-card p-4">
      <h4 className="font-extrabold">{ar ? "تعديل المواصفات" : "Edit specifications"}</h4>
      {rows.map(([k, v], i) => (
        <div key={k + i} className="grid grid-cols-[1fr_1fr_36px] items-end gap-1.5">
          <div className="space-y-1"><Label>{ar ? "الخاصية" : "Key"}</Label><Input value={k} onChange={(e) => setRows((p) => p.map((r, j) => (j === i ? [e.target.value, r[1]] : r)))} /></div>
          <div className="space-y-1"><Label>{ar ? "القيمة" : "Value"}</Label><Input value={v} onChange={(e) => setRows((p) => p.map((r, j) => (j === i ? [r[0], e.target.value] : r)))} /></div>
          <Button size="icon" variant="ghost" onClick={() => setRows((p) => p.filter((_, j) => j !== i))} aria-label="delete spec"><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ))}
      <div className="grid grid-cols-[1fr_1fr_36px] items-end gap-1.5">
        <div className="space-y-1"><Label>{ar ? "خاصية جديدة" : "New key"}</Label><Input value={nk} onChange={(e) => setNk(e.target.value)} /></div>
        <div className="space-y-1"><Label>{ar ? "قيمتها" : "Value"}</Label><Input value={nv} onChange={(e) => setNv(e.target.value)} /></div>
        <Button size="icon" onClick={() => { if (!nk.trim()) { toast.error(ar ? "اكتب اسم الخاصية" : "Name the spec"); return; } setRows((p) => [...p, [nk.trim(), nv]]); setNk(""); setNv(""); }} aria-label="add spec"><Plus className="h-4 w-4" /></Button>
      </div>
      <Button className="w-full" onClick={() => { const specs: Record<string, string> = {}; for (const [k, v] of rows) if (k.trim()) specs[k.trim()] = v; onSave(product.id, { specs }); toast.success(ar ? "اتحفظت المواصفات" : "Specs saved"); }}><Save />{ar ? "حفظ المواصفات" : "Save specs"}</Button>
    </div>
  );
}

export function FeaturesEditor({ product, lang, onSave }: { product: Product; lang: "ar" | "en"; onSave: SaveFn }) {
  const ar = lang === "ar";
  const [text, setText] = useState(() => product.features.join("\n"));
  useEffect(() => { setText(product.features.join("\n")); }, [product.id]);
  return (
    <div className="space-y-2 rounded-2xl border bg-card p-4">
      <h4 className="font-extrabold">{ar ? "تعديل المميزات" : "Edit features"}</h4>
      <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={ar ? "ميزة في كل سطر…" : "One feature per line…"} />
      <Button className="w-full" onClick={() => { onSave(product.id, { features: text.split("\n").map((s) => s.trim()).filter(Boolean) }); toast.success(ar ? "اتحفظت المميزات" : "Features saved"); }}><Save />{ar ? "حفظ المميزات" : "Save features"}</Button>
    </div>
  );
}

// Tiny live preview so sellers see the money math before publishing.
export function VariantPriceHint({ product, lang }: { product: Product; lang: "ar" | "en" }) {
  const ar = lang === "ar";
  const cheapest = product.variants.length
    ? product.variants.reduce((a, b) => (b.price ?? product.price) < (a.price ?? product.price) ? b : a)
    : null;
  return (
    <p className="text-[11px] leading-5 text-muted-foreground">
      {cheapest
        ? (ar ? `يبدأ من ${formatPrice(cheapest.price ?? product.price, product.currency)} (${cheapest.name_ar ?? cheapest.name}) — ${product.variants.length} متغيرات` : `From ${formatPrice(cheapest.price ?? product.price, product.currency)} (${cheapest.name}) — ${product.variants.length} variants`)
        : (ar ? "سعر واحد لكل المخزون" : "Single price for all stock")}
    </p>
  );
}
