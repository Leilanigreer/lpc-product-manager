// app/components/ThreadColorSelector.jsx

import React, { useMemo, useState, useCallback } from 'react';
import { Card, Combobox, Listbox, Icon, Box, InlineStack, BlockStack, Text, Tag } from "@shopify/polaris";
import { SearchIcon} from '@shopify/polaris-icons';

const ThreadColorSelector = ({ 
  stitchingThreadColors,
  embroideryThreadColors,
  selectedEmbroideryColor, 
  selectedStitchingColors = [],
  matchingAmannNumbers = [], 
  matchingIsacordNumber,
  onChange,
  threadType
}) => {
  const [isacordInputValue, setIsacordInputValue] = useState('');
  const [amannInputValue, setAmannInputValue] = useState('');

  const isSingleStitchingMode = threadType === 'STITCHING';

  const isacordOptions = useMemo(() => [
    {
      label: "Independent for each shape",
      value: "independent",
      displayText: "Independent for each shape",
      searchText: "independent shape"
    },
    ...embroideryThreadColors.flatMap(thread => 
      (thread.isacordNumbers || []).map(number => ({
        label: number.label,
        value: number.value,
        threadId: thread.value,
        threadName: thread.label,
        displayText: `${number.label} - ${thread.label}`,
        searchText: `${number.label} ${thread.label}`.toLowerCase()
      }))
    )
  ], [embroideryThreadColors]);

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
    if (value === 'independent') {
      onChange('selectedEmbroideryColor', null);
      onChange('matchingIsacordNumber', 'independent');
    } else {
      const selectedOption = isacordOptions.find(option => option.value === value);
      if (selectedOption) {
        onChange('selectedEmbroideryColor', {
          id: selectedOption.threadId,
          name: selectedOption.threadName,
          number: selectedOption.label
        });
        onChange('matchingIsacordNumber', selectedOption.value);
      }
    }
    setIsacordInputValue('');
  }, [isacordOptions, onChange]);

  const handleAmannSelect = useCallback((value) => {
    const selectedOption = amannOptions.find(option => option.value === value);
    if (selectedOption) {
      if (isSingleStitchingMode) {
        onChange('selectedStitchingColors', [{
          id: selectedOption.threadId,
          name: selectedOption.threadName,
          number: selectedOption.label
        }]);
        onChange('matchingAmannNumbers', [selectedOption.value]);
      } else {
        const newStitchingColors = [...selectedStitchingColors, {
          id: selectedOption.threadId,
          name: selectedOption.threadName,
          number: selectedOption.label
        }];
        const newAmannNumbers = [...matchingAmannNumbers, selectedOption.value];
        
        onChange('selectedStitchingColors', newStitchingColors);
        onChange('matchingAmannNumbers', newAmannNumbers);
      }
      setAmannInputValue('');
    }
  }, [amannOptions, onChange, selectedStitchingColors, matchingAmannNumbers, isSingleStitchingMode]);

  const handleRemoveStitchingColor = useCallback((index) => {
    if (isSingleStitchingMode) {
      onChange('selectedStitchingColors', []);
      onChange('matchingAmannNumbers', []);
    } else {
      const newStitchingColors = selectedStitchingColors.filter((_, i) => i !== index);
      const newAmannNumbers = matchingAmannNumbers.filter((_, i) => i !== index);
      
      onChange('selectedStitchingColors', newStitchingColors);
      onChange('matchingAmannNumbers', newAmannNumbers);
    }
  }, [selectedStitchingColors, matchingAmannNumbers, onChange, isSingleStitchingMode]);

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

  const getSelectedDisplayText = useCallback((options, selectedValue) => {
    if (selectedValue === 'independent') return 'Independent for each shape';
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
        <BlockStack gap="400">
          <BlockStack gap="300">
            <Text variant="headingMd">Embroidery Thread</Text>
            <Box width="100%">
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
            </Box>
          </BlockStack>
  
          <BlockStack gap="300">
            <Text variant="headingMd">
              Stitching Thread {isSingleStitchingMode && "(Single Selection)"}
            </Text>
            <Box width="100%">
              <Combobox
                activator={
                  <Combobox.TextField
                    prefix={<Icon source={SearchIcon} />}
                    onChange={updateAmannOptions}
                    label="Add Amann Number"
                    value={amannInputValue}
                    placeholder="Search by number or color name"
                    autoComplete="off"
                    disabled={isSingleStitchingMode && selectedStitchingColors.length > 0}
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
              {selectedStitchingColors.map((color, index) => (
                <Tag key={index} onRemove={() => handleRemoveStitchingColor(index)}>
                  {`${color.number} - ${color.name}`}
                </Tag>
              ))}
            </InlineStack>
          </BlockStack>
        </BlockStack>
      </Card>
    );
  };
  
  export default React.memo(ThreadColorSelector);