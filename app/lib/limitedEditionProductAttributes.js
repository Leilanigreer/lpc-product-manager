// import { getCollectionType, isWoodType } from './sharedProductUtils';


// const generateLimitedEditionTitle = (formState, leatherColors, threadColors, shopifyCollections) => {
//   const { leatherColor1, leatherColor2, stitchingColor } = getColors(formState, leatherColors, threadColors);
//   const collectionType = getCollectionType(formState, shopifyCollections);

//   if (!leatherColor1) return "Primary leather color missing";
  
//   switch (collectionType) {
//     case COLLECTION_TYPES.ANIMAL:
//     case COLLECTION_TYPES.CLASSIC:
//     case COLLECTION_TYPES.QCLASSIC:
//       return !leatherColor2 ? "Secondary leather color missing" : 
//         `${leatherColor1.label} with ${leatherColor2.label} Leather`;
  
//     case COLLECTION_TYPES.ARGYLE:
//       if (!leatherColor2) return "Secondary leather color missing";
//       if (!stitchingColor) return "Stitching color missing";
//       return `${leatherColor1.label} and ${leatherColor2.label} Leather with ${stitchingColor.label} Stitching`;
  
//     case COLLECTION_TYPES.QUILTED:
//       return !stitchingColor ? "Stitching color missing" :
//         `${leatherColor1.label} Leather Quilted with ${stitchingColor.label} Stitching`;
  
//     default:
//       return "Pending Title";
//   }
// };

// export const generateLimitedEditionSKU = (formState, shapes, shopifyCollections) => {
//   const selectedShapes = formState.selectedShapes || {};
//   const selectedCount = Object.values(selectedShapes).filter(Boolean).length;
  
//   // Get the shape for single items
//   const shapeId = Object.keys(selectedShapes).find(id => selectedShapes[id]);
//   const shape = shapes.find(s => s.value === shapeId);

//   const collectionType = getCollectionType(formState, shopifyCollections);
//   const { leatherColor1, leatherColor2, stitchingColor } = getColors(formState, leatherColors, threadColors);

//   const skuParts = generateSKUParts(
//     collectionType,
//     {
//       leatherColor1,
//       leatherColor2,
//       stitchingColor,
//       shape,
//       isLimitedEdition: true,
//       selectedCount
//     }
//   );

//   return skuParts.join('-');
// };