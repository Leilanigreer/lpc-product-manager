// app/lib/server/inventoryShopify.server.js

const PRIMARY_STORE_LOCATION = {
  address1: "550 Montgomery Street",
  city: "San Francisco",
};

const PRODUCT_VARIANTS_INVENTORY_QUERY = `#graphql
  query ProductVariantsInventory($id: ID!, $variantsCursor: String) {
    product(id: $id) {
      id
      variants(first: 100, after: $variantsCursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          title
          sku
          inventoryQuantity
          inventoryItem {
            id
          }
          customizable: metafield(namespace: "custom", key: "customizable") {
            value
          }
        }
      }
    }
  }
`;

const INVENTORY_SET_QUANTITIES_MUTATION = `#graphql
  mutation InventorySetQuantities($input: InventorySetQuantitiesInput!) {
    inventorySetQuantities(input: $input) {
      userErrors {
        field
        message
      }
    }
  }
`;

function collectErrors(errors = []) {
  return errors.map((e) => e?.message).filter(Boolean);
}

function parseMetafieldBoolean(raw) {
  if (raw === true || raw === "true" || raw === 1 || raw === "1") return true;
  if (raw === false || raw === "false" || raw === 0 || raw === "0") return false;
  return null;
}

/** `customizable` true = base variant; false = custom (+$15) variant */
export function variantIsCustomShopify(v) {
  const b = parseMetafieldBoolean(v?.customizable);
  if (b === false) return true;
  if (b === true) return false;
  return String(v?.sku || "")
    .toLowerCase()
    .includes("-custom");
}

export async function getPrimaryStoreLocationId(admin) {
  const locationResponse = await admin.graphql(`#graphql
    query PrimaryStoreLocation {
      locations(first: 10) {
        edges {
          node {
            id
            address {
              address1
              city
            }
          }
        }
      }
    }
  `);
  const locationJson = await locationResponse.json();
  if (locationJson.errors?.length) {
    throw new Error(locationJson.errors.map((e) => e.message).join("; "));
  }
  const location = locationJson.data?.locations?.edges?.find(
    ({ node }) =>
      node?.address?.address1 === PRIMARY_STORE_LOCATION.address1 &&
      node?.address?.city === PRIMARY_STORE_LOCATION.city
  );
  if (!location?.node?.id) {
    throw new Error("Store location not found");
  }
  return location.node.id;
}

/**
 * @returns {Promise<Array<{
 *   id: string,
 *   title: string,
 *   sku: string,
 *   inventoryQuantity: number,
 *   inventoryItemId: string,
 *   isCustom: boolean,
 * }>>}
 */
export async function fetchProductVariantsForInventory(admin, productId) {
  if (!admin?.graphql || !productId) return [];

  let cursor = null;
  let hasNextPage = true;
  const out = [];

  while (hasNextPage) {
    const response = await admin.graphql(PRODUCT_VARIANTS_INVENTORY_QUERY, {
      variables: { id: productId, variantsCursor: cursor },
    });
    const json = await response.json();
    const gqlErrors = json?.errors ?? [];
    if (gqlErrors.length) {
      throw new Error(gqlErrors.map((e) => e.message).join("; "));
    }

    const product = json?.data?.product;
    if (!product?.id) return out;

    for (const node of product.variants?.nodes ?? []) {
      if (!node?.id) continue;
      const inventoryItemId = node.inventoryItem?.id;
      if (!inventoryItemId) continue;

      const customizableRaw = node.customizable?.value ?? null;
      out.push({
        id: node.id,
        title: node.title || "",
        sku: node.sku || "",
        inventoryQuantity: Number(node.inventoryQuantity) || 0,
        inventoryItemId,
        isCustom: variantIsCustomShopify({
          customizable: customizableRaw,
          sku: node.sku,
        }),
      });
    }

    const pageInfo = product.variants?.pageInfo ?? {};
    hasNextPage = Boolean(pageInfo.hasNextPage);
    cursor = pageInfo.endCursor ?? null;
  }

  return out;
}

/**
 * @param {Object} admin
 * @param {Array<{ inventoryItemId: string, quantity: number }>} updates
 */
export async function setInventoryQuantities(admin, updates) {
  if (!updates?.length) return;

  const locationId = await getPrimaryStoreLocationId(admin);

  const quantities = updates
    .filter((u) => u?.inventoryItemId && Number.isFinite(Number(u.quantity)))
    .map((u) => ({
      inventoryItemId: u.inventoryItemId,
      locationId,
      quantity: Math.max(0, Math.floor(Number(u.quantity))),
    }));

  if (!quantities.length) return;

  const response = await admin.graphql(INVENTORY_SET_QUANTITIES_MUTATION, {
    variables: {
      input: {
        name: "available",
        reason: "correction",
        ignoreCompareQuantity: true,
        quantities,
      },
    },
  });
  const json = await response.json();
  const gqlErrors = json?.errors ?? [];
  if (gqlErrors.length) {
    throw new Error(gqlErrors.map((e) => e.message).join("; "));
  }
  const userErrors = json?.data?.inventorySetQuantities?.userErrors ?? [];
  const messages = collectErrors(userErrors);
  if (messages.length) throw new Error(messages.join("; "));
}

/**
 * @param {Object} admin
 * @param {string[]} productIds
 */
export async function fetchVariantsForProducts(admin, productIds) {
  const ids = Array.from(new Set((productIds || []).filter(Boolean)));
  const variantsByProductId = {};
  const batchSize = 10;

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (productId) => {
        variantsByProductId[productId] = await fetchProductVariantsForInventory(
          admin,
          productId
        );
      })
    );
  }

  return variantsByProductId;
}
