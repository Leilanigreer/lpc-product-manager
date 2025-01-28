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
 * @param {Object} formState - Current form state containing collection data
 * @param {Array} commonDescription - Array of common descriptions from database
 * @returns {string} Formatted HTML description
 */
export const generateDescriptionHTML = (formState, commonDescription) => {
  if (!formState?.collection) {
    console.warn('No collection data in formState');
    return '';
  }

  try {
    const { description, commonDescription: includeCommon } = formState.collection;

    if (!description) {
      console.warn('No description found in collection data');
      return '';
    }

    // Extract active common description content
    const commonContent = Array.isArray(commonDescription) 
      ? commonDescription.find(desc => desc.isActive)?.content 
      : null;

    return wrapDescription(
      description,
      includeCommon,
      commonContent
    ).replace(/\s+/g, " ").trim();

  } catch (error) {
    console.error('Error generating HTML description:', error);
    return '';
  }
};