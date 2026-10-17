/**
 * FIT ATLASIA — Headless WordPress Product Fetcher
 * Fetches live product data from WordPress REST API.
 * Falls back to static list if API is unavailable.
 */
(() => {
  const WP_API = 'https://fitatlasia.untukmu.site/wp-json/wp/v2/products';
  const PARAMS = new URLSearchParams({
    per_page : '100',
    _embed   : '1',
    _fields  : 'id,title,acf,menu_order,_links,_embedded',
    orderby  : 'menu_order',
    order    : 'asc',
  });

  const CACHE_KEY = 'fit_products_v3';
  const CACHE_TTL = 5 * 60 * 1000; // 5 menit

  // Fallback static list — dipakai jika API tidak bisa diakses
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

  // Session cache
  function getCached() {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const { data, ts } = JSON.parse(raw);
      return (Date.now() - ts < CACHE_TTL) ? data : null;
    } catch { return null; }
  }
  function setCache(data) {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); }
    catch { /* storage full — ignore */ }
  }

  // Normalize WP API response → product shape yang dipakai product.js
  function normalize(items) {
    return items
      .map((item, idx) => {
        const acf = item.acf || {};
        const sku = (acf.product_sku || '').trim();
        if (!sku) return null;

        // Ambil URL featured image dari _embedded
        let image = null;
        try {
          const media = item._embedded?.['wp:featuredmedia']?.[0];
          image = media?.source_url
            ?? media?.media_details?.sizes?.full?.source_url
            ?? null;
        } catch { /* no image */ }

        return {
          sku,
          series     : (acf.product_series || parseSeries(sku)).trim().toUpperCase(),
          description: (acf.product_short_desc || '').trim(),
          image,
          order      : typeof acf.product_order === 'number'
            ? acf.product_order
            : (item.menu_order ?? idx),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.order - b.order);
  }

  async function fetchAndCache() {
    const res = await fetch(`${WP_API}?${PARAMS}`, {
      headers: { Accept: 'application/json' },
      signal : AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw  = await res.json();
    const data = normalize(raw);
    if (data.length) setCache(data);
    return data.length ? data : makeFallback();
  }

  async function init() {
    // Sajikan dari cache dulu supaya halaman langsung tampil
    const cached = getCached();
    if (cached) {
      window.FIT_ATLASIA_PRODUCTS = cached;
      window.dispatchEvent(new CustomEvent('fitatlasia:ready', { detail: cached }));
      // Refresh di background tanpa blokir UI
      fetchAndCache().catch(() => {});
      return;
    }

    // Fetch fresh dari WordPress
    try {
      const data = await fetchAndCache();
      window.FIT_ATLASIA_PRODUCTS = data;
    } catch (err) {
      console.warn('[FIT ATLASIA] API tidak tersedia, pakai fallback.', err?.message);
      window.FIT_ATLASIA_PRODUCTS = makeFallback();
    }

    window.dispatchEvent(new CustomEvent('fitatlasia:ready', {
      detail: window.FIT_ATLASIA_PRODUCTS,
    }));
  }

  init();
})();
