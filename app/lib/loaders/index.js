// app/lib/loaders/index.js

import { 
  getLeatherColors, 
  getLeatherColorsFromShopify,
  getLeatherCollectionNamesFromShopify,
  getStitchingThreadColors, 
  getEmbroideryThreadColors, 
  getFonts, 
  getFontsFromShopify,
  getShapes, 
  getShopifyCollections,
  getCommonDescription, 
  getProductSets,
  getColorTags,
  getUnlinkedIsacordNumbers,
  getUnlinkedAmannNumbers,
  getShopifyColorMetaobjects,
} from "../utils/dataFetchers";

export const loader = async ({ admin } = {}) => {  
  try {
    const fontsPromise = admin ? getFontsFromShopify(admin) : getFonts();
    const leatherResultPromise = admin
      ? getLeatherColorsFromShopify(admin)
      : getLeatherColors().then((arr) => ({ leatherColors: arr }));
    const shopifyColorsPromise = admin ? getShopifyColorMetaobjects(admin) : Promise.resolve([]);
    const leatherCollectionNamesPromise = admin ? getLeatherCollectionNamesFromShopify(admin) : Promise.resolve([]);
    const [
      leatherResult,
      stitchingThreadColors,
      embroideryThreadColors,
      fonts,
      shapes,
      shopifyCollections,
      commonDescription,
      colorTags,
      unlinkedIsacordNumbers,
      unlinkedAmannNumbers,
      shopifyColors,
      leatherCollectionNames,
    ] = await Promise.all([
      leatherResultPromise,
      getStitchingThreadColors(),
      getEmbroideryThreadColors(),
      fontsPromise,
      getShapes(),
      getShopifyCollections(),
      getCommonDescription(),
      getColorTags(),
      getUnlinkedIsacordNumbers(),
      getUnlinkedAmannNumbers(),
      shopifyColorsPromise,
      leatherCollectionNamesPromise,
    ]);

    const leatherColors = leatherResult?.leatherColors ?? [];
    const leatherColorsLoadError = leatherResult?.loadError ?? null;

    const productSets = await getProductSets(fonts, leatherColors);

    return {
      leatherColors,
      leatherColorsLoadError,
      stitchingThreadColors,
      embroideryThreadColors,
      fonts,
      shapes,
      shopifyCollections,
      commonDescription,
      productSets,
      colorTags,
      unlinkedIsacordNumbers,
      unlinkedAmannNumbers,
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
