import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  TextField,
  Button,
  BlockStack,
  InlineStack,
  Divider,
  Combobox,
  Listbox,
  Tag,
  Icon,
  Text,
  RadioButton,
} from "@shopify/polaris";
import { SearchIcon, CheckCircleIcon, PlusCircleIcon, DeleteIcon } from "@shopify/polaris-icons";
import { formatNameLive, formatNameOnBlur, validateNameUnique, generateEmbAbbreviation } from "../lib/utils/colorNameUtils";
import ThreadCreateUpdateModal from "./ThreadCreateUpdateModal";
import ThreadReassignNumberModal from "./ThreadReassignNumberModal";

export default function AddEmbroideryThreadColorForm({ unlinkedIsacordNumbers, embroideryThreadColors, fetcher }) {
  const [embMode, setEmbMode] = useState("add");
  const [embSelectedThreadId, setEmbSelectedThreadId] = useState("");
  const [embName, setEmbName] = useState("");
  const [embIsacord, setEmbIsacord] = useState([]);
  const [embIsacordInput, setEmbIsacordInput] = useState("");
  const [embLinkedIsacordNumbers, setEmbLinkedIsacordNumbers] = useState([]);
  const [originalLinkedIsacordNumbers, setOriginalLinkedIsacordNumbers] = useState([]);
  const [embModalOpen, setEmbModalOpen] = useState(false);
  const [embError, setEmbError] = useState("");
  const [embGeneratedAbbr, setEmbGeneratedAbbr] = useState("");
  const [embFormattedName, setEmbFormattedName] = useState("");
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [nameCollisionThreadId, setNameCollisionThreadId] = useState(null);
  const [threadNameSearchInput, setThreadNameSearchInput] = useState("");
  const [isacordReassignModal, setIsacordReassignModal] = useState({ open: false, num: null, linkedThread: null });
  const [deletedIsacordNumbers, setDeletedIsacordNumbers] = useState([]);

  const embroideryThreadOptions = useMemo(
    () => (embroideryThreadColors || []).map((tc) => ({ label: tc.label, value: tc.value })),
    [embroideryThreadColors]
  );

  const allIsacordOptions = useMemo(() => {
    const linked = (embroideryThreadColors || []).flatMap((tc) =>
      (tc.isacordNumbers || []).map((num) => ({ ...num, threadId: tc.value, threadName: tc.label }))
    );
    const unlinked = (unlinkedIsacordNumbers || []).map((num) => ({ ...num, threadId: null, threadName: null }));
    const all = [...linked, ...unlinked];
    const seen = new Set();
    return all.filter((num) => {
      if (seen.has(num.value)) return false;
      seen.add(num.value);
      return true;
    });
  }, [embroideryThreadColors, unlinkedIsacordNumbers]);

  useEffect(() => {
    if (embMode === "add") {
      setThreadNameSearchInput("");
      setEmbSelectedThreadId("");
      setEmbName("");
      setEmbIsacord([]);
      setEmbIsacordInput("");
      setEmbLinkedIsacordNumbers([]);
      setOriginalLinkedIsacordNumbers([]);
      setEmbModalOpen(false);
      setEmbError("");
      setEmbGeneratedAbbr("");
      setEmbFormattedName("");
      setDeletedIsacordNumbers([]);
      setUpdateModalOpen(false);
      setUpdateError("");
      setNameCollisionThreadId(null);
      setIsacordReassignModal({ open: false, num: null, linkedThread: null });
    }
  }, [embMode]);

  useEffect(() => {
    if (embMode === "update" && embSelectedThreadId) {
      const thread = (embroideryThreadColors || []).find((tc) => tc.value === embSelectedThreadId);
      setThreadNameSearchInput(thread?.label || "");
      setEmbName(thread?.label || "");
      const originalIds = (thread?.isacordNumbers || []).map((num) => num.value);
      setOriginalLinkedIsacordNumbers(originalIds);
      setEmbLinkedIsacordNumbers(originalIds);
      setDeletedIsacordNumbers([]);
    }
  }, [embMode, embSelectedThreadId, embroideryThreadColors]);

  const filteredIsacordOptions = useMemo(() => {
    const search = embIsacordInput.toLowerCase();
    return allIsacordOptions
      .filter((num) => num.label.toLowerCase().includes(search))
      .map((num) => ({
        ...num,
        label: num.threadId && num.threadName ? `${num.label} (linked to ${num.threadName})` : num.label,
      }));
  }, [allIsacordOptions, embIsacordInput]);

  const filteredUpdateIsacordOptions = useMemo(() => {
    const search = embIsacordInput.toLowerCase();
    return allIsacordOptions
      .filter((num) => num.label.toLowerCase().includes(search))
      .map((num) => ({
        ...num,
        label: num.threadId && num.threadName ? `${num.label} (linked to ${num.threadName})` : num.label,
      }));
  }, [allIsacordOptions, embIsacordInput]);

  const handleIsacordSelect = (value) => {
    const numObj = allIsacordOptions.find((num) => num.value === value);
    if (numObj && numObj.threadId && !embIsacord.includes(value)) {
      setIsacordReassignModal({ open: true, num: numObj, linkedThread: numObj.threadName });
      return;
    }
    if (!embIsacord.includes(value)) {
      setEmbIsacord((prev) => [...prev, value]);
    }
    setEmbIsacordInput("");
  };

  const handleRemoveIsacord = (id) => {
    setEmbIsacord((prev) => prev.filter((v) => v !== id));
  };

  const handleUpdateIsacordSelect = (value) => {
    const numObj = allIsacordOptions.find((num) => num.value === value);
    if (numObj && numObj.threadId && numObj.threadId !== embSelectedThreadId && !embLinkedIsacordNumbers.includes(value)) {
      setIsacordReassignModal({ open: true, num: numObj, linkedThread: numObj.threadName });
      return;
    }
    if (!embLinkedIsacordNumbers.includes(value)) {
      setEmbLinkedIsacordNumbers((prev) => [...prev, value]);
    }
    setEmbIsacordInput("");
  };

  const handleRemoveUpdateIsacord = (id) => {
    if (deletedIsacordNumbers.includes(id)) {
      setDeletedIsacordNumbers((prev) => prev.filter((v) => v !== id));
    } else if (originalLinkedIsacordNumbers.includes(id)) {
      setDeletedIsacordNumbers((prev) => [...prev, id]);
    } else {
      setEmbLinkedIsacordNumbers((prev) => prev.filter((v) => v !== id));
    }
  };

  const handleNameChange = (value) => {
    const formatted = formatNameLive(value);
    setEmbName(formatted);
    if (!formatted) {
      setEmbError("");
      setNameCollisionThreadId(null);
      return;
    }
    const isUnique = validateNameUnique(embroideryThreadColors || [], formatted, "label");
    if (!isUnique) {
      const existing = (embroideryThreadColors || []).find((tc) => formatNameOnBlur(tc.label) === formatNameOnBlur(formatted));
      setEmbError("A thread color with this name already exists.");
      setNameCollisionThreadId(existing?.value);
    } else {
      setEmbError("");
      setNameCollisionThreadId(null);
    }
  };

  const handleNameBlur = () => {
    const formatted = formatNameOnBlur(embName);
    if (formatted !== embName) {
      setEmbName(formatted);
    }
    if (!formatted) {
      setEmbError("");
      setNameCollisionThreadId(null);
      return;
    }
    const isUnique = validateNameUnique(embroideryThreadColors || [], formatted, "label");
    if (!isUnique) {
      const existing = (embroideryThreadColors || []).find((tc) => formatNameOnBlur(tc.label) === formatNameOnBlur(formatted));
      setEmbError("A thread color with this name already exists.");
      setNameCollisionThreadId(existing?.value);
    } else {
      setEmbError("");
      setNameCollisionThreadId(null);
    }
  };

  const handleEmbSave = () => {
    const name = formatNameOnBlur(embName);
    setEmbFormattedName(name);
    if (!name) {
      setEmbError("Please enter a thread color name.");
      setNameCollisionThreadId(null);
      return;
    }
    if (!embIsacord.length) {
      setEmbError("Please select at least one Isacord number.");
      setNameCollisionThreadId(null);
      return;
    }
    const isUnique = validateNameUnique(embroideryThreadColors || [], name, "label");
    if (!isUnique) {
      const existing = (embroideryThreadColors || []).find((tc) => formatNameOnBlur(tc.label) === name);
      setEmbError("A thread color with this name already exists.");
      setNameCollisionThreadId(existing?.value);
      return;
    }
    setNameCollisionThreadId(null);
    const existingAbbrs = (embroideryThreadColors || []).map((tc) => tc.abbreviation);
    const abbr = generateEmbAbbreviation(name, existingAbbrs);
    setEmbGeneratedAbbr(abbr);
    setEmbModalOpen(true);
    setEmbError("");
  };

  const handleEmbConfirm = () => {
    const formData = new FormData();
    formData.append("type", "embroidery");
    formData.append("name", embFormattedName);
    formData.append("abbreviation", embGeneratedAbbr);
    embIsacord.forEach((id) => formData.append("isacordNumbers", id));

    fetcher.submit(formData, { method: "post" });
    setEmbModalOpen(false);
    setEmbName("");
    setEmbIsacord([]);
    setEmbGeneratedAbbr("");
    setEmbFormattedName("");
    setEmbError("");
  };

  const handleEmbModalClose = () => {
    setEmbModalOpen(false);
  };

  useEffect(() => {
    if (fetcher.data && fetcher.data.error) {
      setEmbError(fetcher.data.error);
    }
  }, [fetcher.data]);

  const handleSwitchToUpdateFromName = () => {
    if (nameCollisionThreadId) {
      setEmbMode("update");
      setEmbSelectedThreadId(nameCollisionThreadId);
      setEmbName(embName);
      setEmbError("");
      setNameCollisionThreadId(null);
    }
  };

  const originalThread = (embroideryThreadColors || []).find((tc) => tc.value === embSelectedThreadId);
  const originalIsacordIds = (originalThread?.isacordNumbers || []).map((num) => num.value) || [];
  const addIsacordIds = embLinkedIsacordNumbers.filter((id) => !originalIsacordIds.includes(id));
  const removeIsacordIds = deletedIsacordNumbers;
  const hasUpdateChanges = addIsacordIds.length > 0 || removeIsacordIds.length > 0;

  const handleUpdateClick = () => {
    setUpdateModalOpen(true);
    setUpdateError("");
  };

  const handleUpdateConfirm = () => {
    if (!embSelectedThreadId) {
      setUpdateError("No thread selected.");
      return;
    }
    const formData = new FormData();
    formData.append("type", "updateEmbroidery");
    formData.append("threadId", embSelectedThreadId);
    addIsacordIds.forEach((id) => formData.append("addIsacordIds", id));
    removeIsacordIds.forEach((id) => formData.append("removeIsacordIds", id));

    fetcher.submit(formData, { method: "post" });
    setUpdateModalOpen(false);
  };

  const handleUpdateModalClose = () => {
    setUpdateModalOpen(false);
  };

  useEffect(() => {
    if (fetcher.data && fetcher.data.error) {
      setUpdateError(fetcher.data.error);
    }
  }, [fetcher.data]);

  const handleConfirmIsacordReassign = () => {
    const value = isacordReassignModal.num.value;
    if (embMode === "add") {
      if (!embIsacord.includes(value)) {
        setEmbIsacord((prev) => [...prev, value]);
      }
    } else if (embMode === "update") {
      if (!embLinkedIsacordNumbers.includes(value)) {
        setEmbLinkedIsacordNumbers((prev) => [...prev, value]);
      }
    }
    setIsacordReassignModal({ open: false, num: null, linkedThread: null });
    setEmbIsacordInput("");
  };

  const handleCancelIsacordReassign = () => {
    setIsacordReassignModal({ open: false, num: null, linkedThread: null });
    setEmbIsacordInput("");
  };

  return (
    <Card>
      <BlockStack gap="400">
        <Text variant="headingMd">Add Embroidery Thread Color</Text>
        <InlineStack gap="400" wrap={false}>
          <RadioButton
            label="Add New Name"
            checked={embMode === "add"}
            id="embMode-add"
            name="embMode"
            onChange={() => setEmbMode("add")}
          />
          <RadioButton
            label="Update Linked Colors"
            checked={embMode === "update"}
            id="embMode-update"
            name="embMode"
            onChange={() => setEmbMode("update")}
          />
        </InlineStack>
        <Divider borderColor="border" />

        {embMode === "update" ? (
          <BlockStack gap="400">
            <Combobox
              activator={
                <Combobox.TextField
                  label="Select Thread Name"
                  value={threadNameSearchInput}
                  onChange={setThreadNameSearchInput}
                  placeholder="Choose a thread color name"
                  autoComplete="off"
                />
              }
            >
              <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
                <Listbox
                  onSelect={(value) => {
                    setEmbSelectedThreadId(value);
                    const selected = embroideryThreadOptions.find((opt) => opt.value === value);
                    setThreadNameSearchInput(selected ? selected.label : "");
                  }}
                >
                  {embroideryThreadOptions
                    .filter((opt) => opt.label.toLowerCase().includes(threadNameSearchInput.toLowerCase()))
                    .map((option) => (
                      <Listbox.Option key={option.value} value={option.value}>
                        {option.label}
                      </Listbox.Option>
                    ))}
                </Listbox>
              </div>
            </Combobox>
            <Divider borderColor="border" />
            <Combobox
              activator={
                <Combobox.TextField
                  prefix={<Icon source={SearchIcon} />}
                  onChange={setEmbIsacordInput}
                  label="Add Isacord Number"
                  value={embIsacordInput}
                  placeholder="Search or select Isacord Number"
                  autoComplete="off"
                />
              }
            >
              {filteredUpdateIsacordOptions.length > 0 && (
                <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
                  <Listbox onSelect={handleUpdateIsacordSelect}>
                    {filteredUpdateIsacordOptions.map((option) => (
                      <Listbox.Option key={option.value} value={option.value}>
                        {option.label}
                      </Listbox.Option>
                    ))}
                  </Listbox>
                </div>
              )}
            </Combobox>
            <Text variant="bodyMd">Linked Isacord Numbers:</Text>
            <InlineStack gap="200" wrap>
              {embLinkedIsacordNumbers.map((id) => {
                const numObj = allIsacordOptions.find((num) => num.value === id);
                const isOriginal = originalLinkedIsacordNumbers.includes(id);
                const isDeleted = deletedIsacordNumbers.includes(id);
                return numObj ? (
                  <Tag key={id} onRemove={() => handleRemoveUpdateIsacord(id)}>
                    <InlineStack gap="100" align="center">
                      <Icon source={isDeleted ? DeleteIcon : isOriginal ? CheckCircleIcon : PlusCircleIcon} />
                      <span style={isDeleted ? { textDecoration: "line-through", opacity: 0.6 } : {}}>{numObj.label}</span>
                    </InlineStack>
                  </Tag>
                ) : null;
              })}
            </InlineStack>
            <Button primary onClick={handleUpdateClick} disabled={!hasUpdateChanges}>
              Update Embroidery Thread Color
            </Button>
            {updateError && <Text color="critical">{updateError}</Text>}
          </BlockStack>
        ) : (
          <BlockStack gap="400">
            <TextField
              label="Name"
              value={embName}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              autoComplete="off"
              error={embError}
            />
            {nameCollisionThreadId && (
              <div style={{ marginTop: 8 }}>
                <Button onClick={handleSwitchToUpdateFromName} size="slim">
                  This name already exists. Edit this color instead?
                </Button>
              </div>
            )}
            <Combobox
              activator={
                <Combobox.TextField
                  prefix={<Icon source={SearchIcon} />}
                  onChange={setEmbIsacordInput}
                  label="Isacord Numbers"
                  value={embIsacordInput}
                  placeholder="Search or select Isacord Numbers"
                  autoComplete="off"
                />
              }
            >
              {filteredIsacordOptions.length > 0 && (
                <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
                  <Listbox onSelect={handleIsacordSelect}>
                    {filteredIsacordOptions.map((option) => (
                      <Listbox.Option key={option.value} value={option.value}>
                        {option.label}
                      </Listbox.Option>
                    ))}
                  </Listbox>
                </div>
              )}
            </Combobox>
            <InlineStack gap="200" wrap>
              {embIsacord.map((id) => {
                const numObj = allIsacordOptions.find((num) => num.value === id);
                return (
                  <Tag key={id} onRemove={() => handleRemoveIsacord(id)}>
                    {numObj ? numObj.label : id}
                  </Tag>
                );
              })}
            </InlineStack>
            <Button primary onClick={handleEmbSave}>
              Save Embroidery Thread Color
            </Button>
          </BlockStack>
        )}
      </BlockStack>
      <ThreadCreateUpdateModal
        open={embModalOpen}
        onClose={handleEmbModalClose}
        title="Confirm New Embroidery Thread Color"
        primaryAction={{ content: "Confirm", onAction: handleEmbConfirm }}
        secondaryActions={[{ content: "Cancel", onAction: handleEmbModalClose }]}
      >
        <Text>
          <b>Name:</b> {embFormattedName}
        </Text>
        <Text>
          <b>Abbreviation:</b> {embGeneratedAbbr}
        </Text>
        <Text>
          <b>Isacord Numbers:</b>{" "}
          {embIsacord
            .map((id) => {
              const numObj = allIsacordOptions.find((num) => num.value === id);
              return numObj ? numObj.label : id;
            })
            .join(", ") || "None"}
        </Text>
      </ThreadCreateUpdateModal>
      <ThreadCreateUpdateModal
        open={updateModalOpen}
        onClose={handleUpdateModalClose}
        title="Confirm Update to Embroidery Thread Color"
        primaryAction={{ content: "Confirm Update", onAction: handleUpdateConfirm }}
        secondaryActions={[{ content: "Cancel", onAction: handleUpdateModalClose }]}
      >
        <Text variant="bodyMd">
          <b>Thread Name:</b> {originalThread?.label}
        </Text>
        <Text variant="bodyMd">
          <b>Add Isacord Numbers:</b>{" "}
          {addIsacordIds
            .map((id) => {
              const numObj = allIsacordOptions.find((num) => num.value === id);
              return numObj ? numObj.label : id;
            })
            .join(", ") || "None"}
        </Text>
        <Text variant="bodyMd">
          <b>Remove Isacord Numbers:</b>{" "}
          {removeIsacordIds
            .map((id) => {
              const numObj = allIsacordOptions.find((num) => num.value === id);
              return numObj ? numObj.label : id;
            })
            .join(", ") || "None"}
        </Text>
      </ThreadCreateUpdateModal>
      <ThreadReassignNumberModal
        open={isacordReassignModal.open}
        onClose={handleCancelIsacordReassign}
        numberLabel={isacordReassignModal.num?.label}
        currentThread={isacordReassignModal.linkedThread}
        onConfirm={handleConfirmIsacordReassign}
      />
    </Card>
  );
}
