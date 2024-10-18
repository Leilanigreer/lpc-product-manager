import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  InlineStack,
  Select,
  RadioButton,
  Box,
  Image,
  Grid,
  TextField,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { useState } from "react";
import prisma from "../db.server";

async function getCollections(admin) {
  const COLLECTION_QUERY = `
  query {
    collections(first: 20) {
      edges {
        node {
          id
          title
          handle
        }
      }
    }
  }
`; 

  try {
    const response = await admin.graphql(COLLECTION_QUERY);
    const responseJson = await response.json();

    console.log('Full GraphQL response:', JSON.stringify(responseJson, null, 2));

    if (responseJson.data && responseJson.data.collections && responseJson.data.collections.edges) {
      return responseJson.data.collections.edges.map(({ node }) => ({
        value: node.id,
        label: node.title,
        handle: node.handle
      }));
    } else {
      console.error('Unexpected response structure:', responseJson);
      throw new Error('Unexpected response structure from Shopify API');
    }
  } catch (error) {
    console.error("Error fetching Shopify collections:", error);
    throw error;
  }
}

async function getLeatherColors() {
  try {
    const leatherColors = await prisma.leatherColor.findMany();
    return leatherColors.map(color => ({
      value: color.id, 
      label:color.name,
      abbreviation: color.abbreviation, 
      image_url: color.image_url
    }));
  } catch (error) {
    console.error("Error fetching leather colors:", error);
    throw error;
  }
}

async function getThreadColors() {
  try {
    const threadColors = await prisma.thread.findMany();
    return threadColors.map(threadColor => ({
      value: threadColor.id, 
      label: threadColor.name,
      abbreviation: threadColor.abbreviation, 
    }));
  } catch (error) {
    console.error("Error fetching thread colors:", error);
    throw error;
  }
}

async function getFonts() {
  try {
    const fonts = await prisma.font.findMany();
    return fonts.map(font => ({
      value: font.id, 
      label: font.name,
      image_url: font.image_url, 
    }));
  } catch (error) {
    console.error("Error fetching fonts:", error);
    throw error;
  }
}

async function getShapes() {
  try {
    const shapes = await prisma.shape.findMany();
    return shapes.map(shape => ({
      value: shape.id, 
      label: shape.name,
    }));
  } catch (error) {
    console.error("Error fetching shapes:", error);
    throw error;
  }
}


async function getStyles() {
  try {
    const styles = await prisma.style.findMany();
    return styles.map(style => ({
      value: style.id, 
      label: style.name,
    }));
  } catch (error) {
    console.error("Error fetching styles:", error);
    throw error;
  }
}

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  
  try {
    const [collections, leatherColors, threadColors, fonts, shapes, styles] = await Promise.all([
      getCollections(admin),
      getLeatherColors(),
      getThreadColors(),
      getFonts(), 
      getShapes(),
      getStyles(),
    ]);
    return json({ collections, leatherColors, threadColors, fonts, shapes, styles });
  } catch (error) {
    console.error('Loader error:', error);
    return json({ error: error.message }, { status: 500 });
  }
};

