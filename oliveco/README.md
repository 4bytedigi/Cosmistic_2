# Oliveco application

A local, Myanmar-first product showcase for Olive Marketing Group Co., Ltd. Visitors browse products, choose a few and prepare an enquiry for the seller on Viber. There is no checkout or payment system. The original PDFs are source materials only and are not included or linked in the website.

## Run locally

Clone [4bytedigi/OliveCo_Website](https://github.com/4bytedigi/OliveCo_Website), then run from its repository root:

```sh
cd oliveco
npm ci
npm run build
npm start
```

Open [localhost:4173](http://localhost:4173/). Node.js 22 or newer is required. The development server binds to the local computer by default. All commands below run inside `oliveco/` unless stated otherwise.

## Server deployment

Use `oliveco/` as the application root with Node.js 22 or newer: install with `npm ci`, build with `npm run build`, and start with `npm start`. The default port is 4173. For a container deployment, set `HOST=0.0.0.0` and `PUBLIC_ORIGIN=https://oliveco2.aungmyin.com`. See the [deployment guide](../DEPLOYMENT.md) for environment settings, verification and the existing production repository connection.

## Included

- Myanmar is the default, with an English language switch. The choice persists in the browser.
- 28 product entries with real packaging photos extracted from the supplied source materials.
- Five collections, bilingual search, sorting, product details and saved products.
- A dedicated `/shop` page with the full catalogue and shareable category, search, sort and saved-product filters. The homepage shows eight products and links to the Shop page.
- A product selection list with quantities, persistent browser storage, and a copyable enquiry in the selected language.
- Phone layouts, horizontal collection tabs, larger touch controls, and a bottom selection summary.
- A contextual chat panel that answers product questions and shows relevant product cards.
- Shared call/Viber contacts and an enquiry form reachable from chat, the contact section and product selection.
- The supplied brand portrait against white and pastel bokeh gradients, with `#8BC34A` green accents.

## Assistant

The assistant supports conversation history, follow-up product questions and customer enquiries. It uses the confirmed catalogue facts and `assistant-knowledge.json`. Missing hours, prices, stock and policies remain unknown and are referred to the seller.

For local AI testing, copy `.env.example` to `.env` and set `AI_API_KEY`. The defaults use OpenAI's Responses API with `gpt-5-nano`; this is the project's configured default, not a promise about future provider pricing. In production, keep the key in the project's private server environment settings. Never commit it or put it in `dist/`. Set `AI_PROVIDER=compatible` with an appropriate `AI_BASE_URL` and `AI_MODEL` only for another OpenAI-compatible provider. The [environment reference](../DEPLOYMENT.md#environment-settings) lists the supported settings.

For the selected Gemini setup, follow [Gemini setup](../DEPLOYMENT.md#gemini-setup). The server pins `gemini-3.1-flash-lite` when configured, uses structured responses and minimal reasoning, and never automatically upgrades to a more expensive model.

The sales assistant uses `assistant-knowledge.json` for reviewed catalogue text, partial ingredient lists, discovery terms and source-page references. Each AI call receives approved facts for all 28 products so everyday wording and changing needs can be understood without another retrieval call. It answers English messages in English and Burmese messages in Burmese, independently of the interface language; mixed Burmese/English product names receive Burmese replies. Product discovery and contextual follow-ups stay in chat. Explicit purchase requests or missing business details can open the existing enquiry flow. The build copies only the small public search/ingredient/pack-note fields into the offline guide; the existing product files already contain the descriptions. When changing catalogue prose, keep `dist/products.js` and `dist/i18n.js` consistent with the knowledge record. Prices, stock, hours and policies remain unknown unless confirmed by the client.

`POST /api/chat` accepts a question, language, product context and bounded chat history. First fetch `/api/status` from the same origin to receive the signed chat cookie; POST requests also require the configured `Origin`. The response includes validated catalogue IDs for product cards. Without a key, or if AI fails, local product/company replies remain available. `/api/status` reports configuration and the model name without exposing credentials. Recent chat stays available when navigating between site pages within the tab; refreshing the browser starts a new conversation. The header's restart button also cancels pending replies and clears history, input and product context.

Cost controls: `gpt-5-nano` remains the default, with minimal reasoning, low verbosity, a 700-token output limit, at most six history messages (900 characters each), no model retries, no paid tools and no more expensive fallback. Confirmed company/FAQ, size, ingredient and missing-policy replies can be answered locally. Defaults cap AI attempts at ten/client/minute, 40/client/day and 500/site/day, with one active call/client and three site-wide. All chat requests also have server-side IP/session limits. Provider failures trigger a temporary pause; clear browser notices explain recovery. See [chat protection and its deployment boundaries](../DEPLOYMENT.md#chat-protection-and-recovery). OpenAI response storage is disabled.

## Confirmed chatbot information

Send [the client questionnaire](CLIENT-CHATBOT-QUESTIONS.md) to the client. Enter approved business answers in `assistant-knowledge.json`, using a string or `{ "en": "...", "my": "..." }` for each business field. Leave unconfirmed values as `null`. Product additions go under `products`, keyed by the existing product ID; approved question/answer pairs go in `faqs`. Include source/confirmation dates in supplied details. Never infer medical directions or marketing claims from a product name. Restart/redeploy after changing this server-side file.

Keep confirmed retail prices in `dist/prices.js` so product cards and chat use the same amounts. Real-time stock, order tracking, payment processing and sending enquiries are not connected.

Contacts live in `assistant-knowledge.json`: `phone` is the primary call number, `phones` lists all call numbers, `viber` is the Viber destination, and `email` remains `null` until confirmed. On 1 November 2026, the user requested correcting Viber using the client screenshot: **09-4150440** now serves both calls and Viber, superseding the earlier typed number. Run `npm run build` after contact changes to refresh both page footers, the homepage contact section and public contact/guide data. The same record includes the client-supplied company profile and 1986 founding year. Company-level ingredient examples are not treated as ingredients of every product. The address still contains only the confirmed ward, township and city.

## Customer enquiries and Viber

Product cards inside chat use “Tell me more” to request an explanation in the conversation. The question follows the conversation's English/Myanmar language, keeps earlier history and focuses on the chosen product; unsent input is retained. The normal catalogue still supplies product details.

The contact section, product selection and purchase requests in chat open a bilingual enquiry form. It collects the customer's name, callback phone and question, includes selected products with pack sizes/quantities, and prepares the complete message. Myanmar digits in callback numbers are accepted and normalized for the copied message. Customers copy the enquiry, open the supplied Viber chat, paste and send it themselves. If clipboard access is unavailable, the full message is available to select and copy manually. If Viber does not open, the number stays visible so customers can save/message it in Viber.

There is **no Viber API connection or automatic delivery**. A copied enquiry is never reported as sent. The personal-number chat link contains only the business destination, not customer data. Enquiry fields stay in memory in the current page, are cleared when the form closes, and are not sent to the AI/server or saved in browser storage. Existing product selection and chat history persistence are separate from the enquiry form.

Automatic delivery later requires a supported Viber bot/business integration, private server credentials and the appropriate subscribed recipient/account setup. A bot cannot send to an arbitrary phone number alone. See [Viber's send-message API](https://developers.viber.com/docs/api/rest-bot-api/#send-message). The actual device launch and delivery still need testing on the client's Viber account; browser checks verify message content and destination without sending a test message to the client.

## Growing the catalogue

Add each confirmed product to `dist/products.js` with a unique stable ID, an existing category and a matching WebP packaging image in `dist/assets/`. Add its Myanmar name and bilingual approved facts to the matching maps in `dist/i18n.js`, its confirmed numeric price (or `null`) to `dist/prices.js`, and any fuller approved details under the same ID in `assistant-knowledge.json`. Counts, filters, selection and the assistant catalogue use this shared product list. Run the build/tests, review both languages and publish. A client-editable administration system is not part of the current site.

## Product prices

Edit `dist/prices.js` to replace each product's `null` with its confirmed numeric price. All prices currently remain unset, so each card displays `MMK —` in English or `— ကျပ်` in Myanmar directly below the product name. The selection button sits inside the bottom-right corner of the product image. No sample amounts are presented as real prices.

## Checks

Run `npm run build` before committing script or stylesheet changes. This refreshes the content versions in both HTML pages, preventing cached files from an earlier deployment from being mixed with a new page.

Run `npm run check` for JavaScript syntax checks and `npm test` for the automated assistant/enquiry tests. The tests use mocked generation and do not need a real API key or make paid model calls.

Optional browser regression checks: install Python Playwright (`python -m pip install playwright`), ensure Microsoft Edge is installed, then run `python tests/browser-smoke.py`. It starts and stops its own temporary guide-only server, uses headless Edge, and saves ignored screenshots under `output/chat-hardening/`. It covers restart during a pending reply, network recovery/retry, cooldown persistence, product/company answers, Viber handoff and Myanmar/English responsive layouts. No Viber message is sent.

With Node Playwright available, `node tests/chat-mobile-browser.mjs` checks mobile chat against simulated keyboard resize/pan, compact height, English/Myanmar, product details, keyboard focus, page-position restoration, rotation and desktop layout. `PLAYWRIGHT_PACKAGE` can point to an existing Playwright package.json. Evidence goes in ignored `output/mobile-chat/`. The test uses an isolated guide-only server; it cannot verify an actual iPhone keyboard. Mobile chat follows `visualViewport` resize/scroll events because the software keyboard can change the visible area without changing viewport CSS units.

Browser verification on 29 October 2026 covered Myanmar/English switching, search, category filtering, saved items, product details, selection quantities and persistence, list copying, contextual chat and the Viber enquiry form. Phone views were checked at 320px and 390px widths. No PDF links, broken product images or browser console errors were found in those checked views. Actual Viber app delivery and physical-device/screen-reader testing remain separate checks.

On 1 November 2026, 36 automated tests passed, including chat abuse limits and interrupted uploads. Headless Edge checks covered both pages, pending-request restart, retry, rate-limit recovery, server/malformed-response failures, a simulated timeout, and 320px Myanmar/390px English/1440px English layouts. Live HTTPS checks also verified a real nano-model comparison, the corrected contact, company replies, signed sessions, cross-origin rejection and the mobile enquiry handoff.

See [DESIGN.md](DESIGN.md) for visual decisions and [ASSETS.md](ASSETS.md) for image sources and generation prompts.
