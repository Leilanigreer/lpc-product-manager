/** @param {unknown} value */
export function isShopifyMetaobjectGid(value) {
  return (
    typeof value === "string" &&
    value.startsWith("gid://shopify/Metaobject/")
  );
}

/** @param {unknown} value */
export function isShopifyProductVariantGid(value) {
  return (
    typeof value === "string" &&
    value.startsWith("gid://shopify/ProductVariant/")
  );
}
