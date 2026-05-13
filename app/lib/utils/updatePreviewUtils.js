import { priceValuesMatch } from "./priceUtils.js";

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
    if (currentPrice !== newPrice) {
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
    if (currentPrice !== newPrice) {
      changes.push({
        field: "Price",
        from: currentPrice ? `$${currentPrice}` : "—",
        to: newPrice ? `$${newPrice}` : "—",
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
    priceLabel: price ? `$${price}` : "—",
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
  }

  return changes;
}
