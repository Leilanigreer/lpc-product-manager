import React, { useState, useCallback, useMemo } from "react";
import { useLoaderData } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
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
  const productData = Object.fromEntries(formData);

  // Parse JSON strings back into objects
  ['selectedStyles', 'weights'].forEach(key => {
    if (productData[key]) {
      productData[key] = JSON.parse(productData[key]);
    }
  });

  const variants = Array.from(formData.entries())
    .filter(([key]) => key.startsWith('variants['))
    .reduce((acc, [key, value]) => {
      const [, index, field] = key.match(/variants\[(\d+)\]\[(\w+)\]/);
      if (!acc[index]) acc[index] = {};
      acc[index][field] = value;
      return acc;
    }, {});

  const response = await admin.graphql(
    `#graphql
    mutation createProduct($input: ProductInput!) {
      productCreate(input: $input) {
        userErrors {
          field
          message
        }
        product {
          id
          title
          handle
          status
          descriptionHtml
          category
          productType
          vendor
          tags
          seo {
            title
            description
          }
          options {
            id
            name
            position
            values
          }
          variants(first: 20) {
            edges {
              node {
                id
                title
                sku
                price
                position
                inventoryPolicy
                compareAtPrice
                taxable
                fulfillmentService
                weight
                weightUnit
                requiresShipping
                inventoryManagement
                inventoryQuantity
                inventoryItem {
                  id
                }
              }
            }
          }
        }
      }
    }`,
    {
      variables: {
        input: {
          title: productData.title,
          handle: productData.mainHandle,
          status: 'active',
          category: 'gid://shopify/TaxonomyCategory/sg-4-7-7-2',
          descriptionHtml: productData.descriptionHtml,
          productType: productData.productType,
          vendor: 'Little Prince Customs',
          tags: productData.tags,
          seo: {
            title: productData.seoTitle || productData.title,
            description: productData.seoDescription || 'pending'
          },
          options: [{
            name: "Shape",
            values: variants.map(v => v.title)
          }],
          variants: variants.map(variant => ({
            sku: variant.sku,
            price: variant.price,
            compareAtPrice: variant.price,
            weight: variant.weight || 5.9,
            weightUnit: 'oz',
            requiresShipping: true,
            taxable: true,
            inventoryManagement: 'shopify',
            inventoryPolicy: 'continue',
            fulfillmentService: 'manual',
            options: [variant.title],
            inventoryQuantity: 4,
            position: variant.position,
            grams: Math.round((variant.weight || 5.9) * 28.3495),
          })),
        }
      }
    }
  );

  const responseJson = await response.json();
  const product = responseJson.data.productCreate.product;

  return json({
    product: product,
  });
};

export { loader };

export default function CreateProduct() {
  const { 
    shopifyCollections, 
    leatherColors, 
    threadColors, 
    shapes, 
    styles, 
    fonts, 
    productPrices, 
    error 
  } = useLoaderData();
  
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);

  const { 
    isCollectionAnimalClassicQclassic, 
    needsSecondaryColor, 
    needsStitchingColor 
  } = useCollectionLogic(shopifyCollections, formState.selectedCollection);

  const handleChange = useCallback((field, value) => {
    setFormState(field, value);
    // Clear product data when form changes
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
      // Log initial form state and weights
      console.log('Initial Form State:', {
        selectedCollection: formState.selectedCollection,
        selectedOfferingType: formState.selectedOfferingType,
        weights: formState.weights,
        styles: formState.selectedStyles
      });
  
      // Log filtered weights
      const validWeights = Object.entries(formState.weights)
        .filter(([_, weight]) => weight && weight !== "")
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});
  
      console.log('Filtered Valid Weights:', {
        before: formState.weights,
        after: validWeights
      });
  
      // Log shape data being passed
      console.log('Shape Data:', {
        availableShapes: shapes.map(shape => ({
          id: shape.value,
          name: shape.label,
          abbreviation: shape.abbreviation
        })),
        selectedShapeIds: Object.keys(validWeights),
        selectedStyles: formState.selectedStyles
      });
  
      const updatedFormState = {
        ...formState,
        weights: validWeights
      };
  
      // Log parameters being passed to generateProductData
      console.log('Generate Product Data Parameters:', {
        updatedFormState,
        leatherColorsCount: leatherColors.length,
        threadColorsCount: threadColors.length,
        shapesCount: shapes.length,
        stylesCount: styles?.length,
        productPricesCount: productPrices.length,
        shopifyCollectionsCount: shopifyCollections.length
      });
  
      const data = await generateProductData(
        updatedFormState,
        leatherColors,
        threadColors,
        shapes,
        styles,
        productPrices,
        shopifyCollections,
      );
  
      // Log generated product data
      console.log('Generated Product Data:', {
        title: data.title,
        mainHandle: data.mainHandle,
        productType: data.productType,
        variantCount: data.variants.length,
        variants: data.variants.map(variant => ({
          sku: variant.sku,
          name: variant.variantName,
          position: variant.position,
          isCustom: variant.isCustom,
          shape: variant.shape,
          style: variant.style?.label,
          price: variant.price
        }))
      });
  
      setProductData(data);
    } catch (error) {
      console.error("Error generating product data:", error);
      setGenerationError(error.message);
      setProductData(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!productData) {
      setSubmissionError("Please preview product data first");
      return;
    }
  
    try {
      setIsSubmitting(true);
      setSubmissionError(null);
  
      const formData = new FormData();
      
      // Add basic product data
      formData.append('title', productData.title);
      formData.append('mainHandle', productData.mainHandle);
      formData.append('productType', productData.productType);
      formData.append('selectedCollection', formState.selectedCollection);
      formData.append('selectedOfferingType', formState.selectedOfferingType);
      if (formState.selectedOfferingType === 'limitedEdition') {
        formData.append('limitedEditionQuantity', formState.limitedEditionQuantity);
      }
      
      // Add form state data
      formData.append('selectedStyles', JSON.stringify(formState.selectedStyles));
      formData.append('weights', JSON.stringify(formState.weights));
  
      // Add variant data
      productData.variants.forEach((variant, index) => {
        formData.append(`variants[${index}][sku]`, variant.sku);
        formData.append(`variants[${index}][title]`, variant.variantName);
        formData.append(`variants[${index}][price]`, variant.price);
        formData.append(`variants[${index}][shapeId]`, variant.shapeId);
        if (variant.styleId) {
          formData.append(`variants[${index}][styleId]`, variant.styleId);
        }
        formData.append(`variants[${index}][options]`, JSON.stringify(variant.options));
      });
  
      // Submit will be implemented later
      console.log("Ready to submit:", Object.fromEntries(formData));
      
    } catch (error) {
      setSubmissionError(error.message);
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <Page>
      <TitleBar title="Create a new product" />
      <Layout>
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