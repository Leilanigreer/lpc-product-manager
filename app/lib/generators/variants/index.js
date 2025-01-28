// app/lib/generators/variants/index.js

export { generateVariants } from './generateVariants';
export { createRegularVariants } from './createRegular';
export { createCustomVariants } from './createCustom';

/**
 * @typedef {Object} Variant
 * @property {string} shapeValue - Shape identifier from formState
 * @property {string} shape - Display name of the shape
 * @property {Object} [style] - Optional style configuration
 * @property {string} style.value - Style identifier
 * @property {string} style.label - Style display name 
 * @property {string} style.abbreviation - Style code for SKUs
 * @property {string} sku - Full SKU including version and customization
 * @property {string} baseSKU - Base SKU without shape-specific parts
 * @property {string} variantName - Display name for the variant
 * @property {string} price - Price as string with 2 decimal places
 * @property {string} weight - Weight in ounces as string
 * @property {boolean} isCustom - Whether this is a custom variant
 * @property {number} [position] - Display order position
 * @property {Object} [colorDesignation] - Optional color designation for special styles
 * @property {Object} [embroideryThread] - Optional embroidery thread details
 */

/**
 * @typedef {Object} FormState
 * @property {Object} collection - Collection configuration
 * @property {Object} finalRequirements - Resolved requirements from collection/style
 * @property {Object} allShapes - Map of shape configurations
 * @property {Object} leatherColors - Primary/secondary leather selections
 * @property {string} styleMode - 'global' or 'independent'
 * @property {Object} [globalStyle] - Global style if using global mode
 * @property {Object} threadMode - Thread selection mode configuration
 * @property {Object} [globalEmbroideryThread] - Global embroidery if using global mode
 * @property {Object} stitchingThreads - Selected stitching threads
 */