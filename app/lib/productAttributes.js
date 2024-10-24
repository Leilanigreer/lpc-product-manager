import { COLLECTION_TYPES } from "./constants";
import { getCollectionType } from "./collectionUtils";

const getColors = (formState, leatherColors, threadColors) => ({
  leatherColor1: leatherColors.find(color => color.value === formState.selectedLeatherColor1),
  leatherColor2: leatherColors.find(color => color.value === formState.selectedLeatherColor2),
  stitchingColor: threadColors.find(color => color.value === formState.selectedStitchingColor),
  offeringType: formState.selectedOfferingType
});

// Price lookup helper function
const getVariantPrice = (shapeId, collectionId, productPrices, shapes) => {
  console.log('Function called with:', {
    shapeId,
    collectionId,
    'Number of productPrices': productPrices.length,
    'Number of shapes': shapes.length
  });

  // Get the shape to check if it's a wood type
  const shape = shapes.find(s => s.value === shapeId);
  console.log('Shape lookup result:', shape || 'Shape not found');
  
  if (!shape) {
    console.warn(`Shape not found for ID: ${shapeId}`);
    return "140.00"; // Default fallback price
  }

  // If it's a wood type, use Fairway's shape ID
  const woodAbbreviations = ['3Wood', '5Wood', '7Wood', 'Fairway'];
  const isWoodType = woodAbbreviations.includes(shape.abbreviation);
  console.log('Wood type check:', {
    abbreviation: shape.abbreviation,
    isWoodType
  });
  
  // Find Fairway's shape ID if needed
  let lookupShapeId = shapeId;
  if (isWoodType) {
    const fairwayShape = shapes.find(s => s.abbreviation === 'Fairway');
    console.log('Fairway shape lookup:', fairwayShape || 'Fairway shape not found');
    
    if (fairwayShape) {
      lookupShapeId = fairwayShape.value;
      console.log('Using Fairway shape ID instead:', lookupShapeId);
    } else {
      console.warn('Fairway shape not found');
      return "140.00";
    }
  }

  // Look up the price using the correct field names from your data
  console.log('Searching for price with:', {
    lookupShapeId,
    collectionId
  });

  // Log first few prices to see their structure
  console.log('First 3 prices in productPrices:', 
    productPrices.slice(0, 3).map(p => ({
      shapeId: p.shapeId,
      collectionId: p.collectionId,
      shopifyPrice: p.shopifyPrice
    }))
  );

  const priceData = productPrices.find(
    price => price.shapeId === lookupShapeId && price.collectionId === collectionId
  );

  console.log('Price lookup result:', priceData || 'No matching price found');

  if (!priceData) {
    console.warn(`No price found for shape ${lookupShapeId} in collection ${collectionId}`);
    return "140.00";
  }

  // Use shopifyPrice which is already a number
  const finalPrice = priceData.shopifyPrice.toFixed(2);
  console.log('Returning final price:', finalPrice);
  return finalPrice;
};

