# Asset sources

The original Oliveco mark was cropped from the brand reference image supplied by the user. Its current tagline version is described below. Product images are crops of the embedded images in the three supplied catalogues; no product packaging was generated. The PDFs remain source materials outside the website and are not served or linked.

## Approved Marketing Group logo

Web asset: [`dist/assets/oliveco-group-logo.png`](dist/assets/oliveco-group-logo.png), 2168 x 725, with transparency.

On 13 November 2026 the user requested the small tagline **MARKETING GROUP  CO.,LTD**, reviewed a generated preview, and approved replacing the website logo. The built-in image generation tool edited the original transparent logo using the approved preview as the wording reference. The earlier `dist/assets/oliveco-logo.png` remains available for rollback; it is no longer used by the pages. No product image or company contact was changed by this logo replacement.

Final edit prompt:

> Precise text edit of Image 1, the original transparent Oliveco website logo. Keep its existing transparent background genuinely empty. Keep both round symbols and the large lowercase oliveco wordmark EXACTLY as in Image 1. Replace ONLY the small old tagline with "MARKETING GROUP  CO.,LTD" in the same outlined condensed italic uppercase style. Image 2 is the approved wording/style preview for the new tagline; do not copy its white backdrop or black bars. Maintain the original wide canvas, existing artwork scale, original logo positions, and original tagline baseline/right alignment. Clean crisp flat logo artwork on genuine alpha transparency. Every pixel outside the logo and lettering must be completely transparent. Absolutely no white remnants, clouds, speckles, paper texture, black background, checkerboard background, glow or shadow.

Manrope is self-hosted from Google Fonts, https://fonts.google.com/specimen/Manrope (SIL Open Font License). The accompanying font licence is in `dist/assets/Manrope-OFL.txt`.

Noto Sans Myanmar is self-hosted from Google Fonts under the SIL Open Font License. Its licence is in `dist/assets/Noto-Sans-Myanmar-OFL.txt`.

## Supplied King Pharmacy feature banner

Web asset: [`dist/assets/king-pharmacy-feature-upright.webp`](dist/assets/king-pharmacy-feature-upright.webp).

This is the latest user-supplied Glycerin Pure / Vaseline Pure composition with all three packs upright, imported directly with WebP encoding for the website. The original is preserved at `source-assets/king-pharmacy-feature-upright.png`, supplied as `codex-clipboard-cbb98e50-5e14-4b19-9490-9cbb5374409f.png`. No image generation was used for this replacement. The earlier angled composition remains in the source assets.

## Current portrait hero

Web asset: [`dist/assets/oliveco-reference-cutout.webp`](dist/assets/oliveco-reference-cutout.webp).

Source: the user's supplied portrait, preserved in `source-assets/portrait-reference.png`. The built-in image generation tool removed the advertisement background and the carousel-arrow overlay while preserving the supplied woman's identity, clothing and pose. The final image has an alpha channel and is placed over CSS bokeh and white/pastel gradients. The web asset is a WebP encoding of the edited transparent PNG.

Final edit prompt:

> Use case: identity-preserve / background-extraction. Edit target: the attached existing portrait. Create a clean transparent cutout of this EXACT woman for a skincare website hero. Preserve her identity and original face precisely: the same eyes, nose, lips, facial proportions, skin tone, makeup, slicked-back dark hair, expression looking slightly up-left, white sleeveless top and pose with hand resting across the opposite shoulder. Do not reinterpret or replace her with a similar model. Remove the green advertisement background, plants, egg, decorative lines and sparkles. Remove the translucent white circular carousel-arrow UI over her right ear and reconstruct only the small area it covers naturally. Preserve the original person and her visible body from head to the lower edge of the supplied image. Clean hair and clothing edges. Background must be fully transparent alpha, white clothing must remain opaque white. No new text, logos, packaging, props or scenery. No face beautification or change of age, ethnicity, hairstyle or pose.

## Previous portrait hero

Web asset: [`dist/assets/oliveco-portrait.webp`](dist/assets/oliveco-portrait.webp).

Generated with the built-in image generation tool. Final prompt:

> Use case: photorealistic-natural. Asset type: full bleed website hero background photo for Oliveco. The attached screenshot is a composition and lighting reference, not an edit target. Generate ONLY a new clean photographic image, no screenshot or website UI. A beautiful adult Myanmar woman in her late twenties with natural warm medium-tan Burmese skin, dark almond-shaped eyes and black hair loosely gathered into a casual bun, wearing a simple ivory sleeveless linen top. On the right half of a very wide landscape composition, she gently touches a small dab of white skincare cream on her cheek, looking calmly towards camera. Authentic contemporary Myanmar beauty, realistic skin texture, understated makeup, relaxed friendly expression. Soft sage green plaster backdrop, olive foliage at far right foreground and dappled leafy afternoon shadows. Large empty sage negative space occupies LEFT 53 percent, completely clear for website headline and buttons that will be coded separately. Face and upper torso fill right 45 percent, head fully visible, shoulder starts at bottom. Lighting and composition similar to the reference, warm soft botanical skincare campaign photography. Landscape aspect ratio 16:9. Palette soft sage, olive green, warm natural skin, cream. Absolutely no text, letters, logos, packaging, user interface, buttons, frames, circles or watermark.

