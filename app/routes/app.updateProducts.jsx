import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Banner,
  Button,
  Link,
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
  ProductUpdateUserError,
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

/** Loaded Shopify variant: customizable true = base, false = custom */
const variantIsCustomFromLoaded = (v) => {
  const c = v?.customizable;
  if (c === false || c === "false") return true;
  if (c === true || c === "true") return false;
  return String(v?.sku || "")
    .toLowerCase()
    .includes("-custom");
};

/** Shopify Admin product editor URL (numeric id from Product GID). */
function adminProductEditorUrl(storeHandle, productGid) {
  const h = String(storeHandle || "").trim();
  const m = String(productGid || "").match(/Product\/(\d+)/);
  if (!h || !m) return null;
  return `https://admin.shopify.com/store/${h}/products/${m[1]}`;
}

const buildSkuInfoFromProductBaseSku = (baseSku) => {
  const normalized = String(baseSku || "").trim();
  if (!normalized) return null;
  const match = normalized.match(/^(.*)-V(\d+)$/i);
  if (!match) {
    return {
      raw: normalized,
      parts: normalized.split("-").filter(Boolean),
      version: null,
    };
  }
  return {
    raw: normalized,
    parts: String(match[1] || "")
      .split("-")
      .filter(Boolean),
    version: Number(match[2]),
  };
};

/**
 * `custom.amann_threads_used` stores Amann **number** GIDs (see `buildShopifyProductMetafields`).
 * Map them back to `stitchingThreads` keyed by stitching-thread metaobject GID, with `isThread`
 * so validators match `ThreadColorSelector` output.
 */
function buildStitchingThreadsFromProductAmannIds(amannGids, stitchingThreadColors) {
  const ids = Array.isArray(amannGids) ? amannGids.filter(Boolean) : [];
  const threadTemplateByAmannGid = new Map();
  for (const thread of stitchingThreadColors || []) {
    for (const n of thread.amannNumbers || []) {
      if (n?.value) threadTemplateByAmannGid.set(n.value, thread);
    }
  }
  const out = {};
  for (const amannGid of ids) {
    const template = threadTemplateByAmannGid.get(amannGid);
    if (!template?.value) continue;
    const threadKey = template.value;
    if (!out[threadKey]) {
      out[threadKey] = {
        value: template.value,
        label: template.label,
        abbreviation: template.abbreviation || "",
        amannNumbers: [],
        isThread: true,
      };
    }
    const match = (template.amannNumbers || []).find((n) => n.value === amannGid);
    if (!match?.value) continue;
    if (out[threadKey].amannNumbers.some((x) => x.value === amannGid)) continue;
    out[threadKey].amannNumbers.push({
      value: match.value,
      label: match.label,
    });
  }
  return out;
}

/**
 * `custom.isacord_threads_used` stores Isacord **number** GIDs.
 * Map them to `embroideryThreads` keyed by embroidery-thread metaobject GID.
 */
