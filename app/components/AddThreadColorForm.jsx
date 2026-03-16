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

export default function AddThreadColorForm({
  threadTypeLabel,
  numberTypeLabel,
  numberPlaceholder,
  threadColors,
  unlinkedNumbers,
  colorTags,
  abbreviationGenerator,
  validateNameUnique,
  formatNameLive,
  formatNameOnBlur,
  fetcher,
  onSubmitType,
  onUpdateType,
  reassignModalLabel,
  ThreadReassignNumberModal,
  ThreadCreateUpdateModal,
  modalTitles = { add: `Confirm New ${threadTypeLabel}`, update: `Confirm Update to ${threadTypeLabel}` },
  modalButtonLabels = { add: "Confirm", update: "Confirm Update" },
  saveButtonLabel = `Save ${threadTypeLabel}`,
  updateButtonLabel = `Update ${threadTypeLabel}`,
  radioGroupName = "threadMode"
}) {
  // Mode: "add" or "update"
  const [mode, setMode] = useState("add");
  // Add mode state
  const [name, setName] = useState("");
  const [numbers, setNumbers] = useState([]);
  const [numberInput, setNumberInput] = useState("");
  const [colorTagList, setColorTagList] = useState([]);
  const [colorTagInput, setColorTagInput] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [nameError, setNameError] = useState("");
  const [generatedAbbr, setGeneratedAbbr] = useState("");
  const [formattedName, setFormattedName] = useState("");
  // Update mode state
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [linkedNumbers, setLinkedNumbers] = useState([]); // ids
  const [originalLinkedNumbers, setOriginalLinkedNumbers] = useState([]); // ids
  const [linkedColorTags, setLinkedColorTags] = useState([]); // ids
  const [colorTagInputUpdate, setColorTagInputUpdate] = useState("");
  const [deletedNumbers, setDeletedNumbers] = useState([]); // ids
  const [deletedColorTags, setDeletedColorTags] = useState([]); // ids
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateError, setUpdateError] = useState("");
  // Add state to track if a name collision occurred and the matching thread id
  const [nameCollisionThreadId, setNameCollisionThreadId] = useState(null);
  // Add state for thread name search input in update mode
  const [threadNameSearchInput, setThreadNameSearchInput] = useState("");
  // Add state for number reassignment modal
  const [reassignModal, setReassignModal] = useState({ open: false, num: null, linkedThread: null });
  // Add state for number search input in update mode
  const [numberInputUpdate, setNumberInputUpdate] = useState("");

  // Utility: get all thread options
  const threadOptions = useMemo(() => (threadColors || []).map(tc => ({ label: tc.label, value: tc.value })), [threadColors]);
  // Utility: get all numbers (linked and unlinked)
  const allNumberOptions = useMemo(() => {
    // Linked: flatten all numbers from all threads
    const linked = (threadColors || []).flatMap(tc =>
      (tc.numbers || []).map(num => ({ ...num, threadId: tc.value, threadName: tc.label }))
    );
    // Unlinked: from unlinkedNumbers
    const unlinked = (unlinkedNumbers || []).map(num => ({ ...num, threadId: null }));
    // Merge and deduplicate by value
    const all = [...linked, ...unlinked];
    const seen = new Set();
    return all.filter(num => {
      if (seen.has(num.value)) return false;
      seen.add(num.value);
      return true;
    });
  }, [threadColors, unlinkedNumbers]);

  // ... (The rest of the logic is a direct mapping from your current files, using the above state and props)

  // For brevity, you would copy the handlers and UI from your current files,
  // replacing all embroidery/stitching-specific names with the generic ones above,
  // and using the injected props for type-specific logic.

  // Example: For abbreviation, use abbreviationGenerator(name, existingAbbrs)
  // For validation, use validateNameUnique, formatNameLive, formatNameOnBlur, etc.

  // The UI would use threadTypeLabel, numberTypeLabel, numberPlaceholder, etc.

  // Effect 1: Reset state only when switching to 'add' mode
  useEffect(() => {
    if (mode === "add") {
      setThreadNameSearchInput("");
      setSelectedThreadId("");
      setName("");
      setNumbers([]);
      setNumberInput("");
      setLinkedNumbers([]);
      setOriginalLinkedNumbers([]);
      setLinkedColorTags([]);
      setColorTagInput("");
      setModalOpen(false);
      setNameError("");
      setGeneratedAbbr("");
      setFormattedName("");
      setDeletedNumbers([]);
      setDeletedColorTags([]);
      setUpdateModalOpen(false);
      setUpdateError("");
      setNameCollisionThreadId(null);
      setReassignModal({ open: false, num: null, linkedThread: null });
    }
  }, [mode]);

  // Effect 2: Populate state when switching to 'update' mode and embSelectedThreadId changes
  useEffect(() => {
    if (mode === "update" && selectedThreadId) {
      const thread = (threadColors || []).find(tc => tc.value === selectedThreadId);
      setThreadNameSearchInput(thread?.label || "");
      setName(thread?.label || "");
      const originalIds = (thread?.numbers || []).map(num => num.value);
      setOriginalLinkedNumbers(originalIds);
      setLinkedNumbers(originalIds);
      setLinkedColorTags((thread?.colorTags || []).map(tag => tag.value));
      setDeletedNumbers([]);
      setDeletedColorTags([]);
    }
  }, [mode, selectedThreadId, threadColors]);

  // Filtered options for color tags (for add mode)
  const filteredColorTagOptions = useMemo(() => {
    const search = colorTagInput.toLowerCase();
    return colorTags.filter(tag =>
      tag.label.toLowerCase().includes(search) && !colorTagList.includes(tag.value)
    );
  }, [colorTags, colorTagInput, colorTagList]);

  // Filtered options for color tags (for update mode)
  const filteredUpdateColorTagOptions = useMemo(() => {
    const search = colorTagInputUpdate.toLowerCase();
    return colorTags.filter(tag =>
      tag.label.toLowerCase().includes(search) && !linkedColorTags.includes(tag.value)
    ).map(tag => ({
      label: tag.label,
      value: tag.value
    }));
  }, [colorTags, colorTagInputUpdate, linkedColorTags]);

  // Filtered options for numbers (for add mode)
  const filteredNumberOptions = useMemo(() => {
    const search = numberInput.toLowerCase();
    const filtered = allNumberOptions
      .filter(num =>
        num.label.toLowerCase().includes(search) ||
        (num.threadName && num.threadName.toLowerCase().includes(search))
      )
      .filter(num => !numbers.includes(num.value))
      .map(num => ({
        ...num,
        label: num.threadId && num.threadName
          ? `${num.label} (linked to ${num.threadName})`
          : num.label
      }));
    console.log('filteredNumberOptions', { search, filtered, allNumberOptions });
    return filtered;
  }, [allNumberOptions, numberInput, numbers]);

  // Filtered options for numbers (for update mode)
  const filteredUpdateNumberOptions = useMemo(() => {
    const search = numberInputUpdate.toLowerCase();
    return allNumberOptions
      .filter(num =>
        num.label.toLowerCase().includes(search) ||
        (num.threadName && num.threadName.toLowerCase().includes(search))
      )
      .filter(num => !linkedNumbers.includes(num.value))
      .map(num => ({
        ...num,
        label: num.threadId && num.threadId !== selectedThreadId && num.threadName
          ? `${num.label} (linked to ${num.threadName})`
          : num.label
      }));
  }, [allNumberOptions, numberInputUpdate, linkedNumbers, selectedThreadId]);

  // Handlers for color tags (add mode)
  const handleColorTagSelect = (value) => {
    if (!colorTagList.includes(value)) {
      setColorTagList(prev => [...prev, value]);
    }
    setColorTagInput("");
  };
  const handleRemoveColorTag = (tagValue) => {
    setColorTagList(prev => prev.filter(v => v !== tagValue));
  };

