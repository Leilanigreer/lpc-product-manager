// app/lib/generators/variants/generateVariants.js

import { createRegularVariants } from "./createRegular";
import { createCustomVariants } from "./createCustom";
import { buildWoodBaseToRepresentativeShapeValueMap } from "./woodCustomizePairing";
import { sortShapeRowsForVariantOrder } from "../../utils";
import { formatVariantSuffix } from "../../utils/skuUtils.js";

/**
 * Assigns positions to variants based on shape display order
 * @param {Array} variants - Array of variants to position
 * @param {Object} allShapes - Shape configuration from formState
 * @returns {Array} Variants with assigned positions
 */
const assignVariantPositions = (variants, allShapes) => {
  const orderedShapeValues = sortShapeRowsForVariantOrder(
    Object.values(allShapes).filter((shape) => shape.isSelected)
  ).map((shape) => shape.value);
 
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

  // Same sizing_guide_group shares one style/color designation choice from the form
  // (representative row). Auto-expanded siblings must inherit these values so custom
  // variant titles and SKU logic remain consistent across the whole group.
  const groupSelectionByGroup = new Map();
  for (const row of Object.values(expanded)) {
    const g = normalizeSizingGuideGroup(row?.sizingGuideGroup);
    if (!g || !row?.isSelected || !row.style?.value) continue;
    if (!groupSelectionByGroup.has(g)) {
      groupSelectionByGroup.set(g, {
        style: row.style,
        colorDesignation: row.colorDesignation ?? null,
        needsColorDesignation: Boolean(row.needsColorDesignation),
      });
    }
  }

  for (const [shapeValue, row] of Object.entries(expanded)) {
    const g = normalizeSizingGuideGroup(row?.sizingGuideGroup);
    if (!g || !row?.isSelected || row.style?.value) continue;
    const inherited = groupSelectionByGroup.get(g);
    if (inherited) {
      expanded[shapeValue] = {
        ...row,
        style: inherited.style,
        colorDesignation: inherited.colorDesignation,
        needsColorDesignation: inherited.needsColorDesignation,
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
    // sizing_guide_group: selecting one shape auto-selects siblings (e.g. mallet trios). Update flow
    // never deletes variants — missing siblings appear as new rows at apply time (add-only).

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

    let withWood = sorted.map((v) => {
      if (v.isCustom || v.shapeType !== "WOOD") return v;
      const rep = woodRepMap.get(v.shapeValue);
      if (rep == null) return v;
      return { ...v, customizeRepresentativeShapeValue: rep };
    });

    const verbatimBaseSku =
      typeof skuInfo?.verbatimBaseSku === "string"
        ? skuInfo.verbatimBaseSku.trim()
        : "";
    if (verbatimBaseSku) {
      withWood = withWood.map((v) => {
        const suffix = formatVariantSuffix(v.shapeValue, effectiveFormState, {
          isCustom: Boolean(v.isCustom),
        });
        if (!suffix) return v;
        return {
          ...v,
          baseSKU: verbatimBaseSku,
          sku: `${verbatimBaseSku}${suffix}`,
        };
      });
    }

    return withWood;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error generating variants:', error);
    }
    return [];
  }
};