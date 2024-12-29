// app/lib/generators/variants/custom/woodVariants.js

import { formatSKU } from '../../../utils';

/**
 * Creates custom variants for wood types
 * @param {Object} variant - Base variant object
 * @param {Object} shape - Shape object for the variant
 * @param {Object} baseCustomVariant - Base custom variant properties
 * @param {string} customPrice - Price for custom variant
 * @param {number} weight - Weight in ounces
 * @param {Object} skuInfo - SKU generation information
 * @param {Array} shapes - Available shapes array
 * @returns {Object|null} Custom wood variant or null if fairway shape not found
 */
export const createWoodCustomVariants = ({
  variant,
  shape,
  baseCustomVariant,
  customPrice,
  weight,
  skuInfo,
  shapes
}) => {
  // Input validation
  if (!variant || !shape || !skuInfo?.parts || !shapes?.length) {
    console.error('Missing required parameters for wood variant creation');
    return null;
  }

  // Find Fairway shape
  const fairwayShape = shapes.find(s => s.abbreviation === 'Fairway');
  if (!fairwayShape) {
    console.error('Fairway shape not found');
    return null;
  }

  try {
    const customSKU = formatSKU(
      skuInfo.parts, 
      skuInfo.version, 
      fairwayShape, 
      { isCustom: true }
    );

    if (!customSKU?.fullSKU) {
      console.error('Failed to generate SKU for wood variant');
      return null;
    }

    return {
      ...variant,
      ...baseCustomVariant,
      shapeId: fairwayShape.value,
      sku: customSKU.fullSKU,
      baseSKU: customSKU.baseSKU,
      variantName: 'Customize Fairway +$15',
      price: customPrice,
      weight,
      isCustom: true,
      options: { Style: 'Customize Fairway' }
    };
  } catch (error) {
    console.error('Error creating wood variant:', error);
    return null;
  }
};