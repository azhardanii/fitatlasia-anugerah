# FIT ATLASIA — Production Website Package

Multi-page immersive website for PT Fit Atlasia Anugerah.

## Pages
- `index.html` — Home
- `about.html` — About
- `product.html` — immersive product showcase + 35 product codes
- `contact.html` — project consultation form
- `404.html` — fallback page

## Stack
- Semantic HTML5 + CSS3
- Vanilla JavaScript
- GSAP + ScrollTrigger for motion
- Three.js only on Home's 3D section
- CSS 3D transform + GSAP for the Product single-viewport experience (no product grid, no modal, no browser page scroll)
- IntersectionObserver for the Home 3D scene pause/resume
- Wheel/touch gestures are intercepted on Product so the viewport never scrolls; each gesture changes the active product.
- Lazy loading + decoding async for catalog images
- `content-visibility:auto` on product cards to reduce rendering cost on long catalog pages
- `prefers-reduced-motion` support

## Product image source
All product images use the requested WordPress upload path:
`//fitatlasia.untukmu.site/wp-content/uploads/2026/10/[SKU].webp`

The protocol is intentionally protocol-relative. On an HTTPS production site the browser will request HTTPS automatically, avoiding mixed-content blocking; on HTTP it will use HTTP.

35 product codes are included exactly as supplied:
IF9303, AC810, ECP101, ECP201, ECP301, ECP604, ECP617, FE9719, FE9721, FE9724, IFP1206, IFP1301, IFP1604, IFP1605, IFP1613, IFP1707, PS300E, RE950, FE9701, FE9706, FE9708, IF9302, IF9315, IF9321, IF9332, IT9509, IT9510, IT9516, IT9517, IT9521, IT9522, IT9524, IT9530, IT9534, IT9539.

No technical specifications or product names are fabricated because the supplied company profile does not contain a SKU catalog.

## Reference interaction implemented
The Product page follows the supplied reference interaction: one fixed fullscreen stage, no visible browser scrollbar, no long catalog below, central product image, left editorial copy, right-side product meta, previous/next controls, and a next-product preview. Mouse movement creates a lightweight CSS 3D tilt; wheel/touch gestures trigger the product transition. There is no immersive modal button because the page itself is the immersive view.

Reference page inspected: `https://maroon-tapir-346920.hostingersite.com/fashion-puffer-jacket/`.

## Deploy to Hostinger
1. Upload everything inside this folder to `public_html/` (or your chosen web root).
2. Keep the relative folder structure intact.
3. Confirm `assets/background.mp4` and local image assets exist.
4. Confirm each product image URL is reachable from the live site.
5. Before launch, open `contact-handler.php` and replace `CHANGE-ME@example.com` with the real receiving email.
6. Prefer enabling HTTPS for the public domain.
7. If using Hostinger email/SMTP rather than PHP `mail()`, replace `contact-handler.php` with the SMTP provider implementation.

## Product links
A specific product can be linked directly with:
`product.html?sku=IF9303`

The page updates the viewer and preserves the selected SKU in the URL.

## Production optimization notes
- Keep product WebP assets optimized at sensible dimensions. Product cards reserve layout space with fixed aspect ratios to reduce cumulative layout shift.
- Do not load Three.js on Product/About/Contact; it is intentionally limited to Home.
- For a future GLB/GLTF 3D product viewer, lazy-load the model only after the user opens the immersive modal, not on initial page load.
- For the best Core Web Vitals, self-host fonts later and replace `background.mp4` with final compressed WebM/MP4 footage when available.
- If the image host requires CORS, direct `<img>` rendering should still work; WebGL texture usage would need explicit CORS headers.
