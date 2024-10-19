const getCollectionAbbreviation = (collectionId) => {
  const collections = {
    '297548710095': 'Quilted',
    // Add other collection IDs and their abbreviations here
  };
  return collections[collectionId] || 'Unknown';
};

export async function generateSKUS(formState, leatherColors, threadColors, shapes, styles, offeringType) {
  console.log("Starting SKU generation process");
  console.log("Input formState:", JSON.stringify(formState, null, 2));
  console.log("Input leatherColors:", JSON.stringify(leatherColors, null, 2));
  console.log("Input threadColors:", JSON.stringify(threadColors, null, 2));
  console.log("Input shapes:", JSON.stringify(shapes, null, 2));
  console.log("Input styles:", JSON.stringify(styles, null, 2));
  console.log("Input offeringType:", offeringType);

  // Extract the numeric ID from the Shopify Collection ID
  const collectionId = formState.selectedCollection.split('/').pop();
  console.log("Extracted collectionId:", collectionId);

  const collectionAbbreviation = getCollectionAbbreviation(collectionId);
  console.log("Collection abbreviation:", collectionAbbreviation);

  // Find the selected leather and thread colors
  const leatherColor = leatherColors.find(color => color.value === formState.selectedLeatherColor1);
  const threadColor = threadColors.find(color => color.value === formState.selectedStitchingColor);

  console.log("Selected leather color:", leatherColor);
  console.log("Selected thread color:", threadColor);

  if (!leatherColor || !threadColor) {
    console.log("Missing color data for SKU generation. Returning default SKU.");
    return ["default-sku"];
  }

  // Generate SKUs for each selected shape
  const skus = Object.entries(formState.selectedStyles)
    .filter(([_, isSelected]) => isSelected)
    .map(([shapeId, _]) => {
      const shape = shapes.find(s => s.value === shapeId);
      console.log("Generating SKU for shape:", shape);
      const sku = `${collectionAbbreviation}-${leatherColor.abbreviation}L${threadColor.abbreviation}-${shape.label}`;
      console.log("Generated SKU:", sku);
      return sku;
    });

  console.log("Final generated SKUs:", skus);
  return skus;
}

export function generateTitle(formState) {
  console.log("Generating title with formState:", JSON.stringify(formState, null, 2));
  // Implement title generation logic here
  // Example: return `${formState.selectedCollection} ${formState.selectedLeatherColor1} ${formState.selectedFont}`;
  const title = `${formState.selectedCollection} ${formState.selectedLeatherColor1} ${formState.selectedFont}`;
  console.log("Generated title:", title);
  return title;
}