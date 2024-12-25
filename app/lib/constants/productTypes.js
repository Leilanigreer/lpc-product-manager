// app/lib/constants/productTypes.js

import { COLLECTION_TYPES } from "./collectionTypes";
import { getCollectionType } from "../utils";

export const PRODUCT_TYPE_MAP = {
  [COLLECTION_TYPES.QUILTED]: "Quilted",
  [COLLECTION_TYPES.ANIMAL]: "Animal Print",
  [COLLECTION_TYPES.ARGYLE]: "Argyle",
  [COLLECTION_TYPES.CLASSIC]: "Classic",
  [COLLECTION_TYPES.QCLASSIC]: "QClassic"
};

export const generateProductType = (formState, shopifyCollections) => {
  return PRODUCT_TYPE_MAP[getCollectionType(formState, shopifyCollections)] || "";
};