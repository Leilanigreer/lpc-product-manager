// app/routes/app.createProducts.jsx

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { validateProductForm } from "../lib/utils";
import { loader as dataLoader } from "../lib/loaders";
import { generateProductData, generateTitle } from "../lib/generators";
import { plainProductDescriptionToHtml } from "../lib/generators/htmlDescription";
import { initialFormState, createInitialShapeState } from "../lib/forms/formState";
import { useFormState } from "../hooks/useFormState";
import { useFormNotifications } from "../hooks/useFormNotifications.js";
import { createShopifyProduct } from "../lib/server/shopifyOperations.server.js";
import { saveProductToDatabase } from "../lib/server/productOperations.server.js";
import { sendInternalEmail } from "../services/email.server";
import { generateProductCreationNotification } from "../templates/product-creation-notification";
import { getCloudinaryFolderPath } from "../lib/utils/cloudinary";
import { convertDroppedFileToReferenceImage } from "../lib/utils/referenceImageClient.js";
import {
  CollectionSelector,
  FontSelector,
  LeatherColorSelector,
  ProductSuccessBanner,
  ProductTypeSelector,
  ShapeSelector,
  ThreadColorSelector,
  ProductVariantCheck,
} from "../components";
import ImageDropZone from "../components/ImageDropZone.jsx";

