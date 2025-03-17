/**
 * @typedef {Object} Shape
 * @property {string} value - Shape ID
 * @property {string} label - Shape name
 * @property {string} abbreviation - Shape code
 * @property {string} shapeType - DRIVER, WOOD, FAIRWAY, PUTTER, or OTHER
 * @property {boolean} isActive - Whether the shape is active
 */

const isValidShape = (shape) => {
  return Boolean(
    shape &&
    typeof shape === 'object' &&
    'shapeType' in shape &&
    typeof shape.shapeType === 'string' &&
    'isActive' in shape &&
    typeof shape.isActive === 'boolean'
  );
};

export const isPutter = (shape) => {
  if (!isValidShape(shape)) {
    console.warn('Invalid shape provided to isPutter:', shape);
    return false;
  }
  return shape.shapeType === 'PUTTER' || shape.shapeType === 'LAB_PUTTER';
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

export const findMatchingWoodStyles = (shapes, selectedShapes) => {
  if (!Array.isArray(shapes) || !selectedShapes) return {};
  
  const woodStyles = {};
  
  shapes.forEach(shape => {
    if (isWoodType(shape) && selectedShapes[shape.value]?.style?.value) {
      const styleValue = selectedShapes[shape.value].style.value;
      woodStyles[styleValue] = woodStyles[styleValue] || [];
      woodStyles[styleValue].push(shape.value);
    }
  });

  return Object.entries(woodStyles)
    .filter(([_, shapes]) => shapes.length >= 2)
    .reduce((acc, [styleValue, shapeValues]) => {
      acc[styleValue] = shapeValues;
      return acc;
    }, {});
};