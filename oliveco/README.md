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

The assistant supports conversation history, follow-up product questions and customer enquiries. It uses the confirmed catalogue facts and `assistant-knowledge.json`. Missing hours, prices, stock and policies remain unknown and are referred to the seller.

For local AI testing, copy `.env.example` to `.env` and set `AI_API_KEY`. The defaults use OpenAI's Responses API with `gpt-5-nano`. In production, keep the key in the project's private server environment settings. Never commit it or put it in `dist/`. Set `AI_PROVIDER=compatible` with an appropriate `AI_BASE_URL` and `AI_MODEL` only for another OpenAI-compatible provider.

`POST /api/chat` accepts a question, language, product context and bounded chat history. The response includes validated catalogue IDs for product cards. Without a key, or if AI fails, it returns local product-guide replies. `/api/status` reports configuration and the model name without exposing credentials. The browser restores the recent conversation and product context across page navigation within the tab.

Cost controls: the default model is `gpt-5-nano`, with minimal reasoning, low verbosity, a 700-token output limit, at most six history messages (900 characters each), no automatic retries, no paid tools and no switch to a more expensive model. Confirmed business FAQ replies and missing-policy notices can be answered locally. AI calls are limited to ten per client per minute and three concurrent calls. Set `TRUST_PROXY=true` only behind the trusted Cloudflare/reverse-proxy deployment so client rate limits use Cloudflare's client address. OpenAI response storage is disabled.

## Confirmed chatbot information

Send [the client questionnaire](CLIENT-CHATBOT-QUESTIONS.md) to the client. Enter approved business answers in `assistant-knowledge.json`, using a string or `{ "en": "...", "my": "..." }` for each business field. Leave unconfirmed values as `null`. Product additions go under `products`, keyed by the existing product ID; approved question/answer pairs go in `faqs`. Include source/confirmation dates in supplied details. Never infer medical directions or marketing claims from a product name. Restart/redeploy after changing this server-side file.

Keep confirmed retail prices in `dist/prices.js` so product cards and chat use the same amounts. Real-time stock, order tracking, payment processing and sending enquiries are not connected.

## Product prices

Edit `dist/prices.js` to replace each product's `null` with its confirmed numeric price. All prices currently remain unset, so each card displays `MMK —` in English or `— ကျပ်` in Myanmar directly below the product name. The selection button sits inside the bottom-right corner of the product image. No sample amounts are presented as real prices.

## Checks

Run `npm run build` before committing script or stylesheet changes. This refreshes the content versions in both HTML pages, preventing cached files from an earlier deployment from being mixed with a new page.

Run `npm run check` for JavaScript syntax checks. Browser verification covered Myanmar/English switching, search, category filtering, saved items, product details, selection quantities and persistence, list copying, and contextual chat. Phone views were checked at 320px and 390px widths. No PDF links, broken product images or browser console errors were found in the checked views.

See [DESIGN.md](DESIGN.md) for visual decisions and [ASSETS.md](ASSETS.md) for image sources and generation prompts.
