// app/lib/generators/variants/custom/index.js

/**
 * @typedef {import('../index').Variant} Variant
 * @typedef {import('../index').SkuInfo} SkuInfo
 * 
 * @typedef {Object} CustomVariantOptions
 * @property {Array<Variant>} variants - Base variants to generate customs from
 * @property {Object} formState - Current form state
 * @property {Array} shapes - Available shapes
 * @property {Array} leatherColors - Available leather colors
 * @property {string} collectionType - Type of collection
 * @property {SkuInfo} skuInfo - SKU information
 */

export * from './createCustom';
export * from './nonStyledVariants';
export * from './putterVariants';
export * from './qClassicVariants';
export * from './styledVariants';
export * from './woodVariants';