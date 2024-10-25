// app/components/ThreadColorSelector.jsx

import React from 'react';
import { Card, Select, InlineStack, Box } from "@shopify/polaris";

const ThreadColorSelector = ({ 
  threadColors, 
  selectedEmbroideryColor, 
  selectedStitchingColor, 
  onChange 
}) => {
  const handleEmbroideryChange = (value) => {
    onChange('selectedEmbroideryColor', value);
  };

  const handleStitchingChange = (value) => {
    onChange('selectedStitchingColor', value);
  };

  return (
    <Card>
      <InlineStack gap="400" align="start" wrap={false}>
        <Box width="50%">
          <Select
            label="Select Embroidery"
            options={[{ label: "Color of Thread", value: "" }, ...threadColors]}
            onChange={handleEmbroideryChange}
            value={selectedEmbroideryColor}
          />
        </Box>
        <Box width="50%">
          <Select
            label="Select Stitching"
            options={[{ label: "Color of Thread", value: "" }, ...threadColors]}
            onChange={handleStitchingChange}
            value={selectedStitchingColor}
          />
        </Box>
      </InlineStack>
    </Card>
  );
};

export default React.memo(ThreadColorSelector);