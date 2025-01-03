/**
 * @typedef {Object} Shape
 * @property {string} value - Shape ID
 * @property {string} label - Shape name
 * @property {string} abbreviation - Shape code
 * @property {string} shapeType - WOOD, PUTTER, or OTHER
 */

const isValidShape = (shape) => {
  return Boolean(
    shape &&
    typeof shape === 'object' &&
    'shapeType' in shape &&
    typeof shape.shapeType === 'string'
  );
};

export const isPutter = (shape) => {
  if (!isValidShape(shape)) {
    console.warn('Invalid shape provided to isPutter:', shape);
    return false;
  }
  return shape.shapeType === 'PUTTER';
};

export const isWoodType = (shape) => {
  if (!isValidShape(shape)) {
    console.warn('Invalid shape provided to isWoodType:', shape);
    return false;
  }
  return shape.shapeType === 'WOOD';
};

export const getShapeCategory = (shape) => {
  if (!isValidShape(shape)) return 'Other';
  return shape.shapeType;
};