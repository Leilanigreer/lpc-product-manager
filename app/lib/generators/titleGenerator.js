// app/lib/generators/titleGenerator.js

import { leatherNameForListing } from "../utils/leatherListing.js";

const DEFAULT_HANDLE = "pending-main-handle";
const DEFAULT_SEO_TITLE = "pending-seo-title";
const DEFAULT_TITLE = "Pending Title";

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
 * Generates the main product title using form state
 */
export const generateTitle = async (formState) => {
  try {
    if (!formState?.collection) {
      return DEFAULT_TITLE;
    }

    const template = formState.finalRequirements.titleTemplate;

    if (!template) {
      return DEFAULT_TITLE;
    }

    return template
      .replace(
        "{leatherColors.primary.label}",
        leatherNameForListing(formState.leatherColors?.primary)
      )
      .replace(
        "{leatherColors.secondary.label}",
        leatherNameForListing(formState.leatherColors?.secondary)
      )
      .replace('{stitchingThreads.[0].label}', Object.values(formState.stitchingThreads || {})[0]?.label || '')
      .replace('{globalEmbroideryThread.label}', formState.globalEmbroideryThread?.label || '')
      || DEFAULT_TITLE;

  } catch (error) {
    return DEFAULT_TITLE;
  }
};

/**
 * Generates SEO-friendly title
 */
export const generateSEOTitle = async (formState, title) => {
  if (!formState?.collection || !title || title === DEFAULT_TITLE) {
    return DEFAULT_SEO_TITLE;
  }

  try {
    const template = formState.collection?.titleFormat?.seoTemplate;

    if (!template) {
      return DEFAULT_SEO_TITLE;
    }

    return template.replace('{title}', title) || DEFAULT_SEO_TITLE;

  } catch (error) {
    return DEFAULT_SEO_TITLE;
  }
};

/**
 * Generates URL-friendly handle
 */
export const generateMainHandle = async (formState, title, version) => {
  if (!formState?.collection || !title || title === DEFAULT_TITLE) {
    return DEFAULT_HANDLE;
  }

  try {
    const template = formState.collection?.titleFormat?.handleTemplate;

    if (!template) {
      return DEFAULT_HANDLE;
    }

    const tempMainHandle = sanitizeHandle(title);
    let handle = template
      .replace('{tempMainHandle}', tempMainHandle)
      .replace('{title}', title);

    if (version) {
      handle = `${handle}-v${version}`;
    }

    return handle || DEFAULT_HANDLE;

  } catch (error) {
    return DEFAULT_HANDLE;
  }
};