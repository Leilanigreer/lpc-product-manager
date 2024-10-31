// app/components/ThreadColorSelector.jsx

import React from 'react';
import { Card, Select, InlineStack, Box } from "@shopify/polaris";

const ThreadColorSelector = ({ 
  stitchingThreadColors,
  embroideryThreadColors, 
  selectedEmbroideryColor, 
  selectedStitchingColor, 
  onChange 
}) => {
  // Filter out colorTags from both thread color arrays
  const sanitizedEmbroideryColors = embroideryThreadColors.map(({ colorTags, ...rest }) => rest);
  const sanitizedStitchingColors = stitchingThreadColors.map(({ colorTags, ...rest }) => rest);

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
            options={[{ label: "Color of Thread", value: "" }, ...sanitizedEmbroideryColors]}
            onChange={handleEmbroideryChange}
            value={selectedEmbroideryColor}
          />
        </Box>
        <Box width="50%">
          <Select
            label="Select Stitching"
            options={[{ label: "Color of Thread", value: "" }, ...sanitizedStitchingColors]}
            onChange={handleStitchingChange}
            value={selectedStitchingColor}
          />
        </Box>
      </InlineStack>
    </Card>
  );
};

export default React.memo(ThreadColorSelector);