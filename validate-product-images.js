// Run after deployment with: node validate-product-images.js
// Uses the exact product codes from products.js and checks the image endpoints.
const skus = [
'IF9303','AC810','ECP101','ECP201','ECP301','ECP604','ECP617','FE9719','FE9721','FE9724','IFP1206','IFP1301','IFP1604','IFP1605','IFP1613','IFP1707','PS300E','RE950','FE9701','FE9706','FE9708','IF9302','IF9315','IF9321','IF9332','IT9509','IT9510','IT9516','IT9517','IT9521','IT9522','IT9524','IT9530','IT9534','IT9539'
];
const base = 'https://fitatlasia.untukmu.site/wp-content/uploads/2026/10/';
const result = await Promise.all(skus.map(async sku => {
  const url = base + sku + '.webp';
  try {
    const r = await fetch(url, {method:'HEAD', redirect:'follow'});
    return {sku, ok:r.ok, status:r.status};
  } catch (e) {
    return {sku, ok:false, status:String(e)};
  }
}));
console.table(result);
const failed = result.filter(x => !x.ok);
if (failed.length) process.exitCode = 1;
