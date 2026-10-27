"use client";
import { useCallback, useEffect, useState } from "react";
import type { Product } from "@/lib/product";

const KEY = "souk-lens-products-v2";

function read(): Product[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Product[];
  } catch { return []; }
}

export function useMineProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setProducts(read()); setLoaded(true); }, []);

  const persist = useCallback((list: Product[]) => {
    setProducts(list);
    try { localStorage.setItem(KEY, JSON.stringify(list)); }
    catch { try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 30))); } catch { /* quota */ } }
  }, []);

  const add = useCallback((p: Product) => {
    setProducts((prev) => { const next = [p, ...prev.filter((x) => x.id !== p.id)]; try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ } return next; });
  }, []);
  const addMany = useCallback((list: Product[]) => {
    setProducts((prev) => { const seen = new Set<string>(); const next = [...list, ...prev].filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true))); try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { try { localStorage.setItem(KEY, JSON.stringify(next.slice(0, 30))); } catch { /* quota */ } } return next; });
  }, []);
  const remove = useCallback((id: string) => {
    setProducts((prev) => { const next = prev.filter((p) => p.id !== id); localStorage.setItem(KEY, JSON.stringify(next)); return next; });
  }, []);
  const update = useCallback((id: string, patch: Partial<Product>) => {
    setProducts((prev) => { const next = prev.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p)); localStorage.setItem(KEY, JSON.stringify(next)); return next; });
  }, []);
  const clear = useCallback(() => persist([]), [persist]);

  return { products, loaded, add, addMany, remove, update, clear };
}
