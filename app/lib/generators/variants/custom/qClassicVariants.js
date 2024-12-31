// app/lib/generators/variants/custom/qClassicVariants.js

import { formatSKU, determineLeatherColor, getStylePhrase } from '../../../utils';

/**
 * Gets leather details for QClassic variants
 */
const getQClassicLeatherDetails = ({
  variant,
  formState,
  leatherColors,
  leatherColor1,
  leatherColor2
}) => {
  const shapeQClassicLeather = formState.qClassicLeathers[variant.shapeId];
  const qClassicLeatherColor = leatherColors.find(
    color => color.value === shapeQClassicLeather
  );

  if (!qClassicLeatherColor) {
    throw new Error('QClassic leather color not found');
  }

  const selectedLeatherColor = determineLeatherColor({
    variant,
    shapeQClassicLeather,
    formState,
    leatherColor1,
    leatherColor2,
    qClassicLeatherColor
  });

  // The leatherAbbreviation should come from the selected leather color
  const leatherAbbreviation = selectedLeatherColor.abbreviation;

  return {
    selectedLeatherColor,
    leatherAbbreviation
  };
};

const formatQClassicVariantName = ({
  shape,
  selectedLeatherColor,
  style,
  stylePhrase
}) => {
  if (style?.label === "50/50") {
    return `Customize ${shape.label} - ${style?.label} with ${selectedLeatherColor.label} ${stylePhrase} +$15`;
  }
  return `Customize ${shape.label} - ${selectedLeatherColor.label} ${stylePhrase} ${style?.label} +$15`;
};

/**
 * Creates QClassic variant for non-wood shapes
 */
export const createQClassicNonWoodVariant = ({
  variant,
  shape,
  formState,
  baseCustomVariant,
  customPrice,
  weight,
  skuInfo,
  leatherColors,
  leatherColor1,
  leatherColor2
}) => {
  if (!variant?.shapeId || !formState?.qClassicLeathers || !skuInfo?.parts) {
    console.error('Missing required parameters for QClassic variant');
    return null;
  }

  try {
    const { selectedLeatherColor, leatherAbbreviation } = getQClassicLeatherDetails({
      variant,
      formState,
      leatherColors,
      leatherColor1,
      leatherColor2
    });

    const customSKU = formatSKU(
      skuInfo.parts,
      skuInfo.version,
      shape,
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

    const stylePhrase = getStylePhrase(variant.style?.label);
    const variantName = formatQClassicVariantName({
      shape,
      selectedLeatherColor,
      style: variant.style,
      stylePhrase
    });

    return {
      ...variant,
      ...baseCustomVariant,
      sku: customSKU.fullSKU,
      baseSKU: customSKU.baseSKU,
      variantName,
      price: customPrice,
      weight,
      isCustom: true,
    };

  } catch (error) {
    console.error('Error creating QClassic variant:', error);
    return null;
  }
};