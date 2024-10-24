// Save as app/routes/app.migrate-collections.jsx
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { getCollections } from "../lib/dataFetchers";
import prisma from "../db.server";
import {
  BlockStack,
  Card,
  Layout,
  Page,
  Text,
  Button,
} from "@shopify/polaris";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  return json({ ok: true });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  try {
    console.log('Starting collections migration...');
    const shopifyCollections = await getCollections(admin);
    console.log(`Found ${shopifyCollections.length} collections to migrate`);

    const results = await Promise.all(
      shopifyCollections.map(async (collection) => {
        try {
          const collectionData = {
            shopifyId: collection.value,
            title: collection.label,
            handle: collection.handle
          };

          const result = await prisma.shopifyCollections.upsert({
            where: { handle: collectionData.handle },
            update: {
              shopifyId: collectionData.shopifyId,
              title: collectionData.title,
            },
            create: {
              shopifyId: collectionData.shopifyId,
              title: collectionData.title,
              handle: collectionData.handle,
            }
          });
          
          console.log(`Successfully migrated collection: ${collectionData.title}`);
          return { success: true, collection: result };
        } catch (error) {
          console.error(`Failed to migrate collection ${collection.label}:`, error);
          return { success: false, error: error.message, collection };
        }
      })
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return json({
      status: 'complete',
      total: shopifyCollections.length,
      successful,
      failed,
      results: results.filter(r => !r.success),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Migration failed:', error);
    return json({ 
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
};

export default function MigrateCollections() {
  const submit = useSubmit();
  const loaderData = useLoaderData();

  const runMigration = () => {
    submit({}, { method: "POST" });
  };

  return (
    <Page>
      <ui-title-bar title="Migrate Collections" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400" padding="400">
              <Text as="h2" variant="headingMd">
                Shopify Collections Migration
              </Text>
              
              <Text as="p" color="subdued">
                This will migrate all collections from Shopify to your local database.
                Make sure to run this only once or when you need to sync collections.
              </Text>

              {loaderData?.status === 'complete' && (
                <BlockStack gap="200">
                  <Text as="p" variant="bodyMd" tone="success">
                    Migration Complete: {loaderData.successful} collections migrated
                  </Text>
                  {loaderData.failed > 0 && (
                    <Text as="p" variant="bodyMd" tone="critical">
                      {loaderData.failed} collections failed to migrate
                    </Text>
                  )}
                </BlockStack>
              )}

              {loaderData?.status === 'error' && (
                <Text as="p" variant="bodyMd" tone="critical">
                  Migration Failed: {loaderData.error}
                </Text>
              )}

              <Button primary onClick={runMigration}>
                Start Migration
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}