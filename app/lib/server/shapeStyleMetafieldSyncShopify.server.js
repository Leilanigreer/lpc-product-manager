/**
 * Backfill variant metafields `custom.single_shape` / `custom.single_style` from product-level
 * `custom.shape` / `custom.style` list metafields (singleton GIDs only).
 *
 * Products where either list has more than one entry are skipped (ambiguous). Empty product lists
 * do not clear existing variant values — only singletons from the product are written.
 */

import { isShopifyMetaobjectGid } from "../utils/shopifyGid.js";

const COLLECTION_PRODUCTS_SHAPE_STYLE_PAGE = `#graphql
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
          shapeList: metafield(namespace: "custom", key: "shape") { value }
          styleList: metafield(namespace: "custom", key: "style") { value }
          variants(first: 250) {
            pageInfo {
              hasNextPage
            }
            nodes {
              id
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
      shapeList: metafield(namespace: "custom", key: "shape") { value }
      styleList: metafield(namespace: "custom", key: "style") { value }
      variants(first: 100, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          singleShape: metafield(namespace: "custom", key: "single_shape") { value }
          singleStyle: metafield(namespace: "custom", key: "single_style") { value }
        }
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
function parseJsonListMetafieldValue(raw) {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * @param {string | null | undefined} shapeRaw
 * @param {string | null | undefined} styleRaw
 * @returns {{ kind: 'ambiguous' } | { kind: 'no_source' } | { shapeGid: string | null, styleGid: string | null }}
 */
function resolveProductShapeStyleSingletons(shapeRaw, styleRaw) {
  const shapes = parseJsonListMetafieldValue(shapeRaw);
  const styles = parseJsonListMetafieldValue(styleRaw);

  if (shapes.length > 1 || styles.length > 1) {
    return { kind: "ambiguous" };
  }

  const shapeGid =
    shapes.length === 1 && isShopifyMetaobjectGid(shapes[0]) ? shapes[0] : null;
  const styleGid =
    styles.length === 1 && isShopifyMetaobjectGid(styles[0]) ? styles[0] : null;

  if (!shapeGid && !styleGid) {
    return { kind: "no_source" };
  }

  return { kind: "ok", shapeGid, styleGid };
}

/**
 * @param {Array<{ id: string, singleShape?: string | null, singleStyle?: string | null }>} variants
 * @param {string | null} shapeGid
 * @param {string | null} styleGid
 */
function countVariantsNeedingShapeStyleWrite(variants, shapeGid, styleGid) {
  let n = 0;
  for (const v of variants) {
    if (!v?.id) continue;
    if (shapeGid && String(v.singleShape || "").trim() !== shapeGid) n += 1;
    if (styleGid && String(v.singleStyle || "").trim() !== styleGid) n += 1;
  }
  return n;
}

/**
 * @param {(query: string, options?: { variables?: object }) => Promise<Response>} graphql
 * @param {string} productGid
 * @returns {Promise<{ shapeListValue: string | null, styleListValue: string | null, variants: Array<{ id: string, singleShape: string | null, singleStyle: string | null }> } | null>}
 */
async function fetchProductWithAllVariantMetafields(graphql, productGid) {
  const id = (productGid ?? "").trim();
  if (!id) return null;

  let shapeListValue = null;
  let styleListValue = null;
  const variants = [];
  let cursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await graphql(PRODUCT_VARIANTS_PAGE, {
      variables: { id, cursor },
    });
    const json = await response.json();
    if (json.errors?.length) {
      throw new Error(json.errors.map((e) => e.message).join("; "));
    }
    const product = json.data?.product;
    if (!product?.id) return null;

    if (cursor == null) {
      shapeListValue = product.shapeList?.value ?? null;
      styleListValue = product.styleList?.value ?? null;
    }

    const conn = product.variants;
    for (const node of conn?.nodes ?? []) {
      if (!node?.id) continue;
      variants.push({
        id: node.id,
        singleShape: node.singleShape?.value ?? null,
        singleStyle: node.singleStyle?.value ?? null,
      });
    }

    hasNextPage = conn?.pageInfo?.hasNextPage ?? false;
    cursor = conn?.pageInfo?.endCursor ?? null;
  }

  return { shapeListValue, styleListValue, variants };
}

function chunkMetafields(metafields) {
  const batches = [];
  for (let i = 0; i < metafields.length; i += METAFIELDS_SET_INPUT_LIMIT) {
    batches.push(metafields.slice(i, i + METAFIELDS_SET_INPUT_LIMIT));
  }
  return batches;
}

/**
 * Walks products in creation collections (same scope as Sync SKUs). Rows: ambiguous, no_source,
 * needs_sync (selectable), or already_ok (omitted from list to reduce noise).
 *
 * @param {(query: string, options?: { variables?: object }) => Promise<Response>} graphql
 * @param {string[]} collectionIds
 */
export async function scanShapeStyleVariantMetafieldDrift(graphql, collectionIds) {
  const ids = [...new Set((collectionIds ?? []).filter(Boolean))];
  if (ids.length === 0) {
    return { rows: [], totalProducts: 0 };
  }

  /** @type {Array<{ productId: string, title: string, handle: string, kind: string, detail?: string, shapeCount?: number, styleCount?: number, variantsToTouch?: number }>} */
  const rows = [];
  const seenProductIds = new Set();
  let totalProducts = 0;

  for (const collectionId of ids) {
    let cursor = null;
    do {
      const response = await graphql(COLLECTION_PRODUCTS_SHAPE_STYLE_PAGE, {
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

        const shapeRaw = node.shapeList?.value;
        const styleRaw = node.styleList?.value;
        const shapes = parseJsonListMetafieldValue(shapeRaw);
        const styles = parseJsonListMetafieldValue(styleRaw);

        if (shapes.length > 1 || styles.length > 1) {
          rows.push({
            productId: node.id,
            title: node.title ?? "",
            handle: node.handle ?? "",
            kind: "ambiguous",
            shapeCount: shapes.length,
            styleCount: styles.length,
            detail:
              "Product has more than one shape and/or style in list metafields — skipped. Fix manually.",
          });
          continue;
        }

        const resolved = resolveProductShapeStyleSingletons(shapeRaw, styleRaw);
        if (resolved.kind === "no_source") {
          rows.push({
            productId: node.id,
            title: node.title ?? "",
            handle: node.handle ?? "",
            kind: "no_source",
            detail: "No singleton shape or style GID on the product lists.",
          });
          continue;
        }

        let variants = (node.variants?.nodes ?? [])
          .filter((v) => v?.id)
          .map((v) => ({
            id: v.id,
            singleShape: v.singleShape?.value ?? null,
            singleStyle: v.singleStyle?.value ?? null,
          }));

        if (node.variants?.pageInfo?.hasNextPage) {
          const full = await fetchProductWithAllVariantMetafields(graphql, node.id);
          if (full) variants = full.variants;
        }

        const { shapeGid, styleGid } = resolved;
        const variantsToTouch = countVariantsNeedingShapeStyleWrite(
          variants,
          shapeGid,
          styleGid
        );

        if (variantsToTouch === 0) {
          continue;
        }

        rows.push({
          productId: node.id,
          title: node.title ?? "",
          handle: node.handle ?? "",
          kind: "needs_sync",
          detail: [
            shapeGid ? `single_shape → ${shapeGid}` : null,
            styleGid ? `single_style → ${styleGid}` : null,
          ]
            .filter(Boolean)
            .join("; "),
          variantsToTouch,
        });
      }

      cursor = conn?.pageInfo?.hasNextPage ? conn.pageInfo.endCursor : null;
    } while (cursor);
  }

  return { rows, totalProducts };
}

/**
 * @param {(query: string, options?: { variables?: object }) => Promise<Response>} graphql
 * @param {string[]} productGids
 */
export async function syncShapeStyleVariantMetafields(graphql, productGids) {
  const unique = [...new Set(productGids.filter(Boolean))];
  const updated = [];
  const skipped = [];
  const errors = [];

  for (const productId of unique) {
    let payload;
    try {
      payload = await fetchProductWithAllVariantMetafields(graphql, productId);
    } catch (e) {
      errors.push(`${productId}: ${e?.message ?? String(e)}`);
      continue;
    }
    if (!payload) {
      skipped.push({ productId, reason: "product_not_found" });
      continue;
    }

    const resolved = resolveProductShapeStyleSingletons(
      payload.shapeListValue,
      payload.styleListValue
    );

    if (resolved.kind === "ambiguous") {
      skipped.push({ productId, reason: "ambiguous_lists" });
      continue;
    }
    if (resolved.kind === "no_source") {
      skipped.push({ productId, reason: "no_source" });
      continue;
    }

    const { shapeGid, styleGid } = resolved;
    const metafields = [];

    for (const v of payload.variants) {
      if (!v?.id) continue;
      if (shapeGid && String(v.singleShape || "").trim() !== shapeGid) {
        metafields.push({
          ownerId: v.id,
          namespace: "custom",
          key: "single_shape",
          type: "metaobject_reference",
          value: shapeGid,
        });
      }
      if (styleGid && String(v.singleStyle || "").trim() !== styleGid) {
        metafields.push({
          ownerId: v.id,
          namespace: "custom",
          key: "single_style",
          type: "metaobject_reference",
          value: styleGid,
        });
      }
    }

    if (metafields.length === 0) {
      skipped.push({ productId, reason: "already_aligned" });
      continue;
    }

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
      updated.push({
        productId,
        metafieldsWritten: metafields.length,
      });
    } catch (e) {
      errors.push(`${productId}: ${e?.message ?? String(e)}`);
    }
  }

  return { updated, skipped, errors };
}
