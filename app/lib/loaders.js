import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getCollections, getLeatherColors, getThreadColors, getFonts, getShapes, getStyles, getProductPrices } from "./dataFetchers";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  
  try {
    const [collections, leatherColors, threadColors, fonts, shapes, styles, productPrices] = await Promise.all([
      getCollections(admin),
      getLeatherColors(),
      getThreadColors(),
      getFonts(),
      getShapes(),
      getStyles(),
      getProductPrices(),
    ]);
    return json({ collections, leatherColors, threadColors, fonts, shapes, styles, productPrices });
  } catch (error) {
    console.error('Loader error:', error);
    return json({ error: error.message }, { status: 500 });
  }
};
