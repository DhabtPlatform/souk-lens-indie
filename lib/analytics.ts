import type { Product } from "./product";

// Real-entries-only economics: revenue/profit come ONLY from actual in-app orders
// (soldUnits incremented at checkout) or numbers the seller types in themselves.
// Nothing is generated from a product id or a price ratio.
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

export type Economics = {
  cost: number; sold: number; revenue: number; totalCost: number; profit: number;
  marginPct: number; unitProfit: number; inventoryValue: number; inventoryCost: number; potentialProfit: number;
  hasCost: boolean; hasSales: boolean;
};

export function productEconomics(p: Product): Economics {
  const hasCost = typeof p.costPrice === "number" && p.costPrice > 0;
  const cost = hasCost ? (p.costPrice as number) : 0;
  const sold = typeof p.soldUnits === "number" ? p.soldUnits : 0;
  const revenue = sold * p.price;
  const totalCost = sold * cost;
  const profit = hasCost ? revenue - totalCost : 0;
  const unitProfit = hasCost ? p.price - cost : 0;
  return {
    cost, sold, revenue, totalCost, profit,
    marginPct: hasCost && p.price > 0 ? Math.round((unitProfit / p.price) * 100) : 0,
    unitProfit,
    inventoryValue: p.stock * p.price,
    inventoryCost: p.stock * cost,
    potentialProfit: hasCost ? p.stock * unitProfit : 0,
    hasCost,
    hasSales: sold > 0,
  };
}

export type Summary = {
  count: number; unitsSold: number; revenue: number; totalCost: number; profit: number;
  marginPct: number; inventoryValue: number; potentialProfit: number;
  byMode: Record<string, number>; topByProfit: (Product & { eco: Economics })[];
};

export function summarize(products: Product[]): Summary {
  const rows = products.map((p) => ({ p, eco: productEconomics(p) }));
  const revenue = rows.reduce((s, r) => s + r.eco.revenue, 0);
  const totalCost = rows.reduce((s, r) => s + r.eco.totalCost, 0);
  const profit = revenue - totalCost;
  const byMode: Record<string, number> = { fixed: 0, auction: 0, live: 0, campaign: 0 };
  for (const p of products) byMode[p.salesMode ?? "fixed"] = (byMode[p.salesMode ?? "fixed"] ?? 0) + 1;
  return {
    count: products.length,
    unitsSold: rows.reduce((s, r) => s + r.eco.sold, 0),
    revenue, totalCost, profit,
    marginPct: revenue > 0 ? Math.round((profit / revenue) * 100) : 0,
    inventoryValue: rows.reduce((s, r) => s + r.eco.inventoryValue, 0),
    potentialProfit: rows.reduce((s, r) => s + r.eco.potentialProfit, 0),
    byMode,
    topByProfit: rows.sort((a, b) => b.eco.profit - a.eco.profit).slice(0, 5).map((r) => ({ ...r.p, eco: r.eco })),
  };
}

// Selling channels start honest: a fresh auction has the starting price and ZERO bids;
// live/campaign figures below are planning estimates (budget math), not history.
export function defaultAuction(p: Product) {
  const start = Math.max(1, Math.round(p.price * 0.7));
  return { startingPrice: start, currentBid: start, bids: 0, endsInHours: 48 };
}
export function defaultLive(p: Product) {
  return { platform: "Facebook Live", scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16), expectedViewers: 0 };
}
export function defaultCampaign(p: Product) {
  const budget = Math.max(200, Math.round(p.price * 0.3));
  const reach = budget * 38;
  const clicks = Math.round(reach * 0.032);
  return { channel: "Facebook & Instagram", budget, reach, clicks, conversions: Math.max(1, Math.round(clicks * 0.06)) };
}
