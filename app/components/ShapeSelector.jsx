import React from "react";
import { BlockStack, Grid, Text, Select, TextField } from "@shopify/polaris";

const ShapeSelector = ({ 
  shapes, 
  styles, 
  threadColors, 
  formState, 
  handleChange, 
  shouldShowStyle 
}) => {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">Part 2</Text>
      {shapes.map((shape) => (
        <Grid key={shape.value}>
          <Grid.Cell columnSpan={{ xs: 6, sm: 2, md: 2, lg: 2, xl: 2 }}>
            <Text variant="bodyMd">{shape.label}</Text>
          </Grid.Cell>
          {shouldShowStyle() && (
            <Grid.Cell columnSpan={{ xs: 6, sm: 5, md: 5, lg: 5, xl: 5 }}>
              <Select
                label="Style"
                options={styles}
                onChange={(value) => handleChange('selectedStyles')({ ...formState.selectedStyles, [shape.value]: value })}
                value={formState.selectedStyles[shape.value] || ''}
                placeholder="Select style"
              />
            </Grid.Cell>
          )}
          <Grid.Cell columnSpan={{ xs: 6, sm: 5, md: 5, lg: 5, xl: 5 }}>
            <Select
              label="Select Embroidery"
              options={[{ label: "Color of Thread", value: "" }, ...threadColors]}
              onChange={handleChange('selectedEmbroideryColor')}
              value={formState.selectedEmbroideryColor}
            />
          </Grid.Cell>
          <Grid.Cell columnSpan={{ xs: 6, sm: 5, md: 5, lg: 5, xl: 5 }}>
            <TextField
              label="Weight"
              type="number"
              onChange={(value) => handleChange('weights')({ ...formState.weights, [shape.value]: value })}
              value={formState.weights[shape.value] || ''}
              placeholder="Enter weight"
            />
          </Grid.Cell>
        </Grid>
      ))}
    </BlockStack>
  );
};

export default ShapeSelector;