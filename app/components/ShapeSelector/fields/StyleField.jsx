// app/components/ShapeSelector/fields/StyleField.jsx

import React, { useMemo, useCallback } from 'react';
import { Select } from "@shopify/polaris";

/**
 * @typedef {Object} Style
 * @property {string} id - Style identifier
 * @property {string} name - Display name
 * @property {Array} collections - Associated collections
 */

/**
 * @typedef {Object} Shape
 * @property {string} value - Shape identifier
 * @property {string} name - Display name
 */

/**
 * Style selection field for shapes
 * @param {Object} props
 * @param {Shape} props.shape - Current shape
 * @param {Style[]} props.styles - Available styles
 * @param {Object} props.formState - Current form state
 * @param {boolean} props.isSelected - Whether shape is selected
 * @param {Function} props.handleChange - Form state update handler
 */
const StyleField = ({ shape, styles, formState, isSelected, handleChange }) => {
  // Filter styles based on current collection
  const filteredStyles = useMemo(() => {
    if (!formState.collection?.id || !styles?.length) {
      return [{ label: 'Select a style...', value: '' }];
    }
    
    return [
      { label: 'Select a style...', value: '' },
      ...styles
        .filter(style => 
          style.collections?.some(sc => 
            sc.collection.id === formState.collection.id
          )
        )
        .map(style => ({
          label: style.name,
          value: style.id
        }))
    ];
  }, [formState.collection, styles]);

  // Handle style selection changes
  const handleStyleChange = useCallback((value) => {
    const newStyles = {
      ...formState.selectedStyles
    };

    if (value) {
      newStyles[shape.value] = value;
    } else {
      delete newStyles[shape.value];
    }

    handleChange('selectedStyles', newStyles);
  }, [shape.value, formState.selectedStyles, handleChange]);

  // If using global style mode, show readonly field
  if (formState.styleMode === 'global') {
    return (
      <Select 
        value={formState.globalStyle?.id || ''}
        onChange={() => {}} // No-op since field is disabled
        options={filteredStyles}
        disabled={true}
      />
    );
  }

  // Independent style mode
  return (
    <Select
      options={filteredStyles}
      onChange={handleStyleChange}
      value={formState.selectedStyles[shape.value] || ''}
      placeholder="Select style"
      disabled={!isSelected}
    />
  );
};

export default React.memo(StyleField);