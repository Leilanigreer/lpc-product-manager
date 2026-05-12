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

const SELECT_PLACEHOLDER = { label: "Select…", value: "" };

/**
 * Placeholder abbreviation generator: first 3 alphanumeric characters of the
 * trimmed style name, uppercased. This is intentionally a stand-in until the
 * real rule set is defined — Karl can overwrite the auto-filled value in the
 * Abbreviation field on every submission.
 *
 * TODO(style-abbreviation): replace with the real generator once Karl shares
 * examples. The "Show existing abbreviations" collapsible below lists the
 * current dataset so we can sanity-check any future rule against it.
 */
function placeholderAbbreviation(styleName) {
  if (!styleName) return "";
  const cleaned = String(styleName).replace(/[^a-zA-Z0-9]+/g, "");
  return cleaned.slice(0, 3).toUpperCase();
}

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
      setAbbreviation(placeholderAbbreviation(styleName));
    }
  }, [styleName, abbreviationDirty]);

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

  const canSubmit = useMemo(() => {
    if (!styleName.trim()) return false;
    if (!category) return false;
    if (!collectionCategory) return false;
    if (!shapeGroup) return false;
    if (!abbreviation.trim()) return false;
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
              helpText="Auto-filled from style name. Editable. Final rules TBD."
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
