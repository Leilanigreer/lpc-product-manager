// app/lib/generators/variants/createRegular.js

import {
  formatSKU,
  calculatePrice,
  includeStyleInVariantTitle,
  sanitizeStyleLabelForVariantName,
  sortShapeRowsForVariantOrder,
} from "../../utils";
import {
  firstCanonicalEmbroideryThread,
  firstCanonicalStitchingThread,
} from "../../utils/threadUtils.js";

/** Weight not captured in UI for now; Shopify/Prisma still require a numeric weight. */
const PLACEHOLDER_WEIGHT = "0";

export const createRegularVariants = (formState, skuInfo) => {
  const selectedRows = Object.values(formState.allShapes).filter(
    (shape) => shape.isSelected
  );
  return sortShapeRowsForVariantOrder(selectedRows)
    .map((shape) => {
      try {
        const variantSku = formatSKU(
          skuInfo.parts,
          skuInfo.version,
          shape.value,
          formState,
          { isCustom: false }
        );

        if (!variantSku.fullSKU) {
          console.error('Failed to generate SKU for regular variant:', shape.label);
          return null;
        }

        const styleLabel = sanitizeStyleLabelForVariantName(shape.style?.label);
        const useStyleInVariantName =
          includeStyleInVariantTitle(formState, shape) && Boolean(styleLabel);

        const variant = {
          shapeValue: shape.value,
          shape: shape.label,
          shapeType: shape.shapeType || 'DEFAULT',
          style: shape.style || null,
          colorDesignation: shape.colorDesignation || null,
          sku: variantSku.fullSKU,
          baseSKU: variantSku.baseSKU,
          variantName: useStyleInVariantName
            ? `${shape.label} - ${styleLabel}`
            : shape.label,
          price: calculatePrice(shape.value, formState),
          // weight: shape.weight,
          weight: PLACEHOLDER_WEIGHT,
          isCustom: false,
          embroideryThread:
            firstCanonicalEmbroideryThread(formState.embroideryThreads) || null,
        };

        // Get first stitching thread's abbreviation if exists
        const firstStitchingThread = firstCanonicalStitchingThread(
          formState.stitchingThreads,
          formState
        );
        if (firstStitchingThread?.abbreviation) {
          variant.stitchingAbbreviation = firstStitchingThread.abbreviation;
        }

        const embroideryAbbr =
          firstCanonicalEmbroideryThread(formState.embroideryThreads)?.abbreviation;
        if (embroideryAbbr) {
          variant.embroideryAbbreviation = embroideryAbbr;
        }

        return variant;
      } catch (error) {
        console.error('Error creating regular variant:', error);
        return null;
      }
    })
    .filter(Boolean);
};
