// Minimal Meta Model API client. Same base URL + Bearer auth for all models.
// Docs: https://dev.meta.ai/docs/overview
// Base: https://api.meta.ai/v1 | Models: muse-spark-1.3, muse-image-1.0, sam-3.1

const BASE = process.env.META_BASE_URL ?? "https://api.meta.ai/v1";
const KEY = process.env.MODEL_API_KEY ?? "";
const SPARK = process.env.SPARK_MODEL ?? "muse-spark-1.3";
const IMAGE = process.env.IMAGE_MODEL ?? "muse-image-1.0";
const SAM = process.env.SAM_MODEL ?? "sam-3.1";

export const hasKey = () => KEY.length > 10;

async function post(path: string, body: unknown) {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`Meta API ${path} failed: ${r.status} ${t.slice(0, 500)}`);
  }
  return r.json();
}

// 1. SAM 3.1 segmentation via Responses API
// Doc: https://dev.meta.ai/docs/media-segmentation — input items need {type:"message"}
export async function segmentImage(imageUrl: string, prompt: string) {
  if (!hasKey()) return mockSegments();
  const shortPrompt = prompt.split(",")[0].slice(0, 40) || "market goods";
  return post("/responses", {
    model: SAM,
    input: [
      {
        type: "message",
        role: "user",
        content: [
          { type: "input_text", text: shortPrompt },
          { type: "input_image", image_url: imageUrl },
        ],
      },
    ],
  });
}

// 2. Muse Spark: identify + price + listing JSON (structured output)
// Doc: https://dev.meta.ai/docs/image-understanding — image_url is a plain string
export async function analyzeWithSpark(imageUrl: string, lang = "ar-EG", country = "EG", currency = "EGP") {
  if (!hasKey()) return mockAnalysis();
  const { FULL_PRODUCT_JSON_HINT } = await import("./product");
  return post("/responses", {
    model: SPARK,
    reasoning: { effort: "medium" },
    input: [
      {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: `You are Souk Lens. Look at this informal market photo. Buyer country: ${country}, currency: ${currency}, language: ${lang}. List EVERY sellable object. For each fill ALL fields, invent fair local price, variants (colors/sizes when relevant) with own prices, specs, features, stock estimate, category, brand if visible. ${FULL_PRODUCT_JSON_HINT}`,
          },
          { type: "input_image", image_url: imageUrl },
        ],
      },
    ],
  });
}

// 3. Muse Image: clean studio shot from prompt
export async function cleanProductShot(prompt: string) {
  if (!hasKey()) return { mock: true, note: "Set MODEL_API_KEY to generate real image" };
  return post("/images/generations", {
    model: IMAGE,
    prompt: `Professional e-commerce studio photo, white background, soft light: ${prompt}`,
    n: 1,
  });
}

// 4. Generic Spark text call (with optional web search grounding + country hint)
export async function sparkText(prompt: string, opts?: { search?: boolean; country?: string }) {
  const body: Record<string, unknown> = {
    model: SPARK,
    reasoning: { effort: "medium" },
    input: [{ type: "message", role: "user", content: [{ type: "input_text", text: prompt }] }],
  };
  if (opts?.search) body.tools = [{ type: "web_search" }];
  return post("/responses", body);
}

// 5. Listing JSON from a text description (no image needed)
export async function listingFromText(desc: string, country = "EG", currency = "EGP") {
  if (!hasKey())
    return {
      mock: true,
      items: [
        {
          name_ar: "منتج من الوصف",
          name_en: "Described product",
          category: "General", category_ar: "عام", brand: "—",
          condition: "new",
          price: 450, compareAtPrice: 550, costPrice: 300,
          currency, stock: 12, sku: "SL-MOCK-01",
          description_ar: desc.slice(0, 220),
          description_en: desc.slice(0, 220),
          shortDescription_ar: desc.slice(0, 110),
          features: ["وصف بيعي جاهز", "متغيرات قابلة للتعديل", "صورة ستوديو مولدة"],
          specs: { Material: "—", Condition: "new" },
          variants: [{ name: "Standard", name_ar: "قياسي", price: 450, stock: 12 }],
          tags: ["souk-lens"], colors: [], sizes: [],
          shipping: "شحن حسب المدينة", warranty: "—",
          seoTitle: "Described product | Souk Lens", seoDescription: desc.slice(0, 150),
        },
      ],
    };
  const { FULL_PRODUCT_JSON_HINT } = await import("./product");
  return post("/responses", {
    model: SPARK,
    reasoning: { effort: "medium" },
    input: [
      {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: `You are Souk Lens catalog AI. Buyer country: ${country}, currency: ${currency}. From this description: "${desc}" — create ONE complete sellable listing (or more if description mentions multiple products). Fill every field: fair local price + compare-at + cost estimate, variants with own prices/stock, full specs, features, materials/colors/sizes, shipping/warranty defaults, SEO. ${FULL_PRODUCT_JSON_HINT} Arabic (Egyptian-friendly) + English.`,
          },
        ],
      },
    ],
  });
}

