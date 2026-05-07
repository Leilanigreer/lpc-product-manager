import {
  isShopifyMetaobjectGid,
  isShopifyProductVariantGid,
} from "../utils/shopifyGid.js";

const COLLECTION_ACTIVE_PRODUCTS_QUERY = `#graphql
  query ActiveProductsByCollection($id: ID!, $cursor: String) {
    collection(id: $id) {
      id
      products(first: 100, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          title
          handle
          status
          metafield(namespace: "custom", key: "base_sku") { value }
        }
      }
    }
  }
`;

const PRODUCT_FOR_UPDATE_QUERY = `#graphql
  query ProductForUpdate($id: ID!, $variantsCursor: String) {
    product(id: $id) {
      id
      title
      handle
      tags
      productType
      descriptionHtml
      metafield(namespace: "custom", key: "base_sku") { value }
      googleDriveFolder: metafield(namespace: "custom", key: "google_drive_images") { value }
      leathersUsed: metafield(namespace: "custom", key: "leathers_used") { value }
      amannThreadsUsed: metafield(namespace: "custom", key: "amann_threads_used") { value }
      isacordThreadsUsed: metafield(namespace: "custom", key: "isacord_threads_used") { value }
      fontRef: metafield(namespace: "custom", key: "font") { value }
      variants(first: 100, after: $variantsCursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          title
          sku
          price
          compareAtPrice
          inventoryQuantity
          selectedOptions {
            name
            value
          }
          singleShape: metafield(namespace: "custom", key: "single_shape") { value }
          singleStyle: metafield(namespace: "custom", key: "single_style") { value }
        }
      }
    }
  }
`;

const PRODUCT_UPDATE_DESCRIPTION_MUTATION = `#graphql
  mutation ProductUpdateDescription($input: ProductInput!) {
    productUpdate(input: $input) {
      product { id }
      userErrors {
        field
        message
      }
    }
  }
`;

