// app/components/ShapeSelector/fields/ShapeCheckbox.jsx

import React, { useCallback } from 'react';
import { Checkbox } from "@shopify/polaris";

/**
 * @typedef {Object} Shape
 * @property {string} value - Shape identifier
 * @property {string} label - Display name
 */

/**
 * Checkbox component for selecting shapes
 * @param {Object} props
 * @param {Shape} props.shape - Shape to toggle
 * @param {boolean} props.isSelected - Whether shape is currently selected
 * @param {Function} props.handleChange - Form state update handler
 * @returns {React.ReactElement} Rendered checkbox
 */
const ShapeCheckbox = ({ shape, isSelected, handleChange, formState }) => {
  const handleShapeToggle = useCallback((checked) => {
    const newWeights = { ...formState.weights };
    
    if (!checked) {
      // Remove weight when unchecking
      delete newWeights[shape.value];
    } else {
      // Add empty weight when checking
      newWeights[shape.value] = '';
    }

    handleChange('weights', newWeights);
  }, [shape.value, formState.weights, handleChange]);

  return (
    <Checkbox
      label={shape.label}
      checked={isSelected}
      onChange={handleShapeToggle}
    />
  );
};

export default React.memo(ShapeCheckbox);