// 6. Publish to all publications (except GraphiQL App)
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const publishResults = [];
const filteredPublications = publicationsJson.data.publications.edges
  .filter(({ node }) => node.name !== 'Shopify GraphiQL App');

for (const { node: publication } of filteredPublications) {
  try {
    // Add a small delay between each publish operation
    await delay(500); // 500ms delay

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
    console.log(`Published to ${publication.name}:`, JSON.stringify(publishJson, null, 2));
    
    // Check for errors for this specific publication
    if (publishJson.data?.publishablePublish?.userErrors?.length > 0) {
      console.log(`Warning: Publication to ${publication.name} had errors:`, 
        JSON.stringify(publishJson.data.publishablePublish.userErrors, null, 2));
    }

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

// Check for any publish errors but continue with the process
const publishErrors = publishResults
  .filter(result => !result.success)
  .map(result => ({
    publication: result.publicationName,
    errors: result.result?.data?.publishablePublish?.userErrors || [{ message: result.error }]
  }));

if (publishErrors.length > 0) {
  console.warn('Some publications failed:', JSON.stringify(publishErrors, null, 2));
  // Note: We're not returning here, just logging the warning
}