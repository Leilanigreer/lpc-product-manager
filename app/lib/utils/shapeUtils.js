/**
 * @typedef {Object} Shape
 * @property {string} value - Shape ID
 * @property {string} label - Shape name
 * @property {string} abbreviation - Shape code
 * @property {string} shapeType - DRIVER, WOOD, HYBRID, PUTTER, ZERO_MALLET, or OTHER
 * @property {string|null} [shapeGroup] - Shopify `shape_group` choice (uppercase snake); null from Postgres
 * @property {boolean} isActive - Whether the shape is active
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
  const group = getShapeGroup(shape);
  if (group != null) {
    const normalizedGroup = String(group).trim().toLowerCase().replace(/\s+/g, '_');
    if (normalizedGroup === 'blades' || normalizedGroup === 'mallets') {
      return true;
    }
    if (normalizedGroup === 'drivers_woods_hybrids') {
      return false;
    }
  }
  return shape.shapeType === 'PUTTER' || shape.shapeType === 'ZERO_MALLET';
};

export const isWoodType = (shape) => {
  if (!isValidShape(shape)) {
    console.warn('Invalid shape provided to isWoodType:', shape);
    return false;
  }
  return shape.shapeType === 'WOOD';
};

/**
 * Shopify `shape_group` choice (normalized to uppercase snake in loader) or legacy snake_case on object.
 * Postgres shapes omit this → null.
 */
export const getShapeGroup = (shape) => {
  if (!isValidShape(shape)) return null;
  if (shape.shapeGroup != null && String(shape.shapeGroup).trim() !== '') {
    return String(shape.shapeGroup).trim();
  }
  if (shape.shape_group != null && String(shape.shape_group).trim() !== '') {
    return String(shape.shape_group).trim();
  }
  return null;
};

/** Compare style shape-group choice to shape_group with case/spacing normalization. */
export function styleCategoryMatchesShapeGroup(styleCategory, shapeGroup) {
  if (shapeGroup == null || String(shapeGroup).trim() === '') return true;
  const sc = styleCategory != null ? String(styleCategory).trim() : '';
  if (!sc) return false;
  const norm = (s) => s.toLowerCase().replace(/\s+/g, '_');
  return norm(sc) === norm(String(shapeGroup).trim());
}

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