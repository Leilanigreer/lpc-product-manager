// app/components/ShapeSelector.jsx

import React, { useMemo } from "react";
import { BlockStack, Box, Divider, Grid, Text, Select, TextField, Checkbox } from "@shopify/polaris";

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

const ShapeSelector = ({ 
  shapes, 
  styles, 
  threadColors, 
  formState, 
  handleChange, 
  isCollectionAnimalClassicQclassic
}) => {
  const memoizedShapes = useMemo(() => shapes || [], [shapes]);
  const showStyleAndEmbroidery = isCollectionAnimalClassicQclassic();

  const handleShapeToggle = (shapeValue, checked) => {
    if (!checked) {
      // Remove all related data
      const newWeights = { ...formState.weights };
      const newStyles = { ...formState.selectedStyles };
      
      delete newWeights[shapeValue];
      delete newStyles[shapeValue];
      
      // Only handle embroidery colors if we're in Animal/Classic/QClassic mode
      if (showStyleAndEmbroidery) {
        const newEmbroideryColors = { ...formState.selectedEmbroideryColors };
        delete newEmbroideryColors[shapeValue];
        handleChange('selectedEmbroideryColors', newEmbroideryColors);
      }
  
      handleChange('weights', newWeights);
      handleChange('selectedStyles', newStyles);
    } else {
      // Just set initial empty weight
      handleChange('weights', {
        ...formState.weights,
        [shapeValue]: ''
      });
    }
  };

  const handleWeightChange = (shapeValue, value) => {
    const newWeights = { ...formState.weights };
    if (value === '') {
      delete newWeights[shapeValue];
    } else {
      newWeights[shapeValue] = value;
    }
    handleChange('weights', newWeights);
  };

  const handleStyleChange = (shapeValue, value) => {
    handleChange('selectedStyles', {
      ...formState.selectedStyles,
      [shapeValue]: value
    });
  };

  const handleEmbroideryChange = (shapeValue, value) => {
    handleChange('selectedEmbroideryColors', {
      ...formState.selectedEmbroideryColors,
      [shapeValue]: value
    });
  };

  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">Part 2</Text>
      <Grid columns={showStyleAndEmbroidery ? 12 : 4}>
        <Grid.Cell columnSpan={{xs: 2, sm: 2, md: 2, lg: 2, xl: 2}}>
          <Text variant="bodyMd" fontWeight="bold">Shape</Text>
        </Grid.Cell>
        {showStyleAndEmbroidery && (
          <>
            <Grid.Cell columnSpan={{xs: 3, sm: 3, md: 3, lg: 3, xl: 3}}>
              <Text variant="bodyMd" fontWeight="bold">Style</Text>
            </Grid.Cell>
            <Grid.Cell columnSpan={{xs: 3, sm: 3, md: 3, lg: 3, xl: 3}}>
              <Text variant="bodyMd" fontWeight="bold">Embroidery</Text>
            </Grid.Cell>
          </>
        )}
        <Grid.Cell columnSpan={{xs: 2, sm: 2, md: 2, lg: 2, xl: 2}}>
          <Text variant="bodyMd" fontWeight="bold">Weight</Text>
        </Grid.Cell>
      </Grid>
      {memoizedShapes.map((shape, index) => (
        <Box key={shape.value} paddingBlockEnd="400">
          <Grid columns={showStyleAndEmbroidery ? 12 : 4}>
            <Grid.Cell columnSpan={{xs: 2, sm: 2, md: 2, lg: 2, xl: 2}}>
              <Checkbox
                label={shape.label}
                checked={formState.weights.hasOwnProperty(shape.value)}
                onChange={(checked) => handleShapeToggle(shape.value, checked)}
              />
            </Grid.Cell>
            {showStyleAndEmbroidery && (
              <>
                <Grid.Cell columnSpan={{xs: 3, sm: 3, md: 3, lg: 3, xl: 3}}>
                  <Select
                    options={styles || []}
                    onChange={(value) => handleStyleChange(shape.value, value)}
                    value={formState.selectedStyles?.[shape.value] || ''}
                    placeholder="Select style"
                    disabled={!formState.weights.hasOwnProperty(shape.value)}
                  />
                </Grid.Cell>
                <Grid.Cell columnSpan={{xs: 3, sm: 3, md: 3, lg: 3, xl: 3}}>
                  <Select
                    options={[
                      { label: "Color of Thread", value: "", key: "default-thread-color" },
                      ...(threadColors || [])
                    ]}
                    onChange={(value) => handleEmbroideryChange(shape.value, value)}
                    value={formState.selectedEmbroideryColors?.[shape.value] || ''}
                    placeholder="Select thread color"
                    disabled={!formState.weights.hasOwnProperty(shape.value)}
                  />
                </Grid.Cell>
              </>
            )}
            <Grid.Cell columnSpan={{xs: 2, sm: 2, md: 2, lg: 2, xl: 2}}>
              <style>{preventWheelChange}</style>
              <TextField
                type="number"
                min="0"
                step="0.01"
                onWheel={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }}
                onFocus={(e) => {
                  e.target.addEventListener('wheel', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }, { passive: false });
                }}
                onChange={(value) => handleWeightChange(shape.value, value)}
                value={formState.weights?.[shape.value] || ''}
                placeholder="0.00"
                suffix="oz"
                disabled={!formState.weights.hasOwnProperty(shape.value)}
              />
            </Grid.Cell>
          </Grid>
          {index < memoizedShapes.length - 1 && <Divider />}
        </Box>
      ))}
    </BlockStack>
  );
};

export default React.memo(ShapeSelector);