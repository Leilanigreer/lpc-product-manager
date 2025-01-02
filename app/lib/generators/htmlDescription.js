// app/lib/generators/htmlDescription.js

/**
 * Wraps collection description with common description if needed
 * @param {string} collectionDescription - Main collection description
 * @param {boolean} includeCommon - Whether to include common description
 * @param {string} commonDescription - Common description text
 * @returns {string} Combined HTML description
 */
const wrapDescription = (collectionDescription, includeCommon, commonDescription) => {
  const descriptionParts = [
    '<div>',
    '<br>',
    `<div><span>${collectionDescription}</span></div>`,
    '<div><span></span><br></div>'
  ];

  if (includeCommon && commonDescription) {
    descriptionParts.push(`<div><div><div>${commonDescription}</div></div></div>`);
  }

  descriptionParts.push('</div>');
  return descriptionParts.join('');
};

/**
 * Generates HTML description for a product based on collection
 * @param {Object} formState - Current form state
 * @param {Array} shopifyCollections - Available collections
 * @param {string} commonDescription - Common leather description from loader
 * @returns {string} Formatted HTML description
 */
export const generateDescriptionHTML = (formState, shopifyCollections, commonDescription) => {
  if (!formState?.selectedCollection || !Array.isArray(shopifyCollections)) {
    console.warn('Invalid inputs to generateDescriptionHTML');
    return '';
  }

  try {
    const collection = shopifyCollections.find(col => col.value === formState.selectedCollection);
    if (!collection?.description) {
      console.warn('No description found for collection:', formState.selectedCollection);
      return '';
    }

    return wrapDescription(
      collection.description, 
      collection.commonDescription,
      commonDescription
    ).replace(/\s+/g, " ").trim();

  } catch (error) {
    console.error('Error generating HTML description:', error);
    return '';
  }
};