// Handlers for embroidery color tags (update mode)
const handleUpdateColorTagSelect = (value) => {
  if (!linkedColorTags.includes(value)) {
    setLinkedColorTags(prev => [...prev, value]);
  }
  setColorTagInputUpdate("");
};
const handleRemoveUpdateColorTag = (tagValue) => {
  if (deletedColorTags.includes(tagValue)) {
    // Undo delete for original color tags
    setDeletedColorTags(prev => prev.filter(v => v !== tagValue));
  } else if ((threadColors.find(tc => tc.value === selectedThreadId)?.colorTags || []).some(tag => tag.value === tagValue)) {
    // Mark as deleted if it was originally linked
    setDeletedColorTags(prev => [...prev, tagValue]);
  } else {
    // Remove new additions immediately
    setLinkedColorTags(prev => prev.filter(v => v !== tagValue));
  }
};

// Handlers for numbers (add mode)
const handleNumberSelect = (value) => {
  const numObj = allNumberOptions.find(num => num.value === value);
  if (numObj && numObj.threadId && !numbers.includes(value)) {
    setReassignModal({ open: true, num: numObj, linkedThread: numObj.threadName });
    return;
  }
  if (!numbers.includes(value)) {
    setNumbers(prev => [...prev, value]);
  }
  setNumberInput("");
};
const handleRemoveNumber = (id) => {
  setNumbers(prev => prev.filter(v => v !== id));
};

