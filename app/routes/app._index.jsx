import { Page, Layout, Card, BlockStack, Text, Button, Grid } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { PlusIcon, CashDollarIcon, AdjustIcon } from '@shopify/polaris-icons';
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
                    <Card title="Update Pricing">
                      <BlockStack gap="400">
                        <Text variant="bodyMd">
                          Manage your collection prices
                        </Text>
                        <Button icon={CashDollarIcon} onClick={() => navigate("/app/updatePricing")}>Update Pricing</Button>
                      </BlockStack>
                    </Card>
                  </Grid.Cell>
                  <Grid.Cell columnSpan={{xs: 6, sm: 3, md: 3, lg: 6, xl: 6}}>
                    <Card title="Website Custom Options">
                      <BlockStack gap="400">
                        <Text variant="bodyMd">
                          Manage product customization options
                        </Text>
                        <Button icon={AdjustIcon} onClick={() => navigate("/app/websiteCustomOptionSets")}>
                          Customize Options
                        </Button>
                      </BlockStack>
                    </Card>
                  </Grid.Cell>
                </Grid>
                <Card>
                  <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Coming Features
                  </Text>
                    <BlockStack gap="300">
                      <Text variant="bodyMd">
                        • Discontinue Leather Color: Change collection to Last Chance, update Price and modify Postgres Database
                      </Text>
                      <Text variant="bodyMd">
                        • Add new inputs: Leather Colors, Thread Colors, Styles
                      </Text>
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

