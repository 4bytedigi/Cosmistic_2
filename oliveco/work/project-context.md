# Oliveco project context

## Current chatbot hardening — 1 November 2026

- Improve the existing chatbot as a bilingual sales/customer-service assistant, including products, company enquiries, reliable error recovery, a header restart button and protection against spam/misuse. Preserve the existing logo and design.
- The user supplied a company profile: Oliveco was established in 1986; its cosmetic ranges combine research/modern methods with Myanmar traditional and Indian Ayurvedic cosmetic methods, and mention aloe vera, neem, thanaka and herbs. Attribute this to the profile; do not claim independent market leadership, medical efficacy or these ingredients in every product.
- The latest request asks to correct Viber using the repeated client screenshot. **09-4150440** is now the Viber and primary mobile call destination; it supersedes the earlier typed 092150440. Shared generated contacts, chat and enquiry links must agree on `+9594150440`. Device/account verification and actual Viber delivery remain separate from browser link verification.
- Implemented free company/range/size/ingredient/policy answers, product comparisons and follow-up guidance, bounded AI instructions/output, and sales enquiry handoff. Fixed an English substring alias that matched `R C` inside `your company`. Missing hours/email/prices/stock/policies remain unconfirmed.
- Restart cancels pending fetches, invalidates stale replies and clears history/context/input. Explicit network/offline/timeout/busy/limit notices and manual retry retain usable local product/company help. Both pages now load the local guide for network recovery; unchanged log entries reuse DOM nodes to avoid repeatedly announcing chat history.
- Added signed HttpOnly/SameSite chat sessions, required allowed Origin, bounded input/body/history/output, per-IP/session HTTP quotas, client/day and site/day AI caps, one AI call per client/three site-wide, failure cooldowns and restricted proxy-header trust. Quotas stay on the server when chat restarts. In-memory limits reset with the Node process; deployments with multiple instances require a shared limiter.
- Existing low-cost `gpt-5-nano`, 700 output tokens, no model retries/tools/more-expensive fallback and disabled provider response storage are preserved. No automatic Viber API delivery is available.
- Hosting source was read from the live server: it still follows `Cosmistic_2/main`, while this checkout uses `OliveCo_Website` as `origin`. Publish the same tested commit to both remotes for this update; preserve hosting source, domain and tunnel.
- Found the production environment was missing `PUBLIC_ORIGIN`. Added only `https://oliveco2.aungmyin.com` to the project's encrypted settings, preserving every other value and an encrypted backup. It will apply with the next deployment and enables legitimate website requests under the strengthened origin check.
- Build and all 35 automated tests pass. Headless Edge checks passed for product/company questions, purchase-to-enquiry handoff, corrected Viber links, keyboard restart/Escape/focus, restart during an in-flight reply, no stale history, network failure/manual retry, cooldown retention, Shop HTTP-500/malformed-response fallback, a simulated client timeout, and 320px Myanmar/390px English/1440px English reflow. No uncaught page errors were observed. The scoped design detector returned no findings. Live deployment verification remains pending.

## Repository handoff — 1 November 2026

- The user requested the complete code in `4bytedigi/OliveCo_Website` with refreshed READMEs and supporting documentation.
- The target is private and initially contained only `README.md` at `ae9bde5`. The user accepted repository access during this task; the local GitHub account then verified read/write access.
- Preserve the original project history and target initial commit with a normal merge, then push `main` and the existing `working-version1` tag without force-pushing.
- Make the new repository the local `origin` after successful verification; retain `Cosmistic_2` as `legacy`. The live server's source configuration remains unchanged by this repository-only handoff.
- Refresh clone/setup commands, document the current deployment connection, use portable asset links and keep the existing business/AI/Viber limitations explicit. Runtime credentials and ignored output/research files remain outside the upload.
- Both READMEs and asset links were refreshed, and a root deployment guide was added. A clean tracked-source export installed with `npm ci`, built successfully and passed all 17 tests. All 28 product images and both pages' local assets were present. Documentation links passed validation; no private environment files or credential patterns were found in the inspected source/history.
- Published the handoff merge `4f40fa3` to `4bytedigi/OliveCo_Website/main`, together with `working-version1`. GitHub verification confirmed all 77 tracked files match by blob hash, and both the original project history and target initial commit are ancestors of `main`.
- The local default `origin` now points to `OliveCo_Website`; the previous `Cosmistic_2` remote is retained as `legacy`, and `main` tracks `origin/main`. No hosting source, domain, tunnel or runtime settings were changed. The repository handoff is complete; a future production-source switch follows `DEPLOYMENT.md`.

## Current brief — 29 October 2026

