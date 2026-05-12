// app/routes/app.createProducts.jsx

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useLoaderData, useFetcher, useLocation } from "@remix-run/react";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import {
  validateProductForm,
  includeStyleInVariantTitle,
  sortedStitchingThreadsList,
  sortedEmbroideryThreadsList,
} from "../lib/utils";
import { formatUnknownApiError } from "../lib/utils/formatApiError.js";
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
/* Cloudinary folder lookup disabled — re-enable in app/lib/utils/cloudinary.js:
import { getCloudinaryFolderPath } from "../lib/utils/cloudinary";
*/
import { convertDroppedFileToReferenceImage } from "../lib/utils/referenceImageClient.js";
import {
  formatGoogleDriveUploadErrorMessage,
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

    /* Cloudinary folder ID for notification email — disabled (see cloudinary.js)
    let cloudinaryFolderId = null;
    const hasVariantOrViewImages =
      (productData.additionalViews?.length ?? 0) > 0 ||
      Object.values(productData.variants || {}).some((v) => v.images?.length > 0);
    if (hasVariantOrViewImages) {
      cloudinaryFolderId = await getCloudinaryFolderPath(
        `products/${productData.productType}/${productData.mainHandle}`
      );
    }
    */
    const cloudinaryFolderId = null;

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
        errors: [
          typeof error === "string"
            ? error
            : formatUnknownApiError(error) || "An unexpected error occurred",
        ],
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
    if (leatherColorsLoadError) {
      parts.push(`Leather colors: ${formatUnknownApiError(leatherColorsLoadError)}`);
    }
    if (fontsLoadError) {
      parts.push(`Fonts: ${formatUnknownApiError(fontsLoadError)}`);
    }
    if (stitchingThreadColorsLoadError) {
      parts.push(`Stitching threads: ${formatUnknownApiError(stitchingThreadColorsLoadError)}`);
    }
    if (embroideryThreadColorsLoadError) {
      parts.push(`Embroidery threads: ${formatUnknownApiError(embroideryThreadColorsLoadError)}`);
    }
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

  /**
   * Local lock for the Create Product flow. `isSubmitting` (derived from `fetcher.state` below)
   * only flips true *after* `fetcher.submit` is called, but `handleSubmit` does a non-trivial
   * amount of async work first (reference image upload, per-variant Drive uploads). Without a
   * separate lock the button stays clickable during that window — Karl could fire the whole
   * pipeline five times in a row before the fetcher even started.
   *
   * `isProcessing` drives the button's spinner/disabled state; `submitInFlightRef` is a
   * synchronous re-entrancy guard for rapid clicks that fire before React can re-render.
   * Both are released either explicitly (early-error paths in `handleSubmit`) or by the
   * fetcher-state effect below when the network round-trip finishes.
   */
  const [isProcessing, setIsProcessing] = useState(false);
  const submitInFlightRef = useRef(false);

  const [aiDescription, setAiDescription] = useState("");
  const [referenceImage, setReferenceImage] = useState(null);
  const [referenceImageFile, setReferenceImageFile] = useState(null);
  const [referencePreviewUrl, setReferencePreviewUrl] = useState(null);
  const [groupImageDriveFileId, setGroupImageDriveFileId] = useState(null);

  /**
   * Per-shape staged image files, captured inline in the shape rows. Shape:
   *   { [shapeValue]: { [viewLabel]: { file: File, previewUrl: string } } }
   *
   * Drive upload is deferred until `handleSubmit` — at that point `generateProductData` has
   * already run, so `variant.sku` exists. This mirrors how `referenceImageFile` is staged for the
   * group/reference image until submit.
   */
  const [pendingVariantImages, setPendingVariantImages] = useState({});

  /**
   * Captures per-variant Drive upload failures + the resolved folder URL during `handleSubmit`
   * so we can splice them into `successDetails` once the Shopify product is created. The product
   * itself is created regardless — image upload failures are surfaced as a warning with a Drive
   * folder link so Karl can drop the missing files in manually.
   */
  const pendingUploadFailuresRef = useRef(null);

  const prevCollectionIdRef = useRef(undefined);

  /** Revokes every previewUrl in a `pendingVariantImages` shape. */
  const revokePendingVariantImageUrls = useCallback((map) => {
    if (!map) return;
    for (const byLabel of Object.values(map)) {
      if (!byLabel) continue;
      for (const entry of Object.values(byLabel)) {
        if (entry?.previewUrl) URL.revokeObjectURL(entry.previewUrl);
      }
    }
  }, []);

  const clearPendingVariantImages = useCallback(() => {
    setPendingVariantImages((prev) => {
      revokePendingVariantImageUrls(prev);
      return {};
    });
  }, [revokePendingVariantImageUrls]);

  const handleSetPendingImage = useCallback((shapeValue, label, file) => {
    if (!shapeValue || !label) return;
    setPendingVariantImages((prev) => {
      const prevEntry = prev?.[shapeValue]?.[label];
      if (prevEntry?.previewUrl) URL.revokeObjectURL(prevEntry.previewUrl);

      if (!file) {
        const nextForShape = { ...(prev?.[shapeValue] ?? {}) };
        delete nextForShape[label];
        const next = { ...(prev ?? {}) };
        if (Object.keys(nextForShape).length === 0) {
          delete next[shapeValue];
        } else {
          next[shapeValue] = nextForShape;
        }
        return next;
      }

      const previewUrl = URL.createObjectURL(file);
      return {
        ...(prev ?? {}),
        [shapeValue]: {
          ...(prev?.[shapeValue] ?? {}),
          [label]: { file, previewUrl },
        },
      };
    });
  }, []);

  useEffect(() => {
    const id = formState.collection?.value;
    if (prevCollectionIdRef.current !== undefined && prevCollectionIdRef.current !== id) {
      /** Reference/group image is intentionally preserved across collection changes */
      setAiDescription("");
      setProductData(null);
      setGenerationError(null);
      /** Staged variant images are SKU-bound; collection switch invalidates the base parts, so
       *  drop the captured files to avoid uploading to a Drive folder that no longer matches. */
      clearPendingVariantImages();
    }
    prevCollectionIdRef.current = id;
  }, [formState.collection?.value, clearPendingVariantImages]);

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
      const { base64, mediaType, previewBlob, normalizedFile } =
        await convertDroppedFileToReferenceImage(file);
      setReferenceImageFile(normalizedFile);
      setReferencePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(previewBlob);
      });
      setReferenceImage({ base64, mediaType });
    } catch (err) {
      const msg = formatUnknownApiError(err) || "Could not read reference image.";
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
            collection: String(data.productType ?? "").trim(),
            folderName: String(data.productPictureFolder ?? "").trim(),
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
    [groupImageDriveFileId, resolveGroupImageBaseSku]
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

  /**
   * Release the local submit lock when the fetcher transitions from in-flight back to idle.
   * Tracking the previous state via a ref avoids a false release on the *first* render (when
   * `fetcher.state` is already 'idle' but the form was never submitted) and on subsequent renders
   * caused by unrelated state changes — we only unlock on a real non-idle → idle transition.
   */
  const prevFetcherStateRef = useRef(fetcher.state);
  useEffect(() => {
    const prev = prevFetcherStateRef.current;
    prevFetcherStateRef.current = fetcher.state;
    if (
      (prev === "submitting" || prev === "loading") &&
      fetcher.state === "idle"
    ) {
      submitInFlightRef.current = false;
      setIsProcessing(false);
    }
  }, [fetcher.state]);

  const resetDescriptionAssets = useCallback(() => {
    setAiDescription("");
    setReferenceImage(null);
    setReferenceImageFile(null);
    setReferencePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setGroupImageDriveFileId(null);
    clearPendingVariantImages();
  }, [clearPendingVariantImages]);

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
      const captured = pendingUploadFailuresRef.current;
      pendingUploadFailuresRef.current = null;

      setProductData(null);
      setGenerationError(null);
      resetDescriptionAssets();

      /** Merge any per-variant Drive failures collected during submit into the success banner so
       *  Karl sees what needs to be added by hand. `handleSuccess` in `useFormNotifications` set
       *  `successDetails` synchronously just before this callback fires, so functional update is
       *  safe here. */
      if (captured && (captured.failures?.length || captured.googleDriveFolderUrl)) {
        setSuccessDetails((prev) =>
          prev
            ? {
                ...prev,
                failedImages: captured.failures ?? [],
                googleDriveFolderUrl: captured.googleDriveFolderUrl ?? null,
              }
            : prev
        );
      }
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
      /** Revoke any object URLs still pinned to staged variant images. */
      setPendingVariantImages((prev) => {
        revokePendingVariantImageUrls(prev);
        return {};
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
          `Could not load existing base SKUs for this collection: ${formatUnknownApiError(vs.loadError) || "unknown error"}`
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

        const selectedShapeRows = Object.values(formState.allShapes || {}).filter(
          (s) => s?.isSelected
        );
        const shapesForPrompt = selectedShapeRows
          .map((s) => {
            const label = typeof s?.label === "string" ? s.label.trim() : "";
            if (!label) return "";
            const styleLabel =
              includeStyleInVariantTitle(formState, s) &&
              typeof s?.style?.label === "string"
                ? s.style.label.trim()
                : "";
            return styleLabel ? `${label} (${styleLabel})` : label;
          })
          .filter(Boolean);

        const stitchingThreadColors = sortedStitchingThreadsList(
          formState.stitchingThreads,
          formState
        )
          .map((t) => (typeof t?.label === "string" ? t.label.trim() : ""))
          .filter(Boolean);

        const embroideryThreadColors = sortedEmbroideryThreadsList(
          formState.embroideryThreads
        )
          .map((t) => (typeof t?.label === "string" ? t.label.trim() : ""))
          .filter(Boolean);

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
            shapes: shapesForPrompt,
            stitchingThreadColors,
            embroideryThreadColors,
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
      const detail = formatUnknownApiError(error);
      console.error("[Product Creation] Data Generation Failed:", {
        error: detail || error?.message,
        stack: process.env.NODE_ENV === "development" ? error?.stack : undefined,
        formState: {
          collection: formState.collection,
          shapes: Object.keys(formState.allShapes || {}),
        },
      });
      const msg =
        detail ||
        (typeof error === "string" ? error : "") ||
        "An unexpected error occurred";
      setGenerationError(msg.trim() ? msg.trim() : "An unexpected error occurred");
      setProductData(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    /** Synchronous re-entrancy guard: drop any extra clicks that land before React re-renders
     *  the disabled button. Validation errors below run *before* taking the lock so a missing
     *  description doesn't trap the user in a locked state. */
    if (submitInFlightRef.current) return;

    if (!productData) {
      setSubmissionError("Please generate product data first");
      return;
    }

    if (!String(aiDescription ?? "").trim()) {
      setSubmissionError("Please write a description before creating the product.");
      return;
    }

    submitInFlightRef.current = true;
    setIsProcessing(true);

    setSubmissionError(null);
    pendingUploadFailuresRef.current = null;

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
        formatGoogleDriveUploadErrorMessage(error) ||
        "Failed to upload group image to Google Drive.";
      setSubmissionError(msg);
      submitInFlightRef.current = false;
      setIsProcessing(false);
      return;
    }

    /**
     * Per-variant Drive uploads (Front/Back/Top/etc., per representative shape row).
     *
     * Variant images are Drive-only — Shopify never sees them — so the product is created
     * regardless of upload failures. Failures are surfaced post-submit via the success banner
     * with a link back to the Drive folder.
     */
    const failedImages = [];
    let resolvedFolderUrl =
      typeof payload.googleDriveFolderUrl === "string" &&
      payload.googleDriveFolderUrl.trim()
        ? payload.googleDriveFolderUrl
        : null;

    const variantsBySelectedShape = Array.isArray(payload.variants)
      ? payload.variants.filter((v) => v && !v.isCustom)
      : [];

    for (const [shapeValue, labelMap] of Object.entries(pendingVariantImages ?? {})) {
      if (!labelMap) continue;
      const variant = variantsBySelectedShape.find(
        (v) => v.shapeValue === shapeValue
      );
      if (!variant) {
        for (const label of Object.keys(labelMap)) {
          failedImages.push({
            sku: null,
            label,
            shapeValue,
            error:
              "No matching variant was found for this shape. Click Preview Product Data again and retry.",
          });
        }
        continue;
      }

      for (const [label, entry] of Object.entries(labelMap)) {
        if (!entry?.file) continue;
        try {
          const driveData = await uploadToGoogleDrive(entry.file, {
            collection: payload.productType,
            folderName: payload.productPictureFolder,
            sku: variant.sku,
            label,
            originalsFolderName: payload.originalsFolderName,
          });
          const folderUrl = driveData?.folderPath?.productFolderUrl;
          if (folderUrl && !resolvedFolderUrl) {
            resolvedFolderUrl = folderUrl;
          }
        } catch (err) {
          failedImages.push({
            sku: variant.sku,
            label,
            error:
              formatGoogleDriveUploadErrorMessage(err) || "Upload failed.",
          });
        }
      }
    }

    if (resolvedFolderUrl && !payload.googleDriveFolderUrl) {
      payload = { ...payload, googleDriveFolderUrl: resolvedFolderUrl };
      setProductData(payload);
    }

    pendingUploadFailuresRef.current = {
      failures: failedImages,
      googleDriveFolderUrl: resolvedFolderUrl,
    };

    const formData = new FormData();
    formData.append('productData', JSON.stringify(payload));
    
    fetcher.submit(formData, { 
      method: 'POST', 
      enctype: "multipart/form-data" 
    });
  };

  if (error) {
    return (
      <div>Error: {formatUnknownApiError(error) || "Failed to load page data."}</div>
    );
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
                    <Text as="p" variant="bodySm" tone="subdued">
                      JPEG or PNG only (HEIC is not supported).
                    </Text>
                    <Box maxWidth="260px" minWidth={0}>
                      <ImageDropZone
                        size="small"
                        label="Upload"
                        customWidth="100%"
                        customHeight="132px"
                        uploadedImageUrl={referencePreviewUrl}
                        onDrop={handleReferenceFiles}
                        accept="image/jpeg,image/jpg,image/png,.jpg,.jpeg,.png"
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
                pendingVariantImages={pendingVariantImages}
                onSetPendingImage={handleSetPendingImage}
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
                  loading={isSubmitting || isProcessing}
                  disabled={isSubmitting || isProcessing}
                  onClick={handleSubmit}
                >
                  {isSubmitting || isProcessing
                    ? "Creating product…"
                    : "Create Product"}
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