// app/lib/productAttributes.js

import { COLLECTION_TYPES } from "./constants";
import { 
  getShopifyCollectionType,
  needsStyle,
  needsQClassicField,
  needsStitchingColor,
  needsSecondaryColor
} from "./collectionUtils";

const getColors = (formState, leatherColors, stitchingThreadColors, embroideryThreadColors) => ({
  leatherColor1: leatherColors.find(color => color.value === formState.selectedLeatherColor1),
  leatherColor2: leatherColors.find(color => color.value === formState.selectedLeatherColor2),
  stitchingThreadColor: stitchingThreadColors.find(color => color.value === formState.selectedStitchingColor),
  embroideryThreadColor: embroideryThreadColors.find(color => color.value === formState.selectedEmbroideryColor),
});

const isPutter = (shape) => {
  return shape?.abbreviation === 'Mallet' || shape?.abbreviation === 'Blade';
};

const getCollectionType = (formState, shopifyCollections) => {
  const collection = shopifyCollections.find(col => col.value === formState.selectedCollection);
  return collection ? getShopifyCollectionType({ handle: collection.handle }) : 'Unknown';
};

const getVariantPrice = (shapeId, collectionId, productPrices, shapes) => {
  const shape = shapes.find(s => s.value === shapeId);
  
  if (!shape) {
    console.warn(`Shape not found for ID: ${shapeId}`);
    return "140.00";
  }

  const woodAbbreviations = ['3Wood', '5Wood', '7Wood', 'Fairway'];
  const isWoodType = woodAbbreviations.includes(shape.abbreviation);
  
  let lookupShapeId = shapeId;
  if (isWoodType) {
    const fairwayShape = shapes.find(s => s.abbreviation === 'Fairway');
    if (fairwayShape) {
      lookupShapeId = fairwayShape.value;
    } else {
      console.warn('Fairway shape not found');
      return "140.00";
    }
  }

  const priceData = productPrices.find(
    price => price.shapeId === lookupShapeId && price.shopifyCollectionId === collectionId
  );

  if (!priceData) {
    console.warn(`No price found for shape ${lookupShapeId} in collection ${collectionId}`);
    return "140.00";
  }

  return priceData.shopifyPrice.toFixed(2);
};

const SHAPE_ORDER = [
  'cm2duhfg000006y58dqulghkm',    // Driver
  'cm2duhfg300016y58sr14qoxd',    // 3-Wood
  'cm2duhfg300026y58r1rnkvbc',    // 5-Wood
  'cm2duhfg300036y583y11',        // 7-Wood
  'cm2duhfg300046y58o8d',         // Fairway
  'cm2duhfg300056y58ddfbtcxj',    // Hybrid
  'cm2duhfg300066y583ii779yr',    // Mallet
  'cm2duhfg300076y585ows'         // Blade
];

const generateSKUParts = (collectionType, { leatherColor1, leatherColor2, stitchingThreadColor, embroideryThreadColor, shape }) => {
  const baseParts = {
    [COLLECTION_TYPES.QUILTED]: () => [
      "Quilted",
      leatherColor1.abbreviation,
      embroideryThreadColor.abbreviation,
      shape.abbreviation
    ],
    
    [COLLECTION_TYPES.ARGYLE]: () => [
      "Argyle",
      leatherColor1.abbreviation,
      leatherColor2?.abbreviation,
      stitchingThreadColor.abbreviation,
      shape.abbreviation
    ],
    
    [COLLECTION_TYPES.ANIMAL]: () => [
      "Animal",
      leatherColor1.abbreviation,
      leatherColor2?.abbreviation,
      shape.abbreviation
    ],
    
    [COLLECTION_TYPES.CLASSIC]: () => [
      "Classic",
      leatherColor1.abbreviation,
      leatherColor2?.abbreviation,
      shape.abbreviation
    ],
    
    [COLLECTION_TYPES.QCLASSIC]: () => [
      "QClassic",
      leatherColor1.abbreviation,
      leatherColor2?.abbreviation,
      shape.abbreviation
    ]
  };

  const parts = baseParts[collectionType]?.();
  if (!parts) {
    console.error(`Unknown collection type: ${collectionType}`);
    return null;
  }

  return parts;
};

const isWoodType = (shape) => {
  const woodAbbreviations = ['3Wood', '5Wood', '7Wood', 'Fairway'];
  return woodAbbreviations.includes(shape.abbreviation);
};

