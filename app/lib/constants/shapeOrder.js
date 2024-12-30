// app/lib/constants/shapeOrder.js

const SHAPE_MAP = {
  'cm2duhfg000006y58dqulghkm': 'Driver',
  'cm2duhfg300016y58sr14qoxd': '3-Wood',
  'cm2duhfg300026y58r1rnkvbc': '5-Wood',
  'cm2duhfg300036y583y11': '7-Wood',
  'cm2duhfg300046y58o8d': 'Fairway',
  'cm2duhfg300056y58ddfbtcxj': 'Hybrid',
  'cm2duhfg300066y583ii779yr': 'Mallet',
  'cm2duhfg300076y585ows': 'Blade'
};

export const SHAPE_ORDER = Object.keys(SHAPE_MAP);

export const getShapeName = (shapeId) => SHAPE_MAP[shapeId] || 'Unknown';

export const assignPositions = (variants, shapes) => {
  if (!Array.isArray(variants) || !Array.isArray(shapes)) {
    console.error('Invalid input to assignPositions');
    return [];
  }

  const selectedShapeIds = new Set(variants.map(v => v.shapeId));
  const orderedSelectedShapeIds = SHAPE_ORDER.filter(id => selectedShapeIds.has(id));

  // Validate that all shapes are recognized
  const unrecognizedShapes = [...selectedShapeIds].filter(id => !SHAPE_MAP[id]);
  if (unrecognizedShapes.length > 0) {
    console.warn('Unrecognized shape IDs:', unrecognizedShapes);
  }

  return variants.map(variant => {
    const position = orderedSelectedShapeIds.indexOf(variant.shapeId) + 1;
    if (position === 0) {
      console.warn(`No position found for shape ID: ${variant.shapeId}`);
    }
    return {
      ...variant,
      position
    };
  });
};