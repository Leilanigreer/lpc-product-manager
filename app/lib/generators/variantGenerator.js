// app/lib/generators/variantGenerator.js
import { getCollectionType, needsSecondaryColor, needsQClassicField, needsStyle, needsStitchingColor, isWoodType, isPutter, getVariantPrice, getColors, formatSKU } from "../utils";
import { COLLECTION_TYPES, assignPositions } from "../constants";


export const generateVariants = async (
  formState, 
  leatherColors, 
  stitchingThreadColors, 
  embroideryThreadColors, 
  shapes, 
  styles, 
  productPrices, 
  shopifyCollections,
  skuInfo
) => {
  // Initial validation
  if (!formState || !leatherColors || !stitchingThreadColors || !embroideryThreadColors || !shapes || !productPrices || !shopifyCollections) {
    return [];
  }

  // Get colors and collection type
  const { leatherColor1, leatherColor2, stitchingThreadColor } = getColors(formState, leatherColors, stitchingThreadColors, embroideryThreadColors);
  const collectionType = getCollectionType(formState, shopifyCollections);

  // Validate collection-specific requirements
  if (!leatherColor1) return [];
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

      // Generate SKU for regular variant
      const variantSKU = formatSKU(
        skuInfo.parts,
        skuInfo.version,
        shape,
        { isCustom: false }
      );

      if (!variantSKU.fullSKU) {
        console.error('Failed to generate SKU for variant:', { shape, skuInfo });
        return null;
      }
      const isPutterShape = isPutter(shape);
      const shouldHaveStyle = !isPutterShape && needsStyle(collectionType);
      const selectedStyleId = shouldHaveStyle ? formState.selectedStyles?.[shapeId] : null;
      const selectedStyle = shouldHaveStyle && selectedStyleId ? 
        styles?.find(style => style.value === selectedStyleId) : 
        null;
      
      // Calculate price based on shape
      const priceShapeId = isWoodType(shape) ? 
        shapes.find(s => s.abbreviation === 'Fairway')?.value || shapeId : 
        shapeId;
      
      const basePrice = getVariantPrice(
        priceShapeId,
        formState.selectedCollection,
        productPrices,
        shapes
      );

      // Determine variant name based on shape and style
      const variantName = isPutterShape ? 
        shape.label :
        shouldHaveStyle && selectedStyle ? 
          `${selectedStyle.label} ${shape.label}` : 
          shape.label;

      // Create base variant object
      const variant = {
        shapeId,
        shape: shape.label,
        styleId: selectedStyleId,
        style: selectedStyle,
        sku: variantSKU.fullSKU,
        baseSKU: variantSKU.baseSKU,
        variantName,
        price: basePrice,
        weight,
        isCustom: false,
      };

      // Add thread data
      if (formState.threadData?.threadType === 'global') {
        if (formState.threadData.globalThreads?.stitching) {
          variant.stitchingThreadId = formState.threadData.globalThreads.stitching.threadId;
          variant.amannNumberId = formState.threadData.globalThreads.stitching.numberId;
        }
        if (formState.threadData.globalThreads?.embroidery) {
          variant.embroideryThreadId = formState.threadData.globalThreads.embroidery.threadId;
          variant.isacordNumberId = formState.threadData.globalThreads.embroidery.numberId;
        }
      } else {
        const shapeThreadData = formState.threadData?.shapeThreads?.[shapeId];
        if (shapeThreadData?.embroideryThread) {
          variant.embroideryThreadId = shapeThreadData.embroideryThread.threadId;
          variant.isacordNumberId = shapeThreadData.embroideryThread.numberId;
        }
      }

      // Add QClassic specific data if needed
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
      // Handle Quilted and Argyle collections
      if (isWoodType(shape)) {
        if (!customVariants.some(cv => cv.variantName === 'Customize Fairway +$15')) {
          const fairwayShape = shapes.find(s => s.abbreviation === 'Fairway');
          const customSKU = formatSKU(
            skuInfo.parts,
            skuInfo.version,
            fairwayShape,
            { isCustom: true }
          );

          customVariants.push({
            ...variant,
            ...baseCustomVariant,
            shapeId: fairwayShape.value,
            sku: customSKU.fullSKU,
            baseSKU: customSKU.baseSKU,
            variantName: 'Customize Fairway +$15',
            price: customPrice,
            weight,
            isCustom: true,
            position: customPosition++,
          });
        }
      } else {
        const customSKU = formatSKU(
            skuInfo.parts,
            skuInfo.version,
            shape,
            { isCustom: true }
          );

        customVariants.push({
          ...variant,
          ...baseCustomVariant,
          sku: customSKU.fullSKU,
          baseSKU: customSKU.baseSKU,
          variantName: `Customize ${variant.variantName} +$15`,
          price: customPrice,
          weight,
          isCustom: true,
          position: customPosition++,
        });
      }
    } else {
      // Handle Animal, Classic, QClassic collections
      if (isWoodType(shape)) {
        const styleKey = `${variant.style?.label}-${shape.abbreviation}`;
        if (!processedStyles.has(styleKey)) {
          const fairwayShape = shapes.find(s => s.abbreviation === 'Fairway');

          if (collectionType === COLLECTION_TYPES.QCLASSIC) {
            const shapeQClassicLeather = formState.qClassicLeathers?.[variant.shapeId];
            const qClassicLeatherColor = leatherColors.find(
              color => color.value === shapeQClassicLeather
            );

            const useOppositeColor = variant.style?.abbreviation === 'Fat';
            const leatherAbbreviation = useOppositeColor ? 
              (shapeQClassicLeather === formState.selectedLeatherColor1 ? 
                leatherColor2.abbreviation : leatherColor1.abbreviation) :
              qClassicLeatherColor.abbreviation;
          
            const leatherColorForName = useOppositeColor ?
              (shapeQClassicLeather === formState.selectedLeatherColor1 ? 
                leatherColor2 : leatherColor1) :
              qClassicLeatherColor;

            const customSKU = formatSKU(
              skuInfo.parts,
              skuInfo.version,
              fairwayShape,
              { 
                isCustom: true,
                style: variant.style,
                qClassicLeatherAbbreviation: leatherAbbreviation
              }
            );

            const stylePhrase = variant.style?.label === "50/50" ? 
              "leather on left -" : 
              "leather as";
          
            const customVariantName = `Customize ${leatherColorForName.label} ${stylePhrase} ${variant.style?.label} Fairway +$15`;
          
            // For wood types, use base SKU parts but replace with Fairway
            const customVariant = {
              ...variant,
              ...baseCustomVariant,
              shapeId: fairwayShape.value,
              sku: customSKU.fullSKU,
              baseSKU: customSKU.baseSKU,
              variantName: customVariantName,
              price: customPrice,
              weight,
              isCustom: true,
              position: customPosition++,
            };
          
            customVariants.push(customVariant);
            processedStyles.add(styleKey);
          } else {
            // Keep existing logic for Animal and Classic collections
            const customSKU = formatSKU(
              skuInfo.parts,
              skuInfo.version,
              fairwayShape,
              { 
                isCustom: true,
                style: variant.style
              }
            );

            const customVariant = {
              ...variant,
              ...baseCustomVariant,
              shapeId: fairwayShape.value,
              sku: customSKU.fullSKU,
              baseSKU: customSKU.baseSKU,
              variantName: `Customize ${variant.style?.label} Fairway +$15`,
              price: customPrice,
              weight,
              isCustom: true,
              position: customPosition++,
            };
            
            customVariants.push(customVariant);
            processedStyles.add(styleKey);
          }
        }
      } else if (!shouldHaveStyle) {
        // Handles putters and other non-style shapes
        const customSKU = formatSKU(
          skuInfo.parts,
          skuInfo.version,
          shape,
          { isCustom: true }
        );
        
        customVariants.push({
          ...variant,
          ...baseCustomVariant,
          sku: customSKU.fullSKU,
          baseSKU: customSKU.baseSKU,
          variantName: `Customize ${variant.shape} +$15`,
          price: customPrice,
          weight,
          isCustom: true,
          position: customPosition++,
        });
      } else {
        // Other cases with styles
        const customSKU = formatSKU(
          skuInfo.parts,
          skuInfo.version,
          shape,
          { 
            isCustom: true,
            style: variant.style
          }
        );
        
        const customVariant = {
          ...variant,
          ...baseCustomVariant,
          sku: customSKU.fullSKU,
          baseSKU: customSKU.baseSKU,
          variantName: `Customize ${variant.style?.label} ${variant.shape} +$15`,
          price: customPrice,
          weight,
          isCustom: true,
          position: customPosition++,
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
    };

  // Combine all variants in the correct order
  const allVariants = [
    ...variants,            // Regular variants
    createOwnSetVariant,    // Static variant
    ...customVariants       // Custom variants
  ];

  return allVariants;
};