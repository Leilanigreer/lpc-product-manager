/**
 * Backfill variant metafields `custom.single_shape` / `custom.single_style` from the same
 * variant's `custom.shape` / `custom.style` (metaobject reference or singleton list value).
 *
 * Empty source fields do not clear existing single_* values.
 */

import { isShopifyMetaobjectGid } from "../utils/shopifyGid.js";

const COLLECTION_PRODUCTS_VARIANTS_PAGE = `#graphql
  query ShapeStyleSyncCollectionProducts($id: ID!, $cursor: String) {
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
          variants(first: 100) {
            pageInfo {
              hasNextPage
            }
            nodes {
              id
              title
              sku
              shape: metafield(namespace: "custom", key: "shape") { value }
              style: metafield(namespace: "custom", key: "style") { value }
              singleShape: metafield(namespace: "custom", key: "single_shape") { value }
              singleStyle: metafield(namespace: "custom", key: "single_style") { value }
            }
          }
        }
      }
    }
  }
`;

const PRODUCT_VARIANTS_PAGE = `#graphql
  query ShapeStyleSyncProductVariants($id: ID!, $cursor: String) {
    product(id: $id) {
      id
      title
      handle
      variants(first: 100, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          title
          sku
          shape: metafield(namespace: "custom", key: "shape") { value }
          style: metafield(namespace: "custom", key: "style") { value }
          singleShape: metafield(namespace: "custom", key: "single_shape") { value }
          singleStyle: metafield(namespace: "custom", key: "single_style") { value }
        }
      }
    }
  }
`;

const VARIANT_NODES_QUERY = `#graphql
  query ShapeStyleSyncVariantNodes($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        title
        sku
        product {
          id
          title
          handle
        }
        shape: metafield(namespace: "custom", key: "shape") { value }
        style: metafield(namespace: "custom", key: "style") { value }
        singleShape: metafield(namespace: "custom", key: "single_shape") { value }
        singleStyle: metafield(namespace: "custom", key: "single_style") { value }
      }
    }
  }
`;

const METAFIELDS_SET_MUTATION = `#graphql
  mutation ShapeStyleSyncMetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      userErrors {
        field
        message
      }
    }
  }
`;

const METAFIELDS_SET_INPUT_LIMIT = 25;

/** @param {unknown} raw */
function parseMetafieldGidValue(raw) {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed) return { kind: "empty" };
  if (isShopifyMetaobjectGid(trimmed)) {
    return { kind: "ok", gid: trimmed };
  }
  try {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) return { kind: "empty" };
    if (parsed.length > 1) return { kind: "ambiguous", count: parsed.length };
    if (parsed.length === 1 && isShopifyMetaobjectGid(parsed[0])) {
      return { kind: "ok", gid: parsed[0] };
    }
    return { kind: "empty" };
  } catch {
    return { kind: "empty" };
  }
}

/**
 * @param {string | null | undefined} shapeRaw
 * @param {string | null | undefined} styleRaw
 */
function resolveVariantShapeStyleSources(shapeRaw, styleRaw) {
  const shape = parseMetafieldGidValue(shapeRaw);
  const style = parseMetafieldGidValue(styleRaw);

  if (shape.kind === "ambiguous" || style.kind === "ambiguous") {
    return {
      kind: "ambiguous",
      shapeCount: shape.kind === "ambiguous" ? shape.count : shape.kind === "ok" ? 1 : 0,
      styleCount: style.kind === "ambiguous" ? style.count : style.kind === "ok" ? 1 : 0,
    };
  }

  const shapeGid = shape.kind === "ok" ? shape.gid : null;
  const styleGid = style.kind === "ok" ? style.gid : null;

  if (!shapeGid && !styleGid) {
    return { kind: "no_source" };
  }

  return { kind: "ok", shapeGid, styleGid };
}

/**
 * @param {{ singleShape?: string | null, singleStyle?: string | null }} variant
 * @param {string | null} shapeGid
 * @param {string | null} styleGid
 */
