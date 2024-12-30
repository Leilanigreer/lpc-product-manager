// app/lib/shapeUtils.js

/**
 * @typedef {Object} Shape
 * @property {string} value - Shape ID
 * @property {string} label - Shape name
 * @property {string} abbreviation - Shape code
 */

const PUTTER_ABBREVIATIONS = ['Mallet', 'Blade'];
const WOOD_ABBREVIATIONS = ['3Wood', '5Wood', '7Wood', 'Fairway'];

/**
 * Validates a shape object has required properties
 * @param {Shape} shape - Shape to validate
 * @returns {boolean} True if shape is valid
 */
const isValidShape = (shape) => {
  return Boolean(
    shape &&
    typeof shape === 'object' &&
    'abbreviation' in shape &&
    typeof shape.abbreviation === 'string'
  );
};

/**
 * Checks if a shape is a putter type
 * @param {Shape} shape - Shape object to check
 * @returns {boolean} True if shape is a putter type
 */
export const isPutter = (shape) => {
  if (!isValidShape(shape)) {
    console.warn('Invalid shape provided to isPutter:', shape);
    return false;
  }
  return PUTTER_ABBREVIATIONS.includes(shape.abbreviation);
};

/**
 * Checks if a shape is a wood type
 * @param {Shape} shape - Shape object to check
 * @returns {boolean} True if shape is a wood type
 */
export const isWoodType = (shape) => {
  if (!isValidShape(shape)) {
    console.warn('Invalid shape provided to isWoodType:', shape);
    return false;
  }
  return WOOD_ABBREVIATIONS.includes(shape.abbreviation);
};

/**
 * Get a human-readable category for a shape
 * @param {Shape} shape - Shape object
 * @returns {string} Category name ('Putter', 'Wood', or 'Other')
 */
export const getShapeCategory = (shape) => {
  if (isPutter(shape)) return 'Putter';
  if (isWoodType(shape)) return 'Wood';
  return 'Other';
};