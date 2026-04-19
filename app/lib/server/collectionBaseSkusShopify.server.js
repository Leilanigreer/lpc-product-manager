/**
 * Loads `custom.base_sku` values from Shopify products in a collection for SKU version bumping.
 * Replaces legacy Postgres `productSetDataLPC` for the create-product version bump (see
 * `fetchCollectionBaseSkusForVersioning`). Also returns each paginated GraphQL JSON body (data /
 * errors / extensions) for debugging. Vendor filtering is not applied here: LPC collections only
 * contain LPC products; vendor scoping stays on store-wide tools (e.g. Sync base SKUs scan).
 */

import _ from "lodash";

const COLLECTION_PRODUCTS_BASE_SKU_QUERY = `#graphql
  query CollectionProductsBaseSku($id: ID!, $cursor: String) {
    collection(id: $id) {
      id
      products(first: 50, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          metafield(namespace: "custom", key: "base_sku") {
            value
          }
        }
      }
    }
  }
`;

/**
 * Serializable slice of a GraphQL HTTP JSON body for loaders / API responses.
 * @param {object} json
 */
function graphqlPageForDebug(json) {
  if (!json || typeof json !== "object") {
    return { data: null, errors: null, extensions: null };
  }
  return {
    data: json.data ?? null,
    errors: json.errors ?? null,
    extensions: json.extensions ?? null,
  };
}

/**
 * Rows for `calculateVersionFromParts`: `{ baseSKU, collection }` where `collection` matches
 * `filterProductsByCollection` / form collection `value` (Shopify Collection GID).
 *
 * Only includes products with a non-empty `custom.base_sku`.
 *
 * @param {(query: string, options?: { variables?: object }) => Promise<Response>} graphql
 * @param {string} collectionGid - Shopify Collection GID (`gid://shopify/Collection/...`)
 * @returns {Promise<{
 *   existingProducts: Array<{ baseSKU: string, collection: { shopifyAdminGid: string, value: string } }>;
 *   shopifyGraphqlPages: Array<{ data: unknown; errors: unknown; extensions: unknown }>;
 * }>}
 */
export async function fetchCollectionBaseSkusForVersioning(graphql, collectionGid) {
  if (!collectionGid?.trim()) {
    return { existingProducts: [], shopifyGraphqlPages: [] };
  }

  const rows = [];
  const shopifyGraphqlPages = [];
  let cursor = null;

  do {
    const response = await graphql(COLLECTION_PRODUCTS_BASE_SKU_QUERY, {
      variables: { id: collectionGid.trim(), cursor },
    });
    const json = await response.json();
    shopifyGraphqlPages.push(graphqlPageForDebug(json));

    if (json.errors?.length) {
      throw new Error(json.errors.map((e) => e.message).join("; "));
    }

    const collection = json.data?.collection;
    if (!collection) {
      break;
    }

    const conn = collection.products;
    for (const node of conn?.nodes ?? []) {
      if (!node) continue;
      const base = (node.metafield?.value ?? "").trim();
      if (!base) continue;
      rows.push({
        baseSKU: base,
        collection: {
          shopifyAdminGid: collectionGid,
          value: collectionGid,
        },
      });
    }

    cursor = conn?.pageInfo?.hasNextPage ? conn.pageInfo.endCursor : null;
  } while (cursor);

  return {
    existingProducts: _.uniqBy(rows, "baseSKU"),
    shopifyGraphqlPages,
  };
}
