# Oliveco design

The user’s supplied storefront references and green/yellow brand assets govern the design. The current hero uses the woman from the supplied brand portrait, extracted with background and carousel-arrow removal. The primary accent is the user’s requested `#8BC34A`. White, pale green, lavender and warm yellow gradients form the background, with soft bokeh lights behind the portrait.

## Tokens

| Role | Value |
| --- | --- |
| Dark botanical text | `#283d1c` |
| Brand green accent | `#8bc34a` |
| Secondary yellow | `#ffd95d` |
| White background | `#ffffff` |
| Fresh sage surfaces | `#e8f4da` |
| Secondary green text | `#5a6b50` |
| Dividers | `#dce7d3` |

`dist/theme.css` owns the current palette. Green gradients anchor buttons, the contact area and chat, with dark text for readable contrast on the bright green. White and different pastel colours carry the page surfaces. Static blurred radial lights create the hero bokeh, while a transparent portrait preserves the supplied face and pose. Phone layouts place the portrait beneath the text. The original Oliveco logo remains intact.

Manrope supplies the English typography and wordmark. Noto Sans Myanmar is self-hosted for Burmese. Myanmar uses more generous line height and zero negative letter spacing to preserve stacked glyphs. Product branding remains identifiable in English alongside translated descriptions.

The latest skincare-app reference guides a quieter content treatment: logo and wordmark sit on one horizontal centre line, with no company subtitle. Category counts, repeated card captions, promotional helper lines and decorative slogans are removed. Product names, brands, formats, product details and enquiry instructions remain. Category and product surfaces use soft 16–18px corners and more deliberate spacing. Result counts are available to screen readers without adding visual clutter.

Product prices sit directly below their names with a 4px gap. The selection button sits inside the bottom-right corner of the product image, opposite the saved-product heart above. Confirmed amounts can be entered in `dist/prices.js`; pending prices display `MMK —` or `— ကျပ်`. The hero's secondary “Ask our guide” link is removed.

Navigation stays pinned while browsing, with 24px separation from the hero on desktop and 16px on phones. Anchor offsets account for the pinned bar. The skincare feature uses the latest supplied King Pharmacy composition with all three Glycerin/Vaseline packs standing upright. Phone framing preserves all three packs below the feature heading.

## Experience

Portrait hero → five collections → browsable product grid → skincare feature → company introduction → three-step selection/enquiry guide → direct seller contact. Product details explain uses and formats. A contextual assistant opens from either the floating launcher or a product detail.

No prices, ratings, shipping promises, testimonials, certifications or inventory claims are fabricated. The PDFs remain offline source materials. The assistant states that it is a product guide while the future AI provider remains unconfigured.

## Applied design checks

Frontend Design guided the reference-based composition and brand restraint. UI/UX Pro Max informed mobile touch targets and spacing. Emil’s design engineering guidance informed brief feedback and reduced-motion support. The design audit covered hierarchy, contrast, keyboard focus, labels, states, translation and phone reflow. The user’s references and later corrections take precedence over generic skill style recommendations.

| Before | After | Why |
| --- | --- | --- |
| Earlier hero portrait | Supplied portrait over white/pastel bokeh | Matches the user’s latest reference |
| PDF downloads in the visitor flow | Product selection and seller enquiry guide | Visitors explore products and contact the seller |
| English-only copy | Myanmar default, English switch | Matches the primary audience |
| Compact desktop selection buttons | Larger phone controls and bottom selection summary | Keeps enquiry access convenient while browsing |
| Narrow English heading wrapped over the portrait | Responsive display size and simplified narrow-screen actions | Keeps text clear of the face |

Focus rings, icon labels, native dialog focus handling, responsive images, local font assets, button feedback, loading/empty/error states and `prefers-reduced-motion` support are included. The product images are cropped source photographs rather than invented packaging.
