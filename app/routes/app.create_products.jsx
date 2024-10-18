import React, { useEffect } from "react";
import { Form, useLoaderData, useFetcher } from "@remix-run/react";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { useFormState } from "../hooks/useFormState";
import { loader } from "../lib/loaders";
import CollectionSelector from "../components/CollectionSelector.jsx";
import LeatherColorSelector from "../components/LeatherColorSelector.jsx";
import FontSelector from "../components/FontSelector.jsx";
import ThreadColorSelector from "../components/ThreadColorSelector.jsx";
import ShapeSelector from "../components/ShapeSelector.jsx";
import { generateSKU, generateTitle } from "../lib/productAttributes.js";

import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  InlineStack,
  RadioButton,
  Button,
} from "@shopify/polaris";

export { loader };

export default function CreateProduct() {
  const { collections, leatherColors, threadColors, fonts, shapes, styles, error } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge(); 
  const isLoading = ["loading", "submitting"].includes(fetcher.state) && fetcher.formMethod === "POST";
  
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
  
  const handleChange = (field) => (value) => setFormState(field, value);
  
  const getSelectedCollectionLabel = () => {
    const selectedCollectionObj = collections.find(collection => collection.value === formState.selectedCollection);
    return selectedCollectionObj ? selectedCollectionObj.label.toLowerCase() : "";
  };
  
  const collectionAnimalClassicQclassic = ["animal print", "quilted classic", "classic"];
  const isCollectionAnimalClassicQclassic = () => {
    const selectedCollection = getSelectedCollectionLabel();
    return collectionAnimalClassicQclassic.includes(selectedCollection);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    // Generate SKU and title
    const sku = generateSKU(formState);
    const title = generateTitle(formState);
    
    // Append generated data to formData
    formData.append('sku', sku);
    formData.append('title', title);
    
    // Add all formState data to formData
    Object.entries(formState).forEach(([key, value]) => {
      formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
    });

    fetcher.submit(formData, { method: "POST" });
  };

  useEffect(() => {
    if (fetcher.data?.product?.id) {
      shopify.toast.show("Product created");
    }
  }, [fetcher.data, shopify]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <Page>
      <TitleBar title="Create a new product" />
      <Form method="post" onSubmit={handleSubmit}>
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
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Button submit disabled={isLoading} loading={isLoading}>
                  {isLoading ? "Creating..." : "Create Product"}
                </Button>
                {fetcher.data?.product && (
                  <Text>Product created: {fetcher.data.product.title}</Text>
                )}
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Form>
    </Page>
  );
}

export { action } from "./app.create_product.server";