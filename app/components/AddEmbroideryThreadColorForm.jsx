import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  TextField,
  Button,
  BlockStack,
  InlineStack,
  Divider,
  Combobox,
  Listbox,
  Tag,
  Icon,
  Text,
  Modal,
} from "@shopify/polaris";
import { SearchIcon, CheckCircleIcon, PlusCircleIcon, DeleteIcon } from '@shopify/polaris-icons';
import { toTitleCase, generateEmbAbbreviation } from "../lib/utils/threadColorUtils";

export default function AddEmbroideryThreadColorForm({ colorTags, unlinkedIsacordNumbers, embroideryThreadColors, fetcher }) {
  // Embroidery form state
  const [embMode, setEmbMode] = useState("add"); // "add" or "update"
  const [embSelectedThreadId, setEmbSelectedThreadId] = useState("");
  const [embName, setEmbName] = useState("");
  const [embIsacord, setEmbIsacord] = useState([]);
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
  // Add state for update confirmation modal
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState("");

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
    // Only show Isacord numbers that are either:
    // 1. Unlinked (threadId === null)
    // 2. Already linked to the selected thread
    return allIsacordOptions.filter(num =>
      num.label.toLowerCase().includes(search) &&
      (
        num.threadId === null ||
        num.threadId === embSelectedThreadId
      ) &&
      !embLinkedIsacordNumbers.includes(num.value)
    );
  }, [allIsacordOptions, embIsacordInput, embLinkedIsacordNumbers, embSelectedThreadId]);

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
    if (!embIsacord.includes(value)) {
      setEmbIsacord(prev => [...prev, value]);
    }
    setEmbIsacordInput("");
  };
  const handleRemoveIsacord = (id) => {
    setEmbIsacord(prev => prev.filter(v => v !== id));
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

  // Handler for Save Embroidery Thread Color
  const handleEmbSave = () => {
    const name = toTitleCase(embName.trim());
    setEmbFormattedName(name);
    // Validation: require name and Isacord number
    if (!name) {
      setEmbError("Please enter a thread color name.");
      return;
    }
    if (!embIsacord.length) {
      setEmbError("Please select at least one Isacord number.");
      return;
    }
    // Validation: name must not already exist (case-insensitive)
    const nameExists = (embroideryThreadColors || []).some(tc => tc.label.trim().toLowerCase() === name.toLowerCase());
    if (nameExists) {
      setEmbError("A thread color with this name already exists.");
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
    embIsacord.forEach(id => formData.append('isacordNumbers', id));
    embColorTags.forEach(tagId => formData.append('colorTagIds', tagId));
    fetcher.submit(formData, { method: 'post' });
    setEmbModalOpen(false);
    setEmbName("");
    setEmbIsacord([]);
    setEmbColorTags([]);
    setEmbGeneratedAbbr("");
    setEmbFormattedName("");
    setEmbError("");
  };
  const handleEmbModalClose = () => {
    setEmbModalOpen(false);
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
    setEmbIsacord([]);
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

  // Compute changes for update
  const originalThread = (embroideryThreadColors || []).find(tc => tc.value === embSelectedThreadId);
  const originalIsacordIds = (originalThread?.isacordNumbers || []).map(num => num.value) || [];
  const originalColorTagIds = (originalThread?.colorTags || []).map(tag => tag.value) || [];
  const addIsacordIds = embLinkedIsacordNumbers.filter(id => !originalIsacordIds.includes(id));
  const removeIsacordIds = deletedIsacordNumbers;
  const addColorTagIds = embLinkedColorTags.filter(id => !originalColorTagIds.includes(id));
  const removeColorTagIds = deletedColorTags;
  const hasUpdateChanges = addIsacordIds.length > 0 || removeIsacordIds.length > 0 || addColorTagIds.length > 0 || removeColorTagIds.length > 0;

  // Handler for Update button (open modal)
  const handleUpdateClick = () => {
    setUpdateModalOpen(true);
    setUpdateError("");
  };

  // Handler for confirming update in modal
  const handleUpdateConfirm = () => {
    if (!embSelectedThreadId) {
      setUpdateError("No thread selected.");
      return;
    }
    const formData = new FormData();
    formData.append("type", "updateEmbroidery");
    formData.append("threadId", embSelectedThreadId);
    addIsacordIds.forEach(id => formData.append("addIsacordIds", id));
    removeIsacordIds.forEach(id => formData.append("removeIsacordIds", id));
    addColorTagIds.forEach(id => formData.append("addColorTagIds", id));
    removeColorTagIds.forEach(id => formData.append("removeColorTagIds", id));
    fetcher.submit(formData, { method: "post" });
    setUpdateModalOpen(false);
  };
  const handleUpdateModalClose = () => {
    setUpdateModalOpen(false);
  };

  // Show backend errors as a banner (for update)
  useEffect(() => {
    if (fetcher.data && fetcher.data.error) {
      setUpdateError(fetcher.data.error);
    } else if (fetcher.data && fetcher.data.success) {
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 2000);
      setUpdateError("");
      setDeletedIsacordNumbers([]);
      setDeletedColorTags([]);
    }
  }, [fetcher.data]);

  // Add this handler above the return
  const handleEmbNameBlur = () => {
    const trimmed = embName.trim();
    const formatted = toTitleCase(trimmed);
    if (formatted !== embName) {
      setEmbName(formatted);
    }
    // Re-run uniqueness check for trimmed, title-cased value
    if (!formatted) {
      setEmbError("");
      return;
    }
    const nameExists = (embroideryThreadColors || []).some(tc => tc.label.trim().toLowerCase() === formatted.toLowerCase());
    if (nameExists) {
      setEmbError("A thread color with this name already exists.");
    } else {
      setEmbError("");
    }
  };

  return (
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
            <Button
              primary
              onClick={handleUpdateClick}
              disabled={!hasUpdateChanges}
            >
              Update Embroidery Thread Color
            </Button>
            {updateError && <Text color="critical">{updateError}</Text>}
            {/* {updateSuccess && <Text color="success">Update successful!</Text>} */}
          </BlockStack>
        ) : (
          <BlockStack gap="400">
            {/* Name input (add mode) */}
            <TextField
              label="Name"
              value={embName}
              onChange={handleEmbNameChange}
              onBlur={handleEmbNameBlur}
              autoComplete="off"
              error={embError}
            />
            {/* Isacord number dropdown (add mode) */}
            <Combobox
              activator={
                <Combobox.TextField
                  prefix={<Icon source={SearchIcon} />}
                  onChange={setEmbIsacordInput}
                  label="Isacord Numbers"
                  value={embIsacordInput}
                  placeholder="Search or select Isacord Numbers"
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
            <InlineStack gap="200" wrap>
              {embIsacord.map(id => (
                <Tag key={id} onRemove={() => handleRemoveIsacord(id)}>
                  {unlinkedIsacordNumbers.find(num => num.value === id)?.label || id}
                </Tag>
              ))}
            </InlineStack>
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
            <Text><b>Isacord Numbers:</b> {embIsacord.map(id => unlinkedIsacordNumbers.find(num => num.value === id)?.label || id).join(", ") || "None"}</Text>
            <Text><b>Tags:</b> {embColorTags.map(tagValue => {
              const tagObj = colorTags.find(t => t.value === tagValue);
              return tagObj ? tagObj.label : tagValue;
            }).join(", ") || "None"}</Text>
          </BlockStack>
        </Modal.Section>
      </Modal>
      {/* Update Confirmation Modal */}
      <Modal
        open={updateModalOpen}
        onClose={handleUpdateModalClose}
        title="Confirm Update to Embroidery Thread Color"
        primaryAction={{
          content: "Confirm Update",
          onAction: handleUpdateConfirm,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleUpdateModalClose,
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="200">
            <Text variant="bodyMd"><b>Thread Name:</b> {originalThread?.label}</Text>
            <Text variant="bodyMd"><b>Add Isacord Numbers:</b> {addIsacordIds.map(id => {
              const numObj = (originalThread?.allIsacordOptions || allIsacordOptions).find(num => num.value === id);
              return numObj ? numObj.label : id;
            }).join(", ") || "None"}</Text>
            <Text variant="bodyMd"><b>Remove Isacord Numbers:</b> {removeIsacordIds.map(id => {
              const numObj = (originalThread?.allIsacordOptions || allIsacordOptions).find(num => num.value === id);
              return numObj ? numObj.label : id;
            }).join(", ") || "None"}</Text>
            <Text variant="bodyMd"><b>Add Color Tags:</b> {addColorTagIds.map(id => {
              const tagObj = colorTags.find(t => t.value === id);
              return tagObj ? tagObj.label : id;
            }).join(", ") || "None"}</Text>
            <Text variant="bodyMd"><b>Remove Color Tags:</b> {removeColorTagIds.map(id => {
              const tagObj = colorTags.find(t => t.value === id);
              return tagObj ? tagObj.label : id;
            }).join(", ") || "None"}</Text>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Card>
  );
} 