import {
  priceValuesMatch,
  pricesSemanticallyMatch,
  formatPreviewPrice,
} from "./priceUtils.js";
import { generateBaseParts } from "./versionUtils.js";

/** Split listing `custom.base_sku` into unversioned segments and optional `-Vn` (matches update server). */
export function parseVersionedBaseSkuString(baseSku) {
  const normalized = String(baseSku || "").trim();
  if (!normalized) return null;
  const match = normalized.match(/^(.*)-V(\d+)$/i);
  if (!match) {
    return {
      raw: normalized,
      parts: normalized.split("-").filter(Boolean),
      version: null,
    };
  }
  return {
    raw: normalized,
    parts: String(match[1] || "")
      .split("-")
      .filter(Boolean),
    version: Number(match[2]),
  };
}

/**
 * Pattern-derived master SKU from collection `sku_pattern` + current form (leather, threads, etc.).
 * Re-attaches the same `-Vn` segment as the listing when present.
 */
export function derivePatternVersionedBaseSku(formState, listingBaseSku) {
  const listing = String(listingBaseSku || "").trim();
  const parts = generateBaseParts(formState);
  if (!Array.isArray(parts) || parts.length === 0) return null;

  const unversioned = parts.filter(Boolean).join("-");
  if (!unversioned) return null;

  const parsed = parseVersionedBaseSkuString(listing);
  const versioned =
    parsed?.version != null ? `${unversioned}-V${parsed.version}` : unversioned;

  return {
    listing,
    unversioned,
    versioned,
    matchesListing: versioned === listing,
  };
}

/** Rewrite variant `sku` / `baseSKU` when switching listing vs pattern-derived master prefix. */
export function reanchorVariantsToBaseSku(variants, fromBase, toBase) {
  const from = String(fromBase || "").trim();
  const to = String(toBase || "").trim();
  if (!from || !to || from === to) return variants;
  const rows = Array.isArray(variants) ? variants : [];
  return rows.map((v) => {
    const sku = String(v?.sku || "");
    if (!sku.startsWith(from)) {
      return { ...v, baseSKU: to };
    }
    return {
      ...v,
      baseSKU: to,
      sku: `${to}${sku.slice(from.length)}`,
    };
  });
}

/** Shape option label from a variant loaded for update (`fetchProductForUpdate`). */
export function shapeDisplayNameFromLoadedVariant(existing) {
  if (!existing) return "";
  const opts = existing.selectedOptions;
  if (Array.isArray(opts)) {
    const shape = opts.find(
      (o) => String(o?.name || "").toLowerCase() === "shape"
    );
    if (shape?.value) return String(shape.value).trim();
  }
  return String(existing.title || "").trim();
}

/**
 * Fields that would change on apply for an existing Shopify variant row.
 * Mirrors `updateShopifyProduct` bulk-update rules (display name always; SKU/price only when prices match).
 */
export function previewVariantFieldChanges(generatedRow, existingVariant) {
  const changes = [];
  const skipped = [];

  if (!existingVariant) {
    return { changes, skipped, manualPrice: false };
  }

  const manualPrice = !priceValuesMatch(
    existingVariant.price,
    existingVariant.compareAtPrice
  );

  const newName = String(generatedRow?.variantName || "").trim();
  const currentName = shapeDisplayNameFromLoadedVariant(existingVariant);
  if (currentName !== newName) {
    changes.push({
      field: "Shape display name",
      from: currentName || "—",
      to: newName || "—",
    });
  }

  const newSku = String(generatedRow?.sku || "").trim();
  const currentSku = String(existingVariant.sku || "").trim();
  if (manualPrice) {
    if (currentSku !== newSku) {
      skipped.push({
        field: "SKU",
        reason: "Price and Compare-at differ on this variant — SKU is not updated",
      });
    }
    const newPrice = String(generatedRow?.price ?? "").trim();
    const currentPrice = String(existingVariant.price ?? "").trim();
    if (!pricesSemanticallyMatch(currentPrice, newPrice)) {
      skipped.push({
        field: "Price",
        reason: "Price and Compare-at differ on this variant — price is not updated",
      });
    }
  } else {
    if (currentSku !== newSku) {
      changes.push({
        field: "SKU",
        from: currentSku || "—",
        to: newSku || "—",
      });
    }
    const newPrice = String(generatedRow?.price ?? "").trim();
    const currentPrice = String(existingVariant.price ?? "").trim();
    if (!pricesSemanticallyMatch(currentPrice, newPrice)) {
      changes.push({
        field: "Price",
        from: formatPreviewPrice(currentPrice),
        to: formatPreviewPrice(newPrice),
      });
    }
  }

  return { changes, skipped, manualPrice };
}