export default function CreateProduct() {
  const { collections, leatherColors, threadColors, fonts, shapes, styles, error } = useLoaderData();
  const [selectedCollection, setSelectedCollection] = useState("");
  const [selectedOfferingType, setSelectedOfferingType] = useState("");
  const [selectedLeatherColor1, setSelectedLeatherColor1] = useState("");
  const [selectedLeatherColor2, setSelectedLeatherColor2] = useState("");
  const [selectedStitchingColor, setSelectedStitichingColor] = useState("");
  const [selectedEmbroideryColor, setSelectedEmbroideryColor] = useState("");
  const [selectedFont, setSelectedFont] = useState("");
  const [selectedStyles, setSelectedStyles] = useState({});
  const [weights, setWeights] = useState({});

  const handleSelectChange = (value) => {
    setSelectedCollection(value);
  };

  const handleRadioChange = (newValue) => {
    setSelectedOfferingType(newValue);
  };

  const handleLeatherColor1Change = (value) => {
    setSelectedLeatherColor1(value)
  };

  const handleLeatherColor2Change = (value) => {
    setSelectedLeatherColor2(value)
  };

  const handleStitchingColorChange = (value) => {
    setSelectedStitichingColor(value)
  };

  const handleEmbroideryColorChange = (value) => {
    setSelectedEmbroideryColor(value)
  };

  const handleFontChange = (value) => {
    setSelectedFont(value)
  };

  const handleStyleChange = (shapeId, value) => {
    setSelectedStyles(prev => ({ ...prev, [shapeId]: value }));
  };

  const handleWeightChange = (shapeId, value) => {
    setWeights(prev => ({ ...prev, [shapeId]: value }));
  };

  const isTwoLeatherCollection = () => {
    const twoLeatherCollections = ["animal print", "quilted classic"];
    const selectedCollectionObj = collections.find(collection => collection.value === selectedCollection);
    return selectedCollectionObj && twoLeatherCollections.includes(selectedCollectionObj.label.toLowerCase());
  };

  const leatherColorOptions = [
    {label: "Select a Leather", value: ""},
    ...leatherColors
  ];

  const selectedLeatherColorObject1 = leatherColors.find(leatherColor => leatherColor.value === selectedLeatherColor1);
  const selectedLeatherColorObject2 = leatherColors.find(leatherColor => leatherColor.value === selectedLeatherColor2);
  

  const threadColorOptions = [
    {label: "Color of Thread", value: ""},
    ...threadColors
  ];

  const fontOptions = [
    {label: "Font used", value: ""},
    ...fonts
  ];

  const selectedFontObject = fonts.find(font => font.value === selectedFont);

  if (error) {
    return <div>Error {error} </div>;
  };

  return (
    <Page>
      <TitleBar title="Create a new product" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Create Product Page
              </Text>
              <Text as="p" variant="bodyMd">
                Hello, this is a test. Here you can add your product creation form or logic.
              </Text>
              <BlockStack gap="400">
                <InlineStack gap="400" align="start">
                  <RadioButton
                    label="Customizable"
                    checked={selectedOfferingType === 'customizable'}
                    id="customizable"
                    name="productType"
                    onChange={() => handleRadioChange('customizable')}
                  />
                  <RadioButton
                    label="Limited Edition"
                    checked={selectedOfferingType === 'limitedEdition'}
                    id="limitedEdition"
                    name="productType"
                    onChange={() => handleRadioChange('limitedEdition')}
                  />
                </InlineStack>
                <Select
                  label="Select a collection"
                  options={collections}
                  onChange={handleSelectChange}
                  value={selectedCollection}
                />
                <BlockStack gap="400">
                  <InlineStack gap="500" align="start" wrap={false}>
                    <Box width={isTwoLeatherCollection() ? "25%" : "50%"}>
                      <Select
                        label="Select Leather Color"
                        options={leatherColorOptions}
                        onChange={handleLeatherColor1Change}
                        value={selectedLeatherColor1}
                      />
                    </Box>
                    <Box width={isTwoLeatherCollection() ? "25%" : "50%"}>
                      {selectedLeatherColorObject1 && selectedLeatherColorObject1.image_url && (
                        <BlockStack gap="200">
                          <Text variant="bodyMd" as="p">Leather Preview:</Text>
                          <Image
                            source={selectedLeatherColorObject1.image_url}
                            alt={`Preview of ${selectedLeatherColorObject1.label} leather`}
                            style={{width: '150px', height: 'auto'}}
                          />
                        </BlockStack>
                      )}
                    </Box>
                    {isTwoLeatherCollection() && (
                      <>
                        <Box width="25%">
                          <Select
                            label="Select 2nd Leather Color"
                            options={leatherColorOptions}
                            onChange={handleLeatherColor2Change}
                            value={selectedLeatherColor2}
                          />
                        </Box>
                        <Box width="25%">
                          {selectedLeatherColorObject2 && selectedLeatherColorObject2.image_url && (
                            <BlockStack gap="200">
                              <Text variant="bodyMd" as="p">2nd Leather Preview:</Text>
                              <Image
                                source={selectedLeatherColorObject2.image_url}
                                alt={`Preview of ${selectedLeatherColorObject2.label} leather`}
                                style={{width: '150px', height: 'auto'}}
                              />
                            </BlockStack>
                          )}
                        </Box>
                      </>
                    )}
                  </InlineStack>
                </BlockStack>
                <Select
                  label="Select Stitching"
                  options={threadColorOptions}
                  onChange={handleStitchingColorChange}
                  value={selectedStitchingColor}
                />
                <Select
                  label="Select Embroidery"
                  options={threadColorOptions}
                  onChange={handleEmbroideryColorChange}
                  value={selectedEmbroideryColor} 
                />
                <BlockStack gap="400">
                  <InlineStack gap="500" align="start" wrap={false}>
                    <Box width="50%">
                      <Select
                        label="Select Font"
                        options={fontOptions}
                        onChange={handleFontChange}
                        value={selectedFont}
                      />
                    </Box>
                    <Box width="50%">
                      {selectedFontObject && selectedFontObject.image_url && (
                        <BlockStack gap="200">
                          <Text variant="bodyMd" as="p">Font Preview:</Text>
                          <Image
                            source={selectedFontObject.image_url}
                            alt={`Preview of ${selectedFontObject.label} font`}
                            style={{width: '150px', height: 'auto'}}
                          />
                        </BlockStack>
                      )}
                    </Box>
                  </InlineStack>
                </BlockStack>
              </BlockStack>
            </BlockStack>
          </Card>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Part 2
              </Text>
              <Text as="p" variant="bodyMd">
                Hello, this is a test. Here you can create the second part.
              </Text>
              {shapes.map((shape) => (
                <Grid key={shape.value}>
                  <Grid.Cell columnSpan={{xs: 6, sm: 2, md: 2, lg: 2, xl: 2}}>
                    <Text variant="bodyMd">{shape.label}</Text>
                  </Grid.Cell>
                  <Grid.Cell columnSpan={{xs: 6, sm: 5, md: 5, lg: 5, xl: 5}}>
                    <Select
                      label="Style"
                      options={styles}
                      onChange={(value) => handleStyleChange(shape.value, value)}
                      value={selectedStyles[shape.value] || ''}
                      labelHidden
                      placeholder="Select style"
                    />
                  </Grid.Cell>
                  <Grid.Cell columnSpan={{xs: 6, sm: 5, md: 5, lg: 5, xl: 5}}>
                    <TextField
                      label="Weight"
                      type="number"
                      onChange={(value) => handleWeightChange(shape.value, value)}
                      value={weights[shape.value] || ''}
                      labelHidden
                      placeholder="Enter weight"
                    />
                  </Grid.Cell>
                </Grid>
              ))}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
