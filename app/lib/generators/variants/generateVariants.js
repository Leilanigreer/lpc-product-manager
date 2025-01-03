// app/lib/generators/variants/generateVariants.js

import { getColors } from "../../utils";
import { assignPositions } from "../../constants";
import { createRegularVariants } from './regular';
import { createCustomVariants } from './custom';

/**
 * Validates requirements based on validation rules from database
 * @param {Object} validationRules - Rules from database (JSON parsed)
 * @param {Object} formState - Current form state
 * @param {Object} colors - Selected colors
 * @returns {Object} Validation result {isValid: boolean, errors: string[]}
 */
const validateRules = (validationRules, formState, colors) => {
  if (!validationRules) return { isValid: true, errors: [] };

  try {
    const rules = typeof validationRules === 'string' 
      ? JSON.parse(validationRules) 
      : validationRules;

    const errors = [];
    
    if (rules.required) {
      for (const field of rules.required) {
        let isFieldValid = false;

        switch (field) {
          case 'leatherColor1':
            isFieldValid = !!colors.leatherColor1;
            break;
          case 'leatherColor2':
            isFieldValid = !!colors.leatherColor2;
            break;
          case 'stitchingThread':
            isFieldValid = !!colors.stitchingThreadColor?.selectedName;
            break;
          case 'embroideryThread':
            isFieldValid = !!colors.embroideryThreadColor?.selectedName;
            break;
          default:
            console.warn(`Unknown validation field: ${field}`);
            continue;
        }

        if (!isFieldValid) {
          errors.push(rules.errorMessages?.[field] || `${field} is required`);
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  } catch (error) {
    console.error('Error parsing validation rules:', error);
    return { isValid: false, errors: ['Invalid validation rules'] };
  }
};

/**
 * Validates style-specific requirements
 * @param {Object} collection - Database collection object
 * @param {Object} style - Selected style object
 * @param {Object} colors - Color selections
 * @param {Object} formState - Current form state
 * @returns {Object} Validation result {isValid: boolean, errors: string[]}
 */
const validateStyleRequirements = (collection, style, colors, formState) => {
  if (!style) return { isValid: true, errors: [] };

  const styleOverride = collection.styles?.find(s => s.id === style.value);
  if (!styleOverride) return { isValid: true, errors: [] };

  const styleValidation = validateRules(styleOverride.validation, formState, colors);
  if (!styleValidation.isValid) return styleValidation;

  const errors = [];
  
  if (styleOverride.overrideSecondaryLeather && !colors.leatherColor2) {
    errors.push(`Secondary leather required for ${style.label} style`);
  }
  
  if (styleOverride.overrideStitchingColor && !colors.stitchingThreadColor) {
    errors.push(`Stitching color required for ${style.label} style`);
  }

  if (styleOverride.overrideQClassicField && !formState.qClassicLeathers?.[style.value]) {
    errors.push(`Quilted leather selection required for ${style.label} style`);
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Validates collection-specific requirements
 * @param {Object} collection - Database collection object
 * @param {Object} colors - Selected colors object
 * @param {Object} formState - Current form state
 * @returns {Object} Validation result {isValid: boolean, errors: string[]}
 */
const validateCollectionRequirements = (collection, colors, formState) => {
  const errors = [];

  const collectionValidation = validateRules(collection.titleFormat?.validation, formState, colors);
  if (!collectionValidation.isValid) {
    errors.push(...collectionValidation.errors);
  }

  if (collection.needsSecondaryLeather && !colors.leatherColor2) {
    errors.push('Secondary leather color required for this collection');
  }

  if (collection.needsStitchingColor && !colors.stitchingThreadColor?.selectedNumber) {
    errors.push('Stitching thread number required for this collection');
  }

  if (collection.needsStyle) {
    const selectedStyles = Object.values(formState.selectedStyles || {});
    
    if (selectedStyles.length === 0) {
      errors.push('Style selection required for this collection');
    } else {
      for (const styleId of selectedStyles) {
        const style = collection.styles?.find(s => s.id === styleId);
        if (style) {
          const styleValidation = validateStyleRequirements(collection, style, colors, formState);
          errors.push(...styleValidation.errors);
        }
      }
    }
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Main function to generate variants for a product
 * @param {Object} formState - Current form state
 * @param {Array} leatherColors - Available leather colors
 * @param {Array} stitchingThreadColors - Available stitching thread colors
 * @param {Array} embroideryThreadColors - Available embroidery thread colors
 * @param {Array} shapes - Available shapes
 * @param {Array} styles - Available styles
 * @param {Array} productPrices - Product price configurations
 * @param {Array} shopifyCollections - Available Shopify collections
 * @param {Object} skuInfo - SKU generation information
 * @returns {Promise<Array>} Generated variants
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
  try {
    if (!formState?.selectedCollection || !Array.isArray(shopifyCollections)) {
      console.error("Missing form state or collections");
      return [];
    }

    const selectedCollection = shopifyCollections.find(
      col => col.value === formState.selectedCollection
    );
    
    if (!selectedCollection) {
      console.error("Selected collection not found");
      return [];
    }

    const colors = getColors(formState, leatherColors, stitchingThreadColors, embroideryThreadColors);
    const validation = validateCollectionRequirements(selectedCollection, colors, formState);

    if (!validation.isValid) {
      console.error('Validation failed:', validation.errors);
      return [];
    }

    let regularVariants = createRegularVariants(
      formState, 
      shapes, 
      styles, 
      productPrices, 
      selectedCollection,
      skuInfo
    );

    regularVariants = assignPositions(regularVariants, shapes);
    const processedStyles = new Set();

    const customVariants = (await Promise.all(regularVariants.map(async (variant) => 
      createCustomVariants({
        variant,
        formState,
        shapes,
        leatherColors,
        collection: selectedCollection,
        baseCustomVariant: {
          stitchingThread: variant.stitchingThreadId ? {
            id: variant.stitchingThreadId,
            number: variant.amannNumberId,
            name: colors.stitchingThreadColor?.selectedName
          } : null,
          embroideryThread: variant.embroideryThreadId ? {
            id: variant.embroideryThreadId,
            number: variant.isacordNumberId,
            name: colors.embroideryThreadColor?.selectedName
          } : null
        },
        customPrice: (parseFloat(variant.price) + 15).toFixed(2),
        weight: variant.weight,
        skuInfo,
        leatherColor1: colors.leatherColor1,
        leatherColor2: colors.leatherColor2,
        processedStyles,
      })
    ))).filter(Boolean);

    const createOwnSetVariant = {
      variantName: "Create my own set",
      price: "0.00",
      weight: "0.00",
      isCustom: true,
      position: regularVariants.length + 1,
      options: { Style: "Create my own set" }
    };

    return [
      ...regularVariants,
      createOwnSetVariant,
      ...customVariants.map((variant, index) => ({
        ...variant,
        position: regularVariants.length + 2 + index
      }))
    ];

  } catch (error) {
    console.error('Error generating variants:', error);
    return [];
  }
};