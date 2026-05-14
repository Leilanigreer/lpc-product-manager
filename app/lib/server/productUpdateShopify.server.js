import {
  isShopifyMetaobjectGid,
  isShopifyProductVariantGid,
} from "../utils/shopifyGid.js";
import {
  priceValuesMatch,
  productHasVariantPriceMismatch,
} from "../utils/priceUtils.js";
import {
  buildExistingVariantReconcileIndex,
  resolveExistingVariantForUpdateRow,
} from "../utils/variantReconcileUtils.js";
import { shapeDisplayNameFromLoadedVariant } from "../utils/updatePreviewUtils.js";

/** Thrown when Shopify returns userErrors from bulk variant or metafield mutations (includes `details` for UI). */
export class ProductUpdateUserError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = "ProductUpdateUserError";
    this.details = Array.isArray(details) ? details : [];
  }
}

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
      oldSkusUsed: metafield(namespace: "custom", key: "old_skus") { value }
      googleDriveFolder: metafield(namespace: "custom", key: "google_drive_images") { value }
      leathersUsed: metafield(namespace: "custom", key: "leathers_used") { value }
      amannThreadsUsed: metafield(namespace: "custom", key: "amann_threads_used") { value }
      isacordThreadsUsed: metafield(namespace: "custom", key: "isacord_threads_used") { value }
      fontRef: metafield(namespace: "custom", key: "font") { value }
      options {
        id
        name
        optionValues {
          id
          name
        }
      }
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
          customizable: metafield(namespace: "custom", key: "customizable") { value }
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

