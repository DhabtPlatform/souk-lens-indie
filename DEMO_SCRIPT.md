# Souk Lens — pitch script & deploy plan (for the team)

> Video rule: screen footage must be the real app. Voiceover may be AI or human.
> Open the video with this line, verbatim: "Souk Lens is not an image analyzer —
> it's a complete market platform for informal markets: from a stall photo to listing,
> auction, smart market and payment."

## Public deploy (do before submitting — needs your own host account)
```bash
npm i -g vercel        # or use vercel.com/new and import the project
vercel env add MODEL_API_KEY production   # key from https://dev.meta.ai
vercel --prod
```
Alternative: any Node 20 host (Render/Railway) with `npm run build && npm run start`.
Verify after deploy: open the public URL → "One-click demo" → the proof bar must say LIVE.
Without a key it runs the same pipeline in labeled Demo mode.

## 90-second script (mirrors the in-app guided tour)
| Time | Say | Do |
|---|---|---|
| 0–10 | Opening line above + "Any market stall on Earth becomes a selling store — from one photo." | Open the hero |
| 10–35 | SAM isolates, Spark prices and writes, Muse Image cleans — timings on screen | "One-click demo", tap an item on the SAM map, drag the before/after slider |
| 35–50 | The listing saved in full; profit report and live auction | Tour step Save → My products → auction → live simulation |
| 50–75 | The buyer asks, the agent bundles and decides | Smart Market: furnish a wedding → move item → approve → invoice |
| 75–90 | From invoice to cart to payment. Three Meta models for a market nobody serves | Open the cart and confirm |

## Fallback plan
- Network dies: continue the same steps — the pipeline runs in labeled Demo mode. Transparency is a strength, not an excuse.
- Machine dies: print this page + shots from `/brand`, and walk the pipeline from a saved proof-bar screenshot.
- "How is this different from ChatGPT?": visual pipeline (SAM) + full product with variants and stock + save/sell/auction/smart market — not a chat reply.
- "Is the data real?": catalog and sales are labeled demo; measured and real: model timings, Live listings, your saved products.

## Before going on stage
- [ ] Public URL works and the key is set (LIVE visible)
- [ ] One full run on the same machine and network
- [ ] UI language English (or the judges' language), country as needed
- [ ] Cart empty, at least one saved product in My products (for Smart Market)
