/**
 * Shopify Admin API: collections that drive create-product.
 *
 * Source of truth is Shopify — no Postgres join for the list. We only return
 * collections that have custom.pricing_tier set so the catalog matches “product-ready” sets.
 *
 * Metafields requested (namespace custom):
 *   validation, handle_template, seo_template, title_template, google_driver_folder_id,
 *   category, sku_pattern, thread_type, needs_secondary_leather, tag, pricing_tier (metaobject reference)
 */

const PAGE_SIZE = 100;

const PRODUCT_COLLECTIONS_QUERY = `#graphql
  query ProductCollections($first: Int!, $after: String) {
    collections(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          handle
          legacyResourceId
          descriptionHtml
          validation: metafield(namespace: "custom", key: "validation") {
            value
            type
          }
          handleTemplate: metafield(namespace: "custom", key: "handle_template") {
            value
            type
          }
          seoTemplate: metafield(namespace: "custom", key: "seo_template") {
            value
            type
          }
          titleTemplate: metafield(namespace: "custom", key: "title_template") {
            value
            type
          }
          googleDriverFolderId: metafield(namespace: "custom", key: "google_driver_folder_id") {
            value
            type
          }
          category: metafield(namespace: "custom", key: "category") {
            value
            type
          }
          skuPattern: metafield(namespace: "custom", key: "sku_pattern") {
            value
            type
          }
          threadType: metafield(namespace: "custom", key: "thread_type") {
            value
            type
          }
          needsSecondaryLeather: metafield(namespace: "custom", key: "needs_secondary_leather") {
            value
            type
          }
          tag: metafield(namespace: "custom", key: "tag") {
            value
            type
          }
          pricingTier: metafield(namespace: "custom", key: "pricing_tier") {
            value
            type
            reference {
              __typename
              ... on Metaobject {
                id
                handle
                displayName
                type
              }
            }
          }
        }
      }
    }
  }
`;

function metafieldString(mf) {
  if (mf == null || mf.value == null) return null;
  const s = String(mf.value).trim();
  return s.length ? s : null;
}

function hasPricingTierSet(mf) {
  if (!mf) return false;
  if (mf.reference != null) return true;
  return Boolean(metafieldString(mf));
}

function parseTitleValidationJson(raw) {
  if (!raw || typeof raw !== "string") return null;
  try {
    const o = JSON.parse(raw);
    if (
      o &&
      typeof o === "object" &&
      Array.isArray(o.required) &&
      o.errorMessages != null &&
      typeof o.errorMessages === "object"
    ) {
      return o;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function normalizeThreadType(raw) {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s) return "NONE";
  const u = s.toUpperCase().replace(/\s+/g, "_");
  if (u === "STITCHING" || u === "EMBROIDERY" || u === "NONE") return u;
  return "NONE";
}

/** Shopify boolean metafields often store "true" / "false" strings. */
function parseBoolMetafield(mf) {
  if (!mf || mf.value == null) return false;
  const v = mf.value;
  if (typeof v === "boolean") return v;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "1";
}

/**
 * @param {object} node - Collection node from PRODUCT_COLLECTIONS_QUERY
 * @returns {object|null} Form-ready collection or null if pricing tier not set
 */
function mapCollectionNodeToFormCollection(node) {
  if (!node || !hasPricingTierSet(node.pricingTier)) return null;

  const titleTemplate = metafieldString(node.titleTemplate) ?? "";
  const seoTemplate = metafieldString(node.seoTemplate) ?? "";
  const handleTemplate = metafieldString(node.handleTemplate) ?? "";
  const validationRaw = metafieldString(node.validation);
  const validationParsed = parseTitleValidationJson(validationRaw);

  const ref = node.pricingTier?.reference;
  const pricingTierMetaobject =
    ref && ref.__typename === "Metaobject"
      ? {
          id: ref.id,
          handle: ref.handle,
          displayName: ref.displayName,
          type: ref.type,
        }
      : null;

  return {
    source: "shopify",
    value: node.id,
    label: node.title ?? "",
    handle: node.handle ?? "",
    shopifyId:
      node.legacyResourceId != null && node.legacyResourceId !== ""
        ? String(node.legacyResourceId)
        : "",
    admin_graphql_api_id: node.id,
    description: node.descriptionHtml ?? "",

    titleFormat: {
      titleTemplate,
      seoTemplate,
      handleTemplate,
      validation: validationParsed,
    },
    validationRaw,

    googleDriveFolderId: metafieldString(node.googleDriverFolderId),
    category: metafieldString(node.category),
    skuPattern: metafieldString(node.skuPattern),
    threadType: normalizeThreadType(metafieldString(node.threadType)),
    needsSecondaryLeather: parseBoolMetafield(node.needsSecondaryLeather),
    tag: metafieldString(node.tag),

    pricingTierMetaobject,
    /** Populated later when pricing is read from the tier metaobject in Shopify. */
    priceTier: null,

    metafields: {
      validation: node.validation,
      handle_template: node.handleTemplate,
      seo_template: node.seoTemplate,
      title_template: node.titleTemplate,
      google_driver_folder_id: node.googleDriverFolderId,
      category: node.category,
      sku_pattern: node.skuPattern,
      thread_type: node.threadType,
      needs_secondary_leather: node.needsSecondaryLeather,
      tag: node.tag,
      pricing_tier: node.pricingTier,
    },

    // Stubs until those concepts move to Shopify metafields / your next steps
    commonDescription: true,
    needsStyle: false,
    stylePerCollection: false,
    showInDropdown: true,
    defaultStyleNamePattern: "STANDARD",
    styles: [],
  };
}

/**
 * All collections with custom.pricing_tier set, with the product metafields above.
 *
 * @param {Object} admin - Shopify authenticate.admin() client
 * @returns {Promise<object[]>}
 */
export async function getProductCollectionsFromShopify(admin) {
  const out = [];
  let after = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await admin.graphql(PRODUCT_COLLECTIONS_QUERY, {
      variables: { first: PAGE_SIZE, after },
    });
    const json = await response.json();
    if (json.errors?.length) {
      throw new Error(json.errors.map((e) => e.message).join("; "));
    }
    const conn = json.data?.collections;
    for (const edge of conn?.edges ?? []) {
      const mapped = mapCollectionNodeToFormCollection(edge?.node);
      if (mapped) out.push(mapped);
    }
    hasNextPage = conn?.pageInfo?.hasNextPage ?? false;
    after = conn?.pageInfo?.endCursor ?? null;
  }

  out.sort((a, b) => a.label.localeCompare(b.label));
  return out;
}
