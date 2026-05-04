// app/lib/utils/versionUtils.js

import {
  sortedEmbroideryThreadsList,
  sortedStitchingThreadsList,
} from "./threadUtils.js";

/**
 * Evaluates a pattern with provided data context
 * @param {string} pattern - Pattern string containing placeholders
 * @param {Object} context - Data to fill placeholders
 * @returns {string} Evaluated pattern
 */
const evaluatePattern = (pattern, context) => {
  if (!pattern) return '';
  
  return pattern.replace(/\{([^}]+)\}/g, (match, path) => {
    const value = path.split('.').reduce((obj, key) => {
      // Handle array index notation, e.g., stitchingThreads[0]
      const arrayMatch = key.match(/(\w+)\[(\d+)\]/);
      if (arrayMatch) {
        const [, arrayName, index] = arrayMatch;
        return obj?.[arrayName]?.[parseInt(index)];
      }
      return obj?.[key];
    }, context);

    if (!value) {
      console.warn(`Missing value for path: ${path}`);
      return '';
    }
    return value;
  });
};

/**
 * Generates base parts for SKU based on collection pattern and form data
 * @param {Object} formState - Current form state including finalRequirements
 * @returns {Array<string>} Array of SKU parts
 */
export const generateBaseParts = (formState) => {
  const { finalRequirements } = formState;
  
  if (!finalRequirements) {
    console.warn('Missing finalRequirements in form state');
    return [];
  }

  try {
    const pattern = finalRequirements.skuPattern;
    
    if (!pattern) {
      console.error('No SKU pattern found in finalRequirements');
      return [];
    }

    const stitchingList = sortedStitchingThreadsList(formState.stitchingThreads);
    const embroideryList = sortedEmbroideryThreadsList(formState.embroideryThreads);

    const context = {
      leatherColors: {
        primary: formState.leatherColors?.primary,
        secondary: formState.leatherColors?.secondary
      },
      stitchingThreads: stitchingList,
      stitchingThreadColor: stitchingList[0] ?? null,
      embroideryThreads: embroideryList,
      embroideryThreadColor: embroideryList[0] ?? null,
    };

    // Evaluate the pattern
    const generatedSku = evaluatePattern(pattern, context);
    
    // Split into parts and filter out empty segments
    const parts = generatedSku.split('-').filter(Boolean);

    if (parts.length === 0) {
      console.error('Generated SKU parts are empty');
      return [];
    }

    return parts;

  } catch (error) {
    console.error('Error generating SKU parts:', error);
    return [];
  }
};

/**
 * Calculates version number for SKU based on existing products
 * @param {Array<string>} parts - Base SKU parts
 * @param {Array<Object>} existingProducts - Existing products to check against
 * @returns {number|null} Version number or null if no version needed
 */
export const calculateVersionFromParts = (parts, existingProducts) => {
  if (!Array.isArray(parts) || !Array.isArray(existingProducts)) {
    console.warn('Invalid inputs for version calculation');
    return null;
  }

  const baseSku = parts.join('-');
  
  // Filter products matching this collection
  const matchingProducts = existingProducts.filter(product => 
    product.baseSKU === baseSku || 
    product.baseSKU.startsWith(`${baseSku}-V`)
  );

  if (matchingProducts.length === 0) return null;

  // Extract versions and find highest
  const versions = matchingProducts
    .map(product => {
      const match = product.baseSKU.match(/-V(\d+)$/);
      return match ? parseInt(match[1]) : 1;
    })
    .filter(v => !isNaN(v));

  return versions.length > 0 ? Math.max(...versions) + 1 : 2;
};