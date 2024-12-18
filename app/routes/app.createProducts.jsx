import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import { useFormState } from "../hooks/useFormState.js";
import { loader } from "../lib/loaders.js";
import { generateProductData } from "../lib/productAttributes.js";
import { useCollectionLogic } from "../hooks/useCollectionLogic.jsx";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { createShopifyProduct } from "../lib/shopifyOperations.server.js";
import { saveProductToDatabase } from "../lib/productOperations.server";
import { initialFormState } from "../lib/formState.js";

import CollectionSelector from "../components/CollectionSelector.jsx";
import LeatherColorSelector from "../components/LeatherColorSelector.jsx";
import FontSelector from "../components/FontSelector.jsx";
import ThreadColorSelector from "../components/ThreadColorSelector.jsx";
import ShapeSelector from "../components/ShapeSelector.jsx";
import ProductVariantCheck from "../components/ProductVariantCheck.jsx";
import ProductTypeSelector from "../components/ProductTypeSelector.jsx";
import { ProductSuccessBanner } from "../components/ProductSuccessBanner.jsx";

import {
  Page,
  Layout,
  Card,
  BlockStack,
  Button,
  Banner, 
} from "@shopify/polaris";

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const productData = JSON.parse(formData.get('productData'));

  try {
    // Create product in Shopify
    const shopifyResponse = await createShopifyProduct(admin, productData);

    // Save product data to database
    const dbSaveResult = await saveProductToDatabase(productData, shopifyResponse);

    // Return success response with all data
    return json({
      ...shopifyResponse,
      databaseSave: dbSaveResult,
      success: true
    });

  } catch (error) {
    console.error('Detailed Error:', {
      message: error.message,
      stack: error.stack
    });
    return json({
      errors: [typeof error === 'string' ? error : error.message || "An unexpected error occurred"]
    }, { status: 500 });
  }
};


export { loader };

