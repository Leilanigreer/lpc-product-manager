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
  Badge,
  Icon,
  Text,
  Divider,
} from "@shopify/polaris";
import { SearchIcon, CheckCircleIcon, PlusCircleIcon, DeleteIcon } from '@shopify/polaris-icons';
import { createEmbroideryThreadColorWithTags, createStitchingThreadColorWithTags, linkAmannNumberToStitchingThreadColor } from "../lib/server/threadColorOperations.server.js";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  // Get data from our data loader
  return dataLoader({ request });
};

export const action = async ({ request }) => {
  await authenticate.admin(request);
  const formData = await request.formData();
  console.log('[AddThreadColors] Received formData:', Array.from(formData.entries()));

  // Determine type of thread color operation
  const type = formData.get("type"); // 'embroidery' | 'stitching' | 'linkAmann'
  console.log('[AddThreadColors] action type:', type);

  try {
    if (type === "embroidery") {
      const name = formData.get("name");
      const abbreviation = formData.get("abbreviation");
      const isacordNumber = formData.get("isacordNumber");
      const colorTagIds = formData.getAll("colorTagIds");
      console.log('[AddThreadColors] Embroidery branch - values:', { name, abbreviation, isacordNumber, colorTagIds });
      if (!name || !abbreviation) {
        console.log('[AddThreadColors] Missing required fields for embroidery');
        return json({ success: false, error: "Missing required fields." }, { status: 400 });
      }
      const result = await createEmbroideryThreadColorWithTags(
        { name, abbreviation, isacordNumber },
        colorTagIds
      );
      console.log('[AddThreadColors] Embroidery thread color created:', result);
      return json({ success: true, threadColor: result });
    } else if (type === "stitching") {
      const name = formData.get("name");
      const abbreviation = formData.get("abbreviation");
      const amannNumber = formData.get("amannNumber");
      const colorTagIds = formData.getAll("colorTagIds");
      if (!name || !abbreviation) {
        return json({ success: false, error: "Missing required fields." }, { status: 400 });
      }
      const result = await createStitchingThreadColorWithTags(
        { name, abbreviation, amannNumber },
        colorTagIds
      );
      return json({ success: true, threadColor: result });
    } else if (type === "linkAmann") {
      const threadColorId = formData.get("threadColorId");
      const amannNumber = formData.get("amannNumber");
      if (!threadColorId || !amannNumber) {
        return json({ success: false, error: "Missing required fields for linking Amann number." }, { status: 400 });
      }
      const result = await linkAmannNumberToStitchingThreadColor(threadColorId, amannNumber);
      return json({ success: true, threadColor: result });
    } else {
      return json({ success: false, error: "Invalid thread color operation type." }, { status: 400 });
    }
  } catch (error) {
    console.error('[AddThreadColors] Error in action:', error);
    return json({ success: false, error: error.message }, { status: 500 });
  }
};

