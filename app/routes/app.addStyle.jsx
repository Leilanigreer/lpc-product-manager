import React from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import {
  json,
  unstable_parseMultipartFormData,
  unstable_createMemoryUploadHandler,
} from "@remix-run/node";
import {
  Page,
  Layout,
  Box,
  Banner,
  Card,
  BlockStack,
  Button,
  Text,
  InlineStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { loader as dataLoader } from "../lib/loaders";
import AddStyleForm from "../components/AddStyleForm";
import SuccessBanner from "../components/SuccessBanner.jsx";
import {
  createShopifyStyle,
  ensureStyleChoiceListValue,
  getStyleMetaobjectChoiceOptions,
  fetchStyleMetaobjectNodes,
  mapStyleMetaobjectNodeToFormStyle,
  backfillStyleIncludeAbbreviationInSku,
} from "../lib/server/styleShopify.server.js";
import { uploadShopifyImageFile } from "../lib/server/shopifyFilesShopify.server.js";
import { findStyleAbbreviationConflict } from "../lib/utils/styleAbbreviationUtils.js";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const [base, choiceOptions, styleNodes] = await Promise.all([
    dataLoader({ admin }),
    getStyleMetaobjectChoiceOptions(admin),
    fetchStyleMetaobjectNodes(admin).catch((err) => {
      console.error("addStyle loader: fetchStyleMetaobjectNodes failed:", err);
      return [];
    }),
  ]);
  const existingStyles = (styleNodes || []).map(mapStyleMetaobjectNodeToFormStyle);
  return {
    ...base,
    choiceOptions,
    existingStyles,
  };
};

