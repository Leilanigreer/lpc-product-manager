/**
 * Postgres archive vs Shopify thread-number audit.
 *
 * Postgres is the row source (drop-tables readiness). Shopify is a lookup via
 * custom.old_skus. Extra Shopify numbers are expected and do not fail a row;
 * a row matches when every Postgres number appears on at least one matching
 * Shopify product.
 */

import prisma from "../../db.server.js";
import { parseOldSkusMetafieldValue } from "../utils/updatePreviewUtils.js";
import { isShopifyMetaobjectGid } from "../utils/shopifyGid.js";
import { getStitchingThreadColorDataFromShopify } from "./stitchingThreadShopify.server.js";
import { getEmbroideryThreadColorDataFromShopify } from "./embroideryThreadShopify.server.js";

const PRODUCT_PAGE_SIZE = 50;

const ACTIVE_PRODUCTS_QUERY = `#graphql
  query CompareThreadActiveProducts($first: Int!, $after: String) {
    products(first: $first, after: $after, query: "status:active") {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        handle
        oldSkus: metafield(namespace: "custom", key: "old_skus") {
          value
        }
        amannThreadsUsed: metafield(namespace: "custom", key: "amann_threads_used") {
          value
        }
        isacordThreadsUsed: metafield(namespace: "custom", key: "isacord_threads_used") {
          value
        }
      }
    }
  }
`;

/** Strip one trailing hyphen segment (`foo-BLK-DR` → `foo-BLK`). */
export function stripTrailingSkuSegment(sku) {
  const value = String(sku ?? "").trim();
  if (!value) return "";
  const idx = value.lastIndexOf("-");
  if (idx <= 0) return value;
  return value.slice(0, idx);
}

/**
 * @param {Array<{ sku?: unknown, number?: unknown }>} rows
 * @returns {Array<{ sku: string, number: string }>}
 */
