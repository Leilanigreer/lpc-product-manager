/**
 * Scan and repair product `custom.base_sku` against a **derived** versioned base from the first
 * variant SKU (by position): drop the last `-` segment (shape / style suffix from `formatSKU`).
 *
 * Example: `Classic-BRG-HP-V2-Driver` → `Classic-BRG-HP-V2`
 *
 * Scan scope: products belonging to any collection whose `custom.show_in_creation_dropdown`
 * metafield is true (same rule as create-product). Assumes the variant SKU includes a trailing
 * segment after the base; unusual SKUs with no hyphen may be skipped.
 */

/** Shopify boolean metafields often store "true" / "false" strings. */
function parseBoolMetafield(mf) {
  if (!mf || mf.value == null) return false;
  const v = mf.value;
  if (typeof v === "boolean") return v;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "1";
}

const CREATION_COLLECTIONS_QUERY = `#graphql
  query SkuSyncCreationCollections($first: Int!, $after: String) {
    collections(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          showInCreationDropdown: metafield(
            namespace: "custom"
            key: "show_in_creation_dropdown"
          ) {
            value
          }
        }
      }
    }
  }
`;

const COLLECTION_CREATION_FLAG_QUERY = `#graphql
  query SkuSyncCollectionCreationFlag($id: ID!) {
    collection(id: $id) {
      id
      showInCreationDropdown: metafield(
        namespace: "custom"
        key: "show_in_creation_dropdown"
      ) {
        value
      }
    }
  }
`;

const COLLECTION_PRODUCTS_PAGE_QUERY = `#graphql
  query SkuSyncCollectionProductsPage($id: ID!, $cursor: String) {
    collection(id: $id) {
      id
      products(first: 50, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          title
          handle
          metafield(namespace: "custom", key: "base_sku") {
            value
          }
          variants(first: 1, sortKey: POSITION) {
            nodes {
              sku
            }
          }
        }
      }
    }
  }
`;

const NODES_QUERY = `#graphql
  query SkuSyncProductNodes($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        variants(first: 1, sortKey: POSITION) {
          nodes {
            sku
          }
        }
      }
    }
  }
`;

const METAFIELDS_SET_MUTATION = `#graphql
  mutation SkuSyncMetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      userErrors {
        field
        message
      }
    }
  }
`;

/**
 * Versioned base SKU: full variant SKU minus the last `-{shape}` (or trailing) segment.
 * @param {string} variantSku
 * @returns {string} Empty if the SKU has no `-` and cannot be stripped.
 */
export function variantSkuToBaseSku(variantSku) {
  const s = (variantSku ?? "").trim();
  if (!s) return "";
  const i = s.lastIndexOf("-");
  if (i <= 0) return "";
  return s.slice(0, i);
}

/**
 * @param {string} metafieldValue
 * @param {string} firstVariantSku
 * @returns {{ kind: 'ok' } | { kind: 'missing' | 'mismatch' | 'no_variant_sku' | 'cannot_derive_base', currentMetafield: string | null, derivedBaseSku: string | null, firstVariantSkuRaw: string | null }}
 */
export function classifyBaseSkuDrift(metafieldValue, firstVariantSku) {
  const raw = (firstVariantSku ?? "").trim();
  const mf = (metafieldValue ?? "").trim();

  if (!raw) {
    return {
      kind: "no_variant_sku",
      currentMetafield: mf || null,
      derivedBaseSku: null,
      firstVariantSkuRaw: null,
    };
  }

  const derived = variantSkuToBaseSku(raw);
  if (!derived) {
    return {
      kind: "cannot_derive_base",
      currentMetafield: mf || null,
      derivedBaseSku: null,
      firstVariantSkuRaw: raw,
    };
  }

  if (!mf) {
    return {
      kind: "missing",
      currentMetafield: null,
      derivedBaseSku: derived,
      firstVariantSkuRaw: raw,
    };
  }
  if (mf !== derived) {
    return {
      kind: "mismatch",
      currentMetafield: mf,
      derivedBaseSku: derived,
      firstVariantSkuRaw: raw,
    };
  }
  return { kind: "ok" };
}

const COLLECTIONS_PAGE_SIZE = 100;

/**
 * Collections where `custom.show_in_creation_dropdown` is true (same rule as create-product), for
 * Sync SKUs scope UI and server validation.
 * @param {(query: string, options?: { variables?: object }) => Promise<Response>} graphql
 * @returns {Promise<Array<{ id: string, title: string }>>}
 */
export async function fetchCreationCollectionsForSkuSync(graphql) {
  const rows = [];
  let after = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await graphql(CREATION_COLLECTIONS_QUERY, {
      variables: { first: COLLECTIONS_PAGE_SIZE, after },
    });
    const json = await response.json();
    if (json.errors?.length) {
      throw new Error(json.errors.map((e) => e.message).join("; "));
    }
    const conn = json.data?.collections;
    for (const edge of conn?.edges ?? []) {
      const node = edge?.node;
      if (!node?.id) continue;
      if (!parseBoolMetafield(node.showInCreationDropdown)) continue;
      rows.push({
        id: node.id,
        title: (node.title ?? "").trim() || "(Untitled)",
      });
    }
    hasNextPage = conn?.pageInfo?.hasNextPage ?? false;
    after = conn?.pageInfo?.endCursor ?? null;
  }

  rows.sort((a, b) => a.title.localeCompare(b.title));
  return rows;
}