function readTriBool(formData, key) {
  const raw = formData.get(key);
  if (raw === "true") return true;
  if (raw === "false") return false;
  return null;
}

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const contentType = request.headers.get("content-type") || "";

  // The backfill button posts a normal `application/x-www-form-urlencoded` body
  // so we branch on content type first to avoid running the multipart parser
  // (which would 400 on a non-multipart body).
  if (!contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const actionType = (formData.get("actionType") || "").toString();

    if (actionType === "backfill_include_abbreviation_in_sku") {
      try {
        const result = await backfillStyleIncludeAbbreviationInSku(admin);
        return json({
          success: true,
          actionType,
          backfill: result,
        });
      } catch (err) {
        return json(
          { success: false, actionType, error: err.message },
          { status: 500 }
        );
      }
    }

    return json(
      { success: false, error: `Unknown actionType "${actionType}".` },
      { status: 400 }
    );
  }

  const uploadHandler = unstable_createMemoryUploadHandler({
    maxPartSize: 10_000_000,
  });

  let formData;
  try {
    formData = await unstable_parseMultipartFormData(request, uploadHandler);
  } catch (err) {
    return json({ success: false, error: `Could not parse upload: ${err.message}` }, { status: 400 });
  }

  const style = (formData.get("style") || "").toString().trim();
  const category = (formData.get("category") || "").toString().trim();
  const collectionCategory = (formData.get("collection_category") || "").toString().trim();
  const shapeGroup = (formData.get("shape_group") || "").toString().trim();
  const abbreviation = (formData.get("abbreviation") || "").toString().trim();
  const useInVariantTitleRaw = formData.get("use_in_variant_title");
  const useInVariantTitle = useInVariantTitleRaw === "true";
  const includeAbbreviationInSku = readTriBool(formData, "include_abbreviation_in_sku");

  if (!style) return json({ success: false, error: "Style name is required." }, { status: 400 });
  if (!category) return json({ success: false, error: "Category is required." }, { status: 400 });
  if (!collectionCategory) return json({ success: false, error: "Collection category is required." }, { status: 400 });
  if (!shapeGroup) return json({ success: false, error: "Shape group is required." }, { status: 400 });
  if (!abbreviation) return json({ success: false, error: "Abbreviation is required." }, { status: 400 });
  if (useInVariantTitleRaw !== "true" && useInVariantTitleRaw !== "false") {
    return json({ success: false, error: "Use in Variant Title must be answered." }, { status: 400 });
  }
  if (includeAbbreviationInSku === null) {
    return json({ success: false, error: "Include abbreviation in SKU must be answered." }, { status: 400 });
  }

  let namePattern = null;
  let leatherPhrase = null;
  let needsColorDesignation = null;
  let useOppositeLeather = null;

  if (useInVariantTitle) {
    namePattern = (formData.get("name_pattern") || "").toString().trim();
    leatherPhrase = (formData.get("leather_phrase") || "").toString().trim();
    needsColorDesignation = readTriBool(formData, "needs_color_designation");
    useOppositeLeather = readTriBool(formData, "use_opposite_leather");

    if (!namePattern) {
      return json({ success: false, error: "Name pattern is required when used in variant title." }, { status: 400 });
    }
    if (!leatherPhrase) {
      return json({ success: false, error: "Leather phrase is required when used in variant title." }, { status: 400 });
    }
    if (needsColorDesignation === null) {
      return json({ success: false, error: "Needs Color Designation must be answered when used in variant title." }, { status: 400 });
    }
    if (useOppositeLeather === null) {
      return json({ success: false, error: "Use Opposite Leather must be answered when used in variant title." }, { status: 400 });
    }
  }

  const description = (formData.get("description") || "").toString().trim();
  const sortNumberRaw = (formData.get("sort_number") || "").toString().trim();
  const previewImage = formData.get("preview_image");

  let previewImageId = null;
  if (previewImage && typeof previewImage === "object" && typeof previewImage.arrayBuffer === "function") {
    try {
      const uploaded = await uploadShopifyImageFile(admin, previewImage, {
        alt: `${style} preview`,
      });
      previewImageId = uploaded.id;
    } catch (err) {
      return json({ success: false, error: `Preview image upload failed: ${err.message}` }, { status: 500 });
    }
  }

  // Server-side uniqueness gate: style.abbreviation lands in every variant SKU
  // (regular and custom), so two styles that can apply to the same shape on
  // the same product must have distinct abbreviations. We compare against the
  // current Shopify state right before create, so a stale client can't sneak
  // a duplicate through. Styles with includeAbbreviationInSku=false are
  // exempt because their abbreviation never reaches a SKU.
  try {
    const existingNodes = await fetchStyleMetaobjectNodes(admin);
    const existingStyles = existingNodes.map(mapStyleMetaobjectNodeToFormStyle);
    const conflict = findStyleAbbreviationConflict({
      abbreviation,
      collectionCategory,
      shapeGroup,
      includeAbbreviationInSku,
      existingStyles,
    });
    if (conflict) {
      return json(
        {
          success: false,
          error: `Abbreviation "${abbreviation}" already used by "${conflict.label}" in the same collection category and shape group. Pick a different abbreviation.`,
        },
        { status: 409 }
      );
    }
  } catch (err) {
    return json(
      { success: false, error: `Could not verify abbreviation uniqueness: ${err.message}` },
      { status: 500 }
    );
  }

  let choiceAdded = false;
  try {
    const ensured = await ensureStyleChoiceListValue(admin, "style", style);
    choiceAdded = !!ensured?.added;
  } catch (err) {
    return json({ success: false, error: `Could not update style choice list: ${err.message}` }, { status: 500 });
  }

  try {
    const created = await createShopifyStyle(admin, {
      style,
      category,
      collectionCategory,
      shapeGroup,
      abbreviation,
      useInVariantTitle,
      includeAbbreviationInSku,
      description,
      previewImageId,
      sortNumber: sortNumberRaw || null,
      ...(useInVariantTitle
        ? {
            namePattern,
            leatherPhrase,
            needsColorDesignation,
            useOppositeLeather,
          }
        : {}),
    });
    return json({
      success: true,
      actionType: "create",
      style: created,
      choiceListExtended: choiceAdded,
    });
  } catch (err) {
    return json({ success: false, error: err.message }, { status: 500 });
  }
};