import {
  Page,
  Layout,
  Card,
  BlockStack,
  Button,
  Banner,
  Text,
  Box,
} from "@shopify/polaris";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  return dataLoader({ admin, includeCommonDescription: false });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const productData = JSON.parse(formData.get('productData'));

  try {
    const shopifyResponse = await createShopifyProduct(admin, productData);

    // Only get Cloudinary folder ID if there are images
    let cloudinaryFolderId = null;
    if (productData.additionalViews?.length > 0 || 
        Object.values(productData.variants || {}).some(v => v.images?.length > 0)) {
      cloudinaryFolderId = await getCloudinaryFolderPath(`products/${productData.productType}/${productData.mainHandle}`);
    }

    const dbSaveResult = await saveProductToDatabase(productData, shopifyResponse, cloudinaryFolderId);

    // Send notification email about new product creation
    const htmlContent = generateProductCreationNotification({
      product: shopifyResponse.product,
      databaseSave: dbSaveResult,
      shop: shopifyResponse.shop,
      cloudinaryFolderId: cloudinaryFolderId,
      hasImages: !!cloudinaryFolderId
    });

    await sendInternalEmail(
      `Karl just created ${shopifyResponse.product.title}`,
      `Karl just created a new set on the website.`,
      htmlContent
    );

    return {
      ...shopifyResponse,
      databaseSave: dbSaveResult,
      success: true
    };
  } catch (error) {
    console.error('Product creation failed:', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    return new Response(
      JSON.stringify({
        errors: [typeof error === 'string' ? error : error.message || "An unexpected error occurred"]
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};

export default function CreateProduct() {
  const { 
    leatherColors: allLeatherColors, 
    leatherColorsLoadError,
    stitchingThreadColors,
    stitchingThreadColorsLoadError,
    embroideryThreadColors,
    embroideryThreadColorsLoadError,
    fonts, 
    fontsLoadError,
    shapes, 
    shopifyCollections,
    error
  } = useLoaderData();

  const shopifyResourceLoadErrors = React.useMemo(() => {
    const parts = [];
    if (leatherColorsLoadError) parts.push(`Leather colors: ${leatherColorsLoadError}`);
    if (fontsLoadError) parts.push(`Fonts: ${fontsLoadError}`);
    if (stitchingThreadColorsLoadError) parts.push(`Stitching threads: ${stitchingThreadColorsLoadError}`);
    if (embroideryThreadColorsLoadError) parts.push(`Embroidery threads: ${embroideryThreadColorsLoadError}`);
    return parts;
  }, [
    leatherColorsLoadError,
    fontsLoadError,
    stitchingThreadColorsLoadError,
    embroideryThreadColorsLoadError,
  ]);

  const leatherColors = React.useMemo(
    () => (allLeatherColors || []).filter((lc) => lc.isActive !== false),
    [allLeatherColors]
  );

  const previewRef = React.useRef(null);

  const scrollToPreview = () => {
    if (previewRef.current) {
      const element = previewRef.current;
      const elementRect = element.getBoundingClientRect();
      const offsetTop = elementRect.top + window.scrollY;
      const topPosition = offsetTop - 20;

      window.scrollTo({
        top: topPosition,
        behavior: 'smooth',
      });
    }
  };

  const completeInitialState = useMemo(() => {
    const allShapes = shapes.reduce((acc, shape) => ({
      ...acc,
      [shape.value]: createInitialShapeState(shape)
    }), {});

    return {
      ...initialFormState,
      shapes,
      allShapes,
      existingProducts: [],
    };
  }, [shapes]);

  const fetcher = useFetcher();

  const [productData, setProductData] = useState(null);
  const [formState, handleChange] = useFormState(completeInitialState, setProductData);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [previewCollectionSkuDebug, setPreviewCollectionSkuDebug] = useState(null);

  const [aiDescription, setAiDescription] = useState("");
  const [referenceImage, setReferenceImage] = useState(null);
  const [referencePreviewUrl, setReferencePreviewUrl] = useState(null);
  const prevCollectionIdRef = useRef(undefined);

  useEffect(() => {
    const id = formState.collection?.value;
    if (prevCollectionIdRef.current !== undefined && prevCollectionIdRef.current !== id) {
      setAiDescription("");
      setReferenceImage(null);
      setReferencePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setProductData(null);
      setGenerationError(null);
      setPreviewCollectionSkuDebug(null);
    }
    prevCollectionIdRef.current = id;
  }, [formState.collection?.value]);

  useEffect(() => {
    setProductData((prev) => {
      if (!prev) return prev;
      const nextHtml = plainProductDescriptionToHtml(aiDescription);
      if (prev.descriptionHTML === nextHtml) return prev;
      return { ...prev, descriptionHTML: nextHtml };
    });
  }, [aiDescription]);

  const handleReferenceFiles = useCallback(async (files) => {
    setGenerationError(null);
    const file = files?.[0];
    if (!file) {
      setGenerationError("Please drop a valid image file.");
      return;
    }
    try {
      const { base64, mediaType, previewBlob } = await convertDroppedFileToReferenceImage(file);
      setReferencePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(previewBlob);
      });
      setReferenceImage({ base64, mediaType });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setGenerationError(msg);
    }
  }, []);

  const handleImageUpload = useCallback((sku, label, displayUrl, { driveData, cloudinaryData }) => {
    if (!productData) return;

    setProductData(prevData => {
      const newData = { ...prevData };
      
      if (driveData?.folderPath?.productFolderUrl && !newData.googleDriveFolderUrl) {
        newData.googleDriveFolderUrl = driveData.folderPath.productFolderUrl;
      }
      
      const variant = newData.variants.find(v => v.sku === sku);
      if (variant) {
        variant.images = variant.images || [];
        
        const existingImageIndex = variant.images.findIndex(img => img.label === label);
        
        if (existingImageIndex >= 0) {
          variant.images[existingImageIndex] = { 
            label, 
            displayUrl,
            driveData: driveData || null,
            cloudinaryData: cloudinaryData || null
          };
        } else {
          variant.images.push({ 
            label, 
            displayUrl,
            driveData: driveData || null,
            cloudinaryData: cloudinaryData || null
          });
        }
      } else {
        newData.additionalViews = newData.additionalViews || [];
        
        const existingImageIndex = newData.additionalViews.findIndex(img => img.label === label);
        
        if (existingImageIndex >= 0) {
          newData.additionalViews[existingImageIndex] = { 
            label, 
            displayUrl,
            driveData: driveData || null,
            cloudinaryData: cloudinaryData || null
          };
        } else {
          newData.additionalViews.push({ 
            label, 
            displayUrl,
            driveData: driveData || null,
            cloudinaryData: cloudinaryData || null
          });
        }
      }
      
      return newData;
    });
  }, [productData]);

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Product Creation] Form State Updated:', {
        collection: formState.collection,
        productType: formState.productType,
        shapes: Object.keys(formState.allShapes || {})
      });
    }
  }, [formState]);

  const isSubmitting = ["loading", "submitting"].includes(fetcher.state) && fetcher.formMethod === "POST";

  const resetDescriptionAssets = useCallback(() => {
    setAiDescription("");
    setReferenceImage(null);
    setReferencePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const {
    notification,
    setNotification,
    submissionError,
    setSubmissionError,
    successDetails,
    setSuccessDetails
  } = useFormNotifications({
    fetcher,
    handleChange,
    onSuccess: () => {
      setProductData(null);
      setGenerationError(null);
      resetDescriptionAssets();
    }
  });  

  React.useEffect(() => {
    return () => {
      setProductData(null);
      setGenerationError(null);
      setSubmissionError(null);
      setNotification(null);
      setSuccessDetails(null);
      setReferencePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerateData = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    setPreviewCollectionSkuDebug(null);

    try {
      const validation = validateProductForm(formState);
      if (!validation.isValid) {
        throw new Error(validation.errors.join('\n'));
      }

      if (!formState?.collection?.value) {
        throw new Error('Invalid collection configuration');
      }

      const collectionGid = formState.collection.value;
      const vs = formState.collection?.versioningSkus;
      if (vs == null) {
        throw new Error(
          "Collection base SKU data is missing. Reload this page so the server can load Shopify data (versioningSkus on the collection)."
        );
      }
      if (vs.loadError) {
        throw new Error(
          `Could not load existing base SKUs for this collection: ${vs.loadError}`
        );
      }

      const existingProducts = vs.existingProducts ?? [];
      const shopifyGraphqlPages = vs.shopifyGraphqlPages ?? [];

      setPreviewCollectionSkuDebug({
        collectionId: collectionGid,
        collectionLabel: formState.collection?.label ?? null,
        rowCount: existingProducts.length,
        baseSkuStrings: existingProducts.map((r) => r.baseSKU).filter(Boolean),
        rows: existingProducts,
        shopifyGraphqlPages,
        skuDataSource: "loader",
      });

      const examples = formState.collection.exampleProductDescriptions;
      const isManual = examples == null;

      /** Plain text body for Shopify (AI or hand-written). */
      let descriptionPlain = "";

      if (isManual) {
        descriptionPlain = String(aiDescription).trim();
      } else {
        if (!referenceImage?.base64 || !referenceImage?.mediaType) {
          throw new Error("Upload a reference product image before preview.");
        }
        const title = await generateTitle(formState);
        const res = await fetch("/app/api/generate-product-description", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            title,
            examples,
            imageBase64: referenceImage.base64,
            mediaType: referenceImage.mediaType,
          }),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(payload.error || `Description generation failed (${res.status})`);
        }
        if (!payload.description || typeof payload.description !== "string") {
          throw new Error("Invalid response from description service.");
        }
        const descFromApi = payload.description.trim();
        setAiDescription(descFromApi);
        descriptionPlain = descFromApi;
      }

      const data = await generateProductData(
        { ...formState, existingProducts },
        descriptionPlain
      );

      data.productPictureFolder = data.mainHandle;

      setProductData(data);

      setTimeout(scrollToPreview, 100);
    } catch (error) {
      console.error("[Product Creation] Data Generation Failed:", {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        formState: {
          collection: formState.collection,
          shapes: Object.keys(formState.allShapes || {})
        }
      });
      const msg =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "An unexpected error occurred";
      setGenerationError(msg && String(msg).trim() ? msg : "An unexpected error occurred");
      setProductData(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = () => {
    if (!productData) {
      setSubmissionError("Please generate product data first");
      return;
    }

    if (!String(aiDescription ?? "").trim()) {
      setSubmissionError("Please write a description before creating the product.");
      return;
    }

    setSubmissionError(null);

    const formData = new FormData();
    formData.append('productData', JSON.stringify(productData));
    
    fetcher.submit(formData, { 
      method: 'POST', 
      enctype: "multipart/form-data" 
    });
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <Page>
      <TitleBar title="Create a new product" />
      <Layout>
        {successDetails && (
          <Layout.Section>
            <ProductSuccessBanner
              onDismiss={() => setSuccessDetails(null)}
              {...successDetails}
            />
          </Layout.Section>
        )}

        {notification && (
          <Layout.Section>
            <Banner
              status={notification.status}
              onDismiss={() => setNotification(null)}
            >
              {notification.message}
            </Banner>
          </Layout.Section>
        )}

        {shopifyResourceLoadErrors.length > 0 && (
          <Layout.Section>
            <Banner status="critical" title="Could not load some data from Shopify">
              <BlockStack gap="200">
                {shopifyResourceLoadErrors.map((msg, i) => (
                  <Text key={i} as="p" variant="bodyMd">
                    {msg}
                  </Text>
                ))}
              </BlockStack>
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <BlockStack gap="400">

          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingSm">
                Debug: collection base SKUs
              </Text>
              {!previewCollectionSkuDebug ? (
                <Text as="p" variant="bodyMd" tone="subdued">
                  Select a collection, then click Preview Product Data. Base SKUs are read from
                  Shopify on the server when this page loads (see debug JSON after Preview).{" "}
                  <Text as="span" fontWeight="semibold">
                    custom.base_sku
                  </Text>{" "}
                  is loaded per collection for versioning.
                </Text>
              ) : (
                <BlockStack gap="200">
                  {previewCollectionSkuDebug.collectionIdFromForm !==
                    formState.collection?.value && (
                    <Text as="p" variant="bodyMd" tone="caution">
                      Collection changed since this run — click Preview again to refresh this
                      list.
                    </Text>
                  )}
                  <Box
                    padding="300"
                    background="bg-surface-secondary"
                    borderWidth="025"
                    borderColor="border"
                    borderRadius="200"
                  >
                    <pre
                      style={{
                        margin: 0,
                        fontSize: "12px",
                        overflow: "auto",
                        maxHeight: "min(60vh, 560px)",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {JSON.stringify(previewCollectionSkuDebug, null, 2)}
                    </pre>
                  </Box>
                </BlockStack>
              )}
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="400">
              <ProductTypeSelector
                formState={formState}
                onChange={handleChange}
              />

              <Card>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
                    gap: "24px",
                    alignItems: "start",
                  }}
                >
                  <CollectionSelector
                    shopifyCollections={shopifyCollections}
                    formState={formState}
                    onChange={handleChange}
                    embedded
                  />
                  <BlockStack gap="200">
                    <Text as="h2" variant="headingMd">
                      Group image
                    </Text>
                    <Box maxWidth="260px" minWidth={0}>
                      <ImageDropZone
                        size="small"
                        label="Upload"
                        customWidth="100%"
                        customHeight="132px"
                        uploadedImageUrl={referencePreviewUrl}
                        onDrop={handleReferenceFiles}
                        accept="image/heic,image/heif,.heic,.heif,image/jpeg,image/jpg,image/png"
                      />
                    </Box>
                  </BlockStack>
                </div>
              </Card>

              <LeatherColorSelector
                leatherColors={leatherColors}
                formState={formState}
                onChange={handleChange}
              />
              <FontSelector
                fonts={fonts}
                formState={formState}
                onChange={handleChange}
              />
              <ThreadColorSelector
                stitchingThreadColors={stitchingThreadColors}
                embroideryThreadColors={embroideryThreadColors}
                formState={formState}
                onChange={handleChange}
              />
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="400">
              <ShapeSelector
                shapes={shapes}
                leatherColors={leatherColors}
                embroideryThreadColors={embroideryThreadColors}
                formState={formState}
                handleChange={handleChange}
              />
              {generationError && (
                <Banner status="critical">
                  {generationError}
                </Banner>
              )}

              <Button
                primary
                size="large"
                onClick={handleGenerateData}
                loading={isGenerating}
                disabled={!formState.collection || isGenerating}
              >
                Preview Product Data
              </Button>
            </BlockStack>
          </Card>

          {productData && (
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Preview product data
                </Text>

                <ProductVariantCheck
                  productData={productData}
                  onImageUpload={handleImageUpload}
                  previewScrollRef={previewRef}
                  listingCollection={formState.collection}
                  descriptionPlainText={aiDescription}
                  onDescriptionPlainTextChange={setAiDescription}
                  descriptionPlaceholder="Please write a description"
                />

                {submissionError && (
                  <Banner status="critical">
                    {submissionError}
                  </Banner>
                )}

                <Button
                  primary
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                >
                  Create Product
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