// app/lib/generators/variants/custom/styledVariants.js

import { formatSKU, isWoodType } from '../../../utils';
import { createWoodCustomVariant } from './woodVariants';

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
  skuInfo,
  shapes,
  collection
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

export const shouldUseStyledVariant = (collection) => {
  return collection.needsStyle;
};

/**
 * Generates key for tracking processed styles
 * @param {Object} variant Current variant
 * @returns {string} Style tracking key
 */
export const getStyleTrackingKey = (variant) => {
  return `${variant.style?.label}-${variant.shape?.abbreviation}`;
};

/**
 * Process a styled variant, handling both wood and non-wood cases
 * @param {Object} params Configuration object
 * @returns {Object|null} Processed styled variant
 */
export const processStyledVariant = ({
  variant,
  shape,
  baseCustomVariant,
  customPrice,
  weight,
  skuInfo,
  shapes,
  collection,
  processedStyles
}) => {
  if (!shape) return null;

  // Check if this style has been processed (for wood variants)
  const styleKey = getStyleTrackingKey(variant);
  if (processedStyles.has(styleKey)) return null;

  // Handle wood variants using centralized logic
  if (isWoodType(shape)) {
    const woodVariant = createWoodCustomVariant({
      variant,
      baseCustomVariant,
      customPrice,
      weight,
      skuInfo,
      shapes,
      collection
    });

    if (woodVariant) {
      processedStyles.add(styleKey);
    }

    return woodVariant;
  }

  // Handle non-wood variants
  return createStyledCustomVariant({
    variant,
    shape,
    baseCustomVariant,
    customPrice,
    weight,
    skuInfo,
    shapes,
    collection
  });
};