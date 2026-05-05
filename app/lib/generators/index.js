// app/lib/generators/index.js

import { generateTitle, generateMainHandle, generateSEOTitle } from './titleGenerator';
import { plainProductDescriptionToHtml } from './htmlDescription';
import { generateSEODescription } from './seoDescription';
import { generateTags } from './tagsGenerator';
import { generateVariants } from './variants';
import { generateBaseParts, calculateVersionFromParts } from '../utils';
import { isShopifyMetaobjectGid } from '../utils/shopifyGid';
import { mapStitchingThreads, mapEmbroideryThreads } from '../utils/threadUtils';

/** Shopify Color metaobject GIDs linked on leather_color (shopify--color-pattern). */
function collectShopifyColorMetaobjectIdsFromLeathers(formState) {
  const ids = new Set();
  for (const key of ['primary', 'secondary']) {
    const lc = formState.leatherColors?.[key];
    if (!lc) continue;
    const arr = lc.colorMetaobjectIds;
    if (!Array.isArray(arr)) continue;
    for (const id of arr) {
      if (isShopifyMetaobjectGid(id)) ids.add(id);
    }
  }
  return [...ids];
}

/** Leather_color metaobject GIDs (primary / secondary). */
function collectLeatherMetaobjectGids(formState) {
  const out = [];
  for (const key of ['primary', 'secondary']) {
    const v = formState.leatherColors?.[key]?.value;
    if (isShopifyMetaobjectGid(v)) out.push(v);
  }
  return [...new Set(out)];
}

/**
 * Product-level Shopify metafield payloads (GIDs only). Used by `createShopifyProduct` metafieldsSet.
 * @param {object} formState
 * @param {object[]} variants - Output of `generateVariants`; product-level shape/style lists only when length === 1.
 */
function buildShopifyProductMetafields(formState, variants) {
  const amannRows = mapStitchingThreads(formState.stitchingThreads);
  const embroideryRows = mapEmbroideryThreads(formState);

  const amannThreadsUsed = [
    ...new Set(
      amannRows.map((r) => r.amannNumberValue).filter(isShopifyMetaobjectGid)
    ),
  ];
  const isacordThreadsUsed = [
    ...new Set(
      embroideryRows.map((r) => r.isacordNumberValue).filter(isShopifyMetaobjectGid)
    ),
  ];

  /**
   * Product `custom.shape` / `custom.style` only when exactly one Shopify variant row is generated.
   * TODO: Revisit when Limited Edition / Artisan collection flows are built out — product-level shape
   * rules may need to differ by offering or collection instead of variant count alone.
   */
  let productShapeStyleLists = null;
  if (Array.isArray(variants) && variants.length === 1) {
    const v = variants[0];
    const shapeGid =
      v?.shapeValue && isShopifyMetaobjectGid(v.shapeValue) ? v.shapeValue : null;
    const styleGid =
      v?.style?.value && isShopifyMetaobjectGid(v.style.value)
        ? v.style.value
        : null;
    productShapeStyleLists = {
      shapeList: shapeGid ? [shapeGid] : [],
      styleList: styleGid ? [styleGid] : [],
    };
  }

  return {
    leathersUsed: collectLeatherMetaobjectGids(formState),
    shopifyColors: collectShopifyColorMetaobjectIdsFromLeathers(formState),
    amannThreadsUsed,
    isacordThreadsUsed,
    fontGid: isShopifyMetaobjectGid(formState.selectedFont)
      ? formState.selectedFont
      : null,
    productShapeStyleLists,
  };
}

/**
 * Generates complete product data by coordinating all generators
 * @param {object} formState
 * @param {string} productDescriptionPlain Plain text product body (AI or hand-written); becomes `descriptionHTML`.
 */
export const generateProductData = async (formState, productDescriptionPlain) => {
  try {
    const desc = String(productDescriptionPlain ?? "").trim();

    // Generate SKU information
    const skuParts = generateBaseParts(formState);    
    if (!Array.isArray(skuParts) || skuParts.length === 0) {
      throw new Error('Failed to generate SKU parts');
    }

    const version = calculateVersionFromParts(skuParts, formState.existingProducts);
    const skuInfo = { parts: skuParts, version };

    /** Same as each variant’s `baseSKU`: parts + optional `-V{n}`, no shape suffix (e.g. Driver). */
    const filteredSkuParts = skuParts.filter(Boolean);
    const joinedBase = filteredSkuParts.join("-");
    const versionedBaseSku = version
      ? `${joinedBase}-V${version}`
      : joinedBase;

    // Generate title and variants in parallel
    const [title, variants] = await Promise.all([
      generateTitle(formState),
      generateVariants(formState, skuInfo)
    ]);

    if (!variants || variants.length === 0) {
      throw new Error('No variants generated');
    }

    // Build the complete product data object
    const collectionLabel =
      typeof formState.collection?.label === "string"
        ? formState.collection.label
        : "";

    const productData = {
      title,
      /** Drive filenames like `{versionedBaseSku}-group-image`; do not use variant `sku` (includes shape). */
      versionedBaseSku,
      mainHandle: await generateMainHandle(formState, title, version),
      productType: collectionLabel,
      seoTitle: await generateSEOTitle(formState, title),
      descriptionHTML: plainProductDescriptionToHtml(desc),
      seoDescription: generateSEODescription(formState),
      tags: generateTags(formState),
      variants,
      additionalViews: [], // Initialize empty array for additional views
      
      // Database fields
      collection: formState.collection,
      selectedFont: formState.selectedFont,
      offeringType: formState.selectedOfferingType,
      limitedEditionQuantity: formState.limitedEditionQuantity || null,

      // Color and thread selections
      selectedLeatherColor1: formState.leatherColors.primary.value,
      selectedLeatherColor2: formState.leatherColors?.secondary?.value || null,
      stitchingThreads: formState.stitchingThreads,

      /** Payload for `metafieldsSet` on Product (and variant metafields use `variants`). */
      shopifyProductMetafields: buildShopifyProductMetafields(formState, variants),

      createdAt: new Date().toISOString()
    };

    return productData;

  } catch (error) {
    console.error('Product data generation failed:', error);
    throw error;
  }
};

// Re-export all generators for convenience
export * from './htmlDescription';
export * from './seoDescription';
export * from './tagsGenerator';
export * from './titleGenerator';
export * from './variants';