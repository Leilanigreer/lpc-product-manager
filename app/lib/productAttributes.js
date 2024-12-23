// app/lib/productAttributes.js

import { COLLECTION_TYPES } from "./constants";
import { 
  getShopifyCollectionType,
  needsStyle,
  needsQClassicField,
  needsStitchingColor,
  needsSecondaryColor
} from "./collectionUtils";
import { isPutter, isWoodType } from "./shapeUtils";

const getColors = (formState, leatherColors, stitchingThreadColors, embroideryThreadColors) => {
  const colors = {
    leatherColor1: leatherColors.find(color => color.value === formState.selectedLeatherColor1),
    leatherColor2: leatherColors.find(color => color.value === formState.selectedLeatherColor2),
    stitchingThreadColor: stitchingThreadColors.find(color => color.value === formState.selectedStitchingColor),
    embroideryThreadColor: embroideryThreadColors.find(color => color.value === formState.selectedEmbroideryColor),
  };
  return colors;
};

const getCollectionType = (formState, shopifyCollections) => {
  const collection = shopifyCollections.find(col => col.value === formState.selectedCollection);
  return collection ? getShopifyCollectionType({ handle: collection.handle }) : 'Unknown';
};

const getVariantPrice = (shapeId, collectionId, productPrices, shapes) => {
  const shape = shapes.find(s => s.value === shapeId);
  
  if (!shape) {
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
      return "140.00";
    }
  }

  const priceData = productPrices.find(
    price => price.shapeId === lookupShapeId && price.shopifyCollectionId === collectionId
  );

  if (!priceData) {
    return "140.00";
  }

  return priceData.shopifyPrice.toFixed(2);
};

const SHAPE_ORDER = [
  'cm2duhfg000006y58dqulghkm',    // Driver
  'cm2duhfg300016y58sr14qoxd',    // 3-Wood
  'cm2duhfg300026y58r1rnkvbc',    // 5-Wood
  'cm2duhfg300036y583y11',        // 7-Wood
  'cm2duhfg300046y58o8d',         // Fairway
  'cm2duhfg300056y58ddfbtcxj',    // Hybrid
  'cm2duhfg300066y583ii779yr',    // Mallet
  'cm2duhfg300076y585ows'         // Blade
];

const generateSKUParts = (collectionType, { leatherColor1, leatherColor2, stitchingThreadColor, embroideryThreadColor, shape, existingProducts }) => {
  const baseParts = {
    [COLLECTION_TYPES.QUILTED]: () => [
      "Quilted",
      leatherColor1.abbreviation,
      embroideryThreadColor.abbreviation
    ],
    
    [COLLECTION_TYPES.ARGYLE]: () => [
      "Argyle",
      leatherColor1.abbreviation,
      leatherColor2?.abbreviation,
      stitchingThreadColor.abbreviation
    ],
    
    [COLLECTION_TYPES.ANIMAL]: () => [
      "Animal",
      leatherColor1.abbreviation,
      leatherColor2?.abbreviation
    ],
    
    [COLLECTION_TYPES.CLASSIC]: () => [
      "Classic",
      leatherColor1.abbreviation,
      leatherColor2?.abbreviation
    ],
    
    [COLLECTION_TYPES.QCLASSIC]: () => [
      "QClassic",
      leatherColor1.abbreviation,
      leatherColor2?.abbreviation
    ]
  };

  const parts = baseParts[collectionType]?.();
  if (!parts) {
    return null;
  }

  const baseSKU = parts.join('-');

  console.log(`Existing Products: ${existingProducts}  `)
  if (existingProducts?.length) {
    // Find any product that starts with this baseSKU (including iterations)
    const matchingProduct = existingProducts.find(product => 
      product.baseSKU === baseSKU || product.baseSKU.startsWith(`${baseSKU}-`)
    );

    if (matchingProduct) {
      // Extract iteration number if it exists
      const regex = /^.*?(?:-(\d+))?$/;
      const match = matchingProduct.baseSKU.match(regex);
      const currentIteration = match?.[1] ? parseInt(match[1]) : 0;
      
      // Create new SKU with next iteration
      const nextIteration = currentIteration + 1;
      const iteratedBaseSKU = `${baseSKU}-${nextIteration}`;
      const iteratedFullSKU = `${iteratedBaseSKU}-${shape.abbreviation}`;

      return {
        baseSKU: iteratedBaseSKU,
        fullSKU: iteratedFullSKU,
        parts
      };
    }
  }

  // If no existing SKU found, return original
  const fullSKU = `${baseSKU}-${shape.abbreviation}`;

  return {
    baseSKU,
    fullSKU,
    parts
  };
};

