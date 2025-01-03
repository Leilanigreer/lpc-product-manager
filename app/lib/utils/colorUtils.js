// app/lib/utils/colorUtils.js

export const getColors = (formState, leatherColors, stitchingThreadColors, embroideryThreadColors) => {
  const colors = {
    leatherColor1: leatherColors.find(color => color.value === formState.selectedLeatherColor1),
    leatherColor2: leatherColors.find(color => color.value === formState.selectedLeatherColor2),
    stitchingThreadColor: formState.selectedStitchingColor?.id ? 
      {
        ...stitchingThreadColors.find(color => color.value === formState.selectedStitchingColor.id),
        selectedNumber: formState.selectedStitchingColor.number,
        selectedName: formState.selectedStitchingColor.name
      } : null,
    embroideryThreadColor: formState.selectedEmbroideryColor?.id ?
      {
        ...embroideryThreadColors.find(color => color.value === formState.selectedEmbroideryColor.id),
        selectedNumber: formState.selectedEmbroideryColor.number,
        selectedName: formState.selectedEmbroideryColor.name
      } : null,
  };
  return colors;
};