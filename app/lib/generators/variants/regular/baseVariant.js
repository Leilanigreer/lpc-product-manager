// app/lib/generators/variants/regular/baseVariant.js

import { 
  needsStyle, 
  isPutter, 
  isWoodType,
  formatSKU,
  getVariantPrice
} from "../../../utils";

/**
 * Creates a base variant with core properties
 * @param {Object} params - Parameter object
 * @param {Object} params.shape - Shape object containing value, label, and abbreviation
 * @param {number} params.weight - Weight of the variant
 * @param {Object} params.formState - Current form state
 * @param {Array} params.styles - Available styles
 * @param {Array} params.shapes - Available shapes
 * @param {Array} params.productPrices - Product price configurations
 * @param {string} params.collectionType - Type of collection
 * @param {Object} params.skuInfo - SKU generation information
 * @returns {Object|null} Created variant or null if creation fails
 */
export const createBaseVariant = ({
  shape,
  weight,
  formState,
  styles,
  shapes,
  productPrices,
  collectionType,
  skuInfo
}) => {
  // Generate SKU
  const variantSKU = formatSKU(
    skuInfo.parts,
    skuInfo.version,
    shape,
    { isCustom: false }
  );

  if (!variantSKU.fullSKU) {
    console.error('Failed to generate SKU for variant:', { shape, skuInfo });
    return null;
  }

  // Determine style information
  const isPutterShape = isPutter(shape);
  const shouldHaveStyle = !isPutterShape && needsStyle(collectionType);
  const selectedStyleId = shouldHaveStyle ? formState.selectedStyles?.[shape.value] : null;
  const selectedStyle = shouldHaveStyle && selectedStyleId ? 
    styles?.find(style => style.value === selectedStyleId) : 
    null;

  // Calculate price
  const priceShapeId = isWoodType(shape) ? 
    shapes.find(s => s.abbreviation === 'Fairway')?.value || shape.value : 
    shape.value;

  const basePrice = getVariantPrice(
    priceShapeId,
    formState.selectedCollection,
    productPrices,
    shapes
  );

  // Determine variant name
  const variantName = isPutterShape ? 
    shape.label :
    shouldHaveStyle && selectedStyle ? 
      `${shape.label} - ${selectedStyle.label}` : 
      shape.label;

  // Create and return base variant
  return {
    shapeId: shape.value,
    shape: shape.label,
    styleId: selectedStyleId,
    style: selectedStyle,
    sku: variantSKU.fullSKU,
    baseSKU: variantSKU.baseSKU,
    variantName,
    price: basePrice,
    weight,
    isCustom: false,
  };
};