const assignPositions = (variants, shapes) => {
  const selectedShapeIds = new Set(variants.map(v => v.shapeId));
  const orderedSelectedShapeIds = SHAPE_ORDER.filter(id => selectedShapeIds.has(id));

  return variants.map(variant => ({
    ...variant,
    position: orderedSelectedShapeIds.indexOf(variant.shapeId) + 1
  }));
};

const generateVariants = async (formState, leatherColors, stitchingThreadColors, embroideryThreadColors, shapes, styles, productPrices, shopifyCollections) => {
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
        shape
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

export const generateProductData = async (formState, leatherColors, stitchingThreadColor, embroideryThreadColor, colorTags, shapes, styles, productPrices, shopifyCollections, amannNumbers, isacordNumbers, existingProducts) => {
  const title = generateTitle(formState, leatherColors, stitchingThreadColor, embroideryThreadColor, shopifyCollections);
  return {
    title,
    mainHandle: generateMainHandle(formState, title, shopifyCollections),
    productType: generateProductType(formState, shopifyCollections),
    seoTitle: generateSEOTitle(formState, title, shopifyCollections),
    descriptionHTML: generateDescriptionHTML(formState, shopifyCollections),
    seoDescription: generateSEODescription(formState, shopifyCollections),
    tags: generateTags(formState, leatherColors, embroideryThreadColor, stitchingThreadColor, colorTags),
    variants: await generateVariants(formState, leatherColors, stitchingThreadColor, embroideryThreadColor, shapes, styles, productPrices, shopifyCollections, amannNumbers, isacordNumbers, existingProducts),

    // New fields for database consistency
    collectionId: formState.selectedCollection,
    selectedFont: formState.selectedFont,
    offeringType: formState.selectedOfferingType,
    limitedEditionQuantity: formState.limitedEditionQuantity || null,
    
    // Additional metadata that might be useful
    selectedLeatherColor1: formState.selectedLeatherColor1,
    selectedLeatherColor2: formState.selectedLeatherColor2,
    selectedStitchingColor: formState.selectedStitchingColor,
    selectedEmbroideryColor: formState.selectedEmbroideryColor,
    
    // Include timestamps for database records
    createdAt: new Date().toISOString(),
  };
};

const generateTitle = (formState, leatherColors, stitchingThreadColors, embroideryThreadColors, shopifyCollections) => {  
  const { leatherColor1, leatherColor2, stitchingThreadColor, embroideryThreadColor } = 
    getColors(formState, leatherColors, stitchingThreadColors, embroideryThreadColors);
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
      if (!stitchingThreadColor) return "Stitching color missing";
      return `${leatherColor1.label} and ${leatherColor2.label} Leather with ${stitchingThreadColor.label} Stitching`;
  
    case COLLECTION_TYPES.QUILTED:
      return !embroideryThreadColor ? "Stitching color missing" :
        `${leatherColor1.label} Leather Quilted with ${embroideryThreadColor.label} Stitching`;
  
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

const generateSEOTitle = (formState, title, shopifyCollections) => {
  if (!title || title === "Pending Title") return "pending-seo-title";

  const collectionType = getCollectionType(formState, shopifyCollections);
  
  switch(collectionType) {
    case COLLECTION_TYPES.QUILTED:
    case COLLECTION_TYPES.ANIMAL:
    case COLLECTION_TYPES.CLASSIC:
      return `${title} Golf Headcovers`;
    case COLLECTION_TYPES.ARGYLE:
      return `${title} Argyle Golf Headcovers`; 
    case COLLECTION_TYPES.QCLASSIC:
      return `${title} Quilted Golf Headcovers`;
    default:
      return "pending-seo-title";
  }
};

const generateDescriptionHTML = (formState, shopifyCollections) => {
  const collectionType = getCollectionType(formState, shopifyCollections);

  const leatherDescription = "<div><div><div>We use 100% top grain genuine cowhide from the finest tanneries in Italy, Argentina, and Austria, ensuring exceptional quality, luxurious feel, and unmatched durability. Every piece is hand cut by an artisan leather craftsman in the heart of downtown San Francisco, CA. If you don't see your ideal color combination, <a href='https://lpcgolf.com/pages/contact' target='_blank' title='Contact LPC golf' rel='noopener'>please contact us</a> about creating a custom, one-of-a-kind set.</div></div></div>";

  const wrapDescription = (description) => 
    `<div><div><span>${description}&nbsp;</span></div><div><span></span><br></div>${leatherDescription}</div>`;

  let descriptionHTML = "";

  switch(collectionType) {
    case COLLECTION_TYPES.QUILTED:
      descriptionHTML = wrapDescription("Our Quilted collection embodies timeless luxury, celebrating the days when craftsmanship and style were paramount. Each diamond pattern is meticulously hand-sewn with premium thread, creating a distinctive look that sets these headcovers apart.");
      break;

    case COLLECTION_TYPES.CLASSIC:
      descriptionHTML = wrapDescription("Our Classic collection celebrates traditional golf style with a luxurious twist. Each headcover features impeccable hand-stitched French seams, bold racing stripes, or timeless diagonal striping – perfect for golfers who appreciate refined, vintage-inspired design.");
      break;

    case COLLECTION_TYPES.ARGYLE:
      descriptionHTML = wrapDescription("Our Argyle collection honors golf's Scottish heritage with a contemporary twist. Each diamond and contrasting cross-stitch is expertly hand-sewn by master craftsmen. From understated leather tones to bold animal prints, these headcovers let you showcase your personal style while maintaining classic sophistication.");
      break;

    case COLLECTION_TYPES.ANIMAL:
      descriptionHTML = wrapDescription("Our Animal Print collection elevates our classic designs with beautiful embossed cowhides. These distinctive headcovers range from subtle, sophisticated patterns to bold, eye-catching designs – perfect for golfers who want to make a statement.");
      break;

    case COLLECTION_TYPES.QCLASSIC:
      descriptionHTML = wrapDescription("Our Quilted Classic collection represents the pinnacle of our craft, combining the sophistication of our Quilted designs with the timeless appeal of our Classic styles. Each headcover is masterfully crafted by artisan leather craftsmen, featuring hand-stitched French seams and our signature diamond pattern.");
      break;
  }

  return descriptionHTML.replace(/\s+/g, " ").trim();
};

const generateSEODescription = (formState, shopifyCollections) => {
  return "pending SEO description"
};

const generateTags = (formState, leatherColors, stitchingThreadColors, embroideryThreadColors, colorTags) => {
  const { 
    leatherColor1, 
    leatherColor2, 
    stitchingThreadColor, 
    embroideryThreadColor 
  } = getColors(formState, leatherColors, stitchingThreadColors, embroideryThreadColors);
  
  // Start with default tags
  const tagSet = new Set(['Customizable']);
  
  // Early return if colorTags is invalid
  if (!Array.isArray(colorTags)) {
    console.error('colorTags is not an array:', colorTags);
    return Array.from(tagSet);
  }
  
  // Helper function to check if a color matches any color in a collection
  const hasMatchingColor = (selectedColor, colorCollection) => {
    return selectedColor && Array.isArray(colorCollection) && 
      colorCollection.some(color => color?.value === selectedColor.value);
  };

  // Check each tag
  colorTags.forEach(tag => {
    if (!tag.leatherColors || !tag.stitchingColors || !tag.embroideryColors) {
      console.warn('Tag is missing required color arrays:', tag);
      return;
    }
    
    // Check if any selected colors match this tag's colors
    const matchesTag = 
      hasMatchingColor(leatherColor1, tag.leatherColors) ||
      hasMatchingColor(leatherColor2, tag.leatherColors) ||
      hasMatchingColor(stitchingThreadColor, tag.stitchingColors) ||
      hasMatchingColor(embroideryThreadColor, tag.embroideryColors);
    
    if (matchesTag) {
      tagSet.add(tag.label);
    }
  });

  return Array.from(tagSet);
};