// Handlers for numbers (update mode)
const handleUpdateNumberSelect = (value) => {
  const numObj = allNumberOptions.find(num => num.value === value);
  if (numObj && numObj.threadId && numObj.threadId !== selectedThreadId && !linkedNumbers.includes(value)) {
    setReassignModal({ open: true, num: numObj, linkedThread: numObj.threadName });
    return;
  }
  if (!linkedNumbers.includes(value)) {
    setLinkedNumbers(prev => [...prev, value]);
  }
  setNumberInputUpdate("");
};

const handleRemoveUpdateNumber = (id) => {
  if (deletedNumbers.includes(id)) {
    // Undo delete for original numbers
    setDeletedNumbers(prev => prev.filter(v => v !== id));
  } else if (originalLinkedNumbers.includes(id)) {
    // Mark as deleted
    setDeletedNumbers(prev => [...prev, id]);
  } else {
    // Remove new additions immediately
    setLinkedNumbers(prev => prev.filter(v => v !== id));
  }
};

// Handler for name field (add mode)
const handleNameChange = (value) => {
  const formatted = formatNameLive(value);
  setName(formatted);
  if (!formatted) {
    setNameError("");
    setNameCollisionThreadId(null);
    return;
  }
  const isUnique = validateNameUnique(threadColors || [], formatted, 'label');
  if (!isUnique) {
    const existing = (threadColors || []).find(tc => formatNameOnBlur(tc.label) === formatNameOnBlur(formatted));
    setNameError("A thread color with this name already exists.");
    setNameCollisionThreadId(existing?.value);
  } else {
    setNameError("");
    setNameCollisionThreadId(null);
  }
};

// Handler for blur event (add mode)
const handleNameBlur = () => {
  const formatted = formatNameOnBlur(name);
  if (formatted !== name) {
    setName(formatted);
  }
  if (!formatted) {
    setNameError("");
    setNameCollisionThreadId(null);
    return;
  }
  const isUnique = validateNameUnique(threadColors || [], formatted, 'label');
  if (!isUnique) {
    const existing = (threadColors || []).find(tc => formatNameOnBlur(tc.label) === formatNameOnBlur(formatted));
    setNameError("A thread color with this name already exists.");
    setNameCollisionThreadId(existing?.value);
  } else {
    setNameError("");
    setNameCollisionThreadId(null);
  }
};

