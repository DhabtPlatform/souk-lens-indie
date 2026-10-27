# Souk Lens — عدسة السوق (Indie submission)

> **Souk Lens is NOT an image analyzer — it is a complete informal-market commerce platform.**
> Snap a stall → **SAM 3.1** isolates every item on an interactive map → **Muse Spark 1.3**
> prices locally and builds a complete product (variants / stock / specs / SEO) →
> **Muse Image 1.0** cleans the studio shot → save, manage and profit reports →
> **auction / live / campaign** → **Smart Market** bundles the whole purchase into 3 lists
> with a preliminary invoice → cart and checkout. Visual analysis is one step out of six.

## Built during the hackathon (Oct 26 – Nov 4)
Everything the demo shows was built during the event in this public repo:
- The full pipeline (SAM 3.1 + Muse Spark 1.3 + Muse Image 1.0 + Voice) via `https://api.meta.ai/v1`
- Interactive SAM map + before/after slider + model proof bar with measured timings
- Smart Market (unified search + 3 lists + move between lists + approve + invoice + cart)
- Product management: sales/cost/profit reports + selling channels (auction with live simulation / live / campaign)
- Global brand v2 + RTL/LTR support + 90-second guided tour
- The demo shows only these features built during the period — no outside code or assets beyond what `ATTRIBUTION.md` documents.

## Brand (v2 — global)
The mark: "a lens that found the gem" — a souk arch inside a lens ring + a gold discovery dot
(`public/logo.svg`, AR/EN horizontal and mono versions in `public/brand/`, `components/brand/logo.tsx` in the header).
Global tagline: **See it. Sell it. Anywhere.**
Direction: AR = RTL with Tajawal/Cairo, EN = LTR with Inter — alignment, arrows, sliders, switches and prices
all follow the UI language (saved locally). Full identity: `/brand` page.

## Pipelines (all LIVE verified)
| Tab | Input | Models |
|---|---|---|
| Analyze image | Photo / URL | SAM 3.1 + Spark 1.3 + Image 1.0 |
| Generate from text | Text only | Spark 1.3 + Image 1.0 |
| Compare URL | External product link | fetch og-tags + Spark + web_search |
| Voice listing | Mic recording / text | Voice transcribe + Spark 1.3 |
| Import store | Old store link | fetch + Spark bulk items |
| Smart Market | "I want to buy…" + ready presets | Whole-store search + Spark intent — 3 lists (value/rating/delivery), move between lists, approve, preliminary invoice, cart checkout |
| My products | Local save | Internal DB (`data/products.json`, capped at 100) + localStorage mirror — add from any result |

## Full listings from every input
Any result (SAM photo, voice, text, compare link, store import) is normalized via
`lib/product.ts:normalizeProduct` into a complete product: AR/EN names, descriptions,
price + compare-at + cost, priced variants with stock, specs, features, images
(original + studio), stock, SKU, shipping/warranty and SEO — stored in full in
"My products" (`souk-lens-products-v2`), with editable details, ad copy, JSON export and add-to-cart.

## Product management (reports + selling channels)
In "My products": a reports dashboard (`components/products/seller-dashboard.tsx` + `lib/analytics.ts`) —
revenue, costs, net profit and margin, inventory value and expected profit, top by profit,
and per-product cost/sales editing. Every product converts to a selling channel:
**fixed / auction** (start + top bid + bid count + ending) / **live sale**
(platform + schedule + viewers) / **external campaign** (channel + budget + reach/clicks/orders) —
channel data shows on the card and details and is saved with the product.

## The idea in one line
**A commerce platform for informal markets — not an image analyzer.** Snap a messy stall →
**SAM 3.1** isolates items → **Muse Spark 1.3** identifies, prices locally and writes a full listing →
**Muse Image 1.0** cleans the product shot → save, manage, profit, auction, smart market, checkout.

## Why it competes
- Uses 3 Meta models together in one pipeline — not a repetitive simple chatbot.
- `Build for Your World` theme: informal-market sellers, including sellers with limited digital literacy, AR/EN + RTL/LTR.
- Works instantly even without a key (honest demo mode), and goes LIVE with `MODEL_API_KEY`.
- Standalone repo built for this submission.

## Run
```bash
npm install
cp .env.example .env   # set MODEL_API_KEY from https://dev.meta.ai
npm run dev            # http://localhost:3000
```

