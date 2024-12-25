// app/lib/utils/priceUtils.js

import { isWoodType } from './shapeUtils';

/**
 * Get the variant price based on shape and collection
 * @param {string} shapeId - The ID of the shape
 * @param {string} collectionId - The ID of the collection
 * @param {Array} productPrices - Array of product price configurations
 * @param {Array} shapes - Array of available shapes
 * @returns {string} Price formatted to 2 decimal places
 */
export const getVariantPrice = (shapeId, collectionId, productPrices, shapes) => {
  const DEFAULT_PRICE = "140.00";
  
  // Input validation
  if (!shapeId || !collectionId || !Array.isArray(productPrices) || !Array.isArray(shapes)) {
    console.warn('getVariantPrice: Invalid or missing parameters');
    return DEFAULT_PRICE;
  }

  const shape = shapes.find(s => s.value === shapeId);
  
  if (!shape) {
    console.warn(`getVariantPrice: Shape not found for ID: ${shapeId}`);
    return DEFAULT_PRICE;
  }

  let lookupShapeId = shapeId;
  
  // If it's a wood type, use the Fairway shape ID for pricing
  if (isWoodType(shape)) {
    const fairwayShape = shapes.find(s => s.abbreviation === 'Fairway');
    if (fairwayShape) {
      lookupShapeId = fairwayShape.value;
    } else {
      console.warn('getVariantPrice: Fairway shape not found for wood type');
      return DEFAULT_PRICE;
    }
  }

  const priceData = productPrices.find(
    price => price.shapeId === lookupShapeId && price.shopifyCollectionId === collectionId
  );

  if (!priceData) {
    console.warn(`getVariantPrice: No price data found for shape ${lookupShapeId} and collection ${collectionId}`);
    return DEFAULT_PRICE;
  }

  return priceData.shopifyPrice.toFixed(2);
};



// Used in generateVariants 
// const basePrice = getVariantPrice(