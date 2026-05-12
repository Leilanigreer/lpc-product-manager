import { Page, Layout, Card, BlockStack, Text, Button, Grid } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { PlusIcon, CashDollarIcon, EditIcon } from '@shopify/polaris-icons';
import { useNavigate } from "@remix-run/react";
import React from 'react';


export default function Index() {
  const navigate = useNavigate();

  return (
    <Page>
      <TitleBar title="Welcome Karl" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Product Management Dashboard
                </Text>
                <Grid>
                  <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 6, xl: 6}}>
                    <Card title="Create Product">
                      <BlockStack gap="400">
                        <Text variant="bodyMd">
                          Add new products to your store
                        </Text>
                        <Button icon={PlusIcon} onClick={() => navigate("/app/createProducts")}>
                          Add Product
                        </Button>
                      </BlockStack>
                    </Card>
                  </Grid.Cell>
                  <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 6, xl: 6}}>
                    <Card title="Update current products">
                      <BlockStack gap="400">
                        <Text variant="bodyMd">
                          Change details, variants, or media on products already in your store
                        </Text>
                        <Button icon={EditIcon} onClick={() => navigate("/app/updateProducts")}>
                          Update current products
                        </Button>
                      </BlockStack>
                    </Card>
                  </Grid.Cell>
                  <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 6, xl: 6}}>
                    <Card title="Manage Leather Color">
                      <BlockStack gap="400">
                        <Text variant="bodyMd">
                          Add a new leather color for product creation
                        </Text>
                        <Button icon={PlusIcon} onClick={() => navigate("/app/addLeatherColor")}>Manage Leather Color</Button>
                      </BlockStack>
                    </Card>
                  </Grid.Cell>
                  <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 6, xl: 6}}>
                    <Card title="Manage Thread Colors">
                      <BlockStack gap="400">
                        <Text variant="bodyMd">
                          Add a new thread color for product creation
                        </Text>
                        <Button icon={PlusIcon} onClick={() => navigate("/app/addThreadColors")}>Manage Thread Colors</Button>
                      </BlockStack>
                    </Card>
                  </Grid.Cell>
                  <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 6, xl: 6}}>
                    <Card title="Manage Pricing">
                      <BlockStack gap="400">
                        <Text variant="bodyMd">
                          Manage your collection prices
                        </Text>
                        <Button icon={CashDollarIcon} onClick={() => navigate("/app/updatePricing")}>Manage Pricing</Button>
                      </BlockStack>
                    </Card>
                  </Grid.Cell >
                  <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 6, xl: 6}}>
                    <Card title="Manage Styles">
                      <BlockStack gap="400">
                        <Text variant="bodyMd">
                          Add a new style for product creation
                        </Text>
                        <Button icon={PlusIcon} onClick={() => navigate("/app/addStyle")}>Manage Styles</Button>
                      </BlockStack>
                    </Card>
                  </Grid.Cell >
                {/* Add more feature descriptions as needed */}
                </Grid>
                <Card>
                  <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Coming Features
                  </Text>
                    <BlockStack gap="300">
                      <Text variant="bodyMd">
                        • Manage Quantities across selling channels: Etsy, Ebay, Amazon, Walmart and more
                      </Text>
                    </BlockStack>
                  </BlockStack>
                </Card>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}

