// app/lib/generators/variants/index.js

export { generateVariants } from './generateVariants';
export * from './regular';
export * from './custom';

/**
 * @typedef {Object} SkuInfo
 * @property {Array<string>} parts
 * @property {number} version
 */

/**
 * @typedef {Object} Style
 * @property {string} value
 * @property {string} label
 * @property {string} abbreviation
 */

/**
 * @typedef {Object} Colors
 * @property {Object} leatherColor1
 * @property {Object} leatherColor2
 * @property {Object} stitchingThreadColor
 * @property {Object} embroideryThreadColor
 */