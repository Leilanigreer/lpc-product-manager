// app/lib/generators/variants/custom/putterVariants.js

import { formatSKU } from '../../../utils';

/**
 * Creates custom variant for putter type shapes (Mallet or Blade)
 * @param {Object} params Configuration object
 * @param {Object} params.variant - Original variant object
 * @param {Object} params.shape - Shape object containing abbreviation
 * @param {Object} params.baseCustomVariant - Base properties for custom variants
 * @param {string} params.customPrice - Price for custom variant
 * @param {number} params.weight - Weight in ounces
 * @param {Object} params.skuInfo - SKU generation information
 * @returns {Object|null} Custom putter variant or null if generation fails
 */
export const createPutterCustomVariant = ({
  variant,
  shape,
  baseCustomVariant,
  customPrice,
  weight,
  skuInfo
}) => {
  // Input validation
  if (!variant || !shape || !skuInfo?.parts) {
    console.error('Missing required parameters for putter variant creation');
    return null;
  }

  try {
    // Generate custom SKU
    const customSKU = formatSKU(
      skuInfo.parts,
      skuInfo.version,
      shape,
      { isCustom: true }
    );

    if (!customSKU?.fullSKU) {
      console.error('Failed to generate SKU for putter variant');
      return null;
    }

    // Create variant name
    const variantName = `Customize ${shape.label} +$15`;

    return {
      ...variant,
      ...baseCustomVariant,
      shapeId: shape.value,
      sku: customSKU.fullSKU,
      baseSKU: customSKU.baseSKU,
      variantName,
      price: customPrice,
      weight,
      isCustom: true,
    };

  } catch (error) {
    console.error('Error creating putter variant:', error);
    return null;
  }
};

/**
 * Checks if a variant should use putter variant generation
 * @param {Object} shape Shape object to check
 * @param {boolean} shouldHaveStyle Whether the variant should have style
 * @returns {boolean} True if should use putter generation
 */
export const shouldUsePutterVariant = (shape, shouldHaveStyle) => {
  return !shouldHaveStyle && (
    shape.abbreviation === 'Mallet' || 
    shape.abbreviation === 'Blade'
  );
};