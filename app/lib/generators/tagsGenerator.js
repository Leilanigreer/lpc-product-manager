// app/lib/generators/tagsGenerator.js

const DEFAULT_TAGS = ['Customizable'];

/**
 * Generates product tags.
 * @param {Object} formState - The current form state
 * @returns {Array} Array of generated tags
 */
export const generateTags = (formState) => {
  if (!formState) {
    console.error('Invalid formState provided to generateTags');
    return [];
  }

  const tags = new Set(
    formState.selectedOfferingType === 'customizable' ? DEFAULT_TAGS : []
  );
  const collectionTag = String(formState.collection?.tag || '').trim();
  if (collectionTag) tags.add(collectionTag);
  return Array.from(tags);
};
