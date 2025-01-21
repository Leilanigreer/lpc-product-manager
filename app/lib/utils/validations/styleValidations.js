// app/lib/utils/validations/styleValidations.js

/**
 * Enum for valid style name patterns
 * @enum {string}
 */
const StyleNamePattern = {
  STANDARD: 'STANDARD',   // "{leather.label} {style.leatherPhrase} {style.label}"
  STYLE_FIRST: 'STYLE_FIRST', // "{style.label} with {leather.label} {style.leatherPhrase}"
  CUSTOM: 'CUSTOM'       // Uses custom pattern
};

/**
 * Validates style object (used for both global and per-shape styles)
 * @param {Object} style - Style object to validate
 * @param {boolean} debug - Whether to log debug messages
 * @returns {boolean} True if valid
 */
const validateStyle = (style, debug = false) => {
  if (!style || typeof style !== 'object') {
    if (debug) console.warn('Invalid style object:', style);
    return false;
  }

  // Required string fields
  const requiredStringFields = {
    value: 'string',
    label: 'string',
    abbreviation: 'string'
  };

  const hasRequiredStrings = Object.entries(requiredStringFields).every(([field, type]) => {
    const value = style[field];
    const isValid = value !== undefined && 
                   value !== null && 
                   typeof value === type && 
                   value.length > 0;

    if (!isValid && debug) {
      console.warn(`Invalid ${field} in style:`, { expected: type, got: typeof value, value });
    }
    return isValid;
  });

  if (!hasRequiredStrings) return false;

  // Validate namePattern enum
  const hasValidNamePattern = Object.values(StyleNamePattern).includes(style.namePattern);
  if (!hasValidNamePattern) {
    if (debug) console.warn('Invalid namePattern:', style.namePattern);
    return false;
  }

  // Validate useOppositeLeather boolean
  if (typeof style.useOppositeLeather !== 'boolean') {
    if (debug) console.warn('Invalid useOppositeLeather:', style.useOppositeLeather);
    return false;
  }

  // Validate leatherPhrase exists (can be null)
  if (!('leatherPhrase' in style)) {
    if (debug) console.warn('Missing leatherPhrase field');
    return false;
  }

  return true;
};

/**
 * Validates styles for all shapes that need them
 * @param {Object} formState - Form state containing allShapes
 * @param {boolean} debug - Whether to log debug messages
 * @returns {boolean} True if all required styles are valid
 */
export const validateShapeStyles = (formState, debug = false) => {
  // Skip validation if not using per-shape styles
  if (formState?.styleMode !== 'independent') {
    return true;
  }

  if (!formState?.allShapes || typeof formState.allShapes !== 'object') {
    if (debug) console.warn('Invalid allShapes object:', formState?.allShapes);
    return false;
  }

  // Get selected shapes that need styles (not putters)
  const shapesNeedingStyles = Object.values(formState.allShapes)
    .filter(shape => shape.isSelected && shape.shapeType !== 'PUTTER');

  if (shapesNeedingStyles.length === 0) {
    return true;
  }

  // Check that every applicable shape has a valid style
  return shapesNeedingStyles.every(shape => {
    const isValid = validateStyle(shape.style, debug);
    if (!isValid && debug) {
      console.warn(`Invalid style for shape ${shape.label}:`, shape.style);
    }
    return isValid;
  });
};

/**
 * Validates global style configuration
 * @param {Object} formState - Current form state
 * @param {boolean} debug - Whether to log debug messages
 * @returns {boolean} True if valid, or not using global styles
 */
export const validateGlobalStyle = (formState, debug = false) => {
  // Skip validation if not using global style mode
  if (formState?.styleMode !== 'global') {
    return true;
  }

  return validateStyle(formState.globalStyle, debug);
};

/**
 * Validates all style-related requirements
 * @param {Object} formState - Current form state
 * @param {boolean} debug - Whether to log debug messages
 * @returns {boolean} True if all style validations pass
 */
export const validateStyles = (formState, debug = false) => {
  // Skip all style validation if collection doesn't need styles
  if (!formState?.collection?.needsStyle) {
    return true;
  }

  // Validate style mode is selected
  if (!formState?.styleMode) {
    if (debug) console.warn('Style mode not selected');
    return false;
  }

  // Validate global style if in global mode
  if (formState.styleMode === 'global') {
    if (!validateGlobalStyle(formState, debug)) {
      if (debug) console.warn('Global style validation failed');
      return false;
    }
  }

  // Validate per-shape styles if in independent mode
  if (formState.styleMode === 'independent') {
    if (!validateShapeStyles(formState, debug)) {
      if (debug) console.warn('Shape styles validation failed');
      return false;
    }
  }

  return true;
};