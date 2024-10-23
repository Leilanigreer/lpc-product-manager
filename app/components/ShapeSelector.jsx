import React, { useMemo } from "react";
import { BlockStack, Box, Divider, Grid, Text, Select, TextField, Checkbox } from "@shopify/polaris";

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

  return (
    <BlockStack gap="400">
      <Text as="h2" variant="headingMd">Part 2</Text>
      <Grid columns={showStyleAndEmbroidery ? 12 : 8}>
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
        <Grid.Cell columnSpan={{xs: 1, sm: 1, md: 1, lg: 1, xl: 1}}>
          <Text variant="bodyMd" fontWeight="bold">Weight</Text>
        </Grid.Cell>
      </Grid>
      {memoizedShapes.map((shape, index) => (
        <Box key={shape.value} paddingBlockEnd="400">
          <Grid columns={showStyleAndEmbroidery ? 20 : 8}>
            <Grid.Cell columnSpan={{xs: 2, sm: 2, md: 2, lg: 2, xl: 2}}>
              <Checkbox
                label={shape.label}
                checked={formState.selectedShapes?.[shape.value] || false}
                onChange={(checked) => {
                  const newSelectedShapes = { ...formState.selectedShapes };
                  if (checked) {
                    newSelectedShapes[shape.value] = true;
                  } else {
                    delete newSelectedShapes[shape.value];
                  }
                  handleChange('selectedShapes')(newSelectedShapes);
                }}
              />
            </Grid.Cell>
            {showStyleAndEmbroidery && (
              <>
                <Grid.Cell columnSpan={{xs: 3, sm: 3, md: 3, lg: 3, xl: 3}}>
                <Select
                  options={styles || []}
                  onChange={(value) => handleChange('selectedStyles')({ ...formState.selectedStyles, [shape.value]: value })}
                  value={formState.selectedStyles?.[shape.value] || ''}
                  placeholder="Select style"
                  disabled={!formState.selectedShapes?.[shape.value]}
                />
                </Grid.Cell>
                <Grid.Cell columnSpan={{xs: 3, sm: 3, md: 3, lg: 3, xl: 3}}>
                <Select
                  options={[
                    { label: "Color of Thread", value: "", key: "default-thread-color" },
                    ...(threadColors || [])
                  ]}
                  onChange={(value) => handleChange('selectedEmbroideryColor')({ ...formState.selectedEmbroideryColor, [shape.value]: value })}
                  value={formState.selectedEmbroideryColor?.[shape.value] || ''}
                  placeholder="Select thread color"
                  disabled={!formState.selectedShapes?.[shape.value]}
                />
                </Grid.Cell>
              </>
            )}
            <Grid.Cell columnSpan={{xs: 2, sm: 2, md: 2, lg: 2, xl: 2}}>
              <TextField
                type="number"
                min = "0"
                onChange={(value) => handleChange('weights')({ ...formState.weights, [shape.value]: value })}
                value={formState.weights?.[shape.value] || ''}
                placeholder="0.00"
                suffix="oz"
                disabled={!formState.selectedShapes?.[shape.value]}
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