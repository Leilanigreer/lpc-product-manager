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
  Select,
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
    // amannNumbers,
    // stitchingThreadColors,
    // embroideryThreadColors,
  } = useLoaderData();
  const fetcher = useFetcher();

  // Embroidery form state
  const [embName, setEmbName] = useState("");
  const [embIsacord, setEmbIsacord] = useState("");
  const [embIsacordInput, setEmbIsacordInput] = useState("");
  const [embColorTags, setEmbColorTags] = useState([]);
  const [embColorTagInput, setEmbColorTagInput] = useState("");
  const [embAbbreviation, setEmbAbbreviation] = useState("");

  // Stitching form state
  const [stitchName, setStitchName] = useState("");
  const [stitchAmann, setStitchAmann] = useState("");
  const [stitchColorTags, setStitchColorTags] = useState([]);
  const [stitchColorTagInput, setStitchColorTagInput] = useState("");
  const [stitchAbbreviation, setStitchAbbreviation] = useState("");

  // Abbreviation logic (same as leather colors)
  useEffect(() => {
    setEmbAbbreviation(
      embName
        .split(" ")
        .map(word => word[0]?.toUpperCase() || "")
        .join("")
    );
  }, [embName]);

  useEffect(() => {
    setStitchAbbreviation(
      stitchName
        .split(" ")
        .map(word => word[0]?.toUpperCase() || "")
        .join("")
    );
  }, [stitchName]);

  // Prepare options for Select components (static for now)
  const isacordOptions = [
    { label: "Select Isacord Number", value: "" },
    ...isacordNumbers.map(num => ({ label: num.label, value: num.value }))
  ];
  const colorTagOptions = useMemo(() =>
    colorTags?.map(tag => ({ label: tag.label, value: tag.value })) || [],
  [colorTags]);
  // const stitchingThreadOptions = stitchingThreadColors.map(thread => ({ label: thread.label, value: thread.value }));
  // const embroideryThreadOptions = embroideryThreadColors.map(thread => ({ label: thread.label, value: thread.value }));

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

  return (
    <Page>
      <TitleBar title="Add Thread Colors" />
      <Layout>
        <Layout.Section>
          <InlineStack gap="400">
            {/* Embroidery Thread Card */}
            <Card title="Add Embroidery Thread Color" sectioned>
              <BlockStack gap="200">
                <TextField
                  label="Name"
                  value={embName}
                  onChange={handleEmbNameChange}
                  autoComplete="off"
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
                <TextField
                  label="Abbreviation"
                  value={embAbbreviation}
                  readOnly
                  autoComplete="off"
                />
                {/* Submission button and logic to be added */}
                <Button primary disabled>Save Embroidery Thread Color</Button>
              </BlockStack>
            </Card>
            {/* Stitching Thread Card */}
            <Card title="Add Stitching Thread Color" sectioned>
              <BlockStack gap="200">
                <TextField
                  label="Name"
                  value={stitchName}
                  onChange={handleStitchNameChange}
                  autoComplete="off"
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
                <TextField
                  label="Abbreviation"
                  value={stitchAbbreviation}
                  readOnly
                  autoComplete="off"
                />
                {/* Submission button and logic to be added */}
                <Button primary disabled>Save Stitching Thread Color</Button>
              </BlockStack>
            </Card>
          </InlineStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 