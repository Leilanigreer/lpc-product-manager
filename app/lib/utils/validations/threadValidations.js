// app/lib/utils/validations/threadValidations.js

/**
 * Generic thread structure validator that works for both stitching and embroidery threads
 * @param {Object} thread - Thread object to validate
 * @param {string} threadType - Either 'stitching' or 'embroidery'
 * @param {boolean} debug - Whether to log debug messages
 * @returns {boolean} True if valid
 */
export const validateThreadStructure = (thread, threadType, debug = false) => {
  if (!thread || typeof thread !== 'object') {
    if (debug) console.warn(`Invalid ${threadType} thread object:`, thread);
    return false;
  }

  // Handle explicit "no embroidery" case
  if (threadType === 'embroidery' && thread.type === 'none') {
    return true;
  }

  // Only validate thread structure if it's marked as an actual thread
  if (!thread.isThread) {
    if (debug) console.warn(`Thread object not marked as isThread:`, thread);
    return false;
  }

  // Validate base fields that both thread types share
  const baseFields = ['value', 'label', 'abbreviation'];
  const hasBaseFields = baseFields.every(field => {
    const isValid = typeof thread[field] === 'string' && thread[field].length > 0;
    if (!isValid && debug) {
      console.warn(`Missing or invalid ${field} in thread:`, thread[field]);
    }
    return isValid;
  });

  if (!hasBaseFields) return false;

  // Validate colorTags if present
  if (thread.colorTags) {
    if (!Array.isArray(thread.colorTags)) {
      if (debug) console.warn(`${threadType} colorTags is not an array:`, thread);
      return false;
    }

    const hasValidColorTags = thread.colorTags.every(tag => 
      tag && typeof tag === 'object' && tag.value && tag.label
    );

    if (!hasValidColorTags) {
      if (debug) console.warn(`Invalid color tags in ${threadType}:`, thread.colorTags);
      return false;
    }
  }

  // Validate thread-specific number arrays
  const numberArrayKey = threadType === 'stitching' ? 'amannNumbers' : 'isacordNumbers';
  const numbers = thread[numberArrayKey];

  if (!Array.isArray(numbers) || numbers.length === 0) {
    if (debug) console.warn(`Invalid or empty ${numberArrayKey} array:`, numbers);
    return false;
  }

  const hasValidNumbers = numbers.every(number => {
    const isValid = number &&
                   typeof number === 'object' &&
                   typeof number.value === 'string' &&
                   typeof number.label === 'string';
    if (!isValid && debug) {
      console.warn(`Invalid ${threadType} number:`, number);
    }
    return isValid;
  });

  return hasValidNumbers;
};

/**
 * Validates stitching thread color(s) 
 */
export const validateStitchingThreads = (formState, debug = false) => {
  const { stitchingThreads } = formState;

  if (!stitchingThreads || typeof stitchingThreads !== 'object') {
    if (debug) console.warn('No stitchingThreads found in formState or invalid type');
    return false;
  }

  // Check if stitchingThreads is empty
  const threadEntries = Object.entries(stitchingThreads);
  if (threadEntries.length === 0) {
    if (debug) console.warn('stitchingThreads is empty');
    return false;
  }

  // Validate each thread entry using the shared structure validator
  return threadEntries.every(([_, thread]) => 
    validateThreadStructure(thread, 'stitching', debug)
  );
};

/**
 * Validates that a valid thread mode is selected
 * @param {Object} formState - Current form state
 * @param {boolean} debug - Whether to log debug messages
 * @returns {boolean} True if valid thread mode is selected
 */
export const validateThreadMode = (formState, debug = false) => {
  if (debug) {
    console.group('Thread Mode Validation');
    console.log('Checking thread mode:', formState?.threadMode);
  }

  // Ensure threadMode exists and has embroidery property
  if (!formState?.threadMode?.embroidery) {
    if (debug) {
      console.warn('No valid thread mode selected');
      console.groupEnd();
    }
    return false;
  }

  // Validate that mode is either 'global' or 'perShape'
  const isValid = ['global', 'perShape'].includes(formState.threadMode.embroidery);
  
  if (debug) {
    if (isValid) {
      console.log('Thread mode validation passed');
    } else {
      console.warn('Invalid thread mode:', formState.threadMode.embroidery);
    }
    console.groupEnd();
  }

  return isValid;
};

/**
 * Validates global embroidery color object structure
 */
export const validateGlobalEmbroideryThread = (formState, debug = false) => {

  // First validate thread mode
  if (!validateThreadMode(formState, debug)) {
    return false;
  }

  // Early return true if not using global embroidery mode
  if (formState?.threadMode?.embroidery !== 'global') {
    return true;
  }

  return validateThreadStructure(formState.globalEmbroideryThread, 'embroidery', debug);
};

/**
 * Validates embroidery threads for all shapes that need them
 */
export const validateShapeEmbroideryThreads = (formState, debug = false) => {
  // First validate thread mode
  if (!validateThreadMode(formState, debug)) {
    return false;
  }

  // Skip validation if not using per-shape embroidery
  if (formState?.threadMode?.embroidery !== 'perShape') {
    return true;
  }

  if (!formState?.allShapes || typeof formState.allShapes !== 'object') {
    if (debug) console.warn('Invalid allShapes object:', formState?.allShapes);
    return false;
  }

  // Get selected shapes that aren't putters (putters don't need embroidery)
  const shapesNeedingEmbroidery = Object.values(formState.allShapes)
    .filter(shape => shape.isSelected && shape.shapeType !== 'PUTTER');

  if (shapesNeedingEmbroidery.length === 0) {
    return true;
  }

  // Check that every applicable shape has a valid embroidery thread
  return shapesNeedingEmbroidery.every(shape => 
    validateThreadStructure(shape.embroideryThread, 'embroidery', debug)
  );
};

/**
 * Validates all thread-related requirements
 */
export const validateThreads = (formState, debug = false) => {
  // First validate thread mode
  if (!validateThreadMode(formState, debug)) {
    if (debug) console.warn('Thread mode validation failed');
    return false;
  }

  // Always validate stitching threads
  if (!validateStitchingThreads(formState, debug)) {
    if (debug) console.warn('Stitching threads validation failed');
    return false;
  }

  // Validate global embroidery if in global mode
  if (formState?.threadMode?.embroidery === 'global') {
    if (!validateGlobalEmbroideryThread(formState, debug)) {
      if (debug) console.warn('Global embroidery thread validation failed');
      return false;
    }
  }

  // Validate per-shape embroidery if in perShape mode
  if (formState?.threadMode?.embroidery === 'perShape') {
    if (!validateShapeEmbroideryThreads(formState, debug)) {
      if (debug) console.warn('Shape embroidery threads validation failed');
      return false;
    }
  }

  return true;
};