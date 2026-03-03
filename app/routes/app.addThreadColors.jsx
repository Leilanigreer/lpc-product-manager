import React from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import { Page, Layout, Card, BlockStack, Button, Text, Box } from "@shopify/polaris";
import AddEmbroideryThreadColorForm from "../components/AddEmbroideryThreadColorForm";
import AddStitchingThreadColorForm from "../components/AddStitchingThreadColorForm";
import { authenticate } from "../shopify.server";
import { loader as dataLoader } from "../lib/loaders";
import { updateEmbroideryThreadColorWithTagsAndNumbers, createEmbroideryThreadColorWithTags, updateStitchingThreadColorWithTagsAndNumbers, createStitchingThreadColorWithTagsAndAmann, unlinkIsacordFromThread, unlinkAmannFromThread } from "../lib/server/threadColorOperations.server";
import { migrateAmannNumbersToShopify } from "../lib/server/amannShopifyMigration.server";
import SuccessBanner from "../components/SuccessBanner.jsx";

export default function AddThreadColors() {
  const {
    colorTags,
    unlinkedIsacordNumbers,
    stitchingThreadColors,
    embroideryThreadColors,
    unlinkedAmannNumbers,
  } = useLoaderData();
  const fetcher = useFetcher();

  // Banner state
  const [showBanner, setShowBanner] = React.useState(false);
  const [bannerType, setBannerType] = React.useState("");
  const [migrateBanner, setMigrateBanner] = React.useState({ show: false, message: "", isError: false });

  React.useEffect(() => {
    if (fetcher.data && fetcher.data.success) {
      setShowBanner(true);
      setBannerType(fetcher.data.actionType || "update");
    }
  }, [fetcher.data]);

  React.useEffect(() => {
    if (fetcher.data && fetcher.data.migrateResult) {
      const r = fetcher.data.migrateResult;
      const msg = r.errors?.length
        ? `Created ${r.created}, skipped ${r.skipped}. Errors: ${r.errors.join("; ")}`
        : `Migrated Amann numbers to Shopify: ${r.created} created, ${r.skipped} skipped.`;
      setMigrateBanner({ show: true, message: msg, isError: r.errors?.length > 0 });
    }
  }, [fetcher.data]);

  const handleMigrateAmann = () => {
    fetcher.submit(
      { type: "migrateAmannToShopify" },
      { method: "post" }
    );
  };

  return (
    <Page>
      <TitleBar title="Add Thread Colors" />
      {migrateBanner.show && (
        <SuccessBanner
          show={true}
          onDismiss={() => setMigrateBanner({ show: false, message: "", isError: false })}
          message={migrateBanner.message}
          status={migrateBanner.isError ? "critical" : "success"}
        />
      )}
      <SuccessBanner
        show={showBanner}
        onDismiss={() => setShowBanner(false)}
        message={
          bannerType === "add"
            ? `Thread color ${fetcher.data?.threadColor?.name} added successfully!`
            : `Thread color ${fetcher.data?.threadColor?.name} updated successfully!`
        }
      />
      <Box paddingBlockEnd="400">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Sync Amann numbers to Shopify
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Copy Amann numbers (number, Wawak color name) from this app into Shopify as metaobjects (type: amann_number). Safe to run again; existing entries are skipped.
                </Text>
                <Button
                  variant="primary"
                  onClick={handleMigrateAmann}
                  loading={fetcher.state === "submitting" && fetcher.formData?.get("type") === "migrateAmannToShopify"}
                >
                  Migrate Amann numbers to Shopify
                </Button>
              </BlockStack>
            </Card>
          </Layout.Section>
          <Layout.Section variant="oneHalf">
            <AddEmbroideryThreadColorForm
              colorTags={colorTags}
              unlinkedIsacordNumbers={unlinkedIsacordNumbers}
              embroideryThreadColors={embroideryThreadColors}
              fetcher={fetcher}
            />
          </Layout.Section>
          <Layout.Section variant="oneHalf">
            <AddStitchingThreadColorForm
              colorTags={colorTags}
              stitchingThreadColors={stitchingThreadColors}
              fetcher={fetcher}
              unlinkedAmannNumbers={unlinkedAmannNumbers}
            />
          </Layout.Section>
        </Layout>
      </Box>
    </Page>
  );
}

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  // Get data from our data loader
  return dataLoader({ request });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const type = formData.get("type");

  if (type === "migrateAmannToShopify") {
    try {
      const migrateResult = await migrateAmannNumbersToShopify(admin);
      return { migrateResult };
    } catch (error) {
      console.error("[action] migrateAmannToShopify error", error);
      return {
        migrateResult: {
          success: false,
          created: 0,
          skipped: 0,
          errors: [error.message || String(error)],
        },
      };
    }
  }

  if (type === "updateEmbroidery") {
    // Parse form data
    const threadId = formData.get("threadId");
    const addIsacordIds = formData.getAll("addNumberIds");
    const removeIsacordIds = formData.getAll("removeNumberIds");
    const addColorTagIds = formData.getAll("addColorTagIds");
    const removeColorTagIds = formData.getAll("removeColorTagIds");

    // 1. Parse reassignments
    const reassignments = (Array.isArray(formData.getAll("reassignIsacordNumbers[]"))
      ? formData.getAll("reassignIsacordNumbers[]")
      : formData.get("reassignIsacordNumbers[]") ? [formData.get("reassignIsacordNumbers[]")] : []
    ).map(str => JSON.parse(str));

    try {
      // 2. Unlink isacord numbers from old threads
      for (const { isacordId, fromThreadId } of reassignments) {
        await unlinkIsacordFromThread(isacordId, fromThreadId);
      }

      // 3. Now update the thread color
      const updated = await updateEmbroideryThreadColorWithTagsAndNumbers({
        threadId,
        addIsacordIds,
        removeIsacordIds,
        addColorTagIds,
        removeColorTagIds,
      });
      return {
        success: true,
        threadColor: updated,
        actionType: "update",
      };
    } catch (error) {
      console.error('[action] updateEmbroidery error', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
  if (type === "embroidery") {
    // Parse form data for add
    const name = formData.get("name");
    const abbreviation = formData.get("abbreviation");
    const isacordNumbers = formData.getAll("numbers");
    const colorTagIds = formData.getAll("colorTagIds");

    // 1. Parse reassignments
    const reassignments = (Array.isArray(formData.getAll("reassignNumbers[]"))
      ? formData.getAll("reassignNumbers[]")
      : formData.get("reassignNumbers[]") ? [formData.get("reassignNumbers[]")] : []
    ).map(str => JSON.parse(str));

    try {
      // 2. Unlink isacord numbers from old threads
      for (const { numberId, fromThreadId } of reassignments) {
        await unlinkIsacordFromThread(numberId, fromThreadId);
      }

      // 3. Now create the new thread color
      const created = await createEmbroideryThreadColorWithTags({ name, abbreviation, isacordNumbers }, colorTagIds);
      return {
        success: true,
        threadColor: created,
        actionType: "add",
      };
    } catch (error) {
      console.error('[action] addEmbroidery error', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
  if (type === "updateStitching") {
    // Parse form data
    const threadId = formData.get("threadId");
    const addAmannIds = formData.getAll("addAmannIds");
    const removeAmannIds = formData.getAll("removeAmannIds");
    const addColorTagIds = formData.getAll("addColorTagIds");
    const removeColorTagIds = formData.getAll("removeColorTagIds");

    // 1. Parse reassignments
    const reassignments = (Array.isArray(formData.getAll("reassignNumbers[]"))
      ? formData.getAll("reassignNumbers[]")
      : formData.get("reassignNumbers[]") ? [formData.get("reassignNumbers[]")] : []
    ).map(str => JSON.parse(str));

    try {
      // 2. Unlink amann numbers from old threads
      for (const { numberId, fromThreadId } of reassignments) {
        await unlinkAmannFromThread(numberId, fromThreadId);
      }

      // 3. Now update the thread color
      const updated = await updateStitchingThreadColorWithTagsAndNumbers({
        threadId,
        addAmannIds,
        removeAmannIds,
        addColorTagIds,
        removeColorTagIds,
      });
      return {
        success: true,
        threadColor: updated,
        actionType: "update",
      };
    } catch (error) {
      console.error('[action] updateStitching error', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
  if (type === "stitching") {
    // Parse form data for add
    const name = formData.get("name");
    const abbreviation = formData.get("abbreviation");
    const amannNumbers = formData.getAll("numbers");
    const colorTagIds = formData.getAll("colorTagIds");

    // 1. Parse reassignments
    const reassignments = (Array.isArray(formData.getAll("reassignNumbers[]"))
      ? formData.getAll("reassignNumbers[]")
      : formData.get("reassignNumbers[]") ? [formData.get("reassignNumbers[]")] : []
    ).map(str => JSON.parse(str));

    try {
      // 2. Unlink amann numbers from old threads
      for (const { numberId, fromThreadId } of reassignments) {
        await unlinkAmannFromThread(numberId, fromThreadId);
      }

      // 3. Now create the new thread color
      const created = await createStitchingThreadColorWithTagsAndAmann({ name, abbreviation, amannNumbers }, colorTagIds);
      return {
        success: true,
        threadColor: created,
        actionType: "add",
      };
    } catch (error) {
      console.error('[action] addStitching error', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
  // ... (your other action logic)
}; 