export default function AddStyle() {
  const { choiceOptions, existingStyles } = useLoaderData();
  const fetcher = useFetcher();
  const backfillFetcher = useFetcher();
  const [showSuccessBanner, setShowSuccessBanner] = React.useState(false);
  const [showBackfillBanner, setShowBackfillBanner] = React.useState(false);

  React.useEffect(() => {
    if (fetcher.data?.actionType === "create") setShowSuccessBanner(true);
  }, [fetcher.data]);

  React.useEffect(() => {
    if (backfillFetcher.data) setShowBackfillBanner(true);
  }, [backfillFetcher.data]);

  const runBackfill = React.useCallback(() => {
    setShowBackfillBanner(false);
    const fd = new FormData();
    fd.append("actionType", "backfill_include_abbreviation_in_sku");
    backfillFetcher.submit(fd, { method: "post" });
  }, [backfillFetcher]);

  const backfillData = backfillFetcher.data;
  const backfillRunning = backfillFetcher.state === "submitting";

  return (
    <Page>
      <BlockStack gap="400">
        <Card>
          <TitleBar title="Add a New Style" />
          {fetcher.state === "submitting" && (
            <Box paddingBlock="400">
              <Banner status="info">Submitting...</Banner>
            </Box>
          )}
          <SuccessBanner
            show={fetcher.data && fetcher.data.success && showSuccessBanner}
            onDismiss={() => setShowSuccessBanner(false)}
            message={
              fetcher.data?.style?.label
                ? `Style "${fetcher.data.style.label}" created${
                    fetcher.data.choiceListExtended ? " (style choice list extended)" : ""
                  }!`
                : "Style created!"
            }
          />
          {fetcher.data && fetcher.data.error && fetcher.data.actionType !== "backfill_include_abbreviation_in_sku" && (
            <Box paddingBlock="400">
              <Banner status="critical">{fetcher.data.error}</Banner>
            </Box>
          )}
          <Layout>
            <Layout.Section variant="oneHalf">
              <AddStyleForm
                choiceOptions={choiceOptions || {}}
                existingStyles={existingStyles || []}
                fetcher={fetcher}
              />
            </Layout.Section>
          </Layout>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text variant="headingMd">One-time data migrations</Text>
            <Text tone="subdued" variant="bodySm">
              Backfills the new <code>include_abbreviation_in_sku</code> field on every style
              metaobject that doesn&apos;t already have a value, setting it to <b>true</b>.
              Safe to re-run: styles with an explicit true or false are left alone.
            </Text>

            {showBackfillBanner && backfillData?.success && (
              <Banner
                status="success"
                onDismiss={() => setShowBackfillBanner(false)}
              >
                Backfilled <b>{backfillData.backfill?.updated ?? 0}</b> of{" "}
                <b>{backfillData.backfill?.total ?? 0}</b> styles to{" "}
                <code>include_abbreviation_in_sku = true</code>
                {" "}({backfillData.backfill?.skipped ?? 0} already set,
                {" "}{backfillData.backfill?.errors?.length ?? 0} errors).
              </Banner>
            )}

            {showBackfillBanner && backfillData?.success === false && (
              <Banner
                status="critical"
                onDismiss={() => setShowBackfillBanner(false)}
              >
                Backfill failed: {backfillData.error}
              </Banner>
            )}

            {!!backfillData?.backfill?.errors?.length && (
              <Box paddingBlockStart="100">
                <Text variant="bodySm" tone="critical">
                  Errors on individual styles:
                </Text>
                <BlockStack gap="050">
                  {backfillData.backfill.errors.map((e) => (
                    <Text key={e.id} variant="bodySm" tone="critical">
                      {e.id}: {e.message}
                    </Text>
                  ))}
                </BlockStack>
              </Box>
            )}

            <InlineStack gap="200">
              <Button
                onClick={runBackfill}
                loading={backfillRunning}
                disabled={backfillRunning}
              >
                Backfill include_abbreviation_in_sku → true
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
