import React from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import { Page, Layout, Banner, Box } from "@shopify/polaris";
import AddEmbroideryThreadColorForm from "../components/AddEmbroideryThreadColorForm";
import AddStitchingThreadColorForm from "../components/AddStitchingThreadColorForm";
import { authenticate } from "../shopify.server";
import { loader as dataLoader } from "../lib/loaders";
import { updateEmbroideryThreadColorWithTagsAndNumbers, createEmbroideryThreadColorWithTags } from "../lib/server/threadColorOperations.server";

export default function AddThreadColors() {
  const {
    colorTags,
    unlinkedIsacordNumbers,
    stitchingThreadColors,
    embroideryThreadColors,
  } = useLoaderData();
  const fetcher = useFetcher();

  // Banner state
  const [showBanner, setShowBanner] = React.useState(false);
  const [bannerType, setBannerType] = React.useState("");

  React.useEffect(() => {
    if (fetcher.data && fetcher.data.success) {
      setShowBanner(true);
      if (fetcher.data.threadColor && fetcher.data.threadColor.id) {
        setBannerType(fetcher.data.threadColor.abbreviation ? "add" : "update");
      } else {
        setBannerType("update");
      }
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
    console.log('[action] updateEmbroidery', { threadId, addIsacordIds, removeIsacordIds, addColorTagIds, removeColorTagIds });
    try {
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
    const isacordNumber = formData.get("isacordNumber");
    const colorTagIds = formData.getAll("colorTagIds");
    try {
      const created = await createEmbroideryThreadColorWithTags({ name, abbreviation, isacordNumber }, colorTagIds);
      return {
        success: true,
        threadColor: created,
      };
    } catch (error) {
      console.error('[action] addEmbroidery error', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
  // ... (your other action logic)
}; 