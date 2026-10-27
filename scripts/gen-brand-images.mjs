// Generate Souk Lens brand imagery with Muse Image (muse-image-1.0).
// Usage: node scripts/gen-brand-images.mjs [--only hero|icon|empty]
// Reads MODEL_API_KEY from .env. $0.01 per image.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

function loadKey() {
  try {
    const env = readFileSync(".env", "utf8");
    const m = env.match(/MODEL_API_KEY\s*=\s*(\S+)/);
    if (m) return m[1].trim();
  } catch { /* ignore */ }
  if (process.env.MODEL_API_KEY) return process.env.MODEL_API_KEY.trim();
  throw new Error("MODEL_API_KEY not found in .env");
}

const JOBS = {
  hero: {
    file: "public/brand/hero-souq.jpg",
    size: "1536x1024",
    prompt:
      "Cinematic wide shot of a vibrant Egyptian souq market alley at golden hour, colorful stalls with brass lamps, ceramics and textiles, a large glowing violet-to-mint magnifying glass hovering over one stall highlighting its goods, dark moody background, no text, no words, no letters, professional brand hero illustration",
  },
  icon: {
    file: "public/brand/app-icon-art.jpg",
    size: "1024x1024",
    prompt:
      "Flat mobile app icon artwork, dark violet background, centered white magnifying glass with mint-green handle over a small golden market stall with tiny brass lamp, minimal, crisp edges, no text, no words, no letters",
  },
  empty: {
    file: "public/brand/empty-stall.jpg",
    size: "1024x1024",
    prompt:
      "Minimal line illustration of an empty Middle Eastern market stall with striped awning, soft violet and mint accents on dark background, friendly, lots of empty space, no text, no words, no letters",
  },
};

const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;
const picks = only ? [only] : Object.keys(JOBS);
const KEY = loadKey();
mkdirSync("public/brand", { recursive: true });

for (const name of picks) {
  const job = JOBS[name];
  if (!job) throw new Error(`unknown job: ${name}`);
  if (existsSync(job.file)) { console.log(`SKIP ${job.file} (exists)`); continue; }
  console.log(`GEN ${name} ...`);
  const r = await fetch("https://api.meta.ai/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "muse-image-1.0", prompt: job.prompt, n: 1,
      size: job.size, response_format: "b64_json", output_format: "png",
    }),
  });
  if (!r.ok) throw new Error(`${name} failed: ${r.status} ${(await r.text()).slice(0, 300)}`);
  const j = await r.json();
  const b64 = j?.data?.[0]?.b64_json;
  if (!b64) throw new Error(`${name}: no b64_json in response`);
  writeFileSync(job.file, Buffer.from(b64, "base64"));
  console.log(`SAVED ${job.file} (${j.output_format ?? "png"})`);
}
console.log("DONE");