// 6. Voice: relay WAV to Meta transcribe, return transcript text
export async function transcribeAudio(buf: Buffer, filename = "voice.wav") {
  const form = new FormData();
  form.append(
    "request",
    new Blob([JSON.stringify({ mode: "PUSH_TO_TALK", model: "muse-voice-transcribe-1.0", audioEncoding: "WAV", languageBias: ["Arabic", "English"] })], {
      type: "application/json",
    })
  );
  form.append("audio", new Blob([new Uint8Array(buf)], { type: "audio/wav" }), filename);
  const r = await fetch(`${BASE}/asr/transcribe`, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}` },
    body: form,
  });
  if (!r.ok) throw new Error(`transcribe failed: ${r.status} ${(await r.text()).slice(0, 300)}`);
  return r.json();
}

// 7. Fetch a public product/store URL + extract meta (og tags) + JSON-LD products server-side
export async function fetchPageMeta(url: string) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 12000);
  try {
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 SoukLens-Hackathon-Demo/1.0" },
    });
    const html = await r.text();
    const pick = (re: RegExp) => (html.match(re)?.[1] ?? "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").slice(0, 800);
    const images: string[] = [];
    for (const m of html.matchAll(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/gi)) images.push(m[1]);
    // JSON-LD Product extraction (real migrated data when present)
    const ldProducts: Record<string, unknown>[] = [];
    for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
      try {
        const parsed = JSON.parse(m[1].trim()) as Record<string, unknown> | Record<string, unknown>[];
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        for (const o of arr) {
          const graph = (o as { "@graph"?: unknown })["@graph"];
          const nodes = Array.isArray(graph) ? (graph as Record<string, unknown>[]) : [o];
          for (const n of nodes) {
            const t = String((n as { "@type"?: string })["@type"] ?? "");
            if (t.toLowerCase().includes("product")) ldProducts.push(n);
          }
        }
      } catch { /* ignore malformed ld */ }
    }
    return {
      ok: true,
      status: r.status,
      title: pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i) || pick(/<title>([^<]+)/i),
      image: images[0] ?? "",
      images: images.slice(0, 6),
      description: pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i) || pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i),
      price: pick(/<meta[^>]+property=["'][^"']*price[^"']*["'][^>]+content=["']([^"']+)/i),
      ldProducts: ldProducts.slice(0, 20),
      htmlLen: html.length,
    };
  } finally {
    clearTimeout(to);
  }
}

export function ldToRawItems(ldProducts: Record<string, unknown>[]): Record<string, unknown>[] {
  return ldProducts.map((p) => {
    const offers = (Array.isArray(p.offers) ? p.offers[0] : p.offers) as Record<string, unknown> | undefined;
    const imgs = Array.isArray(p.image) ? p.image : p.image ? [p.image] : [];
    return {
      name_en: String(p.name ?? "Imported product"),
      name_ar: String(p.name ?? "منتج مستورد"),
      description_ar: String(p.description ?? ""),
      description_en: String(p.description ?? ""),
      brand: String((p.brand as Record<string, unknown>)?.name ?? "—"),
      sku: String(p.sku ?? p.mpn ?? ""),
      price: Number(offers?.price ?? 0) || undefined,
      currency: String(offers?.priceCurrency ?? ""),
      image: String(imgs[0] ?? ""),
      images: imgs.map(String),
      category: String(p.category ?? "Imported"),
    };
  });
}

function mockSegments() {
  return {
    mock: true,
    model: "sam-3.1 (mock - set MODEL_API_KEY for live)",
    detections: [
      { label: "brass lamp", box: [0.12, 0.2, 0.4, 0.7] },
      { label: "ceramic vase", box: [0.5, 0.3, 0.75, 0.8] },
    ],
  };
}

function mockAnalysis() {
  return {
    mock: true,
    model: "muse-spark-1.3 (mock - set MODEL_API_KEY for live)",
    items: [
      {
        name_ar: "مصباح نحاس يدوي", name_en: "Handmade brass lamp",
        category: "Home decor", category_ar: "ديكور منزلي", brand: "Handmade",
        condition: "used-good", price: 850, compareAtPrice: 1100, costPrice: 500, currency: "EGP", stock: 3, sku: "SL-LAMP-01",
        description_ar: "مصباح نحاس شغل يدوي، حالته ممتازة ومنور أي ركن", description_en: "Handmade brass lamp in excellent condition.",
        shortDescription_ar: "مصباح نحاس يدوي ممتاز",
        features: ["نحاس أصلي", "شغل يدوي", "حالة ممتازة"],
        specs: { Material: "Brass", Condition: "used-good" },
        variants: [{ name: "Standard", name_ar: "قياسي", price: 850, stock: 3 }],
        tags: ["lamp", "brass"], materials: ["Brass"], colors: ["Gold"], sizes: [],
        shipping: "شحن حسب المدينة", warranty: "—", seoTitle: "Handmade brass lamp | Souk Lens", seoDescription: "مصباح نحاس يدوي",
      },
      {
        name_ar: "مزهرية سيراميك", name_en: "Ceramic vase",
        category: "Home decor", category_ar: "ديكور منزلي", brand: "—",
        condition: "new", price: 320, compareAtPrice: 420, costPrice: 180, currency: "EGP", stock: 12, sku: "SL-VASE-01",
        description_ar: "مزهرية سيراميك ألوان هادية تنفع للديكور والهدايا", description_en: "Ceramic vase in calm colors.",
        shortDescription_ar: "مزهرية سيراميك للديكور",
        features: ["سيراميك", "ألوان هادية"],
        specs: { Material: "Ceramic", Condition: "new" },
        variants: [{ name: "Small", name_ar: "صغير", price: 320, stock: 8 }, { name: "Large", name_ar: "كبير", price: 480, stock: 4 }],
        tags: ["vase"], materials: ["Ceramic"], colors: ["Beige"], sizes: ["Small", "Large"],
        shipping: "شحن حسب المدينة", warranty: "—", seoTitle: "Ceramic vase | Souk Lens", seoDescription: "مزهرية سيراميك",
      },
    ],
  };
}
