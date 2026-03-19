// app/lib/server/leatherProductActionsShopify.server.js

const PRODUCT_VARIANTS_AND_TAGS_QUERY = `#graphql
  query ProductVariantsAndTags($productId: ID!) {
    product(id: $productId) {
      id
      tags
      variants(first: 250) {
        nodes {
          id
          price
          compareAtPrice
        }
      }
    }
  }
`;

const PRODUCT_VARIANTS_BULK_UPDATE_MUTATION = `#graphql
  mutation ProductVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      userErrors {
        field
        message
      }
    }
  }
`;

const METAFIELDS_SET_MUTATION = `#graphql
  mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      userErrors {
        field
        message
      }
    }
  }
`;

const PRODUCT_UPDATE_TAGS_MUTATION = `#graphql
  mutation ProductUpdateTags($input: ProductInput!) {
    productUpdate(input: $input) {
      userErrors {
        field
        message
      }
    }
  }
`;

function parseBoolean(v) {
  return v === true || v === "true" || v === 1 || v === "1";
}

function collectErrors(errors = []) {
  return errors
    .map((e) => e?.message)
    .filter(Boolean);
}

async function fetchProductVariantsAndTags(admin, productId) {
  const response = await admin.graphql(PRODUCT_VARIANTS_AND_TAGS_QUERY, {
    variables: { productId },
  });
  const json = await response.json();
  const gqlErrors = json?.errors ?? [];
  if (gqlErrors.length) {
    throw new Error(gqlErrors.map((e) => e.message).join("; "));
  }
  const product = json?.data?.product;
  if (!product?.id) return null;
  return {
    id: product.id,
    tags: product.tags ?? [],
    variants: (product.variants?.nodes ?? [])
      .map((v) => ({
        id: v?.id,
        price: v?.price,
        compareAtPrice: v?.compareAtPrice,
      }))
      .filter((v) => v.id),
    variantIds: (product.variants?.nodes ?? []).map((v) => v?.id).filter(Boolean),
  };
}

async function setAllVariantInventoryDeny(admin, productId, variantIds) {
  if (!variantIds.length) return;
  const variants = variantIds.map((id) => ({ id, inventoryPolicy: "DENY" }));
  const response = await admin.graphql(PRODUCT_VARIANTS_BULK_UPDATE_MUTATION, {
    variables: { productId, variants },
  });
  const json = await response.json();
  const gqlErrors = json?.errors ?? [];
  if (gqlErrors.length) {
    throw new Error(gqlErrors.map((e) => e.message).join("; "));
  }
  const userErrors = json?.data?.productVariantsBulkUpdate?.userErrors ?? [];
  const messages = collectErrors(userErrors);
  if (messages.length) throw new Error(messages.join("; "));
}

