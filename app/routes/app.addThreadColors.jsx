import React from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import { Page, Layout, Card, BlockStack, InlineStack, Button, Text, Box } from "@shopify/polaris";
import AddEmbroideryThreadColorForm from "../components/AddEmbroideryThreadColorForm";
import AddStitchingThreadColorForm from "../components/AddStitchingThreadColorForm";
import { authenticate } from "../shopify.server";
import { loader as dataLoader } from "../lib/loaders";
import { updateEmbroideryThreadColorWithTagsAndNumbers, createEmbroideryThreadColorWithTags, updateStitchingThreadColorWithTagsAndNumbers, createStitchingThreadColorWithTagsAndAmann, unlinkIsacordFromThread, unlinkAmannFromThread } from "../lib/server/threadColorOperations.server";
import {
  migrateAmannNumbersToShopify,
  activateAmannMetaobjects,
  migrateEmbroideryThreadsToShopify,
  migrateIsacordNumbersToShopify,
  activateEmbroideryMetaobjects,
  activateIsacordMetaobjects,
} from "../lib/server/amannShopifyMigration.server";
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
  const [activateBanner, setActivateBanner] = React.useState({ show: false, message: "", isError: false });
  const [embroideryMigrateBanner, setEmbroideryMigrateBanner] = React.useState({ show: false, message: "", isError: false });
  const [isacordMigrateBanner, setIsacordMigrateBanner] = React.useState({ show: false, message: "", isError: false });

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

  React.useEffect(() => {
    if (fetcher.data && fetcher.data.activateResult) {
      const r = fetcher.data.activateResult;
      const msg = r.errors?.length
        ? `Updated ${r.updated}, skipped ${r.skipped}. Errors: ${r.errors.join("; ")}`
        : `Set thread metaobjects to Active: ${r.updated} updated, ${r.skipped} already active.`;
      setActivateBanner({ show: true, message: msg, isError: r.errors?.length > 0 });
    }
  }, [fetcher.data]);

  React.useEffect(() => {
    if (fetcher.data && fetcher.data.embroideryMigrateResult) {
      const r = fetcher.data.embroideryMigrateResult;
      const msg = r.errors?.length
        ? `Created ${r.created}, skipped ${r.skipped}. Errors: ${r.errors.join("; ")}`
        : `Embroidery threads: ${r.created} created, ${r.skipped} skipped.`;
      setEmbroideryMigrateBanner({ show: true, message: msg, isError: r.errors?.length > 0 });
    }
  }, [fetcher.data]);

  React.useEffect(() => {
    if (fetcher.data && fetcher.data.isacordMigrateResult) {
      const r = fetcher.data.isacordMigrateResult;
      const msg = r.errors?.length
        ? `Created ${r.created}, skipped ${r.skipped}. Errors: ${r.errors.join("; ")}`
        : `Isacord numbers: ${r.created} created, ${r.skipped} skipped.`;
      setIsacordMigrateBanner({ show: true, message: msg, isError: r.errors?.length > 0 });
    }
  }, [fetcher.data]);

  const handleMigrateAmann = () => {
    fetcher.submit(
      { type: "migrateAmannToShopify" },
      { method: "post" }
    );
  };

  const handleActivateAmann = () => {
    fetcher.submit(
      { type: "activateAmannMetaobjects" },
      { method: "post" }
    );
  };

  const handleMigrateEmbroidery = () => {
    fetcher.submit(
      { type: "migrateEmbroideryThreadsToShopify" },
      { method: "post" }
    );
  };

  const handleMigrateIsacord = () => {
    fetcher.submit(
      { type: "migrateIsacordNumbersToShopify" },
      { method: "post" }
    );
  };

  const isSubmitting = (t) => fetcher.state === "submitting" && fetcher.formData?.get("type") === t;

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
      {activateBanner.show && (
        <SuccessBanner
          show={true}
          onDismiss={() => setActivateBanner({ show: false, message: "", isError: false })}
          message={activateBanner.message}
          status={activateBanner.isError ? "critical" : "success"}
        />
      )}
      {embroideryMigrateBanner.show && (
        <SuccessBanner
          show={true}
          onDismiss={() => setEmbroideryMigrateBanner({ show: false, message: "", isError: false })}
          message={embroideryMigrateBanner.message}
          status={embroideryMigrateBanner.isError ? "critical" : "success"}
        />
      )}
      {isacordMigrateBanner.show && (
        <SuccessBanner
          show={true}
          onDismiss={() => setIsacordMigrateBanner({ show: false, message: "", isError: false })}
          message={isacordMigrateBanner.message}
          status={isacordMigrateBanner.isError ? "critical" : "success"}
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
                  Manage migration: Postgres → Shopify
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Copy thread and number data from this app into Shopify metaobjects. Safe to run again; existing entries are skipped.
                </Text>
                <InlineStack gap="300" wrap>
                  <Button
                    variant="primary"
                    onClick={handleMigrateAmann}
                    loading={isSubmitting("migrateAmannToShopify")}
                  >
                    Migrate Amann numbers
                  </Button>
                  <Button
                    onClick={handleActivateAmann}
                    loading={isSubmitting("activateAmannMetaobjects")}
                  >
                    Set thread metaobjects to Active
                  </Button>
                  <Button
                    onClick={handleMigrateEmbroidery}
                    loading={isSubmitting("migrateEmbroideryThreadsToShopify")}
                  >
                    Migrate embroidery threads
                  </Button>
                  <Button
                    onClick={handleMigrateIsacord}
                    loading={isSubmitting("migrateIsacordNumbersToShopify")}
                  >
                    Migrate Isacord numbers
                  </Button>
                </InlineStack>
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
  const { admin } = await authenticate.admin(request);
  return dataLoader({ admin });
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

  if (type === "activateAmannMetaobjects") {
    try {
      const [amannResult, embroideryResult, isacordResult] = await Promise.all([
        activateAmannMetaobjects(admin),
        activateEmbroideryMetaobjects(admin),
        activateIsacordMetaobjects(admin),
      ]);

      const combinedErrors = [
        ...(amannResult.errors || []).map(e => `Amann: ${e}`),
        ...(embroideryResult.errors || []).map(e => `Embroidery: ${e}`),
        ...(isacordResult.errors || []).map(e => `Isacord: ${e}`),
      ];

      const activateResult = {
        success: amannResult.success && embroideryResult.success && isacordResult.success,
        updated: (amannResult.updated || 0) + (embroideryResult.updated || 0) + (isacordResult.updated || 0),
        skipped: (amannResult.skipped || 0) + (embroideryResult.skipped || 0) + (isacordResult.skipped || 0),
        errors: combinedErrors,
      };

      return { activateResult };
    } catch (error) {
      console.error("[action] activateAmannMetaobjects error", error);
      return {
        activateResult: {
          success: false,
          updated: 0,
          skipped: 0,
          errors: [error.message || String(error)],
        },
      };
    }
  }

  if (type === "migrateEmbroideryThreadsToShopify") {
    try {
      const embroideryMigrateResult = await migrateEmbroideryThreadsToShopify(admin);
      return { embroideryMigrateResult };
    } catch (error) {
      console.error("[action] migrateEmbroideryThreadsToShopify error", error);
      return {
        embroideryMigrateResult: {
          success: false,
          created: 0,
          skipped: 0,
          errors: [error.message || String(error)],
        },
      };
    }
  }

  if (type === "migrateIsacordNumbersToShopify") {
    try {
      const isacordMigrateResult = await migrateIsacordNumbersToShopify(admin);
      return { isacordMigrateResult };
    } catch (error) {
      console.error("[action] migrateIsacordNumbersToShopify error", error);
      return {
        isacordMigrateResult: {
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