const assignPositions = (variants, shapes) => {
  const selectedShapeIds = new Set(variants.map(v => v.shapeId));
  const orderedSelectedShapeIds = SHAPE_ORDER.filter(id => selectedShapeIds.has(id));
  
  console.log('Selected Shapes Order:', {
    selectedShapes: orderedSelectedShapeIds.map(id => {
      const shape = shapes.find(s => s.value === id);
      return {
        id,
        name: shape?.label,
        abbreviation: shape?.abbreviation
      };
    })
  });

  return variants.map(variant => ({
    ...variant,
    position: orderedSelectedShapeIds.indexOf(variant.shapeId) + 1
  }));
};

const generateVariants = async (formState, leatherColors, stitchingThreadColors, embroideryThreadColors, shapes, styles, productPrices, shopifyCollections) => {
  if (!formState || !leatherColors || !stitchingThreadColors || !embroideryThreadColors || !shapes || !productPrices || !shopifyCollections) {
    console.error("Missing required parameters for variant generation");
    return [];
  }

  const { leatherColor1, leatherColor2, stitchingThreadColor, embroideryThreadColor } = getColors(formState, leatherColors, stitchingThreadColors, embroideryThreadColors);
  const collectionType = getCollectionType(formState, shopifyCollections);

  if (!leatherColor1) {
    console.error("Primary leather color not found");
    return [];
  }

  // Validate collection-specific requirements
  if (needsSecondaryColor(collectionType) && !leatherColor2) {
    console.error("Secondary leather color required but not found");
    return [];
  }

  if (needsStitchingColor(collectionType) && !stitchingThreadColor) {
    console.error("Stitching thread color required but not found");
    return [];
  }

  // Generate regular variants
  let variants = Object.entries(formState.weights || {})
    .filter(([_, weight]) => weight !== "")
    .map(([shapeId, weight]) => {
      const shape = shapes.find(s => s.value === shapeId);
      if (!shape) return null;

      const isPutterShape = isPutter(shape);
      const shouldHaveStyle = !isPutterShape && needsStyle(collectionType);
      
      // Only get style if shape should have one
      const selectedStyleId = shouldHaveStyle ? formState.selectedStyles?.[shapeId] : null;
      const selectedStyle = shouldHaveStyle && selectedStyleId ? 
        styles?.find(style => style.value === selectedStyleId) : 
        null;

      const skuParts = generateSKUParts(collectionType, {
        leatherColor1,
        leatherColor2,
        stitchingThreadColor, 
        embroideryThreadColor,
        shape
      });
      if (!skuParts) return null;

      const priceShapeId = isWoodType(shape) ? 
        shapes.find(s => s.abbreviation === 'Fairway')?.value || shapeId : 
        shapeId;
      
      const basePrice = getVariantPrice(
        priceShapeId,
        formState.selectedCollection,
        productPrices,
        shapes
      );

      // Generate variant name based on shape type and collection needs
      const variantName = isPutterShape ? 
      shape.label :
      shouldHaveStyle && selectedStyle ? 
          `${selectedStyle.label} ${shape.label}` : 
          shape.label;

      const variant = {
        shapeId,
        shape: shape.label,
        styleId: selectedStyleId,
        style: selectedStyle,
        sku: skuParts.join('-'),
        variantName,
        price: basePrice,
        weight,
        isCustom: false,
        options: {
          Style: variantName
        }
      };

      // Add QClassic specific fields if needed
      if (needsQClassicField(collectionType)) {
        variant.qClassicLeather = formState.qClassicLeathers?.[shapeId];
      }

      return variant;
    })
    .filter(item => item !== null);

  // Assign positions to regular variants
  variants = assignPositions(variants, shapes);
  
  console.log('Regular Variants Order:', variants.map(v => ({
    name: v.variantName,
    position: v.position
  })));

  // Generate custom variants
  let nextPosition = variants.length + 1;
  const customVariants = [];
  const processedStyles = new Set();

  variants.forEach(variant => {
    const customPrice = (parseFloat(variant.price) + 15).toFixed(2);
    const shape = shapes.find(s => s.label === variant.shape);
    if (!shape) return;

    const weight = variant.weight;
    const isPutterShape = isPutter(shape);
    const shouldHaveStyle = !isPutterShape && needsStyle(collectionType);

    if (!needsStyle(collectionType)) {
      // Handle Quilted and Argyle collections (no style collections)
      if (isWoodType(shape)) {
        if (!customVariants.some(cv => cv.variantName === 'Customize Fairway +$15')) {
          customVariants.push({
            ...variant,
            shapeId: shapes.find(s => s.abbreviation === 'Fairway')?.value,
            sku: `${variant.sku.split('-').slice(0, -1).join('-')}-Fairway-Custom`,
            variantName: 'Customize Fairway +$15',
            price: customPrice,
            weight,
            isCustom: true,
            position: nextPosition++,
            options: { Style: 'Customize Fairway' }
          });
        }
      } else {
        customVariants.push({
          ...variant,
          sku: `${variant.sku}-Custom`,
          variantName: `Customize ${variant.variantName} +$15`,
          price: customPrice,
          weight,
          isCustom: true,
          position: nextPosition++,
          options: { Style: `Customize ${variant.variantName}` }
        });
      }
    } else {
      // Handle Animal, Classic, QClassic collections (style collections)
      if (isWoodType(shape)) {
        const styleKey = `${variant.style?.label}-${shape.abbreviation}`;
        if (!processedStyles.has(styleKey)) {
          const customVariant = {
            ...variant,
            shapeId: shapes.find(s => s.abbreviation === 'Fairway')?.value,
            sku: `${variant.sku.split('-').slice(0, -1).join('-')}-Fairway-${variant.style?.abbreviation}-Custom`,
            variantName: `Customize ${variant.style?.label} Fairway +$15`,
            price: customPrice,
            weight,
            isCustom: true,
            position: nextPosition++,
            options: { Style: `Customize ${variant.style?.label} Fairway` }
          };
          
          if (needsQClassicField(collectionType)) {
            customVariant.qClassicLeather = variant.qClassicLeather;
          }
          
          customVariants.push(customVariant);
          processedStyles.add(styleKey);
        }
      } else if (isPutterShape) {
        customVariants.push({
          ...variant,
          sku: `${variant.sku}-Custom`,
          variantName: `Customize ${shape.label} +$15`,
          price: customPrice,
          weight,
          isCustom: true,
          position: nextPosition++,
          options: { Style: `Customize ${shape.label}` }
        });
      } else {
        const customVariant = {
          ...variant,
          sku: `${variant.sku}-${variant.style?.abbreviation}-Custom`,
          variantName: `Customize ${variant.style?.label} ${variant.shape} +$15`,
          price: customPrice,
          weight,
          isCustom: true,
          position: nextPosition++,
          options: { Style: `Customize ${variant.style?.label} ${variant.shape}` }
        };

        if (needsQClassicField(collectionType)) {
          customVariant.qClassicLeather = variant.qClassicLeather;
        }

        customVariants.push(customVariant);
      }
    }
  });

  // Combine all variants
  variants = [...variants, ...customVariants];

  console.log('Final Variant Order:', variants.map(v => ({
    name: v.variantName,
    position: v.position,
    isCustom: v.isCustom
  })));

  return variants;
};

