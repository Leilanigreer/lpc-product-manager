import React from 'react';
import { Card, Select, InlineStack, Box } from "@shopify/polaris";

const ThreadColorSelector = ({ 
  threadColors, 
  selectedEmbroideryColor, 
  selectedStitchingColor, 
  onChange 
}) => {
  return (
    <Card>
      <InlineStack gap="400" align="start" wrap={false}>
        <Box width="50%">
          <Select
            label="Select Embroidery"
            options={[{ label: "Color of Thread", value: "" }, ...threadColors]}
            onChange={(value) => onChange('selectedEmbroideryColor')(value)}
            value={selectedEmbroideryColor}
          />
        </Box>
        <Box width="50%">
          <Select
            label="Select Stitching"
            options={[{ label: "Color of Thread", value: "" }, ...threadColors]}
            onChange={(value) => onChange('selectedStitchingColor')(value)}
            value={selectedStitchingColor}
          />
        </Box>
      </InlineStack>
    </Card>
  );
};

export default ThreadColorSelector;