function toMoneyNumber(value) {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

function toMoneyString(value) {
  return Number(value).toFixed(2);
}

async function applyDiscountToAllVariants(admin, productId, variants, discountPercent) {
  if (!Array.isArray(variants) || !variants.length) return;
  const multiplier = 1 - discountPercent / 100;
  const updates = [];

  for (const v of variants) {
    const price = toMoneyNumber(v.price);
    const compareAt = toMoneyNumber(v.compareAtPrice);
    const baseCompareAt = compareAt != null && compareAt > 0 ? compareAt : price;
    if (baseCompareAt == null || baseCompareAt <= 0) continue;

    const nextPrice = baseCompareAt * multiplier;
    updates.push({
      id: v.id,
      price: toMoneyString(nextPrice),
      compareAtPrice: toMoneyString(baseCompareAt),
    });
  }

  if (!updates.length) return;

  const response = await admin.graphql(PRODUCT_VARIANTS_BULK_UPDATE_MUTATION, {
    variables: { productId, variants: updates },
  });
  const json = await response.json();
  const gqlErrors = json?.errors ?? [];
  if (gqlErrors.length) {
    throw new Error(gqlErrors.map((e) => e.message).join("; "));
  }
  const userErrors = json?.data?.productVariantsBulkUpdate?.userErrors ?? [];
  const messages = collectErrors(userErrors);
  if (messages.length) throw new Error(messages.join("; "));
}

async function setExclusiveDiscountTag(admin, productId, currentTags, discountTag) {
  const allowed = new Set(["last-chance", "clearance"]);
  const normalizedDiscountTag = String(discountTag || "").toLowerCase();
  if (!allowed.has(normalizedDiscountTag)) return;

  const existing = (currentTags || []).filter((t) => typeof t === "string");
  const filtered = existing.filter((t) => {
    const lower = t.toLowerCase();
    return lower !== "last-chance" && lower !== "clearance";
  });

  const lowerFiltered = new Set(filtered.map((t) => t.toLowerCase()));
  if (!lowerFiltered.has(normalizedDiscountTag)) {
    filtered.push(normalizedDiscountTag);
  }

  // If tags already match exactly (case-insensitive), skip mutation.
  const existingNorm = existing.map((t) => t.toLowerCase()).sort().join("|");
  const nextNorm = filtered.map((t) => t.toLowerCase()).sort().join("|");
  if (existingNorm === nextNorm) return;

  const response = await admin.graphql(PRODUCT_UPDATE_TAGS_MUTATION, {
    variables: {
      input: {
        id: productId,
        tags: filtered,
      },
    },
  });
  const json = await response.json();
  const gqlErrors = json?.errors ?? [];
  if (gqlErrors.length) {
    throw new Error(gqlErrors.map((e) => e.message).join("; "));
  }
  const userErrors = json?.data?.productUpdate?.userErrors ?? [];
  const messages = collectErrors(userErrors);
  if (messages.length) throw new Error(messages.join("; "));
}

async function setAllVariantCustomizableFalse(admin, variantIds) {
  if (!variantIds.length) return;
  const metafields = variantIds.map((ownerId) => ({
    ownerId,
    namespace: "custom",
    key: "customizable",
    type: "boolean",
    value: "false",
  }));
  const response = await admin.graphql(METAFIELDS_SET_MUTATION, {
    variables: { metafields },
  });
  const json = await response.json();
  const gqlErrors = json?.errors ?? [];
  if (gqlErrors.length) {
    throw new Error(gqlErrors.map((e) => e.message).join("; "));
  }
  const userErrors = json?.data?.metafieldsSet?.userErrors ?? [];
  const messages = collectErrors(userErrors);
  if (messages.length) throw new Error(messages.join("; "));
}

async function setProductColorMetaobjects(admin, productId, colorMetaobjectIds) {
  const value = JSON.stringify(
    Array.from(new Set((colorMetaobjectIds || []).filter(Boolean)))
  );
  const response = await admin.graphql(METAFIELDS_SET_MUTATION, {
    variables: {
      metafields: [
        {
          ownerId: productId,
          namespace: "custom",
          key: "color",
          type: "list.metaobject_reference",
          value,
        },
      ],
    },
  });
  const json = await response.json();
  const gqlErrors = json?.errors ?? [];
  if (gqlErrors.length) {
    throw new Error(gqlErrors.map((e) => e.message).join("; "));
  }
  const userErrors = json?.data?.metafieldsSet?.userErrors ?? [];
  const messages = collectErrors(userErrors);
  if (messages.length) throw new Error(messages.join("; "));
}

async function removeCustomizableTag(admin, productId, tags) {
  const currentTags = (tags || []).filter((t) => typeof t === "string");
  const nextTags = currentTags.filter((t) => t.toLowerCase() !== "customizable");
  // Nothing to change.
  if (nextTags.length === currentTags.length) return;

  const response = await admin.graphql(PRODUCT_UPDATE_TAGS_MUTATION, {
    variables: {
      input: {
        id: productId,
        tags: nextTags,
      },
    },
  });
  const json = await response.json();
  const gqlErrors = json?.errors ?? [];
  if (gqlErrors.length) {
    throw new Error(gqlErrors.map((e) => e.message).join("; "));
  }
  const userErrors = json?.data?.productUpdate?.userErrors ?? [];
  const messages = collectErrors(userErrors);
  if (messages.length) throw new Error(messages.join("; "));
}

/**
 * Applies per-product action changes from AddLeatherColorForm linkedProductActions payload.
 * Only applies transitions from baseline=true to actions=false:
 * - removeContinueSellingWhenOos: set all variant inventoryPolicy to DENY
 * - removeCustomizableOptions: remove product "Customizable" tag and set all variant custom.customizable=false
 * Also syncs product custom.color metafield from leather colorMetaobjectIds when provided.
 */
export async function applyLinkedProductActions(
  admin,
  linkedProductActions = [],
  colorMetaobjectIds = null
) {
  if (!admin?.graphql) {
    throw new Error("No Shopify admin client available.");
  }
  if (!Array.isArray(linkedProductActions) || !linkedProductActions.length) {
    return { updatedProducts: 0 };
  }

  let updatedProducts = 0;

  for (const item of linkedProductActions) {
    const productId = item?.shopifyProductId;
    if (!productId) continue;

    const actions = item?.actions ?? {};
    const baseline = item?.baseline ?? {};

    const shouldSetInventoryDeny =
      parseBoolean(baseline.removeContinueSellingWhenOos) &&
      !parseBoolean(actions.removeContinueSellingWhenOos);

    const shouldRemoveCustomizable =
      parseBoolean(baseline.removeCustomizableOptions) &&
      !parseBoolean(actions.removeCustomizableOptions);

    const shouldApplyDiscount40 =
      !parseBoolean(baseline.applyDiscount40) &&
      parseBoolean(actions.applyDiscount40);

    const shouldApplyDiscount60 =
      !parseBoolean(baseline.applyDiscount60) &&
      parseBoolean(actions.applyDiscount60);

    const discountToApply = shouldApplyDiscount60 ? 60 : shouldApplyDiscount40 ? 40 : null;

    const shouldSyncProductColors = Array.isArray(colorMetaobjectIds);
    if (
      !shouldSetInventoryDeny &&
      !shouldRemoveCustomizable &&
      !discountToApply &&
      !shouldSyncProductColors
    ) continue;

    const product = await fetchProductVariantsAndTags(admin, productId);
    if (!product) continue;

    if (shouldSetInventoryDeny) {
      await setAllVariantInventoryDeny(admin, product.id, product.variantIds);
    }

    if (shouldRemoveCustomizable) {
      await removeCustomizableTag(admin, product.id, product.tags);
      await setAllVariantCustomizableFalse(admin, product.variantIds);
    }

    if (discountToApply) {
      await applyDiscountToAllVariants(admin, product.id, product.variants, discountToApply);
      const discountTag = discountToApply === 60 ? "clearance" : "last-chance";
      await setExclusiveDiscountTag(admin, product.id, product.tags, discountTag);
    }

    if (shouldSyncProductColors) {
      await setProductColorMetaobjects(admin, product.id, colorMetaobjectIds);
    }

    updatedProducts += 1;
  }

  return { updatedProducts };
}