export const generateProductData = async (formState, leatherColors, stitchingThreadColor, embroideryThreadColor, colorTags, shapes, styles, productPrices, shopifyCollections) => {
  const title = generateTitle(formState, leatherColors, stitchingThreadColor, embroideryThreadColor, shopifyCollections);
  return {
    title,
    mainHandle: generateMainHandle(formState, title, shopifyCollections),
    productType: generateProductType(formState, shopifyCollections),
    seoTitle: generateSEOTitle(formState, title, shopifyCollections),
    descriptionHTML: generateDescriptionHTLM(formState, shopifyCollections),
    seoDescription: generateSEODescription(formState, shopifyCollections),
    tags: generateTags(formState, leatherColors, embroideryThreadColor, stitchingThreadColor, colorTags),
    variants: await generateVariants(formState, leatherColors, stitchingThreadColor, embroideryThreadColor, shapes, styles, productPrices, shopifyCollections)
  };
};

const generateTitle = (formState, leatherColors, stitchingThreadColors, embroideryThreadColors, shopifyCollections) => {
  const { leatherColor1, leatherColor2, stitchingThreadColor, embroideryThreadColor } = getColors(formState, leatherColors, stitchingThreadColors, embroideryThreadColors);
  const collectionType = getCollectionType(formState, shopifyCollections);

  if (!leatherColor1) return "Primary leather color missing";
  
  switch (collectionType) {
    case COLLECTION_TYPES.ANIMAL:
    case COLLECTION_TYPES.CLASSIC:
    case COLLECTION_TYPES.QCLASSIC:
      return !leatherColor2 ? "Secondary leather color missing" : 
        `${leatherColor1.label}