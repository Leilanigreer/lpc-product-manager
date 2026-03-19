// app/lib/server/leatherColorProducts.server.js
const PRODUCTS_BY_LEATHER_QUERY = `#graphql
  query GetProductsByLeatherColor($searchQuery: String!, $first: Int!, $after: String) {
    products(first: $first, after: $after, query: $searchQuery) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          handle
          status
          metafield(namespace: "custom", key: "leathers_used") {
            references(first: 5) {
              nodes {
                ... on Metaobject {
                  id
                }
              }
            }
          }
        }
      }
    }
  }
`;

/**
 * Finds Shopify ACTIVE products that reference the given leather_content metaobject
 * via product metafield `custom.leathers_used`.
 *
 * Important: Shopify search may be stale, so we verify the returned product's
 * metafield references include the exact leather GID.
 *
 * @param {Object} admin - Shopify admin GraphQL client
 * @param {string} leatherShopifyGid - gid://shopify/Metaobject/...
 * @returns {Promise<{ products: Array<{ shopifyProductId: string, title: string, handle: string }>, error?: string }>}
 */
export async function getActiveLpcProductsByLeatherShopifyId(admin, leatherShopifyGid) {
  if (!admin?.graphql) return { products: [], error: "No Shopify admin client available." };
  if (!leatherShopifyGid || typeof leatherShopifyGid !== "string") return { products: [] };

  const searchQuery = `metafields.custom.leathers_used:"${leatherShopifyGid}"`;
  const pageSize = 25;
  const maxProducts = 250; // safety cap; UI will still work for large lists

  try {
    const seenProductIds = new Set();
    const out = [];

    let after = null;
    let hasNextPage = true;

    while (hasNextPage) {
      const response = await admin.graphql(PRODUCTS_BY_LEATHER_QUERY, {
        variables: {
          searchQuery,
          first: pageSize,
          after,
        },
      });

      const json = await response.json();
      const gqlErrors = json?.errors ?? [];
      if (gqlErrors.length) {
        const msg = gqlErrors.map((e) => e.message).join("; ");
        console.error("Shopify GraphQL errors (products by leather):", msg);
        return { products: [], error: msg };
      }

      const connection = json?.data?.products;
      const edges = connection?.edges ?? [];
      const pageInfo = connection?.pageInfo ?? {};

      for (const edge of edges) {
        const node = edge?.node;
        if (!node?.id) continue;
        if (node.status !== "ACTIVE") continue;
        if (seenProductIds.has(node.id)) continue;

        // Verify metafield references include the exact leather gid.
        const referencedIds = (node.metafield?.references?.nodes ?? [])
          .map((n) => n?.id)
          .filter(Boolean);
        if (!referencedIds.includes(leatherShopifyGid)) continue;

        seenProductIds.add(node.id);
        out.push({
          shopifyProductId: node.id,
          title: node.title || "Untitled product",
          handle: node.handle || "",
        });

        if (out.length >= maxProducts) break;
      }

      if (out.length >= maxProducts) break;
      hasNextPage = Boolean(pageInfo?.hasNextPage);
      after = pageInfo?.endCursor ?? null;
      if (!hasNextPage) break;
    }

    out.sort((a, b) => a.title.localeCompare(b.title));
    return { products: out };
  } catch (err) {
    const msg = err?.message ?? String(err);
    console.error("getActiveLpcProductsByLeatherShopifyId (Shopify-only):", err);
    return { products: [], error: msg };
  }
}
