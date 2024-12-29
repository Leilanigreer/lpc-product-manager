// app/lib/generators/variants/custom/styledVariants.js

import { formatSKU, isWoodType } from '../../../utils';
import { COLLECTION_TYPES } from '../../../constants';

/**
 * Creates custom variant for styled shapes (Classic/Animal collections)
 * @param {Object} params Configuration object
 * @param {Object} params.variant - Original variant object
 * @param {Object} params.shape - Shape object
 * @param {Object} params.baseCustomVariant - Base properties for custom variants
 * @param {string} params.customPrice - Price for custom variant
 * @param {number} params.weight - Weight in ounces
 * @param {Object} params.skuInfo - SKU generation information
 * @returns {Object|null} Custom styled variant or null if generation fails
 */
export const createStyledCustomVariant = ({
  variant,
  shape,
  baseCustomVariant,
  customPrice,
  weight,
  skuInfo
}) => {
  // Input validation
  if (!variant?.style?.label || !shape || !skuInfo?.parts) {
    console.error('Missing required parameters for styled variant creation');
    return null;
  }

  try {
    // Generate custom SKU
    const customSKU = formatSKU(
      skuInfo.parts,
      skuInfo.version,
      shape,
      { 
        isCustom: true,
        style: variant.style
      }
    );

    if (!customSKU?.fullSKU) {
      console.error('Failed to generate SKU for styled variant');
      return null;
    }

    // Create variant name with style
    const variantName = `Customize ${shape.label} - ${variant.style.label} +$15`;

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
    console.error('Error creating styled variant:', error);
    return null;
  }
};

/**
 * Creates wood variant for styled collections
 * @param {Object} params Configuration object
 * @param {Object} params.variant - Original variant object
 * @param {Object} params.baseCustomVariant - Base custom variant properties
 * @param {string} params.customPrice - Price for custom variant
 * @param {number} params.weight - Weight in ounces
 * @param {Object} params.skuInfo - SKU generation information
 * @param {Array} params.shapes - Available shapes array
 * @returns {Object|null} Custom wood variant for styled collection
 */
export const createStyledWoodVariant = ({
  variant,
  baseCustomVariant,
  customPrice,
  weight,
  skuInfo,
  shapes
}) => {
  const fairwayShape = shapes.find(s => s.abbreviation === 'Fairway');
  if (!fairwayShape || !variant?.style?.label) {
    console.error('Missing fairway shape or style for wood variant');
    return null;
  }

  try {
    const customSKU = formatSKU(
      skuInfo.parts,
      skuInfo.version,
      fairwayShape,
      { 
        isCustom: true,
        style: variant.style
      }
    );

    if (!customSKU?.fullSKU) {
      console.error('Failed to generate SKU for styled wood variant');
      return null;
    }

    return {
      ...variant,
      ...baseCustomVariant,
      shapeId: fairwayShape.value,
      sku: customSKU.fullSKU,
      baseSKU: customSKU.baseSKU,
      variantName: `Customize ${variant.style.label} Fairway +$15`,
      price: customPrice,
      weight,
      isCustom: true,
      options: { Style: `Customize ${variant.style.label} Fairway` }
    };

  } catch (error) {
    console.error('Error creating styled wood variant:', error);
    return null;
  }
};

/**
 * Checks if variant should use styled variant generation
 * @param {string} collectionType Type of collection
 * @param {boolean} needsStyle Whether collection needs style
 * @returns {boolean} True if should use styled generation
 */
export const shouldUseStyledVariant = (collectionType, needsStyle) => {
  return needsStyle && [
    COLLECTION_TYPES.CLASSIC,
    COLLECTION_TYPES.ANIMAL
  ].includes(collectionType);
};

/**
 * Generates key for tracking processed styles
 * @param {Object} variant Current variant
 * @returns {string} Style tracking key
 */
export const getStyleTrackingKey = (variant) => {
  return `${variant.style?.label}-${variant.shape?.abbreviation}`;
};