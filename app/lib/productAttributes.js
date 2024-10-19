import { COLLECTION_TYPES, COLLECTION_ID_MAP } from "./constants";
import { getCollectionType } from "./collectionUtils";

export const generateSKUS = async (formState, leatherColors, threadColors, shapes, styles) => {
  console.log("generateSKUS called with formState:", JSON.stringify(formState, null, 2));

  if (!formState || !leatherColors || !threadColors || !shapes) {
    console.error("Missing required parameters for generateSKUS");
    console.log("formState:", formState);
    console.log("leatherColors:", leatherColors);
    console.log("threadColors:", threadColors);
    console.log("shapes:", shapes);
    return [];
  }

  const collectionType = getCollectionType(formState.selectedCollection);
  console.log("Determined collection type:", collectionType);

  const leatherColor1 = leatherColors.find(color => color.value === formState.selectedLeatherColor1);
  const leatherColor2 = leatherColors.find(color => color.value === formState.selectedLeatherColor2);
  const stitchingColor = threadColors.find(color => color.value === formState.selectedStitchingColor);
  const offeringType = formState.selectedOfferingType;
  console.log(`Selected offering type: ${offeringType}`);

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
          console.log("Generating Quilted SKU");
          skuParts = [
            "Quilted",
            leatherColor1.abbreviation,
            stitchingColor.abbreviation,
            shape.abbreviation
          ];
          break;
        case COLLECTION_TYPES.ARGYLE:
          console.log("Generating Argyle SKU");
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
          console.log(`Generating ${collectionType} SKU`);
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
          console.error(`Unknown collection type: ${collectionType}`);
          return null;
      }

      return { sku: skuParts.join('-'), shape: shape.abbreviation };
    })
    .filter(item => item !== null);

  console.log("Initial SKUs generated:", skus);

  if (offeringType === "customizable") {
    console.log("Generating custom SKUs for customizable offering");
    const regularSkus = skus.map(item => item.sku);
    const customSkus = [];

    if (collectionType === COLLECTION_TYPES.QUILTED || collectionType === COLLECTION_TYPES.ARGYLE) {
      console.log("Processing Quilted or Argyle collection for custom SKUs");
      const hasFairway = skus.some(item => item.shape === 'Fairway');
      console.log("Has Fairway shape:", hasFairway);

      skus.forEach(item => {
        if (item.shape === 'Fairway' || (!hasFairway && woodAbbreviations.includes(item.shape))) {
          // If it's a Fairway or a wood club (when Fairway is not present), add only one Fairway-Custom
          if (!customSkus.some(sku => sku.endsWith('-Fairway-Custom'))) {
            customSkus.push(`${item.sku.replace(/-[^-]+$/, '')}-Fairway-Custom`);
            console.log("Added Fairway-Custom SKU");
          }
        } else if (!woodAbbreviations.includes(item.shape)) {
          // For non-wood clubs, add individual custom SKUs
          customSkus.push(`${item.sku}-Custom`);
          console.log(`Added custom SKU for ${item.shape}`);
        }
      });
    } else {
      console.log("Processing other collection type for custom SKUs");
      // For other collections, add -Custom to all SKUs
      customSkus.push(...skus.map(item => `${item.sku}-Custom`));
    }

    skus = [...regularSkus, ...customSkus];
  } else {
    skus = skus.map(item => item.sku);
  }

  console.log("Final generated SKUs:", skus);
  return skus;
};

// The generateTitle function remains unchanged
export const generateTitle = (formState, leatherColors, shapes) => {
  // ... (rest of the generateTitle function)
};