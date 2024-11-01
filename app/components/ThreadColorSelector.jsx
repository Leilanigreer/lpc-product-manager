import React, { useMemo } from 'react';
import { Card, Select, InlineStack, Box, BlockStack } from "@shopify/polaris";

const ThreadColorSelector = ({ 
  stitchingThreadColors,
  amannNumbers,
  embroideryThreadColors,
  isacordNumbers, 
  selectedEmbroideryColor, 
  selectedStitchingColor, 
  matchingAmannNumber,
  matchingIsacordNumber,
  onChange 
}) => {
  // Filter out colorTags and check for multiple numbers
  const sanitizedEmbroideryColors = useMemo(() => 
    embroideryThreadColors.map(({ colorTags, ...rest }) => rest),
    [embroideryThreadColors]
  );
  
  const sanitizedStitchingColors = useMemo(() => 
    stitchingThreadColors.map(({ colorTags, ...rest }) => rest),
    [stitchingThreadColors]
  );

  // Memoize selected threads
  const selectedEmbroideryThread = useMemo(() => 
    embroideryThreadColors.find(thread => thread.value === selectedEmbroideryColor),
    [embroideryThreadColors, selectedEmbroideryColor]
  );

  const selectedStitchingThread = useMemo(() => 
    stitchingThreadColors.find(thread => thread.value === selectedStitchingColor),
    [stitchingThreadColors, selectedStitchingColor]
  );

  // Memoize the multiple numbers check
  const hasMultipleIsacordNumbers = useMemo(() => 
    selectedEmbroideryThread?.isacordNumbers?.length > 1,
    [selectedEmbroideryThread]
  );

  const hasMultipleAmannNumbers = useMemo(() => 
    selectedStitchingThread?.amannNumbers?.length > 1,
    [selectedStitchingThread]
  );

  const handleEmbroideryChange = (value) => {
    onChange('selectedEmbroideryColor', value);
    // Reset isacord number when thread changes
    onChange('matchingIsacordNumber', '');
  };

  const handleStitchingChange = (value) => {
    onChange('selectedStitchingColor', value);
    // Reset amann number when thread changes
    onChange('matchingAmannNumber', '');
  };

  return (
    <Card>
      <InlineStack gap="400" align="start" wrap={false}>
        <Box width="50%">
          <BlockStack gap="400">
            <Select
              label="Select Embroidery"
              options={[{ label: "Color of Thread", value: "" }, ...sanitizedEmbroideryColors]}
              onChange={handleEmbroideryChange}
              value={selectedEmbroideryColor}
            />
            {hasMultipleIsacordNumbers && (
              <Select
                label="Select Isacord Number"
                options={[
                  { label: "Select Number", value: "" },
                  ...selectedEmbroideryThread.isacordNumbers
                ]}
                onChange={(value) => onChange('matchingIsacordNumber', value)}
                value={matchingIsacordNumber}
              />
            )}
          </BlockStack>
        </Box>
        <Box width="50%">
          <BlockStack gap="400">
            <Select
              label="Select Stitching"
              options={[{ label: "Color of Thread", value: "" }, ...sanitizedStitchingColors]}
              onChange={handleStitchingChange}
              value={selectedStitchingColor}
            />
            {hasMultipleAmannNumbers && (
              <Select
                label="Select Amann Number"
                options={[
                  { label: "Select Number", value: "" },
                  ...selectedStitchingThread.amannNumbers
                ]}
                onChange={(value) => onChange('matchingAmannNumber', value)}
                value={matchingAmannNumber}
              />
            )}
          </BlockStack>
        </Box>
      </InlineStack>
    </Card>
  );
};

export default React.memo(ThreadColorSelector);