## Generated botanical backdrop

Web asset: [`dist/assets/botanical-hero.webp`](dist/assets/botanical-hero.webp). Previous feature background, retained as an earlier asset; the current feature uses the supplied King Pharmacy composition.

Generated with the built-in image generation tool. Final prompt:

> Use case: photorealistic-natural. Asset type: background photograph for an Oliveco skincare website hero. Create a premium natural beauty still-life environment, landscape 3:2. A pale soft sage green plaster backdrop, warm afternoon sunlight and beautifully dappled large olive-leaf shadows, one low wide matte pale sandstone pedestal occupying lower center-right with a horizontal top surface. Fresh long aloe vera leaves and a few olive branches frame the far right edge, leaving center and left very open. Rich natural olive greens, touches of fresh yellow green, ivory stone. Highly realistic sophisticated commercial beauty photography, subtle analog grain, soft atmospheric light, crisp plant detail, calm modern and natural composition. No bottles, no jars, no cosmetic packaging, no products, no text, no logos, no watermark. This is only an environmental backdrop; genuine product cutouts will be placed over the central pedestal later.

## Pastel homepage banner, 1 November 2026

`dist/assets/oliveco-pastel-banner.jpg` is an optimized copy of the user-supplied “Pastel banner with poised woman (1).png”. The complete supplied composition replaces the previous cutout hero.

## Our Story company photographs, 1 November 2026

Seven client-supplied JPEGs from the 20.28.54–20.29.07 photo set are optimized in `dist/assets/story/`. All seven frames are displayed without cropping: company building, two colleague portraits, delivery team, vans, gathering and traditional ceremony. Descriptive captions do not assign unconfirmed dates, names or roles.

## Home-care collection cutout

`dist/assets/consumer-2-cutout.png` removes the pale rectangular background and stray bottom text from the existing Vertex bottle photo using the image-editing tool. It was superseded by the shared `studio/consumer-2.webp` packshot; the original catalogue source remains retained.

## Transparent studio packshots and updated logo

The user approved studio-style mockups for all 28 catalogue products, preserving their original packaging and labels. `dist/assets/studio/*.webp` contains the alpha-transparent, reference-based image edits used by catalogue cards, collection tiles, details, selection and chat. The original WebP source photos remain available for comparison. These are enhanced presentation images, not new evidence about ingredients, sizes or product claims. The FAQ identifies the studio treatment.

`dist/assets/oliveco-logo.png` is the exact user-supplied “Oliveco logo with green-yellow emblems.png”; CSS frames out empty canvas while preserving the full artwork. It replaces the previous image-plus-text wordmark across all three pages and the homepage company introduction.

## Favicon and upright packshot corrections

The browser icon was newly generated from the reference concept and cleaned; `favicon-high-resolution.png` retains the high-resolution PNG, with dedicated 32px, 192px and 512px PNG exports. All three pages reference the refreshed PNG favicon. Perfect, Mega-10 and Thai-Tha packshots were corrected to upright presentations; the Olive Oil Plus 60 ml image has its centre seam removed.

## Catalogue product information — 1 November 2026

All 29 scanned pages of the user-supplied `Cosmetics .pdf` (13 pages), `Consumer (2).pdf` (6 pages) and `Medical (2).pdf` (10 pages) were visually reviewed. They map to 28 catalogue products; medical pages 8–9 repeat the small methylated-spirit bottle. Bilingual descriptions in `dist/products.js` and `dist/i18n.js` now cover the supplied product uses, listed ingredients, directions and handling notes. `assistant-knowledge.json` carries the same source-attributed details for the assistant. Ingredient lists are not represented as complete formulations. Oral medicine dosing remains a current-label/pharmacist enquiry.

Source discrepancies are retained explicitly: the body-lotion sheet states 120 g while its pictured tube states 100 g; Denny’s ingredient sheet prints “Aluminum Chlorohydrace”; the blue cream box reads B&C. The two small glycerin formats are 4 oz (glass/plastic), and the floral hair oil is jasmine coconut oil. Sources do not establish current prices, stock or clinical suitability. Original PDFs remain outside the public website.

## Ingredient education references — 2 November 2026

The guide answers basic thanaka and aloe questions independently of catalogue matching. These are general ingredient facts, not claims about stock, finished-product efficacy, SPF, or clinical suitability. References: [thanaka bark research](https://pubmed.ncbi.nlm.nih.gov/20804839/), [DermNet aloe overview](https://dermnetnz.org/topics/aloe-vera-and-the-skin), [NCCIH aloe safety](https://www.nccih.nih.gov/health/aloe-vera). The SVG asset is served with `image/svg+xml` while retaining `nosniff`.
