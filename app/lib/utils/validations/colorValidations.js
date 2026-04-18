/**
 * Validates leather color selections 
 */
export const validateLeatherColors = (formState, needsSecondaryColor, debug = false) => {
  const { leatherColors } = formState;
  
  if (!leatherColors) {
    if (debug) console.warn('No leatherColors found in formState');
    return false;
  }  

  const hasPrimary = leatherColors.primary?.value && 
                    leatherColors.primary?.label && 
                    leatherColors.primary?.abbreviation;

  if (!hasPrimary) {
    if (debug) console.warn('Primary leather validation failed', leatherColors.primary);
    return false;
  }

  if (!needsSecondaryColor) return true;

  const isValid = !!(leatherColors.secondary?.value && 
    leatherColors.secondary?.label && 
    leatherColors.secondary?.abbreviation
  );

  if (!isValid && debug) {
    console.warn('Secondary leather validation failed', leatherColors.secondary);
  }

  return isValid;
};

/**
 * Validates color designation object if present
 * @param {Object} designation - Color designation object to validate
 * @param {boolean} debug - Whether to log debug messages
 * @returns {boolean} True if valid
 */
export const validateColorDesignation = (designation, debug = false) => {
  if (!designation || typeof designation !== 'object') {
    if (debug) console.warn('Invalid color designation object:', designation);
    return false;
  }

  // Required fields that must be non-empty strings
  const requiredStringFields = ['value', 'label'];
  const hasRequiredFields = requiredStringFields.every(field => {
    const isValid = typeof designation[field] === 'string' && 
                   designation[field].length > 0;
    if (!isValid && debug) {
      console.warn(`Invalid ${field} in color designation:`, designation[field]);
    }
    return isValid;
  });

  return hasRequiredFields;
};

/**
 * Validates color designations for all shapes that need them
 * @param {Object} formState - Form state containing allShapes
 * @param {boolean} debug - Whether to log debug messages 
 * @returns {boolean} True if all required color designations are valid
 */
export const validateShapeColorDesignations = (formState, debug = false) => {
  if (!formState?.allShapes || typeof formState.allShapes !== 'object') {
    if (debug) console.warn('Invalid allShapes object:', formState?.allShapes);
    return false;
  }

  // Get shapes that are selected AND need color designation
  const shapesNeedingDesignation = Object.values(formState.allShapes)
    .filter(shape => shape.isSelected && shape.needsColorDesignation);

  if (shapesNeedingDesignation.length === 0) {
    // No shapes need color designation
    return true;
  }

  // Check that every shape needing designation has a valid one
  return shapesNeedingDesignation.every(shape => {
    const isValid = validateColorDesignation(shape.colorDesignation, debug);
    if (!isValid && debug) {
      console.warn(`Invalid color designation for shape ${shape.label}:`, shape.colorDesignation);
    }
    return isValid;
  });
};