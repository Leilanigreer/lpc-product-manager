// app/lib/generators/index.js

import { generateTitle, generateMainHandle, generateSEOTitle } from './titleGenerator';
import { generateDescriptionHTML } from './htmlDescription';
import { generateSEODescription } from './seoDescription';
import { generateTags } from './tagsGenerator';
import { generateVariants } from './variants'; 
import { generateBaseParts, calculateVersionFromParts } from '../utils';

/**
 * Generates complete product data by coordinating all generators
 */
export const generateProductData = async (formState, commonDescription) => {
  try {
    // Generate SKU information
    const skuParts = generateBaseParts(formState);    
    if (!Array.isArray(skuParts) || skuParts.length === 0) {
      throw new Error('Failed to generate SKU parts');
    }

    const version = calculateVersionFromParts(skuParts, formState.existingProducts);
    const skuInfo = { parts: skuParts, version };

    // Generate title and variants in parallel
    const [title, variants] = await Promise.all([
      generateTitle(formState),
      generateVariants(formState, skuInfo)
    ]);

    if (!variants || variants.length === 0) {
      throw new Error('No variants generated');
    }

    // Build the complete product data object
    const productData = {
      title,
      mainHandle: await generateMainHandle(formState, title, version),
      productType: formState.collection.label || '',
      seoTitle: await generateSEOTitle(formState, title),
      descriptionHTML: generateDescriptionHTML(formState, commonDescription),
      seoDescription: generateSEODescription(formState),
      tags: generateTags(formState),
      variants,
      
      // Database fields
      collection: formState.collection,
      selectedFont: formState.selectedFont,
      offeringType: formState.selectedOfferingType,
      limitedEditionQuantity: formState.limitedEditionQuantity || null,
      
      // Color and thread selections
      selectedLeatherColor1: formState.leatherColors.primary.value,
      selectedLeatherColor2: formState.leatherColors?.secondary?.value || null,
      stitchingThreads: formState.stitchingThreads,
      
      createdAt: new Date().toISOString()
    };

    return productData;

  } catch (error) {
    console.error('Product data generation failed:', error);
    throw error;
  }
};

// Re-export all generators for convenience
export * from './htmlDescription';
export * from './seoDescription';
export * from './tagsGenerator';
export * from './titleGenerator';
export * from './variants';