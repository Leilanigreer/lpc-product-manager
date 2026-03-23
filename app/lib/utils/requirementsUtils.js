// app/lib/utils/requirementsUtils.js

/**
 * True when collection.threadType is set and not NONE (EMBROIDERY / STITCHING imply stitching thread UX).
 * Undefined/null/empty threadType does not count (avoids `undefined !== 'NONE'` being true).
 */
function collectionThreadTypeRequiresStitchingColor(collection) {
  const tt = collection?.threadType;
  if (tt === undefined || tt === null || tt === "") return false;
  return tt !== "NONE";
}

/**
 * Style-driven stitching flag (Shopify `needs_stitching_color` → `overrideStitchingColor` on form style).
 * Strict `=== true` so explicit false does not force stitching off when thread type already requires it.
 */
function styleRequiresStitchingColor(selectedStyle) {
  if (!selectedStyle) return false;
  if (selectedStyle.overrideStitchingColor === true) return true;
  if (selectedStyle.needsStitchingColor === true) return true;
  return false;
}

/**
 * Resolves requirement flags for the create-product flow.
 * Stitching/color-designation UX follows Shopify rules: `collection.threadType` (not NONE) plus style
 * `overrideStitchingColor` / `needsStitchingColor`, and strict `overrideColorDesignation` for color designation.
 * Prisma `ShopifyCollection.needsStitchingColor` / `needsColorDesignation` are legacy storage only and are not read here.
 *
 * @param {Object} collection Base collection configuration
 * @param {Object} selectedStyle Style configuration with potential overrides
 * @returns {Object} Resolved requirements
 */
export const resolveRequirements = (collection, selectedStyle) => {
  if (!collection) {
    return {
      needsSecondaryLeather: false,
      needsStitchingColor: false,
      needsColorDesignation: false
    };
  }

  const needsStitchingColor =
    collectionThreadTypeRequiresStitchingColor(collection) ||
    styleRequiresStitchingColor(selectedStyle);

  return {
    needsSecondaryLeather: selectedStyle?.overrideSecondaryLeather ?? collection.needsSecondaryLeather ?? false,
    needsStitchingColor,
    // Color designation is style-only (Shopify `needs_color_designation` → overrideColorDesignation); no collection flag.
    needsColorDesignation: selectedStyle?.overrideColorDesignation === true
  };
};

export const getEffectiveRequirements = (formState) => {
  if (!formState?.collection) {
    return {
      needsSecondaryLeather: false,
      needsStitchingColor: false,
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

  return finalRequirements;
};