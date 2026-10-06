(() => {
  const SKUS = [
    'IF9303','AC810','ECP101','ECP201','ECP301','ECP604','ECP617',
    'FE9719','FE9721','FE9724','IFP1206','IFP1301','IFP1604','IFP1605','IFP1613','IFP1707',
    'PS300E','RE950','FE9701','FE9706','FE9708','IF9302','IF9315','IF9321','IF9332',
    'IT9509','IT9510','IT9516','IT9517','IT9521','IT9522','IT9524','IT9530','IT9534','IT9539'
  ];

  const SERIES = sku => (sku.match(/^[A-Z]+/) || ['SERIES'])[0];

  window.FIT_ATLASIA_PRODUCTS = SKUS.map((sku, index) => ({
    sku,
    series: SERIES(sku),
    index
  }));
})();
