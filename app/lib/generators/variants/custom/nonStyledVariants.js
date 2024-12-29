// app/lib/generators/variants/custom/nonStyledVariants.js

import { formatSKU, isWoodType } from '../../../utils';
import { COLLECTION_TYPES } from '../../../constants';

/**
 * Creates custom variant for non-styled shapes (Quilted/Argyle collections)
 * @param {Object} params Configuration object
 * @param {Object} params.variant - Original variant object
 * @param {Object} params.shape - Shape object
 * @param {Object} params.baseCustomVariant - Base properties for custom variants
 * @param {string} params.customPrice - Price for custom variant
 * @param {number} params.weight - Weight in ounces
 * @param {Object} params.skuInfo - SKU generation information
 * @returns {Object|null} Custom non-styled variant or null if generation fails
 */
export const createNonStyledCustomVariant = ({
  variant,
  shape,
  baseCustomVariant,
  customPrice,
  weight,
  skuInfo
}) => {
  // Input validation
  if (!variant || !shape || !skuInfo?.parts) {
    console.error('Missing required parameters for non-styled variant creation');
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
      console.error('Failed to generate SKU for non-styled variant');
      return null;
    }

    // Create variant name
    const variantName = `Customize ${variant.variantName} +$15`;

    return {
      ...variant,
      ...baseCustomVariant,
      sku: customSKU.fullSKU,
      baseSKU: customSKU.baseSKU,
      variantName,
      price: customPrice,
      weight,
      isCustom: true,
    };

  } catch (error) {
    console.error('Error creating non-styled variant:', error);
    return null;
  }
};

/**
 * Checks if variant should use non-styled variant generation
 * @param {string} collectionType Type of collection
 * @param {boolean} needsStyle Whether collection needs style
 * @returns {boolean} True if should use non-styled generation
 */
export const shouldUseNonStyledVariant = (collectionType, needsStyle) => {
  return !needsStyle && [
    COLLECTION_TYPES.QUILTED,
    COLLECTION_TYPES.ARGYLE
  ].includes(collectionType);
};

/**
 * Processes wood variants for non-styled collections (creates single Fairway variant)
 * @param {Object} params Configuration object
 * @param {Object} params.variant - Original variant object
 * @param {Object} params.shape - Shape object
 * @param {Object} params.baseCustomVariant - Base custom variant properties
 * @param {string} params.customPrice - Price for custom variant
 * @param {number} params.weight - Weight in ounces
 * @param {Object} params.skuInfo - SKU generation information
 * @param {Array} params.shapes - Available shapes array
 * @returns {Object|null} Custom wood variant for non-styled collection
 */
export const createNonStyledWoodVariant = ({
  variant,
  shape,
  baseCustomVariant,
  customPrice,
  weight,
  skuInfo,
  shapes
}) => {
  if (!isWoodType(shape)) {
    return null;
  }

  const fairwayShape = shapes.find(s => s.abbreviation === 'Fairway');
  if (!fairwayShape) {
    console.error('Fairway shape not found for wood variant');
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
      console.error('Failed to generate SKU for non-styled wood variant');
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
    };

  } catch (error) {
    console.error('Error creating non-styled wood variant:', error);
    return null;
  }
};