## Where every feature lives (nothing hidden)
- **Product cards** show directly: variant count (with per-variant photo thumbnails when generated), 360° and 3D badges, delivery ETA, return days, supported countries, sales channel, rating and discount. A chevron expands the **full section inline below every card** (complete buyer view + edit/delete/buyer-page actions).
- **Buyer product page** (`/product/[id]`, opens in a new tab): the listing exactly as customers see it — gallery, variant picker with photos, 360° spinner, real GLB 3D, price, shipping & policies, seller box, quantity, cart and WhatsApp order. No edit controls.
- **Auto media enrichment:** the hero product of every live run automatically gets AI variant shots (≤3) + 360° four-angle views in the background while results stay interactive; real GLB stays seller-provided (Meta models cannot generate GLB).
- **Photo → real GLB in one click:** any product photo (generated/attached/from link) converts locally into a genuine textured `.glb` file — previewed in the true-3D viewer and downloadable. Built in `lib/glb.ts`, no external API; honestly labeled as a 2.5D display card, not a full scan.
- **Product page (Details):** variant selector with photos + "generate every variant shot", AI 360° four-angle spinner, real GLB upload/URL with true-3D viewer, shipping/delivery/returns/countries section, WhatsApp/Facebook publishing.
- **My products:** full edit + delete per saved product, profit reports, auction/live/campaign conversion.
- **Smart Market:** three ranked lists, move items between lists, approve → preliminary invoice → cart checkout.

## Guided tour & impact (in-app)
- A built-in **90-second product tour** walks the full flow (analysis → management → smart market → checkout) on a timer.
- **Impact strip**: pipeline time measured from the last real run (SAM/Spark/Image in ms) vs. a manual time labeled as a market estimate — no invented numbers.
- **Illustrative seller story** labeled as a demo scenario (not a paid testimonial): stall → SAM → listing → sale.
- Deploy-ready with `vercel.json` + `.env.example` (any Node 20 host; set `MODEL_API_KEY` for Live mode).

## 90-second demo
1. Hit **"One-click demo"** in the hero — analyzes a real photo with the full pipeline.
2. Show the **SAM 3.1 map**: colored boxes on the photo; tap any item to open its listing (real SAM boxes, honestly labeled "estimated demo positions" when absent).
3. Show the **model trace**: per-model time (SAM → Spark → Image) and Live status from `api.meta.ai/v1`.
4. Drag the **before/after slider**: from market shot to Muse Image studio shot.
5. Save the product → open "My products": profit report, convert to **auction**, run the live bid simulation.
6. Switch to **Smart Market**: "furnish a wedding" → 3 lists (demo store catalog + your real saved products, each labeled by source) → move an item between lists → approve → preliminary invoice → cart checkout.

## Transparency (a strength with judges)
- The Smart Market catalog and seller-dashboard sales figures are **demo data labeled as such in the UI** and editable with real numbers — the product is the architecture (full Product + ranker + invoices).
- Auction/live/campaign: selling-channel activation saved with the product + live bid simulation for the demo; payment is a hackathon demo checkout.

## Asset sources (Attribution)
- Demo catalog photos (25): **Unsplash** under a free license — labeled in the UI and documented in `ATTRIBUTION.md`; replaced by real seller photos in production.
- Brand imagery generated with **Muse Image 1.0**, original logo, open fonts (OFL) — see `ATTRIBUTION.md`.

## Files proving Meta usage
- `lib/meta.ts` — `/responses` and `/images/generations` calls
- `app/api/lens/route.ts` — the combined pipeline
- Base URL: `https://api.meta.ai/v1` — models: `sam-3.1`, `muse-spark-1.3`, `muse-image-1.0`

## Roadmap — where the moat grows
- **Distribution first:** WhatsApp/Facebook-ready publishing from every listing, installable offline PWA (seller lives on WhatsApp, not app stores).
- **Data moat:** every generated listing is a real local price for an informal-market good — the price graph compounds with every user and cannot be copied by cloning the UI.
- **Seller OS lock-in:** stock, costs and profit live here; sellers don't leave the place that knows their numbers.
- **Next:** realtime bidding gateway, AI budget negotiation in Smart Market, live-selling SAM tracking.

## Not built yet (honest with judges)
- Egyptian-dialect voice transcription (wired for `POST /v1/asr/transcribe`).
- SAM video tracking for live selling.
