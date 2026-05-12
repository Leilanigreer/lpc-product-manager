import React, { useCallback, useMemo, useState } from "react";
import {
  BlockStack,
  InlineStack,
  Box,
  Card,
  Text,
  TextField,
  Select,
  Combobox,
  Listbox,
  Icon,
  Checkbox,
  RadioButton,
  Button,
  Divider,
  Collapsible,
  Banner,
} from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";
import ImageDropZone from "./ImageDropZone";
import { compressImageForGoogleDrive } from "../lib/utils/imageCompression";
import {
  findStyleAbbreviationConflict,
  generateStyleAbbreviation,
} from "../lib/utils/styleAbbreviationUtils";

const SELECT_PLACEHOLDER = { label: "Select…", value: "" };

export default function AddStyleForm({ choiceOptions, existingStyles = [], fetcher }) {
  const styleChoices = useMemo(() => choiceOptions?.style ?? [], [choiceOptions?.style]);
  const categoryOptions = useMemo(
    () => choiceOptions?.category ?? [],
    [choiceOptions?.category]
  );
  const collectionCategoryOptions = useMemo(
    () => choiceOptions?.collectionCategory ?? [],
    [choiceOptions?.collectionCategory]
  );
  const shapeGroupOptions = useMemo(
    () => choiceOptions?.shapeGroup ?? [],
    [choiceOptions?.shapeGroup]
  );
  const namePatternOptions = useMemo(
    () => choiceOptions?.namePattern ?? [],
    [choiceOptions?.namePattern]
  );

  const [styleName, setStyleName] = useState("");
  const [styleInput, setStyleInput] = useState("");
  const [category, setCategory] = useState("");
  const [collectionCategory, setCollectionCategory] = useState("");
  const [shapeGroup, setShapeGroup] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [abbreviationDirty, setAbbreviationDirty] = useState(false);
  // Defaults to true: the vast majority of styles include their abbreviation in
  // Custom SKUs. Flip to false for styles whose name duplicates their collection
  // (e.g. the lone "Quilted" style on the Quilted collection).
  const [includeAbbreviationInSku, setIncludeAbbreviationInSku] = useState(true);
  const [useInVariantTitle, setUseInVariantTitle] = useState(true);
  const [description, setDescription] = useState("");
  const [sortNumber, setSortNumber] = useState("");
  const [previewImageFile, setPreviewImageFile] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [compressing, setCompressing] = useState(false);

  const [namePattern, setNamePattern] = useState("");
  const [leatherPhrase, setLeatherPhrase] = useState("");
  const [leatherPhraseInput, setLeatherPhraseInput] = useState("");
  const [needsColorDesignation, setNeedsColorDesignation] = useState(null);
  const [useOppositeLeather, setUseOppositeLeather] = useState(false);
  const [useOppositeLeatherTouched, setUseOppositeLeatherTouched] = useState(false);

  const [showAbbreviationHelper, setShowAbbreviationHelper] = useState(false);
  const [clientError, setClientError] = useState("");

  React.useEffect(() => {
    if (!abbreviationDirty) {
      setAbbreviation(
        generateStyleAbbreviation({
          styleName,
          collectionCategory,
          shapeGroup,
        })
      );
    }
  }, [styleName, collectionCategory, shapeGroup, abbreviationDirty]);

  React.useEffect(() => {
    return () => {
      if (previewImageUrl) URL.revokeObjectURL(previewImageUrl);
    };
  }, [previewImageUrl]);

  React.useEffect(() => {
    if (fetcher?.data?.success) {
      setStyleName("");
      setStyleInput("");
      setCategory("");
      setCollectionCategory("");
      setShapeGroup("");
      setAbbreviation("");
      setAbbreviationDirty(false);
      setIncludeAbbreviationInSku(true);
      setUseInVariantTitle(true);
      setDescription("");
      setSortNumber("");
      setPreviewImageFile(null);
      setPreviewImageUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setNamePattern("");
      setLeatherPhrase("");
      setLeatherPhraseInput("");
      setNeedsColorDesignation(null);
      setUseOppositeLeather(false);
      setUseOppositeLeatherTouched(false);
      setClientError("");
    }
  }, [fetcher?.data?.success]);

  const styleChoiceMatches = useMemo(() => {
    const q = styleInput.toLowerCase();
    if (!q) return styleChoices;
    return styleChoices.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [styleChoices, styleInput]);

  const isNewStyleValue = useMemo(() => {
    const trimmed = styleName.trim();
    if (!trimmed) return false;
    return !styleChoices.some(
      (opt) => opt.label.toLowerCase() === trimmed.toLowerCase()
    );
  }, [styleName, styleChoices]);

  const handleStyleSelect = useCallback((value) => {
    setStyleName(value);
    setStyleInput(value);
    setClientError("");
  }, []);

  const handleStyleInputChange = useCallback((value) => {
    setStyleInput(value);
    setStyleName(value);
    setClientError("");
  }, []);

  const leatherPhraseSuggestions = useMemo(() => {
    const all = (existingStyles || [])
      .map((s) => (typeof s.leatherPhrase === "string" ? s.leatherPhrase.trim() : ""))
      .filter(Boolean);
    const unique = Array.from(new Set(all)).sort((a, b) => a.localeCompare(b));
    const q = leatherPhraseInput.trim().toLowerCase();
    if (!q) return unique.map((label) => ({ label, value: label }));
    return unique
      .filter((label) => label.toLowerCase().includes(q))
      .map((label) => ({ label, value: label }));
  }, [existingStyles, leatherPhraseInput]);

  const handleLeatherPhraseSelect = useCallback((value) => {
    setLeatherPhrase(value);
    setLeatherPhraseInput(value);
    setClientError("");
  }, []);

  const handleLeatherPhraseInputChange = useCallback((value) => {
    setLeatherPhraseInput(value);
    setLeatherPhrase(value);
    setClientError("");
  }, []);

  const existingAbbreviationRows = useMemo(() => {
    return (existingStyles || [])
      .map((s) => ({ label: s.label, abbreviation: s.abbreviation }))
      .filter((s) => s.label && s.abbreviation)
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [existingStyles]);

  const onPreviewDrop = useCallback(async (files) => {
    if (!files || !files.length) return;
    const original = files[0];
    setCompressing(true);
    try {
      const compressed = await compressImageForGoogleDrive(original).catch((err) => {
        console.warn("Preview compression failed, using original:", err);
        return original;
      });
      const previewBlobUrl = URL.createObjectURL(compressed);
      setPreviewImageFile(compressed);
      setPreviewImageUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return previewBlobUrl;
      });
    } finally {
      setCompressing(false);
    }
  }, []);

  // Detect an existing style that would produce a colliding SKU. Style
  // abbreviation now appears in every variant SKU, so two styles that share
  // the same shape_group + collection_category MUST have distinct
  // abbreviations (unless either has includeAbbreviationInSku=false). See
  // findStyleAbbreviationConflict for the exact comparison rules.
  const abbreviationConflict = useMemo(() => {
    return findStyleAbbreviationConflict({
      abbreviation,
      collectionCategory,
      shapeGroup,
      includeAbbreviationInSku,
      existingStyles,
    });
  }, [
    abbreviation,
    collectionCategory,
    shapeGroup,
    includeAbbreviationInSku,
    existingStyles,
  ]);

  const canSubmit = useMemo(() => {
    if (!styleName.trim()) return false;
    if (!category) return false;
    if (!collectionCategory) return false;
    if (!shapeGroup) return false;
    if (!abbreviation.trim()) return false;
    if (abbreviationConflict) return false;
    if (useInVariantTitle) {
      if (!namePattern) return false;
      if (!leatherPhrase.trim()) return false;
      if (needsColorDesignation !== true && needsColorDesignation !== false) return false;
      if (!useOppositeLeatherTouched) return false;
    }
    return true;
  }, [
    styleName,
    category,
    collectionCategory,
    shapeGroup,
    abbreviation,
    abbreviationConflict,
    useInVariantTitle,
    namePattern,
    leatherPhrase,
    needsColorDesignation,
    useOppositeLeatherTouched,
  ]);

  const handleSubmit = useCallback(() => {
    setClientError("");
    if (!canSubmit) {
      setClientError("Please fill in all required fields before submitting.");
      return;
    }

    const formData = new FormData();
    formData.append("style", styleName.trim());
    formData.append("category", category);
    formData.append("collection_category", collectionCategory);
    formData.append("shape_group", shapeGroup);
    formData.append("abbreviation", abbreviation.trim());
    formData.append("include_abbreviation_in_sku", includeAbbreviationInSku ? "true" : "false");
    formData.append("use_in_variant_title", useInVariantTitle ? "true" : "false");
    if (description.trim()) formData.append("description", description.trim());
    if (sortNumber.trim()) formData.append("sort_number", sortNumber.trim());
    if (previewImageFile) formData.append("preview_image", previewImageFile, previewImageFile.name);

    if (useInVariantTitle) {
      formData.append("name_pattern", namePattern);
      formData.append("leather_phrase", leatherPhrase.trim());
      formData.append("needs_color_designation", needsColorDesignation ? "true" : "false");
      formData.append("use_opposite_leather", useOppositeLeather ? "true" : "false");
    }

    fetcher.submit(formData, {
      method: "post",
      encType: "multipart/form-data",
    });
  }, [
    canSubmit,
    styleName,
    category,
    collectionCategory,
    shapeGroup,
    abbreviation,
    includeAbbreviationInSku,
    useInVariantTitle,
    description,
    sortNumber,
    previewImageFile,
    namePattern,
    leatherPhrase,
    needsColorDesignation,
    useOppositeLeather,
    fetcher,
  ]);

  const submitting = fetcher?.state === "submitting";

  return (
    <BlockStack gap="400">
      <Text variant="headingMd">Add a New Style</Text>

      {clientError && (
        <Banner status="critical">{clientError}</Banner>
      )}

      <BlockStack gap="300">
        <Box>
          <Text variant="bodyMd" as="label" fontWeight="medium">
            Style name
          </Text>
          <Combobox
            allowMultiple={false}
            activator={
              <Combobox.TextField
                label="Style name"
                labelHidden
                value={styleInput}
                onChange={handleStyleInputChange}
                placeholder="Type or choose an existing style"
                autoComplete="off"
                requiredIndicator
              />
            }
          >
            {styleChoiceMatches.length > 0 && (
              <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
                <Listbox onSelect={handleStyleSelect}>
                  {styleChoiceMatches.map((opt) => (
                    <Listbox.Option key={opt.value} value={opt.value}>
                      {opt.label}
                    </Listbox.Option>
                  ))}
                </Listbox>
              </div>
            )}
          </Combobox>
          {isNewStyleValue && (
            <Box paddingBlockStart="100">
              <Text tone="subdued" variant="bodySm">
                This is a new style. Submitting will add &ldquo;{styleName.trim()}&rdquo; to the Style choice list.
              </Text>
            </Box>
          )}
        </Box>

        <InlineStack gap="400" align="start" wrap>
          <Box width="48%">
            <Select
              label="Category"
              options={[SELECT_PLACEHOLDER, ...categoryOptions]}
              value={category}
              onChange={(v) => { setCategory(v); setClientError(""); }}
              requiredIndicator
            />
          </Box>
          <Box width="48%">
            <Select
              label="Collection category"
              options={[SELECT_PLACEHOLDER, ...collectionCategoryOptions]}
              value={collectionCategory}
              onChange={(v) => { setCollectionCategory(v); setClientError(""); }}
              requiredIndicator
            />
          </Box>
        </InlineStack>

        <InlineStack gap="400" align="start" wrap>
          <Box width="48%">
            <Select
              label="Shape group"
              options={[SELECT_PLACEHOLDER, ...shapeGroupOptions]}
              value={shapeGroup}
              onChange={(v) => { setShapeGroup(v); setClientError(""); }}
              requiredIndicator
            />
          </Box>
          <Box width="48%">
            <TextField
              label="Abbreviation"
              value={abbreviation}
              onChange={(v) => {
                setAbbreviation(v);
                setAbbreviationDirty(true);
                setClientError("");
              }}
              autoComplete="off"
              error={
                abbreviationConflict
                  ? `Already used by "${abbreviationConflict.label}" in the same collection category and shape group. Pick a different abbreviation.`
                  : undefined
              }
              helpText="Auto-generated from collection category + style + shape group. Editable if you need to override. Must be unique within the same collection category + shape group because it appears in every variant SKU."
              requiredIndicator
            />
            <Box paddingBlockStart="100">
              <Button
                size="micro"
                variant="plain"
                onClick={() => setShowAbbreviationHelper((v) => !v)}
                ariaExpanded={showAbbreviationHelper}
              >
                {showAbbreviationHelper ? "Hide existing abbreviations" : "Show existing abbreviations"}
              </Button>
              <Collapsible
                open={showAbbreviationHelper}
                id="existing-abbreviations"
                transition={{ duration: "150ms", timingFunction: "ease-in-out" }}
              >
                <Box paddingBlockStart="200">
                  <Card>
                    <BlockStack gap="100">
                      {existingAbbreviationRows.length === 0 ? (
                        <Text tone="subdued" variant="bodySm">No existing styles found.</Text>
                      ) : (
                        existingAbbreviationRows.map((row) => (
                          <Text key={`${row.label}-${row.abbreviation}`} variant="bodySm">
                            {row.label} &rarr; <b>{row.abbreviation}</b>
                          </Text>
                        ))
                      )}
                    </BlockStack>
                  </Card>
                </Box>
              </Collapsible>
            </Box>
          </Box>
        </InlineStack>

        <BlockStack gap="100">
          <Text variant="bodyMd" as="label" fontWeight="medium">
            Include abbreviation in SKU?
          </Text>
          <InlineStack gap="400" wrap={false}>
            <RadioButton
              label="Yes"
              checked={includeAbbreviationInSku === true}
              id="includeAbbreviationInSku-yes"
              name="includeAbbreviationInSku"
              onChange={() => { setIncludeAbbreviationInSku(true); setClientError(""); }}
            />
            <RadioButton
              label="No"
              checked={includeAbbreviationInSku === false}
              id="includeAbbreviationInSku-no"
              name="includeAbbreviationInSku"
              onChange={() => { setIncludeAbbreviationInSku(false); setClientError(""); }}
            />
          </InlineStack>
          <Text tone="subdued" variant="bodySm">
            Defaults to Yes. Set to No only when the style&apos;s name duplicates its collection
            (e.g. the lone &ldquo;Quilted&rdquo; style on the Quilted collection) and you want
            the abbreviation kept off Custom SKUs.
          </Text>
        </BlockStack>

        <Box>
          <Checkbox
            label="Use in Variant Title"
            checked={useInVariantTitle}
            onChange={(checked) => {
              setUseInVariantTitle(checked);
              setClientError("");
            }}
            helpText={
              useInVariantTitle
                ? "Variant-naming fields will be required below."
                : "Variant-naming fields are skipped because this style is not used in variant titles."
            }
          />
        </Box>

        <Divider />

        <BlockStack gap="200">
          <Text variant="headingSm">Optional fields</Text>
          <TextField
            label="Description"
            multiline={2}
            value={description}
            onChange={setDescription}
            autoComplete="off"
            placeholder="Short marketing blurb explaining the look and feel of this style."
            helpText="Storefront only — not used by the product creation flow."
          />
          <InlineStack gap="400" align="start" wrap>
            <Box width="48%">
              <TextField
                label="Sort number"
                type="number"
                value={sortNumber}
                onChange={setSortNumber}
                autoComplete="off"
                placeholder="e.g. 10"
                helpText="Storefront display order."
              />
            </Box>
            <Box width="48%">
              <BlockStack gap="100">
                <Text variant="bodyMd" as="label" fontWeight="medium">
                  Preview image
                </Text>
                <ImageDropZone
                  size="additional"
                  label="Preview image"
                  customWidth="160px"
                  customHeight="160px"
                  uploadedImageUrl={previewImageUrl}
                  accept="image/jpeg,image/jpg,image/png,.jpg,.jpeg,.png"
                  onDrop={onPreviewDrop}
                />
                {compressing && (
                  <Text tone="subdued" variant="bodySm">Preparing image…</Text>
                )}
              </BlockStack>
            </Box>
          </InlineStack>
        </BlockStack>

        {useInVariantTitle && (
          <>
            <Divider />
            <BlockStack gap="200">
              <Text variant="headingSm">Variant-title fields (required because &ldquo;Use in Variant Title&rdquo; is on)</Text>

              <InlineStack gap="400" align="start" wrap>
                <Box width="48%">
                  <Select
                    label="Name pattern"
                    options={[SELECT_PLACEHOLDER, ...namePatternOptions]}
                    value={namePattern}
                    onChange={(v) => { setNamePattern(v); setClientError(""); }}
                    requiredIndicator
                  />
                </Box>
                <Box width="48%">
                  <Text variant="bodyMd" as="label" fontWeight="medium">
                    Leather phrase
                  </Text>
                  <Combobox
                    allowMultiple={false}
                    activator={
                      <Combobox.TextField
                        prefix={<Icon source={SearchIcon} />}
                        label="Leather phrase"
                        labelHidden
                        value={leatherPhraseInput}
                        onChange={handleLeatherPhraseInputChange}
                        placeholder="Type or pick from existing leather phrases"
                        autoComplete="off"
                        requiredIndicator
                      />
                    }
                  >
                    {leatherPhraseSuggestions.length > 0 && (
                      <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
                        <Listbox onSelect={handleLeatherPhraseSelect}>
                          {leatherPhraseSuggestions.map((opt) => (
                            <Listbox.Option key={opt.value} value={opt.value}>
                              {opt.label}
                            </Listbox.Option>
                          ))}
                        </Listbox>
                      </div>
                    )}
                  </Combobox>
                </Box>
              </InlineStack>

              <BlockStack gap="100">
                <Text variant="bodyMd" as="label" fontWeight="medium">
                  Needs color designation?
                </Text>
                <InlineStack gap="400" wrap={false}>
                  <RadioButton
                    label="Yes"
                    checked={needsColorDesignation === true}
                    id="needsColorDesignation-yes"
                    name="needsColorDesignation"
                    onChange={() => { setNeedsColorDesignation(true); setClientError(""); }}
                  />
                  <RadioButton
                    label="No"
                    checked={needsColorDesignation === false}
                    id="needsColorDesignation-no"
                    name="needsColorDesignation"
                    onChange={() => { setNeedsColorDesignation(false); setClientError(""); }}
                  />
                </InlineStack>
              </BlockStack>

              <BlockStack gap="100">
                <Text variant="bodyMd" as="label" fontWeight="medium">
                  Use opposite leather?
                </Text>
                <InlineStack gap="400" wrap={false}>
                  <RadioButton
                    label="Yes"
                    checked={useOppositeLeatherTouched && useOppositeLeather === true}
                    id="useOppositeLeather-yes"
                    name="useOppositeLeather"
                    onChange={() => {
                      setUseOppositeLeather(true);
                      setUseOppositeLeatherTouched(true);
                      setClientError("");
                    }}
                  />
                  <RadioButton
                    label="No"
                    checked={useOppositeLeatherTouched && useOppositeLeather === false}
                    id="useOppositeLeather-no"
                    name="useOppositeLeather"
                    onChange={() => {
                      setUseOppositeLeather(false);
                      setUseOppositeLeatherTouched(true);
                      setClientError("");
                    }}
                  />
                </InlineStack>
              </BlockStack>
            </BlockStack>
          </>
        )}

        <Box paddingBlockStart="300">
          <Button
            primary
            disabled={!canSubmit || submitting || compressing}
            loading={submitting}
            onClick={handleSubmit}
          >
            Create Style
          </Button>
        </Box>
      </BlockStack>
    </BlockStack>
  );
}