function variantNeedsShapeStyleWrite(variant, shapeGid, styleGid) {
  let writes = 0;
  if (shapeGid && String(variant.singleShape || "").trim() !== shapeGid) writes += 1;
  if (styleGid && String(variant.singleStyle || "").trim() !== styleGid) writes += 1;
  return writes;
}

/** @param {unknown} node */
function mapVariantNode(node) {
  if (!node?.id) return null;
  return {
    id: node.id,
    title: node.title ?? "",
    sku: node.sku ?? "",
    shapeRaw: node.shape?.value ?? null,
    styleRaw: node.style?.value ?? null,
    singleShape: node.singleShape?.value ?? null,
    singleStyle: node.singleStyle?.value ?? null,
  };
}

/**
 * @param {(query: string, options?: { variables?: object }) => Promise<Response>} graphql
 * @param {{ id: string, title?: string, handle?: string }} product
 */
async function fetchAllVariantsForProduct(graphql, product) {
  const variants = [];
  let cursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await graphql(PRODUCT_VARIANTS_PAGE, {
      variables: { id: product.id, cursor },
    });
    const json = await response.json();
    if (json.errors?.length) {
      throw new Error(json.errors.map((e) => e.message).join("; "));
    }
    const loaded = json.data?.product;
    if (!loaded?.id) break;

    const conn = loaded.variants;
    for (const node of conn?.nodes ?? []) {
      const mapped = mapVariantNode(node);
      if (mapped) variants.push(mapped);
    }

    hasNextPage = conn?.pageInfo?.hasNextPage ?? false;
    cursor = conn?.pageInfo?.endCursor ?? null;
  }

  return variants;
}

/**
 * @param {ReturnType<typeof mapVariantNode>} variant
 * @param {{ id: string, title: string, handle: string }} product
 */
function classifyVariantRow(variant, product) {
  const resolved = resolveVariantShapeStyleSources(variant.shapeRaw, variant.styleRaw);

  const base = {
    variantId: variant.id,
    variantTitle: variant.title,
    variantSku: variant.sku,
    productId: product.id,
    productTitle: product.title,
    productHandle: product.handle,
    currentSingleShape: variant.singleShape,
    currentSingleStyle: variant.singleStyle,
  };

  if (resolved.kind === "ambiguous") {
    return {
      ...base,
      kind: "ambiguous",
      shapeCount: resolved.shapeCount,
      styleCount: resolved.styleCount,
      detail: "Variant shape and/or style has more than one GID — skipped.",
    };
  }

  if (resolved.kind === "no_source") {
    return {
      ...base,
      kind: "no_source",
      detail: "No custom.shape or custom.style on this variant.",
    };
  }

  const writes = variantNeedsShapeStyleWrite(
    variant,
    resolved.shapeGid,
    resolved.styleGid
  );
  if (writes === 0) return null;

  return {
    ...base,
    kind: "needs_sync",
    shapeGid: resolved.shapeGid,
    styleGid: resolved.styleGid,
    metafieldsToWrite: writes,
    detail: [
      resolved.shapeGid ? `single_shape ← shape (${resolved.shapeGid})` : null,
      resolved.styleGid ? `single_style ← style (${resolved.styleGid})` : null,
    ]
      .filter(Boolean)
      .join("; "),
  };
}

function chunkMetafields(metafields) {
  const batches = [];
  for (let i = 0; i < metafields.length; i += METAFIELDS_SET_INPUT_LIMIT) {
    batches.push(metafields.slice(i, i + METAFIELDS_SET_INPUT_LIMIT));
  }
  return batches;
}

/**
 * @param {(query: string, options?: { variables?: object }) => Promise<Response>} graphql
 * @param {string[]} collectionIds
 */
