// app/lib/generators/htmlDescription.js

import { COLLECTION_TYPES } from "../constants";
import { getCollectionType } from "../utils";

/**
 * Common leather description HTML block used across all product descriptions
 * @type {string}
 * @constant
 */
const LEATHER_DESCRIPTION = "We use 100% top grain genuine cowhide from the finest tanneries in Italy, Argentina, and Austria, ensuring exceptional quality, luxurious feel, and unmatched durability. Every piece is hand cut by an artisan leather craftsman in the heart of downtown San Francisco, CA. If you don't see your ideal color combination, <a href='https://lpcgolf.com/pages/contact' target='_blank' title='Contact LPC golf' rel='noopener'>please contact us</a> about creating a custom, one-of-a-kind set.";

/**
 * Wraps a collection-specific description with common HTML structure
 * @param {string} description - Collection-specific description text
 * @returns {string} Wrapped HTML description
 * @private
 */
const wrapDescription = (description) => 
  `<div><br><div><span>${description}</span></div><div><span></span><br></div><div><div><div>${LEATHER_DESCRIPTION}</div></div></div></div>`;

/**
 * Generates HTML description for a product based on collection type
 * @param {Object} formState - Current form state containing collection information
 * @param {Array<Object>} shopifyCollections - Available Shopify collections
 * @returns {string} Formatted HTML description for the product
 * @throws {Error} If collection type is invalid or not found
 */
export const generateDescriptionHTML = (formState, shopifyCollections) => {
  const collectionType = getCollectionType(formState, shopifyCollections);
  let descriptionHTML = "";

  // Collection-specific descriptions
  const COLLECTION_DESCRIPTIONS = {
    [COLLECTION_TYPES.QUILTED]: "Our Quilted collection embodies timeless luxury, celebrating the days when craftsmanship and style were paramount. Each diamond pattern is meticulously hand-sewn with premium thread, creating a distinctive look that sets these headcovers apart.",
    
    [COLLECTION_TYPES.CLASSIC]: "Our Classic collection celebrates traditional golf style with a luxurious twist. Each headcover features impeccable hand-stitched French seams, bold racing stripes, or timeless diagonal striping – perfect for golfers who appreciate refined, vintage-inspired design.",
    
    [COLLECTION_TYPES.ARGYLE]: "Our Argyle collection honors golf's Scottish heritage with a contemporary twist. Each diamond and contrasting cross-stitch is expertly hand-sewn by master craftsmen. From understated leather tones to bold animal prints, these headcovers let you showcase your personal style while maintaining classic sophistication.",
    
    [COLLECTION_TYPES.ANIMAL]: "Our Animal Print collection elevates our classic designs with beautiful embossed cowhides. These distinctive headcovers range from subtle, sophisticated patterns to bold, eye-catching designs – perfect for golfers who want to make a statement.",
    
    [COLLECTION_TYPES.QCLASSIC]: "Our Quilted Classic collection represents the pinnacle of our craft, combining the sophistication of our Quilted designs with the timeless appeal of our Classic styles. Each headcover is masterfully crafted by artisan leather craftsmen, featuring hand-stitched French seams and our signature diamond pattern."
  };

  // Get description based on collection type
  const description = COLLECTION_DESCRIPTIONS[collectionType];
  if (description) {
    descriptionHTML = wrapDescription(description);
  } else {
    throw new Error(`Invalid collection type: ${collectionType}`);
  }

  // Clean up whitespace and return
  return descriptionHTML.replace(/\s+/g, " ").trim();
};