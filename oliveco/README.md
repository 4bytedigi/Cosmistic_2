# Oliveco

A local, Myanmar-first product showcase for Olive Marketing Group Co., Ltd. Visitors browse products, choose a few, copy their enquiry list, and contact the seller on the supplied Facebook page. There is no checkout or payment system. The original PDFs are source materials only and are not included or linked in the website.

## Run locally

```powershell
cd D:\Programing\Cosmistic_2\oliveco
npm install
npm start
```

Open http://localhost:4173. Node.js 22 or newer is required. The development server binds to the local computer by default.

## Server deployment

Use the `oliveco` root directory with Node.js 22 or newer. Install dependencies with `npm ci`, run `npm run check` as the build command, and start with `npm start` on port 4173. For a container deployment, set `HOST=0.0.0.0` so the reverse proxy can reach the app. Set `PUBLIC_ORIGIN=https://oliveco2.aungmyin.com` to allow product-guide requests from the public website. Local development keeps its loopback-only default.

## Included

- Myanmar is the default, with an English language switch. The choice persists in the browser.
- 28 product entries with real packaging photos extracted from the supplied source materials.
- Five collections, bilingual search, sorting, product details and saved products.
- A dedicated `/shop` page with the full catalogue and shareable category, search, sort and saved-product filters. The homepage shows eight products and links to the Shop page.
- A product selection list with quantities, persistent browser storage, and a copyable enquiry in the selected language.
- Phone layouts, horizontal collection tabs, larger touch controls, and a bottom selection summary.
- A contextual chat panel that answers product questions and shows relevant product cards.
- The supplied brand portrait against white and pastel bokeh gradients, with `#8BC34A` green accents.

## Assistant and API key later

The assistant currently runs as a local product guide using the supplied product information. It is labelled as a product guide, and does not claim that a generative AI service is connected.

The server-side AI integration is prepared using the installed AI SDK and its OpenAI-compatible provider. When ready, copy `.env.example` to `.env`, configure `AI_API_KEY`, `AI_BASE_URL` and `AI_MODEL` for your chosen provider, then restart `npm start`. No API key has been added. Keys remain on the server and are never served from `dist/`.

`POST /api/chat` accepts a question, language and bounded chat history. Without the configuration it returns local product-guide replies. When configured, it calls the selected AI model with grounded product facts and constraints against invented prices, availability, certifications or medical dosage advice. `/api/status` reports whether AI is configured without exposing credentials. Real AI generation remains untested until a provider and key are supplied.

## Product prices

Edit `dist/prices.js` to replace each product's `null` with its confirmed numeric price. All prices currently remain unset, so each card displays `MMK —` in English or `— ကျပ်` in Myanmar directly below the product name. The selection button sits inside the bottom-right corner of the product image. No sample amounts are presented as real prices.

## Checks

Run `npm run check` for JavaScript syntax checks. Browser verification covered Myanmar/English switching, search, category filtering, saved items, product details, selection quantities and persistence, list copying, and contextual chat. Phone views were checked at 320px and 390px widths. No PDF links, broken product images or browser console errors were found in the checked views.

See [DESIGN.md](DESIGN.md) for visual decisions and [ASSETS.md](ASSETS.md) for image sources and generation prompts.