// Handler for Save Thread Color
const handleSave = () => {
  const formatted = formatNameOnBlur(name);
  setFormattedName(formatted);
  if (!formatted) {
    setNameError("Please enter a thread color name.");
    setNameCollisionThreadId(null);
    return;
  }
  if (!numbers.length) {
    setNameError("Please select at least one number.");
    setNameCollisionThreadId(null);
    return;
  }
  // Validation: name must not already exist (case-insensitive)
  const isUnique = validateNameUnique(threadColors || [], formatted, 'label');
  if (!isUnique) {
    const existing = (threadColors || []).find(tc => formatNameOnBlur(tc.label) === formatted);
    setNameError("A thread color with this name already exists.");
    setNameCollisionThreadId(existing?.value);
    return;
  }
  setNameCollisionThreadId(null);
  // Generate abbreviation
  const existingAbbrs = (threadColors || []).map(tc => tc.abbreviation);
  const abbr = abbreviationGenerator(formatted, existingAbbrs);
  setGeneratedAbbr(abbr);
  setModalOpen(true);
  setNameError("");
};

// Handler for confirming in modal
const handleConfirm = () => {
  // Prepare form data
  const formData = new FormData();
  formData.append('type', onSubmitType);
  formData.append('name', name);
  formData.append('abbreviation', generatedAbbr);
  numbers.forEach(id => formData.append('numbers', id));
  colorTagList.forEach(tagId => formData.append('colorTagIds', tagId));
  numbers.forEach(id => {
    const numObj = allNumberOptions.find(num => num.value === id);
    if (numObj && numObj.threadId) {
      formData.append('reassignNumbers[]', JSON.stringify({ numberId: id, fromThreadId: numObj.threadId }));
    }
  });
  fetcher.submit(formData, { method: 'post' });
  setModalOpen(false);
  setName("");
  setNumbers([]);
  setLinkedNumbers([]);
  setLinkedColorTags([]);
  setColorTagList([]);
  setGeneratedAbbr("");
  setFormattedName("");
  setNameError("");
};
const handleModalClose = () => {
  setModalOpen(false);
};

// Show backend errors as a banner
useEffect(() => {
  if (fetcher.data && fetcher.data.error) {
    setNameError(fetcher.data.error);
  }
}, [fetcher.data]);

