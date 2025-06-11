import React from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import { json } from "@remix-run/node";
import { loader as dataLoader } from "../lib/loaders/index.js";
import { authenticate } from "../shopify.server.js";
import { Page, Box, Banner, Card, BlockStack } from "@shopify/polaris";
import ColorTagManager from "../components/ColorTagManager.jsx";
import { createColorTag } from "../lib/server/colorTagsOperations.server.js";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return dataLoader({ request });
};

export const action = async ({ request }) => {
  await authenticate.admin(request);
  // Only handle color tag creation
  const formData = await request.formData();
  const name = formData.get("name");
  const stitchingThreadIds = formData.getAll("stitchingThreadIds");
  const embroideryThreadIds = formData.getAll("embroideryThreadIds");
  const leatherColorIds = formData.getAll("leatherColorIds");
  if (!name) {
    return json({ success: false, error: "Missing required fields." }, { status: 400 });
  }
  try {
    const colorTag = await createColorTag({ name, stitchingThreadIds, embroideryThreadIds, leatherColorIds });
    return json({ success: true, colorTag });
  } catch (error) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
};

export default function AddColorTag() {
  const { colorTags, stitchingThreadColors, embroideryThreadColors, leatherColors } = useLoaderData();
  const colorTagFetcher = useFetcher();
  const [showColorTagBanner, setShowColorTagBanner] = React.useState(false);
  React.useEffect(() => {
    if (colorTagFetcher.data) {
      setShowColorTagBanner(true);
    }
  }, [colorTagFetcher.data]);
  return (
    <Page>
      <BlockStack gap="400">
        <Card>
          <TitleBar title="Add a New Color Tag" />
          <Box paddingBlock="100">
            {colorTagFetcher.data && colorTagFetcher.data.success && showColorTagBanner && (
              <Banner status="success" onDismiss={() => setShowColorTagBanner(false)}>
                Color tag {colorTagFetcher.data.colorTag?.name} created!
              </Banner>
            )}
            {colorTagFetcher.data && colorTagFetcher.data.error && (
              <Banner status="critical" onDismiss={() => setShowColorTagBanner(false)}>
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
                colorTagFetcher.submit(formData, { method: 'post' });
              }}
            />
          </Box>
        </Card>
      </BlockStack>
    </Page>
  );
}