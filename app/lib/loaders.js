import { json } from "@remix-run/node";
// import { authenticate } from "../shopify.server";
import { 
  getLeatherColors, getStitchingThreadColors, getEmbroideryThreadColors, getFonts, getShapes, getStyles, getProductPrices, getShopifyCollections, getColorTags } from "./dataFetchers";

export const loader = async ({ request }) => {
//   const { admin } = await authenticate.admin(request);
  
  try {
    const [leatherColors, stitchingThreadColors, embroideryThreadColors, colorTags, fonts, shapes, styles, productPrices, shopifyCollections] = await Promise.all([
      getLeatherColors(),
      getStitchingThreadColors(),
      getEmbroideryThreadColors(),
      getColorTags(),
      getFonts(),
      getShapes(),
      getStyles(),
      getProductPrices(),
      getShopifyCollections(),
    ]);
    return json({ leatherColors, stitchingThreadColors, embroideryThreadColors, colorTags, fonts, shapes, styles, productPrices, shopifyCollections });
  } catch (error) {
    console.error('Loader error:', error);
    return json({ error: error.message }, { status: 500 });
  }
};
