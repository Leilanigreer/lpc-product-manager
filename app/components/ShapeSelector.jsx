import React from "react";
import { BlockStack, Grid, Text, Select, TextField } from "@shopify/polaris";

const ShapeSelector = ({ 
  shapes, 
  styles, 
  threadColors, 
  formState, 
  handleChange, 
  isCollectionAnimalClassicQclassic 
}) => {
  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">Part 2</Text>
      {shapes.map((shape) => (
        <Grid key={shape.value} columns={isCollectionAnimalClassicQclassic() ? 12 : 6}>
          <Grid.Cell columnSpan={{ xs: 2, sm: 2, md: 2, lg: 2, xl: 2 }}>
            <Text variant="bodyMd">{shape.label}</Text>
          </Grid.Cell>
          
          {isCollectionAnimalClassicQclassic() && (
            <>
              <Grid.Cell columnSpan={{ xs: 3, sm: 3, md: 3, lg: 3, xl: 3 }}>
                <Select
                  label="Style"
                  options={styles}
                  onChange={(value) => handleChange('selectedStyles')({ ...formState.selectedStyles, [shape.value]: value })}
                  value={formState.selectedStyles[shape.value] || ''}
                  placeholder="Select style"
                  labelHidden
                />
              </Grid.Cell>
              <Grid.Cell columnSpan={{ xs: 3, sm: 3, md: 3, lg: 3, xl: 3 }}>
                <Select
                  label="Select Embroidery"
                  options={[{ label: "Color of Thread", value: "" }, ...threadColors]}
                  onChange={(value) => handleChange('selectedEmbroideryColor')({ ...formState.selectedEmbroideryColor, [shape.value]: value })}
                  value={formState.selectedEmbroideryColor[shape.value] || ''}
                  labelHidden
                />
              </Grid.Cell>
            </>
          )}
          
          <Grid.Cell columnSpan={isCollectionAnimalClassicQclassic() ? { xs: 4, sm: 4, md: 4, lg: 4, xl: 4 } : { xs: 4, sm: 4, md: 4, lg: 4, xl: 4 }}>
            <TextField
              label="Weight"
              type="number"
              onChange={(value) => handleChange('weights')({ ...formState.weights, [shape.value]: value })}
              value={formState.weights[shape.value] || ''}
              placeholder="0.00"
              labelHidden
              autoComplete="off"
            />
          </Grid.Cell>
        </Grid>
      ))}
    </BlockStack>
  );
};

export default ShapeSelector;