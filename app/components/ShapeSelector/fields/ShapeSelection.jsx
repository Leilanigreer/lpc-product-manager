// app/components/ShapeSelector/fields/ShapeSelection.jsx
import React, { useCallback } from 'react';
import { Box, Checkbox, TextField, InlineStack } from "@shopify/polaris";

const ShapeSelection = ({ 
  formState, 
  handleChange, 
  shape 
}) => {
  // Track if shape is selected based on presence in weights
  const isSelected = shape.value in (formState.selectedShapes || {});
  const currentShape = formState.selectedShapes?.[shape.value];

  // Handle checkbox toggle
  const handleSelect = useCallback((checked) => {
    handleChange('selectedShapes', {
      shape,
      checked,
      weight: ''
    });
  }, [shape, handleChange]);

  // Handle weight input
  const handleWeightChange = useCallback((value) => {
    if (!isSelected) return;
    
    handleChange('selectedShapes', {
      shape,
      checked: true,
      weight: value
    });
  }, [shape, isSelected, handleChange]);

  // Prevent scroll wheel from changing number input
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  return (
    <InlineStack wrap={false} gap="150" align="start">
      <Box width="125px">
        <Checkbox
          id={shape.value}
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
          value={currentShape?.weight || ''}
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