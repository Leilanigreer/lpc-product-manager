// app/lib/generators/variants/custom/createCustom.js

import { COLLECTION_TYPES } from '../../../constants';
import { isWoodType, isPutter, formatSKU } from '../../../utils';
import { createWoodCustomVariants } from './woodVariants';
import { createQClassicVariant } from './qClassicVariants';

/**
 * Creates a custom variant based on shape type and collection
 * @param {Object} params - Parameters for custom variant creation
 * @param {Object} params.variant - Base variant to create custom version from
 * @param {Object} params.formState - Current form state
 * @param {Array<Object>} params.shapes - Available shapes
 * @param {Array<Object>} params.leatherColors - Available leather colors
 * @param {string} params.collectionType - Type of collection
 * @param {Object} params.baseCustomVariant - Base custom variant properties
 * @param {string} params.customPrice - Price for custom variant
 * @param {number} params.weight - Weight of the variant
 * @param {Object} params.skuInfo - SKU generation info
 * @param {Object} params.leatherColor1 - Primary leather color
 * @param {Object} params.leatherColor2 - Secondary leather color
 * @returns {Object|null} Created custom variant or null if creation fails
 */
export const createCustomVariant = ({
  variant,
  formState,
  shapes,
  leatherColors,
  collectionType,
  baseCustomVariant,
  customPrice,
  weight,
  skuInfo,
  leatherColor1,
  leatherColor2
}) => {
  const shape = shapes.find(s => s.label === variant.shape);
  if (!shape) return null;

  // Handle wood types
  if (isWoodType(shape)) {
    const woodVariant = createWoodCustomVariants(
      variant,
      shapes,
      baseCustomVariant,
      customPrice,
      weight,
      skuInfo
    );

    if (!woodVariant) return null;

    // Add QClassic properties if needed
    if (collectionType === COLLECTION_TYPES.QCLASSIC) {
      const qClassicProps = createQClassicVariant({
        variant,
        formState,
        baseCustomVariant,
        skuInfo,
        leatherColors,
        leatherColor1,
        leatherColor2
      });

      if (!qClassicProps) return null;

      return {
        ...woodVariant,
        ...qClassicProps
      };
    }

    return woodVariant;
  }

  // Handle putters (Blade and Mallet)
  if (isPutter(shape)) {
    const customSKU = formatSKU(
      skuInfo.parts,
      skuInfo.version,
      shape,
      { isCustom: true }
    );

    return {
      ...variant,
      ...baseCustomVariant,
      sku: customSKU.fullSKU,
      baseSKU: customSKU.baseSKU,
      variantName: `Customize ${variant.shape} +$15`,
      price: customPrice,
      weight,
      isCustom: true,
      options: { Style: `Customize ${variant.shape}` }
    };
  }

  // Handle other shapes (Driver, Hybrid, etc.)
  const customSKU = formatSKU(
    skuInfo.parts,
    skuInfo.version,
    shape,
    { 
      isCustom: true,
      style: variant.style
    }
  );

  const variantName = variant.style?.label ? 
    `Customize ${variant.shape} - ${variant.style.label} +$15` :
    `Customize ${variant.shape} +$15`;

  return {
    ...variant,
    ...baseCustomVariant,
    sku: customSKU.fullSKU,
    baseSKU: customSKU.baseSKU,
    variantName,
    price: customPrice,
    weight,
    isCustom: true,
    options: { Style: variantName }
  };
};

/**
 * Creates all custom variants for a collection of variants
 * @param {Object} params - Parameters object
 * @param {Array<Object>} params.variants - Original variants to create customs from
 * @param {Object} params.formState - Current form state
 * @param {Array<Object>} params.shapes - Available shapes
 * @param {Array<Object>} params.leatherColors - Available leather colors
 * @param {string} params.collectionType - Type of collection
 * @param {Object} params.skuInfo - SKU generation info
 * @param {Object} params.leatherColor1 - Primary leather color
 * @param {Object} params.leatherColor2 - Secondary leather color
 * @returns {Array<Object>} Array of custom variants
 */
