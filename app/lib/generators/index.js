// app/lib/generators/index.js
import { generateTitle, generateMainHandle, generateSEOTitle } from './titleGenerator';
import { generateProductType } from '../constants';
import { generateDescriptionHTML } from './htmlDescription';
import { generateSEODescription } from './seoDescription';
import { generateTags } from './tagsGenerator';
import { generateVariants } from './variantGenerator';
import { generateBaseParts, calculateVersionFormParts, getColors, getCollectionType } from '../utils';

/**
 * Generates complete product data by coordinating all generators
 * @param {Object} formState - Current form state
 * @param {Array} leatherColors - Available leather colors
 * @param {Array} stitchingThreadColors - Available stitching thread colors
 * @param {Array} embroideryThreadColors - Available embroidery thread colors
 * ... other params
 * @returns {Object} Complete product data object
 */
export const generateProductData = async (
  formState,
  leatherColors,
  stitchingThreadColors,
  embroideryThreadColors,
  colorTags,
  shapes,
  styles,
  productPrices,
  shopifyCollections
) => {
  const colors = getColors(formState, leatherColors, stitchingThreadColors, embroideryThreadColors);
  const collectionType = getCollectionType(formState, shopifyCollections);
  
  // Generate SKU parts and version
  const skuParts = generateBaseParts(collectionType, colors);
  const version = calculateVersionFormParts(skuParts, formState.existingProducts);
  
  // Create base SKU info
  const skuInfo = {
    parts: skuParts,
    version: version
  };

  console.log('Generated SKU Info:', skuInfo); // Add debugging

  const title = generateTitle(formState, leatherColors, stitchingThreadColors, embroideryThreadColors, shopifyCollections);

  const variants = await generateVariants(
    formState,
    leatherColors,
    stitchingThreadColors,
    embroideryThreadColors,
    shapes,
    styles,
    productPrices,
    shopifyCollections,
    skuInfo
  );

  return {
    title,
    mainHandle: generateMainHandle(formState, title, shopifyCollections, version),
    productType: generateProductType(formState, shopifyCollections),
    seoTitle: generateSEOTitle(formState, title, shopifyCollections),
    descriptionHTML: generateDescriptionHTML(formState, shopifyCollections),
    seoDescription: generateSEODescription(formState, shopifyCollections),
    tags: generateTags(formState, leatherColors, embroideryThreadColors, stitchingThreadColors, colorTags),
    variants,

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
export * from './htmlDescription';
export * from './seoDescription';
export * from './tagsGenerator';
export * from './titleGenerator';
export * from './variantGenerator';
