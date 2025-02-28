// app/lib/generators/variants/createRegular.js

import { formatSKU, calculatePrice } from "../../utils";

export const createRegularVariants = (formState, skuInfo) => {
  return Object.values(formState.allShapes)
    .filter(shape => shape.isSelected)
    .map(shape => {
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

        const variant = {
          shapeValue: shape.value,
          shape: shape.label,
          style: shape.style || null,
          colorDesignation: shape.colorDesignation || null,
          sku: variantSku.fullSKU,
          baseSKU: variantSku.baseSKU,
          variantName: shape.style ? 
            `${shape.label} - ${shape.style.label}` : 
            shape.label,
          price: calculatePrice(shape.value, formState).toFixed(2),
          weight: shape.weight,
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
