// app/components/ThreadColorSelector.jsx

import React, { useMemo, useState, useCallback } from 'react';
import { Card, Combobox, Listbox, Icon, Box, InlineStack, BlockStack, Text, Tag } from "@shopify/polaris";
import { SearchIcon } from '@shopify/polaris-icons';

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
  // Local state for input fields
  const [isacordInputValue, setIsacordInputValue] = useState('');
  const [amannInputValue, setAmannInputValue] = useState('');

  // Derive key states from formState
  const isSingleStitchingMode = formState.collection?.threadType === 'STITCHING';
  const showsIndependentOption = formState.collection?.needsStyle;
  const isIndependentMode = formState.threadMode?.embroidery === 'perShape';
  const embroideryMode = formState.threadMode?.embroidery || 'global';
  const collection = formState.collection.label;

  // Prepare Isacord thread options
  const isacordOptions = useMemo(() => {
    const baseOptions = embroideryThreadColors.map(thread => 
      thread.isacordNumbers?.map(number => {
        const fullData = {
          threadValue: thread.value,
          threadLabel: thread.label,
          threadAbbreviation: thread.abbreviation,
          threadColorTags: thread.colorTags,
        };
        
        return {
          label: number.label,
          value: number.value,
          displayText: `${number.label} - ${thread.label}`,
          searchText: `${number.label} ${thread.label}`.toLowerCase(),
          _fullData: fullData
        };
      })
    ).flat().filter(Boolean);

    if (showsIndependentOption) {
      return [
        {
          label: "Independent for each shape",
          value: "independent",
          displayText: "Independent for each shape",
          searchText: "independent shape"
        },
        ...baseOptions
      ];
    }

    return baseOptions;
  }, [embroideryThreadColors, showsIndependentOption]);

  // Prepare Amann thread options
  const amannOptions = useMemo(() => 
    stitchingThreadColors.map(thread => 
      thread.amannNumbers?.map(number => {
        const fullData = {
          threadValue: thread.value,
          threadLabel: thread.label,
          threadAbbreviation: thread.abbreviation,
          threadColorTags: thread.colorTags,
        };

        return {
          label: number.label,
          value: number.value,
          displayText: `${number.label} - ${thread.label}`,
          searchText: `${number.label} ${thread.label}`.toLowerCase(),
          _fullData: fullData
        };
      })
    ).flat().filter(Boolean),
    [stitchingThreadColors]
  );

  // Handle Isacord thread selection
  const handleIsacordSelect = useCallback((value) => {
    if (value === 'independent') {
      onChange('threadMode', {
        threadType: 'embroidery',
        mode: 'perShape'
      });
      // Clear global selection when switching to per-shape
      setIsacordInputValue(''); // Clear input
    } else {
      const selectedOption = isacordOptions.find(option => option.value === value);
      if (selectedOption) {
        const { _fullData } = selectedOption;
        onChange('threadMode', {
          threadType: 'embroidery',
          mode: 'global'
        });
        onChange('globalEmbroideryThread', {
          value: _fullData.threadValue,
          label: _fullData.threadLabel,
          abbreviation: _fullData.threadAbbreviation,
          colorTags: _fullData.threadColorTags,
          isacordNumbers: [{
            value: selectedOption.value,
            label: selectedOption.label
          }],
          isThread: true
        });
      }
    }
    setIsacordInputValue('');
  }, [isacordOptions, onChange]);

  // Handle Amann thread selection
  const handleAmannSelect = useCallback((value) => {
    const selectedOption = amannOptions.find(option => option.value === value);
    if (!selectedOption) return;
    const { _fullData } = selectedOption;

    const threadData = {
      value: _fullData.threadValue,
      label: _fullData.threadLabel,
      abbreviation: _fullData.threadAbbreviation,
      colorTags: _fullData.threadColorTags,
      amannNumbers: [{
        value: selectedOption.value,
        label: selectedOption.label
      }],
      isThread: true
    };

    // In single mode, replace existing selection. In multi mode, add to selection
    onChange('stitchingThreads', isSingleStitchingMode 
      ? { [threadData.value]: threadData }
      : {
          ...formState.stitchingThreads,
          [threadData.value]: threadData
        }
    );
    
    setAmannInputValue('');
  }, [amannOptions, onChange, formState.stitchingThreads, isSingleStitchingMode]);

  // Handle removing a stitching thread
  const handleRemoveStitchingThread = useCallback((threadValue) => {
    const newThreads = { ...formState.stitchingThreads };
    delete newThreads[threadValue];
    onChange('stitchingThreads', newThreads);
  }, [formState.stitchingThreads, onChange]);

  // Filter options based on search input
  const filteredIsacordOptions = useMemo(() => {
    const searchTerm = isacordInputValue.toLowerCase();
    return searchTerm === '' 
      ? isacordOptions 
      : isacordOptions.filter(option => option.searchText?.includes(searchTerm));
  }, [isacordOptions, isacordInputValue]);

  const filteredAmannOptions = useMemo(() => {
    const searchTerm = amannInputValue.toLowerCase();
    return searchTerm === '' 
      ? amannOptions 
      : amannOptions.filter(option => option.searchText?.includes(searchTerm));
  }, [amannOptions, amannInputValue]);

  // Get placeholder text for embroidery thread input
  const getEmbroideryPlaceholder = () => {
    if (isIndependentMode) {
      return "Shape-specific threads enabled";
    }
    const thread = formState.globalEmbroideryThread;
    return thread?.isacordNumbers[0].label 
      ? `${thread.isacordNumbers[0].label} - ${thread.label}`
      : "Search by number or color name";
  };

  return (
    <Card>
      <BlockStack gap="400">
        {/* Embroidery Thread Section */}
        <BlockStack gap="300">
          <Text variant="headingMd">
            Embroidery Thread 
            {showsIndependentOption && (
              <Text variant="bodySm" as="span" color="subdued">
                {embroideryMode === 'perShape' 
                  ? " (Per Shape Mode)" 
                  : " (Global Mode)"}
              </Text>
            )}
          </Text>
          <Box width="100%">
            <Combobox
              activator={
                <Combobox.TextField
                prefix={<Icon source={SearchIcon} />}
                onChange={setIsacordInputValue}
                label={collection == 'Quilted' ? "Select Isacord Number - Used in Title and SKU" : "Select Isacord Number"}
                value={embroideryMode === 'perShape' 
                  ? "Independent for each shape" 
                  : isacordInputValue}
                placeholder={getEmbroideryPlaceholder()}
                autoComplete="off"
              />
              }
            >
              <ComboboxList 
                options={filteredIsacordOptions}
                selectedValue={isIndependentMode ? 'independent' : formState.globalEmbroideryThread?.isacordNumbers[0].label}
                onSelect={handleIsacordSelect}
              />
            </Combobox>
          </Box>
        </BlockStack>

        {/* Stitching Thread Section */}
        <BlockStack gap="300">
          <Text variant="headingMd">
            Stitching Thread 
            {isSingleStitchingMode && " (Single Selection)"}
          </Text>
          <Box width="100%">
            <Combobox
              activator={
                <Combobox.TextField
                  prefix={<Icon source={SearchIcon} />}
                  onChange={setAmannInputValue}
                  label={collection == 'Argyle' ? "Add Amann Number - Used in Title and SKU" : "Add Amann Number"}
                  value={amannInputValue}
                  placeholder="Search by number or color name"
                  autoComplete="off"
                  disabled={isSingleStitchingMode && 
                    Object.keys(formState.stitchingThreads || {}).length > 0}
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
            {Object.values(formState.stitchingThreads || {}).map((thread) => (
              <Tag 
                key={thread.value} 
                onRemove={() => handleRemoveStitchingThread(thread.value)}
              >
                {thread.amannNumbers[0].label && thread.label 
                  ? `${thread.amannNumbers[0].label} - ${thread.label}`
                  : "Unknown thread"}
              </Tag>
            ))}
          </InlineStack>
        </BlockStack>
      </BlockStack>
    </Card>
  );
};

export default React.memo(ThreadColorSelector);