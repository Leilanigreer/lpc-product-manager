import React, { useState, useMemo, useCallback } from 'react';
import { Combobox, Listbox, Icon } from "@shopify/polaris";
import { SearchIcon } from '@shopify/polaris-icons';

export const NO_EMBROIDERY = 'NO_EMBROIDERY';


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

  const shapeState = formState.allShapes[shape.value];
  const currentThread = shapeState?.embroideryThread;

  // Thread options preparation
  const threadOptions = useMemo(() => {
    const options = [
      { 
        label: "No Embroidery", 
        value: NO_EMBROIDERY,
        displayText: "No Embroidery (Skip)",
        searchText: "no embroidery skip none"  
      }
    ];
    
    embroideryThreadColors?.forEach(thread => {
      thread.isacordNumbers?.forEach(number => {
        options.push({
          label: number.label,
          value: number.value,
          threadLabel: thread.label,
          displayText: `${number.label} - ${thread.label}`,
          searchText: `${number.label} ${thread.label}`.toLowerCase(),
          thread: {
            value: thread.value,
            label: thread.label,
            abbreviation: thread.abbreviation,
            colorTags: thread.colorTags,
            isacordNumbers: [{
              value: number.value,
              label: number.label
            }],
            isThread: true
          }
        });
      });
    });
    
    return options;
  }, [embroideryThreadColors]);

  // Filtered options based on search
  const filteredOptions = useMemo(() => {
    const searchTerm = searchValue.toLowerCase();
    return threadOptions.filter(option => 
      option.value === NO_EMBROIDERY || 
      option.searchText.includes(searchTerm)
    );
  }, [threadOptions, searchValue]);

  // Handle thread selection
  const handleThreadSelect = useCallback((value) => {
    handleChange('shapeField', {
      shapeValue: shape.value,
      field: 'embroideryThread',
      value: value === NO_EMBROIDERY 
        ? { type: 'none', value: NO_EMBROIDERY } 
        : threadOptions.find(opt => opt.value === value)?.thread || null
    });
    setSearchValue('');
    setIsEditing(false);
  }, [shape.value, threadOptions, handleChange]);

  // Input field handlers
  const handleFocus = useCallback(() => setIsEditing(true), []);
  const handleBlur = useCallback(() => {
    setIsEditing(false);
    setSearchValue('');
  }, []);

  // Display value logic
  const displayValue = isEditing
    ? searchValue
    : currentThread?.type === 'none'
      ? 'No Embroidery'
      : currentThread?.isacordNumbers?.[0]
        ? `${currentThread.isacordNumbers[0].label} - ${currentThread.label}`
        : 'Select embroidery...';

  // Early return after all hooks are defined
  if (formState.threadMode?.embroidery !== 'perShape') {
    return null;
  }

  return (
    <Combobox
      activator={
        <Combobox.TextField
          prefix={<Icon source={SearchIcon} />}
          onChange={setSearchValue}
          onBlur={handleBlur}
          onFocus={handleFocus}
          value={displayValue}
          placeholder="Select embroidery..."
          autoComplete="off"
          disabled={!shapeState?.isSelected}
        />
      }
    >
      <ComboboxList
        options={filteredOptions}
        selectedValue={
          currentThread?.type === 'none' 
            ? NO_EMBROIDERY 
            : currentThread?.isacordNumbers?.[0]?.value
        }       
        onSelect={handleThreadSelect}
      />
    </Combobox>
  );
};

export default React.memo(EmbroideryField);