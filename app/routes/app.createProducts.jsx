// app/routes/app.createProducts.jsx

import React, { useState, useMemo, useCallback } from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { validateProductForm } from "../lib/utils";
import { loader as dataLoader } from "../lib/loaders";
import { generateProductData } from "../lib/generators";
import { initialFormState, createInitialShapeState } from "../lib/forms/formState";
import { useFormState } from "../hooks/useFormState";
import { useFormNotifications } from "../hooks/useFormNotifications.js";
import { createShopifyProduct } from "../lib/server/shopifyOperations.server.js";
import { saveProductToDatabase } from "../lib/server/productOperations.server.js";
import { sendInternalEmail } from "../services/email.server";
import { generateProductCreationNotification } from "../templates/product-creation-notification";
import { getCloudinaryFolderPath } from "../lib/utils/cloudinary";
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

import {
  Page,
  Layout,
  Card,
  BlockStack,
  Button,
  Banner, 
} from "@shopify/polaris";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return dataLoader({ request });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const productData = JSON.parse(formData.get('productData'));

  try {
    const shopifyResponse = await createShopifyProduct(admin, productData);
    const dbSaveResult = await saveProductToDatabase(productData, shopifyResponse);

    // Get Cloudinary folder external ID only when needed for notification
    const cloudinaryFolderId = await getCloudinaryFolderPath(`products/${productData.productType}/${productData.mainHandle}`);

    // Send notification email about new product creation
    const htmlContent = generateProductCreationNotification({
      product: shopifyResponse.product,
      databaseSave: dbSaveResult,
      shop: shopifyResponse.shop,
      cloudinaryFolderId: cloudinaryFolderId
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
    leatherColors, 
    stitchingThreadColors,
    embroideryThreadColors,
    fonts, 
    shapes, 
    shopifyCollections,
    commonDescription, 
    productSets, 
    error 
  } = useLoaderData();

  const completeInitialState = useMemo(() => {
    // Initialize allShapes with all available shapes
    const allShapes = shapes.reduce((acc, shape) => ({
      ...acc,
      [shape.value]: createInitialShapeState(shape)
    }), {});

    return {
      ...initialFormState,
      shapes, // Add shapes array for reference
      allShapes, // Add initialized shape states
      existingProducts: productSets // Update reference to use productSets
    };
  }, [shapes, productSets]);

  const fetcher = useFetcher();
  const [formState, handleChange] = useFormState(completeInitialState);
  const [productData, setProductData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);

  const handleImageUpload = useCallback((sku, label, url, driveData) => {
    if (!productData) return;

    setProductData(prevData => {
      const newData = { ...prevData };
      
      // If this is the first image upload and we have drive data with a product folder URL,
      // set the Google Drive folder URL for the entire product
      if (driveData?.folderPath?.productFolderUrl && !newData.googleDriveFolderUrl) {
        newData.googleDriveFolderUrl = driveData.folderPath.productFolderUrl;
      }
      
      // If the SKU matches a variant's SKU, update the variant's images
      const variant = newData.variants.find(v => v.sku === sku);
      if (variant) {
        // Initialize images array if it doesn't exist
        variant.images = variant.images || [];
        
        // Check if an image with this label already exists
        const existingImageIndex = variant.images.findIndex(img => img.label === label);
        
        if (existingImageIndex >= 0) {
          // Update existing image
          variant.images[existingImageIndex] = { 
            label, 
            url,
            driveData: driveData || null
          };
        } else {
          // Add new image
          variant.images.push({ 
            label, 
            url,
            driveData: driveData || null
          });
        }
      } else {
        // This is an additional view
        // Initialize additionalViews array if it doesn't exist
        newData.additionalViews = newData.additionalViews || [];
        
        // Check if an image with this label already exists
        const existingImageIndex = newData.additionalViews.findIndex(img => img.label === label);
        
        if (existingImageIndex >= 0) {
          // Update existing image
          newData.additionalViews[existingImageIndex] = { 
            label, 
            url,
            driveData: driveData || null
          };
        } else {
          // Add new image
          newData.additionalViews.push({ 
            label, 
            url,
            driveData: driveData || null
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
    }
  });  

  React.useEffect(() => {
    return () => {
      setProductData(null);
      setGenerationError(null);
      setSubmissionError(null);
      setNotification(null);
      setSuccessDetails(null);
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

      const data = await generateProductData(formState, commonDescription);
      
      // Use the already sanitized mainHandle for the folder name
      data.productPictureFolder = data.mainHandle;

      if (process.env.NODE_ENV === 'development') {
        console.log('[Product Creation] Generated Product Data:', {
          productType: data.productType,
          mainHandle: data.mainHandle,
          variantCount: data.variants.length
        });
      }

      setProductData(data);
    } catch (error) {
      console.error("[Product Creation] Data Generation Failed:", {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        formState: {
          collection: formState.collection,
          shapes: Object.keys(formState.allShapes || {})
        }
      });
      setGenerationError(error.message);
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

    setSubmissionError(null);

    const formData = new FormData();
    formData.append('productData', JSON.stringify(productData));
    
    fetcher.submit(formData, { 
      method: "POST", 
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

        <Layout.Section>
          <BlockStack gap="400">

          <Card>
            <BlockStack gap="400">
              <CollectionSelector
                shopifyCollections={shopifyCollections}
                productSets={productSets}
                formState={formState}
                onChange={handleChange}
                />
              <ProductTypeSelector
                formState={formState}
                onChange={handleChange}
                />
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
                    <ProductVariantCheck 
                      productData={productData} 
                      onImageUpload={handleImageUpload}
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