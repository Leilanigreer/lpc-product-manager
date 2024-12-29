// app/lib/generators/variants/index.js

export { generateVariants } from './generateVariants';
export * from './regular';
export * from './custom';

/**
 * @typedef {Object} Variant
 * @property {string} shapeId
 * @property {string} shape
 * @property {string} styleId
 * @property {Object} style
 * @property {string} sku
 * @property {string} baseSKU
 * @property {string} variantName
 * @property {string} price
 * @property {number} weight
 * @property {boolean} isCustom
 * @property {Object} options
 */