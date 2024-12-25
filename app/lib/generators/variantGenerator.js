// app/lib/generators/variantGenerator.js
import { generateSKUParts } from "./skuGenerator";
import { getCollectionType, needsSecondaryColor, needsQClassicField, needsStyle, needsStitchingColor, isWoodType, isPutter, getVariantPrice, getColors } from "../utils";
import { COLLECTION_TYPES, assignPositions } from "../constants";


export const generateVariants = async (formState, leatherColors, stitchingThreadColors, embroideryThreadColors, shapes, styles, productPrices, shopifyCollections) => {
  if (!formState || !leatherColors || !stitchingThreadColors || !embroideryThreadColors || !shapes || !productPrices || !shopifyCollections) {
    return [];
  }

  const { leatherColor1, leatherColor2, stitchingThreadColor, embroideryThreadColor } = getColors(formState, leatherColors, stitchingThreadColors, embroideryThreadColors);
  const collectionType = getCollectionType(formState, shopifyCollections);

  if (!leatherColor1) {
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

      const skuInfo = generateSKUParts(collectionType, {
        leatherColor1,
        leatherColor2,
        stitchingThreadColor, 
        embroideryThreadColor,
        shape, 
        existingProducts: formState.existingProducts
      });

      if (!skuInfo) return null;

      const priceShapeId = isWoodType(shape) ? 
        shapes.find(s => s.abbreviation === 'Fairway')?.value || shapeId : 
        shapeId;
      
      const basePrice = getVariantPrice(
        priceShapeId,
        formState.selectedCollection,
        productPrices,
        shapes
      );

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
        sku: skuInfo.fullSKU,
        baseSKU: skuInfo.baseSKU,
        variantName,
        price: basePrice,
        weight,
        isCustom: false,
        options: {
          Style: variantName
        }
      };

      // Add thread data based on whether it's global or shape-specific
      if (formState.threadData?.threadType === 'global') {
        // Add global thread data
        if (formState.threadData.globalThreads?.stitching) {
          variant.stitchingThreadId = formState.threadData.globalThreads.stitching.threadId;
          variant.amannNumberId = formState.threadData.globalThreads.stitching.numberId;
        }
        if (formState.threadData.globalThreads?.embroidery) {
          variant.embroideryThreadId = formState.threadData.globalThreads.embroidery.threadId;
          variant.isacordNumberId = formState.threadData.globalThreads.embroidery.numberId;
        }
      } else {
        // Add shape-specific thread data
        const shapeThreadData = formState.threadData?.shapeThreads?.[shapeId];
        if (shapeThreadData?.embroideryThread) {
          variant.embroideryThreadId = shapeThreadData.embroideryThread.threadId;
          variant.isacordNumberId = shapeThreadData.embroideryThread.numberId;
        }
      }

      if (needsQClassicField(collectionType)) {
        variant.qClassicLeather = formState.qClassicLeathers?.[shapeId];
      }

      return variant;
    })
    .filter(item => item !== null);

  // Assign positions to regular variants
  variants = assignPositions(variants, shapes);

  // Generate custom variants
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
    const isPutterShape = isPutter(shape);
    const shouldHaveStyle = !isPutterShape && needsStyle(collectionType);

    if (!needsStyle(collectionType)) {
      // Handle Quilted and Argyle collections (no style collections)
      if (isWoodType(shape)) {
        if (!customVariants.some(cv => cv.variantName === 'Customize Fairway +$15')) {
          customVariants.push({
            ...variant,
            ...baseCustomVariant,
            shapeId: shapes.find(s => s.abbreviation === 'Fairway')?.value,
            sku: `${variant.sku.split('-').slice(0, -1).join('-')}-Fairway-Custom`,
            variantName: 'Customize Fairway +$15',
            price: customPrice,
            weight,
            isCustom: true,
            position: customPosition++,
            options: { Style: 'Customize Fairway' }
          });
        }
      } else {
        customVariants.push({
          ...variant,
          ...baseCustomVariant,
          sku: `${variant.sku}-Custom`,
          variantName: `Customize ${variant.variantName} +$15`,
          price: customPrice,
          weight,
          isCustom: true,
          position: customPosition++,
          options: { Style: `Customize ${variant.variantName}` }
        });
      }
    } else {
      // Handle Animal, Classic, QClassic collections (style collections)
      if (isWoodType(shape)) {
        const styleKey = `${variant.style?.label}-${shape.abbreviation}`;
        if (!processedStyles.has(styleKey)) {
          if (collectionType === COLLECTION_TYPES.QCLASSIC) {
            // Get the qClassicLeather value for this shape
            const shapeQClassicLeather = formState.qClassicLeathers?.[variant.shapeId];

            // Find the leather color object that matches the qClassicLeather ID
            const qClassicLeatherColor = leatherColors.find(
              color => color.value === shapeQClassicLeather
            );
          
            // If style is Fat, use the opposite leather color for both SKU and name
            const useOppositeColor = variant.style?.abbreviation === 'Fat';
            const leatherAbbreviation = useOppositeColor ? 
              (shapeQClassicLeather === formState.selectedLeatherColor1 ? 
                leatherColor2.abbreviation : leatherColor1.abbreviation) :
              qClassicLeatherColor.abbreviation;
          
            // Get the correct leather color label for the name
            const leatherColorForName = useOppositeColor ?
              (shapeQClassicLeather === formState.selectedLeatherColor1 ? 
                leatherColor2 : leatherColor1) :
              qClassicLeatherColor;

            // Determine the connecting phrase based on style
            const stylePhrase = variant.style?.label === "50/50" ? 
              "leather on left -" : 
              "leather as";
          
            const customVariantName = `Customize ${leatherColorForName.label} ${stylePhrase} ${variant.style?.label} Fairway +$15`;
          
            // For wood types, use base SKU parts but replace with Fairway
            const baseSku = isWoodType(shape) ? 
              variant.sku.replace(shape.abbreviation, 'Fairway') :
              variant.sku;
          
            const customVariant = {
              ...variant,
              ...baseCustomVariant,
              shapeId: shapes.find(s => s.abbreviation === 'Fairway')?.value,
              sku: `${baseSku}-${leatherAbbreviation}-${variant.style?.abbreviation}-Custom`,
              variantName: customVariantName,
              price: customPrice,
              weight,
              isCustom: true,
              position: customPosition++,
              options: { Style: customVariantName }
            };
          
            customVariants.push(customVariant);
            processedStyles.add(styleKey);
          } else {
            // Keep existing logic for Animal and Classic collections
            const customVariant = {
              ...variant,
              ...baseCustomVariant,
              shapeId: shapes.find(s => s.abbreviation === 'Fairway')?.value,
              sku: `${variant.sku.split('-').slice(0, -1).join('-')}-Fairway-${variant.style?.abbreviation}-Custom`,
              variantName: `Customize ${variant.style?.label} Fairway +$15`,
              price: customPrice,
              weight,
              isCustom: true,
              position: customPosition++,
              options: { Style: `Customize ${variant.style?.label} Fairway` }
            };
            
            customVariants.push(customVariant);
            processedStyles.add(styleKey);
          }
        }
      } else if (!shouldHaveStyle) {
        // Handles putters and other non-style shapes
        customVariants.push({
          ...variant,
          ...baseCustomVariant,
          sku: `${variant.sku}-Custom`,
          variantName: `Customize ${variant.shape} +$15`,
          price: customPrice,
          weight,
          isCustom: true,
          position: customPosition++,
          options: { Style: `Customize ${variant.shape}` }
        });
      } else {
        // Keep existing logic for other cases
        const customVariant = {
          ...variant,
          ...baseCustomVariant,
          sku: `${variant.sku}-${variant.style?.abbreviation}-Custom`,
          variantName: `Customize ${variant.style?.label} ${variant.shape} +$15`,
          price: customPrice,
          weight,
          isCustom: true,
          position: customPosition++,
          options: { Style: `Customize ${variant.style?.label} ${variant.shape}` }
        };

        customVariants.push(customVariant);
      }
    }
  });

    // Static "Create my own set" variant
    const createOwnSetVariant = {
      variantName: "Create my own set",
      price: 0,
      weight: 0,
      isCustom: true,
      position: variants.length + 1,
      options: {
        Style: "Create my own set"
      }
    };

  // Combine all variants in the correct order
  const allVariants = [
    ...variants,            // Regular variants
    createOwnSetVariant,    // Static variant
    ...customVariants       // Custom variants
  ];

  return allVariants;
};