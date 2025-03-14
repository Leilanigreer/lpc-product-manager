// app/lib/utils/skuUtils.js

import _ from 'lodash';

/**
 * Extracts unique products with SKUs from ProductSetDataLPC
 */
export const extractExistingProducts = (productSets) => {
  console.log('ProductSets structure:', productSets?.[0]);

  if (!productSets?.length) {
    return [];
  }

  const products = productSets
    .map(set => ({
      baseSKU: set.baseSKU,
      collection: set.collection // Keep full collection reference
    }))
    .filter(product => product.baseSKU);

  return _.uniqBy(products, 'baseSKU');
};

/**
 * Filters products by collection ID
 * @param {Array} existingProducts - Products with SKUs
 * @param {string} collectionValue - Collection ID to filter by 
 * @returns {Array} Filtered products
 */
export const filterProductsByCollection = (existingProducts, collectionValue) => {
  return existingProducts.filter(product => product.collection?.value === collectionValue);
};

/**
 * Formats SKU based on base parts, version, and shape data
 * @param {Array} baseParts - Array of SKU parts
 * @param {number} version - Version number
 * @param {string} shapeValue - ID of the shape from allShapes
 * @param {Object} formState - Current form state containing allShapes
 * @param {Object} options - Additional options for SKU formatting
 * @returns {Object} Object containing baseSKU and fullSKU
 */
export const formatSKU = (baseParts, version, shapeValue, formState, options = {}) => {
  // Validate inputs
  if (!Array.isArray(baseParts) || !shapeValue || !formState?.allShapes) {
    console.error('formatSKU: Invalid inputs', { baseParts, shapeValue, hasFormState: !!formState });
    return {
      baseSKU: '',
      fullSKU: '',
      parts: []
    };
  }

  // Get shape data from allShapes
  const shapeData = formState.allShapes[shapeValue];
  if (!shapeData?.isSelected) {
    console.error('formatSKU: Shape not found or not selected:', shapeValue);
    return {
      baseSKU: '',
      fullSKU: '',
      parts: []
    };
  }

  // Generate base SKU
  const filteredParts = baseParts.filter(Boolean);
  const baseSKU = filteredParts.join('-');
  const versionedBaseSKU = version ? `${baseSKU}-V${version}` : baseSKU;
  
  
  // Handle custom variants and styles
  let fullSKU = versionedBaseSKU;
  
  if (shapeData.abbreviation) {
    if (options.isCustom) {
      const shapeAbbrev = shapeData.shapeType === 'WOOD' ? 'Fairway' : shapeData.abbreviation;
      const styleAbbrev = shapeData.style?.abbreviation || formState.globalStyle?.abbreviation
      if (styleAbbrev) {
        // Handle style-specific custom SKUs
        if (shapeData.needsColorDesignation && shapeData.colorDesignation?.abbreviation) {
          // With color designation (e.g., QClassic)
          fullSKU = `${versionedBaseSKU}-${shapeAbbrev}-${shapeData.colorDesignation.abbreviation}-${styleAbbrev}-Custom`;
        } else {
          // Regular style custom
          fullSKU = `${versionedBaseSKU}-${shapeAbbrev}-${styleAbbrev}-Custom`;
        }
      } else {
        // Regular custom
        fullSKU = `${versionedBaseSKU}-${shapeAbbrev}-Custom`;
      }
    } else {
      // Regular variant
      fullSKU = `${versionedBaseSKU}-${shapeData.abbreviation}`;
    }
  }

  return {
    baseSKU: versionedBaseSKU,
    fullSKU,
    parts: filteredParts
  };
};