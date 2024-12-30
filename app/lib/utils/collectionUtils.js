// app/lib/utils/collectionUtils.js

import { COLLECTION_TYPES, COLLECTION_HANDLE_MAP } from '../constants';

/**
 * @typedef {Object} Collection
 * @property {string} value - Collection ID
 * @property {string} handle - Collection handle
 */

/**
 * @param {Object} params
 * @param {string} params.handle - Collection handle
 * @returns {string} Collection type or 'Unknown'
 */
export const getShopifyCollectionType = ({ handle }) => {
  if (!handle) {
    console.warn('No handle provided to getShopifyCollectionType');
    return 'Unknown';
  }
  
  const normalizedHandle = handle.toLowerCase();
  const collectionType = COLLECTION_HANDLE_MAP[normalizedHandle];
  
  if (!collectionType) {
    console.warn(`Unknown collection handle: ${handle}`);
    return 'Unknown';
  }
  
  return collectionType;
};

/**
 * @param {Object} formState - Current form state
 * @param {Array<Collection>} shopifyCollections - Available collections
 * @returns {string} Collection type or 'Unknown'
 */
export const getCollectionType = (formState, shopifyCollections) => {
  if (!formState?.selectedCollection || !Array.isArray(shopifyCollections)) {
    console.warn('Invalid inputs to getCollectionType');
    return 'Unknown';
  }
  
  const collection = shopifyCollections.find(col => col.value === formState.selectedCollection);
  return collection ? getShopifyCollectionType({ handle: collection.handle }) : 'Unknown';
};

export const needsSecondaryColor = (collectionType) => {
  return [COLLECTION_TYPES.ARGYLE, COLLECTION_TYPES.ANIMAL, COLLECTION_TYPES.CLASSIC, COLLECTION_TYPES.QCLASSIC].includes(collectionType);
};

export const needsStitchingColor = (collectionType) => {
  return [COLLECTION_TYPES.QUILTED, COLLECTION_TYPES.ARGYLE].includes(collectionType);
};

export const isCollectionAnimalClassicQclassic = (collectionType) => {
  return [COLLECTION_TYPES.ANIMAL, COLLECTION_TYPES.CLASSIC, COLLECTION_TYPES.QCLASSIC].includes(collectionType);
};

export const needsStyle = (collectionType) => {
  return [COLLECTION_TYPES.ANIMAL, COLLECTION_TYPES.CLASSIC, COLLECTION_TYPES.QCLASSIC].includes(collectionType);
};

export const needsQClassicField = (collectionType) => {
  return collectionType === COLLECTION_TYPES.QCLASSIC;
};