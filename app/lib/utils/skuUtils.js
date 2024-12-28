// app/lib/utils/skuUtils.js

/**
 * Formats SKU based on base parts, version, and shape
 * @param {Array} baseParts - Array of SKU parts
 * @param {number} version - Version number
 * @param {Object} shape - Shape object containing abbreviation
 * @param {Object} options - Additional options for SKU formatting
 * @returns {Object} Object containing baseSKU and fullSKU
 */
export const formatSKU = (baseParts, version, shape, options = {}) => {
  // Validate inputs
  if (!Array.isArray(baseParts)) {
    console.error('formatSKU: baseParts must be an array', baseParts);
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
  
  if (shape?.abbreviation) {
    if (options.isCustom) {
      if (options.style?.abbreviation) {
        // Handle style-specific custom SKUs
        if (options.qClassicLeatherAbbreviation) {
          // QClassic with specific leather color
          fullSKU = `${versionedBaseSKU}-${shape.abbreviation}-${options.qClassicLeatherAbbreviation}-${options.style.abbreviation}-Custom`;
        } else {
          // Regular style custom
          fullSKU = `${versionedBaseSKU}-${shape.abbreviation}-${options.style.abbreviation}-Custom`;
        }
      } else {
        // Regular custom
        fullSKU = `${versionedBaseSKU}-${shape.abbreviation}-Custom`;
      }
    } else {
      // Regular variant
      fullSKU = `${versionedBaseSKU}-${shape.abbreviation}`;
    }
  }

  return {
    baseSKU: versionedBaseSKU,
    fullSKU,
    parts: filteredParts
  };
};