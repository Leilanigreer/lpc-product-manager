// app/lib/utils/requirementsUtils.js

/**
 * Resolves requirement flags for the create-product flow.
 * - Secondary leather: **collection** `needsSecondaryLeather`.
 * - Thread embroidery vs stitching UX: **collection** `threadType` only (`ThreadColorSelector`, validators).
 * - Color designation for listing-level flags: pass null; per-shape `needsColorDesignation` lives on each shape row.
 *
 * @param {Object} collection Base collection configuration
 * @param {Object} selectedStyle Reserved for future use; pass null (per-shape designation is on each shape).
 * @returns {Object} Resolved requirements
 */
export const resolveRequirements = (collection, selectedStyle) => {
  if (!collection) {
    return {
      needsSecondaryLeather: false,
      needsColorDesignation: false
    };
  }

  return {
    needsSecondaryLeather: collection.needsSecondaryLeather ?? false,
    needsColorDesignation: selectedStyle?.needsColorDesignation === true,
  };
};

export const getEffectiveRequirements = (formState) => {
  if (!formState?.collection) {
    return {
      needsSecondaryLeather: false,
      needsColorDesignation: false
    };
  }

  return resolveRequirements(formState.collection, null);
};

export const calculateFinalRequirements = (formState) => {
  // Get base requirements
  const baseRequirements = getEffectiveRequirements(formState);

  // Collection-level templates and defaults
  const templates = {};

  templates.titleTemplate = formState.collection?.titleFormat?.titleTemplate;
  templates.seoTemplate = formState.collection?.titleFormat?.seoTemplate;
  templates.handleTemplate = formState.collection?.titleFormat?.handleTemplate;
  templates.validation = formState.collection?.titleFormat?.validation;
  templates.namePattern = formState.collection?.defaultStyleNamePattern;
  templates.leatherPhrase = 'leather as';
  templates.useOppositeLeather = false;
  templates.skuPattern = formState.collection?.skuPattern;

  const finalRequirements = {
    ...baseRequirements,
    ...templates
  };

  return finalRequirements;
};