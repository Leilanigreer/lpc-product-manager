// app/lib/loaders/index.js

import { 
  getLeatherColors, 
  getStitchingThreadColors, 
  getEmbroideryThreadColors, 
  getFonts, 
  getShapes, 
  getShopifyCollections,
  getCommonDescription, 
  getProductSets 
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
    ] = await Promise.all([
      getLeatherColors(),
      getStitchingThreadColors(),
      getEmbroideryThreadColors(),
      getFonts(),
      getShapes(),
      getShopifyCollections(),
      getCommonDescription(),
      getProductSets()
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
