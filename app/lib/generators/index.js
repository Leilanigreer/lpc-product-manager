// app/lib/generators/index.js

import { generateTitle, generateMainHandle, generateSEOTitle } from './titleGenerator';
import { generateProductType } from '../constants';
import { generateDescriptionHTML } from './htmlDescription';
import { generateSEODescription } from './seoDescription';
import { generateTags } from './tagsGenerator';
import { generateVariants } from './variants'; 
import { generateBaseParts, calculateVersionFormParts, getColors } from '../utils';

/**
 * @typedef {Object} ProductData
 * @property {string} title - Product title
 * @property {string} mainHandle - URL handle
 * @property {string} productType - Type of product
 * @property {string} seoTitle - SEO-optimized title
 * @property {string} descriptionHTML - HTML product description
 * @property {string} seoDescription - SEO-optimized description
 * @property {Array<string>} tags - Product tags
 * @property {Array<Object>} variants - Product variants
 */

/**
 * Generates complete product data by coordinating all generators
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
  shopifyCollections,
  commonDescription
) => {
  try {
    // Input validation
    if (!formState || !Array.isArray(leatherColors) || !Array.isArray(shopifyCollections)) {
      throw new Error('Missing required parameters for product generation');
    }

    // Get selected collection with its formatting templates
    const selectedCollection = shopifyCollections.find(
      col => col.value === formState.selectedCollection
    );
    
    if (!selectedCollection) {
      throw new Error('Selected collection not found');
    }

    const colors = getColors(formState, leatherColors, stitchingThreadColors, embroideryThreadColors);
    
    // Generate SKU parts and version
    const skuParts = generateBaseParts(selectedCollection, colors);
    
    if (!Array.isArray(skuParts) || skuParts.length === 0) {
      throw new Error('Failed to generate SKU parts');
    }

    const version = calculateVersionFormParts(skuParts, formState.existingProducts);
    const skuInfo = { parts: skuParts, version };

    console.log('Generated SKU Info:', skuInfo);

    // Generate all product components
    const [title, variants] = await Promise.all([
      generateTitle(
        formState,
        leatherColors,
        stitchingThreadColors,
        embroideryThreadColors,
        shopifyCollections
      ),
      generateVariants(
        formState,
        leatherColors,
        stitchingThreadColors,
        embroideryThreadColors,
        shapes,
        styles,
        productPrices,
        shopifyCollections,
        skuInfo
      )
    ]);

    if (!variants || variants.length === 0) {
      throw new Error('No variants generated');
    }

    return {
      title,
      mainHandle: await generateMainHandle(formState, title, shopifyCollections, version),
      productType: generateProductType(formState, shopifyCollections),
      seoTitle: await generateSEOTitle(formState, title, shopifyCollections),
      descriptionHTML: generateDescriptionHTML(formState, shopifyCollections, commonDescription),
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

  } catch (error) {
    console.error('Error generating product data:', error);
    throw error;
  }
};

// Re-export all generators for convenience
export * from './htmlDescription';
export * from './seoDescription';
export * from './tagsGenerator';
export * from './titleGenerator';
export * from './variants';