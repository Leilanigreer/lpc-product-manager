import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { fetchCollectionBaseSkusForVersioning } from "../lib/server/collectionBaseSkusShopify.server.js";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const collectionId = url.searchParams.get("collectionId")?.trim();
  if (!collectionId) {
    return json(
      {
        collectionId: null,
        existingProducts: [],
        shopifyGraphqlPages: [],
        error:
          "Missing collectionId query parameter. The request URL must include ?collectionId=gid%3A%2F%2Fshopify%2FCollection%2F…",
      },
      { status: 400 }
    );
  }
  try {
    const raw = await fetchCollectionBaseSkusForVersioning(
      (query, options) => admin.graphql(query, options),
      collectionId
    );
    let existingProducts;
    let shopifyGraphqlPages;
    if (Array.isArray(raw)) {
      console.warn(
        "[collection-base-skus] fetchCollectionBaseSkusForVersioning returned a legacy array shape; redeploy server bundle."
      );
      existingProducts = raw;
      shopifyGraphqlPages = [];
    } else {
      existingProducts = raw?.existingProducts ?? [];
      shopifyGraphqlPages = raw?.shopifyGraphqlPages ?? [];
    }
    return json({ collectionId, existingProducts, shopifyGraphqlPages, error: null });
  } catch (e) {
    console.error("[collection-base-skus]", e);
    return json({
      collectionId,
      existingProducts: [],
      shopifyGraphqlPages: [],
      error: e?.message ?? String(e),
    });
  }
};

/** Resource route for `useFetcher().load` — no UI */
export default function CollectionBaseSkusApi() {
  return null;
}
