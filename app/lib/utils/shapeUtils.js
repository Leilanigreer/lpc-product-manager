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

export const findMatchingWoodStyles = (shapes, selectedShapes) => {
  if (!Array.isArray(shapes) || !selectedShapes) return {};
  
  // Group wood shapes by style value
  const woodStyles = Object.entries(selectedShapes).reduce((acc, [shapeId, shapeData]) => {
    const shape = shapes.find(s => s.value === shapeId);
    
    // Only include wood shapes that have a style selected
    if (shape?.shapeType === 'WOOD' && shapeData.style?.value) {
      const styleValue = shapeData.style.value;
      acc[styleValue] = acc[styleValue] || [];
      acc[styleValue].push(shapeId);
    }
    return acc;
  }, {});

  // Filter to only styles with 2+ shapes
  return Object.entries(woodStyles)
    .filter(([_, shapes]) => shapes.length >= 2)
    .reduce((acc, [styleValue, shapeIds]) => {
      acc[styleValue] = shapeIds;
      return acc;
    }, {});
};