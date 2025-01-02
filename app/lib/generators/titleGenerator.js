// app/lib/generators/titleGenerator.js

import { getColors } from "../utils";

const DEFAULT_HANDLE = "pending-main-handle";
const DEFAULT_SEO_TITLE = "pending-seo-title";
const DEFAULT_TITLE = "Pending Title";

/**
 * Gets the appropriate template and validation for a collection/style combination
 */
const getTemplateAndValidation = (collection, styleId, templateType) => {
  // Check for style-specific override first
  const style = collection.styles?.find(s => s.id === styleId);
  const styleTemplate = style?.[templateType];
  const styleValidation = style?.validation;

  // Fall back to collection-level template if no style override
  const collectionTemplate = collection.titleFormat?.[templateType];
  const collectionValidation = collection.titleFormat?.validation;

  return {
    template: styleTemplate || collectionTemplate,
    validation: styleValidation || collectionValidation
  };
};

/**
 * Validates colors based on validation requirements
 */
const validateColors = (colors, validation) => {
  if (!validation?.required) return null;

  for (const requiredField of validation.required) {
    const hasValue = colors[requiredField];
    if (!hasValue) {
      return validation.errorMessages?.[requiredField];
    }
  }

  return null;
};

/**
 * Replaces template placeholders with actual values
 */
const replacePlaceholders = (template, colors, tempMainHandle = '') => {
  if (!template) return '';

  return template
    .replace(/{leatherColor1\.label}/g, colors.leatherColor1?.label || '')
    .replace(/{leatherColor2\.label}/g, colors.leatherColor2?.label || '')
    .replace(/{stitchingThreadColor\.label}/g, colors.stitchingThreadColor?.label || '')
    .replace(/{embroideryThreadColor\.label}/g, colors.embroideryThreadColor?.label || '')
    .replace(/{tempMainHandle}/g, tempMainHandle)
    .replace(/{title}/g, template);
};

/**
 * Sanitizes text for URL handles
 */
const sanitizeHandle = (text) => {
  return text?.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    || '';
};

/**
 * Generates the main product title
 */
export const generateTitle = async (
  formState,
  leatherColors,
  stitchingThreadColors,
  embroideryThreadColors,
  shopifyCollections
) => {
  try {
    const colors = getColors(
      formState,
      leatherColors,
      stitchingThreadColors,
      embroideryThreadColors
    );

    const collection = shopifyCollections.find(
      col => col.value === formState.selectedCollection
    );

    if (!collection) {
      console.error('Collection not found');
      return DEFAULT_TITLE;
    }

    // Get template and validation rules
    const { template, validation } = getTemplateAndValidation(
      collection,
      formState.selectedStyle,
      'titleTemplate'
    );

    if (!template) {
      console.error('Title template not found for collection:', collection.value);
      return DEFAULT_TITLE;
    }

    // Validate colors
    const validationError = validateColors(colors, validation);
    if (validationError) {
      return validationError;
    }

    // Generate title using template
    return replacePlaceholders(template, colors) || DEFAULT_TITLE;

  } catch (error) {
    console.error('Error generating title:', error);
    return DEFAULT_TITLE;
  }
};

/**
 * Generates SEO-friendly title
 */
export const generateSEOTitle = async (
  formState,
  title,
  shopifyCollections
) => {
  if (!title || title === DEFAULT_TITLE) return DEFAULT_SEO_TITLE;

  try {
    const collection = shopifyCollections.find(
      col => col.value === formState.selectedCollection
    );
    
    if (!collection) return DEFAULT_SEO_TITLE;

    const { template } = getTemplateAndValidation(
      collection,
      formState.selectedStyle,
      'seoTemplate'
    );

    if (!template) return DEFAULT_SEO_TITLE;

    return replacePlaceholders(template, {}, '', title) || DEFAULT_SEO_TITLE;

  } catch (error) {
    console.error('Error generating SEO title:', error);
    return DEFAULT_SEO_TITLE;
  }
};

/**
 * Generates URL-friendly handle
 */
export const generateMainHandle = async (
  formState,
  title,
  shopifyCollections,
  version
) => {
  if (!formState || !shopifyCollections || !title || title === DEFAULT_TITLE) {
    return DEFAULT_HANDLE;
  }

  try {
    const collection = shopifyCollections.find(
      col => col.value === formState.selectedCollection
    );
    
    if (!collection) return DEFAULT_HANDLE;

    const { template } = getTemplateAndValidation(
      collection,
      formState.selectedStyle,
      'handleTemplate'
    );

    if (!template) return DEFAULT_HANDLE;

    // Generate temporary handle for template
    const tempMainHandle = sanitizeHandle(title);

    // Process handle template
    let handle = replacePlaceholders(template, {}, tempMainHandle);

    // Add version if provided
    if (version) {
      handle = `${handle}-v${version}`;
    }

    return handle || DEFAULT_HANDLE;

  } catch (error) {
    console.error('Error generating handle:', error);
    return DEFAULT_HANDLE;
  }
};