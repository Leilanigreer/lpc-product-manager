// app/lib/generators/tagsGenerator.js

import { getColors } from "../utils";

const DEFAULT_TAGS = ['Customizable'];

/**
 * Helper function to check if a color matches any color in a collection
 * @param {Object} selectedColor - The selected color object
 * @param {Array} colorCollection - Array of color objects to check against
 * @returns {boolean}
 */
const hasMatchingColor = (selectedColor, colorCollection) => 
  selectedColor && 
  Array.isArray(colorCollection) &&
  colorCollection.some(color => color?.value === selectedColor.value);

/**
 * Validates the color tag structure has required arrays
 * @param {Object} tag - The tag object to validate
 * @returns {boolean}
 */
const isValidColorTag = (tag) => {
  const requiredArrays = ['leatherColors', 'stitchingColors', 'embroideryColors'];
  return tag && requiredArrays.every(key => Array.isArray(tag[key]));
};

/**
 * Gets all possible color matches for a tag
 * @param {Object} colors - Object containing all color selections
 * @param {Object} tag - Tag configuration to check against
 * @returns {Array} Array of color and collection pairs to check
 */
const getColorMatches = (colors, tag) => [
  [colors.leatherColor1, tag.leatherColors],
  [colors.leatherColor2, tag.leatherColors], 
  [colors.stitchingThreadColor, tag.stitchingColors],
  [colors.embroideryThreadColor, tag.embroideryColors]
];

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
  const tagSet = new Set(DEFAULT_TAGS);

  // Early validation
  if (!formState || !Array.isArray(colorTags)) {
    console.error('Invalid input parameters:', {
      hasFormState: !!formState,
      colorTagsType: typeof colorTags
    });
    return Array.from(tagSet);
  }

  // Get color selections
  const colors = getColors(
    formState,
    leatherColors,
    stitchingThreadColors,
    embroideryThreadColors
  );

  // Process each color tag
  colorTags.forEach(tag => {
    if (!isValidColorTag(tag)) {
      console.warn('Invalid tag structure:', tag);
      return;
    }

    const hasMatch = getColorMatches(colors, tag)
      .some(([color, collection]) => hasMatchingColor(color, collection));

    if (hasMatch) {
      tagSet.add(tag.label);
    }
  });

  return Array.from(tagSet);
};