export const createCustomVariants = ({
  variants,
  formState,
  shapes,
  leatherColors,
  collectionType,
  skuInfo,
  leatherColor1,
  leatherColor2
}) => {
  const customVariants = [];
  const processedStyles = new Set();
  let customPosition = variants.length + 2;

  variants.forEach(variant => {
    const customPrice = (parseFloat(variant.price) + 15).toFixed(2);
    const shape = shapes.find(s => s.label === variant.shape);
    if (!shape) return;

    const baseCustomVariant = {
      stitchingThreadId: variant.stitchingThreadId,
      amannNumberId: variant.amannNumberId,
      embroideryThreadId: variant.embroideryThreadId,
      isacordNumberId: variant.isacordNumberId
    };

    const weight = variant.weight;

    if (!needsStyle(collectionType)) {
      // Handle Quilted and Argyle collections
      if (isWoodType(shape)) {
        if (!customVariants.some(cv => cv.variantName === 'Customize Fairway +$15')) {
          const fairwayShape = shapes.find(s => s.abbreviation === 'Fairway');
          if (!fairwayShape) return;

          const customSKU = formatSKU(
            skuInfo.parts,
            skuInfo.version,
            fairwayShape,
            { isCustom: true }
          );

          customVariants.push({
            ...variant,
            ...baseCustomVariant,
            shapeId: fairwayShape.value,
            sku: customSKU.fullSKU,
            baseSKU: customSKU.baseSKU,
            variantName: 'Customize Fairway +$15',
            price: customPrice,
            weight,
            isCustom: true,
            position: customPosition++,
            options: { Style: 'Customize Fairway' }
          });
        }
      } else {
        // Handle non-wood shapes for Quilted/Argyle
        const customSKU = formatSKU(
          skuInfo.parts,
          skuInfo.version,
          shape,
          { isCustom: true }
        );

        customVariants.push({
          ...variant,
          ...baseCustomVariant,
          sku: customSKU.fullSKU,
          baseSKU: customSKU.baseSKU,
          variantName: `Customize ${variant.variantName} +$15`,
          price: customPrice,
          weight,
          isCustom: true,
          position: customPosition++,
          options: { Style: `Customize ${variant.variantName}` }
        });
      }
    } else {
      // Handle Animal, Classic, QClassic collections
      if (isWoodType(shape)) {
        const styleKey = `${variant.style?.label}-${shape.abbreviation}`;
        if (processedStyles.has(styleKey)) return;

        const fairwayShape = shapes.find(s => s.abbreviation === 'Fairway');
        if (!fairwayShape) return;

        if (collectionType === COLLECTION_TYPES.QCLASSIC) {
          const qClassicVariant = createQClassicVariant({
            variant,
            shape,
            formState,
            baseCustomVariant,
            skuInfo,
            leatherColors,
            leatherColor1,
            leatherColor2,
            fairwayShape
          });

          if (qClassicVariant) {
            customVariants.push({
              ...qClassicVariant,
              price: customPrice,
              weight,
              isCustom: true,
              position: customPosition++
            });
            processedStyles.add(styleKey);
          }
        } else {
          // Handle Animal and Classic collections
          const customSKU = formatSKU(
            skuInfo.parts,
            skuInfo.version,
            fairwayShape,
            { 
              isCustom: true,
              style: variant.style
            }
          );

          const customVariant = {
            ...variant,
            ...baseCustomVariant,
            shapeId: fairwayShape.value,
            sku: customSKU.fullSKU,
            baseSKU: customSKU.baseSKU,
            variantName: `Customize Fairway - ${variant.style?.label} +$15`,
            price: customPrice,
            weight,
            isCustom: true,
            position: customPosition++,
            options: { Style: `Customize ${variant.style?.label} Fairway` }
          };
          
          customVariants.push(customVariant);
          processedStyles.add(styleKey);
        }
      } else {
        // Handle non-wood shapes for Animal/Classic/QClassic
        if (collectionType === COLLECTION_TYPES.QCLASSIC) {
          const qClassicVariant = createQClassicVariant({
            variant,
            shape,
            formState,
            baseCustomVariant,
            skuInfo,
            leatherColors,
            leatherColor1,
            leatherColor2
          });

          if (qClassicVariant) {
            customVariants.push({
              ...qClassicVariant,
              price: customPrice,
              weight,
              isCustom: true,
              position: customPosition++
            });
          }
        } else {
          // Handle non-wood shapes for Animal/Classic
          const customSKU = formatSKU(
            skuInfo.parts,
            skuInfo.version,
            shape,
            { 
              isCustom: true,
              style: variant.style
            }
          );

          const variantName = variant.style?.label ? 
            `Customize ${shape.label} - ${variant.style.label} +$15` :
            `Customize ${shape.label} +$15`;

          customVariants.push({
            ...variant,
            ...baseCustomVariant,
            sku: customSKU.fullSKU,
            baseSKU: customSKU.baseSKU,
            variantName,
            price: customPrice,
            weight,
            isCustom: true,
            position: customPosition++,
            options: { Style: variantName }
          });
        }
      }
    }
  });

  return customVariants;
};