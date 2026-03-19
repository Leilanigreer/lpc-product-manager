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
          tags
          variants(first: 10) {
            nodes {
              inventoryPolicy
              price {
                amount
              }
              compareAtPrice {
                amount
              }
              metafield(namespace: "custom", key: "customizable") {
                value
              }
            }
          }
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

  // Build admin + storefront URLs for clickable product links.
  const shopResponse = await admin.graphql(`#graphql
    query {
      shop {
        myshopifyDomain
        primaryDomain {
          host
        }
      }
    }
  `);
  const shopJson = await shopResponse.json();
  const shop = shopJson?.data?.shop;
  const shopDomain = shop?.myshopifyDomain?.replace(".myshopify.com", "");
  const shopHost = shop?.primaryDomain?.host;

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

        const tagList = node.tags ?? [];
        const tagLowerSet = new Set(tagList.map((t) => String(t).toLowerCase()));
        const hasClearanceTag = tagLowerSet.has("clearance");
        const hasLastChanceTag = tagLowerSet.has("last-chance");
        const hasCustomizableTag = tagLowerSet.has("customizable");
        const hasArtisanTag = tagLowerSet.has("artisan");

        const variantPolicies = (node.variants?.nodes ?? [])
          .map((v) => v?.inventoryPolicy)
          .filter(Boolean);
        const hasContinueSelling = variantPolicies.includes("CONTINUE");

        const toCents = (amount) => {
          if (amount == null) return null;
          const n = Number(amount);
          if (!Number.isFinite(n)) return null;
          return Math.round(n * 100);
        };

        let hasDiscount40 = false;
        let hasDiscount60 = false;

        const variantPrices = (node.variants?.nodes ?? []);
        for (const v of variantPrices) {
          const priceCents = toCents(v?.price?.amount);
          const compareCents = toCents(v?.compareAtPrice?.amount);
          if (priceCents == null || compareCents == null) continue;
          if (compareCents <= 0) continue;
          if (priceCents >= compareCents) continue; // not a discount

          // Expected sale prices for exact discounts:
          // 40% off => pay 60% of compareAtPrice
          // 60% off => pay 40% of compareAtPrice
          const expected40 = Math.round(compareCents * 0.6);
          const expected60 = Math.round(compareCents * 0.4);
          const tolerance = 1; // 1 cent tolerance for rounding

          if (Math.abs(priceCents - expected40) <= tolerance) hasDiscount40 = true;
          if (Math.abs(priceCents - expected60) <= tolerance) hasDiscount60 = true;

          if (hasDiscount40 && hasDiscount60) break;
        }

        const customizableValues = (node.variants?.nodes ?? [])
          .map((v) => v?.metafield?.value)
          .filter((v) => v != null);
        const hasCustomizable = customizableValues.some(
          (v) =>
            v === true ||
            v === "true" ||
            v === "TRUE" ||
            v === "1" ||
            v === 1
        );

        const productNumericId = node.id.split("/").pop();
        const adminProductUrl =
          shopDomain && productNumericId
            ? `https://admin.shopify.com/store/${shopDomain}/products/${productNumericId}`
            : null;
        const liveProductUrl =
          shopHost && node.handle
            ? `https://${shopHost}/products/${node.handle}`
            : null;

        seenProductIds.add(node.id);
        out.push({
          shopifyProductId: node.id,
          title: node.title || "Untitled product",
          handle: node.handle || "",
          hasContinueSelling,
          hasDiscount40,
          hasDiscount60,
          hasCustomizable,
          tags: tagList,
          hasClearanceTag,
          hasLastChanceTag,
          hasCustomizableTag,
          hasArtisanTag,
          adminProductUrl,
          liveProductUrl,
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
