import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  TextField,
  Button,
  BlockStack,
  InlineStack,
  Combobox,
  Listbox,
  Tag,
  Icon,
  Text,
  Divider,
  RadioButton,
} from "@shopify/polaris";
import { SearchIcon, CheckCircleIcon, PlusCircleIcon, DeleteIcon } from '@shopify/polaris-icons';
import { formatNameLive, formatNameOnBlur, validateNameUnique, generateStitchAbbreviation } from "../lib/utils/colorNameUtils";
import ThreadCreateUpdateModal from "./ThreadCreateUpdateModal";
import ThreadReassignNumberModal from "./ThreadReassignNumberModal";

export default function AddStitchingThreadColorForm({ colorTags, stitchingThreadColors, fetcher, unlinkedAmannNumbers }) {
  // Mode: "add" or "update"
  const [mode, setMode] = useState("add");
  // Add mode state
  const [stitchName, setStitchName] = useState("");
  const [stitchAmann, setStitchAmann] = useState([]);
  const [stitchAmannInput, setStitchAmannInput] = useState("");
  const [stitchColorTags, setStitchColorTags] = useState([]);
  const [stitchColorTagInput, setStitchColorTagInput] = useState("");
  const [stitchModalOpen, setStitchModalOpen] = useState(false);
  const [stitchNameError, setStitchNameError] = useState("");
  const [stitchGeneratedAbbr, setStitchGeneratedAbbr] = useState("");
  const [stitchFormattedName, setStitchFormattedName] = useState("");
  // Update mode state
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [linkedAmannNumbers, setLinkedAmannNumbers] = useState([]); // ids
  const [originalLinkedAmannNumbers, setOriginalLinkedAmannNumbers] = useState([]); // ids
  const [linkedColorTags, setLinkedColorTags] = useState([]); // ids
  const [colorTagInputUpdate, setColorTagInputUpdate] = useState("");
  const [deletedAmannNumbers, setDeletedAmannNumbers] = useState([]); // ids
  const [deletedColorTags, setDeletedColorTags] = useState([]); // ids
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateError, setUpdateError] = useState("");
  // Add state to track if a name collision occurred and the matching thread id
  const [nameCollisionThreadId, setNameCollisionThreadId] = useState(null);
  // Add state for thread name search input in update mode
  const [threadNameSearchInput, setThreadNameSearchInput] = useState("");
  // Add state for Amann reassignment modal
  const [amannReassignModal, setAmannReassignModal] = useState({ open: false, num: null, linkedThread: null });
  // Add state for Amann number search input in update mode
  const [stitchAmannInputUpdate, setStitchAmannInputUpdate] = useState("");
  // Utility: get all thread options
  const threadOptions = useMemo(() => (stitchingThreadColors || []).map(tc => ({ label: tc.label, value: tc.value })), [stitchingThreadColors]);
  // Utility: get all amann numbers (linked and unlinked)
  const allAmannOptions = useMemo(() => {
    // Linked: flatten all amannNumbers from all threads
    const linked = (stitchingThreadColors || []).flatMap(tc =>
      (tc.amannNumbers || []).map(num => ({ ...num, threadId: tc.value, threadName: tc.label }))
    );
    // Unlinked: from unlinkedAmannNumbers
    const unlinked = (unlinkedAmannNumbers || []).map(num => ({ ...num, threadId: null }));
    return [...linked, ...unlinked];
  }, [stitchingThreadColors, unlinkedAmannNumbers]);
  // Effect 1: Reset state only when switching to 'add' mode
  useEffect(() => {
    if (mode === "add") {
      setThreadNameSearchInput("");
      setStitchName("");
      setStitchAmann([]);
      setStitchColorTags([]);
      setSelectedThreadId("");
      setOriginalLinkedAmannNumbers([]);
      setLinkedAmannNumbers([]);
      setLinkedColorTags([]);
      setColorTagInputUpdate("");
      setDeletedAmannNumbers([]);
      setDeletedColorTags([]);
      setUpdateModalOpen(false);
      setUpdateError("");
      setStitchNameError("");
      setStitchGeneratedAbbr("");
      setStitchFormattedName("");
      setNameCollisionThreadId(null);
    }
  }, [mode]);
  // Effect 2: Populate state when switching to 'update' mode and selectedThreadId changes
  useEffect(() => {
    if (mode === "update" && selectedThreadId) {
      const thread = (stitchingThreadColors || []).find(tc => tc.value === selectedThreadId);
      setThreadNameSearchInput(thread?.label || "");
      setStitchName(thread?.label || "");
      const originalIds = (thread?.amannNumbers || []).map(num => num.value);
      setOriginalLinkedAmannNumbers(originalIds);
      setLinkedAmannNumbers(originalIds);
      setLinkedColorTags((thread?.colorTags || []).map(tag => tag.value));
    }
  }, [mode, selectedThreadId, stitchingThreadColors]);
  // Filtered color tag options (add mode)
  const filteredStitchColorTagOptions = useMemo(() => {
    const search = stitchColorTagInput.toLowerCase();
    return colorTags.filter(tag => tag.label.toLowerCase().includes(search) && !stitchColorTags.includes(tag.value)).map(tag => ({ label: tag.label, value: tag.value }));
  }, [colorTags, stitchColorTagInput, stitchColorTags]);
  // Filtered color tag options (update mode)
  const filteredUpdateColorTagOptions = useMemo(() => {
    const search = colorTagInputUpdate.toLowerCase();
    return colorTags.filter(tag => tag.label.toLowerCase().includes(search) && !linkedColorTags.includes(tag.value)).map(tag => ({ label: tag.label, value: tag.value }));
  }, [colorTags, colorTagInputUpdate, linkedColorTags]);
  // Filtered Amann options (add mode)
  const filteredAddAmannOptions = useMemo(() => {
    const search = stitchAmannInput.toLowerCase();
    // Show all Amann numbers, with label indicating if linked to another thread
    return allAmannOptions
      .filter(num => num.label.toLowerCase().includes(search) && !stitchAmann.includes(num.value))
      .map(num => ({
        ...num,
        label: num.threadId && num.threadName
          ? `${num.label} (linked to ${num.threadName})`
          : num.label
      }));
  }, [allAmannOptions, stitchAmannInput, stitchAmann]);
  // Filtered Amann options (update mode)
  const filteredUpdateAmannOptions = useMemo(() => {
    const search = stitchAmannInputUpdate.toLowerCase();
    // Show all Amann numbers, with label indicating if linked to another thread
    return allAmannOptions
      .filter(num => num.label.toLowerCase().includes(search) && !linkedAmannNumbers.includes(num.value))
      .map(num => ({
        ...num,
        label: num.threadId && num.threadId !== selectedThreadId && num.threadName
          ? `${num.label} (linked to ${num.threadName})`
          : num.label
      }));
  }, [allAmannOptions, stitchAmannInputUpdate, linkedAmannNumbers, selectedThreadId]);
  // Handlers for color tags (add mode)
  const handleStitchColorTagSelect = (value) => {
    if (!stitchColorTags.includes(value)) {
      setStitchColorTags(prev => [...prev, value]);
    }
    setStitchColorTagInput("");
  };
  const handleRemoveStitchColorTag = (tagValue) => {
    setStitchColorTags(prev => prev.filter(v => v !== tagValue));
  };
  // Handlers for color tags (update mode)
  const handleUpdateColorTagSelect = (value) => {
    if (!linkedColorTags.includes(value)) {
      setLinkedColorTags(prev => [...prev, value]);
    }
    setColorTagInputUpdate("");
  };
  const handleRemoveUpdateColorTag = (tagValue) => {
    if (deletedColorTags.includes(tagValue)) {
      setDeletedColorTags(prev => prev.filter(v => v !== tagValue));
    } else if ((stitchingThreadColors.find(tc => tc.value === selectedThreadId)?.colorTags || []).some(tag => tag.value === tagValue)) {
      setDeletedColorTags(prev => [...prev, tagValue]);
    } else {
      setLinkedColorTags(prev => prev.filter(v => v !== tagValue));
    }
  };
  // Handlers for amann numbers (update mode)
  const handleUpdateAmannSelect = (value) => {
    setStitchAmannInputUpdate("");
    const numObj = allAmannOptions.find(num => num.value === value);
    if (numObj && numObj.threadId && numObj.threadId !== selectedThreadId && !linkedAmannNumbers.includes(value)) {
      setAmannReassignModal({ open: true, num: numObj, linkedThread: numObj.threadName });
      return;
    }
    if (!linkedAmannNumbers.includes(value)) {
      setLinkedAmannNumbers(prev => [...prev, value]);
    }
  };
  const handleRemoveUpdateAmann = (id) => {
    if (deletedAmannNumbers.includes(id)) {
      setDeletedAmannNumbers(prev => prev.filter(v => v !== id));
    } else if (originalLinkedAmannNumbers.includes(id)) {
      setDeletedAmannNumbers(prev => [...prev, id]);
    } else {
      setLinkedAmannNumbers(prev => prev.filter(v => v !== id));
    }
  };
  // Compute changes for update
  const originalThread = (stitchingThreadColors || []).find(tc => tc.value === selectedThreadId);
  const originalAmannIds = (originalThread?.amannNumbers || []).map(num => num.value) || [];
  const originalColorTagIds = (originalThread?.colorTags || []).map(tag => tag.value) || [];
  const addAmannIds = linkedAmannNumbers.filter(id => !originalAmannIds.includes(id));
  const removeAmannIds = deletedAmannNumbers;
  const addColorTagIds = linkedColorTags.filter(id => !originalColorTagIds.includes(id));
  const removeColorTagIds = deletedColorTags;
  const hasUpdateChanges = addAmannIds.length > 0 || removeAmannIds.length > 0 || addColorTagIds.length > 0 || removeColorTagIds.length > 0;
  // Handler for Update button (open modal)
  const handleUpdateClick = () => {
    setUpdateModalOpen(true);
    setUpdateError("");
  };
  // Handler for confirming update in modal
  const handleUpdateConfirm = () => {
    if (!selectedThreadId) {
      setUpdateError("No thread selected.");
      return;
    }
    const formData = new FormData();
    formData.append("type", "updateStitching");
    formData.append("threadId", selectedThreadId);
    addAmannIds.forEach(id => formData.append("addAmannIds", id));
    removeAmannIds.forEach(id => formData.append("removeAmannIds", id));
    addColorTagIds.forEach(id => formData.append("addColorTagIds", id));
    removeColorTagIds.forEach(id => formData.append("removeColorTagIds", id));

    // Add reassignment info for amann numbers that are linked to another thread
    addAmannIds.forEach(id => {
      const numObj = allAmannOptions.find(num => num.value === id);
      if (numObj && numObj.threadId && numObj.threadId !== selectedThreadId) {
        // Only add if linked to a different thread
        formData.append('reassignAmannNumbers[]', JSON.stringify({ amannId: id, fromThreadId: numObj.threadId }));
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
    } else if (fetcher.data && fetcher.data.success) {
      setDeletedAmannNumbers([]);
      setDeletedColorTags([]);
    }
  }, [fetcher.data]);
  // Handler for stitching name field (add mode)
  const handleNameChange = (value) => {
    const formatted = formatNameLive(value);
    setStitchName(formatted);
    if (!formatted) {
      setStitchNameError("");
      setNameCollisionThreadId(null);
      return;
    }
    const isUnique = validateNameUnique(stitchingThreadColors || [], formatted, 'label');
    if (!isUnique) {
      const existingThread = (stitchingThreadColors || []).find(tc => formatNameOnBlur(tc.label) === formatNameOnBlur(formatted));
      setStitchNameError("A thread color with this name already exists.");
      setNameCollisionThreadId(existingThread?.value);
    } else {
      setStitchNameError("");
      setNameCollisionThreadId(null);
    }
  };

  // Handler for blur event (add mode)
  const handleNameBlur = () => {
    const formatted = formatNameOnBlur(stitchName);
    if (formatted !== stitchName) {
      setStitchName(formatted);
    }
    if (!formatted) {
      setStitchNameError("");
      setNameCollisionThreadId(null);
      return;
    }
    const isUnique = validateNameUnique(stitchingThreadColors || [], formatted, 'label');
    if (!isUnique) {
      const existingThread = (stitchingThreadColors || []).find(tc => formatNameOnBlur(tc.label) === formatNameOnBlur(formatted));
      setStitchNameError("A thread color with this name already exists.");
      setNameCollisionThreadId(existingThread?.value);
    } else {
      setStitchNameError("");
      setNameCollisionThreadId(null);
    }
  };

  // Handler for Save Stitching Thread Color
  const handleStitchSave = () => {
    const name = formatNameOnBlur(stitchName);
    setStitchFormattedName(name);
    if (!stitchAmann.length) {
      setStitchNameError("Please select at least one Amann number.");
      setNameCollisionThreadId(null);
      return;
    }
    // Find if name exists and get its abbreviation
    const isUnique = validateNameUnique(stitchingThreadColors || [], name, 'label');
    if (!isUnique) {
      const existingThread = (stitchingThreadColors || []).find(tc => formatNameOnBlur(tc.label) === name);
      setStitchNameError("A thread color with this name already exists.");
      setNameCollisionThreadId(existingThread?.value);
      return;
    }
    setNameCollisionThreadId(null);
    // Both are new: create both
    const existingAbbrs = (stitchingThreadColors || []).map(tc => tc.abbreviation);
    const abbr = generateStitchAbbreviation(name, existingAbbrs);
    setStitchGeneratedAbbr(abbr);
    setStitchModalOpen(true);
    setStitchNameError("");
  };

  // Handler for confirming in modal (add mode)
  const handleStitchConfirm = () => {
    // Prepare form data
    const formData = new FormData();
    formData.append('type', 'stitching');
    formData.append('name', stitchFormattedName);
    formData.append('abbreviation', stitchGeneratedAbbr);
    stitchAmann.forEach(id => formData.append('amannNumbers', id));
    stitchColorTags.forEach(tagId => formData.append('colorTagIds', tagId));

    // Add reassignment info for amann numbers that are linked to another thread
    stitchAmann.forEach(id => {
      const numObj = allAmannOptions.find(num => num.value === id);
      if (numObj && numObj.threadId) {
        // Only add if linked to a different thread
        formData.append('reassignAmannNumbers[]', JSON.stringify({ amannId: id, fromThreadId: numObj.threadId }));
      }
    });

    fetcher.submit(formData, { method: 'post' });
    setStitchModalOpen(false);
    setStitchName("");
    setStitchAmann([]);
    setStitchAmannInput("");
    setStitchColorTags([]);
    setStitchGeneratedAbbr("");
    setStitchFormattedName("");
    setStitchNameError("");
  };
  const handleStitchModalClose = () => {
    setStitchModalOpen(false);
  };

  // Handler for Amann number selection (add mode)
  const handleAddAmannSelect = (value) => {
    const numObj = allAmannOptions.find(num => num.value === value);
    if (numObj && numObj.threadId && !stitchAmann.includes(value)) {
      // Already linked to another thread, show modal
      setAmannReassignModal({ open: true, num: numObj, linkedThread: numObj.threadName });
      return;
    }
    if (!stitchAmann.includes(value)) {
      setStitchAmann(prev => [...prev, value]);
    }
    setStitchAmannInput("");
  };
  const handleRemoveAddAmann = (id) => {
    setStitchAmann(prev => prev.filter(v => v !== id));
  };

  // Add handler for switching to update mode from name collision
  const handleSwitchToUpdateFromName = () => {
    if (nameCollisionThreadId) {
      setMode("update");
      setSelectedThreadId(nameCollisionThreadId);
      setStitchNameError("");
      setNameCollisionThreadId(null);
    }
  };

  // Handler for confirming Amann reassignment
  const handleConfirmAmannReassign = () => {
    const value = amannReassignModal.num.value;
    if (mode === "add") {
      if (!stitchAmann.includes(value)) {
        setStitchAmann(prev => [...prev, value]);
      }
    } else if (mode === "update") {
      if (!linkedAmannNumbers.includes(value)) {
        setLinkedAmannNumbers(prev => [...prev, value]);
      }
    }
    setAmannReassignModal({ open: false, num: null, linkedThread: null });
    setStitchAmannInput("");
  };
  const handleCancelAmannReassign = () => {
    setAmannReassignModal({ open: false, num: null, linkedThread: null });
    setStitchAmannInput("");
  };

  // When switching to update mode or changing selectedThreadId, reset stitchAmannInputUpdate
  useEffect(() => {
    if (mode === "update") {
      setStitchAmannInputUpdate("");
    }
  }, [mode, selectedThreadId]);

  return (
    <Card>
      <BlockStack gap="400">
        <Text variant="headingMd">Add Stitching Thread Color</Text>
        {/* Radio buttons for mode selection */}
        <InlineStack gap="400" wrap={false}>
          <RadioButton
            label="Update Linked Colors"
            checked={mode === "update"}
            id="stitchMode-update"
            name="stitchMode"
            onChange={() => setMode("update")}
          />
          <RadioButton
            label="Add New Name"
            checked={mode === "add"}
            id="stitchMode-add"
            name="stitchMode"
            onChange={() => setMode("add")}
          />
        </InlineStack>
        {/* Divider */}
        <Divider borderColor="border" />
        {/* Name field only in add mode */}
        {mode === "add" && (
          <TextField
            label="Name"
            value={stitchName}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            autoComplete="off"
            error={stitchNameError}
          />
        )}
        {nameCollisionThreadId && mode === "add" && (
          <div style={{ marginTop: 8 }}>
            <Button onClick={handleSwitchToUpdateFromName} size="slim">
              This name already exists. Edit this color instead?
            </Button>
          </div>
        )}
        {/* Stitching form fields based on mode */}
        {mode === "update" ? (
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
                  setSelectedThreadId(value);
                  const selected = threadOptions.find(opt => opt.value === value);
                  setThreadNameSearchInput(selected ? selected.label : "");
                }}>
                  {threadOptions.filter(opt =>
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

            {/* Add Amann Number combobox */}
            <Combobox
              activator={
                <Combobox.TextField
                  prefix={<Icon source={SearchIcon} />}
                  onChange={setStitchAmannInputUpdate}
                  label="Add Amann Number"
                  value={stitchAmannInputUpdate}
                  placeholder="Search or select Amann Numbers"
                  autoComplete="off"
                />
              }
            >
              {filteredUpdateAmannOptions.length > 0 && (
                <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
                  <Listbox onSelect={handleUpdateAmannSelect}>
                    {filteredUpdateAmannOptions.map(option => (
                      <Listbox.Option key={option.value} value={option.value}>
                        {option.label}
                      </Listbox.Option>
                    ))}
                  </Listbox>
                </div>
              )}
            </Combobox>
            
            {/* Linked Amann Numbers tags */}
            <Text variant="bodyMd">Linked Amann Numbers:</Text>
            <InlineStack gap="200" wrap>
              {linkedAmannNumbers.map(id => {
                const numObj = allAmannOptions.find(num => num.value === id);
                const isOriginal = originalLinkedAmannNumbers.includes(id);
                const isDeleted = deletedAmannNumbers.includes(id);
                return numObj ? (
                  <Tag
                    key={id}
                    onRemove={() => handleRemoveUpdateAmann(id)}
                  >
                    <InlineStack gap="100" align="center">
                      <Icon
                        source={isDeleted ? DeleteIcon : isOriginal ? CheckCircleIcon : PlusCircleIcon}
                        color={isDeleted ? 'critical' : undefined}
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

            {/* Add Color Tag combobox */}
            <Combobox
              activator={
                <Combobox.TextField
                  prefix={<Icon source={SearchIcon} />}
                  onChange={setColorTagInputUpdate}
                  label="Add Color Tag"
                  value={colorTagInputUpdate}
                  placeholder="Search or select color tags"
                  autoComplete="off"
                />
              }
            >
              {filteredUpdateColorTagOptions.length > 0 && (
                <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
                  <Listbox onSelect={handleUpdateColorTagSelect}>
                    {filteredUpdateColorTagOptions.map(option => (
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
              {linkedColorTags.map(tagValue => {
                const tagObj = colorTags.find(t => t.value === tagValue);
                const originalColorTags = (stitchingThreadColors.find(tc => tc.value === selectedThreadId)?.colorTags || []).map(tag => tag.value);
                const isOriginal = originalColorTags.includes(tagValue);
                const isDeleted = deletedColorTags.includes(tagValue);
                return tagObj ? (
                  <Tag key={tagValue} onRemove={() => handleRemoveUpdateColorTag(tagValue)}>
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
              Update Stitching Thread Color
            </Button>
            {updateError && <Text color="critical">{updateError}</Text>}
          </BlockStack>
        ) : (
          <BlockStack gap="400">
            {/* Amann number dropdown (add mode) */}
            <Combobox
              activator={
                <Combobox.TextField
                  prefix={<Icon source={SearchIcon} />}
                  onChange={setStitchAmannInput}
                  label="Amann Numbers"
                  value={stitchAmannInput}
                  placeholder="Search or select Amann Numbers"
                  autoComplete="off"
                />
              }
            >
              {filteredAddAmannOptions.length > 0 && (
                <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
                  <Listbox onSelect={handleAddAmannSelect}>
                    {filteredAddAmannOptions.map(option => (
                      <Listbox.Option key={option.value} value={option.value}>
                        {option.label}
                      </Listbox.Option>
                    ))}
                  </Listbox>
                </div>
              )}
            </Combobox>
            <InlineStack gap="200" wrap>
              {stitchAmann.map(id => {
                const numObj = allAmannOptions.find(num => num.value === id);
                return (
                  <Tag key={id} onRemove={() => handleRemoveAddAmann(id)}>
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
        )}
      </BlockStack>
      {/* Stitching Confirmation Modal (Add) */}
      <ThreadCreateUpdateModal
        open={stitchModalOpen}
        onClose={handleStitchModalClose}
        title="Confirm New Stitching Thread Color"
        primaryAction={{ content: "Confirm", onAction: handleStitchConfirm }}
        secondaryActions={[
          { content: "Cancel", onAction: handleStitchModalClose },
        ]}
      >
        <Text><b>Name:</b> {stitchFormattedName}</Text>
        <Text><b>Abbreviation:</b> {stitchGeneratedAbbr}</Text>
        <Text>
          <b>Amann Numbers:</b> {stitchAmann.map(id => {
            const numObj = allAmannOptions.find(num => num.value === id);
            return numObj ? numObj.label : id;
          }).join(", ") || "None"}
        </Text>
        <Text><b>Tags:</b> {stitchColorTags.map(tagValue => {
          const tagObj = colorTags.find(t => t.value === tagValue);
          return tagObj ? tagObj.label : tagValue;
        }).join(", ") || "None"}</Text>
      </ThreadCreateUpdateModal>
      {/* Update Confirmation Modal */}
      <ThreadCreateUpdateModal
        open={updateModalOpen}
        onClose={handleUpdateModalClose}
        title="Confirm Update to Stitching Thread Color"
        primaryAction={{ content: "Confirm Update", onAction: handleUpdateConfirm }}
        secondaryActions={[
          { content: "Cancel", onAction: handleUpdateModalClose },
        ]}
      >
        <Text variant="bodyMd"><b>Thread Name:</b> {originalThread?.label}</Text>
        <Text variant="bodyMd"><b>Add Amann Numbers:</b> {addAmannIds.map(id => {
          const numObj = (originalThread?.allAmannOptions || allAmannOptions).find(num => num.value === id);
          return numObj ? numObj.label : id;
        }).join(", ") || "None"}</Text>
        <Text variant="bodyMd"><b>Remove Amann Numbers:</b> {removeAmannIds.map(id => {
          const numObj = (originalThread?.allAmannOptions || allAmannOptions).find(num => num.value === id);
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
      {/* Amann reassignment modal */}
      <ThreadReassignNumberModal
        open={amannReassignModal.open}
        onClose={handleCancelAmannReassign}
        numberLabel={amannReassignModal.num?.label}
        currentThread={amannReassignModal.linkedThread}
        onConfirm={handleConfirmAmannReassign}
      />
    </Card>
  );
} 