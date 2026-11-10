# Oliveco Website

The Myanmar/English product catalogue and customer enquiry website for Olive Marketing Group Co., Ltd.

[Live website](https://oliveco.aungmyin.com/) · [GitHub repository](https://github.com/4bytedigi/OliveCo_Website)

## Features

- Myanmar-first browsing with an English switch.
- 28 products across five collections, with packaging photographs, search, filters, saved products and a dedicated [Shop page](https://oliveco.aungmyin.com/shop).
- A persistent product selection with quantities and copyable enquiry lists.
- Product chat with conversation context, confirmed catalogue facts and a local guide fallback. Production uses `gemini-3.1-flash-lite`.
- A bilingual enquiry form that prepares the customer's name, callback phone, question and selected products for Viber.

Customers copy their enquiry, open Viber, paste and send it themselves. Automatic Viber delivery, checkout, payments and live inventory are not connected. Unconfirmed prices and business details are not invented.

## Run locally

Requires Node.js 22 or newer and npm. From a terminal with access to this private repository:

```sh
git clone https://github.com/4bytedigi/OliveCo_Website.git
cd OliveCo_Website
npm --prefix oliveco ci
npm --prefix oliveco run build
npm --prefix oliveco start
```

Open [localhost:4173](http://localhost:4173/). The local product guide works without an API key. For AI conversation, copy `oliveco/.env.example` to `oliveco/.env` and configure the server-only settings described in the [application README](oliveco/README.md#assistant).

## Build and test

```sh
npm --prefix oliveco run build
npm --prefix oliveco test
```

The build generates public contact data from the confirmed business record, refreshes script/stylesheet content versions in both pages, and checks JavaScript syntax. The frontend uses plain HTML, CSS and JavaScript; no transpiler or frontend framework is required. The automated tests cover assistant behavior, cost controls, contact routing and enquiry message preparation.

Commit the generated `oliveco/dist/contact-data.js` and updated HTML asset versions together with their source changes. Runtime keys, `.env` files, dependencies, logs and local research/output folders stay out of Git.

## Project layout

| Path | Purpose |
| --- | --- |
| [`oliveco/dist/`](oliveco/dist/) | Website pages, styles, browser scripts, product data, fonts and web images |
| [`oliveco/server.mjs`](oliveco/server.mjs) | Node HTTP server, Shop routing and chat endpoints |
| [`oliveco/assistant-service.mjs`](oliveco/assistant-service.mjs) | Server-side AI connection, grounding and request limits |
| [`oliveco/assistant-knowledge.json`](oliveco/assistant-knowledge.json) | Confirmed business contacts, policies and approved product additions |
| [`oliveco/source-assets/`](oliveco/source-assets/) | Supplied source artwork retained for maintenance; not served by the app |
| [`oliveco/tests/`](oliveco/tests/) | Node test suite |
| [`oliveco/.env.example`](oliveco/.env.example) | Empty server configuration template |

## Maintenance and deployment

- [Application setup, product updates, prices, AI settings and Viber behavior](oliveco/README.md)
- [Deployment and repository handoff](DEPLOYMENT.md)
- [Design decisions](oliveco/DESIGN.md)
- [Asset sources and font licences](oliveco/ASSETS.md)
- [Client information still needed](oliveco/CLIENT-CHATBOT-QUESTIONS.md)
- [Verified project state and accepted decisions](oliveco/work/project-context.md)

The application root for hosting is `oliveco/`. Deploy the Node server for both the website and chat API; serving only the static folder omits the chat endpoints. Keep production credentials in the host's private environment settings.

## Repository history

This repository carries the complete Oliveco project history from `Cosmistic_2`, together with this repository's initial commit. The existing `working-version1` tag marks the first working snapshot. The repository handoff does not change the live host's deployment source; see the [deployment guide](DEPLOYMENT.md#current-production-connection).