export function uniqueSkuNumberPairs(rows) {
  const seen = new Set();
  const out = [];
  for (const row of rows || []) {
    const sku = String(row?.sku ?? "").trim();
    const number = String(row?.number ?? "").trim();
    if (!sku || !number) continue;
    const key = `${sku}\0${number}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ sku, number });
  }
  return out;
}

/**
 * @param {Array<{ sku: string, number: string }>} pairs
 * @returns {Map<string, string[]>}
 */
export function groupNumbersBySku(pairs) {
  const map = new Map();
  for (const { sku, number } of pairs || []) {
    if (!map.has(sku)) map.set(sku, []);
    const list = map.get(sku);
    if (!list.includes(number)) list.push(number);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.localeCompare(b));
  }
  return map;
}

/**
 * Postgres numbers that are not present on Shopify (one-way subset).
 * Extra Shopify numbers are ignored.
 * @param {string[]} postgresNumbers
 * @param {string[]} shopifyNumbers
 * @returns {string[]}
 */
export function numbersMissingFromShopify(postgresNumbers, shopifyNumbers) {
  const shop = new Set(
    (shopifyNumbers || []).map((n) => String(n).trim()).filter(Boolean)
  );
  return (postgresNumbers || [])
    .map((n) => String(n).trim())
    .filter((n) => n && !shop.has(n));
}

function uniqueSortedNumbers(values) {
  const seen = new Set();
  const out = [];
  for (const raw of values || []) {
    const n = String(raw ?? "").trim();
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  out.sort((a, b) => a.localeCompare(b));
  return out;
}

function parseJsonGidList(raw) {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((gid) => isShopifyMetaobjectGid(gid));
  } catch {
    return [];
  }
}

function flattenGidNumberMap(threadColors, unlinked, childKey) {
  const map = new Map();
  for (const thread of threadColors || []) {
    for (const entry of thread?.[childKey] || []) {
      const gid = entry?.value;
      const label = String(entry?.label ?? "").trim();
      if (isShopifyMetaobjectGid(gid) && label && !label.startsWith("gid://")) {
        map.set(gid, label);
      }
    }
  }
  for (const entry of unlinked || []) {
    const gid = entry?.value;
    const label = String(entry?.label ?? "").trim();
    if (isShopifyMetaobjectGid(gid) && label && !label.startsWith("gid://")) {
      map.set(gid, label);
    }
  }
  return map;
}

function numbersFromThreadMetafield(mf, gidToNumber) {
  const fromRefs = [];
  for (const node of mf?.references?.nodes ?? []) {
    const labeled = String(node?.number?.value ?? "").trim();
    if (labeled) {
      fromRefs.push(labeled);
      continue;
    }
    const gid = node?.id;
    if (gid && gidToNumber.has(gid)) fromRefs.push(gidToNumber.get(gid));
  }
  if (fromRefs.length > 0) return uniqueSortedNumbers(fromRefs);

  const fromGids = [];
  for (const gid of parseJsonGidList(mf?.value)) {
    if (gidToNumber.has(gid)) fromGids.push(gidToNumber.get(gid));
  }
  return uniqueSortedNumbers(fromGids);
}

function summarizeRows(rows) {
  const counts = { total: rows.length, match: 0, mismatch: 0, missing: 0 };
  for (const row of rows) {
    if (row.status === "match") counts.match += 1;
    else if (row.status === "mismatch") counts.mismatch += 1;
    else if (row.status === "missing") counts.missing += 1;
  }
  return counts;
}

/**
 * @typedef {{ id: string, title: string, handle: string, numbers: string[] }} ShopifyLookupProduct
 *
 * @param {Map<string, string[]>} postgresBySku
 * @param {Map<string, ShopifyLookupProduct[]>} shopifyBySku
 * @returns {Array<{
 *   sku: string,
 *   status: "match" | "mismatch" | "missing",
 *   postgresNumbers: string[],
 *   shopifyNumbers: string[],
 *   missingNumbers: string[],
 *   productId: string | null,
 *   productTitle: string | null,
 *   productHandle: string | null,
 *   products: ShopifyLookupProduct[],
 * }>}
 */
export function comparePostgresToShopify(postgresBySku, shopifyBySku) {
  const rows = [];
  const skus = [...(postgresBySku || new Map()).keys()];
  skus.sort((a, b) => a.localeCompare(b));

  for (const sku of skus) {
    const postgresNumbers = uniqueSortedNumbers(postgresBySku.get(sku) || []);
    const products = shopifyBySku.get(sku) || [];

    if (products.length === 0) {
      rows.push({
        sku,
        status: "missing",
        postgresNumbers,
        shopifyNumbers: [],
        missingNumbers: [...postgresNumbers],
        productId: null,
        productTitle: null,
        productHandle: null,
        products: [],
      });
      continue;
    }

    let best = null;
    let matchProduct = null;
    for (const product of products) {
      const missing = numbersMissingFromShopify(postgresNumbers, product.numbers);
      if (!best || missing.length < best.missing.length) {
        best = { product, missing };
      }
      if (!matchProduct && missing.length === 0) {
        matchProduct = product;
      }
    }

    const matched = Boolean(matchProduct);
    const display = matched ? matchProduct : best.product;
    rows.push({
      sku,
      status: matched ? "match" : "mismatch",
      postgresNumbers,
      shopifyNumbers: uniqueSortedNumbers(display?.numbers || []),
      missingNumbers: matched ? [] : best.missing,
      productId: display?.id ?? null,
      productTitle: display?.title ?? null,
      productHandle: display?.handle ?? null,
      products,
    });
  }

  return rows;
}

function projectShopifyIndex(productsByOldSku, numberKey) {
  const out = new Map();
  for (const [sku, products] of productsByOldSku) {
    out.set(
      sku,
      products.map((p) => ({
        id: p.id,
        title: p.title,
        handle: p.handle,
        numbers: p[numberKey] || [],
      }))
    );
  }
  return out;
}

async function graphqlData(admin, query, variables) {
  const response = await admin.graphql(query, { variables });
  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  return json.data;
}

async function loadPostgresPairs() {
  const [stitchingRows, variantRows] = await Promise.all([
    prisma.productStitching.findMany({
      select: {
        set: { select: { baseSKU: true } },
        amann: { select: { number: true } },
      },
    }),
    prisma.productVariantDataLPC.findMany({
      where: { isacordId: { not: null } },
      select: {
        SKU: true,
        isacord: { select: { number: true } },
      },
    }),
  ]);

  const amannPairs = uniqueSkuNumberPairs(
    stitchingRows.map((row) => ({
      sku: row.set?.baseSKU,
      number: row.amann?.number,
    }))
  );

  const isacordPairs = uniqueSkuNumberPairs(
    variantRows.map((row) => ({
      sku: stripTrailingSkuSegment(row.SKU),
      number: row.isacord?.number,
    }))
  );

  return {
    amannBySku: groupNumbersBySku(amannPairs),
    isacordBySku: groupNumbersBySku(isacordPairs),
  };
}

async function loadGidNumberMaps(admin) {
  const [stitching, embroidery] = await Promise.all([
    getStitchingThreadColorDataFromShopify(admin),
    getEmbroideryThreadColorDataFromShopify(admin),
  ]);

  return {
    amannGidToNumber: flattenGidNumberMap(
      stitching.stitchingThreadColors,
      stitching.unlinkedAmannNumbers,
      "amannNumbers"
    ),
    isacordGidToNumber: flattenGidNumberMap(
      embroidery.embroideryThreadColors,
      embroidery.unlinkedIsacordNumbers,
      "isacordNumbers"
    ),
  };
}

async function loadShopifyProducts(admin, amannGidToNumber, isacordGidToNumber) {
  const productsByOldSku = new Map();
  let after = null;
  let hasNextPage = true;
  let shopifyProductCount = 0;
  let shopifyProductsWithOldSkus = 0;

  while (hasNextPage) {
    const data = await graphqlData(admin, ACTIVE_PRODUCTS_QUERY, {
      first: PRODUCT_PAGE_SIZE,
      after,
    });
    const conn = data?.products;
    const nodes = conn?.nodes ?? [];
    shopifyProductCount += nodes.length;

    for (const node of nodes) {
      const oldSkus = parseOldSkusMetafieldValue(node?.oldSkus?.value);
      if (oldSkus.length === 0) continue;
      shopifyProductsWithOldSkus += 1;

      const lookup = {
        id: node.id,
        title: node.title || "",
        handle: node.handle || "",
        amannNumbers: numbersFromThreadMetafield(
          node.amannThreadsUsed,
          amannGidToNumber
        ),
        isacordNumbers: numbersFromThreadMetafield(
          node.isacordThreadsUsed,
          isacordGidToNumber
        ),
      };

      for (const sku of oldSkus) {
        if (!productsByOldSku.has(sku)) productsByOldSku.set(sku, []);
        productsByOldSku.get(sku).push(lookup);
      }
    }

    hasNextPage = conn?.pageInfo?.hasNextPage ?? false;
    after = conn?.pageInfo?.endCursor ?? null;
  }

  return {
    productsByOldSku,
    shopifyProductCount,
    shopifyProductsWithOldSkus,
  };
}

/**
 * @param {{ graphql: Function }} admin
 */
export async function comparePostgresShopifyThreadNumbers(admin) {
  if (!admin?.graphql) {
    throw new Error("No Shopify admin GraphQL client available.");
  }

  const [{ amannBySku, isacordBySku }, gidMaps] = await Promise.all([
    loadPostgresPairs(),
    loadGidNumberMaps(admin),
  ]);

  const { productsByOldSku, shopifyProductCount, shopifyProductsWithOldSkus } =
    await loadShopifyProducts(
      admin,
      gidMaps.amannGidToNumber,
      gidMaps.isacordGidToNumber
    );

  const amannRows = comparePostgresToShopify(
    amannBySku,
    projectShopifyIndex(productsByOldSku, "amannNumbers")
  );
  const isacordRows = comparePostgresToShopify(
    isacordBySku,
    projectShopifyIndex(productsByOldSku, "isacordNumbers")
  );

  return {
    amann: { rows: amannRows, counts: summarizeRows(amannRows) },
    isacord: { rows: isacordRows, counts: summarizeRows(isacordRows) },
    shopifyProductCount,
    shopifyProductsWithOldSkus,
  };
}
