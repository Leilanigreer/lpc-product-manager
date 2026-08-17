import {
  buildR2Prefix,
  joinPublicUrl,
  pickPrimaryVariantImageUrl,
} from "../utils/r2Paths.js";
import { isR2Configured, readR2Env } from "./r2.js";

function trimUrl(value) {
  return typeof value === "string" ? value.trim() : "";
}

function productHasR2Assets(productData) {
  if (trimUrl(productData?.r2PrefixUrl)) return true;
  const views = productData?.additionalViews;
  if (Array.isArray(views) && views.some((img) => trimUrl(img?.r2Data?.url))) {
    return true;
  }
  const variants = productData?.variants;
  if (!Array.isArray(variants)) return false;
  return variants.some(
    (v) =>
      trimUrl(v?.cloudflareUrl) ||
      (Array.isArray(v?.images) && v.images.some((img) => trimUrl(img?.r2Data?.url)))
  );
}

export function resolveProductR2PrefixUrl(productData) {
  const explicit = trimUrl(productData?.r2PrefixUrl);
  if (explicit) return explicit;
  if (!productHasR2Assets(productData) || !isR2Configured()) return "";
  const collection = productData?.productType;
  const folder = productData?.productPictureFolder || productData?.mainHandle;
  if (!collection || !folder) return "";
  return joinPublicUrl(readR2Env().publicBaseUrl, buildR2Prefix({ collection, folder }));
}

/**
 * Product `custom.cloudflare_url` plus per-variant `custom.cloudflare_url_variant`
 * on base (non-custom) variants only.
 */
export function appendCloudflareUrlMetafields({
  metafields,
  productId,
  productData,
  variantOwnerIds,
}) {
  const prefixUrl = resolveProductR2PrefixUrl(productData);
  if (prefixUrl && productId) {
    metafields.push({
      ownerId: productId,
      namespace: "custom",
      key: "cloudflare_url",
      type: "url",
      value: prefixUrl,
    });
  }

  const variants = productData?.variants;
  if (!Array.isArray(variants) || !Array.isArray(variantOwnerIds)) return;

  const n = Math.min(variants.length, variantOwnerIds.length);
  for (let i = 0; i < n; i++) {
    const pv = variants[i];
    if (pv?.isCustom) continue;
    const ownerId = variantOwnerIds[i]?.id;
    const url =
      trimUrl(pv?.cloudflareUrl) || pickPrimaryVariantImageUrl(pv?.images);
    if (!ownerId || !url) continue;
    metafields.push({
      ownerId,
      namespace: "custom",
      key: "cloudflare_url_variant",
      type: "url",
      value: url,
    });
  }
}