const generateSKUParts = (collectionType, { leatherColor1, leatherColor2, stitchingColor, shape, style, isCustom = false }) => {
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

const generateVariants = async (formState, leatherColors, threadColors, shapes, styles, productPrices) => {
  if (!formState || !leatherColors || !threadColors || !shapes || !productPrices) {
    console.error("Missing required parameters for variant generation");
    return [];
  }

  const { leatherColor1, leatherColor2, stitchingColor, offeringType } = getColors(formState, leatherColors, threadColors);
  const collectionType = getCollectionType(formState.selectedCollection);

  if (!leatherColor1) {
    console.error("Primary leather color not found");
    return [];
  }

  // Generate base variants
  let variants = Object.entries(formState.weights || {})
    .filter(([_, weight]) => weight !== "")
    .map(([shapeId, weight]) => {
      const shape = shapes.find(s => s.value === shapeId);
      if (!shape) return null;

      const selectedStyleId = formState.selectedStyles?.[shapeId];
      const selectedStyle = styles?.find(style => style.value === selectedStyleId);

      // Generate base SKU without style abbreviation
      const skuParts = generateSKUParts(collectionType, {
        leatherColor1,
        leatherColor2,
        stitchingColor,
        shape,
        style: selectedStyle,
        isCustom: false
      });
      if (!skuParts) return null;

      // Get price (using Fairway price for wood types)
      const priceShapeId = isWoodType(shape) ? 
        shapes.find(s => s.abbreviation === 'Fairway')?.value || shapeId : 
        shapeId;
      
      const basePrice = getVariantPrice(
        priceShapeId,
        formState.selectedCollection,
        productPrices,
        shapes
      );

      // Construct variant name based on collection type
      let variantName;
      if (collectionType === COLLECTION_TYPES.QUILTED || collectionType === COLLECTION_TYPES.ARGYLE) {
        variantName = shape.label;
      } else {
        variantName = selectedStyle ? `${selectedStyle.label} ${shape.label}` : shape.label;
      }

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

  // Generate custom variants if needed
  if (offeringType === "customizable") {
    const customVariants = [];
    const processedStyles = new Set();

    variants.forEach(variant => {
      const basePrice = parseFloat(variant.price);
      const customPrice = (basePrice + 15).toFixed(2);
      const shape = shapes.find(s => s.label === variant.shape);

      if (collectionType === COLLECTION_TYPES.QUILTED || collectionType === COLLECTION_TYPES.ARGYLE) {
        if (isWoodType(shape)) {
          // Only add Fairway custom variant once for all wood types
          if (!customVariants.some(cv => cv.variantName === 'Customize Fairway +$15')) {
            customVariants.push({
              ...variant,
              shapeId: shapes.find(s => s.abbreviation === 'Fairway')?.value,
              sku: `${variant.sku.split('-').slice(0, -1).join('-')}-Fairway-Custom`,
              variantName: 'Customize Fairway +$15',
              price: customPrice,
              isCustom: true,
              options: {
                Style: 'Customize Fairway'
              }
            });
          }
        } else {
          customVariants.push({
            ...variant,
            sku: `${variant.sku}-Custom`,
            variantName: `Customize ${variant.variantName} +$15`,
            price: customPrice,
            isCustom: true,
            options: {
              Style: `Customize ${variant.variantName}`
            }
          });
        }
      } else {
        // Animal/Classic/QClassic pattern
        if (isWoodType(shape)) {
          // For wood types, create a custom variant with style
          const styleKey = `${variant.style?.label}-${shape.abbreviation}`;
          if (!processedStyles.has(styleKey)) {
            customVariants.push({
              ...variant,
              shapeId: shapes.find(s => s.abbreviation === 'Fairway')?.value,
              sku: `${variant.sku.split('-').slice(0, -1).join('-')}-Fairway-${variant.style?.abbreviation}-Custom`,
              variantName: `Customize ${variant.style?.label} Fairway +$15`,
              price: customPrice,
              isCustom: true,
              options: {
                Style: `Customize ${variant.style?.label} Fairway`
              }
            });
            processedStyles.add(styleKey);
          }
        } else {
          // For non-wood types, create individual custom variants
          customVariants.push({
            ...variant,
            sku: `${variant.sku}-${variant.style?.abbreviation}-Custom`,
            variantName: `Customize ${variant.style?.label} ${variant.shape} +$15`,
            price: customPrice,
            isCustom: true,
            options: {
              Style: `Customize ${variant.style?.label} ${variant.shape}`
            }
          });
        }
      }
    });

    variants = [...variants, ...customVariants];
  }

  return variants;
};

export const generateProductData = async (formState, leatherColors, threadColors, shapes, styles, productPrices) => {
  const title = generateTitle(formState, leatherColors, threadColors);
  return {
    title,
    mainHandle: generateMainHandle(formState, title),
    productType: generateProductType(formState),
    variants: await generateVariants(formState, leatherColors, threadColors, shapes, styles, productPrices)
  };
};


export const generateTitle = (formState, leatherColors, threadColors) => {
  if (!formState || !leatherColors || !threadColors) {
    console.error("Missing required parameters for generateTitle");
    return "";
  }

  const { leatherColor1, leatherColor2, stitchingColor } = getColors(formState, leatherColors, threadColors);
  const collectionType = getCollectionType(formState.selectedCollection);

  if (!leatherColor1) {
    return "Primary leather color missing";
  }
  
  let title = "";
  
  switch (collectionType) {
    case COLLECTION_TYPES.ANIMAL:
    case COLLECTION_TYPES.CLASSIC:
    case COLLECTION_TYPES.QCLASSIC:
      if (!leatherColor2) {
        return "Secondary leather color missing";
      }
      title = `${leatherColor1.label} with ${leatherColor2.label} Leather`;
      break;
  
    case COLLECTION_TYPES.ARGYLE:
      if (!leatherColor2) {
        return "Secondary leather color missing";
      }
      if (!stitchingColor) {
        return "Stitching color missing";
      }
      title = `${leatherColor1.label} and ${leatherColor2.label} Leather with ${stitchingColor.label} Stitching`;
      break;
  
    case COLLECTION_TYPES.QUILTED:
      if (!stitchingColor) {
        return "Stitching color missing";
      }
      title = `${leatherColor1.label} Leather Quilted with ${stitchingColor.label} Stitching`;
      break;
  
    default:
      title = "Pending Title";
  }

  return title;
};

export const generateMainHandle = (formState, title) => {
  if (!title || title === "Pending Title") {
    return "pending-main-handle";
  }

  const tempMainHandle = title.toLowerCase()
                          .replace(/\s+/g, '-')  // Replace all spaces with hyphens
                          .replace(/[^a-z0-9-]/g, ''); // Remove any special characters

  const collectionType = getCollectionType(formState.selectedCollection);
  
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

export const generateProductType = (formState) => {
  const collectionType = getCollectionType(formState.selectedCollection);

  if (collectionType === COLLECTION_TYPES.QUILTED) {
    return "Quilted"
  } else if (collectionType === COLLECTION_TYPES.ANIMAL) {
    return "Animal Print"
  } else if (collectionType === COLLECTION_TYPES.ARGYLE) {
    return "Argyle"
  } else if (collectionType === COLLECTION_TYPES.CLASSIC) {
    return "Classic"
  } else if (collectionType === COLLECTION_TYPES.QCLASSIC) {
    return "QClassic"
  } else {
    return ""
  }
};