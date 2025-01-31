// app/lib/generators/variants/generateVariants.js

import { createRegularVariants } from "./createRegular"; 
import { createCustomVariants } from "./createCustom";

/**
 * Assigns positions to variants based on shape display order
 * @param {Array} variants - Array of variants to position
 * @param {Object} allShapes - Shape configuration from formState
 * @returns {Array} Variants with assigned positions
 */
const assignVariantPositions = (variants, allShapes) => {
  const orderedShapeValues = Object.values(allShapes)
    .filter(shape => shape.isSelected)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(shape => shape.value);
 
  return variants.map(variant => ({
    ...variant,
    position: orderedShapeValues.indexOf(variant.shapeValue) + 1
  }));
 };

/**
 * Generates all variants (regular and custom) for a product based on form state
 * @param {Object} formState - Enhanced form state containing all product configuration
 * @param {Object} skuInfo - SKU generation settings from version utils
 * @returns {Array} Combined array of regular and custom variants with positions
 */
export const generateVariants = async (formState, skuInfo) => {
  try {
    // Input validation
    if (!formState?.collection || !formState?.allShapes) {
      console.error("Missing required form state for variant generation");
      return [];
    }

    // Get selected shapes
    const selectedShapes = Object.values(formState.allShapes)
      .filter(shape => shape.isSelected);

    if (selectedShapes.length === 0) {
      console.error("No shapes selected for variant generation");
      return [];
    }

    const regularVariants = assignVariantPositions(
      createRegularVariants(formState, skuInfo),
      formState.allShapes
    );

    // Create and position custom variants
    const customVariants = assignVariantPositions(
      createCustomVariants(formState, skuInfo),
      formState.allShapes
    );

    const allVariants = [
      ...regularVariants,
      {
        variantName: "Create my own set",
        price: "0.00",
        weight: "0.00",
        isCustom: true,
        position: regularVariants.length + 1,
        options: { Style: "Create my own set" }
      },
      ...customVariants.map(variant => ({
        ...variant,
        position: variant.position + regularVariants.length + 1
      }))
    ];

    // Sort by position before returning
    return allVariants.sort((a, b) => a.position - b.position);
 
  } catch (error) {
    console.error('Error generating variants:', error);
    throw error;
  }
};