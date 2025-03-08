// app/lib/loaders/index.js

import { 
  getLeatherColors, 
  getStitchingThreadColors, 
  getEmbroideryThreadColors, 
  getFonts, 
  getShapes, 
  getShopifyCollections,
  getCommonDescription, 
  getProductDataLPC,
  getOptionLayouts,
  getOptions,
  getOptionTags,
  getOptionSets
} from "../utils/dataFetchers";

export const loader = async () => {  
  try {
    const [
      leatherColors, 
      stitchingThreadColors, 
      embroideryThreadColors, 
      fonts, 
      shapes, 
      shopifyCollections,
      commonDescription,
      productDataLPC,
      optionLayouts,
      options,
      optionTags,
      optionSets
    ] = await Promise.all([
      getLeatherColors(),
      getStitchingThreadColors(),
      getEmbroideryThreadColors(),
      getFonts(),
      getShapes(),
      getShopifyCollections(),
      getCommonDescription(),
      getProductDataLPC(),
      getOptionLayouts(),
      getOptions(),
      getOptionTags(),
      getOptionSets()
    ]);

    return {
      leatherColors,
      stitchingThreadColors,
      embroideryThreadColors,
      fonts,
      shapes,
      shopifyCollections,
      commonDescription,
      productDataLPC,
      optionLayouts,
      options,
      optionTags,
      optionSets,
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
        productDataLPC: [],
        optionLayouts: [],
        options: [],
        optionTags: [],
        optionSets: [],
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
