import { useLoaderData } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import { useFormState } from "../hooks/useFormState";
import { loader } from "../lib/loaders";
import CollectionSelector from "../components/CollectionSelector.jsx";
import LeatherColorSelector from "../components/LeatherColorSelector.jsx";
import FontSelector from "../components/FontSelector.jsx";
import ThreadColorSelector from "../components/ThreadColorSelector.jsx";
import ShapeSelector from "../components/ShapeSelector.jsx";

import React, { useEffect } from "react";
import { generateSKUS, generateTitle } from "../lib/productAttributes.js";

import { useCollectionLogic } from "../hooks/useCollectionLogic";


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
  const { collections, leatherColors, threadColors, fonts, shapes, styles, error } = useLoaderData();
  // console.log('shapes from loader', shapes);
  
  const [formState, setFormState] = useFormState({
    selectedCollection: "",
    selectedOfferingType: "",
    selectedLeatherColor1: "",
    selectedLeatherColor2: "",
    selectedStitchingColor: "",
    selectedEmbroideryColor: "",
    selectedFont: "",
    selectedStyles: {},
    weights: {},
  });
  
  const { isCollectionAnimalClassicQclassic } = useCollectionLogic(collections, formState.selectedCollection);

  const handleChange = (field) => (value) => setFormState(field, value);
  
  // const getSelectedCollectionLabel = () => {
  //   const selectedCollectionObj = collections.find(collection => collection.value === formState.selectedCollection);
  //   return selectedCollectionObj ? selectedCollectionObj.label.toLowerCase() : "";
  // };
  
  // const collectionAnimalClassicQclassic = ["animal print", "quilted classic", "classic"];
  // const isCollectionAnimalClassicQclassic = () => {
  //   const selectedCollection = getSelectedCollectionLabel();
  //   return collectionAnimalClassicQclassic.includes(selectedCollection);
  // };

  useEffect(() => {
    const generateSKU = async () => {
      // Check if we have all necessary data to generate SKU
      if (formState.selectedCollection && formState.selectedLeatherColor1 && 
          formState.selectedStitchingColor && Object.values(formState.selectedStyles).some(Boolean)) {
        try {
          const skus = await generateSKUS(formState, leatherColors, threadColors, shapes, styles, formState.selectedOfferingType);
          console.log("Generated SKUs:", skus);
          
          const title = generateTitle(formState);
          console.log("Generated Title:", title);
        } catch (error) {
          console.error("Error generating SKU:", error);
        }
      }
    };

    generateSKU();
  }, [formState, leatherColors, threadColors, shapes, styles]);



  if (error) {
    return <div>Error: {error}</div>;
  };

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
                isCollectionAnimalClassicQclassic={isCollectionAnimalClassicQclassic}
              />
              <FontSelector
                fonts={fonts}
                selectedFont={formState.selectedFont}
                onChange={handleChange('selectedFont')}
              />
              {!isCollectionAnimalClassicQclassic() && (
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
              handleChange={handleChange}
              isCollectionAnimalClassicQclassic={isCollectionAnimalClassicQclassic}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}