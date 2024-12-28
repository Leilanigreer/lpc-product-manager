// app/lib/utils/versionUtils.js
import { COLLECTION_TYPES } from "../constants";

export const generateBaseParts = (collectionType, colors) => { 
  const {leatherColor1, leatherColor2, stitchingThreadColor, embroideryThreadColor } = colors;

  const partsMap = {
    [COLLECTION_TYPES.QUILTED]: () => [
      "Quilted",
      leatherColor1?.abbreviation,
      embroideryThreadColor?.abbreviation
    ],

    [COLLECTION_TYPES.ARGYLE]: () => [
      "Argyle",
      leatherColor1?.abbreviation,
      leatherColor2?.abbreviation,
      stitchingThreadColor?.abbreviation
    ],

    [COLLECTION_TYPES.ANIMAL]: () => [
      "Animal",
      leatherColor1?.abbreviation,
      leatherColor2?.abbreviation
    ],

    [COLLECTION_TYPES.CLASSIC]: () => [
      "Classic",
      leatherColor1?.abbreviation,
      leatherColor2?.abbreviation
    ],

    [COLLECTION_TYPES.QCLASSIC]: () => [
      "QClassic",
      leatherColor1?.abbreviation,
      leatherColor2?.abbreviation
    ]
  };

  return partsMap[collectionType]?.();
};

export const calculateVersionFormParts = (parts, existingProducts) => {
  if (!existingProducts?.length) {
    return null;
  }

  const baseSKU = parts.filter(Boolean).join('-');
  
  const matchingProduct = existingProducts.find(product =>
    product.baseSKU === baseSKU ||
    product.baseSKU.startsWith(`${baseSKU}-V`)
  );

  if (!matchingProduct) return null;

  const regex = /-V(\d+)$/;
  const match = matchingProduct.baseSKU.match(regex);
  return match ? parseInt(match[1]) + 1 : 2;
};
