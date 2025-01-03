// app/components/ThreadColorSelector.jsx

import React, { useMemo, useState, useCallback } from 'react';
import { Card, Combobox, Listbox, Icon, Box, InlineStack, BlockStack } from "@shopify/polaris";
import { SearchIcon } from '@shopify/polaris-icons';

const ThreadColorSelector = ({ 
  stitchingThreadColors,
  embroideryThreadColors,
  selectedEmbroideryColor, 
  selectedStitchingColor,
  matchingAmannNumber,
  matchingIsacordNumber,
  onChange 
}) => {
  const [isacordInputValue, setIsacordInputValue] = useState('');
  const [amannInputValue, setAmannInputValue] = useState('');

  // Enhanced option structure that maintains color context
  const isacordOptions = useMemo(() => 
    embroideryThreadColors.flatMap(thread => 
      (thread.isacordNumbers || []).map(number => ({
        label: number.label,
        value: number.value,
        threadId: thread.value,
        threadName: thread.label, // Store the thread name
        displayText: `${number.label} - ${thread.label}`, // Combined display
        searchText: `${number.label} ${thread.label}`.toLowerCase() // For searching
      }))
    ),
    [embroideryThreadColors]
  );

  const amannOptions = useMemo(() => 
    stitchingThreadColors.flatMap(thread => 
      (thread.amannNumbers || []).map(number => ({
        label: number.label,
        value: number.value,
        threadId: thread.value,
        threadName: thread.label,
        displayText: `${number.label} - ${thread.label}`,
        searchText: `${number.label} ${thread.label}`.toLowerCase()
      }))
    ),
    [stitchingThreadColors]
  );

  const updateIsacordOptions = useCallback((value) => {
    setIsacordInputValue(value);
  }, []);

  const updateAmannOptions = useCallback((value) => {
    setAmannInputValue(value);
  }, []);

  const handleIsacordSelect = useCallback((value) => {
    const selectedOption = isacordOptions.find(option => option.value === value);
    if (selectedOption) {
      onChange('selectedEmbroideryColor', {
        id: selectedOption.threadId,
        name: selectedOption.threadName,
        number: selectedOption.label
      });
      onChange('matchingIsacordNumber', selectedOption.value);
      setIsacordInputValue('');
    }
  }, [isacordOptions, onChange]);

  const handleAmannSelect = useCallback((value) => {
    const selectedOption = amannOptions.find(option => option.value === value);
    if (selectedOption) {
      onChange('selectedStitchingColor', {
        id: selectedOption.threadId,
        name: selectedOption.threadName,
        number: selectedOption.label
      });
      onChange('matchingAmannNumber', selectedOption.value);
      setAmannInputValue('');
    }
  }, [amannOptions, onChange]);

  // Search now checks both number and color name
  const filteredIsacordOptions = useMemo(() => {
    const searchTerm = isacordInputValue.toLowerCase();
    return searchTerm === '' 
      ? isacordOptions 
      : isacordOptions.filter(option => 
          option.searchText.includes(searchTerm)
        );
  }, [isacordOptions, isacordInputValue]);

  const filteredAmannOptions = useMemo(() => {
    const searchTerm = amannInputValue.toLowerCase();
    return searchTerm === '' 
      ? amannOptions 
      : amannOptions.filter(option => 
          option.searchText.includes(searchTerm)
        );
  }, [amannOptions, amannInputValue]);

  // Enhanced display for selected values
  const getSelectedDisplayText = useCallback((options, selectedValue) => {
    const option = options.find(opt => opt.value === selectedValue);
    return option ? option.displayText : '';
  }, []);

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

  return (
    <Card>
      <InlineStack gap="400" align="start" wrap={false}>
        <Box width="50%">
          <BlockStack gap="400">
            <Combobox
              activator={
                <Combobox.TextField
                  prefix={<Icon source={SearchIcon} />}
                  onChange={updateIsacordOptions}
                  label="Select Isacord Number"
                  value={isacordInputValue}
                  placeholder={matchingIsacordNumber ? 
                    getSelectedDisplayText(isacordOptions, matchingIsacordNumber) : 
                    "Search by number or color name"}
                  autoComplete="off"
                />
              }
            >
              <ComboboxList 
                options={filteredIsacordOptions}
                selectedValue={matchingIsacordNumber}
                onSelect={handleIsacordSelect}
              />
            </Combobox>
          </BlockStack>
        </Box>

        <Box width="50%">
          <BlockStack gap="400">
            <Combobox
              activator={
                <Combobox.TextField
                  prefix={<Icon source={SearchIcon} />}
                  onChange={updateAmannOptions}
                  label="Select Amann Number"
                  value={amannInputValue}
                  placeholder={matchingAmannNumber ? 
                    getSelectedDisplayText(amannOptions, matchingAmannNumber) : 
                    "Search by number or color name"}
                  autoComplete="off"
                />
              }
            >
              <ComboboxList 
                options={filteredAmannOptions}
                selectedValue={matchingAmannNumber}
                onSelect={handleAmannSelect}
              />
            </Combobox>
          </BlockStack>
        </Box>
      </InlineStack>
    </Card>
  );
};

export default React.memo(ThreadColorSelector);