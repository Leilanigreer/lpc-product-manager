// app/lib/constants/productTypes.js

/**
 * Generates product type string based on collection data
 * @param {Object} formState - Current form state containing collection information
 * @param {Array} shopifyCollections - Available Shopify collections 
 * @returns {string} Generated product type
 */
export const generateProductType = (formState, shopifyCollections) => {
  if (!formState?.selectedCollection || !Array.isArray(shopifyCollections)) {
    console.warn('Invalid inputs to generateProductType');
    return '';
  }

  const collection = shopifyCollections.find(col => col.value === formState.selectedCollection);
  if (!collection) {
    console.warn('Collection not found:', formState.selectedCollection);
    return '';
  }

  return collection.title || '';
};