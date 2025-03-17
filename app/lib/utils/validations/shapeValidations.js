// app/lib/utils/validations/shapeValidations.js

/**
 * Validates shape object has required base properties
 * @param {Object} shape - Shape object to validate
 * @param {boolean} debug - Whether to log debug messages
 * @returns {boolean} True if valid
 */
const validateShapeProperties = (shape, debug = false) => {
  if (debug) {
    console.group('Shape Properties Validation');
    console.log('Validating shape:', shape);
  }

  if (!shape || typeof shape !== 'object') {
    if (debug) {
      console.warn('Invalid shape object:', shape);
      console.groupEnd();
    }
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
    const isValid = value !== undefined && 
                   value !== null && 
                   config.validate(value);

    if (debug && !isValid) {
      console.warn(`Field "${field}" validation failed:`, {
        expected: config.type,
        got: typeof value,
        value,
        shape
      });
    }
    return isValid;
  });

  if (debug) {
    if (isValid) {
      console.log('Shape properties validation passed');
    } else {
      console.warn('Shape properties validation failed');
    }
    console.groupEnd();
  }

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
    if (debug) console.warn('Invalid allShapes object:', formState?.allShapes);
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
    if (debug) console.warn('Invalid allShapes object:', formState?.allShapes);
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
  if (debug) {
    console.group('Shape Validation');
    console.log('Current formState:', formState);
  }

  // Validate at least one shape is selected
  const selectionResult = validateShapeSelection(formState, debug);
  if (!selectionResult.isValid) {
    if (debug) {
      console.warn('Shape selection validation failed:', selectionResult.error);
      console.groupEnd();
    }
    return selectionResult;
  }

  // Get selected shapes
  const selectedShapes = Object.values(formState.allShapes)
    .filter(shape => shape.isSelected);

  if (debug) {
    console.log('Selected shapes:', selectedShapes);
  }

  // Validate properties of selected shapes
  const invalidProperties = selectedShapes.filter(shape => 
    !validateShapeProperties(shape, debug)
  );

  if (invalidProperties.length > 0) {
    const error = {
      isValid: false,
      error: `Invalid properties for shapes: ${
        invalidProperties.map(s => s.label).join(', ')
      }`
    };
    if (debug) {
      console.warn('Invalid shape properties:', invalidProperties);
      console.groupEnd();
    }
    return error;
  }

  // Validate weights
  const weightValidation = validateShapeWeights(formState, debug);
  if (!weightValidation.isValid) {
    if (debug) {
      console.warn('Weight validation failed:', weightValidation.error);
      console.groupEnd();
    }
    return weightValidation;
  }

  if (debug) {
    console.log('All shape validations passed');
    console.groupEnd();
  }

  return { isValid: true, error: null };
};