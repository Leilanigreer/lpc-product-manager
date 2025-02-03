// app/lib/generators/variants/createCustom.js

import { formatSKU, calculatePrice } from '../../utils';

const getVariantName = (shapeData, formState) => {
  // Base name prefix and suffix
  const prefix = 'Customize';
  const suffix = '+$15';

  // Get shape label, using "Fairway" for wood types
  const shapeLabel = shapeData.shapeType === 'WOOD' ? 'Fairway' : shapeData.label;
  
  if (shapeData.shapeType === 'PUTTER') {
    return `${prefix} ${shapeLabel} ${suffix}`;
  }

  // If no shapeData style or color designation needed, return simple name
  if (!shapeData.style && !shapeData.needsColorDesignation) {
    return `${prefix} ${shapeLabel} ${suffix}`;
  }

  // Get style info
  const style = shapeData.style
  const leatherColor = shapeData.colorDesignation;

  // Handle non-color designation styled variants
  if (style && !shapeData.needsColorDesignation) {
    return `${prefix} ${shapeLabel} - ${style.label} ${suffix}`;
  }

  // Handle color designation variants
  if (shapeData.needsColorDesignation && leatherColor) {
    const styleSource = formState.styleMode === 'global'
      ? formState.globalStyle
      : shapeData.style

    const leatherPhrase = styleSource.leatherPhrase || 'leather as';
    let colorLabel = leatherColor.label;

    // Handle opposite leather case
    if (styleSource.useOppositeLeather) {
      const { primary, secondary } = formState.leatherColors;
      colorLabel = leatherColor.value === primary?.value ? secondary?.label : primary?.label;
    }

    // Apply naming pattern
    switch (styleSource.namePattern) {
      case 'STYLE_FIRST':
        return `${prefix} ${shapeLabel} - ${styleSource.label} with ${colorLabel} ${leatherPhrase} ${suffix}`;

      case 'CUSTOM':
        if (style.customNamePattern) {
          const name = style.customNamePattern
            .replace('{shape.label}', shapeLabel)
            .replace('{style.label}', style.label)
            .replace('{leather.label}', colorLabel);
          return `${prefix} ${name} ${suffix}`;
        }
      // Fall through to STANDARD if no custom pattern

      case 'STANDARD':
      default:
        return `${prefix} ${shapeLabel} - ${colorLabel} ${leatherPhrase} ${styleSource.label} ${suffix}`;
    }
  }

  // Fallback
  return `${prefix} ${shapeLabel} ${suffix}`;
};

const generateCustomVariant = (shapeData, formState, skuInfo) => {
  if (!shapeData?.isSelected) return null;

  try {
    const customSku = formatSKU(
      skuInfo.parts,
      skuInfo.version,
      shapeData.value,
      formState,
      { isCustom: true }
    );

    if (!customSku?.fullSKU) {
      console.error('Failed to generate SKU for custom variant');
      return null;
    }

    const basePrice = calculatePrice(shapeData.value, formState);
    const customPrice = (parseFloat(basePrice) + 15).toFixed(2);

    return {
      shapeValue: shapeData.value,
      shape: shapeData.label,
      style: shapeData.style || null,
      colorDesignation: shapeData.colorDesignation || null,
      sku: customSku.fullSKU,
      baseSKU: customSku.baseSKU,
      variantName: getVariantName(shapeData, formState),
      price: customPrice,
      weight: shapeData.weight,
      isCustom: true,
      embroideryThread: formState.threadMode?.embroidery === 'perShape'
        ? shapeData.embroideryThread || null
        : formState.globalEmbroideryThread || null
    };
  } catch (error) {
    console.error('Error generating custom variant:', error);
    return null;
  }
};

export const createCustomVariants = (formState, skuInfo) => {
  const nonWoodVariants = Object.values(formState.allShapes)
    .filter(shape => shape.isSelected && shape.shapeType !== 'WOOD')
    .map(shape => generateCustomVariant(shape, formState, skuInfo))
    .filter(Boolean);

  const processedWoodShapes = [];

  const woodVariants = Object.values(formState.allShapes)
    .filter(shape => shape.isSelected && shape.shapeType === 'WOOD')
    .reduce((acc, shape) => {
      if (shouldCollapseWoodVariants(shape, processedWoodShapes, formState)) {
        console.log(`Collapsing wood variant: ${shape.label}`);
        return acc;
      }

      const variant = generateCustomVariant(shape, formState, skuInfo);
      if (variant) {
        processedWoodShapes.push(shape);
        acc.push(variant);
      }
      return acc;
    }, []);

  return [...nonWoodVariants, ...woodVariants];
};

export const shouldCollapseWoodVariants = (
  currentShape,
  processedShapes,
  formState
) => {
  if (!processedShapes.length) return false;

  const { collection } = formState;

  if (!collection.needsStyle) return true;

  const { styleMode, globalStyle } = formState;
  const currentStyle = styleMode === 'global' ? globalStyle : currentShape.style;

  return processedShapes.some(processedShape => {
    const processedStyle = styleMode === 'global' ? globalStyle : processedShape.style;
    const stylesMatch = currentStyle?.value === processedStyle?.value;
    const colorDesignationsMatch = !currentShape.needsColorDesignation ||
      (currentShape.colorDesignation?.value === processedShape.colorDesignation?.value);
    
    return stylesMatch && colorDesignationsMatch;
  });
};