import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  InlineStack,
  Select,
  RadioButton,
  Box,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { useState } from "react";
import prisma from "../db.server";

async function getCollections(admin) {
  const COLLECTION_QUERY = `
  query {
    collections(first: 20) {
      edges {
        node {
          id
          title
          handle
        }
      }
    }
  }
`; 

  try {
    const response = await admin.graphql(COLLECTION_QUERY);
    const responseJson = await response.json();

    console.log('Full GraphQL response:', JSON.stringify(responseJson, null, 2));

    if (responseJson.data && responseJson.data.collections && responseJson.data.collections.edges) {
      return responseJson.data.collections.edges.map(({ node }) => ({
        value: node.id,
        label: node.title,
        handle: node.handle
      }));
    } else {
      console.error('Unexpected response structure:', responseJson);
      throw new Error('Unexpected response structure from Shopify API');
    }
  } catch (error) {
    console.error("Error fetching Shopify collections:", error);
    throw error;
  }
}

async function getLeatherColors() {
  try {
    const leatherColors = await prisma.leatherColor.findMany();
    return leatherColors.map(color => ({
      value: color.id, 
      label:color.name,
      abbreviation: color.abbreviation, 
      image_url: color.image_url
    }));
  } catch (error) {
    console.error("Error fetching leather colors:", error);
    throw error;
  }
}

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  
  try {
    const [collections, leatherColors] = await Promise.all([
      getCollections(admin),
      getLeatherColors()
    ]);
    return json({ collections, leatherColors });
  } catch (error) {
    console.error('Loader error:', error);
    return json({ error: error.message }, { status: 500 });
  }
};

export default function CreateProduct() {
  const { collections, leatherColors, error } = useLoaderData();
  const [selectedCollection, setSelectedCollection] = useState("");
  const [selectedOfferingType, setSelectedOfferingType] = useState("");
  const [selectedLeatherColor1, setSelectedLeatherColor1] = useState("");
  const [selectedLeatherColor2, setSelectedLeatherColor2] = useState("");

  const handleSelectChange = (value) => {
    setSelectedCollection(value);
  };

  const handleRadioChange = (newValue) => {
    setSelectedOfferingType(newValue);
  };

  const handleLeatherColor1Change = (value) => {
    setSelectedLeatherColor1(value)
  };

  const handleLeatherColor2Change = (value) => {
    setSelectedLeatherColor2(value)
  };

  const isTwoLeatherCollection = () => {
    const twoLeatherCollections = ["animal print", "quilted classic"];
    const selectedCollectionObj = collections.find(collection => collection.value === selectedCollection);
    return selectedCollectionObj && twoLeatherCollections.includes(selectedCollectionObj.label.toLowerCase());
  };

  const leatherColorOptions = [
    {label: "Select a Color", value: ""},
    ...leatherColors
  ];

  if (error) {
    return <div>Error {error} </div>;
  };

  return (
    <Page>
      <TitleBar title="Create a new product" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Create Product Page
              </Text>
              <Text as="p" variant="bodyMd">
                Hello, this is a test. Here you can add your product creation form or logic.
              </Text>
              <BlockStack gap="400">
                <InlineStack gap="400" align="start">
                  <RadioButton
                    label="Customizable"
                    checked={selectedOfferingType === 'customizable'}
                    id="customizable"
                    name="productType"
                    onChange={(checked) => handleRadioChange('customizable')}
                  />
                  <RadioButton
                    label="Limited Edition"
                    checked={selectedOfferingType === 'limitedEdition'}
                    id="limitedEdition"
                    name="productType"
                    onChange={(checked) => handleRadioChange('limitedEdition')}
                  />
                </InlineStack>
                <Box>
                  <Select
                    label="Select a collection"
                    options={collections}
                    onChange={handleSelectChange}
                    value={selectedCollection}
                  />
                </Box>
                <InlineStack gap="1000" align="start">
                  <Box>
                    <Select
                    label="Select leather"
                    options={leatherColorOptions}
                    onChange={handleLeatherColor1Change}
                    value={selectedLeatherColor1}
                    />
                  </Box>
                  {isTwoLeatherCollection() && ( 
                  <Box>
                    <Select
                    label="Select secondary leather"
                    options={leatherColorOptions}
                    onChange={handleLeatherColor2Change}
                    value={selectedLeatherColor2}
                    />
                  </Box>
                  )}
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}