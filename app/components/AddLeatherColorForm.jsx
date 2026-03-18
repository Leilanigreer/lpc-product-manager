import React, { useCallback, useMemo, useState } from "react";
import { TextField, BlockStack, InlineStack, Tag, Combobox, Listbox, Icon, Box, Button, Modal, InlineError, RadioButton, Text, Divider, Card } from "@shopify/polaris";
import { SearchIcon } from '@shopify/polaris-icons';
import { formatNameLive, formatNameOnBlur, generateLeatherAbbreviation } from '../lib/utils/colorNameUtils';

export default function AddLeatherColorForm({ leatherColors, shopifyColors = [], leatherColorsLoadError, collectionOptions = [], fetcher }) {
  const [mode, setMode] = useState("add");
  const [selectedLeatherColorId, setSelectedLeatherColorId] = useState("");
  const [leatherColorName, setLeatherColorName] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [selectedColorIds, setSelectedColorIds] = useState([]);
  const [colorInput, setColorInput] = useState("");
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [generatedAbbr, setGeneratedAbbr] = useState("");
  const [formattedName, setFormattedName] = useState("");
  const [isLimitedEditionLeather, setIsLimitedEditionLeather] = useState(false);
  const [addModeConflict, setAddModeConflict] = useState(null);
  const [showDebug, setShowDebug] = useState(true);

  const filteredColorOptions = useMemo(() => {
    const search = colorInput.toLowerCase();
    return (shopifyColors || []).filter(
      (c) => c.label.toLowerCase().includes(search) && !selectedColorIds.includes(c.value)
    ).map((c) => ({ label: c.label, value: c.value }));
  }, [shopifyColors, colorInput, selectedColorIds]);

  const resolvedCollectionOptions = useMemo(() => {
    if (collectionOptions.length) return collectionOptions;
    const names = (leatherColors || [])
      .map((lc) => lc.collectionName)
      .filter((v) => v && typeof v === "string")
      .map((v) => v.trim())
      .filter(Boolean);
    const unique = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
    return unique.map((label) => ({ label, value: label }));
  }, [collectionOptions, leatherColors]);

  const handleNameChange = useCallback((value) => {
    const formatted = formatNameLive(value);
    setLeatherColorName(formatted);
    setError("");
    setAddModeConflict(null);

    const trimmed = formatted.trim();
    if (!trimmed) return;

    const normalizedName = formatNameOnBlur(trimmed);
    const selectedCollection = (resolvedCollectionOptions || []).find(
      (c) => c.value === selectedCollectionId
    );
    const currentCollectionName = selectedCollection?.value || null;

    const match = (leatherColors || []).find((lc) => {
      const lcName = formatNameOnBlur(lc.label || "");
      const lcCollection = lc.collectionName || null;
      return lcName === normalizedName && lcCollection === currentCollectionName;
    });

    if (match) {
      if (match.isActive) {
        setError("This color already exists for this collection and is active. Would you like to update it?");
        setAddModeConflict({ type: "update", color: match });
      } else {
        setError("This color exists for this collection but is discontinued. Would you like to reactivate it?");
        setAddModeConflict({ type: "reactivate", color: match });
      }
    }
  }, [leatherColors, resolvedCollectionOptions, selectedCollectionId]);

  const handleNameBlur = useCallback(() => {
    const formatted = formatNameOnBlur(leatherColorName);
    setLeatherColorName(formatted);
    setFormattedName(formatted);
    setError("");
    setAddModeConflict(null);

    const trimmed = formatted.trim();
    if (!trimmed || !(leatherColors?.length)) return;

    const normalizedName = formatNameOnBlur(trimmed);
    const selectedCollection = (resolvedCollectionOptions || []).find(
      (c) => c.value === selectedCollectionId
    );
    const currentCollectionName = selectedCollection?.value || null;

    const match = (leatherColors || []).find((lc) => {
      const lcName = formatNameOnBlur(lc.label || "");
      const lcCollection = lc.collectionName || null;
      return lcName === normalizedName && lcCollection === currentCollectionName;
    });

    if (match) {
      if (match.isActive) {
        setError("This color already exists for this collection and is active. Would you like to update it?");
        setAddModeConflict({ type: "update", color: match });
      } else {
        setError("This color exists for this collection but is discontinued. Would you like to reactivate it?");
        setAddModeConflict({ type: "reactivate", color: match });
      }
    }
  }, [leatherColorName, leatherColors, resolvedCollectionOptions, selectedCollectionId]);

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
    setError("");
    setAddModeConflict(null);

    if (!formatted?.trim()) {
      setError("Leather color name is required.");
      return;
    }
    if (!selectedColorIds.length) {
      setError("At least one color is required. Please select a color from the Color metaobject list.");
      return;
    }

    if (!isLimitedEditionLeather && !selectedCollectionId) {
      setError("Collection is required for Standard Stock leather colors.");
      return;
    }

    const normalizedName = formatNameOnBlur(formatted);
    const selectedCollection = (resolvedCollectionOptions || []).find(
      (c) => c.value === selectedCollectionId
    );
    const currentCollectionName = selectedCollection?.value || null;

    const match = (leatherColors || []).find((lc) => {
      const lcName = formatNameOnBlur(lc.label || "");
      const lcCollection = lc.collectionName || null;
      return lcName === normalizedName && lcCollection === currentCollectionName;
    });

    if (match) {
      if (match.isActive) {
        setError("This leather color name already exists for this collection. Would you like to update it instead?");
        setAddModeConflict({ type: "update", color: match });
      } else {
        setError("This color exists for this collection but is discontinued. Would you like to reactivate it?");
        setAddModeConflict({ type: "reactivate", color: match });
      }
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
  }, [leatherColorName, leatherColors, selectedColorIds, isLimitedEditionLeather, selectedCollectionId, resolvedCollectionOptions]);

  const handleConfirm = useCallback(() => {
    if (!formattedName?.trim() || !generatedAbbr?.trim() || !selectedColorIds.length) return;

    const formData = new FormData();
    formData.append("name", formattedName);
    formData.append("abbreviation", generatedAbbr);
    formData.append("isLimitedEditionLeather", isLimitedEditionLeather ? "true" : "false");
    const selectedCollection = (resolvedCollectionOptions || []).find((c) => c.value === selectedCollectionId);
    if (selectedCollection && selectedCollection.value) {
      formData.append("collectionName", selectedCollection.value);
    }
    selectedColorIds.forEach((id) => formData.append("colorMetaobjectIds", id));
    fetcher.submit(formData, { method: "post" });
    setModalOpen(false);
    setLeatherColorName("");
    setSelectedCollectionId("");
    setSelectedColorIds([]);
    setColorInput("");
    setGeneratedAbbr("");
    setFormattedName("");
    setIsLimitedEditionLeather(false);
    setError("");
  }, [formattedName, generatedAbbr, isLimitedEditionLeather, selectedColorIds, selectedCollectionId, resolvedCollectionOptions, fetcher]);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
  }, []);

  // Leather color options for update/reactivate mode (from Shopify leather_color list)
  const leatherColorOptions = useMemo(() => {
    return (leatherColors || []).map((lc) => {
      const collectionName = lc.collectionName || lc.collection || null;
      const baseLabel = lc.label;
      const labelWithCollection = collectionName
        ? `[${collectionName}] ${baseLabel}`
        : baseLabel;
      return {
        label: labelWithCollection,
        value: lc.value,
        abbreviation: lc.abbreviation,
        isLimitedEditionLeather: lc.isLimitedEditionLeather,
        isActive: lc.isActive,
        colorMetaobjectIds: lc.colorMetaobjectIds || [],
        collectionName,
        baseLabel,
      };
    });
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

  // In update mode, allow toggling Standard vs Limited Edition (with note that product state is unchanged until business logic is sorted)
  const disableLimitedEditionSwitch = mode === "discontinue";

  // Selected leather in update mode (for change detection)
  const selectedLeatherForUpdate = useMemo(() => {
    if ((mode !== "update" && mode !== "reactivate") || !selectedLeatherColorId) return null;
    return leatherColorOptions.find((opt) => opt.value === selectedLeatherColorId) || null;
  }, [mode, selectedLeatherColorId, leatherColorOptions]);

  const hasUpdateChanges = useMemo(() => {
    if (!selectedLeatherForUpdate) return false;
    const sameType = selectedLeatherForUpdate.isLimitedEditionLeather === isLimitedEditionLeather;
    const orig = (selectedLeatherForUpdate.colorMetaobjectIds || []).slice().sort();
    const curr = selectedColorIds.slice().sort();
    const sameColors = orig.length === curr.length && orig.every((id, i) => id === curr[i]);
    return !sameType || !sameColors;
  }, [selectedLeatherForUpdate, isLimitedEditionLeather, selectedColorIds]);

  // Debug: existing abbreviations used for abbreviation generation
  const debugExistingAbbrs = useMemo(() => {
    return (leatherColors || [])
      .map((lc) => (lc.abbreviation != null ? String(lc.abbreviation).trim() : ""))
      .filter(Boolean);
  }, [leatherColors]);

  const canCreate =
    mode === "add" &&
    formatNameOnBlur(leatherColorName).trim() !== "" &&
    selectedColorIds.length > 0 &&
    !addModeConflict;

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
          <Text tone="info" variant="bodyMd">
            Changing stock type or colors here does not change any current product states until business logic is defined.
          </Text>
          {selectedLeatherForUpdate && !selectedLeatherForUpdate.isActive && (
            <Box paddingBlockStart="100">
              <Text tone="subdued" variant="bodyMd">
                This leather color is currently in draft. Saving with “Update and Set as Active” will make it active for new products.
              </Text>
            </Box>
          )}
        </Box>
      )}
      {mode === "discontinue" && (
        <Box paddingBlock="200">
          <Text tone="critical" variant="bodyMd">
            Discontinuing sets the leather color to draft and removes it from the product creation list. It does not yet update existing products that use this leather.
          </Text>
        </Box>
      )}

      {mode === "add" && (
        <BlockStack gap="100">
          <InlineStack gap="800" align="start" wrap={false}>
            <Box width="50%">
              <Text variant="bodyMd" as="label" fontWeight="medium">
                Stock Type
              </Text>
            </Box>
            <Box width="50%">
              <Text variant="bodyMd" as="label" fontWeight="medium">
                Collection
              </Text>
            </Box>
          </InlineStack>
          <InlineStack gap="800" align="start" wrap={false}>
            <Box width="50%">
              <InlineStack gap="400" wrap={false}>
                <RadioButton
                  label="Standard Stock"
                  checked={!isLimitedEditionLeather}
                  id="standardStock-add"
                  name="stockType-add"
                  onChange={() => setIsLimitedEditionLeather(false)}
                />
                <RadioButton
                  label="Limited Edition"
                  checked={isLimitedEditionLeather}
                  id="limitedEdition-add"
                  name="stockType-add"
                  onChange={() => setIsLimitedEditionLeather(true)}
                />
              </InlineStack>
            </Box>
            <Box width="50%">
              <Combobox
                activator={
                  <Combobox.TextField
                    label=""
                    value={
                      (collectionOptions.find((c) => c.value === selectedCollectionId)?.label) || ""
                    }
                    onChange={() => {}}
                    placeholder={
                      isLimitedEditionLeather
                        ? "Optional for Limited Edition"
                        : "Required for Standard Stock"
                    }
                    autoComplete="off"
                    requiredIndicator={!isLimitedEditionLeather}
                  />
                }
              >
                <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
                  <Listbox onSelect={(value) => setSelectedCollectionId(value)}>
                    {collectionOptions.map((collection) => (
                      <Listbox.Option key={collection.value} value={collection.value}>
                        {collection.label}
                      </Listbox.Option>
                    ))}
                  </Listbox>
                </div>
              </Combobox>
            </Box>
          </InlineStack>

          <Box paddingBlockStart="300">
            <InlineStack gap="800" align="start" wrap={false}>
              <Box width="50%">
                <Text variant="bodyMd" as="label" fontWeight="medium">
                  Leather color name
                </Text>
              </Box>
              <Box width="50%">
                <Text variant="bodyMd" as="label" fontWeight="medium">
                  Add color(s)
                </Text>
              </Box>
            </InlineStack>
            <InlineStack gap="800" align="start" wrap={false}>
              <Box width="50%">
                <TextField
                  id="leatherColorNameInput"
                  label=""
                  value={leatherColorName}
                  onChange={handleNameChange}
                  onBlur={handleNameBlur}
                  autoComplete="off"
                  placeholder="Enter new leather color name (required)"
                  requiredIndicator
                />
              </Box>
              <Box width="50%">
                <Combobox
                  activator={
                    <Combobox.TextField
                      prefix={<Icon source={SearchIcon} />}
                      onChange={setColorInput}
                      label=""
                      value={colorInput}
                      placeholder="Search or select at least one color (Shopify Color metaobject)"
                      autoComplete="off"
                      requiredIndicator
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
            </InlineStack>
          </Box>

          {addModeConflict && (
            <Box paddingBlock="200">
              <Text tone="critical" variant="bodyMd">
                {error}
              </Text>
              <Button
                size="slim"
                onClick={() => {
                  if (addModeConflict.type === "update") {
                    setMode("update");
                    setSelectedLeatherColorId(addModeConflict.color.value);
                  } else if (addModeConflict.type === "reactivate") {
                    setMode("reactivate");
                    setSelectedLeatherColorId(addModeConflict.color.value);
                  }
                  setError("");
                  setAddModeConflict(null);
                }}
                style={{ marginTop: 8 }}
              >
                {addModeConflict.type === "update" ? "Switch to Update" : "Switch to Reactivate"}
              </Button>
            </Box>
          )}
          {!addModeConflict && error && (
            <InlineError message={error} fieldID="leatherColorName" />
          )}
        </BlockStack>
      )}
      {mode !== "add" && (
      <BlockStack gap="100">
        {mode !== "discontinue" && (
          <InlineStack gap="800" align="start" wrap={false}>
            <Box width="50%">
              <Text variant="bodyMd" as="label" fontWeight="medium">
                Stock Type
              </Text>
            </Box>
            <Box width="50%">
              <Text variant="bodyMd" as="label" fontWeight="medium">
                Collection & Name
              </Text>
            </Box>
          </InlineStack>
        )}
        <InlineStack gap="800" align="start" wrap={false}>
            <Box width="50%">
              {mode !== "discontinue" && (
                <InlineStack gap="400" wrap={false}>
                  <RadioButton
                    label="Standard Stock"
                    checked={!isLimitedEditionLeather}
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
              )}
            </Box>
          <Box width="50%">
            {mode === "add" ? (
              <>
                <InlineStack gap="200" wrap={false}>
                  <Box width="50%">
                    <Combobox
                      activator={
                        <Combobox.TextField
                          label="Collection"
                          value={
                            (resolvedCollectionOptions.find((c) => c.value === selectedCollectionId)?.label) || ""
                          }
                          onChange={() => {}}
                          placeholder={isLimitedEditionLeather ? "Optional for Limited Edition" : "Required for Standard Stock"}
                          autoComplete="off"
                          requiredIndicator={!isLimitedEditionLeather}
                        />
                      }
                    >
                      <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
                        <Listbox onSelect={(value) => setSelectedCollectionId(value)}>
                          {resolvedCollectionOptions.map((collection) => (
                            <Listbox.Option key={collection.value} value={collection.value}>
                              {collection.label}
                            </Listbox.Option>
                          ))}
                        </Listbox>
                      </div>
                    </Combobox>
                  </Box>
                  <Box width="50%">
                    <TextField
                      id="leatherColorNameInput"
                      label="Leather color name"
                      value={leatherColorName}
                      onChange={handleNameChange}
                      onBlur={handleNameBlur}
                      autoComplete="off"
                      placeholder="Enter new leather color name (required)"
                      requiredIndicator
                    />
                  </Box>
                </InlineStack>
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
                    label="Leather color"
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
                    label="Leather color"
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
                    label="Leather color"
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
          {/* right side empty for non-add; colors selector is rendered below */}
        </InlineStack>
      </BlockStack>
      )}
      {mode !== "add" && mode !== "discontinue" && (
        <Box width="100%">
          <Combobox
            activator={
              <Combobox.TextField
                prefix={<Icon source={SearchIcon} />}
                onChange={setColorInput}
                label={mode === "update" ? "Add or remove color(s)" : "Add color(s) (required)"}
                value={colorInput}
                placeholder={mode === "update" ? "Search or select colors (Shopify Color metaobject)" : "Search or select at least one color (Shopify Color metaobject)"}
                autoComplete="off"
                disabled={mode === "discontinue"}
                requiredIndicator={mode !== "update"}
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
        <Button primary onClick={handleCreate} disabled={!canCreate}>
          Create
        </Button>
      )}
      {mode === "update" && (
        <Button
          primary
          disabled={!selectedLeatherColorId || !hasUpdateChanges}
          onClick={() => {
            const formData = new FormData();
            formData.append("actionType", "updateLeatherColor");
            formData.append("leatherColorId", selectedLeatherColorId);
            formData.append("isLimitedEditionLeather", isLimitedEditionLeather ? "true" : "false");
            selectedColorIds.forEach((id) => formData.append("colorMetaobjectIds", id));
            if (selectedLeatherForUpdate && !selectedLeatherForUpdate.isActive) {
              formData.append("setActive", "true");
            }
            fetcher.submit(formData, { method: "post" });
          }}
        >
          {selectedLeatherForUpdate && !selectedLeatherForUpdate.isActive
            ? "Update and Set as Active"
            : "Update"}
        </Button>
      )}
      {mode === "reactivate" && (
        <Button
          primary
          disabled={!selectedLeatherColorId || !hasUpdateChanges}
          onClick={() => {
            const formData = new FormData();
            formData.append("actionType", "reactivateLeatherColor");
            formData.append("leatherColorId", selectedLeatherColorId);
            formData.append("isLimitedEditionLeather", isLimitedEditionLeather ? "true" : "false");
            selectedColorIds.forEach((id) => formData.append("colorMetaobjectIds", id));
            formData.append("setActive", "true");
            fetcher.submit(formData, { method: "post" });
          }}
        >
          Update and Set as Active
        </Button>
      )}
      {mode === "discontinue" && (
        <Button
          primary
          tone="critical"
          disabled={!selectedLeatherColorId}
          onClick={() => {
            const selected = activeLeatherColorOptions.find((opt) => opt.value === selectedLeatherColorId);
            const formData = new FormData();
            formData.append("actionType", "discontinueLeatherColor");
            formData.append("leatherColorId", selectedLeatherColorId);
            // Preserve current type and colors when moving to draft
            formData.append(
              "isLimitedEditionLeather",
              selected && selected.isLimitedEditionLeather ? "true" : "false"
            );
            (selected?.colorMetaobjectIds || []).forEach((id) =>
              formData.append("colorMetaobjectIds", id)
            );
            fetcher.submit(formData, { method: "post" });
          }}
        >
          Discontinue (set to draft)
        </Button>
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
            Sets currently using this color will be shown here in the future. For now, discontinuing only affects new product creation.
          </Text>
        </Box>
      )}

      {/* Debug: object data for abbreviation / duplicate-name troubleshooting */}
      {showDebug && (
        <Card>
          <BlockStack gap="200">
            <InlineStack align="space-between" blockAlign="center">
              <Text variant="headingSm">Debug: leather color data</Text>
              <Button size="slim" onClick={() => setShowDebug(false)}>
                Hide
              </Button>
            </InlineStack>
            <Text variant="bodyMd" tone="subdued">
              Loaded leather colors: {(leatherColors || []).length}. Existing abbreviations used when generating a new one: [{debugExistingAbbrs.join(", ") || "(none)"}]
            </Text>
            {leatherColorsLoadError && (
              <Text variant="bodyMd" tone="critical">
                Load error: {leatherColorsLoadError}
              </Text>
            )}
            <Box paddingBlockStart="200">
              <Text variant="bodyMd" fontWeight="semibold">Per-item (collection, label, abbreviation):</Text>
              <BlockStack gap="100">
                {(leatherColors || []).slice(0, 50).map((lc) => (
                  <Text key={lc.value ?? lc.id} variant="bodyMd" tone="subdued" as="p">
                    {JSON.stringify({
                      collectionName: lc.collectionName ?? null,
                      label: lc.label,
                      abbreviation:
                        lc.abbreviation == null ? "(null)" : lc.abbreviation === "" ? '""' : lc.abbreviation,
                    })}
                  </Text>
                ))}
                {(leatherColors || []).length > 50 && (
                  <Text variant="bodyMd" tone="subdued">… and {(leatherColors || []).length - 50} more</Text>
                )}
              </BlockStack>
            </Box>
          </BlockStack>
        </Card>
      )}
      {!showDebug && (
        <Button size="slim" onClick={() => setShowDebug(true)}>
          Show debug (leather data)
        </Button>
      )}
    </BlockStack>
  );
} 