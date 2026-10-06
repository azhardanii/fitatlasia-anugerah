# FIT ATLASIA — Deployment Checklist

## Before upload
- [ ] Upload the full `fitatlasia-site/` folder contents to the web root.
- [ ] Keep `assets/background.mp4` and the local image assets in `assets/`.
- [ ] Replace `CHANGE-ME@example.com` in `contact-handler.php`.
- [ ] Enable HTTPS on the production domain.

## Product page QA
- [ ] Open `product.html` and confirm there is **no browser scrollbar**.
- [ ] Scroll the mouse wheel/trackpad: each deliberate gesture should change one product.
- [ ] Swipe up/down on mobile: product should change without page movement.
- [ ] Click previous/next arrows.
- [ ] Click the bottom-right next product preview.
- [ ] Test `product.html?sku=IF9303` and at least 3 other SKUs.
- [ ] Confirm the URL changes with the active SKU without creating history spam.
- [ ] Move the pointer over the product to verify lightweight 3D tilt.
- [ ] Test keyboard ArrowLeft / ArrowRight / ArrowUp / ArrowDown / Space.
- [ ] Confirm the active product image and next-product image load.
- [ ] Confirm mobile layout stays inside the viewport.

## Image validation
Run:

```bash
node validate-product-images.js
```

The validator checks all 35 supplied product image URLs.

## Performance
- [ ] Run Lighthouse / PageSpeed on Home and Product.
- [ ] Keep the Product page WebP files optimized.
- [ ] Do not add Three.js to Product unless real GLB/GLTF models are introduced later.
- [ ] Prefer WebM/MP4 compression for the Home background video.
