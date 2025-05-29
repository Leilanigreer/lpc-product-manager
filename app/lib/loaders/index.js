// app/lib/loaders/index.js

import { 
  getLeatherColors, 
  getStitchingThreadColors, 
  getEmbroideryThreadColors, 
  getFonts, 
  getShapes, 
  getShopifyCollections,
  getCommonDescription, 
  getProductSets,
  getColorTags
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
      productSets,
      colorTags,
    ] = await Promise.all([
      getLeatherColors(),
      getStitchingThreadColors(),
      getEmbroideryThreadColors(),
      getFonts(),
      getShapes(),
      getShopifyCollections(),
      getCommonDescription(),
      getProductSets(),
      getColorTags()
    ]);

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
