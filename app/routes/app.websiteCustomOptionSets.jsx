import { useState } from "react";
import { useLoaderData, useNavigate, Outlet } from "@remix-run/react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { TitleBar } from "@shopify/app-bridge-react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  Box,
  Banner,
  Button,
  ButtonGroup,
  Select,
} from "@shopify/polaris";

import { OptionSet } from "../components/webSiteCustomOptions/OptionSet";
import { Option } from "../components/webSiteCustomOptions/Option";
import { Rule } from "../components/webSiteCustomOptions/Rule";
import { getOptionTypeChoices } from "../lib/utils/optionTypeMapping";

// Expanded GraphQL query to include collections
const SHOP_CONFIGURATION_QUERY = `
  query GetShopConfiguration {
    shop {
      id
      name
    }
    collections(first: 100) {
      edges {
        node {
          id
          title
        }
      }
    }
  }
`;

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  try {
    const response = await admin.graphql(SHOP_CONFIGURATION_QUERY);
    const data = await response.json();

    return json({
      shop: data.data.shop,
      collections: data.data.collections.edges.map(edge => edge.node)
    });
  } catch (error) {
    console.error("GraphQL Error:", error);
    return json({ 
      error: "Failed to load shop configuration",
      shop: null,
      collections: []
    });
  }
};

export default function CustomOptions() {
  const { shop, collections, error } = useLoaderData();
  const [optionSets, setOptionSets] = useState([]);
  const [activeSet, setActiveSet] = useState(null);
  const [selectedOptionType, setSelectedOptionType] = useState('');
  const navigate = useNavigate();

  const handleOptionTypeChange = (value) => {
    setSelectedOptionType(value);
    if (value) {
      navigate(`../websiteOptionCreator?type=${value}`);
    }
  };

  return (
    <Page>
      <TitleBar title="Product Option Sets" />
      
      <Layout>
        {error && (
          <Layout.Section>
            <Banner status="critical">
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <ButtonGroup>
                <Button primary Link={"/app/websiteOptionSetsCreator"}>
                  Create Option Set
                </Button>
                <Select
                  labelInline
                  options={getOptionTypeChoices()}
                  value={selectedOptionType}
                  onChange={handleOptionTypeChange}
                  placeholder="Create Option"
                />
              </ButtonGroup>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Outlet />

        {!activeSet && (
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  No Option Set Selected
                </Text>
                <Text as="p" variant="bodyMd">
                  Create a new option set or select an existing one to get started.
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        )}

        {activeSet && (
          <>
            <Layout.Section>
              <OptionSet 
                title={activeSet.title}
                rank={activeSet.rank}
                collection={activeSet.collection}
                onUpdate={(updates) => {/* Handle updates */}}
              />
            </Layout.Section>

            <Layout.Section>
              {activeSet.options.map(option => (
                <Option
                  key={option.id}
                  {...option}
                  onUpdate={(updates) => {/* Handle option updates */}}
                />
              ))}
            </Layout.Section>

            <Layout.Section>
              {activeSet.rules.map(rule => (
                <Rule
                  key={rule.id}
                  {...rule}
                  onUpdate={(updates) => {/* Handle rule updates */}}
                />
              ))}
            </Layout.Section>
          </>
        )}
      </Layout>
    </Page>
  );
}
