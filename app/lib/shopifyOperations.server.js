// app/lib/shopifyOperations.server.js
/**
 * Creates a product in Shopify with all necessary operations
 * @param {Object} admin - Shopify admin API client
 * @param {Object} productData - Generated product data
 * @returns {Promise<Object>} Complete Shopify response with all product data
 */
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
              description: productData.descriptionHTML,
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
                  value: parseFloat(variant.weight)
                }
              }
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

    // 6. Add default image
    const mediaResponse = await admin.graphql(`#graphql
      mutation UpdateProductWithNewMedia($input: ProductInput!, $media: [CreateMediaInput!]) {
        productUpdate(input: $input, media: $media) {
          product {
            id
            media(first: 10) {
              nodes {
                alt
                mediaContentType
                preview {
                  status
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
          input: {
            id: productJson.data.productCreate.product.id
          },
          media: [
            {
              originalSource: "https://cdn.shopify.com/s/files/1/0690/4414/2359/files/Placeholder_new_product.png?v=1730926173",
              alt: "Pictures of new headcovers coming soon.",
              mediaContentType: "IMAGE"
            }
          ]
        }
      }
    );

    const mediaJson = await mediaResponse.json();

    if (mediaJson.data?.productUpdate?.userErrors?.length > 0) {
      console.error('Media Update Errors:', mediaJson.data.productUpdate.userErrors);
      return Response.json({ errors: ["No image saved"] }, { status: 422 });
}

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
      media: mediaJson.data.productUpdate.product.media,
      publications: publishResults,
      shop: shopData
    };

  } catch (error) {
    console.error('Shopify operation error:', error);
    throw error;
  }
};