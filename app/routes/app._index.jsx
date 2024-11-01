import { Page, Layout, Card, BlockStack, Text } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

export default function Index() {
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
                <Text variant="bodyMd" as="p">
                  Welcome to your product management tools. Use the navigation menu to access different features:
                </Text>
                <BlockStack gap="300">
                  <Text variant="bodyMd">
                    • Create Products: Add new products to your store
                  </Text>
                  <Text variant="bodyMd">
                    • Update Pricing: Manage your product prices
                  </Text>
                  {/* Add more feature descriptions as needed */}
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}