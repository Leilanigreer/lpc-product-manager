// app/lib/generators/variants/generateVariants.js

import { getColors, getCollectionType, needsSecondaryColor, needsStitchingColor } from "../../utils";
import { assignPositions } from "../../constants/shapeOrder";
import { createRegularVariants } from './regular';
import { createCustomVariants } from './custom';

export const generateVariants = async (
  formState, 
  leatherColors, 
  stitchingThreadColors, 
  embroideryThreadColors, 
  shapes, 
  styles, 
  productPrices, 
  shopifyCollections,
  skuInfo
) => {
  try {
    // Initial validation
    if (!formState || !leatherColors || !stitchingThreadColors || !embroideryThreadColors || 
        !shapes || !productPrices || !shopifyCollections) {
      return [];
    }

    const colors = getColors(
      formState,
      leatherColors,
      stitchingThreadColors,
      embroideryThreadColors
    );
    
    const collectionType = getCollectionType(formState, shopifyCollections);

    // Validate collection-specific requirements
    if (!colors.leatherColor1) return [];
    if (needsSecondaryColor(collectionType) && !colors.leatherColor2) {
      console.error("Secondary leather color required but not found");
      return [];
    }
    if (needsStitchingColor(collectionType) && !colors.stitchingThreadColor) {
      console.error("Stitching thread color required but not found");
      return [];
    }

    // Generate regular variants
    let regularVariants = createRegularVariants(
      formState, 
      shapes, 
      styles, 
      productPrices, 
      collectionType, 
      skuInfo
    );

    // Assign positions to regular variants
    regularVariants = assignPositions(regularVariants, shapes);

    // Create custom variants
    const processedStyles = new Set();
    const customVariants = (await Promise.all(regularVariants.map(async (variant) => 
      createCustomVariants({
        variant,
        formState,
        shapes,
        leatherColors,
        collectionType,
        baseCustomVariant: {
          stitchingThreadId: variant.stitchingThreadId,
          amannNumberId: variant.amannNumberId,
          embroideryThreadId: variant.embroideryThreadId,
          isacordNumberId: variant.isacordNumberId
        },
        customPrice: (parseFloat(variant.price) + 15).toFixed(2),
        weight: variant.weight,
        skuInfo,
        leatherColor1: colors.leatherColor1,
        leatherColor2: colors.leatherColor2,
        processedStyles
      })
    ))).filter(Boolean);

    // Create static variant
    const createOwnSetVariant = {
      variantName: "Create my own set",
      price: "0.00",
      weight: "0.00",
      isCustom: true,
      position: regularVariants.length + 1,
      options: { Style: "Create my own set" }
    };

    // Combine all variants
    const allVariants = [
      ...regularVariants,
      createOwnSetVariant,
      ...customVariants.map((variant, index) => ({
        ...variant,
        position: regularVariants.length + 2 + index
      }))
    ];

    return allVariants;

  } catch (error) {
    console.error('Error generating variants:', error);
    return [];
  }
};