// app/components/ShapeSelector/fields/ShapeSelection.jsx
import React, { useCallback } from 'react';
import { Box, Checkbox, TextField, InlineStack } from "@shopify/polaris";

const ShapeSelection = ({ 
  formState, 
  handleChange, 
  shape,
  shapes 
}) => {
  const shapeState = formState.allShapes[shape.value];
  const isSelected = shapeState?.isSelected;

  // Updated to work with new shape state structure
  const handleSelect = useCallback((checked) => {
    handleChange('shape', {
      shape,
      shapes,
      checked,
      weight: shapeState?.weight || ''  // Preserve existing weight if any
    });
  }, [shape, shapes, shapeState?.weight, handleChange]);

  // Updated to use shape field update
  const handleWeightChange = useCallback((value) => {
    if (!isSelected) return;
    
    handleChange('shapeField', {
      shapeValue: shape.value,
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
          value={shapeState?.weight || ''}
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