// app/lib/utils/validations/shapeValidations.js

/**
 * Validates shape object has required base properties
 * @param {Object} shape - Shape object to validate
 * @param {boolean} debug - Whether to log debug messages
 * @returns {boolean} True if valid
 */
const validateShapeProperties = (shape, debug = false) => {
  if (!shape || typeof shape !== 'object') {
    return false;
  }

  // Required shape properties with their expected types and validation rules
  const requiredFields = {
    value: {
      type: 'string',
      validate: value => typeof value === 'string' && value.length > 0
    },
    label: {
      type: 'string',
      validate: value => typeof value === 'string' && value.length > 0
    },
    abbreviation: {
      type: 'string',
      validate: value => typeof value === 'string' && value.length > 0
    },
    shapeType: {
      type: 'string',
      validate: value => typeof value === 'string' && value.length > 0
    },
    displayOrder: {
      type: 'number',
      validate: value => typeof value === 'number' && !isNaN(value)
    },
    isActive: {
      type: 'boolean',
      validate: value => typeof value === 'boolean'
    }
  };

  const isValid = Object.entries(requiredFields).every(([field, config]) => {
    const value = shape[field];
    return value !== undefined && 
           value !== null && 
           config.validate(value);
  });

  return isValid;
};

/**
 * Validates that at least one shape is selected
 * @param {Object} formState - Current form state
 * @param {boolean} debug - Whether to log debug messages
 * @returns {Object} Validation result with isValid and error message
 */
export const validateShapeSelection = (formState, debug = false) => {
  if (!formState?.allShapes || typeof formState.allShapes !== 'object') {
    return {
      isValid: false,
      error: 'Shape configuration is missing'
    };
  }

  // Check if any shapes are selected
  const hasSelectedShape = Object.values(formState.allShapes)
    .some(shape => shape.isSelected);

  return {
    isValid: hasSelectedShape,
    error: hasSelectedShape ? null : 'At least one shape must be selected'
  };
};

/**
 * Validates weights for selected shapes
 * @param {Object} formState - Current form state
 * @param {boolean} debug - Whether to log debug messages
 * @returns {Object} Validation result with isValid and error message
 */
export const validateShapeWeights = (formState, debug = false) => {
  if (!formState?.allShapes || typeof formState.allShapes !== 'object') {
    return {
      isValid: false,
      error: 'Shape configuration is missing'
    };
  }

  const selectedShapes = Object.values(formState.allShapes)
    .filter(shape => shape.isSelected);

  // Validate weights for selected shapes
  const invalidShapes = selectedShapes.filter(shape => {
    const weight = parseFloat(shape.weight);
    return isNaN(weight) || weight <= 0;
  });

  const isValid = invalidShapes.length === 0;
  return {
    isValid,
    error: isValid ? null : 
      `Invalid weight${invalidShapes.length > 1 ? 's' : ''} for: ${
        invalidShapes.map(s => s.label).join(', ')
      }`
  };
};

/**
 * Validates all shape-related requirements
 * @param {Object} formState - Current form state
 * @param {boolean} debug - Whether to log debug messages
 * @returns {Object} Validation result
 */
export const validateShapes = (formState, debug = false) => {
  // Validate at least one shape is selected
  const selectionResult = validateShapeSelection(formState, debug);
  if (!selectionResult.isValid) {
    return selectionResult;
  }

  // Get selected shapes
  const selectedShapes = Object.values(formState.allShapes)
    .filter(shape => shape.isSelected);

  // Validate properties of selected shapes
  const invalidProperties = selectedShapes.filter(shape => 
    !validateShapeProperties(shape, debug)
  );

  if (invalidProperties.length > 0) {
    return {
      isValid: false,
      error: `Invalid properties for shapes: ${
        invalidProperties.map(s => s.label).join(', ')
      }`
    };
  }

  // Validate weights
  const weightValidation = validateShapeWeights(formState, debug);
  if (!weightValidation.isValid) {
    return weightValidation;
  }

  return { isValid: true, error: null };
};