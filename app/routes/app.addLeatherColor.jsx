import React, { useCallback, useMemo, useState } from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import { json } from "@remix-run/node";
import { loader as dataLoader } from "../lib/loaders";
import { authenticate } from "../shopify.server";
import { Page, Layout, InlineStack, Text, Card, Select, TextField, Checkbox, BlockStack, Tag, Combobox, Listbox, Icon, Box } from "@shopify/polaris";
import { SearchIcon } from '@shopify/polaris-icons';



export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  // Get data from our data loader
  return dataLoader({ request });
};

export const action = async ({ request }) => {
  await authenticate.admin(request);
  
  // Temporarily disabled for testing form
  return json({ success: true });
};

export default function AddLeatherColor () {
  const {
      leatherColors,
      colorTags,
  } = useLoaderData();

  // State for new leather color name
  const [leatherColorName, setLeatherColorName] = useState("");
  // State for selected color tags (array of values)
  const [selectedColorTags, setSelectedColorTags] = useState([]);
  // State for Combobox input
  const [colorTagInput, setColorTagInput] = useState("");

  // Filtered options for Combobox
  const filteredColorTagOptions = useMemo(() => {
    const search = colorTagInput.toLowerCase();
    return colorTags.filter(tag =>
      tag.label.toLowerCase().includes(search) && !selectedColorTags.includes(tag.value)
    ).map(tag => ({
      label: tag.label,
      value: tag.value
    }));
  }, [colorTags, colorTagInput, selectedColorTags]);

  // Handler for text input
  const handleLeatherColorNameChange = useCallback(
    (value) => {
      setLeatherColorName(value);
      console.log('New leather color name:', value);
    },
    []
  );

  // Handler for selecting a tag from Combobox
  const handleColorTagSelect = useCallback((value) => {
    if (!selectedColorTags.includes(value)) {
      setSelectedColorTags(prev => [...prev, value]);
    }
    setColorTagInput("");
  }, [selectedColorTags]);

  // Handler for removing a selected tag
  const handleRemoveColorTag = useCallback((tagValue) => {
    setSelectedColorTags((prev) => prev.filter((v) => v !== tagValue));
  }, []);

  return (
    <Page>
      <TitleBar title="Updated Collection Pricing" />
      <Layout>
        <Card>
          <InlineStack>
            <BlockStack gap="400">
              <Text variant="headingMd">Add New Leather Color</Text>
              <TextField
                label="Leather color name"
                value={leatherColorName}
                onChange={handleLeatherColorNameChange}
                autoComplete="off"
                placeholder="Enter new leather color name"
              />
              <Text variant="bodyMd" as="span">Select color tags:</Text>
              <Box width="100%">
                <Combobox
                  activator={
                    <Combobox.TextField
                      prefix={<Icon source={SearchIcon} />}
                      onChange={setColorTagInput}
                      label="Add color tag(s)"
                      value={colorTagInput}
                      placeholder="Search or select color tags"
                      autoComplete="off"
                    />
                  }
                >
                  {filteredColorTagOptions.length > 0 && (
                    <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
                      <Listbox onSelect={handleColorTagSelect}>
                        {filteredColorTagOptions.map(option => (
                          <Listbox.Option key={option.value} value={option.value}>
                            {option.label}
                          </Listbox.Option>
                        ))}
                      </Listbox>
                    </div>
                  )}
                </Combobox>
              </Box>
              {/* Display selected tags as removable tags */}
              <InlineStack gap="200" wrap>
                {selectedColorTags.map((tagValue) => {
                  const tagObj = colorTags.find((t) => t.value === tagValue);
                  return tagObj ? (
                    <Tag key={tagValue} onRemove={() => handleRemoveColorTag(tagValue)}>
                      {tagObj.label}
                    </Tag>
                  ) : null;
                })}
              </InlineStack>
            </BlockStack>
          </InlineStack>
        </Card>
      </Layout>
    </Page>
  );
}