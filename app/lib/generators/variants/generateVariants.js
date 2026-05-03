// app/lib/generators/variants/generateVariants.js

import { createRegularVariants } from "./createRegular";
import { createCustomVariants } from "./createCustom";
import { buildWoodBaseToRepresentativeShapeValueMap } from "./woodCustomizePairing";

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
    position: orderedShapeValues.indexOf(variant.shapeValue) + 1,
    shapeType: allShapes[variant.shapeValue]?.shapeType || 'DEFAULT'
  }));
 };

const normalizeSizingGuideGroup = (value) => {
  if (value == null) return null;
  const normalized = String(value).trim();
  return normalized.length ? normalized : null;
};

const expandSelectionsBySizingGuideGroup = (allShapes) => {
  const shapeRows = Object.values(allShapes ?? {});
  if (!shapeRows.length) {
    return allShapes;
  }

  const selectedGroups = new Set(
    shapeRows
      .filter((shape) => shape?.isSelected)
      .map((shape) => normalizeSizingGuideGroup(shape?.sizingGuideGroup))
      .filter(Boolean)
  );

  if (selectedGroups.size === 0) {
    return allShapes;
  }

  const expanded = { ...allShapes };
  for (const row of shapeRows) {
    const rowGroup = normalizeSizingGuideGroup(row?.sizingGuideGroup);
    if (!rowGroup || !selectedGroups.has(rowGroup) || row?.isSelected) continue;
    expanded[row.value] = {
      ...row,
      isSelected: true,
    };
  }

  // Same sizing_guide_group shares one style choice from the form (representative row).
  // Auto-expanded siblings must inherit it so variant titles and custom SKUs keep the style segment.
  const styleByGroup = new Map();
  for (const row of Object.values(expanded)) {
    const g = normalizeSizingGuideGroup(row?.sizingGuideGroup);
    if (!g || !row?.isSelected || !row.style?.value) continue;
    if (!styleByGroup.has(g)) {
      styleByGroup.set(g, row.style);
    }
  }

  for (const [shapeValue, row] of Object.entries(expanded)) {
    const g = normalizeSizingGuideGroup(row?.sizingGuideGroup);
    if (!g || !row?.isSelected || row.style?.value) continue;
    const inherited = styleByGroup.get(g);
    if (inherited) {
      expanded[shapeValue] = {
        ...row,
        style: inherited,
      };
    }
  }

  return expanded;
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
      if (process.env.NODE_ENV === 'development') {
        console.error("Missing required form state for variant generation");
      }
      return [];
    }

    // Get selected shapes
    const selectedShapes = Object.values(formState.allShapes)
      .filter(shape => shape.isSelected);

    if (selectedShapes.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.error("No shapes selected for variant generation");
      }
      return [];
    }

    const allShapesForGeneration = expandSelectionsBySizingGuideGroup(
      formState.allShapes
    );
    const effectiveFormState = {
      ...formState,
      allShapes: allShapesForGeneration,
    };

    const regularVariants = assignVariantPositions(
      createRegularVariants(effectiveFormState, skuInfo),
      effectiveFormState.allShapes
    );

    // Create and position custom variants
    const customVariants = assignVariantPositions(
      createCustomVariants(effectiveFormState, skuInfo),
      effectiveFormState.allShapes
    );

    const allVariants = [
      ...regularVariants,
      ...customVariants.map(variant => ({
        ...variant,
        position: variant.position + regularVariants.length,
        shapeType:
          effectiveFormState.allShapes[variant.shapeValue]?.shapeType ||
          'DEFAULT'
      }))
    ];

    const sorted = allVariants.sort((a, b) => a.position - b.position);
    const woodRepMap = buildWoodBaseToRepresentativeShapeValueMap(
      effectiveFormState
    );

    return sorted.map((v) => {
      if (v.isCustom || v.shapeType !== "WOOD") return v;
      const rep = woodRepMap.get(v.shapeValue);
      if (rep == null) return v;
      return { ...v, customizeRepresentativeShapeValue: rep };
    });
 
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error generating variants:', error);
    }
    return [];
  }
};