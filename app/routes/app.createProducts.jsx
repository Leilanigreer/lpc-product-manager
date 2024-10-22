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
import { generateSKUS, generateTitle } from "../lib/productAttributes.js";
import { useCollectionLogic } from "../hooks/useCollectionLogic.jsx";

import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  InlineStack,
  RadioButton,
} from "@shopify/polaris";

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
  
  const { 
    collectionType, 
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
        try {
          const skus = await generateSKUS(formState, leatherColors, threadColors, shapes, styles);
          setGeneratedSKUs(skus);
          
          const title = generateTitle(formState, leatherColors, threadColors);
          setGeneratedTitle(title);
        } catch (error) {
          console.error("Error generating SKU:", error);
        }
      };

      generateProductData();
    } else {
      setGeneratedSKUs([]);
      setGeneratedTitle("");
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
              {generatedSKUs.length > 0 && (
                <Text variant="bodyMd">Generated SKUs: {generatedSKUs.join(', ')}</Text>
              )}
              {generatedTitle && (
                <Text variant="bodyMd">Generated Title: {generatedTitle}</Text>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}