const VARIANTS_BULK_CREATE_MUTATION = `#graphql
  mutation ProductVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkCreate(
      productId: $productId,
      variants: $variants
    ) {
      productVariants {
        id
        sku
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const VARIANTS_BULK_UPDATE_MUTATION = `#graphql
  mutation ProductVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(
      productId: $productId,
      variants: $variants
    ) {
      productVariants {
        id
        sku
      }
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

const METAFIELDS_SET_INPUT_LIMIT = 25;

function parseJsonListMetafieldValue(raw) {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseVersionedBaseSku(baseSku) {
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

function priceValuesMatch(price, compareAtPrice) {
  const a = Number.parseFloat(String(price ?? "").trim());
  const b = Number.parseFloat(String(compareAtPrice ?? "").trim());
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return a === b;
}

function chunkMetafieldsForSet(metafields) {
  const chunks = [];
  for (let i = 0; i < metafields.length; i += METAFIELDS_SET_INPUT_LIMIT) {
    chunks.push(metafields.slice(i, i + METAFIELDS_SET_INPUT_LIMIT));
  }
  return chunks;
}

function variantPairingKey(v) {
  if (!v) return "";
  return [
    v.shapeValue ?? "",
    v.style?.value ?? "",
    v.colorDesignation?.value ?? "",
  ].join("|");
}

function findCustomizeVariantIndexForBase(variants, baseIndex) {
  const base = variants[baseIndex];
  if (!base || base.isCustom) return -1;

  if (base.shapeType === "WOOD") {
    const rep =
      typeof base.customizeRepresentativeShapeValue === "string" &&
      isShopifyMetaobjectGid(base.customizeRepresentativeShapeValue)
        ? base.customizeRepresentativeShapeValue
        : base.shapeValue;
    for (let j = 0; j < variants.length; j++) {
      if (j === baseIndex) continue;
      const row = variants[j];
      if (!row?.isCustom || row.shapeType !== "WOOD") continue;
      if (row.shapeValue === rep) return j;
    }
    return -1;
  }

  const key = variantPairingKey(base);
  for (let j = 0; j < variants.length; j++) {
    if (j === baseIndex) continue;
    const row = variants[j];
    if (!row?.isCustom) continue;
    if (variantPairingKey(row) === key) return j;
  }
  return -1;
}

async function setProductAndVariantMetafields(
  admin,
  productId,
  productData,
  resolvedVariantsByOrder
) {
  const productDataVariants = productData?.variants;
  if (!productId || !Array.isArray(productDataVariants)) return;

  const metafields = [];
  const smf = productData.shopifyProductMetafields ?? {};

  if (Array.isArray(smf.leathersUsed) && smf.leathersUsed.length > 0) {
    metafields.push({
      ownerId: productId,
      namespace: "custom",
      key: "leathers_used",
      type: "list.metaobject_reference",
      value: JSON.stringify(smf.leathersUsed),
    });
  }
  if (Array.isArray(smf.amannThreadsUsed) && smf.amannThreadsUsed.length > 0) {
    metafields.push({
      ownerId: productId,
      namespace: "custom",
      key: "amann_threads_used",
      type: "list.metaobject_reference",
      value: JSON.stringify(smf.amannThreadsUsed),
    });
  }
  if (Array.isArray(smf.isacordThreadsUsed) && smf.isacordThreadsUsed.length > 0) {
    metafields.push({
      ownerId: productId,
      namespace: "custom",
      key: "isacord_threads_used",
      type: "list.metaobject_reference",
      value: JSON.stringify(smf.isacordThreadsUsed),
    });
  }
  if (isShopifyMetaobjectGid(smf.fontGid)) {
    metafields.push({
      ownerId: productId,
      namespace: "custom",
      key: "font",
      type: "metaobject_reference",
      value: smf.fontGid,
    });
  }
  if (Array.isArray(smf.shopifyColors) && smf.shopifyColors.length > 0) {
    metafields.push({
      ownerId: productId,
      namespace: "custom",
      key: "color",
      type: "list.metaobject_reference",
      value: JSON.stringify(smf.shopifyColors),
    });
  }

  const productShapeStyle = smf.productShapeStyleLists;
  if (productShapeStyle) {
    if (Array.isArray(productShapeStyle.shapeList) && productShapeStyle.shapeList.length > 0) {
      metafields.push({
        ownerId: productId,
        namespace: "custom",
        key: "shape",
        type: "list.metaobject_reference",
        value: JSON.stringify(productShapeStyle.shapeList),
      });
    }
    if (Array.isArray(productShapeStyle.styleList) && productShapeStyle.styleList.length > 0) {
      metafields.push({
        ownerId: productId,
        namespace: "custom",
        key: "style",
        type: "list.metaobject_reference",
        value: JSON.stringify(productShapeStyle.styleList),
      });
    }
  }

  const driveFolderUrl =
    typeof productData.googleDriveFolderUrl === "string"
      ? productData.googleDriveFolderUrl.trim()
      : "";
  if (driveFolderUrl) {
    metafields.push({
      ownerId: productId,
      namespace: "custom",
      key: "google_drive_images",
      type: "url",
      value: driveFolderUrl,
    });
  }

  const baseSkuMeta =
    (typeof productData.versionedBaseSku === "string"
      ? productData.versionedBaseSku.trim()
      : "") ||
    (typeof productDataVariants[0]?.baseSKU === "string"
      ? productDataVariants[0].baseSKU.trim()
      : "");
  if (baseSkuMeta) {
    metafields.push({
      ownerId: productId,
      namespace: "custom",
      key: "base_sku",
      type: "single_line_text_field",
      value: baseSkuMeta,
    });
  }

  for (let i = 0; i < productDataVariants.length; i++) {
    const pv = productDataVariants[i];
    const rv = resolvedVariantsByOrder[i];
    if (!rv?.id) continue;

    if (isShopifyMetaobjectGid(pv.shapeValue)) {
      metafields.push({
        ownerId: rv.id,
        namespace: "custom",
        key: "single_shape",
        type: "metaobject_reference",
        value: pv.shapeValue,
      });
    }
    if (isShopifyMetaobjectGid(pv.style?.value)) {
      metafields.push({
        ownerId: rv.id,
        namespace: "custom",
        key: "single_style",
        type: "metaobject_reference",
        value: pv.style.value,
      });
    }

    if (pv.isCustom) {
      metafields.push({
        ownerId: rv.id,
        namespace: "custom",
        key: "customizable",
        type: "boolean",
        value: "false",
      });
    } else {
      metafields.push({
        ownerId: rv.id,
        namespace: "custom",
        key: "customizable",
        type: "boolean",
        value: "true",
      });
      const customizeIdx = findCustomizeVariantIndexForBase(productDataVariants, i);
      const customizeId = customizeIdx >= 0 ? resolvedVariantsByOrder[customizeIdx]?.id : null;
      if (isShopifyProductVariantGid(customizeId)) {
        metafields.push({
          ownerId: rv.id,
          namespace: "custom",
          key: "customizable_variant_id",
          type: "variant_reference",
          value: customizeId,
        });
      }
    }
  }

  if (!metafields.length) return;

  for (const batch of chunkMetafieldsForSet(metafields)) {
    const response = await admin.graphql(METAFIELDS_SET_MUTATION, {
      variables: { metafields: batch },
    });
    const json = await response.json();
    if (json.errors?.length) {
      throw new Error(json.errors.map((e) => e.message).join("; "));
    }
    const userErrors = json?.data?.metafieldsSet?.userErrors ?? [];
    if (userErrors.length) {
      throw new Error(userErrors.map((e) => e.message).filter(Boolean).join("; "));
    }
  }
}

export async function fetchActiveProductsForCollection(admin, collectionId) {
  if (!admin?.graphql || !collectionId) return [];
  const out = [];
  let cursor = null;
  let hasNextPage = true;
  while (hasNextPage) {
    const response = await admin.graphql(COLLECTION_ACTIVE_PRODUCTS_QUERY, {
      variables: { id: collectionId, cursor },
    });
    const json = await response.json();
    if (json.errors?.length) {
      throw new Error(json.errors.map((e) => e.message).join("; "));
    }
    const conn = json?.data?.collection?.products;
    const nodes = conn?.nodes ?? [];
    for (const node of nodes) {
      if (node?.status !== "ACTIVE") continue;
      out.push({
        id: node.id,
        title: node.title,
        handle: node.handle,
        status: node.status,
        baseSku: String(node?.metafield?.value || "").trim() || null,
      });
    }
    hasNextPage = Boolean(conn?.pageInfo?.hasNextPage);
    cursor = conn?.pageInfo?.endCursor ?? null;
  }
  out.sort((a, b) => a.title.localeCompare(b.title));
  return out;
}

export async function fetchProductForUpdate(admin, productId) {
  if (!admin?.graphql || !productId) return null;
  let cursor = null;
  let product = null;
  let allVariants = [];
  let hasNextPage = true;
  while (hasNextPage) {
    const response = await admin.graphql(PRODUCT_FOR_UPDATE_QUERY, {
      variables: { id: productId, variantsCursor: cursor },
    });
    const json = await response.json();
    if (json.errors?.length) {
      throw new Error(json.errors.map((e) => e.message).join("; "));
    }
    product = json?.data?.product ?? null;
    if (!product) return null;
    const conn = product.variants;
    allVariants = allVariants.concat(conn?.nodes ?? []);
    hasNextPage = Boolean(conn?.pageInfo?.hasNextPage);
    cursor = conn?.pageInfo?.endCursor ?? null;
  }
  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    tags: Array.isArray(product.tags) ? product.tags : [],
    productType: product.productType || "",
    descriptionHtml: product.descriptionHtml || "",
    baseSku: String(product?.metafield?.value || "").trim() || null,
    googleDriveFolderUrl: String(product?.googleDriveFolder?.value || "").trim() || null,
    leathersUsed: parseJsonListMetafieldValue(product?.leathersUsed?.value),
    amannThreadsUsed: parseJsonListMetafieldValue(product?.amannThreadsUsed?.value),
    isacordThreadsUsed: parseJsonListMetafieldValue(product?.isacordThreadsUsed?.value),
    fontRef: String(product?.fontRef?.value || "").trim() || null,
    variants: allVariants.map((v) => ({
      id: v.id,
      title: v.title,
      sku: v.sku,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      inventoryQuantity: v.inventoryQuantity,
      selectedOptions: v.selectedOptions ?? [],
      singleShape: v.singleShape?.value ?? null,
      singleStyle: v.singleStyle?.value ?? null,
    })),
  };
}

export function buildSkuInfoFromProductBaseSku(baseSku) {
  return parseVersionedBaseSku(baseSku);
}

export async function updateShopifyProduct(admin, payload) {
  const {
    productId,
    existingProduct,
    productData,
    preserveExistingInventory = true,
    defaultNewVariantQuantity = 5,
  } = payload || {};
  if (!productId || !existingProduct || !productData) {
    throw new Error("Missing required payload for product update.");
  }

  const updateDescriptionResponse = await admin.graphql(
    PRODUCT_UPDATE_DESCRIPTION_MUTATION,
    {
      variables: {
        input: {
          id: productId,
          descriptionHtml: productData.descriptionHTML || "",
        },
      },
    }
  );
  const updateDescriptionJson = await updateDescriptionResponse.json();
  if (updateDescriptionJson.errors?.length) {
    throw new Error(updateDescriptionJson.errors.map((e) => e.message).join("; "));
  }
  const updateDescriptionErrors =
    updateDescriptionJson?.data?.productUpdate?.userErrors ?? [];
  if (updateDescriptionErrors.length) {
    throw new Error(updateDescriptionErrors.map((e) => e.message).join("; "));
  }

  const existingBySku = new Map(
    (existingProduct.variants ?? [])
      .filter((v) => typeof v?.sku === "string" && v.sku.trim())
      .map((v) => [v.sku.trim(), v])
  );
  const generated = Array.isArray(productData.variants) ? productData.variants : [];

  const variantsToCreate = [];
  const variantsToUpdate = [];
  const resolvedVariantsByOrder = [];
  const createdSkuToId = new Map();

  for (const row of generated) {
    const sku = String(row?.sku || "").trim();
    if (!sku) continue;
    const existing = existingBySku.get(sku);
    if (!existing) {
      variantsToCreate.push(row);
      continue;
    }
    resolvedVariantsByOrder.push({ sku, id: existing.id });
    const shouldUpdatePrice = priceValuesMatch(existing.price, existing.compareAtPrice);
    if (shouldUpdatePrice) {
      variantsToUpdate.push({
        id: existing.id,
        price: String(row.price),
        compareAtPrice: String(row.price),
      });
    }
    if (!preserveExistingInventory) {
      variantsToUpdate[variantsToUpdate.length - 1].inventoryQuantities = [
        {
          availableQuantity: Number(defaultNewVariantQuantity) || 5,
        },
      ];
    }
  }

  if (variantsToCreate.length > 0) {
    const createResponse = await admin.graphql(VARIANTS_BULK_CREATE_MUTATION, {
      variables: {
        productId,
        variants: variantsToCreate.map((variant) => ({
          price: String(variant.price),
          compareAtPrice: String(variant.price),
          taxable: true,
          inventoryPolicy: "CONTINUE",
          inventoryQuantities: [
            {
              availableQuantity: Number(defaultNewVariantQuantity) || 5,
            },
          ],
          inventoryItem: {
            cost: String(variant.price),
            tracked: true,
            requiresShipping: true,
            sku: variant.sku,
            measurement: {
              weight: {
                unit: "OUNCES",
                value: Number.parseFloat(variant.weight || "0") || 0,
              },
            },
          },
          optionValues: [
            {
              name: variant.variantName,
              optionName: "Shape",
            },
          ],
        })),
      },
    });
    const createJson = await createResponse.json();
    if (createJson.errors?.length) {
      throw new Error(createJson.errors.map((e) => e.message).join("; "));
    }
    const createErrors =
      createJson?.data?.productVariantsBulkCreate?.userErrors ?? [];
    if (createErrors.length) {
      throw new Error(createErrors.map((e) => e.message).join("; "));
    }
    const created = createJson?.data?.productVariantsBulkCreate?.productVariants ?? [];
    for (const row of created) {
      const sku = String(row?.sku || "").trim();
      if (sku && row?.id) createdSkuToId.set(sku, row.id);
    }
  }

  if (variantsToUpdate.length > 0) {
    const updateResponse = await admin.graphql(VARIANTS_BULK_UPDATE_MUTATION, {
      variables: {
        productId,
        variants: variantsToUpdate,
      },
    });
    const updateJson = await updateResponse.json();
    if (updateJson.errors?.length) {
      throw new Error(updateJson.errors.map((e) => e.message).join("; "));
    }
    const updateErrors =
      updateJson?.data?.productVariantsBulkUpdate?.userErrors ?? [];
    if (updateErrors.length) {
      throw new Error(updateErrors.map((e) => e.message).join("; "));
    }
  }

  for (const row of generated) {
    const sku = String(row?.sku || "").trim();
    if (!sku) continue;
    const existing = existingBySku.get(sku);
    const id = existing?.id || createdSkuToId.get(sku) || null;
    if (!id) continue;
    if (!resolvedVariantsByOrder.some((x) => x.sku === sku)) {
      resolvedVariantsByOrder.push({ sku, id });
    }
  }

  const bySkuResolved = new Map(resolvedVariantsByOrder.map((x) => [x.sku, x.id]));
  const orderedResolved = generated.map((v) => ({
    sku: v.sku,
    id: bySkuResolved.get(v.sku) || null,
  }));

  await setProductAndVariantMetafields(
    admin,
    productId,
    productData,
    orderedResolved
  );

  return {
    success: true,
    productId,
    createdVariantCount: variantsToCreate.length,
    updatedVariantCount: variantsToUpdate.length,
    skippedManualPriceCount: generated.filter((row) => {
      const existing = existingBySku.get(String(row?.sku || "").trim());
      if (!existing) return false;
      return !priceValuesMatch(existing.price, existing.compareAtPrice);
    }).length,
  };
}
