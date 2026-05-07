import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Banner,
  Button,
  Select,
  Text,
  Box,
  InlineStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { loader as dataLoader } from "../lib/loaders";
import { initialFormState, createInitialShapeState } from "../lib/forms/formState";
import { useFormState } from "../hooks/useFormState";
import {
  CollectionSelector,
  FontSelector,
  LeatherColorSelector,
  ThreadColorSelector,
  ShapeSelector,
  ProductVariantCheck,
} from "../components";
import { validateProductForm } from "../lib/utils";
import { plainProductDescriptionToHtml } from "../lib/generators/htmlDescription";
import { generateVariants } from "../lib/generators/variants/generateVariants";
import { buildShopifyProductMetafields } from "../lib/generators";
import {
  fetchActiveProductsForCollection,
  fetchProductForUpdate,
  updateShopifyProduct,
  buildSkuInfoFromProductBaseSku,
} from "../lib/server/productUpdateShopify.server";
import { computeShapeNeedsColorDesignation } from "../lib/utils/shapeUtils";

const toPlainText = (html) =>
  String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const todayDateStamp = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

function hydrateFormFromProduct({
  product,
  collection,
  shapes,
  allLeatherColors,
  stitchingThreadColors,
  embroideryThreadColors,
}) {
  const allShapes = shapes.reduce((acc, shape) => {
    acc[shape.value] = createInitialShapeState(shape);
    return acc;
  }, {});

  const stylesById = new Map((collection?.styles ?? []).map((s) => [s.value, s]));
  for (const variant of product.variants ?? []) {
    const shapeId = variant.singleShape;
    if (!shapeId || !allShapes[shapeId]) continue;
    allShapes[shapeId] = {
      ...allShapes[shapeId],
      isSelected: true,
      style: variant.singleStyle ? stylesById.get(variant.singleStyle) || null : null,
    };
  }

  for (const [shapeValue, row] of Object.entries(allShapes)) {
    if (!row?.isSelected) continue;
    const shapeDef = shapes.find((s) => s.value === shapeValue);
    if (!shapeDef) continue;
    allShapes[shapeValue] = {
      ...row,
      needsColorDesignation: computeShapeNeedsColorDesignation(
        shapeDef,
        row,
        shapes,
        allShapes
      ),
    };
  }

  const byLeatherId = new Map((allLeatherColors || []).map((x) => [x.value, x]));
  const primaryLeather = product.leathersUsed?.[0]
    ? byLeatherId.get(product.leathersUsed[0]) || null
    : null;
  const secondaryLeather = product.leathersUsed?.[1]
    ? byLeatherId.get(product.leathersUsed[1]) || null
    : null;

  const stitchingById = new Map((stitchingThreadColors || []).map((x) => [x.value, x]));
  const embroideryById = new Map((embroideryThreadColors || []).map((x) => [x.value, x]));

  const stitchingThreads = (product.amannThreadsUsed || []).reduce((acc, id) => {
    const row = stitchingById.get(id);
    if (row) acc[id] = row;
    return acc;
  }, {});
  const embroideryThreads = (product.isacordThreadsUsed || []).reduce((acc, id) => {
    const row = embroideryById.get(id);
    if (row) acc[id] = row;
    return acc;
  }, {});

  return {
    ...initialFormState,
    shapes,
    allShapes,
    collection,
    selectedFont: product.fontRef || "",
    leatherColors: {
      primary: primaryLeather || initialFormState.leatherColors.primary,
      secondary: secondaryLeather,
    },
    stitchingThreads,
    embroideryThreads,
    existingProducts: collection?.versioningSkus?.existingProducts ?? [],
  };
}

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  return dataLoader({ admin, includeCommonDescription: false });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "listProducts") {
    const collectionId = String(formData.get("collectionId") || "").trim();
    const products = await fetchActiveProductsForCollection(admin, collectionId);
    return { success: true, products };
  }

  if (intent === "loadProduct") {
    const productId = String(formData.get("productId") || "").trim();
    const product = await fetchProductForUpdate(admin, productId);
    return { success: true, product };
  }

  if (intent === "updateProduct") {
    try {
      const productId = String(formData.get("productId") || "").trim();
      const productData = JSON.parse(String(formData.get("productData") || "{}"));
      const existing = await fetchProductForUpdate(admin, productId);
      if (!existing) {
        return { success: false, error: "Could not load selected product for update." };
      }
      const result = await updateShopifyProduct(admin, {
        productId,
        existingProduct: existing,
        productData,
        preserveExistingInventory: true,
        defaultNewVariantQuantity: 5,
      });
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message || String(error) };
    }
  }

  return { success: false, error: "Unknown action intent." };
};

