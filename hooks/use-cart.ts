"use client";
import { useCallback, useEffect, useState } from "react";
import type { Product } from "@/lib/product";

export type CartItem = { product: Product; qty: number };
const KEY = "souk-lens-cart-v1";

function read(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]") as CartItem[]; } catch { return []; }
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => { setItems(read()); }, []);
  const persist = useCallback((list: CartItem[]) => {
    setItems(list);
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* quota */ }
  }, []);
  const addMany = useCallback((products: Product[]) => {
    setItems((prev) => {
      const map = new Map(prev.map((i) => [i.product.id, { ...i }]));
      for (const p of products) { const ex = map.get(p.id); if (ex) ex.qty += 1; else map.set(p.id, { product: p, qty: 1 }); }
      const next = [...map.values()];
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);
  const setQty = useCallback((id: string, qty: number) => {
    setItems((prev) => { const next = qty <= 0 ? prev.filter((i) => i.product.id !== id) : prev.map((i) => (i.product.id === id ? { ...i, qty } : i)); localStorage.setItem(KEY, JSON.stringify(next)); return next; });
  }, []);
  const remove = useCallback((id: string) => {
    setItems((prev) => { const next = prev.filter((i) => i.product.id !== id); localStorage.setItem(KEY, JSON.stringify(next)); return next; });
  }, []);
  const clear = useCallback(() => persist([]), [persist]);
  return { items, addMany, setQty, remove, clear, count: items.reduce((s, i) => s + i.qty, 0) };
}
