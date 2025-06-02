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
} from "@shopify/polaris";
import { SearchIcon } from '@shopify/polaris-icons';
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

export default function AddStitchingThreadColorForm({ colorTags, stitchingThreadColors, fetcher }) {
  const [stitchName, setStitchName] = useState("");
  const [stitchAmann, setStitchAmann] = useState("");
  const [stitchColorTags, setStitchColorTags] = useState([]);
  const [stitchColorTagInput, setStitchColorTagInput] = useState("");
  const [stitchModalOpen, setStitchModalOpen] = useState(false);
  const [stitchError, setStitchError] = useState("");
  const [stitchGeneratedAbbr, setStitchGeneratedAbbr] = useState("");
  const [stitchFormattedName, setStitchFormattedName] = useState("");
  const [stitchIntent, setStitchIntent] = useState(null);

  // Restore stitching color tag logic
  const filteredStitchColorTagOptions = useMemo(() => {
    const search = stitchColorTagInput.toLowerCase();
    return colorTags.filter(tag =>
      tag.label.toLowerCase().includes(search) && !stitchColorTags.includes(tag.value)
    ).map(tag => ({
      label: tag.label,
      value: tag.value
    }));
  }, [colorTags, stitchColorTagInput, stitchColorTags]);

  const handleStitchColorTagSelect = (value) => {
    if (!stitchColorTags.includes(value)) {
      setStitchColorTags(prev => [...prev, value]);
    }
    setStitchColorTagInput("");
  };
  const handleRemoveStitchColorTag = (tagValue) => {
    setStitchColorTags(prev => prev.filter(v => v !== tagValue));
  };

  // Handler for Save Stitching Thread Color
  const handleStitchSave = () => {
    const name = toTitleCase(stitchName.trim());
    setStitchFormattedName(name);
    const amannTrimmed = (stitchAmann || "").trim();
    if (!name) {
      setStitchError("Please enter a thread color name.");
      return;
    }
    if (!amannTrimmed) {
      setStitchError("Please enter an Amann number.");
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
        setStitchError("This Amann number is already linked to this thread color.");
        return;
      } else {
        setStitchError(`This Amann number is already linked to a different thread color: ${amannLinkedName}`);
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
    setStitchError("");
  };

  // Handler for confirming in modal (for now, just close and reset)
  const handleStitchConfirm = () => {
    setStitchModalOpen(false);
    setStitchName("");
    setStitchAmann("");
    setStitchColorTags([]);
    setStitchGeneratedAbbr("");
    setStitchFormattedName("");
    setStitchError("");
    setStitchIntent(null);
  };
  const handleStitchModalClose = () => {
    setStitchModalOpen(false);
  };

  return (
    <Card>
      <BlockStack gap="400">
        <Text variant="headingMd">Add Stitching Thread Color</Text>
        <BlockStack gap="400">
          <TextField
            label="Name"
            value={stitchName}
            onChange={setStitchName}
            autoComplete="off"
            error={stitchError}
          />
          <TextField
            label="Amann Number"
            value={stitchAmann}
            onChange={setStitchAmann}
            autoComplete="off"
          />
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
      </BlockStack>
      {/* Stitching Confirmation Modal */}
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
            <Text><b>Amann Number:</b> {stitchAmann || "None"}</Text>
            <Text><b>Tags:</b> {stitchColorTags.map(tagValue => {
              const tagObj = colorTags.find(t => t.value === tagValue);
              return tagObj ? tagObj.label : tagValue;
            }).join(", ") || "None"}</Text>
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Card>
  );
} 