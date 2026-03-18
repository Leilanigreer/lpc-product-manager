import React, { useCallback, useMemo, useState } from "react";
import { TextField, BlockStack, InlineStack, Tag, Combobox, Listbox, Icon, Box, Button, Modal, InlineError, RadioButton, Text, Divider } from "@shopify/polaris";
import { SearchIcon } from '@shopify/polaris-icons';
import { formatNameLive, formatNameOnBlur, validateNameUnique, generateLeatherAbbreviation } from '../lib/utils/colorNameUtils';

export default function AddLeatherColorForm({ leatherColors, shopifyColors = [], fetcher }) {
  const [mode, setMode] = useState("add");
  const [selectedLeatherColorId, setSelectedLeatherColorId] = useState("");
  const [leatherColorName, setLeatherColorName] = useState("");
  const [selectedColorIds, setSelectedColorIds] = useState([]);
  const [colorInput, setColorInput] = useState("");
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [generatedAbbr, setGeneratedAbbr] = useState("");
  const [formattedName, setFormattedName] = useState("");
  const [isLimitedEditionLeather, setIsLimitedEditionLeather] = useState(false);
  const [addModeConflict, setAddModeConflict] = useState(null);

  const filteredColorOptions = useMemo(() => {
    const search = colorInput.toLowerCase();
    return (shopifyColors || []).filter(
      (c) => c.label.toLowerCase().includes(search) && !selectedColorIds.includes(c.value)
    ).map((c) => ({ label: c.label, value: c.value }));
  }, [shopifyColors, colorInput, selectedColorIds]);

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

  const handleColorSelect = useCallback((value) => {
    if (!selectedColorIds.includes(value)) {
      setSelectedColorIds((prev) => [...prev, value]);
    }
    setColorInput("");
  }, [selectedColorIds]);

  const handleRemoveColor = useCallback((colorId) => {
    setSelectedColorIds((prev) => prev.filter((id) => id !== colorId));
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
    const existingAbbrs = (leatherColors || [])
      .map((lc) => lc.abbreviation)
      .filter((abbr) => abbr != null && String(abbr).trim() !== "");
    const abbr = generateLeatherAbbreviation(formatted, existingAbbrs);
    if (!abbr) {
      setError("Could not generate abbreviation. Please use a name with at least one letter.");
      return;
    }
    setGeneratedAbbr(abbr);
    setModalOpen(true);
    setError("");
  }, [leatherColorName, leatherColors]);

  const handleConfirm = useCallback(() => {
    const formData = new FormData();
    formData.append('name', formattedName);
    formData.append('abbreviation', generatedAbbr);
    formData.append('isLimitedEditionLeather', isLimitedEditionLeather ? 'true' : 'false');
    selectedColorIds.forEach((id) => formData.append('colorMetaobjectIds', id));
    fetcher.submit(formData, { method: 'post' });
    setModalOpen(false);
    setLeatherColorName("");
    setSelectedColorIds([]);
    setColorInput("");
    setGeneratedAbbr("");
    setFormattedName("");
    setIsLimitedEditionLeather(false);
    setError("");
  }, [formattedName, generatedAbbr, isLimitedEditionLeather, selectedColorIds, fetcher]);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
  }, []);

  // Leather color options for update/reactivate mode (from Shopify leather_color list)
  const leatherColorOptions = useMemo(() => {
    return (leatherColors || []).map((lc) => ({
      label: lc.label,
      value: lc.value,
      abbreviation: lc.abbreviation,
      isLimitedEditionLeather: lc.isLimitedEditionLeather,
      isActive: lc.isActive,
      colorMetaobjectIds: lc.colorMetaobjectIds || [],
    }));
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

  // When switching to update mode or selecting a leather color, pre-fill fields
  React.useEffect(() => {
    if (mode === "update" && selectedLeatherColorId) {
      const selected = leatherColorOptions.find(opt => opt.value === selectedLeatherColorId);
      if (selected) {
        setLeatherColorName(selected.label);
        setFormattedName(selected.label);
        setGeneratedAbbr(selected.abbreviation || "");
        setIsLimitedEditionLeather(!!selected.isLimitedEditionLeather);
        setSelectedColorIds(selected.colorMetaobjectIds || []);
      }
    }
    if (mode === "add") {
      setLeatherColorName("");
      setFormattedName("");
      setGeneratedAbbr("");
      setIsLimitedEditionLeather(false);
      setSelectedColorIds([]);
      setSelectedLeatherColorId("");
    }
    if (mode === "reactivate" && selectedLeatherColorId) {
      const selected = leatherColorOptions.find(opt => opt.value === selectedLeatherColorId);
      if (selected) {
        setLeatherColorName(selected.label);
        setFormattedName(selected.label);
        setGeneratedAbbr(selected.abbreviation || "");
        setIsLimitedEditionLeather(!!selected.isLimitedEditionLeather);
        setSelectedColorIds(selected.colorMetaobjectIds || []);
      }
    }
  }, [mode, selectedLeatherColorId, leatherColorOptions]);

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
                onChange={setColorInput}
                label="Add color(s)"
                value={colorInput}
                placeholder="Search or select colors (Shopify Color metaobject)"
                autoComplete="off"
                disabled={mode === "discontinue"}
              />
            }
          >
            {filteredColorOptions.length > 0 && (
              <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
                <Listbox onSelect={handleColorSelect}>
                  {filteredColorOptions.map((option) => (
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
          {selectedColorIds.map((colorId) => {
            const colorObj = shopifyColors.find((c) => c.value === colorId);
            return colorObj ? (
              <Tag key={colorId} onRemove={() => handleRemoveColor(colorId)}>
                {colorObj.label}
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
            <Text><b>Colors:</b> {selectedColorIds.map((id) => {
              const c = shopifyColors.find((x) => x.value === id);
              return c ? c.label : id;
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