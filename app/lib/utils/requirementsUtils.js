// app/lib/utils/requirementsUtils.js

/**
 * Resolves requirement flags for the create-product flow.
 * - Secondary leather: **collection** `needsSecondaryLeather`.
 * - Thread embroidery vs stitching UX: **collection** `threadType` only (`ThreadColorSelector`, validators).
 * - Color designation when a global style is in play: **style** `needsColorDesignation` (Shopify `needs_color_designation`).
 *   Per-shape flows set designation on the shape row separately from this aggregate.
 *
 * @param {Object} collection Base collection configuration
 * @param {Object} selectedStyle Style row; optional for global-style branch
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

  // For global style mode, use global style requirements
  if (formState.styleMode === 'global' && formState.globalStyle) {
    return resolveRequirements(formState.collection, formState.globalStyle);
  }

  // For other cases, use collection-level requirements
  return resolveRequirements(formState.collection, null);
};

export const calculateFinalRequirements = (formState) => {
  // Get base requirements
  const baseRequirements = getEffectiveRequirements(formState);

  // Get templates based on style mode
  const templates = {};

  if (formState.styleMode === 'global' && formState.globalStyle) {
    const gs = formState.globalStyle;
    const coll = formState.collection;
    // Listing / SKU templates live on the collection only.
    templates.titleTemplate = coll?.titleFormat?.titleTemplate;
    templates.seoTemplate = coll?.titleFormat?.seoTemplate;
    templates.handleTemplate = coll?.titleFormat?.handleTemplate;
    templates.validation = coll?.titleFormat?.validation;
    templates.skuPattern = coll?.skuPattern;
    // Style row: naming / leather phrasing only.
    templates.namePattern = gs.namePattern ?? coll?.defaultStyleNamePattern;
    templates.leatherPhrase = gs.leatherPhrase ?? 'leather as';
    templates.useOppositeLeather = gs.useOppositeLeather ?? false;
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

  return finalRequirements;
};