import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useLoaderData } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import { useFormState } from "../hooks/useFormState.js";
import { loader } from "../lib/loaders.js";
import CollectionSelector from "../components/CollectionSelector.jsx";
import LeatherColorSelector from "../components/LeatherColorSelector.jsx";
import FontSelector from "../components/FontSelector.jsx";
import ThreadColorSelector from "../components/ThreadColorSelector.jsx";
import ShapeSelector from "../components/ShapeSelector.jsx";
import { generateSKUS, generateTitle, generateMainHandle, generateVariantNames, generateProductType } from "../lib/productAttributes.js";
import { useCollectionLogic } from "../hooks/useCollectionLogic.jsx";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  InlineStack,
  RadioButton,
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

  const response = await admin.graphql(
    `#graphql
    mutation createProduct($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          id
          title
          handle
          status
          descriptionHtml
          category
          productType
          vendor
          variants(first: 10) {
            edges {
              node {
                id
                price
                sku
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
          vendor: 'Little Prince Customs'
          // Add other product fields here based on your formState
        },
      },
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
  
  const { collections, leatherColors, threadColors, shapes, styles, fonts, error } = useLoaderData();
  // console.log("Data loaded:", { collections, leatherColors, threadColors, shapes, styles, fonts });
  
  const [formState, setFormState] = useFormState({
    selectedCollection: "",
    selectedOfferingType: "",
    selectedLeatherColor1: "",
    selectedLeatherColor2: "",
    selectedStitchingColor: "",
    selectedEmbroideryColor: {},
    selectedFont: "",
    selectedShapes: {},
    selectedStyles: {},
    weights: {},
  });

  const [generatedSKUs, setGeneratedSKUs] = useState([]);
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [generatedMainHandle, setGeneratedMainHandle] = useState("");
  const [generatedVariantNames, setGeneratedVariantNames] = useState ([]);
  const [generatedProductType, setGeneratedProductType] = useState ("");
  
  const { 
    // collectionType, 
    isCollectionAnimalClassicQclassic, 
    needsSecondaryColor, 
    needsStitchingColor 
  } = useCollectionLogic(collections, formState.selectedCollection);

  const handleChange = useCallback((field) => (value) => {
    // console.log(`Updating ${field} with value:`, value);
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

  useEffect(() => {
    console.log("Effect running. Current formState:", formState);
    
    if (shouldGenerateProductData) {
      const generateProductData = async () => {
        let hasErrors = false;

        // Generate SKUs
        try {
          const skus = await generateSKUS(formState, leatherColors, threadColors, shapes, styles);
          setGeneratedSKUs(skus);
          console.log("Successfully generated SKUs:", skus);
        } catch (error) {
          hasErrors = true;
          console.error("Error generating SKUs:", error.message);
          setGeneratedSKUs([]);
        }

        // Generate Title
        try {
          const title = generateTitle(formState, leatherColors, threadColors);
          setGeneratedTitle(title);
          console.log("Successfully generated title:", title);

          // Generate Main Handle (depends on title)
          try {
            const mainHandle = generateMainHandle(formState, title);
            setGeneratedMainHandle(mainHandle);
            console.log("Successfully generated mainHandle:", mainHandle);
          } catch (error) {
            hasErrors = true;
            console.error("Error generating main handle:", error.message);
            setGeneratedMainHandle("pending-main-handle");
          }

        } catch (error) {
          hasErrors = true;
          console.error("Error generating title:", error.message);
          setGeneratedTitle("");
          setGeneratedMainHandle("pending-main-handle"); // Reset main handle if title fails
        }

        // Generate VariantName
        try {
          const variantNames = await generateVariantNames(formState, shapes, styles);
          setGeneratedVariantNames(variantNames);
          console.log("Successfully generated Variant Names:", variantNames);
        } catch (error) {
          hasErrors = true;
          console.error("Error generating Variant Names:", error.message);
          setGeneratedVariantNames([]);
        }

        try {
          const productType = generateProductType(formState);
          setGeneratedProductType(productType);
          console.log("Successfully generated Product Type:", productType);
        } catch (error) {
          hasErrors = true;
          console.error("Error generating Product Type", error.message);
          setGeneratedProductType("");
        }

        if (hasErrors) {
          console.log("Some product data generation failed. Check errors above.");
        }
      };



      generateProductData();
    } else {
      // Reset all values if shouldGenerateProductData is false
      setGeneratedSKUs([]);
      setGeneratedTitle("");
      setGeneratedMainHandle("");
      setGeneratedVariantNames([]);
      setGeneratedProductType("");
    }
  }, [shouldGenerateProductData, formState, leatherColors, threadColors, shapes, styles]);

  if (error) {
    console.error("Error in CreateProduct:", error);
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
              <InlineStack gap="400" align="start">
                <RadioButton
                  label="Customizable"
                  checked={formState.selectedOfferingType === 'customizable'}
                  id="customizable"
                  name="productType"
                  onChange={() => handleChange('selectedOfferingType')('customizable')}
                />
                <RadioButton
                  label="Limited Edition"
                  checked={formState.selectedOfferingType === 'limitedEdition'}
                  id="limitedEdition"
                  name="productType"
                  onChange={() => handleChange('selectedOfferingType')('limitedEdition')}
                />
              </InlineStack>
              <CollectionSelector
                collections={collections}
                selectedCollection={formState.selectedCollection}
                onChange={handleChange('selectedCollection')}
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
              {generatedTitle && (
                <Text variant="bodyMd">Generated Title: {generatedTitle}</Text>
              )}
              {generatedMainHandle && (
                <Text variant="bodyMd">Generated Main Handle: {generatedMainHandle}</Text>
              )}
              {generatedSKUs.length > 0 && (
                <Text variant="bodyMd">Generated SKUs: {generatedSKUs.join(', ')}</Text>
              )}
              {generatedVariantNames.length > 0 && (
                <Text variant="bodyMd">Generated Variant Names: {generatedVariantNames.join(', ')}</Text>
              )}
              {generatedProductType.length > 0 && (
                <Text variant="bodyMd">Generated Product Type: {generatedProductType}</Text>
              )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}