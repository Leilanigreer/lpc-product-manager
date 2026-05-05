// app/routes/app.createProducts.jsx

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useLoaderData, useFetcher, useLocation } from "@remix-run/react";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { validateProductForm } from "../lib/utils";
import { loader as dataLoader } from "../lib/loaders";
import { generateProductData, generateTitle } from "../lib/generators";
import { plainProductDescriptionToHtml } from "../lib/generators/htmlDescription";
import { initialFormState, createInitialShapeState } from "../lib/forms/formState";
import { useFormState } from "../hooks/useFormState";
import { useFormNotifications } from "../hooks/useFormNotifications.js";
import { createShopifyProduct } from "../lib/server/shopifyOperations.server.js";
// import { saveProductToDatabase } from "../lib/server/productOperations.server.js";
import { sendInternalEmail } from "../services/email.server";
import { generateProductCreationNotification } from "../templates/product-creation-notification";
import { getCloudinaryFolderPath } from "../lib/utils/cloudinary";
import { convertDroppedFileToReferenceImage } from "../lib/utils/referenceImageClient.js";
import {
  uploadToGoogleDrive,
  updateToGoogleDrive,
} from "../lib/utils/googleDrive.js";
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

/** Remix data request — without `_data`, same-origin POST is a document request and returns root HTML. */
const GENERATE_DESCRIPTION_REMIX_ROUTE_ID =
  "routes/app.api.generate-product-description";

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
    const hasVariantOrViewImages =
      (productData.additionalViews?.length ?? 0) > 0 ||
      Object.values(productData.variants || {}).some((v) => v.images?.length > 0);
    if (hasVariantOrViewImages) {
      cloudinaryFolderId = await getCloudinaryFolderPath(
        `products/${productData.productType}/${productData.mainHandle}`
      );
    }

    // Postgres persistence paused — restore when ProductSet sync is needed again.
    // const dbSaveResult = await saveProductToDatabase(productData, shopifyResponse, cloudinaryFolderId);
    const databaseSaveStub = {
      mainProduct: {
        mainHandle: productData.mainHandle,
        googleDriveFolderUrl: productData.googleDriveFolderUrl ?? "",
      },
    };

    const hasImages = !!(
      cloudinaryFolderId ||
      (productData.googleDriveFolderUrl && String(productData.googleDriveFolderUrl).trim())
    );

    // Send notification email about new product creation
    const htmlContent = generateProductCreationNotification({
      product: shopifyResponse.product,
      databaseSave: databaseSaveStub,
      shop: shopifyResponse.shop,
      cloudinaryFolderId: cloudinaryFolderId,
      hasImages,
    });

    await sendInternalEmail(
      `Karl just created ${shopifyResponse.product.title}`,
      `Karl just created a new set on the website.`,
      htmlContent
    );

    return {
      ...shopifyResponse,
      mainHandle: productData.mainHandle,
      googleDriveFolderUrl: productData.googleDriveFolderUrl ?? null,
      databaseSave: databaseSaveStub,
      success: true,
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
  const shopify = useAppBridge();
  const location = useLocation();

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

  const [aiDescription, setAiDescription] = useState("");
  const [referenceImage, setReferenceImage] = useState(null);
  const [referenceImageFile, setReferenceImageFile] = useState(null);
  const [referencePreviewUrl, setReferencePreviewUrl] = useState(null);
  const [groupImageDriveFileId, setGroupImageDriveFileId] = useState(null);
  const prevCollectionIdRef = useRef(undefined);

  useEffect(() => {
    const id = formState.collection?.value;
    if (prevCollectionIdRef.current !== undefined && prevCollectionIdRef.current !== id) {
      setAiDescription("");
      setReferenceImage(null);
      setReferenceImageFile(null);
      setReferencePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setProductData(null);
      setGenerationError(null);
      setGroupImageDriveFileId(null);
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
      const { base64, mediaType, previewBlob } =
        await convertDroppedFileToReferenceImage(file);
      setReferenceImageFile(file);
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

  const resolveGroupImageBaseSku = useCallback((data) => {
    const fromProduct =
      typeof data?.versionedBaseSku === "string"
        ? data.versionedBaseSku.trim()
        : "";
    if (fromProduct) return fromProduct;
    if (!data?.variants?.length) return null;
    const first = data.variants.find((v) => !v.isCustom) || data.variants[0];
    const bs = typeof first?.baseSKU === "string" ? first.baseSKU.trim() : "";
    if (bs) return bs;
    return null;
  }, []);

  const handleGroupImageDriveUpload = useCallback(
    async (data, file) => {
      if (!data || !file) return data;
      const baseSku = resolveGroupImageBaseSku(data);
      if (!baseSku) {
        throw new Error("Could not resolve base SKU for this product.");
      }

      try {
        let driveData;
        if (groupImageDriveFileId) {
          driveData = await updateToGoogleDrive(file, groupImageDriveFileId);
        } else {
          driveData = await uploadToGoogleDrive(file, {
            collection: productData.productType,
            folderName: productData.productPictureFolder,
            sku: baseSku,
            label: "group-image",
          });
        }

        if (driveData?.fileId) {
          setGroupImageDriveFileId(driveData.fileId);
        }
        let nextData = data;
        if (driveData?.folderPath?.productFolderUrl) {
          nextData = {
            ...data,
            googleDriveFolderUrl:
              data.googleDriveFolderUrl || driveData.folderPath.productFolderUrl,
          };
        }
        return nextData;
      } catch (err) {
        throw err;
      }
    },
    [productData, groupImageDriveFileId, resolveGroupImageBaseSku]
  );

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
    setReferenceImageFile(null);
    setReferencePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setGroupImageDriveFileId(null);
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

    try {
      const validation = validateProductForm(formState);
      if (!validation.isValid) {
        throw new Error(validation.errors.join('\n'));
      }

      if (!formState?.collection?.value) {
        throw new Error('Invalid collection configuration');
      }

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
        // Embedded auth: Bearer JWT; keep Shopify session query params (e.g. id_token) on the URL.
        const idToken = await shopify.idToken();
        const qs = location.search.startsWith("?")
          ? location.search.slice(1)
          : location.search;
        const dataParams = new URLSearchParams(qs);
        dataParams.set("_data", GENERATE_DESCRIPTION_REMIX_ROUTE_ID);
        const apiUrl = `/app/api/generate-product-description?${dataParams.toString()}`;
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          credentials: "same-origin",
          body: JSON.stringify({
            title,
            examples,
            imageBase64: referenceImage.base64,
            mediaType: referenceImage.mediaType,
          }),
        });
        const raw = await res.text();
        let payload = {};
        try {
          payload = raw ? JSON.parse(raw) : {};
        } catch {
          payload = {};
        }
        if (!res.ok) {
          const fromJson = typeof payload.error === "string" ? payload.error.trim() : "";
          const fromBody =
            raw &&
            raw.length > 0 &&
            raw.length < 600 &&
            !raw.trim().startsWith("<")
              ? raw.trim()
              : "";
          throw new Error(
            fromJson ||
              fromBody ||
              `Description generation failed (${res.status}). If this persists, the tunnel or host may be timing out before Claude responds.`
          );
        }
        if (!payload.description || typeof payload.description !== "string") {
          const ct = res.headers.get("content-type") || "";
          const hint = raw
            ? raw.slice(0, 240).replace(/\s+/g, " ")
            : "(empty body)";
          throw new Error(
            `Invalid response from description service (Content-Type: ${ct || "unknown"}): ${hint}`
          );
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

      setGroupImageDriveFileId(null);

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

  const handleSubmit = async () => {
    if (!productData) {
      setSubmissionError("Please generate product data first");
      return;
    }

    if (!String(aiDescription ?? "").trim()) {
      setSubmissionError("Please write a description before creating the product.");
      return;
    }

    setSubmissionError(null);

    let payload = productData;
    try {
      if (referenceImageFile) {
        payload = await handleGroupImageDriveUpload(productData, referenceImageFile);
        if (payload !== productData) {
          setProductData(payload);
        }
      }
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Failed to upload group image to Google Drive.";
      setSubmissionError(msg);
      return;
    }

    const formData = new FormData();
    formData.append('productData', JSON.stringify(payload));
    
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
                      Reference image
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