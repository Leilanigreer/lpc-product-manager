import React from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import { json } from "@remix-run/node";
import { loader as dataLoader } from "../lib/loaders";
import { getLeatherColorsFromShopify } from "../lib/utils/dataFetchers";
import { authenticate } from "../shopify.server";
import { Page, Layout, Box, Banner, Card, BlockStack } from "@shopify/polaris";
import AddLeatherColorForm from "../components/AddLeatherColorForm";
import { createShopifyLeatherColor, updateShopifyLeatherColor } from "../lib/server/leatherColorShopify.server.js";
import { buildLeatherBlendedCollectionName } from "../lib/utils/colorNameUtils.js";
import { applyLinkedProductActions } from "../lib/server/leatherProductActionsShopify.server.js";
import SuccessBanner from "../components/SuccessBanner.jsx";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  return dataLoader({ admin });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const formData = await request.formData();
  const actionType = formData.get("actionType");
  const linkedProductActionsRaw = formData.get("linkedProductActions");
  let linkedProductActions = [];
  if (typeof linkedProductActionsRaw === "string" && linkedProductActionsRaw.trim() !== "") {
    try {
      const parsed = JSON.parse(linkedProductActionsRaw);
      linkedProductActions = Array.isArray(parsed) ? parsed : [];
    } catch {
      return json({ success: false, error: "Invalid linkedProductActions payload." }, { status: 400 });
    }
  }

  if (actionType === "updateLeatherColor") {
    const leatherColorId = formData.get("leatherColorId");
    const isLimitedEditionLeather = formData.get("isLimitedEditionLeather") === "true";
    const colorMetaobjectIds = formData.getAll("colorMetaobjectIds");
    const setActiveRaw = formData.get("setActive");
    const setActive =
      setActiveRaw === "true" ? true : setActiveRaw === "false" ? false : undefined;
    if (!leatherColorId) {
      return json({ success: false, error: "Leather color is required for update." }, { status: 400 });
    }
    try {
      const blendedCollectionName = formData.get("blendedCollectionName");
      const updated = await updateShopifyLeatherColor(admin, {
        id: leatherColorId,
        isLimitedEditionLeather,
        colorMetaobjectIds: Array.isArray(colorMetaobjectIds) ? colorMetaobjectIds : [].concat(colorMetaobjectIds),
        setActive,
        ...(blendedCollectionName != null && String(blendedCollectionName).trim() !== ""
          ? { blendedCollectionName: String(blendedCollectionName).trim() }
          : {}),
      });
      const productActionsResult = await applyLinkedProductActions(admin, linkedProductActions);
      return json({
        success: true,
        actionType: "update",
        leatherColor: updated,
        productActionsResult,
      });
    } catch (error) {
      return json({ success: false, error: error.message }, { status: 500 });
    }
  }

  if (actionType === "reactivateLeatherColor") {
    const leatherColorId = formData.get("leatherColorId");
    const isLimitedEditionLeather = formData.get("isLimitedEditionLeather") === "true";
    const colorMetaobjectIds = formData.getAll("colorMetaobjectIds");
    if (!leatherColorId) {
      return json({ success: false, error: "Leather color is required for reactivate." }, { status: 400 });
    }
    try {
      const blendedCollectionName = formData.get("blendedCollectionName");
      const reactivated = await updateShopifyLeatherColor(admin, {
        id: leatherColorId,
        isLimitedEditionLeather,
        colorMetaobjectIds: Array.isArray(colorMetaobjectIds) ? colorMetaobjectIds : [].concat(colorMetaobjectIds),
        setActive: true,
        ...(blendedCollectionName != null && String(blendedCollectionName).trim() !== ""
          ? { blendedCollectionName: String(blendedCollectionName).trim() }
          : {}),
      });
      return json({ success: true, actionType: "reactivate", leatherColor: reactivated });
    } catch (error) {
      return json({ success: false, error: error.message }, { status: 500 });
    }
  }

  if (actionType === "discontinueLeatherColor") {
    const leatherColorId = formData.get("leatherColorId");
    const isLimitedEditionLeather = formData.get("isLimitedEditionLeather") === "true";
    const colorMetaobjectIds = formData.getAll("colorMetaobjectIds");
    if (!leatherColorId) {
      return json({ success: false, error: "Leather color is required for discontinue." }, { status: 400 });
    }
    try {
      const blendedCollectionName = formData.get("blendedCollectionName");
      const discontinued = await updateShopifyLeatherColor(admin, {
        id: leatherColorId,
        isLimitedEditionLeather,
        colorMetaobjectIds: Array.isArray(colorMetaobjectIds) ? colorMetaobjectIds : [].concat(colorMetaobjectIds),
        setActive: false,
        ...(blendedCollectionName != null && String(blendedCollectionName).trim() !== ""
          ? { blendedCollectionName: String(blendedCollectionName).trim() }
          : {}),
      });
      const productActionsResult = await applyLinkedProductActions(admin, linkedProductActions);
      return json({
        success: true,
        actionType: "discontinue",
        leatherColor: discontinued,
        productActionsResult,
      });
    } catch (error) {
      return json({ success: false, error: error.message }, { status: 500 });
    }
  }

  const name = formData.get("name");
  const abbreviation = formData.get("abbreviation");
  const isLimitedEditionLeather = formData.get("isLimitedEditionLeather") === "true";
  const collectionName = formData.get("collectionName");
  const colorMetaobjectIds = formData.getAll("colorMetaobjectIds");

  if (!name || !abbreviation) {
    return json({ success: false, error: "Missing required fields." }, { status: 400 });
  }
  if (!isLimitedEditionLeather && !collectionName) {
    return json({ success: false, error: "Collection is required for Standard Stock leather colors." }, { status: 400 });
  }
  try {
    // Fetch existing leather colors to enforce collection + name rules
    const { leatherColors: existingLeatherColors = [] } = await getLeatherColorsFromShopify(admin);

    // Normalize name once; client already sends formatted name, but be defensive
    const normalizedName = name.trim();

    const exactMatch = existingLeatherColors.find(
      (lc) => lc.label === normalizedName && lc.collectionName === collectionName
    );

    // If exact (collection + name) exists, treat as a validation error; UI should route user to Update/Reactivate
    if (exactMatch) {
      const message = exactMatch.isActive
        ? "This leather color already exists for this collection. Please use Update instead."
        : "This leather color already exists for this collection but is discontinued. Please use Reactivate instead.";
      return json({ success: false, error: message }, { status: 400 });
    }

    // Look for same name in a different collection
    const sameNameDifferentCollection = existingLeatherColors.find(
      (lc) => lc.label === normalizedName && lc.collectionName !== collectionName
    );

    let created;
    let migratedFrom = null;

    if (sameNameDifferentCollection) {
      const source = sameNameDifferentCollection;
      const sourceAbbreviation = source.abbreviation || abbreviation;
      const sourceColorIds = source.colorMetaobjectIds || [];

      // 1. Create new color for the new collection, cloning abbreviation and color tags
      created = await createShopifyLeatherColor(admin, {
        name: normalizedName,
        abbreviation: sourceAbbreviation,
        isLimitedEditionLeather,
        collectionName,
        colorMetaobjectIds: sourceColorIds,
      });

      // 2. Mark the old (collection, name) combo as draft (setActive: false), preserving its fields
      await updateShopifyLeatherColor(admin, {
        id: source.value,
        isLimitedEditionLeather: source.isLimitedEditionLeather,
        colorMetaobjectIds: sourceColorIds,
        setActive: false,
        blendedCollectionName: buildLeatherBlendedCollectionName(
          source.collectionName,
          source.label
        ),
      });

      migratedFrom = {
        collectionName: source.collectionName || null,
        name: source.label,
      };
    } else {
      // Normal creation path when name+collection pair is entirely new
      created = await createShopifyLeatherColor(admin, {
        name: normalizedName,
        abbreviation,
        isLimitedEditionLeather,
        collectionName,
        colorMetaobjectIds,
      });
    }

    return json({
      success: true,
      actionType: sameNameDifferentCollection ? "addFromDifferentCollection" : "add",
      leatherColor: created,
      migratedFrom,
    });
  } catch (error) {
    return json({ success: false, error: error.message }, { status: 500 });
  }
};

export default function AddLeatherColor () {
  const { leatherColors, shopifyColors, leatherColorsLoadError, leatherCollectionNames } = useLoaderData();
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
            case 'addFromDifferentCollection':
              return `Leather color ${fetcher.data.leatherColor.name} created for the new collection.`;
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
      {fetcher.data && fetcher.data.success && fetcher.data.actionType === 'addFromDifferentCollection' && fetcher.data.migratedFrom && (
        <Box paddingBlock="400">
          <Banner status="info" title="Existing collection updated">
            <p>
              A new leather color with the same name was created for the selected collection, and the
              existing leather for <b>{fetcher.data.migratedFrom.collectionName}</b> was set to draft.
              This is where you will later update products from that collection: remove “continue selling when out of stock”,
              remove “customizable”, and offer discount options.
            </p>
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
          <AddLeatherColorForm
            leatherColors={leatherColors}
            shopifyColors={shopifyColors || []}
            leatherColorsLoadError={leatherColorsLoadError}
            collectionOptions={leatherCollectionNames || []}
            fetcher={fetcher}
          />
        </Layout.Section>
      </Layout>
      </Card>
      </BlockStack>
    </Page>
  );
}