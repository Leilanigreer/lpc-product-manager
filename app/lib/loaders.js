import { json } from "@remix-run/node";
// import { authenticate } from "../shopify.server";
import { 
  getLeatherColors, getStitchingThreadColors, getEmbroideryThreadColors, getFonts, getShapes, getStyles, getProductPrices, getShopifyCollections, getColorTags, getIsacordNumbers, getAmannNumbers } from "./dataFetchers";

export const loader = async ({ request }) => {
//   const { admin } = await authenticate.admin(request);
  
  try {
    const [leatherColors, stitchingThreadColors, embroideryThreadColors, colorTags, fonts, shapes, styles, productPrices, shopifyCollections, isacordNumbers, amannNumbers] = await Promise.all([
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
    ]);
    return json({ leatherColors, stitchingThreadColors, embroideryThreadColors, colorTags, fonts, shapes, styles, productPrices, shopifyCollections, isacordNumbers, amannNumbers });
  } catch (error) {
    console.error('Loader error:', error);
    return json({ error: error.message }, { status: 500 });
  }
};
