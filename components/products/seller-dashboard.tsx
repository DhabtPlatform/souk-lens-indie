"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { Product, SalesMode } from "@/lib/product";
import { defaultAuction, defaultCampaign, defaultLive, productEconomics, summarize } from "@/lib/analytics";
import { formatPrice } from "@/lib/utils";
import {
  BarChart3, Eye, Gavel, Megaphone, PiggyBank, Radio, ShoppingBag, Tag, TrendingUp, Wallet,
} from "lucide-react";
import { toast } from "sonner";

const MODES: { key: SalesMode; ar: string; en: string; icon: React.ReactNode }[] = [
  { key: "fixed", ar: "سعر ثابت", en: "Fixed price", icon: <Tag className="h-3.5 w-3.5" /> },
  { key: "auction", ar: "مزاد", en: "Auction", icon: <Gavel className="h-3.5 w-3.5" /> },
  { key: "live", ar: "بيع بالبث", en: "Live sale", icon: <Radio className="h-3.5 w-3.5" /> },
  { key: "campaign", ar: "حملة خارجية", en: "External campaign", icon: <Megaphone className="h-3.5 w-3.5" /> },
];

export function SellerDashboard({
  products, lang, onPatch, onDetails,
}: {
  products: Product[]; lang: "ar" | "en";
  onPatch: (id: string, patch: Partial<Product>) => void;
  onDetails: (p: Product) => void;
}) {
  const ar = lang === "ar";
  const s = useMemo(() => summarize(products), [products]);
  if (!products.length) return null;
  const maxProfit = Math.max(1, ...s.topByProfit.map((p) => p.eco.profit));

  return (
    <div className="space-y-4">
      <Card className="animate-souk-in overflow-hidden border-primary/30">
        <CardHeader className="bg-gradient-to-l from-primary/15 via-transparent to-accent/10">
          <CardTitle className="flex flex-wrap items-center gap-2 text-xl"><BarChart3 className="text-primary" />{ar ? "تقارير المبيعات والتكاليف والربح" : "Sales, costs & profit reports"}<Badge variant="gold">{ar ? "أرقام مبيعات تجريبية — عدّلها بأرقامك الحقيقية" : "Demo sales figures — edit with your real numbers"}</Badge></CardTitle>
          <CardDescription className="leading-7">{ar ? "أرقام كل منتج محفوظ: اتباع كام، كلف كام، وكسب كام — عدّل التكلفة والمبيعات وهيتحدث التقرير فورًا. وحوّل أي منتج لمزاد أو بث مباشر أو حملة خارجية من نفس المكان." : "Per saved product: units sold, cost and profit — edit cost/sales and the report updates instantly. Convert any product to auction, live sale or external campaign here."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi icon={<ShoppingBag />} label={ar ? "إيراد المبيعات" : "Revenue"} value={formatPrice(s.revenue, products[0].currency)} sub={`${s.unitsSold} ${ar ? "قطعة اتباعت" : "units sold"}`} />
            <Kpi icon={<Wallet />} label={ar ? "إجمالي التكاليف" : "Total costs"} value={formatPrice(s.totalCost, products[0].currency)} sub={ar ? "تكلفة القطع المباعة" : "Cost of units sold"} />
            <Kpi icon={<PiggyBank />} label={ar ? "صافي الربح" : "Net profit"} value={formatPrice(s.profit, products[0].currency)} sub={`${ar ? "هامش" : "Margin"} ${s.marginPct}%`} accent />
            <Kpi icon={<TrendingUp />} label={ar ? "قيمة المخزون / ربح متوقع" : "Inventory / potential"} value={formatPrice(s.inventoryValue, products[0].currency)} sub={`+${formatPrice(s.potentialProfit, products[0].currency)}`} />
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-bold">
            {MODES.map((m) => <Badge key={m.key} variant={s.byMode[m.key] ? "default" : "secondary"}>{m.icon}{ar ? m.ar : m.en}: {s.byMode[m.key] ?? 0}</Badge>)}
            <Badge variant="gold">{s.count} {ar ? "منتج" : "products"}</Badge>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-extrabold">{ar ? "الأعلى ربحًا" : "Top by profit"}</h4>
            {s.topByProfit.map((p) => (
              <div key={p.id} className="grid grid-cols-[1fr_auto] items-center gap-3 text-sm">
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2"><span className="truncate font-bold">{ar ? p.name_ar : p.name_en}</span><span className="shrink-0 font-black text-accent">{formatPrice(p.eco.profit, p.currency)}</span></div>
                  <Progress value={Math.round((p.eco.profit / maxProfit) * 100)} className="mt-1.5" />
                </div>
                <Button size="sm" variant="ghost" onClick={() => onDetails(p)}><Eye />{ar ? "تفاصيل" : "View"}</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {products.map((p) => <ProductRow key={p.id} p={p} ar={ar} onPatch={onPatch} onDetails={onDetails} />)}
      </div>
    </div>
  );
}

function ProductRow({ p, ar, onPatch, onDetails }: { p: Product; ar: boolean; onPatch: (id: string, patch: Partial<Product>) => void; onDetails: (p: Product) => void }) {
  const eco = productEconomics(p);
  const mode: SalesMode = p.salesMode ?? "fixed";
  const [cost, setCost] = useState(String(eco.cost));
  const [sold, setSold] = useState(String(eco.sold));
  const auction = p.auction ?? defaultAuction(p);
  const live = p.liveSale ?? defaultLive(p);
  const campaign = p.campaign ?? defaultCampaign(p);
  const [simulating, setSimulating] = useState(false);
  const ticksRef = useRef(0);
  const auctionRef = useRef(auction);
  auctionRef.current = auction;
  useEffect(() => {
    if (!simulating) return;
    ticksRef.current = 0;
    const iv = setInterval(() => {
      ticksRef.current += 1;
      const cur = auctionRef.current;
      const bump = Math.max(5, Math.round(cur.currentBid * (0.02 + Math.random() * 0.04)));
      onPatch(p.id, { salesMode: "auction", auction: { ...cur, currentBid: cur.currentBid + bump, bids: cur.bids + 1 } });
      if (ticksRef.current >= 6) { setSimulating(false); toast.success(ar ? "انتهت محاكاة المزايدة — أعلى سعر محفوظ في المنتج" : "Bid simulation done — top bid saved"); }
    }, 2200);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulating]);

  function setMode(m: SalesMode) {
    const patch: Partial<Product> = { salesMode: m };
    if (m === "auction" && !p.auction) patch.auction = defaultAuction(p);
    if (m === "live" && !p.liveSale) patch.liveSale = defaultLive(p);
    if (m === "campaign" && !p.campaign) patch.campaign = defaultCampaign(p);
    onPatch(p.id, patch);
    toast.success(ar ? `اتحول «${p.name_ar}» لـ${MODES.find((x) => x.key === m)?.ar}` : `Switched to ${m}`);
  }

  return (
    <Card className="animate-souk-in overflow-hidden transition hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
      <CardContent className="space-y-3 p-4">
        <div className="flex gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.images[0] ?? "/brand/empty-stall.jpg"} alt={p.name_en} className="h-16 w-16 shrink-0 rounded-xl object-cover" loading="lazy" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="truncate font-extrabold">{ar ? p.name_ar : p.name_en}</h4>
              <Badge variant={mode === "fixed" ? "secondary" : mode === "auction" ? "gold" : mode === "live" ? "destructive" : "accent"}>{MODES.find((m) => m.key === mode)?.icon}{ar ? MODES.find((m) => m.key === mode)?.ar : mode}</Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{p.sku} · {ar ? "سعر" : "Price"} {formatPrice(p.price, p.currency)} · {ar ? "ربح القطعة" : "Unit profit"} <strong className="text-accent">{formatPrice(eco.unitProfit, p.currency)} ({eco.marginPct}%)</strong></p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>{ar ? "اتباع" : "Sold"}: <strong className="text-foreground">{eco.sold}</strong></span>
              <span>{ar ? "إيراد" : "Revenue"}: <strong className="text-foreground">{formatPrice(eco.revenue, p.currency)}</strong></span>
              <span>{ar ? "ربح" : "Profit"}: <strong className="text-accent">{formatPrice(eco.profit, p.currency)}</strong></span>
              <span>{ar ? "مخزون" : "Stock"}: {p.stock}</span>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => onDetails(p)}><Eye />{ar ? "الإعلان" : "Listing"}</Button>
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <div className="space-y-1"><Label className="text-xs">{ar ? "تكلفة القطعة" : "Unit cost"}</Label><Input inputMode="numeric" value={cost} onChange={(e) => setCost(e.target.value)} /></div>
          <div className="space-y-1"><Label className="text-xs">{ar ? "قطع اتباعت" : "Units sold"}</Label><Input inputMode="numeric" value={sold} onChange={(e) => setSold(e.target.value)} /></div>
          <div className="flex items-end"><Button variant="accent" onClick={() => { onPatch(p.id, { costPrice: Number(cost) || eco.cost, soldUnits: Number(sold) || 0 }); toast.success(ar ? "اتحدث التقرير" : "Report updated"); }}>{ar ? "تحديث التقرير" : "Update"}</Button></div>
        </div>

        <Separator />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground">{ar ? "بيع المنتج عبر:" : "Sell via:"}</span>
          {MODES.map((m) => (
            <Button key={m.key} size="sm" variant={mode === m.key ? "default" : "outline"} onClick={() => setMode(m.key)}>{m.icon}{ar ? m.ar : m.en}</Button>
          ))}
        </div>

        {mode === "auction" ? (
          <div className="space-y-2 rounded-xl border border-[#ffd166]/40 bg-[#ffd166]/5 p-3 text-sm animate-souk-in">
            <div className="grid gap-2 sm:grid-cols-4">
              <Info label={ar ? "يبدأ من" : "Starts at"} value={formatPrice(auction.startingPrice, p.currency)} />
              <Info label={ar ? "أعلى مزايدة الآن" : "Current bid"} value={formatPrice(auction.currentBid, p.currency)} accent />
              <Info label={ar ? "مزايدات" : "Bids"} value={String(auction.bids)} />
              <Info label={ar ? "ينتهي خلال" : "Ends in"} value={`${auction.endsInHours}h`} />
            </div>
            <Button size="sm" variant={simulating ? "destructive" : "gold"} onClick={() => setSimulating((v) => !v)}>
              <Gavel />{simulating ? (ar ? "إيقاف المحاكاة الحية" : "Stop live simulation") : (ar ? "محاكاة مزايدة حية (للعرض)" : "Simulate live bidding (demo)")}
            </Button>
            {simulating ? <span className="ms-2 inline-flex items-center gap-1 text-xs font-bold text-destructive"><span className="h-2 w-2 animate-pulse rounded-full bg-destructive" />LIVE {ar ? "مزايدات بتوصل كل ثواني…" : "bids landing…"}</span> : null}
          </div>
        ) : null}
        {mode === "live" ? (
          <div className="grid gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm sm:grid-cols-3 animate-souk-in">
            <Info label={ar ? "منصة البث" : "Platform"} value={live.platform} />
            <Info label={ar ? "المعاد" : "Scheduled"} value={live.scheduledAt.replace("T", " ")} />
            <Info label={ar ? "مشاهدين متوقعين" : "Expected viewers"} value={String(live.expectedViewers)} accent />
          </div>
        ) : null}
        {mode === "campaign" ? (
          <div className="grid gap-2 rounded-xl border border-accent/40 bg-accent/5 p-3 text-sm sm:grid-cols-4 animate-souk-in">
            <Info label={ar ? "القناة" : "Channel"} value={campaign.channel} />
            <Info label={ar ? "ميزانية" : "Budget"} value={formatPrice(campaign.budget, p.currency)} />
            <Info label={ar ? "وصول / نقرات" : "Reach / clicks"} value={`${campaign.reach.toLocaleString()} / ${campaign.clicks.toLocaleString()}`} />
            <Info label={ar ? "طلبات متوقعة" : "Est. orders"} value={String(campaign.conversions)} accent />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Kpi({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10">
      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground"><span className="text-primary [&_svg]:h-4 [&_svg]:w-4">{icon}</span>{label}</div>
      <div className={`mt-2 text-xl font-black ${accent ? "text-accent" : ""}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
function Info({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return <div><div className="text-[11px] text-muted-foreground">{label}</div><div className={accent ? "font-black text-accent" : "font-extrabold"}>{value}</div></div>;
}
