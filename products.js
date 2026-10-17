/**
 * FIT ATLASIA — Headless WordPress Product Fetcher
 * Selalu fetch langsung dari WordPress REST API (no sessionStorage cache)
 * supaya data selalu sinkron 100% dengan wp-admin.
 * Fallback ke data statis jika API tidak bisa diakses.
 */
(() => {
  const WP_API = 'https://fitatlasia.untukmu.site/wp-json/wp/v2/products';
  const PARAMS = new URLSearchParams({
    per_page : '100',
    _embed   : '1',
    _fields  : 'id,title,acf,menu_order,_links,_embedded',
    orderby  : 'menu_order',
    order    : 'asc',
    status   : 'publish',
  });

  // Fallback statis jika API down
  const FALLBACK_SKUS = [
    'IF9303','AC810','ECP101','ECP201','ECP301','ECP604','ECP617',
    'FE9719','FE9721','FE9724','IFP1206','IFP1301','IFP1604','IFP1605',
    'IFP1613','IFP1707','PS300E','RE950','FE9701','FE9706','FE9708',
    'IF9302','IF9315','IF9321','IF9332','IT9509','IT9510','IT9516',
    'IT9517','IT9521','IT9522','IT9524','IT9530','IT9534','IT9539',
  ];
  const parseSeries = sku => (sku.match(/^[A-Z]+/) || ['SERIES'])[0];
  const makeFallback = () => FALLBACK_SKUS.map((sku, i) => ({
    sku, series: parseSeries(sku), description: '', image: null, order: i,
  }));

  // Normalize WP REST API response → shape yang dipakai product.js
  function normalize(items) {
    return items
      .map((item, idx) => {
        const acf = item.acf || {};
        const sku = (acf.product_sku || '').trim();
        if (!sku) return null;

        let image = null;
        try {
          const media = item._embedded?.['wp:featuredmedia']?.[0];
          image = media?.source_url
            ?? media?.media_details?.sizes?.full?.source_url
            ?? null;
        } catch { /* no image — ignore */ }

        return {
          sku,
          series      : (acf.product_series || parseSeries(sku)).trim().toUpperCase(),
          description : (acf.product_short_desc || '').trim(),
          image,
          order       : typeof acf.product_order === 'number'
            ? acf.product_order
            : (item.menu_order ?? idx),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.order - b.order);
  }

  async function fetchProducts() {
    const res = await fetch(`${WP_API}?${PARAMS}`, {
      cache   : 'no-store',                   // bypass CDN/proxy cache
      headers : { Accept: 'application/json' },
      signal  : AbortSignal.timeout(10000),   // 10s timeout
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();
    return normalize(raw);
  }

  async function init() {
    // Bersihkan sessionStorage lama yang mungkin berisi data draft
    try {
      for (const key of Object.keys(sessionStorage)) {
        if (key.startsWith('fit_products_')) sessionStorage.removeItem(key);
      }
    } catch { /* private browsing — ignore */ }

    try {
      const data = await fetchProducts();
      window.FIT_ATLASIA_PRODUCTS = data.length ? data : makeFallback();
    } catch (err) {
      console.warn('[FIT ATLASIA] API tidak tersedia, pakai fallback data.', err?.message);
      window.FIT_ATLASIA_PRODUCTS = makeFallback();
    }

    window.dispatchEvent(new CustomEvent('fitatlasia:ready', {
      detail: window.FIT_ATLASIA_PRODUCTS,
    }));
  }

  init();
})();
