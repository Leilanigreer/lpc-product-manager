import React from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import { json } from "@remix-run/node";
import { loader as dataLoader } from "../lib/loaders";
import { authenticate } from "../shopify.server";
import { Page, Layout, Box, Banner } from "@shopify/polaris";
import AddLeatherColorForm from "../components/AddLeatherColorForm";
import { createLeatherColorWithTags } from "../lib/server/leatherColorOperations.server.js";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return dataLoader({ request });
};

export const action = async ({ request }) => {
  await authenticate.admin(request);
  const formData = await request.formData();
  const name = formData.get("name");
  const abbreviation = formData.get("abbreviation");
  const isLimitedEditionLeather = formData.get("isLimitedEditionLeather") === "true";
  const colorTagIds = formData.getAll("colorTagIds");
  if (!name || !abbreviation) {
    return json({ success: false, error: "Missing required fields." }, { status: 400 });
  }
  try {
    const leatherColor = await createLeatherColorWithTags(
      { name, abbreviation, isLimitedEditionLeather },
      colorTagIds
    );
    return json({ success: true, leatherColor });
  } catch (error) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
};

export default function AddLeatherColor () {
  const { leatherColors, colorTags } = useLoaderData();
  const fetcher = useFetcher();
  const [showSuccessBanner, setShowSuccessBanner] = React.useState(false);
  React.useEffect(() => {
    if (fetcher.data) {
      setShowSuccessBanner(true);
    }
  }, [fetcher.data]);
  return (
    <Page>
      <TitleBar title="Add a New Leather Color" />
      {fetcher.state === 'submitting' && (
        <Box paddingBlock="400">
          <Banner status="info">Submitting...</Banner>
        </Box>
      )}
      {fetcher.data && fetcher.data.success && showSuccessBanner && (
        <Box paddingBlock="400">
          <Banner status="success" onDismiss={() => setShowSuccessBanner(false)}>
            Leather color {fetcher.data.leatherColor?.name} created!
          </Banner>
        </Box>
      )}
      {fetcher.data && fetcher.data.error && (
        <Box paddingBlock="400">
          <Banner status="critical">{fetcher.data.error}</Banner>
        </Box>
      )}
      <Layout>
        <Layout.Section variant="oneHalf">
          <AddLeatherColorForm leatherColors={leatherColors} colorTags={colorTags} fetcher={fetcher} />
        </Layout.Section>
      </Layout>
    </Page>
  );
}