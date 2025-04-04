// app/lib/utils/priceUtils.js

const DEFAULT_PRICE = {
  shopify: 140.00,
  marketplace: 155.00
};

export const calculatePrice = (shapeValue, formState, platform = 'shopify') => {
  if (!shapeValue || !formState?.collection?.priceTier) {
    console.warn('Missing required data for price calculation');
    return DEFAULT_PRICE[platform];
  }

  const shape = formState.allShapes[shapeValue];
  if (!shape?.shapeType) {
    console.warn('Invalid shape data:', shapeValue);
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