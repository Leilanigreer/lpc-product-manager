export const validateFinalRequirements = (formState) => {
  const { finalRequirements } = formState;

  if (!finalRequirements || typeof finalRequirements !== 'object') {
    return false;
  }

  // Required string fields check
  const requiredStringFields = [
    'handleTemplate',
    'namePattern',
    'seoTemplate',
    'titleTemplate',
    'skuPattern'
  ];

  const hasRequiredStrings = requiredStringFields.every(field => 
    typeof finalRequirements[field] === 'string' && 
    finalRequirements[field].length > 0
  );

  if (!hasRequiredStrings) {
    return false;
  }

  // Boolean fields check
  const requiredBooleanFields = [
    'needsColorDesignation',
    'needsSecondaryLeather',
    'needsStitchingColor'
  ];

  const hasValidBooleans = requiredBooleanFields.every(field => 
    typeof finalRequirements[field] === 'boolean'
  );

  if (!hasValidBooleans) {
    return false;
  }

  // Validation object check
  const { validation } = finalRequirements;
  if (!validation || typeof validation !== 'object') {
    return false;
  }

  // Required array check
  if (!Array.isArray(validation.required)) {
    return false;
  }

  // Error messages check
  if (!validation.errorMessages || typeof validation.errorMessages !== 'object') {
    return false;
  }

  // Check matching errors
  const hasMatchingErrors = validation.required.every(field => 
    !!validation.errorMessages[field]
  );

  if (!hasMatchingErrors) {
    return false;
  }

  return true;
};