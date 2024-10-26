import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { useFormState } from "../hooks/useFormState.js";
import { loader } from "../lib/loaders.js";
import { generateProductData } from "../lib/productAttributes.js";
import { useCollectionLogic } from "../hooks/useCollectionLogic.jsx";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import CollectionSelector from "../components/CollectionSelector.jsx";
import LeatherColorSelector from "../components/LeatherColorSelector.jsx";
import FontSelector from "../components/FontSelector.jsx";
import ThreadColorSelector from "../components/ThreadColorSelector.jsx";
import ShapeSelector from "../components/ShapeSelector.jsx";
import ProductVariantCheck from "../components/ProductVariantCheck.jsx";
import ProductTypeSelector from "../components/ProductTypeSelector.jsx";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  Button,
  Banner
} from "@shopify/polaris";

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const productData = JSON.parse(formData.get('productData'));

  try {
    const response = await admin.graphql(
      `#graphql
      mutation populateProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          input: {
            title: productData.title,
            handle: productData.mainHandle,
            status: 'ACTIVE',
            descriptionHtml: productData.descriptionHtml,
            productType: productData.productType,
            vendor: 'Little Prince Customs',
            tags: productData.tags
          },
        },
      }
    );

    const responseJson = await response.json();
    
    if (responseJson.data?.productCreate?.userErrors?.length > 0) {
      return json(
        { errors: responseJson.data.productCreate.userErrors.map(error => `${error.field}: ${error.message}`) },
        { status: 422 }
      );
    }

    return json({ 
      product: responseJson.data.productCreate.product 
    });
    
  } catch (error) {
    console.error('GraphQL Error:', error);
    return json(
      { errors: [error.message || "An unexpected error occurred"] },
      { status: 500 }
    );
  }
};

export { loader };

export default function CreateProduct() {
  const { 
    shopifyCollections, 
    leatherColors, 
    threadColors,
    colorTags, 
    shapes, 
    styles, 
    fonts, 
    productPrices, 
    error 
  } = useLoaderData();

  const fetcher = useFetcher();
  const app = useAppBridge();
  

  const [formState, setFormState] = useFormState({
    selectedCollection: "",
    selectedOfferingType: "",
    limitedEditionQuantity: "",
    selectedLeatherColor1: "",
    selectedLeatherColor2: "",
    selectedStitchingColor: "",
    selectedEmbroideryColor: {},
    selectedFont: "",
    selectedShapes: {},
    selectedStyles: {},
    weights: {},
  });
  

  const [productData, setProductData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [submissionError, setSubmissionError] = useState(null);
  const [notification, setNotification] = useState(null);

  const isSubmitting = 
    ["loading", "submitting"].includes(fetcher.state) && 
    fetcher.formMethod === "POST";

    useEffect(() => {
      if (fetcher.data?.product) {
        setNotification({
          message: "Product created successfully",
          status: "success"
        });
        
        setFormState({
          selectedCollection: "",
          selectedOfferingType: "",
          limitedEditionQuantity: "",
          selectedLeatherColor1: "",
          selectedLeatherColor2: "",
          selectedStitchingColor: "",
          selectedEmbroideryColor: {},
          selectedFont: "",
          selectedShapes: {},
          selectedStyles: {},
          weights: {},
        });
        setProductData(null);
  
        // Clear notification after 5 seconds
        const timer = setTimeout(() => {
          setNotification(null);
        }, 5000);
  
        return () => clearTimeout(timer);
      } else if (fetcher.data?.errors) {
        const errorMessage = fetcher.data.errors.join(', ');
        setSubmissionError(errorMessage);
        setNotification({
          message: errorMessage,
          status: "critical"
        });
      }
    }, [fetcher.data, setFormState]);

  const { 
    isCollectionAnimalClassicQclassic, 
    needsSecondaryColor, 
    needsStitchingColor 
  } = useCollectionLogic(shopifyCollections, formState.selectedCollection);

  const handleChange = useCallback((field, value) => {
    setFormState(field, value);
    setProductData(null);
    setSubmissionError(null);
    setGenerationError(null);
  }, [setFormState]);

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

  const handleGenerateData = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
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

      const data = await generateProductData(
        updatedFormState,
        leatherColors,
        threadColors,
        colorTags,
        shapes,
        styles,
        productPrices,
        shopifyCollections,
      );

      console.log('Generated Product Data:', data);
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
              <Text as="h2" variant="headingMd">Create Product Page</Text>
              <CollectionSelector
                shopifyCollections={shopifyCollections}
                selectedCollection={formState.selectedCollection}
                onChange={handleChange}
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
                  threadColors={threadColors}
                  selectedEmbroideryColor={formState.selectedEmbroideryColor}
                  selectedStitchingColor={formState.selectedStitchingColor}
                  onChange={handleChange}
                />
              )}
            </BlockStack>
          </Card>
          <Card>
            <ShapeSelector
              shapes={shapes}
              styles={styles}
              threadColors={threadColors}
              formState={formState}
              selectedEmbroideryColors={formState.selectedEmbroideryColors}
              onEmbroideryColorChange={(shapeId, color) => {
                const newColors = { ...formState.selectedEmbroideryColors, [shapeId]: color };
                handleChange('selectedEmbroideryColors', newColors);
              }}
              handleChange={handleChange}
              isCollectionAnimalClassicQclassic={isCollectionAnimalClassicQclassic}
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