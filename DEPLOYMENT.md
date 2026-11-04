# Deployment and repository handoff

## Hosting settings

The website runs as a Node application. Its HTTP server serves the frontend and provides the chat API from the same origin.

| Setting | Value |
| --- | --- |
| Repository | `https://github.com/4bytedigi/OliveCo_Website.git` |
| Branch | `main` |
| Application/root directory | `oliveco` |
| Node version | 22 or newer |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Start command | `npm start` |
| Internal port | `4173`, or the host's configured `PORT` |
| Public website | `https://oliveco2.aungmyin.com` |

Run the commands inside `oliveco/`. The build refreshes public contact data, asset versions and syntax checks. Deploy the entire application directory, including `assistant-knowledge.json`, the server modules and package lockfile; only files inside `dist/` are served as static files.

## Environment settings

Configure these in the host's private environment settings. The tracked [`oliveco/.env.example`](oliveco/.env.example) contains empty/default values for local setup, not production credentials.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `4173` | HTTP listening port |
| `HOST` | `127.0.0.1` | Use `0.0.0.0` inside a container reached by a reverse proxy |
| `PUBLIC_ORIGIN` | unset | Add the public HTTPS origin allowed to call the chat endpoint |
| `AI_API_KEY` | unset | Server-only provider key; without it the local product guide remains available |
| `AI_PROVIDER` | `openai` for the OpenAI API | Provider adapter; use `compatible` only for a configured compatible endpoint |
| `AI_BASE_URL` | `https://api.openai.com/v1` | Provider API base URL |
| `AI_MODEL` | `gpt-5-nano` | Configured text model |
| `AI_MAX_OUTPUT_TOKENS` | `700` | AI output cap, bounded by the server to 256–1000 |
| `AI_REQUESTS_PER_MINUTE` | `10` | Per-client AI limit, bounded by the server to 1–60 |
| `AI_REQUESTS_PER_DAY` | `40` | Per-client AI attempts per 24-hour window, bounded to 1–200 |
| `AI_GLOBAL_REQUESTS_PER_DAY` | `500` | Site-wide AI attempts per 24-hour window, bounded to 1–2000 |
| `CHAT_REQUESTS_PER_MINUTE` | `20` | All chat POST requests per client/session per minute, bounded to 1–60 |
| `CHAT_REQUESTS_PER_HOUR` | `120` | All chat POST requests per client/session per hour, bounded to 1–500 |
| `CHAT_SESSION_SECRET` | random per process | Optional private random cookie-signing secret, at least 32 characters recommended |
| `TRUST_PROXY` | `false` | Trust Cloudflare's client header only from a private/loopback proxy peer; direct public access must remain blocked |

For the existing public domain, use `PUBLIC_ORIGIN=https://oliveco2.aungmyin.com`. Restart/redeploy after server environment or knowledge changes. Keep real keys outside Git, browser scripts, screenshots and issue/commit descriptions.

### Gemini setup

For the agreed Gemini option, enter the key privately as `AI_API_KEY` and set:

```env
AI_PROVIDER=compatible
AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
AI_MODEL=gemini-3.1-flash-lite
```

