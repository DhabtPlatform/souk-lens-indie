"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/product";

const KEY = "souk-lens-products-v2";

function readLocal(): Product[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as Product[];
  } catch { return []; }
}
function writeLocal(list: Product[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); }
  catch { try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 30))); } catch { /* quota */ } }
}

async function callDb(action: string, extra: Record<string, unknown> = {}): Promise<Product[] | null> {
  try {
    const r = await fetch("/api/products", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    const j = await r.json();
    if (!r.ok || j.ok === false || !Array.isArray(j.products)) return null;
    return j.products as Product[];
  } catch { return null; }
}

// Saved products live in the project's internal database (data/products.json,
// capped at 100 items server-side). localStorage is a live mirror + offline fallback.
export function useMineProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const serverOk = useRef(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/products");
        const j = await r.json();
        if (!cancelled && r.ok && Array.isArray(j.products)) {
          setProducts(j.products as Product[]);
          writeLocal(j.products as Product[]);
          setLoaded(true);
          return;
        }
      } catch { /* fall through to local */ }
      if (!cancelled) { serverOk.current = false; setProducts(readLocal()); setLoaded(true); }
    })();
    return () => { cancelled = true; };
  }, []);

  const apply = useCallback((list: Product[]) => {
    setProducts(list);
    writeLocal(list);
  }, []);

  const add = useCallback((p: Product) => {
    setProducts((prev) => {
      const next = [p, ...prev.filter((x) => x.id !== p.id)];
      writeLocal(next);
      callDb("add", { product: p }).then((srv) => { if (srv) { setProducts(srv); writeLocal(srv); } });
      return next;
    });
  }, []);
  const addMany = useCallback((list: Product[]) => {
    setProducts((prev) => {
      const seen = new Set<string>();
      const next = [...list, ...prev].filter((pr) => (seen.has(pr.id) ? false : (seen.add(pr.id), true)));
      writeLocal(next);
      callDb("addMany", { products: list }).then((srv) => { if (srv) { setProducts(srv); writeLocal(srv); } });
      return next;
    });
  }, []);
  const remove = useCallback((id: string) => {
    setProducts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      writeLocal(next);
      callDb("remove", { id }).then((srv) => { if (srv) { setProducts(srv); writeLocal(srv); } });
      return next;
    });
  }, []);
  const update = useCallback((id: string, patch: Partial<Product>) => {
    setProducts((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p));
      writeLocal(next);
      callDb("update", { id, patch }).then((srv) => { if (srv) { setProducts(srv); writeLocal(srv); } });
      return next;
    });
  }, []);
  const clear = useCallback(() => {
    apply([]);
    callDb("clear").then((srv) => { if (srv) { setProducts(srv); writeLocal(srv); } });
  }, [apply]);

  return { products, loaded, add, addMany, remove, update, clear };
}
