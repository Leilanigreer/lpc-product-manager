// app/lib/utils/versionUtils.js

/**
 * Generates base parts for SKU based on collection and colors
 * @param {Object} collection - Collection object from database
 * @param {Object} colors - Color selections for the product
 * @returns {Array<string>} Array of SKU parts
 */
export const generateBaseParts = (selectedCollection, colors) => { 
  console.log('selectedCollection:', selectedCollection);

  if (!selectedCollection?.value || !colors) {
    console.warn('Missing required data for SKU parts generation:', {
      hasCollectionId: !!selectedCollection?.value,
      hasColors: !!colors
    });
    return [];
  }

  const {
    leatherColor1, 
    leatherColor2, 
    stitchingThreadColor, 
    embroideryThreadColor 
  } = colors;

  if (!selectedCollection.skuPrefix) {
    console.error('Collection is missing SKU prefix:', selectedCollection.value);
    return [];
  }

  const baseParts = [selectedCollection.skuPrefix];

  // Add leather colors
  baseParts.push(leatherColor1?.abbreviation);
  
  if (selectedCollection.needsSecondaryLeather) {
    baseParts.push(leatherColor2?.abbreviation);
  }

  // Add thread colors based on collection's thread type
  if (selectedCollection.needsStitchingColor) {
    switch(selectedCollection.threadType) {
      case 'EMBROIDERY':
        baseParts.push(embroideryThreadColor?.abbreviation);
        break;
      case 'STITCHING':
        baseParts.push(stitchingThreadColor?.abbreviation);
        break;
    }
  }

  return baseParts.filter(Boolean);
};

/**
 * Calculates version number for SKU based on existing products
 * @param {Array<string>} parts - Base SKU parts
 * @param {Array<Object>} existingProducts - Existing products to check against
 * @returns {number|null} Version number or null if no version needed
 */
export const calculateVersionFormParts = (parts, existingProducts) => {
  if (!existingProducts?.length) {
    return null;
  }

  const baseSKU = parts.filter(Boolean).join('-');
  
  const matchingProduct = existingProducts.find(product =>
    product.baseSKU === baseSKU ||
    product.baseSKU.startsWith(`${baseSKU}-V`)
  );

  if (!matchingProduct) return null;

  const regex = /-V(\d+)$/;
  const match = matchingProduct.baseSKU.match(regex);
  return match ? parseInt(match[1]) + 1 : 2;
};