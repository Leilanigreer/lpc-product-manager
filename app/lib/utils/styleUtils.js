// app/lib/utils/styleUtils.js

/**
 * Resolves requirement flags based on collection and selected style settings
 * @param {Object} collection Base collection configuration
 * @param {Object} selectedStyle Style configuration with potential overrides
 * @returns {Object} Resolved requirements
 */
export const resolveRequirements = (collection, selectedStyle) => {
  if (!collection) {
    console.warn('No collection provided to resolveRequirements');
    return {
      needsSecondaryLeather: false,
      needsStitchingColor: false,
      needsColorDesignation: false
    };
  }

  return {
    needsSecondaryLeather: selectedStyle?.overrideSecondaryLeather ?? collection.needsSecondaryLeather,
    needsStitchingColor: selectedStyle?.overrideStitchingColor ?? collection.needsStitchingColor,
    needsColorDesignation: selectedStyle?.overrideColorDesignation ?? collection.needsColorDesignation
  };
};

/**
 * Gets effective requirements based on form state and style mode
 * @param {Object} formState Current form state
 * @returns {Object} Effective requirements
 */
export const getEffectiveRequirements = (formState) => {
  if (!formState?.collection) {
    return {
      needsSecondaryLeather: false,
      needsStitchingColor: false,
      needsColorDesignation: false
    };
  }

  if (formState.styleMode === 'global') {
    return formState.globalStyle?.requirements ?? resolveRequirements(formState.collection, null);
  }

  return resolveRequirements(formState.collection, null);
};