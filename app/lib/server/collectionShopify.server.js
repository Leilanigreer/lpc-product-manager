/**
 * Shopify Admin API: collections that drive create-product.
 *
 * Source of truth is Shopify — no Postgres join for the list. A collection is included only when
 * `custom.show_in_creation_dropdown` parses as true (`parseBoolMetafield`). Missing or empty
 * metafield is treated as false.
 *
 * Metafields requested (namespace custom):
 *   validation, handle_template, seo_template, title_template, google_driver_folder_id,
 *   category, sku_pattern, thread_type, needs_secondary_leather, tag, show_in_creation_dropdown,
 *   pricing_tier (metaobject reference, optional — still loaded when set)
 *
 * Pricing tier metaobject (`price_tier`): shopify_price, marketplace_price, name — inlined on the
 * collection query reference. Shape adjustments (`shape_type_adjustment`) are loaded separately and
 * grouped by `price_tier` reference GID (field key `price_tier` on the adjustment).
 */

const PAGE_SIZE = 100;
const TYPE_SHAPE_TYPE_ADJUSTMENT = "shape_type_adjustment";

/** Same tokens as `shape` / Postgres pricing logic (see `shapeShopify.server.js`). */
const VALID_SHAPE_TYPES = new Set([
  "DRIVER",
  "WOOD",
  "HYBRID",
  "PUTTER",
  "ZERO_MALLET",
  "OTHER",
]);

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
          showInCreationDropdown: metafield(namespace: "custom", key: "show_in_creation_dropdown") {
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
                nameField: field(key: "name") { value }
                shopifyPriceField: field(key: "shopify_price") { value }
                marketplacePriceField: field(key: "marketplace_price") { value }
              }
            }
          }
        }
      }
    }
  }
`;

const LIST_SHAPE_TYPE_ADJUSTMENTS = `#graphql
  query ListShapeTypeAdjustments($type: String!, $first: Int!, $after: String) {
    metaobjects(type: $type, first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        handle
        displayName
        shapeTypeField: field(key: "shape_type") {
          value
          jsonValue
        }
        priceTierField: field(key: "price_tier") {
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
        shopifyAdjustmentField: field(key: "shopify_adjustment") { value }
        marketAdjustmentField: field(key: "market_adjustment") { value }
        isBasePriceField: field(key: "is_base_price") { value }
      }
    }
  }
