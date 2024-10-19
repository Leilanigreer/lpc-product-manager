import { COLLECTION_TYPES, COLLECTION_ID_MAP } from "./constants";
import { getCollectionType } from "./collectionUtils";

export const generateSKUS = async (formState, leatherColors, threadColors, shapes) => {
  console.log("Generating SKUs with formState:", formState);

  if (!formState || !leatherColors || !threadColors || !shapes) {
    console.error("Missing required data for SKU generation");
    return [];
  }

  const collectionType = getCollectionType(formState.selectedCollection);
  const leatherColor1 = leatherColors.find(color => color.value === formState.selectedLeatherColor1);
  const leatherColor2 = leatherColors.find(color => color.value === formState.selectedLeatherColor2);
  const stitchingColor = threadColors.find(color => color.value === formState.selectedStitchingColor);

  if (!leatherColor1) {
    console.error("Primary leather color not found");
    return [];
  }

  const skus = Object.entries(formState.weights || {})
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
          skuParts = [
            "Quilted",
            leatherColor1.abbreviation,
            "L",
            stitchingColor.abbreviation,
            shape.abbreviation
          ];
          break;
        case COLLECTION_TYPES.ARGYLE:
          if (!leatherColor2) {
            console.error("Secondary leather color not found for Argyle collection");
            return null;
          }
          skuParts = [
            "Argyle",
            leatherColor1.abbreviation,
            "A",
            leatherColor2.abbreviation,
            "L",
            stitchingColor.abbreviation,
            shape.abbreviation
          ];
          break;
        case COLLECTION_TYPES.ANIMAL:
          if (!leatherColor2) {
            console.error("Secondary leather color not found for Animal collection");
            return null;
          }
          skuParts = [
            "Animal",
            leatherColor1.abbreviation,
            "W",
            leatherColor2.abbreviation,
            "L",
            shape.abbreviation
          ];
          break;
        case COLLECTION_TYPES.CLASSIC:
          if (!leatherColor2) {
            console.error("Secondary leather color not found for Classic collection");
            return null;
          }
          skuParts = [
            "Classic",
            leatherColor1.abbreviation,
            "W",
            leatherColor2.abbreviation,
            "L",
            shape.abbreviation
          ];
          break;
        case COLLECTION_TYPES.QCLASSIC:
          if (!leatherColor2) {
            console.error("Secondary leather color not found for QClassic collection");
            return null;
          }
          skuParts = [
            "QClassic",
            leatherColor1.abbreviation,
            "W",
            leatherColor2.abbreviation,
            "L",
            shape.abbreviation
          ];
          break;
        default:
          console.error(`Unknown collection type: ${collectionType}`);
          return null;
      }

      return skuParts.join('-');
    })
    .filter(sku => sku !== null); // Remove any null SKUs

  console.log("Generated SKUs:", skus);
  return skus;
};

export const generateTitle = (formState, leatherColors, shapes) => {
  console.log("Generating title with formState:", formState);
  
  const collectionType = getCollectionType(formState.selectedCollection);
  const collectionName = formState.selectedCollection.split('/').pop(); // Extract collection ID
  const leatherColor1 = leatherColors.find(color => color.value === formState.selectedLeatherColor1);
  const leatherColor2 = leatherColors.find(color => color.value === formState.selectedLeatherColor2);
  
  let title = `${collectionName} ${leatherColor1.label}`;
  
  if (leatherColor2) {
    title += ` ${leatherColor2.label}`;
  }
  
  const selectedShapes = Object.keys(formState.weights)
    .filter(shapeId => formState.weights[shapeId] !== "")
    .map(shapeId => shapes.find(s => s.value === shapeId).label);
  
  if (selectedShapes.length > 0) {
    title += ` ${selectedShapes.join(', ')}`;
  }

  console.log("Generated title:", title);
  return title.trim();
};