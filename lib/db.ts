import { promises as fs } from "fs";
import path from "path";
import type { Product } from "./product";

// Internal project database: a single JSON file living inside the repo folder.
// Bounded on purpose (MAX_PRODUCTS) so the project never bloats.
// NOTE: on serverless hosts (Vercel) file writes are ephemeral per instance —
// the client hook mirrors to localStorage and uses it as fallback.
export const MAX_PRODUCTS = 100;
const FILE = path.join(process.cwd(), "data", "products.json");

async function readFile(): Promise<Product[]> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Product[]) : [];
  } catch {
    return [];
  }
}

async function writeFile(list: Product[]): Promise<{ products: Product[]; trimmed: number }> {
  const trimmed = Math.max(0, list.length - MAX_PRODUCTS);
  const capped = list.slice(0, MAX_PRODUCTS);
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(capped, null, 1));
  return { products: capped, trimmed };
}

export async function dbList(): Promise<Product[]> {
  return readFile();
}

export async function dbAdd(p: Product) {
  const list = await readFile();
  const next = [p, ...list.filter((x) => x.id !== p.id)];
  return writeFile(next);
}

export async function dbAddMany(items: Product[]) {
  const list = await readFile();
  const seen = new Set<string>();
  const next = [...items, ...list].filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
  return writeFile(next);
}

export async function dbRemove(id: string) {
  const list = await readFile();
  return writeFile(list.filter((p) => p.id !== id));
}

export async function dbUpdate(id: string, patch: Partial<Product>) {
  const list = await readFile();
  const now = new Date().toISOString();
  return writeFile(list.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: now } : p)));
}

export async function dbClear() {
  return writeFile([]);
}
