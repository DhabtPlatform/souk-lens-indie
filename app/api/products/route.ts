import { NextRequest, NextResponse } from "next/server";
import { dbAdd, dbAddMany, dbClear, dbList, dbRemove, dbUpdate, MAX_PRODUCTS } from "@/lib/db";
import type { Product } from "@/lib/product";

// Internal saved-products database (data/products.json, capped at MAX_PRODUCTS).
// GET -> { products, max } | POST { action, product?, products?, id?, patch? }
export async function GET() {
  try {
    const products = await dbList();
    return NextResponse.json({ ok: true, products, max: MAX_PRODUCTS });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      action?: string; product?: Product; products?: Product[]; id?: string; patch?: Partial<Product>;
    };
    switch (body.action) {
      case "add":
        if (!body.product?.id) return NextResponse.json({ error: "product required" }, { status: 400 });
        return NextResponse.json({ ok: true, ...(await dbAdd(body.product)), max: MAX_PRODUCTS });
      case "addMany":
        if (!Array.isArray(body.products)) return NextResponse.json({ error: "products required" }, { status: 400 });
        return NextResponse.json({ ok: true, ...(await dbAddMany(body.products)), max: MAX_PRODUCTS });
      case "update":
        if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
        return NextResponse.json({ ok: true, ...(await dbUpdate(body.id, body.patch ?? {})), max: MAX_PRODUCTS });
      case "remove":
        if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
        return NextResponse.json({ ok: true, ...(await dbRemove(body.id)), max: MAX_PRODUCTS });
      case "clear":
        return NextResponse.json({ ok: true, ...(await dbClear()), max: MAX_PRODUCTS });
      default:
        return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
