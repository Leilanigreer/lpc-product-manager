// app/lib/generators/variants/regular/createRegular.js

import { createBaseVariant } from './baseVariant';
import { createThreadData } from './threadData';

/**
 * Creates all regular (non-custom) variants for a product
 * @param {Object} formState - Current form state with variant data
 * @param {Object} formState.weights - Map of shape IDs to their weights
 * @param {Array<Object>} shapes - Array of all available shapes
 * @param {string} shapes[].value - Shape ID
 * @param {string} shapes[].label - Shape name
 * @param {string} shapes[].abbreviation - Shape abbreviation code
 * @param {Array<Object>} styles - Array of available styles
 * @param {string} styles[].value - Style ID
 * @param {string} styles[].label - Style name
 * @param {Array<Object>} productPrices - Array of price configurations
 * @param {string} collectionType - Type of collection (e.g., 'Quilted', 'Classic')
 * @param {Object} skuInfo - Information for SKU generation
 * @param {Array<string>} skuInfo.parts - Base parts of the SKU
 * @param {number|null} skuInfo.version - Version number for the SKU
 * @returns {Array<Object>} Array of generated regular variants
 * @example
 * const variants = createRegularVariants(
 *   { weights: { 'shape-1': '5.2' } },
 *   [{ value: 'shape-1', label: 'Driver', abbreviation: 'DR' }],
 *   [{ value: 'style-1', label: '50/50' }],
 *   [...priceConfigs],
 *   'Classic',
 *   { parts: ['Classic', 'BLK', 'WHT'], version: null }
 * );
 */
export const createRegularVariants = (
  formState,
  shapes,
  styles,
  productPrices,
  collection,
  skuInfo
) => {
  if (!formState?.weights || !Array.isArray(shapes) || !Array.isArray(productPrices)) {
    console.error('Invalid inputs to createRegularVariants:', {
      hasWeights: Boolean(formState?.weights),
      hasShapes: Array.isArray(shapes),
      hasPrices: Array.isArray(productPrices)
    });
    return [];
  }
  return Object.entries(formState.weights || {})
    .filter(([_, weight]) => weight !== "")
    .map(([shapeId, weight]) => {
      const shape = shapes.find(s => s.value === shapeId);
      if (!shape) return null;

      // Create base variant
      const baseVariant = createBaseVariant({
        shape,
        weight,
        formState,
        styles,
        shapes,
        productPrices,
        collection,
        skuInfo
      });

      if (!baseVariant) return null;

      // Add thread data
      const threadData = createThreadData(formState, shapeId);
      return {
        ...baseVariant,
        ...threadData
      };
    })
    .filter(item => item !== null);
};