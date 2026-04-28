// app/lib/utils/skuUtils.js

import _ from 'lodash';

/**
 * Extracts unique `{ baseSKU, collection }` rows from legacy Prisma `productSetDataLPC`-shaped
 * payloads. Create-product loads bases via the page loader (`attachVersioningSkusToShopifyCollections`
 * / `fetchCollectionBaseSkusForVersioning`); this helper remains for any code still using Postgres product sets.
 *
 * @param {Array<Object>} productSets - Mapped product sets (each has `collections[]` with value, shopifyAdminGid, …)
 * @returns {Array<Object>} Unique rows: { baseSKU, collection }
 */
export const extractExistingProducts = (productSets) => {
  if (!productSets?.length) {
    return [];
  }

  const products = productSets
    .filter((set) => set.baseSKU && set.collections?.[0])
    .map((set) => ({
      baseSKU: set.baseSKU,
      collection: set.collections[0],
    }))
    .filter(product => product.baseSKU && product.collection); // Double-check we have both fields

  return _.uniqBy(products, 'baseSKU');
};

/**
 * Filters existing SKU rows by selected collection.
 * Matches `shopifyAdminGid` to a Shopify Collection GID, or falls back to legacy Prisma `value`.
 * @param {Array<Object>} existingProducts - From extractExistingProducts
 * @param {string} collectionValue - Form collection `value` (GID or Prisma id)
 * @returns {Array<Object>} Filtered products
 */
export const filterProductsByCollection = (existingProducts, collectionValue) => {
  return existingProducts.filter((product) => {
    const c = product.collection;
    if (!c) return false;
    if (c.shopifyAdminGid && collectionValue && c.shopifyAdminGid === collectionValue) {
      return true;
    }
    return c.value === collectionValue;
  });
};

/**
 * Formats SKU based on base parts, version, and shape data
 * @param {Array<string>} baseParts - Array of SKU parts
 * @param {number} version - Version number
 * @param {string} shapeValue - ID of the shape from allShapes
 * @param {Object} formState - Current form state containing allShapes
 * @param {Object} options - Additional options for SKU formatting
 * @param {boolean} options.isCustom - Whether this is a custom variant
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
      
      const styleAbbrev = shapeData.style?.abbreviation;
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