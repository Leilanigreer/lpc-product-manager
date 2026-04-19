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

const DRIVERS_WOODS_HYBRIDS_NORM = "drivers_woods_hybrids";

function normShapeGroupKey(g) {
  if (g == null || String(g).trim() === "") return "";
  return String(g).trim().toLowerCase().replace(/\s+/g, "_");
}

/** Shape row belongs to the drivers/woods/hybrids shape_group (Shopify choice). */
export function isDriversWoodsHybridsShape(shapeRow) {
  return normShapeGroupKey(getShapeGroup(shapeRow)) === DRIVERS_WOODS_HYBRIDS_NORM;
}

/**
 * True when every selected shape in the drivers/woods/hybrids group shares the same style metaobject
 * (or all have no style). Used to omit redundant style names from variant titles.
 */
export function allSelectedDriversWoodsHybridsShareSameStyle(formState) {
  const selected = Object.values(formState.allShapes ?? {}).filter((s) => s?.isSelected);
  const dwh = selected.filter((s) => isDriversWoodsHybridsShape(s));
  if (dwh.length === 0) return false;
  const styleIds = dwh.map((s) => s.style?.value ?? null);
  return new Set(styleIds).size <= 1;
}

/**
 * Whether to include the style label in base/customize variant titles.
 * - Honors `style.useInVariantTitle` from Shopify (defaults true when unset).
 * - If all selected DWH shapes share one style, omit the style name (redundant).
 */
export function includeStyleInVariantTitle(formState, shapeRow) {
  const style = shapeRow?.style;
  if (!style) return false;
  if (style.useInVariantTitle === false) return false;
  if (
    isDriversWoodsHybridsShape(shapeRow) &&
    allSelectedDriversWoodsHybridsShareSameStyle(formState)
  ) {
    return false;
  }
  return true;
}

export const getShapeCategory = (shape) => {
  if (!isValidShape(shape)) return 'Other';
  return shape.shapeType;
};

export const findMatchingWoodStyles = (shapes, selectedShapes) => {
  if (!Array.isArray(shapes) || !selectedShapes) return {};

  const woodStyles = {};

  shapes.forEach((shape) => {
    const row = selectedShapes[shape.value];
    if (!row?.isSelected || !isWoodType(shape) || !row.style?.value) return;
    const styleValue = row.style.value;
    woodStyles[styleValue] = woodStyles[styleValue] || [];
    woodStyles[styleValue].push(shape.value);
  });

  return Object.entries(woodStyles)
    .filter(([_, shapeIds]) => shapeIds.length >= 2)
    .reduce((acc, [styleValue, shapeValues]) => {
      acc[styleValue] = shapeValues;
      return acc;
    }, {});
};

/**
 * Whether the shape row should show the color-designation control.
 * Leather disambiguation for named patterns applies when the row's style requests it
 * and (for woods) at least two selected woods share that same style — e.g. 3w + 5w with
 * "50/50"; driver is not a wood and is not in that pairing set.
 *
 * @param {Object} shapeDefinition - Catalog shape from loader (`value`, `shapeType`, …)
 * @param {Object} shapeRowState - Row in `allShapes` (`isSelected`, `style`, …)
 * @param {Object[]} shapesCatalog
 * @param {Record<string, Object>} allShapesMap - Full `allShapes` (only `isSelected` rows count toward pairing)
 */
export function computeShapeNeedsColorDesignation(
  shapeDefinition,
  shapeRowState,
  shapesCatalog,
  allShapesMap
) {
  if (!shapeDefinition || !shapeRowState || isPutter(shapeDefinition)) return false;
  if (!shapeRowState.style || shapeRowState.style.needsColorDesignation !== true)
    return false;
  if (!isWoodType(shapeDefinition)) return false;
  const groups = findMatchingWoodStyles(shapesCatalog, allShapesMap);
  return Object.values(groups).some((group) =>
    group.includes(shapeDefinition.value)
  );
}