const PRODUCT_OPTION_UPDATE_MUTATION = `#graphql
  mutation ProductOptionUpdate(
    $productId: ID!
    $option: OptionUpdateInput!
    $optionValuesToAdd: [OptionValueCreateInput!]
    $optionValuesToUpdate: [OptionValueUpdateInput!]
  ) {
    productOptionUpdate(
      productId: $productId
      option: $option
      optionValuesToAdd: $optionValuesToAdd
      optionValuesToUpdate: $optionValuesToUpdate
    ) {
      product {
        id
      }
      userErrors {
        field
        message
        code
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

const PRIMARY_STORE_LOCATION = {
  address1: "550 Montgomery Street",
  city: "San Francisco",
};

async function getPrimaryStoreLocationId(admin) {
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

function parseMetafieldBoolean(raw) {
  if (raw === true || raw === "true" || raw === 1 || raw === "1") return true;
  if (raw === false || raw === "false" || raw === 0 || raw === "0") return false;
  return null;
}

/** `customizable` true = base variant; false = custom (+$15) variant */
function variantIsCustomShopify(v) {
  const b = parseMetafieldBoolean(v?.customizable);
  if (b === false) return true;
  if (b === true) return false;
  return String(v?.sku || "")
    .toLowerCase()
    .includes("-custom");
}

function normalizeVariantDisplayName(name) {
  const s = String(name || "").trim();
  return s.replace(/^Customize\b/, "Customized");
}

function findShapeProductOption(options, variants) {
  const list = Array.isArray(options) ? options : [];
  const byShapeName = list.find(
    (option) => String(option?.name || "").toLowerCase() === "shape"
  );
  if (byShapeName?.id) return byShapeName;

  if (list.length === 1 && list[0]?.id) return list[0];

  const optionNameCounts = new Map();
  for (const variant of variants || []) {
    for (const selected of variant?.selectedOptions || []) {
      const name = String(selected?.name || "").trim();
      if (!name) continue;
      optionNameCounts.set(name, (optionNameCounts.get(name) || 0) + 1);
    }
  }
  if (!optionNameCounts.size) return null;

  const [topOptionName] = [...optionNameCounts.entries()].sort(
    (a, b) => b[1] - a[1]
  )[0];
  return list.find((option) => option?.name === topOptionName) || null;
}

function buildShapeOptionValueNameIndex(shapeOption) {
  const byName = new Map();
  for (const optionValue of shapeOption?.optionValues || []) {
    const name = String(optionValue?.name || "").trim();
    if (name && optionValue?.id) {
      byName.set(name, optionValue.id);
    }
  }
  return byName;
}

async function fetchProductShapeOptions(admin, productId) {
  const response = await admin.graphql(
    `#graphql
      query ProductShapeOptionState($id: ID!) {
        product(id: $id) {
          id
          options {
            id
            name
            optionValues {
              id
              name
            }
          }
        }
      }
    `,
    { variables: { id: productId } }
  );
  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  return json?.data?.product?.options ?? [];
}

async function syncShapeOptionValues(admin, productId, shapeOption, payload) {
  const optionValuesToUpdate = Array.isArray(payload?.optionValuesToUpdate)
    ? payload.optionValuesToUpdate
    : [];
  const optionValuesToAdd = Array.isArray(payload?.optionValuesToAdd)
    ? payload.optionValuesToAdd
    : [];

  if (!optionValuesToUpdate.length && !optionValuesToAdd.length) {
    return;
  }
  if (!shapeOption?.id) {
    throw new Error("Product is missing a Shape option; cannot sync variant display names.");
  }

  const response = await admin.graphql(PRODUCT_OPTION_UPDATE_MUTATION, {
    variables: {
      productId,
      option: { id: shapeOption.id },
      optionValuesToUpdate: optionValuesToUpdate.length
        ? optionValuesToUpdate
        : undefined,
      optionValuesToAdd: optionValuesToAdd.length
        ? optionValuesToAdd.map((name) => ({ name }))
        : undefined,
    },
  });
  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  const userErrors = json?.data?.productOptionUpdate?.userErrors ?? [];
  const blockingErrors = userErrors.filter(
    (error) => error?.code !== "OPTION_VALUE_ALREADY_EXISTS"
  );
  if (blockingErrors.length) {
    throw new ProductUpdateUserError(
      blockingErrors.map((e) => e.message).filter(Boolean).join("; ") ||
        "Shape option update failed.",
      blockingErrors
    );
  }
}

function buildVariantShapeOptionValueInput(variantName, shapeOption, valueIdByName) {
  const name = String(variantName || "").trim();
  const optionId = shapeOption?.id;
  if (!name || !optionId) {
    throw new Error("Missing Shape option metadata for variant create.");
  }
  const valueId = valueIdByName.get(name);
  if (valueId) {
    return { id: valueId, optionId };
  }
  return { name, optionId };
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

  if (productData.migrateBaseSkuToOldSkus) {
    const previousMaster = String(productData.previousListingBaseSku || "").trim();
    const existingOld = String(productData.existingOldSkusRaw || "").trim();
    if (previousMaster && previousMaster !== baseSkuMeta) {
      const lines = existingOld
        ? existingOld.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
        : [];
      if (!lines.includes(previousMaster)) {
        lines.push(previousMaster);
      }
      metafields.push({
        ownerId: productId,
        namespace: "custom",
        key: "old_skus",
        type: "single_line_text_field",
        value: lines.join("\n"),
      });
    }
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
      throw new ProductUpdateUserError(
        userErrors.map((e) => e.message).filter(Boolean).join("; "),
        userErrors
      );
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
      const baseSku = String(node?.metafield?.value || "").trim() || null;
      // Art-line products: deferred dedicated update flow (see plan future-art-collection).
      if (baseSku && baseSku.startsWith("Art")) continue;
      out.push({
        id: node.id,
        title: node.title,
        handle: node.handle,
        status: node.status,
        baseSku,
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
  const variants = allVariants.map((v) => {
    const customizableRaw = v.customizable?.value ?? null;
    return {
      id: v.id,
      title: v.title,
      sku: v.sku,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      inventoryQuantity: v.inventoryQuantity,
      selectedOptions: v.selectedOptions ?? [],
      singleShape: v.singleShape?.value ?? null,
      singleStyle: v.singleStyle?.value ?? null,
      customizable: customizableRaw,
      /** True only when `customizable` metafield is explicitly true (base / non-custom row). */
      isBaseVariant: parseMetafieldBoolean(customizableRaw) === true,
    };
  });
  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    tags: Array.isArray(product.tags) ? product.tags : [],
    productType: product.productType || "",
    descriptionHtml: product.descriptionHtml || "",
    options: (product.options || []).map((option) => ({
      id: option.id,
      name: option.name,
      optionValues: (option.optionValues || []).map((value) => ({
        id: value.id,
        name: value.name,
      })),
    })),
    baseSku: String(product?.metafield?.value || "").trim() || null,
    oldSkusUsed: String(product?.oldSkusUsed?.value || "").trim() || null,
    googleDriveFolderUrl: String(product?.googleDriveFolder?.value || "").trim() || null,
    leathersUsed: parseJsonListMetafieldValue(product?.leathersUsed?.value),
    amannThreadsUsed: parseJsonListMetafieldValue(product?.amannThreadsUsed?.value),
    isacordThreadsUsed: parseJsonListMetafieldValue(product?.isacordThreadsUsed?.value),
    fontRef: String(product?.fontRef?.value || "").trim() || null,
    variants,
    hasVariantPriceMismatch: productHasVariantPriceMismatch(variants),
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

  const masterSku = String(existingProduct.baseSku || "").trim();
  if (!masterSku) {
    throw new Error(
      "Product is missing custom.base_sku; cannot reconcile variants safely."
    );
  }
  if (masterSku.startsWith("Art")) {
    throw new Error(
      "Art-line products are not supported in Update existing product yet."
    );
  }

  // Mallet / sizing_guide_group: update never deletes variants. Preview generation expands
  // sibling shapes in the same sizing_guide_group; reconcile only bulk-creates missing SKUs.

  const existingVariants = Array.isArray(existingProduct.variants)
    ? existingProduct.variants
    : [];
  const reconcileIndex = buildExistingVariantReconcileIndex(
    existingVariants,
    masterSku,
    variantIsCustomShopify
  );

  const generated = Array.isArray(productData.variants) ? productData.variants : [];

  const resolveExistingForRow = (row, claimedIds) =>
    resolveExistingVariantForUpdateRow(row, reconcileIndex, claimedIds);

  const claimedExistingIds = new Set();
  for (const row of generated) {
    const ex = resolveExistingForRow(row, claimedExistingIds);
    if (!ex) continue;
    if (claimedExistingIds.has(ex.id)) {
      throw new Error(
        "Variant reconciliation conflict: multiple generated rows map to the same Shopify variant."
      );
    }
    claimedExistingIds.add(ex.id);
  }

  const hasVariantPriceMismatch = productHasVariantPriceMismatch(existingVariants);
  if (hasVariantPriceMismatch) {
    for (const row of generated) {
      const sku = String(row?.sku || "").trim();
      const variantName = normalizeVariantDisplayName(row?.variantName ?? "");
      if (!sku || !variantName) continue;
      if (!resolveExistingForRow(row)) {
        throw new ProductUpdateUserError(
          "This product has variants where Price and Compare-at price differ (sale or manual pricing). Fix every variant in Shopify before adding new variants. Set Price and Compare-at to the same value for each variant, or clear Compare-at.",
          []
        );
      }
    }
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

  const variantsToCreate = [];
  const variantsToUpdate = [];
  const createdSkuToId = new Map();
  const optionValuesToUpdate = [];
  const optionValuesToAdd = [];

  let productOptions = await fetchProductShapeOptions(admin, productId);
  if (!productOptions.length && Array.isArray(existingProduct.options)) {
    productOptions = existingProduct.options;
  }

  let shapeOption = findShapeProductOption(productOptions, existingVariants);
  let optionValueIdByName = buildShapeOptionValueNameIndex(shapeOption);

  const queueShapeOptionValueAdd = (name) => {
    const normalized = String(name || "").trim();
    if (!normalized || optionValueIdByName.has(normalized)) return;
    optionValuesToAdd.push(normalized);
    optionValueIdByName.set(normalized, null);
  };

  const queueShapeOptionValueRename = (currentName, newName) => {
    const from = String(currentName || "").trim();
    const to = String(newName || "").trim();
    if (!from || !to || from === to) return;
    const valueId = optionValueIdByName.get(from);
    if (!valueId) {
      queueShapeOptionValueAdd(to);
      return;
    }
    optionValuesToUpdate.push({ id: valueId, name: to });
    optionValueIdByName.delete(from);
    optionValueIdByName.set(to, valueId);
  };

  for (const row of generated) {
    const sku = String(row?.sku || "").trim();
    const variantName = normalizeVariantDisplayName(row?.variantName ?? "");
    if (!sku || !variantName) continue;

    const existing = resolveExistingForRow(row);
    if (!existing) {
      variantsToCreate.push({ ...row, variantName });
      queueShapeOptionValueAdd(variantName);
      continue;
    }

    const currentName = shapeDisplayNameFromLoadedVariant(existing);
    if (currentName !== variantName) {
      queueShapeOptionValueRename(currentName, variantName);
    }

    const manualPrice = !priceValuesMatch(existing.price, existing.compareAtPrice);

    const updateInput = {
      id: existing.id,
    };
    let needsBulkUpdate = false;

    if (!manualPrice) {
      needsBulkUpdate = true;
      updateInput.inventoryItem = { sku };
      updateInput.price = String(row.price);
      updateInput.compareAtPrice = String(row.price);
    }

    if (!preserveExistingInventory && !manualPrice) {
      updateInput.inventoryQuantities = [
        {
          availableQuantity: Number(defaultNewVariantQuantity) || 5,
        },
      ];
    }

    if (needsBulkUpdate) {
      variantsToUpdate.push(updateInput);
    }
  }

  await syncShapeOptionValues(admin, productId, shapeOption, {
    optionValuesToUpdate,
    optionValuesToAdd,
  });

  productOptions = await fetchProductShapeOptions(admin, productId);
  shapeOption = findShapeProductOption(productOptions, existingVariants);
  optionValueIdByName = buildShapeOptionValueNameIndex(shapeOption);
  if (!shapeOption?.id) {
    throw new Error("Product is missing a Shape option; cannot update variants.");
  }

  const setInventoryOnUpdate = !preserveExistingInventory;
  let locationId = null;
  if (variantsToCreate.length > 0 || setInventoryOnUpdate) {
    locationId = await getPrimaryStoreLocationId(admin);
  }

  if (setInventoryOnUpdate && locationId) {
    for (const variant of variantsToUpdate) {
      for (const quantity of variant.inventoryQuantities || []) {
        quantity.locationId = locationId;
      }
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
              locationId,
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
            buildVariantShapeOptionValueInput(
              variant.variantName,
              shapeOption,
              optionValueIdByName
            ),
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
      throw new ProductUpdateUserError(
        createErrors.map((e) => e.message).filter(Boolean).join("; ") ||
          "Variant create failed.",
        createErrors
      );
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
      throw new ProductUpdateUserError(
        updateErrors.map((e) => e.message).filter(Boolean).join("; ") ||
          "Variant update failed.",
        updateErrors
      );
    }
  }

  const orderedResolved = generated.map((row) => {
    const sku = String(row?.sku || "").trim();
    const variantName = normalizeVariantDisplayName(row?.variantName ?? "");
    if (!sku || !variantName) return { sku: sku || null, id: null };
    const ex = resolveExistingForRow(row);
    if (ex?.id) return { sku, id: ex.id };
    return { sku, id: createdSkuToId.get(sku) || null };
  });

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
      const ex = resolveExistingForRow(row);
      if (!ex) return false;
      return !priceValuesMatch(ex.price, ex.compareAtPrice);
    }).length,
  };
}