The existing compatible adapter uses Google's endpoint directly, requests a JSON schema for the answer/product cards, and sets minimal reasoning. It preserves the 700-token output cap, request limits, zero retries and no model fallback. Model selection happens on the server; the API key's display name and billing tier do not choose it. Reference: [Google's compatibility API](https://aistudio.google.com/docs/openai).

Local `npm start`/`npm run dev` read the ignored `oliveco/.env`. The live service needs the same settings in its private hosting environment; editing a local file does not update production. Use distinct credentials/projects for production and testing. Never copy production credentials into test fixtures. `/api/status` confirms configuration only, not provider authentication or a successful model response.

The automated provider-contract test uses a fake key and intercepted fetch responses, so it exercises Gemini request serialization without sending anything to Google. A real provider acceptance/quality check remains separate.

## Chat protection and recovery

The browser first gets a signed, HttpOnly, SameSite=Strict chat cookie from `/api/status`. Chat POST requests require that cookie and an allowed `Origin`. Expired sessions refresh once. Cross-origin requests, malformed JSON, control characters, messages longer than 500 characters and bodies larger than 24,000 UTF-8 bytes are rejected before generation. HTTP limits apply to free guide answers and invalid requests too; changing chat cookies or restarting the conversation does not reset the client-address quota. IPv6 addresses share a /64 quota.

AI calls additionally have client/day and site/day caps, a fixed site cap of 30 attempts/minute, one in-flight call per client and three across the site. Failed attempts count. Provider authorization/rate errors and repeated failures temporarily pause new paid calls. The guide remains available. Recent history and output are bounded; prompts restrict the assistant to confirmed Oliveco facts; product IDs and generated text are validated. No AI tools or messaging capability are enabled.

Counters and provider cooldowns are bounded in-memory state for one Node process. A process restart resets them; multiple replicas need a shared limiter. These request limits are not a monthly billing cap. Keep this deployment's app port reachable only through its trusted reverse proxy before enabling `TRUST_PROXY`.

Identical paid questions from the same client and product context are suppressed for 30 seconds, including punctuation/case changes and history padding. Obvious repeated-character/word or punctuation-only junk also uses local replies. Only short-lived keyed hashes are retained by this screen; it does not store messages. This supplements request quotas rather than claiming to detect every abusive request.

For `OliveCo Production` (`gen-lang-client-0399750528`), the owner confirmed **SGD**, a **S$10 email warning** and a **S$15 monthly Gemini cap**. AI Studio's Spend page showed the S$15 cap on 4 November 2026. Saved Cloud Billing alert `OliveCo Production — S$10 monthly warning`, ID `01a08d30-9a99-4540-9957-31accb6453d2`: monthly S$10 reference amount, actual-cost thresholds at 100% and 150% (S$10/S$15), Gemini API service only, no credits deducted, email delivery to billing admins/users. The console disabled selecting its single project, so the alert covers the billing account's Gemini service; OliveCo is currently its only billed project. Before adding other projects, narrow the alert to OliveCo when the UI permits or review the shared alert scope. Notification delivery was not tested by incurring threshold charges.

An email alert is separate from the cap; do not treat a budget alone as a stop mechanism. Billing reports/email alerts can lag by hours or longer than 24 hours. Google describes the project cap as experimental, with approximately ten minutes of enforcement latency and possible overages, and resets it on the first of each month (PST). Do not automatically increase it or switch providers when it is reached; preserve the free catalogue fallback. See [project spend caps](https://aistudio.google.com/docs/billing#project-spend-caps) and [budget alerts](https://docs.cloud.google.com/billing/docs/how-to/budgets).

The browser has explicit offline, timeout, busy and rate-limit states, local product/company fallback and a manual retry. Restart cancels the current request and clears chat history/context, while server quotas continue. Existing pre-update chat history is invalidated once so superseded contact numbers are not restored.

Implementation guidance: [OpenAI safety best practices](https://developers.openai.com/api/docs/guides/safety-best-practices). These layers reduce abuse; a public anonymous chatbot does not authenticate a buyer or accept an order.

## Current production connection

The production source was checked again on 1 November 2026: the self-hosted server manager still follows `4bytedigi/Cosmistic_2` on `main`. `OliveCo_Website` is the canonical local `origin`. Until a separate hosting-source migration, publish the same verified commit to the retained `legacy` remote for an automatic live deployment. The repository handoff did not change DNS or the Cloudflare tunnel.

To deploy future changes from `OliveCo_Website`:

1. Give the hosting connection access to this private repository using its normal account/installation setup.
2. Select `4bytedigi/OliveCo_Website`, branch `main`, and application root `oliveco` in the existing project's source settings.
3. Preserve the existing runtime secrets, port, public origin, domain and tunnel routing. Use the install/build/start commands above.
4. Deploy and complete the checks below before treating the new repository as the production source.

The local checkout keeps the previous repository as the `legacy` remote and uses `OliveCo_Website` as `origin` after a successful push. The complete project history, the new repository's initial commit and the `working-version1` tag are preserved. The older repository and live routing are not removed by this handoff.

## Verify a deployment

- Open `/` and `/shop`; check current assets, product images and both reading languages.
- Confirm call numbers and the separate Viber destination against `assistant-knowledge.json`.
- Open `/api/status`; verify the expected mode/model and that no key is exposed.
- Ask a product follow-up and a business-hours question. Unconfirmed hours/policies should remain unconfirmed.
- Prepare an enquiry from a product selection and from a purchase question in chat. Check names, quantities, pack sizes, callback fields and the complete copied message.
- On a device with Viber, verify the intended client account and the customer's paste/send step. Browser copy success does not prove Viber delivery.

## Application boundaries

There is no payment processing, order confirmation, live stock feed, customer administration panel or automatic Viber delivery. Enquiry fields stay on the current page and are cleared when closed; customers copy the prepared message and send it in Viber. A later automatic-delivery integration requires a supported Viber account/API setup and server-side credentials.

For catalogue/contact maintenance, see the [application README](oliveco/README.md). For missing client details, use the [client questionnaire](oliveco/CLIENT-CHATBOT-QUESTIONS.md).
