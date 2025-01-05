// app/components/ShapeSelector/fields/WeightField.jsx

import React, { useCallback } from 'react';
import { Box, TextField } from "@shopify/polaris";

/**
 * CSS to prevent unwanted wheel behavior on number inputs
 */
const preventWheelChange = `
  input[type="number"] {
    -moz-appearance: textfield !important;
  }
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none !important;
    margin: 0 !important;
    display: none !important;
  }
  
  input[type="number"] {
    scroll-behavior: auto !important;
    overflow: hidden !important;
  }
`;

/**
 * Weight input field component for shape configuration
 * @param {Object} props
 * @param {string} props.shapeId - ID of the shape this weight field belongs to
 * @param {Object} props.formState - Current form state containing weights and selected shapes
 * @param {Function} props.onChange - Callback for form state changes
 * @returns {React.ReactElement} Rendered weight field
 */
const WeightField = ({ shapeId, formState, onChange }) => {
  const handleWeightChange = useCallback((value) => {
    // Validate weight input
    const numericValue = parseFloat(value);
    const isValidWeight = !isNaN(numericValue) && numericValue >= 0;
    
    onChange('weights', {
      ...formState.weights,
      [shapeId]: isValidWeight ? value : undefined
    });
  }, [onChange, shapeId, formState.weights]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }, []);

  const handleFocus = useCallback((e) => {
    e.target.addEventListener('wheel', handleWheel, { passive: false });
  }, [handleWheel]);

  const handleBlur = useCallback((e) => {
    e.target.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Check if shape is selected by looking for a weight value
  const isShapeSelected = Boolean(formState.weights[shapeId]);

  return (
    <Box width="150px">
      <style>{preventWheelChange}</style>
      <TextField
        type="number"
        min="0"
        step="0.01"
        onWheel={handleWheel}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleWeightChange}
        value={formState.weights[shapeId] || ''}
        placeholder="0.00"
        suffix="oz"
        disabled={!isShapeSelected}
      />
    </Box>
  );
};

export default React.memo(WeightField);