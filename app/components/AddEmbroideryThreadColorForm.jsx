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
  RadioButton,
} from "@shopify/polaris";
import { SearchIcon, CheckCircleIcon, PlusCircleIcon, DeleteIcon } from '@shopify/polaris-icons';
import { formatNameLive, formatNameOnBlur, validateNameUnique, generateEmbAbbreviation } from "../lib/utils/colorNameUtils";
import ThreadCreateUpdateModal from "./ThreadCreateUpdateModal";
import ThreadReassignNumberModal from "./ThreadReassignNumberModal";

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
  const [updateError, setUpdateError] = useState("");
  // Add state to track if a name collision occurred and the matching thread id
  const [nameCollisionThreadId, setNameCollisionThreadId] = useState(null);
  // Add state for thread name search input in update mode
  const [threadNameSearchInput, setThreadNameSearchInput] = useState("");
  // Add state for Isacord reassignment modal
  const [isacordReassignModal, setIsacordReassignModal] = useState({ open: false, num: null, linkedThread: null });

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
    const unlinked = (unlinkedIsacordNumbers || []).map(num => ({ ...num, threadId: null, threadName: null }));
    // Merge and deduplicate by value
    const all = [...linked, ...unlinked];
    const seen = new Set();
    return all.filter(num => {
      if (seen.has(num.value)) return false;
      seen.add(num.value);
      return true;
    });
  }, [embroideryThreadColors, unlinkedIsacordNumbers]);

  // Effect 1: Reset state only when switching to 'add' mode
  useEffect(() => {
    if (embMode === "add") {
      setThreadNameSearchInput("");
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
      setUpdateModalOpen(false);
      setUpdateError("");
      setNameCollisionThreadId(null);
      setIsacordReassignModal({ open: false, num: null, linkedThread: null });
    }
  }, [embMode]);

  // Effect 2: Populate state when switching to 'update' mode and embSelectedThreadId changes
  useEffect(() => {
    if (embMode === "update" && embSelectedThreadId) {
      const thread = (embroideryThreadColors || []).find(tc => tc.value === embSelectedThreadId);
      setThreadNameSearchInput(thread?.label || "");
      setEmbName(thread?.label || "");
      const originalIds = (thread?.isacordNumbers || []).map(num => num.value);
      setOriginalLinkedIsacordNumbers(originalIds);
      setEmbLinkedIsacordNumbers(originalIds);
      setEmbLinkedColorTags((thread?.colorTags || []).map(tag => tag.value));
      setDeletedIsacordNumbers([]);
      setDeletedColorTags([]);
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
    return allIsacordOptions.filter(num =>
      num.label.toLowerCase().includes(search)
    ).map(num => ({
      ...num,
      label: num.threadId && num.threadName ? `${num.label} (linked to ${num.threadName})` : num.label
    }));
  }, [allIsacordOptions, embIsacordInput]);

  // Filtered options for Isacord numbers (for update mode)
  const filteredUpdateIsacordOptions = useMemo(() => {
    const search = embIsacordInput.toLowerCase();
    return allIsacordOptions.filter(num =>
      num.label.toLowerCase().includes(search)
    ).map(num => ({
      ...num,
      label: num.threadId && num.threadName ? `${num.label} (linked to ${num.threadName})` : num.label
    }));
  }, [allIsacordOptions, embIsacordInput]);

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
    const numObj = allIsacordOptions.find(num => num.value === value);
    if (numObj && numObj.threadId && !embIsacord.includes(value)) {
      // Already linked to another thread, show modal
      setIsacordReassignModal({ open: true, num: numObj, linkedThread: numObj.threadName });
      return;
    }
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
    const numObj = allIsacordOptions.find(num => num.value === value);
    if (numObj && numObj.threadId && numObj.threadId !== embSelectedThreadId && !embLinkedIsacordNumbers.includes(value)) {
      // Already linked to another thread, show modal
      setIsacordReassignModal({ open: true, num: numObj, linkedThread: numObj.threadName });
      return;
    }
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
  const handleNameChange = (value) => {
    const formatted = formatNameLive(value);
    setEmbName(formatted);
    if (!formatted) {
      setEmbError("");
      setNameCollisionThreadId(null);
      return;
    }
    const isUnique = validateNameUnique(embroideryThreadColors || [], formatted, 'label');
    if (!isUnique) {
      const existing = (embroideryThreadColors || []).find(tc => formatNameOnBlur(tc.label) === formatNameOnBlur(formatted));
      setEmbError("A thread color with this name already exists.");
      setNameCollisionThreadId(existing?.value);
    } else {
      setEmbError("");
      setNameCollisionThreadId(null);
    }
  };

  // Handler for blur event (add mode)
  const handleNameBlur = () => {
    const formatted = formatNameOnBlur(embName);
    if (formatted !== embName) {
      setEmbName(formatted);
    }
    if (!formatted) {
      setEmbError("");
      setNameCollisionThreadId(null);
      return;
    }
    const isUnique = validateNameUnique(embroideryThreadColors || [], formatted, 'label');
    if (!isUnique) {
      const existing = (embroideryThreadColors || []).find(tc => formatNameOnBlur(tc.label) === formatNameOnBlur(formatted));
      setEmbError("A thread color with this name already exists.");
      setNameCollisionThreadId(existing?.value);
    } else {
      setEmbError("");
      setNameCollisionThreadId(null);
    }
  };

  // Handler for Save Embroidery Thread Color
  const handleEmbSave = () => {
    const name = formatNameOnBlur(embName);
    setEmbFormattedName(name);
    if (!name) {
      setEmbError("Please enter a thread color name.");
      setNameCollisionThreadId(null);
      return;
    }
    if (!embIsacord.length) {
      setEmbError("Please select at least one Isacord number.");
      setNameCollisionThreadId(null);
      return;
    }
    // Validation: name must not already exist (case-insensitive)
    const isUnique = validateNameUnique(embroideryThreadColors || [], name, 'label');
    if (!isUnique) {
      const existing = (embroideryThreadColors || []).find(tc => formatNameOnBlur(tc.label) === name);
      setEmbError("A thread color with this name already exists.");
      setNameCollisionThreadId(existing?.value);
      return;
    }
    setNameCollisionThreadId(null);
    // Generate abbreviation (with E suffix)
    const existingAbbrs = (embroideryThreadColors || []).map(tc => tc.abbreviation);
    const abbr = generateEmbAbbreviation(name, existingAbbrs);
    setEmbGeneratedAbbr(abbr);
    setEmbModalOpen(true);
    setEmbError("");
  };

  // Handler for confirming in modal
  const handleEmbConfirm = () => {
    // Prepare form data
    const formData = new FormData();
    formData.append('type', 'embroidery');
    formData.append('name', embFormattedName);
    formData.append('abbreviation', embGeneratedAbbr);
    embIsacord.forEach(id => formData.append('isacordNumbers', id));
    embColorTags.forEach(tagId => formData.append('colorTagIds', tagId));

    // Add reassignment info for isacord numbers that are linked to another thread
    embIsacord.forEach(id => {
      const numObj = allIsacordOptions.find(num => num.value === id);
      if (numObj && numObj.threadId) {
        // Only add if linked to a different thread
        formData.append('reassignIsacordNumbers[]', JSON.stringify({ isacordId: id, fromThreadId: numObj.threadId }));
      }
    });

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

  // Add handler for switching to update mode from name collision
  const handleSwitchToUpdateFromName = () => {
    if (nameCollisionThreadId) {
      setEmbMode("update");
      setEmbSelectedThreadId(nameCollisionThreadId);
      setEmbName(embName); // Preserve the user's typed name
      setEmbError("");
      setNameCollisionThreadId(null);
    }
  };

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

    // Add reassignment info for isacord numbers that are linked to another thread
    addIsacordIds.forEach(id => {
      const numObj = allIsacordOptions.find(num => num.value === id);
      if (numObj && numObj.threadId && numObj.threadId !== embSelectedThreadId) {
        // Only add if linked to a different thread
        formData.append('reassignIsacordNumbers[]', JSON.stringify({ isacordId: id, fromThreadId: numObj.threadId }));
      }
    });

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
    }
  }, [fetcher.data]);

  // Handler for confirming Isacord reassignment
  const handleConfirmIsacordReassign = () => {
    const value = isacordReassignModal.num.value;
    if (embMode === "add") {
      if (!embIsacord.includes(value)) {
        setEmbIsacord(prev => [...prev, value]);
      }
    } else if (embMode === "update") {
      if (!embLinkedIsacordNumbers.includes(value)) {
        setEmbLinkedIsacordNumbers(prev => [...prev, value]);
      }
    }
    setIsacordReassignModal({ open: false, num: null, linkedThread: null });
    setEmbIsacordInput("");
  };
  const handleCancelIsacordReassign = () => {
    setIsacordReassignModal({ open: false, num: null, linkedThread: null });
    setEmbIsacordInput("");
  };

  return (
    <Card>
      <BlockStack gap="400">
        <Text variant="headingMd">Add Embroidery Thread Color</Text>
        {/* Radio buttons for mode selection */}
        <InlineStack gap="400" wrap={false}>
          <RadioButton
            label="Update Linked Colors"
            checked={embMode === "update"}
            id="embMode-update"
            name="embMode"
            onChange={() => setEmbMode("update")}
          />
          <RadioButton
            label="Add New Name"
            checked={embMode === "add"}
            id="embMode-add"
            name="embMode"
            onChange={() => setEmbMode("add")}
          />
        </InlineStack>
        <Divider borderColor="border" />

        {/* Embroidery form fields based on mode */}
        {embMode === "update" ? (
          <BlockStack gap="400">
            {/* Dropdown for existing thread names (interactive, searchable) */}
            <Combobox
              activator={
                <Combobox.TextField
                  label="Select Thread Name"
                  value={threadNameSearchInput}
                  onChange={setThreadNameSearchInput}
                  placeholder="Choose a thread color name"
                  autoComplete="off"
                />
              }
            >
              <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
                <Listbox onSelect={value => {
                  setEmbSelectedThreadId(value);
                  const selected = embroideryThreadOptions.find(opt => opt.value === value);
                  setThreadNameSearchInput(selected ? selected.label : "");
                }}>
                  {embroideryThreadOptions.filter(opt =>
                    opt.label.toLowerCase().includes(threadNameSearchInput.toLowerCase())
                  ).map(option => (
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
          </BlockStack>
        ) : (
          <BlockStack gap="400">
            {/* Name input (add mode) */}
            <TextField
              label="Name"
              value={embName}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              autoComplete="off"
              error={embError}
            />
            {nameCollisionThreadId && (
              <div style={{ marginTop: 8 }}>
                <Button onClick={handleSwitchToUpdateFromName} size="slim">
                  This name already exists. Edit this color instead?
                </Button>
              </div>
            )}
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
              {embIsacord.map(id => {
                const numObj = allIsacordOptions.find(num => num.value === id);
                return (
                  <Tag key={id} onRemove={() => handleRemoveIsacord(id)}>
                    {numObj ? numObj.label : id}
                  </Tag>
                );
              })}
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
      <ThreadCreateUpdateModal
        open={embModalOpen}
        onClose={handleEmbModalClose}
        title="Confirm New Embroidery Thread Color"
        primaryAction={{ content: "Confirm", onAction: handleEmbConfirm }}
        secondaryActions={[
          { content: "Cancel", onAction: handleEmbModalClose },
        ]}
      >
        <Text><b>Name:</b> {embFormattedName}</Text>
        <Text><b>Abbreviation:</b> {embGeneratedAbbr}</Text>
        <Text><b>Isacord Numbers:</b> {embIsacord.map(id => {
          const numObj = allIsacordOptions.find(num => num.value === id);
          return numObj ? numObj.label : id;
        }).join(", ") || "None"}</Text>
        <Text><b>Tags:</b> {embColorTags.map(tagValue => {
          const tagObj = colorTags.find(t => t.value === tagValue);
          return tagObj ? tagObj.label : tagValue;
        }).join(", ") || "None"}</Text>
      </ThreadCreateUpdateModal>
      {/* Update Confirmation Modal */}
      <ThreadCreateUpdateModal
        open={updateModalOpen}
        onClose={handleUpdateModalClose}
        title="Confirm Update to Embroidery Thread Color"
        primaryAction={{ content: "Confirm Update", onAction: handleUpdateConfirm }}
        secondaryActions={[
          { content: "Cancel", onAction: handleUpdateModalClose },
        ]}
      >
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
      </ThreadCreateUpdateModal>
      {/* Isacord reassignment modal */}
      <ThreadReassignNumberModal
        open={isacordReassignModal.open}
        onClose={handleCancelIsacordReassign}
        numberLabel={isacordReassignModal.num?.label}
        currentThread={isacordReassignModal.linkedThread}
        onConfirm={handleConfirmIsacordReassign}
      />
    </Card>
  );
} 