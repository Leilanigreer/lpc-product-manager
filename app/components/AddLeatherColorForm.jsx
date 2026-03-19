import React, { useCallback, useMemo, useState } from "react";
import { useFetcher } from "@remix-run/react";
import { TextField, BlockStack, InlineStack, Tag, Combobox, Listbox, Icon, Box, Button, Modal, InlineError, RadioButton, Text, Divider, Card, Checkbox, Spinner, Tooltip } from "@shopify/polaris";
import { SearchIcon } from '@shopify/polaris-icons';
import { formatNameLive, formatNameOnBlur, generateLeatherAbbreviation, buildLeatherBlendedCollectionName } from '../lib/utils/colorNameUtils';

const LINKED_PRODUCT_ACTION_KEYS = [
  { key: "removeContinueSellingWhenOos", short: "CSOOS", hint: "Turn off “Continue selling when out of stock” (deny when out of stock)" },
  { key: "removeCustomizableOptions", short: "Custom", hint: "Remove customizable options / offering" },
  { key: "applyDiscount40", short: "−40%", hint: "Apply 40% discount" },
  { key: "applyDiscount60", short: "−60%", hint: "Apply 60% discount" },
];

export default function AddLeatherColorForm({ leatherColors, shopifyColors = [], leatherColorsLoadError, collectionOptions = [], fetcher }) {
  const linkedProductsFetcher = useFetcher();
  const [linkedProductActions, setLinkedProductActions] = useState({});
  const [actionsValidationModalOpen, setActionsValidationModalOpen] = useState(false);
  const [pendingProductActionSubmit, setPendingProductActionSubmit] = useState(null);
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
  const [crossCollectionInfo, setCrossCollectionInfo] = useState(null);
  const prevModeRef = React.useRef(mode);

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
    setCrossCollectionInfo(null);

    const trimmed = formatted.trim();
    if (!trimmed) return;

    const normalizedName = formatNameOnBlur(trimmed);
    const selectedCollection = (resolvedCollectionOptions || []).find(
      (c) => c.value === selectedCollectionId
    );
    const currentCollectionName = selectedCollection?.value || null;

    const allMatches = (leatherColors || []).filter((lc) => {
      const lcName = formatNameOnBlur(lc.label || "");
      return lcName === normalizedName;
    });

    const sameCollectionMatch = allMatches.find(
      (lc) => (lc.collectionName || null) === currentCollectionName
    );
    const otherCollectionMatch = allMatches.find(
      (lc) => (lc.collectionName || null) !== currentCollectionName
    );

    if (sameCollectionMatch) {
      if (sameCollectionMatch.isActive) {
        setError("This color already exists for this collection and is active. Would you like to update it?");
        setAddModeConflict({ type: "update", color: sameCollectionMatch });
      } else {
        setError("This color exists for this collection but is discontinued. Would you like to reactivate it?");
        setAddModeConflict({ type: "reactivate", color: sameCollectionMatch });
      }
    } else if (otherCollectionMatch) {
      const otherCollection = otherCollectionMatch.collectionName || "another collection";
      setError(
        `This color name already exists in collection “${otherCollection}”. Creating it here will also discontinue the existing collection/color combination.`
      );
      setCrossCollectionInfo({
        fromCollectionName: otherCollectionMatch.collectionName || null,
        name: otherCollectionMatch.label || trimmed,
      });
      // Do NOT set addModeConflict here so the user can still proceed with Create
    }
  }, [leatherColors, resolvedCollectionOptions, selectedCollectionId]);

  const handleNameBlur = useCallback(() => {
    const formatted = formatNameOnBlur(leatherColorName);
    setLeatherColorName(formatted);
    setFormattedName(formatted);
    setError("");
    setAddModeConflict(null);
    setCrossCollectionInfo(null);

    const trimmed = formatted.trim();
    if (!trimmed || !(leatherColors?.length)) return;

    const normalizedName = formatNameOnBlur(trimmed);
    const selectedCollection = (resolvedCollectionOptions || []).find(
      (c) => c.value === selectedCollectionId
    );
    const currentCollectionName = selectedCollection?.value || null;

    const allMatches = (leatherColors || []).filter((lc) => {
      const lcName = formatNameOnBlur(lc.label || "");
      return lcName === normalizedName;
    });

    const sameCollectionMatch = allMatches.find(
      (lc) => (lc.collectionName || null) === currentCollectionName
    );
    const otherCollectionMatch = allMatches.find(
      (lc) => (lc.collectionName || null) !== currentCollectionName
    );

    if (sameCollectionMatch) {
      if (sameCollectionMatch.isActive) {
        setError("This color already exists for this collection and is active. Would you like to update it?");
        setAddModeConflict({ type: "update", color: sameCollectionMatch });
      } else {
        setError("This color exists for this collection but is discontinued. Would you like to reactivate it?");
        setAddModeConflict({ type: "reactivate", color: sameCollectionMatch });
      }
    } else if (otherCollectionMatch) {
      const otherCollection = otherCollectionMatch.collectionName || "another collection";
      setError(
        `This color name already exists in collection “${otherCollection}”. Creating it here will also discontinue the existing collection/color combination.`
      );
      setCrossCollectionInfo({
        fromCollectionName: otherCollectionMatch.collectionName || null,
        name: otherCollectionMatch.label || trimmed,
      });
      // Informational only; user can still Create to trigger clone + draft behavior on the server
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

  // On mode change: reset everything. Then pre-fill only when a leather is selected (Update/Reactivate).
  // prevModeRef avoids prefill running with a stale selectedLeatherColorId from the previous mode in the same tick.
  React.useEffect(() => {
    const modeChanged = prevModeRef.current !== mode;
    if (modeChanged) {
      prevModeRef.current = mode;
      setSelectedLeatherColorId("");
      setLeatherColorName("");
      setSelectedCollectionId("");
      setSelectedColorIds([]);
      setColorInput("");
      setError("");
      setModalOpen(false);
      setGeneratedAbbr("");
      setFormattedName("");
      setIsLimitedEditionLeather(false);
      setAddModeConflict(null);
      setCrossCollectionInfo(null);
      return;
    }
    if ((mode !== "update" && mode !== "reactivate") || !selectedLeatherColorId) return;
    const selected = leatherColorOptions.find((opt) => opt.value === selectedLeatherColorId);
    if (selected) {
      setLeatherColorName(selected.label);
      setFormattedName(selected.label);
      setGeneratedAbbr(selected.abbreviation || "");
      setIsLimitedEditionLeather(!!selected.isLimitedEditionLeather);
      setSelectedColorIds(selected.colorMetaobjectIds || []);
    }
  }, [mode, selectedLeatherColorId, leatherColorOptions]);

  React.useEffect(() => {
    setLinkedProductActions({});
  }, [selectedLeatherColorId, mode]);

  React.useEffect(() => {
    if (mode !== "update" && mode !== "discontinue") return;
    if (!selectedLeatherColorId) return;
    const q = new URLSearchParams({ leatherColorId: selectedLeatherColorId });
    linkedProductsFetcher.load(`/app/api/leather-color-products?${q}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load when selection/mode changes only
  }, [mode, selectedLeatherColorId]);

  const linkedProducts = useMemo(
    () => linkedProductsFetcher.data?.products ?? [],
    [linkedProductsFetcher.data]
  );
  const linkedProductsError = linkedProductsFetcher.data?.error ?? null;
  const linkedProductsLoading =
    linkedProductsFetcher.state === "loading" || linkedProductsFetcher.state === "submitting";

  React.useEffect(() => {
    // Initialize checkbox defaults from current inventory policies.
    if (linkedProductsLoading) return;
    if (!linkedProducts.length) return;

    const next = {};
    linkedProducts.forEach((p) => {
      next[p.shopifyProductId] = {
        removeContinueSellingWhenOos: !!p.hasContinueSelling,
        removeCustomizableOptions: !!p.hasCustomizable || !!p.hasCustomizableTag,
        applyDiscount40: !!p.hasDiscount40,
        applyDiscount60: !!p.hasDiscount60,
      };
    });
    setLinkedProductActions(next);
  }, [linkedProductsLoading, linkedProducts]);

  const setLinkedAction = useCallback((shopifyProductId, actionKey, checked) => {
    setLinkedProductActions((prev) => ({
      ...prev,
      [shopifyProductId]: {
        ...prev[shopifyProductId],
        [actionKey]: checked,
      },
    }));
  }, []);

  const buildDefaultProductActions = useCallback((product) => ({
    removeContinueSellingWhenOos: !!product.hasContinueSelling,
    removeCustomizableOptions: !!product.hasCustomizable || !!product.hasCustomizableTag,
    applyDiscount40: !!product.hasDiscount40,
    applyDiscount60: !!product.hasDiscount60,
  }), []);

  const productActionDiffs = useMemo(() => {
    const diffs = [];
    linkedProducts.forEach((p) => {
      const defaults = buildDefaultProductActions(p);
      const current = linkedProductActions[p.shopifyProductId] || defaults;
      const changedKeys = LINKED_PRODUCT_ACTION_KEYS
        .map((a) => a.key)
        .filter((k) => !!current[k] !== !!defaults[k]);
      if (changedKeys.length) {
        diffs.push({
          product: p,
          changedKeys,
          current,
          defaults,
        });
      }
    });
    return diffs;
  }, [linkedProducts, linkedProductActions, buildDefaultProductActions]);

  const hasLinkedActionChanges = productActionDiffs.length > 0;

  const appendLinkedProductActionsPayload = useCallback((formData) => {
    const payload = linkedProducts.map((p) => {
      const defaults = buildDefaultProductActions(p);
      const current = linkedProductActions[p.shopifyProductId] || defaults;
      return {
        shopifyProductId: p.shopifyProductId,
        title: p.title,
        actions: {
          removeContinueSellingWhenOos: !!current.removeContinueSellingWhenOos,
          removeCustomizableOptions: !!current.removeCustomizableOptions,
          applyDiscount40: !!current.applyDiscount40,
          applyDiscount60: !!current.applyDiscount60,
        },
        baseline: defaults,
        tags: p.tags || [],
      };
    });
    formData.append("linkedProductActions", JSON.stringify(payload));
  }, [linkedProducts, linkedProductActions, buildDefaultProductActions]);

  const submitUpdateLeatherColor = useCallback(() => {
    const formData = new FormData();
    formData.append("actionType", "updateLeatherColor");
    formData.append("leatherColorId", selectedLeatherColorId);
    formData.append("isLimitedEditionLeather", isLimitedEditionLeather ? "true" : "false");
    selectedColorIds.forEach((id) => formData.append("colorMetaobjectIds", id));
    if (selectedLeatherForUpdate && !selectedLeatherForUpdate.isActive) {
      formData.append("setActive", "true");
    }
    if (selectedLeatherForUpdate) {
      const blended = buildLeatherBlendedCollectionName(
        selectedLeatherForUpdate.collectionName,
        selectedLeatherForUpdate.baseLabel
      );
      if (blended) formData.append("blendedCollectionName", blended);
    }
    appendLinkedProductActionsPayload(formData);
    fetcher.submit(formData, { method: "post" });
  }, [
    selectedLeatherColorId,
    isLimitedEditionLeather,
    selectedColorIds,
    selectedLeatherForUpdate,
    appendLinkedProductActionsPayload,
    fetcher,
  ]);

  const submitDiscontinueLeatherColor = useCallback(() => {
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
    const blended = buildLeatherBlendedCollectionName(
      selected?.collectionName,
      selected?.baseLabel
    );
    if (blended) formData.append("blendedCollectionName", blended);
    appendLinkedProductActionsPayload(formData);
    fetcher.submit(formData, { method: "post" });
  }, [
    activeLeatherColorOptions,
    selectedLeatherColorId,
    appendLinkedProductActionsPayload,
    fetcher,
  ]);

  const openActionsValidationModal = useCallback((submitType) => {
    setPendingProductActionSubmit(submitType);
    setActionsValidationModalOpen(true);
  }, []);

  const handleConfirmActionsValidation = useCallback(() => {
    if (pendingProductActionSubmit === "update") {
      submitUpdateLeatherColor();
    } else if (pendingProductActionSubmit === "discontinue") {
      submitDiscontinueLeatherColor();
    }
    setActionsValidationModalOpen(false);
    setPendingProductActionSubmit(null);
  }, [pendingProductActionSubmit, submitUpdateLeatherColor, submitDiscontinueLeatherColor]);

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
      {mode === "update" && selectedLeatherForUpdate && !selectedLeatherForUpdate.isActive && (
        <Box paddingBlock="200">
          <Text tone="subdued" variant="bodyMd">
            This leather color is currently in draft. Saving with “Update and Set as Active” will make it active for new products.
          </Text>
        </Box>
      )}
      {/* {mode === "discontinue" && (
        <Box paddingBlock="200">
          <Text tone="critical" variant="bodyMd">
            Discontinuing sets the leather color to draft and removes it from the product creation list. Use the checklist below to plan changes for live products that still use this leather (actions are not applied automatically yet).
          </Text>
        </Box>
      )} */}

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
                <BlockStack gap="200">
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
                </BlockStack>
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

      {mode === "add" && crossCollectionInfo && (
        <Box paddingBlock="300">
          <Card>
            <BlockStack gap="100">
              <Text variant="headingSm">Existing collection/color will be updated later</Text>
              <Text variant="bodyMd">
                This color name already exists in
                {crossCollectionInfo.fromCollectionName
                  ? ` collection “${crossCollectionInfo.fromCollectionName}”`
                  : " another collection"}
                . Creating it here will also set that existing collection/color combination to draft.
              </Text>
              <Text variant="bodyMd" tone="subdued">
                In a future step, this area will surface all products currently using that collection/color so you can
                update availability (continue selling when out of stock), remove customization options, and adjust pricing or discounts.
              </Text>
            </BlockStack>
          </Card>
        </Box>
      )}
        </BlockStack>
      )}
      {mode !== "add" && (
      <BlockStack gap="100">
        {mode === "discontinue" ? (
          <>
            <Text variant="bodyMd" as="label" fontWeight="medium">
              Collection & Leather Color Name
            </Text>
            <Combobox
              activator={
                <Combobox.TextField
                  label="Leather color"
                  labelHidden
                  value={activeLeatherColorOptions.find((opt) => opt.value === selectedLeatherColorId)?.label || ""}
                  onChange={() => {}}
                  placeholder="Choose a leather color to discontinue"
                  autoComplete="off"
                />
              }
            >
              <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
                <Listbox onSelect={(value) => setSelectedLeatherColorId(value)}>
                  {activeLeatherColorOptions.map((option) => (
                    <Listbox.Option key={option.value} value={option.value}>
                      {option.label}
                    </Listbox.Option>
                  ))}
                </Listbox>
              </div>
            </Combobox>
          </>
        ) : (
          <>
            <InlineStack gap="800" align="start" wrap={false}>
              <Box width="50%">
                <Text variant="bodyMd" as="label" fontWeight="medium">
                  Collection & Leather Color Name
                </Text>
              </Box>
              <Box width="50%">
                <Text variant="bodyMd" as="label" fontWeight="medium">
                  Stock Type
                </Text>
              </Box>
            </InlineStack>
            <InlineStack gap="800" align="start" wrap={false}>
              <Box width="50%">
                {mode === "update" ? (
                  <Combobox
                    activator={
                      <Combobox.TextField
                        label="Leather color"
                        labelHidden
                        value={activeLeatherColorOptions.find((opt) => opt.value === selectedLeatherColorId)?.label || ""}
                        onChange={() => {}}
                        placeholder="Choose a leather color"
                        autoComplete="off"
                      />
                    }
                  >
                    <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
                      <Listbox onSelect={(value) => setSelectedLeatherColorId(value)}>
                        {activeLeatherColorOptions.map((option) => (
                          <Listbox.Option key={option.value} value={option.value}>
                            {option.label}
                          </Listbox.Option>
                        ))}
                      </Listbox>
                    </div>
                  </Combobox>
                ) : (
                  <Combobox
                    activator={
                      <Combobox.TextField
                        label="Leather color"
                        labelHidden
                        value={inactiveLeatherColorOptions.find((opt) => opt.value === selectedLeatherColorId)?.label || ""}
                        onChange={() => {}}
                        placeholder="Choose a leather color to reactivate"
                        autoComplete="off"
                      />
                    }
                  >
                    <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
                      <Listbox onSelect={(value) => setSelectedLeatherColorId(value)}>
                        {inactiveLeatherColorOptions.map((option) => (
                          <Listbox.Option key={option.value} value={option.value}>
                            {option.label}
                          </Listbox.Option>
                        ))}
                      </Listbox>
                    </div>
                  </Combobox>
                )}
              </Box>
              <Box width="50%">
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
              </Box>
            </InlineStack>
          </>
        )}
      </BlockStack>
      )}
      {mode === "discontinue" && selectedLeatherColorId && (
        <Box paddingBlockStart="400">
          <Card>
            <BlockStack gap="300">
              <Text variant="headingSm" as="h3">
                Active products using this leather
              </Text>
              <Text variant="bodyMd" tone="subdued">
                Pulled from Shopify products that reference this leather in `custom.leathers_used`, limited to
                products that are still Active in Shopify. Check the actions you want to apply (wording and automation can be wired up next).
              </Text>
              {linkedProductsLoading && (
                <InlineStack gap="200" blockAlign="center">
                  <Spinner size="small" />
                  <Text tone="subdued">Loading products…</Text>
                </InlineStack>
              )}
              {!linkedProductsLoading && linkedProductsError && (
                <Text tone="critical">{linkedProductsError}</Text>
              )}
              {!linkedProductsLoading && !linkedProductsError && linkedProducts.length === 0 && (
                <Text tone="subdued">
                  No Active Shopify products found that reference this leather color.
                </Text>
              )}
              {!linkedProductsLoading && !linkedProductsError && linkedProducts.length > 0 && (
                <BlockStack gap="0">
                  <Box
                    paddingBlock="200"
                    paddingInline="200"
                    background="bg-surface-secondary"
                    borderRadius="200"
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(140px, 1fr) repeat(4, minmax(72px, auto))",
                        gap: "0.5rem 0.75rem",
                        alignItems: "center",
                      }}
                    >
                      <Text variant="bodySm" fontWeight="semibold" as="span">
                        Product
                      </Text>
                      {LINKED_PRODUCT_ACTION_KEYS.map(({ key, short, hint }) => (
                        <Box key={key} paddingInline="100">
                          <Tooltip content={hint} preferredPosition="above">
                            <Text variant="bodySm" fontWeight="semibold" as="span" alignment="center">
                              {short}
                            </Text>
                          </Tooltip>
                        </Box>
                      ))}
                      {linkedProducts.map((p) => {
                        const defaults = buildDefaultProductActions(p);
                        const row = linkedProductActions[p.shopifyProductId] || defaults;
                        const titleUrl = p.adminProductUrl || p.liveProductUrl;
                        return (
                          <React.Fragment key={p.shopifyProductId}>
                            <Box minWidth="0">
                              {titleUrl ? (
                                <a
                                  href={titleUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    color: "inherit",
                                    textDecoration: "underline",
                                    display: "block",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  <Text variant="bodyMd" as="span">
                                    {p.title}
                                  </Text>
                                </a>
                              ) : (
                                <Text variant="bodyMd" as="p" truncate>
                                  {p.title}
                                </Text>
                              )}
                            </Box>
                            {LINKED_PRODUCT_ACTION_KEYS.map(({ key, hint }) => (
                              <Box key={key} paddingInline="100">
                                {(() => {
                                  const isDiscountKey = key === "applyDiscount40" || key === "applyDiscount60";
                                  const isRemovalKey =
                                    key === "removeContinueSellingWhenOos" ||
                                    key === "removeCustomizableOptions";
                                  const isLockedCheckedDiscount =
                                    isDiscountKey &&
                                    ((key === "applyDiscount40" && !!p.hasDiscount40) ||
                                      (key === "applyDiscount60" && !!p.hasDiscount60));
                                  const isLockedInitialRemoval =
                                    isRemovalKey &&
                                    (key === "removeContinueSellingWhenOos"
                                      ? !defaults.removeContinueSellingWhenOos
                                      : !defaults.removeCustomizableOptions);
                                  return (
                                <Checkbox
                                  label={`${hint} for ${p.title}`}
                                  labelHidden
                                  checked={!!row[key]}
                                  disabled={isLockedCheckedDiscount || isLockedInitialRemoval}
                                  onChange={(checked) => setLinkedAction(p.shopifyProductId, key, checked)}
                                />
                                  );
                                })()}
                              </Box>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </Box>
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </Box>
      )}
      {(mode === "update" || mode === "reactivate") && (
        <Box width="100%">
          <Combobox
            activator={
              <Combobox.TextField
                prefix={<Icon source={SearchIcon} />}
                onChange={setColorInput}
                label="Add or remove color(s)"
                value={colorInput}
                placeholder="Search or select colors (Shopify Color metaobject)"
                autoComplete="off"
                requiredIndicator={false}
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
      {(mode === "update" || mode === "reactivate") && (
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
      {mode === "update" && selectedLeatherColorId && (
        <Box paddingBlockStart="400">
          <Card>
            <BlockStack gap="300">
              <Text variant="headingSm" as="h3">
                Active products using this leather
              </Text>
              <Text variant="bodyMd" tone="subdued">
                Pulled from Shopify products that reference this leather in `custom.leathers_used`, limited to
                products that are still Active in Shopify. Check the actions you want to apply (wording and automation can be wired up next).
              </Text>
              {linkedProductsLoading && (
                <InlineStack gap="200" blockAlign="center">
                  <Spinner size="small" />
                  <Text tone="subdued">Loading products…</Text>
                </InlineStack>
              )}
              {!linkedProductsLoading && linkedProductsError && (
                <Text tone="critical">{linkedProductsError}</Text>
              )}
              {!linkedProductsLoading && !linkedProductsError && linkedProducts.length === 0 && (
                <Text tone="subdued">
                  No Active Shopify products found that reference this leather color.
                </Text>
              )}
              {!linkedProductsLoading && !linkedProductsError && linkedProducts.length > 0 && (
                <BlockStack gap="0">
                  <Box
                    paddingBlock="200"
                    paddingInline="200"
                    background="bg-surface-secondary"
                    borderRadius="200"
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(140px, 1fr) repeat(4, minmax(72px, auto))",
                        gap: "0.5rem 0.75rem",
                        alignItems: "center",
                      }}
                    >
                      <Text variant="bodySm" fontWeight="semibold" as="span">
                        Product
                      </Text>
                      {LINKED_PRODUCT_ACTION_KEYS.map(({ key, short, hint }) => (
                        <Box key={key} paddingInline="100">
                          <Tooltip content={hint} preferredPosition="above">
                            <Text variant="bodySm" fontWeight="semibold" as="span" alignment="center">
                              {short}
                            </Text>
                          </Tooltip>
                        </Box>
                      ))}
                      {linkedProducts.map((p) => {
                        const defaults = buildDefaultProductActions(p);
                        const row = linkedProductActions[p.shopifyProductId] || defaults;
                        const titleUrl = p.adminProductUrl || p.liveProductUrl;
                        return (
                          <React.Fragment key={p.shopifyProductId}>
                            <Box minWidth="0">
                              {titleUrl ? (
                                <a
                                  href={titleUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    color: "inherit",
                                    textDecoration: "underline",
                                    display: "block",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  <Text variant="bodyMd" as="span">
                                    {p.title}
                                  </Text>
                                </a>
                              ) : (
                                <Text variant="bodyMd" as="p" truncate>
                                  {p.title}
                                </Text>
                              )}
                            </Box>
                            {LINKED_PRODUCT_ACTION_KEYS.map(({ key, hint }) => (
                              <Box key={key} paddingInline="100">
                                {(() => {
                                  const isDiscountKey = key === "applyDiscount40" || key === "applyDiscount60";
                                  const isRemovalKey =
                                    key === "removeContinueSellingWhenOos" ||
                                    key === "removeCustomizableOptions";
                                  const isLockedCheckedDiscount =
                                    isDiscountKey &&
                                    ((key === "applyDiscount40" && !!p.hasDiscount40) ||
                                      (key === "applyDiscount60" && !!p.hasDiscount60));
                                  const isLockedInitialRemoval =
                                    isRemovalKey &&
                                    (key === "removeContinueSellingWhenOos"
                                      ? !defaults.removeContinueSellingWhenOos
                                      : !defaults.removeCustomizableOptions);
                                  return (
                                <Checkbox
                                  label={`${hint} for ${p.title}`}
                                  labelHidden
                                  checked={!!row[key]}
                                  disabled={isLockedCheckedDiscount || isLockedInitialRemoval}
                                  onChange={(checked) => setLinkedAction(p.shopifyProductId, key, checked)}
                                />
                                  );
                                })()}
                              </Box>
                            ))}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </Box>
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </Box>
      )}
      {mode === "add" && (
        <Button primary onClick={handleCreate} disabled={!canCreate}>
          Create
        </Button>
      )}
      {mode === "update" && (
        <BlockStack gap="200">
          <Box paddingBlockStart="200">
            <Text tone="info" variant="bodyMd">
              Changing stock type or colors here does not change any current product states until business logic is defined.
            </Text>
          </Box>
          <Button
            primary
            disabled={!selectedLeatherColorId || (!hasUpdateChanges && !hasLinkedActionChanges)}
            onClick={() => openActionsValidationModal("update")}
          >
            {selectedLeatherForUpdate && !selectedLeatherForUpdate.isActive
              ? "Update and Set as Active"
              : "Update"}
          </Button>
        </BlockStack>
      )}
      {mode === "reactivate" && (
        <Button
          primary
          disabled={!selectedLeatherColorId}
          onClick={() => {
            const formData = new FormData();
            formData.append("actionType", "reactivateLeatherColor");
            formData.append("leatherColorId", selectedLeatherColorId);
            formData.append("isLimitedEditionLeather", isLimitedEditionLeather ? "true" : "false");
            selectedColorIds.forEach((id) => formData.append("colorMetaobjectIds", id));
            formData.append("setActive", "true");
            if (selectedLeatherForUpdate) {
              const blended = buildLeatherBlendedCollectionName(
                selectedLeatherForUpdate.collectionName,
                selectedLeatherForUpdate.baseLabel
              );
              if (blended) formData.append("blendedCollectionName", blended);
            }
            fetcher.submit(formData, { method: "post" });
          }}
        >
          {hasUpdateChanges ? "Update and Set as Active" : "Set as Active"}
        </Button>
      )}
      {mode === "discontinue" && (
        <Button
          primary
          tone="critical"
          disabled={!selectedLeatherColorId}
          onClick={() => openActionsValidationModal("discontinue")}
        >
          Discontinue Collection & Leather Color
        </Button>
      )}
      <Modal
        open={actionsValidationModalOpen}
        onClose={() => {
          setActionsValidationModalOpen(false);
          setPendingProductActionSubmit(null);
        }}
        title={
          pendingProductActionSubmit === "discontinue"
            ? "Confirm discontinue + product action updates"
            : "Confirm update + product action updates"
        }
        primaryAction={{
          content: "Confirm and submit",
          onAction: handleConfirmActionsValidation,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => {
              setActionsValidationModalOpen(false);
              setPendingProductActionSubmit(null);
            },
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="200">
            <Text variant="bodyMd">
              {productActionDiffs.length
                ? `${productActionDiffs.length} product${productActionDiffs.length === 1 ? "" : "s"} have checkbox changes.`
                : "No checkbox changes detected. This will only submit the leather color update/discontinue action."}
            </Text>
            {productActionDiffs.length > 0 && (
              <BlockStack gap="100">
                {productActionDiffs.map(({ product, changedKeys }) => (
                  <Box key={product.shopifyProductId}>
                    <Text variant="bodyMd" fontWeight="semibold" as="p">
                      {product.title}
                    </Text>
                    <Text variant="bodyMd" tone="subdued" as="p">
                      {changedKeys
                        .map((key) => {
                          if (key === "removeContinueSellingWhenOos") return "Turn off Continue selling when out of stock";
                          if (key === "applyDiscount40") return "Apply 40% discount";
                          if (key === "applyDiscount60") return "Apply 60% discount";
                          if (key === "removeCustomizableOptions") return "Remove customizable options";
                          return key;
                        })
                        .join(" | ")}
                    </Text>
                  </Box>
                ))}
              </BlockStack>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>
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
      {/*
      Debug: object data for abbreviation / duplicate-name troubleshooting
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
      */}
    </BlockStack>
  );
} 