const cache = new Map();

/**
 * Corroborates product identity via Open Food Facts / Beauty Facts
 * Attribution: Contains information from Open Food Facts contributors (ODbL)
 */
export async function lookupBarcodeIdentity(barcode, category = 'food') {
  if (!barcode || !/^\d{8,14}$/.test(barcode)) return null;

  if (cache.has(barcode)) {
    return cache.get(barcode);
  }

  let domain = 'world.openfoodfacts.org';
  let provider = 'Open Food Facts';

  if (category === 'cosmetic') {
    domain = 'world.openbeautyfacts.org';
    provider = 'Open Beauty Facts';
  } else if (category === 'medicine') {
    // Crowd-sourced facts do not corroborate medicines
    return null;
  } else if (category === 'other') {
    domain = 'world.openproductsfacts.org';
    provider = 'Open Products Facts';
  }

  const url = `https://${domain}/api/v2/product/${barcode}.json?fields=code,product_name,brands,quantity`;
  const userAgent = process.env.OFF_USER_AGENT || 'ExpiryWatchAI/1.0 (assistive barcode identity tool; contact: support@example.com)';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      cache.set(barcode, null);
      return null;
    }

    const data = await res.json();
    if (data.status === 1 && data.product) {
      const result = {
        provider,
        found: true,
        name: data.product.product_name || '',
        brand: data.product.brands || '',
        quantity: data.product.quantity || '',
        url: `https://${domain}/product/${barcode}`,
        attribution: `Contains information from ${provider} contributors (ODbL). Identity corroboration only.`,
        note: 'community data, identity only',
      };
      cache.set(barcode, result);
      return result;
    }
  } catch (err) {
    // Ignore network timeouts/aborts in offline or restricted environments
  }

  cache.set(barcode, null);
  return null;
}

