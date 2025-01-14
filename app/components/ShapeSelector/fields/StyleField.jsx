import React, { useMemo, useCallback } from 'react';
import { Select } from "@shopify/polaris";

const StyleField = ({ 
  shape,
  formState,
  handleChange 
}) => {
  // Generate style options from collection styles
  const styleOptions = useMemo(() => {
    const collectionStyles = formState.collection?.styles || [];
    
    return [
      { label: 'Select a style...', value: '' },
      ...collectionStyles.map(style => ({
        label: style.label,
        value: style.value,
        // Only include required style data
        style: {
          abbreviation: style.abbreviation,
          label: style.label,
          value: style.value
        }
      }))
    ];
  }, [formState.collection?.styles]);

  // Handle style selection for independent mode
  const handleStyleChange = useCallback((value) => {
    if (!value) {
      // If clearing selection
      handleChange('selectedStyles', {
        ...formState.selectedStyles,
        [shape.value]: null
      });
      return;
    }

    // Find selected style and store minimal data
    const selectedOption = styleOptions.find(opt => opt.value === value);
    if (!selectedOption?.style) return;

    handleChange('selectedStyles', {
      ...formState.selectedStyles,
      [shape.value]: selectedOption.style
    });
  }, [shape.value, styleOptions, formState.selectedStyles, handleChange]);

  return (
    <Select
      options={styleOptions}
      onChange={handleStyleChange}
      value={formState.selectedStyles[shape.value]?.value || ''}
    />
  );
};

export default React.memo(StyleField);