/** Summary lines for a variant that will be created on apply. */
export function previewNewVariantSummary(generatedRow) {
  const name = String(generatedRow?.variantName || "").trim() || "—";
  const sku = String(generatedRow?.sku || "").trim() || "—";
  const price = String(generatedRow?.price ?? "").trim();
  return {
    displayName: name,
    sku,
    priceLabel: price ? formatPreviewPrice(price) : "—",
  };
}

function sortedJsonList(values) {
  if (!Array.isArray(values)) return [];
  return [...values].filter(Boolean).map(String).sort();
}

function listsEqual(a, b) {
  const left = sortedJsonList(a);
  const right = sortedJsonList(b);
  if (left.length !== right.length) return false;
  return left.every((v, i) => v === right[i]);
}

/**
 * Product-level fields written on apply (description + custom metafields), compared to loaded product.
 */
export function previewProductLevelChanges(productData, existingProduct, descriptionPlain) {
  const changes = [];
  if (!productData || !existingProduct) return changes;

  const nextDesc = String(descriptionPlain ?? "").trim();
  const prevDesc = String(existingProduct.descriptionPlain ?? "").trim();
  if (nextDesc !== prevDesc) {
    changes.push({
      field: "Product description",
      from: prevDesc ? `${prevDesc.slice(0, 80)}${prevDesc.length > 80 ? "…" : ""}` : "—",
      to: nextDesc ? `${nextDesc.slice(0, 80)}${nextDesc.length > 80 ? "…" : ""}` : "—",
    });
  }

  const smf = productData.shopifyProductMetafields ?? {};
  const metaChecks = [
    { field: "Leathers used", key: "leathersUsed", current: existingProduct.leathersUsed },
    { field: "Amann threads used", key: "amannThreadsUsed", current: existingProduct.amannThreadsUsed },
    { field: "Isacord threads used", key: "isacordThreadsUsed", current: existingProduct.isacordThreadsUsed },
  ];

  for (const { field, key, current } of metaChecks) {
    const next = smf[key];
    if (!Array.isArray(next) || next.length === 0) continue;
    if (!listsEqual(next, current)) {
      changes.push({
        field,
        from: `${(current || []).length} reference(s) on listing`,
        to: `${next.length} reference(s) in preview`,
      });
    }
  }

  const nextFont = smf.fontGid;
  const prevFont = existingProduct.fontRef;
  if (nextFont && String(nextFont) !== String(prevFont || "")) {
    changes.push({
      field: "Font",
      from: prevFont ? "current listing value" : "—",
      to: "updated from form",
    });
  }

  const nextBase = String(productData.versionedBaseSku || "").trim();
  const prevBase = String(existingProduct.baseSku || "").trim();
  if (nextBase && prevBase && nextBase !== prevBase) {
    changes.push({
      field: "custom.base_sku",
      from: prevBase,
      to: nextBase,
    });
    if (productData.migrateBaseSkuToOldSkus) {
      changes.push({
        field: "custom.old_skus",
        from: existingProduct.oldSkusUsed?.trim() || "(empty)",
        to: `append ${prevBase}`,
      });
    }
  }

  return changes;
}
