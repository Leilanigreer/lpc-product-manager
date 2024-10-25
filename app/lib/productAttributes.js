// app/lib/productAttributes.js


import { COLLECTION_TYPES } from "./constants";
import { getShopifyCollectionType } from "./collectionUtils";

const getColors = (formState, leatherColors, threadColors) => ({
  leatherColor1: leatherColors.find(color => color.value === formState.selectedLeatherColor1),
  leatherColor2: leatherColors.find(color => color.value === formState.selectedLeatherColor2),
  stitchingColor: threadColors.find(color => color.value === formState.selectedStitchingColor),
  offeringType: formState.selectedOfferingType
});

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

const generateSKUParts = (collectionType, { leatherColor1, leatherColor2, stitchingColor, shape }) => {
  const baseParts = {
    [COLLECTION_TYPES.QUILTED]: () => [
      "Quilted",
      leatherColor1.abbreviation,
      stitchingColor.abbreviation,
      shape.abbreviation
    ],
    
    [COLLECTION_TYPES.ARGYLE]: () => [
      "Argyle",
      leatherColor1.abbreviation,
      leatherColor2?.abbreviation,
      stitchingColor.abbreviation,
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

const generateVariants = async (formState, leatherColors, threadColors, shapes, styles, productPrices, shopifyCollections) => {
  if (!formState || !leatherColors || !threadColors || !shapes || !productPrices || !shopifyCollections) {
    console.error("Missing required parameters for variant generation");
    return [];
  }

  const { leatherColor1, leatherColor2, stitchingColor, offeringType } = getColors(formState, leatherColors, threadColors);
  const collectionType = getCollectionType(formState, shopifyCollections);

  if (!leatherColor1) {
    console.error("Primary leather color not found");
    return [];
  }

  let variants = Object.entries(formState.weights || {})
    .filter(([_, weight]) => weight !== "")
    .map(([shapeId, weight]) => {
      const shape = shapes.find(s => s.value === shapeId);
      if (!shape) return null;

      const selectedStyleId = formState.selectedStyles?.[shapeId];
      const selectedStyle = styles?.find(style => style.value === selectedStyleId);

      const skuParts = generateSKUParts(collectionType, {
        leatherColor1,
        leatherColor2,
        stitchingColor,
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

      const variantName = (collectionType === COLLECTION_TYPES.QUILTED || collectionType === COLLECTION_TYPES.ARGYLE) ?
        shape.label :
        selectedStyle ? `${selectedStyle.label} ${shape.label}` : shape.label;

      return {
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
    })
    .filter(item => item !== null);

  if (offeringType === "customizable") {
    const customVariants = [];
    const processedStyles = new Set();

    variants.forEach(variant => {
      const customPrice = (parseFloat(variant.price) + 15).toFixed(2);
      const shape = shapes.find(s => s.label === variant.shape);
      const weight = variant.weight;

      if (collectionType === COLLECTION_TYPES.QUILTED || collectionType === COLLECTION_TYPES.ARGYLE) {
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
            options: { Style: `Customize ${variant.variantName}` }
          });
        }
      } else {
        if (isWoodType(shape)) {
          const styleKey = `${variant.style?.label}-${shape.abbreviation}`;
          if (!processedStyles.has(styleKey)) {
            customVariants.push({
              ...variant,
              shapeId: shapes.find(s => s.abbreviation === 'Fairway')?.value,
              sku: `${variant.sku.split('-').slice(0, -1).join('-')}-Fairway-${variant.style?.abbreviation}-Custom`,
              variantName: `Customize ${variant.style?.label} Fairway +$15`,
              price: customPrice,
              weight,
              isCustom: true,
              options: { Style: `Customize ${variant.style?.label} Fairway` }
            });
            processedStyles.add(styleKey);
          }
        } else {
          customVariants.push({
            ...variant,
            sku: `${variant.sku}-${variant.style?.abbreviation}-Custom`,
            variantName: `Customize ${variant.style?.label} ${variant.shape} +$15`,
            price: customPrice,
            weight,
            isCustom: true,
            options: { Style: `Customize ${variant.style?.label} ${variant.shape}` }
          });
        }
      }
    });

    variants = [...variants, ...customVariants];
  }

  // console.log("Generated variants:", variants);

  return variants;
};

export const generateProductData = async (formState, leatherColors, threadColors, shapes, styles, productPrices, shopifyCollections) => {
  const title = generateTitle(formState, leatherColors, threadColors, shopifyCollections);
  return {
    title,
    mainHandle: generateMainHandle(formState, title, shopifyCollections),
    productType: generateProductType(formState, shopifyCollections),
    variants: await generateVariants(formState, leatherColors, threadColors, shapes, styles, productPrices, shopifyCollections)
  };
};

const generateTitle = (formState, leatherColors, threadColors, shopifyCollections) => {
  const { leatherColor1, leatherColor2, stitchingColor } = getColors(formState, leatherColors, threadColors);
  const collectionType = getCollectionType(formState, shopifyCollections);

  if (!leatherColor1) return "Primary leather color missing";
  
  switch (collectionType) {
    case COLLECTION_TYPES.ANIMAL:
    case COLLECTION_TYPES.CLASSIC:
    case COLLECTION_TYPES.QCLASSIC:
      return !leatherColor2 ? "Secondary leather color missing" : 
        `${leatherColor1.label} with ${leatherColor2.label} Leather`;
  
    case COLLECTION_TYPES.ARGYLE:
      if (!leatherColor2) return "Secondary leather color missing";
      if (!stitchingColor) return "Stitching color missing";
      return `${leatherColor1.label} and ${leatherColor2.label} Leather with ${stitchingColor.label} Stitching`;
  
    case COLLECTION_TYPES.QUILTED:
      return !stitchingColor ? "Stitching color missing" :
        `${leatherColor1.label} Leather Quilted with ${stitchingColor.label} Stitching`;
  
    default:
      return "Pending Title";
  }
};

const generateMainHandle = (formState, title, shopifyCollections) => {
  if (!title || title === "Pending Title") return "pending-main-handle";

  const tempMainHandle = title.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const collectionType = getCollectionType(formState, shopifyCollections);
  
  switch(collectionType) {
    case COLLECTION_TYPES.QUILTED:
    case COLLECTION_TYPES.ANIMAL:
    case COLLECTION_TYPES.CLASSIC:
      return `${tempMainHandle}-golf-headcovers`;
    case COLLECTION_TYPES.ARGYLE:
      return `${tempMainHandle}-argyle-golf-headcovers`; 
    case COLLECTION_TYPES.QCLASSIC:
      return `${tempMainHandle}-quilted-golf-headcovers`;
    default:
      return "pending-main-handle";
  }
};

const generateProductType = (formState, shopifyCollections) => {
  const typeMap = {
    [COLLECTION_TYPES.QUILTED]: "Quilted",
    [COLLECTION_TYPES.ANIMAL]: "Animal Print",
    [COLLECTION_TYPES.ARGYLE]: "Argyle",
    [COLLECTION_TYPES.CLASSIC]: "Classic",
    [COLLECTION_TYPES.QCLASSIC]: "QClassic"
  };
  
  return typeMap[getCollectionType(formState, shopifyCollections)] || "";
};