import React, { useState, useMemo, useCallback } from 'react';
import { Combobox, Listbox, Icon } from "@shopify/polaris";
import { SearchIcon } from '@shopify/polaris-icons';

// Reusable ComboboxList component
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

const EmbroideryField = ({
  shape,
  embroideryThreadColors,
  formState,
  handleChange
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Always prepare thread options
  const threadOptions = useMemo(() => {
    const options = [{ label: "None", value: "none" }];
    
    embroideryThreadColors?.forEach(thread => {
      thread.isacordNumbers?.forEach(number => {
        options.push({
          label: number.label,
          value: number.value,
          threadValue: thread.value,
          threadLabel: thread.label,
          threadAbbreviation: thread.abbreviation,
          threadColorTags: thread.colorTags,
          displayText: `${number.label} - ${thread.label}`,
          searchText: `${number.label} ${thread.label}`.toLowerCase(),
          thread: {
            value: thread.value,
            label: thread.label,
            abbreviation: thread.abbreviation,
            isacordNumber: number.label,
            isacordValue: number.value,
            colorTags: thread.colorTags
          }
        });
      });
    });
    
    return options;
  }, [embroideryThreadColors]);

  // Always prepare filtered options
  const filteredOptions = useMemo(() => {
    const searchTerm = searchValue.toLowerCase();
    return threadOptions.filter(option => 
      option.value === 'none' || 
      option.searchText.includes(searchTerm)
    );
  }, [threadOptions, searchValue]);

  // Always prepare handlers
  const handleThreadSelect = useCallback((value) => {
    if (value === 'none') {
      handleChange('shapeEmbroideryThreads', {
        ...formState.shapeEmbroideryThreads,
        [shape.value]: null
      });
    } else {
      const selectedOption = threadOptions.find(opt => opt.value === value);
      if (selectedOption?.thread) {
        handleChange('shapeEmbroideryThreads', {
          ...formState.shapeEmbroideryThreads,
          [shape.value]: selectedOption.thread
        });
      }
    }
    setSearchValue('');
    setIsEditing(false);
  }, [shape.value, threadOptions, formState.shapeEmbroideryThreads, handleChange]);

  const handleFocus = useCallback(() => setIsEditing(true), []);
  const handleBlur = useCallback(() => {
    setIsEditing(false);
    setSearchValue('');
  }, []);

  // Get current display value for per-shape mode
  const currentThread = formState.shapeEmbroideryThreads[shape.value];
  const displayValue = isEditing
    ? searchValue
    : currentThread
      ? `${currentThread.isacordNumber} - ${currentThread.label}`
      : 'None';

  return (
    <Combobox
      activator={
        <Combobox.TextField
          prefix={<Icon source={SearchIcon} />}
          onChange={setSearchValue}
          onBlur={handleBlur}
          onFocus={handleFocus}
          value={displayValue}
          autoComplete="off"
        />
      }
    >
      <ComboboxList
        options={filteredOptions}
        selectedValue={currentThread?.isacordValue}
        onSelect={handleThreadSelect}
      />
    </Combobox>
  );
};

export default React.memo(EmbroideryField);