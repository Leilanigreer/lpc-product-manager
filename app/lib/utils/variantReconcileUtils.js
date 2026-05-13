/**
 * Match generated update rows to existing Shopify variants when `custom.single_shape`
 * is missing (common on older custom rows) or when the master base SKU prefix changes
 * (e.g. BuE → Bu_E) but the per-variant suffix is unchanged (-Fairway-Custom).
 */

export function reconcileVariantShapeKey(shapeValue, isCustom) {
  const shape = String(shapeValue || "").trim();
  return `${shape}|${isCustom ? "1" : "0"}`;
}

export function suffixKeyFromMasterSku(fullSku, masterBaseSku) {
  const sku = String(fullSku || "").trim();
  const base = String(masterBaseSku || "").trim();
  if (!sku || !base) return null;
  if (!sku.toLowerCase().startsWith(base.toLowerCase())) return null;
  return sku.slice(base.length).toLowerCase();
}

export function normalizeVariantTitleForMatch(name) {
  return String(name || "")
    .trim()
    .replace(/^Customize\b/i, "Customized")
    .toLowerCase();
}

function shapeOptionTitleFromLoadedVariant(ev) {
  const opts = ev?.selectedOptions;
  if (Array.isArray(opts)) {
    const shape = opts.find((o) => String(o?.name || "").toLowerCase() === "shape");
    if (shape?.value) return String(shape.value).trim();
  }
  return String(ev?.title || "").trim();
}

/**
 * @param {object[]} existingVariants
 * @param {string} listingBaseSku Product `custom.base_sku` as loaded from Shopify
 * @param {(ev: object) => boolean} isCustomFn
 */
export function buildExistingVariantReconcileIndex(
  existingVariants,
  listingBaseSku,
  isCustomFn
) {
  const listingBase = String(listingBaseSku || "").trim();
  const byId = new Map();
  const byShapeKey = new Map();
  const bySuffix = new Map();
  const woodFairwayCustoms = [];
  const byNormTitle = new Map();

  for (const ev of existingVariants || []) {
    if (!ev?.id) continue;
    byId.set(ev.id, ev);

    const isCustom = Boolean(isCustomFn(ev));
    const shape = ev.singleShape ? String(ev.singleShape).trim() : "";
    if (shape) {
      byShapeKey.set(reconcileVariantShapeKey(shape, isCustom), ev);
    }

    const suffix = suffixKeyFromMasterSku(ev.sku, listingBase);
    if (suffix && !bySuffix.has(suffix)) {
      bySuffix.set(suffix, ev);
    }

    if (isCustom) {
      const skuLower = String(ev.sku || "").toLowerCase();
      if (skuLower.includes("fairway") && skuLower.includes("custom")) {
        woodFairwayCustoms.push(ev);
      }
    }

    const norm = normalizeVariantTitleForMatch(shapeOptionTitleFromLoadedVariant(ev));
    if (norm && !byNormTitle.has(norm)) {
      byNormTitle.set(norm, ev);
    }
  }

  return {
    byId,
    byShapeKey,
    bySuffix,
    woodFairwayCustoms,
    byNormTitle,
    listingBase,
  };
}

/**
 * @param {object} row Generated variant row
 * @param {ReturnType<typeof buildExistingVariantReconcileIndex>} index
 * @param {Set<string>} [claimedIds]
 */
export function resolveExistingVariantForUpdateRow(row, index, claimedIds) {
  if (!row || !index) return null;

  const isCustom = Boolean(row.isCustom);
  const shape = String(row.shapeValue || "").trim();

  const tryClaim = (ev) => {
    if (!ev?.id) return null;
    if (claimedIds?.has(ev.id)) return null;
    return ev;
  };

  const presetId = row.existingVariantId;
  if (presetId && index.byId.has(presetId)) {
    const hit = tryClaim(index.byId.get(presetId));
    if (hit) return hit;
  }

  if (shape) {
    const hit = tryClaim(
      index.byShapeKey.get(reconcileVariantShapeKey(shape, isCustom))
    );
    if (hit) return hit;
  }

  const rowMaster = String(row.baseSKU || index.listingBase || "").trim();
  let rowSuffix = suffixKeyFromMasterSku(row.sku, rowMaster);
  if (!rowSuffix && index.listingBase) {
    rowSuffix = suffixKeyFromMasterSku(row.sku, index.listingBase);
  }
  if (rowSuffix) {
    const hit = tryClaim(index.bySuffix.get(rowSuffix));
    if (hit) return hit;
  }

  if (
    isCustom &&
    (row.shapeType === "WOOD" ||
      String(row.variantName || "").toLowerCase().includes("fairway"))
  ) {
    const ev = index.woodFairwayCustoms.find((v) => !claimedIds?.has(v.id));
    if (ev) return ev;
  }

  const norm = normalizeVariantTitleForMatch(row.variantName);
  if (norm) {
    const hit = tryClaim(index.byNormTitle.get(norm));
    if (hit) return hit;
  }

  return null;
}

export function attachExistingVariantIdsToGeneratedRows(
  generatedRows,
  existingVariants,
  listingBaseSku,
  isCustomFn
) {
  const index = buildExistingVariantReconcileIndex(
    existingVariants,
    listingBaseSku,
    isCustomFn
  );
  const claimed = new Set();
  const out = [];

  for (const row of generatedRows || []) {
    const existing = resolveExistingVariantForUpdateRow(row, index, claimed);
    const id = existing?.id ?? null;
    if (id) claimed.add(id);
    out.push({ ...row, existingVariantId: id });
  }

  return out;
}
