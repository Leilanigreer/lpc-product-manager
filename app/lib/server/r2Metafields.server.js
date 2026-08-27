import {
  buildR2Prefix,
  joinPublicUrl,
  pickPrimaryVariantImageUrl,
} from "../utils/r2Paths.js";
import { buildR2DashboardFolderUrl, isR2Configured, readR2Env } from "./r2.js";

function trimUrl(value) {
  return typeof value === "string" ? value.trim() : "";
}

/** True when `url` is under this app's R2 public base (never Shopify CDN). */
export function isR2PublicUrl(url) {
  const trimmed = trimUrl(url);
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (lower.includes("cdn.shopify.com") || lower.includes("shopifycdn.com")) {
    return false;
  }
  const base = readR2Env().publicBaseUrl.replace(/\/+$/, "");
  if (!base) return false;
  return trimmed === base || trimmed.startsWith(`${base}/`);
}

function collectNewR2ObjectUrls(productData) {
  const urls = [];
  const push = (value) => {
    const trimmed = trimUrl(value);
    if (trimmed) urls.push(trimmed);
  };
  push(productData?.groupImageR2?.url);
  if (Array.isArray(productData?.additionalViews)) {
    for (const img of productData.additionalViews) {
      push(img?.r2Data?.url);
    }
  }
  if (Array.isArray(productData?.variants)) {
    for (const v of productData.variants) {
      push(v?.cloudflareUrl);
      if (Array.isArray(v?.images)) {
        for (const img of v.images) {
          push(img?.r2Data?.url);
        }
      }
    }
  }
  return urls.filter(isR2PublicUrl);
}

function productHasR2Assets(productData) {
  if (trimUrl(productData?.r2PrefixUrl)) return true;
  return collectNewR2ObjectUrls(productData).length > 0;
}

function productHasNewR2ObjectUrls(productData) {
  return collectNewR2ObjectUrls(productData).length > 0;
}

export function resolveProductR2ObjectPrefix(productData) {
  const collection = productData?.productType;
  const folder = productData?.productPictureFolder || productData?.mainHandle;
  if (collection && folder) return buildR2Prefix({ collection, folder });

  const publicUrl = trimUrl(productData?.r2PrefixUrl);
  const base = readR2Env().publicBaseUrl.replace(/\/+$/, "");
  if (publicUrl && base && publicUrl.startsWith(`${base}/`)) {
    return publicUrl.slice(base.length + 1).replace(/\/+$/, "");
  }
  return "";
}

export function resolveProductR2PrefixUrl(productData) {
  const explicit = trimUrl(productData?.r2PrefixUrl);
  if (explicit) return explicit;
  if (!productHasR2Assets(productData) || !isR2Configured()) return "";
  const objectPrefix = resolveProductR2ObjectPrefix(productData);
  if (!objectPrefix) return "";
  return joinPublicUrl(readR2Env().publicBaseUrl, objectPrefix);
}

export function resolveProductR2DashboardUrl(productData) {
  if (!productHasR2Assets(productData) && !trimUrl(productData?.r2PrefixUrl)) {
    return "";
  }
  return buildR2DashboardFolderUrl(resolveProductR2ObjectPrefix(productData));
}

/**
 * Product `custom.cloudflare_url` plus per-variant `custom.cloudflare_url_variant`
 * on base (non-custom) variants only.
 *
 * Writes only for new R2 public URLs — never Shopify CDN media URLs.
 */
export function appendCloudflareUrlMetafields({
  metafields,
  productId,
  productData,
  variantOwnerIds,
}) {
  const prefixUrl = resolveProductR2PrefixUrl(productData);
  if (
    prefixUrl &&
    productId &&
    isR2PublicUrl(prefixUrl) &&
    productHasNewR2ObjectUrls(productData)
  ) {
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
    if (!ownerId || !isR2PublicUrl(url)) continue;
    metafields.push({
      ownerId,
      namespace: "custom",
      key: "cloudflare_url_variant",
      type: "url",
      value: url,
    });
  }
}
