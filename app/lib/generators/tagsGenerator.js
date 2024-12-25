// app/lib/generators/tagsGenerator.js

import { getColors } from "../utils/colorUtils";

/**
 * Helper function to check if a color matches any color in a collection
 * @param {Object} selectedColor - The selected color object
 * @param {Array} colorCollection - Array of color objects to check against
 * @returns {boolean}
 */
const hasMatchingColor = (selectedColor, colorCollection) => {
  if (!selectedColor || !Array.isArray(colorCollection)) {
    return false;
  }
  
  return colorCollection.some(color => 
    color?.value === selectedColor.value
  );
};

/**
 * Validates the color tag structure
 * @param {Object} tag - The tag object to validate
 * @returns {boolean}
 */
const isValidColorTag = (tag) => {
  return tag && 
    Array.isArray(tag.leatherColors) && 
    Array.isArray(tag.stitchingColors) && 
    Array.isArray(tag.embroideryColors);
};

/**
 * Generates tags based on selected colors and color tags
 * @param {Object} formState - The current form state
 * @param {Array} leatherColors - Array of leather color options 
 * @param {Array} stitchingThreadColors - Array of stitching thread color options
 * @param {Array} embroideryThreadColors - Array of embroidery thread color options
 * @param {Array} colorTags - Array of color tag configurations
 * @returns {Array} Array of generated tags
 */
export const generateTags = (
  formState, 
  leatherColors, 
  stitchingThreadColors, 
  embroideryThreadColors, 
  colorTags
) => {
  // Initialize with default tags
  const tagSet = new Set(['Customizable']);

  // Early validation
  if (!formState || !Array.isArray(colorTags)) {
    console.error('Invalid input parameters:', { 
      hasFormState: !!formState, 
      colorTagsType: typeof colorTags 
    });
    return Array.from(tagSet);
  }

  // Get color selections
  const { 
    leatherColor1, 
    leatherColor2, 
    stitchingThreadColor, 
    embroideryThreadColor 
  } = getColors(formState, leatherColors, stitchingThreadColors, embroideryThreadColors);

  // Process each color tag
  colorTags.forEach(tag => {
    if (!isValidColorTag(tag)) {
      console.warn('Invalid tag structure:', tag);
      return;
    }

    const matchesTag = [
      [leatherColor1, tag.leatherColors],
      [leatherColor2, tag.leatherColors],
      [stitchingThreadColor, tag.stitchingColors],
      [embroideryThreadColor, tag.embroideryColors]
    ].some(([color, collection]) => hasMatchingColor(color, collection));

    if (matchesTag) {
      tagSet.add(tag.label);
    }
  });

  return Array.from(tagSet);
};