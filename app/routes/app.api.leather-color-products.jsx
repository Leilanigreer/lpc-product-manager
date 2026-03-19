import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { getActiveLpcProductsByLeatherShopifyId } from "../lib/server/leatherColorProducts.server.js";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const leatherColorId = url.searchParams.get("leatherColorId");
  if (!leatherColorId?.trim()) {
    return json({ products: [], error: null });
  }
  const result = await getActiveLpcProductsByLeatherShopifyId(admin, leatherColorId.trim());
  return json(result);
};

/** Resource route for useFetcher().load — no UI */
export default function LeatherColorProductsApi() {
  return null;
}
