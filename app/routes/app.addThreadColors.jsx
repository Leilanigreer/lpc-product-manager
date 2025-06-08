import React from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import { Page, Layout, Banner, Box } from "@shopify/polaris";
import AddEmbroideryThreadColorForm from "../components/AddEmbroideryThreadColorForm";
import AddStitchingThreadColorForm from "../components/AddStitchingThreadColorForm";
import { authenticate } from "../shopify.server";
import { loader as dataLoader } from "../lib/loaders";
import { updateEmbroideryThreadColorWithTagsAndNumbers, createEmbroideryThreadColorWithTags, updateStitchingThreadColorWithTagsAndNumbers, createStitchingThreadColorWithTagsAndAmann, unlinkIsacordFromThread, unlinkAmannFromThread } from "../lib/server/threadColorOperations.server";

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

  React.useEffect(() => {
    if (fetcher.data && fetcher.data.success) {
      setShowBanner(true);
      setBannerType(fetcher.data.actionType || "update");
    }
  }, [fetcher.data]);

  return (
    <Page>
      <TitleBar title="Add Thread Colors" />
      {showBanner && (
        <Box paddingBlock="400">
          <Banner
            status="success"
            onDismiss={() => setShowBanner(false)}
          >
            {bannerType === "add"
              ? `Thread color ${fetcher.data.threadColor.name} added successfully!`
              : `Thread color ${fetcher.data.threadColor.name} updated successfully!`}
          </Banner>
        </Box>
      )}
      <Layout>
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
    </Page>
  );
}

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  // Get data from our data loader
  return dataLoader({ request });
};

export const action = async ({ request }) => {
  const formData = await request.formData();
  const type = formData.get("type");

  if (type === "updateEmbroidery") {
    // Parse form data
    const threadId = formData.get("threadId");
    const addIsacordIds = formData.getAll("addIsacordIds");
    const removeIsacordIds = formData.getAll("removeIsacordIds");
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
    const isacordNumbers = formData.getAll("isacordNumbers");
    const colorTagIds = formData.getAll("colorTagIds");

    // 1. Parse reassignments
    const reassignments = (Array.isArray(formData.getAll("reassignIsacordNumbers[]"))
      ? formData.getAll("reassignIsacordNumbers[]")
      : formData.get("reassignIsacordNumbers[]") ? [formData.get("reassignIsacordNumbers[]")] : []
    ).map(str => JSON.parse(str));

    try {
      // 2. Unlink isacord numbers from old threads
      for (const { isacordId, fromThreadId } of reassignments) {
        // You need to implement this function in your threadColorOperations.server.js
        await unlinkIsacordFromThread(isacordId, fromThreadId);
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
    const reassignments = (Array.isArray(formData.getAll("reassignAmannNumbers[]"))
      ? formData.getAll("reassignAmannNumbers[]")
      : formData.get("reassignAmannNumbers[]") ? [formData.get("reassignAmannNumbers[]")] : []
    ).map(str => JSON.parse(str));

    try {
      // 2. Unlink amann numbers from old threads
      for (const { amannId, fromThreadId } of reassignments) {
        await unlinkAmannFromThread(amannId, fromThreadId);
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
    const amannNumbers = formData.getAll("amannNumbers");
    const colorTagIds = formData.getAll("colorTagIds");

    // 1. Parse reassignments
    const reassignments = (Array.isArray(formData.getAll("reassignAmannNumbers[]"))
      ? formData.getAll("reassignAmannNumbers[]")
      : formData.get("reassignAmannNumbers[]") ? [formData.get("reassignAmannNumbers[]")] : []
    ).map(str => JSON.parse(str));

    try {
      // 2. Unlink amann numbers from old threads
      for (const { amannId, fromThreadId } of reassignments) {
        await unlinkAmannFromThread(amannId, fromThreadId);
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