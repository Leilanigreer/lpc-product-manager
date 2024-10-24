import { json } from "@remix-run/node";
// import { authenticate } from "../shopify.server";
import { 
  getLeatherColors, getThreadColors, getFonts, getShapes, getStyles, getProductPrices, getShopifyCollections } from "./dataFetchers";

export const loader = async ({ request }) => {
//   const { admin } = await authenticate.admin(request);
  
  try {
    const [leatherColors, threadColors, fonts, shapes, styles, productPrices, shopifyCollections] = await Promise.all([
      getLeatherColors(),
      getThreadColors(),
      getFonts(),
      getShapes(),
      getStyles(),
      getProductPrices(),
      getShopifyCollections(),
    ]);
    return json({ leatherColors, threadColors, fonts, shapes, styles, productPrices, shopifyCollections });
  } catch (error) {
    console.error('Loader error:', error);
    return json({ error: error.message }, { status: 500 });
  }
};
