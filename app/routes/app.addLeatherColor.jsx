import React, { useCallback, useMemo, useState } from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import { json } from "@remix-run/node";
import { loader as dataLoader } from "../lib/loaders";
import { authenticate } from "../shopify.server";
import { Page, Layout, InlineStack, Text, Card, Select, TextField, Checkbox, BlockStack, Tag, Combobox, Listbox, Icon, Box, Button, Banner, Modal, InlineError, RadioButton } from "@shopify/polaris";
import { SearchIcon } from '@shopify/polaris-icons';
import ImageDropZone from '../components/ImageDropZone';
import { createLeatherColorWithTags } from "../lib/server/leatherColorOperations.server.js";



export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  // Get data from our data loader
  return dataLoader({ request });
};

export const action = async ({ request }) => {
  await authenticate.admin(request);
  const formData = await request.formData();
  console.log('[AddLeatherColor] Received formData:', Array.from(formData.entries()));
  const name = formData.get("name");
  const abbreviation = formData.get("abbreviation");
  const isLimitedEditionLeather = formData.get("isLimitedEditionLeather") === "true";
  const colorTagIds = formData.getAll("colorTagIds");
  console.log('[AddLeatherColor] Parsed values:', { name, abbreviation, isLimitedEditionLeather, colorTagIds });

  if (!name || !abbreviation) {
    return json({ success: false, error: "Missing required fields." }, { status: 400 });
  }

  try {
    const leatherColor = await createLeatherColorWithTags(
      { name, abbreviation, isLimitedEditionLeather },
      colorTagIds
    );
    console.log('[AddLeatherColor] Created leatherColor:', leatherColor);
    return json({ success: true, leatherColor });
  } catch (error) {
    console.error('[AddLeatherColor] Error in action:', error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
};

export default function AddLeatherColor () {
  console.log('[AddLeatherColor] Component rendered');
  const {
      leatherColors,
      colorTags,
  } = useLoaderData();
  const fetcher = useFetcher();

  // State for new leather color name
  const [leatherColorName, setLeatherColorName] = useState("");
  // State for selected color tags (array of values)
  const [selectedColorTags, setSelectedColorTags] = useState([]);
  // State for Combobox input
  const [colorTagInput, setColorTagInput] = useState("");
  // State for error messages
  const [error, setError] = useState("");
  // State for modal visibility
  const [modalOpen, setModalOpen] = useState(false);
  // State for abbreviation
  const [generatedAbbr, setGeneratedAbbr] = useState("");
  // State for formatted name
  const [formattedName, setFormattedName] = useState("");
  // State for stock type
  const [isLimitedEditionLeather, setIsLimitedEditionLeather] = useState(false);

  React.useEffect(() => {
    console.log('[AddLeatherColor] Component mounted');
  }, []);

  // Utility: Title Case
  const toTitleCase = (str) => {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  };

  // Utility: Generate Abbreviation
  const generateAbbreviation = (name, existingAbbrs) => {
    if (!name) return "";
    const words = name.split(" ").filter(Boolean);
    let abbr = words.map(w => w[0].toUpperCase()).join("");
    if (!existingAbbrs.includes(abbr)) return abbr;
    // Try adding second letter (lowercase) of each word
    let i = 1;
    while (true) {
      let nextAbbr = words.map(w => w[0].toUpperCase() + (w[i] ? w[i].toLowerCase() : "")).join("");
      if (!existingAbbrs.includes(nextAbbr)) return nextAbbr;
      i++;
      // Fallback: if we run out of letters, append a number
      if (i > Math.max(...words.map(w => w.length))) {
        let n = 2;
        while (existingAbbrs.includes(abbr + n)) n++;
        return abbr + n;
      }
    }
  };

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
      const formatted = toTitleCase(value);
      setLeatherColorName(formatted);
      setFormattedName(formatted);
      setError("");
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

  // Handler for Create button
  const handleCreate = useCallback(() => {
    console.log('[AddLeatherColor] handleCreate called with:', {
      leatherColorName,
      generatedAbbr,
      isLimitedEditionLeather,
      selectedColorTags,
      colorTagInput,
      formattedName
    });
    const name = toTitleCase(leatherColorName.trim());
    setFormattedName(name);
    // Check uniqueness
    const nameExists = leatherColors.some(lc => lc.label && lc.label.toLowerCase() === name.toLowerCase());
    if (!name) {
      setError("Please enter a leather color name.");
      return;
    }
    if (nameExists) {
      setError("This leather color name already exists.");
      return;
    }
    // Generate abbreviation
    const existingAbbrs = leatherColors.map(lc => lc.abbreviation);
    const abbr = generateAbbreviation(name, existingAbbrs);
    setGeneratedAbbr(abbr);
    setModalOpen(true);
    setError("");
  }, [leatherColorName, leatherColors, generatedAbbr, isLimitedEditionLeather, selectedColorTags, colorTagInput, formattedName]);

  // Handler for confirming in modal
  const handleConfirm = useCallback(() => {
    console.log('[AddLeatherColor] handleConfirm called');
    // Prepare form data
    const formData = new FormData();
    formData.append('name', formattedName);
    formData.append('abbreviation', generatedAbbr);
    formData.append('isLimitedEditionLeather', isLimitedEditionLeather ? 'true' : 'false');
    selectedColorTags.forEach(tagId => formData.append('colorTagIds', tagId));
    console.log('[AddLeatherColor] Submitting formData:', Array.from(formData.entries()));
    fetcher.submit(formData, { method: 'post' });
    setModalOpen(false);
    // Reset form state after submission
    setLeatherColorName("");
    setSelectedColorTags([]);
    setColorTagInput("");
    setGeneratedAbbr("");
    setFormattedName("");
    setIsLimitedEditionLeather(false);
    setError("");
  }, [formattedName, generatedAbbr, isLimitedEditionLeather, selectedColorTags]);

  // Handler for closing modal
  const handleModalClose = useCallback(() => {
    alert('[AddLeatherColor] handleModalClose called');
    console.log('[AddLeatherColor] handleModalClose called');
    setModalOpen(false);
  }, []);

  return (
    <Page>
      {console.log('[AddLeatherColor] Render return')}
      <TitleBar title="Add a New Leather Color" />
      {/* Optionally show fetcher state */}
      {fetcher.state === 'submitting' && <Banner status="info">Submitting...</Banner>}
      {fetcher.data && fetcher.data.success && <Banner status="success">Leather color created!</Banner>}
      {fetcher.data && fetcher.data.error && <Banner status="critical">{fetcher.data.error}</Banner>}
      <Layout>
        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Add New Leather Color</Text>
              <BlockStack gap="100">
                {/* Labels Row */}
                <InlineStack gap="800" align="start" wrap={false}>
                  <Box width="50%">
                    <Text variant="bodyMd" as="label" fontWeight="medium" htmlFor="leatherColorNameInput">
                      Leather color name
                    </Text>
                  </Box>
                  <Box width="50%">
                    <Text variant="bodyMd" as="label" fontWeight="medium">
                      Stock Type
                    </Text>
                  </Box>
                </InlineStack>
                {/* Fields Row */}
                <InlineStack gap="800" align="start" wrap={false}>
                  <Box width="50%">
                    <TextField
                      id="leatherColorNameInput"
                      label=""
                      value={leatherColorName}
                      onChange={handleLeatherColorNameChange}
                      autoComplete="off"
                      placeholder="Enter new leather color name"
                    />
                    {error && <InlineError message={error} fieldID="leatherColorName" />}
                  </Box>
                  <Box width="50%">
                    <InlineStack gap="400" wrap={false}>
                      <RadioButton
                        label="Standard Stock"
                        checked={!isLimitedEditionLeather}
                        id="standardStock"
                        name="stockType"
                        onChange={() => setIsLimitedEditionLeather(false)}
                      />
                      <RadioButton
                        label="Limited Edition"
                        checked={isLimitedEditionLeather}
                        id="limitedEdition"
                        name="stockType"
                        onChange={() => setIsLimitedEditionLeather(true)}
                      />
                    </InlineStack>
                  </Box>
                </InlineStack>
              </BlockStack>
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
              {/* <ImageDropZone
                size="additional"
                label="Leather Image"
                // onDrop={handleLeatherImageDrop} // <-- To be implemented
                // uploadedImageUrl={leatherImageUrl} // <-- To be implemented
              />
              <Banner status="info" title="Feature in development">
                Image upload for leather colors is coming soon! You can continue filling out the rest of the form.
              </Banner> */}
              <Button primary onClick={() => { alert('[AddLeatherColor] Create button clicked'); console.log('[AddLeatherColor] Create button clicked'); handleCreate(); }}> Create </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
      <Modal
        open={modalOpen}
        onClose={() => { console.log('[AddLeatherColor] Modal onClose called'); handleModalClose(); }}
        title="Confirm New Leather Color"
        primaryAction={{
          content: "Confirm",
          onAction: handleConfirm,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleModalClose,
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="200">
            {/* <Text variant="headingMd">Please confirm the details:</Text> */}
            <Text><b>Name:</b> {formattedName}</Text>
            <Text><b>Abbreviation:</b> {generatedAbbr}</Text>
            <Text><b>Tags:</b> {selectedColorTags.map(tagValue => {
              const tagObj = colorTags.find(t => t.value === tagValue);
              return tagObj ? tagObj.label : tagValue;
            }).join(", ") || "None"}</Text>
            <Text><b>Stock Type:</b> {isLimitedEditionLeather ? "Limited Edition" : "Standard Stock"}</Text>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}