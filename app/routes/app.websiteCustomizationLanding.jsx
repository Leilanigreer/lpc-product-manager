import { useState } from "react";
import { useLoaderData, useNavigate, Outlet } from "@remix-run/react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Box,
  Banner,
  Button,
  ButtonGroup,
  Select,
  Tabs,
  IndexTable,
  useIndexResourceState,
  Link,
  Icon,
  TextField,
  Badge,
  Tooltip,
} from "@shopify/polaris";
import { SearchIcon, FilterIcon, EditIcon } from '@shopify/polaris-icons';
import { getOptionTypeChoices } from "../lib/utils/optionTypeMapping";
import { loader as dataLoader } from "../lib/loaders";

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
    // Get shop configuration
    const response = await admin.graphql(SHOP_CONFIGURATION_QUERY);
    const data = await response.json();

    // Get data using the centralized loader
    const loaderData = await dataLoader();
    const { options, optionSets } = loaderData;

    return json({
      shop: data.data.shop,
      collections: data.data.collections.edges.map(edge => edge.node),
      optionSets,
      options
    });
  } catch (error) {
    console.error("Error:", error);
    return json({ 
      error: "Failed to load configuration",
      shop: null,
      collections: [],
      optionSets: [],
      options: []
    });
  }
};

export default function CustomOptions() {
  const { shop, collections, optionSets = [], options = [], error } = useLoaderData();
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedOptionType, setSelectedOptionType] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  const navigate = useNavigate();

  const tabs = [
    {
      id: 'all',
      content: 'All',
      accessibilityLabel: 'All items',
      panelID: 'all-items-content',
    },
    {
      id: 'option-set',
      content: 'Option set',
      accessibilityLabel: 'Option sets',
      panelID: 'option-sets-content',
    },
    {
      id: 'option',
      content: 'Option',
      accessibilityLabel: 'Options',
      panelID: 'options-content',
    },
  ];

  const handleOptionTypeChange = (value) => {
    setSelectedOptionType(value);
    if (value) {
      navigate(`/app/websiteOptionCreator?type=${value}`);
    }
  };

  const handleTabChange = (selectedTabIndex) => {
    setSelectedTab(selectedTabIndex);
  };

  const resourceName = {
    singular: 'item',
    plural: 'items',
  };

  const {selectedResources, allResourcesSelected, handleSelectionChange} = 
    useIndexResourceState([]);

  const rowMarkup = (items) => {
    return items.map(
      ({ id, title, type, options, products, optionType, values }, index) => (
        <IndexTable.Row
          id={id}
          key={id}
          selected={selectedResources.includes(id)}
          position={index}
        >
          <IndexTable.Cell>
            <Badge tone={type === "Option set" ? "info" : "info"}>{type || "Option set"}</Badge>
          </IndexTable.Cell>
          <IndexTable.Cell>
            <Text variant="bodyMd" fontWeight="bold">{title}</Text>
          </IndexTable.Cell>
          <IndexTable.Cell>{options || "-"}</IndexTable.Cell>
          <IndexTable.Cell>{products || "-"}</IndexTable.Cell>
          <IndexTable.Cell>{optionType || "-"}</IndexTable.Cell>
          <IndexTable.Cell>{values || "-"}</IndexTable.Cell>
          <IndexTable.Cell>
            <Button
              icon={EditIcon}
              accessibilityLabel="Edit" dataPrimaryLink={true} onClick={(e) => {
                e.stopPropagation();
                console.log('Edit link clicked for ID:', id);
                navigate(`/app/websiteOptionCreator?id=${id}`);
              }}
            />
          </IndexTable.Cell>
        </IndexTable.Row>
      ),
    );
  };

  const getFilteredItems = () => {
    let items = [];
    
    if ((selectedTab === 0 || selectedTab === 1) && Array.isArray(optionSets)) {
      console.log('Option Sets:', optionSets);
      items = [...items, ...optionSets.map(set => ({
        id: set.id,
        title: set.title,
        options: set.options ? `${set.options.length} options` : "0 options",
        products: set.collection ? "1 product" : "0 product",
        type: "Option set"
      }))];
    }
    
    if ((selectedTab === 0 || selectedTab === 2) && Array.isArray(options)) {
      console.log('Options:', options);
      items = [...items, ...options.map(opt => ({
        id: opt.id,
        title: opt.name,
        optionType: opt.layout?.type || "-",
        values: opt.OptionValue?.length > 0 ? `${opt.OptionValue.length} values` : "-",
        type: "Option"
      }))];
    }

    console.log('Filtered Items:', items);
    return items;
  };

  return (
    <Page>
      <Box>
        <InlineStack align="space-between">
          <Text variant="headingLg">Product Customization Setup</Text>
          <ButtonGroup>
            <Select
              labelInline
              options={getOptionTypeChoices()}
              value={selectedOptionType}
              onChange={handleOptionTypeChange}
              placeholder="Create option"
            />
        <Button primary url="/app/websiteOptionSetsCreator">
              Create option set
            </Button>
          </ButtonGroup>
        </InlineStack>
      </Box>

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
            <BlockStack>
              <InlineStack align="space-between">
                <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange} />
                <InlineStack gap="200">
                  <Tooltip content="Search">
                    <Button
                      icon={<Icon source={SearchIcon} />}
                      onClick={() => setIsFiltering(!isFiltering)}
                      variant="tertiary"
                      tone="base"
                    />
                  </Tooltip>
                  <Tooltip content="Filter">
                    <Button
                      icon={<Icon source={FilterIcon} />}
                      onClick={() => {/* Add filter logic */}}
                      variant="tertiary"
                      tone="base"
                    />
                  </Tooltip>
                </InlineStack>
              </InlineStack>
              
              {isFiltering && (
                <TextField
                  value={searchValue}
                  onChange={setSearchValue}
                  placeholder="Search options"
                  autoComplete="off"
                />
              )}

              <IndexTable
                resourceName={resourceName}
                itemCount={getFilteredItems().length}
                selectedItemsCount={
                  allResourcesSelected ? 'All' : selectedResources.length
                }
                onSelectionChange={handleSelectionChange}
                headings={[
                  { title: 'Type' },
                  { title: 'Title' },
                  { title: 'Options' },
                  { title: 'Products' },
                  { title: 'Option type' },
                  { title: 'Values' },
                ]}
              >
                {rowMarkup(getFilteredItems())}
              </IndexTable>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Outlet />
      </Layout>
    </Page>
  );
}
