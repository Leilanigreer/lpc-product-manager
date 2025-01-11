// app/components/ShapeSelector/fields/ShapeSelection.jsx
import React, { useCallback } from 'react';
import { Box, Checkbox, TextField, InlineStack } from "@shopify/polaris";

const ShapeSelection = ({ 
  formState, 
  handleChange, 
  shape 
}) => {
  // Track if shape is selected based on presence in weights
  const isSelected = shape.value in (formState.weights || {});
  
  // Handle checkbox toggle
  const handleSelect = useCallback((checked) => {
    const newWeights = { ...formState.weights };
    
    if (checked) {
      newWeights[shape.value] = '';
    } else {
      delete newWeights[shape.value];
    }

    handleChange('weights', newWeights);
  }, [shape.value, formState.weights, handleChange]);

  // Handle weight input
  const handleWeightChange = useCallback((value) => {
    if (!isSelected) return;

    const newWeights = { ...formState.weights };
    newWeights[shape.value] = value;
    handleChange('weights', newWeights);
  }, [shape.value, isSelected, formState.weights, handleChange]);

  // Prevent scroll wheel from changing number input
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <InlineStack wrap={false} gap="150" align="start">
      <Box width="125px">
        <Checkbox
          id={`shape-${shape.value}`}
          label={shape.label}
          checked={isSelected}
          onChange={handleSelect}
        />
      </Box>
      <Box width="105px">
        <TextField
          type="number"
          min="0"
          step="0.01"
          onWheel={handleWheel}
          onChange={handleWeightChange}
          value={formState.weights[shape.value] || ''}
          placeholder="0.00"
          suffix="oz"
          disabled={!isSelected}
          autoComplete="off"
        />
      </Box>
    </InlineStack>
  );
};

export default React.memo(ShapeSelection);