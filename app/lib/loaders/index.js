// app/lib/loaders/index.js

import { 
  getLeatherColors, 
  getLeatherColorsFromShopify,
  getLeatherCollectionNamesFromShopify,
  getEmbroideryThreadColors, 
  getFonts, 
  getFontsFromShopify,
  getShapes, 
  getShopifyCollections,
  getCommonDescription, 
  getProductSets,
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
  buildStyleCategoryDebug,
} from "../server/styleShopify.server";
import { getShapesFromShopify } from "../server/shapeShopify.server";

/** @returns {Promise<{ collections: object[], styleCategoryDebug: object | null }>} */
async function loadShopifyCollectionsForLoader(admin) {
  if (!admin) {
    const collections = await getShopifyCollections();
    return { collections, styleCategoryDebug: null };
  }
  try {
    const collections = await getProductCollectionsFromShopify(admin);
    let formStyles = [];
    let rawNodes = [];
    try {
      rawNodes = await fetchStyleMetaobjectNodes(admin);
      formStyles = rawNodes.map(mapStyleMetaobjectNodeToFormStyle);
    } catch (styleErr) {
      console.error(
        "loadShopifyCollectionsForLoader: style metaobjects failed; collections load without styles:",
        styleErr
      );
    }
    const attached = attachStylesToShopifyCollections(collections, formStyles);
    const styleCategoryDebug = buildStyleCategoryDebug(
      attached,
      formStyles,
      rawNodes
    );
    return { collections: attached, styleCategoryDebug };
  } catch (err) {
    console.error(
      "loadShopifyCollectionsForLoader: Shopify collection query failed; falling back to Postgres list:",
      err
    );
    const collections = await getShopifyCollections();
    return { collections, styleCategoryDebug: null };
  }
}

async function loadShapesForLoader(admin) {
  if (!admin?.graphql) {
    return getShapes();
  }
  try {
    const shapes = await getShapesFromShopify(admin);
    if (shapes.length === 0) {
      console.warn(
        "loadShapesForLoader: Shopify returned no active shapes; falling back to Postgres."
      );
      return getShapes();
    }
    return shapes;
  } catch (err) {
    console.error(
      "loadShapesForLoader: Shopify shape metaobjects failed; falling back to Postgres:",
      err
    );
    return getShapes();
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
    const styleCategoryDebug = shopifyLoad.styleCategoryDebug;

    const leatherColors = leatherResult?.leatherColors ?? [];
    const leatherColorsLoadError = leatherResult?.loadError ?? null;

    const productSets = await getProductSets(fonts, leatherColors);

    return {
      leatherColors,
      leatherColorsLoadError,
      stitchingThreadColors: stitchingData.stitchingThreadColors,
      embroideryThreadColors,
      fonts,
      shapes,
      shopifyCollections,
      styleCategoryDebug,
      commonDescription,
      productSets,
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
        styleCategoryDebug: null,
        commonDescription: [],
        productSets: [],
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
