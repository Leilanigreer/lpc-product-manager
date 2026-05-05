// app/lib/server/shopifyOperations.server.js
/**
 * Creates a product in Shopify with all necessary operations
 * @param {Object} admin - Shopify admin API client
 * @param {Object} productData - Generated product data
 * @returns {Promise<Object>} Complete Shopify response with all product data
 *
 * Metafields (after variants exist, via one or more `metafieldsSet` calls, chunked to 25 inputs each):
 * - Product `custom.leathers_used` — list.metaobject_reference (leather_color GIDs).
 * - Product `custom.amann_threads_used` — list (amann_number GIDs from stitching selections).
 * - Product `custom.isacord_threads_used` — list (isacord_number GIDs from embroidery selections).
 * - Product `custom.font` — single metaobject_reference (font), when set.
 * - Product `custom.color` — list (shopify--color-pattern GIDs from leather rows’ `colorMetaobjectIds`).
 * - Product `custom.shape` / `custom.style` — lists only when exactly **one** variant is generated
 *   (`shopifyProductMetafields.productShapeStyleLists`); otherwise omitted.
 *   TODO: Re-evaluate with Limited Edition / Artisan collection work — logic may need to change.
 * - Product `custom.google_drive_images` — same folder URL as creation email (`productData.googleDriveFolderUrl`);
 *   type `url` in Admin (omit when no folder URL yet).
 * - Variant `custom.single_shape` / `custom.single_style`: single metaobject_reference per variant.
 * - Variant `custom.customizable` (boolean); `custom.customizable_variant_id` (variant_reference) on
 *   base variants. Wood pairing uses `customizeRepresentativeShapeValue` on base woods — see
 *   `buildWoodBaseToRepresentativeShapeValueMap` / `woodCollapseColorDesignationsMatch`.
 * - Product `custom.base_sku` — versioned base SKU (from first generated variant’s `baseSKU`), for
 *   Admin versioning / `fetchCollectionBaseSkusForVersioning`.
 *
 * Product images: **no automatic media** on create. Importing a URL via `productUpdate` media
 * (`originalSource`) creates a **new** Shopify file each time — including a static CDN placeholder.
 * That URL-import shape of `CreateMediaInput` does **not** accept an existing `MediaImage` / file GID.
 * Reusing an asset without re-importing usually means Admin UI, duplicate product, theme placeholders,
 * or exploring Shopify’s Files / media APIs for referencing stored assets (not wired here).
 */

import {
  isShopifyMetaobjectGid,
  isShopifyProductVariantGid,
} from "../utils/shopifyGid.js";

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

/** Admin API: `metafieldsSet` rejects more than 25 inputs per call. */
const METAFIELDS_SET_INPUT_LIMIT = 25;

function chunkMetafieldsForSet(metafields) {
  const chunks = [];
  for (let i = 0; i < metafields.length; i += METAFIELDS_SET_INPUT_LIMIT) {
    chunks.push(metafields.slice(i, i + METAFIELDS_SET_INPUT_LIMIT));
  }
  return chunks;
}

/** Same shape + style + color designation (non-wood one-to-one pairs). */
function variantPairingKey(v) {
  if (!v) return "";
  return [
    v.shapeValue ?? "",
    v.style?.value ?? "",
    v.colorDesignation?.value ?? "",
  ].join("|");
}

/**
 * Base variant index → customize variant index (`isCustom === true`).
 * Wood: match the custom row whose `shapeValue` equals the base’s
 * `customizeRepresentativeShapeValue` (set in `generateVariants` to mirror `createCustomVariants`).
 * Other shapes: match full `variantPairingKey` (shape + style + color).
 * @returns {number}
 */
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

/**
 * @param {string} productId
 * @param {object} productData - Includes `variants` and `shopifyProductMetafields` from `generateProductData`
 * @param {{ id: string }[]} createdVariants - Same order as bulk create
 */
