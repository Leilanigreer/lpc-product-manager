// app/lib/generators/tagsGenerator.js

const DEFAULT_TAGS = ['Customizable'];

/**
 * Gets all color tags from various sources in formState
 * @param {Object} formState - Current form state
 * @returns {Set} Unique set of color tag labels
 */
const getAllColorTags = (formState) => {
  const tagSet = new Set();

  // Add leather color tags
  if (formState.leatherColors?.primary?.colorTags) {
    formState.leatherColors.primary.colorTags.forEach(tag => tagSet.add(tag.label));
  }
  if (formState.leatherColors?.secondary?.colorTags) {
    formState.leatherColors.secondary.colorTags.forEach(tag => tagSet.add(tag.label));
  }

  // Add stitching thread tags
  Object.values(formState.stitchingThreads || {}).forEach(thread => {
    thread.colorTags?.forEach(tag => tagSet.add(tag.label));
  });

  // Add embroidery thread tags based on mode
  if (formState.threadMode?.embroidery === 'global' && formState.globalEmbroideryThread?.colorTags) {
    formState.globalEmbroideryThread.colorTags.forEach(tag => tagSet.add(tag.label));
  } else {
    // Per-shape embroidery threads
    Object.values(formState.shapeEmbroideryThreads || {}).forEach(thread => {
      thread.colorTags?.forEach(tag => tagSet.add(tag.label));
    });
  }

  return tagSet;
};

/**
 * Generates tags based on colors selected in formState
 * @param {Object} formState - The current form state
 * @returns {Array} Array of generated tags
 */
export const generateTags = (formState) => {
  if (!formState) {
    console.error('Invalid formState provided to generateTags');
    return DEFAULT_TAGS;
  }

  const tagSet = new Set(DEFAULT_TAGS);
  
  try {
    const colorTags = getAllColorTags(formState);
    colorTags.forEach(tag => tagSet.add(tag));
  } catch (error) {
    console.error('Error generating tags:', error);
  }

  return Array.from(tagSet);
};