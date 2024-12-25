// app/lib/generators/titleGenerator.js
import { COLLECTION_TYPES } from "../constants/collectionTypes";
import { getCollectionType } from "../utils/collectionUtils";
import { getColors } from "../utils/colorUtils";

export const generateTitle = (formState, leatherColors, stitchingThreadColors, embroideryThreadColors, shopifyCollections) => {  
  const { leatherColor1, leatherColor2, stitchingThreadColor, embroideryThreadColor } = 
    getColors(formState, leatherColors, stitchingThreadColors, embroideryThreadColors);
  const collectionType = getCollectionType(formState, shopifyCollections);

  if (!leatherColor1) return "Primary leather color missing";
  
  switch (collectionType) {
    case COLLECTION_TYPES.ANIMAL:
    case COLLECTION_TYPES.CLASSIC:
    case COLLECTION_TYPES.QCLASSIC:
      return !leatherColor2 ? "Secondary leather color missing" : 
        `${leatherColor1.label} with ${leatherColor2.label} Leather`;
  
    case COLLECTION_TYPES.ARGYLE:
      if (!leatherColor2) return "Secondary leather color missing";
      if (!stitchingThreadColor) return "Stitching color missing";
      return `${leatherColor1.label} and ${leatherColor2.label} Leather with ${stitchingThreadColor.label} Stitching`;
  
    case COLLECTION_TYPES.QUILTED:
      return !embroideryThreadColor ? "Stitching color missing" :
        `${leatherColor1.label} Leather Quilted with ${embroideryThreadColor.label} Stitching`;
  
    default:
      return "Pending Title";
  }
};

export const generateSEOTitle = (formState, title, shopifyCollections) => {
  if (!title || title === "Pending Title") return "pending-seo-title";

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
      return "pending-seo-title";
  }
};