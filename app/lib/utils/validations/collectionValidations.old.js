/**
 * Validates collection object structure
 * @param {Object} formState - Current form state
 * @param {boolean} debug - Whether to log debug messages
 * @returns {boolean} True if valid, false if invalid
 */
export const validateCollection = (formState, debug = false) => {
  const { collection } = formState;

  // Check if collection exists and is an object
  if (!collection || typeof collection !== 'object') {
    if (debug) console.warn('No collection found in formState');
    return false;
  }

  // Required base fields
  const requiredBaseFields = [
    'value',
    'label',
    'handle',
    'shopifyId',
    'admin_graphql_api_id',
    'description'
  ];

  const hasRequiredBaseFields = requiredBaseFields.every(field => {
    const hasField = Boolean(collection[field]);
    if (!hasField && debug) {
      console.warn(`Missing required base field: ${field}`);
    }
    return hasField;
  });

  if (!hasRequiredBaseFields) return false;

  // Required boolean flags
  const requiredBooleanFlags = [
    'commonDescription',
    'needsSecondaryLeather',
    'needsStitchingColor',
    'needsStyle',
    'showInDropdown',
    'stylePerCollection'
  ];

  const hasValidBooleanFlags = requiredBooleanFlags.every(flag => {
    const isBoolean = typeof collection[flag] === 'boolean';
    if (!isBoolean && debug) {
      console.warn(`Invalid boolean flag: ${flag}`);
    }
    return isBoolean;
  });

  if (!hasValidBooleanFlags) return false;

  // Validate prices array
  if (!Array.isArray(collection.prices)) {
    if (debug) console.warn('Prices is not an array');
    return false;
  }

  const hasValidPrices = collection.prices.every(price => {
    const isValid = 
      price.value &&
      typeof price.shopifyPrice === 'number' &&
      typeof price.higherPrice === 'number' &&
      price.shapeId;
    
    if (!isValid && debug) {
      console.warn('Invalid price object:', price);
    }
    return isValid;
  });

  if (!hasValidPrices) return false;

  // Validate styles array if needsStyle is true
  if (collection.needsStyle) {
    if (!Array.isArray(collection.styles)) {
      if (debug) console.warn('Styles is not an array');
      return false;
    }

    const hasValidStyles = collection.styles.every(style => {
      const requiredStyleFields = [
        'value',
        'id',
        'label',
        'abbreviation',
        'stylePerShape'
      ];

      const isValid = requiredStyleFields.every(field => {
        const hasField = Boolean(style[field]);
        if (!hasField && debug) {
          console.warn(`Style missing required field: ${field}`, style);
        }
        return hasField;
      });

      return isValid;
    });

    if (!hasValidStyles) return false;
  }

  // Validate titleFormat object
  const { titleFormat } = collection;
  if (!titleFormat || typeof titleFormat !== 'object') {
    if (debug) console.warn('Missing or invalid titleFormat');
    return false;
  }

  const requiredTitleFormatFields = [
    'handleTemplate',
    'seoTemplate',
    'titleTemplate'
  ];

  const hasValidTitleFormat = requiredTitleFormatFields.every(field => {
    const hasField = Boolean(titleFormat[field]);
    if (!hasField && debug) {
      console.warn(`TitleFormat missing required field: ${field}`);
    }
    return hasField;
  });

  if (!hasValidTitleFormat) return false;

  // Validate validation object in titleFormat
  const { validation } = titleFormat;
  if (!validation || typeof validation !== 'object') {
    if (debug) console.warn('Missing or invalid validation in titleFormat');
    return false;
  }

  if (!Array.isArray(validation.required) || !validation.errorMessages) {
    if (debug) console.warn('Invalid validation structure in titleFormat');
    return false;
  }

  // All validations passed
  return true;
};