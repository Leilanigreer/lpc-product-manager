// app/lib/generators/titleGenerator.js
import { COLLECTION_TYPES } from "../constants";
import { getCollectionType, getColors } from "../utils";

const DEFAULT_HANDLE = "pending-main-handle";
const DEFAULT_SEO_TITLE = "pending-seo-title";
const DEFAULT_TITLE = "Pending Title";

const ERROR_MESSAGES = {
  PRIMARY_COLOR: "Primary leather color missing",
  SECONDARY_COLOR: "Secondary leather color missing",
  STITCHING_COLOR: "Stitching color missing"
};

/**
 * Generates the main product title based on form state and collection type
 * @param {Object} formState - Current form state with color selections
 * @param {Array} leatherColors - Available leather color options
 * @param {Array} stitchingThreadColors - Available stitching thread colors
 * @param {Array} embroideryThreadColors - Available embroidery thread colors
 * @param {Array} shopifyCollections - Available Shopify collections
 * @returns {string} Generated product title
 */
export const generateTitle = (formState, leatherColors, stitchingThreadColors, embroideryThreadColors, shopifyCollections) => {  
  const { leatherColor1, leatherColor2, stitchingThreadColor, embroideryThreadColor } = 
    getColors(formState, leatherColors, stitchingThreadColors, embroideryThreadColors);
  const collectionType = getCollectionType(formState, shopifyCollections);

  if (!leatherColor1) return ERROR_MESSAGES.PRIMARY_COLOR;
  
  switch (collectionType) {
    case COLLECTION_TYPES.ANIMAL:
    case COLLECTION_TYPES.CLASSIC:
      return !leatherColor2 ? ERROR_MESSAGES.SECONDARY_COLOR : 
        `${leatherColor1.label} with ${leatherColor2.label} Leather`;

    case COLLECTION_TYPES.QCLASSIC:
      return !leatherColor2 ? ERROR_MESSAGES.SECONDARY_COLOR : 
        `${leatherColor1.label} and ${leatherColor2.label} Leather Quilted`;
  
    case COLLECTION_TYPES.ARGYLE:
      if (!leatherColor2) return ERROR_MESSAGES.SECONDARY_COLOR;
      if (!stitchingThreadColor) return ERROR_MESSAGES.STITCHING_COLOR;
      return `${leatherColor1.label} and ${leatherColor2.label} Leather with ${stitchingThreadColor.label} Stitching`;
  
    case COLLECTION_TYPES.QUILTED:
      return !embroideryThreadColor ? ERROR_MESSAGES.STITCHING_COLOR :
        `${leatherColor1.label} Leather Quilted with ${embroideryThreadColor.label} Stitching`;
  
    default:
      return DEFAULT_TITLE;
  }
};

/**
 * Generates SEO-friendly title based on product title and collection type
 * @param {Object} formState - Current form state
 * @param {string} title - Base product title
 * @param {Array} shopifyCollections - Available Shopify collections
 * @returns {string} SEO-optimized title
 */
export const generateSEOTitle = (formState, title, shopifyCollections) => {
  if (!title || title === DEFAULT_TITLE) return DEFAULT_SEO_TITLE;

  const collectionType = getCollectionType(formState, shopifyCollections);
  
  switch(collectionType) {
    case COLLECTION_TYPES.QUILTED:
    case COLLECTION_TYPES.ANIMAL:
    case COLLECTION_TYPES.CLASSIC:
      return `${title} Golf Headcovers`;
    case COLLECTION_TYPES.ARGYLE:
      return `${title} Argyle Golf Headcovers`; 
    case COLLECTION_TYPES.QCLASSIC:
      return `${title} Quilted Golf Headcovers`;
    default:
      return DEFAULT_SEO_TITLE;
  }
};

/**
 * Generates URL-friendly handle from title and collection type
 * @param {Object} formState - Current form state
 * @param {string} title - Base product title
 * @param {Array} shopifyCollections - Available Shopify collections
 * @param {number} version - Optional version number for the handle
 * @returns {string} URL-safe handle
 */
const sanitizeHandle = (title) => {
  return title.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
};

export const generateMainHandle = (formState, title, shopifyCollections, version) => {
  if (!formState || !shopifyCollections) {
    console.warn('Missing required parameters for handle generation');
    return DEFAULT_HANDLE;
  }

  if (!title || title === DEFAULT_TITLE) return DEFAULT_HANDLE;

  const tempMainHandle = sanitizeHandle(title);
  const collectionType = getCollectionType(formState, shopifyCollections);
  
  let handle;
  switch(collectionType) {
    case COLLECTION_TYPES.QUILTED:
    case COLLECTION_TYPES.ANIMAL:
    case COLLECTION_TYPES.CLASSIC:
      handle = `${tempMainHandle}-golf-headcovers`;
      break;
    case COLLECTION_TYPES.ARGYLE:
      handle = `${tempMainHandle}-argyle-golf-headcovers`; 
      break;
    case COLLECTION_TYPES.QCLASSIC:
      handle = `${tempMainHandle}-quilted-golf-headcovers`;
      break;
    default:
      return DEFAULT_HANDLE;
  }

  if (version) {
    handle = `${handle}-v${version}`;
  }
  return handle;
};