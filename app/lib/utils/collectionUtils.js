// app/lib/utils/collectionUtils.js

export const needsStyle = (formState, shopifyCollections) => {
  const collection = shopifyCollections.find(col => col.value === formState.selectedCollection);
  return collection?.needsStyle ?? false;
};

export const needsSecondaryColor = (formState, shopifyCollections) => {
  const collection = shopifyCollections.find(col => col.value === formState.selectedCollection);
  return collection?.needsSecondaryLeather ?? false;
};

export const needsStitchingColor = (formState, shopifyCollections) => {
  const collection = shopifyCollections.find(col => col.value === formState.selectedCollection);
  return collection?.needsStitchingColor ?? false;
};

export const needsQClassicField = (formState, shopifyCollections) => {
  const collection = shopifyCollections?.find(col => col.value === formState?.selectedCollection);
  return collection?.needsQClassicField ?? false;
};