/**
 * True if the collection exists and `custom.show_in_creation_dropdown` is true. Used to validate
 * scan scope without listing every collection in the store.
 * @param {(query: string, options?: { variables?: object }) => Promise<Response>} graphql
 * @param {string} collectionGid
 */
export async function collectionIsInCreationDropdown(graphql, collectionGid) {
  const id = (collectionGid ?? "").trim();
  if (!id) return false;
  const response = await graphql(COLLECTION_CREATION_FLAG_QUERY, {
    variables: { id },
  });
  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  const col = json.data?.collection;
  if (!col) return false;
  return parseBoolMetafield(col.showInCreationDropdown);
}

function processProductNodeForDrift(node, discrepancies, seenProductIds) {
  if (!node?.id || seenProductIds.has(node.id)) return;
  seenProductIds.add(node.id);

  const mfValue = node.metafield?.value;
  const firstSku = node.variants?.nodes?.[0]?.sku;
  const c = classifyBaseSkuDrift(mfValue, firstSku);
  if (c.kind === "ok") return;

  discrepancies.push({
    productId: node.id,
    title: node.title ?? "",
    handle: node.handle ?? "",
    kind: c.kind,
    currentMetafield: c.currentMetafield,
    derivedBaseSku: c.derivedBaseSku,
    firstVariantSkuRaw: c.firstVariantSkuRaw,
  });
}

/**
 * Walks products in the given creation-collection id list (paginated) and returns rows that need
 * attention. Products in multiple collections are counted once.
 * @param {(query: string, options?: { variables?: object }) => Promise<Response>} graphql
 * @param {string[]} collectionIds — Shopify Collection GIDs (e.g. from {@link fetchCreationCollectionsForSkuSync})
 */
export async function scanBaseSkuDrift(graphql, collectionIds) {
  const ids = [...new Set((collectionIds ?? []).filter(Boolean))];
  if (ids.length === 0) {
    return { discrepancies: [], totalProducts: 0 };
  }

  const discrepancies = [];
  const seenProductIds = new Set();
  let totalProducts = 0;

  for (const collectionId of ids) {
    let cursor = null;
    do {
      const response = await graphql(COLLECTION_PRODUCTS_PAGE_QUERY, {
        variables: { id: collectionId, cursor },
      });
      const json = await response.json();
      if (json.errors?.length) {
        throw new Error(json.errors.map((e) => e.message).join("; "));
      }
      const collection = json.data?.collection;
      if (!collection) break;

      const conn = collection.products;
      for (const node of conn?.nodes ?? []) {
        if (!node?.id) continue;
        if (!seenProductIds.has(node.id)) totalProducts++;
        processProductNodeForDrift(node, discrepancies, seenProductIds);
      }

      cursor = conn?.pageInfo?.hasNextPage ? conn.pageInfo.endCursor : null;
    } while (cursor);
  }

  return { discrepancies, totalProducts };
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

/**
 * Sets `custom.base_sku` (single line text) to the derived versioned base (variant SKU minus
 * last `-` segment) for each product id.
 * @param {(query: string, options?: { variables?: object }) => Promise<Response>} graphql
 * @param {string[]} productGids
 */
export async function syncBaseSkuMetafields(graphql, productGids) {
  const unique = [...new Set(productGids.filter(Boolean))];
  const updated = [];
  const skipped = [];
  const errors = [];

  for (const idBatch of chunk(unique, 50)) {
    const response = await graphql(NODES_QUERY, { variables: { ids: idBatch } });
    const json = await response.json();
    if (json.errors?.length) {
      errors.push(json.errors.map((e) => e.message).join("; "));
      continue;
    }

    const metafields = [];
    const nodes = json.data?.nodes ?? [];

    for (const node of nodes) {
      if (!node?.id) continue;
      const sku = (node.variants?.nodes?.[0]?.sku ?? "").trim();
      const base = variantSkuToBaseSku(sku);
      if (!sku) {
        skipped.push({ productId: node.id, reason: "no_variant_sku" });
        continue;
      }
      if (!base) {
        skipped.push({ productId: node.id, reason: "cannot_derive_base" });
        continue;
      }
      metafields.push({
        ownerId: node.id,
        namespace: "custom",
        key: "base_sku",
        type: "single_line_text_field",
        value: base,
      });
    }

    if (metafields.length === 0) continue;

    const setRes = await graphql(METAFIELDS_SET_MUTATION, {
      variables: { metafields },
    });
    const setJson = await setRes.json();
    if (setJson.errors?.length) {
      errors.push(setJson.errors.map((e) => e.message).join("; "));
      continue;
    }
    const userErrors = setJson.data?.metafieldsSet?.userErrors ?? [];
    if (userErrors.length) {
      errors.push(
        ...userErrors.map((e) => e.message).filter(Boolean)
      );
      continue;
    }

    for (const mf of metafields) {
      updated.push({ productId: mf.ownerId, sku: mf.value });
    }
  }

  return { updated, skipped, errors };
}
