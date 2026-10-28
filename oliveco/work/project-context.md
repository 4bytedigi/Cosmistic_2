# Oliveco project context

## Current brief — 29 October 2026

- Preserve the existing Oliveco green/yellow identity and logo. Logo replacement is explicitly deferred until the user supplies the new asset.
- Keep Myanmar as the default reading language, with English available throughout shopping, chat and the new enquiry flow.
- Replace the earlier Facebook-sourced phone with the client's supplied call numbers: 02-4036795, 02-2832238 and 09-4150440.
- Use **092150440** for Viber, exactly as the user requested. This differs from the screenshot's mobile call number; do not silently substitute one for the other.
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
- Next: refresh asset hashes after the final focus refinement, publish main and verify live HTML, chatbot actions and the enquiry dialog.

## Skill routing for this change

Project-context and the website skill collection routed this as a refinement in the established brand. Form UX, concise bilingual copy, semantic controls, focus/validation, spacing and contrast checks shaped the new flow. Existing frontend and motion conventions were preserved. React composition, shadcn installation, GSAP choreography, Figma operations and replacement themes/branding are inapplicable to this vanilla-JavaScript enquiry task. Verification covered the changed flows; no full-site SEO or performance audit is claimed.

## Follow-up for the client

- Replacement logo asset; confirmed email and hours; exact address text; verify that 092150440 is the intended Viber account.
- Automatic delivery later needs a supported Viber bot/business integration with server-only credentials and the relevant recipient/subscription setup. No automatic delivery is configured now.
