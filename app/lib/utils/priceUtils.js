// app/lib/utils/priceUtils.js

const DEFAULT_PRICE = {
  shopify: 140.00,
  marketplace: 155.00
};

export const calculatePrice = (shapeValue, formState, platform = 'shopify') => {
  if (!shapeValue || !formState?.collection?.priceTier) {
    return DEFAULT_PRICE[platform];
  }

  const shape = formState.allShapes[shapeValue];
  if (!shape?.shapeType) {
    return DEFAULT_PRICE[platform];
  }

  const { priceTier } = formState.collection;
  const basePrice = platform === 'shopify' ? 
    priceTier.shopifyPrice : 
    priceTier.marketplacePrice;

  const adjustment = priceTier.adjustments.find(
    adj => adj.shapeType === shape.shapeType
  );

  if (!adjustment) return parseFloat(basePrice);

  const adjustmentAmount = platform === 'shopify' ? 
    adjustment.shopifyAdjustment : 
    adjustment.marketAdjustment;

  if (adjustment.isBasePrice) {
    return Math.max(
      parseFloat(adjustmentAmount),
      parseFloat(basePrice)
    )
  }

  return parseFloat(basePrice) + parseFloat(adjustmentAmount);
};

/**
 * True when Shopify `price` and `compareAtPrice` are the same number (no sale / manual compare-at drift).
 * Matches `productUpdateShopify.server.js` update rules.
 */
export function priceValuesMatch(price, compareAtPrice) {
  const a = Number.parseFloat(String(price ?? "").trim());
  const b = Number.parseFloat(String(compareAtPrice ?? "").trim());
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return a === b;
}

/** True when two price strings/numbers represent the same amount (e.g. 130 vs 130.00). */
export function pricesSemanticallyMatch(priceA, priceB) {
  const a = Number.parseFloat(String(priceA ?? "").trim());
  const b = Number.parseFloat(String(priceB ?? "").trim());
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    return String(priceA ?? "").trim() === String(priceB ?? "").trim();
  }
  return a === b;
}

/** Display price for update preview diffs. */
export function formatPreviewPrice(value) {
  const n = Number.parseFloat(String(value ?? "").trim());
  if (!Number.isFinite(n)) return "—";
  return `$${n.toFixed(2)}`;
}

/** At least one variant has price ≠ compare-at (sale or inconsistent pricing). */
export function productHasVariantPriceMismatch(variants) {
  if (!Array.isArray(variants)) return false;
  return variants.some((v) => !priceValuesMatch(v?.price, v?.compareAtPrice));
}