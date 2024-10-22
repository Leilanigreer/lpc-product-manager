import { COLLECTION_TYPES } from "./constants";
import { getCollectionType } from "./collectionUtils";

export const generateSKUS = async (formState, leatherColors, threadColors, shapes, styles) => {
  console.log("generateSKUS called with formState:", JSON.stringify(formState, null, 2));
  
  const collectionType = getCollectionType(formState.selectedCollection);
  // console.log("Determined collection type:", collectionType);
  
  if (!formState || !leatherColors || !threadColors || !shapes ) {
    // console.error("Missing required parameters for generateSKUS");
    console.log("formState:", formState);
    // console.log("leatherColors:", leatherColors);
    console.log("SKU threadColors:", threadColors);
    console.log("Available thread colors:", threadColors.map(c => c.value));
    console.log("Thread colors array:", JSON.stringify(threadColors, null, 2));

    // console.log("shapes:", shapes);
    return [];
  }

  // Check for styles only if the collection type requires it
  if ((collectionType === COLLECTION_TYPES.ANIMAL || 
    collectionType === COLLECTION_TYPES.CLASSIC || 
    collectionType === COLLECTION_TYPES.QCLASSIC) && !styles) {
  // console.error("Missing styles for a collection type that requires it");
  // console.log("styles:", styles);
  return [];
  }

  const leatherColor1 = leatherColors.find(color => color.value === formState.selectedLeatherColor1);
  const leatherColor2 = leatherColors.find(color => color.value === formState.selectedLeatherColor2);
  const stitchingColor = threadColors.find(color => color.value === formState.selectedStitchingColor);
  const offeringType = formState.selectedOfferingType;
  // console.log(`Selected offering type: ${offeringType}`);

  if (!leatherColor1) {
    // console.error("Primary leather color not found");
    return [];
  }

  const woodAbbreviations = ['3Wood', '5Wood', '7Wood'];

  let skus = Object.entries(formState.weights || {})
    .filter(([_, weight]) => weight !== "") // Only generate SKUs for shapes with non-empty weights
    .map(([shapeId, weight]) => {
      const shape = shapes.find(s => s.value === shapeId);
      
      if (!shape) {
        // console.error(`Shape not found for id: ${shapeId}`);
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

  const collectionType = getCollectionType(formState.selectedCollection);
  // console.log("Determined collection type:", collectionType);

  if (!formState || !leatherColors || !threadColors) {
    console.error("Missing required parameters for generateTitle");
    return "";
  }

  const leatherColor1 = leatherColors.find(color => color.value === formState.selectedLeatherColor1);
  const leatherColor2 = leatherColors.find(color => color.value === formState.selectedLeatherColor2);
  
  // console.log("Searching for stitching color:", formState.selectedStitchingColor);
  // console.log("Available thread colors:", threadColors.map(c => c.value));

  const stitchingColor = threadColors.find(color => color.value === formState.selectedStitchingColor);
  
  // console.log("Found stitchingColor:", stitchingColor);

  if (!leatherColor1 || !leatherColor2 || !stitchingColor) {
    console.error("Missing color information:");
    // console.log("leatherColor1:", leatherColor1);
    // console.log("leatherColor2:", leatherColor2);
    // console.log("stitchingColor:", stitchingColor);
    return "Color information missing";
  }

  let title = "";

  if (collectionType === COLLECTION_TYPES.ANIMAL || collectionType === COLLECTION_TYPES.CLASSIC) {
    title = `${leatherColor1.label} with ${leatherColor2.label} Leather`;
  } else if (collectionType === COLLECTION_TYPES.ARGYLE) {
    title = `${leatherColor1.label} and ${leatherColor2.label} Leather with ${stitchingColor.label} Stitching`;
  } else if (collectionType === COLLECTION_TYPES.QUILTED) {
    title = `${leatherColor1.label} Leather Quilted with ${stitchingColor.label} Stitiching`
  } else if (collectionType === COLLECTION_TYPES.QCLASSIC) {
    title = `${leatherColor1.label} and ${leatherColor2.label} Leather Quilted`
  }
  else {
    title = "Pending Title";
  }

  console.log("Generated title:", title);
  return title;
};