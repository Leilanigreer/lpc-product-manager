
import { COLLECTION_TYPES, COLLECTION_ID_MAP } from './constants';

export const getCollectionType = (collectionId) => {
  // console.log("getCollectionType called with collectionId:", collectionId);

  // Extract the numeric ID from the full Shopify ID (if necessary)
  const numericId = collectionId.split('/').pop();
  // console.log("Extracted numericId:", numericId);

  // Look up the collection type in our map
  const collectionType = COLLECTION_ID_MAP[numericId];
  // console.log("Looked up collectionType:", collectionType);
  
  if (!collectionType) {
    console.warn(`Unknown collection ID: ${numericId}`);
    // console.log("Available collection IDs:", Object.keys(COLLECTION_ID_MAP));
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