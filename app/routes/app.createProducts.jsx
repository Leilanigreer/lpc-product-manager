// app/routes/app.createProducts.jsx

import React, { useState, useMemo } from "react";
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
import {
  CollectionSelector,
  FontSelector,
  LeatherColorSelector,
  ProductSuccessBanner,
  ProductTypeSelector,
  ShapeSelector,
  ThreadColorSelector,
  ProductVariantCheck,
} from "../components/productCreation";

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

    // Instead of json(), return object directly
    return {
      ...shopifyResponse,
      databaseSave: dbSaveResult,
      success: true
    };
  } catch (error) {
    console.error('Detailed Error:', error);
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
    productDataLPC, 
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
    };
  }, [shapes]);

  const fetcher = useFetcher();
  const [formState, handleChange] = useFormState(completeInitialState);
  const [productData, setProductData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Form State Updated:', formState);
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
      setGenerationError(null);    }
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
        console.error('Collection validation failed:', formState.collection);
        throw new Error('Invalid collection configuration');
      }

      const data = await generateProductData(formState, commonDescription);
      console.log('Generated product data:', {
        hasData: Boolean(data),
        title: data?.title,
        variantCount: data?.variants?.length,
        variants: data?.variants
      });

      setProductData(data);
    } catch (error) {
      console.error("Error generating product data:", {
        error,
        stack: error.stack,
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
          <Card>
            <BlockStack gap="400">
              <CollectionSelector
                shopifyCollections={shopifyCollections}
                productDataLPC={productDataLPC}
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
            <ShapeSelector
              shapes={shapes}
              leatherColors={leatherColors}
              embroideryThreadColors={embroideryThreadColors}
              formState={formState}
              handleChange={handleChange}
            />
          </Card>

          <Card>
            <BlockStack gap="400">
              {generationError && (
                <Banner status="critical">
                  {generationError}
                </Banner>
              )}
              
              <Button
                onClick={handleGenerateData}
                loading={isGenerating}
                disabled={!formState.collection || isGenerating}
              >
                Preview Product Data
              </Button>

              {productData && (
                <>
                  <ProductVariantCheck productData={productData} />
                  
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
                </>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}