// Utility: Title Case
const toTitleCase = (str) => {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

export default function AddThreadColors() {
  const {
    colorTags,
    unlinkedIsacordNumbers,
    stitchingThreadColors,
    embroideryThreadColors,
  } = useLoaderData();
  const fetcher = useFetcher();

  // Embroidery form state
  const [embMode, setEmbMode] = useState("add"); // "add" or "update"
  const [embSelectedThreadId, setEmbSelectedThreadId] = useState("");
  const [embName, setEmbName] = useState("");
  const [embIsacord, setEmbIsacord] = useState("");
  const [embIsacordInput, setEmbIsacordInput] = useState("");
  const [embLinkedIsacordNumbers, setEmbLinkedIsacordNumbers] = useState([]); // For update mode
  const [originalLinkedIsacordNumbers, setOriginalLinkedIsacordNumbers] = useState([]); // Track original linked numbers
  const [embColorTags, setEmbColorTags] = useState([]);
  const [embLinkedColorTags, setEmbLinkedColorTags] = useState([]); // For update mode
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

  // Add state for intent
  const [stitchIntent, setStitchIntent] = useState(null);

  // Utility: get all embroidery thread names for dropdown
  const embroideryThreadOptions = useMemo(() =>
    (embroideryThreadColors || []).map(tc => ({ label: tc.label, value: tc.value })),
    [embroideryThreadColors]
  );

  // Utility: get all isacord numbers (linked and unlinked)
  const allIsacordOptions = useMemo(() => {
    // Linked: flatten all isacordNumbers from all threads
    const linked = (embroideryThreadColors || []).flatMap(tc =>
      (tc.isacordNumbers || []).map(num => ({ ...num, threadId: tc.value, threadName: tc.label }))
    );
    // Unlinked: from unlinkedIsacordNumbers
    const unlinked = (unlinkedIsacordNumbers || []).map(num => ({ ...num, threadId: null }));
    return [...linked, ...unlinked];
  }, [embroideryThreadColors, unlinkedIsacordNumbers]);

  // Utility: get all color tags
  const allColorTagOptions = useMemo(() => colorTags, [colorTags]);

  // When switching to update mode and selecting a thread, populate linked numbers/tags
  useEffect(() => {
    if (embMode === "update" && embSelectedThreadId) {
      const thread = (embroideryThreadColors || []).find(tc => tc.value === embSelectedThreadId);
      setEmbName(thread?.label || "");
      const originalIds = (thread?.isacordNumbers || []).map(num => num.value);
      setOriginalLinkedIsacordNumbers(originalIds);
      setEmbLinkedIsacordNumbers(originalIds);
      setEmbLinkedColorTags((thread?.colorTags || []).map(tag => tag.value));
    } else if (embMode === "add") {
      setEmbName("");
      setOriginalLinkedIsacordNumbers([]);
      setEmbLinkedIsacordNumbers([]);
      setEmbLinkedColorTags([]);
    }
  }, [embMode, embSelectedThreadId, embroideryThreadColors]);

  // Filtered options for embroidery color tags (for add mode)
  const filteredEmbColorTagOptions = useMemo(() => {
    const search = embColorTagInput.toLowerCase();
    return colorTags.filter(tag =>
      tag.label.toLowerCase().includes(search) && !embColorTags.includes(tag.value)
    ).map(tag => ({
      label: tag.label,
      value: tag.value
    }));
  }, [colorTags, embColorTagInput, embColorTags]);

  // Filtered options for embroidery color tags (for update mode)
  const filteredEmbUpdateColorTagOptions = useMemo(() => {
    const search = embColorTagInput.toLowerCase();
    return colorTags.filter(tag =>
      tag.label.toLowerCase().includes(search) && !embLinkedColorTags.includes(tag.value)
    ).map(tag => ({
      label: tag.label,
      value: tag.value
    }));
  }, [colorTags, embColorTagInput, embLinkedColorTags]);

  // Filtered options for Isacord numbers (for add mode)
  const filteredIsacordOptions = useMemo(() => {
    const search = embIsacordInput.toLowerCase();
    return unlinkedIsacordNumbers.filter(num =>
      num.label.toLowerCase().includes(search)
    );
  }, [unlinkedIsacordNumbers, embIsacordInput]);

  // Filtered options for Isacord numbers (for update mode)
  const filteredUpdateIsacordOptions = useMemo(() => {
    const search = embIsacordInput.toLowerCase();
    return allIsacordOptions.filter(num =>
      num.label.toLowerCase().includes(search) && !embLinkedIsacordNumbers.includes(num.value)
    );
  }, [allIsacordOptions, embIsacordInput, embLinkedIsacordNumbers]);

  // Handlers for embroidery color tags (add mode)
  const handleEmbColorTagSelect = (value) => {
    if (!embColorTags.includes(value)) {
      setEmbColorTags(prev => [...prev, value]);
    }
    setEmbColorTagInput("");
  };
  const handleRemoveEmbColorTag = (tagValue) => {
    setEmbColorTags(prev => prev.filter(v => v !== tagValue));
  };

  // Handlers for embroidery color tags (update mode)
  const [deletedColorTags, setDeletedColorTags] = useState([]); // Track deleted color tags
  const handleEmbUpdateColorTagSelect = (value) => {
    if (!embLinkedColorTags.includes(value)) {
      setEmbLinkedColorTags(prev => [...prev, value]);
    }
    setEmbColorTagInput("");
  };
  const handleRemoveEmbUpdateColorTag = (tagValue) => {
    if (deletedColorTags.includes(tagValue)) {
      // Undo delete for original color tags
      setDeletedColorTags(prev => prev.filter(v => v !== tagValue));
    } else if ((embroideryThreadColors.find(tc => tc.value === embSelectedThreadId)?.colorTags || []).some(tag => tag.value === tagValue)) {
      // Mark as deleted if it was originally linked
      setDeletedColorTags(prev => [...prev, tagValue]);
    } else {
      // Remove new additions immediately
      setEmbLinkedColorTags(prev => prev.filter(v => v !== tagValue));
    }
  };

  // Handlers for Isacord numbers (add mode)
  const handleIsacordSelect = (value) => {
    setEmbIsacord(value);
    setEmbIsacordInput("");
  };

  // Handlers for Isacord numbers (update mode)
  const handleUpdateIsacordSelect = (value) => {
    if (!embLinkedIsacordNumbers.includes(value)) {
      setEmbLinkedIsacordNumbers(prev => [...prev, value]);
    }
    setEmbIsacordInput("");
  };
  const [deletedIsacordNumbers, setDeletedIsacordNumbers] = useState([]); // Track deleted numbers
  const handleRemoveUpdateIsacord = (id) => {
    if (deletedIsacordNumbers.includes(id)) {
      // Undo delete for original numbers
      setDeletedIsacordNumbers(prev => prev.filter(v => v !== id));
    } else if (originalLinkedIsacordNumbers.includes(id)) {
      // Mark as deleted
      setDeletedIsacordNumbers(prev => [...prev, id]);
    } else {
      // Remove new additions immediately
      setEmbLinkedIsacordNumbers(prev => prev.filter(v => v !== id));
    }
  };

  // Handler for embroidery name field (add mode)
  const handleEmbNameChange = (value) => {
    const formatted = toTitleCase(value);
    setEmbName(formatted);
  };

  // Handler for embroidery thread selection (update mode)
  const handleEmbThreadSelect = (value) => {
    setEmbSelectedThreadId(value);
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
    // Validation: require name and Isacord number
    if (!name) {
      setEmbError("Please enter a thread color name.");
      return;
    }
    if (!embIsacord) {
      setEmbError("Please select an Isacord number.");
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
    // Prepare form data
    const formData = new FormData();
    formData.append('type', 'embroidery');
    formData.append('name', embFormattedName);
    formData.append('abbreviation', embGeneratedAbbr);
    if (embIsacord) formData.append('isacordNumber', embIsacord);
    embColorTags.forEach(tagId => formData.append('colorTagIds', tagId));
    console.log('[AddThreadColors] Submitting embroidery formData:', Array.from(formData.entries()));
    fetcher.submit(formData, { method: 'post' });
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
    const amannTrimmed = (stitchAmann || "").trim();
    if (!name) {
      setStitchError("Please enter a thread color name.");
      return;
    }
    if (!amannTrimmed) {
      setStitchError("Please enter an Amann number.");
      return;
    }
    // Find if Amann number exists and which name it is linked to
    let amannExists = false;
    let amannLinkedName = null;
    (stitchingThreadColors || []).forEach(tc => {
      (tc.amannNumbers || []).forEach(num => {
        if ((num.label || "").trim().toLowerCase() === amannTrimmed.toLowerCase()) {
          amannExists = true;
          amannLinkedName = tc.label;
        }
      });
    });
    // Find if name exists and get its abbreviation
    const existingThread = (stitchingThreadColors || []).find(tc => tc.label && tc.label.toLowerCase() === name.toLowerCase());
    const nameExists = !!existingThread;
    if (amannExists) {
      if (amannLinkedName && amannLinkedName.toLowerCase() === name.toLowerCase()) {
        setStitchError("This Amann number is already linked to this thread color.");
        return;
      } else {
        setStitchError(`This Amann number is already linked to a different thread color: ${amannLinkedName}`);
        return;
      }
    }
    let abbr;
    if (nameExists) {
      abbr = existingThread.abbreviation;
    } else {
      // Both are new: create both
      const existingAbbrs = (stitchingThreadColors || []).map(tc => tc.abbreviation);
      abbr = generateStitchAbbreviation(name, existingAbbrs);
    }
    if (nameExists) {
      setStitchIntent({ action: 'linkAmann', name });
    } else {
      setStitchIntent({ action: 'createBoth', name });
    }
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
    setStitchIntent(null);
  };
  const handleStitchModalClose = () => {
    setStitchModalOpen(false);
  };

  // Restore stitching color tag logic
  const filteredStitchColorTagOptions = useMemo(() => {
    const search = stitchColorTagInput.toLowerCase();
    return colorTags.filter(tag =>
      tag.label.toLowerCase().includes(search) && !stitchColorTags.includes(tag.value)
    ).map(tag => ({
      label: tag.label,
      value: tag.value
    }));
  }, [colorTags, stitchColorTagInput, stitchColorTags]);

  const handleStitchColorTagSelect = (value) => {
    if (!stitchColorTags.includes(value)) {
      setStitchColorTags(prev => [...prev, value]);
    }
    setStitchColorTagInput("");
  };
  const handleRemoveStitchColorTag = (tagValue) => {
    setStitchColorTags(prev => prev.filter(v => v !== tagValue));
  };

  // Show backend errors as a banner
  useEffect(() => {
    if (fetcher.data && fetcher.data.error) {
      setEmbError(fetcher.data.error);
    }
  }, [fetcher.data]);

  useEffect(() => {
    // Clear all embroidery form state when embMode changes
    setEmbSelectedThreadId("");
    setEmbName("");
    setEmbIsacord("");
    setEmbIsacordInput("");
    setEmbLinkedIsacordNumbers([]);
    setOriginalLinkedIsacordNumbers([]);
    setEmbColorTags([]);
    setEmbLinkedColorTags([]);
    setEmbColorTagInput("");
    setEmbModalOpen(false);
    setEmbError("");
    setEmbGeneratedAbbr("");
    setEmbFormattedName("");
    setDeletedIsacordNumbers([]);
    setDeletedColorTags([]);
  }, [embMode]);

  return (
    <Page>
      <TitleBar title="Add Thread Colors" />
      <Layout>
        <Layout.Section variant="oneHalf">
          <Card>
            <BlockStack gap="400">
              <Text variant="headingMd">Add Embroidery Thread Color</Text>
              {/* Radio buttons for mode selection */}
              <InlineStack gap="400">
                <label>
                  <input
                    type="radio"
                    name="embMode"
                    value="update"
                    checked={embMode === "update"}
                    onChange={() => setEmbMode("update")}
                  />
                  Update Linked Colors
                </label>
                <label>
                  <input
                    type="radio"
                    name="embMode"
                    value="add"
                    checked={embMode === "add"}
                    onChange={() => setEmbMode("add")}
                  />
                  Add New Name
                </label>
              </InlineStack>
              <Divider borderColor="border" />

              {/* Embroidery form fields based on mode */}
              {embMode === "update" ? (
                <BlockStack gap="400">
                  {/* Dropdown for existing thread names */}
                  <Combobox
                    activator={
                      <Combobox.TextField
                        label="Select Thread Name"
                        value={embroideryThreadOptions.find(opt => opt.value === embSelectedThreadId)?.label || ""}
                        onChange={() => {}}
                        placeholder="Choose a thread color name"
                        autoComplete="off"
                        readOnly
                      />
                    }
                  >
                    <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
                      <Listbox onSelect={handleEmbThreadSelect}>
                        {embroideryThreadOptions.map(option => (
                          <Listbox.Option key={option.value} value={option.value}>
                            {option.label}
                          </Listbox.Option>
                        ))}
                      </Listbox>
                    </div>
                  </Combobox>
                  <Divider borderColor="border" />
                  {/* Add Isacord Number combobox (move this above the tags) */}
                  <Combobox
                    activator={
                      <Combobox.TextField
                        prefix={<Icon source={SearchIcon} />}
                        onChange={setEmbIsacordInput}
                        label="Add Isacord Number"
                        value={embIsacordInput}
                        placeholder="Search or select Isacord Number"
                        autoComplete="off"
                      />
                    }
                  >
                    {filteredUpdateIsacordOptions.length > 0 && (
                      <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
                        <Listbox onSelect={handleUpdateIsacordSelect}>
                          {filteredUpdateIsacordOptions.map(option => (
                            <Listbox.Option key={option.value} value={option.value}>
                              {option.label}
                            </Listbox.Option>
                          ))}
                        </Listbox>
                      </div>
                    )}
                  </Combobox>
                  {/* Linked Isacord Numbers tags */}
                  <Text variant="bodyMd">Linked Isacord Numbers:</Text>
                  <InlineStack gap="200" wrap>
                    {embLinkedIsacordNumbers.map(id => {
                      const numObj = allIsacordOptions.find(num => num.value === id);
                      const isOriginal = originalLinkedIsacordNumbers.includes(id);
                      const isDeleted = deletedIsacordNumbers.includes(id);
                      return numObj ? (
                        <Tag
                          key={id}
                          onRemove={() => handleRemoveUpdateIsacord(id)}
                        >
                          <InlineStack gap="100" align="center">
                            <Icon
                              source={isDeleted ? DeleteIcon : isOriginal ? CheckCircleIcon : PlusCircleIcon}
                            />
                            <span style={isDeleted ? { textDecoration: 'line-through', opacity: 0.6 } : {}}>
                              {numObj.label}
                            </span>
                          </InlineStack>
                        </Tag>
                      ) : null;
                    })}
                  </InlineStack>
                  <Divider borderColor="border" />
                  {/* Move Add Color Tag combobox above the tags and label */}
                  <Combobox
                    activator={
                      <Combobox.TextField
                        prefix={<Icon source={SearchIcon} />}
                        onChange={setEmbColorTagInput}
                        label="Add Color Tag"
                        value={embColorTagInput}
                        placeholder="Search or select color tags"
                        autoComplete="off"
                      />
                    }
                  >
                    {filteredEmbUpdateColorTagOptions.length > 0 && (
                      <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
                        <Listbox onSelect={handleEmbUpdateColorTagSelect}>
                          {filteredEmbUpdateColorTagOptions.map(option => (
                            <Listbox.Option key={option.value} value={option.value}>
                              {option.label}
                            </Listbox.Option>
                          ))}
                        </Listbox>
                      </div>
                    )}
                  </Combobox>
                  <Text variant="bodyMd">Linked Color Tags:</Text>
                  <InlineStack gap="200" wrap>
                    {embLinkedColorTags.map(tagValue => {
                      const tagObj = colorTags.find(t => t.value === tagValue);
                      const originalColorTags = (embroideryThreadColors.find(tc => tc.value === embSelectedThreadId)?.colorTags || []).map(tag => tag.value);
                      const isOriginal = originalColorTags.includes(tagValue);
                      const isDeleted = deletedColorTags.includes(tagValue);
                      return tagObj ? (
                        <Tag key={tagValue} onRemove={() => handleRemoveEmbUpdateColorTag(tagValue)}>
                          <InlineStack gap="100" align="center">
                            <Icon
                              source={isDeleted ? DeleteIcon : isOriginal ? CheckCircleIcon : PlusCircleIcon}
                              color={isDeleted ? 'critical' : undefined}
                            />
                            <span style={isDeleted ? { textDecoration: 'line-through', opacity: 0.6 } : {}}>
                              {tagObj.label}
                            </span>
                          </InlineStack>
                        </Tag>
                      ) : null;
                    })}
                  </InlineStack>
                  {/* Save button (update mode) */}
                  <Button primary onClick={() => {/* TODO: handle update submit */}}>Update Embroidery Thread Color</Button>
                </BlockStack>
              ) : (
                <BlockStack gap="400">
                  {/* Name input (add mode) */}
                  <TextField
                    label="Name"
                    value={embName}
                    onChange={handleEmbNameChange}
                    autoComplete="off"
                    error={embError}
                  />
                  {/* Isacord number dropdown (add mode) */}
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
                      <Tag onRemove={() => setEmbIsacord("")}>{unlinkedIsacordNumbers.find(num => num.value === embIsacord)?.label || embIsacord}</Tag>
                    </InlineStack>
                  )}
                  {/* Color tags (add mode) */}
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
                  {/* Save button (add mode) */}
                  <Button primary onClick={handleEmbSave}>Save Embroidery Thread Color</Button>
                </BlockStack>
              )}
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
                onChange={setStitchName}
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
            <Text><b>Isacord Number:</b> {unlinkedIsacordNumbers.find(num => num.value === embIsacord)?.label || embIsacord || "None"}</Text>
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