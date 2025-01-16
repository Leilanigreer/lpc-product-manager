// app/components/ShapeSelector/fields/ShapeSelection.jsx
import React, { useCallback } from 'react';
import { Box, Checkbox, TextField, InlineStack } from "@shopify/polaris";

const ShapeSelection = ({ 
  formState, 
  handleChange, 
  shape 
}) => {
  const isSelected = shape.value in (formState.selectedShapes || {});
  const currentShape = formState.selectedShapes?.[shape.value];

  // Updated to work with new shape state structure
  const handleSelect = useCallback((checked) => {
    handleChange('shape', {
      shape,
      checked,
      weight: currentShape?.weight || ''  // Preserve existing weight if any
    });
  }, [shape, currentShape?.weight, handleChange]);

  // Updated to use shape field update
  const handleWeightChange = useCallback((value) => {
    if (!isSelected) return;
    
    handleChange('shapeField', {
      shapeId: shape.value,
      field: 'weight',
      value
    });
  }, [shape.value, isSelected, handleChange]);

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