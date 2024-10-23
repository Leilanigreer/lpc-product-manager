// Save as app/routes/admin.migrate-collections.jsx
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import { getCollections } from "../lib/dataFetchers";
import prisma from "../db.server";
import { Page, Layout, Button, Text, Card } from "@shopify/polaris";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  // Just check authentication in loader
  return json({ ok: true });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  try {
    console.log('Starting collections migration...');

    // Get collections using your existing function
    const collections = await getCollections(admin);
    
    console.log(`Found ${collections.length} collections to migrate`);

    // Migrate collections to your database
    const results = await Promise.all(
      collections.map(async (collection) => {
        try {
          // Convert from your current format to the database format
          const collectionData = {
            id: collection.value.replace('gid://shopify/Collection/', ''),
            title: collection.label,
            handle: collection.handle
          };

          const result = await prisma.collection.upsert({
            where: { id: collectionData.id },
            update: {
              title: collectionData.title,
              handle: collectionData.handle
            },
            create: {
              id: collectionData.id,
              title: collectionData.title,
              handle: collectionData.handle
            }
          });
          
          return { success: true, collection: result };
        } catch (error) {
          console.error(`Failed to migrate collection ${collection.label}:`, error);
          return { success: false, error: error.message, collection };
        }
      })
    );

    // Generate migration summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return json({
      total: collections.length,
      successful,
      failed,
      results: results.filter(r => !r.success), // Only return failed results for display
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Migration failed:', error);
    return json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
};

export default function MigrateCollections() {
  const submit = useSubmit();
  const { state } = useLoaderData();

  const runMigration = () => {
    submit({}, { method: "POST" });
  };

  return (
    <Page>
      <ui-title-bar title="Migrate Collections" />
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{ padding: "20px" }}>
              <Text variant="headingMd" as="h2">
                Shopify Collections Migration
              </Text>
              <div style={{ marginTop: "20px" }}>
                <Text as="p" color="subdued">
                  This will migrate all collections from Shopify to your local database.
                  Make sure to run this only once or when you need to sync collections.
                </Text>
              </div>
              <div style={{ marginTop: "20px" }}>
                <Button primary onClick={runMigration}>
                  Start Migration
                </Button>
              </div>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}