// Add handler for switching to update mode from name collision
const handleSwitchToUpdateFromName = () => {
  if (nameCollisionThreadId) {
    setMode("update");
    setSelectedThreadId(nameCollisionThreadId);
    setName(name); // Preserve the user's typed name
    setNameError("");
    setNameCollisionThreadId(null);
  }
};

  // Compute changes for update
  const originalThread = (threadColors || []).find(tc => tc.value === selectedThreadId);
  const originalNumberIds = (originalThread?.numbers || []).map(num => num.value) || [];
  const originalColorTagIds = (originalThread?.colorTags || []).map(tag => tag.value) || [];
  const addNumberIds = linkedNumbers.filter(id => !originalNumberIds.includes(id));
  const removeNumberIds = deletedNumbers;
  const addColorTagIds = linkedColorTags.filter(id => !originalColorTagIds.includes(id));
  const removeColorTagIds = deletedColorTags;
  const hasUpdateChanges = addNumberIds.length > 0 || removeNumberIds.length > 0 || addColorTagIds.length > 0 || removeColorTagIds.length > 0;

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
    formData.append("type", onUpdateType);
    formData.append("threadId", selectedThreadId);
    addNumberIds.forEach(id => formData.append("addNumberIds", id));
    removeNumberIds.forEach(id => formData.append("removeNumberIds", id));
    addColorTagIds.forEach(id => formData.append("addColorTagIds", id));
    removeColorTagIds.forEach(id => formData.append("removeColorTagIds", id));
    addNumberIds.forEach(id => {
      const numObj = allNumberOptions.find(num => num.value === id);
      if (numObj && numObj.threadId && numObj.threadId !== selectedThreadId) {
        formData.append('reassignNumbers[]', JSON.stringify({ numberId: id, fromThreadId: numObj.threadId }));
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

  // Handler for confirming number reassignment
  const handleConfirmReassign = () => {
    const value = reassignModal.num.value;
    if (mode === "add") {
      if (!numbers.includes(value)) {
        setNumbers(prev => [...prev, value]);
      }
    } else if (mode === "update") {
      if (!linkedNumbers.includes(value)) {
        setLinkedNumbers(prev => [...prev, value]);
      }
    }
    setReassignModal({ open: false, num: null, linkedThread: null });
    setNumberInput("");
  };
  const handleCancelReassign = () => {
    setReassignModal({ open: false, num: null, linkedThread: null });
    setNumberInput("");
  };

  return (
    <Card>
      <BlockStack gap="400">
        <Text variant="headingMd">{`Add ${threadTypeLabel}`}</Text>
        {/* Radio buttons for mode selection */}
        <InlineStack gap="400" wrap={false}>
          <RadioButton
            label="Add New Name"
            checked={mode === "add"}
            id={`${radioGroupName}-add`}
            name={radioGroupName}
            onChange={() => setMode("add")}
          />
          <RadioButton
            label="Update Linked Colors"
            checked={mode === "update"}
            id={`${radioGroupName}-update`}
            name={radioGroupName}
            onChange={() => setMode("update")}
          />
        </InlineStack>
        <Divider borderColor="border" />
        {/* Form fields based on mode */}
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
            <Combobox
              activator={
                <Combobox.TextField
                  prefix={<Icon source={SearchIcon} />}
                  onChange={setNumberInputUpdate}
                  label={`Add ${numberTypeLabel}`}
                  value={numberInputUpdate}
                  placeholder={`Search or select ${numberTypeLabel}`}
                  autoComplete="off"
                />
              }
            >
              {filteredUpdateNumberOptions.length > 0 && (
                <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
                  <Listbox onSelect={handleUpdateNumberSelect}>
                    {filteredUpdateNumberOptions.map(option => (
                      <Listbox.Option key={option.value} value={option.value}>
                        {option.label}
                      </Listbox.Option>
                    ))}
                  </Listbox>
                </div>
              )}
            </Combobox>
            {/* Linked Numbers tags */}
            <Text variant="bodyMd">Linked Numbers:</Text>
            <InlineStack gap="200" wrap>
              {linkedNumbers.map(id => {
                const numObj = allNumberOptions.find(num => num.value === id);
                const isOriginal = originalLinkedNumbers.includes(id);
                const isDeleted = deletedNumbers.includes(id);
                return numObj ? (
                  <Tag
                    key={id}
                    onRemove={() => handleRemoveUpdateNumber(id)}
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
            <Combobox
              activator={
                <Combobox.TextField
                  prefix={<Icon source={SearchIcon} />}
                  onChange={setColorTagInput}
                  label="Add Color Tag"
                  value={colorTagInput}
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
                const originalColorTags = (threadColors.find(tc => tc.value === selectedThreadId)?.colorTags || []).map(tag => tag.value);
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
              {updateButtonLabel}
            </Button>
            {updateError && <Text color="critical">{updateError}</Text>}
          </BlockStack>
        ) : (
          <BlockStack gap="400">
            {/* Name input (add mode) */}
            <TextField
              label="Name"
              value={name}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              autoComplete="off"
              error={nameError}
            />
            {nameCollisionThreadId && (
              <div style={{ marginTop: 8 }}>
                <Button onClick={handleSwitchToUpdateFromName} size="slim">
                  This name already exists. Edit this color instead?
                </Button>
              </div>
            )}
            {/* Number dropdown (add mode) */}
            <Combobox
              activator={
                <Combobox.TextField
                  prefix={<Icon source={SearchIcon} />}
                  onChange={setNumberInput}
                  label={numberTypeLabel}
                  value={numberInput}
                  placeholder={numberPlaceholder}
                  autoComplete="off"
                />
              }
            >
              {filteredNumberOptions.length > 0 && (
                <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
                  <Listbox onSelect={handleNumberSelect}>
                    {filteredNumberOptions.map(option => (
                      <Listbox.Option key={option.value} value={option.value}>
                        {option.label}
                      </Listbox.Option>
                    ))}
                  </Listbox>
                </div>
              )}
            </Combobox>
            <InlineStack gap="200" wrap>
              {numbers.map(id => {
                const numObj = allNumberOptions.find(num => num.value === id);
                return (
                  <Tag key={id} onRemove={() => handleRemoveNumber(id)}>
                    {numObj ? (numObj.threadId && numObj.threadName ? `${numObj.label} (linked to ${numObj.threadName})` : numObj.label) : id}
                  </Tag>
                );
              })}
            </InlineStack>
            {/* Color tags (add mode) */}
            <Combobox
              activator={
                <Combobox.TextField
                  prefix={<Icon source={SearchIcon} />}
                  onChange={setColorTagInput}
                  label="Color Tags"
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
            <InlineStack gap="200" wrap>
              {colorTagList.map((tagValue) => {
                const tagObj = colorTags.find((t) => t.value === tagValue);
                return tagObj ? (
                  <Tag key={tagValue} onRemove={() => handleRemoveColorTag(tagValue)}>
                    {tagObj.label}
                  </Tag>
                ) : null;
              })}
            </InlineStack>
            {/* Save button (add mode) */}
            <Button primary onClick={handleSave}>{saveButtonLabel}</Button>
          </BlockStack>
        )}
      </BlockStack>
      {/* Modals, etc. */}
      {/* Confirmation Modal */}
      <ThreadCreateUpdateModal
        open={modalOpen}
        onClose={handleModalClose}
        title={modalTitles.add}
        primaryAction={{ content: modalButtonLabels.add, onAction: handleConfirm }}
        secondaryActions={[
          { content: "Cancel", onAction: handleModalClose },
        ]}
      >
        <Text><b>Name:</b> {formattedName}</Text>
        <Text><b>Abbreviation:</b> {generatedAbbr}</Text>
        <Text><b>{numberTypeLabel}:</b> {numbers.map(id => {
          const numObj = allNumberOptions.find(num => num.value === id);
          return numObj ? numObj.label : id;
        }).join(", ") || "None"}</Text>
        <Text><b>Tags:</b> {colorTagList.map(tagValue => {
          const tagObj = colorTags.find(t => t.value === tagValue);
          return tagObj ? tagObj.label : tagValue;
        }).join(", ") || "None"}</Text>
      </ThreadCreateUpdateModal>
      {/* Update Confirmation Modal */}
      <ThreadCreateUpdateModal
        open={updateModalOpen}
        onClose={handleUpdateModalClose}
        title={modalTitles.update}
        primaryAction={{ content: modalButtonLabels.update, onAction: handleUpdateConfirm }}
        secondaryActions={[
          { content: "Cancel", onAction: handleUpdateModalClose },
        ]}
      >
        <Text variant="bodyMd"><b>Thread Name:</b> {originalThread?.label}</Text>
        <Text variant="bodyMd"><b>Add {numberTypeLabel}:</b> {addNumberIds.map(id => {
          const numObj = (originalThread?.allNumberOptions || allNumberOptions).find(num => num.value === id);
          return numObj ? numObj.label : id;
        }).join(", ") || "None"}</Text>
        <Text variant="bodyMd"><b>Remove {numberTypeLabel}:</b> {removeNumberIds.map(id => {
          const numObj = (originalThread?.allNumberOptions || allNumberOptions).find(num => num.value === id);
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
      {/* Number reassignment modal */}
      <ThreadReassignNumberModal
        open={reassignModal.open}
        onClose={handleCancelReassign}
        numberLabel={reassignModal.num?.label}
        currentThread={reassignModal.linkedThread}
        onConfirm={handleConfirmReassign}
      />
    </Card>
  );
}