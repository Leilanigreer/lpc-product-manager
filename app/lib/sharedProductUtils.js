import { getShopifyCollectionType } from "./collectionUtils";
import { COLLECTION_TYPES } from "./constants";


const getCollectionType = (formState, shopifyCollections) => {
  const collection = shopifyCollections.find(col => col.value === formState.selectedCollection);
  return collection ? getShopifyCollectionType({ handle: collection.handle }) : 'Unknown';
};

export const generateSKUParts = (collectionType, { leatherColor1, leatherColor2, stitchingColor, shape, isLimitedEdition = false, selectedCount = null }) => {
  // Function to get the final identifier (shape abbreviation or piece count)
  const getFinalIdentifier = () => {
    if (!isLimitedEdition) {
      return shape.abbreviation;
    }
    return selectedCount > 1 ? `${selectedCount}Piece` : shape.abbreviation;
  };

  const baseParts = {
    [COLLECTION_TYPES.QUILTED]: () => [
      "Quilted",
      leatherColor1.abbreviation,
      stitchingColor.abbreviation,
      getFinalIdentifier()
    ],
    
    [COLLECTION_TYPES.ARGYLE]: () => [
      "Argyle",
      leatherColor1.abbreviation,
      leatherColor2?.abbreviation,
      stitchingColor.abbreviation,
      getFinalIdentifier()
    ],
    
    [COLLECTION_TYPES.ANIMAL]: () => [
      "Animal",
      leatherColor1.abbreviation,
      leatherColor2?.abbreviation,
      getFinalIdentifier()
    ],
    
    [COLLECTION_TYPES.CLASSIC]: () => [
      "Classic",
      leatherColor1.abbreviation,
      leatherColor2?.abbreviation,
      getFinalIdentifier()
    ],
    
    [COLLECTION_TYPES.QCLASSIC]: () => [
      "QClassic",
      leatherColor1.abbreviation,
      leatherColor2?.abbreviation,
      getFinalIdentifier()
    ]
  };

  const parts = baseParts[collectionType]?.();
  if (!parts) {
    console.error(`Unknown collection type: ${collectionType}`);
    return null;
  }

  return isLimitedEdition ? ['LE', ...parts] : parts;
};


