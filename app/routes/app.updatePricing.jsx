import React, { useCallback, useMemo, useState } from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import { json } from "@remix-run/node";
import { loader as dataLoader } from "../lib/loaders";
import { authenticate } from "../shopify.server";
import { Page, Layout, InlineStack, Text, Card, Select } from "@shopify/polaris";



export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  // Get data from our data loader
  return dataLoader({ request });
};

export const action = async ({ request }) => {
  await authenticate.admin(request);
  
  // Temporarily disabled for testing form
  return json({ success: true });
};

export default function UpdatePricing () {
  const {
    shopifyCollections,
    shapes,
  } = useLoaderData();

  const collectionOptions = useMemo(() => [
    { label: 'Select a collection ...', value: '' },
    ...(shopifyCollections
      ?.filter(c => c.showInDropdown)
      ?.map(collection => ({
        label: collection.label,
        value: collection.value
      })) || []
    )
  ], [shopifyCollections]);

  const handleCollectionChange = useCallback(
    
  )
  return (
    <Page>
      <TitleBar title="Updated Collection Pricing" />
      <Layout>
        <Card>
          <InlineStack>
            <Text>
              Hello World
              <Select
              label="Select a collection"
              options={collectionOptions}
              />                
            </Text>
          </InlineStack>
        </Card>
      </Layout>
    </Page>
  );
}