export async function scanShapeStyleVariantMetafieldDrift(graphql, collectionIds) {
  const ids = [...new Set((collectionIds ?? []).filter(Boolean))];
  if (ids.length === 0) {
    return { rows: [], totalProducts: 0, totalVariants: 0 };
  }

  /** @type {Array<Record<string, unknown>>} */
  const rows = [];
  const seenProductIds = new Set();
  let totalProducts = 0;
  let totalVariants = 0;

  for (const collectionId of ids) {
    let cursor = null;
    do {
      const response = await graphql(COLLECTION_PRODUCTS_VARIANTS_PAGE, {
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
        if (seenProductIds.has(node.id)) continue;
        seenProductIds.add(node.id);

        const product = {
          id: node.id,
          title: node.title ?? "",
          handle: node.handle ?? "",
        };

        let variants = (node.variants?.nodes ?? [])
          .map(mapVariantNode)
          .filter(Boolean);

        if (node.variants?.pageInfo?.hasNextPage) {
          variants = await fetchAllVariantsForProduct(graphql, product);
        }

        totalVariants += variants.length;

        for (const variant of variants) {
          const row = classifyVariantRow(variant, product);
          if (row) rows.push(row);
        }
      }

      cursor = conn?.pageInfo?.hasNextPage ? conn.pageInfo.endCursor : null;
    } while (cursor);
  }

  return { rows, totalProducts, totalVariants };
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

/**
 * @param {(query: string, options?: { variables?: object }) => Promise<Response>} graphql
 * @param {string[]} variantGids
 */
export async function syncShapeStyleVariantMetafields(graphql, variantGids) {
  const unique = [...new Set(variantGids.filter(Boolean))];
  const updated = [];
  const skipped = [];
  const errors = [];

  for (const idBatch of chunk(unique, 50)) {
    const response = await graphql(VARIANT_NODES_QUERY, {
      variables: { ids: idBatch },
    });
    const json = await response.json();
    if (json.errors?.length) {
      errors.push(json.errors.map((e) => e.message).join("; "));
      continue;
    }

    const metafields = [];

    for (const node of json.data?.nodes ?? []) {
      if (!node?.id) continue;
      const variant = mapVariantNode(node);
      if (!variant) continue;

      const resolved = resolveVariantShapeStyleSources(
        variant.shapeRaw,
        variant.styleRaw
      );

      if (resolved.kind === "ambiguous") {
        skipped.push({ variantId: node.id, reason: "ambiguous_source" });
        continue;
      }
      if (resolved.kind === "no_source") {
        skipped.push({ variantId: node.id, reason: "no_source" });
        continue;
      }

      const { shapeGid, styleGid } = resolved;
      if (shapeGid && String(variant.singleShape || "").trim() !== shapeGid) {
        metafields.push({
          ownerId: node.id,
          namespace: "custom",
          key: "single_shape",
          type: "metaobject_reference",
          value: shapeGid,
        });
      }
      if (styleGid && String(variant.singleStyle || "").trim() !== styleGid) {
        metafields.push({
          ownerId: node.id,
          namespace: "custom",
          key: "single_style",
          type: "metaobject_reference",
          value: styleGid,
        });
      }

      if (metafields.filter((m) => m.ownerId === node.id).length === 0) {
        skipped.push({ variantId: node.id, reason: "already_aligned" });
      }
    }

    if (metafields.length === 0) continue;

    try {
      for (const batch of chunkMetafields(metafields)) {
        const setRes = await graphql(METAFIELDS_SET_MUTATION, {
          variables: { metafields: batch },
        });
        const setJson = await setRes.json();
        if (setJson.errors?.length) {
          throw new Error(setJson.errors.map((e) => e.message).join("; "));
        }
        const userErrors = setJson.data?.metafieldsSet?.userErrors ?? [];
        if (userErrors.length) {
          throw new Error(
            userErrors.map((e) => e.message).filter(Boolean).join("; ")
          );
        }
      }

      const touched = new Set(metafields.map((m) => m.ownerId));
      for (const variantId of touched) {
        updated.push({
          variantId,
          metafieldsWritten: metafields.filter((m) => m.ownerId === variantId).length,
        });
      }
    } catch (e) {
      errors.push(e?.message ?? String(e));
    }
  }

  return { updated, skipped, errors };
}
