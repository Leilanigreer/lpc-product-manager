// app/lib/utils/validations/index.js

import { validateBaseRequirements } from './baseValidations';
import { validateCollection } from './collectionValidations';
import { validateLeatherColors, validateShapeColorDesignations } from './colorValidations';
import { validateShapes } from './shapeValidations';
import { validateGlobalEmbroideryThread, validateStitchingThreads, validateShapeEmbroideryThreads } from './threadValidations';
import { validateFinalRequirements } from './requirementValidations';
import { validateGlobalStyle, validateShapeStyles } from './styleValidations';

/**
 * Main validation function that checks all form requirements
 * @param {Object} formState - Current form state
 * @param {Object} options - Validation options
 * @param {boolean} options.debug - Whether to enable debug logging
 * @returns {Object} Validation results with details
 */
export const validateProductForm = (formState, { debug = false } = {}) => {
  if (debug) console.group('Product Form Validation');
  
  const errors = [];
  const validations = {};

  try {
    // Validate essential form state
    if (!formState?.collection || !formState?.finalRequirements) {
      throw new Error('Missing required form state properties');
    }

    // Base Requirements
    const baseValidation = validateBaseRequirements(formState);
    Object.assign(validations, baseValidation);
    
    if (!baseValidation.hasOfferingType) {
      errors.push('Product type must be selected');
    }
    if (!baseValidation.hasFontSelected) {
      errors.push('Font must be selected');
    }
    if (!baseValidation.hasValidQuantity) {
      errors.push('Valid quantity required for limited edition');
    }

    // Collection Validation
    validations.hasValidCollection = validateCollection(formState, debug);
    if (!validations.hasValidCollection) {
      errors.push('Invalid collection configuration');
    }

    // Color Validations
    validations.hasValidLeatherColors = validateLeatherColors(
      formState, 
      formState.finalRequirements.needsSecondaryLeather,
      debug
    );
    if (!validations.hasValidLeatherColors) {
      errors.push('Invalid leather color configuration');
    }

    validations.hasValidColorDesignations = validateShapeColorDesignations(formState, debug);
    if (!validations.hasValidColorDesignations) {
      errors.push('Invalid color designations for shapes');
    }

    // Shape Validations
    validations.hasValidShapes = validateShapes(formState, debug);
    if (!validations.hasValidShapes) {
      errors.push('Invalid shape configuration');
    }

    // Style Validations
    if (formState.collection.needsStyle) {
      validations.hasValidGlobalStyle = validateGlobalStyle(formState, debug);
      validations.hasValidShapeStyles = validateShapeStyles(formState, debug);
      
      if (!validations.hasValidGlobalStyle && formState.styleMode === 'global') {
        errors.push('Invalid global style configuration');
      }
      if (!validations.hasValidShapeStyles && formState.styleMode === 'independent') {
        errors.push('Invalid shape-specific styles');
      }
    }

    // Thread Validations
    validations.hasValidStitchingThreads = validateStitchingThreads(formState, debug);
    if (!validations.hasValidStitchingThreads) {
      errors.push('Invalid stitching thread configuration');
    }

    validations.hasValidGlobalEmbroidery = validateGlobalEmbroideryThread(formState, debug);
    if (formState.threadMode?.embroidery === 'global' && !validations.hasValidGlobalEmbroidery) {
      errors.push('Invalid global embroidery thread');
    }

    validations.hasValidShapeEmbroidery = validateShapeEmbroideryThreads(formState, debug);
    if (formState.threadMode?.embroidery === 'perShape' && !validations.hasValidShapeEmbroidery) {
      errors.push('Invalid shape-specific embroidery threads');
    }

    // Final Requirements
    validations.hasValidRequirements = validateFinalRequirements(formState, debug);
    if (!validations.hasValidRequirements) {
      errors.push('Invalid final requirements configuration');
    }

  } catch (error) {
    if (debug) console.error('Validation error:', error);
    errors.push(error.message);
  } finally {
    if (debug) console.groupEnd();
  }

  const isValid = errors.length === 0 && 
                 Object.values(validations).every(Boolean);

  return {
    isValid,
    validations,
    ...(errors.length > 0 && { errors })
  };
};

/**
 * Helper function to check if product data can be generated
 * @param {Object} formState - Current form state
 * @returns {boolean} Whether product data can be generated
 */
export const canGenerateProductData = (formState) => {
  if (!formState?.collection || !formState?.finalRequirements) return false;
  const { isValid } = validateProductForm(formState);
  return isValid;
};

// Export all individual validations
export * from './baseValidations';
export * from './collectionValidations';
export * from './colorValidations';
export * from './styleValidations';
export * from './threadValidations';
export * from './shapeValidations';
export * from './requirementValidations';