import React from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import { json } from "@remix-run/node";
import { loader as dataLoader } from "../lib/loaders";
import { authenticate } from "../shopify.server";
import { Page, Layout, Box, Banner, Card, BlockStack } from "@shopify/polaris";
import AddLeatherColorForm from "../components/AddLeatherColorForm";
import { createShopifyLeatherColor, updateShopifyLeatherColor } from "../lib/server/leatherColorShopify.server.js";
import SuccessBanner from "../components/SuccessBanner.jsx";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  return dataLoader({ admin });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const formData = await request.formData();
  const actionType = formData.get("actionType");

  if (actionType === "updateLeatherColor") {
    const leatherColorId = formData.get("leatherColorId");
    const isLimitedEditionLeather = formData.get("isLimitedEditionLeather") === "true";
    const colorMetaobjectIds = formData.getAll("colorMetaobjectIds");
    if (!leatherColorId) {
      return json({ success: false, error: "Leather color is required for update." }, { status: 400 });
    }
    try {
      const updated = await updateShopifyLeatherColor(admin, {
        id: leatherColorId,
        isLimitedEditionLeather,
        colorMetaobjectIds: Array.isArray(colorMetaobjectIds) ? colorMetaobjectIds : [].concat(colorMetaobjectIds),
      });
      return json({ success: true, actionType: "update", leatherColor: updated });
    } catch (error) {
      return json({ success: false, error: error.message }, { status: 500 });
    }
  }

  const name = formData.get("name");
  const abbreviation = formData.get("abbreviation");
  const isLimitedEditionLeather = formData.get("isLimitedEditionLeather") === "true";
  const colorMetaobjectIds = formData.getAll("colorMetaobjectIds");

  if (!name || !abbreviation) {
    return json({ success: false, error: "Missing required fields." }, { status: 400 });
  }
  try {
    const created = await createShopifyLeatherColor(admin, {
      name,
      abbreviation,
      isLimitedEditionLeather,
      colorMetaobjectIds,
    });

    return json({
      success: true,
      actionType: "add",
      leatherColor: created,
    });
  } catch (error) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
};

export default function AddLeatherColor () {
  const { leatherColors, shopifyColors, leatherColorsLoadError } = useLoaderData();
  const fetcher = useFetcher();
  const [showSuccessBanner, setShowSuccessBanner] = React.useState(false);
  React.useEffect(() => {
    if (fetcher.data) {
      setShowSuccessBanner(true);
    }
  }, [fetcher.data]);
  return (
    <Page>
      <BlockStack gap="400">
      <Card>
      <TitleBar title="Add a New Leather Color" />
      {fetcher.state === 'submitting' && (
        <Box paddingBlock="400">
          <Banner status="info">Submitting...</Banner>
        </Box>
      )}
      <SuccessBanner
        show={fetcher.data && fetcher.data.success && showSuccessBanner}
        onDismiss={() => setShowSuccessBanner(false)}
        message={(() => {
          if (!fetcher.data || !fetcher.data.leatherColor) return '';
          switch (fetcher.data.actionType) {
            case 'add':
              return `Leather color ${fetcher.data.leatherColor.name} created!`;
            case 'update':
              return `Leather color ${fetcher.data.leatherColor.name} updated!`;
            case 'discontinue':
              return `Leather color ${fetcher.data.leatherColor.name} discontinued.`;
            case 'reactivate':
              return `Leather color ${fetcher.data.leatherColor.name} reactivated!`;
            default:
              return `Leather color ${fetcher.data.leatherColor.name} created!`;
          }
        })()}
      />
      {fetcher.data && fetcher.data.error && (
        <Box paddingBlock="400">
          <Banner status="critical">{fetcher.data.error}</Banner>
        </Box>
      )}
      <Layout>
        <Layout.Section variant="oneHalf">
          <AddLeatherColorForm leatherColors={leatherColors} shopifyColors={shopifyColors || []} leatherColorsLoadError={leatherColorsLoadError} fetcher={fetcher} />
        </Layout.Section>
      </Layout>
      </Card>
      </BlockStack>
    </Page>
  );
}