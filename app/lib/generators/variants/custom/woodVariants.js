// app/lib/generators/variants/custom/woodVariants.js

import { formatSKU } from '../../../utils';
import { COLLECTION_TYPES } from '../../../constants';

/**
 * Generates the variant name for a wood custom variant based on collection type and style
 * @param {Object} params Configuration parameters
 * @returns {string} Formatted variant name
 */
const getWoodVariantName = ({
  collectionType,
  variant,
  leatherColorForName,
  stylePhrase
}) => {
  if (collectionType === COLLECTION_TYPES.QCLASSIC && 
    (!leatherColorForName?.label || !stylePhrase)) {
  console.warn('Missing required fields for QClassic wood variant name');
  return 'Customize Fairway +$15'; // Fallback
}
  if (collectionType === COLLECTION_TYPES.QCLASSIC) {
    return `Customize ${leatherColorForName.label} ${stylePhrase} ${variant.style?.label} Fairway +$15`;
  } else if ([COLLECTION_TYPES.CLASSIC, COLLECTION_TYPES.ANIMAL].includes(collectionType)) {
    return `Customize Fairway - ${variant.style?.label} +$15`;
  }
  return 'Customize Fairway +$15';
};

/**
 * Generates SKU options based on collection type and variant data
 * @param {Object} params Configuration parameters
 * @returns {Object} SKU options
 */
const getSKUOptions = ({
  collectionType,
  variant,
  leatherAbbreviation
}) => {
  const baseOptions = { isCustom: true };

  if (collectionType === COLLECTION_TYPES.QCLASSIC) {
    return {
      ...baseOptions,
      style: variant.style,
      qClassicLeatherAbbreviation: leatherAbbreviation
    };
  } else if ([COLLECTION_TYPES.CLASSIC, COLLECTION_TYPES.ANIMAL].includes(collectionType)) {
    return {
      ...baseOptions,
      style: variant.style
    };
  }
  
  return baseOptions;
};

/**
 * Creates custom variants for wood types
 * @param {Object} params Configuration object
 * @returns {Object|null} Custom wood variant or null if generation fails
 */
export const createWoodCustomVariant = ({
  variant,
  baseCustomVariant,
  customPrice,
  weight,
  skuInfo,
  shapes,
  collectionType = 'Unknown',
  leatherData = {}  // Optional: Used for QClassic variants
}) => {
  if (collectionType === COLLECTION_TYPES.QCLASSIC && 
    (!leatherData?.leatherAbbreviation || !leatherData?.leatherColorForName)) {
  console.error('Missing required leather data for QClassic variant');
  return null;
}
  // Input validation
  if (!variant || !skuInfo?.parts || !shapes?.length) {
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
    // Get SKU options based on collection type
    const skuOptions = getSKUOptions({
      collectionType,
      variant,
      leatherAbbreviation: leatherData.leatherAbbreviation
    });

    // Generate custom SKU
    const customSKU = formatSKU(
      skuInfo.parts, 
      skuInfo.version, 
      fairwayShape, 
      skuOptions
    );

    if (!customSKU?.fullSKU) {
      console.error('Failed to generate SKU for wood variant');
      return null;
    }

    // Generate variant name
    const variantName = getWoodVariantName({
      collectionType,
      variant,
      leatherColorForName: leatherData.leatherColorForName,
      stylePhrase: leatherData.stylePhrase
    });

    return {
      ...variant,
      ...baseCustomVariant,
      shapeId: fairwayShape.value,
      sku: customSKU.fullSKU,
      baseSKU: customSKU.baseSKU,
      variantName,
      price: customPrice,
      weight,
      isCustom: true,
    };

  } catch (error) {
    console.error('Error creating wood variant:', error);
    return null;
  }
};

/**
 * Helper to determine if a variant has been processed (for tracking styles)
 * @param {Array} processedVariants Array of processed variants
 * @param {string} variantName Variant name to check
 * @returns {boolean} True if variant has been processed
 */
export const isWoodVariantProcessed = (processedVariants, variantName) => {
  return processedVariants.some(v => v.variantName === variantName);
};