function buildEmbroideryThreadsFromProductIsacordIds(isacordGids, embroideryThreadColors) {
  const ids = Array.isArray(isacordGids) ? isacordGids.filter(Boolean) : [];
  const threadTemplateByIsacordGid = new Map();
  for (const thread of embroideryThreadColors || []) {
    for (const n of thread.isacordNumbers || []) {
      if (n?.value) threadTemplateByIsacordGid.set(n.value, thread);
    }
  }
  const out = {};
  for (const isacordGid of ids) {
    const template = threadTemplateByIsacordGid.get(isacordGid);
    if (!template?.value) continue;
    const threadKey = template.value;
    if (!out[threadKey]) {
      out[threadKey] = {
        value: template.value,
        label: template.label,
        abbreviation: template.abbreviation || "",
        isacordNumbers: [],
        isThread: true,
      };
    }
    const match = (template.isacordNumbers || []).find((n) => n.value === isacordGid);
    if (!match?.value) continue;
    if (out[threadKey].isacordNumbers.some((x) => x.value === isacordGid)) continue;
    out[threadKey].isacordNumbers.push({
      value: match.value,
      label: match.label,
    });
  }
  return out;
}

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
  const selectedShapeValues = new Set();
  const shapeRows = Object.values(allShapes);
  const shapeByValue = new Map(shapeRows.map((row) => [row.value, row]));

  for (const variant of product.variants ?? []) {
    const isBase =
      variant?.isBaseVariant === true ||
      variant?.customizable === true ||
      variant?.customizable === "true";
    if (!isBase) continue;
    const shapeValue = variant.singleShape;
    if (!shapeValue || !shapeByValue.has(shapeValue) || !allShapes[shapeValue]) continue;
    selectedShapeValues.add(shapeValue);
    allShapes[shapeValue] = {
      ...allShapes[shapeValue],
      isSelected: true,
      style: variant.singleStyle
        ? stylesById.get(variant.singleStyle) || null
        : allShapes[shapeValue].style,
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

  const stitchingThreads = buildStitchingThreadsFromProductAmannIds(
    product.amannThreadsUsed,
    stitchingThreadColors
  );
  const embroideryThreads = buildEmbroideryThreadsFromProductIsacordIds(
    product.isacordThreadsUsed,
    embroideryThreadColors
  );

  return {
    hydratedFormState: {
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
    },
    lockedShapeValues: Array.from(selectedShapeValues),
  };
}

function preflightUpdateSkus(selectedProduct, variants) {
  const rows = Array.isArray(variants) ? variants : [];
  const seen = new Set();
  for (const row of rows) {
    const sku = String(row?.sku || "").trim();
    if (!sku) continue;
    if (seen.has(sku)) {
      return `Duplicate SKU in generated update payload: ${sku}`;
    }
    seen.add(sku);
  }
  const existingList = selectedProduct?.variants || [];
  for (const row of rows) {
    const sku = String(row?.sku || "").trim();
    const mine = row.existingVariantId;
    for (const ev of existingList) {
      if (mine && ev.id === mine) continue;
      if (String(ev.sku || "").trim() === sku) {
        return `SKU ${sku} is already used by another variant on this product.`;
      }
    }
  }
  return null;
}

export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop ?? "";
  const storeHandle = shop.replace(/\.myshopify\.com$/i, "");
  const base = await dataLoader({ admin, includeCommonDescription: false });
  return json({ ...base, shop, storeHandle });
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
    if (!product) {
      return { success: false, error: "Could not load product." };
    }
    const loadedBase = String(product.baseSku || "").trim();
    if (loadedBase.startsWith("Art")) {
      return {
        success: false,
        error:
          "Art-line products are not available in this update flow yet. Choose another product.",
      };
    }
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
      const existingBase = String(existing.baseSku || "").trim();
      if (existingBase.startsWith("Art")) {
        return {
          success: false,
          error:
            "Art-line products are not supported in Update existing product yet.",
        };
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
      if (
        error instanceof ProductUpdateUserError ||
        error?.name === "ProductUpdateUserError"
      ) {
        return {
          success: false,
          error: error.message,
          details: error.details || [],
        };
      }
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
    storeHandle = "",
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
  const [submitErrorDetails, setSubmitErrorDetails] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lockedShapeValues, setLockedShapeValues] = useState(new Set());

  const previewRef = useRef(null);
  const scrollToPreview = useCallback(() => {
    const el = previewRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

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
      setLockedShapeValues(new Set());
      setSubmitErrorDetails(null);
      setSubmitError(null);
      setSubmitSuccess(null);
    }
  }, [listFetcher.data]);

  useEffect(() => {
    if (loadFetcher.data == null) return;
    if (loadFetcher.data.success === false) {
      setGenerationError(loadFetcher.data.error || "Could not load product.");
      setSelectedProduct(null);
      setSelectedProductId("");
      setProductData(null);
      setDescriptionPlain("");
      setLockedShapeValues(new Set());
      return;
    }
    if (loadFetcher.data.success && loadFetcher.data.product) {
      setGenerationError(null);
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
      handleChange("hydrateForm", hydrated.hydratedFormState);
      setLockedShapeValues(new Set(hydrated.lockedShapeValues || []));
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
      setSubmitErrorDetails(null);
    } else {
      setSubmitSuccess(null);
      setSubmitError(submitFetcher.data.error || "Update failed.");
      setSubmitErrorDetails(
        Array.isArray(submitFetcher.data.details) ? submitFetcher.data.details : null
      );
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
        setLockedShapeValues(new Set());
        setGenerationError(null);
        setSubmitError(null);
        setSubmitErrorDetails(null);
        setSubmitSuccess(null);
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
      setLockedShapeValues(new Set());
      setGenerationError(null);
      setSubmitError(null);
      setSubmitErrorDetails(null);
      setSubmitSuccess(null);
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
    setSubmitErrorDetails(null);
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
      if (baseSku.startsWith("Art")) {
        throw new Error(
          "Art-line products are not available in this update flow yet."
        );
      }
      const validation = validateProductForm(formState, { productUpdate: true });
      if (!validation.isValid) {
        const detail =
          (validation.errors || []).filter(Boolean).join("\n").trim() ||
          "Validation did not pass. Check font, shapes, leather colors, styles, and thread rows.";
        throw new Error(detail);
      }
      const skuInfo = buildSkuInfoFromProductBaseSku(baseSku);
      if (!skuInfo?.parts?.length) {
        throw new Error("Unable to parse base SKU for update generation.");
      }
      let variants = await generateVariants(formState, {
        ...skuInfo,
        verbatimBaseSku: baseSku,
      });

      const keyToExistingId = new Map();
      for (const ev of selectedProduct.variants || []) {
        if (!ev.singleShape) continue;
        const k = `${ev.singleShape}|${variantIsCustomFromLoaded(ev) ? "1" : "0"}`;
        keyToExistingId.set(k, ev.id);
      }

      variants = variants.map((v) => ({
        ...v,
        variantName: String(v.variantName || "").replace(/^Customize\b/, "Customized"),
        existingVariantId: keyToExistingId.get(
          `${v.shapeValue}|${v.isCustom ? "1" : "0"}`
        ),
      }));
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
      setTimeout(scrollToPreview, 100);
    } catch (err) {
      setProductData(null);
      const msg =
        (err && typeof err.message === "string" && err.message.trim()) ||
        (typeof err === "string" ? err.trim() : "") ||
        "Preview could not be generated.";
      setGenerationError(msg);
    } finally {
      setIsGenerating(false);
    }
  }, [selectedProduct, formState, descriptionPlain, scrollToPreview]);

  const baseVariantsWithSingleShapeCount = useMemo(() => {
    if (!selectedProduct?.variants?.length) return 0;
    return selectedProduct.variants.filter((v) => {
      const isBase =
        v?.isBaseVariant === true ||
        v?.customizable === true ||
        v?.customizable === "true";
      return isBase && String(v?.singleShape || "").trim();
    }).length;
  }, [selectedProduct]);

  const adminProductUrl = useMemo(
    () => adminProductEditorUrl(storeHandle, selectedProduct?.id),
    [storeHandle, selectedProduct?.id]
  );

  const diffSummary = useMemo(() => {
    if (!productData || !selectedProduct) return null;
    let creates = 0;
    let updates = 0;
    let skippedManualPrice = 0;
    for (const row of productData.variants || []) {
      const ex = (selectedProduct.variants || []).find(
        (v) => v.id === row.existingVariantId
      );
      if (!ex) {
        creates += 1;
        continue;
      }
      updates += 1;
      if (
        Number.parseFloat(String(ex.price)) !==
        Number.parseFloat(String(ex.compareAtPrice))
      ) {
        skippedManualPrice += 1;
      }
    }
    return { creates, updates, skippedManualPrice };
  }, [productData, selectedProduct]);

  const handleSubmit = useCallback(() => {
    if (!productData || !selectedProductId || !selectedProduct) return;
    const skuErr = preflightUpdateSkus(selectedProduct, productData.variants);
    if (skuErr) {
      setSubmitError(skuErr);
      setSubmitErrorDetails(null);
      setSubmitSuccess(null);
      return;
    }
    const fd = new FormData();
    fd.append("intent", "updateProduct");
    fd.append("productId", selectedProductId);
    fd.append("productData", JSON.stringify(productData));
    setSubmitError(null);
    setSubmitErrorDetails(null);
    submitFetcher.submit(fd, { method: "post" });
  }, [productData, selectedProductId, selectedProduct, submitFetcher]);

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
            <Banner status="critical" title={generationError || submitError}>
              {Array.isArray(submitErrorDetails) && submitErrorDetails.length > 0 ? (
                <BlockStack gap="100">
                  {submitErrorDetails.map((e, i) => (
                    <Text key={i} as="p" variant="bodySm" tone="subdued">
                      {(Array.isArray(e?.field) ? e.field.join(".") : e?.field) || "shopify"}:{" "}
                      {e?.message || ""}
                    </Text>
                  ))}
                </BlockStack>
              ) : null}
            </Banner>
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
                {formState.collection?.value &&
                listFetcher.state === "idle" &&
                listFetcher.data?.success &&
                productsForCollection.length === 0 ? (
                  <Text as="p" variant="bodyMd" tone="subdued">
                    No eligible active products in this collection. Products whose base SKU starts
                    with &quot;Art&quot; are hidden until a dedicated update flow exists.
                  </Text>
                ) : null}
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
                {selectedProduct && baseVariantsWithSingleShapeCount === 0 ? (
                  <Banner status="warning" title="No shape metafields on base variants yet">
                    <BlockStack gap="200">
                      <Text as="p" variant="bodyMd">
                        None of this product&apos;s base (non-custom) variants have{" "}
                        <code>custom.single_shape</code> set, so this app cannot pre-select or lock
                        shapes. Update the listing in Shopify first (variant metafields), then reload
                        the product here.
                      </Text>
                      {adminProductUrl ? (
                        <Link url={adminProductUrl} target="_top">
                          Open product in Shopify admin
                        </Link>
                      ) : (
                        <Text as="p" variant="bodySm" tone="subdued">
                          Open this product in your Shopify admin to edit variant metafields.
                        </Text>
                      )}
                    </BlockStack>
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
                  lockedShapeValues={lockedShapeValues}
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
                  <Text as="p" variant="bodyMd" tone="subdued">
                    Review variant names, SKUs, and whether Shopify will update an existing variant
                    or create a new one before you apply the update.
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
                    previewScrollRef={previewRef}
                    showVariantReconcileStatus
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
