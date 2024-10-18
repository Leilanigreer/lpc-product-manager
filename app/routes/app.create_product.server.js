import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const productData = Object.fromEntries(formData);

  // Parse JSON strings back into objects
  ['selectedStyles', 'weights'].forEach(key => {
    if (productData[key]) {
      productData[key] = JSON.parse(productData[key]);
    }
  });

  const response = await admin.graphql(
    `#graphql
    mutation createProduct($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          id
          title
          handle
          status
          variants(first: 10) {
            edges {
              node {
                id
                price
                sku
              }
            }
          }
        }
      }
    }`,
    {
      variables: {
        input: {
          title: productData.title,
          // Add other product fields here based on your formState
        },
      },
    }
  );

  const responseJson = await response.json();
  const product = responseJson.data.productCreate.product;

  // If you need to update variants, you can do so here
  // similar to the variantResponse in the original code

  return json({
    product: product,
    // Include variant data if you update it
  });
};