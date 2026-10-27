import type { Product } from "./product";

// Deterministic demo economics: every saved product gets stable sales/cost
// figures (from its id) until the seller edits soldUnits / costPrice for real.
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

export type Economics = {
  cost: number; sold: number; revenue: number; totalCost: number; profit: number;
  marginPct: number; unitProfit: number; inventoryValue: number; inventoryCost: number; potentialProfit: number;
};

export function productEconomics(p: Product): Economics {
  const cost = p.costPrice && p.costPrice > 0 ? p.costPrice : Math.round(p.price * 0.62);
  const sold = typeof p.soldUnits === "number" ? p.soldUnits : 4 + (hash(p.id) % 46);
  const revenue = sold * p.price;
  const totalCost = sold * cost;
  const profit = revenue - totalCost;
  const unitProfit = p.price - cost;
  return {
    cost, sold, revenue, totalCost, profit,
    marginPct: p.price > 0 ? Math.round((unitProfit / p.price) * 100) : 0,
    unitProfit,
    inventoryValue: p.stock * p.price,
    inventoryCost: p.stock * cost,
    potentialProfit: p.stock * unitProfit,
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

export function defaultAuction(p: Product) {
  const start = Math.max(1, Math.round(p.price * 0.7));
  return { startingPrice: start, currentBid: Math.round(start * 1.18), bids: 3 + (hash(p.id) % 14), endsInHours: 24 + (hash(p.id) % 48) };
}
export function defaultLive(p: Product) {
  return { platform: "Facebook Live", scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16), expectedViewers: 300 + (hash(p.id) % 2400) };
}
export function defaultCampaign(p: Product) {
  const budget = Math.max(200, Math.round(p.price * 0.3));
  const reach = budget * 38;
  const clicks = Math.round(reach * 0.032);
  return { channel: "Facebook & Instagram", budget, reach, clicks, conversions: Math.max(1, Math.round(clicks * 0.06)) };
}
