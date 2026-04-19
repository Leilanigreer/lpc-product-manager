/**
 * Collection `custom.base_sku` scan for SKU version bumping (replaces legacy Postgres
 * `productSetDataLPC` for create-product). Vendor filtering is not applied: LPC collections only
 * contain LPC products. Sync base SKUs scopes by collections with `show_in_creation_dropdown`.
 *
 * ---------------------------------------------------------------------------
 * Why this runs in the Remix loader — not via `fetch("/app/api/...")` from the browser
 * ---------------------------------------------------------------------------
 * Both paths ultimately call the same Admin GraphQL query (`collection(id){ products{ nodes {
 * metafield(namespace:"custom", key:"base_sku") }}}`) through `admin.graphql`.
 *
 * **Loader (this module + `attachVersioningSkusToShopifyCollections`):**
 * - Runs on the server inside `authenticate.admin(request)` during the document request.
 * - `admin.graphql` returns a normal `Response`; we `await response.json()` and get a plain
 *   object with `data`, optional `errors`, `extensions` — the same shape GraphiQL shows.
 * - Remix serializes that into `useLoaderData()` → `shopifyCollections[].versioningSkus`.
 *
 * **Old pattern: resource route called from the embedded admin iframe with `fetch`:**
 * - The Remix `admin.graphql` wrapper stringifies the client result into a *new* `Response` for
 *   the resource route. In the Shopify embedded app, the browser’s `fetch` to that route often
 *   returned a body that parsed to **empty** `shopifyGraphqlPages` / missing nested `data`, while
 *   the same GraphQL call succeeded in GraphiQL and here in the loader. So the bug was not the
 *   query text — it was **transport + parsing in the iframe client** vs **server loader JSON**.
 *
 * Create-product therefore uses **only** `versioningSkus` from the loader (no duplicate client
 * fetch). Optional `DEBUG_COLLECTION_BASE_SKUS=1` logs each Shopify response page on the server.
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
 * Serializable slice of a GraphQL HTTP JSON body for loader-side debug snapshots.
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

    if (process.env.DEBUG_COLLECTION_BASE_SKUS === "1") {
      const nodes = json?.data?.collection?.products?.nodes;
      console.log("[DEBUG_COLLECTION_BASE_SKUS]", {
        collectionGid: collectionGid.trim(),
        cursor,
        responseKeys: json && typeof json === "object" ? Object.keys(json) : [],
        errorsIsArray: Array.isArray(json?.errors),
        collectionPresent: Boolean(json?.data?.collection),
        nodeCount: Array.isArray(nodes) ? nodes.length : null,
        bodyPreview: JSON.stringify(graphqlPageForDebug(json)).slice(0, 2000),
      });
    }

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

/**
 * Runs {@link fetchCollectionBaseSkusForVersioning} for each collection in the create-product
 * loader (same `admin` session as the rest of the page). Results are attached as
 * `versioningSkus` on each collection for Preview / `generateProductData`.
 *
 * @param {{ graphql: (q: string, o?: object) => Promise<Response> }} admin
 * @param {object[]} collections - Loader collection rows with `value` (Collection GID)
 * @returns {Promise<object[]>} New array: each item is the input row plus `versioningSkus`
 */
export async function attachVersioningSkusToShopifyCollections(admin, collections) {
  if (!admin?.graphql || !collections?.length) {
    return collections ?? [];
  }
  const graphql = (query, options) => admin.graphql(query, options);
  return Promise.all(
    collections.map(async (col) => {
      const gid = col?.value;
      if (!gid?.trim()) {
        return { ...col, versioningSkus: null };
      }
      try {
        const { existingProducts, shopifyGraphqlPages } =
          await fetchCollectionBaseSkusForVersioning(graphql, gid);
        return {
          ...col,
          versioningSkus: { existingProducts, shopifyGraphqlPages },
        };
      } catch (err) {
        console.error(
          "[attachVersioningSkusToShopifyCollections] base_sku scan failed for",
          gid,
          err
        );
        return {
          ...col,
          versioningSkus: {
            existingProducts: [],
            shopifyGraphqlPages: [],
            loadError: err?.message ?? String(err),
          },
        };
      }
    })
  );
}
