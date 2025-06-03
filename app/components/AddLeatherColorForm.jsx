import React, { useCallback, useMemo, useState } from "react";
import { Card, TextField, BlockStack, InlineStack, Tag, Combobox, Listbox, Icon, Box, Button, Modal, InlineError, RadioButton, Text } from "@shopify/polaris";
import { SearchIcon } from '@shopify/polaris-icons';

export default function AddLeatherColorForm({ leatherColors, colorTags, fetcher }) {
  const [leatherColorName, setLeatherColorName] = useState("");
  const [selectedColorTags, setSelectedColorTags] = useState([]);
  const [colorTagInput, setColorTagInput] = useState("");
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [generatedAbbr, setGeneratedAbbr] = useState("");
  const [formattedName, setFormattedName] = useState("");
  const [isLimitedEditionLeather, setIsLimitedEditionLeather] = useState(false);

  // Utility: Title Case
  const toTitleCase = (str) => str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

  // Utility: Generate Abbreviation
  const generateAbbreviation = (name, existingAbbrs) => {
    if (!name) return "";
    const words = name.split(" ").filter(Boolean);
    let abbr = words.map(w => w[0].toUpperCase()).join("");
    if (!existingAbbrs.includes(abbr)) return abbr;
    let i = 1;
    const makeAbbr = (words, i) => words.map(w => w[0].toUpperCase() + (w[i] ? w[i].toLowerCase() : "")).join("");
    while (true) {
      let nextAbbr = makeAbbr(words, i);
      if (!existingAbbrs.includes(nextAbbr)) return nextAbbr;
      i++;
      if (i > Math.max(...words.map(w => w.length))) {
        let n = 2;
        while (existingAbbrs.includes(abbr + n)) n++;
        return abbr + n;
      }
    }
  };

  const filteredColorTagOptions = useMemo(() => {
    const search = colorTagInput.toLowerCase();
    return colorTags.filter(tag =>
      tag.label.toLowerCase().includes(search) && !selectedColorTags.includes(tag.value)
    ).map(tag => ({ label: tag.label, value: tag.value }));
  }, [colorTags, colorTagInput, selectedColorTags]);

  const handleLeatherColorNameChange = useCallback((value) => {
    const formatted = toTitleCase(value);
    setLeatherColorName(formatted);
    setFormattedName(formatted);
    setError("");
  }, []);

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
    const name = toTitleCase(leatherColorName.trim());
    setFormattedName(name);
    const nameExists = leatherColors.some(lc => lc.label && lc.label.toLowerCase() === name.toLowerCase());
    if (!name) {
      setError("Please enter a leather color name.");
      return;
    }
    if (nameExists) {
      setError("This leather color name already exists.");
      return;
    }
    const existingAbbrs = leatherColors.map(lc => lc.abbreviation);
    const abbr = generateAbbreviation(name, existingAbbrs);
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

  return (
    <Card>
      <BlockStack gap="400">
        <Text variant="headingMd">Add New Leather Color</Text>
        <BlockStack gap="100">
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
          <InlineStack gap="800" align="start" wrap={false}>
            <Box width="50%">
              <TextField
                id="leatherColorNameInput"
                label=""
                value={leatherColorName}
                onChange={handleLeatherColorNameChange}
                autoComplete="off"
                placeholder="Enter new leather color name"
              />
              {error && <InlineError message={error} fieldID="leatherColorName" />}
            </Box>
            <Box width="50%">
              <InlineStack gap="400" wrap={false}>
                <RadioButton
                  label="Standard Stock"
                  checked={!isLimitedEditionLeather}
                  id="standardStock"
                  name="stockType"
                  onChange={() => setIsLimitedEditionLeather(false)}
                />
                <RadioButton
                  label="Limited Edition"
                  checked={isLimitedEditionLeather}
                  id="limitedEdition"
                  name="stockType"
                  onChange={() => setIsLimitedEditionLeather(true)}
                />
              </InlineStack>
            </Box>
          </InlineStack>
        </BlockStack>
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
        <Button primary onClick={handleCreate}>Create</Button>
      </BlockStack>
      <Modal
        open={modalOpen}
        onClose={handleModalClose}
        title="Confirm New Leather Color"
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
    </Card>
  );
} 