async function setProductAndVariantMetafields(
  admin,
  productId,
  productData,
  createdVariants
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
    if (
      Array.isArray(productShapeStyle.shapeList) &&
      productShapeStyle.shapeList.length > 0
    ) {
      metafields.push({
        ownerId: productId,
        namespace: "custom",
        key: "shape",
        type: "list.metaobject_reference",
        value: JSON.stringify(productShapeStyle.shapeList),
      });
    }
    if (
      Array.isArray(productShapeStyle.styleList) &&
      productShapeStyle.styleList.length > 0
    ) {
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

  const firstPv = productDataVariants[0];
  const baseSkuMeta =
    typeof firstPv?.baseSKU === "string" ? firstPv.baseSKU.trim() : "";
  if (baseSkuMeta) {
    metafields.push({
      ownerId: productId,
      namespace: "custom",
      key: "base_sku",
      type: "single_line_text_field",
      value: baseSkuMeta,
    });
  }

  const list = Array.isArray(createdVariants) ? createdVariants : [];
  const n = Math.min(productDataVariants.length, list.length);
  if (productDataVariants.length !== list.length) {
    console.warn(
      "[createShopifyProduct] Variant count mismatch for shape/style metafields:",
      { generated: productDataVariants.length, created: list.length }
    );
  }

  for (let i = 0; i < n; i++) {
    const pv = productDataVariants[i];
    const cv = list[i];
    if (!cv?.id) continue;

    if (isShopifyMetaobjectGid(pv.shapeValue)) {
      metafields.push({
        ownerId: cv.id,
        namespace: "custom",
        key: "single_shape",
        type: "metaobject_reference",
        value: pv.shapeValue,
      });
    }

    if (isShopifyMetaobjectGid(pv.style?.value)) {
      metafields.push({
        ownerId: cv.id,
        namespace: "custom",
        key: "single_style",
        type: "metaobject_reference",
        value: pv.style.value,
      });
    }

    if (pv.isCustom) {
      metafields.push({
        ownerId: cv.id,
        namespace: "custom",
        key: "customizable",
        type: "boolean",
        value: "false",
      });
    } else {
      metafields.push({
        ownerId: cv.id,
        namespace: "custom",
        key: "customizable",
        type: "boolean",
        value: "true",
      });
      const customizeIdx = findCustomizeVariantIndexForBase(
        productDataVariants,
        i
      );
      const customizeGid =
        customizeIdx >= 0 ? list[customizeIdx]?.id : null;
      if (isShopifyProductVariantGid(customizeGid)) {
        metafields.push({
          ownerId: cv.id,
          namespace: "custom",
          key: "customizable_variant_id",
          type: "variant_reference",
          value: customizeGid,
        });
      }
    }
  }

  if (metafields.length === 0) return;

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
      const messages = userErrors.map((e) => e.message).filter(Boolean);
      if (messages.length) throw new Error(messages.join("; "));
    }
  }
}

