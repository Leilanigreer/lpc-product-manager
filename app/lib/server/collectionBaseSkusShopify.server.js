/**
 * Loads `custom.base_sku` values from Shopify products in a collection for SKU version bumping.
 * Replaces legacy Postgres `productSetDataLPC` for the create-product version bump (see
 * `fetchCollectionBaseSkusForVersioning`). Returns deduped rows plus aggregate counts (products in
 * the collection connection, metafield present, non-empty value). Vendor filtering is not applied
 * here: LPC collections only contain LPC products; vendor scoping stays on store-wide tools
 * (e.g. Sync base SKUs scan).
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
 * Rows for `calculateVersionFromParts`: `{ baseSKU, collection }` where `collection` matches
 * `filterProductsByCollection` / form collection `value` (Shopify Collection GID).
 *
 * Only includes products with a non-empty `custom.base_sku`.
 *
 * @param {(query: string, options?: { variables?: object }) => Promise<Response>} graphql
 * @param {string} collectionGid - Shopify Collection GID (`gid://shopify/Collection/...`)
 * @returns {Promise<{
 *   existingProducts: Array<{ baseSKU: string, collection: { shopifyAdminGid: string, value: string } }>;
 *   stats: {
 *     collectionResolved: boolean;
 *     collectionProductCount: number;
 *     productsWithBaseSkuMetafield: number;
 *     productsWithNonEmptyBaseSku: number;
 *   };
 * }>}
 */
export async function fetchCollectionBaseSkusForVersioning(graphql, collectionGid) {
  const emptyStats = {
    collectionResolved: false,
    collectionProductCount: 0,
    productsWithBaseSkuMetafield: 0,
    productsWithNonEmptyBaseSku: 0,
  };

  if (!collectionGid?.trim()) {
    return { existingProducts: [], stats: emptyStats };
  }

  const rows = [];
  let cursor = null;
  let collectionResolved = false;
  let collectionProductCount = 0;
  let productsWithBaseSkuMetafield = 0;
  let productsWithNonEmptyBaseSku = 0;

  do {
    const response = await graphql(COLLECTION_PRODUCTS_BASE_SKU_QUERY, {
      variables: { id: collectionGid.trim(), cursor },
    });
    const json = await response.json();
    if (json.errors?.length) {
      throw new Error(json.errors.map((e) => e.message).join("; "));
    }

    const collection = json.data?.collection;
    if (!collection) {
      break;
    }
    collectionResolved = true;

    const conn = collection.products;
    const nodes = conn?.nodes ?? [];
    collectionProductCount += nodes.length;

    for (const node of nodes) {
      if (!node) continue;
      if (node.metafield != null) {
        productsWithBaseSkuMetafield += 1;
      }
      const base = (node.metafield?.value ?? "").trim();
      if (base) {
        productsWithNonEmptyBaseSku += 1;
        rows.push({
          baseSKU: base,
          collection: {
            shopifyAdminGid: collectionGid,
            value: collectionGid,
          },
        });
      }
    }

    cursor = conn?.pageInfo?.hasNextPage ? conn.pageInfo.endCursor : null;
  } while (cursor);

  return {
    existingProducts: _.uniqBy(rows, "baseSKU"),
    stats: {
      collectionResolved,
      collectionProductCount,
      productsWithBaseSkuMetafield,
      productsWithNonEmptyBaseSku,
    },
  };
}
