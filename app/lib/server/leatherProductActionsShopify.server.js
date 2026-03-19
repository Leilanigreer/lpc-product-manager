// app/lib/server/leatherProductActionsShopify.server.js

const PRODUCT_VARIANTS_AND_TAGS_QUERY = `#graphql
  query ProductVariantsAndTags($productId: ID!) {
    product(id: $productId) {
      id
      tags
      variants(first: 250) {
        nodes {
          id
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

const TAGS_REMOVE_MUTATION = `#graphql
  mutation TagsRemove($id: ID!, $tags: [String!]!) {
    tagsRemove(id: $id, tags: $tags) {
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

async function removeCustomizableTag(admin, productId, tags) {
  const customizableTags = (tags || []).filter(
    (t) => typeof t === "string" && t.toLowerCase() === "customizable"
  );
  if (!customizableTags.length) return;
  const response = await admin.graphql(TAGS_REMOVE_MUTATION, {
    variables: { id: productId, tags: customizableTags },
  });
  const json = await response.json();
  const gqlErrors = json?.errors ?? [];
  if (gqlErrors.length) {
    throw new Error(gqlErrors.map((e) => e.message).join("; "));
  }
  const userErrors = json?.data?.tagsRemove?.userErrors ?? [];
  const messages = collectErrors(userErrors);
  if (messages.length) throw new Error(messages.join("; "));
}

/**
 * Applies per-product action changes from AddLeatherColorForm linkedProductActions payload.
 * Only applies transitions from baseline=true to actions=false:
 * - removeContinueSellingWhenOos: set all variant inventoryPolicy to DENY
 * - removeCustomizableOptions: remove product "Customizable" tag and set all variant custom.customizable=false
 */
export async function applyLinkedProductActions(admin, linkedProductActions = []) {
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

    if (!shouldSetInventoryDeny && !shouldRemoveCustomizable) continue;

    const product = await fetchProductVariantsAndTags(admin, productId);
    if (!product) continue;

    if (shouldSetInventoryDeny) {
      await setAllVariantInventoryDeny(admin, product.id, product.variantIds);
    }

    if (shouldRemoveCustomizable) {
      await removeCustomizableTag(admin, product.id, product.tags);
      await setAllVariantCustomizableFalse(admin, product.variantIds);
    }

    updatedProducts += 1;
  }

  return { updatedProducts };
}

