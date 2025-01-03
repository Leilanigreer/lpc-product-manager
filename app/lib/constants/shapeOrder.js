export const assignPositions = (variants, shapes) => {
  if (!Array.isArray(variants) || !Array.isArray(shapes)) {
    console.error('Invalid input to assignPositions');
    return [];
  }

  // Sort shapes by displayOrder
  const orderedShapes = [...shapes].sort((a, b) => a.displayOrder - b.displayOrder);
  const orderedShapeIds = orderedShapes.map(shape => shape.value);

  const selectedShapeIds = new Set(variants.map(v => v.shapeId));
  const orderedSelectedShapeIds = orderedShapeIds.filter(id => selectedShapeIds.has(id));

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