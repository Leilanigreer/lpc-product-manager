// app/lib/collectionUtils.js

import { COLLECTION_TYPES, COLLECTION_HANDLE_MAP } from '../constants/collectionTypes';

export const getShopifyCollectionType = ({ handle }) => {
  if (!handle) {
    //console.warn('Missing collection handle');
    return 'Unknown';
  }
  
  // Normalize the handle to lowercase for consistent comparison
  const normalizedHandle = handle.toLowerCase();
  const collectionType = COLLECTION_HANDLE_MAP[normalizedHandle];
  
  if (!collectionType) {
    //console.warn(`Unknown collection handle: ${handle}`);
    return 'Unknown';
  }
  
  return collectionType;
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