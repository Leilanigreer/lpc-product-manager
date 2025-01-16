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
          value: style.value,
          label: style.label,
          abbreviation: style.abbreviation,
        }
      }))
    ];
  }, [formState.collection?.styles]);

  // Handle style selection for independent mode
  const handleStyleChange = useCallback((value) => {
    if (!value) {
      handleChange('shapeField', {
        shapeId: shape.value,
        field: 'style',
        value: null
      });
      return;
    }

    // Find selected style and store minimal data
    const selectedOption = styleOptions.find(opt => opt.value === value);
    if (!selectedOption?.style) return;

    handleChange('shapeField', {
      shapeId: shape.value,
      field: 'style',
      value: selectedOption.style
    });
  }, [shape.value, styleOptions, handleChange]);

  return (
    <Select
      options={styleOptions}
      onChange={handleStyleChange}
      value = { formState.selectedShapes[shape.value]?.style?.value || '' }
    />
  );
};

export default React.memo(StyleField);