export const createShopifyProduct = async (admin, productData) => {
  try {
    // 1. Get shop data
    const shopResponce = await admin.graphql(`
      query {
        shop {
          myshopifyDomain
          primaryDomain {
            host
          }
        }
      }
    `);

    const shopJson = await shopResponce.json();

    if (!shopJson.data?.shop) {
      throw new Error("No shop data found");
    }

    const shopData = {
      myshopifyDomain: shopJson.data.shop.myshopifyDomain,
      host: shopJson.data.shop.primaryDomain.host
    };

    // 2. Get Publications
    const publicationsResponse = await admin.graphql(`#graphql
      query Publications {
        publications(first: 15) {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    `);

    const publicationsJson = await publicationsResponse.json();

    if (!publicationsJson.data?.publications?.edges?.length) {
      throw new Error("No publications found");
    }

    // 3. Get location ID
    const locationResponse = await admin.graphql(`#graphql
      query {
        locations(first: 10) {
          edges {
            node {
              id
              name
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
    const location = locationJson.data.locations.edges.find(
      ({ node }) =>
        node.address.address1 === "550 Montgomery Street" &&
        node.address.city === "San Francisco"
    );

    if (!location) {
      throw new Error("Store location not found");
    }

    const locationId = location.node.id;

    // 4. Create product with options
    const productResponse = await admin.graphql(`#graphql
      mutation createProductWithOptions($productInput: ProductInput!) {
        productCreate(input: $productInput) {
          product {
            id
            title
            description
            options {
              id
              name
              position
              optionValues {
                id
                name
                hasVariants
              }
            }
            variants(first: 250) {
              edges {
                node {
                  id
                  title
                  price
                  sku
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          productInput: {
            title: productData.title,
            handle: productData.mainHandle,
            productType: productData.productType,
            vendor: 'Little Prince Customs',
            descriptionHtml: productData.descriptionHTML,
            tags: productData.tags,
            status: "ACTIVE",
            category: "gid://shopify/TaxonomyCategory/sg-4-7-7-2",
            seo: {
              title: productData.seoTitle,
              // description: productData.descriptionHTML,
            },
            productOptions: [
              {
                name: "Shape",
                values: [...new Set(productData.variants.map(variant => variant.variantName))].map(name => ({
                  name: name
                }))
              }
            ]
          }
        }
      }
    );

    const productJson = await productResponse.json();

    if (productJson.data?.productCreate?.userErrors?.length > 0) {
      console.error('Product Creation Errors:', productJson.data.productCreate.userErrors);
      throw new Error(productJson.data.productCreate.userErrors.map(e => e.message).join(', '));
    }

    // 5. Create variants
    const variantsResponse = await admin.graphql(`#graphql
      mutation productVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkCreate(
          productId: $productId, 
          strategy: REMOVE_STANDALONE_VARIANT,
          variants: $variants
        ) {
          product {
            id
            title
            variants(first: 250) {
              edges {
                node {
                  id
                  title
                  price
                  inventoryItem {
                    id
                    tracked
                    requiresShipping
                    sku
                  }
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
          }
          productVariants {
            id
            title
            price
            selectedOptions {
              name
              value
            }
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          productId: productJson.data.productCreate.product.id,
          strategy: "REMOVE_STANDALONE_VARIANT",
          variants: productData.variants.map(variant => ({
            price: variant.price,
            compareAtPrice: variant.price,
            taxable: true,
            inventoryPolicy: "CONTINUE",
            inventoryQuantities: [
              {
                availableQuantity: 5,
                locationId: locationId
              }
            ],
            inventoryItem: {
              cost: variant.price,
              tracked: true,
              requiresShipping: true,
              sku: variant.sku,
              measurement: {
                weight: {
                  unit: "OUNCES",
                  // value: parseFloat(variant.weight),
                  value: parseFloat(variant.weight || "0") || 0,
                },
              },
            },
            optionValues: [
              {
                name: variant.variantName,
                optionName: "Shape"
              }
            ]
          }))
        }
      }
    );

    const variantsJson = await variantsResponse.json();

    if (variantsJson.data?.productVariantsBulkCreate?.userErrors?.length > 0) {
      console.error('Variant Creation Errors:', variantsJson.data.productVariantsBulkCreate.userErrors);
      throw new Error(variantsJson.data.productVariantsBulkCreate.userErrors.map(e => e.message).join(', '));
    }

    const bulkCreate = variantsJson.data.productVariantsBulkCreate;
    const createdVariantNodes =
      bulkCreate?.productVariants?.length > 0
        ? bulkCreate.productVariants
        : (bulkCreate?.product?.variants?.edges ?? []).map(({ node }) => node);

    await setProductAndVariantMetafields(
      admin,
      productJson.data.productCreate.product.id,
      productData,
      createdVariantNodes
    );

    // 6. Product media: intentionally omitted — see file header (avoid duplicate Files + no “attach by gid” API).

    // 7. Publish to all publications
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
    const publishResults = [];
    const filteredPublications = publicationsJson.data.publications.edges;

    for (const { node: publication } of filteredPublications) {
      try {
        await delay(500); // 500ms delay between publish operations

        const publishResponse = await admin.graphql(`#graphql
          mutation PublishProduct($id: ID!, $publicationId: ID!) {
            publishablePublish(
              id: $id
              input: { publicationId: $publicationId }
            ) {
              publishable {
                ... on Product {
                  id
                }
              }
              userErrors {
                field
                message
              }
            }
          }`,
          {
            variables: {
              id: productJson.data.productCreate.product.id,
              publicationId: publication.id
            }
          }
        );

        const publishJson = await publishResponse.json();

        publishResults.push({
          publicationName: publication.name,
          result: publishJson,
          success: !publishJson.data?.publishablePublish?.userErrors?.length
        });

      } catch (error) {
        console.error(`Error publishing to ${publication.name}:`, error);
        publishResults.push({
          publicationName: publication.name,
          error: error.message,
          success: false
        });
      }
    }

    // Return all the data needed by the client
    return {
      product: productJson.data.productCreate.product,
      variants: variantsJson.data.productVariantsBulkCreate.product.variants.edges.map(({ node }) => ({
        id: node.id,
        title: node.title,
        price: node.price,
        sku: node.inventoryItem?.sku,
        inventoryItem: {
          id: node.inventoryItem?.id || "",
          tracked: node.inventoryItem?.tracked || false,
          sku: node.inventoryItem?.sku || ""
        },
        selectedOptions: node.selectedOptions
      })),
      media: null,
      publications: publishResults,
      shop: shopData
    };

  } catch (error) {
    console.error('Shopify operation error:', error);
    throw error;
  }
};