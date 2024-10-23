import { COLLECTION_TYPES } from "./constants";
import { getCollectionType } from "./collectionUtils";

const getColors = (formState, leatherColors, threadColors) => ({
  leatherColor1: leatherColors.find(color => color.value === formState.selectedLeatherColor1),
  leatherColor2: leatherColors.find(color => color.value === formState.selectedLeatherColor2),
  stitchingColor: threadColors.find(color => color.value === formState.selectedStitchingColor),
  offeringType: formState.selectedOfferingType
});

export const generateSKUS = async (formState, leatherColors, threadColors, shapes, styles) => {
  console.log("generateSKUS called with formState:", JSON.stringify(formState, null, 2));
    
  if (!formState || !leatherColors || !threadColors || !shapes ) {
    console.error("Missing required parameters for generateSKUS");
    console.log("formState:", formState);
    console.log("SKU threadColors:", threadColors);
    console.log("Available thread colors:", threadColors.map(c => c.value));
    console.log("Thread colors array:", JSON.stringify(threadColors, null, 2));
    return [];
  }

  const {leatherColor1, leatherColor2, stitchingColor, offeringType} = getColors(formState, leatherColors, threadColors);

  const collectionType = getCollectionType(formState.selectedCollection);
  
  // Check for styles only if the collection type requires it
  if ((collectionType === COLLECTION_TYPES.ANIMAL || 
    collectionType === COLLECTION_TYPES.CLASSIC || 
    collectionType === COLLECTION_TYPES.QCLASSIC) && !styles) {
    console.error("Missing styles for a collection type that requires it");
  return [];
  }

  if (!leatherColor1) {
    console.error("Primary leather color not found");
    return [];
  }

  const woodAbbreviations = ['3Wood', '5Wood', '7Wood'];

  let skus = Object.entries(formState.weights || {})
    .filter(([_, weight]) => weight !== "") // Only generate SKUs for shapes with non-empty weights
    .map(([shapeId, weight]) => {
      const shape = shapes.find(s => s.value === shapeId);
      
      if (!shape) {
        console.error(`Shape not found for id: ${shapeId}`);
        return null;
      }

      let skuParts = [];

      switch (collectionType) {
        case COLLECTION_TYPES.QUILTED:
          // console.log("Generating Quilted SKU");
          skuParts = [
            "Quilted",
            leatherColor1.abbreviation,
            stitchingColor.abbreviation,
            shape.abbreviation
          ];
          break;
        case COLLECTION_TYPES.ARGYLE:
          // console.log("Generating Argyle SKU");
          if (!leatherColor2) {
            console.error("Secondary leather color not found for Argyle collection");
            return null;
          }
          skuParts = [
            "Argyle",
            leatherColor1.abbreviation,
            leatherColor2.abbreviation,
            stitchingColor.abbreviation,
            shape.abbreviation
          ];
          break;
        case COLLECTION_TYPES.ANIMAL:
        case COLLECTION_TYPES.CLASSIC:
        case COLLECTION_TYPES.QCLASSIC:
          // console.log(`Generating ${collectionType} SKU`);
          if (!leatherColor2) {
            console.error(`Secondary leather color not found for ${collectionType} collection`);
            return null;
          }
          skuParts = [
            collectionType,
            leatherColor1.abbreviation,
            leatherColor2.abbreviation,
            shape.abbreviation
          ];
          break;
        default:
          // console.error(`Unknown collection type: ${collectionType}`);
          return null;
      }

      return { sku: skuParts.join('-'), shape: shape.abbreviation , shapeId };
    })
    .filter(item => item !== null);

  // console.log("Initial SKUs generated:", skus);

  if (offeringType === "customizable") {
    // console.log("Generating custom SKUs for customizable offering");
    const regularSkus = skus.map(item => item.sku);
    const customSkus = [];

    if (collectionType === COLLECTION_TYPES.QUILTED || collectionType === COLLECTION_TYPES.ARGYLE) {
      // console.log("Processing Quilted or Argyle collection for custom SKUs");
      const hasFairway = skus.some(item => item.shape === 'Fairway');
      // console.log("Has Fairway shape:", hasFairway);

      skus.forEach(item => {
        if (item.shape === 'Fairway' || (!hasFairway && woodAbbreviations.includes(item.shape))) {
          // If it's a Fairway or a wood club (when Fairway is not present), add only one Fairway-Custom
          if (!customSkus.some(sku => sku.endsWith('-Fairway-Custom'))) {
            customSkus.push(`${item.sku.replace(/-[^-]+$/, '')}-Fairway-Custom`);
            // console.log("Added Fairway-Custom SKU");
          }
        } else if (!woodAbbreviations.includes(item.shape)) {
          // For non-wood clubs, add individual custom SKUs
          customSkus.push(`${item.sku}-Custom`);
          // console.log(`Added custom SKU for ${item.shape}`);
        }
      });
    } else {
      // console.log("Processing other collection type for custom SKUs");
      // For Animal, QClassic, and Classic collections, add style abbreviation to custom SKUs
      skus.forEach(item => {
        const selectedStyleId = formState.selectedStyles?.[item.shapeId];
        const style = styles.find(s => s.value === selectedStyleId);
        if (style && style.abbreviation) {
          let customSku = item.sku;
          if (woodAbbreviations.includes(item.shape)) {
            // Replace wood shapes with 'Fairway' in custom SKUs
            customSku = customSku.replace(/-[^-]+$/, '-Fairway');
          }
          customSkus.push(`${customSku}-${style.abbreviation}-Custom`);
          // console.log(`Added custom SKU with style for ${item.shape}: ${customSkus[customSkus.length - 1]}`);
        } else {
          // console.error(`Style or style abbreviation not found for shape ${item.shape}. Style ID: ${selectedStyleId}`);
          customSkus.push(`${item.sku}-Custom`);
          // console.log(`Added custom SKU without style for ${item.shape}: ${item.sku}-Custom`);
        }
      });
    }

    skus = [...regularSkus, ...customSkus];
  } else {
    skus = skus.map(item => item.sku);
  }

  // console.log("Final generated SKUs:", skus);
  return skus;
};

