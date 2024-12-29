// app/lib/generators/variants/generateVariants.js

import { getColors, getCollectionType, needsSecondaryColor, needsStitchingColor } from "../../utils";
import { assignPositions } from "../../constants";
import { createRegularVariants } from './regular';
import { createCustomVariants } from './custom';

/**
 * Main function to generate all variants for a product
 */
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
  // Initial validation
  if (!formState || !leatherColors || !stitchingThreadColors || !embroideryThreadColors || 
      !shapes || !productPrices || !shopifyCollections) {
    return [];
  }

  const { leatherColor1, leatherColor2, stitchingThreadColor } = getColors(
    formState, leatherColors, stitchingThreadColors, embroideryThreadColors
  );
  const collectionType = getCollectionType(formState, shopifyCollections);

  // Validate collection-specific requirements
  if (!leatherColor1) return [];
  if (needsSecondaryColor(collectionType) && !leatherColor2) {
    console.error("Secondary leather color required but not found");
    return [];
  }
  if (needsStitchingColor(collectionType) && !stitchingThreadColor) {
    console.error("Stitching thread color required but not found");
    return [];
  }

  // Generate variants
  let variants = createRegularVariants(formState, shapes, styles, productPrices, collectionType, skuInfo);
  variants = assignPositions(variants, shapes);

  const customVariants = await createCustomVariants({
    variants,
    formState,
    shapes,
    leatherColors,
    collectionType,
    skuInfo
  });

  const createOwnSetVariant = {
    variantName: "Create my own set",
    price: 0,
    weight: 0,
    isCustom: true,
    position: variants.length + 1,
    options: { Style: "Create my own set" }
  };

  return [
    ...variants,
    createOwnSetVariant,
    ...customVariants
  ];
};