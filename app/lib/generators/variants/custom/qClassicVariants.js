import { formatSKU, isWoodType } from '../../../utils';

/**
 * Determines leather color based on style and selections
 */
const determineLeatherColor = ({
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

/**
 * Generates style phrase for variant name
 */
const getStylePhrase = (styleLabel) => 
  styleLabel === "50/50" ? "leather on left -" : "leather as";

/**
 * Creates QClassic variant
 */
export const createQClassicVariant = ({
  variant,
  shape,
  formState,
  baseCustomVariant,
  skuInfo,
  leatherColors,
  leatherColor1,
  leatherColor2,
  fairwayShape
}) => {
  // Validation
  if (!variant?.shapeId || !formState?.qClassicLeathers || !skuInfo?.parts) {
    console.error('Missing required parameters for QClassic variant');
    return null;
  }

  try {
    // Get QClassic leather color
    const shapeQClassicLeather = formState.qClassicLeathers[variant.shapeId];
    const qClassicLeatherColor = leatherColors.find(
      color => color.value === shapeQClassicLeather
    );

    if (!qClassicLeatherColor) {
      console.error('QClassic leather color not found');
      return null;
    }

    // Determine leather colors and styling
    const selectedLeatherColor = determineLeatherColor({
      variant,
      shapeQClassicLeather,
      formState,
      leatherColor1,
      leatherColor2,
      qClassicLeatherColor
    });

    const useOppositeColor = variant.style?.abbreviation === 'Fat';
    const leatherAbbreviation = useOppositeColor 
      ? (shapeQClassicLeather === formState.selectedLeatherColor1 
          ? leatherColor2.abbreviation 
          : leatherColor1.abbreviation)
      : qClassicLeatherColor.abbreviation;

    // Generate SKU
    const customSKU = formatSKU(
      skuInfo.parts,
      skuInfo.version,
      isWoodType(shape) ? fairwayShape : shape,
      { 
        isCustom: true,
        style: variant.style,
        qClassicLeatherAbbreviation: leatherAbbreviation
      }
    );

    if (!customSKU?.fullSKU) {
      console.error('Failed to generate SKU for QClassic variant');
      return null;
    }

    // Build variant name
    const stylePhrase = getStylePhrase(variant.style?.label);
    const shapeName = isWoodType(shape) ? 'Fairway' : shape.label;
    const variantName = `Customize ${selectedLeatherColor.label} ${stylePhrase} ${variant.style?.label} ${shapeName} +$15`;

    return {
      ...variant,
      ...baseCustomVariant,
      shapeId: isWoodType(shape) ? fairwayShape.value : shape.value,
      sku: customSKU.fullSKU,
      baseSKU: customSKU.baseSKU,
      variantName,
    };

  } catch (error) {
    console.error('Error creating QClassic variant:', error);
    return null;
  }
};