// app/lib/utils/colorUtils.js

export const getColors = (formState, leatherColors, stitchingThreadColors, embroideryThreadColors) => {
  const colors = {
    leatherColor1: leatherColors.find(color => color.value === formState.selectedLeatherColor1),
    leatherColor2: leatherColors.find(color => color.value === formState.selectedLeatherColor2),
    stitchingThreadColor: stitchingThreadColors.find(color => color.value === formState.selectedStitchingColor),
    embroideryThreadColor: embroideryThreadColors.find(color => color.value === formState.selectedEmbroideryColor),
  };
  return colors;
};


// Used in generateVariants, generateTitle, & generateTags