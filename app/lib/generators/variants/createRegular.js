// app/lib/generators/variants/createRegular.js

import {
  formatSKU,
  calculatePrice,
  includeStyleInVariantTitle,
  sortShapeRowsForVariantOrder,
} from "../../utils";

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

        const useStyleInVariantName =
          includeStyleInVariantTitle(formState, shape) && shape.style;

        const variant = {
          shapeValue: shape.value,
          shape: shape.label,
          shapeType: shape.shapeType || 'DEFAULT',
          style: shape.style || null,
          colorDesignation: shape.colorDesignation || null,
          sku: variantSku.fullSKU,
          baseSKU: variantSku.baseSKU,
          variantName: useStyleInVariantName
            ? `${shape.label} - ${shape.style.label}`
            : shape.label,
          price: calculatePrice(shape.value, formState),
          // weight: shape.weight,
          weight: PLACEHOLDER_WEIGHT,
          isCustom: false,
          embroideryThread: formState.threadMode?.embroidery === 'perShape'
            ? shape.embroideryThread || null
            : formState.globalEmbroideryThread || null
        };

        // Get first stitching thread's abbreviation if exists
        const firstStitchingThread = Object.values(formState.stitchingThreads || {})[0];
        if (firstStitchingThread?.abbreviation) {
          variant.stitchingAbbreviation = firstStitchingThread.abbreviation;
        }

        // Get embroidery abbreviation based on mode
        const embroideryAbbr = formState.globalEmbroideryThread?.abbreviation ||
          shape.embroideryThread?.abbreviation;
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
