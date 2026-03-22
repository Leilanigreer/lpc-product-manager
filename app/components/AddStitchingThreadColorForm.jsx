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
  Divider,
  RadioButton,
} from "@shopify/polaris";
import { SearchIcon, CheckCircleIcon, PlusCircleIcon, DeleteIcon } from "@shopify/polaris-icons";
import { formatNameLive, formatNameOnBlur, validateNameUnique, generateStitchAbbreviation } from "../lib/utils/colorNameUtils";
import ThreadCreateUpdateModal from "./ThreadCreateUpdateModal";
import ThreadReassignNumberModal from "./ThreadReassignNumberModal";

export default function AddStitchingThreadColorForm({ stitchingThreadColors, fetcher, unlinkedAmannNumbers }) {
  const [mode, setMode] = useState("add");
  const [stitchName, setStitchName] = useState("");
  const [stitchAmann, setStitchAmann] = useState([]);
  const [stitchAmannInput, setStitchAmannInput] = useState("");
  const [stitchModalOpen, setStitchModalOpen] = useState(false);
  const [stitchNameError, setStitchNameError] = useState("");
  const [stitchGeneratedAbbr, setStitchGeneratedAbbr] = useState("");
  const [stitchFormattedName, setStitchFormattedName] = useState("");
  const [selectedThreadId, setSelectedThreadId] = useState("");
  const [linkedAmannNumbers, setLinkedAmannNumbers] = useState([]);
  const [originalLinkedAmannNumbers, setOriginalLinkedAmannNumbers] = useState([]);
  const [deletedAmannNumbers, setDeletedAmannNumbers] = useState([]);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [nameCollisionThreadId, setNameCollisionThreadId] = useState(null);
  const [threadNameSearchInput, setThreadNameSearchInput] = useState("");
  const [amannReassignModal, setAmannReassignModal] = useState({ open: false, num: null, linkedThread: null });
  const [stitchAmannInputUpdate, setStitchAmannInputUpdate] = useState("");

  const threadOptions = useMemo(
    () => (stitchingThreadColors || []).map((tc) => ({ label: tc.label, value: tc.value })),
    [stitchingThreadColors]
  );

  const allAmannOptions = useMemo(() => {
    const linked = (stitchingThreadColors || []).flatMap((tc) =>
      (tc.amannNumbers || []).map((num) => ({ ...num, threadId: tc.value, threadName: tc.label }))
    );
    const unlinked = (unlinkedAmannNumbers || []).map((num) => ({ ...num, threadId: null }));
    return [...linked, ...unlinked];
  }, [stitchingThreadColors, unlinkedAmannNumbers]);

  useEffect(() => {
    if (mode === "add") {
      setThreadNameSearchInput("");
      setStitchName("");
      setStitchAmann([]);
      setSelectedThreadId("");
      setOriginalLinkedAmannNumbers([]);
      setLinkedAmannNumbers([]);
      setDeletedAmannNumbers([]);
      setUpdateModalOpen(false);
      setUpdateError("");
      setStitchNameError("");
      setStitchGeneratedAbbr("");
      setStitchFormattedName("");
      setNameCollisionThreadId(null);
    }
  }, [mode]);

  useEffect(() => {
    if (mode === "update" && selectedThreadId) {
      const thread = (stitchingThreadColors || []).find((tc) => tc.value === selectedThreadId);
      setThreadNameSearchInput(thread?.label || "");
      setStitchName(thread?.label || "");
      const originalIds = (thread?.amannNumbers || []).map((num) => num.value);
      setOriginalLinkedAmannNumbers(originalIds);
      setLinkedAmannNumbers(originalIds);
    }
  }, [mode, selectedThreadId, stitchingThreadColors]);

  const filteredAddAmannOptions = useMemo(() => {
    const search = stitchAmannInput.toLowerCase();
    return allAmannOptions
      .filter((num) => num.label.toLowerCase().includes(search) && !stitchAmann.includes(num.value))
      .map((num) => ({
        ...num,
        label: num.threadId && num.threadName ? `${num.label} (linked to ${num.threadName})` : num.label,
      }));
  }, [allAmannOptions, stitchAmannInput, stitchAmann]);

  const filteredUpdateAmannOptions = useMemo(() => {
    const search = stitchAmannInputUpdate.toLowerCase();
    return allAmannOptions
      .filter((num) => num.label.toLowerCase().includes(search) && !linkedAmannNumbers.includes(num.value))
      .map((num) => ({
        ...num,
        label:
          num.threadId && num.threadId !== selectedThreadId && num.threadName
            ? `${num.label} (linked to ${num.threadName})`
            : num.label,
      }));
  }, [allAmannOptions, stitchAmannInputUpdate, linkedAmannNumbers, selectedThreadId]);

  const originalThread = (stitchingThreadColors || []).find((tc) => tc.value === selectedThreadId);
  const originalAmannIds = (originalThread?.amannNumbers || []).map((num) => num.value) || [];
  const addAmannIds = linkedAmannNumbers.filter((id) => !originalAmannIds.includes(id));
  const removeAmannIds = deletedAmannNumbers;
  const hasUpdateChanges = addAmannIds.length > 0 || removeAmannIds.length > 0;

  const handleUpdateClick = () => {
    setUpdateModalOpen(true);
    setUpdateError("");
  };

  const handleUpdateConfirm = () => {
    if (!selectedThreadId) {
      setUpdateError("No thread selected.");
      return;
    }
    const formData = new FormData();
    formData.append("type", "updateStitching");
    formData.append("threadId", selectedThreadId);
    addAmannIds.forEach((id) => formData.append("addAmannIds", id));
    removeAmannIds.forEach((id) => formData.append("removeAmannIds", id));

    fetcher.submit(formData, { method: "post" });
    setUpdateModalOpen(false);
  };

  const handleUpdateModalClose = () => {
    setUpdateModalOpen(false);
  };

  useEffect(() => {
    if (fetcher.data && fetcher.data.error) {
      setUpdateError(fetcher.data.error);
    } else if (fetcher.data && fetcher.data.success) {
      setDeletedAmannNumbers([]);
    }
  }, [fetcher.data]);

  const handleNameChange = (value) => {
    const formatted = formatNameLive(value);
    setStitchName(formatted);
    if (!formatted) {
      setStitchNameError("");
      setNameCollisionThreadId(null);
      return;
    }
    const isUnique = validateNameUnique(stitchingThreadColors || [], formatted, "label");
    if (!isUnique) {
      const existingThread = (stitchingThreadColors || []).find((tc) => formatNameOnBlur(tc.label) === formatNameOnBlur(formatted));
      setStitchNameError("A thread color with this name already exists.");
      setNameCollisionThreadId(existingThread?.value);
    } else {
      setStitchNameError("");
      setNameCollisionThreadId(null);
    }
  };

  const handleNameBlur = () => {
    const formatted = formatNameOnBlur(stitchName);
    if (formatted !== stitchName) {
      setStitchName(formatted);
    }
    if (!formatted) {
      setStitchNameError("");
      setNameCollisionThreadId(null);
      return;
    }
    const isUnique = validateNameUnique(stitchingThreadColors || [], formatted, "label");
    if (!isUnique) {
      const existingThread = (stitchingThreadColors || []).find((tc) => formatNameOnBlur(tc.label) === formatNameOnBlur(formatted));
      setStitchNameError("A thread color with this name already exists.");
      setNameCollisionThreadId(existingThread?.value);
    } else {
      setStitchNameError("");
      setNameCollisionThreadId(null);
    }
  };

  const handleStitchSave = () => {
    const name = formatNameOnBlur(stitchName);
    setStitchFormattedName(name);
    if (!stitchAmann.length) {
      setStitchNameError("Please select at least one Amann number.");
      setNameCollisionThreadId(null);
      return;
    }
    const isUnique = validateNameUnique(stitchingThreadColors || [], name, "label");
    if (!isUnique) {
      const existingThread = (stitchingThreadColors || []).find((tc) => formatNameOnBlur(tc.label) === name);
      setStitchNameError("A thread color with this name already exists.");
      setNameCollisionThreadId(existingThread?.value);
      return;
    }
    setNameCollisionThreadId(null);
    const existingAbbrs = (stitchingThreadColors || []).map((tc) => tc.abbreviation);
    const abbr = generateStitchAbbreviation(name, existingAbbrs);
    setStitchGeneratedAbbr(abbr);
    setStitchModalOpen(true);
    setStitchNameError("");
  };

  const handleStitchConfirm = () => {
    const formData = new FormData();
    formData.append("type", "stitching");
    formData.append("name", stitchFormattedName);
    formData.append("abbreviation", stitchGeneratedAbbr);
    stitchAmann.forEach((id) => formData.append("amannNumbers", id));

    fetcher.submit(formData, { method: "post" });
    setStitchModalOpen(false);
    setStitchName("");
    setStitchAmann([]);
    setStitchAmannInput("");
    setStitchGeneratedAbbr("");
    setStitchFormattedName("");
    setStitchNameError("");
  };

  const handleStitchModalClose = () => {
    setStitchModalOpen(false);
  };

  const handleAddAmannSelect = (value) => {
    const numObj = allAmannOptions.find((num) => num.value === value);
    if (numObj && numObj.threadId && !stitchAmann.includes(value)) {
      setAmannReassignModal({ open: true, num: numObj, linkedThread: numObj.threadName });
      return;
    }
    if (!stitchAmann.includes(value)) {
      setStitchAmann((prev) => [...prev, value]);
    }
    setStitchAmannInput("");
  };

  const handleRemoveAddAmann = (id) => {
    setStitchAmann((prev) => prev.filter((v) => v !== id));
  };

  const handleSwitchToUpdateFromName = () => {
    if (nameCollisionThreadId) {
      setMode("update");
      setSelectedThreadId(nameCollisionThreadId);
      setStitchNameError("");
      setNameCollisionThreadId(null);
    }
  };

  const handleUpdateAmannSelect = (value) => {
    setStitchAmannInputUpdate("");
    const numObj = allAmannOptions.find((num) => num.value === value);
    if (numObj && numObj.threadId && numObj.threadId !== selectedThreadId && !linkedAmannNumbers.includes(value)) {
      setAmannReassignModal({ open: true, num: numObj, linkedThread: numObj.threadName });
      return;
    }
    if (!linkedAmannNumbers.includes(value)) {
      setLinkedAmannNumbers((prev) => [...prev, value]);
    }
  };

  const handleRemoveUpdateAmann = (id) => {
    if (deletedAmannNumbers.includes(id)) {
      setDeletedAmannNumbers((prev) => prev.filter((v) => v !== id));
    } else if (originalLinkedAmannNumbers.includes(id)) {
      setDeletedAmannNumbers((prev) => [...prev, id]);
    } else {
      setLinkedAmannNumbers((prev) => prev.filter((v) => v !== id));
    }
  };

  const handleConfirmAmannReassign = () => {
    const value = amannReassignModal.num.value;
    if (mode === "add") {
      if (!stitchAmann.includes(value)) {
        setStitchAmann((prev) => [...prev, value]);
      }
    } else if (mode === "update") {
      if (!linkedAmannNumbers.includes(value)) {
        setLinkedAmannNumbers((prev) => [...prev, value]);
      }
    }
    setAmannReassignModal({ open: false, num: null, linkedThread: null });
    setStitchAmannInput("");
  };

  const handleCancelAmannReassign = () => {
    setAmannReassignModal({ open: false, num: null, linkedThread: null });
    setStitchAmannInput("");
  };

  useEffect(() => {
    if (mode === "update") {
      setStitchAmannInputUpdate("");
    }
  }, [mode, selectedThreadId]);

  return (
    <Card>
      <BlockStack gap="400">
        <Text variant="headingMd">Add Stitching Thread Color</Text>
        <InlineStack gap="400" wrap={false}>
          <RadioButton
            label="Add New Name"
            checked={mode === "add"}
            id="stitchMode-add"
            name="stitchMode"
            onChange={() => setMode("add")}
          />
          <RadioButton
            label="Update Linked Colors"
            checked={mode === "update"}
            id="stitchMode-update"
            name="stitchMode"
            onChange={() => setMode("update")}
          />
        </InlineStack>
        <Divider borderColor="border" />

        {mode === "add" && (
          <TextField
            label="Name"
            value={stitchName}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            autoComplete="off"
            error={stitchNameError}
          />
        )}
        {nameCollisionThreadId && mode === "add" && (
          <div style={{ marginTop: 8 }}>
            <Button onClick={handleSwitchToUpdateFromName} size="slim">
              This name already exists. Edit this color instead?
            </Button>
          </div>
        )}

        {mode === "update" ? (
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
                    setSelectedThreadId(value);
                    const selected = threadOptions.find((opt) => opt.value === value);
                    setThreadNameSearchInput(selected ? selected.label : "");
                  }}
                >
                  {threadOptions
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
                  onChange={setStitchAmannInputUpdate}
                  label="Add Amann Number"
                  value={stitchAmannInputUpdate}
                  placeholder="Search or select Amann Numbers"
                  autoComplete="off"
                />
              }
            >
              {filteredUpdateAmannOptions.length > 0 && (
                <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
                  <Listbox onSelect={handleUpdateAmannSelect}>
                    {filteredUpdateAmannOptions.map((option) => (
                      <Listbox.Option key={option.value} value={option.value}>
                        {option.label}
                      </Listbox.Option>
                    ))}
                  </Listbox>
                </div>
              )}
            </Combobox>

            <Text variant="bodyMd">Linked Amann Numbers:</Text>
            <InlineStack gap="200" wrap>
              {linkedAmannNumbers.map((id) => {
                const numObj = allAmannOptions.find((num) => num.value === id);
                const isOriginal = originalLinkedAmannNumbers.includes(id);
                const isDeleted = deletedAmannNumbers.includes(id);
                return numObj ? (
                  <Tag key={id} onRemove={() => handleRemoveUpdateAmann(id)}>
                    <InlineStack gap="100" align="center">
                      <Icon
                        source={isDeleted ? DeleteIcon : isOriginal ? CheckCircleIcon : PlusCircleIcon}
                        color={isDeleted ? "critical" : undefined}
                      />
                      <span style={isDeleted ? { textDecoration: "line-through", opacity: 0.6 } : {}}>{numObj.label}</span>
                    </InlineStack>
                  </Tag>
                ) : null;
              })}
            </InlineStack>

            <Button primary onClick={handleUpdateClick} disabled={!hasUpdateChanges}>
              Update Stitching Thread Color
            </Button>
            {updateError && <Text color="critical">{updateError}</Text>}
          </BlockStack>
        ) : (
          <BlockStack gap="400">
            <Combobox
              activator={
                <Combobox.TextField
                  prefix={<Icon source={SearchIcon} />}
                  onChange={setStitchAmannInput}
                  label="Amann Numbers"
                  value={stitchAmannInput}
                  placeholder="Search or select Amann Numbers"
                  autoComplete="off"
                />
              }
            >
              {filteredAddAmannOptions.length > 0 && (
                <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
                  <Listbox onSelect={handleAddAmannSelect}>
                    {filteredAddAmannOptions.map((option) => (
                      <Listbox.Option key={option.value} value={option.value}>
                        {option.label}
                      </Listbox.Option>
                    ))}
                  </Listbox>
                </div>
              )}
            </Combobox>
            <InlineStack gap="200" wrap>
              {stitchAmann.map((id) => {
                const numObj = allAmannOptions.find((num) => num.value === id);
                return (
                  <Tag key={id} onRemove={() => handleRemoveAddAmann(id)}>
                    {numObj ? numObj.label : id}
                  </Tag>
                );
              })}
            </InlineStack>
            <Button primary onClick={handleStitchSave}>
              Save Stitching Thread Color
            </Button>
          </BlockStack>
        )}
      </BlockStack>

      <ThreadCreateUpdateModal
        open={stitchModalOpen}
        onClose={handleStitchModalClose}
        title="Confirm New Stitching Thread Color"
        primaryAction={{ content: "Confirm", onAction: handleStitchConfirm }}
        secondaryActions={[{ content: "Cancel", onAction: handleStitchModalClose }]}
      >
        <Text>
          <b>Name:</b> {stitchFormattedName}
        </Text>
        <Text>
          <b>Abbreviation:</b> {stitchGeneratedAbbr}
        </Text>
        <Text>
          <b>Amann Numbers:</b>{" "}
          {stitchAmann
            .map((id) => {
              const numObj = allAmannOptions.find((num) => num.value === id);
              return numObj ? numObj.label : id;
            })
            .join(", ") || "None"}
        </Text>
      </ThreadCreateUpdateModal>

      <ThreadCreateUpdateModal
        open={updateModalOpen}
        onClose={handleUpdateModalClose}
        title="Confirm Update to Stitching Thread Color"
        primaryAction={{ content: "Confirm Update", onAction: handleUpdateConfirm }}
        secondaryActions={[{ content: "Cancel", onAction: handleUpdateModalClose }]}
      >
        <Text variant="bodyMd">
          <b>Thread Name:</b> {originalThread?.label}
        </Text>
        <Text variant="bodyMd">
          <b>Add Amann Numbers:</b>{" "}
          {addAmannIds
            .map((id) => {
              const numObj = allAmannOptions.find((num) => num.value === id);
              return numObj ? numObj.label : id;
            })
            .join(", ") || "None"}
        </Text>
        <Text variant="bodyMd">
          <b>Remove Amann Numbers:</b>{" "}
          {removeAmannIds
            .map((id) => {
              const numObj = allAmannOptions.find((num) => num.value === id);
              return numObj ? numObj.label : id;
            })
            .join(", ") || "None"}
        </Text>
      </ThreadCreateUpdateModal>

      <ThreadReassignNumberModal
        open={amannReassignModal.open}
        onClose={handleCancelAmannReassign}
        numberLabel={amannReassignModal.num?.label}
        currentThread={amannReassignModal.linkedThread}
        onConfirm={handleConfirmAmannReassign}
      />
    </Card>
  );
}