export const generateTitle = (formState, leatherColors, threadColors) => {
  // console.log("generateTitle called with formState:", JSON.stringify(formState, null, 2));
  // console.log("threadColors:", JSON.stringify(threadColors, null, 2));
  // console.log("selectedStitchingColor:", formState.selectedStitchingColor);

  // console.log("Determined collection type:", collectionType);
  
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

  console.log("Generated title:", title);
  return title;
};

export const generateMainHandle = (formState, title) => {
  if (!title || title === "Pending Title") {
    return "pending-main-handle";
  }

  const tempMainHandle =title.toLowerCase()
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
        return "pendling-main-handle";
  }
};

export const generateVariantNames = async (formState, shapes, styles) => {
  console.log("generateVariantName called with formState:", JSON.stringify(formState, null, 2));
    
  if (!formState || !shapes ) {
    console.error("Missing required parameters for generateVariantName");
    console.log("formState:", formState);
    return [];
  }

  const offeringType = (formState.selectedOfferingType)
  const collectionType = getCollectionType(formState.selectedCollection);
  const woodLabel = ['3-Wood', '5-Wood', '7-Wood'];
  
  // Check for styles only if the collection type requires it
  if ((collectionType === COLLECTION_TYPES.ANIMAL || 
    collectionType === COLLECTION_TYPES.CLASSIC || 
    collectionType === COLLECTION_TYPES.QCLASSIC) && !styles) {
    console.error("Missing styles for a collection type that requires it");
  return [];
  }

  let variantNames = Object.entries(formState.weights || {})
    .filter(([_, weight]) => weight !== "") // Only generate variantNames for shapes with non-empty weights
    .map(([shapeId, weight]) => {
      const shape = shapes.find(s => s.value === shapeId);
      
      if (!shape) {
        console.error(`Shape not found for id: ${shapeId}`);
        return null;
      }

      const selectedStyleId = formState.selectedStyles?.[shapeId];
      const selectedStyle = styles?.find(style => style.value === selectedStyleId);


      let variantNamesParts = [];

      switch (collectionType) {
        case COLLECTION_TYPES.QUILTED:
        case COLLECTION_TYPES.ARGYLE:
          variantNamesParts = [
            shape.label
          ];
          break;
        case COLLECTION_TYPES.ANIMAL:
        case COLLECTION_TYPES.CLASSIC:
        case COLLECTION_TYPES.QCLASSIC:
          variantNamesParts = [
            selectedStyle?.label,
            shape.label
          ];
          break;
        default:
          return null;
      }

      return { 
        variantName: variantNamesParts.join(' ').trim(), 
        shape: shape.label,
        style: selectedStyle?.label, 
        shapeId 
      };
    })
    .filter(item => item !== null);

  console.log("Initial variantNames generated:", variantNames);

  let finalVariantNames = [];

  finalVariantNames = variantNames.map(item => item.variantName);


  if (offeringType === "customizable") {
    // const hasFairway = variantNames.some(item => item.shape === 'Fairway');
    let customVariantNames = [];

    switch(collectionType) {
      case COLLECTION_TYPES.QUILTED:
      case COLLECTION_TYPES.ARGYLE:
      
        let addedFairwayCustom = false;

        variantNames.forEach(item => {
          if (item.shape === 'Fairway' || woodLabel.includes(item.shape)) {
            if (!addedFairwayCustom) {
              customVariantNames.push(`Customize Fairway +$15`);
              addedFairwayCustom = true;
            }
          } else {
            customVariantNames.push(`Customize ${item.variantName} +$15`);
          }
      });
      break;

      case COLLECTION_TYPES.ANIMAL:
      case COLLECTION_TYPES.CLASSIC:
      case COLLECTION_TYPES.QCLASSIC:
        variantNames.forEach(item => {
          if (item.shape === 'Fairway' || woodLabel.includes(item.shape)) {
            // Replace wood shape with Fairway but keep the style
            const fairwayVariantName = item.variantName.replace(
              new RegExp(`(${woodLabel.join('|')}|Fairway|-Wood)`), 
              'Fairway'
            );
            customVariantNames.push(`Customize ${fairwayVariantName} +$15`);
          } else {
            customVariantNames.push(`Customize ${item.variantName} +$15`);
          }
        });
        break;
    }

    // Combine regular and custom variant names
    finalVariantNames = [...finalVariantNames, ...customVariantNames];
  }

  return finalVariantNames;
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


// export const generateDescription = (formState, fonts) => {
//   // const font = getFonts(formState, fonts);

//   const collectionType = getCollectionType(formState.selectedCollection);
  
//   switch(collectionType) {

//   }


//   ``
// };