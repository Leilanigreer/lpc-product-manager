import React, { useState, useEffect, useMemo } from "react";
import { FormLayout, TextField, Button, Text, BlockStack, Combobox, Listbox, Tag, InlineStack, Icon, Box, RadioButton, Divider } from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";
import { formatNameLive, formatNameOnBlur, validateNameUnique } from "../lib/utils/colorNameUtils";

export default function ColorTagManager({
  existingTags = [],
  stitchingThreads = [],
  embroideryThreads = [],
  leatherColors = [],
  onSubmit,
  initialTag = null,
}) {
  // State
  const [mode, setMode] = useState(initialTag ? "update" : "add");
  const [name, setName] = useState(initialTag?.label || "");
  const [selectedTagId, setSelectedTagId] = useState(initialTag?.value || null);
  const [selectedStitching, setSelectedStitching] = useState(initialTag?.stitchingThreadIds || []);
  const [selectedEmbroidery, setSelectedEmbroidery] = useState(initialTag?.embroideryThreadIds || []);
  const [selectedLeather, setSelectedLeather] = useState(initialTag?.leatherColorIds || []);
  const [submitting, setSubmitting] = useState(false);
  // Search inputs for each combobox
  const [stitchingInput, setStitchingInput] = useState("");
  const [embroideryInput, setEmbroideryInput] = useState("");
  const [leatherInput, setLeatherInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [addModeConflictTag, setAddModeConflictTag] = useState(null);
  const [updateSearchInput, setUpdateSearchInput] = useState("");
  const tagOptions = useMemo(() => (existingTags || []).map(tag => ({ label: tag.label, value: tag.value })), [existingTags]);
  // Reset fields on mode change
  useEffect(() => {
    if (mode === "add") {
      setName("");
      setSelectedStitching([]);
      setSelectedEmbroidery([]);
      setSelectedLeather([]);
    } else if (mode === "update" && initialTag) {
      setName(initialTag.label || "");
      setSelectedStitching(initialTag.stitchingThreadIds || []);
      setSelectedEmbroidery(initialTag.embroideryThreadIds || []);
      setSelectedLeather(initialTag.leatherColorIds || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialTag]);

  // Submit handler
  const handleSubmit = () => {
    setSubmitting(true);
    onSubmit &&
      onSubmit({
        name: name.trim(),
        stitchingThreadIds: selectedStitching,
        embroideryThreadIds: selectedEmbroidery,
        leatherColorIds: selectedLeather,
        mode,
      });
    setSubmitting(false);
  };

  // Filtering options for each combobox
  const filteredStitchingOptions = stitchingThreads.filter(
    (option) =>
      option.label.toLowerCase().includes(stitchingInput.toLowerCase()) &&
      !selectedStitching.includes(option.value)
  );
  const filteredEmbroideryOptions = embroideryThreads.filter(
    (option) =>
      option.label.toLowerCase().includes(embroideryInput.toLowerCase()) &&
      !selectedEmbroidery.includes(option.value)
  );
  const filteredLeatherOptions = leatherColors.filter(
    (option) =>
      option.label.toLowerCase().includes(leatherInput.toLowerCase()) &&
      !selectedLeather.includes(option.value)
  );

  // Name field handlers (add mode)
  const handleNameChange = (value) => {
    const formatted = formatNameLive(value);
    setName(formatted);
    setNameError("");
    setAddModeConflictTag(null);
  };

  const handleNameBlur = () => {
    const formatted = formatNameOnBlur(name);
    setName(formatted);
    if (!formatted.trim()) {
      setNameError("");
      setAddModeConflictTag(null);
      return;
    }
    const isUnique = validateNameUnique(existingTags, formatted, "label");
    if (!isUnique) {
      const match = existingTags.find(tag => formatNameOnBlur(tag.label) === formatNameOnBlur(formatted));
      setNameError("A color tag with this name already exists.");
      setAddModeConflictTag(match);
    } else {
      setNameError("");
      setAddModeConflictTag(null);
    }
  };

  const handleSwitchToUpdateFromName = () => {
    if (addModeConflictTag) {
      setMode("update");
      setSelectedTagId(addModeConflictTag.value);
      setUpdateSearchInput(addModeConflictTag.label || "");
      setName(addModeConflictTag.label || "");
      setSelectedLeather((addModeConflictTag.leatherColors || []).map(l => l.value));
      setSelectedStitching((addModeConflictTag.stitchingColors || []).map(s => s.value));
      setSelectedEmbroidery((addModeConflictTag.embroideryColors || []).map(e => e.value));
      setNameError("");
      setAddModeConflictTag(null);
    }
  };

  return (
    <BlockStack gap="400">
      <Text variant="headingMd">Color Tag Management</Text>
      {/* Add/Update radio buttons */}
      <InlineStack gap="400">
        <RadioButton
          label="Add"
          checked={mode === "add"}
          id="add-mode"
          name="mode"
          onChange={() => setMode("add")}
        />
        <RadioButton
          label="Update"
          checked={mode === "update"}
          id="update-mode"
          name="mode"
          onChange={() => setMode("update")}
          // disabled={!initialTag}
        />
      </InlineStack>
      <Divider borderColor="border" />
      <FormLayout>
        {mode === "add" && (
          <>
            <TextField
              label="Color Tag Name"
              value={name}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              autoComplete="off"
              error={nameError}
            />
            {addModeConflictTag && (
              <div style={{ marginTop: 8 }}>
                <Button onClick={handleSwitchToUpdateFromName} size="slim">
                  This name already exists. Edit this tag instead?
                </Button>
              </div>
            )}
          </>
        )}
        {mode === "update" && (
          <Combobox
            activator={
              <Combobox.TextField
                label="Select Color Tag Name"
                value={updateSearchInput}
                onChange={setUpdateSearchInput}
                placeholder="Choose a color tag name"
                autoComplete="off"
              />
            }
          >
            <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
              <Listbox onSelect={value => {
                setSelectedTagId(value);
                const selected = existingTags.find(tag => tag.value === value);
                setName(selected ? selected.label : "");
                setSelectedLeather(selected ? (selected.leatherColors || []).map(l => l.value) : []);
                setSelectedStitching(selected ? (selected.stitchingColors || []).map(s => s.value) : []);
                setSelectedEmbroidery(selected ? (selected.embroideryColors || []).map(e => e.value) : []);
                setUpdateSearchInput(selected ? selected.label : "");
              }}>
                {tagOptions.filter(opt =>
                  opt.label.toLowerCase().includes(updateSearchInput.toLowerCase())
                ).map(option => (
                  <Listbox.Option key={option.value} value={option.value}>
                    {option.label}
                  </Listbox.Option>
                ))}
              </Listbox>
            </div>
          </Combobox>
        )}
        <InlineStack gap="800" align="start">
          {/* Leather Colors */}
          <Box width="275px">
            <BlockStack gap="200">
              <Combobox
                activator={
                  <Combobox.TextField
                    prefix={<Icon source={SearchIcon} />}
                    onChange={setLeatherInput}
                    label="Leather colors"
                    value={leatherInput}
                    placeholder="Search or select leather colors"
                    autoComplete="off"
                  />
                }
              >
                {filteredLeatherOptions.length > 0 && (
                  <Listbox onSelect={(value) => {
                    setSelectedLeather([...selectedLeather, value]);
                    setLeatherInput("");
                  }}>
                    {filteredLeatherOptions.map(option => (
                      <Listbox.Option key={option.value} value={option.value}>
                        {option.label}
                      </Listbox.Option>
                    ))}
                  </Listbox>
                )}
              </Combobox>
              <InlineStack gap="200" wrap>
                {selectedLeather.map((value) => {
                  const option = leatherColors.find((o) => o.value === value);
                  return option ? (
                    <Tag key={value} onRemove={() => setSelectedLeather(selectedLeather.filter((v) => v !== value))}>
                      {option.label}
                    </Tag>
                  ) : null;
                })}
              </InlineStack>
            </BlockStack>
          </Box>
          {/* Stitching Threads */}
          <Box width="275px">
            <BlockStack gap="200">
              <Combobox
                activator={
                  <Combobox.TextField
                    prefix={<Icon source={SearchIcon} />}
                    onChange={setStitchingInput}
                    label="Stitching threads"
                    value={stitchingInput}
                    placeholder="Search or select stitching threads"
                    autoComplete="off"
                  />
                }
              >
                {filteredStitchingOptions.length > 0 && (
                  <Listbox onSelect={(value) => {
                    setSelectedStitching([...selectedStitching, value]);
                    setStitchingInput("");
                  }}>
                    {filteredStitchingOptions.map(option => (
                      <Listbox.Option key={option.value} value={option.value}>
                        {option.label}
                      </Listbox.Option>
                    ))}
                  </Listbox>
                )}
              </Combobox>
              <InlineStack gap="200" wrap>
                {selectedStitching.map((value) => {
                  const option = stitchingThreads.find((o) => o.value === value);
                  return option ? (
                    <Tag key={value} onRemove={() => setSelectedStitching(selectedStitching.filter((v) => v !== value))}>
                      {option.label}
                    </Tag>
                  ) : null;
                })}
              </InlineStack>
            </BlockStack>
          </Box>
          {/* Embroidery Threads */}
          <Box width="275px">
            <BlockStack gap="200">
              <Combobox
                activator={
                  <Combobox.TextField
                    prefix={<Icon source={SearchIcon} />}
                    onChange={setEmbroideryInput}
                    label="Embroidery threads"
                    value={embroideryInput}
                    placeholder="Search or select embroidery threads"
                    autoComplete="off"
                  />
                }
              >
                {filteredEmbroideryOptions.length > 0 && (
                  <Listbox onSelect={(value) => {
                    setSelectedEmbroidery([...selectedEmbroidery, value]);
                    setEmbroideryInput("");
                  }}>
                    {filteredEmbroideryOptions.map(option => (
                      <Listbox.Option key={option.value} value={option.value}>
                        {option.label}
                      </Listbox.Option>
                    ))}
                  </Listbox>
                )}
              </Combobox>
              <InlineStack gap="200" wrap>
                {selectedEmbroidery.map((value) => {
                  const option = embroideryThreads.find((o) => o.value === value);
                  return option ? (
                    <Tag key={value} onRemove={() => setSelectedEmbroidery(selectedEmbroidery.filter((v) => v !== value))}>
                      {option.label}
                    </Tag>
                  ) : null;
                })}
              </InlineStack>
            </BlockStack>
          </Box>
        </InlineStack>
        <Button
          primary
          fullWidth
          onClick={handleSubmit}
          loading={submitting}
        >
          {mode === "update" ? "Update Tag" : "Add Tag"}
        </Button>
      </FormLayout>
    </BlockStack>
  );
} 