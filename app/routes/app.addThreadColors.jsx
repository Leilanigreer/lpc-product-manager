import React, { useEffect, useMemo, useState } from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import { json } from "@remix-run/node";
import { loader as dataLoader } from "../lib/loaders";
import { authenticate } from "../shopify.server";
import {
  Page,
  Layout,
  Card,
  TextField,
  Button,
  BlockStack,
  InlineStack,
  Banner,
  Modal,
  InlineError,
  Box,
  Combobox,
  Listbox,
  Tag,
  Icon,
  Text,
} from "@shopify/polaris";
import { SearchIcon } from '@shopify/polaris-icons';

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  // Get data from our data loader
  return dataLoader({ request });
};

export const action = async ({ request }) => {
  await authenticate.admin(request);
  const formData = await request.formData();
  console.log('[AddThreadColors] Received formData:', Array.from(formData.entries()));
  return json({ success: true });
};

// Utility: Title Case
const toTitleCase = (str) => {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

export default function AddThreadColors() {
  const {
    colorTags,
    isacordNumbers,
    amannNumbers,
    stitchingThreadColors,
    embroideryThreadColors,
  } = useLoaderData();
  const fetcher = useFetcher();

  // Embroidery form state
  const [embName, setEmbName] = useState("");
  const [embIsacord, setEmbIsacord] = useState("");
  const [embIsacordInput, setEmbIsacordInput] = useState("");
  const [embColorTags, setEmbColorTags] = useState([]);
  const [embColorTagInput, setEmbColorTagInput] = useState("");
  // Embroidery modal and error state
  const [embModalOpen, setEmbModalOpen] = useState(false);
  const [embError, setEmbError] = useState("");
  const [embGeneratedAbbr, setEmbGeneratedAbbr] = useState("");
  const [embFormattedName, setEmbFormattedName] = useState("");

  // Stitching form state
  const [stitchName, setStitchName] = useState("");
  const [stitchAmann, setStitchAmann] = useState("");
  const [stitchColorTags, setStitchColorTags] = useState([]);
  const [stitchColorTagInput, setStitchColorTagInput] = useState("");
  // Stitching modal and error state
  const [stitchModalOpen, setStitchModalOpen] = useState(false);
  const [stitchError, setStitchError] = useState("");
  const [stitchGeneratedAbbr, setStitchGeneratedAbbr] = useState("");
  const [stitchFormattedName, setStitchFormattedName] = useState("");


  // Filtered options for embroidery color tags
  const filteredEmbColorTagOptions = useMemo(() => {
    const search = embColorTagInput.toLowerCase();
    return colorTags.filter(tag =>
      tag.label.toLowerCase().includes(search) && !embColorTags.includes(tag.value)
    ).map(tag => ({
      label: tag.label,
      value: tag.value
    }));
  }, [colorTags, embColorTagInput, embColorTags]);

  // Filtered options for stitching color tags
  const filteredStitchColorTagOptions = useMemo(() => {
    const search = stitchColorTagInput.toLowerCase();
    return colorTags.filter(tag =>
      tag.label.toLowerCase().includes(search) && !stitchColorTags.includes(tag.value)
    ).map(tag => ({
      label: tag.label,
      value: tag.value
    }));
  }, [colorTags, stitchColorTagInput, stitchColorTags]);

  // Filtered options for Isacord numbers
  const filteredIsacordOptions = useMemo(() => {
    const search = embIsacordInput.toLowerCase();
    return isacordNumbers.filter(num =>
      num.label.toLowerCase().includes(search)
    );
  }, [isacordNumbers, embIsacordInput]);

  // Handlers for embroidery color tags
  const handleEmbColorTagSelect = (value) => {
    if (!embColorTags.includes(value)) {
      setEmbColorTags(prev => [...prev, value]);
    }
    setEmbColorTagInput("");
  };
  const handleRemoveEmbColorTag = (tagValue) => {
    setEmbColorTags(prev => prev.filter(v => v !== tagValue));
  };

  // Handlers for stitching color tags
  const handleStitchColorTagSelect = (value) => {
    if (!stitchColorTags.includes(value)) {
      setStitchColorTags(prev => [...prev, value]);
    }
    setStitchColorTagInput("");
  };
  const handleRemoveStitchColorTag = (tagValue) => {
    setStitchColorTags(prev => prev.filter(v => v !== tagValue));
  };

  // Handlers for embroidery and stitching name fields with title case
  const handleEmbNameChange = (value) => {
    const formatted = toTitleCase(value);
    setEmbName(formatted);
  };
  const handleStitchNameChange = (value) => {
    const formatted = toTitleCase(value);
    setStitchName(formatted);
  };

  // Handler for Isacord selection
  const handleIsacordSelect = (value) => {
    setEmbIsacord(value);
    setEmbIsacordInput("");
  };

  // Utility: Generate unique abbreviation (like leather, but always ends with 'E')
  const generateEmbAbbreviation = (name, embroideryAbbrsRaw) => {
    if (!name) return "";
    // All existing abbreviations should be compared with 'E' at the end
    const existingAbbrs = (embroideryAbbrsRaw || []).map(abbr => abbr.endsWith('E') ? abbr : abbr + 'E');
    const words = name.split(" ").filter(Boolean);
    // Try 1 to max word length for each word
    const maxLen = Math.max(...words.map(w => w.length));
    for (let i = 1; i <= maxLen; i++) {
      const abbr = words.map(w => w.slice(0, i)).join("") + 'E';
      if (!existingAbbrs.includes(abbr)) return abbr;
    }
    // If all combinations are taken, append a number
    let n = 2;
    while (true) {
      for (let i = 1; i <= maxLen; i++) {
        const abbr = words.map(w => w.slice(0, i)).join("") + 'E' + n;
        if (!existingAbbrs.includes(abbr)) return abbr;
      }
      n++;
    }
  };

  // Handler for Save Embroidery Thread Color
  const handleEmbSave = () => {
    const name = toTitleCase(embName.trim());
    setEmbFormattedName(name);
    // Check uniqueness
    const nameExists = (embroideryThreadColors || []).some(tc => tc.label && tc.label.toLowerCase() === name.toLowerCase());
    if (!name) {
      setEmbError("Please enter a thread color name.");
      return;
    }
    if (nameExists) {
      setEmbError("This embroidery thread color name already exists.");
      return;
    }
    // Generate abbreviation (with E suffix)
    const existingAbbrs = (embroideryThreadColors || []).map(tc => tc.abbreviation);
    const abbr = generateEmbAbbreviation(name, existingAbbrs);
    setEmbGeneratedAbbr(abbr);
    setEmbModalOpen(true);
    setEmbError("");
  };

  // Handler for confirming in modal (for now, just close and reset)
  const handleEmbConfirm = () => {
    setEmbModalOpen(false);
    setEmbName("");
    setEmbIsacord("");
    setEmbColorTags([]);
    setEmbGeneratedAbbr("");
    setEmbFormattedName("");
    setEmbError("");
  };
  const handleEmbModalClose = () => {
    setEmbModalOpen(false);
  };

  // Utility: Generate unique abbreviation for stitching (always ends with 'S')
  const generateStitchAbbreviation = (name, stitchingAbbrsRaw) => {
    if (!name) return "";
    const existingAbbrs = (stitchingAbbrsRaw || []).map(abbr => abbr.endsWith('S') ? abbr : abbr + 'S');
    const words = name.split(" ").filter(Boolean);
    const maxLen = Math.max(...words.map(w => w.length));
    for (let i = 1; i <= maxLen; i++) {
      const abbr = words.map(w => w.slice(0, i)).join("") + 'S';
      if (!existingAbbrs.includes(abbr)) return abbr;
    }
    let n = 2;
    while (true) {
      for (let i = 1; i <= maxLen; i++) {
        const abbr = words.map(w => w.slice(0, i)).join("") + 'S' + n;
        if (!existingAbbrs.includes(abbr)) return abbr;
      }
      n++;
    }
  };

  // Handler for Save Stitching Thread Color
  const handleStitchSave = () => {
    const name = toTitleCase(stitchName.trim());
    setStitchFormattedName(name);
    // Check uniqueness
    const nameExists = (stitchingThreadColors || []).some(tc => tc.label && tc.label.toLowerCase() === name.toLowerCase());
    if (!name) {
      setStitchError("Please enter a thread color name.");
      return;
    }
    if (nameExists) {
      setStitchError("This stitching thread color name already exists.");
      return;
    }
    // Generate abbreviation (with S suffix)
    const existingAbbrs = (stitchingThreadColors || []).map(tc => tc.abbreviation);
    const abbr = generateStitchAbbreviation(name, existingAbbrs);
    setStitchGeneratedAbbr(abbr);
    setStitchModalOpen(true);
    setStitchError("");
  };

  // Handler for confirming in modal (for now, just close and reset)
  const handleStitchConfirm = () => {
    setStitchModalOpen(false);
    setStitchName("");
    setStitchAmann("");
    setStitchColorTags([]);
    setStitchGeneratedAbbr("");
    setStitchFormattedName("");
    setStitchError("");
  };
  const handleStitchModalClose = () => {
    setStitchModalOpen(false);
  };

  return (
    <Page>
      <TitleBar title="Add Thread Colors" />
      <Layout>
        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Add Embroidery Thread Color</Text>
            <BlockStack gap="400">
              <TextField
                label="Name"
                value={embName}
                onChange={handleEmbNameChange}
                autoComplete="off"
                error={embError}
              />
              <Combobox
                activator={
                  <Combobox.TextField
                    prefix={<Icon source={SearchIcon} />}
                    onChange={setEmbIsacordInput}
                    label="Isacord Number"
                    value={embIsacordInput}
                    placeholder="Search or select Isacord Number"
                    autoComplete="off"
                  />
                }
              >
                {filteredIsacordOptions.length > 0 && (
                  <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
                    <Listbox onSelect={handleIsacordSelect}>
                      {filteredIsacordOptions.map(option => (
                        <Listbox.Option key={option.value} value={option.value}>
                          {option.label}
                        </Listbox.Option>
                      ))}
                    </Listbox>
                  </div>
                )}
              </Combobox>
              {embIsacord && (
                <InlineStack gap="200" wrap>
                  <Tag onRemove={() => setEmbIsacord("")}>{isacordNumbers.find(num => num.value === embIsacord)?.label || embIsacord}</Tag>
                </InlineStack>
              )}
              <Combobox
                activator={
                  <Combobox.TextField
                    prefix={<Icon source={SearchIcon} />}
                    onChange={setEmbColorTagInput}
                    label="Color Tags"
                    value={embColorTagInput}
                    placeholder="Search or select color tags"
                    autoComplete="off"
                  />
                }
              >
                {filteredEmbColorTagOptions.length > 0 && (
                  <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
                    <Listbox onSelect={handleEmbColorTagSelect}>
                      {filteredEmbColorTagOptions.map(option => (
                        <Listbox.Option key={option.value} value={option.value}>
                          {option.label}
                        </Listbox.Option>
                      ))}
                    </Listbox>
                  </div>
                )}
              </Combobox>
              <InlineStack gap="200" wrap>
                {embColorTags.map((tagValue) => {
                  const tagObj = colorTags.find((t) => t.value === tagValue);
                  return tagObj ? (
                    <Tag key={tagValue} onRemove={() => handleRemoveEmbColorTag(tagValue)}>
                      {tagObj.label}
                    </Tag>
                  ) : null;
                })}
              </InlineStack>
              <Button primary onClick={handleEmbSave}>Save Embroidery Thread Color</Button>
            </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Add Stitching Thread Color</Text>
            <BlockStack gap="400">
              <TextField
                label="Name"
                value={stitchName}
                onChange={handleStitchNameChange}
                autoComplete="off"
                error={stitchError}
              />
              <TextField
                label="Amann Number"
                value={stitchAmann}
                onChange={setStitchAmann}
                autoComplete="off"
              />
              <Combobox
                activator={
                  <Combobox.TextField
                    prefix={<Icon source={SearchIcon} />}
                    onChange={setStitchColorTagInput}
                    label="Color Tags"
                    value={stitchColorTagInput}
                    placeholder="Search or select color tags"
                    autoComplete="off"
                  />
                }
              >
                {filteredStitchColorTagOptions.length > 0 && (
                  <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
                    <Listbox onSelect={handleStitchColorTagSelect}>
                      {filteredStitchColorTagOptions.map(option => (
                        <Listbox.Option key={option.value} value={option.value}>
                          {option.label}
                        </Listbox.Option>
                      ))}
                    </Listbox>
                  </div>
                )}
              </Combobox>
              <InlineStack gap="200" wrap>
                {stitchColorTags.map((tagValue) => {
                  const tagObj = colorTags.find((t) => t.value === tagValue);
                  return tagObj ? (
                    <Tag key={tagValue} onRemove={() => handleRemoveStitchColorTag(tagValue)}>
                      {tagObj.label}
                    </Tag>
                  ) : null;
                })}
              </InlineStack>
              <Button primary onClick={handleStitchSave}>Save Stitching Thread Color</Button>
            </BlockStack>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
      {/* Embroidery Confirmation Modal */}
      <Modal
        open={embModalOpen}
        onClose={handleEmbModalClose}
        title="Confirm New Embroidery Thread Color"
        primaryAction={{
          content: "Confirm",
          onAction: handleEmbConfirm,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleEmbModalClose,
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="200">
            <Text><b>Name:</b> {embFormattedName}</Text>
            <Text><b>Abbreviation:</b> {embGeneratedAbbr}</Text>
            <Text><b>Isacord Number:</b> {isacordNumbers.find(num => num.value === embIsacord)?.label || embIsacord || "None"}</Text>
            <Text><b>Tags:</b> {embColorTags.map(tagValue => {
              const tagObj = colorTags.find(t => t.value === tagValue);
              return tagObj ? tagObj.label : tagValue;
            }).join(", ") || "None"}</Text>
          </BlockStack>
        </Modal.Section>
      </Modal>
      {/* Stitching Confirmation Modal */}
      <Modal
        open={stitchModalOpen}
        onClose={handleStitchModalClose}
        title="Confirm New Stitching Thread Color"
        primaryAction={{
          content: "Confirm",
          onAction: handleStitchConfirm,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleStitchModalClose,
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="200">
            <Text><b>Name:</b> {stitchFormattedName}</Text>
            <Text><b>Abbreviation:</b> {stitchGeneratedAbbr}</Text>
            <Text><b>Amann Number:</b> {stitchAmann || "None"}</Text>
            <Text><b>Tags:</b> {stitchColorTags.map(tagValue => {
              const tagObj = colorTags.find(t => t.value === tagValue);
              return tagObj ? tagObj.label : tagValue;
            }).join(", ") || "None"}</Text>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
} 