import React, { useEffect, useState, useCallback, useMemo } from "react";
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
                barcode
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
          descriptionHtml: 'pending',
          productType: productData.productType,
          vendor: 'Little Prince Customs',
          options: [
            {
            name: "Shape",
            values: variants.map(v => v.title)
            }
          ],
          variants: variants.map(variant => ({
            sku: variant.sku,
            price: variant.price,
            compareAtPrice: variant.price, // Same as price if no discount
            weight: variant.weight || 5.9, // Default weight if not specified
            weightUnit: 'oz',
            requiresShipping: true,
            taxable: true,
            inventoryManagement: 'shopify',
            inventoryPolicy: 'pending',
            fulfillmentService: 'manual',
            options: [variant.title], // This maps to the Shape option
            inventoryQuantity: 0, // Starting inventory - need to add a field
            position: variant.position, // need to hard code this somewhere
            grams: Math.round((variant.weight || 5.9) * 28.3495), // Convert oz to grams
          })),
          tags: productData.tags
        }
      }
    }
  );

  const responseJson = await response.json();
  const product = responseJson.data.productCreate.product;

  // If you need to update variants, you can do so here
  // similar to the variantResponse in the original code

  return json({
    product: product,
    // Include variant data if you update it
  });
};

export { loader };

export default function CreateProduct() {
  // console.log("useCollectionsLogic:", useCollectionLogic);
  // console.log("CreateProduct component rendering");
  
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
  // console.log("Data loaded:", { shopifyCollections, leatherColors, threadColors, shapes, styles, fonts, productPrices });
  
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

  const [productData, setProductData] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);

  const [generatedSKUs, setGeneratedSKUs] = useState([]);
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [generatedMainHandle, setGeneratedMainHandle] = useState("");
  const [generatedVariantNames, setGeneratedVariantNames] = useState ([]);
  const [generatedProductType, setGeneratedProductType] = useState ("");
  
  const { 
    isCollectionAnimalClassicQclassic, 
    needsSecondaryColor, 
    needsStitchingColor 
  } = useCollectionLogic(shopifyCollections, formState.selectedCollection);

  const handleChange = useCallback((field) => (value) => {
    setFormState(field, value);
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

  const formatVariantDisplay = useCallback((variants) => {
    // Group base variants and custom variants for display
    const baseVariants = variants.filter(v => !v.isCustom);
    const customVariants = variants.filter(v => v.isCustom);
    
    return [...baseVariants, ...customVariants]
      .map(v => v.variantName)
      .join(', ');
  }, []);


  useEffect(() => {
    console.log("Effect running. Current formState:", formState);
    
    if (shouldGenerateProductData) {
      const generateData = async () => {
        try {
          const data = await generateProductData(
            formState,
            leatherColors,
            threadColors,
            shapes,
            styles,
            productPrices,
            shopifyCollections,
          );
  
          setProductData(data);
          
          // Update display states
          setGeneratedTitle(data.title);
          setGeneratedMainHandle(data.mainHandle);
          setGeneratedProductType(data.productType);
          setGeneratedSKUs(data.variants.map(v => v.sku));
          // Sort variants to ensure base variants come before custom variants
          setGeneratedVariantNames(data.variants
            .sort((a, b) => {
              // Sort by isCustom first (false comes before true)
              if (a.isCustom !== b.isCustom) return a.isCustom ? 1 : -1;
              // Then sort by original order
              return 0;
            })
            .map(v => v.variantName)
          );
          
          setSubmissionError(null);
        } catch (error) {
          console.error("Error generating product data:", error);
          setSubmissionError(error.message);
          setProductData(null);
          
          // Reset display states
          setGeneratedTitle("");
          setGeneratedMainHandle("");
          setGeneratedProductType("");
          setGeneratedSKUs([]);
          setGeneratedVariantNames([]);
        }
      };
  
      // Call the async function
      generateData();
    } else {
      // Reset all states if conditions aren't met
      setProductData(null);
      setGeneratedTitle("");
      setGeneratedMainHandle("");
      setGeneratedProductType("");
      setGeneratedSKUs([]);
      setGeneratedVariantNames([]);
    }
  }, [shouldGenerateProductData, formState, leatherColors, threadColors, shapes, styles, productPrices, shopifyCollections]);

  const handleSubmit = useCallback(async () => {
    if (!productData) {
      setSubmissionError("Please fill in all required fields");
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
  }, [productData, formState]);
if (error) {
  return <div>Error: {error}</div>;
}

  // console.log("Rendering CreateProduct component");
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
              onChange={handleChange('selectedCollection')}
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
                // isCollectionAnimalClassicQclassic={isCollectionAnimalClassicQclassic}
              />
              <FontSelector
                fonts={fonts}
                selectedFont={formState.selectedFont}
                onChange={handleChange('selectedFont')}
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
                  handleChange('selectedEmbroideryColors')(newColors);
                }}
                handleChange={handleChange}
                isCollectionAnimalClassicQclassic={isCollectionAnimalClassicQclassic}
              />
          </Card>
          <Card>
            <BlockStack gap="400">
              <ProductVariantCheck productData={productData} />
              
              <Button
                primary
                loading={isSubmitting}
                disabled={!productData || isSubmitting}
                onClick={handleSubmit}
              >
                Create Product
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}