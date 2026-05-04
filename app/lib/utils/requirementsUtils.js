// app/lib/utils/requirementsUtils.js

/**
 * Resolves requirement flags for the create-product flow.
 * - Secondary leather: **collection** `needsSecondaryLeather`.
 * - Thread embroidery vs stitching UX: **collection** `threadType` (`ThreadColorSelector`, validators); embroidery is always product-level.
 * - Color designation is **per shape row** (`allShapes[].needsColorDesignation`), driven from the row’s
 *   `style.needsColorDesignation` and wood pairing — not part of `finalRequirements`.
 *
 * @param {Object} collection Base collection configuration
 * @returns {Object} Resolved requirements
 */
export const resolveRequirements = (collection) => {
  if (!collection) {
    return {
      needsSecondaryLeather: false,
    };
  }

  return {
    needsSecondaryLeather: collection.needsSecondaryLeather ?? false,
  };
};

export const getEffectiveRequirements = (formState) => {
  if (!formState?.collection) {
    return {
      needsSecondaryLeather: false,
    };
  }

  return resolveRequirements(formState.collection);
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