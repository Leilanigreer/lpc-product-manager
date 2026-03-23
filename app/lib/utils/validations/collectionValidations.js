/**
 * Validates collection object structure
 * @param {Object} formState - Current form state
 * @param {boolean} debug - Whether to log debug messages
 * @returns {boolean} True if valid, false if invalid
 */
export const validateCollection = (formState, debug = false) => {
  const { collection } = formState;

  if (!collection || typeof collection !== 'object') {
    if (debug) console.warn('No collection found in formState');
    return false;
  }

  const isShopifyCollection = collection.source === 'shopify';

  if (isShopifyCollection) {
    if (!collection.label || !collection.handle) {
      if (debug) console.warn('Shopify collection missing label or handle');
      return false;
    }
    const tf = collection.titleFormat;
    if (!tf || typeof tf !== 'object') {
      if (debug) console.warn('Shopify collection missing titleFormat');
      return false;
    }
    if (!String(tf.titleTemplate || '').trim()) {
      if (debug) console.warn('Shopify collection missing titleTemplate');
      return false;
    }
    if (!String(tf.seoTemplate || '').trim()) {
      if (debug) console.warn('Shopify collection missing seoTemplate');
      return false;
    }
    if (!String(tf.handleTemplate || '').trim()) {
      if (debug) console.warn('Shopify collection missing handleTemplate');
      return false;
    }
    const v = tf.validation;
    if (!v || typeof v !== 'object' || !Array.isArray(v.required) || v.errorMessages == null) {
      if (debug) console.warn('Shopify collection titleFormat.validation must be parsed JSON with required[] and errorMessages');
      return false;
    }
    return true;
  }

  // Legacy Postgres-shaped collection
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

  const requiredBooleanFlags = [
    'commonDescription',
    'needsSecondaryLeather',
    'needsStitchingColor',
    'needsColorDesignation',
    'stylePerCollection',
    'showInDropdown'
  ];

  const hasValidBooleanFlags = requiredBooleanFlags.every(flag => {
    const isBoolean = typeof collection[flag] === 'boolean';
    if (!isBoolean && debug) {
      console.warn(`Invalid boolean flag: ${flag}`);
    }
    return isBoolean;
  });

  if (!hasValidBooleanFlags) return false;

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
      ];

      const isValid = requiredStyleFields.every(field => {
        const hasField = Boolean(style[field]);
        if (!hasField && debug) {
          console.warn(`Style missing required field: ${field}`, style);
        }
        return hasField;
      });

      // Validate validation object if present (but don't require it)
      if (style.validation) {
        if (typeof style.validation !== 'object' || 
            !Array.isArray(style.validation.required) || 
            !style.validation.errorMessages) {
          if (debug) console.warn('Invalid validation structure in style');
          return false;
        }
      }

      return isValid;
    });

    if (!hasValidStyles) return false;
  }

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

  const { validation } = titleFormat;
  if (!validation || typeof validation !== 'object') {
    if (debug) console.warn('Missing or invalid validation in titleFormat');
    return false;
  }

  if (!Array.isArray(validation.required) || !validation.errorMessages) {
    if (debug) console.warn('Invalid validation structure in titleFormat');
    return false;
  }

  return true;
};
