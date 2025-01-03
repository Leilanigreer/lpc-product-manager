// app/lib/generators/variants/custom/createCustom.js

import { isWoodType, isPutter } from '../../../utils';
import { createWoodCustomVariant } from './woodVariants';
import { createQClassicNonWoodVariant } from './qClassicVariants';
import { createPutterCustomVariant } from './putterVariants';
import { createNonStyledCustomVariant, shouldUseNonStyledVariant } from './nonStyledVariants';
import { createStyledCustomVariant } from './styledVariants';
import { determineLeatherColor, getStylePhrase } from '../../../utils/leatherUtils';

export const createCustomVariants = ({
  variant,
  formState,
  shapes,
  leatherColors,
  collection,
  baseCustomVariant,
  customPrice,
  weight,
  skuInfo,
  leatherColor1,
  leatherColor2,
  processedStyles = new Set()
}) => {
  if (!variant || !shapes?.length || !collection) {
    console.error('Missing required parameters:', {
      hasVariant: !!variant,
      hasShapes: !!shapes?.length,
      hasCollection: !!collection
    });
    return null;
  }
  
  const shape = shapes.find(s => s.label === variant.shape);
  if (!shape) return null;

  // Handle wood types
  if (isWoodType(shape)) {
    const styleKey = variant.style ? `${variant.style.label}-${shape.abbreviation}` : 'wood-variants';
    if (processedStyles.has(styleKey)) {
      return null;
    }

    // For non-styled collections, use specific wood variant handler
    if (shouldUseNonStyledVariant(collection)) {
      const fairwayShape = shapes.find(s => s.abbreviation === 'Fairway');
      if (!fairwayShape) {
        console.error('Fairway shape not found');
        return null;
      }

      processedStyles.add(styleKey);
      return createWoodCustomVariant({
        variant,
        baseCustomVariant,
        customPrice,
        weight,
        skuInfo,
        shapes,
        collection
      });
    }

    let leatherData;
        if (collection.needsQClassicField) {
          const shapeQClassicLeather = formState.qClassicLeathers?.[variant.shapeId];
          const qClassicLeatherColor = leatherColors.find(
            color => color.value === shapeQClassicLeather
          );
    
          if (!qClassicLeatherColor) {
            console.error('QClassic leather color not found');
            return null;
          }
    
          const selectedLeatherColor = determineLeatherColor({
            variant,
            shapeQClassicLeather,
            formState,
            leatherColor1,
            leatherColor2,
            qClassicLeatherColor
          });
    
          leatherData = {
            leatherAbbreviation: selectedLeatherColor.abbreviation,
            leatherColorForName: selectedLeatherColor,
            stylePhrase: getStylePhrase(variant.style?.label)
          };
        }

    // For styled collections and QClassic, use regular wood variant handler
    const woodVariant = createWoodCustomVariant({
      variant,
      baseCustomVariant,
      customPrice,
      weight,
      skuInfo,
      shapes,
      collection,
      leatherData
    });

    if (woodVariant) processedStyles.add(styleKey);
    return woodVariant;
  }

  // Handle putters
  if (isPutter(shape)) {
    return createPutterCustomVariant({
      variant,
      shape,
      baseCustomVariant,
      customPrice,
      weight,
      skuInfo
    });
  }

  // Handle QClassic non-wood variants
  if (collection.needsQClassicField) {
    return createQClassicNonWoodVariant({
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
    });
  }

  if (!collection.needsStyle) {
    return createNonStyledCustomVariant({
      variant,
      shape,
      baseCustomVariant,
      customPrice,
      weight,
      skuInfo
    });
  }

  // Handle styled variants
  return createStyledCustomVariant({
    variant,
    shape,
    baseCustomVariant,
    customPrice,
    weight,
    skuInfo
  });
};