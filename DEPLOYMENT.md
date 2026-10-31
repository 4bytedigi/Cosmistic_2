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
| `TRUST_PROXY` | `false` | Enable only behind the trusted Cloudflare/reverse proxy so rate limits use its client address |

For the existing public domain, use `PUBLIC_ORIGIN=https://oliveco2.aungmyin.com`. Restart/redeploy after server environment or knowledge changes. Keep real keys outside Git, browser scripts, screenshots and issue/commit descriptions.

## Current production connection

The last verified production configuration, on 29 October 2026, deployed `4bytedigi/Cosmistic_2` on `main` through the self-hosted server manager. This repository handoff does not change the host configuration, DNS or Cloudflare tunnel. Check the host's current source settings before relying on pushes here to trigger a live deployment.

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
