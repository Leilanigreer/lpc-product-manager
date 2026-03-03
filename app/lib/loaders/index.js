// app/lib/loaders/index.js

import { 
  getLeatherColors, 
  getLeatherColorsFromShopify,
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
  getUnlinkedAmannNumbers
} from "../utils/dataFetchers";

export const loader = async ({ admin } = {}) => {  
  try {
    const fontsPromise = admin ? getFontsFromShopify(admin) : getFonts();
    const leatherColorsPromise = admin ? getLeatherColorsFromShopify(admin) : getLeatherColors();
    const [
      leatherColors, 
      stitchingThreadColors, 
      embroideryThreadColors, 
      fonts, 
      shapes, 
      shopifyCollections,
      commonDescription,
      colorTags,
      unlinkedIsacordNumbers,
      unlinkedAmannNumbers,
    ] = await Promise.all([
      leatherColorsPromise,
      getStitchingThreadColors(),
      getEmbroideryThreadColors(),
      fontsPromise,
      getShapes(),
      getShopifyCollections(),
      getCommonDescription(),
      getColorTags(),
      getUnlinkedIsacordNumbers(),
      getUnlinkedAmannNumbers()
    ]);

    const productSets = await getProductSets(fonts, leatherColors);

    return {
      leatherColors,
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
      error: null
    };
  } catch (error) {
    console.error("Loader Error:", error);
    return new Response(
      JSON.stringify({
        leatherColors: [],
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
