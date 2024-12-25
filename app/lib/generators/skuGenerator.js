// app/lib/generators/skuGenerator.js

import { COLLECTION_TYPES } from "../constants";

const generateBaseParts = (collectionType, { leatherColor1, leatherColor2, stitchingThreadColor, embroideryThreadColor }) => {
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

export const generateSKUParts = (
  collectionType,
  { leatherColor1, leatherColor2, stitchingThreadColor, embroideryThreadColor, shape, existingProducts }
) => {
  if (!collectionType || !shape?.abbreviation) {
    console.error('Missing required SKU generation parameters:', { collectionType, shapeAbbreviation: shape?.abbreviation });
    return null;
  }

  const parts = generateBaseParts(collectionType, {
    leatherColor1,
    leatherColor2,
    stitchingThreadColor,
    embroideryThreadColor
  });

  if (!parts) {
    console.error('Could not generate SKU parts for collection type:', collectionType);
    return null;
  }

  const baseSKU = parts.filter(Boolean).join('-');

  if (existingProducts?.length) {
    const matchingProduct = existingProducts.find(product =>
      product.baseSKU === baseSKU ||
      product.baseSKU.startsWith(`${baseSKU}-V`)
    );

    if (matchingProduct) {
      // Extract version number if it exists or default to 2
      const regex = /-V(\d+)$/;
      const match = matchingProduct.baseSKU.match(regex);
      const nextVersion = match ? parseInt(match[1]) + 1 : 2;
      const iteratedBaseSKU = `${baseSKU}-V${nextVersion}`;
      const iteratedFullSKU = `${iteratedBaseSKU}-${shape.abbreviation}`;

      return {
        baseSKU: iteratedBaseSKU,
        fullSKU: iteratedFullSKU,
        parts
      };
    }
  }

  return {
    baseSKU,
    fullSKU: `${baseSKU}-${shape.abbreviation}`,
    parts
  };
};