`;

function metafieldString(mf) {
  if (mf == null || mf.value == null) return null;
  const s = String(mf.value).trim();
  return s.length ? s : null;
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

function metaobjectStringField(field) {
  if (field == null || field.value == null) return null;
  const s = String(field.value).trim();
  return s.length ? s : null;
}

function parseMoneyField(field) {
  if (field == null || field.value == null || field.value === "") return 0;
  const n = parseFloat(String(field.value).trim());
  return Number.isFinite(n) ? n : 0;
}

function firstChoiceToken(el) {
  if (el == null) return null;
  if (typeof el === "object" && el !== null) {
    if (el.handle != null) {
      const h = String(el.handle).trim();
      if (h) return h;
    }
    if (el.value != null) {
      const s = String(el.value).trim();
      if (s) return s;
    }
  }
  const s = String(el).trim();
  return s.length ? s : null;
}

/** Choice list on metaobject field (same behavior as `styleShopify` / `shapeShopify`). */
function choiceListSingleValueField(field) {
  if (field == null) return null;

  const jv = field.jsonValue;
  if (jv != null) {
    if (Array.isArray(jv) && jv.length > 0) {
      for (const el of jv) {
        const t = firstChoiceToken(el);
        if (t) return t;
      }
      return null;
    }
    if (typeof jv === "string") {
      const t = jv.trim();
      return t.length ? t : null;
    }
  }

  const v = field.value;
  if (v == null || v === "") return null;

  if (Array.isArray(v)) {
    for (const el of v) {
      const t = firstChoiceToken(el);
      if (t) return t;
    }
    return null;
  }

  if (typeof v === "string") {
    const t = v.trim();
    if (!t) return null;
    if (t.startsWith("[")) {
      try {
        const parsed = JSON.parse(t);
        if (Array.isArray(parsed) && parsed.length > 0) {
          for (const el of parsed) {
            const token = firstChoiceToken(el);
            if (token) return token;
          }
          return null;
        }
      } catch {
        /* fall through */
      }
    }
    return t;
  }

  const s = String(v).trim();
  return s.length ? s : null;
}

function normalizeShapeTypeToken(raw) {
  const s = (raw || "OTHER").toString().trim().toUpperCase().replace(/\s+/g, "_");
  if (VALID_SHAPE_TYPES.has(s)) return s;
  return "OTHER";
}

function mapShapeTypeAdjustmentNode(node) {
  const ref = node.priceTierField?.reference;
  const tierGid = ref && ref.__typename === "Metaobject" ? ref.id : null;
  const shapeRaw = choiceListSingleValueField(node.shapeTypeField);
  return {
    tierGid,
    shapeType: normalizeShapeTypeToken(shapeRaw),
    shapeTypeRaw: shapeRaw,
    shopifyAdjustment: parseMoneyField(node.shopifyAdjustmentField),
    marketAdjustment: parseMoneyField(node.marketAdjustmentField),
    isBasePrice: parseBoolMetafield(node.isBasePriceField),
    metaobject: {
      id: node.id,
      handle: node.handle,
      displayName: node.displayName,
    },
    priceTierRef:
      ref && ref.__typename === "Metaobject"
        ? {
            id: ref.id,
            handle: ref.handle,
            displayName: ref.displayName,
            type: ref.type,
          }
        : null,
  };
}

function groupAdjustmentsByTier(nodes) {
  const map = new Map();
  for (const node of nodes) {
    const row = mapShapeTypeAdjustmentNode(node);
    if (!row.tierGid) continue;
    if (!map.has(row.tierGid)) map.set(row.tierGid, []);
    map.get(row.tierGid).push(row);
  }
  return map;
}

async function fetchAllShapeTypeAdjustmentNodes(admin) {
  const all = [];
  let after = null;
  let hasNextPage = true;
  while (hasNextPage) {
    const response = await admin.graphql(LIST_SHAPE_TYPE_ADJUSTMENTS, {
      variables: {
        type: TYPE_SHAPE_TYPE_ADJUSTMENT,
        first: PAGE_SIZE,
        after,
      },
    });
    const json = await response.json();
    if (json.errors?.length) {
      throw new Error(json.errors.map((e) => e.message).join("; "));
    }
    const conn = json.data?.metaobjects;
    const nodes = conn?.nodes ?? [];
    all.push(...nodes);
    hasNextPage = conn?.pageInfo?.hasNextPage ?? false;
    after = conn?.pageInfo?.endCursor ?? null;
  }
  return all;
}

/**
 * @param {Map<string, object[]>} adjustmentsByTierGid
 */
function mapCollectionNodeToFormCollection(node, adjustmentsByTierGid) {
  if (!node) return null;
  if (!parseBoolMetafield(node.showInCreationDropdown)) return null;

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
          name: metaobjectStringField(ref.nameField) ?? ref.displayName ?? "",
          shopifyPrice: parseMoneyField(ref.shopifyPriceField),
          marketplacePrice: parseMoneyField(ref.marketplacePriceField),
        }
      : null;

  const tierGid = pricingTierMetaobject?.id;
  const rawAdjustments =
    tierGid && adjustmentsByTierGid instanceof Map
      ? adjustmentsByTierGid.get(tierGid) ?? []
      : [];

  const priceTier =
    pricingTierMetaobject != null
      ? {
          value: pricingTierMetaobject.id,
          name: pricingTierMetaobject.name,
          shopifyPrice: pricingTierMetaobject.shopifyPrice,
          marketplacePrice: pricingTierMetaobject.marketplacePrice,
          adjustments: rawAdjustments.map((a) => ({
            shapeType: a.shapeType,
            shopifyAdjustment: a.shopifyAdjustment,
            marketAdjustment: a.marketAdjustment,
            isBasePrice: a.isBasePrice,
            /** `shape_type_adjustment` metaobject + parsed field snapshot */
            shapeTypeAdjustment: {
              id: a.metaobject.id,
              handle: a.metaobject.handle,
              displayName: a.metaobject.displayName,
              shapeTypeRaw: a.shapeTypeRaw,
              priceTier: a.priceTierRef,
              shopifyAdjustment: a.shopifyAdjustment,
              marketAdjustment: a.marketAdjustment,
              isBasePrice: a.isBasePrice,
            },
          })),
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
    priceTier,

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
      show_in_creation_dropdown: node.showInCreationDropdown,
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
 * Product-creation collections (`show_in_creation_dropdown` true only) plus a parallel debug list
 * of the raw metafield payload from Shopify for every collection in the Admin scan.
 *
 * @param {Object} admin - Shopify authenticate.admin() client
 * @returns {Promise<{ collections: object[]; collectionShowInCreationMetafieldDebug: object[] }>}
 */
export async function getProductCollectionsFromShopify(admin) {
  let adjustmentsByTierGid = new Map();
  try {
    const adjustmentNodes = await fetchAllShapeTypeAdjustmentNodes(admin);
    adjustmentsByTierGid = groupAdjustmentsByTier(adjustmentNodes);
  } catch (err) {
    console.error(
      "getProductCollectionsFromShopify: shape_type_adjustment metaobjects failed (tiers still load without adjustments):",
      err
    );
  }

  const out = [];
  /** One row per collection node from the Admin API (before inclusion filter). */
  const collectionShowInCreationMetafieldDebug = [];
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
      const node = edge?.node;
      if (!node) continue;
      collectionShowInCreationMetafieldDebug.push({
        id: node.id,
        handle: node.handle ?? "",
        title: node.title ?? "",
        /** Raw `metafield(namespace: "custom", key: "show_in_creation_dropdown")` from Shopify */
        showInCreationDropdown: node.showInCreationDropdown,
      });
      const mapped = mapCollectionNodeToFormCollection(node, adjustmentsByTierGid);
      if (mapped) out.push(mapped);
    }
    hasNextPage = conn?.pageInfo?.hasNextPage ?? false;
    after = conn?.pageInfo?.endCursor ?? null;
  }

  out.sort((a, b) => a.label.localeCompare(b.label));
  collectionShowInCreationMetafieldDebug.sort((a, b) =>
    (a.title || "").localeCompare(b.title || "")
  );
  return { collections: out, collectionShowInCreationMetafieldDebug };
}
