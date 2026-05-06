// app/lib/generators/variants/createCustom.js

import {
  formatSKU,
  calculatePrice,
  includeStyleInVariantTitle,
  sanitizeStyleLabelForVariantName,
  sortShapeRowsForVariantOrder,
} from "../../utils";
import { leatherNameForListing } from "../../utils/leatherListing.js";
import { firstCanonicalEmbroideryThread } from "../../utils/threadUtils.js";

/** Weight not captured in UI for now; Shopify/Prisma still require a numeric weight. */
const PLACEHOLDER_WEIGHT = "0";

const stylePhraseColorLabel = (styleLabel, leatherPhrase, colorLabel) => {
  const phrase = String(leatherPhrase || "").trim();
  if (!phrase) return `${styleLabel} ${colorLabel}`;
  if (phrase.startsWith(":")) {
    return `${styleLabel}${phrase} ${colorLabel}`;
  }
  return `${styleLabel} ${phrase} ${colorLabel}`;
};

const getVariantName = (shapeData, formState) => {
  // Base name prefix and suffix
  const prefix = 'Customized';
  const suffix = '+$15';

  const includeStyleName = includeStyleInVariantTitle(formState, shapeData);
  const sanitizedStyleLabel = sanitizeStyleLabelForVariantName(
    shapeData.style?.label
  );

  // Get shape label, using "Fairway" for wood types
  const shapeLabel = shapeData.shapeType === 'WOOD' ? 'Fairway' : shapeData.label;
  
  // If no shapeData style or color designation needed, return simple name
  if (!shapeData.style && !shapeData.needsColorDesignation) {
    return `${prefix} ${shapeLabel} ${suffix}`;
  }

  // Get style info
  const style = shapeData.style
  const leatherColor = shapeData.colorDesignation;

  // Handle non-color designation styled variants
  if (style && !shapeData.needsColorDesignation) {
    if (!includeStyleName || !sanitizedStyleLabel) {
      return `${prefix} ${shapeLabel} ${suffix}`;
    }
    return `${prefix} ${shapeLabel} - ${sanitizedStyleLabel} ${suffix}`;
  }

  // Handle color designation variants
  if (shapeData.needsColorDesignation && leatherColor) {
    const styleSource = shapeData.style;
    if (!styleSource) {
      return `${prefix} ${shapeLabel} ${suffix}`;
    }

    const leatherPhrase = styleSource.leatherPhrase || 'leather as';
    let colorLabel = leatherNameForListing(leatherColor);

    // Handle opposite leather case
    if (styleSource.useOppositeLeather) {
      const { primary, secondary } = formState.leatherColors;
      colorLabel =
        leatherColor.value === primary?.value
          ? leatherNameForListing(secondary)
          : leatherNameForListing(primary);
    }

    if (!includeStyleName || !sanitizedStyleLabel) {
      return `${prefix} ${shapeLabel} - ${colorLabel} ${leatherPhrase} ${suffix}`;
    }

    // Apply naming pattern
    switch (styleSource.namePattern) {
      case 'STYLE_WITH_COLOR_PHRASE':
        return `${prefix} ${shapeLabel} - ${styleSource.label} with ${colorLabel} ${leatherPhrase} ${suffix}`;

      case 'STYLE_PHRASE_COLOR':
      default:
        return `${prefix} ${shapeLabel} - ${stylePhraseColorLabel(
          styleSource.label,
          leatherPhrase,
          colorLabel
        )} ${suffix}`;
    }
  }

  // Fallback
  return `${prefix} ${shapeLabel} ${suffix}`;
};

const generateCustomVariant = (shapeData, formState, skuInfo) => {
  if (!shapeData?.isSelected) return null;

  try {
    const customSku = formatSKU(
      skuInfo.parts,
      skuInfo.version,
      shapeData.value,
      formState,
      { isCustom: true }
    );

    if (!customSku?.fullSKU) {
      console.error('Failed to generate SKU for custom variant');
      return null;
    }

    const basePrice = calculatePrice(shapeData.value, formState);
    const customPrice = (parseFloat(basePrice) + 15).toFixed(2);

    return {
      shapeValue: shapeData.value,
      shape: shapeData.label,
      shapeType: shapeData.shapeType || "DEFAULT",
      style: shapeData.style || null,
      colorDesignation: shapeData.colorDesignation || null,
      sku: customSku.fullSKU,
      baseSKU: customSku.baseSKU,
      variantName: getVariantName(shapeData, formState),
      price: customPrice,
      // weight: shapeData.weight,
      weight: PLACEHOLDER_WEIGHT,
      isCustom: true,
      embroideryThread:
        firstCanonicalEmbroideryThread(formState.embroideryThreads) || null
    };
  } catch (error) {
    console.error('Error generating custom variant:', error);
    return null;
  }
};

export const createCustomVariants = (formState, skuInfo) => {
  const selectedNonWood = sortShapeRowsForVariantOrder(
    Object.values(formState.allShapes).filter(
      (shape) => shape.isSelected && shape.shapeType !== 'WOOD'
    )
  );
  const nonWoodVariants = selectedNonWood
    .map((shape) => generateCustomVariant(shape, formState, skuInfo))
    .filter(Boolean);

  const processedWoodShapes = [];

  const selectedWoods = sortShapeRowsForVariantOrder(
    Object.values(formState.allShapes).filter(
      (shape) => shape.isSelected && shape.shapeType === 'WOOD'
    )
  );

  const woodVariants = selectedWoods.reduce((acc, shape) => {
      if (shouldCollapseWoodVariants(shape, processedWoodShapes, formState)) {
        return acc;
      }

      const variant = generateCustomVariant(shape, formState, skuInfo);
      if (variant) {
        processedWoodShapes.push(shape);
        acc.push(variant);
      }
      return acc;
    }, []);

  return [...nonWoodVariants, ...woodVariants];
};

/**
 * When style color designation is enabled for the row, custom wood collapse must include
 * the selected color designation in the comparison.
 */
export function woodCollapseColorDesignationsMatch(
  currentShape,
  processedShape,
  formState
) {
  void formState;
  return (
    !currentShape.needsColorDesignation ||
    currentShape.colorDesignation?.value === processedShape.colorDesignation?.value
  );
}

export const shouldCollapseWoodVariants = (
  currentShape,
  processedShapes,
  formState
) => {
  if (!processedShapes.length) return false;

  const { collection } = formState;

  if (!collection.needsStyle) return true;

  const currentStyle = currentShape.style;

  return processedShapes.some((processedShape) => {
    const processedStyle = processedShape.style;
    const stylesMatch = currentStyle?.value === processedStyle?.value;
    if (!stylesMatch) return false;
    return woodCollapseColorDesignationsMatch(
      currentShape,
      processedShape,
      formState
    );
  });
};
