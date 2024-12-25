// app/lib/collectionUtils.js

import { COLLECTION_TYPES, COLLECTION_HANDLE_MAP } from '../constants/collectionTypes';

export const getShopifyCollectionType = ({ handle }) => {
  if (!handle) {
    return 'Unknown';
  }
  
  const normalizedHandle = handle.toLowerCase();
  const collectionType = COLLECTION_HANDLE_MAP[normalizedHandle];
  
  if (!collectionType) {
    return 'Unknown';
  }
  
  return collectionType;
};

export const getCollectionType = (formState, shopifyCollections) => {
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