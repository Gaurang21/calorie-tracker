// Open Food Facts product lookup. Free, no API key.

export async function lookupBarcode(barcode) {
  if (!barcode) throw new Error('Barcode required');
  const url = `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Lookup failed');
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;
  const p = data.product;
  const nutr = p.nutriments || {};
  const per100 = (k) => Number(nutr[k] ?? nutr[`${k}_100g`] ?? 0);
  return {
    barcode,
    name: p.product_name || p.generic_name || 'Unknown product',
    brand: p.brands || '',
    serving_size: p.serving_size || '100 g',
    calories: Math.round(per100('energy-kcal') || (per100('energy') ? per100('energy') / 4.184 : 0)),
    protein_g: +per100('proteins').toFixed(1),
    carbs_g: +per100('carbohydrates').toFixed(1),
    fat_g: +per100('fat').toFixed(1),
  };
}
