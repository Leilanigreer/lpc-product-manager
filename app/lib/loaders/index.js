// app/lib/loaders/index.js

import { 
  getLeatherColors, 
  getLeatherColorsFromShopify,
  getLeatherCollectionNamesFromShopify,
  getEmbroideryThreadColors, 
  getFonts, 
  getFontsFromShopify,
  getCommonDescription,
  getColorTags,
  getUnlinkedIsacordNumbers,
  getShopifyColorMetaobjects,
} from "../utils/dataFetchers";
import { getStitchingThreadColorDataFromShopify } from "../server/stitchingThreadShopify.server";
import { getProductCollectionsFromShopify } from "../server/collectionShopify.server";
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
  return { collections: attached };
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

export const loader = async ({ admin } = {}) => {  
  try {
    const fontsPromise = admin ? getFontsFromShopify(admin) : getFonts();
    const leatherResultPromise = admin
      ? getLeatherColorsFromShopify(admin)
      : getLeatherColors().then((arr) => ({ leatherColors: arr }));
    const shopifyColorsPromise = admin ? getShopifyColorMetaobjects(admin) : Promise.resolve([]);
    const leatherCollectionNamesPromise = admin ? getLeatherCollectionNamesFromShopify(admin) : Promise.resolve([]);
    const stitchingDataPromise = admin
      ? getStitchingThreadColorDataFromShopify(admin)
      : Promise.resolve({ stitchingThreadColors: [], unlinkedAmannNumbers: [] });
    const shopifyCollectionsPromise = loadShopifyCollectionsForLoader(admin);
    const shapesPromise = loadShapesForLoader(admin);
    const [
      leatherResult,
      stitchingData,
      embroideryThreadColors,
      fonts,
      shapes,
      shopifyLoad,
      commonDescription,
      colorTags,
      unlinkedIsacordNumbers,
      shopifyColors,
      leatherCollectionNames,
    ] = await Promise.all([
      leatherResultPromise,
      stitchingDataPromise,
      getEmbroideryThreadColors(),
      fontsPromise,
      shapesPromise,
      shopifyCollectionsPromise,
      getCommonDescription(),
      getColorTags(),
      getUnlinkedIsacordNumbers(),
      shopifyColorsPromise,
      leatherCollectionNamesPromise,
    ]);

    const shopifyCollections = shopifyLoad.collections;

    const leatherColors = leatherResult?.leatherColors ?? [];
    const leatherColorsLoadError = leatherResult?.loadError ?? null;

    return {
      leatherColors,
      leatherColorsLoadError,
      stitchingThreadColors: stitchingData.stitchingThreadColors,
      embroideryThreadColors,
      fonts,
      shapes,
      shopifyCollections,
      commonDescription,
      colorTags,
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
        embroideryThreadColors: [],
        fonts: [],
        shapes: [],
        shopifyCollections: [],
        commonDescription: [],
        colorTags: [],
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
