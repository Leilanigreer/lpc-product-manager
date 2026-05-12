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
 * Formats SKU based on base parts, version, and shape data.
 *
 * Suffix layout (regular and custom share the same shape):
 *   `{versionedBaseSKU}-{shape}[-{colorDesignation}][-{style}][-Custom]`
 *
 * Notes:
 * - `colorDesignation` is only included when `needsColorDesignation` is true and a value is set.
 * - `style` is only included when the shape has a `style.abbreviation` AND the style's
 *   `includeAbbreviationInSku` flag is not explicitly false. Set the style metaobject's
 *   `include_abbreviation_in_sku` field to false to suppress the segment for a specific style
 *   (e.g. the lone "Quilted" style on the Quilted collection) while keeping its abbreviation
 *   populated for uniqueness/standardization.
 * - The wood→`Fairway` substitution remains custom-only; regular wood variants keep their
 *   specific shape label (`3W`, `5W`, etc.) so individual wood variants stay distinguishable.
 *
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

  let fullSKU = versionedBaseSKU;

  if (shapeData.abbreviation) {
    const shapeAbbrev =
      options.isCustom && shapeData.shapeType === 'WOOD'
        ? 'Fairway'
        : shapeData.abbreviation;

    const colorDesignationAbbrev =
      shapeData.needsColorDesignation && shapeData.colorDesignation?.abbreviation
        ? shapeData.colorDesignation.abbreviation
        : null;

    // `style.includeAbbreviationInSku === false` opts a style out of the SKU suffix even when an
    // abbreviation is set (e.g. the lone "Quilted" style whose name matches the collection).
    // The flag is fetched from the style metaobject's `include_abbreviation_in_sku` field and
    // defaults to true for any style missing the field — see styleShopify.server.js.
    const styleSkuEnabled = shapeData.style?.includeAbbreviationInSku !== false;
    const styleAbbrev =
      styleSkuEnabled && shapeData.style?.abbreviation
        ? shapeData.style.abbreviation
        : null;

    const segments = [versionedBaseSKU, shapeAbbrev];
    if (colorDesignationAbbrev) segments.push(colorDesignationAbbrev);
    if (styleAbbrev) segments.push(styleAbbrev);
    if (options.isCustom) segments.push('Custom');

    fullSKU = segments.join('-');
  }

  return {
    baseSKU: versionedBaseSKU,
    fullSKU,
    parts: filteredParts
  };
};