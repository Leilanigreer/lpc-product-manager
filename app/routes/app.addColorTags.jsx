import React, { useRef } from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import { json } from "@remix-run/node";
import { loader as dataLoader } from "../lib/loaders/index.js";
import { authenticate } from "../shopify.server.js";
import { Page, Box, Banner, Card, BlockStack } from "@shopify/polaris";
import ColorTagManager from "../components/ColorTagManager.jsx";
import { createColorTag, updateColorTag } from "../lib/server/colorTagsOperations.server.js";
import SuccessBanner from "../components/SuccessBanner.jsx";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  return dataLoader({ admin });
};

export const action = async ({ request }) => {
  await authenticate.admin(request);
  const formData = await request.formData();
  const mode = formData.get("mode");
  const id = formData.get("id");
  const name = formData.get("name");
  const stitchingThreadIds = formData.getAll("stitchingThreadIds");
  const embroideryThreadIds = formData.getAll("embroideryThreadIds");
  const leatherColorIds = formData.getAll("leatherColorIds");
  if (!name) {
    return json({ success: false, error: "Missing required fields." }, { status: 400 });
  }
  try {
    let colorTag;
    if (mode === "update" && id) {
      colorTag = await updateColorTag(id, { name, stitchingThreadIds, embroideryThreadIds, leatherColorIds });
    } else {
      colorTag = await createColorTag({ name, stitchingThreadIds, embroideryThreadIds, leatherColorIds });
    }
    return json({ success: true, colorTag });
  } catch (error) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
};

export default function AddColorTag() {
  const { colorTags, stitchingThreadColors, embroideryThreadColors, leatherColors } = useLoaderData();
  const colorTagFetcher = useFetcher();
  const [showBanner, setShowBanner] = React.useState(false);
  const [bannerType, setBannerType] = React.useState("");
  const colorTagManagerSuccessRef = useRef(null);
  React.useEffect(() => {
    if (colorTagFetcher.data && colorTagFetcher.data.success) {
      setShowBanner(true);
      setBannerType(colorTagFetcher.data.actionType || (colorTagFetcher.formData?.get('mode') === 'update' ? 'update' : 'add'));
      if (colorTagFetcher.data.colorTag && colorTagFetcher.data.colorTag.id && colorTagFetcher.formData?.get('mode') === 'update') {
        if (colorTagManagerSuccessRef.current) {
          colorTagManagerSuccessRef.current();
        }
      }
    }
  }, [colorTagFetcher.data]);
  return (
    <Page>
      <SuccessBanner
        show={showBanner && colorTagFetcher.data && colorTagFetcher.data.success}
        onDismiss={() => setShowBanner(false)}
        message={
          bannerType === "add"
            ? `Color tag ${colorTagFetcher.data?.colorTag?.name} added successfully!`
            : `Color tag ${colorTagFetcher.data?.colorTag?.name} updated successfully!`
        }
      />
      <BlockStack gap="400">
        <Card>
          <TitleBar title="Add a New Color Tag" />
          <Box paddingBlock="100">
            {colorTagFetcher.data && colorTagFetcher.data.error && (
              <Banner status="critical" onDismiss={() => setShowBanner(false)}>
                {colorTagFetcher.data.error}
              </Banner>
            )}
            <ColorTagManager
              existingTags={colorTags}
              stitchingThreads={stitchingThreadColors}
              embroideryThreads={embroideryThreadColors}
              leatherColors={leatherColors}
              onSubmit={(tagData) => {
                const formData = new FormData();
                formData.append('name', tagData.name);
                tagData.stitchingThreadIds.forEach(id => formData.append('stitchingThreadIds', id));
                tagData.embroideryThreadIds.forEach(id => formData.append('embroideryThreadIds', id));
                tagData.leatherColorIds.forEach(id => formData.append('leatherColorIds', id));
                formData.append('mode', tagData.mode);
                if (tagData.mode === 'update' && tagData.id) {
                  formData.append('id', tagData.id);
                }
                colorTagFetcher.submit(formData, { method: 'post' });
              }}
              onSuccess={cb => { colorTagManagerSuccessRef.current = cb; }}
            />
          </Box>
        </Card>
      </BlockStack>
    </Page>
  );
}