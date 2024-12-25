// app/lib/shapeUtils.js

/**
 * Checks if a shape is a putter type (Mallet or Blade)
 * @param {Object} shape - Shape object containing abbreviation property
 * @returns {boolean} True if shape is a putter type
 */
export const isPutter = (shape) => {
  return shape?.abbreviation === 'Mallet' || shape?.abbreviation === 'Blade';
};

/**
 * Checks if a shape is a wood type (3Wood, 5Wood, 7Wood, or Fairway)
 * @param {Object} shape - Shape object containing abbreviation property
 * @returns {boolean} True if shape is a wood type
 */
export const isWoodType = (shape) => {
  const woodAbbreviations = ['3Wood', '5Wood', '7Wood', 'Fairway'];
  return woodAbbreviations.includes(shape?.abbreviation);
};

// Add other shape-related utility functions as needed