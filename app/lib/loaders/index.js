// app/lib/loaders/index.js

import { 
  getLeatherColors, 
  getStitchingThreadColors, 
  getEmbroideryThreadColors, 
  getColorTags, 
  getFonts, 
  getShapes, 
  getStyles, 
  getProductPrices, 
  getShopifyCollections, 
  getIsacordNumbers, 
  getAmannNumbers,
  getProductDataLPC 
} from "../utils/dataFetchers";

export const loader = async () => {  
  try {
    const [
      leatherColors, 
      stitchingThreadColors, 
      embroideryThreadColors, 
      colorTags, 
      fonts, 
      shapes, 
      styles, 
      productPrices, 
      shopifyCollections, 
      isacordNumbers, 
      amannNumbers,
      productDataLPC,
    ] = await Promise.all([
      getLeatherColors(),
      getStitchingThreadColors(),
      getEmbroideryThreadColors(),
      getColorTags(),
      getFonts(),
      getShapes(),
      getStyles(),
      getProductPrices(),
      getShopifyCollections(),
      getIsacordNumbers(),
      getAmannNumbers(),
      getProductDataLPC()
    ]);

    return {
      shopifyCollections,
      leatherColors,
      stitchingThreadColors,
      embroideryThreadColors,
      amannNumbers,
      isacordNumbers,
      colorTags,
      shapes,
      styles,
      fonts,
      productPrices,
      productDataLPC,
      error: null
    };
  } catch (error) {
    console.error("Loader Error:", error);
    return new Response(
      JSON.stringify({
        shopifyCollections: [],
        leatherColors: [],
        stitchingThreadColors: [],
        embroideryThreadColors: [],
        amannNumbers: [],
        isacordNumbers: [],
        colorTags: [],
        shapes: [],
        styles: [],
        fonts: [],
        productPrices: [],
        productDataLPC: [],
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