export default function CreateProduct() {
  const { 
    shopifyCollections, 
    leatherColors, 
    stitchingThreadColors,
    amannNumbers,
    embroideryThreadColors,
    isacordNumbers,
    colorTags, 
    shapes, 
    styles, 
    fonts, 
    productPrices, 
    error 
  } = useLoaderData();

  const fetcher = useFetcher();  

  const [formState, setFormState] = useFormState(initialFormState);
  const [productData, setProductData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [submissionError, setSubmissionError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [successDetails, setSuccessDetails] = useState(null);

  const handleChange = useCallback((field, value) => {
    setFormState(field, value);
    setProductData(null);
    setSubmissionError(null);
    setGenerationError(null);
  }, [setFormState]);

  const handleCollectionChange = useCallback((newCollection) => {
    Object.entries(initialFormState).forEach(([key, value]) => {
      if (key !== 'selectedCollection') {
        handleChange(key, value);
      }
    });

    setProductData(null);
    setGenerationError(null);
    setSubmissionError(null);
    setNotification(null);
  }, [handleChange]);

  const isSubmitting = 
    ["loading", "submitting"].includes(fetcher.state) && 
    fetcher.formMethod === "POST";

    useEffect(() => {
      if (fetcher.data?.product && fetcher.data?.shop && fetcher.data?.databaseSave?.mainProduct) {
        const productId = fetcher.data.product.id.replace('gid://shopify/Product/', '');
        const shopDomain = fetcher.data.shop?.myshopifyDomain?.replace('.myshopify.com', '');
        const host = fetcher.data.shop?.host;
        const productHandle = fetcher.data.databaseSave.mainProduct.mainHandle;
  
        if (productId && shopDomain && host && productHandle) {
          setSuccessDetails({
            productId,
            shopDomain,
            host,
            productHandle
          });
  
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
  
          Object.entries(initialFormState).forEach(([key, value]) => {
            handleChange(key, value);
          });
          setProductData(null);
        } else {
          console.error('Missing required data:', { productId, shopDomain, host, productHandle });
          setNotification({
            message: "Product created but some data is missing",
            status: "warning"
          });
        }
      } else if (fetcher.data?.errors) {
        const errorMessage = fetcher.data.errors.join(', ');
        setSubmissionError(errorMessage);
        setNotification({
          message: errorMessage,
          status: "critical"
        });
      }
    }, [fetcher.data, handleChange]);

    const { 
      needsSecondaryColor, 
      needsStitchingColor,
      needsStyle,           
      needsQClassicField
    } = useCollectionLogic(shopifyCollections, formState.selectedCollection);


  const shouldGenerateProductData = useMemo(() => {
    const hasRequiredColors = needsSecondaryColor 
      ? formState.selectedLeatherColor1 && formState.selectedLeatherColor2
      : formState.selectedLeatherColor1;
    const hasStitchingIfNeeded = needsStitchingColor ? formState.selectedStitchingColor : true;
    const hasShapeData = Object.values(formState.weights).some(weight => weight !== "");

    return formState.selectedCollection && 
           hasRequiredColors &&
           hasStitchingIfNeeded &&
           hasShapeData;
  }, [formState, needsSecondaryColor, needsStitchingColor]);

  const prepareThreadData = useCallback((formState, needsStitchingColor) => {
    if (needsStitchingColor) {
      // Return global thread data when ThreadColorSelector is used
      return {
        threadType: 'global',
        globalThreads: {
          stitching: formState.selectedStitchingColor ? {
            threadId: formState.selectedStitchingColor,
            numberId: formState.matchingAmannNumber
          } : null,
          embroidery: formState.selectedEmbroideryColor ? {
            threadId: formState.selectedEmbroideryColor,
            numberId: formState.matchingIsacordNumber
          } : null
        }
      };
    } else {
      // Return shape-specific thread data when using ShapeSelector
      return {
        threadType: 'shape-specific',
        shapeThreads: Object.keys(formState.selectedEmbroideryColors).reduce((acc, shapeId) => {
          if (formState.selectedEmbroideryColors[shapeId]) {
            acc[shapeId] = {
              embroideryThread: {
                threadId: formState.selectedEmbroideryColors[shapeId],
                numberId: formState.shapeIsacordNumbers[shapeId] || null
              }
            };
          }
          return acc;
        }, {})
      };
    }
  }, []);

  const validateThreadData = useCallback((formState, needsStitchingColor) => {
    const errors = [];
  
    if (needsStitchingColor) {
      // Validate both stitching and embroidery in ThreadColorSelector
      if (formState.selectedStitchingColor && !formState.matchingAmannNumber) {
        errors.push("Please select an Amann number for the stitching thread");
      }
      if (formState.selectedEmbroideryColor && !formState.matchingIsacordNumber) {
        errors.push("Please select an Isacord number for the embroidery thread");
      }
    } else {
      // We're in the needsStyle case (since they're mutually exclusive)
      // Only validate shape-specific embroidery
      Object.entries(formState.weights).forEach(([shapeId, weight]) => {
        // Only validate shapes that are selected (have a weight)
        if (weight && weight !== "") {
          const threadId = formState.selectedEmbroideryColors[shapeId];
          // Only validate if a thread color is selected
          if (threadId && !formState.shapeIsacordNumbers[shapeId]) {
            errors.push(`Please select an Isacord number for the selected shape`);
          }
        }
      });
    }
  
    return errors;
  }, []);

  const handleGenerateData = async () => {
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const validationErrors = validateThreadData(formState, needsStitchingColor);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join('\n'));
      }

      const validWeights = Object.entries(formState.weights)
        .filter(([_, weight]) => weight && weight !== "")
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});

      const updatedFormState = {
        ...formState,
        weights: validWeights
      };

      const threadData = prepareThreadData(updatedFormState, needsStitchingColor);
      
      const data = await generateProductData(
        {
          ...updatedFormState,
          threadData
        },
        leatherColors,
        stitchingThreadColors,
        embroideryThreadColors,
        colorTags,
        shapes,
        styles,
        productPrices,
        shopifyCollections,
        amannNumbers,
        isacordNumbers
      );

      setProductData(data);
    } catch (error) {
      console.error("Error generating product data:", error);
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
            productId={successDetails.productId}
            shopDomain={successDetails.shopDomain}
            host={successDetails.host}
            productHandle={successDetails.productHandle}
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
                selectedCollection={formState.selectedCollection}
                onChange={handleChange}
                onCollectionChange={handleCollectionChange}
              />
              <ProductTypeSelector
                selectedType={formState.selectedOfferingType}
                quantity={formState.limitedEditionQuantity}
                onChange={handleChange}
              />
              <LeatherColorSelector
                leatherColors={leatherColors}
                selectedLeatherColor1={formState.selectedLeatherColor1}
                selectedLeatherColor2={formState.selectedLeatherColor2}
                onChange={handleChange}
                needsSecondaryColor={needsSecondaryColor}
              />
              <FontSelector
                fonts={fonts}
                selectedFont={formState.selectedFont}
                onChange={handleChange}
              />
              {needsStitchingColor && (
                <ThreadColorSelector
                  stitchingThreadColors={stitchingThreadColors}
                  amannNumbers={amannNumbers}
                  embroideryThreadColors={embroideryThreadColors}
                  isacordNumbers={isacordNumbers}
                  selectedStitchingColor={formState.selectedStitchingColor}
                  matchingAmannNumber={formState.matchingAmannNumber}
                  selectedEmbroideryColor={formState.selectedEmbroideryColor}
                  matchingIsacordNumber={formState.matchingIsacordNumber}
                  onChange={handleChange}
                />
              )}
            </BlockStack>
          </Card>
          <Card>
            <ShapeSelector
              shapes={shapes}
              styles={styles}
              leatherColors={leatherColors}
              embroideryThreadColors={embroideryThreadColors}
              isacordNumbers={isacordNumbers}
              formState={formState}
              selectedEmbroideryColors={formState.selectedEmbroideryColors}
              onEmbroideryColorChange={(shapeId, color) => {
                const newColors = { ...formState.selectedEmbroideryColors, [shapeId]: color };
                handleChange('selectedEmbroideryColors', newColors);
              }}
              shapeIsacordNumbers={formState.shapeIsacordNumbers}
              handleChange={handleChange}
              needsStyle={needsStyle}
              needsQClassicField={needsQClassicField}
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
                disabled={!shouldGenerateProductData || isGenerating}
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