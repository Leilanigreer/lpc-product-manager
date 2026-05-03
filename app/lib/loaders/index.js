// app/lib/loaders/index.js

import { 
  getLeatherColorsFromShopify,
  getLeatherCollectionNamesFromShopify,
  getFontsFromShopify,
  getCommonDescription,
  getShopifyColorMetaobjects,
} from "../utils/dataFetchers";
import { getStitchingThreadColorDataFromShopify } from "../server/stitchingThreadShopify.server";
import { getEmbroideryThreadColorDataFromShopify } from "../server/embroideryThreadShopify.server.js";
import { getProductCollectionsFromShopify } from "../server/collectionShopify.server";
import { attachVersioningSkusToShopifyCollections } from "../server/collectionBaseSkusShopify.server.js";
import {
  fetchStyleMetaobjectNodes,
  mapStyleMetaobjectNodeToFormStyle,
  attachStylesToShopifyCollections,
} from "../server/styleShopify.server";
import { getShapesFromShopify } from "../server/shapeShopify.server";

/** @returns {Promise<{ collections: object[] }>} */
async function loadShopifyCollectionsForLoader(admin) {
  if (!admin) {
    console.warn(
      "loadShopifyCollectionsForLoader: no admin client; returning empty collections (Shopify-only)."
    );
    return { collections: [] };
  }
  const collections = await getProductCollectionsFromShopify(admin);
  let formStyles = [];
  try {
    const rawNodes = await fetchStyleMetaobjectNodes(admin);
    formStyles = rawNodes.map(mapStyleMetaobjectNodeToFormStyle);
  } catch (styleErr) {
    console.error(
      "loadShopifyCollectionsForLoader: style metaobjects failed; collections load without styles:",
      styleErr
    );
  }
  const attached = attachStylesToShopifyCollections(collections, formStyles);
  const withVersioningSkus = await attachVersioningSkusToShopifyCollections(
    admin,
    attached
  );
  return { collections: withVersioningSkus };
}

async function loadShapesForLoader(admin) {
  if (!admin?.graphql) {
    console.warn(
      "loadShapesForLoader: no Shopify GraphQL client; returning empty shapes (Shopify-only)."
    );
    return [];
  }
  try {
    return await getShapesFromShopify(admin);
  } catch (err) {
    console.error("loadShapesForLoader: Shopify shape metaobjects failed:", err);
    throw err;
  }
}

/**
 * @param {{ admin?: object, includeCommonDescription?: boolean }} [opts]
 * @param {boolean} [opts.includeCommonDescription=true] Set false for create-product (no Prisma common descriptions).
 */
export const loader = async ({ admin, includeCommonDescription = true } = {}) => {  
  try {
    const fontsPromise = getFontsFromShopify(admin);
    const leatherResultPromise = getLeatherColorsFromShopify(admin);
    const shopifyColorsPromise = admin ? getShopifyColorMetaobjects(admin) : Promise.resolve([]);
    const leatherCollectionNamesPromise = admin ? getLeatherCollectionNamesFromShopify(admin) : Promise.resolve([]);
    const stitchingDataPromise = getStitchingThreadColorDataFromShopify(admin);
    const embroideryDataPromise = getEmbroideryThreadColorDataFromShopify(admin);
    const shopifyCollectionsPromise = loadShopifyCollectionsForLoader(admin);
    const shapesPromise = loadShapesForLoader(admin);
    const commonDescriptionPromise = includeCommonDescription
      ? getCommonDescription()
      : Promise.resolve(null);
    const [
      leatherResult,
      stitchingData,
      embroideryData,
      fontsData,
      shapes,
      shopifyLoad,
      commonDescription,
      shopifyColors,
      leatherCollectionNames,
    ] = await Promise.all([
      leatherResultPromise,
      stitchingDataPromise,
      embroideryDataPromise,
      fontsPromise,
      shapesPromise,
      shopifyCollectionsPromise,
      commonDescriptionPromise,
      shopifyColorsPromise,
      leatherCollectionNamesPromise,
    ]);

    const embroideryThreadColors = embroideryData.embroideryThreadColors;
    const unlinkedIsacordNumbers = embroideryData.unlinkedIsacordNumbers;
    const embroideryThreadColorsLoadError = embroideryData.loadError ?? null;
    const stitchingThreadColorsLoadError = stitchingData.loadError ?? null;

    const fonts = fontsData.fonts ?? [];
    const fontsLoadError = fontsData.loadError ?? null;

    const shopifyCollections = shopifyLoad.collections;

    const leatherColors = leatherResult?.leatherColors ?? [];
    const leatherColorsLoadError = leatherResult?.loadError ?? null;

    return {
      leatherColors,
      leatherColorsLoadError,
      stitchingThreadColors: stitchingData.stitchingThreadColors,
      stitchingThreadColorsLoadError,
      embroideryThreadColors,
      embroideryThreadColorsLoadError,
      fonts,
      fontsLoadError,
      shapes,
      shopifyCollections,
      ...(includeCommonDescription
        ? { commonDescription: commonDescription ?? [] }
        : {}),
      unlinkedIsacordNumbers,
      unlinkedAmannNumbers: stitchingData.unlinkedAmannNumbers,
      shopifyColors,
      leatherCollectionNames,
      error: null
    };
  } catch (error) {
    console.error("Loader Error:", error);
    return new Response(
      JSON.stringify({
        leatherColors: [],
        leatherColorsLoadError: error.message,
        stitchingThreadColors: [],
        stitchingThreadColorsLoadError: error.message,
        embroideryThreadColors: [],
        embroideryThreadColorsLoadError: error.message,
        fonts: [],
        fontsLoadError: error.message,
        shapes: [],
        shopifyCollections: [],
        ...(includeCommonDescription ? { commonDescription: [] } : {}),
        unlinkedIsacordNumbers: [],
        unlinkedAmannNumbers: [],
        shopifyColors: [],
        error: error.message
      }), 
      { status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
       }
    );
  }
};
