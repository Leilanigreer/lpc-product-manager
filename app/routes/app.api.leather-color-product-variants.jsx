import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { fetchVariantsForProducts } from "../lib/server/inventoryShopify.server.js";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const productIdsParam = url.searchParams.get("productIds");

  if (!productIdsParam?.trim()) {
    return json({ variantsByProductId: {}, error: null });
  }

  const productIds = productIdsParam
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (!productIds.length) {
    return json({ variantsByProductId: {}, error: null });
  }

  try {
    const variantsByProductId = await fetchVariantsForProducts(admin, productIds);
    return json({ variantsByProductId, error: null });
  } catch (err) {
    const msg = err?.message ?? String(err);
    return json({ variantsByProductId: {}, error: msg }, { status: 500 });
  }
};

/** Resource route for useFetcher().load — no UI */
export default function LeatherColorProductVariantsApi() {
  return null;
}
