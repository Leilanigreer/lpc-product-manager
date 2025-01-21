// app/lib/utils/validations/baseValidations.js
export const validateBaseRequirements = (formState) => {
  
  const hasOfferingType = !!formState.selectedOfferingType;
  const hasFontSelected = !!formState.selectedFont;
  const hasValidQuantity = formState.selectedOfferingType !== 'limitedEdition' || 
                          (!!formState.limitedEditionQuantity && 
                           parseInt(formState.limitedEditionQuantity) > 0);
  
  return {
    hasOfferingType,
    hasFontSelected,
    hasValidQuantity
  };
};