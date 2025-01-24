// app/lib/utils/requirementsUtils.js

/**
 * Resolves requirement flags based on collection and selected style settings
 * @param {Object} collection Base collection configuration
 * @param {Object} selectedStyle Style configuration with potential overrides
 * @returns {Object} Resolved requirements
 */
export const resolveRequirements = (collection, selectedStyle) => {
  if (!collection) {
    console.log('No collection provided to resolveRequirements');
    return {
      needsSecondaryLeather: false,
      needsStitchingColor: false,
      needsColorDesignation: false
    };
  }

  // Log incoming data for debugging
  console.log('Resolving requirements for:', {
    collection: {
      id: collection.value,
      needsSecondaryLeather: collection.needsSecondaryLeather,
      needsStitchingColor: collection.needsStitchingColor,
      needsColorDesignation: collection.needsColorDesignation
    },
    styleOverrides: selectedStyle ? {
      overrideSecondaryLeather: selectedStyle.overrideSecondaryLeather,
      overrideStitchingColor: selectedStyle.overrideStitchingColor,
      overrideColorDesignation: selectedStyle.overrideColorDesignation
    } : 'No style overrides'
  });

  const requirements = {
    needsSecondaryLeather: selectedStyle?.overrideSecondaryLeather ?? collection.needsSecondaryLeather ?? false,
    needsStitchingColor: selectedStyle?.overrideStitchingColor ?? collection.needsStitchingColor ?? false,
    needsColorDesignation: selectedStyle?.overrideColorDesignation ?? collection.needsColorDesignation ?? false
  };

  console.log('Resolved requirements:', requirements);
  return requirements;
};

export const getEffectiveRequirements = (formState) => {
  console.log('Getting effective requirements for formState:', formState);

  if (!formState?.collection) {
    console.log('No collection in formState');
    return {
      needsSecondaryLeather: false,
      needsStitchingColor: false,
      needsColorDesignation: false
    };
  }

  // For global style mode, use global style requirements
  if (formState.styleMode === 'global' && formState.globalStyle) {
    console.log('Using global style requirements');
    return resolveRequirements(formState.collection, formState.globalStyle);
  }

  // For other cases, use collection-level requirements
  console.log('Using collection-level requirements');
  return resolveRequirements(formState.collection, null);
};

export const calculateFinalRequirements = (formState) => {
  console.log('Calculating final requirements for formState:', formState);

  // Get base requirements
  const baseRequirements = getEffectiveRequirements(formState);

  // Get templates based on style mode
  const templates = {};

  if (formState.styleMode === 'global' && formState.globalStyle) {
    // Use style-specific templates if available, fall back to collection templates
    templates.titleTemplate = formState.globalStyle.titleTemplate ??
      formState.collection?.titleFormat?.titleTemplate;
    templates.seoTemplate = formState.globalStyle.seoTemplate ??
      formState.collection?.titleFormat?.seoTemplate;
    templates.handleTemplate = formState.globalStyle.handleTemplate ??
      formState.collection?.titleFormat?.handleTemplate;
    templates.validation = formState.globalStyle.validation ??
      formState.collection?.titleFormat?.validation;
    templates.namePattern = formState.globalStyle.overrideNamePattern ??
      formState.collection?.defaultStyleNamePattern;
    templates.leatherPhrase = formState.globalStyle.leatherPhrase ?? 'leather as';
    templates.useOppositeLeather = formState.globalStyle.useOppositeLeather ?? false;
    templates.skuPattern = formState.globalStyle.skuPattern ??
      formState.collection?.skuPattern;
  } else {
    // Use collection-level templates
    templates.titleTemplate = formState.collection?.titleFormat?.titleTemplate;
    templates.seoTemplate = formState.collection?.titleFormat?.seoTemplate;
    templates.handleTemplate = formState.collection?.titleFormat?.handleTemplate;
    templates.validation = formState.collection?.titleFormat?.validation;
    templates.namePattern = formState.collection?.defaultStyleNamePattern;
    templates.leatherPhrase = 'leather as';  // Collection-level default
    templates.useOppositeLeather = false;    // Collection-level default
    templates.skuPattern = formState.collection?.skuPattern;
  }

  const finalRequirements = {
    ...baseRequirements,
    ...templates
  };

  console.log('Final calculated requirements:', finalRequirements);
  return finalRequirements;
};