// app/lib/loaders/index.js

import { 
  getLeatherColors, 
  getStitchingThreadColors, 
  getEmbroideryThreadColors, 
  getIsacordNumbers, 
  getAmannNumbers,
  getColorTags, 
  getFonts, 
  getShapes, 
  getStyles, 
  getShopifyCollections,
  getCommonDescription, 
  getCollectionTitleFormats,
  getProductPrices, 
  getProductDataLPC 
} from "../utils/dataFetchers";

export const loader = async () => {  
  try {
    const [
      leatherColors, 
      stitchingThreadColors, 
      embroideryThreadColors, 
      isacordNumbers, 
      amannNumbers,
      colorTags, 
      fonts, 
      shapes, 
      styles, 
      shopifyCollections,
      commonDescription,
      collectionTitleFormats, 
      productPrices, 
      productDataLPC,
    ] = await Promise.all([
      getLeatherColors(),
      getStitchingThreadColors(),
      getEmbroideryThreadColors(),
      getIsacordNumbers(),
      getAmannNumbers(),
      getColorTags(),
      getFonts(),
      getShapes(),
      getStyles(),
      getShopifyCollections(),
      getCommonDescription(),
      getCollectionTitleFormats(),
      getProductPrices(),
      getProductDataLPC()
    ]);

    return {
      leatherColors,
      stitchingThreadColors,
      embroideryThreadColors,
      isacordNumbers,
      amannNumbers,
      colorTags,
      fonts,
      shapes,
      styles,
      shopifyCollections,
      commonDescription,
      collectionTitleFormats,
      productPrices,
      productDataLPC,
      error: null
    };
  } catch (error) {
    console.error("Loader Error:", error);
    return new Response(
      JSON.stringify({
        leatherColors: [],
        stitchingThreadColors: [],
        embroideryThreadColors: [],
        isacordNumbers: [],
        amannNumbers: [],
        colorTags: [],
        fonts: [],
        shapes: [],
        styles: [],
        shopifyCollections: [],
        commonDescription: [],
        collectionTitleFormats: [],
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
