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
  Modal,
  Divider,
} from "@shopify/polaris";
import { SearchIcon, CheckCircleIcon, PlusCircleIcon, DeleteIcon } from '@shopify/polaris-icons';
import { toTitleCase } from "../lib/utils/threadColorUtils";

// Utility: Generate unique abbreviation for stitching (always ends with 'S')
function generateStitchAbbreviation(name, stitchingAbbrsRaw) {
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
}

export default function AddStitchingThreadColorForm({ colorTags, stitchingThreadColors, fetcher, unlinkedAmannNumbers }) {
  // Mode: "add" or "update"
  const [mode, setMode] = useState("add");
  // Add mode state
  const [stitchName, setStitchName] = useState("");
  const [stitchAmann, setStitchAmann] = useState("");
  const [stitchAmannInput, setStitchAmannInput] = useState("");
  const [stitchColorTags, setStitchColorTags] = useState([]);
  const [stitchColorTagInput, setStitchColorTagInput] = useState("");
  const [stitchModalOpen, setStitchModalOpen] = useState(false);
  const [stitchNameError, setStitchNameError] = useState("");
  const [stitchAmannError, setStitchAmannError] = useState("");
  const [stitchGeneratedAbbr, setStitchGeneratedAbbr] = useState("");
  const [stitchFormattedName, setStitchFormattedName] = useState("");
  const [stitchIntent, setStitchIntent] = useState(null);
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
  const [updateSuccess, setUpdateSuccess] = useState(false);
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
  // When switching to update mode and selecting a thread, populate linked numbers/tags
  useEffect(() => {
    if (mode === "update" && selectedThreadId) {
      const thread = (stitchingThreadColors || []).find(tc => tc.value === selectedThreadId);
      const originalIds = (thread?.amannNumbers || []).map(num => num.value);
      setOriginalLinkedAmannNumbers(originalIds);
      setLinkedAmannNumbers(originalIds);
      setLinkedColorTags((thread?.colorTags || []).map(tag => tag.value));
    } else if (mode === "add") {
      setStitchName("");
      setStitchAmann("");
      setStitchColorTags([]);
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
    return (unlinkedAmannNumbers || []).filter(num =>
      num.label.toLowerCase().includes(search)
    );
  }, [unlinkedAmannNumbers, stitchAmannInput]);
  // Filtered Amann options (update mode)
  const filteredUpdateAmannOptions = useMemo(() => {
    const search = stitchAmann.toLowerCase();
    return allAmannOptions.filter(num =>
      num.label.toLowerCase().includes(search) && !linkedAmannNumbers.includes(num.value)
    );
  }, [allAmannOptions, stitchAmann, linkedAmannNumbers]);
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
    if (!linkedAmannNumbers.includes(value)) {
      setLinkedAmannNumbers(prev => [...prev, value]);
    }
    setStitchAmann("");
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
  // Reset all state when mode changes
  useEffect(() => {
    setSelectedThreadId("");
    setLinkedAmannNumbers([]);
    setOriginalLinkedAmannNumbers([]);
    setLinkedColorTags([]);
    setColorTagInputUpdate("");
    setDeletedAmannNumbers([]);
    setDeletedColorTags([]);
    setUpdateModalOpen(false);
    setUpdateError("");
    setUpdateSuccess(false);
    setStitchName("");
    setStitchAmann("");
    setStitchColorTags([]);
    setStitchColorTagInput("");
    setStitchModalOpen(false);
    setStitchNameError("");
    setStitchAmannError("");
    setStitchGeneratedAbbr("");
    setStitchFormattedName("");
    setStitchIntent(null);
  }, [mode]);
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
      setDeletedAmannNumbers([]);
      setDeletedColorTags([]);
    }
  }, [fetcher.data]);
  // Handler for Save Stitching Thread Color
  const handleStitchSave = () => {
    const name = toTitleCase(stitchName.trim());
    setStitchFormattedName(name);
    const amannTrimmed = (stitchAmann || "").trim();
    if (!name) {
      setStitchNameError("Please enter a thread color name.");
      return;
    }
    if (!amannTrimmed) {
      setStitchAmannError("Please select an Amann number.");
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
        setStitchAmannError("This Amann number is already linked to this thread color.");
        return;
      } else {
        setStitchAmannError(`This Amann number is already linked to a different thread color: ${amannLinkedName}`);
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
    setStitchNameError("");
    setStitchAmannError("");
  };

  // Handler for confirming in modal (add mode)
  const handleStitchConfirm = () => {
    // Prepare form data
    const formData = new FormData();
    formData.append('type', 'stitching');
    formData.append('name', stitchFormattedName);
    formData.append('abbreviation', stitchGeneratedAbbr);
    if (stitchAmann) formData.append('amannNumber', stitchAmann);
    stitchColorTags.forEach(tagId => formData.append('colorTagIds', tagId));
    fetcher.submit(formData, { method: 'post' });
    setStitchModalOpen(false);
    setStitchName("");
    setStitchAmann("");
    setStitchAmannInput("");
    setStitchColorTags([]);
    setStitchGeneratedAbbr("");
    setStitchFormattedName("");
    setStitchNameError("");
    setStitchAmannError("");
    setStitchIntent(null);
  };
  const handleStitchModalClose = () => {
    setStitchModalOpen(false);
  };

  // Handler for stitching name field (add mode)
  const handleStitchNameChange = (value) => {
    const formatted = toTitleCase(value);
    setStitchName(formatted);
    // Real-time uniqueness validation
    if (!formatted) {
      setStitchNameError("");
      return;
    }
    const nameExists = (stitchingThreadColors || []).some(tc => tc.label.trim().toLowerCase() === formatted.toLowerCase());
    if (nameExists) {
      setStitchNameError("A thread color with this name already exists.");
    } else {
      setStitchNameError("");
    }
  };

  // Handler for Amann number selection (add mode)
  const handleAddAmannSelect = (value) => {
    setStitchAmann(value);
    setStitchAmannInput("");
  };

  return (
    <Card>
      <BlockStack gap="400">
        <Text variant="headingMd">Add Stitching Thread Color</Text>
        {/* Radio buttons for mode selection */}
        <InlineStack gap="400">
          <label>
            <input
              type="radio"
              name="stitchMode"
              value="update"
              checked={mode === "update"}
              onChange={() => setMode("update")}
            />
            Update Linked Colors
          </label>
          <label>
            <input
              type="radio"
              name="stitchMode"
              value="add"
              checked={mode === "add"}
              onChange={() => setMode("add")}
            />
            Add New Name
          </label>
        </InlineStack>
        {/* Divider */}
        <Divider borderColor="border" />
        {/* Stitching form fields based on mode */}
        {mode === "update" ? (
          <BlockStack gap="400">
            {/* Dropdown for existing thread names */}
            <Combobox
              activator={
                <Combobox.TextField
                  label="Select Thread Name"
                  value={threadOptions.find(opt => opt.value === selectedThreadId)?.label || ""}
                  onChange={() => {}}
                  placeholder="Choose a thread color name"
                  autoComplete="off"
                  readOnly
                />
              }
            >
              <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
                <Listbox onSelect={setSelectedThreadId}>
                  {threadOptions.map(option => (
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
                  onChange={setStitchAmann}
                  label="Add Amann Number"
                  value={stitchAmann}
                  placeholder="Search or select Amann Number"
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
            {updateSuccess && <Text color="success">Update successful!</Text>}
          </BlockStack>
        ) : (
          <BlockStack gap="400">
            <TextField
              label="Name"
              value={stitchName}
              onChange={handleStitchNameChange}
              autoComplete="off"
              error={stitchNameError}
            />
            {/* Amann number dropdown (add mode) */}
            <Combobox
              activator={
                <Combobox.TextField
                  prefix={<Icon source={SearchIcon} />}
                  onChange={setStitchAmannInput}
                  label="Amann Number"
                  value={stitchAmannInput}
                  placeholder="Search or select Amann Number"
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
            {stitchAmann && (unlinkedAmannNumbers || []).some(num => num.value === stitchAmann) && (
              <InlineStack gap="200" wrap>
                <Tag onRemove={() => { setStitchAmann(""); setStitchAmannInput(""); }}>
                  {(unlinkedAmannNumbers || []).find(num => num.value === stitchAmann)?.label || stitchAmann}
                </Tag>
              </InlineStack>
            )}
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
            <Text>
              <b>Amann Number:</b> 
              {(unlinkedAmannNumbers.find(num => num.value === stitchAmann)?.label) || stitchAmann || "None"}
            </Text>
            <Text><b>Tags:</b> {stitchColorTags.map(tagValue => {
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
        title="Confirm Update to Stitching Thread Color"
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
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Card>
  );
} 