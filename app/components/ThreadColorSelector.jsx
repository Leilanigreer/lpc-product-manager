// app/components/ThreadColorSelector.jsx

import React, { useMemo, useState, useCallback } from 'react';
import { Card, Combobox, Listbox, Icon, Box, InlineStack, BlockStack } from "@shopify/polaris";
import { SearchIcon } from '@shopify/polaris-icons';

/**
 * @typedef {Object} ThreadNumber
 * @property {string} label - Display label for the thread number
 * @property {string} value - Unique identifier for the thread number
 */

/**
 * @typedef {Object} ThreadColor
 * @property {string} value - Unique identifier for the thread color
 * @property {string} label - Display name of the thread color
 * @property {Array<ThreadNumber>} isacordNumbers - Associated Isacord numbers (for embroidery threads)
 * @property {Array<ThreadNumber>} amannNumbers - Associated Amann numbers (for stitching threads)
 */

/**
 * A component for selecting thread colors and their associated numbers
 * @component
 * @param {Object} props - Component props
 * @param {Array<ThreadColor>} props.stitchingThreadColors - Available stitching thread colors
 * @param {Array<ThreadColor>} props.embroideryThreadColors - Available embroidery thread colors
 * @param {string} props.selectedEmbroideryColor - Currently selected embroidery color ID
 * @param {string} props.selectedStitchingColor - Currently selected stitching color ID
 * @param {string} props.matchingAmannNumber - Selected Amann number ID
 * @param {string} props.matchingIsacordNumber - Selected Isacord number ID
 * @param {Function} props.onChange - Callback function for selection changes
 * @returns {React.ReactElement} Rendered component
 */
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

  // Sanitize and memoize options
  const isacordOptions = useMemo(() => 
    embroideryThreadColors.flatMap(thread => 
      (thread.isacordNumbers || []).map(number => ({
        label: String(number.label),
        value: String(number.value),
        threadId: String(thread.value)
      }))
    ),
    [embroideryThreadColors]
  );

  const amannOptions = useMemo(() => 
    stitchingThreadColors.flatMap(thread => 
      (thread.amannNumbers || []).map(number => ({
        label: String(number.label),
        value: String(number.value),
        threadId: String(thread.value)
      }))
    ),
    [stitchingThreadColors]
  );

  /**
   * Updates the Isacord search input value
   * @param {string} value - New input value
   */
  const updateIsacordOptions = useCallback((value) => {
    setIsacordInputValue(value.replace(/[^0-9]/g, ''));
  }, []);

  /**
   * Updates the Amann search input value
   * @param {string} value - New input value
   */
  const updateAmannOptions = useCallback((value) => {
    setAmannInputValue(value.replace(/[^0-9]/g, ''));
  }, []);

  /**
   * Handles selection of an Isacord number
   * @param {string} value - Selected Isacord number ID
   */
  const handleIsacordSelect = useCallback((value) => {
    const selectedOption = isacordOptions.find(option => option.value === value);
    if (selectedOption) {
      onChange('selectedEmbroideryColor', selectedOption.threadId);
      onChange('matchingIsacordNumber', selectedOption.value);
      setIsacordInputValue(selectedOption.label);
    }
  }, [isacordOptions, onChange]);

  /**
   * Handles selection of an Amann number
   * @param {string} value - Selected Amann number ID
   */
  const handleAmannSelect = useCallback((value) => {
    const selectedOption = amannOptions.find(option => option.value === value);
    if (selectedOption) {
      onChange('selectedStitchingColor', selectedOption.threadId);
      onChange('matchingAmannNumber', selectedOption.value);
      setAmannInputValue(selectedOption.label);
    }
  }, [amannOptions, onChange]);

  // Filtered options based on search input
  const filteredIsacordOptions = useMemo(() => 
    isacordInputValue === '' 
      ? isacordOptions 
      : isacordOptions.filter(option => option.label.includes(isacordInputValue)),
    [isacordOptions, isacordInputValue]
  );

  const filteredAmannOptions = useMemo(() => 
    amannInputValue === '' 
      ? amannOptions 
      : amannOptions.filter(option => option.label.includes(amannInputValue)),
    [amannOptions, amannInputValue]
  );

  /**
   * Renders the dropdown list for a Combobox
   * @component
   * @param {Object} props - Component props
   * @param {Array<{label: string, value: string}>} props.options - List options
   * @param {string} props.selectedValue - Currently selected value
   * @param {Function} props.onSelect - Selection handler
   * @returns {React.ReactElement|null} Rendered list or null if no options
   */
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
              {option.label}
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