/**
 * Scan and repair product `custom.base_sku` against a **derived** versioned base from the first
 * variant SKU (by position): drop the last `-` segment (shape / style suffix from `formatSKU`).
 *
 * Example: `Classic-BRG-HP-V2-Driver` → `Classic-BRG-HP-V2`
 *
 * Assumes the variant SKU always includes a trailing segment after the base; unusual SKUs with
 * no hyphen may be skipped.
 */

/** Shopify Admin `products` search — only this vendor’s catalog. */
export const SKU_SYNC_PRODUCTS_SEARCH_QUERY = 'vendor:"Little Prince Customs"';

const PRODUCTS_PAGE_QUERY = `#graphql
  query SkuSyncProductsPage($cursor: String, $query: String) {
    products(first: 50, after: $cursor, query: $query) {
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

/**
 * Walks all products (paginated) and returns rows that need attention.
 * @param {(query: string, options?: { variables?: object }) => Promise<Response>} graphql
 */
export async function scanBaseSkuDrift(graphql) {
  const discrepancies = [];
  let cursor = null;
  let totalProducts = 0;

  do {
    const response = await graphql(PRODUCTS_PAGE_QUERY, {
      variables: { cursor, query: SKU_SYNC_PRODUCTS_SEARCH_QUERY },
    });
    const json = await response.json();
    if (json.errors?.length) {
      throw new Error(json.errors.map((e) => e.message).join("; "));
    }
    const conn = json.data?.products;
    if (!conn) break;

    for (const node of conn.nodes ?? []) {
      totalProducts++;
      const mfValue = node.metafield?.value;
      const firstSku = node.variants?.nodes?.[0]?.sku;
      const c = classifyBaseSkuDrift(mfValue, firstSku);
      if (c.kind === "ok") continue;

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

    cursor = conn.pageInfo?.hasNextPage ? conn.pageInfo.endCursor : null;
  } while (cursor);

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