export default function UpdateProducts() {
  const {
    leatherColors: allLeatherColors,
    stitchingThreadColors,
    embroideryThreadColors,
    fonts,
    shapes,
    shopifyCollections,
    error,
  } = useLoaderData();

  const leatherColors = useMemo(
    () => (allLeatherColors || []).filter((lc) => lc.isActive !== false),
    [allLeatherColors]
  );

  const completeInitialState = useMemo(() => {
    const allShapes = shapes.reduce((acc, shape) => {
      acc[shape.value] = createInitialShapeState(shape);
      return acc;
    }, {});
    return {
      ...initialFormState,
      shapes,
      allShapes,
      existingProducts: [],
    };
  }, [shapes]);

  const [formState, handleChange] = useFormState(completeInitialState);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productsForCollection, setProductsForCollection] = useState([]);
  const [productData, setProductData] = useState(null);
  const [descriptionPlain, setDescriptionPlain] = useState("");
  const [generationError, setGenerationError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const listFetcher = useFetcher();
  const loadFetcher = useFetcher();
  const submitFetcher = useFetcher();

  useEffect(() => {
    if (listFetcher.data?.success) {
      setProductsForCollection(listFetcher.data.products || []);
      setSelectedProductId("");
      setSelectedProduct(null);
      setProductData(null);
      setDescriptionPlain("");
    }
  }, [listFetcher.data]);

  useEffect(() => {
    if (loadFetcher.data?.success && loadFetcher.data.product) {
      const loaded = loadFetcher.data.product;
      setSelectedProduct(loaded);
      setDescriptionPlain(toPlainText(loaded.descriptionHtml));
      const collection =
        shopifyCollections.find((c) => c.value === formState.collection?.value) || null;
      if (!collection) return;
      const hydrated = hydrateFormFromProduct({
        product: loaded,
        collection,
        shapes,
        allLeatherColors: leatherColors,
        stitchingThreadColors,
        embroideryThreadColors,
      });
      handleChange("hydrateForm", hydrated);
    }
  }, [
    loadFetcher.data,
    shopifyCollections,
    formState.collection?.value,
    shapes,
    leatherColors,
    stitchingThreadColors,
    embroideryThreadColors,
    handleChange,
  ]);

  useEffect(() => {
    if (!submitFetcher.data) return;
    if (submitFetcher.data.success) {
      setSubmitSuccess(submitFetcher.data.result || { success: true });
      setSubmitError(null);
    } else {
      setSubmitSuccess(null);
      setSubmitError(submitFetcher.data.error || "Update failed.");
    }
  }, [submitFetcher.data]);

  const onCollectionChange = useCallback(
    (field, value) => {
      handleChange(field, value);
      if (field === "updateCollection") {
        const collectionId = value?.collection?.value;
        setProductsForCollection([]);
        setSelectedProductId("");
        setSelectedProduct(null);
        setProductData(null);
        setDescriptionPlain("");
        setGenerationError(null);
        if (collectionId) {
          const fd = new FormData();
          fd.append("intent", "listProducts");
          fd.append("collectionId", collectionId);
          listFetcher.submit(fd, { method: "post" });
        }
      } else {
        setProductData(null);
      }
    },
    [handleChange, listFetcher]
  );

  const productOptions = useMemo(
    () => [
      { label: "Select active product...", value: "" },
      ...productsForCollection.map((p) => ({
        label: p.baseSku ? `${p.title} (${p.baseSku})` : p.title,
        value: p.id,
      })),
    ],
    [productsForCollection]
  );

  const handleSelectProduct = useCallback(
    (id) => {
      setSelectedProductId(id);
      setSelectedProduct(null);
      setProductData(null);
      setGenerationError(null);
      if (!id) return;
      const fd = new FormData();
      fd.append("intent", "loadProduct");
      fd.append("productId", id);
      loadFetcher.submit(fd, { method: "post" });
    },
    [loadFetcher]
  );

  const handleGeneratePreview = useCallback(async () => {
    setIsGenerating(true);
    setGenerationError(null);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      if (!selectedProduct) {
        throw new Error("Select an active product first.");
      }
      const baseSku = String(selectedProduct.baseSku || "").trim();
      if (!baseSku) {
        throw new Error(
          "Selected product is missing custom.base_sku, so update mode cannot create/reconcile variants safely."
        );
      }
      const validation = validateProductForm(formState);
      if (!validation.isValid) {
        throw new Error((validation.errors || []).join("\n"));
      }
      const skuInfo = buildSkuInfoFromProductBaseSku(baseSku);
      if (!skuInfo?.parts?.length) {
        throw new Error("Unable to parse base SKU for update generation.");
      }
      const variants = await generateVariants(formState, {
        parts: skuInfo.parts,
        version: skuInfo.version,
      });
      if (!variants.length) {
        throw new Error("No variants generated from current form.");
      }
      const updateDateFolder = `originals-${todayDateStamp()}`;
      const next = {
        title: selectedProduct.title,
        mainHandle: selectedProduct.handle,
        productType: selectedProduct.productType || formState.collection?.label || "",
        tags: selectedProduct.tags || [],
        descriptionHTML: plainProductDescriptionToHtml(descriptionPlain),
        seoTitle: selectedProduct.title,
        variants,
        additionalViews: [],
        collection: formState.collection,
        selectedFont: formState.selectedFont,
        selectedLeatherColor1: formState.leatherColors.primary?.value || "",
        selectedLeatherColor2: formState.leatherColors.secondary?.value || null,
        stitchingThreads: formState.stitchingThreads,
        versionedBaseSku: baseSku,
        googleDriveFolderUrl: selectedProduct.googleDriveFolderUrl || null,
        productPictureFolder: selectedProduct.handle,
        originalsFolderName: updateDateFolder,
        shopifyProductMetafields: buildShopifyProductMetafields(formState, variants),
      };
      setProductData(next);
    } catch (err) {
      setProductData(null);
      setGenerationError(err?.message || String(err));
    } finally {
      setIsGenerating(false);
    }
  }, [selectedProduct, formState, descriptionPlain]);

  const diffSummary = useMemo(() => {
    if (!productData || !selectedProduct) return null;
    const existingBySku = new Map(
      (selectedProduct.variants || [])
        .filter((v) => v?.sku)
        .map((v) => [String(v.sku).trim(), v])
    );
    let creates = 0;
    let updates = 0;
    let skippedManualPrice = 0;
    for (const row of productData.variants || []) {
      const sku = String(row?.sku || "").trim();
      if (!sku) continue;
      const existing = existingBySku.get(sku);
      if (!existing) {
        creates += 1;
        continue;
      }
      if (
        Number.parseFloat(existing.price) === Number.parseFloat(existing.compareAtPrice)
      ) {
        updates += 1;
      } else {
        skippedManualPrice += 1;
      }
    }
    return { creates, updates, skippedManualPrice };
  }, [productData, selectedProduct]);

  const handleSubmit = useCallback(() => {
    if (!productData || !selectedProductId) return;
    const fd = new FormData();
    fd.append("intent", "updateProduct");
    fd.append("productId", selectedProductId);
    fd.append("productData", JSON.stringify(productData));
    submitFetcher.submit(fd, { method: "post" });
  }, [productData, selectedProductId, submitFetcher]);

  if (error) return <div>Error: {error}</div>;

  return (
    <Page>
      <TitleBar title="Update existing product" />
      <Layout>
        {submitSuccess && (
          <Layout.Section>
            <Banner status="success">
              Product updated. Created variants: {submitSuccess.createdVariantCount ?? 0}, updated
              variants: {submitSuccess.updatedVariantCount ?? 0}, manual-price variants left
              untouched: {submitSuccess.skippedManualPriceCount ?? 0}.
            </Banner>
          </Layout.Section>
        )}
        {(generationError || submitError) && (
          <Layout.Section>
            <Banner status="critical">{generationError || submitError}</Banner>
          </Layout.Section>
        )}
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="400">
                <CollectionSelector
                  shopifyCollections={shopifyCollections}
                  formState={formState}
                  onChange={onCollectionChange}
                />
                <Select
                  label="Active product"
                  options={productOptions}
                  value={selectedProductId}
                  onChange={handleSelectProduct}
                  disabled={!formState.collection?.value}
                />
                {selectedProduct?.baseSku ? (
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Base SKU anchor: {selectedProduct.baseSku}
                  </Text>
                ) : null}
                {selectedProduct && !selectedProduct.baseSku ? (
                  <Banner status="warning">
                    This product does not have `custom.base_sku`. Update submission is blocked.
                  </Banner>
                ) : null}
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <LeatherColorSelector
                  leatherColors={leatherColors}
                  formState={formState}
                  onChange={onCollectionChange}
                />
                <FontSelector fonts={fonts} formState={formState} onChange={onCollectionChange} />
                <ThreadColorSelector
                  stitchingThreadColors={stitchingThreadColors}
                  embroideryThreadColors={embroideryThreadColors}
                  formState={formState}
                  onChange={onCollectionChange}
                />
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <ShapeSelector
                  shapes={shapes}
                  formState={formState}
                  handleChange={onCollectionChange}
                />
                <Button
                  primary
                  onClick={handleGeneratePreview}
                  loading={isGenerating}
                  disabled={!selectedProductId || !selectedProduct?.baseSku}
                >
                  Preview Update Data
                </Button>
              </BlockStack>
            </Card>

            {productData && (
              <Card>
                <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Update preview
                  </Text>
                  {diffSummary ? (
                    <Box>
                      <InlineStack gap="300" wrap>
                        <Text as="p" variant="bodyMd">
                          Creates: {diffSummary.creates}
                        </Text>
                        <Text as="p" variant="bodyMd">
                          Price updates: {diffSummary.updates}
                        </Text>
                        <Text as="p" variant="bodyMd">
                          Manual price untouched: {diffSummary.skippedManualPrice}
                        </Text>
                      </InlineStack>
                    </Box>
                  ) : null}
                  <ProductVariantCheck
                    productData={productData}
                    listingCollection={formState.collection}
                    descriptionPlainText={descriptionPlain}
                    onDescriptionPlainTextChange={setDescriptionPlain}
                    descriptionPlaceholder="Edit product description"
                  />
                  <Button
                    primary
                    loading={submitFetcher.state === "submitting"}
                    onClick={handleSubmit}
                    disabled={submitFetcher.state === "submitting" || !selectedProduct?.baseSku}
                  >
                    Apply Product Update
                  </Button>
                </BlockStack>
              </Card>
            )}
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
