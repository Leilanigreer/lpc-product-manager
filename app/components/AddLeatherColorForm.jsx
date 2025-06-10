import React, { useCallback, useMemo, useState } from "react";
import { TextField, BlockStack, InlineStack, Tag, Combobox, Listbox, Icon, Box, Button, Modal, InlineError, RadioButton, Text, Divider } from "@shopify/polaris";
import { SearchIcon } from '@shopify/polaris-icons';
import { formatNameLive, formatNameOnBlur, validateNameUnique, generateLeatherAbbreviation } from '../lib/utils/colorNameUtils';

export default function AddLeatherColorForm({ leatherColors, colorTags, fetcher }) {
  const [mode, setMode] = useState("add");
  const [selectedLeatherColorId, setSelectedLeatherColorId] = useState("");
  const [leatherColorName, setLeatherColorName] = useState("");
  const [selectedColorTags, setSelectedColorTags] = useState([]);
  const [colorTagInput, setColorTagInput] = useState("");
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [generatedAbbr, setGeneratedAbbr] = useState("");
  const [formattedName, setFormattedName] = useState("");
  const [isLimitedEditionLeather, setIsLimitedEditionLeather] = useState(false);
  const [addModeConflict, setAddModeConflict] = useState(null);

  const filteredColorTagOptions = useMemo(() => {
    const search = colorTagInput.toLowerCase();
    return colorTags.filter(tag =>
      tag.label.toLowerCase().includes(search) && !selectedColorTags.includes(tag.value)
    ).map(tag => ({ label: tag.label, value: tag.value }));
  }, [colorTags, colorTagInput, selectedColorTags]);

  const handleNameChange = useCallback((value) => {
    const formatted = formatNameLive(value);
    setLeatherColorName(formatted);
    setError("");
    setAddModeConflict(null);
    if (formatted.trim()) {
      const isUnique = validateNameUnique(leatherColors, formatted, 'label');
      if (!isUnique) {
        const match = leatherColors.find(lc => formatNameOnBlur(lc.label) === formatNameOnBlur(formatted));
        if (match) {
          if (match.isActive) {
            setError("This color already exists and is active. Would you like to update it?");
            setAddModeConflict({ type: 'update', color: match });
          } else {
            setError("This color exists but is discontinued. Would you like to reactivate it?");
            setAddModeConflict({ type: 'reactivate', color: match });
          }
        }
      }
    }
  }, [leatherColors]);

  const handleNameBlur = useCallback(() => {
    const formatted = formatNameOnBlur(leatherColorName);
    setLeatherColorName(formatted);
    setFormattedName(formatted);
  }, [leatherColorName]);

  const handleColorTagSelect = useCallback((value) => {
    if (!selectedColorTags.includes(value)) {
      setSelectedColorTags(prev => [...prev, value]);
    }
    setColorTagInput("");
  }, [selectedColorTags]);

  const handleRemoveColorTag = useCallback((tagValue) => {
    setSelectedColorTags((prev) => prev.filter((v) => v !== tagValue));
  }, []);

  const handleCreate = useCallback(() => {
    const formatted = formatNameOnBlur(leatherColorName);
    setFormattedName(formatted);
    if (!formatted) {
      setError("Please enter a leather color name.");
      return;
    }
    const isUnique = validateNameUnique(leatherColors, formatted, 'label');
    if (!isUnique) {
      setError("This leather color name already exists.");
      return;
    }
    const existingAbbrs = leatherColors.map(lc => lc.abbreviation);
    const abbr = generateLeatherAbbreviation(formatted, existingAbbrs);
    setGeneratedAbbr(abbr);
    setModalOpen(true);
    setError("");
  }, [leatherColorName, leatherColors]);

  const handleConfirm = useCallback(() => {
    const formData = new FormData();
    formData.append('name', formattedName);
    formData.append('abbreviation', generatedAbbr);
    formData.append('isLimitedEditionLeather', isLimitedEditionLeather ? 'true' : 'false');
    selectedColorTags.forEach(tagId => formData.append('colorTagIds', tagId));
    fetcher.submit(formData, { method: 'post' });
    setModalOpen(false);
    setLeatherColorName("");
    setSelectedColorTags([]);
    setColorTagInput("");
    setGeneratedAbbr("");
    setFormattedName("");
    setIsLimitedEditionLeather(false);
    setError("");
  }, [formattedName, generatedAbbr, isLimitedEditionLeather, selectedColorTags, fetcher]);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
  }, []);

  // Add: Leather color options for update mode
  const leatherColorOptions = useMemo(() => {
    const options = (leatherColors || []).map(lc => ({
      label: lc.label,
      value: lc.value,
      abbreviation: lc.abbreviation,
      isLimitedEditionLeather: lc.isLimitedEditionLeather,
      isActive: lc.isActive,
      colorTags: lc.colorTags
    }));
    return options;
  }, [leatherColors]);

  // Only show active leather colors in update mode
  const activeLeatherColorOptions = useMemo(
    () => leatherColorOptions.filter(opt => opt.isActive),
    [leatherColorOptions]
  );

  // Only show inactive leather colors in Reactivate mode
  const inactiveLeatherColorOptions = useMemo(
    () => leatherColorOptions.filter(opt => !opt.isActive),
    [leatherColorOptions]
  );

  // Derived: Disable Limited Edition switch in update mode if currently Standard Stock
  const disableLimitedEditionSwitch = mode === "update" && isLimitedEditionLeather === false;

  // When switching to update mode or selecting a color, pre-fill fields
  React.useEffect(() => {
    if (mode === "update" && selectedLeatherColorId) {
      const selected = leatherColorOptions.find(opt => opt.value === selectedLeatherColorId);
      if (selected) {
        setLeatherColorName(selected.label);
        setFormattedName(selected.label);
        setGeneratedAbbr(selected.abbreviation || "");
        setIsLimitedEditionLeather(!!selected.isLimitedEditionLeather);
        setSelectedColorTags((selected.colorTags || []).map(tag => tag.value));
      }
    }
    if (mode === "add") {
      setLeatherColorName("");
      setFormattedName("");
      setGeneratedAbbr("");
      setIsLimitedEditionLeather(false);
      setSelectedColorTags([]);
      setSelectedLeatherColorId("");
    }
    if (mode === "reactivate" && selectedLeatherColorId) {
      const selected = leatherColorOptions.find(opt => opt.value === selectedLeatherColorId);
      if (selected) {
        setLeatherColorName(selected.label);
        setFormattedName(selected.label);
        setGeneratedAbbr(selected.abbreviation || "");
        setIsLimitedEditionLeather(!!selected.isLimitedEditionLeather);
        setSelectedColorTags((selected.colorTags || []).map(tag => tag.value));
      }
    }
  }, [mode, selectedLeatherColorId]);

  return (
    <BlockStack gap="400">
      <Text variant="headingMd">Add, Update, Discontinue, or Reactivate Leather Color</Text>
      <BlockStack gap="200">
        <InlineStack gap="400" wrap={false}>
          <RadioButton
            label="Add New"
            checked={mode === "add"}
            id="addMode"
            name="leatherMode"
            onChange={() => setMode("add")}
          />
          <RadioButton
            label="Update"
            checked={mode === "update"}
            id="updateMode"
            name="leatherMode"
            onChange={() => setMode("update")}
          />
          <RadioButton
            label="Discontinue"
            checked={mode === "discontinue"}
            id="discontinueMode"
            name="leatherMode"
            onChange={() => setMode("discontinue")}
          />
          <RadioButton
            label="Reactivate"
            checked={mode === "reactivate"}
            id="reactivateMode"
            name="leatherMode"
            onChange={() => setMode("reactivate")}
          />
        </InlineStack>
      </BlockStack>
      <Divider borderColor="border"/>
      {mode === "update" && (
        <Box paddingBlock="200">
          <Text tone="critical" variant="bodyMd">
            Switching from standard stock and limited edition is not currently available as business rules need to be determined.
          </Text>
        </Box>
      )}
      {mode === "discontinue" && (
        <Box paddingBlock="200">
          <Text tone="critical" variant="bodyMd">
            Discontinuing a leather color is not currently available as business rules need to be determined.
          </Text>
        </Box>
      )}
      <BlockStack gap="100">
        {mode !== "discontinue" && (
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
        )}
        <InlineStack gap="800" align="start" wrap={false}>
          <Box width="50%">
            {mode === "add" ? (
              <>
                <TextField
                  id="leatherColorNameInput"
                  label=""
                  value={leatherColorName}
                  onChange={handleNameChange}
                  onBlur={handleNameBlur}
                  autoComplete="off"
                  placeholder="Enter new leather color name"
                />
                {addModeConflict && (
                  <Box paddingBlock="200">
                    <Text tone="critical" variant="bodyMd">{error}</Text>
                    <Button
                      size="slim"
                      onClick={() => {
                        if (addModeConflict.type === 'update') {
                          setMode('update');
                          setSelectedLeatherColorId(addModeConflict.color.value);
                        } else if (addModeConflict.type === 'reactivate') {
                          setMode('reactivate');
                          setSelectedLeatherColorId(addModeConflict.color.value);
                        }
                        setError("");
                        setAddModeConflict(null);
                      }}
                      style={{ marginTop: 8 }}
                    >
                      {addModeConflict.type === 'update' ? 'Switch to Update' : 'Switch to Reactivate'}
                    </Button>
                  </Box>
                )}
                {!addModeConflict && error && (
                  <InlineError message={error} fieldID="leatherColorName" />
                )}
              </>
            ) : mode === "update" ? (
              <Combobox
                activator={
                  <Combobox.TextField
                    label=""
                    value={activeLeatherColorOptions.find(opt => opt.value === selectedLeatherColorId)?.label || ""}
                    onChange={() => {}}
                    placeholder="Choose a leather color"
                    autoComplete="off"
                  />
                }
              >
                <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
                  <Listbox onSelect={value => setSelectedLeatherColorId(value)}>
                    {activeLeatherColorOptions.map(option => (
                      <Listbox.Option key={option.value} value={option.value}>
                        {option.label}
                      </Listbox.Option>
                    ))}
                  </Listbox>
                </div>
              </Combobox>
            ) : mode === "discontinue" ? (
              <Combobox
                activator={
                  <Combobox.TextField
                    label=""
                    value={activeLeatherColorOptions.find(opt => opt.value === selectedLeatherColorId)?.label || ""}
                    onChange={() => {}}
                    placeholder="Choose a leather color to discontinue"
                    autoComplete="off"
                  />
                }
              >
                <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
                  <Listbox onSelect={value => setSelectedLeatherColorId(value)}>
                    {activeLeatherColorOptions.map(option => (
                      <Listbox.Option key={option.value} value={option.value}>
                        {option.label}
                      </Listbox.Option>
                    ))}
                  </Listbox>
                </div>
              </Combobox>
            ) : mode === "reactivate" ? (
              <Combobox
                activator={
                  <Combobox.TextField
                    label=""
                    value={inactiveLeatherColorOptions.find(opt => opt.value === selectedLeatherColorId)?.label || ""}
                    onChange={() => {}}
                    placeholder="Choose a leather color to reactivate"
                    autoComplete="off"
                  />
                }
              >
                <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
                  <Listbox onSelect={value => setSelectedLeatherColorId(value)}>
                    {inactiveLeatherColorOptions.map(option => (
                      <Listbox.Option key={option.value} value={option.value}>
                        {option.label}
                      </Listbox.Option>
                    ))}
                  </Listbox>
                </div>
              </Combobox>
            ) : null}
          </Box>
          {mode !== "discontinue" && (
            <Box width="50%">
              <InlineStack gap="400" wrap={false}>
                <RadioButton
                  label="Standard Stock"
                  checked={!isLimitedEditionLeather }
                  id="standardStock"
                  name="stockType"
                  onChange={() => setIsLimitedEditionLeather(false)}
                  disabled={mode === "discontinue"}
                />
                <RadioButton
                  label="Limited Edition"
                  checked={isLimitedEditionLeather}
                  id="limitedEdition"
                  name="stockType"
                  onChange={() => setIsLimitedEditionLeather(true)}
                  disabled={mode === "discontinue" || disableLimitedEditionSwitch}
                />
              </InlineStack>
            </Box>
          )}
        </InlineStack>
      </BlockStack>
      {mode !== "discontinue" && (
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
                disabled={mode === "discontinue"}
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
      )}
      {mode !== "discontinue" && (
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
      )}
      {mode === "add" && (
        <Button primary onClick={handleCreate}>Create</Button>
      )}
      {mode === "update" && (
        <Button primary disabled>Update (not implemented)</Button>
      )}
      {mode === "reactivate" && (
        <Button primary disabled={!selectedLeatherColorId}>Reactivate (not implemented)</Button>
      )}
      <Modal
        open={modalOpen}
        onClose={handleModalClose}
        title={mode === "add" ? "Confirm New Leather Color" : "Confirm Update to Leather Color"}
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
      {mode === "discontinue" && selectedLeatherColorId && (
        <Box paddingBlock="200">
          <Text variant="bodyMd" tone="subdued">
            [Placeholder] Sets currently using this color will be listed here.
          </Text>
        </Box>
      )}
    </BlockStack>
  );
} 