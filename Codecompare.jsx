// 6. Publish to all publications (except GraphiQL App)
const publishResults = await Promise.all(
  publicationsJson.data.publications.edges
    .filter(({ node }) => node.name !== 'Shopify GraphiQL App') // Filter out GraphiQL App
    .map(async ({ node: publication }) => {
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
      console.log(`Published to ${publication.name}:`, publishJson);
      return {
        publicationName: publication.name,
        result: publishJson
      };
    })
);