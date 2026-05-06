// app/lib/generators/titleGenerator.js

import { leatherNameForListing } from "../utils/leatherListing.js";
import {
  firstCanonicalEmbroideryThread,
  firstCanonicalStitchingThread,
} from "../utils/threadUtils.js";

const DEFAULT_HANDLE = "pending-main-handle";
const DEFAULT_SEO_TITLE = "pending-seo-title";
const DEFAULT_TITLE = "Pending Title";

/** Ensures template tokens never stringify as "[object Object]". */
const asTitleToken = (value) => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return "";
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
        asTitleToken(leatherNameForListing(formState.leatherColors?.primary))
      )
      .replace(
        "{leatherColors.secondary.label}",
        asTitleToken(leatherNameForListing(formState.leatherColors?.secondary))
      )
      .replace(
        "{stitchingThreads[0].label}",
        asTitleToken(
          firstCanonicalStitchingThread(formState.stitchingThreads, formState)?.label
        )
      )
      .replace(
        "{stitchingThreads.[0].label}",
        asTitleToken(
          firstCanonicalStitchingThread(formState.stitchingThreads, formState)?.label
        )
      )
      .replace(
        "{embroideryThreads[0].label}",
        asTitleToken(
          firstCanonicalEmbroideryThread(formState.embroideryThreads)?.label
        )
      )
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

    return template.replace("{title}", asTitleToken(title)) || DEFAULT_SEO_TITLE;

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

    const titleStr = asTitleToken(title);
    const tempMainHandle = sanitizeHandle(titleStr);
    let handle = template
      .replace("{tempMainHandle}", tempMainHandle)
      .replace("{title}", titleStr);

    if (version) {
      handle = `${handle}-v${version}`;
    }

    return handle || DEFAULT_HANDLE;

  } catch (error) {
    return DEFAULT_HANDLE;
  }
};