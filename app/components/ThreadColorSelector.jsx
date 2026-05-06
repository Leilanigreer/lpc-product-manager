// app/components/ThreadColorSelector.jsx

import React, { useMemo, useState, useCallback } from 'react';
import { Card, Combobox, Listbox, Icon, Box, InlineStack, BlockStack, Text, Tag } from "@shopify/polaris";
import { SearchIcon } from '@shopify/polaris-icons';
import {
  isSingleEmbroideryMode,
  isSingleStitchingMode,
  firstCanonicalEmbroideryThread,
  sortedEmbroideryThreadsList,
  sortedStitchingThreadsList,
} from '../lib/utils/threadUtils';

// Styled Combobox List component to reduce repetition
const ComboboxList = ({ options, selectedValue, onSelect }) => (
  options.length > 0 && (
    <div className="border-2 border-gray-200 rounded-lg max-h-[300px] overflow-auto shadow-sm">
      <Listbox onSelect={onSelect}>
        {options.map((option) => (
          <Listbox.Option
            key={option.value}
            value={option.value}
            selected={option.value === selectedValue}
          >
            {option.displayText || option.label}
          </Listbox.Option>
        ))}
      </Listbox>
    </div>
  )
);

const ThreadColorSelector = ({
  stitchingThreadColors,
  embroideryThreadColors,
  formState,
  onChange
}) => {
  const [isacordInputValue, setIsacordInputValue] = useState('');
  const [amannInputValue, setAmannInputValue] = useState('');
  const [supportingAmannInputValue, setSupportingAmannInputValue] = useState('');

  const singleStitchingCollection = isSingleStitchingMode(formState);
  const singleEmbroidery = isSingleEmbroideryMode(formState);

  const isacordOptions = useMemo(() => {
    return embroideryThreadColors
      .map((thread) =>
        thread.isacordNumbers?.map((number) => {
          const fullData = {
            threadValue: thread.value,
            threadLabel: thread.label,
            threadAbbreviation: thread.abbreviation,
          };

          return {
            label: number.label,
            value: number.value,
            displayText: `${number.label} - ${thread.label}`,
            searchText: `${number.label} ${thread.label}`.toLowerCase(),
            _fullData: fullData,
          };
        })
      )
      .flat()
      .filter(Boolean);
  }, [embroideryThreadColors]);

  const amannOptions = useMemo(
    () =>
      stitchingThreadColors
        .map((thread) =>
          thread.amannNumbers?.map((number) => {
            const fullData = {
              threadValue: thread.value,
              threadLabel: thread.label,
              threadAbbreviation: thread.abbreviation,
            };

            return {
              label: number.label,
              value: number.value,
              displayText: `${number.label} - ${thread.label}`,
              searchText: `${number.label} ${thread.label}`.toLowerCase(),
              _fullData: fullData,
            };
          })
        )
        .flat()
        .filter(Boolean),
    [stitchingThreadColors]
  );

  /** Single STITCHING row: amannNumbers[0] = primary (SKU/title); [1..] = supporting (colors). */
  const stitchingPrimaryRow = useMemo(() => {
    const rows = Object.values(formState.stitchingThreads || {});
    return rows[0] ?? null;
  }, [formState.stitchingThreads]);

  const selectedSupportingAmannIds = useMemo(() => {
    const nums = stitchingPrimaryRow?.amannNumbers;
    if (!Array.isArray(nums) || nums.length < 2) return new Set();
    return new Set(nums.slice(1).map((n) => n?.value).filter(Boolean));
  }, [stitchingPrimaryRow]);

  const supportingAmannOptions = useMemo(() => {
    if (!singleStitchingCollection) return [];
    const row = stitchingPrimaryRow;
    if (!row?.amannNumbers?.[0]?.value) return [];
    const primaryAmannId = row.amannNumbers[0].value;
    return amannOptions.filter(
      (o) => o.value !== primaryAmannId && !selectedSupportingAmannIds.has(o.value)
    );
  }, [
    amannOptions,
    singleStitchingCollection,
    stitchingPrimaryRow,
    selectedSupportingAmannIds,
  ]);

  const supportingTagsSorted = useMemo(() => {
    const nums = stitchingPrimaryRow?.amannNumbers?.slice(1) || [];
    return [...nums].filter((n) => n?.value).sort((a, b) =>
      String(a.label || "").localeCompare(String(b.label || ""))
    );
  }, [stitchingPrimaryRow]);

  const labelForAmannGid = useCallback(
    (gid, fallbackLabel) => {
      const opt = amannOptions.find((o) => o.value === gid);
      if (opt?.displayText) return opt.displayText;
      return fallbackLabel || gid || "Unknown";
    },
    [amannOptions]
  );

  const handleIsacordSelectSingle = useCallback(
    (value) => {
      const selectedOption = isacordOptions.find((option) => option.value === value);
      if (!selectedOption) return;
      const { _fullData } = selectedOption;
      const threadData = {
        value: _fullData.threadValue,
        label: _fullData.threadLabel,
        abbreviation: _fullData.threadAbbreviation,
        isacordNumbers: [
          {
            value: selectedOption.value,
            label: selectedOption.label,
          },
        ],
        isThread: true,
      };
      onChange('embroideryThreads', { [selectedOption.value]: threadData });
      setIsacordInputValue('');
    },
    [isacordOptions, onChange]
  );

  const handleIsacordSelectMulti = useCallback(
    (value) => {
      const selectedOption = isacordOptions.find((option) => option.value === value);
      if (!selectedOption) return;
      const { _fullData } = selectedOption;
      const threadData = {
        value: _fullData.threadValue,
        label: _fullData.threadLabel,
        abbreviation: _fullData.threadAbbreviation,
        isacordNumbers: [
          {
            value: selectedOption.value,
            label: selectedOption.label,
          },
        ],
        isThread: true,
      };
      onChange('embroideryThreads', {
        ...formState.embroideryThreads,
        [selectedOption.value]: threadData,
      });
      setIsacordInputValue('');
    },
    [isacordOptions, onChange, formState.embroideryThreads]
  );

  const handleRemoveEmbroideryThread = useCallback(
    (isacordGid) => {
      const next = { ...formState.embroideryThreads };
      delete next[isacordGid];
      onChange('embroideryThreads', next);
    },
    [formState.embroideryThreads, onChange]
  );

  const handleAmannSelect = useCallback(
    (value) => {
      const selectedOption = amannOptions.find((option) => option.value === value);
      if (!selectedOption) return;
      const { _fullData } = selectedOption;

      const threadData = {
        value: _fullData.threadValue,
        label: _fullData.threadLabel,
        abbreviation: _fullData.threadAbbreviation,
        amannNumbers: [
          {
            value: selectedOption.value,
            label: selectedOption.label,
          },
        ],
        isThread: true,
      };

      onChange(
        'stitchingThreads',
        singleStitchingCollection
          ? { [threadData.value]: threadData }
          : {
              ...formState.stitchingThreads,
              [threadData.value]: threadData,
            }
      );

      setAmannInputValue('');
      setSupportingAmannInputValue('');
    },
    [amannOptions, onChange, formState.stitchingThreads, singleStitchingCollection]
  );

  const handleSupportingAmannSelect = useCallback(
    (value) => {
      const selectedOption = supportingAmannOptions.find(
        (option) => option.value === value
      );
      if (!selectedOption || !stitchingPrimaryRow?.amannNumbers?.[0]) return;

      const primaryNum = stitchingPrimaryRow.amannNumbers[0];
      if (selectedOption.value === primaryNum.value) return;

      const existing = stitchingPrimaryRow.amannNumbers.slice(1);
      if (existing.some((n) => n?.value === selectedOption.value)) return;

      const threadData = {
        ...stitchingPrimaryRow,
        amannNumbers: [
          primaryNum,
          ...existing,
          {
            value: selectedOption.value,
            label: selectedOption.label,
          },
        ],
      };

      onChange('stitchingThreads', { [threadData.value]: threadData });
      setSupportingAmannInputValue('');
    },
    [supportingAmannOptions, stitchingPrimaryRow, onChange]
  );

  const handleRemoveSupportingAmann = useCallback(
    (amannGid) => {
      if (!stitchingPrimaryRow?.amannNumbers?.[0]) return;
      const primaryNum = stitchingPrimaryRow.amannNumbers[0];
      const rest = stitchingPrimaryRow.amannNumbers
        .slice(1)
        .filter((n) => n?.value !== amannGid);
      const threadData = {
        ...stitchingPrimaryRow,
        amannNumbers: [primaryNum, ...rest],
      };
      onChange('stitchingThreads', { [threadData.value]: threadData });
    },
    [stitchingPrimaryRow, onChange]
  );

  const handleRemoveStitchingThread = useCallback(
    (threadValue) => {
      const newThreads = { ...formState.stitchingThreads };
      delete newThreads[threadValue];
      onChange('stitchingThreads', newThreads);
      setSupportingAmannInputValue('');
    },
    [formState.stitchingThreads, onChange]
  );

  const filteredIsacordOptions = useMemo(() => {
    const searchTerm = isacordInputValue.toLowerCase();
    let opts =
      searchTerm === ''
        ? isacordOptions
        : isacordOptions.filter((option) => option.searchText?.includes(searchTerm));
    if (!singleEmbroidery) {
      const selectedIds = new Set(Object.keys(formState.embroideryThreads || {}));
      opts = opts.filter((o) => !selectedIds.has(o.value));
    }
    return opts;
  }, [isacordOptions, isacordInputValue, singleEmbroidery, formState.embroideryThreads]);

  const filteredAmannOptions = useMemo(() => {
    const searchTerm = amannInputValue.toLowerCase();
    return searchTerm === ''
      ? amannOptions
      : amannOptions.filter((option) => option.searchText?.includes(searchTerm));
  }, [amannOptions, amannInputValue]);

  const filteredSupportingAmannOptions = useMemo(() => {
    const searchTerm = supportingAmannInputValue.toLowerCase();
    return searchTerm === ''
      ? supportingAmannOptions
      : supportingAmannOptions.filter((option) =>
          option.searchText?.includes(searchTerm)
        );
  }, [supportingAmannOptions, supportingAmannInputValue]);

  const getEmbroideryPlaceholder = () => {
    if (singleEmbroidery) {
      const thread = firstCanonicalEmbroideryThread(formState.embroideryThreads);
      return thread?.isacordNumbers?.[0]?.label
        ? `${thread.isacordNumbers[0].label} - ${thread.label}`
        : "Search by number or color name";
    }
    return "Search by number or color name";
  };

  const singleSelectedIsacordValue =
    firstCanonicalEmbroideryThread(formState.embroideryThreads)?.isacordNumbers?.[0]
      ?.value ?? null;

  return (
    <Card>
      <BlockStack gap="400">
        <BlockStack gap="300">
          <Text variant="headingMd">
            Embroidery Thread
            {singleEmbroidery && (
              <Text variant="bodySm" as="span" color="subdued">
                {" "}
                (single selection)
              </Text>
            )}
          </Text>

          {singleEmbroidery ? (
            <Box width="100%">
              <Combobox
                activator={
                  <Combobox.TextField
                    prefix={<Icon source={SearchIcon} />}
                    onChange={setIsacordInputValue}
                    label="Select Isacord Number - Used in Title and SKU"
                    value={isacordInputValue}
                    placeholder={getEmbroideryPlaceholder()}
                    autoComplete="off"
                  />
                }
              >
                <ComboboxList
                  options={filteredIsacordOptions}
                  selectedValue={singleSelectedIsacordValue}
                  onSelect={handleIsacordSelectSingle}
                />
              </Combobox>
            </Box>
          ) : (
            <BlockStack gap="200">
              <Box width="100%">
                <Combobox
                  activator={
                    <Combobox.TextField
                      prefix={<Icon source={SearchIcon} />}
                      onChange={setIsacordInputValue}
                      label="Add Isacord Number"
                      value={isacordInputValue}
                      placeholder={getEmbroideryPlaceholder()}
                      autoComplete="off"
                    />
                  }
                >
                  <ComboboxList
                    options={filteredIsacordOptions}
                    selectedValue={null}
                    onSelect={handleIsacordSelectMulti}
                  />
                </Combobox>
              </Box>
              <InlineStack gap="200" wrap>
                {sortedEmbroideryThreadsList(formState.embroideryThreads).map((thread) => {
                  const isacordGid = thread.isacordNumbers[0].value;
                  return (
                    <Tag key={isacordGid} onRemove={() => handleRemoveEmbroideryThread(isacordGid)}>
                      {thread.isacordNumbers?.[0]?.label && thread.label
                        ? `${thread.isacordNumbers[0].label} - ${thread.label}`
                        : "Unknown thread"}
                    </Tag>
                  );
                })}
              </InlineStack>
            </BlockStack>
          )}
        </BlockStack>

        <BlockStack gap="300">
          <Text variant="headingMd">
            Stitching Thread
            {singleStitchingCollection && " (Primary + supporting Amann)"}
          </Text>
          {singleStitchingCollection ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                gap: "var(--p-space-400)",
              }}
            >
              <BlockStack gap="200">
                <Box width="100%" minWidth="0">
                  <Combobox
                    activator={
                      <Combobox.TextField
                        prefix={<Icon source={SearchIcon} />}
                        onChange={setAmannInputValue}
                        label="Primary Amann — Used in Title & SKU"
                        value={amannInputValue}
                        placeholder="Search by number or color name"
                        autoComplete="off"
                        disabled={
                          Object.keys(formState.stitchingThreads || {}).length > 0
                        }
                      />
                    }
                  >
                    <ComboboxList
                      options={filteredAmannOptions}
                      selectedValue={null}
                      onSelect={handleAmannSelect}
                    />
                  </Combobox>
                </Box>
                <InlineStack gap="200" wrap>
                  {stitchingPrimaryRow?.amannNumbers?.[0] && stitchingPrimaryRow.label ? (
                    <Tag
                      key={`primary-${stitchingPrimaryRow.amannNumbers[0].value}`}
                      onRemove={() =>
                        handleRemoveStitchingThread(stitchingPrimaryRow.value)
                      }
                    >
                      {`${stitchingPrimaryRow.amannNumbers[0].label} — ${stitchingPrimaryRow.label}`}
                    </Tag>
                  ) : null}
                </InlineStack>
              </BlockStack>
              <BlockStack gap="200">
                <Box width="100%" minWidth="0">
                  <Combobox
                    activator={
                      <Combobox.TextField
                        prefix={<Icon source={SearchIcon} />}
                        onChange={setSupportingAmannInputValue}
                        label="Supporting Amann — colors"
                        value={supportingAmannInputValue}
                        placeholder={
                          stitchingPrimaryRow?.amannNumbers?.[0]
                            ? "Add supporting Amann (repeat as needed)"
                            : "Select primary Amann first"
                        }
                        autoComplete="off"
                        disabled={!stitchingPrimaryRow?.amannNumbers?.[0]}
                      />
                    }
                  >
                    <ComboboxList
                      options={filteredSupportingAmannOptions}
                      selectedValue={null}
                      onSelect={handleSupportingAmannSelect}
                    />
                  </Combobox>
                </Box>
                <InlineStack gap="200" wrap>
                  {supportingTagsSorted.map((n) => (
                    <Tag
                      key={n.value}
                      onRemove={() => handleRemoveSupportingAmann(n.value)}
                    >
                      {labelForAmannGid(n.value, n.label)}
                    </Tag>
                  ))}
                </InlineStack>
              </BlockStack>
            </div>
          ) : (
            <Box width="100%">
              <Combobox
                activator={
                  <Combobox.TextField
                    prefix={<Icon source={SearchIcon} />}
                    onChange={setAmannInputValue}
                    label="Add Amann Number"
                    value={amannInputValue}
                    placeholder="Search by number or color name"
                    autoComplete="off"
                  />
                }
              >
                <ComboboxList
                  options={filteredAmannOptions}
                  selectedValue={null}
                  onSelect={handleAmannSelect}
                />
              </Combobox>
            </Box>
          )}

          {!singleStitchingCollection ? (
            <InlineStack gap="200" wrap>
              {sortedStitchingThreadsList(formState.stitchingThreads).map((thread) => (
                <Tag
                  key={thread.value}
                  onRemove={() => handleRemoveStitchingThread(thread.value)}
                >
                  {thread.amannNumbers?.[0]?.label && thread.label
                    ? `${thread.amannNumbers[0].label} - ${thread.label}`
                    : "Unknown thread"}
                </Tag>
              ))}
            </InlineStack>
          ) : null}
        </BlockStack>
      </BlockStack>
    </Card>
  );
};

export default React.memo(ThreadColorSelector);
