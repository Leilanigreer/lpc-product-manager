// app/lib/generators/variants/custom/utils/leatherUtils.js

export const determineLeatherColor = ({
  variant,
  shapeQClassicLeather,
  formState,
  leatherColor1,
  leatherColor2,
  qClassicLeatherColor
}) => {
  const useOppositeColor = variant.style?.abbreviation === 'Fat';
  
  if (useOppositeColor) {
    return shapeQClassicLeather === formState.selectedLeatherColor1 
      ? leatherColor2 
      : leatherColor1;
  }
  
  return qClassicLeatherColor;
};

export const getStylePhrase = (styleLabel) => 
  styleLabel === "50/50" ? "leather on left -" : "leather as";