// app/lib/generators/index.js
import { generateTitle, generateMainHandle, generateSEOTitle } from './titleGenerator';
import { generateProductType } from '../constants';
import { generateDescriptionHTML } from './htmlDescription';
import { generateSEODescription } from './seoDescription';
import { generateTags } from './tagsGenerator';
import { generateVariants } from './variantGenerator';

/**
 * Generates complete product data by coordinating all generators
 * @param {Object} formState - Current form state
 * @param {Array} leatherColors - Available leather colors
 * @param {Array} stitchingThreadColor - Available stitching thread colors
 * @param {Array} embroideryThreadColor - Available embroidery thread colors
 * ... other params
 * @returns {Object} Complete product data object
 */
export const generateProductData = async (
  formState,
  leatherColors,
  stitchingThreadColor,
  embroideryThreadColor,
  colorTags,
  shapes,
  styles,
  productPrices,
  shopifyCollections,
  amannNumbers,
  isacordNumbers,
  productDataLPC
) => {
  const title = generateTitle(formState, leatherColors, stitchingThreadColor, embroideryThreadColor, shopifyCollections);
  
  return {
    title,
    mainHandle: generateMainHandle(formState, title, shopifyCollections),
    productType: generateProductType(formState, shopifyCollections),
    seoTitle: generateSEOTitle(formState, title, shopifyCollections),
    descriptionHTML: generateDescriptionHTML(formState, shopifyCollections),
    seoDescription: generateSEODescription(formState, shopifyCollections),
    tags: generateTags(formState, leatherColors, embroideryThreadColor, stitchingThreadColor, colorTags),
    variants: await generateVariants(formState, leatherColors, stitchingThreadColor, embroideryThreadColor, shapes, styles, productPrices, shopifyCollections, amannNumbers, isacordNumbers, productDataLPC),

    // Database fields
    collectionId: formState.selectedCollection,
    selectedFont: formState.selectedFont,
    offeringType: formState.selectedOfferingType,
    limitedEditionQuantity: formState.limitedEditionQuantity || null,
    
    // Metadata
    selectedLeatherColor1: formState.selectedLeatherColor1,
    selectedLeatherColor2: formState.selectedLeatherColor2,
    selectedStitchingColor: formState.selectedStitchingColor,
    selectedEmbroideryColor: formState.selectedEmbroideryColor,
    
    createdAt: new Date().toISOString(),
  };
};

// Re-export all generators for convenience
export * from './titleGenerator';
export * from './htmlDescription';
export * from './seoDescription';
export * from './tagsGenerator';
export * from './variantGenerator';
export * from './skuGenerator';