import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { fetchCollectionBaseSkusForVersioning } from "../lib/server/collectionBaseSkusShopify.server.js";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const collectionId = url.searchParams.get("collectionId")?.trim();
  if (!collectionId) {
    return json({ collectionId: null, existingProducts: [], error: null });
  }
  try {
    const existingProducts = await fetchCollectionBaseSkusForVersioning(
      (query, options) => admin.graphql(query, options),
      collectionId
    );
    return json({ collectionId, existingProducts, error: null });
  } catch (e) {
    console.error("[collection-base-skus]", e);
    return json({
      collectionId,
      existingProducts: [],
      error: e?.message ?? String(e),
    });
  }
};

/** Resource route for `useFetcher().load` — no UI */
export default function CollectionBaseSkusApi() {
  return null;
}
