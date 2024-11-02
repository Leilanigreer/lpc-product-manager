import { json } from "@remix-run/node";
// import { authenticate } from "../shopify.server";
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
} from "./dataFetchers";

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

    return json({
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
    });
  } catch (error) {
    console.error("Loader Error:", error);
    return json(
      {
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
      }, 
      { status: 500 }
    );
  }
};
