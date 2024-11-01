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
        // 1. Get Publications
        const publicationsResponse = await admin.graphql(`#graphql
          query Publications {
            publications(first: 15) {
              edges {
                node {
                  id
                  name
                }
              }
            }
          }
        `);
    
        const publicationsJson = await publicationsResponse.json();
        console.log('Publications:', publicationsJson.data.publications.edges);
    
        if (!publicationsJson.data?.publications?.edges?.length) {
          return json({ errors: ["No publications found"] }, { status: 422 });
        }

    // 2. Get location ID
    const locationResponse = await admin.graphql(`#graphql
      query {
        locations(first: 10) {
          edges {
            node {
              id
              name
              address {
                address1
                city
              }
            }
          }
        }
      }
    `);

    const locationJson = await locationResponse.json();
    const location = locationJson.data.locations.edges.find(
      ({ node }) => 
        node.address.address1 === "550 Montgomery Street" &&
        node.address.city === "San Francisco"
    );

    if (!location) {
      return json({ errors: ["Store location not found"] }, { status: 422 });
    }

    const locationId = location.node.id;
    console.log('Found Location ID:', locationId);

    // 3. Create product with options
    const productResponse = await admin.graphql(`#graphql
      mutation createProductWithOptions($productInput: ProductInput!) {
        productCreate(input: $productInput) {
          product {
            id
            title
            description
            options {
              id
              name
              position
              optionValues {
                id
                name
                hasVariants
              }
            }
            variants(first: 250) {
              edges {
                node {
                  id
                  title
                  price
                  sku
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
          productInput: {
            title: productData.title,
            handle: productData.mainHandle,
            productType: productData.productType,
            vendor: 'Little Prince Customs',
            descriptionHtml: productData.descriptionHTML,
            tags: productData.tags,
            status: "ACTIVE",
            category: "gid://shopify/TaxonomyCategory/sg-4-7-7-2",
            seo: {
              title: productData.seoTitle,
              description: productData.seoDescription,
            },
            productOptions: [
              {
                name: "Shape",
                values: [...new Set(productData.variants.map(variant => variant.variantName))].map(name => ({
                  name: name
                }))
              }
            ]
          }
        }
      }
    );

    const productJson = await productResponse.json();
    
    // Log product creation details
    console.log('Product Creation Response - Options Analysis:');
    if (productJson.data?.productCreate?.product?.options) {
      productJson.data.productCreate.product.options.forEach((option, index) => {
        console.log(`\nOption ${index + 1}: ${option.name}`);
        console.log('Option Values:');
        option.optionValues.forEach((value, valueIndex) => {
          console.log(`  ${valueIndex + 1}. ${value.name}`);
          console.log(`     hasVariants: ${value.hasVariants}`);
          console.log(`     id: ${value.id}`);
        });
      });
    }

    // Check for product creation errors
    if (productJson.data?.productCreate?.userErrors?.length > 0) {
      console.error('Product Creation Errors:', productJson.data.productCreate.userErrors);
      return json({ errors: productJson.data.productCreate.userErrors }, { status: 422 });
    }

    // 4. Create variants
    const variantsResponse = await admin.graphql(`#graphql
      mutation productVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkCreate(
          productId: $productId, 
          strategy: REMOVE_STANDALONE_VARIANT,
          variants: $variants
        ) {
          product {
            id
            title
            variants(first: 250) {
              edges {
                node {
                  id
                  title
                  price
                  inventoryItem {
                    id
                    tracked
                    requiresShipping
                    sku
                  }
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
          }
          productVariants {
            id
            title
            price
            selectedOptions {
              name
              value
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
          productId: productJson.data.productCreate.product.id,
          strategy: "REMOVE_STANDALONE_VARIANT",
          variants: productData.variants.map(variant => ({
            price: variant.price,
            compareAtPrice: variant.price,
            taxable: true,
            inventoryPolicy: "CONTINUE",
            inventoryQuantities: [
              {
                availableQuantity: 5,
                locationId: locationId
              }
            ],
            inventoryItem: {
              cost: variant.price,
              tracked: true,
              requiresShipping: true,
              sku: variant.sku,
              measurement: {
                weight: {
                  unit: "OUNCES",
                  value: parseFloat(variant.weight)
                }
              }
            },
            optionValues: [
              {
                name: variant.variantName,
                optionName: "Shape"
              }
            ]
          }))
        }
      }
    );

    // Log variant creation status
    const variantsJson = await variantsResponse.json();
    console.log('Variants Creation Response:', JSON.stringify(variantsJson, null, 2));

    if (variantsJson.data?.productVariantsBulkCreate?.product?.variants?.edges) {
      console.log('\nVariant Creation Status:');
      variantsJson.data.productVariantsBulkCreate.product.variants.edges.forEach(({ node }) => {
        console.log(`Variant: ${node.title}`);
        console.log(`  Price: ${node.price}`);
        if (node.inventoryQuantities) {
          console.log(`Inventory Quantities: ${node.inventoryQuantities}`)
        };
        if (node.inventoryItem) {
          console.log(`  InventoryItemID: ${node.inventoryItem.id}`)
          console.log(`  SKU: ${node.inventoryItem.sku}`);
          console.log(`  Tracked: ${node.inventoryItem.tracked}`);
          console.log(`  Requires Shipping: ${node.inventoryItem.requiresShipping}`);
        }
        console.log('-------------------');
      });
    }

    // Check for variant creation errors
    if (variantsJson.data?.productVariantsBulkCreate?.userErrors?.length > 0) {
      console.error('Variant Creation Errors:', variantsJson.data.productVariantsBulkCreate.userErrors);
      return json({ errors: variantsJson.data.productVariantsBulkCreate.userErrors }, { status: 422 });
    }

    // 5. Add default image
    const mediaResponse = await admin.graphql(`#graphql
      mutation UpdateProductWithNewMedia($input: ProductInput!, $media: [CreateMediaInput!]) {
        productUpdate(input: $input, media: $media) {
          product {
            id
            media(first: 10) {
              nodes {
                alt
                mediaContentType
                preview {
                  status
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
            id: productJson.data.productCreate.product.id
          },
          media: [
            {
              originalSource: "https://cdn.shopify.com/s/files/1/0626/0247/7775/files/Naming_4.png?v=1730408067",
              alt: "Pictures of new headcovers coming soon.",
              mediaContentType: "IMAGE"
            }
          ]
        }
      }
    );

    const mediaJson = await mediaResponse.json();

    // Check for media update errors
    if (mediaJson.data?.productUpdate?.userErrors?.length > 0) {
      console.error('Media Update Errors:', mediaJson.data.productUpdate.userErrors);
      return json({ errors: mediaJson.data.productUpdate.userErrors }, { status: 422 });
    }

    // 6. Publish to all publications
    const publishResults = await Promise.all(
      publicationsJson.data.publications.edges.map(async ({ node: publication }) => {
        const publishResponse = await admin.graphql(`#graphql
          mutation PublishProduct($id: ID!, $publicationId: ID!) {
            publishablePublish(
              id: $id
              input: { publicationId: $publicationId }
            ) {
              publishable {
                ... on Product {
                  id
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
              id: productJson.data.productCreate.product.id,
              publicationId: publication.id
            }
          }
        );
        
        const publishJson = await publishResponse.json();
        console.log(`Published to ${publication.name}:`, publishJson);
        return {
          publicationName: publication.name,
          result: publishJson
        };
      })
    );

    // Check for any publish errors
    const publishErrors = publishResults
      .filter(result => result.result.data?.publishablePublish?.userErrors?.length > 0)
      .map(result => ({
        publication: result.publicationName,
        errors: result.result.data.publishablePublish.userErrors
      }));

    if (publishErrors.length > 0) {
      console.error('Publishing Errors:', publishErrors);
      return json({ errors: publishErrors }, { status: 422 });
    }

    // Return success response with all data
    return json({ 
      product: productJson.data.productCreate.product,
      variants: variantsJson.data.productVariantsBulkCreate.productVariants,
      media: mediaJson.data.productUpdate.product.media,
      publications: publishResults,
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
  const app = useAppBridge();
  

  const [formState, setFormState] = useFormState({
    selectedCollection: "",
    selectedOfferingType: "",
    limitedEditionQuantity: "",
    selectedLeatherColor1: "",
    selectedLeatherColor2: "",
    selectedStitchingColor: "",
    selectedEmbroideryColor: "",
    selectedEmbroideryColors: {},
    selectedFont: "",
    selectedShapes: {},
    selectedStyles: {},
    weights: {},
    qClassicLeathers: {},
    matchingAmannNumber: "",
    matchingIsacordNumber: "",
    shapeIsacordNumbers: {},
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
          selectedEmbroideryColor: "",
          selectedEmbroideryColors: {},
          selectedFont: "",
          selectedShapes: {},
          selectedStyles: {},
          weights: {},
          qClassicLeathers: {},
          matchingAmannNumber: "",
          matchingIsacordNumber: "",
          shapeIsacordNumbers: {},
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
      // isCollectionAnimalClassicQclassic, 
      needsSecondaryColor, 
      needsStitchingColor,
      needsStyle,           // Add new destructured functions
      needsQClassicField
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
      console.log(formState);

      const data = await generateProductData(
        updatedFormState,
        leatherColors,
        stitchingThreadColors,
        amannNumbers,
        embroideryThreadColors,
        isacordNumbers,
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