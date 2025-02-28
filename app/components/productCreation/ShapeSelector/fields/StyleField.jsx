import React, { useMemo, useCallback } from 'react';
import { Select } from "@shopify/polaris";

const StyleField = ({ 
  shape,
  formState,
  handleChange 
}) => {
  const shapeState = formState.allShapes[shape.value];

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
          useOppositeLeather: style.useOppositeLeather,
          leatherPhrase: style.leatherPhrase,
          namePattern: style.namePattern
        }
      }))
    ];
  }, [formState.collection?.styles]);

  // Handle style selection for independent mode
  const handleStyleChange = useCallback((value) => {
    if (!value) {
      handleChange('shapeField', {
        shapValue: shape.value,
        field: 'style',
        value: null
      });
      return;
    }

    // Find selected style and store minimal data
    const selectedOption = styleOptions.find(opt => opt.value === value);
    if (!selectedOption?.style) return;

    handleChange('shapeField', {
      shapeValue: shape.value,
      field: 'style',
      value: selectedOption.style
    });
  }, [shape.value, styleOptions, handleChange]);

  return (
    <Select
      options={styleOptions}
      onChange={handleStyleChange}
      value={shapeState?.style?.value || ''}
      disabled={!shapeState?.isSelected}
    />
  );
};

export default React.memo(StyleField);