- Preserve the existing Oliveco green/yellow identity and logo. Logo replacement is explicitly deferred until the user supplies the new asset.
- Keep Myanmar as the default reading language, with English available throughout shopping, chat and the new enquiry flow.
- Replace the earlier Facebook-sourced phone with the client's supplied call numbers: 02-4036795, 02-2832238 and 09-4150440.
- The earlier Viber destination 092150440 was superseded by the 1 November correction above; use **09-4150440** now.
- Customers can ask product questions, then prepare an enquiry with their name, callback phone, product selection and question for the client.
- The user confirmed there is **no Viber API connection** and authorized completing the available customer-controlled handoff without more questions tonight. Prepare/copy the enquiry and open the client's Viber chat. Never claim it was sent or an order was accepted.
- Publish changes to the existing GitHub main branch and verify the live site at https://oliveco2.aungmyin.com/.

## Accepted implementation decisions

- Continue the existing static HTML/CSS/vanilla-JavaScript frontend and Node server. Do not add React, shadcn, GSAP, a new visual theme or a CMS for this contact/enquiry change.
- `assistant-knowledge.json` remains the canonical business record. Build contact HTML and public contact configuration from it so page links and chat agree.
- Customer enquiry details remain in the current page only. Do not send the form to the AI provider, put personal data in URLs, store it in browser persistence, or add an unsecured lead inbox.
- Use a native dialog with visible labels, inline validation, a message preview, clipboard fallback and explicit paste/send instructions. Clearing/closing the form removes its draft.
- The public catalogue already uses one product list for counts, filters and chat; future products should extend that list, matching translations/photos and confirmed prices. Administration or a CMS can be scoped separately if requested.

## Verified facts and constraints

- Before this task, main was `7f74d71`; the live phone, two page footers and chatbot were verified on 28 October.
- The self-hosted server manager automatically deploys GitHub main. `npm run build` refreshes content-versioned asset links before commit.
- Viber bot send-message requests require a subscribed user ID; a phone number alone is not an automatic-send integration. Source: https://developers.viber.com/docs/api/rest-bot-api/.
- The Viber share scheme lets users choose a recipient and can truncate long text. Use full message copy plus the explicit destination number instead. Source: https://developers.viber.com/docs/tools/share-button/.
- Ward/township/city are legible in the client screenshot. The exact building/street transcription remains unconfirmed. Email, opening hours, prices and business policies are still unconfirmed.

## Progress

- Shared contact record and bilingual enquiry flow implemented on both pages, the product selection and chat purchase/detail actions.
- 17 automated tests passed. Browser checks passed for English/Myanmar clipboard content, Myanmar phone normalization, validation/focus, draft clearing, selected quantities, chat-to-form context and the 28-product Shop page. The 320px layout had no horizontal overflow or footer links obscured by chat.
- Declared color pairs measured: form text 11.83:1, secondary text/input borders 5.75:1, errors 7.32:1, primary button text 5.64:1. Static detector findings were existing navigation sizing and section/hover heuristics; rendered theme gradients and padded children supersede those false positives. No new enquiry-specific detector finding was returned.
- No browser console errors in the checked Shop flow. Native Viber launch/delivery and physical-device/screen-reader checks remain unverified. Clipboard success was exercised; the manual-copy error path was reviewed in code.
- Functional change `b2e6187` was pushed to GitHub main and automatically deployed. Production HTML on both pages contains the Viber destination; `/api/status` reports the existing `gpt-5-nano` configuration; purchase requests return the enquiry/contact actions with the correct product context.
- The live dialog opened correctly, copied the complete selected-product enquiry and showed explicit paste/send instructions for 092150440. Test draft cleared on close. No live browser console errors were observed. No message was sent to the client during testing.
- The final mobile refinement was confirmed at 390px: opening focuses the heading without forcing the phone keyboard, closing from a selection enquiry restores focus to the selection button, and the form has no horizontal overflow. The full 320px form/contact layout was checked earlier in the same run.
- Proof screenshot: `output/viber-enquiry-live.jpg` (local, ignored build evidence). The implementation is complete for the agreed customer-controlled handoff; follow-ups are listed below and in `CLIENT-CHATBOT-QUESTIONS.md`.

## Skill routing for this change

Project-context and the website skill collection routed this as a refinement in the established brand. Form UX, concise bilingual copy, semantic controls, focus/validation, spacing and contrast checks shaped the new flow. Existing frontend and motion conventions were preserved. React composition, shadcn installation, GSAP choreography, Figma operations and replacement themes/branding are inapplicable to this vanilla-JavaScript enquiry task. Verification covered the changed flows; no full-site SEO or performance audit is claimed.

## Follow-up for the client

- Replacement logo asset; confirmed email and hours; exact address text; verify the corrected 09-4150440 Viber account on a device.
- Automatic delivery later needs a supported Viber bot/business integration with server-only credentials and the relevant recipient/subscription setup. No automatic delivery is configured now.
