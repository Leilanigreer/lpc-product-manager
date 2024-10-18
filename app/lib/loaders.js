import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getCollections, getLeatherColors, getThreadColors, getFonts, getShapes, getStyles } from "./dataFetchers";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  
  try {
    const [collections, leatherColors, threadColors, fonts, shapes, styles] = await Promise.all([
      getCollections(admin),
      getLeatherColors(),
      getThreadColors(),
      getFonts(),
      getShapes(),
      getStyles(),
    ]);
    return json({ collections, leatherColors, threadColors, fonts, shapes, styles });
  } catch (error) {
    console.error('Loader error:', error);
    return json({ error: error.message }, { status: 500 });
  }
};
